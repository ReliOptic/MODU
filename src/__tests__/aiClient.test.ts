// Unit tests for aiClient.ts — fetch mock validates call signatures
// Run with: jest (project jest config)

import { callClaude, transcribeAudio, AIClientError } from '../lib/aiClient';

// ─── Mock setup ──────────────────────────────────────────────────────────────

const mockGetSession = jest.fn();
jest.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
  isSupabaseConfigured: true,
}));

const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
beforeEach(() => {
  jest.resetAllMocks();
  // Mutate in-place so the already-loaded module sees the updated value
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  });
});
afterAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
});

// ─── callClaude ──────────────────────────────────────────────────────────────

describe('callClaude', () => {
  it('calls ai-claude endpoint with correct method and headers', async () => {
    const mockResponse = {
      content: 'Hello, I am MODU.',
      model: 'claude-sonnet-4-6',
      usage: { input_tokens: 10, output_tokens: 20, cache_read_tokens: 0 },
      request_id: 'audit-uuid-1234',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await callClaude({
      messages: [{ role: 'user', content: 'hello' }],
      context: { role: 'self', locale: 'ko-KR' },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];

    // Endpoint
    expect(url).toBe('https://test.supabase.co/functions/v1/ai-claude');

    // Method
    expect(init.method).toBe('POST');

    // Auth header present
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');

    // Body shape
    const body = JSON.parse(init.body as string);
    expect(body.messages).toEqual([{ role: 'user', content: 'hello' }]);
    expect(body.context.role).toBe('self');
    expect(body.context.locale).toBe('ko-KR');

    // Response shape
    expect(result.content).toBe('Hello, I am MODU.');
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.request_id).toBe('audit-uuid-1234');
  });

  it('forwards optional model and system fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'ok', model: 'claude-opus-4-7',
        usage: { input_tokens: 5, output_tokens: 5, cache_read_tokens: 0 },
        request_id: null,
      }),
    } as unknown as Response);

    await callClaude({
      messages: [{ role: 'user', content: 'test' }],
      system: 'Custom system',
      model: 'claude-opus-4-7',
      context: { role: 'caregiver', locale: 'en-US' },
    });

    const body = JSON.parse(
      ((global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit])[1].body as string
    );
    expect(body.system).toBe('Custom system');
    expect(body.model).toBe('claude-opus-4-7');
  });

  it('throws AIClientError on 429', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 429,
      text: async () => 'rate limited',
    } as unknown as Response);

    await expect(
      callClaude({
        messages: [{ role: 'user', content: 'hi' }],
        context: { role: 'self', locale: 'ko-KR' },
      })
    ).rejects.toThrow(AIClientError);

    await expect(
      callClaude({
        messages: [{ role: 'user', content: 'hi' }],
        context: { role: 'self', locale: 'ko-KR' },
      })
    ).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('throws AIClientError with code unauthorized on 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 401,
      text: async () => 'unauthorized',
    } as unknown as Response);

    await expect(
      callClaude({
        messages: [{ role: 'user', content: 'hi' }],
        context: { role: 'self', locale: 'ko-KR' },
      })
    ).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('throws AIClientError with code unauthorized when session is null', async () => {
    // Also covers the "not logged in" path which is equivalent to unconfigured
    // from the client's perspective (both result in an auth error).
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(
      callClaude({ messages: [{ role: 'user', content: 'hi' }], context: { role: 'self', locale: 'ko-KR' } })
    ).rejects.toMatchObject({ code: 'unauthorized' });
  });
});

// ─── transcribeAudio ─────────────────────────────────────────────────────────

describe('transcribeAudio', () => {
  it('calls ai-whisper endpoint with multipart form data', async () => {
    const mockResponse = {
      transcript: '안녕하세요',
      language: 'ko',
      duration_s: 2.1,
      request_id: 'whisper-uuid-5678',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const blob = new Blob(['audio-bytes'], { type: 'audio/webm' });
    const result = await transcribeAudio(blob, 'ko-KR');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];

    expect(url).toBe('https://test.supabase.co/functions/v1/ai-whisper');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');
    // Body is FormData — check type
    expect(init.body).toBeInstanceOf(FormData);

    expect(result.transcript).toBe('안녕하세요');
    expect(result.language).toBe('ko');
    expect(result.duration_s).toBe(2.1);
    expect(result.request_id).toBe('whisper-uuid-5678');
  });

  it('throws AIClientError on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
    const blob = new Blob(['bytes'], { type: 'audio/webm' });
    await expect(transcribeAudio(blob, 'ko-KR')).rejects.toThrow(AIClientError);
  });
});
