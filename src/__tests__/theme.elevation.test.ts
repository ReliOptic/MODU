// §3.1 — L0..L4 elevation scale contract.
import { elevation, getElevation } from '../theme';

describe('elevation (§3.1)', () => {
  it('defines all five layers L0..L4', () => {
    (['L0', 'L1', 'L2', 'L3', 'L4'] as const).forEach((id) => {
      expect(elevation[id]).toBeDefined();
      expect(elevation[id].id).toBe(id);
    });
  });

  it('L0 (skin) has no shadow, blur, or border', () => {
    const L0 = elevation.L0;
    expect(L0.shadow).toHaveLength(0);
    expect(L0.blur).toBeNull();
    expect(L0.border).toBeNull();
  });

  it('L2 (surface) carries blur 12 + hairline border + single shadow stop', () => {
    const L2 = elevation.L2;
    expect(L2.blur).toBe(12);
    expect(L2.border).not.toBeNull();
    expect(L2.shadow).toHaveLength(1);
  });

  it('L3 (hero) is gradient-backed — no blur, no border, single shadow', () => {
    const L3 = elevation.L3;
    expect(L3.blur).toBeNull();
    expect(L3.border).toBeNull();
    expect(L3.shadow).toHaveLength(1);
  });

  it('L4 (floating glass) ships two-stop shadow for iOS refraction', () => {
    const L4 = elevation.L4;
    expect(L4.shadow).toHaveLength(2);
    expect(L4.blur).toBe(60);
  });

  it('getElevation(id) returns the same layer', () => {
    expect(getElevation('L3')).toBe(elevation.L3);
  });
});
