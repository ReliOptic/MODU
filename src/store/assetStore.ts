// Asset state — Zustand.
// Surface: switchAsset / createAsset / archiveAsset + currentAssetId.
//
// Cold start: empty list. The first user enters Formation → a first
// chapter is born. Demo seed: process.env.EXPO_PUBLIC_SEED_DEMO === '1'
// (or DEMO_MODE) preloads three mock chapters for investor demos.
//
// Persistence: per ADR-0013 Addendum A4 + ADR-0011 Addendum, every
// entity carries `updatedAt` and `syncedAt`. The persist layer bumps
// from v1 to v2 by backfilling those fields for users upgrading from
// the old schema.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset, AssetType, FormationData } from '../types';
import { assetTemplates } from '../data/assetTemplates';
import { mockAssets } from '../data/mock/assets';
import { uuid, nowIso } from '../lib/ids';

// Demo seed: 명시적 SEED_DEMO 또는 DEMO_MODE 둘 중 하나면 mock 활성
// (투자자 시연 시 demo mode 만 켜도 mock asset 3개 자동 채워짐)
const SEED_DEMO =
  process.env.EXPO_PUBLIC_SEED_DEMO === '1' ||
  process.env.EXPO_PUBLIC_DEMO_MODE === '1';

export interface AssetStore {
  assets: Asset[];
  currentAssetId: string | null;
  /** 에셋 ID로 전환. 존재하지 않으면 no-op. */
  switchAsset: (id: string) => void;
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
  ) => Asset;
  /** status 'archived'로 변경. 데이터 보존. */
  archiveAsset: (id: string) => void;
  /** 현재 active 에셋만 반환 (archived 제외) */
  getActiveAssets: () => Asset[];
  /** 현재 에셋 객체 반환 */
  getCurrent: () => Asset | null;
}

const initialAssets: Asset[] = SEED_DEMO ? mockAssets : [];

// ADR-0011 Local-First Persistence: AsyncStorage on native, localStorage on web.
// 사용자 데이터는 디바이스에 primary, cloud sync 는 옵션.
export const useAssetStore = create<AssetStore>()(persist(
  (set, get) => ({
  assets: initialAssets,
  currentAssetId: initialAssets[0]?.id ?? null,

  switchAsset: (id) => {
    const exists = get().assets.find((a) => a.id === id);
    if (!exists) return;
    const now = nowIso();
    set((s) => ({
      currentAssetId: id,
      assets: s.assets.map((a) =>
        a.id === id ? { ...a, lastActiveAt: now, updatedAt: now } : a
      ),
    }));
  },

  createAsset: (type, formationData, options) => {
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
    set((s) => ({
      assets: [...s.assets, asset],
      currentAssetId: asset.id,
    }));
    return asset;
  },

  archiveAsset: (id) => {
    set((s) => {
      const now = nowIso();
      const next = s.assets.map((a) =>
        a.id === id ? { ...a, status: 'archived' as const, updatedAt: now } : a
      );
      const current = s.currentAssetId === id
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
  }),
  {
    name: 'modu.assets.v1',
    storage: createJSONStorage(() => AsyncStorage),
    version: 2,
    /** Functions are auto-stripped; archived chapters are preserved (the library compounds). */
    partialize: (s) => ({ assets: s.assets, currentAssetId: s.currentAssetId }),
    /**
     * v1 → v2: backfill sync-ready fields on every chapter. Older records
     * created before ADR-0013 Addendum A4 lack `updatedAt` / `syncedAt`;
     * use `lastActiveAt` (or `createdAt`) as the best approximation of
     * the last time we knew the record was current.
     */
    migrate: (persistedState, version) => {
      const s = (persistedState ?? {}) as { assets?: Asset[]; currentAssetId?: string | null };
      if (version < 2) {
        const assets = (s.assets ?? []).map((a) => ({
          ...a,
          updatedAt: a.updatedAt ?? a.lastActiveAt ?? a.createdAt ?? nowIso(),
          syncedAt: a.syncedAt ?? null,
        }));
        return { ...s, assets };
      }
      return s;
    },
    /** If rehydrate finds an empty store and SEED_DEMO is on, seed mocks once. */
    onRehydrateStorage: () => (state) => {
      if (state && state.assets.length === 0 && SEED_DEMO) {
        state.assets = mockAssets;
        state.currentAssetId = mockAssets[0]?.id ?? null;
      }
    },
  }
));
