// Unit tests for aiClient.ts — OpenRouter path, fallback, error envelope parsing.
// No real Supabase token required: all network calls are mocked via globalThis.fetch.

import {
  ChatMessage,
  ChatResult,
  AIClientError,
  AIErrorCode,
} from '../types/ai.types';
import { FORMATION_MODEL } from '../config/ai-models';

// ─── Minimal stubs ────────────────────────────────────────────────────────────

// Stub isSupabaseConfigured = true and a mock session token
jest.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { access_token: 'test-token-abc' } },
      }),
    },
  },
}));

// Stub process.env for edge function URL resolution
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

import { chatViaOpenRouter } from '../lib/aiClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSuccessResponse(overrides?: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    content: 'Hello from Gemma',
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    model: 'google/gemma-4-31b-it',
    latency_ms: 123,
    request_id: 'req-abc',
    ...overrides,
  };
}

function mockFetch(
  responses: Array<{ status: number; body: unknown }>
): void {
  let callIndex = 0;
  globalThis.fetch = jest.fn(async () => {
    const r = responses[callIndex] ?? responses[responses.length - 1];
    callIndex += 1;
    const bodyText = JSON.stringify(r.body);
    return new Response(bodyText, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const TEST_MESSAGES: ChatMessage[] = [{ role: 'user', content: '안녕' }];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('chatViaOpenRouter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses FORMATION_MODEL as default model', () => {
    expect(FORMATION_MODEL).toBe('google/gemma-4-31b-it');
  });

  it('returns ok:true on successful OpenRouter response', async () => {
    mockFetch([{ status: 200, body: makeSuccessResponse() }]);

    const result = await chatViaOpenRouter({ messages: TEST_MESSAGES });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toBe('Hello from Gemma');
    expect(result.provider).toBe('openrouter');
    expect(result.usedFallback).toBe(false);
    expect(result.model).toBe('google/gemma-4-31b-it');
  });

  it('passes custom model to request body', async () => {
    mockFetch([{ status: 200, body: makeSuccessResponse({ model: 'google/gemma-3-27b-it' }) }]);

    const result = await chatViaOpenRouter({
      messages: TEST_MESSAGES,
      model: 'google/gemma-3-27b-it',
    });

    expect(result.ok).toBe(true);
    // Verify fetch was called with correct body
    const fetchMock = globalThis.fetch as jest.Mock;
    const calledBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;
    expect(calledBody.model).toBe('google/gemma-3-27b-it');
  });

  it('includes X-Device-Id header (device-identity path, ADR-0011)', async () => {
    mockFetch([{ status: 200, body: makeSuccessResponse() }]);

    await chatViaOpenRouter({ messages: TEST_MESSAGES });

    const fetchMock = globalThis.fetch as jest.Mock;
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['X-Device-Id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(headers.Authorization).toBeUndefined();
  });

  it('sets response_format when jsonMode is true', async () => {
    mockFetch([{ status: 200, body: makeSuccessResponse() }]);

    await chatViaOpenRouter({ messages: TEST_MESSAGES, jsonMode: true });

    const fetchMock = globalThis.fetch as jest.Mock;
    const calledBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;
    expect(calledBody.response_format).toEqual({ type: 'json_object' });
  });

  it('returns RATE_LIMIT_EXCEEDED error on 429 without fallback', async () => {
    mockFetch([{ status: 429, body: { code: 'RATE_LIMIT_EXCEEDED', message: 'too many' } }]);

    const result = await chatViaOpenRouter({ messages: TEST_MESSAGES });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('returns VALIDATION_ERROR on 400 without fallback', async () => {
    mockFetch([{ status: 400, body: { code: 'MODEL_NOT_ALLOWED', message: 'bad model' } }]);

    const result = await chatViaOpenRouter({ messages: TEST_MESSAGES });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('returns UPSTREAM_ERROR on 5xx (no Claude fallback — ADR-0012 2026-04-18)', async () => {
    mockFetch([{ status: 502, body: { code: 'UPSTREAM_ERROR', message: 'bad gateway' } }]);

    const result = await chatViaOpenRouter({ messages: TEST_MESSAGES });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('UPSTREAM_ERROR');

    // Only one fetch — no fallback attempt.
    const fetchMock = globalThis.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('AIClientError', () => {
  it('is instanceof Error', () => {
    const err = new AIClientError('UNAUTHORIZED_NO_AUTH_HEADER', 'no auth');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AIClientError');
    expect(err.code).toBe('UNAUTHORIZED_NO_AUTH_HEADER');
    expect(err.message).toBe('no auth');
  });

  it('preserves all AIErrorCode values at compile time', () => {
    const codes: AIErrorCode[] = [
      'UNAUTHORIZED_NO_AUTH_HEADER',
      'UNAUTHORIZED_INVALID_TOKEN',
      'RATE_LIMIT_EXCEEDED',
      'MODEL_NOT_ALLOWED',
      'VALIDATION_ERROR',
      'UPSTREAM_ERROR',
      'UPSTREAM_UNREACHABLE',
      'SERVICE_NOT_CONFIGURED',
      'NETWORK_ERROR',
      'TIMEOUT',
      'UNKNOWN',
    ];
    expect(codes.length).toBe(11);
  });
});

describe('ChatResult discriminated union', () => {
  it('narrows to success fields when ok is true', () => {
    const result: ChatResult = {
      ok: true,
      content: 'hi',
      usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      model: 'google/gemma-4-31b-it',
      latency_ms: 50,
      request_id: null,
      provider: 'openrouter',
      usedFallback: false,
    };
    if (result.ok) {
      expect(result.content).toBe('hi');
      expect(result.provider).toBe('openrouter');
    }
  });

  it('narrows to error fields when ok is false', () => {
    const result: ChatResult = {
      ok: false,
      code: 'TIMEOUT',
      message: 'timed out',
    };
    if (!result.ok) {
      expect(result.code).toBe('TIMEOUT');
      expect(result.message).toBe('timed out');
    }
  });
});
