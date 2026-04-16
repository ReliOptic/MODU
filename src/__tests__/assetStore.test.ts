// assetStore 단위 테스트 — switchAsset/createAsset/archiveAsset
import { useAssetStore } from '../store/assetStore';

beforeEach(() => {
  // store 리셋
  useAssetStore.setState((s) => {
    const first = s.assets[0];
    return { currentAssetId: first?.id ?? null };
  });
});

describe('assetStore', () => {
  it('initial state has mock assets and a current id', () => {
    const s = useAssetStore.getState();
    expect(s.assets.length).toBeGreaterThanOrEqual(2);
    expect(s.currentAssetId).not.toBeNull();
  });

  it('switchAsset updates currentAssetId (T-SW-06)', () => {
    const second = useAssetStore.getState().assets[1];
    useAssetStore.getState().switchAsset(second.id);
    expect(useAssetStore.getState().currentAssetId).toBe(second.id);
  });

  it('switchAsset to unknown id is no-op', () => {
    const before = useAssetStore.getState().currentAssetId;
    useAssetStore.getState().switchAsset('nope');
    expect(useAssetStore.getState().currentAssetId).toBe(before);
  });

  it('createAsset adds new asset and switches to it (T-FM-06)', () => {
    const before = useAssetStore.getState().assets.length;
    const a = useAssetStore.getState().createAsset('chronic', { responses: { step_01: 'chronic' } });
    expect(useAssetStore.getState().assets.length).toBe(before + 1);
    expect(useAssetStore.getState().currentAssetId).toBe(a.id);
    expect(a.palette).toBe('sage');
  });

  it('archiveAsset preserves data and reassigns current (T-DB-04)', () => {
    const target = useAssetStore.getState().assets[0];
    useAssetStore.getState().archiveAsset(target.id);
    const updated = useAssetStore.getState().assets.find((x) => x.id === target.id);
    expect(updated?.status).toBe('archived');
    // current는 다른 active asset으로 이동했어야 함
    expect(useAssetStore.getState().currentAssetId).not.toBe(target.id);
  });
});
