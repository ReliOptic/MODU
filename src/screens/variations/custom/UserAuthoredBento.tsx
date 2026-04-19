// v2.1 §9 — custom · bento mood. User-authored escape hatch.
// 'custom' assets have no canonical primitive; the user defines composition.
// We fall back to the proximity-driven bento grid arrangement.
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import type { RendererBlock, ResolvedTPO } from '../../../adapters';
import type { VariationProps } from '../types';
import {
  HeroFrame,
  MetaStrip,
  BleedingTitle,
  SectionLabel,
  densityFor,
} from '../_primitives';
import { BentoBlock, type BentoSpan } from '../bento-blocks';
import { s } from '../../../theme';

interface SpannedBlock {
  readonly block: RendererBlock;
  readonly span: BentoSpan;
}

function spanFor(b: RendererBlock, p: ResolvedTPO['proximity']): BentoSpan {
  if (b.variant === 'hero') return [6, p === 'dayof' ? 5 : p === 'near' ? 4 : 3];
  if (b.variant === 'grid') return p === 'week' ? [6, 3] : [4, 3];
  if (b.variant === 'strip') return [6, 2];
  if (b.variant === 'list') return [3, 3];
  if (b.variant === 'card') return [3, 2];
  return [2, 2];
}

function arrange(
  blocks: readonly RendererBlock[],
  p: ResolvedTPO['proximity'],
): readonly SpannedBlock[] {
  const hero = blocks.find((b) => b.variant === 'hero');
  const rest = blocks.filter((b) => b.variant !== 'hero');
  let ordered: readonly RendererBlock[];
  if (p === 'dayof' || p === 'near') {
    ordered = hero !== undefined ? [hero, ...rest] : rest;
  } else if (p === 'after') {
    const lists = rest.filter((b) => b.variant === 'list' || b.variant === 'card');
    const stats = rest.filter((b) => b.variant === 'stat');
    const others = rest.filter(
      (b) => b.variant !== 'list' && b.variant !== 'card' && b.variant !== 'stat',
    );
    ordered = [...lists, ...(hero !== undefined ? [hero] : []), ...stats, ...others];
  } else if (p === 'week') {
    const grids = rest.filter((b) => b.variant === 'grid');
    const others = rest.filter((b) => b.variant !== 'grid');
    ordered = [...grids, ...(hero !== undefined ? [hero] : []), ...others];
  } else {
    const stats = rest.filter((b) => b.variant === 'stat');
    const others = rest.filter((b) => b.variant !== 'stat');
    ordered = [...stats, ...others, ...(hero !== undefined ? [hero] : [])];
  }
  return ordered.map((b) => ({ block: b, span: spanFor(b, p) }));
}

export function UserAuthoredBento({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'bento'),
    [tpo.proximity],
  );
  const arranged = useMemo(
    () => arrange(blocks, tpo.proximity),
    [blocks, tpo.proximity],
  );
  const dim = tpo.visual.dim;

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

      <SectionLabel palette={palette}>나의 챕터</SectionLabel>
      <View style={styles.grid}>
        {arranged.map(({ block, span }, idx) => (
          <Animated.View
            key={block.id}
            entering={FadeIn.delay(idx * 40).duration(360)}
            layout={Layout.duration(420)}
            style={styles.cell}
          >
            <BentoBlock block={block} palette={palette} tpo={tpo} span={span} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: s.md },
  cell: { display: 'flex' },
  tail: { height: 60 },
});
