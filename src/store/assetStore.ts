// Asset state — Zustand (no persist middleware).
// Single source of truth: LocalAssetRepository.
//
// Boot flow:
//   1. App.tsx calls initAssetStore() once on mount.
//   2. initAssetStore() runs one-time legacy migration from 'modu.assets.v1'
//      (zustand persist key), then loads from repo → sets state.
//   3. All mutations write to repo first (durable), then update Zustand state.
//
// Demo seed: EXPO_PUBLIC_SEED_DEMO === '1' pre-seeds the repo with mockAssets.
// Silent drop is prohibited — failures log a warning and rethrow.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset, AssetType, FormationData } from '../types';
import { assetTemplates } from '../data/assetTemplates';
import { mockAssets } from '../data/mock/assets';
import { uuid, nowIso } from '../lib/ids';
import { createLocalAssetRepository } from '../data/repositories/LocalAssetRepository';
import type { AssetRepository } from '../data/repositories/ChapterRepository';
import { emit } from '../lib/events';

// ---------------------------------------------------------------------------
// Internal singleton — replaceable in tests via _setRepository().
// ---------------------------------------------------------------------------
let _repo: AssetRepository = createLocalAssetRepository();

/** @internal test-only injection hook */
export function _setRepository(repo: AssetRepository): void {
  _repo = repo;
}

// ---------------------------------------------------------------------------
// Demo seed flag
// ---------------------------------------------------------------------------
const SEED_DEMO =
  process.env.EXPO_PUBLIC_SEED_DEMO === '1' ||
  process.env.EXPO_PUBLIC_DEMO_MODE === '1';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
export interface AssetStore {
  assets: Asset[];
  currentAssetId: string | null;
  /** true after initAssetStore() resolves. Use to gate loading UI. */
  initialized: boolean;

  /** 에셋 ID로 전환. 존재하지 않으면 no-op. */
  switchAsset: (id: string) => Promise<void>;
  /** Formation/Demo 완료 시 호출. 새 에셋 추가 + currentAssetId 설정.
   * options 로 template 의 모든 항목을 override 가능 (Hyperpersonalize Studio 용). */
  createAsset: (
    type: AssetType,
    formationData: FormationData,
    options?: {
      displayName?: string;
      photoUri?: string;
      palette?: import('../theme').PaletteKey;
      tabs?: import('../types').TabConfig[];
      widgets?: import('../types').WidgetConfig[];
      events?: import('../types').ScheduledEvent[];
    }
  ) => Promise<Asset>;
  /** status 'archived'로 변경. 데이터 보존. */
  archiveAsset: (id: string) => Promise<void>;
  /** 현재 active 에셋만 반환 (archived 제외) */
  getActiveAssets: () => Asset[];
  /** 현재 에셋 객체 반환 */
  getCurrent: () => Asset | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useAssetStore = create<AssetStore>()((set, get) => ({
  assets: [],
  currentAssetId: null,
  initialized: false,

  switchAsset: async (id) => {
    const exists = get().assets.find((a) => a.id === id);
    if (!exists) return;
    const now = nowIso();
    const switched = { ...exists, lastActiveAt: now, updatedAt: now };
    try {
      await _repo.put(switched);
    } catch (err) {
      console.warn('[assetStore] switchAsset repo.put failed', err);
      throw err;
    }
    const fromId = get().currentAssetId ?? undefined;
    emit('chapter_switched', { from_asset_id: fromId, to_asset_id: id });
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? switched : a)),
      currentAssetId: id,
    }));
  },

  createAsset: async (type, formationData, options) => {
    const t = assetTemplates[type];
    const now = nowIso();
    const asset: Asset = {
      id: uuid(),
      type,
      displayName: options?.displayName ?? t.defaultDisplayName,
      palette: options?.palette ?? t.palette,
      tabs: options?.tabs ?? t.tabs,
      widgets: options?.widgets ?? t.widgets,
      layoutRules: [],
      formationData,
      status: 'active',
      createdAt: now,
      lastActiveAt: now,
      updatedAt: now,
      syncedAt: null,
      photoUri: options?.photoUri,
      events: options?.events,
    };
    try {
      await _repo.put(asset);
    } catch (err) {
      console.warn('[assetStore] createAsset repo.put failed', err);
      throw err;
    }
    emit('chapter_created', { type: asset.type as import('../types/events').ChapterType });
    set((s) => ({ assets: [...s.assets, asset], currentAssetId: asset.id }));
    return asset;
  },

  archiveAsset: async (id) => {
    const existing = get().assets.find((a) => a.id === id);
    if (!existing) return;
    const now = nowIso();
    const archived = { ...existing, status: 'archived' as const, updatedAt: now };
    try {
      await _repo.put(archived);
    } catch (err) {
      console.warn('[assetStore] archiveAsset repo.put failed', err);
      throw err;
    }
    const createdMs = existing.createdAt ? new Date(existing.createdAt).getTime() : Date.now();
    const daysActive = Math.floor((Date.now() - createdMs) / 86_400_000);
    emit('chapter_archived', { days_active: daysActive });
    set((s) => {
      const next = s.assets.map((a) => (a.id === id ? archived : a));
      const current =
        s.currentAssetId === id
          ? next.find((a) => a.status === 'active')?.id ?? null
          : s.currentAssetId;
      return { assets: next, currentAssetId: current };
    });
  },

  getActiveAssets: () => get().assets.filter((a) => a.status !== 'archived'),

  getCurrent: () => {
    const { assets, currentAssetId } = get();
    return assets.find((a) => a.id === currentAssetId) ?? null;
  },
}));

