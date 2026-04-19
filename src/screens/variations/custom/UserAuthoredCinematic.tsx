// v2.1 §9 — custom · cinematic mood. User-authored editorial hero.
// Falls back to proximity-driven editorial flow when user has no template.
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

export function UserAuthoredCinematic({
  tpo,
  blocks,
  timeline,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'cinematic'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;

  const featured = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, 4),
    [blocks],
  );
  const recentDay = timeline[0] ?? null;

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
          <Text style={styles.whisper} numberOfLines={4}>
            {tpo.copy.whisper}
          </Text>
        </View>
      </HeroFrame>

      <SectionLabel palette={palette}>오늘의 호흡</SectionLabel>
      <View style={styles.pullQuoteWrap}>
        <Text style={[styles.pullQuote, { color: palette[900] }]}>
          {tpo.copy.headline}
          {' — '}
          <Text style={{ color: palette.accent, fontStyle: 'italic' }}>
            {tpo.copy.heroWord}
          </Text>
        </Text>
      </View>

      <SectionLabel palette={palette}>다가오는 흐름</SectionLabel>
      {featured.map((b, i) => (
        <Animated.View
          key={b.id}
          entering={FadeIn.delay(i * 80).duration(400)}
          style={styles.row}
        >
          <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
        </Animated.View>
      ))}

      {recentDay !== null && (
        <View style={styles.recentBlock}>
          <SectionLabel palette={palette}>지난 기록 · {recentDay.dateKey}</SectionLabel>
          <Text
            style={[styles.recentText, { color: palette[900] }]}
            numberOfLines={3}
          >
            {recentDay.entries[0]?.text ?? `${recentDay.entries.length}개 기록`}
          </Text>
        </View>
      )}
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
  pullQuoteWrap: { paddingHorizontal: s.lg, paddingVertical: s.md },
  pullQuote: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  row: { paddingHorizontal: s.md },
  recentBlock: { paddingHorizontal: s.lg, paddingVertical: s.lg },
  recentText: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  tail: { height: 60 },
});
