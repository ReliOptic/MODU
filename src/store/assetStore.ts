// 에셋 상태 관리 — Zustand
// switchAsset/createAsset/archiveAsset + currentAssetId 트래킹
import { create } from 'zustand';
import type { Asset, AssetType, FormationData } from '../types';
import { assetTemplates } from '../data/assetTemplates';
import { mockAssets } from '../data/mock/assets';

export interface AssetStore {
  assets: Asset[];
  currentAssetId: string | null;
  /** 에셋 ID로 전환. 존재하지 않으면 no-op. */
  switchAsset: (id: string) => void;
  /** Formation 완료 시 호출. 새 에셋 추가 + currentAssetId 설정. */
  createAsset: (
    type: AssetType,
    formationData: FormationData,
    options?: { displayName?: string; photoUri?: string }
  ) => Asset;
  /** status 'archived'로 변경. 데이터 보존. */
  archiveAsset: (id: string) => void;
  /** 현재 active 에셋만 반환 (archived 제외) */
  getActiveAssets: () => Asset[];
  /** 현재 에셋 객체 반환 */
  getCurrent: () => Asset | null;
}

const initialAssets = mockAssets;

export const useAssetStore = create<AssetStore>((set, get) => ({
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
      palette: t.palette,
      tabs: t.tabs,
      widgets: t.widgets,
      layoutRules: [],
      formationData,
      status: 'active',
      createdAt: now,
      lastActiveAt: now,
      photoUri: options?.photoUri,
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
}));
