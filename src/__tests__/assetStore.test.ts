// assetStore 단위 테스트 — initAssetStore / createAsset / switchAsset / archiveAsset
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockAssets } from '../data/mock/assets';
import type { AssetRepository } from '../data/repositories/ChapterRepository';
import type { Asset } from '../types';
import * as eventsModule from '../lib/events';

// ---------------------------------------------------------------------------
// Mock repo factory — in-memory, spy-wrapped
// ---------------------------------------------------------------------------
function makeMockRepo(initial: Asset[] = []): AssetRepository & {
  putSpy: jest.Mock;
} {
  const store = new Map<string, Asset>(initial.map((a) => [a.id, a]));
  const putSpy = jest.fn(async (entity: Asset) => {
    store.set(entity.id, entity);
  });
  return {
    list: async () => Array.from(store.values()),
    listActive: async () => Array.from(store.values()).filter((a) => a.status !== 'archived'),
    get: async (id) => store.get(id) ?? null,
    put: putSpy,
    remove: async (id) => { store.delete(id); },
    putSpy,
  };
}

// ---------------------------------------------------------------------------
// Helpers: import store lazily so _setRepository runs before store init
// ---------------------------------------------------------------------------
let useAssetStore: typeof import('../store/assetStore').useAssetStore;
let initAssetStore: typeof import('../store/assetStore').initAssetStore;
let _setRepository: typeof import('../store/assetStore')._setRepository;
let _resetInitFlag: typeof import('../store/assetStore')._resetInitFlag;

beforeAll(() => {
  // Import once — module is singleton
  const mod = require('../store/assetStore');
  useAssetStore = mod.useAssetStore;
  initAssetStore = mod.initAssetStore;
  _setRepository = mod._setRepository;
  _resetInitFlag = mod._resetInitFlag;
});

