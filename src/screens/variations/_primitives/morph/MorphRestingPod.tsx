// Morph mood — after-proximity resting pod.
// Horizontal layout: soft icon circle + text content.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../../theme';
import { s } from '../../../../theme';

export interface MorphRestingPodProps {
  readonly palette: PaletteSwatch;
  readonly reduceMotion: boolean;
}

export function MorphRestingPod({
  palette,
  reduceMotion,
}: MorphRestingPodProps): React.JSX.Element {
  const entering = reduceMotion ? undefined : FadeIn.delay(60).duration(400);

  return (
    <Animated.View
      entering={entering}
      style={[
        styles.card,
        {
          backgroundColor: palette[100],
          borderColor: palette[200],
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: palette[200] }]}>
        <Text style={[styles.iconGlyph, { color: palette.accent }]}>◯</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.eyebrow, { color: palette[600] }]}>오늘</Text>
        <Text style={[styles.title, { color: palette[900] }]}>그저, 쉼</Text>
        <Text style={[styles.sub, { color: palette[600] }]}>
          오늘은 해야 할 일이 없어요. 몸이 일하고 있어요.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s.lg,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 18,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 24,
    lineHeight: 28,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  sub: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
});
