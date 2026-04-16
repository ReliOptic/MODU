// 라운드 배지 — 시간/상태/D-day/카운트 등
import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../theme';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'onPrimary';

export interface BadgeProps extends ViewProps {
  label: string;
  tone?: BadgeTone;
  /** accent tone에서 사용하는 팔레트 (없으면 neutral 처리) */
  palette?: PaletteKey;
}

export function Badge({ label, tone = 'neutral', palette, style, ...rest }: BadgeProps) {
  const { bg, fg } = resolveTone(tone, palette);
  return (
    <View style={[styles.base, { backgroundColor: bg }, style]} {...rest}>
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function resolveTone(tone: BadgeTone, palette?: PaletteKey): { bg: string; fg: string } {
  switch (tone) {
    case 'accent': {
      if (!palette) return { bg: 'rgba(60,60,67,0.08)', fg: widgetTokens.textPrimary };
      const p = getPalette(palette);
      return { bg: p[100], fg: p[500] };
    }
    case 'success':
      return { bg: 'rgba(78,112,73,0.14)', fg: '#3F5E3B' };
    case 'warning':
      return { bg: 'rgba(212,99,79,0.14)', fg: '#9A4636' };
    case 'danger':
      return { bg: 'rgba(193,75,115,0.14)', fg: '#8E2F55' };
    case 'onPrimary':
      return { bg: 'rgba(255,255,255,0.22)', fg: '#FFFFFF' };
    case 'neutral':
    default:
      return { bg: 'rgba(60,60,67,0.08)', fg: widgetTokens.textSecondary };
  }
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: widgetTokens.badge.paddingHorizontal,
    paddingVertical: widgetTokens.badge.paddingVertical,
    borderRadius: widgetTokens.badge.borderRadius,
    minHeight: widgetTokens.badge.minHeight,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  text: {
    ...typography.caption1,
    fontWeight: '600',
  },
});
