// Static fertility-specific data for TimelineSpineCinematic.
// Extracted to keep the main component ≤200 LOC.
import type { TimelineItem } from '../_primitives/editorial';
import type { ResourceItem } from '../_primitives/editorial';

export const NEAR_TIMELINE_ITEMS: ReadonlyArray<TimelineItem> = [
  { time: '오늘 21:00', title: '수면제 복용', icon: 'medical-outline', note: '편안한 밤' },
  { time: '내일 06:30', title: '기상 · 금식', icon: 'sunny-outline', note: '물도 금지' },
  { time: '내일 08:30', title: '병원 도착', icon: 'home-outline', note: '김지윤님과' },
  { time: '내일 09:00', title: '배아 이식', icon: 'heart-outline', primary: true, note: '20분 + 휴식' },
  { time: '내일 11:30', title: '귀가 · 안정', icon: 'bed-outline', note: '48시간 휴식' },
];

export const WEEK_TIMELINE_ITEMS: ReadonlyArray<TimelineItem> = [
  { time: '오늘 21:00', title: '일찍 수면', icon: 'moon-outline', note: '기반 주간' },
  { time: '수요일', title: '최종 진료', icon: 'heart-outline', note: '시술 전' },
  { time: '금요일', title: '가방 준비', icon: 'home-outline', note: '함께' },
];

export const RECOVERY_ROWS: ReadonlyArray<readonly [string, string, string]> = [
  ['휴식', '9시간 12분', '평균 +1시간'],
  ['호흡', '느리게', '11 bpm'],
  ['수분', '2.1L', '순조롭게'],
];

// Re-add resources seed: present in far / week / after per reference JSX.
export const FERTILITY_RESOURCES: ReadonlyArray<ResourceItem> = [
  { kind: 'clinic', label: '마리아 병원', note: '서울 강남 · 예약 가능' },
  { kind: 'subsidy', label: '난임 시술비 지원', note: '최대 110만원 · 건강보험 적용' },
  { kind: 'community', label: '맘카페 난임 모임', note: '서울 지역 오프라인 모임' },
];
