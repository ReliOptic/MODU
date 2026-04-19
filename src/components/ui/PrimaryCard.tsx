// Primary 카드 — 에셋 팔레트 그라데이션 카드 (§7.3 + §2 각 에셋의 primary_event/primary_medication)
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPalette, PaletteKey, widgetTokens } from '../../theme';

export interface PrimaryCardProps extends ViewProps {
  palette: PaletteKey;
  children: React.ReactNode;
}

export function PrimaryCard({ palette, children, style, ...rest }: PrimaryCardProps) {
  const p = getPalette(palette);
  return (
    <View style={[styles.wrap, style]} {...rest}>
      <LinearGradient
        colors={[p.heroGradient.top, p.heroGradient.mid, p.heroGradient.bottom]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: widgetTokens.primaryCard.borderRadius,
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: widgetTokens.primaryCard.paddingHorizontal,
    paddingVertical: widgetTokens.primaryCard.paddingVertical,
  },
});
