// §7.1 팔레트 — 에셋 타입별 색상 시스템
// dawn(난임), mist(항암보호자), blossom(반려동물), sage(만성질환), dusk(custom)

export type PaletteKey = 'dawn' | 'mist' | 'blossom' | 'sage' | 'dusk';

export interface PaletteSwatch {
  50: string;
  100: string;
  200: string;
  300: string;
  500: string;
  /** 그라데이션 stop 3개 (start, mid, end) — RN LinearGradient 직접 적용 */
  gradient: { start: string; mid: string; end: string };
  /** 배경 mesh — radial gradient 색상 (RN에서는 overlay로 표현) */
  bgMesh: string[];
  /** 단일 accent — dot, hairline highlight 등 */
  accent: string;
}

export const palettes: Record<PaletteKey, PaletteSwatch> = {
  dawn: {
    50: '#FDF7F4',
    100: '#FAE8E0',
    200: '#F5D0C3',
    300: '#EEB3A0',
    500: '#D4634F',
    gradient: { start: '#D4634F', mid: '#E89580', end: '#EEB3A0' },
    bgMesh: ['rgba(253,231,217,0.6)', 'rgba(250,201,184,0.4)'],
    accent: '#D4634F',
  },
  mist: {
    50: '#F0F4F8',
    100: '#D6E0EA',
    200: '#B1C4D6',
    300: '#819DB8',
    500: '#2E547B',
    gradient: { start: '#56789A', mid: '#819DB8', end: '#B1C4D6' },
    bgMesh: ['rgba(214,224,234,0.6)', 'rgba(177,196,214,0.4)'],
    accent: '#2E547B',
  },
  blossom: {
    50: '#FFF5F7',
    100: '#FDE2E8',
    200: '#FAC4D1',
    300: '#F29CB5',
    500: '#C14B73',
    gradient: { start: '#C14B73', mid: '#E06F92', end: '#F29CB5' },
    bgMesh: ['rgba(253,226,232,0.6)', 'rgba(250,196,209,0.4)'],
    accent: '#C14B73',
  },
  sage: {
    50: '#F3F6F2',
    100: '#DCE6D8',
    200: '#B8CBB2',
    300: '#91AE8B',
    500: '#4E7049',
    gradient: { start: '#4E7049', mid: '#6D8F68', end: '#91AE8B' },
    bgMesh: ['rgba(220,230,216,0.6)', 'rgba(184,203,178,0.4)'],
    accent: '#4E7049',
  },
  // dusk: §7.1 미정의 — custom 에셋용 fallback. 저녁 라일락 톤.
  dusk: {
    50: '#F6F4FA',
    100: '#E5E0EE',
    200: '#C9C0DD',
    300: '#A294C2',
    500: '#5E4A85',
    gradient: { start: '#5E4A85', mid: '#7C68A2', end: '#A294C2' },
    bgMesh: ['rgba(229,224,238,0.6)', 'rgba(201,192,221,0.4)'],
    accent: '#5E4A85',
  },
};

export function getPalette(key: PaletteKey): PaletteSwatch {
  return palettes[key];
}
