// v2.1 §9 — fertility · cinematic mood. Single editorial spine, large hero.
// Mood='cinematic' → tall hero, fewer rows, more breathing space.
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

export function TimelineSpineCinematic({
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
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, 3),
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
            text={tpo.copy.headline}
            italicWord={tpo.copy.heroWord}
            size="mega"
            bleed
            tone="light"
            maxLines={3}
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
          {'의 자리로.'}
        </Text>
      </View>

      <SectionLabel palette={palette}>다가오는 흐름</SectionLabel>
      <View style={styles.editorialSpine}>
        <View style={[styles.spineLine, { backgroundColor: palette[300] }]} />
        {featured.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 80).duration(420)}
            style={styles.spineRow}
          >
            <View
              style={[
                styles.spineDot,
                { backgroundColor: palette.accent, borderColor: '#FFFFFF' },
              ]}
            />
            <View style={styles.spineTile}>
              <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
            </View>
          </Animated.View>
        ))}
      </View>

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
  editorialSpine: {
    paddingHorizontal: s.lg,
    paddingTop: s.md,
    paddingBottom: s.lg,
    position: 'relative',
  },
  spineLine: {
    position: 'absolute',
    left: 27,
    top: 28,
    bottom: 28,
    width: 1.5,
  },
  spineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: s.lg,
    gap: s.md,
  },
  spineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 18,
    marginLeft: 20,
    borderWidth: 3,
  },
  spineTile: { flex: 1 },
  recentBlock: { paddingHorizontal: s.lg, paddingVertical: s.lg },
  recentText: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  tail: { height: 60 },
});
