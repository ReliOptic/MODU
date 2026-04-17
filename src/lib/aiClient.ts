// MODU AI Client — Edge Function call wrappers (Task #19)
// ADR-0002: all AI calls go through Supabase Edge Functions.
// CLIENT NEVER references ANTHROPIC_API_KEY or OPENAI_API_KEY directly.
// Those keys live in Supabase secrets (server-only).

import { supabase, isSupabaseConfigured } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export class AIClientError extends Error {
  constructor(
    public readonly code: AIClientErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function edgeFunctionUrl(path: string): string {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/functions/v1/${path}`;
}

async function getBearerToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AIClientError('unauthorized', '로그인이 필요해요.');
  return token;
}

function handleHttpError(status: number, body: string): never {
  if (status === 401) throw new AIClientError('unauthorized', '세션이 만료됐어요.');
  if (status === 429)
    throw new AIClientError('rate_limited', 'AI 사용량을 초과했어요. 잠시 후 다시 시도해 주세요.');
  throw new AIClientError('upstream', `AI 응답 오류 (${status}): ${body.slice(0, 200)}`);
}

// ─── callClaude ───────────────────────────────────────────────────────────────

/**
 * Calls the `ai-claude` Edge Function.
 * No Anthropic key is used or exposed on the client side.
 *
 * @example
 * const res = await callClaude({
 *   messages: [{ role: 'user', content: '이번 주 요약해줘' }],
 *   context: { role: 'self', locale: 'ko-KR' },
 * });
 * console.log(res.content);
 */
export async function callClaude(input: CallClaudeInput): Promise<CallClaudeResponse> {
  if (!isSupabaseConfigured) {
    throw new AIClientError('unknown', 'Supabase 미설정 — .env 확인');
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
    throw new AIClientError('upstream', `네트워크 오류: ${(err as Error).message}`);
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
 * No OpenAI key is used or exposed on the client side.
 *
 * @param audio   Audio blob (webm/mp4/wav/ogg — any format Whisper accepts)
 * @param locale  BCP-47 locale string, e.g. 'ko-KR', 'en-US'
 *
 * @example
 * const { transcript } = await transcribeAudio(audioBlob, 'ko-KR');
 */
export async function transcribeAudio(
  audio: Blob,
  locale: string,
  signal?: AbortSignal
): Promise<TranscribeResponse> {
  if (!isSupabaseConfigured) {
    throw new AIClientError('unknown', 'Supabase 미설정 — .env 확인');
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
    throw new AIClientError('upstream', `네트워크 오류: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    handleHttpError(res.status, text);
  }

  return res.json() as Promise<TranscribeResponse>;
}
