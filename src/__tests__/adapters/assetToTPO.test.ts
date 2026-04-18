import {
  computeProximity,
  inferRole,
  mapAssetKey,
} from '../../../src/adapters/assetToTPO';
import type { Asset } from '../../../src/types/asset';
import type { ScheduledEvent } from '../../../src/types/event';
import { mockAssets } from '../../../src/data/mock/assets';

function makeEvent(
  overrides: Partial<ScheduledEvent> & { id: string; at: string; title: string },
): ScheduledEvent {
  return {
    type: 'injection',
    durationHours: 0,
    afterglowHours: 12,
    ...overrides,
  };
}

function offsetISO(fromNow: Date, hours: number): string {
  return new Date(fromNow.getTime() + hours * 3_600_000).toISOString();
}

const fertilityAsset = mockAssets.find((a) => a.type === 'fertility')!;
const cancerAsset = mockAssets.find((a) => a.type === 'cancer_caregiver')!;

describe('mapAssetKey', () => {
  it('maps fertility → fertility', () => {
    expect(mapAssetKey('fertility')).toBe('fertility');
  });

  it('maps cancer_caregiver → cancer', () => {
    expect(mapAssetKey('cancer_caregiver')).toBe('cancer');
  });

  it('maps pet_care → pet', () => {
    expect(mapAssetKey('pet_care')).toBe('pet');
  });

  it('maps chronic → fertility (fallback)', () => {
    expect(mapAssetKey('chronic')).toBe('fertility');
  });

  it('maps custom → fertility (fallback)', () => {
    expect(mapAssetKey('custom')).toBe('fertility');
  });

  it('maps unknown string → fertility (fallback)', () => {
    expect(mapAssetKey('anything_unknown')).toBe('fertility');
  });
});

describe('inferRole', () => {
  it('fertility asset with E4 envelope → self', () => {
    expect(inferRole(fertilityAsset)).toBe('self');
  });

  it('cancer_caregiver asset → guardian', () => {
    expect(inferRole(cancerAsset)).toBe('guardian');
  });

  it('pet_care asset → guardian', () => {
    const petAsset = mockAssets.find((a) => a.type === 'pet_care')!;
    expect(inferRole(petAsset)).toBe('guardian');
  });

  it('asset with E3 envelope (non-caregiver type) → parent', () => {
    const asset: Asset = { ...fertilityAsset, type: 'custom', envelope: 'E3' };
    expect(inferRole(asset)).toBe('parent');
  });

  it('asset with E2 envelope → parent', () => {
    const asset: Asset = { ...fertilityAsset, type: 'custom', envelope: 'E2' };
    expect(inferRole(asset)).toBe('parent');
  });

  it('E1 custom asset → self', () => {
    const asset: Asset = { ...fertilityAsset, type: 'custom', envelope: 'E1' };
    expect(inferRole(asset)).toBe('self');
  });
});

describe('computeProximity', () => {
  const now = new Date('2026-04-18T09:00:00Z');

  it('empty events → far, no anchor', () => {
    expect(computeProximity([], now)).toEqual({ proximity: 'far', anchorEventId: null });
  });

  it('event starting 12h ahead → near', () => {
    const event = makeEvent({ id: 'e1', at: offsetISO(now, 12), title: 'soon' });
    const result = computeProximity([event], now);
    expect(result.proximity).toBe('near');
    expect(result.anchorEventId).toBe('e1');
  });

  it('event in during phase → dayof with anchorEventId', () => {
    const event = makeEvent({
      id: 'e-during',
      at: offsetISO(now, -0.5),
      durationHours: 4,
      afterglowHours: 12,
      title: 'active',
    });
    const result = computeProximity([event], now);
    expect(result.proximity).toBe('dayof');
    expect(result.anchorEventId).toBe('e-during');
  });

  it('event 60h ahead → week', () => {
    const event = makeEvent({ id: 'e-week', at: offsetISO(now, 60), title: '60h out' });
    const result = computeProximity([event], now);
    expect(result.proximity).toBe('week');
    expect(result.anchorEventId).toBe('e-week');
  });

  it('during event beats a before event', () => {
    const before = makeEvent({ id: 'e-before', at: offsetISO(now, 12), title: 'before' });
    const during = makeEvent({
      id: 'e-during',
      at: offsetISO(now, -0.5),
      durationHours: 4,
      afterglowHours: 12,
      title: 'during',
    });
    const result = computeProximity([before, during], now);
    expect(result.proximity).toBe('dayof');
    expect(result.anchorEventId).toBe('e-during');
  });

  it('after phase event → after', () => {
    const event = makeEvent({
      id: 'e-after',
      at: offsetISO(now, -2),
      durationHours: 0,
      afterglowHours: 12,
      title: 'done',
    });
    const result = computeProximity([event], now);
    expect(result.proximity).toBe('after');
    expect(result.anchorEventId).toBe('e-after');
  });
});
