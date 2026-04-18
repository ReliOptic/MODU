import { resolveTPO } from '../../../src/adapters/assetToTPO';
import type { TPOInputState } from '../../../src/adapters/assetToTPO';
import type { Asset } from '../../../src/types/asset';
import { mockAssets } from '../../../src/data/mock/assets';
import { hourToTimeOfDay } from '../../../src/engine/tpo';

const fertilityAsset = mockAssets.find((a) => a.type === 'fertility')!;
const cancerAsset = mockAssets.find((a) => a.type === 'cancer_caregiver')!;

const baseState: TPOInputState = {
  locale: 'ko',
  placeId: 'kr_seoul',
  role: null,
  nowOverride: null,
};

describe('resolveTPO', () => {
  it('fertility asset, locale ko, now 9am UTC → role self, assetKey fertility, non-empty copy', () => {
    const now = new Date('2026-04-18T09:00:00Z');
    const asset: Asset = { ...fertilityAsset, events: [] };
    const result = resolveTPO(asset, baseState, now);

    const expectedTOD = hourToTimeOfDay(now.getHours());
    expect(result.timeOfDay).toBe(expectedTOD);
    expect(result.role).toBe('self');
    expect(result.assetKey).toBe('fertility');
    expect(typeof result.copy.heroWord).toBe('string');
    expect(result.copy.heroWord.length).toBeGreaterThan(0);
    expect(result.locale).toBe('ko');
    expect(result.placeId).toBe('kr_seoul');
  });

  it('role override wins regardless of asset type', () => {
    const now = new Date('2026-04-18T09:00:00Z');
    const state: TPOInputState = { ...baseState, role: 'partner' };
    const result = resolveTPO(cancerAsset, state, now);
    expect(result.role).toBe('partner');
  });

  it('nowOverride ISO string overrides timeOfDay', () => {
    const realNow = new Date('2026-04-18T09:00:00Z');
    const overrideIso = '2026-04-18T22:00:00Z';
    const state: TPOInputState = { ...baseState, nowOverride: overrideIso };
    const asset: Asset = { ...fertilityAsset, events: [] };
    const result = resolveTPO(asset, state, realNow);

    const expectedTOD = hourToTimeOfDay(new Date(overrideIso).getHours());
    expect(result.timeOfDay).toBe(expectedTOD);
    const realTOD = hourToTimeOfDay(realNow.getHours());
    expect(result.timeOfDay).not.toBe(realTOD);
  });

  it('invalid nowOverride falls back to real now', () => {
    const now = new Date('2026-04-18T09:00:00Z');
    const state: TPOInputState = { ...baseState, nowOverride: 'garbage' };
    const asset: Asset = { ...fertilityAsset, events: [] };
    const result = resolveTPO(asset, state, now);

    const expectedTOD = hourToTimeOfDay(now.getHours());
    expect(result.timeOfDay).toBe(expectedTOD);
  });
});
