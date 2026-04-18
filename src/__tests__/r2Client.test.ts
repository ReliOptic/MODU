// Unit tests for r2Client.ts — device-identity path (ADR-0011).
// All network calls mocked via globalThis.fetch. No real Supabase required.

import {
  uploadAttachment,
  getAttachmentUrl,
  R2ClientError,
} from '../lib/r2Client';

// ─── Mock setup ───────────────────────────────────────────────────────────────

const DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000';

jest.mock('../lib/supabase', () => ({
  supabase: {},
  isSupabaseConfigured: true,
}));

jest.mock('../lib/deviceId', () => ({
  getDeviceId: async () => DEVICE_ID,
}));

const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

beforeEach(() => {
  jest.resetAllMocks();
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
});

afterAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
});

// ─── uploadAttachment ─────────────────────────────────────────────────────────

describe('uploadAttachment', () => {
  it('calls presign → PUT → complete in sequence and returns attachment_id and key', async () => {
    const presignResponse = {
      url: 'https://r2.example.com/put-signed?token=abc',
      key: `d/${DEVICE_ID}/a/asset-1/20260418/uuid-1.jpg`,
      headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '1024' },
      expires_in: 600,
    };
    const completeResponse = { attachment_id: 'attach-uuid-1' };

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => presignResponse,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => completeResponse,
      } as unknown as Response);

    global.fetch = fetchMock;

    const file = new Blob(['jpeg-bytes'], { type: 'image/jpeg' });
    const onProgress = jest.fn();

    const result = await uploadAttachment({
      assetId: 'asset-1',
      file,
      mime: 'image/jpeg',
      onProgress,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Step 1: presign
    const [presignUrl, presignInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(presignUrl).toBe('https://test.supabase.co/functions/v1/r2-presign');
    expect(presignInit.method).toBe('POST');
    const presignHeaders = presignInit.headers as Record<string, string>;
    expect(presignHeaders['X-Device-Id']).toBe(DEVICE_ID);
    expect(presignHeaders['Authorization']).toBeUndefined();
    const presignBody = JSON.parse(presignInit.body as string);
    expect(presignBody.asset_id).toBe('asset-1');
    expect(presignBody.mime).toBe('image/jpeg');
    expect(presignBody.op).toBe('upload');

    // Step 2: R2 PUT — no auth headers
    const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(putUrl).toBe('https://r2.example.com/put-signed?token=abc');
    expect(putInit.method).toBe('PUT');
    const putHeaders = putInit.headers as Record<string, string>;
    expect(putHeaders['Content-Type']).toBe('image/jpeg');
    expect(putHeaders['Authorization']).toBeUndefined();
    expect(putHeaders['X-Device-Id']).toBeUndefined();

    // Step 3: complete
    const [completeUrl, completeInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(completeUrl).toBe('https://test.supabase.co/functions/v1/r2-complete');
    expect(completeInit.method).toBe('POST');
    const completeHeaders = completeInit.headers as Record<string, string>;
    expect(completeHeaders['X-Device-Id']).toBe(DEVICE_ID);
    const completeBody = JSON.parse(completeInit.body as string);
    expect(completeBody.key).toBe(`d/${DEVICE_ID}/a/asset-1/20260418/uuid-1.jpg`);
    expect(completeBody.asset_id).toBe('asset-1');
    expect(completeBody.mime).toBe('image/jpeg');

    // Result
    expect(result.attachment_id).toBe('attach-uuid-1');
    expect(result.key).toBe(`d/${DEVICE_ID}/a/asset-1/20260418/uuid-1.jpg`);

    expect(onProgress).toHaveBeenCalledWith(file.size);
  });

  it('throws R2ClientError on presign 413 (too large)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 413,
      text: async () => 'too large',
    } as unknown as Response);

    const file = new Blob(['big'], { type: 'image/jpeg' });
    await expect(
      uploadAttachment({ assetId: 'asset-1', file, mime: 'image/jpeg' })
    ).rejects.toMatchObject({ code: 'too_large' });
  });

  it('throws R2ClientError on presign 415 (unsupported type)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 415,
      text: async () => 'unsupported',
    } as unknown as Response);

    const file = new Blob(['data'], { type: 'image/gif' });
    await expect(
      uploadAttachment({ assetId: 'asset-1', file, mime: 'image/gif' })
    ).rejects.toMatchObject({ code: 'unsupported_type' });
  });

  it('throws R2ClientError on presign 429 (rate limited)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    } as unknown as Response);

    const file = new Blob(['data'], { type: 'image/jpeg' });
    await expect(
      uploadAttachment({ assetId: 'asset-1', file, mime: 'image/jpeg' })
    ).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('throws R2ClientError on R2 PUT failure', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://r2.example.com/put',
          key: `d/${DEVICE_ID}/a/a1/20260418/x.jpg`,
          headers: {},
          expires_in: 600,
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as unknown as Response);

    const file = new Blob(['data'], { type: 'image/jpeg' });
    await expect(
      uploadAttachment({ assetId: 'asset-1', file, mime: 'image/jpeg' })
    ).rejects.toMatchObject({ code: 'upstream' });
  });

  it('retries once on network error in presign then succeeds', async () => {
    const presignResponse = {
      url: 'https://r2.example.com/put2',
      key: `d/${DEVICE_ID}/a/a1/20260418/x2.jpg`,
      headers: {},
      expires_in: 600,
    };
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => presignResponse,
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ attachment_id: 'a-retry' }),
      } as unknown as Response);

    const file = new Blob(['data'], { type: 'image/jpeg' });
    const result = await uploadAttachment({ assetId: 'asset-1', file, mime: 'image/jpeg' });

    expect(result.attachment_id).toBe('a-retry');
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(4);
  });
});

// ─── getAttachmentUrl ─────────────────────────────────────────────────────────

describe('getAttachmentUrl', () => {
  it('calls r2-presign with op=download and X-Device-Id header', async () => {
    const presignResponse = {
      url: 'https://r2.example.com/get-signed?tok=xyz',
      expires_in: 300,
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => presignResponse,
    } as unknown as Response);

    const result = await getAttachmentUrl({
      attachmentId: 'attach-uuid-1',
      assetId: 'asset-1',
      mime: 'image/jpeg',
    });

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];

    expect(url).toBe('https://test.supabase.co/functions/v1/r2-presign');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Device-Id']).toBe(DEVICE_ID);
    expect(headers['Authorization']).toBeUndefined();

    const body = JSON.parse(init.body as string);
    expect(body.op).toBe('download');
    expect(body.attachment_id).toBe('attach-uuid-1');
    expect(body.asset_id).toBe('asset-1');

    expect(result.url).toBe('https://r2.example.com/get-signed?tok=xyz');
    expect(result.expires_in).toBe(300);
  });

  it('passes op_mode=export when requested', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://r2.example.com/x', expires_in: 900 }),
    } as unknown as Response);

    await getAttachmentUrl({
      attachmentId: 'a',
      assetId: 'b',
      mime: 'image/jpeg',
      op_mode: 'export',
    });

    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.op_mode).toBe('export');
  });

  it('throws R2ClientError on 403', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'forbidden',
    } as unknown as Response);

    await expect(
      getAttachmentUrl({ attachmentId: 'bad-id', assetId: 'asset-1', mime: 'image/jpeg' })
    ).rejects.toBeInstanceOf(R2ClientError);
  });
});
