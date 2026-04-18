// tpoStore 단위 테스트 — initTPOStore / setLocale / setRole / setNowOverride / reset
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Helpers: import store lazily (matches assetStore.test.ts pattern)
// ---------------------------------------------------------------------------
let useTPOStore: typeof import('../store/tpoStore').useTPOStore;
let initTPOStore: typeof import('../store/tpoStore').initTPOStore;
let _resetInitFlag: typeof import('../store/tpoStore')._resetInitFlag;

const STORAGE_KEY = 'modu.tpo.v1';

beforeAll(() => {
  const mod = require('../store/tpoStore');
  useTPOStore = mod.useTPOStore;
  initTPOStore = mod.initTPOStore;
  _resetInitFlag = mod._resetInitFlag;
});

beforeEach(() => {
  // Reset Zustand state to defaults + uninitialized
  useTPOStore.setState({
    locale: 'ko',
    placeId: 'kr_seoul',
    role: 'self',
    nowOverride: null,
    initialized: false,
  });
  _resetInitFlag();
  // Clear AsyncStorage mock calls
  (AsyncStorage.getItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock).mockClear();
  (AsyncStorage.removeItem as jest.Mock).mockClear();
  // Default: no persisted data
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('tpoStore', () => {
  // --- Default state ---
  it('default state before init: correct values, initialized=false', () => {
    const s = useTPOStore.getState();
    expect(s.locale).toBe('ko');
    expect(s.placeId).toBe('kr_seoul');
    expect(s.role).toBe('self');
    expect(s.nowOverride).toBeNull();
    expect(s.initialized).toBe(false);
  });

  // --- initTPOStore with empty storage ---
  it('initTPOStore with empty storage → sets initialized=true, defaults intact', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await initTPOStore();

    const s = useTPOStore.getState();
    expect(s.initialized).toBe(true);
    expect(s.locale).toBe('ko');
    expect(s.placeId).toBe('kr_seoul');
    expect(s.role).toBe('self');
    expect(s.nowOverride).toBeNull();
  });

  // --- initTPOStore with pre-populated key ---
  it('initTPOStore with pre-populated key → restores values', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ locale: 'en', placeId: 'us_nyc', role: 'clinician', nowOverride: null })
    );

    await initTPOStore();

    const s = useTPOStore.getState();
    expect(s.initialized).toBe(true);
    expect(s.locale).toBe('en');
    expect(s.placeId).toBe('us_nyc');
    expect(s.role).toBe('clinician');
  });

  // --- initTPOStore with corrupt JSON ---
  it('initTPOStore with corrupt JSON → falls back to defaults, initialized=true', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not-valid-json{{{');

    await initTPOStore();

    const s = useTPOStore.getState();
    expect(s.initialized).toBe(true);
    expect(s.locale).toBe('ko');
    expect(s.placeId).toBe('kr_seoul');
    expect(s.role).toBe('self');
  });

  // --- initTPOStore idempotent ---
  it('initTPOStore is idempotent (guard)', async () => {
    await initTPOStore();
    // second call must be no-op
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ locale: 'ja', placeId: 'jp_tokyo', role: 'partner', nowOverride: null })
    );
    await initTPOStore();

    // First call won (null storage → defaults)
    expect(useTPOStore.getState().locale).toBe('ko');
  });

  // --- setLocale valid ---
  it('setLocale("en") → state updates + AsyncStorage.setItem called with locale=en', async () => {
    await useTPOStore.getState().setLocale('en');

    expect(useTPOStore.getState().locale).toBe('en');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"locale":"en"')
    );
  });

  // --- setLocale invalid ---
  it('setLocale with invalid value → state unchanged, no setItem', async () => {
    await useTPOStore.getState().setLocale('invalid' as 'ko');

    expect(useTPOStore.getState().locale).toBe('ko');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  // --- setRole valid ---
  it('setRole("guardian") → state updates + persists', async () => {
    await useTPOStore.getState().setRole('guardian');

    expect(useTPOStore.getState().role).toBe('guardian');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"role":"guardian"')
    );
  });

  // --- setRole invalid ---
  it('setRole with invalid value → state unchanged', async () => {
    await useTPOStore.getState().setRole('admin' as 'self');

    expect(useTPOStore.getState().role).toBe('self');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  // --- setPlaceId ---
  it('setPlaceId("jp_osaka") → state updates + persists', async () => {
    await useTPOStore.getState().setPlaceId('jp_osaka');

    expect(useTPOStore.getState().placeId).toBe('jp_osaka');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"placeId":"jp_osaka"')
    );
  });

  // --- setNowOverride valid ---
  it('setNowOverride with valid ISO → state updates + persists', async () => {
    const iso = '2026-04-18T09:00:00Z';
    await useTPOStore.getState().setNowOverride(iso);

    expect(useTPOStore.getState().nowOverride).toBe(iso);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"nowOverride":"2026-04-18T09:00:00Z"')
    );
  });

  // --- setNowOverride invalid ---
  it('setNowOverride with invalid date string → no-op, state unchanged', async () => {
    await useTPOStore.getState().setNowOverride('not-a-date');

    expect(useTPOStore.getState().nowOverride).toBeNull();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  // --- setNowOverride null clears override ---
  it('setNowOverride(null) → clears override, persists', async () => {
    // Seed a value first
    useTPOStore.setState({ nowOverride: '2026-04-18T09:00:00Z' });
    (AsyncStorage.setItem as jest.Mock).mockClear();

    await useTPOStore.getState().setNowOverride(null);

    expect(useTPOStore.getState().nowOverride).toBeNull();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"nowOverride":null')
    );
  });

  // --- reset ---
  it('reset() → state back to defaults, AsyncStorage.removeItem called', async () => {
    useTPOStore.setState({ locale: 'de', placeId: 'de_berlin', role: 'clinician' });

    await useTPOStore.getState().reset();

    const s = useTPOStore.getState();
    expect(s.locale).toBe('ko');
    expect(s.placeId).toBe('kr_seoul');
    expect(s.role).toBe('self');
    expect(s.nowOverride).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });
});
