// Bento hero tile — gradient fill, eyebrow, large serif title, subtitle.
// Reference: BentoBlock kind='hero' in variation-bento.jsx.
// RN limitation: no CSS filter/mixBlendMode — uses LinearGradient only.
// P1.1: split shadow wrapper (outer) from overflow:hidden clip (inner) for iOS.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';

export interface BentoHeroTileProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly minHeight: number;
  /** Per-proximity eyebrow copy. */
  readonly eyebrow: string;
}

export function BentoHeroTile({
  palette,
  tpo,
  minHeight,
  eyebrow,
}: BentoHeroTileProps): React.JSX.Element {
  return (
    <View style={[styles.shadowWrap, { minHeight, shadowColor: '#000' }]}>
      <View style={styles.clip}>
        <LinearGradient
          colors={[palette.heroGradient.top, palette.heroGradient.mid, palette.heroGradient.bottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <View style={styles.body}>
            <Text style={[styles.title, { color: '#FFFFFF' }]} numberOfLines={2}>
              {tpo.copy.heroWord}
            </Text>
            <Text style={styles.subtitle} numberOfLines={3}>
              {tpo.copy.whisper}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: '100%',
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  clip: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.90)',
  },
  body: { gap: 10 },
  title: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 46,
    lineHeight: 44,
    letterSpacing: -1.5,
  },
  subtitle: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.92)',
  },
});
