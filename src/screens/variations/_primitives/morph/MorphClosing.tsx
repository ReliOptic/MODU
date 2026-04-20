// Morph mood — closing card. Proximity-aware closing copy + attribution.
// Mirrors UserAuthoredMorph closing shape: palette[100] bg, accent eyebrow,
// Fraunces display text, hairline border.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { s } from '../../../../theme';

export interface MorphClosingProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly reduceMotion: boolean;
}

const CLOSING_COPY: Readonly<Record<ResolvedTPO['proximity'], string>> = {
  far:   '당신의 속도로.',
  week:  '당신의 속도로.',
  near:  '내일, 당신과 함께.',
  dayof: '오늘이 당신의 날.',
  after: '몸이 기억해요. 쉬어요.',
};

export function MorphClosing({
  palette,
  tpo,
  reduceMotion,
}: MorphClosingProps): React.JSX.Element {
  const entering = reduceMotion ? undefined : FadeIn.delay(80).duration(400);
  const copy = CLOSING_COPY[tpo.proximity];

  return (
    <Animated.View
      entering={entering}
      style={[
        styles.card,
        { backgroundColor: palette[100], borderColor: palette[200] },
      ]}
    >
      <Text style={[styles.eyebrow, { color: palette[700] }]}>오늘의 닫는 말</Text>
      <Text style={[styles.body, { color: palette[900] }]}>{copy}</Text>
      <Text style={[styles.attr, { color: palette[600] }]}>
        {tpo.copy.whisper}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s.lg,
    padding: s.xl,
    borderRadius: 28,
    borderWidth: 1,
    gap: s.sm,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.5,
  },
  body: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  attr: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
});
