// v2.1 §9 — cancer_caregiver · bento mood. Phase indicator + dense rails.
// Mood='bento' → compact phase header, multiple short rails.
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

const PHASES = ['진단', '치료', '회복', '관찰'] as const;

function phaseIndexFor(p: string): number {
  if (p === 'dayof') return 1;
  if (p === 'near') return 1;
  if (p === 'week') return 1;
  if (p === 'after') return 2;
  return 3;
}

export function PhaseRailsBento({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'bento'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;
  const phaseIdx = useMemo(() => phaseIndexFor(tpo.proximity), [tpo.proximity]);

  const railA = useMemo(
    () => blocks.filter((b) => b.variant === 'card' || b.variant === 'list').slice(0, density.rowSlots),
    [blocks, density.rowSlots],
  );
  const railB = useMemo(
    () => blocks.filter((b) => b.variant === 'stat' || b.variant === 'strip').slice(0, density.rowSlots),
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
          <View style={styles.phaseStrip}>
            {PHASES.map((label, i) => {
              const active = i === phaseIdx;
              return (
                <View key={label} style={styles.phaseCol}>
                  <View
                    style={[
                      styles.phaseDot,
                      {
                        backgroundColor: active
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.35)',
                        borderColor: active ? '#FFFFFF' : 'transparent',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.phaseLabel,
                      {
                        color: active
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.6)',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
          <BleedingTitle
            palette={palette}
            text={tpo.copy.headline}
            italicWord={tpo.copy.heroWord}
            size="display"
            tone="light"
          />
        </View>
      </HeroFrame>

      <SectionLabel palette={palette}>오늘의 약속</SectionLabel>
      <Rail items={railA} palette={palette} tpo={tpo} />
      <SectionLabel palette={palette}>지표 점검</SectionLabel>
      <Rail items={railB} palette={palette} tpo={tpo} />
      <View style={styles.tail} />
    </ScrollView>
  );
}

interface RailProps {
  readonly items: readonly import('../../../adapters').RendererBlock[];
  readonly palette: import('../../../theme').PaletteSwatch;
  readonly tpo: import('../../../adapters').ResolvedTPO;
}

function Rail({ items, palette, tpo }: RailProps): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.railContent}
    >
      {items.map((b, i) => (
        <Animated.View
          key={b.id}
          entering={FadeIn.delay(i * 50).duration(320)}
          style={styles.railCell}
        >
          <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
        </Animated.View>
      ))}
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
  phaseStrip: { flexDirection: 'row', justifyContent: 'space-between' },
  phaseCol: { alignItems: 'center', gap: s.xs },
  phaseDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  phaseLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  railContent: { paddingHorizontal: s.md, gap: s.sm },
  railCell: { width: 240 },
  tail: { height: 60 },
});
