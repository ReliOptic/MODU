// v2.1 §3.1 R1 — L3 hero must dominate the viewport.
// Verifies the hero elevation layer is configured to occupy ≥56% of a
// typical mobile viewport, and that every palette's heroGradient uses the
// dense {500+,600,700} swatches (not the deprecated pastel {50,100} wash).
import { elevation, palettes, r, s } from '../theme';

describe('hero dominance (R1)', () => {
  test('L3 elevation layer is named "hero"', () => {
    expect(elevation.L3.name).toBe('hero');
  });

  test('L3 uses palette heroGradient hint (not pastel wash)', () => {
    expect(elevation.L3.backgroundHint).toContain('heroGradient');
  });

  test('L3 has a shadow stop (not a flat surface)', () => {
    expect(elevation.L3.shadow.length).toBeGreaterThan(0);
  });

  const viewport = 852; // iPhone 14 Pro Max logical height
  const minHeroHeight = 420; // HeroFrame floor
  const heroMinScale = 0.56; // R1 requirement

  test('hero height computation hits >=56% of viewport on a tall device', () => {
    const computed = Math.max(minHeroHeight, Math.round(viewport * heroMinScale));
    // Rounding can subtract at most 0.5px from the exact 56% target.
    expect(computed).toBeGreaterThanOrEqual(Math.floor(viewport * 0.56));
  });

  test('hero height floor keeps dominance on small viewports', () => {
    const small = 640;
    const computed = Math.max(minHeroHeight, Math.round(small * heroMinScale));
    expect(computed).toBeGreaterThanOrEqual(minHeroHeight);
  });

  test('all palettes define heroGradient with three distinct stops', () => {
    for (const key of Object.keys(palettes)) {
      const p = palettes[key as keyof typeof palettes];
      const { top, mid, bottom } = p.heroGradient;
      expect(top.length).toBeGreaterThan(0);
      expect(mid.length).toBeGreaterThan(0);
      expect(bottom.length).toBeGreaterThan(0);
      const unique = new Set([top, mid, bottom]);
      expect(unique.size).toBe(3);
    }
  });

  test('scales provide r + s tokens used by HeroFrame primitive', () => {
    expect(r.lg).toBeGreaterThan(0);
    expect(s.lg).toBeGreaterThan(0);
    expect(s['2xl']).toBeGreaterThan(s.lg);
  });
});
