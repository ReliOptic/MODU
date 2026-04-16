// 각 위젯의 mock payload — Supabase 연동 전 개발/QA용
// 에셋 ID 별로 매핑. AssetType 별 default 도 제공.
import type { AssetType, WidgetType } from '../../types';
import { palettes } from '../../theme';

export const fertilityMock = {
  primary_event: { title: '배아 이식', timeLabel: '09:00', countdown: 'D-1', subtitle: 'CHA 강남 · 6번 방' },
  calendar_mini: {
    dots: [
      { day: 12, color: palettes.blossom[300] },
      { day: 14, color: palettes.mist[300] },
      { day: 18, color: palettes.sage[300] },
      { day: 20, color: palettes.blossom[300] },
    ],
  },
  injection_timeline: {
    items: [
      { time: '07:00', drug: 'Gonal-F', site: '복부', status: 'done' as const },
      { time: '21:00', drug: 'Cetrotide', site: '복부', status: 'now' as const },
      { time: '23:00', drug: 'Ovidrel', site: '복부', status: 'upcoming' as const },
    ],
  },
  partner_sync: { partnerName: '준호', syncEnabled: true },
  calendar_full: {
    dots: [
      { day: 12, color: palettes.blossom[300] },
      { day: 14, color: palettes.mist[300] },
      { day: 18, color: palettes.sage[300] },
    ],
  },
};

export const cancerMock = {
  primary_event: { title: '항암 외래', timeLabel: '13:30', countdown: '오늘', subtitle: '서울대병원 · 본관 5층' },
  question_checklist: {
    items: [
      { id: 'q1', text: '메스꺼움이 심해진 것 같아요. 약을 바꿀 수 있나요?' },
      { id: 'q2', text: '식사를 거의 못 드세요. 영양 보충 방법이 있을까요?' },
      { id: 'q3', text: '다음 회차까지 컨디션 관리 팁이 있나요?', checked: true },
    ],
  },
  prev_visit_memo: {
    date: '4/3',
    notes: '4차까지 잘 견디심. 메스꺼움 약은 효과가 미미했음. 영양식 권장하심.',
    medicationChanges: '온단세트론 → 그라니세트론',
  },
  treatment_timeline: {
    sessions: [
      { number: 1, date: '1/8', status: 'done' as const },
      { number: 2, date: '2/5', status: 'done' as const },
      { number: 3, date: '3/4', status: 'done' as const },
      { number: 4, date: '4/3', status: 'done' as const },
      { number: 5, date: '4/17', status: 'today' as const },
      { number: 6, date: '5/15', status: 'upcoming' as const },
    ],
  },
  medication_list: {
    items: [
      { name: '온단세트론', schedule: '필요 시', notes: '메스꺼움 시' },
      { name: '아세트아미노펜', schedule: '6시간 간격', notes: '발열 시' },
      { name: '메가스트롤', schedule: '아침', notes: '식욕 보조' },
    ],
  },
};

export const petMock = {
  pet_profile: {
    emoji: '🐶',
    name: '보리',
    species: '포메라니안',
    age: '9살',
    weight: '4.2kg',
    conditions: ['관절염'],
  },
  primary_medication: { title: '관절약', timeLabel: '22:00', countdown: '2시간 후', subtitle: '0.5정 · 식후' },
  daily_log_bars: {
    walk: { value: 0.6, label: '30분' },
    appetite: { value: 0.8, label: '잘 먹음' },
    water: { value: 0.5, label: '120ml' },
  },
  vet_memo: { notes: '관절 부담 줄이려면 산책 30분 이내, 계단 자제. 다음 X-ray는 8주 후.', nextVisit: '5/12 10:30' },
  condition_trend: { values: [0.5, 0.6, 0.55, 0.7, 0.65, 0.6, 0.75] },
};

export const chronicMock = {
  primary_condition: { title: '오늘 컨디션', timeLabel: '보통', subtitle: '편두통 강도 3/10' },
  weekly_bar_graph: { values: [2, 5, 4, 7, 3, 1, 3] },
  monthly_heatmap: {
    intensities: [0, 1, 1, 2, 0, 0, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0, 2, 3, 2, 1, 0, 0, 1],
  },
  trigger_analysis: {
    summary: '지난 30일 분석: 수면 부족과 날씨 변화가 가장 강한 트리거.',
    factors: [
      { name: '수면', correlation: 0.62 },
      { name: '날씨', correlation: 0.48 },
      { name: '카페인', correlation: 0.31 },
      { name: '스트레스', correlation: 0.27 },
      { name: '식사', correlation: -0.05 },
    ],
  },
  next_visit: { date: '5/20 14:00', doctor: '박지수 신경과', summary: '최근 4주 평균 강도 3.4. 트립탄 효과 양호.' },
  medication_stock: {
    items: [
      { name: '수마트립탄', remainingDays: 12 },
      { name: '프로프라놀롤', remainingDays: 4, refillAlert: true },
      { name: '리보트릴', remainingDays: 22 },
    ],
  },
};

export const widgetMock: Record<AssetType, Partial<Record<WidgetType, unknown>>> = {
  fertility: fertilityMock,
  cancer_caregiver: cancerMock,
  pet_care: petMock,
  chronic: chronicMock,
  custom: {},
};
