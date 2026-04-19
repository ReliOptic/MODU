// §7.1 팔레트 — 에셋 타입별 색상 시스템
// dawn(난임), mist(항암보호자), blossom(반려동물), sage(만성질환), dusk(custom)

export type PaletteKey = 'dawn' | 'mist' | 'blossom' | 'sage' | 'dusk';

export interface PaletteSwatch {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  /** @deprecated v1 soft wash — kept for backward compat. Use `heroGradient` for L3 hero fills per §3.1.A. */
  gradient: { start: string; mid: string; end: string };
  /** §3.1.A dense 3-stop hero fill. Drives L3 hero surfaces. */
  heroGradient: { top: string; mid: string; bottom: string };
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
    400: '#E08970',
    500: '#D4634F',
    600: '#B84A3A',
    700: '#8E3528',
    800: '#6B251B',
    900: '#491710',
    gradient: { start: '#D4634F', mid: '#E89580', end: '#EEB3A0' },
    heroGradient: { top: '#D4634F', mid: '#B84A3A', bottom: '#8E3528' },
    bgMesh: ['rgba(253,231,217,0.6)', 'rgba(250,201,184,0.4)'],
    accent: '#D4634F',
  },
  mist: {
    50: '#F0F4F8',
    100: '#D6E0EA',
    200: '#B1C4D6',
    300: '#819DB8',
    400: '#517090',
    500: '#2E547B',
    600: '#223F5E',
    700: '#172D44',
    800: '#0F1F30',
    900: '#07121C',
    gradient: { start: '#56789A', mid: '#819DB8', end: '#B1C4D6' },
    heroGradient: { top: '#2E547B', mid: '#223F5E', bottom: '#172D44' },
    bgMesh: ['rgba(214,224,234,0.6)', 'rgba(177,196,214,0.4)'],
    accent: '#2E547B',
  },
  blossom: {
    50: '#FFF5F7',
    100: '#FDE2E8',
    200: '#FAC4D1',
    300: '#F29CB5',
    400: '#D96F93',
    500: '#C14B73',
    600: '#A0375C',
    700: '#7C2646',
    800: '#591830',
    900: '#380D1C',
    gradient: { start: '#C14B73', mid: '#E06F92', end: '#F29CB5' },
    heroGradient: { top: '#F29CB5', mid: '#C14B73', bottom: '#7C2646' },
    bgMesh: ['rgba(253,226,232,0.6)', 'rgba(250,196,209,0.4)'],
    accent: '#C14B73',
  },
  sage: {
    50: '#F3F6F2',
    100: '#DCE6D8',
    200: '#B8CBB2',
    300: '#91AE8B',
    400: '#6D8F68',
    500: '#4E7049',
    600: '#3B5738',
    700: '#2C4129',
    800: '#1E2E1C',
    900: '#121C10',
    gradient: { start: '#4E7049', mid: '#6D8F68', end: '#91AE8B' },
    heroGradient: { top: '#4E7049', mid: '#3B5738', bottom: '#2C4129' },
    bgMesh: ['rgba(220,230,216,0.6)', 'rgba(184,203,178,0.4)'],
    accent: '#4E7049',
  },
  // dusk: §7.1 미정의 — custom 에셋용 fallback. 저녁 라일락 톤.
  dusk: {
    50: '#F6F4FA',
    100: '#E5E0EE',
    200: '#C9C0DD',
    300: '#A294C2',
    400: '#7F6FA4',
    500: '#5E4A85',
    600: '#493770',
    700: '#352757',
    800: '#241A3F',
    900: '#160F29',
    gradient: { start: '#5E4A85', mid: '#7C68A2', end: '#A294C2' },
    heroGradient: { top: '#5E4A85', mid: '#493770', bottom: '#352757' },
    bgMesh: ['rgba(229,224,238,0.6)', 'rgba(201,192,221,0.4)'],
    accent: '#5E4A85',
  },
};

export function getPalette(key: PaletteKey): PaletteSwatch {
  return palettes[key];
}
