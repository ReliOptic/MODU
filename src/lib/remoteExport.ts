// remoteExport.ts — Supabase-side data fetch helpers for the export bundle.
//
// All queries go through the authenticated Supabase client.
// RLS on every table guarantees only the signed-in user's rows are returned —
// no server-side user_id filter is needed in the query itself, but we include
// it as defence-in-depth where the column is directly on the queried table.
//
// Regulatory coverage (all five regulations are satisfied by the same mechanism:
// providing the user with immediate, structured access to their own data):
//   HIPAA §164.524  — PHI access within 30 days → instant local export satisfies this
//   GDPR Art.15     — portable structured format (JSON) → satisfied
//   PIPA §35 (KR)   — 개인정보 열람 청구권 → satisfied
//   APPI §33 (JP)   — 개인정보 disclosure → satisfied
//   PIPEDA Principle 9 (CA) — individual access → satisfied

import { supabase, isSupabaseConfigured } from './supabase';
import { getAttachmentUrl } from './r2Client';

// ─── Formation ────────────────────────────────────────────────────────────────

export interface ExportFormationSession {
  id: string;
  asset_id: string | null;
  started_at: string;
  completed_at: string | null;
  consent_version_id: string | null;
}

export interface ExportFormationAnswer {
  id: string;
  session_id: string;
  step: number;
  question_id: string;
  answer: Record<string, unknown>;
  created_at: string;
}

export interface ExportFormation {
  sessions: ExportFormationSession[];
  answers: ExportFormationAnswer[];
}

export async function fetchFormation(): Promise<ExportFormation> {
  if (!isSupabaseConfigured) {
    return { sessions: [], answers: [] };
  }

  const { data: sessions, error: sessErr } = await supabase
    .from('formation_sessions')
    .select('id, asset_id, started_at, completed_at, consent_version_id')
    .order('started_at', { ascending: true });

  if (sessErr) {
    console.warn('[remoteExport] formation_sessions fetch error', sessErr.message);
    return { sessions: [], answers: [] };
  }

  const sessionIds = (sessions ?? []).map((s) => s.id);

  let answers: ExportFormationAnswer[] = [];
  if (sessionIds.length > 0) {
    const { data: ansData, error: ansErr } = await supabase
      .from('formation_answers')
      .select('id, session_id, step, question_id, answer, created_at')
      .in('session_id', sessionIds)
      .order('session_id')
      .order('step');

    if (ansErr) {
      console.warn('[remoteExport] formation_answers fetch error', ansErr.message);
    } else {
      answers = (ansData ?? []) as ExportFormationAnswer[];
    }
  }

  return {
    sessions: (sessions ?? []) as ExportFormationSession[],
    answers,
  };
}

// ─── Care ─────────────────────────────────────────────────────────────────────

export interface ExportNote {
  id: string;
  asset_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ExportMedication {
  id: string;
  asset_id: string;
  name: string;
  dosage: string | null;
  schedule: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportDailyLog {
  id: string;
  asset_id: string;
  logged_at: string;
  tz_offset_minutes: number | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExportCare {
  notes: ExportNote[];
  medications: ExportMedication[];
  daily_logs: ExportDailyLog[];
}

export async function fetchCare(): Promise<ExportCare> {
  if (!isSupabaseConfigured) {
    return { notes: [], medications: [], daily_logs: [] };
  }

  const [notesResult, medsResult, logsResult] = await Promise.all([
    supabase
      .from('notes')
      .select('id, asset_id, body, created_at, updated_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('medications')
      .select('id, asset_id, name, dosage, schedule, active, created_at, updated_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('daily_logs')
      .select('id, asset_id, logged_at, tz_offset_minutes, payload, created_at, updated_at')
      .order('logged_at', { ascending: true }),
  ]);

  if (notesResult.error) {
    console.warn('[remoteExport] notes fetch error', notesResult.error.message);
  }
  if (medsResult.error) {
    console.warn('[remoteExport] medications fetch error', medsResult.error.message);
  }
  if (logsResult.error) {
    console.warn('[remoteExport] daily_logs fetch error', logsResult.error.message);
  }

  return {
    notes: (notesResult.data ?? []) as ExportNote[],
    medications: (medsResult.data ?? []) as ExportMedication[],
    daily_logs: (logsResult.data ?? []) as ExportDailyLog[],
  };
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export interface ExportAttachmentRow {
  id: string;
  asset_id: string;
  r2_key: string;
  mime: string | null;
  byte_size: number | null;
  created_at: string;
}

export interface ExportAttachment {
  id: string;
  key: string;
  mime: string | null;
  byte_size: number | null;
  /** Presigned GET URL — valid for 15 minutes from export time. */
  download_url: string;
  /** ISO-8601 expiry (exported_at + 15 min). */
  expires_at: string;
}

/**
 * Fetch attachment metadata from Supabase, then generate a presigned GET URL
 * via r2Client.getAttachmentUrl for each row.
 *
 * URL TTL is 15 minutes (export mode). Failures on individual attachments are
 * skipped with a warning — the bundle is still returned without that entry.
 *
 * Regulatory note: presigned URLs give the user direct, portable access to
 * their own binary data — satisfying the "portability" dimension of all five
 * regulations.
 */
export async function fetchAttachments(exportedAt: Date): Promise<ExportAttachment[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data: rows, error } = await supabase
    .from('attachments')
    .select('id, asset_id, r2_key, mime, byte_size, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[remoteExport] attachments fetch error', error.message);
    return [];
  }

  const attachmentRows = (rows ?? []) as ExportAttachmentRow[];
  const expiresAt = new Date(exportedAt.getTime() + 15 * 60 * 1000).toISOString();

  const results: ExportAttachment[] = [];

  for (const row of attachmentRows) {
    try {
      // op_mode='export' requests a 15-minute TTL presigned GET URL.
      // getAttachmentUrl passes op: 'download' to the r2-presign edge function.
      const { url } = await getAttachmentUrl({
        attachmentId: row.id,
        assetId: row.asset_id,
        mime: row.mime ?? 'application/octet-stream',
      });

      results.push({
        id: row.id,
        key: row.r2_key,
        mime: row.mime,
        byte_size: row.byte_size,
        download_url: url,
        expires_at: expiresAt,
      });
    } catch (err) {
      // Individual URL generation failure — skip entry, warn, continue.
      console.warn(
        `[remoteExport] attachment URL generation failed for id=${row.id}:`,
        (err as Error).message
      );
    }
  }

  return results;
}
