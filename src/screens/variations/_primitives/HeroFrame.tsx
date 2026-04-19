// v2.1 §3.1.A + R1 — L3 hero shell with dense palette.heroGradient.
// Min height ≥ 56% viewport (R1). Uses palette.heroGradient {top,mid,bottom}.
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PaletteSwatch } from '../../../theme';
import { elevation, r as rad } from '../../../theme';

export interface HeroFrameProps {
  readonly palette: PaletteSwatch;
  readonly children: React.ReactNode;
  readonly heroBonus?: number;
  readonly minScale?: number;
  readonly variant?: 'gradient' | 'flat';
  readonly cornerRadius?: number;
  readonly insetHorizontal?: number;
  readonly insetTop?: number;
}

export function HeroFrame({
  palette,
  children,
  heroBonus = 0,
  minScale = 0.56,
  variant = 'gradient',
  cornerRadius = rad.lg,
  insetHorizontal = 0,
  insetTop = 0,
}: HeroFrameProps): React.JSX.Element {
  const { height } = useWindowDimensions();
  const minHeight = Math.max(420, Math.round(height * minScale)) + heroBonus;
  const L3 = elevation.L3;
  const stop = L3.shadow[0];

  return (
    <View
      style={[
        styles.frame,
        {
          minHeight,
          marginHorizontal: insetHorizontal,
          marginTop: insetTop,
          borderRadius: cornerRadius,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: stop?.offsetY ?? 0 },
          shadowOpacity: stop?.opacity ?? 0,
          shadowRadius: stop?.blur ?? 0,
          elevation: 6,
        },
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient
          colors={[
            palette.heroGradient.top,
            palette.heroGradient.mid,
            palette.heroGradient.bottom,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: cornerRadius }]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: palette.heroGradient.bottom, borderRadius: cornerRadius },
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    width: '100%',
    justifyContent: 'flex-end',
  },
});
