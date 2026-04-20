// v2.1 §9 — fertility · bento mood (Phase 5B production port).
// Grid-based editorial system: per-proximity structures table drives tile order + spans.
// Reference: variation-bento.jsx BentoAsset + useMemoBlocks.
// R1: hero ≥ 56% via tileMinHeight(5) on dayof. Reduce-motion via useReduceMotion.
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import type { VariationProps } from '../types';
import { MetaStrip, SectionLabel } from '../_primitives';
import { s } from '../../../theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { BENTO_STRUCTURES } from './bentoData';
import { renderBentoSection } from './bentoSections';

export function TimelineSpineBento({
  tpo,
  palette,
}: VariationProps): React.JSX.Element {
  const reduceMotion = useReduceMotion();
  const structure = useMemo(
    () => BENTO_STRUCTURES[tpo.proximity],
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;

  return (
    <ScrollView
      style={[styles.root, { opacity: dim }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Page header — eyebrow + headline + whisper */}
      <View style={[styles.header, { backgroundColor: palette[50] }]}>
        <MetaStrip palette={palette} tpo={tpo} />
        <Text style={[styles.headline, { color: palette[900] }]} numberOfLines={2}>
          {tpo.copy.headline}
        </Text>
        <Text style={[styles.whisper, { color: palette[700] }]} numberOfLines={2}>
          {tpo.copy.whisper}
        </Text>
      </View>

      {/* Bento grid section */}
      <SectionLabel palette={palette}>지금의 조각들</SectionLabel>
      <View style={styles.grid}>
        {structure.tiles.map((cfg, idx) => {
          const [colSpan, rowSpan] = cfg.span;
          const widthPct = `${Math.round((colSpan / 6) * 100)}%` as const;
          const tile = renderBentoSection({
            id: cfg.id,
            rowSpan,
            palette,
            tpo,
          });
          if (tile === null) return null;
          const AnimWrapper = reduceMotion ? View : Animated.View;
          const animProps = reduceMotion
            ? {}
            : {
                entering: FadeIn.delay(idx * 50).duration(320),
                layout: Layout.duration(360),
              };
          return (
            <AnimWrapper
              key={cfg.id}
              {...animProps}
              style={[styles.cell, { width: widthPct }]}
            >
              {tile}
            </AnimWrapper>
          );
        })}
      </View>

      <View style={styles.tail} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: {
    paddingHorizontal: s.lg,
    paddingTop: s.md,
    paddingBottom: s.xl,
  },
  headline: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    marginTop: s.sm,
  },
  whisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginTop: s.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: s.lg,
    gap: 0,
  },
  cell: {
    padding: 5,
  },
  tail: { height: 60 },
});
