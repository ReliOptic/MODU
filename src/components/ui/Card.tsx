// 기본 카드 — blur 배경 + 14px 라운딩 (§7.3)
import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { widgetTokens } from '../../theme';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  /** blur 비활성화 (테스트 / Android 저사양 fallback) */
  disableBlur?: boolean;
}

export function Card({ children, style, disableBlur, ...rest }: CardProps) {
  // Android에서 BlurView 비용이 비싸 fallback 권장. iOS는 항상 blur.
  const useBlur = !disableBlur && Platform.OS !== 'web';

  if (!useBlur) {
    return (
      <View style={[styles.card, styles.cardSolid, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.card, style]} {...rest}>
      <BlurView
        intensity={widgetTokens.card.blurIntensity}
        tint={widgetTokens.card.blurTint}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: widgetTokens.card.borderRadius,
    borderWidth: widgetTokens.card.borderWidth,
    borderColor: widgetTokens.card.borderColor,
    overflow: 'hidden',
    backgroundColor: widgetTokens.card.backgroundColor,
  },
  cardSolid: {
    paddingHorizontal: widgetTokens.card.paddingHorizontal,
    paddingVertical: widgetTokens.card.paddingVertical,
  },
  inner: {
    paddingHorizontal: widgetTokens.card.paddingHorizontal,
    paddingVertical: widgetTokens.card.paddingVertical,
  },
});
