// MODU AI Edge Function — Claude API proxy (ADR-0002)
//
// 배포: `supabase functions deploy ai --no-verify-jwt=false`
// 환경변수: ANTHROPIC_API_KEY (Supabase secret) + SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// 호출:
//   POST /functions/v1/ai/{intent}
//     Headers: Authorization: Bearer <user JWT>
//     Body:    { context: ... }
//   Response: { result, modelVersion, tokensUsed, cacheHit }
//
// 지원 intent (확장 시 INTENTS map 에 추가):
//   formation.summarize | trigger.analyze | memo.distill | visit.prepare | weekly.distill

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface IntentSpec {
  systemPrompt: string;
  model: string;
  /** 일/주 단위 사용자별 quota */
  quota: { window: 'day' | 'week' | 'month'; limit: number };
  /** 응답을 ai_call_logs 에 저장할 때 input redaction 함수 */
  redact?: (ctx: unknown) => unknown;
}

const INTENTS: Record<string, IntentSpec> = {
  'formation.summarize': {
    model: 'claude-sonnet-4-6',
    systemPrompt:
      '너는 MODU 라는 건강·돌봄 동반자 앱의 AI 동반자다. ' +
      '사용자가 Formation 에서 답한 내용을 바탕으로 부드럽게 요약하고, ' +
      '추천 위젯 구성을 JSON 으로 반환한다.',
    quota: { window: 'day', limit: 10 },
  },
  'trigger.analyze': {
    model: 'claude-sonnet-4-6',
    systemPrompt:
      '너는 만성질환 트리거 분석가다. ChapterMemory timeline 을 보고 ' +
      '증상과 가장 강한 상관관계를 가진 요인을 -1~1 correlation 으로 반환한다.',
    quota: { window: 'week', limit: 4 },
  },
  'memo.distill': {
    model: 'claude-sonnet-4-6',
    systemPrompt:
      '너는 진료 메모 정리 도우미다. 사용자가 음성/사진으로 남긴 진료 메모에서 ' +
      '핵심 요약, 약 변경, 다음 액션을 JSON 으로 추출한다.',
    quota: { window: 'day', limit: 20 },
  },
  'visit.prepare': {
    model: 'claude-sonnet-4-6',
    systemPrompt:
      '너는 진료 준비 코치다. 사용자의 최근 ChapterMemory 와 다음 진료 일정을 보고 ' +
      '의사에게 물어볼 질문 5개 이내를 한국어 자연체로 만든다.',
    quota: { window: 'day', limit: 5 },
  },
  'weekly.distill': {
    model: 'claude-haiku-4-5-20251001',
    systemPrompt:
      '너는 주간 동반자 요약가다. 지난 7일간 ChapterMemory 를 받아 ' +
      '한 단락의 위로 + 한 단락의 패턴 인사이트를 만든다.',
    quota: { window: 'week', limit: 1 },
  },
};

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

serve(async (req: Request) => {
  if (req.method !== 'POST') return jsonResp(405, { error: 'Method not allowed' });

  // 1) intent 추출
  const url = new URL(req.url);
  const intent = url.pathname.split('/').filter(Boolean).pop();
  if (!intent || !INTENTS[intent]) {
    return jsonResp(404, { error: `Unknown intent: ${intent}` });
  }
  const spec = INTENTS[intent];

  // 2) auth — user JWT 검증
  const auth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: auth } } }
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return jsonResp(401, { error: 'Unauthorized' });
  const userId = userData.user.id;

  // 3) quota check
  const quotaOk = await checkQuota(supabase, userId, intent, spec);
  if (!quotaOk) {
    return jsonResp(429, { error: `Quota exceeded for ${intent}` });
  }

  // 4) parse body
  let body: { context?: unknown; assetId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return jsonResp(400, { error: 'Invalid JSON body' });
  }

  // 5) Anthropic 호출
  const t0 = Date.now();
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return jsonResp(500, { error: 'AI not configured' });

  const anthropicRes = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: spec.model,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: spec.systemPrompt,
          // ephemeral cache → 시스템 프롬프트 90% 비용 절감
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: JSON.stringify(body.context ?? {}),
        },
      ],
    }),
  });

  const latencyMs = Date.now() - t0;

  if (!anthropicRes.ok) {
    const text = await anthropicRes.text();
    await logCall(supabase, {
      userId,
      assetId: body.assetId,
      intent,
      model: spec.model,
      status: 'upstream_error',
      latencyMs,
      cacheHit: false,
      output: text.slice(0, 500),
    });
    return jsonResp(502, { error: 'AI upstream error' });
  }

  const aiJson = await anthropicRes.json();
  const completionText =
    aiJson.content?.[0]?.type === 'text' ? aiJson.content[0].text : '';
  const usage = aiJson.usage ?? {};
  const cacheHit = (usage.cache_read_input_tokens ?? 0) > 0;

  await logCall(supabase, {
    userId,
    assetId: body.assetId,
    intent,
    model: spec.model,
    status: 'success',
    latencyMs,
    cacheHit,
    promptTokens: usage.input_tokens ?? 0,
    completionTokens: usage.output_tokens ?? 0,
    output: completionText.slice(0, 500),
  });

  // quota 증가 (성공 시만)
  await supabase.rpc('increment_ai_calls', { _user: userId }).then(
    () => undefined,
    () => undefined // RPC 미정의 시 silent
  );

  return jsonResp(200, {
    result: completionText,
    modelVersion: spec.model,
    tokensUsed: {
      input: usage.input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      cacheRead: usage.cache_read_input_tokens ?? 0,
    },
    cacheHit,
  });
});

// ─── helpers ───────────────────────────────────────────

function jsonResp(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function checkQuota(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  _intent: string,
  spec: IntentSpec
): Promise<boolean> {
  // 단순 구현: 월간 quota 만 우선 체크. 향후 intent + window 별 확장.
  const { data } = await supabase
    .from('profiles')
    .select('ai_calls_this_month, ai_quota_reset_at')
    .eq('id', userId)
    .single();
  if (!data) return false;
  const now = new Date();
  const resetAt = new Date(data.ai_quota_reset_at as string);
  if (now > resetAt) {
    await supabase
      .from('profiles')
      .update({
        ai_calls_this_month: 0,
        ai_quota_reset_at: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1
        ).toISOString(),
      })
      .eq('id', userId);
    return true;
  }
  // window 별 limit 은 일/주/월 변환 단순화 — 1차 구현
  const monthLimit =
    spec.quota.window === 'month'
      ? spec.quota.limit
      : spec.quota.window === 'week'
      ? spec.quota.limit * 5
      : spec.quota.limit * 30;
  return (data.ai_calls_this_month as number) < monthLimit;
}

interface LogParams {
  userId: string;
  assetId?: string;
  intent: string;
  model: string;
  status: string;
  latencyMs: number;
  cacheHit: boolean;
  promptTokens?: number;
  completionTokens?: number;
  output?: string;
}

async function logCall(
  supabase: ReturnType<typeof createClient>,
  p: LogParams
): Promise<void> {
  await supabase.from('ai_call_logs').insert({
    user_id: p.userId,
    asset_id: p.assetId ?? null,
    intent: p.intent,
    model: p.model,
    status: p.status,
    latency_ms: p.latencyMs,
    cache_hit: p.cacheHit,
    prompt_tokens: p.promptTokens ?? null,
    completion_tokens: p.completionTokens ?? null,
    output_summary: p.output ?? null,
  });
}
