// v2.1 §9 — cancer_caregiver · cinematic mood. Phase as hero spine.
// Mood='cinematic' → phase rail dominates, single treatment timeline below.
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
  if (p === 'dayof' || p === 'near' || p === 'week') return 1;
  if (p === 'after') return 2;
  return 3;
}

export function PhaseRailsCinematic({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'cinematic'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;
  const phaseIdx = useMemo(() => phaseIndexFor(tpo.proximity), [tpo.proximity]);

  const featured = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, 4),
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
          <View style={styles.bigPhaseTrack}>
            <View style={[styles.bigPhaseLine, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
            <View style={styles.bigPhaseRow}>
              {PHASES.map((label, i) => {
                const active = i === phaseIdx;
                return (
                  <View key={label} style={styles.bigPhaseCol}>
                    <View
                      style={[
                        styles.bigPhaseDot,
                        {
                          backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                          width: active ? 18 : 12,
                          height: active ? 18 : 12,
                          borderRadius: active ? 9 : 6,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.bigPhaseLabel,
                        {
                          color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                          fontSize: active ? 12 : 10,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          <BleedingTitle
            palette={palette}
            text={tpo.copy.heroWord}
            size="mega"
            tone="light"
          />
          <Text style={styles.whisper} numberOfLines={3}>
            {tpo.copy.whisper}
          </Text>
        </View>
      </HeroFrame>

      <SectionLabel palette={palette}>오늘의 약속</SectionLabel>
      <View style={styles.timeline}>
        <View style={[styles.timelineLine, { backgroundColor: palette[300] }]} />
        {featured.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 90).duration(420)}
            style={styles.timelineRow}
          >
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: palette.accent, borderColor: '#FFFFFF' },
              ]}
            />
            <View style={styles.timelineTile}>
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
  bigPhaseTrack: { paddingHorizontal: s.md, paddingVertical: s.md, position: 'relative' },
  bigPhaseLine: { position: 'absolute', left: 28, right: 28, top: 22, height: 1 },
  bigPhaseRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bigPhaseCol: { alignItems: 'center', gap: s.sm, width: 56 },
  bigPhaseDot: {},
  bigPhaseLabel: {
    letterSpacing: 1.8,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  timeline: { paddingHorizontal: s.lg, paddingVertical: s.lg, position: 'relative' },
  timelineLine: { position: 'absolute', left: 27, top: 28, bottom: 28, width: 1.5 },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: s.lg,
    gap: s.md,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 18,
    marginLeft: 20,
    borderWidth: 3,
  },
  timelineTile: { flex: 1 },
  tail: { height: 60 },
});
