// Section renderer helpers for TimelineSpineCinematic.
// Extracted to keep the main component ≤200 LOC.
import React from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../theme';
import type { ResolvedTPO } from '../../../adapters';
import type { TimelineItem } from '../_primitives/editorial';
import type { ResourceItem } from '../_primitives/editorial';
import {
  CinematicHero,
  EditorialEventPanel,
  EditorialTimeline,
  EditorialMoodPalette,
  EditorialRecoveryMetrics,
  EditorialPartner,
  EditorialResources,
  PullQuote,
  ClosingCard,
} from '../_primitives/editorial';
import type { SectionId, Proximity } from './cinematicTypes';

export interface SectionRendererProps {
  readonly id: SectionId;
  readonly tpo: ResolvedTPO;
  readonly palette: PaletteSwatch;
  readonly scrollY: SharedValue<number>;
  readonly chapterNum: '01' | '02' | '03' | '04' | '05';
  readonly chapterName: string;
  readonly heroHeight: number;
  readonly titleFontSize: number;
  readonly eventLabel: string;
  readonly timelineItems: ReadonlyArray<TimelineItem>;
  readonly sectionTitle: string;
  readonly eventStats: ReadonlyArray<{ readonly key: string; readonly value: string }>;
  readonly resources: ReadonlyArray<ResourceItem>;
}

export function renderSection(props: SectionRendererProps): React.JSX.Element | null {
  const {
    id, tpo, palette, scrollY, chapterNum, chapterName,
    heroHeight, titleFontSize, eventLabel, timelineItems,
    sectionTitle, eventStats, resources,
  } = props;

  switch (id) {
    case 'hero':
      return (
        <View key="hero" testID="section-hero">
          <CinematicHero
            palette={palette} tpo={tpo}
            chapterNum={chapterNum} chapterName={chapterName}
            height={heroHeight} titleFontSize={titleFontSize}
            scrollY={scrollY} brandLabel="Dawn" placeLabel="서울"
          />
        </View>
      );
    case 'event':
      return (
        <View key="event" testID="section-event">
          <EditorialEventPanel
            palette={palette} tpo={tpo}
            eventLabel={eventLabel} title="배아 이식" stats={eventStats}
          />
        </View>
      );
    case 'timeline':
      return (
        <View key="timeline" testID="section-timeline">
          <EditorialTimeline palette={palette} items={timelineItems} sectionTitle={sectionTitle} />
        </View>
      );
    case 'pullquote':
      return (
        <View key="pullquote" testID="section-pullquote">
          <PullQuote palette={palette} headline={tpo.copy.headline} heroWord={tpo.copy.heroWord} tpo={tpo} />
        </View>
      );
    case 'mood':
      return (
        <View key="mood" testID="section-mood">
          <EditorialMoodPalette palette={palette} />
        </View>
      );
    case 'recovery':
      return (
        <View key="recovery" testID="section-recovery">
          <EditorialRecoveryMetrics palette={palette} rows={[
            ['휴식', '9시간 12분', '평균 +1시간'],
            ['호흡', '느리게', '11 bpm'],
            ['수분', '2.1L', '순조롭게'],
          ]} />
        </View>
      );
    case 'partner':
      return (
        <View key="partner" testID="section-partner">
          <EditorialPartner palette={palette} tpo={tpo} />
        </View>
      );
    case 'resources':
      return (
        <View key="resources" testID="section-resources">
          <EditorialResources palette={palette} placeLabel="서울" items={resources} />
        </View>
      );
    case 'closing':
      return (
        <View key="closing" testID="section-closing">
          <ClosingCard palette={palette} tpo={tpo} assetLabel="난임 여정" placeLabel="서울" />
        </View>
      );
    default:
      return null;
  }
}
