// Audit log helper — inserts rows into `ai_audit` table
// Uses service-role client so RLS INSERT policy is satisfied.
// No payload content is stored — only metadata.

import { createClient } from 'npm:@supabase/supabase-js@2';

export interface AuditParams {
  userId: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface WhisperAuditParams {
  userId: string;
  bytesIn: number;
  durationMs: number;
}

/**
 * Inserts a Claude call audit record.
 * Returns the generated `id` (UUID) that can be returned to the client as
 * `request_id` for traceability without exposing payload.
 */
export async function insertAudit(
  supabaseUrl: string,
  serviceKey: string,
  params: AuditParams
): Promise<string | null> {
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from('ai_audit')
    .insert({
      user_id: params.userId,
      model: params.model,
      tokens_in: params.tokensIn,
      tokens_out: params.tokensOut,
      latency_ms: params.latencyMs,
      bytes_in: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[audit] insert error:', error.message);
    return null;
  }
  return (data as { id: string }).id ?? null;
}

/**
 * Inserts a Whisper STT call audit record.
 * `bytesIn` stores the raw audio payload size for cost tracking.
 */
export async function insertWhisperAudit(
  supabaseUrl: string,
  serviceKey: string,
  params: WhisperAuditParams
): Promise<string | null> {
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from('ai_audit')
    .insert({
      user_id: params.userId,
      model: 'whisper-1',
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: params.durationMs,
      bytes_in: params.bytesIn,
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[audit] whisper insert error:', error.message);
    return null;
  }
  return (data as { id: string }).id ?? null;
}
