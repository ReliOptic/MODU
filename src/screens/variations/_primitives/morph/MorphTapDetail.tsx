// Morph mood — expanding detail panel shown when a grid2 pod is tapped.
// Accent fill with white text. §3.4 macro curve: 280ms.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../../theme';
import { s } from '../../../../theme';

export interface MorphTapDetailProps {
  readonly palette: PaletteSwatch;
  readonly podKey: string;
  readonly reduceMotion: boolean;
}

const DETAIL_COPY: Readonly<Record<string, string>> = {
  mood: '이번 주, 설렘이 가장 자주 찾아왔어요.',
  sleep: '최근 7일 평균보다 22분 더 쉬셨습니다.',
};

export function MorphTapDetail({
  palette,
  podKey,
  reduceMotion,
}: MorphTapDetailProps): React.JSX.Element | null {
  const copy = DETAIL_COPY[podKey];
  if (copy === undefined) return null;

  const entering = reduceMotion ? undefined : FadeIn.duration(280);

  return (
    <Animated.View
      entering={entering}
      style={[styles.panel, { backgroundColor: palette.accent }]}
    >
      <Text style={styles.eyebrow}>세부 보기</Text>
      <Text style={styles.body}>{copy}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: s.lg,
    borderRadius: 26,
    padding: 22,
    gap: s.sm,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
});
