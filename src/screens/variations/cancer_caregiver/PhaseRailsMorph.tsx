// v2.1 §9 — cancer_caregiver · morph mood. Gentle phase, memo-forward.
// Mood='morph' → soft phase ribbon, memo cards with breathing space.
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
  if (p === 'after') return 2;
  return 3;
}

export function PhaseRailsMorph({
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
  const phaseIdx = useMemo(() => phaseIndexFor(tpo.proximity), [tpo.proximity]);

  const memos = useMemo(
    () => blocks.filter((b) => b.variant === 'card' || b.variant === 'list').slice(0, density.rowSlots),
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
          <View style={styles.softPhase}>
            {PHASES.map((label, i) => {
              const active = i === phaseIdx;
              return (
                <Text
                  key={label}
                  style={[
                    styles.softPhaseLabel,
                    {
                      color: active ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                      fontWeight: active ? '600' : '400',
                    },
                  ]}
                >
                  {label}
                </Text>
              );
            })}
          </View>
          <BleedingTitle
            palette={palette}
            text={tpo.copy.heroWord}
            size="display"
            tone="light"
          />
          <Text style={styles.whisper} numberOfLines={4}>
            {tpo.copy.whisper}
          </Text>
        </View>
      </HeroFrame>

      <SectionLabel palette={palette}>지난 메모</SectionLabel>
      <View style={[styles.memoStack, { gap: s.md * breath }]}>
        {memos.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 100).duration(440)}
          >
            <View
              style={[
                styles.softFrame,
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
  softPhase: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.md,
    paddingHorizontal: s.lg,
  },
  softPhaseLabel: {
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  memoStack: { paddingHorizontal: s.lg },
  softFrame: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  tail: { height: 60 },
});
