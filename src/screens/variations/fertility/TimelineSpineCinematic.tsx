// v2.3 — fertility · cinematic · TPO-driven section order + scroll parallax.
// Fix 1: TITLE_SIZE now proximity-keyed pixel numbers.
// Fix 2: CHAPTER_NUM uses mono digits '01'..'05'.
// Fix 3: brandLabel='Dawn' passed to CinematicHero.
// Fix 4: placeLabel='서울' passed as warm-start seed.
// Resources re-added to far/week/after per reference JSX.
// Section rendering extracted to cinematicSections.tsx (≤200 LOC).
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import type { VariationProps } from '../types';
import type { Proximity, SectionId } from './cinematicTypes';
import { renderSection } from './cinematicSections';
import {
  NEAR_TIMELINE_ITEMS,
  WEEK_TIMELINE_ITEMS,
  FERTILITY_RESOURCES,
} from './cinematicData';

// ---------------------------------------------------------------------------
// TPO-driven structure tables
// ---------------------------------------------------------------------------

const SECTION_ORDER: Readonly<Record<Proximity, ReadonlyArray<SectionId>>> = {
  far:   ['hero', 'pullquote', 'mood', 'resources', 'closing'],
  week:  ['hero', 'pullquote', 'timeline', 'resources', 'mood', 'closing'],
  near:  ['hero', 'event', 'timeline', 'pullquote', 'mood', 'closing'],
  dayof: ['hero', 'event', 'partner', 'closing'],
  after: ['hero', 'recovery', 'resources', 'partner', 'mood', 'closing'],
};

const HERO_HEIGHT: Readonly<Record<Proximity, number>> = {
  far: 480, week: 560, near: 640, dayof: 760, after: 380,
};

const TITLE_SIZE: Readonly<Record<Proximity, number>> = {
  far: 56, week: 76, near: 84, dayof: 120, after: 56,
};

const CHAPTER_NUM: Readonly<Record<Proximity, '01' | '02' | '03' | '04' | '05'>> = {
  far: '01', week: '02', near: '03', dayof: '04', after: '05',
};

const CHAPTER_NAME: Readonly<Record<Proximity, string>> = {
  far: '머무름', week: '서곡', near: '전야', dayof: '오늘', after: '이후의 기록',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelineSpineCinematic({
  tpo,
  palette,
}: VariationProps): React.JSX.Element {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const sections = useMemo(() => SECTION_ORDER[tpo.proximity], [tpo.proximity]);

  const eventLabel = tpo.proximity === 'dayof' ? '오늘 · 09:00' : '내일 · 09:00';
  const timelineItems = tpo.proximity === 'week' ? WEEK_TIMELINE_ITEMS : NEAR_TIMELINE_ITEMS;
  const sectionTitle = tpo.proximity === 'week' ? '다가오는 날들' : '24시간의 흐름';
  const companionValue = tpo.role === 'partner' ? '당신' : '김지윤';

  const eventStats = useMemo(() => [
    { key: '회차', value: '3 / 3' },
    { key: '준비', value: '92%' },
    { key: '동행', value: companionValue },
  ], [companionValue]);

  return (
    <Animated.ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {sections.map((id) => renderSection({
        id, tpo, palette, scrollY,
        chapterNum: CHAPTER_NUM[tpo.proximity],
        chapterName: CHAPTER_NAME[tpo.proximity],
        heroHeight: HERO_HEIGHT[tpo.proximity],
        titleFontSize: TITLE_SIZE[tpo.proximity],
        eventLabel,
        timelineItems,
        sectionTitle,
        eventStats,
        resources: FERTILITY_RESOURCES,
      }))}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
});
