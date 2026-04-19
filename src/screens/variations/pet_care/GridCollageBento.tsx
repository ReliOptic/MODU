// v2.1 §9 — pet_care · bento mood. 2D polaroid-grid collage.
// Mood='bento' → tight 2-col grid of pet tiles + small hero.
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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

export function GridCollageBento({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'bento'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;

  const heroBlock = blocks.find((b) => b.variant === 'hero');
  const tiles = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, density.rowSlots * 2),
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
            size="display"
            tone="light"
          />
        </View>
      </HeroFrame>

      {heroBlock !== undefined && (
        <View style={styles.heroTile}>
          <SectionLabel palette={palette}>오늘의 친구</SectionLabel>
          <BentoBlock block={heroBlock} palette={palette} tpo={tpo} span={[6, 3]} />
        </View>
      )}

      <SectionLabel palette={palette}>오늘의 콜라주</SectionLabel>
      <View style={styles.collage}>
        {tiles.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 60).duration(360)}
            style={styles.polaroidWrap}
          >
            <View
              style={[
                styles.polaroidFrame,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: palette[200],
                  transform: [{ rotate: `${(i % 2 === 0 ? -1 : 1) * 1.5}deg` }],
                },
              ]}
            >
              <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
              <Text style={[styles.polaroidCaption, { color: palette[700] }]}>
                {b.widgetType.replace(/_/g, ' ')}
              </Text>
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
  scrollContent: { paddingBottom: 120 },
  heroBody: { paddingHorizontal: s.lg, paddingBottom: s['2xl'], paddingTop: s.xl },
  heroTile: { paddingHorizontal: s.lg, paddingVertical: s.md, gap: s.sm },
  collage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: s.md,
    gap: s.sm,
  },
  polaroidWrap: { width: '48%' },
  polaroidFrame: {
    borderRadius: 8,
    borderWidth: 1,
    padding: s.sm,
    paddingBottom: s.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: s.xs,
  },
  polaroidCaption: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 1.6,
    textAlign: 'center',
    paddingTop: s.xs,
    textTransform: 'uppercase',
  },
  tail: { height: 60 },
});
