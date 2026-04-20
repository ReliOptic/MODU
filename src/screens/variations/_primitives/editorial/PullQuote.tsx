// Editorial primitive: PullQuote — editorial section with accent italic heroWord.
// Korean: "{headline} — {heroWord}의 자리로."
// English: "{headline} — {heroWord}."
// Fix 10: paddingTop 72, paddingHorizontal 28, paddingBottom 32 (hardcoded editorial gutter).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { SectionLabel } from '../SectionLabel';
import { s } from '../../../../theme';

export interface PullQuoteProps {
  readonly palette: PaletteSwatch;
  readonly headline: string;
  readonly heroWord: string;
  readonly tpo: ResolvedTPO;
  readonly sectionTitle?: string;
}

export function PullQuote({
  palette,
  headline,
  heroWord,
  tpo,
  sectionTitle = '오늘의 호흡',
}: PullQuoteProps): React.JSX.Element {
  const isEn = tpo.locale === 'en';
  const particle = isEn ? '.' : '의 자리로.';

  return (
    <View style={styles.wrap}>
      <SectionLabel palette={palette}>{sectionTitle}</SectionLabel>

      <Text style={[styles.quote, { color: palette[900] }]}>
        {headline}
        {' — '}
        <Text style={[styles.accentItalic, { color: palette.accent }]}>
          {heroWord}
        </Text>
        {particle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Fix 10: hardcoded editorial gutter, do not use s.*
    paddingTop: 72,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  quote: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    marginTop: s.lg,
  },
  accentItalic: {
    fontFamily: 'Fraunces_400Regular',
    fontStyle: 'italic',
  },
});
