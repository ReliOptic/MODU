// MODU AI Client — Edge Function call wrappers
// ADR-0002: all AI calls go through Supabase Edge Functions.
// ADR-0012: Gemma via OpenRouter is primary; Claude is synthesis fallback only.
// CLIENT NEVER references ANTHROPIC_API_KEY or OPENROUTER_API_KEY directly.

import { supabase, isSupabaseConfigured } from './supabase';
import { FORMATION_MODEL, SYNTHESIS_FALLBACK } from '../config/ai-models';
import {
  AIClientError,
  AIErrorCode,
  ChatMessage,
  ChatResult,
  OpenRouterResult,
  OpenRouterUsage,
} from '../types/ai.types';

// ─── Legacy Claude types (kept for backward compat) ───────────────────────────

export type ClaudeModel =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001';

export interface MessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeContext {
  asset_id?: string;
  role: string;
  locale: string;
}

export interface CallClaudeInput {
  messages: MessageInput[];
  system?: string;
  model?: ClaudeModel;
  context: ClaudeContext;
  signal?: AbortSignal;
}

export interface CallClaudeResponse {
  content: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
  };
  request_id: string | null;
}

export interface TranscribeResponse {
  transcript: string;
  language: string;
  duration_s: number;
  request_id: string | null;
}

export type AIClientErrorCode =
  | 'unauthorized'
  | 'rate_limited'
  | 'upstream'
  | 'unknown';

// Re-export typed error from ai.types so callers get a single import surface
export { AIClientError } from '../types/ai.types';

// ─── OpenRouter call params ───────────────────────────────────────────────────

