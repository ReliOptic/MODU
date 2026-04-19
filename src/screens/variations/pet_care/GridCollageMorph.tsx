// v2.1 §9 — pet_care · morph mood. Floating scattered tiles, ambient breath.
// Mood='morph' → loose composition, soft edges, hidden grid.
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

export function GridCollageMorph({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'morph'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;
  const breath = density.breathingMultiplier;

  const heroBlock = blocks.find((b) => b.variant === 'hero');
  const floats = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, density.rowSlots),
    [blocks, density.rowSlots],
  );

  return (
    <ScrollView
      style={[styles.root, { opacity: dim }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: s.lg * breath, gap: s.lg * breath },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <HeroFrame
        palette={palette}
        heroBonus={density.heroBonus}
        minScale={density.heroMinScale}
        cornerRadius={40}
        insetHorizontal={s.lg}
      >
        <MetaStrip palette={palette} tpo={tpo} />
        <View style={[styles.heroBody, { paddingBottom: s['2xl'] * breath }]}>
          <BleedingTitle
            palette={palette}
            text={tpo.copy.heroWord}
            size="display"
            tone="light"
          />
          <Text style={styles.whisper} numberOfLines={3}>
            {tpo.copy.whisper}
          </Text>
        </View>
      </HeroFrame>

      {heroBlock !== undefined && (
        <View style={styles.heroTileWrap}>
          <SectionLabel palette={palette}>오늘의 친구</SectionLabel>
          <View
            style={[
              styles.softFrame,
              { backgroundColor: palette[100], borderColor: palette[200] },
            ]}
          >
            <BentoBlock block={heroBlock} palette={palette} tpo={tpo} span={[6, 4]} />
          </View>
        </View>
      )}

      <SectionLabel palette={palette}>흩어진 기록</SectionLabel>
      <View style={[styles.floats, { gap: s.md * breath }]}>
        {floats.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 100).duration(480)}
            style={[
              styles.floatItem,
              {
                marginLeft: i % 2 === 0 ? 0 : s['2xl'],
                marginRight: i % 2 === 0 ? s['2xl'] : 0,
              },
            ]}
          >
            <View
              style={[
                styles.floatFrame,
                { backgroundColor: palette[100], borderColor: palette[200] },
              ]}
            >
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
  scrollContent: { paddingBottom: 120 },
  heroBody: {
    paddingHorizontal: s.lg,
    paddingTop: s['2xl'],
    gap: s.md,
    alignItems: 'flex-start',
  },
  whisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    paddingHorizontal: s.lg,
  },
  heroTileWrap: { paddingHorizontal: s.lg, gap: s.sm },
  softFrame: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  floats: { paddingHorizontal: s.lg },
  floatItem: {},
  floatFrame: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  tail: { height: 60 },
});
