// v2.2 — custom · cinematic · TPO-driven section order.
// Lighter flow: BentoBlock-based blocks instead of fertility-specific sections.
// testID="section-{id}" on each section wrapper for test visibility.
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import type { VariationProps } from '../types';
import type { ResolvedTPO } from '../../../adapters';
import {
  CinematicHero,
  EditorialMoodPalette,
  PullQuote,
  ClosingCard,
} from '../_primitives/editorial';
import { BentoBlock } from '../bento-blocks';
import { s } from '../../../theme';

// ---------------------------------------------------------------------------
// TPO-driven structure tables (custom — neutral chapter names)
// ---------------------------------------------------------------------------

type SectionId = 'hero' | 'blocks2' | 'blocks3' | 'pullquote' | 'mood' | 'closing';
type Proximity = ResolvedTPO['proximity'];

const SECTION_ORDER: Readonly<Record<Proximity, ReadonlyArray<SectionId>>> = {
  far:   ['hero', 'pullquote', 'blocks2', 'mood', 'closing'],
  week:  ['hero', 'pullquote', 'blocks2', 'mood', 'closing'],
  near:  ['hero', 'blocks3', 'pullquote', 'mood', 'closing'],
  dayof: ['hero', 'blocks3', 'pullquote', 'mood', 'closing'],
  after: ['hero', 'pullquote', 'blocks2', 'closing'],
};

const HERO_HEIGHT: Readonly<Record<Proximity, number>> = {
  far: 480, week: 560, near: 640, dayof: 760, after: 380,
};

// Fix 1: exact pixel sizes, not 'display'|'mega' bucket
const TITLE_SIZE: Readonly<Record<Proximity, number>> = {
  far: 56, week: 76, near: 84, dayof: 120, after: 56,
};

// Fix 2: mono digits, not Roman numerals
const CHAPTER_NUM: Readonly<Record<Proximity, '01' | '02' | '03' | '04' | '05'>> = {
  far: '01', week: '02', near: '03', dayof: '04', after: '05',
};

const CHAPTER_NAME: Readonly<Record<Proximity, string>> = {
  far: '서문', week: '준비', near: '다가옴', dayof: '오늘', after: '이후',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserAuthoredCinematic({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const sections = useMemo(
    () => SECTION_ORDER[tpo.proximity],
    [tpo.proximity],
  );

  const featuredBlocks2 = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, 2),
    [blocks],
  );

  const featuredBlocks3 = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, 3),
    [blocks],
  );

  return (
    <Animated.ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {sections.map((id) => {
        switch (id) {
          case 'hero':
            return (
              <View key="hero" testID="section-hero">
                <CinematicHero
                  palette={palette}
                  tpo={tpo}
                  chapterNum={CHAPTER_NUM[tpo.proximity]}
                  chapterName={CHAPTER_NAME[tpo.proximity]}
                  height={HERO_HEIGHT[tpo.proximity]}
                  titleFontSize={TITLE_SIZE[tpo.proximity]}
                  scrollY={scrollY}
                  brandLabel="Dusk"
                  placeLabel=""
                />
              </View>
            );
          case 'pullquote':
            return (
              <View key="pullquote" testID="section-pullquote">
                <PullQuote
                  palette={palette}
                  headline={tpo.copy.headline}
                  heroWord={tpo.copy.heroWord}
                  tpo={tpo}
                />
              </View>
            );
          case 'blocks2':
            return (
              <View key="blocks2" testID="section-blocks2" style={styles.blocksWrap}>
                {featuredBlocks2.map((b, i) => (
                  <View key={b.id} style={[styles.blockRow, i < featuredBlocks2.length - 1 ? styles.blockGap : null]}>
                    <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
                  </View>
                ))}
              </View>
            );
          case 'blocks3':
            return (
              <View key="blocks3" testID="section-blocks3" style={styles.blocksWrap}>
                {featuredBlocks3.map((b, i) => (
                  <View key={b.id} style={[styles.blockRow, i < featuredBlocks3.length - 1 ? styles.blockGap : null]}>
                    <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
                  </View>
                ))}
              </View>
            );
          case 'mood':
            return (
              <View key="mood" testID="section-mood">
                <EditorialMoodPalette palette={palette} />
              </View>
            );
          case 'closing':
            return (
              <View key="closing" testID="section-closing">
                <ClosingCard palette={palette} tpo={tpo} assetLabel="나의 챕터" />
              </View>
            );
          default:
            return null;
        }
      })}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  blocksWrap: { paddingHorizontal: s.md },
  blockRow: {},
  blockGap: { marginBottom: s.sm },
});
