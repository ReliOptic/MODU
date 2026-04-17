// LocalAssetRepository 동시성 테스트
//
// 케이스:
//  C1) Promise.all([put(a), put(b), remove(c.id)]) → 최종 3개 반영 확인
//  C2) 동일 asset.id 동시 put × 2 → length 1, latest wins

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalAssetRepository } from '../data/repositories/LocalAssetRepository';
import type { Asset } from '../types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  const id = overrides.id ?? `asset-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  return {
    id,
    type: 'chronic',
    displayName: 'Test Asset',
    palette: 'sage',
    tabs: [],
    widgets: [],
    layoutRules: [],
    formationData: { responses: {} },
    status: 'active',
    createdAt: now,
    lastActiveAt: now,
    updatedAt: now,
    syncedAt: null,
    ...overrides,
  } as Asset;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LocalAssetRepository — 동시성', () => {
  it('C1: Promise.all([put(a), put(b), remove(c.id)]) → 최종 3개 반영', async () => {
    const repo = createLocalAssetRepository();

    // pre-seed: c 는 삭제 대상
    const c = makeAsset({ id: 'asset-c' });
    await repo.put(c);

    const a = makeAsset({ id: 'asset-a' });
    const b = makeAsset({ id: 'asset-b' });

    // concurrent: put a, put b, remove c — all at once
    await Promise.all([repo.put(a), repo.put(b), repo.remove(c.id)]);

    const all = await repo.list();
    const ids = all.map((x) => x.id).sort();

    expect(ids).toContain('asset-a');
    expect(ids).toContain('asset-b');
    expect(ids).not.toContain('asset-c');
    expect(all).toHaveLength(2);
  });

  it('C2: 동일 asset.id concurrent put × 2 → length 1, latest wins', async () => {
    const repo = createLocalAssetRepository();
    const id = 'asset-dup';

    const first = makeAsset({ id, displayName: 'first' });
    const second = makeAsset({ id, displayName: 'second' });

    // Stagger microscopically so "second" is submitted after "first"
    // withKeyLock serializes: whichever enqueues second runs last → wins.
    const p1 = repo.put(first);
    const p2 = repo.put(second);
    await Promise.all([p1, p2]);

    const all = await repo.list();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(id);
    // second was enqueued after first → second wins
    expect(all[0].displayName).toBe('second');
  });
});
