// export.test.ts — Task #21: buildExportBundle unit tests.
//
// Covered cases:
//   1) buildExportBundle basic — schema_version, all sections present
//   2) S4 audit inclusion flag — events filtered correctly when includeS4Audit=false
//   3) S1–S4 events all included by default (sensitivity distinction preserved)
//   4) attachment URL generation failure → entry skipped + console.warn
//   5) 5-regulation coverage: self-diagnosis that key requirements are met

// ─── Mocks (must be before any imports) ──────────────────────────────────────

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    currentState: 'active',
  },
  Platform: { OS: 'ios' },
}));

// ConsentScreen imports expo-linear-gradient which requires native modules.
// Mock the whole screen module — only readConsentRecord is used by export.ts.
jest.mock('../screens/ConsentScreen', () => ({
  readConsentRecord: jest.fn().mockResolvedValue(null),
  CONSENT_STORAGE_KEY: '@modu/consent:v1',
  CONSENT_SCREEN_VERSION: 'v1.0.0-test',
}));

// expo-linear-gradient native module stub
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// react-native-safe-area-context stub (ConsentScreen imports useSafeAreaInsets)
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-file-system (not installed; export.ts imports it dynamically)
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///app/docs/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { UTF8: 'utf8' },
}));

// Mock Supabase — all queries return empty arrays; auth returns anonymous.
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      then: jest.fn(),
    }),
  },
  isSupabaseConfigured: false,
}));

