// v2.1 §9 — fertility · bento mood. Vertical timeline-spine with dense rows.
// Mood='bento' → high accent density, multiple rows, less hero bonus.
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import type { VariationProps } from '../types';
import {
  HeroFrame,
  MetaStrip,
  BleedingTitle,
  SectionLabel,
  densityFor,
} from '../_primitives';
import { BentoBlock } from '../bento-blocks';
import { s } from '../../../theme';

export function TimelineSpineBento({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'bento'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;

  const spineBlocks = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, density.rowSlots + 1),
    [blocks, density.rowSlots],
  );

  return (
    <ScrollView
      style={[styles.root, { opacity: dim }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <HeroFrame
        palette={palette}
        heroBonus={density.heroBonus}
        minScale={density.heroMinScale}
        insetHorizontal={s.lg}
        insetTop={s.md}
      >
        <MetaStrip palette={palette} tpo={tpo} />
        <View style={styles.heroBody}>
          <BleedingTitle
            palette={palette}
            text={tpo.copy.headline}
            italicWord={tpo.copy.heroWord}
            size={density.accentDensity === 'punch' ? 'mega' : 'display'}
            bleed
            tone="light"
          />
          <Text style={styles.whisper} numberOfLines={3}>
            {tpo.copy.whisper}
          </Text>
        </View>
      </HeroFrame>

      <SectionLabel palette={palette}>흐름의 척추</SectionLabel>
      <View style={styles.spine}>
        <View style={[styles.spineLine, { backgroundColor: palette[300] }]} />
        {spineBlocks.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 50).duration(320)}
            layout={Layout.duration(360)}
            style={styles.spineRow}
          >
            <View
              style={[
                styles.spineDot,
                { backgroundColor: palette.accent, borderColor: '#FFFFFF' },
              ]}
            />
            <View style={styles.spineTile}>
              <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
            </View>
          </Animated.View>
        ))}
      </View>
      <View style={styles.tail} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  heroBody: {
    paddingHorizontal: s.lg,
    paddingBottom: s['2xl'],
    paddingTop: s.xl,
    gap: s.md,
  },
  whisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
    paddingHorizontal: s.lg,
  },
  spine: { paddingHorizontal: s.lg, paddingVertical: s.lg, position: 'relative' },
  spineLine: {
    position: 'absolute',
    left: 27,
    top: 28,
    bottom: 28,
    width: 1.5,
  },
  spineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: s.md,
    gap: s.md,
  },
  spineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 18,
    marginLeft: 20,
    borderWidth: 3,
  },
  spineTile: { flex: 1 },
  tail: { height: 60 },
});
