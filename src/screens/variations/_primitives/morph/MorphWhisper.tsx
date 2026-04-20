// Morph mood — whisper shape card. Shape varies by proximity:
// organic (far/week/near) → large border-radius softness
// tight (dayof) → standard rounded rect
// pill (after) → fully rounded pill
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { s } from '../../../../theme';
import type { WhisperShape } from '../../fertility/morphTypes';

export interface MorphWhisperProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly whisperShape: WhisperShape;
  readonly reduceMotion: boolean;
}

const WHISPER_COPY: Readonly<Record<ResolvedTPO['proximity'], string>> = {
  far:   '이번 주는 몸의 이야기에 귀 기울여요.',
  week:  '오늘의 수면의 질이 내일의 컨디션.',
  near:  '오늘의 수면의 질이 내일의 컨디션.',
  dayof: '세 번의 호흡. 그게 전부에요.',
  after: '오늘은 부드러움의 날.',
};

// Accent word to italicise per proximity
const ACCENT_WORD: Readonly<Partial<Record<ResolvedTPO['proximity'], string>>> = {
  far:   '몸',
  week:  '수면의 질',
  near:  '수면의 질',
  dayof: '호흡',
  after: '부드러움',
};

const BORDER_RADIUS: Readonly<Record<WhisperShape, number>> = {
  organic: 48,
  tight: 22,
  pill: 100,
};

export function MorphWhisper({
  palette,
  tpo,
  whisperShape,
  reduceMotion,
}: MorphWhisperProps): React.JSX.Element {
  const copy = WHISPER_COPY[tpo.proximity];
  const accentWord = ACCENT_WORD[tpo.proximity];
  const radius = BORDER_RADIUS[whisperShape];
  const entering = reduceMotion ? undefined : FadeIn.delay(120).duration(400);

  const segments = accentWord !== undefined && copy.includes(accentWord)
    ? splitOnce(copy, accentWord)
    : null;

  return (
    <Animated.View
      entering={entering}
      style={[
        styles.card,
        {
          backgroundColor: palette[100],
          borderColor: palette[200],
          borderRadius: radius,
        },
      ]}
    >
      <Text style={[styles.body, { color: palette[900] }]}>
        {segments === null ? (
          copy
        ) : (
          <>
            {segments[0]}
            <Text style={[styles.accent, { color: palette.accent }]}>{accentWord}</Text>
            {segments[1]}
          </>
        )}
      </Text>
    </Animated.View>
  );
}

function splitOnce(text: string, marker: string): readonly [string, string] {
  const idx = text.indexOf(marker);
  if (idx < 0) return [text, ''];
  return [text.slice(0, idx), text.slice(idx + marker.length)];
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s.lg,
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderWidth: 1,
  },
  body: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  accent: {
    fontFamily: 'Fraunces_400Regular',
    fontStyle: 'italic',
    fontSize: 20,
  },
});
