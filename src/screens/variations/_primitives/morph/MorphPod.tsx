// Morph mood — organic stat pod. Used in grid4 (far) and grid2 (week/near).
// Tapped state flips to accent fill with white text.
// Reduce-motion: FadeIn disabled; no spring transform.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../../theme';
import { s } from '../../../../theme';

export interface MorphPodProps {
  readonly palette: PaletteSwatch;
  readonly label: string;
  readonly value: string;
  readonly sub: string;
  readonly tapped?: boolean;
  readonly onTap?: () => void;
  readonly seed?: number;
  readonly reduceMotion: boolean;
}

export function MorphPod({
  palette,
  label,
  value,
  sub,
  tapped = false,
  onTap,
  seed = 0,
  reduceMotion,
}: MorphPodProps): React.JSX.Element {
  const entering = reduceMotion ? undefined : FadeIn.delay(seed * 60).duration(360);

  return (
    <Animated.View entering={entering} style={styles.wrap}>
      <Pressable
        onPress={onTap}
        accessibilityLabel={`${label}: ${value}`}
        accessibilityHint="탭하면 세부 내용을 봅니다"
        style={({ pressed }) => [
          styles.pod,
          tapped ? styles.podTapped : styles.podUntapped,
          {
            backgroundColor: tapped ? palette.accent : palette[100],
            borderColor: palette[200],
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.eyebrow,
            { color: tapped ? 'rgba(255,255,255,0.85)' : palette[600] },
          ]}
        >
          {label.toUpperCase()}
        </Text>
        <Text
          style={[
            styles.value,
            { color: tapped ? '#FFFFFF' : palette.accent },
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.sub,
            { color: tapped ? 'rgba(255,255,255,0.75)' : palette[600] },
          ]}
        >
          {sub}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  pod: {
    minHeight: 130,
    borderWidth: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  // P1.8: organic asymmetric radius when untapped
  podUntapped: {
    borderTopLeftRadius: 48,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 44,
  },
  // P1.8: flat radius when tapped
  podTapped: {
    borderRadius: 28,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2.2,
  },
  value: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
});
