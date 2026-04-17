// MODU ai-claude Edge Function — Anthropic Claude API proxy
// ADR-0002 · ADR-0012
//
// POST /functions/v1/ai-claude
//   Authorization: Bearer <supabase user JWT>
//   Body: {
//     messages: [{role: 'user'|'assistant', content: string}],
//     system?: string,
//     model?: 'claude-opus-4-7' | 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001',
//     context: { asset_id?: string, role: string, locale: string }
//   }
//   Response: { content: string, model: string, usage: {...}, request_id: string }
//
// Deploy: supabase functions deploy ai-claude --no-verify-jwt=false
// Secrets: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { corsPreFlight, jsonResp } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { insertAudit } from '../_shared/audit.ts';
import { redactValue } from '../_shared/redact.ts';

// ─── Constants ───────────────────────────────────────────────────────────────

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 2048;
const RATE_LIMIT_PER_MINUTE = 20;

type ClaudeModel =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001';

const ALLOWED_MODELS: Set<ClaudeModel> = new Set([
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
]);
const DEFAULT_MODEL: ClaudeModel = 'claude-sonnet-4-6';

// MODU tone guard — prepended to every system prompt to maintain product voice
const TONE_GUARD =
  'You are MODU, a compassionate life-chapter companion. ' +
  'Always respond with warmth and clarity. Never give diagnostic or medical advice. ' +
  'Never store, repeat, or reference personal identifiers you detect in the conversation. ' +
  'Respond in the same language the user writes in unless instructed otherwise.';

// ─── Request shape ───────────────────────────────────────────────────────────

interface MessageInput {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: MessageInput[];
  system?: string;
  model?: string;
  context: {
    asset_id?: string;
    role: string;
    locale: string;
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreFlight();
  if (req.method !== 'POST') return jsonResp(405, { error: 'Method not allowed' });

  // 1) Auth
  let userId: string;
  try {
    const auth = await getUserFromRequest(req);
    userId = auth.userId;
  } catch (resp) {
    return resp as Response;
  }

  // 2) Rate limit (20 req/min per user)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const allowed = await checkRateLimit(
    supabaseUrl,
    serviceKey,
    userId,
    'ai-claude',
    RATE_LIMIT_PER_MINUTE
  );
  if (!allowed) {
    return jsonResp(429, { error: 'Rate limit exceeded. Maximum 20 requests per minute.' });
  }

  // 3) Parse body
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResp(400, { error: 'Invalid JSON body' });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResp(400, { error: 'messages array is required and must not be empty' });
  }
  if (!body.context?.role || !body.context?.locale) {
    return jsonResp(400, { error: 'context.role and context.locale are required' });
  }

  // 4) Validate / default model
  const requestedModel = body.model as ClaudeModel | undefined;
  const model: ClaudeModel =
    requestedModel && ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;

  // 5) Redact PII from messages before sending upstream
  const sanitizedMessages = (redactValue(body.messages) as MessageInput[]).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // 6) Assemble system prompt: tone guard + optional caller-provided system
  const systemParts: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }> =
    [
      {
        type: 'text',
        text: TONE_GUARD,
        cache_control: { type: 'ephemeral' }, // cache the static tone guard
      },
    ];
  if (body.system) {
    systemParts.push({ type: 'text', text: body.system });
  }

  // 7) Call Anthropic
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return jsonResp(500, { error: 'AI service not configured' });

  const t0 = Date.now();
  let anthropicResp: Response;
  try {
    anthropicResp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system: systemParts,
        messages: sanitizedMessages,
      }),
    });
  } catch (err) {
    console.error('[ai-claude] fetch error:', err);
    return jsonResp(502, { error: 'AI service unreachable' });
  }

  const latencyMs = Date.now() - t0;

  if (!anthropicResp.ok) {
    const errText = await anthropicResp.text();
    console.error('[ai-claude] upstream error:', anthropicResp.status, errText.slice(0, 300));
    return jsonResp(502, { error: 'AI upstream error', upstream_status: anthropicResp.status });
  }

  const aiJson = await anthropicResp.json();
  const content: string =
    aiJson.content?.[0]?.type === 'text' ? (aiJson.content[0].text as string) : '';
  const usage = (aiJson.usage as { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number }) ?? {};

  // 8) Audit log (no payload — metadata only)
  const requestId = await insertAudit(supabaseUrl, serviceKey, {
    userId,
    model,
    tokensIn: usage.input_tokens ?? 0,
    tokensOut: usage.output_tokens ?? 0,
    latencyMs,
  });

  return jsonResp(200, {
    content,
    model,
    usage: {
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    },
    request_id: requestId,
  });
});
