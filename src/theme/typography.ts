// §7.2 타이포그래피 — iOS 스케일 (Pretendard + Fraunces)
// 폰트 파일이 없을 경우 RN 기본 system 폰트로 fallback.
// expo-font 로 로드 후 fontFamily 매칭하면 실제 적용.

import type { TextStyle } from 'react-native';

type Style = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'letterSpacing' | 'lineHeight'>;

const PRETENDARD_BOLD = 'Pretendard-Bold';
const PRETENDARD_SEMIBOLD = 'Pretendard-Semibold';
const PRETENDARD_REGULAR = 'Pretendard-Regular';
const FRAUNCES_LIGHT_ITALIC = 'Fraunces-LightItalic';

export const typography: Record<string, Style> = {
  largeTitle: { fontFamily: PRETENDARD_BOLD, fontSize: 28, fontWeight: '700', letterSpacing: -1.1, lineHeight: 34 },
  title1: { fontFamily: PRETENDARD_BOLD, fontSize: 24, fontWeight: '700', letterSpacing: -0.8, lineHeight: 30 },
  headline: { fontFamily: PRETENDARD_SEMIBOLD, fontSize: 17, fontWeight: '600', letterSpacing: -0.4, lineHeight: 22 },
  body: { fontFamily: PRETENDARD_REGULAR, fontSize: 17, fontWeight: '400', letterSpacing: -0.4, lineHeight: 22 },
  callout: { fontFamily: PRETENDARD_REGULAR, fontSize: 16, fontWeight: '400', letterSpacing: -0.3, lineHeight: 21 },
  subhead: { fontFamily: PRETENDARD_REGULAR, fontSize: 15, fontWeight: '400', letterSpacing: -0.2, lineHeight: 20 },
  footnote: { fontFamily: PRETENDARD_REGULAR, fontSize: 13, fontWeight: '400', letterSpacing: -0.1, lineHeight: 18 },
  caption1: { fontFamily: PRETENDARD_REGULAR, fontSize: 12, fontWeight: '400', letterSpacing: 0, lineHeight: 16 },
  caption2: { fontFamily: PRETENDARD_REGULAR, fontSize: 11, fontWeight: '400', letterSpacing: 0.1, lineHeight: 13 },
  // 감성 헤더용 (Fraunces Light Italic)
  displayLarge: { fontFamily: FRAUNCES_LIGHT_ITALIC, fontSize: 22, fontWeight: '300', letterSpacing: -0.5, lineHeight: 28 },
  displayAccent: { fontFamily: FRAUNCES_LIGHT_ITALIC, fontSize: 16, fontWeight: '300', letterSpacing: -0.3, lineHeight: 20 },
};

export type TypographyKey = keyof typeof typography;
