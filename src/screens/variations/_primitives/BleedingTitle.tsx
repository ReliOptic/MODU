// v2.1 §2.A + R13 — Fraunces displayLarge with optional italic word and right-bleed.
// At most one italic word per hero (R13). Bleeding clips overflow on the right.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../theme';
import { s } from '../../../theme';

export type TitleSize = 'large' | 'display' | 'mega';

export interface BleedingTitleProps {
  readonly palette: PaletteSwatch;
  readonly text: string;
  readonly italicWord?: string;
  readonly size?: TitleSize;
  readonly bleed?: boolean;
  readonly tone?: 'light' | 'dark';
  readonly maxLines?: number;
}

const SIZE_MAP: Readonly<Record<TitleSize, { fontSize: number; lineHeight: number; letterSpacing: number }>> = {
  large: { fontSize: 36, lineHeight: 38, letterSpacing: -1 },
  display: { fontSize: 56, lineHeight: 56, letterSpacing: -1.4 },
  mega: { fontSize: 72, lineHeight: 70, letterSpacing: -1.8 },
};

export function BleedingTitle({
  palette,
  text,
  italicWord,
  size = 'display',
  bleed = false,
  tone = 'light',
  maxLines = 2,
}: BleedingTitleProps): React.JSX.Element {
  const dim = SIZE_MAP[size];
  const color = tone === 'light' ? '#FFFFFF' : palette[900];

  const segments = italicWord !== undefined && text.includes(italicWord)
    ? splitOnce(text, italicWord)
    : null;

  return (
    <View style={[styles.frame, bleed ? styles.bleed : null]}>
      <Text
        style={[
          styles.title,
          dim,
          { color },
        ]}
        numberOfLines={maxLines}
      >
        {segments === null ? (
          text
        ) : (
          <>
            {segments[0]}
            <Text style={styles.italic}>{italicWord}</Text>
            {segments[1]}
          </>
        )}
      </Text>
    </View>
  );
}

function splitOnce(text: string, marker: string): readonly [string, string] {
  const idx = text.indexOf(marker);
  if (idx < 0) return [text, ''];
  return [text.slice(0, idx), text.slice(idx + marker.length)];
}

const styles = StyleSheet.create({
  frame: {
    paddingHorizontal: s.lg,
  },
  bleed: {
    marginRight: -32,
    overflow: 'hidden',
  },
  title: {
    fontFamily: 'Fraunces_400Regular',
  },
  italic: {
    fontFamily: 'Fraunces_400Regular',
    fontStyle: 'italic',
  },
});
