// 에셋(=챕터) 전환 시 가운데에 잠시 떠오르는 ritual 오버레이.
// "삶의 한 챕터로 이동한다"는 무게감을 주기 위해 0.3초 fade-in → hold → fade-out.
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getPalette, PaletteKey, typography } from '../theme';

export interface ChapterRitualOverlayProps {
  visible: boolean;
  /** 새로 들어가는 에셋의 팔레트 — overlay 색감 */
  palette: PaletteKey;
  /** 에셋 이름 — "○○ 챕터로 이동" */
  label: string;
}

const FADE = 280;

export function ChapterRitualOverlay({ visible, palette, label }: ChapterRitualOverlayProps) {
  const progress = useSharedValue(0);
  const p = getPalette(palette);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: FADE,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.6, 1]) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [8, 0]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.wrap, containerStyle]}
    >
      <LinearGradient
        colors={[p[50], p[100], p[50]]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.center}>
        <Animated.View style={[styles.dotWrap, dotStyle]}>
          <LinearGradient
            colors={[p.gradient.start, p.gradient.mid, p.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dot}
          />
        </Animated.View>
        <Animated.View style={textStyle}>
          <Text style={[styles.label, { color: p[500] }]}>{label}</Text>
          <Text style={styles.sub}>챕터로 이동</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  center: {
    alignItems: 'center',
    gap: 18,
  },
  dotWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  dot: {
    width: '100%',
    height: '100%',
  },
  label: {
    ...typography.title1,
    textAlign: 'center',
    fontWeight: '600',
  },
  sub: {
    ...typography.subhead,
    color: 'rgba(60,60,67,0.6)',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.4,
  },
});
