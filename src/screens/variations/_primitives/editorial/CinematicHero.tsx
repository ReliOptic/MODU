// Editorial primitive: CinematicHero — rich scroll-parallax hero.
// R1 hero dominance: height is caller-provided (≥380px for all proximities).
// R13: exactly one italic word (heroWord) in Fraunces title. lineHeight = fontSize*0.88.
// No image URLs — pure LinearGradient from palette.heroGradient.
// Parallax via Reanimated; reduce-motion path skips animated styles.
// Styles extracted to cinematicHeroStyles.ts to stay ≤200 LOC.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { proximityLabel } from '../../types';
import { useReduceMotion } from '../../../../hooks/useReduceMotion';
import { heroStyles } from './cinematicHeroStyles';

export interface CinematicHeroProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  /** Fix 2: mono chapter number e.g. '01'..'05' */
  readonly chapterNum: '01' | '02' | '03' | '04' | '05';
  readonly chapterName: string;
  readonly height: number;
  /** Fix 1: exact font-size in px (proximity-keyed by caller). */
  readonly titleFontSize: number;
  readonly scrollY: SharedValue<number>;
  /** Fix 3: human-readable brand label, e.g. palette name. */
  readonly brandLabel: string;
  /** Fix 4: localised place label, e.g. "서울". Empty string → omit the line. */
  readonly placeLabel: string;
}

export function CinematicHero({
  palette,
  tpo,
  chapterNum,
  chapterName,
  height,
  titleFontSize,
  scrollY,
  brandLabel,
  placeLabel,
}: CinematicHeroProps): React.JSX.Element {
  const reduceMotion = useReduceMotion();

  const bgAnimStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [{ translateY: Math.min(scrollY.value * 0.4, 200) }],
    };
  });

  const titleAnimStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [{ translateY: -Math.min(scrollY.value * 0.15, 80) }],
      opacity: interpolate(scrollY.value, [0, 500], [1, 0], Extrapolate.CLAMP),
    };
  });

  const occLabel = proximityLabel(tpo.proximity);
  // Fix 1 + 13: fontSize from prop; lineHeight = round(fontSize * 0.88)
  const heroLineHeight = Math.round(titleFontSize * 0.88);

  return (
    <View style={[heroStyles.container, { height }]}>
      {/* Full-bleed gradient background — parallax on scroll */}
      <Animated.View style={[StyleSheet.absoluteFillObject, bgAnimStyle]}>
        <LinearGradient
          colors={[palette.heroGradient.top, palette.heroGradient.mid, palette.heroGradient.bottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Fix 6: bottom scrim — dissolves hero into next section */}
      <LinearGradient
        colors={['rgba(10,10,12,0.25)', 'rgba(10,10,12,0)', 'rgba(10,10,12,0)', palette[50]]}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Top strip: MODU · brandLabel (Fix 3) + D-day pill */}
      <View style={heroStyles.topStrip}>
        <Text style={heroStyles.topMono}>MODU · {brandLabel}</Text>
        <View style={heroStyles.pill}>
          <Text style={heroStyles.pillText}>{occLabel} · {tpo.timeOfDay.toUpperCase()}</Text>
        </View>
      </View>

      {/* Title block — parallax + fade on scroll */}
      <Animated.View style={[heroStyles.titleBlock, titleAnimStyle]}>
        {/* Chapter eyebrow — Fix 2: mono digits */}
        <Text style={heroStyles.eyebrow}>
          {'Chapter '}{chapterNum}{' — '}{chapterName}{' · '}{tpo.copy.headline}
        </Text>

        {/* Fraunces heroWord — italic per R13; lineHeight fix 13 */}
        <Text style={[heroStyles.heroTitle, { fontSize: titleFontSize, lineHeight: heroLineHeight }]}>
          <Text style={heroStyles.heroItalic}>{tpo.copy.heroWord}</Text>
          {'.'}
        </Text>

        <Text style={heroStyles.whisper} numberOfLines={3}>{tpo.copy.whisper}</Text>

        {/* Fix 4: placeLabel — omit when empty */}
        {placeLabel.length > 0 ? (
          <Text style={heroStyles.placeLabel}>{placeLabel}</Text>
        ) : null}
      </Animated.View>
    </View>
  );
}
