// TPO (Time-Place-Occasion) store — Zustand v5, manual AsyncStorage persistence.
// Domain-agnostic: no imports from src/types/asset.ts, src/data/, src/engine/, src/theme/.
// Local-first (ADR-0011). See tpo-persistence.ts for storage layer.
import { create } from 'zustand';
import {
  DEFAULTS,
  clearSnapshot,
  isLocaleId,
  isRoleId,
  isValidIsoDate,
  isVariationId,
  loadSnapshot,
  logWarn,
  persistSnapshot,
  type LocaleId,
  type PersistedTPO,
  type RoleId,
  type VariationId,
} from './tpo-persistence';

export type { LocaleId, RoleId, VariationId, PersistedTPO } from './tpo-persistence';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
export interface TPOState {
  readonly locale: LocaleId;
  readonly placeId: string;
  readonly role: RoleId;
  /** Manual now-override for demos/previews. ISO string. null = use real time. */
  readonly nowOverride: string | null;
  /** Active home renderer variation. Persisted across sessions. */
  readonly variationId: VariationId;
  /** true after initTPOStore() resolves. */
  readonly initialized: boolean;

  setLocale: (id: LocaleId) => Promise<void>;
  setPlaceId: (id: string) => Promise<void>;
  setRole: (id: RoleId) => Promise<void>;
  setNowOverride: (iso: string | null) => Promise<void>;
  setVariationId: (id: VariationId) => Promise<void>;
  /** Reset to defaults + wipe persisted key. */
  reset: () => Promise<void>;
}

function toSnapshot(state: TPOState): PersistedTPO {
  return {
    locale: state.locale,
    placeId: state.placeId,
    role: state.role,
    nowOverride: state.nowOverride,
    variationId: state.variationId,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useTPOStore = create<TPOState>()((set, get) => ({
  ...DEFAULTS,
  initialized: false,

  setLocale: async (id) => {
    if (!isLocaleId(id)) {
      logWarn('setLocale', { invalid: id });
      return;
    }
    set({ locale: id });
    await persistSnapshot(toSnapshot(get()));
  },

  setPlaceId: async (id) => {
    if (!id || typeof id !== 'string') {
      logWarn('setPlaceId', { invalid: id });
      return;
    }
    set({ placeId: id });
    await persistSnapshot(toSnapshot(get()));
  },

  setRole: async (id) => {
    if (!isRoleId(id)) {
      logWarn('setRole', { invalid: id });
      return;
    }
    set({ role: id });
    await persistSnapshot(toSnapshot(get()));
  },

  setNowOverride: async (iso) => {
    if (iso !== null && !isValidIsoDate(iso)) {
      logWarn('setNowOverride', { invalid: iso });
      return;
    }
    set({ nowOverride: iso });
    await persistSnapshot(toSnapshot(get()));
  },

  setVariationId: async (id) => {
    if (!isVariationId(id)) {
      logWarn('setVariationId', { invalid: id });
      return;
    }
    set({ variationId: id });
    await persistSnapshot(toSnapshot(get()));
  },

  reset: async () => {
    set({ ...DEFAULTS });
    await clearSnapshot();
  },
}));

// ---------------------------------------------------------------------------
// initTPOStore — call once on App mount
// ---------------------------------------------------------------------------
let _initStarted = false;

export async function initTPOStore(): Promise<void> {
  if (_initStarted) return;
  _initStarted = true;

  const { snapshot } = await loadSnapshot();
  useTPOStore.setState({ ...snapshot, initialized: true });
}

/** @internal reset init guard — test use only */
export function _resetInitFlag(): void {
  _initStarted = false;
}