export interface ChatViaOpenRouterParams {
  messages: ChatMessage[];
  /** Defaults to FORMATION_MODEL (google/gemma-4-31b-it). */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function edgeFunctionUrl(path: string): string {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/functions/v1/${path}`;
}

async function getBearerToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AIClientError('UNAUTHORIZED_NO_AUTH_HEADER', '로그인이 필요해요.');
  return token;
}

function handleHttpError(status: number, body: string): never {
  if (status === 401) throw new AIClientError('UNAUTHORIZED_INVALID_TOKEN', '세션이 만료됐어요.');
  if (status === 429) throw new AIClientError('RATE_LIMIT_EXCEEDED', 'AI 사용량을 초과했어요. 잠시 후 다시 시도해 주세요.');
  throw new AIClientError('UPSTREAM_ERROR', `AI 응답 오류 (${status}): ${body.slice(0, 200)}`);
}

function makeClaudeFallbackUsage(tokensIn: number, tokensOut: number): OpenRouterUsage {
  return { prompt_tokens: tokensIn, completion_tokens: tokensOut, total_tokens: tokensIn + tokensOut };
}

// ─── chatViaOpenRouter ────────────────────────────────────────────────────────

/**
 * Calls the `ai-openrouter` Edge Function (primary path, ADR-0012).
 * On 5xx or timeout > 15s, retries once against `ai-claude` (haiku fallback).
 * Returns a discriminated-union ChatResult — callers must check `.ok`.
 *
 * @example
 * const result = await chatViaOpenRouter({ messages: [{ role: 'user', content: '안녕' }] });
 * if (result.ok) console.log(result.content);
 */
export async function chatViaOpenRouter(params: ChatViaOpenRouterParams): Promise<ChatResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, code: 'SERVICE_NOT_CONFIGURED', message: 'Supabase 미설정 — .env 확인' };
  }

  let token: string;
  try {
    token = await getBearerToken();
  } catch (err) {
    const e = err as AIClientError;
    return { ok: false, code: e.code ?? 'UNAUTHORIZED_NO_AUTH_HEADER', message: e.message };
  }

  const model = params.model ?? FORMATION_MODEL;
  const requestBody: Record<string, unknown> = {
    model,
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
  };
  if (params.jsonMode) requestBody.response_format = { type: 'json_object' };
  // Strip undefined fields
  for (const k of Object.keys(requestBody)) {
    if (requestBody[k] === undefined) delete requestBody[k];
  }

  // ── Primary: OpenRouter ──────────────────────────────────────────────────
  const primary = await _invokeOpenRouter(token, requestBody, params.signal);
  if (primary.ok) return primary;

  // Only fall back on server errors (5xx) or network/timeout failures
  const shouldFallback =
    primary.code === 'UPSTREAM_ERROR' ||
    primary.code === 'UPSTREAM_UNREACHABLE' ||
    primary.code === 'TIMEOUT' ||
    primary.code === 'NETWORK_ERROR';

  if (!shouldFallback) return primary;

  // ── Fallback: Claude haiku ───────────────────────────────────────────────
  console.warn(JSON.stringify({
    event: 'openrouter_fallback_triggered',
    reason: primary.code,
    fallback_model: SYNTHESIS_FALLBACK,
  }));

  return _invokeClaude(token, params.messages, params.signal);
}

async function _invokeOpenRouter(
  token: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<ChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const combinedSignal = signal ?? controller.signal;

  let res: Response;
  try {
    res = await fetch(edgeFunctionUrl('ai-openrouter'), {
      method: 'POST',
      signal: combinedSignal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    clearTimeout(timeout);
    const e = err as Error;
    const isTimeout = e.name === 'AbortError';
    return {
      ok: false,
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout ? 'AI 응답 시간 초과' : `네트워크 오류: ${e.message}`,
    };
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let code: AIErrorCode = 'UPSTREAM_ERROR';
    if (res.status === 401) code = 'UNAUTHORIZED_INVALID_TOKEN';
    else if (res.status === 429) code = 'RATE_LIMIT_EXCEEDED';
    else if (res.status === 400) code = 'VALIDATION_ERROR';
    return { ok: false, code, message: `upstream ${res.status}: ${text.slice(0, 200)}` };
  }

  const data = (await res.json()) as OpenRouterResult;
  return {
    ok: true,
    content: data.content,
    usage: data.usage ?? makeClaudeFallbackUsage(0, 0),
    model: data.model,
    latency_ms: data.latency_ms,
    request_id: data.request_id ?? null,
    provider: 'openrouter',
    usedFallback: false,
  };
}

async function _invokeClaude(
  token: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<ChatResult> {
  // Map ChatMessage roles: Claude doesn't support 'system' in messages array;
  // filter to user/assistant only for the fallback call.
  const claudeMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  let res: Response;
  try {
    res = await fetch(edgeFunctionUrl('ai-claude'), {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: claudeMessages,
        model: 'claude-haiku-4-5-20251001',
        context: { role: 'self', locale: 'ko-KR' },
      }),
    });
  } catch (err) {
    const e = err as Error;
    return { ok: false, code: 'NETWORK_ERROR', message: `네트워크 오류 (fallback): ${e.message}` };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, code: 'UPSTREAM_ERROR', message: `Claude fallback 오류 (${res.status}): ${text.slice(0, 200)}` };
  }

  const data = (await res.json()) as CallClaudeResponse;
  return {
    ok: true,
    content: data.content,
    usage: makeClaudeFallbackUsage(data.usage.input_tokens, data.usage.output_tokens),
    model: data.model,
    latency_ms: 0,
    request_id: data.request_id,
    provider: 'anthropic',
    usedFallback: true,
  };
}

// ─── callClaude (original — preserved for backward compat) ───────────────────

/**
 * Calls the `ai-claude` Edge Function directly.
 * Prefer `chatViaOpenRouter` for new code (ADR-0012).
 */
export async function callClaude(input: CallClaudeInput): Promise<CallClaudeResponse> {
  if (!isSupabaseConfigured) {
    throw new AIClientError('SERVICE_NOT_CONFIGURED', 'Supabase 미설정 — .env 확인');
  }

  const token = await getBearerToken();

  const body: Record<string, unknown> = {
    messages: input.messages,
    context: input.context,
  };
  if (input.system !== undefined) body.system = input.system;
  if (input.model !== undefined) body.model = input.model;

  let res: Response;
  try {
    res = await fetch(edgeFunctionUrl('ai-claude'), {
      method: 'POST',
      signal: input.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new AIClientError('NETWORK_ERROR', `네트워크 오류: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    handleHttpError(res.status, text);
  }

  return res.json() as Promise<CallClaudeResponse>;
}

// ─── transcribeAudio ──────────────────────────────────────────────────────────

/**
 * Calls the `ai-whisper` Edge Function for speech-to-text.
 */
export async function transcribeAudio(
  audio: Blob,
  locale: string,
  signal?: AbortSignal
): Promise<TranscribeResponse> {
  if (!isSupabaseConfigured) {
    throw new AIClientError('SERVICE_NOT_CONFIGURED', 'Supabase 미설정 — .env 확인');
  }

  const token = await getBearerToken();

  const form = new FormData();
  form.append('audio', audio, 'audio.webm');
  form.append('locale', locale);

  let res: Response;
  try {
    res = await fetch(edgeFunctionUrl('ai-whisper'), {
      method: 'POST',
      signal,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch (err) {
    throw new AIClientError('NETWORK_ERROR', `네트워크 오류: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    handleHttpError(res.status, text);
  }

  return res.json() as Promise<TranscribeResponse>;
}
