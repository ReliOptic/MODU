// export.ts — One-tap data export bundle builder (Task #21).
//
// Packages all user data into a structured ExportBundle for local download.
// Satisfies five concurrent data access regulations by providing immediate,
// structured, portable access to the user's own data:
//
//   HIPAA §164.524  — Patient's right to PHI access within 30 days.
//                     Instant local export = 0-day fulfillment.
//   GDPR Art.15     — Right of access + data portability in structured format.
//                     JSON output satisfies "structured, commonly used format".
//   PIPA §35 (KR)   — 개인정보 열람 청구권 (right to inspect personal data).
//                     Direct local export fulfills without institutional delay.
//   APPI §33 (JP)   — 保有個人データの開示 (disclosure of retained personal data).
//                     Fulfilled by exporting all stored records to the data subject.
//   PIPEDA Principle 9 (CA) — Individual access to personal information.
//                     Satisfied by providing complete, accurate, timely access.
//
// Security note: output is written to the app's private document directory
// (expo-file-system documentDirectory) — not accessible to other apps.
// S4 audit events are included by default because the user's legal right of
// access (열람권) encompasses audit records of actions taken on their behalf.
// Attachment presigned URLs have a 15-minute TTL — share immediately after export.

import { createLocalAssetRepository } from '../data/repositories/LocalAssetRepository';
import { getLocalEventRepository } from '../data/repositories/EventRepository';
import { readConsentRecord } from '../screens/ConsentScreen';
import {
  fetchFormation,
  fetchCare,
  fetchAttachments,
  type ExportFormation,
  type ExportCare,
  type ExportAttachment,
} from './remoteExport';
import type { Asset } from '../types';
import type { StoredEvent } from '../data/repositories/EventRepository';
import type { ConsentRecord } from '../screens/ConsentScreen';

// ─── Schema version ───────────────────────────────────────────────────────────

/**
 * Monotonically-increasing schema version for forward-compatibility detection.
 * Bump when ExportBundle shape changes in a breaking way.
 */
export const EXPORT_SCHEMA_VERSION = 'v1.0.0-2026-04-17' as const;

// ─── Regulatory envelope descriptions ────────────────────────────────────────

/**
 * Human-readable descriptions of each regulatory envelope included in the
 * bundle. Embedded so the recipient (or their legal representative) understands
 * the classification without external documentation.
 */
export const REGULATORY_ENVELOPE_DESCRIPTIONS: Record<string, string> = {
  E1: 'General-purpose events (formation, performance). No special sensitivity classification.',
  E2: 'Session / navigation telemetry. Pseudonymous usage signals, 90-day retention.',
  E3: 'Chapter lifecycle, memory, and care events. Retained indefinitely per user consent.',
  E4: 'Partner/consent/audit events (S4). Immutable audit trail — never purged.',
};

// ─── Export bundle shape ──────────────────────────────────────────────────────

export interface ExportBundle {
  /** Bundle schema version for forward-compatibility detection. */
  schema_version: typeof EXPORT_SCHEMA_VERSION;
  /** ISO-8601 UTC timestamp when this bundle was generated. */
  exported_at: string;
  /** Supabase auth user_id, or 'anonymous' when not signed in. */
  user_id: string;
  /** BCP-47 locale at export time. */
  locale: string;
  /** All local assets (chapters). */
  assets: Asset[];
  /**
   * All analytics events (S1–S4 inclusive).
   * User's right of access (열람권 / right to access) covers all sensitivity
   * levels of their own data, including S4 audit records.
   */
  events: StoredEvent[];
  /** Formation sessions and answers from Supabase. */
  formation: ExportFormation;
  /** Care data (notes, medications, daily_logs) from Supabase. */
  care: ExportCare;
  /**
   * Attachment metadata + presigned GET URLs.
   * URLs expire 15 minutes after exported_at — share immediately.
   * If a URL could not be generated, that entry is omitted (see console warnings).
   */
  attachments: ExportAttachment[];
  /** Consent record from AsyncStorage (null if consent not yet recorded). */
  consent: ConsentRecord | null;
  /**
   * Human-readable descriptions of each regulatory envelope present in the
   * events array. Keyed by envelope id (E1–E4).
   */
  regulatory_envelopes: Record<string, string>;
}

// ─── Build options ────────────────────────────────────────────────────────────

export interface BuildExportOptions {
  /**
   * When true, S4 audit events are included in the bundle (default: true).
   * The user's legal right of access covers S4 records. Set to false only in
   * specific compliance contexts where audit log segregation is required.
   */
  includeS4Audit?: boolean;
}

// ─── Progress callback ────────────────────────────────────────────────────────

export type ExportStep = 'assets' | 'events' | 'formation' | 'care' | 'attachments' | 'done';

export type ExportProgressCallback = (step: ExportStep, detail?: string) => void;

// ─── buildExportBundle ────────────────────────────────────────────────────────

/**
 * Assembles the complete export bundle by reading local repositories and
 * fetching remote data from Supabase. Returns the in-memory bundle.
 *
 * @param options  - Build options (includeS4Audit defaults to true).
 * @param onProgress - Optional progress callback fired at each step.
 */
