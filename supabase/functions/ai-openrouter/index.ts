// MODU ai-openrouter Edge Function — OpenRouter LLM proxy
// ADR-0012: Gemma routing via OpenRouter to reduce AI cost
//
// POST /functions/v1/ai-openrouter
//   Authorization: Bearer <supabase user JWT>
//   Body: {
//     model?: OpenRouterModel,
//     messages: ChatMessage[],
//     temperature?: number,
//     max_tokens?: number,
//     response_format?: { type: 'json_object' }
//   }
//   Response: { content: string, usage: {...}, model: string, latency_ms: number, request_id: string }
//
// Deploy: supabase functions deploy ai-openrouter --no-verify-jwt=false
// Secrets: OPENROUTER_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { corsPreFlight, jsonResp } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { insertAudit } from '../_shared/audit.ts';

// ─── Constants ───────────────────────────────────────────────────────────────

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const RATE_LIMIT_PER_MINUTE = 20;
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

// Cost per 1M tokens in USD (approximate, for audit cost_estimate)
const COST_PER_M_INPUT: Record<string, number> = {
  'google/gemma-4-31b-it': 0.10,
  'google/gemma-4-31b-it:free': 0.0,
  'google/gemma-4-26b-a4b-it': 0.10,
  'google/gemma-3-27b-it': 0.10,
  'google/gemma-3-27b-it:free': 0.0,
};

const COST_PER_M_OUTPUT: Record<string, number> = {
  'google/gemma-4-31b-it': 0.10,
  'google/gemma-4-31b-it:free': 0.0,
  'google/gemma-4-26b-a4b-it': 0.10,
  'google/gemma-3-27b-it': 0.10,
  'google/gemma-3-27b-it:free': 0.0,
};

// ─── Types ───────────────────────────────────────────────────────────────────

type OpenRouterModel =
  | 'google/gemma-4-31b-it'
  | 'google/gemma-4-31b-it:free'
  | 'google/gemma-4-26b-a4b-it'
  | 'google/gemma-3-27b-it'
  | 'google/gemma-3-27b-it:free';

const ALLOWED_MODELS: ReadonlySet<OpenRouterModel> = new Set([
  'google/gemma-4-31b-it',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it',
  'google/gemma-3-27b-it',
  'google/gemma-3-27b-it:free',
]);

const DEFAULT_MODEL: OpenRouterModel = 'google/gemma-4-31b-it';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ResponseFormat {
  type: 'json_object';
}

interface RequestBody {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
}

interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: OpenRouterUsage;
  model?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const inRate = COST_PER_M_INPUT[model] ?? 0.10;
  const outRate = COST_PER_M_OUTPUT[model] ?? 0.10;
  return (tokensIn * inRate + tokensOut * outRate) / 1_000_000;
}