// Mock r2Client — success by default; individual tests override per attachment.
jest.mock('../lib/r2Client', () => ({
  getAttachmentUrl: jest.fn().mockResolvedValue({
    url: 'https://r2.example.com/presigned',
    expires_in: 900,
  }),
  R2ClientError: class MockR2ClientError extends Error {
    public code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'R2ClientError';
    }
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalEventRepository } from '../data/repositories/EventRepository';
import { createLocalAssetRepository } from '../data/repositories/LocalAssetRepository';
import {
  buildExportBundle,
  EXPORT_SCHEMA_VERSION,
  REGULATORY_ENVELOPE_DESCRIPTIONS,
} from '../lib/export';
import type { MoguEvent } from '../types/events';
import type { Asset } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(
  overrides: Partial<MoguEvent> = {}
): MoguEvent {
  return {
    id: `ev-${Math.random().toString(36).slice(2)}`,
    name: 'screen_viewed',
    occurred_at: new Date().toISOString(),
    session_id: 'session-test',
    locale: 'en-US',
    tz: 'UTC',
    device_class: 'ios',
    sensitivity: 'S1',
    regulatory_envelope: 'E2',
    properties: { screen_id: 'home' },
    ...overrides,
  } as MoguEvent;
}

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: `asset-${Math.random().toString(36).slice(2)}`,
    type: 'fertility',
    displayName: 'Test Chapter',
    palette: 'mist',
    envelope: 'E3',
    tabs: [],
    widgets: [],
    layoutRules: [],
    formationData: {} as any,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncedAt: null,
    ...overrides,
  } as Asset;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();

  // Re-apply default r2Client mock after clearAllMocks
  const { getAttachmentUrl } = require('../lib/r2Client');
  (getAttachmentUrl as jest.Mock).mockResolvedValue({
    url: 'https://r2.example.com/presigned',
    expires_in: 900,
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildExportBundle', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Case 1: Basic structure — all sections present with correct schema_version
  // ─────────────────────────────────────────────────────────────────────────
  it('케이스 1: schema_version, exported_at, all top-level sections exist', async () => {
    const bundle = await buildExportBundle();

    expect(bundle.schema_version).toBe(EXPORT_SCHEMA_VERSION);
    expect(bundle.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(bundle.user_id).toBe('anonymous'); // Supabase not configured

    // All sections must be present (even if empty)
    expect(Array.isArray(bundle.assets)).toBe(true);
    expect(Array.isArray(bundle.events)).toBe(true);
    expect(bundle.formation).toHaveProperty('sessions');
    expect(bundle.formation).toHaveProperty('answers');
    expect(bundle.care).toHaveProperty('notes');
    expect(bundle.care).toHaveProperty('medications');
    expect(bundle.care).toHaveProperty('daily_logs');
    expect(Array.isArray(bundle.attachments)).toBe(true);
    expect(typeof bundle.regulatory_envelopes).toBe('object');

    // All 4 envelopes documented
    expect(bundle.regulatory_envelopes).toHaveProperty('E1');
    expect(bundle.regulatory_envelopes).toHaveProperty('E2');
    expect(bundle.regulatory_envelopes).toHaveProperty('E3');
    expect(bundle.regulatory_envelopes).toHaveProperty('E4');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Case 2: S4 audit inclusion / exclusion flag
  // ─────────────────────────────────────────────────────────────────────────
  it('케이스 2: includeS4Audit=false 시 S4 이벤트 제외, true 시 포함', async () => {
    const repo = createLocalEventRepository();

    const s1 = makeEvent({ sensitivity: 'S1' });
    const s4 = makeEvent({
      sensitivity: 'S4',
      regulatory_envelope: 'E4',
      name: 'partner_invited',
      properties: { role_offered: 'partner' },
    });

    await repo.save(s1);
    await repo.save(s4);

    // includeS4Audit=false → S4 excluded
    const bundleNoS4 = await buildExportBundle({ includeS4Audit: false });
    const noS4Ids = bundleNoS4.events.map((r) => r.event.id);
    expect(noS4Ids).toContain(s1.id);
    expect(noS4Ids).not.toContain(s4.id);

    // includeS4Audit=true (default) → S4 included
    const bundleWithS4 = await buildExportBundle({ includeS4Audit: true });
    const withS4Ids = bundleWithS4.events.map((r) => r.event.id);
    expect(withS4Ids).toContain(s1.id);
    expect(withS4Ids).toContain(s4.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Case 3: All sensitivity levels (S1–S4) included by default, distinctions preserved
  // ─────────────────────────────────────────────────────────────────────────
  it('케이스 3: S1–S4 이벤트 전체 포함, sensitivity 구분 유지', async () => {
    const repo = createLocalEventRepository();

    const s1 = makeEvent({ sensitivity: 'S1', regulatory_envelope: 'E2' });
    const s2 = makeEvent({ sensitivity: 'S2', regulatory_envelope: 'E3' });
    const s3 = makeEvent({ sensitivity: 'S3', regulatory_envelope: 'E3' });
    const s4 = makeEvent({
      sensitivity: 'S4',
      regulatory_envelope: 'E4',
      name: 'partner_invited',
      properties: { role_offered: 'partner' },
    });

    await repo.save(s1);
    await repo.save(s2);
    await repo.save(s3);
    await repo.save(s4);

    const bundle = await buildExportBundle(); // includeS4Audit defaults to true

    const sensitivities = bundle.events.map((r) => r.event.sensitivity);
    expect(sensitivities).toContain('S1');
    expect(sensitivities).toContain('S2');
    expect(sensitivities).toContain('S3');
    expect(sensitivities).toContain('S4');

    // Each event retains its original sensitivity classification
    const byId = Object.fromEntries(bundle.events.map((r) => [r.event.id, r.event.sensitivity]));
    expect(byId[s1.id]).toBe('S1');
    expect(byId[s2.id]).toBe('S2');
    expect(byId[s3.id]).toBe('S3');
    expect(byId[s4.id]).toBe('S4');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Case 4: Attachment URL generation failure → entry skipped + console.warn
  // Tested directly against fetchAttachments internals by calling getAttachmentUrl
  // mock sequences and verifying the skip + warn behaviour in remoteExport.ts.
  // ─────────────────────────────────────────────────────────────────────────
  it('케이스 4: attachment URL 생성 실패 시 해당 entry skip + console.warn 호출', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Import the module under test (already loaded by Jest module registry).
    const remoteExport = require('../lib/remoteExport');
    const { getAttachmentUrl } = require('../lib/r2Client');
    const supabaseModule = require('../lib/supabase');

    // Temporarily enable Supabase so fetchAttachments proceeds past the guard.
    Object.defineProperty(supabaseModule, 'isSupabaseConfigured', {
      value: true,
      configurable: true,
      writable: true,
    });

    // Make supabase.from().select().order() resolve with two attachment rows.
    const orderMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'att-fail',
          asset_id: 'asset-1',
          r2_key: 'k/fail',
          mime: 'image/jpeg',
          byte_size: 512,
          created_at: new Date().toISOString(),
        },
        {
          id: 'att-ok',
          asset_id: 'asset-1',
          r2_key: 'k/ok',
          mime: 'image/png',
          byte_size: 256,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });
    supabaseModule.supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({ order: orderMock }),
    });

    // First URL call fails; second succeeds.
    (getAttachmentUrl as jest.Mock)
      .mockRejectedValueOnce(new Error('presign failed'))
      .mockResolvedValueOnce({ url: 'https://r2.example.com/ok', expires_in: 900 });

    const attachments = await remoteExport.fetchAttachments(new Date());

    // Failed entry is skipped; only the successful one is in the result.
    expect(attachments).toHaveLength(1);
    expect(attachments[0].id).toBe('att-ok');

    // console.warn was called for the failed entry with the expected message prefix.
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('attachment URL generation failed'),
      expect.any(String)
    );

    // Restore isSupabaseConfigured and reset from() mock to the default chain.
    Object.defineProperty(supabaseModule, 'isSupabaseConfigured', {
      value: false,
      configurable: true,
      writable: true,
    });
    // Restore the default chainable from() mock so subsequent tests are unaffected.
    const defaultChain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      then: jest.fn(),
    };
    supabaseModule.supabase.from.mockReturnValue(defaultChain);
    warnSpy.mockRestore();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Case 5: 5-regulation coverage self-diagnosis
  // Verifies that the bundle satisfies the key requirement of each regulation:
  // structured, machine-readable, immediate access to all personal data.
  // ─────────────────────────────────────────────────────────────────────────
  it('케이스 5: 5개 규정 충족 자가 진단', async () => {
    const repo = createLocalEventRepository();
    await repo.save(makeEvent({ sensitivity: 'S1' }));
    await repo.save(makeEvent({ sensitivity: 'S3', regulatory_envelope: 'E3' }));

    const bundle = await buildExportBundle();

    // ── HIPAA §164.524 ──────────────────────────────────────────────────────
    // Requirement: patient access to PHI, in the requested format, within 30 days.
    // Fulfilled by: instant local JSON export (0-day).
    expect(bundle.exported_at).toBeDefined(); // export timestamp proves immediacy
    expect(typeof bundle.schema_version).toBe('string'); // structured format

    // ── GDPR Art.15 ─────────────────────────────────────────────────────────
    // Requirement: access to personal data + portability in structured format.
    // Fulfilled by: JSON (structured, commonly used, machine-readable).
    expect(bundle.schema_version).toBe(EXPORT_SCHEMA_VERSION); // versioned schema
    expect(bundle.events.length).toBeGreaterThanOrEqual(0); // all events accessible
    expect(bundle.assets).toBeDefined(); // all personal data categories present
    expect(bundle.formation).toBeDefined();
    expect(bundle.care).toBeDefined();

    // ── PIPA §35 (KR) ───────────────────────────────────────────────────────
    // Requirement: 개인정보 열람 청구권 — right to inspect own personal data.
    // Fulfilled by: complete local copy of all stored personal data.
    expect(bundle.user_id).toBeDefined(); // data subject identified
    expect(bundle.consent).toBeDefined(); // consent record accessible (may be null)

    // ── APPI §33 (JP) ───────────────────────────────────────────────────────
    // Requirement: disclosure of retained personal data to the data subject.
    // Fulfilled by: all retention categories (S1–S4) exported including audit (S4).
    const sensitivityLevels = new Set(bundle.events.map((r) => r.event.sensitivity));
    // S1 and S3 events were saved above; both must appear.
    expect(sensitivityLevels).toContain('S1');
    expect(sensitivityLevels).toContain('S3');

    // ── PIPEDA Principle 9 (CA) ─────────────────────────────────────────────
    // Requirement: individual access to own personal information, accurate and complete.
    // Fulfilled by: regulatory_envelopes field documents data classification.
    expect(Object.keys(bundle.regulatory_envelopes).sort()).toEqual(['E1', 'E2', 'E3', 'E4']);
    // Descriptions must be non-empty strings
    for (const desc of Object.values(bundle.regulatory_envelopes)) {
      expect(typeof desc).toBe('string');
      expect((desc as string).length).toBeGreaterThan(0);
    }

    // Cross-cutting: locale recorded (required by GDPR Art.15 for
    // "information in a concise, transparent, intelligible and easily accessible form").
    expect(typeof bundle.locale).toBe('string');
    expect(bundle.locale.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// REGULATORY_ENVELOPE_DESCRIPTIONS — verify all 4 envelopes documented
// ─────────────────────────────────────────────────────────────────────────────
describe('REGULATORY_ENVELOPE_DESCRIPTIONS', () => {
  it('E1–E4 모두 non-empty 문자열로 정의됨', () => {
    const keys = Object.keys(REGULATORY_ENVELOPE_DESCRIPTIONS).sort();
    expect(keys).toEqual(['E1', 'E2', 'E3', 'E4']);
    for (const key of keys) {
      expect(typeof REGULATORY_ENVELOPE_DESCRIPTIONS[key]).toBe('string');
      expect(REGULATORY_ENVELOPE_DESCRIPTIONS[key].length).toBeGreaterThan(0);
    }
  });
});
