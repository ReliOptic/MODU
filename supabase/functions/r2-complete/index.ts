// MODU r2-complete Edge Function — finalise R2 upload by inserting attachment row
// Task #20
//
// POST /functions/v1/r2-complete
//   Authorization: Bearer <supabase user JWT>
//   Body: { key: string, asset_id: string, mime: string, byte_size: number }
//   Response: { attachment_id: string }
//
// Called by the client after a successful PUT to the presigned upload URL.
// Inserts a row into `attachments` and writes an r2_audit 'complete' record.
//
// Deploy: supabase functions deploy r2-complete --no-verify-jwt=false
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (no R2 keys needed here)

import { corsPreFlight, jsonResp } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const MAX_BYTE_SIZE = 20 * 1024 * 1024; // 20 MB

// ─── Request shape ────────────────────────────────────────────────────────────

interface RequestBody {
  key: string;
  asset_id: string;
  mime: string;
  byte_size: number;
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

  if (!supabaseUrl || !serviceKey) {
    return jsonResp(500, { error: 'Server misconfiguration' });
  }

  // 2) Parse body
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResp(400, { error: 'Invalid JSON body' });
  }

  const { key, asset_id, mime, byte_size } = body;

  if (!key || !asset_id || !mime || typeof byte_size !== 'number') {
    return jsonResp(400, { error: 'key, asset_id, mime, and byte_size are required' });
  }

  // 3) Validate key prefix — must be scoped to this user AND this asset
  const expectedPrefix = `u/${userId}/a/${asset_id}/`;
  if (!key.startsWith(expectedPrefix)) {
    return jsonResp(400, { error: 'R2 key does not match expected prefix for this user and asset' });
  }

  // 4) Mime whitelist + size sanity
  if (!MIME_WHITELIST.has(mime)) {
    return jsonResp(415, { error: `Unsupported media type: ${mime}` });
  }
  if (byte_size <= 0 || byte_size > MAX_BYTE_SIZE) {
    return jsonResp(413, { error: 'byte_size out of range' });
  }

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 5) Asset ownership check
  const { data: asset, error: assetErr } = await serviceClient
    .from('assets')
    .select('id, user_id')
    .eq('id', asset_id)
    .eq('user_id', userId)
    .single();

  if (assetErr || !asset) {
    return jsonResp(403, { error: 'Asset not found or access denied' });
  }

  // 6) Insert attachment row (idempotent: return existing row on duplicate key)
  const { data: attachment, error: insertErr } = await serviceClient
    .from('attachments')
    .insert({
      user_id: userId,
      asset_id,
      r2_key: key,
      mime,
      byte_size,
    })
    .select('id')
    .single();

  if (insertErr) {
    // 23505 = unique_violation (attachments_r2_key_unique conflict on retry)
    if ((insertErr as { code?: string }).code === '23505') {
      const { data: existing } = await serviceClient
        .from('attachments')
        .select('id')
        .eq('r2_key', key)
        .eq('user_id', userId)
        .single();
      if (existing) {
        return jsonResp(200, { attachment_id: (existing as { id: string }).id, key });
      }
    }
    console.error('[r2-complete] attachment insert error:', insertErr.message);
    return jsonResp(500, { error: 'Failed to record attachment' });
  }

  if (!attachment) {
    return jsonResp(500, { error: 'Failed to record attachment' });
  }

  const attachmentId = (attachment as { id: string }).id;

  // 7) Audit log
  const latencyMs = Date.now() - t0;
  const { error: auditErr } = await serviceClient.from('r2_audit').insert({
    user_id: userId,
    op: 'complete',
    key,
    mime,
    byte_size,
    latency_ms: latencyMs,
  });
  if (auditErr) {
    console.warn('[r2-complete] audit insert error:', auditErr.message);
  }

  return jsonResp(200, { attachment_id: attachmentId });
});
