// Variation B — Bento Reflow (TPO-reactive).
// Proximity reorders blocks; time-of-day modulates density. Hero block is
// always promoted to col-span 6; smaller blocks fill the grid by priority.
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import type { RendererBlock, ResolvedTPO } from '../../adapters';
import type { PaletteSwatch } from '../../theme';
import type { VariationProps } from './types';
import { proximityLabel } from './types';
import { BentoBlock, type BentoSpan } from './bento-blocks';

interface SpannedBlock {
  readonly block: RendererBlock;
  readonly span: BentoSpan;
}

/** TPO-driven span allocation per variant. Hero is always col-6. */
function spanFor(block: RendererBlock, proximity: ResolvedTPO['proximity']): BentoSpan {
  if (block.variant === 'hero') {
    if (proximity === 'dayof') return [6, 5];
    if (proximity === 'near')  return [6, 4];
    return [6, 3];
  }
  if (block.variant === 'grid') return proximity === 'week' ? [6, 3] : [4, 3];
  if (block.variant === 'strip') return [6, 2];
  if (block.variant === 'list') return [3, 3];
  if (block.variant === 'card') return [3, 2];
  // stat
  return [2, 2];
}

/** Reorder blocks by proximity priority. Hero floats to top on dayof/near. */
function arrangeBlocks(
  blocks: readonly RendererBlock[],
  proximity: ResolvedTPO['proximity'],
): readonly SpannedBlock[] {
  const hero = blocks.find((b) => b.variant === 'hero');
  const rest = blocks.filter((b) => b.variant !== 'hero');

  if (proximity === 'dayof' || proximity === 'near') {
    const ordered = hero !== undefined ? [hero, ...rest] : rest;
    return ordered.map((b) => ({ block: b, span: spanFor(b, proximity) }));
  }
  if (proximity === 'after') {
    // Recovery: lists/cards lead, hero settles mid-page.
    const lists = rest.filter((b) => b.variant === 'list' || b.variant === 'card');
    const stats = rest.filter((b) => b.variant === 'stat');
    const others = rest.filter(
      (b) => b.variant !== 'list' && b.variant !== 'card' && b.variant !== 'stat',
    );
    const ordered = [...lists, ...(hero !== undefined ? [hero] : []), ...stats, ...others];
    return ordered.map((b) => ({ block: b, span: spanFor(b, proximity) }));
  }
  if (proximity === 'week') {
    const grids = rest.filter((b) => b.variant === 'grid');
    const others = rest.filter((b) => b.variant !== 'grid');
    const ordered = [...grids, ...(hero !== undefined ? [hero] : []), ...others];
    return ordered.map((b) => ({ block: b, span: spanFor(b, proximity) }));
  }
  // far: ambient — stats first, hero deprioritised
  const stats = rest.filter((b) => b.variant === 'stat');
  const others = rest.filter((b) => b.variant !== 'stat');
  const ordered = [...stats, ...others, ...(hero !== undefined ? [hero] : [])];
  return ordered.map((b) => ({ block: b, span: spanFor(b, proximity) }));
}

export function BentoVariation({ tpo, blocks, palette }: VariationProps): React.JSX.Element {
  const arranged = useMemo(() => arrangeBlocks(blocks, tpo.proximity), [blocks, tpo.proximity]);
  const dim = tpo.visual.dim;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette[50], opacity: dim }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <BentoHeader palette={palette} tpo={tpo} />
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
      <View style={styles.tailSpacer} />
    </ScrollView>
  );
}

interface BentoHeaderProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
}

function BentoHeader({ palette, tpo }: BentoHeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View style={styles.eyebrowRow}>
        <View style={[styles.eyebrowDot, { backgroundColor: palette.accent }]} />
        <Text style={[styles.eyebrow, { color: palette[700] }]}>
          {tpo.assetKey.toUpperCase()} · {proximityLabel(tpo.proximity)} · {tpo.timeOfDay.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.headline, { color: palette[900] }]} numberOfLines={2}>
        {tpo.copy.headline}
      </Text>
      <Text style={[styles.whisper, { color: palette[700] }]} numberOfLines={3}>
        {tpo.copy.whisper}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    gap: 8,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.2,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  headline: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
  },
  whisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 11,
  },
  cell: { display: 'flex' },
  tailSpacer: { height: 60 },
});
