// TPO persistence helpers — isolated from tpoStore to keep store <200 LOC.
// Domain-agnostic: no imports from src/types/asset.ts, src/data/, src/engine/, src/theme/.
// Persistence key: modu.tpo.v1 (ADR-0011 local-first).
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Public types — canonical definitions for the TPO store layer.
// i18n + engine modules intentionally re-declare LocaleId locally to remain
// domain-agnostic (see PROGRESS.md architecture note).
// ---------------------------------------------------------------------------
export type LocaleId = 'ko' | 'en' | 'ja' | 'de' | 'ar';
export type RoleId =
  | 'self'
  | 'partner'
  | 'parent'
  | 'child'
  | 'guardian'
  | 'project_lead'
  | 'clinician';

export interface PersistedTPO {
  readonly locale: LocaleId;
  readonly placeId: string;
  readonly role: RoleId;
  readonly nowOverride: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const STORAGE_KEY = 'modu.tpo.v1';

export const DEFAULTS: PersistedTPO = {
  locale: 'ko',
  placeId: 'kr_seoul',
  role: 'self',
  nowOverride: null,
};

export const VALID_LOCALES: ReadonlySet<LocaleId> = new Set<LocaleId>([
  'ko', 'en', 'ja', 'de', 'ar',
]);

export const VALID_ROLES: ReadonlySet<RoleId> = new Set<RoleId>([
  'self', 'partner', 'parent', 'child', 'guardian', 'project_lead', 'clinician',
]);

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------
export function isValidIsoDate(iso: string): boolean {
  return new Date(iso).toString() !== 'Invalid Date';
}

function logWarn(op: string, payload: Record<string, unknown>): void {
  console.warn(JSON.stringify({ level: 'warn', scope: 'tpoStore', op, ...payload }));
}

function logError(op: string, error: unknown): void {
  console.warn(JSON.stringify({ level: 'error', scope: 'tpoStore', op, error: String(error) }));
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
export async function persistSnapshot(snapshot: PersistedTPO): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    logError('persist', err);
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logError('reset', err);
  }
}

export interface LoadResult {
  readonly snapshot: PersistedTPO;
}

/**
 * Load persisted TPO snapshot. Always resolves to a valid PersistedTPO —
 * corrupt JSON, missing key, or invalid shape all fall back to DEFAULTS.
 * Startup resilience: never throws.
 */
export async function loadSnapshot(): Promise<LoadResult> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { snapshot: DEFAULTS };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      logWarn('initTPOStore', { msg: 'corrupt JSON in storage — using defaults' });
      return { snapshot: DEFAULTS };
    }

    if (!parsed || typeof parsed !== 'object') {
      return { snapshot: DEFAULTS };
    }

    const p = parsed as Partial<PersistedTPO>;
    return {
      snapshot: {
        locale: isLocaleId(p.locale) ? p.locale : DEFAULTS.locale,
        placeId: typeof p.placeId === 'string' && p.placeId ? p.placeId : DEFAULTS.placeId,
        role: isRoleId(p.role) ? p.role : DEFAULTS.role,
        nowOverride:
          typeof p.nowOverride === 'string' && isValidIsoDate(p.nowOverride)
            ? p.nowOverride
            : null,
      },
    };
  } catch (err) {
    logWarn('initTPOStore', { msg: 'unexpected error — using defaults', error: String(err) });
    return { snapshot: DEFAULTS };
  }
}

// ---------------------------------------------------------------------------
// Type guards — narrow `unknown` without `as` casts at call sites.
// ---------------------------------------------------------------------------
export function isLocaleId(v: unknown): v is LocaleId {
  return typeof v === 'string' && VALID_LOCALES.has(v as LocaleId);
}

export function isRoleId(v: unknown): v is RoleId {
  return typeof v === 'string' && VALID_ROLES.has(v as RoleId);
}

export { logWarn };
