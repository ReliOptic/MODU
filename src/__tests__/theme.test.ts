// 디자인 토큰 검증 — 5개 팔레트가 모두 정의되어 있고 grad/accent를 갖는지
import { palettes, getPalette, typography, widgetTokens } from '../theme';

describe('palettes', () => {
  const keys = ['dawn', 'mist', 'blossom', 'sage', 'dusk'] as const;

  it('defines all 5 palette keys (§7.1 + dusk fallback)', () => {
    keys.forEach((k) => expect(palettes[k]).toBeDefined());
  });

  it('every palette has heroGradient triad + accent + bgMesh', () => {
    keys.forEach((k) => {
      const p = palettes[k];
      expect(p.heroGradient.top).toMatch(/^#[0-9A-F]{6}$/i);
      expect(p.heroGradient.mid).toMatch(/^#[0-9A-F]{6}$/i);
      expect(p.heroGradient.bottom).toMatch(/^#[0-9A-F]{6}$/i);
      expect(p.accent).toMatch(/^#[0-9A-F]{6}$/i);
      expect(p.bgMesh.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('matches §7.1 spec colors for known palettes', () => {
    expect(palettes.dawn[500]).toBe('#D4634F');
    expect(palettes.mist[500]).toBe('#2E547B');
    expect(palettes.blossom[500]).toBe('#C14B73');
    expect(palettes.sage[500]).toBe('#4E7049');
  });

  it('getPalette returns swatch by key', () => {
    expect(getPalette('dawn').accent).toBe('#D4634F');
  });
});

describe('typography', () => {
  it('defines iOS scale entries', () => {
    expect(typography.largeTitle.fontSize).toBe(28);
    expect(typography.body.fontSize).toBe(17);
    expect(typography.caption2.fontSize).toBe(11);
  });
});

describe('widgetTokens', () => {
  it('cardV2 is the v2.1 surface (replaces legacy card)', () => {
    expect(widgetTokens.cardV2.borderRadius).toBeGreaterThan(0);
    expect(widgetTokens.cardV2.backgroundColor).toContain('0.82');
  });
  it('separator uses hairline width', () => {
    expect(widgetTokens.separator.height).toBeLessThanOrEqual(1);
  });
});
