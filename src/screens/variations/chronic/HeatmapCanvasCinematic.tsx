// v2.1 §9 — chronic · cinematic mood. Full-bleed heatmap as hero canvas.
// Mood='cinematic' → heatmap dominates, single trend strip beneath.
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

const HERO_HEATMAP_DAYS = 84;

export function HeatmapCanvasCinematic({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'cinematic'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;

  const trends = useMemo(
    () => blocks.filter((b) => b.variant === 'strip').slice(0, 2),
    [blocks],
  );
  const stats = useMemo(
    () => blocks.filter((b) => b.variant === 'stat').slice(0, 3),
    [blocks],
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
      >
        <MetaStrip palette={palette} tpo={tpo} />
        <View style={styles.heroBody}>
          <BleedingTitle
            palette={palette}
            text={tpo.copy.heroWord}
            size="mega"
            tone="light"
          />
          <Text style={styles.whisper} numberOfLines={3}>
            {tpo.copy.whisper}
          </Text>
          <View style={styles.bigHeatmap}>
            {Array.from({ length: HERO_HEATMAP_DAYS }).map((_, i) => {
              const intensity = ((i * 17) % 9) / 8;
              return (
                <View
                  key={`big-hm-${i}`}
                  style={[
                    styles.bigHeatCell,
                    { backgroundColor: `rgba(255,255,255,${0.15 + intensity * 0.55})` },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </HeroFrame>

      <SectionLabel palette={palette}>주간 추세</SectionLabel>
      <View style={styles.trendStack}>
        {trends.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 100).duration(420)}
            style={styles.trendRow}
          >
            <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
          </Animated.View>
        ))}
      </View>

      <SectionLabel palette={palette}>핵심 지표</SectionLabel>
      <View style={styles.statRow}>
        {stats.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 80).duration(360)}
            style={styles.statCell}
          >
            <BentoBlock block={b} palette={palette} tpo={tpo} span={[2, 2]} />
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
    paddingBottom: s['2xl'],
    paddingTop: s['2xl'],
    gap: s.lg,
  },
  whisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.92)',
    paddingHorizontal: s.lg,
  },
  bigHeatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    paddingHorizontal: s.lg,
    paddingTop: s.md,
  },
  bigHeatCell: { width: 16, height: 16, borderRadius: 3 },
  trendStack: { paddingHorizontal: s.md, paddingVertical: s.sm, gap: s.xs },
  trendRow: {},
  statRow: { flexDirection: 'row', paddingHorizontal: s.md, gap: s.sm },
  statCell: { flex: 1 },
  tail: { height: 60 },
});
