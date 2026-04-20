// Morph mood — hero blob scene. Proximity drives blob size + countdown label.
// Uses palette.heroGradient for fill; LinearGradient wrapped in parent View
// to avoid iOS shadow bug (shadow on the parent, gradient inside child).
// Reduce-motion: when true, entering FadeIn is disabled.
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { elevation } from '../../../../theme';
import { s } from '../../../../theme';
import { MetaStrip } from '../MetaStrip';

export interface MorphHeroBlobProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  /** Extra height bonus from MORPH_SHAPES.heroHeightBonus */
  readonly heroHeightBonus: number;
  /** Blob diameter in points */
  readonly blobSize: number;
  readonly showCountdown: boolean;
  readonly reduceMotion: boolean;
}

const COUNTDOWN_LABELS: Readonly<Record<ResolvedTPO['proximity'], string>> = {
  far:   '',
  week:  '3일 후',
  near:  '내일 09:00',
  dayof: '09:00 · 지금',
  after: '',
};

const PROXIMITY_LABEL: Readonly<Record<ResolvedTPO['proximity'], string>> = {
  far:   'D-7+',
  week:  'D-3',
  near:  'D-1',
  dayof: 'D-DAY',
  after: 'D+1',
};

// Title font sizes per proximity
const HERO_FONT: Readonly<Record<ResolvedTPO['proximity'], number>> = {
  far:   52,
  week:  62,
  near:  72,
  dayof: 84,
  after: 52,
};

export function MorphHeroBlob({
  palette,
  tpo,
  heroHeightBonus,
  blobSize,
  showCountdown,
  reduceMotion,
}: MorphHeroBlobProps): React.JSX.Element {
  // P0.3: fixed base 400 + heroHeightBonus (matches reference exactly, preserves proximity gradation)
  const minHeight = 400 + heroHeightBonus;
  const L3 = elevation.L3;
  const shadow = L3.shadow[0];
  const titleSize = HERO_FONT[tpo.proximity];
  const countdownLabel = COUNTDOWN_LABELS[tpo.proximity];
  const proximityTag = PROXIMITY_LABEL[tpo.proximity];

  const entering = reduceMotion ? undefined : FadeIn.duration(480);

  return (
    <View style={[styles.container, { minHeight }]}>
      {/* MetaStrip sits above the blob */}
      <MetaStrip palette={palette} tpo={tpo} />

      {/* Blob shell: shadow on outer View, gradient inside clipped inner View */}
      <View
        style={[
          styles.blobOuter,
          {
            width: blobSize,
            height: blobSize,
            borderRadius: blobSize / 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: shadow?.offsetY ?? 24 },
            shadowOpacity: shadow?.opacity ?? 0.18,
            shadowRadius: shadow?.blur ?? 40,
            elevation: 8,
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFillObject, styles.blobClip, { borderRadius: blobSize / 2 }]}>
          <LinearGradient
            colors={[palette.heroGradient.top, palette.heroGradient.mid, palette.heroGradient.bottom]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Blob content: countdown + heroWord + whisper */}
        <Animated.View
          entering={entering}
          style={styles.blobContent}
        >
          {showCountdown && countdownLabel.length > 0 && (
            <Text style={styles.countdown}>
              {countdownLabel} · {proximityTag}
            </Text>
          )}
          <Text
            style={[styles.heroWord, { fontSize: titleSize, color: '#FFFFFF' }]}
            numberOfLines={2}
          >
            {tpo.copy.heroWord}
          </Text>
          <Text style={styles.whisperInline} numberOfLines={3}>
            {tpo.copy.whisper}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: s.sm,
    paddingBottom: s.lg,
  },
  blobOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobClip: {
    overflow: 'hidden',
  },
  blobContent: {
    alignItems: 'center',
    paddingHorizontal: s.xl,
    gap: s.md,
  },
  countdown: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },
  heroWord: {
    fontFamily: 'Fraunces_400Regular',
    lineHeight: 84,
    letterSpacing: -1.8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  whisperInline: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    maxWidth: 240,
    letterSpacing: -0.1,
  },
});
