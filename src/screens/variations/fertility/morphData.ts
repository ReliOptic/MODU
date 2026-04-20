// Static fertility-specific seed data for TimelineSpineMorph.
// Extracted to keep the main component ≤200 LOC.
import type { Proximity, MorphShape } from './morphTypes';

// ---------------------------------------------------------------------------
// Timeline item type (morph-local — no dependency on editorial/)
// ---------------------------------------------------------------------------

export interface MorphTimelineItem {
  readonly time: string;
  readonly title: string;
  readonly iconName: string;
  readonly primary?: boolean;
  readonly note?: string;
}

// ---------------------------------------------------------------------------
// Proximity-keyed timeline sets
// ---------------------------------------------------------------------------

export const MORPH_NEAR_TIMELINE: ReadonlyArray<MorphTimelineItem> = [
  { time: '지금', title: '호흡 훈련 · 5분', iconName: 'pulse-outline' },
  { time: '21:00', title: '수면제 복용', iconName: 'medical-outline', note: '편안한 밤' },
  { time: '내일 06:30', title: '금식 유지', iconName: 'sunny-outline' },
  { time: '내일 09:00', title: '배아 이식', iconName: 'heart-outline', primary: true, note: '20분 + 휴식' },
];

export const MORPH_WEEK_TIMELINE: ReadonlyArray<MorphTimelineItem> = [
  { time: '오늘', title: '일찍 수면', iconName: 'moon-outline' },
  { time: '수', title: '최종 진료', iconName: 'heart-outline', note: '시술 전' },
  { time: '금 09:00', title: '배아 이식', iconName: 'heart-outline', primary: true },
];

export const MORPH_DAYOF_TIMELINE: ReadonlyArray<MorphTimelineItem> = [
  { time: '08:30', title: '병원 도착', iconName: 'home-outline' },
  { time: '09:00', title: '배아 이식', iconName: 'heart-outline', primary: true },
  { time: '11:30', title: '귀가', iconName: 'bed-outline' },
];

export const MORPH_TIMELINE_SETS: Readonly<
  Partial<Record<Proximity, ReadonlyArray<MorphTimelineItem>>>
> = {
  week: MORPH_WEEK_TIMELINE,
  near: MORPH_NEAR_TIMELINE,
  dayof: MORPH_DAYOF_TIMELINE,
};

// ---------------------------------------------------------------------------
// Recovery rows: [label, value, sub]
// ---------------------------------------------------------------------------

export const MORPH_RECOVERY_ROWS: ReadonlyArray<readonly [string, string, string]> = [
  ['휴식', '9시간 12분', '평균 +1시간'],
  ['호흡', '느리게', '11 bpm'],
  ['수분', '2.1L', '순조롭게'],
];

// ---------------------------------------------------------------------------
// Resource items
// ---------------------------------------------------------------------------

export interface MorphResourceItem {
  readonly kind: string;
  readonly label: string;
  readonly note?: string;
}

export const MORPH_RESOURCES: ReadonlyArray<MorphResourceItem> = [
  { kind: '병원', label: '마리아 병원', note: '서울 강남 · 예약 가능' },
  { kind: '지원금', label: '난임 시술비 지원', note: '최대 110만원 · 건강보험 적용' },
];

// ---------------------------------------------------------------------------
// Proximity → MorphShape table (from reference JSX §shapes)
// ---------------------------------------------------------------------------

export const MORPH_SHAPES: Readonly<Record<Proximity, MorphShape>> = {
  far: {
    blobSize: 220,
    heroHeightBonus: 20,
    showCountdown: false,
    podMode: 'grid4',
    showPartner: true,
    showResources: true,
    showRecovery: false,
    whisperShape: 'organic',
  },
  week: {
    blobSize: 280,
    heroHeightBonus: 40,
    showCountdown: true,
    podMode: 'grid2',
    showPartner: true,
    showResources: true,
    showRecovery: false,
    whisperShape: 'organic',
  },
  near: {
    blobSize: 340,
    heroHeightBonus: 80,
    showCountdown: true,
    podMode: 'grid2',
    showPartner: true,
    showResources: false,
    showRecovery: false,
    whisperShape: 'organic',
  },
  dayof: {
    blobSize: 440,
    heroHeightBonus: 160,
    showCountdown: true,
    podMode: 'singleBig',
    showPartner: true,
    showResources: false,
    showRecovery: false,
    whisperShape: 'tight',
  },
  after: {
    blobSize: 260,
    heroHeightBonus: 0,
    showCountdown: false,
    podMode: 'resting',
    showPartner: true,
    showResources: true,
    showRecovery: true,
    whisperShape: 'pill',
  },
};

// ---------------------------------------------------------------------------
// Proximity → section order
// ---------------------------------------------------------------------------

import type { MorphSectionId } from './morphTypes';

export const MORPH_SECTION_ORDER: Readonly<Record<Proximity, ReadonlyArray<MorphSectionId>>> = {
  far:   ['metastrip', 'heroblob', 'whisper', 'pods', 'resources', 'partner', 'closing'],
  week:  ['metastrip', 'heroblob', 'whisper', 'pods', 'timeline', 'resources', 'partner', 'closing'],
  near:  ['metastrip', 'heroblob', 'whisper', 'pods', 'timeline', 'partner', 'closing'],
  dayof: ['metastrip', 'heroblob', 'pods', 'timeline', 'partner', 'closing'],
  after: ['metastrip', 'heroblob', 'whisper', 'pods', 'recovery', 'resources', 'partner', 'closing'],
};
