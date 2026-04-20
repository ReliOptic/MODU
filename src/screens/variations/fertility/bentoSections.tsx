// Section renderer for TimelineSpineBento.
// Dispatches BentoSectionId → concrete primitive tile.
// Extracted to keep TimelineSpineBento.tsx ≤200 LOC.
import React from 'react';
import { useWindowDimensions } from 'react-native';
import type { PaletteSwatch } from '../../../theme';
import type { ResolvedTPO } from '../../../adapters';
import type { BentoSectionId } from './bentoTypes';
import {
  BentoHeroTile,
  BentoClockTile,
  BentoMoodTile,
  BentoInjectionTile,
  BentoCalendarTile,
  BentoPartnerTile,
  BentoWhisperTile,
  BentoBodyTile,
  BentoSleepTile,
} from '../_primitives/bento';

const ROW_HEIGHT = 64;
const ROW_GAP = 8;

export function tileMinHeight(rowSpan: number): number {
  return ROW_HEIGHT * rowSpan + ROW_GAP * (rowSpan - 1);
}

// P1.3 — eyebrow copy per proximity
const HERO_EYEBROW: Readonly<Record<ResolvedTPO['proximity'], string>> = {
  far:   '2주 뒤 · 09:00 · D-14',
  week:  '3일 후 · 09:00 · D-3',
  near:  '내일 · 09:00 · D-1',
  dayof: '오늘 · 09:00 · D-DAY',
  after: '어제 · 09:00 · D+1',
};

export interface BentoSectionRendererProps {
  readonly id: BentoSectionId;
  readonly rowSpan: 1 | 2 | 3 | 4 | 5;
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
}

export function renderBentoSection({
  id,
  rowSpan,
  palette,
  tpo,
}: BentoSectionRendererProps): React.JSX.Element | null {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { height } = useWindowDimensions();
  const minHeight =
    id === 'hero' && tpo.proximity === 'dayof'
      ? Math.max(455, Math.round(height * 0.56))
      : tileMinHeight(rowSpan);

  switch (id) {
    case 'hero':
      return (
        <BentoHeroTile
          key="hero"
          palette={palette}
          tpo={tpo}
          minHeight={minHeight}
          eyebrow={HERO_EYEBROW[tpo.proximity]}
        />
      );
    case 'clock':
      return (
        <BentoClockTile
          key="clock"
          palette={palette}
          tpo={tpo}
          minHeight={minHeight}
        />
      );
    case 'mood':
      return (
        <BentoMoodTile
          key="mood"
          palette={palette}
          minHeight={minHeight}
        />
      );
    case 'injection':
      return (
        <BentoInjectionTile
          key="injection"
          palette={palette}
          minHeight={minHeight}
        />
      );
    case 'calendar':
      return (
        <BentoCalendarTile
          key="calendar"
          palette={palette}
          minHeight={minHeight}
        />
      );
    case 'partner':
      return (
        <BentoPartnerTile
          key="partner"
          palette={palette}
          minHeight={minHeight}
        />
      );
    case 'whisper':
      return (
        <BentoWhisperTile
          key="whisper"
          palette={palette}
          text={tpo.copy.whisper}
          minHeight={minHeight}
        />
      );
    case 'body':
      return (
        <BentoBodyTile
          key="body"
          palette={palette}
          minHeight={minHeight}
        />
      );
    case 'sleep':
      return (
        <BentoSleepTile
          key="sleep"
          palette={palette}
          minHeight={minHeight}
        />
      );
    default:
      return null;
  }
}
