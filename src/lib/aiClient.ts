// Front-end AI client — Edge Function 호출 layer (ADR-0002)
// 클라이언트는 ANTHROPIC_API_KEY 를 절대 알지 못한다.
import { supabase, isSupabaseConfigured } from './supabase';

export type AIIntent =
  | 'formation.summarize'
  | 'trigger.analyze'
  | 'memo.distill'
  | 'visit.prepare'
  | 'weekly.distill';

export interface AICallOptions {
  /** 관련 에셋 (logging) */
  assetId?: string;
  /** intent 별 context 객체 */
  context: unknown;
  /** abort signal (선택) */
  signal?: AbortSignal;
}

export interface AICallResult<T = string> {
  result: T;
  modelVersion: string;
  tokensUsed: { input: number; output: number; cacheRead: number };
  cacheHit: boolean;
}

export class AIError extends Error {
  constructor(public code: 'unauthorized' | 'rate_limited' | 'upstream' | 'unknown', message: string) {
    super(message);
  }
}

/**
 * Edge Function `ai/{intent}` 호출.
 * 응답이 JSON 인 경우 result 를 자동 parse.
 */
export async function callAI<T = string>(
  intent: AIIntent,
  opts: AICallOptions
): Promise<AICallResult<T>> {
  if (!isSupabaseConfigured) {
    throw new AIError('unknown', 'Supabase 미설정 — .env 확인');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new AIError('unauthorized', '로그인이 필요해요.');

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai/${intent}`;
  const res = await fetch(url, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ context: opts.context, assetId: opts.assetId }),
  });

  if (res.status === 401) throw new AIError('unauthorized', '세션이 만료됐어요.');
  if (res.status === 429) throw new AIError('rate_limited', 'AI 사용량을 모두 썼어요. 다음 달에 다시 만나요.');
  if (!res.ok) {
    const text = await res.text();
    throw new AIError('upstream', `AI 응답 오류: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as AICallResult<string>;
  // result 가 JSON 문자열이면 parse 시도
  let parsed: T;
  try {
    parsed = JSON.parse(json.result) as T;
  } catch {
    parsed = json.result as unknown as T;
  }
  return { ...json, result: parsed };
}