// ---------------------------------------------------------------------------
// initAssetStore — call once on App mount
// ---------------------------------------------------------------------------
let _initStarted = false;

export async function initAssetStore(): Promise<void> {
  if (_initStarted) return;
  _initStarted = true;

  try {
    // --- One-time legacy migration from zustand persist key ---
    const LEGACY_KEY = 'modu.assets.v1';
    const MIGRATED_FLAG = 'modu.assets.migrated.v1';

    const alreadyMigrated = await AsyncStorage.getItem(MIGRATED_FLAG);
    if (!alreadyMigrated) {
      const raw = await AsyncStorage.getItem(LEGACY_KEY);
      if (raw) {
        try {
          // zustand persist wraps the state in { state: { assets, currentAssetId }, version }
          const parsed = JSON.parse(raw) as unknown;
          const legacyAssets: Asset[] = (() => {
            if (parsed && typeof parsed === 'object' && 'state' in parsed) {
              const s = (parsed as { state?: { assets?: Asset[] } }).state;
              return Array.isArray(s?.assets) ? s.assets : [];
            }
            if (Array.isArray(parsed)) return parsed as Asset[];
            return [];
          })();

          // Backfill sync-ready fields (v1→v2) and write to repo
          const now = nowIso();
          for (const a of legacyAssets) {
            const migrated: Asset = {
              ...a,
              updatedAt: a.updatedAt ?? a.lastActiveAt ?? a.createdAt ?? now,
              syncedAt: a.syncedAt ?? null,
            };
            await _repo.put(migrated);
          }
        } catch (err) {
          // Corrupted legacy data — log and skip, do not block boot
          console.warn('[assetStore] legacy migration failed', err);
        }
      }
      await AsyncStorage.removeItem(LEGACY_KEY);
      await AsyncStorage.setItem(MIGRATED_FLAG, 'true');
    }

    // --- Demo seed (only if repo is still empty) ---
    if (SEED_DEMO) {
      const existing = await _repo.list();
      if (existing.length === 0) {
        for (const a of mockAssets) {
          await _repo.put(a);
        }
      }
    }

    // --- Load from repo → set state ---
    const assets = await _repo.list();
    useAssetStore.setState({
      assets,
      currentAssetId: assets.find((a) => a.status === 'active')?.id ?? assets[0]?.id ?? null,
      initialized: true,
    });
  } catch (err) {
    // Allow retry on next call
    _initStarted = false;
    throw err;
  }
}

/** @internal reset init guard — test use only */
export function _resetInitFlag(): void {
  _initStarted = false;
}
