// 에셋 상태 관리 — Zustand
// switchAsset/createAsset/archiveAsset + currentAssetId 트래킹
//
// 기본 동작: 빈 배열로 시작. 첫 사용자는 Formation 으로 진입 → 첫 챕터 birth.
// 데모 시드: process.env.EXPO_PUBLIC_SEED_DEMO === '1' 일 때만 mock 3개 미리 채움.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset, AssetType, FormationData } from '../types';
import { assetTemplates } from '../data/assetTemplates';
import { mockAssets } from '../data/mock/assets';

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
    set((s) => ({
      currentAssetId: id,
      assets: s.assets.map((a) =>
        a.id === id ? { ...a, lastActiveAt: new Date().toISOString() } : a
      ),
    }));
  },

  createAsset: (type, formationData, options) => {
    const t = assetTemplates[type];
    const now = new Date().toISOString();
    const asset: Asset = {
      id: `a-${type}-${Date.now()}`,
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
      const next = s.assets.map((a) => (a.id === id ? { ...a, status: 'archived' as const } : a));
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
    version: 1,
    /** 함수는 자동 제외, 데이터만 직렬화. archived 도 보존 (라이브러리 복리). */
    partialize: (s) => ({ assets: s.assets, currentAssetId: s.currentAssetId }),
    /** rehydrate 후 store 가 비었고 SEED_DEMO 켜져있으면 mock 시드 1회 주입 */
    onRehydrateStorage: () => (state) => {
      if (state && state.assets.length === 0 && SEED_DEMO) {
        state.assets = mockAssets;
        state.currentAssetId = mockAssets[0]?.id ?? null;
      }
    },
  }
));