beforeEach(() => {
  // Reset Zustand state
  useAssetStore.setState({ assets: [], currentAssetId: null, initialized: false });
  // Reset init guard so initAssetStore can run again
  _resetInitFlag();
  // Clear AsyncStorage mock
  (AsyncStorage.clear as jest.Mock).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock).mockClear();
  (AsyncStorage.removeItem as jest.Mock).mockClear();
  // Default: no legacy data, not migrated
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('assetStore', () => {
  it('initAssetStore loads assets from repo and sets initialized=true', async () => {
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);

    await initAssetStore();

    const s = useAssetStore.getState();
    expect(s.initialized).toBe(true);
    expect(s.assets.length).toBe(mockAssets.length);
    expect(s.currentAssetId).not.toBeNull();
  });

  it('initAssetStore skips duplicate calls (guard)', async () => {
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);

    await initAssetStore();
    const countAfterFirst = useAssetStore.getState().assets.length;
    const idAfterFirst = useAssetStore.getState().currentAssetId;

    // second call — must be idempotent (no state mutation)
    await initAssetStore();

    expect(useAssetStore.getState().assets.length).toBe(countAfterFirst);
    expect(useAssetStore.getState().currentAssetId).toBe(idAfterFirst);
    expect(useAssetStore.getState().initialized).toBe(true);
  });

  it('initial state has mock assets and a current id (after init)', async () => {
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();

    const s = useAssetStore.getState();
    expect(s.assets.length).toBeGreaterThanOrEqual(2);
    expect(s.currentAssetId).not.toBeNull();
  });

  it('switchAsset updates currentAssetId and calls repo.put (T-SW-06)', async () => {
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();

    const second = useAssetStore.getState().assets[1];
    repo.putSpy.mockClear();

    await useAssetStore.getState().switchAsset(second.id);

    expect(useAssetStore.getState().currentAssetId).toBe(second.id);
    // repo.put must have been called with the updated asset
    expect(repo.putSpy).toHaveBeenCalledTimes(1);
    const putArg: Asset = repo.putSpy.mock.calls[0][0];
    expect(putArg.id).toBe(second.id);
  });

  it('switchAsset to unknown id is no-op', async () => {
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();

    const before = useAssetStore.getState().currentAssetId;
    repo.putSpy.mockClear();

    await useAssetStore.getState().switchAsset('nope');

    expect(useAssetStore.getState().currentAssetId).toBe(before);
    expect(repo.putSpy).not.toHaveBeenCalled();
  });

  it('createAsset adds new asset, switches to it, calls repo.put (T-FM-06)', async () => {
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();

    const before = useAssetStore.getState().assets.length;
    repo.putSpy.mockClear();

    const a = await useAssetStore.getState().createAsset('chronic', { responses: { step_01: 'chronic' } });

    expect(useAssetStore.getState().assets.length).toBe(before + 1);
    expect(useAssetStore.getState().currentAssetId).toBe(a.id);
    expect(a.palette).toBe('sage');
    // repo.put must have been called with the new asset
    expect(repo.putSpy).toHaveBeenCalledTimes(1);
    expect(repo.putSpy.mock.calls[0][0].id).toBe(a.id);
  });

  it('archiveAsset preserves data, reassigns current, calls repo.put (T-DB-04)', async () => {
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();

    const target = useAssetStore.getState().assets[0];
    repo.putSpy.mockClear();

    await useAssetStore.getState().archiveAsset(target.id);

    const updated = useAssetStore.getState().assets.find((x) => x.id === target.id);
    expect(updated?.status).toBe('archived');
    // current は다른 active asset으로 이동했어야 함
    expect(useAssetStore.getState().currentAssetId).not.toBe(target.id);
    // repo.put must have been called with archived asset
    expect(repo.putSpy).toHaveBeenCalledTimes(1);
    expect(repo.putSpy.mock.calls[0][0].status).toBe('archived');
  });

  it('one-time migration: imports legacy zustand persist payload and removes key', async () => {
    // Simulate zustand-persist format in AsyncStorage
    const legacyPayload = JSON.stringify({
      state: { assets: [mockAssets[0]], currentAssetId: mockAssets[0].id },
      version: 2,
    });
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'modu.assets.v1') return Promise.resolve(legacyPayload);
      return Promise.resolve(null); // MIGRATED_FLAG not set
    });

    const repo = makeMockRepo(); // empty repo
    _setRepository(repo);
    repo.putSpy.mockClear();

    await initAssetStore();

    // Legacy asset must have been written to repo
    expect(repo.putSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: mockAssets[0].id })
    );
    // Legacy key must be removed
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('modu.assets.v1');
    // Migration flag must be set
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('modu.assets.migrated.v1', 'true');
  });

  // ---------------------------------------------------------------------------
  // emit 연동 테스트 (Task #13) — jest.spyOn(eventsModule, 'emit') 기반
  // ---------------------------------------------------------------------------

  it('createAsset → chapter_created emit 호출 (T-EM-01)', async () => {
    const emitSpy = jest.spyOn(eventsModule, 'emit');
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();
    emitSpy.mockClear();

    await useAssetStore.getState().createAsset('chronic', { responses: { step_01: 'chronic' } });

    expect(emitSpy).toHaveBeenCalledWith('chapter_created', expect.objectContaining({ type: 'chronic' }));
    emitSpy.mockRestore();
  });

  it('switchAsset → chapter_switched emit 호출 (T-EM-02)', async () => {
    const emitSpy = jest.spyOn(eventsModule, 'emit');
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();
    emitSpy.mockClear();

    const second = useAssetStore.getState().assets[1];
    await useAssetStore.getState().switchAsset(second.id);

    expect(emitSpy).toHaveBeenCalledWith(
      'chapter_switched',
      expect.objectContaining({ to_asset_id: second.id })
    );
    emitSpy.mockRestore();
  });

  it('archiveAsset → chapter_archived emit 호출 (T-EM-03)', async () => {
    const emitSpy = jest.spyOn(eventsModule, 'emit');
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();
    emitSpy.mockClear();

    const target = useAssetStore.getState().assets[0];
    await useAssetStore.getState().archiveAsset(target.id);

    expect(emitSpy).toHaveBeenCalledWith(
      'chapter_archived',
      expect.objectContaining({ days_active: expect.any(Number) })
    );
    emitSpy.mockRestore();
  });

  it('archiveAsset with future createdAt → days_active clamped to 0 (T-EM-05)', async () => {
    const emitSpy = jest.spyOn(eventsModule, 'emit');
    // Asset with createdAt in the future (clock skew scenario)
    const futureAsset: Asset = {
      ...mockAssets[0],
      id: 'future-asset',
      createdAt: new Date(Date.now() + 86_400_000 * 5).toISOString(), // 5 days in future
    };
    const repo = makeMockRepo([futureAsset]);
    _setRepository(repo);
    await initAssetStore();
    emitSpy.mockClear();

    await useAssetStore.getState().archiveAsset('future-asset');

    const archivedCalls = emitSpy.mock.calls.filter((c) => c[0] === 'chapter_archived');
    expect(archivedCalls).toHaveLength(1);
    expect(archivedCalls[0][1]).toEqual(expect.objectContaining({ days_active: 0 }));
    emitSpy.mockRestore();
  });

  it('switchAsset with null currentAssetId → from_asset_id key absent in payload (T-EM-06)', async () => {
    const emitSpy = jest.spyOn(eventsModule, 'emit');
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();

    // Force currentAssetId to null
    useAssetStore.setState({ currentAssetId: null });
    emitSpy.mockClear();

    const target = useAssetStore.getState().assets[0];
    await useAssetStore.getState().switchAsset(target.id);

    const switchedCalls = emitSpy.mock.calls.filter((c) => c[0] === 'chapter_switched');
    expect(switchedCalls).toHaveLength(1);
    const payload = switchedCalls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('from_asset_id');
    expect(payload.to_asset_id).toBe(target.id);
    emitSpy.mockRestore();
  });

  it('switchAsset unknown id → emit 호출 없음 (T-EM-04)', async () => {
    const emitSpy = jest.spyOn(eventsModule, 'emit');
    const repo = makeMockRepo([...mockAssets]);
    _setRepository(repo);
    await initAssetStore();
    emitSpy.mockClear();

    await useAssetStore.getState().switchAsset('does-not-exist');

    const switchedCalls = emitSpy.mock.calls.filter((c) => c[0] === 'chapter_switched');
    expect(switchedCalls).toHaveLength(0);
    emitSpy.mockRestore();
  });

  it('initAssetStore failure: initialized stays false, _initStarted resets, retry succeeds', async () => {
    // First call: repo.list rejects → initAssetStore must throw and reset guard
    const failRepo: typeof import('../data/repositories/ChapterRepository').AssetRepository & {
      putSpy: jest.Mock;
    } = {
      list: jest.fn().mockRejectedValueOnce(new Error('storage failure')),
      listActive: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      remove: jest.fn(),
      putSpy: jest.fn(),
    };
    _setRepository(failRepo);

    await expect(initAssetStore()).rejects.toThrow('storage failure');

    // initialized must still be false
    expect(useAssetStore.getState().initialized).toBe(false);

    // Second call with healthy repo — must succeed (guard was reset)
    const goodRepo = makeMockRepo([...mockAssets]);
    _setRepository(goodRepo);

    await initAssetStore();

    expect(useAssetStore.getState().initialized).toBe(true);
    expect(useAssetStore.getState().assets.length).toBe(mockAssets.length);
  });
});
