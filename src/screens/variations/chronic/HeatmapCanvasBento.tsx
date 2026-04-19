// v2.1 §9 — chronic · bento mood. Heatmap-canvas with dense data tiles.
// Mood='bento' → small heatmap header + value/strip tiles.
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

const HEATMAP_DAYS = 28;

export function HeatmapCanvasBento({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'bento'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;

  const heatmapBlock = blocks.find((b) => b.widgetType === 'monthly_heatmap');
  const valueTiles = useMemo(
    () =>
      blocks
        .filter(
          (b) =>
            b.widgetType !== 'monthly_heatmap' &&
            (b.variant === 'stat' || b.variant === 'strip' || b.variant === 'list'),
        )
        .slice(0, density.rowSlots * 2),
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
            tone="light"
          />
          <View style={styles.heroHeatmap}>
            {Array.from({ length: HEATMAP_DAYS }).map((_, i) => {
              const intensity = ((i * 13) % 7) / 6;
              return (
                <View
                  key={`hero-hm-${i}`}
                  style={[
                    styles.heroHeatCell,
                    { backgroundColor: `rgba(255,255,255,${0.18 + intensity * 0.5})` },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </HeroFrame>

      {heatmapBlock !== undefined && (
        <View style={styles.canvasWrap}>
          <SectionLabel palette={palette}>월간 히트맵</SectionLabel>
          <BentoBlock
            block={heatmapBlock}
            palette={palette}
            tpo={tpo}
            span={[6, 4]}
          />
        </View>
      )}

      <SectionLabel palette={palette}>리듬 데이터</SectionLabel>
      <View style={styles.dataGrid}>
        {valueTiles.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 50).duration(320)}
            style={styles.dataCell}
          >
            <BentoBlock
              block={b}
              palette={palette}
              tpo={tpo}
              span={b.variant === 'strip' ? [6, 3] : [3, 2]}
            />
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
    paddingTop: s.xl,
    gap: s.lg,
  },
  heroHeatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  heroHeatCell: { width: 14, height: 14, borderRadius: 2 },
  canvasWrap: { paddingHorizontal: s.lg, paddingVertical: s.md, gap: s.sm },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: s.md },
  dataCell: { flexShrink: 0 },
  tail: { height: 60 },
});
