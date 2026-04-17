// Unit tests for aiClient.ts — OpenRouter path, fallback, error envelope parsing.
// No real Supabase token required: all network calls are mocked via globalThis.fetch.

import {
  ChatMessage,
  ChatResult,
  AIClientError,
  AIErrorCode,
} from '../../src/types/ai.types';
import { FORMATION_MODEL, SYNTHESIS_FALLBACK } from '../../src/config/ai-models';

// ─── Minimal stubs ────────────────────────────────────────────────────────────

// Stub isSupabaseConfigured = true and a mock session token
jest.mock('../../src/lib/supabase', () => ({
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

import { chatViaOpenRouter } from '../../src/lib/aiClient';

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

  it('SYNTHESIS_FALLBACK is claude-haiku-4-5', () => {
    expect(SYNTHESIS_FALLBACK).toBe('claude-haiku-4-5');
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

  it('includes Authorization Bearer token in request', async () => {
    mockFetch([{ status: 200, body: makeSuccessResponse() }]);

    await chatViaOpenRouter({ messages: TEST_MESSAGES });

    const fetchMock = globalThis.fetch as jest.Mock;
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-token-abc');
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

  it('falls back to Claude on 5xx from OpenRouter', async () => {
    mockFetch([
      { status: 502, body: { code: 'UPSTREAM_ERROR', message: 'bad gateway' } },
      {
        status: 200,
        body: {
          content: 'Hello from Claude fallback',
          model: 'claude-haiku-4-5-20251001',
          usage: { input_tokens: 5, output_tokens: 10, cache_read_tokens: 0 },
          request_id: 'claude-req-xyz',
        },
      },
    ]);

    const result = await chatViaOpenRouter({ messages: TEST_MESSAGES });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toBe('Hello from Claude fallback');
    expect(result.provider).toBe('anthropic');
    expect(result.usedFallback).toBe(true);

    // Two fetch calls should have been made
    const fetchMock = globalThis.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Second call should hit ai-claude
    const secondUrl = fetchMock.mock.calls[1][0] as string;
    expect(secondUrl).toContain('ai-claude');
  });

  it('returns error if both OpenRouter and Claude fallback fail', async () => {
    mockFetch([
      { status: 502, body: { code: 'UPSTREAM_ERROR', message: 'bad gateway' } },
      { status: 500, body: { code: 'UPSTREAM_ERROR', message: 'claude also down' } },
    ]);

    const result = await chatViaOpenRouter({ messages: TEST_MESSAGES });

    expect(result.ok).toBe(false);
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