export async function buildExportBundle(
  options: BuildExportOptions = {},
  onProgress?: ExportProgressCallback
): Promise<ExportBundle> {
  const { includeS4Audit = true } = options;
  const exportedAt = new Date();

  // ── Step 1: Local assets ──────────────────────────────────────────────────
  onProgress?.('assets');
  const assetRepo = createLocalAssetRepository();
  const assets = await assetRepo.list();

  // ── Step 2: Local events (S1–S4) ─────────────────────────────────────────
  onProgress?.('events');
  const eventRepo = getLocalEventRepository();
  let events = await eventRepo.list();

  // S4 audit filter — default on; user's 열람권 covers all levels.
  if (!includeS4Audit) {
    events = events.filter((r) => r.event.sensitivity !== 'S4');
  }

  // ── Step 3: Formation (Supabase) ──────────────────────────────────────────
  onProgress?.('formation');
  const formation = await fetchFormation();

  // ── Step 4: Care data (Supabase) ──────────────────────────────────────────
  onProgress?.('care');
  const care = await fetchCare();

  // ── Step 5: Attachments + presigned URLs (Supabase + R2) ─────────────────
  onProgress?.('attachments', `0 processed`);
  const attachments = await fetchAttachments(exportedAt);
  onProgress?.('attachments', `${attachments.length} URLs generated`);

  // ── Consent record ────────────────────────────────────────────────────────
  const consent = await readConsentRecord();

  // ── User identity ─────────────────────────────────────────────────────────
  let userId = 'anonymous';
  try {
    // Lazy import — avoids pulling supabase into non-auth contexts.
    const { supabase, isSupabaseConfigured } = await import('./supabase');
    if (isSupabaseConfigured) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.id) {
        userId = data.session.user.id;
      }
    }
  } catch {
    // Not signed in or Supabase not configured — use anonymous marker.
  }

  // ── Locale ────────────────────────────────────────────────────────────────
  // Prefer expo-localization (stable RN implementation) over navigator.language
  // which can be unreliable in React Native environments.
  let locale = 'en-US';
  try {
    const Localization = await import('expo-localization');
    locale = Localization.getLocales?.()?.[0]?.languageTag ?? 'en-US';
  } catch {
    // expo-localization not installed — fall back to navigator.language.
    locale = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
  }

  onProgress?.('done');

  return {
    schema_version: EXPORT_SCHEMA_VERSION,
    exported_at: exportedAt.toISOString(),
    user_id: userId,
    locale,
    assets,
    events,
    formation,
    care,
    attachments,
    consent,
    regulatory_envelopes: REGULATORY_ENVELOPE_DESCRIPTIONS,
  };
}

// ─── exportToJson ─────────────────────────────────────────────────────────────

export interface ExportFileResult {
  uri: string;
  size: number;
}

/**
 * Builds the export bundle and writes it as a JSON file to the app's private
 * document directory using expo-file-system.
 *
 * File path: <documentDirectory>/modu-export-<YYYYMMDD-HHmmss>.json
 *
 * Returns the file URI and byte size. The URI can be passed to expo-sharing's
 * shareAsync() for the user to send the file via any share target.
 *
 * @throws Error if expo-file-system is not available or the write fails.
 */
export async function exportToJson(
  options: BuildExportOptions = {},
  onProgress?: ExportProgressCallback
): Promise<ExportFileResult> {
  // expo-file-system is a peer dependency — import dynamically so the module
  // can be tree-shaken in environments where it is absent (e.g. web tests).
  let FileSystem: typeof import('expo-file-system');
  try {
    FileSystem = await import('expo-file-system');
  } catch {
    throw new Error(
      'expo-file-system is not installed. Run: npx expo install expo-file-system'
    );
  }

  const bundle = await buildExportBundle(options, onProgress);

  const json = JSON.stringify(bundle, null, 2);
  const bytes = new TextEncoder().encode(json).length;

  // Timestamp suffix ensures each export creates a distinct file.
  const ts = bundle.exported_at
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19); // "2026-04-17_12-00-00"

  const filename = `modu-export-${ts}.json`;
  const uri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return { uri, size: bytes };
}

// ─── exportToPdf ─────────────────────────────────────────────────────────────

/**
 * PDF export — placeholder for a future implementation.
 *
 * A full implementation would use expo-print or react-native-pdf-lib to render
 * the bundle into a structured PDF. Deferred to a follow-up task because:
 *   1. expo-print is not in the current dependency set.
 *   2. PDF layout for variable-length care / event records requires design work.
 *   3. JSON already satisfies the GDPR Art.15 "structured, machine-readable"
 *      requirement; PDF adds human-readability for non-technical users.
 *
 * @deprecated until task #22 (PDF export implementation)
 * @throws Error Always — not yet implemented.
 */
export async function exportToPdf(
  _options: BuildExportOptions = {}
): Promise<ExportFileResult> {
  throw new Error(
    '[export] PDF export is not yet implemented. Use exportToJson() for now.'
  );
}
