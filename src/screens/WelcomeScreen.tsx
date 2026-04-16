// 첫 진입 화면 — 에셋이 없을 때만. Formation 진입 직전의 마음 준비.
// 5팔레트가 미세하게 흐르는 mesh 배경 + 슬로건 + "시작하기".
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palettes, typography, widgetTokens } from '../theme';

export interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const intro = useSharedValue(0);
  const cta = useSharedValue(0);

  useEffect(() => {
    intro.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    cta.value = withDelay(900, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, [intro, cta]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [{ translateY: interpolate(intro.value, [0, 1], [12, 0]) }],
  }));
  const sloganStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0, 0.6, 1], [0, 0, 1]),
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: cta.value,
    transform: [{ translateY: interpolate(cta.value, [0, 1], [16, 0]) }],
  }));

  return (
    <View style={styles.root}>
      {/* 5팔레트 mesh — 하단부터 dawn 그라데이션이 살짝 떠오르게 */}
      <LinearGradient
        colors={[
          palettes.dawn[50],
          palettes.blossom[50],
          palettes.mist[50],
          palettes.sage[50],
        ]}
        locations={[0, 0.4, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.body, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: palettes.dawn.accent }]} />
          <View style={[styles.dot, { backgroundColor: palettes.mist.accent }]} />
          <View style={[styles.dot, { backgroundColor: palettes.blossom.accent }]} />
          <View style={[styles.dot, { backgroundColor: palettes.sage.accent }]} />
        </View>

        <Animated.View style={titleStyle}>
          <Text style={styles.brand}>MODU</Text>
        </Animated.View>

        <Animated.View style={[styles.sloganWrap, sloganStyle]}>
          <Text style={styles.slogan}>당신의 삶에 귀 기울이는</Text>
          <Text style={styles.sloganEm}>건강·돌봄 동반자</Text>
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View style={ctaStyle}>
          <Text style={styles.lead}>지금 함께하고 싶은</Text>
          <Text style={styles.leadEm}>한 챕터를 들려주세요.</Text>

          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="시작하기"
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[palettes.dawn.gradient.start, palettes.dawn.gradient.mid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.ctaLabel}>첫 챕터 만들기</Text>
          </Pressable>

          <Text style={styles.hint}>5분이면 충분해요. 언제든 다시 만들 수 있어요.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  brand: {
    fontFamily: 'Fraunces-LightItalic',
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: -2,
    color: widgetTokens.textPrimary,
  },
  sloganWrap: {
    marginTop: 14,
  },
  slogan: {
    ...typography.title1,
    color: widgetTokens.textSecondary,
    fontWeight: '400',
  },
  sloganEm: {
    ...typography.title1,
    color: widgetTokens.textPrimary,
    fontWeight: '600',
  },
  spacer: { flex: 1 },
  lead: {
    ...typography.headline,
    color: widgetTokens.textSecondary,
    fontWeight: '400',
    marginBottom: 2,
  },
  leadEm: {
    ...typography.title1,
    color: widgetTokens.textPrimary,
    fontWeight: '600',
    marginBottom: 24,
  },
  cta: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hint: {
    ...typography.footnote,
    color: widgetTokens.textTertiary,
    textAlign: 'center',
    marginTop: 14,
  },
});
