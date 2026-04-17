// Unit tests for r2Client.ts — fetch mock validates 3-step upload sequence
// and download presign flow.
//
// Run with: jest (project jest config)

import {
  uploadAttachment,
  getAttachmentUrl,
  R2ClientError,
} from '../lib/r2Client';

// ─── Mock setup ───────────────────────────────────────────────────────────────

const mockGetSession = jest.fn();
jest.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
  isSupabaseConfigured: true,
}));

const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

beforeEach(() => {
  jest.resetAllMocks();
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  });
});

afterAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
});

// ─── uploadAttachment — happy path ───────────────────────────────────────────

describe('uploadAttachment', () => {
  it('calls presign → PUT → complete in sequence and returns attachment_id and key', async () => {
    const presignResponse = {
      url: 'https://r2.example.com/put-signed?token=abc',
      key: 'u/user-1/a/asset-1/20260417/uuid-1.jpg',
      headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '1024' },
      expires_in: 600,
    };
    const completeResponse = { attachment_id: 'attach-uuid-1' };

    const fetchMock = jest
      .fn()
      // Step 1: presign
      .mockResolvedValueOnce({
        ok: true,
        json: async () => presignResponse,
      } as unknown as Response)
      // Step 2: R2 PUT
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as unknown as Response)
      // Step 3: complete
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

    // ── Step 1: presign ──
    const [presignUrl, presignInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(presignUrl).toBe('https://test.supabase.co/functions/v1/r2-presign');
    expect(presignInit.method).toBe('POST');
    expect((presignInit.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');
    const presignBody = JSON.parse(presignInit.body as string);
    expect(presignBody.asset_id).toBe('asset-1');
    expect(presignBody.mime).toBe('image/jpeg');
    expect(presignBody.op).toBe('upload');

    // ── Step 2: R2 PUT ──
    const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(putUrl).toBe('https://r2.example.com/put-signed?token=abc');
    expect(putInit.method).toBe('PUT');
    expect((putInit.headers as Record<string, string>)['Content-Type']).toBe('image/jpeg');
    // No Authorization header on direct R2 PUT
    expect((putInit.headers as Record<string, string>)['Authorization']).toBeUndefined();

    // ── Step 3: complete ──
    const [completeUrl, completeInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(completeUrl).toBe('https://test.supabase.co/functions/v1/r2-complete');
    expect(completeInit.method).toBe('POST');
    expect((completeInit.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');
    const completeBody = JSON.parse(completeInit.body as string);
    expect(completeBody.key).toBe('u/user-1/a/asset-1/20260417/uuid-1.jpg');
    expect(completeBody.asset_id).toBe('asset-1');
    expect(completeBody.mime).toBe('image/jpeg');

    // ── Result ──
    expect(result.attachment_id).toBe('attach-uuid-1');
    expect(result.key).toBe('u/user-1/a/asset-1/20260417/uuid-1.jpg');

    // onProgress called with full byte size
    expect(onProgress).toHaveBeenCalledWith(file.size);
  });

  it('throws R2ClientError with code unauthorized when session is null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const file = new Blob(['bytes'], { type: 'image/jpeg' });

    await expect(
      uploadAttachment({ assetId: 'asset-1', file, mime: 'image/jpeg' })
    ).rejects.toMatchObject({ code: 'unauthorized' });
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

  it('throws R2ClientError on R2 PUT failure', async () => {
    global.fetch = jest
      .fn()
      // presign ok
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://r2.example.com/put',
          key: 'u/u1/a/a1/20260417/x.jpg',
          headers: {},
          expires_in: 600,
        }),
      } as unknown as Response)
      // R2 PUT fails
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
      key: 'u/u1/a/a1/20260417/x2.jpg',
      headers: {},
      expires_in: 600,
    };
    global.fetch = jest
      .fn()
      // First presign: network error
      .mockRejectedValueOnce(new Error('network failure'))
      // Retry presign: success
      .mockResolvedValueOnce({
        ok: true,
        json: async () => presignResponse,
      } as unknown as Response)
      // R2 PUT
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)
      // complete
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ attachment_id: 'a-retry' }),
      } as unknown as Response);

    const file = new Blob(['data'], { type: 'image/jpeg' });
    const result = await uploadAttachment({ assetId: 'asset-1', file, mime: 'image/jpeg' });

    expect(result.attachment_id).toBe('a-retry');
    // 4 calls: presign×2 (retry) + PUT + complete
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(4);
  });
});

// ─── getAttachmentUrl ─────────────────────────────────────────────────────────

describe('getAttachmentUrl', () => {
  it('calls r2-presign with op=download and returns url + expires_in', async () => {
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
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');

    const body = JSON.parse(init.body as string);
    expect(body.op).toBe('download');
    expect(body.attachment_id).toBe('attach-uuid-1');
    expect(body.asset_id).toBe('asset-1');

    expect(result.url).toBe('https://r2.example.com/get-signed?tok=xyz');
    expect(result.expires_in).toBe(300);
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

  it('throws R2ClientError with code unauthorized when session is null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(
      getAttachmentUrl({ attachmentId: 'a', assetId: 'b', mime: 'image/jpeg' })
    ).rejects.toMatchObject({ code: 'unauthorized' });
  });
});
