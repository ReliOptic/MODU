// MODU AI Client — Edge Function call wrappers
// ADR-0002: all AI calls go through Supabase Edge Functions.
// ADR-0012: Gemma via OpenRouter is the only AI path (Claude fallback retired 2026-04-18).
// ADR-0011: device-identity, no user account required.
// CLIENT NEVER references ANTHROPIC_API_KEY or OPENROUTER_API_KEY directly.

import { supabase, isSupabaseConfigured } from './supabase';
import { getDeviceId } from './deviceId';
import { FORMATION_MODEL } from '../config/ai-models';
import {
  AIClientError,
  AIErrorCode,
  ChatMessage,
  ChatResult,
  OpenRouterResult,
  OpenRouterUsage,
} from '../types/ai.types';

// Re-export typed error so callers get a single import surface.
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

function makeEmptyUsage(): OpenRouterUsage {
  return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
}

// ─── chatViaOpenRouter ────────────────────────────────────────────────────────

/**
 * Calls the `ai-openrouter` Edge Function (ADR-0012).
 * Identity: device-local UUID v4 (ADR-0011 local-first, ADR-0005 privacy-as-moat) —
 * no user account required. Returns a discriminated-union ChatResult — callers
 * must check `.ok`.
 *
 * @example
 * const result = await chatViaOpenRouter({ messages: [{ role: 'user', content: '안녕' }] });
 * if (result.ok) console.log(result.content);
 */
export async function chatViaOpenRouter(params: ChatViaOpenRouterParams): Promise<ChatResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, code: 'SERVICE_NOT_CONFIGURED', message: 'Supabase 미설정 — .env 확인' };
  }
  // Keep the supabase import referenced so tree-shaking doesn't drop the module
  // that tests mock (jest.mock('./supabase', ...)).
  void supabase;

  let deviceId: string;
  try {
    deviceId = await getDeviceId();
  } catch (err) {
    return {
      ok: false,
      code: 'UNAUTHORIZED_NO_AUTH_HEADER',
      message: `device_id 생성 실패: ${(err as Error).message}`,
    };
  }

  const model = params.model ?? FORMATION_MODEL;
  const requestBody: Record<string, unknown> = {
    model,
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
  };
  if (params.jsonMode) requestBody.response_format = { type: 'json_object' };
  for (const k of Object.keys(requestBody)) {
    if (requestBody[k] === undefined) delete requestBody[k];
  }

  return invokeOpenRouter(deviceId, requestBody, params.signal);
}

async function invokeOpenRouter(
  deviceId: string,
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
        'X-Device-Id': deviceId,
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
  // Callers (e.g. AIClientError construction elsewhere) may still depend on the
  // ChatResult shape — throw a typed error only for programmer-errors, not
  // upstream failures.
  if (data.content === undefined || data.content === null) {
    throw new AIClientError('UPSTREAM_ERROR', 'OpenRouter returned empty content');
  }
  return {
    ok: true,
    content: data.content,
    usage: data.usage ?? makeEmptyUsage(),
    model: data.model,
    latency_ms: data.latency_ms,
    request_id: data.request_id ?? null,
    provider: 'openrouter',
    usedFallback: false,
  };
}
