// MODU r2-presign Edge Function — Cloudflare R2 presigned URL generator
// Task #20
//
// POST /functions/v1/r2-presign
//   Authorization: Bearer <supabase user JWT>
//   Body: {
//     asset_id: string,
//     mime: string,
//     byte_size: number,
//     op: 'upload' | 'download',
//     attachment_id?: string   // required for op='download'
//   }
//
// Upload response:  { url, key, headers, expires_in }
// Download response: { url, expires_in }
//
// Deploy: supabase functions deploy r2-presign --no-verify-jwt=false
// Secrets: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
//          + SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { corsPreFlight, jsonResp } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import { S3Client, PutObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ─── Constants ────────────────────────────────────────────────────────────────

const UPLOAD_TTL_SECONDS = 600;          // 10 minutes
const DOWNLOAD_INLINE_TTL_SECONDS = 300; // 5 minutes — in-app preview
const DOWNLOAD_EXPORT_TTL_SECONDS = 900; // 15 minutes — user export/download
const MAX_BYTE_SIZE = 20 * 1024 * 1024; // 20 MB

const MIME_WHITELIST = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/m4a',
  'audio/mp3',
  'audio/mpeg',
  'audio/webm',
  'application/pdf',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg':       'jpg',
  'image/png':        'png',
  'image/webp':       'webp',
  'audio/m4a':        'm4a',
  'audio/mp3':        'mp3',
  'audio/mpeg':       'mp3',
  'audio/webm':       'webm',
  'application/pdf':  'pdf',
};

// ─── Request shape ────────────────────────────────────────────────────────────

interface RequestBody {
  asset_id: string;
  mime: string;
  byte_size: number;
  op: 'upload' | 'download';
  attachment_id?: string;
  /** Controls download URL TTL: 'inline' (5 min, default) | 'export' (15 min) */
  op_mode?: 'inline' | 'export';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildKey(userId: string, assetId: string, mime: string): string {
  const ext = MIME_TO_EXT[mime] ?? 'bin';
  const now = new Date();
  const yyyymmdd =
    now.getUTCFullYear().toString() +
    (now.getUTCMonth() + 1).toString().padStart(2, '0') +
    now.getUTCDate().toString().padStart(2, '0');
  const uuid = crypto.randomUUID();
  return `u/${userId}/a/${assetId}/${yyyymmdd}/${uuid}.${ext}`;
}

function makeS3Client(): S3Client {
  const accountId = Deno.env.get('R2_ACCOUNT_ID') ?? '';
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function insertAudit(
  supabaseUrl: string,
  serviceKey: string,
  params: { userId: string; op: string; key: string; mime: string; byteSize: number; latencyMs: number }
): Promise<void> {
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.from('r2_audit').insert({
    user_id: params.userId,
    op: params.op,
    key: params.key,
    mime: params.mime,
    byte_size: params.byteSize,
    latency_ms: params.latencyMs,
  });
  if (error) {
    console.warn('[r2-presign] audit insert error:', error.message);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreFlight();
  if (req.method !== 'POST') return jsonResp(405, { error: 'Method not allowed' });

  const t0 = Date.now();

  // 1) Auth
  let userId: string;
  try {
    const auth = await getUserFromRequest(req);
    userId = auth.userId;
  } catch (resp) {
    return resp as Response;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const bucketName = Deno.env.get('R2_BUCKET_NAME') ?? '';

  if (!supabaseUrl || !serviceKey || !bucketName ||
      !Deno.env.get('R2_ACCOUNT_ID') ||
      !Deno.env.get('R2_ACCESS_KEY_ID') ||
      !Deno.env.get('R2_SECRET_ACCESS_KEY')) {
    return jsonResp(500, { error: 'R2 not configured' });
  }

  // 2) Parse body
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResp(400, { error: 'Invalid JSON body' });
  }

  const { asset_id, mime, byte_size, op, attachment_id, op_mode } = body;
  const downloadTtl = op_mode === 'export'
    ? DOWNLOAD_EXPORT_TTL_SECONDS
    : DOWNLOAD_INLINE_TTL_SECONDS;

  if (!asset_id || !mime || !op) {
    return jsonResp(400, { error: 'asset_id, mime, and op are required' });
  }
  if (op !== 'upload' && op !== 'download') {
    return jsonResp(400, { error: 'op must be "upload" or "download"' });
  }

  // 3) Mime whitelist
  if (!MIME_WHITELIST.has(mime)) {
    return jsonResp(415, {
      error: `Unsupported media type: ${mime}`,
      allowed: [...MIME_WHITELIST],
    });
  }

  // 4) Byte size limit (upload only)
  if (op === 'upload') {
    if (typeof byte_size !== 'number' || byte_size <= 0) {
      return jsonResp(400, { error: 'byte_size must be a positive number' });
    }
    if (byte_size > MAX_BYTE_SIZE) {
      return jsonResp(413, {
        error: `File too large. Maximum is ${MAX_BYTE_SIZE / 1024 / 1024} MB`,
        max_bytes: MAX_BYTE_SIZE,
      });
    }
  }

  // 5) Asset ownership check (Supabase assets table)
  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: asset, error: assetErr } = await serviceClient
    .from('assets')
    .select('id, user_id')
    .eq('id', asset_id)
    .eq('user_id', userId)
    .single();

  if (assetErr || !asset) {
    return jsonResp(403, { error: 'Asset not found or access denied' });
  }

  // 6) Download: attachment_id required + owner check
  let existingKey: string | undefined;
  if (op === 'download') {
    if (!attachment_id) {
      return jsonResp(400, { error: 'attachment_id is required for download' });
    }
    const { data: attachment, error: attachErr } = await serviceClient
      .from('attachments')
      .select('id, user_id, r2_key')
      .eq('id', attachment_id)
      .eq('user_id', userId)
      .single();

    if (attachErr || !attachment) {
      return jsonResp(403, { error: 'Attachment not found or access denied' });
    }
    existingKey = (attachment as { r2_key: string }).r2_key;
  }

  // 7) Build presigned URL
  const s3 = makeS3Client();

  try {
    if (op === 'upload') {
      const key = buildKey(userId, asset_id, mime);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: mime,
        ContentLength: byte_size,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: UPLOAD_TTL_SECONDS });

      const latencyMs = Date.now() - t0;
      await insertAudit(supabaseUrl, serviceKey, {
        userId, op, key, mime, byteSize: byte_size, latencyMs,
      });

      return jsonResp(200, {
        url,
        key,
        headers: {
          'Content-Type': mime,
          'Content-Length': String(byte_size),
        },
        expires_in: UPLOAD_TTL_SECONDS,
      });

    } else {
      // download
      const key = existingKey!;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: downloadTtl });

      const latencyMs = Date.now() - t0;
      await insertAudit(supabaseUrl, serviceKey, {
        userId, op, key, mime, byteSize: 0, latencyMs,
      });

      return jsonResp(200, { url, expires_in: downloadTtl });
    }
  } catch (err) {
    console.error('[r2-presign] presign error:', err);
    return jsonResp(502, { error: 'Failed to generate presigned URL' });
  }
});
