// Local implementation of AssetRepository.
//
// v1 persists to AsyncStorage under a stable namespaced key. This is the
// only production implementation in v1 per ADR-0011 (local-first). The
// repository is deliberately thin: it owns serialization and the storage
// key, nothing else. assetStore layers an in-memory cache on top.
//
// Concurrency: put/remove are write operations that perform read→mutate→write.
// They are serialized via withKeyLock to prevent write-loss under parallel
// mutation (e.g. concurrent createAsset + switchAsset).
// list/get/listActive are read-only and intentionally lock-free; they return
// the state as of the last completed write. AsyncStorage.setItem is assumed
// atomic at the OS level (Option A per ADR-0011 revision).

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset } from '../../types';
import type { AssetRepository } from './ChapterRepository';
import { withKeyLock } from '../../lib/asyncStorageMutex';

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
      return withKeyLock(STORAGE_KEY, async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const all = parseAssets(raw);
        const idx = all.findIndex((a) => a.id === entity.id);
        if (idx >= 0) {
          all[idx] = entity;
        } else {
          all.push(entity);
        }
        await writeAll(all);
      });
    },

    async remove(id) {
      return withKeyLock(STORAGE_KEY, async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const all = parseAssets(raw);
        await writeAll(all.filter((a) => a.id !== id));
      });
    },
  };
}

/** Exported for tests and one-off migrations. */
export const LOCAL_ASSETS_STORAGE_KEY = STORAGE_KEY;
