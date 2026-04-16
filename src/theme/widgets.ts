// §7.3 위젯 스타일 규칙 — 모든 카드/세퍼레이터/탭바의 시각적 단일 진실
import { StyleSheet } from 'react-native';

export const widgetTokens = {
  card: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 14,
    borderColor: 'rgba(60,60,67,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    /** BlurView intensity prop 와 매칭 (expo-blur) */
    blurIntensity: 20,
    blurTint: 'light' as const,
  },
  primaryCard: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    /** Primary 카드 내부 텍스트는 항상 흰색에 가까운 high contrast */
    onColor: '#FFFFFF',
  },
  separator: {
    color: 'rgba(60,60,67,0.12)',
    height: StyleSheet.hairlineWidth,
  },
  tabBar: {
    height: 84, // iOS 표준 (safe area 포함). RN 측에서는 SafeArea + 49 고정.
    barHeight: 49,
    backgroundColor: 'rgba(249,249,249,0.88)',
    borderTopColor: 'rgba(60,60,67,0.12)',
    borderTopWidth: StyleSheet.hairlineWidth,
    blurIntensity: 20,
    blurTint: 'light' as const,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    minHeight: 20,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  /** iOS systemBackground 톤 — palette bgMesh 위에 깔리는 base */
  baseBackground: '#F2F2F7',
  /** 텍스트 기본색 — iOS labelPrimary */
  textPrimary: '#000000',
  textSecondary: 'rgba(60,60,67,0.6)',
  textTertiary: 'rgba(60,60,67,0.3)',
} as const;

export type WidgetTokens = typeof widgetTokens;
