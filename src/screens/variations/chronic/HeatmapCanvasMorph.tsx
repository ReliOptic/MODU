// v2.1 §9 — chronic · morph mood. Ambient trend curve, soft data.
// Mood='morph' → muted heatmap, gentle ribbon, breathing.
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

const RIBBON_WEEKS = 8;

export function HeatmapCanvasMorph({
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

  const trend = blocks.find((b) => b.variant === 'strip');
  const restingTiles = useMemo(
    () => blocks.filter((b) => b.variant === 'stat' || b.variant === 'list').slice(0, density.rowSlots),
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
        cornerRadius={36}
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
          <Text style={styles.whisper} numberOfLines={4}>
            {tpo.copy.whisper}
          </Text>
          <View style={styles.ribbon}>
            {Array.from({ length: RIBBON_WEEKS }).map((_, i) => {
              const h = 8 + ((i * 11) % 24);
              return (
                <View
                  key={`ribbon-${i}`}
                  style={[
                    styles.ribbonBar,
                    {
                      height: h,
                      backgroundColor: `rgba(255,255,255,${0.4 + (h / 32) * 0.4})`,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </HeroFrame>

      {trend !== undefined && (
        <View style={styles.softWrap}>
          <SectionLabel palette={palette}>잔잔한 흐름</SectionLabel>
          <View
            style={[
              styles.softFrame,
              { backgroundColor: palette[100], borderColor: palette[200] },
            ]}
          >
            <BentoBlock block={trend} palette={palette} tpo={tpo} span={[6, 3]} />
          </View>
        </View>
      )}

      <SectionLabel palette={palette}>오늘의 점검</SectionLabel>
      <View style={[styles.restRow, { gap: s.sm * breath }]}>
        {restingTiles.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 100).duration(440)}
            style={styles.restCell}
          >
            <View
              style={[
                styles.softFrame,
                { backgroundColor: palette[100], borderColor: palette[200] },
              ]}
            >
              <BentoBlock block={b} palette={palette} tpo={tpo} span={[3, 2]} />
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
  ribbon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: s.lg,
    paddingTop: s.sm,
  },
  ribbonBar: { flex: 1, borderRadius: 3 },
  softWrap: { paddingHorizontal: s.lg, gap: s.sm },
  softFrame: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  restRow: { flexDirection: 'row', paddingHorizontal: s.lg },
  restCell: { flex: 1 },
  tail: { height: 60 },
});
