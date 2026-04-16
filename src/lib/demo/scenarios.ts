// Demo scenarios — 투자자 시연용 TPO 점프 프리셋
// 각 scenario 는 (now, asset.events 일부 override, emotion, mood) 를 즉시 변경.
// useDemoMode 가 이 scenario 를 layoutContext 에 주입.

export type ScenarioId =
  | 'morning_calm'
  | 'fertility_d_minus_1'
  | 'injection_imminent'
  | 'chemo_during'
  | 'chemo_recovery'
  | 'pet_med_time'
  | 'quiet_evening'
  | 'late_night';

export interface ScenarioDef {
  id: ScenarioId;
  label: string;        // Public 카피
  oneLiner: string;     // 한 줄 설명 (Demo 패널)
  /** 가상 현재 시각 (실시간 대신 이걸 사용) */
  fakeNow: () => Date;
  /** 어떤 에셋을 자동 활성화할지 */
  preferAssetType?: 'fertility' | 'cancer_caregiver' | 'pet_care' | 'chronic';
  /** layoutContext 에 강제 주입할 emotion trend */
  emotionTrend?: 'declining' | 'stable' | 'rising';
  /** 가상으로 "다가오는 이벤트" 추가 (실 events 외) */
  forceUpcomingEvent?: { type: string; at: Date };
}

function offset(hours: number): Date {
  return new Date(Date.now() + hours * 3_600_000);
}

export const scenarios: ScenarioDef[] = [
  {
    id: 'morning_calm',
    label: '🌅 평온한 아침',
    oneLiner: '특별한 일정 없는 평일 아침. mood widget 부각.',
    fakeNow: () => {
      const d = new Date();
      d.setHours(8, 30, 0, 0);
      return d;
    },
  },
  {
    id: 'fertility_d_minus_1',
    label: '🥚 시술 D-1',
    oneLiner: '내일 09:00 배아 이식. PrimaryEvent 가 최상단.',
    preferAssetType: 'fertility',
    fakeNow: () => offset(0),
    forceUpcomingEvent: { type: 'transfer', at: offset(20) },
  },
  {
    id: 'injection_imminent',
    label: '💉 주사 30분 전',
    oneLiner: 'Cetrotide 25분 후. InjectionTimeline 이 상위로.',
    preferAssetType: 'fertility',
    fakeNow: () => offset(0),
    forceUpcomingEvent: { type: 'injection', at: offset(0.4) },
  },
  {
    id: 'chemo_during',
    label: '💊 항암 진행 중',
    oneLiner: '서울대병원 본관 5층. 진료 체크리스트 최상단.',
    preferAssetType: 'cancer_caregiver',
    fakeNow: () => offset(0),
    forceUpcomingEvent: { type: 'chemo', at: offset(-0.5) },
  },
  {
    id: 'chemo_recovery',
    label: '🛌 항암 다음 날',
    oneLiner: '회복 모드. 큰 카드 줄이고 메모·약 정리 부각.',
    preferAssetType: 'cancer_caregiver',
    fakeNow: () => offset(0),
    forceUpcomingEvent: { type: 'chemo', at: offset(-30) },
    emotionTrend: 'declining',
  },
  {
    id: 'pet_med_time',
    label: '🐾 보리 관절약 시간',
    oneLiner: '22:00 관절약 임박. PrimaryMedication 부각.',
    preferAssetType: 'pet_care',
    fakeNow: () => {
      const d = new Date();
      d.setHours(21, 35, 0, 0);
      return d;
    },
    forceUpcomingEvent: { type: 'medication', at: offset(0.4) },
  },
  {
    id: 'quiet_evening',
    label: '🌙 조용한 저녁',
    oneLiner: '이벤트 없는 평일 밤. mood quicklog 부각.',
    fakeNow: () => {
      const d = new Date();
      d.setHours(21, 30, 0, 0);
      return d;
    },
  },
  {
    id: 'late_night',
    label: '🌌 새벽 3시',
    oneLiner: 'Ambient 이 dim/cool 톤. 다음 일정만 surfacing.',
    fakeNow: () => {
      const d = new Date();
      d.setHours(3, 12, 0, 0);
      return d;
    },
  },
];

export function getScenario(id: ScenarioId): ScenarioDef | undefined {
  return scenarios.find((s) => s.id === id);
}
