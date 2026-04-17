// Repository abstraction for sync-ready entities.
//
// Per ADR-0013 Addendum A4 every data access goes through a Repository
// implementation instead of talking to AsyncStorage / zustand persist
// directly. ADR-0011 Addendum keeps v1 as local-first, so the only live
// implementation here is LocalAssetRepository. When cloud sync is wired
// up (post-bonding, ADR-0011 Addendum) a CloudAssetRepository can
// implement the same interface and be composed on top of the local
// store.

import type { Asset, Syncable } from '../../types';

/**
 * Generic contract for syncable entity storage. Implementations must be
 * deterministic with respect to `id` and must preserve `updatedAt` and
 * `syncedAt` as provided by callers.
 */
export interface Repository<T extends Syncable> {
  /** Return every entity currently known to the repository. */
  list(): Promise<T[]>;
  /** Fetch a single entity by id, or null if not present. */
  get(id: string): Promise<T | null>;
  /** Insert or replace. Callers are responsible for bumping `updatedAt`. */
  put(entity: T): Promise<void>;
  /** Hard-delete (v1 unused — chapters archive instead of deleting). */
  remove(id: string): Promise<void>;
}

/** Asset-specific repository surface. Extend here as queries emerge. */
export interface AssetRepository extends Repository<Asset> {
  /** Active chapters only. Excludes archived. */
  listActive(): Promise<Asset[]>;
}
