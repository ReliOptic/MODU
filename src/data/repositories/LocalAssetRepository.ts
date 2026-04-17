// Local implementation of AssetRepository.
//
// v1 persists to AsyncStorage under a stable namespaced key. This is the
// only production implementation in v1 per ADR-0011 (local-first). The
// repository is deliberately thin: it owns serialization and the storage
// key, nothing else. assetStore layers an in-memory cache on top.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset } from '../../types';
import type { AssetRepository } from './ChapterRepository';

const STORAGE_KEY = 'modu.repository.assets.v1';

function parseAssets(raw: string | null): Asset[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Asset[]) : [];
  } catch {
    // Corrupted payload — drop to empty rather than crashing the app.
    return [];
  }
}

async function writeAll(assets: Asset[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export function createLocalAssetRepository(): AssetRepository {
  return {
    async list() {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return parseAssets(raw);
    },

    async listActive() {
      const all = await this.list();
      return all.filter((a) => a.status !== 'archived');
    },

    async get(id) {
      const all = await this.list();
      return all.find((a) => a.id === id) ?? null;
    },

    async put(entity) {
      const all = await this.list();
      const idx = all.findIndex((a) => a.id === entity.id);
      if (idx >= 0) {
        all[idx] = entity;
      } else {
        all.push(entity);
      }
      await writeAll(all);
    },

    async remove(id) {
      const all = await this.list();
      await writeAll(all.filter((a) => a.id !== id));
    },
  };
}

/** Exported for tests and one-off migrations. */
export const LOCAL_ASSETS_STORAGE_KEY = STORAGE_KEY;
