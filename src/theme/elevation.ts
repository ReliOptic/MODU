// Visual-language v2.1 §3.1 — five depth layers (L0..L4).
// Components read these tokens; never hardcode shadow/blur/border.
import { StyleSheet } from 'react-native';

export type ElevationLayerId = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export interface ShadowStop {
  readonly offsetY: number;
  readonly blur: number;
  readonly opacity: number;
}

export interface ElevationLayer {
  readonly id: ElevationLayerId;
  readonly name: string;
  readonly shadow: readonly ShadowStop[];
  readonly blur: number | null;
  readonly border: string | null;
  readonly borderWidth: number;
  readonly backgroundHint: string;
}

const hairline = StyleSheet.hairlineWidth;

export const elevation: Readonly<Record<ElevationLayerId, ElevationLayer>> = {
  L0: {
    id: 'L0',
    name: 'skin',
    shadow: [],
    blur: null,
    border: null,
    borderWidth: 0,
    backgroundHint: 'palette.bgMesh over #F2F2F7',
  },
  L1: {
    id: 'L1',
    name: 'inline',
    shadow: [],
    blur: null,
    border: 'rgba(60,60,67,0.06)',
    borderWidth: hairline,
    backgroundHint: 'transparent',
  },
  L2: {
    id: 'L2',
    name: 'surface',
    shadow: [{ offsetY: 8, blur: 0, opacity: 0.04 }],
    blur: 12,
    border: 'rgba(60,60,67,0.08)',
    borderWidth: hairline,
    backgroundHint: 'rgba(255,255,255,0.82)',
  },
  L3: {
    id: 'L3',
    name: 'hero',
    shadow: [{ offsetY: 24, blur: 0, opacity: 0.10 }],
    blur: null,
    border: null,
    borderWidth: 0,
    backgroundHint: 'palette.heroGradient | photo',
  },
  L4: {
    id: 'L4',
    name: 'floating-glass',
    shadow: [
      { offsetY: 32, blur: 0, opacity: 0.12 },
      { offsetY: 2, blur: 0, opacity: 0.06 },
    ],
    blur: 60,
    border: 'rgba(255,255,255,0.35)',
    borderWidth: hairline,
    backgroundHint: 'light@0.78 | palette.300@0.6 over saturated hero',
  },
};

export function getElevation(id: ElevationLayerId): ElevationLayer {
  return elevation[id];
}
