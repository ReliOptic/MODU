// MODU R2 Client — Cloudflare R2 upload/download via Supabase Edge Functions.
// ADR-0011 local-first: identity is a device-local UUID v4 sent as X-Device-Id.
// ADR-0002: R2 credentials live only in Edge Functions; the client never
// references R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_ACCOUNT_ID.

import { isSupabaseConfigured } from './supabase';
import { getDeviceId } from './deviceId';

// ─── Types ────────────────────────────────────────────────────────────────────

export type R2ClientErrorCode =
  | 'missing_device_id'
  | 'rate_limited'
  | 'too_large'
  | 'unsupported_type'
  | 'upstream'
  | 'unknown';

export class R2ClientError extends Error {
  constructor(
    public readonly code: R2ClientErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'R2ClientError';
  }
}

export interface UploadAttachmentParams {
  assetId: string;
  file: Blob;
  mime: string;
  onProgress?: (bytes: number) => void;
  signal?: AbortSignal;
}

export interface UploadAttachmentResult {
  attachment_id: string;
  key: string;
}

export interface GetAttachmentUrlParams {
  attachmentId: string;
  assetId: string;
  mime: string;
  /** Operation mode — 'inline' uses 5-min TTL, 'export' requests 15-min TTL. */
  op_mode?: 'inline' | 'export';
}

export interface GetAttachmentUrlResult {
  url: string;
  expires_in: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function edgeFunctionUrl(path: string): string {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/functions/v1/${path}`;
}

function handleHttpError(status: number, body: string): never {
  if (status === 400 && /device.?id/i.test(body)) {
    throw new R2ClientError('missing_device_id', '기기 식별자를 읽을 수 없어요.');
  }
  if (status === 413) throw new R2ClientError('too_large', '파일이 너무 커요. 최대 20MB.');
  if (status === 415) throw new R2ClientError('unsupported_type', '지원하지 않는 파일 형식이에요.');
  if (status === 429) throw new R2ClientError('rate_limited', '잠시 후 다시 시도해 주세요.');
  throw new R2ClientError('upstream', `서버 오류 (${status}): ${body.slice(0, 200)}`);
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 1
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }
  throw new R2ClientError('upstream', `네트워크 오류: ${(lastErr as Error).message}`);
}

// ─── uploadAttachment ─────────────────────────────────────────────────────────

/**
 * Three-step upload flow:
 *   1. POST r2-presign  → presigned PUT URL + object key (device-scoped)
 *   2. PUT <presigned>  → upload bytes directly to R2
 *   3. POST r2-complete → insert `attachments` row, get attachment_id
 *
 * Network failures retry once. `onProgress` is called with cumulative bytes
 * uploaded (best-effort; only reports full size on completion when XHR is
 * unavailable in the runtime).
 */
export async function uploadAttachment(
  params: UploadAttachmentParams
): Promise<UploadAttachmentResult> {
  if (!isSupabaseConfigured) {
    throw new R2ClientError('unknown', 'Supabase 미설정 — .env 확인');
  }

  const { assetId, file, mime, onProgress, signal } = params;
  const byteSize = file.size;

  const deviceId = await getDeviceId();
  const authHeaders = { 'X-Device-Id': deviceId };

  // Step 1: presigned PUT URL
  let presignRes: Response;
  try {
    presignRes = await fetchWithRetry(edgeFunctionUrl('r2-presign'), {
      method: 'POST',
      signal,
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId, mime, byte_size: byteSize, op: 'upload' }),
    });
  } catch (err) {
    if (err instanceof R2ClientError) throw err;
    throw new R2ClientError('upstream', `presign 요청 실패: ${(err as Error).message}`);
  }

  if (!presignRes.ok) {
    const text = await presignRes.text().catch(() => '');
    handleHttpError(presignRes.status, text);
  }

  const presignData = (await presignRes.json()) as {
    url: string;
    key: string;
    headers: Record<string, string>;
    expires_in: number;
  };

  const { url: putUrl, key } = presignData;

  // Step 2: PUT bytes to R2 (no auth header — signed in URL)
  let uploadRes: Response;
  try {
    uploadRes = await fetchWithRetry(putUrl, {
      method: 'PUT',
      signal,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(byteSize),
      },
      body: file,
    });
  } catch (err) {
    if (err instanceof R2ClientError) throw err;
    throw new R2ClientError('upstream', `R2 업로드 실패: ${(err as Error).message}`);
  }

  if (!uploadRes.ok) {
    throw new R2ClientError('upstream', `R2 PUT 실패 (${uploadRes.status})`);
  }

  onProgress?.(byteSize);

  // Step 3: notify complete → insert attachments row
  let completeRes: Response;
  try {
    completeRes = await fetchWithRetry(edgeFunctionUrl('r2-complete'), {
      method: 'POST',
      signal,
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, asset_id: assetId, mime, byte_size: byteSize }),
    });
  } catch (err) {
    if (err instanceof R2ClientError) throw err;
    throw new R2ClientError('upstream', `complete 요청 실패: ${(err as Error).message}`);
  }

  if (!completeRes.ok) {
    const text = await completeRes.text().catch(() => '');
    handleHttpError(completeRes.status, text);
  }

  const completeData = (await completeRes.json()) as { attachment_id: string };
  return { attachment_id: completeData.attachment_id, key };
}

// ─── getAttachmentUrl ─────────────────────────────────────────────────────────

/**
 * Fetches a presigned GET URL for an existing attachment.
 * TTL is 5 minutes (inline) or 15 minutes (op_mode:'export').
 */
export async function getAttachmentUrl(
  params: GetAttachmentUrlParams
): Promise<GetAttachmentUrlResult> {
  if (!isSupabaseConfigured) {
    throw new R2ClientError('unknown', 'Supabase 미설정 — .env 확인');
  }

  const { attachmentId, assetId, mime, op_mode } = params;
  const deviceId = await getDeviceId();

  let res: Response;
  try {
    res = await fetchWithRetry(edgeFunctionUrl('r2-presign'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
      },
      body: JSON.stringify({
        asset_id: assetId,
        mime,
        byte_size: 0,
        op: 'download',
        attachment_id: attachmentId,
        ...(op_mode !== undefined && { op_mode }),
      }),
    });
  } catch (err) {
    if (err instanceof R2ClientError) throw err;
    throw new R2ClientError('upstream', `download presign 실패: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    handleHttpError(res.status, text);
  }

  return res.json() as Promise<GetAttachmentUrlResult>;
}