function validateBody(raw: unknown): { ok: true; body: RequestBody } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Body must be a JSON object' };
  const b = raw as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return { ok: false, error: 'messages array is required and must not be empty' };
  }
  for (const msg of b.messages as unknown[]) {
    if (typeof msg !== 'object' || msg === null) return { ok: false, error: 'Each message must be an object' };
    const m = msg as Record<string, unknown>;
    if (!['user', 'assistant', 'system'].includes(m.role as string)) {
      return { ok: false, error: `Invalid message role: ${m.role}` };
    }
    if (typeof m.content !== 'string') return { ok: false, error: 'message.content must be a string' };
  }
  if (b.temperature !== undefined && typeof b.temperature !== 'number') {
    return { ok: false, error: 'temperature must be a number' };
  }
  if (b.max_tokens !== undefined && typeof b.max_tokens !== 'number') {
    return { ok: false, error: 'max_tokens must be a number' };
  }
  if (b.response_format !== undefined) {
    const rf = b.response_format as Record<string, unknown>;
    if (rf.type !== 'json_object') return { ok: false, error: 'response_format.type must be "json_object"' };
  }
  return { ok: true, body: b as unknown as RequestBody };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreFlight();
  if (req.method !== 'POST') return jsonResp(405, { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is accepted' });

  // 1) Auth
  let userId: string;
  try {
    const auth = await getUserFromRequest(req);
    userId = auth.userId;
  } catch (resp) {
    return resp as Response;
  }

  // 2) Rate limit
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const allowed = await checkRateLimit(supabaseUrl, serviceKey, userId, 'ai-openrouter', RATE_LIMIT_PER_MINUTE);
  if (!allowed) {
    return jsonResp(429, { code: 'RATE_LIMIT_EXCEEDED', message: 'AI 사용량을 초과했어요. 잠시 후 다시 시도해 주세요.' });
  }

  // 3) Parse + validate body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResp(400, { code: 'INVALID_JSON', message: 'Invalid JSON body' });
  }

  const validation = validateBody(raw);
  if (!validation.ok) {
    return jsonResp(400, { code: 'VALIDATION_ERROR', message: validation.error });
  }
  const body = validation.body;

  // 4) Model allowlist
  const requestedModel = body.model as OpenRouterModel | undefined;
  if (requestedModel !== undefined && !ALLOWED_MODELS.has(requestedModel)) {
    return jsonResp(400, { code: 'MODEL_NOT_ALLOWED', message: `Model "${requestedModel}" is not in the allowed list` });
  }
  const model: OpenRouterModel = requestedModel ?? DEFAULT_MODEL;

  // 5) API key
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    console.error('[ai-openrouter] OPENROUTER_API_KEY not set');
    return jsonResp(500, { code: 'SERVICE_NOT_CONFIGURED', message: 'AI service not configured' });
  }

  // 6) Proxy to OpenRouter
  const requestPayload: Record<string, unknown> = {
    model,
    messages: body.messages,
    max_tokens: body.max_tokens ?? DEFAULT_MAX_TOKENS,
    temperature: body.temperature ?? DEFAULT_TEMPERATURE,
  };
  if (body.response_format) requestPayload.response_format = body.response_format;

  const t0 = Date.now();
  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(OPENROUTER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://modu.app',
        'X-Title': 'MODU',
      },
      body: JSON.stringify(requestPayload),
    });
  } catch (err) {
    console.error('[ai-openrouter] fetch error:', (err as Error).message);
    return jsonResp(502, { code: 'UPSTREAM_UNREACHABLE', message: 'AI service unreachable' });
  }

  const latencyMs = Date.now() - t0;

  if (!upstreamResp.ok) {
    const errText = await upstreamResp.text().catch(() => '');
    console.error('[ai-openrouter] upstream error:', upstreamResp.status, errText.slice(0, 300));
    return jsonResp(502, { code: 'UPSTREAM_ERROR', message: 'AI upstream error', upstream_status: upstreamResp.status });
  }

  let aiJson: OpenRouterResponse;
  try {
    aiJson = await upstreamResp.json() as OpenRouterResponse;
  } catch {
    return jsonResp(502, { code: 'UPSTREAM_PARSE_ERROR', message: 'Could not parse AI response' });
  }

  const content: string = aiJson.choices?.[0]?.message?.content ?? '';
  const usage = aiJson.usage;
  const tokensIn = usage?.prompt_tokens ?? 0;
  const tokensOut = usage?.completion_tokens ?? 0;
  const costEstimate = estimateCost(model, tokensIn, tokensOut);

  // 7) Audit log
  console.log(JSON.stringify({
    event: 'ai_openrouter_call',
    user_id: userId,
    model,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    latency_ms: latencyMs,
    cost_estimate_usd: costEstimate,
  }));

  const requestId = await insertAudit(supabaseUrl, serviceKey, {
    userId,
    model,
    tokensIn,
    tokensOut,
    latencyMs,
  });

  return jsonResp(200, {
    content,
    usage: {
      prompt_tokens: tokensIn,
      completion_tokens: tokensOut,
      total_tokens: usage?.total_tokens ?? tokensIn + tokensOut,
    },
    model: aiJson.model ?? model,
    latency_ms: latencyMs,
    request_id: requestId,
  });
});
