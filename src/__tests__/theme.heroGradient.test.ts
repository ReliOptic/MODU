// §3.1.A — every palette ships a 3-stop dense heroGradient {top,mid,bottom}.
// Retires v1 `gradient` pastel wash; kept only for backward compat.
import { palettes, type PaletteKey } from '../theme';

describe('palette.heroGradient (§3.1.A)', () => {
  const keys: readonly PaletteKey[] = ['dawn', 'mist', 'blossom', 'sage', 'dusk'];
  const hex = /^#[0-9A-F]{6}$/i;

  it('every palette defines a heroGradient with 3 stops', () => {
    keys.forEach((k) => {
      const p = palettes[k];
      expect(p.heroGradient).toBeDefined();
      expect(p.heroGradient.top).toMatch(hex);
      expect(p.heroGradient.mid).toMatch(hex);
      expect(p.heroGradient.bottom).toMatch(hex);
    });
  });

  it('heroGradient stops differ inside each palette (no flat fill)', () => {
    keys.forEach((k) => {
      const { top, mid, bottom } = palettes[k].heroGradient;
      expect(new Set([top, mid, bottom]).size).toBe(3);
    });
  });

  it('dawn/mist/sage/dusk use dense {500,600,700}', () => {
    (['dawn', 'mist', 'sage', 'dusk'] as const).forEach((k) => {
      const p = palettes[k];
      expect(p.heroGradient.top).toBe(p[500]);
      expect(p.heroGradient.mid).toBe(p[600]);
      expect(p.heroGradient.bottom).toBe(p[700]);
    });
  });

  it('blossom uses high-contrast {300,500,700}', () => {
    const p = palettes.blossom;
    expect(p.heroGradient.top).toBe(p[300]);
    expect(p.heroGradient.mid).toBe(p[500]);
    expect(p.heroGradient.bottom).toBe(p[700]);
  });
});
