// Editorial primitive: ClosingCard — full-bleed gradient closing section.
// Proximity-branched copy (ko/en). Bottom mono attribution line.
// Fix 11: paddingTop 56, paddingHorizontal 28, paddingBottom 100 (hardcoded editorial gutter).
// Fix 4: placeLabel prop instead of tpo.placeId string-replace.
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { SectionLabel } from '../SectionLabel';

export interface ClosingCardProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly assetLabel: string;
  /** Fix 4: localised place label, e.g. "서울". Empty string → omit from attribution. */
  readonly placeLabel?: string;
}

function closingCopy(proximity: string, locale: string): string {
  const isEn = locale === 'en';
  if (proximity === 'after') {
    return isEn ? 'Your body remembers. Rest.' : '몸이 기억해요. 쉬어요.';
  }
  if (proximity === 'dayof') {
    return isEn ? 'One breath at a time.' : '한 호흡씩, 천천히.';
  }
  return isEn ? 'At your pace, always.' : '당신의 속도로.';
}

export function ClosingCard({
  palette,
  tpo,
  assetLabel,
  placeLabel = '',
}: ClosingCardProps): React.JSX.Element {
  const copy = closingCopy(tpo.proximity, tpo.locale);
  // Fix 4: use placeLabel prop, not tpo.placeId.replace(...)
  const attribution = placeLabel.length > 0
    ? `— MODU · ${assetLabel} · ${placeLabel}`
    : `— MODU · ${assetLabel}`;

  return (
    <LinearGradient
      colors={[
        palette.heroGradient.top,
        palette.heroGradient.mid,
        palette.heroGradient.bottom,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.card}
    >
      <SectionLabel palette={palette} light>
        오늘의 닫는 말
      </SectionLabel>

      <Text style={styles.body}>{copy}</Text>

      <Text style={styles.attribution}>{attribution}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    // Fix 11: hardcoded editorial gutter
    paddingTop: 56,
    paddingHorizontal: 28,
    paddingBottom: 100,
  },
  body: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.8,
    color: '#FFFFFF',
    marginTop: 16,
    maxWidth: 300,
  },
  attribution: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 24,
  },
});
