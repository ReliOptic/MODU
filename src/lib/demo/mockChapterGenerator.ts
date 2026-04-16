// Mock LLM chapter generator — 자유 입력 → 즉석 챕터 생성
// 실제 Anthropic Edge Function 이 connect 되면 이걸 대체.
// 지금은 키워드 사전 + fallback 으로 어떤 입력이든 챕터로 변환.
//
// 브랜드 철학: MODU 는 4가지가 아니라 "어떤 상황이든" 적응한다.
// 이 generator 가 그 약속의 시연 도구.

import type {
  Asset,
  AssetType,
  TabConfig,
  WidgetConfig,
  ScheduledEvent,
} from '../../types';
import type { PaletteKey } from '../../theme';

export interface GeneratedChapter {
  type: AssetType;
  displayName: string;
  palette: PaletteKey;
  tabs: TabConfig[];
  widgets: WidgetConfig[];
  events: ScheduledEvent[];
  /** 사용자에게 보여줄 한 줄 인사 */
  greeting: string;
  /** 분석 evidence (왜 이렇게 만들었는지 — 데모 시 노출 가능) */
  reasoning: string;
}

interface KeywordMap {
  keywords: string[];
  type: AssetType;
  palette: PaletteKey;
  template: (input: string) => Omit<GeneratedChapter, 'type' | 'palette'>;
}

// ─── 키워드 사전 — 흔한 상황 ──────────────────────────
const MAPS: KeywordMap[] = [
  {
    keywords: ['시험관', '난임', 'IVF', '배아', '이식', '난자', '임신준비'],
    type: 'fertility',
    palette: 'dawn',
    template: (input) => ({
      displayName: extractCycleOrFallback(input, '시험관 동행'),
      tabs: tabset('fertility'),
      widgets: widgetset('fertility'),
      events: nearbyEvents('injection', 0.5, '저녁 주사', '복부'),
      greeting: '오늘도 함께해요. 한 발씩 가요.',
      reasoning: '난임 키워드 감지 → dawn 팔레트, 주사·시술 일정 위젯 우선.',
    }),
  },
  {
    keywords: ['항암', '암', '화학요법', '방사선', '종양', '수술'],
    type: 'cancer_caregiver',
    palette: 'mist',
    template: (input) => ({
      displayName: extractRoleOrFallback(input, '항암 동행'),
      tabs: tabset('cancer_caregiver'),
      widgets: widgetset('cancer_caregiver'),
      events: nearbyEvents('chemo', -0.5, '항암 진행 중'),
      greeting: '천천히 함께 걸어요.',
      reasoning: '항암/수술 키워드 → mist 팔레트, 진료 체크리스트·메모 위젯.',
    }),
  },
  {
    keywords: ['강아지', '고양이', '반려', '펫', '관절', '예방접종', '동물병원'],
    type: 'pet_care',
    palette: 'blossom',
    template: (input) => ({
      displayName: extractPetNameOrFallback(input, '우리 아이'),
      tabs: tabset('pet_care'),
      widgets: widgetset('pet_care'),
      events: nearbyEvents('medication', 1, '약 복용 시간'),
      greeting: '오늘은 어땠어요?',
      reasoning: '반려동물 키워드 → blossom 팔레트, 일일 로그·수의사 메모 위젯.',
    }),
  },
  {
    keywords: ['편두통', '두통', '당뇨', '고혈압', '갑상선', '만성', '통증', '천식'],
    type: 'chronic',
    palette: 'sage',
    template: (input) => ({
      displayName: shortDescribe(input, '관리 중'),
      tabs: tabset('chronic'),
      widgets: widgetset('chronic'),
      events: nearbyEvents('consultation', 24, '다음 진료'),
      greeting: '오늘의 한 줄을 남겨볼까요?',
      reasoning: '만성질환 키워드 → sage 팔레트, 강도 그래프·트리거 분석 위젯.',
    }),
  },
  // ─── 더 다양한 상황 (custom palette) ──────────────
  {
    keywords: ['출산', '산후', '신생아', '모유', '수유'],
    type: 'custom',
    palette: 'blossom',
    template: (input) => ({
      displayName: shortDescribe(input, '출산 후 회복'),
      tabs: customTabs('출산'),
      widgets: chronicWidgets(),
      events: nearbyEvents('consultation', 48, '검진'),
      greeting: '몸도 마음도 천천히 회복되고 있어요.',
      reasoning: '출산 키워드 → blossom 팔레트로 따뜻하게, custom chapter.',
    }),
  },
  {
    keywords: ['치매', '알츠하이머', '인지', '어머니', '아버지', '부모님'],
    type: 'custom',
    palette: 'mist',
    template: (input) => ({
      displayName: shortDescribe(input, '부모님 돌봄'),
      tabs: customTabs('돌봄'),
      widgets: caregiverWidgets(),
      events: nearbyEvents('visit', 24, '다음 방문'),
      greeting: '오늘 함께한 시간을 적어둘까요?',
      reasoning: '치매/돌봄 키워드 → mist 팔레트, 보호자 모드 custom chapter.',
    }),
  },
  {
    keywords: ['우울', '불안', '공황', 'ADHD', '정신', '심리', '상담'],
    type: 'custom',
    palette: 'dusk',
    template: (input) => ({
      displayName: shortDescribe(input, '마음 챕터'),
      tabs: customTabs('마음'),
      widgets: chronicWidgets(),
      events: nearbyEvents('consultation', 72, '다음 상담'),
      greeting: '오늘은 어떤 마음이에요?',
      reasoning: '정신건강 키워드 → dusk 팔레트, 감정·상담 중심 custom chapter.',
    }),
  },
  {
    keywords: ['알레르기', '피부', '아토피', '천식'],
    type: 'custom',
    palette: 'sage',
    template: (input) => ({
      displayName: shortDescribe(input, '알레르기 관리'),
      tabs: customTabs('관리'),
      widgets: chronicWidgets(),
      events: nearbyEvents('consultation', 168, '다음 진료'),
      greeting: '오늘 컨디션은 어때요?',
      reasoning: '알레르기 키워드 → sage 팔레트, 트리거 분석 위젯.',
    }),
  },
  {
    keywords: ['마라톤', '트레이닝', '운동', '달리기', '재활', '물리치료'],
    type: 'custom',
    palette: 'sage',
    template: (input) => ({
      displayName: shortDescribe(input, '훈련 챕터'),
      tabs: customTabs('훈련'),
      widgets: chronicWidgets(),
      events: nearbyEvents('consultation', 168, '다음 점검'),
      greeting: '오늘의 컨디션을 적어볼까요?',
      reasoning: '운동/재활 키워드 → sage 팔레트, 컨디션 추세 위젯.',
    }),
  },
];

// ─── 메인 generator ──────────────────────────────────
export function generateChapter(input: string): GeneratedChapter {
  const cleaned = input.trim().toLowerCase();
  for (const m of MAPS) {
    if (m.keywords.some((k) => cleaned.includes(k.toLowerCase()))) {
      const t = m.template(input);
      return { ...t, type: m.type, palette: m.palette };
    }
  }
  // Fallback — 어떤 입력이든 챕터로 받음
  return fallbackChapter(input);
}

function fallbackChapter(input: string): GeneratedChapter {
  return {
    type: 'custom',
    displayName: shortDescribe(input, '나의 챕터'),
    palette: rotatePalette(),
    tabs: customTabs('일'),
    widgets: chronicWidgets(),
    events: nearbyEvents('consultation', 168, '다음 일정'),
    greeting: '여기부터 시작해요.',
    reasoning: '키워드 매칭 없음 → custom chapter, 균형 잡힌 위젯 set.',
  };
}

// ─── helpers ──────────────────────────────────────────
function tabset(type: AssetType): TabConfig[] {
  switch (type) {
    case 'fertility':
      return [
        { id: 'home', icon: 'house', label: '홈' },
        { id: 'calendar', icon: 'calendar', label: '달력' },
        { id: 'mood', icon: 'face.smile', label: '감정' },
        { id: 'partner', icon: 'person.2', label: '파트너' },
      ];
    case 'cancer_caregiver':
      return [
        { id: 'home', icon: 'house', label: '홈' },
        { id: 'checklist', icon: 'checklist', label: '체크' },
        { id: 'insight', icon: 'lightbulb', label: '인사이트' },
        { id: 'share', icon: 'person.2', label: '공유' },
      ];
    case 'pet_care':
      return [
        { id: 'home', icon: 'house', label: '홈' },
        { id: 'calendar', icon: 'calendar', label: '달력' },
        { id: 'pet', icon: 'pawprint', label: '아이' },
        { id: 'settings', icon: 'gear', label: '설정' },
      ];
    case 'chronic':
      return [
        { id: 'home', icon: 'house', label: '홈' },
        { id: 'graph', icon: 'chart.line', label: '그래프' },
        { id: 'dashboard', icon: 'square.grid', label: '대시보드' },
        { id: 'settings', icon: 'gear', label: '설정' },
      ];
    case 'custom':
    default:
      return customTabs('내일');
  }
}

function customTabs(label: string): TabConfig[] {
  return [
    { id: 'home', icon: 'house', label: '홈' },
    { id: 'calendar', icon: 'calendar', label: '달력' },
    { id: 'mood', icon: 'face.smile', label: label },
    { id: 'settings', icon: 'gear', label: '설정' },
  ];
}

function widgetset(type: AssetType): WidgetConfig[] {
  switch (type) {
    case 'fertility':
      return [
        { type: 'primary_event', defaultPriority: 90, tab: 'home' },
        { type: 'injection_timeline', defaultPriority: 80, tab: 'home' },
        { type: 'mood_quicklog', defaultPriority: 60, tab: 'home' },
        { type: 'partner_sync', defaultPriority: 50, tab: 'home' },
      ];
    case 'cancer_caregiver':
      return [
        { type: 'primary_event', defaultPriority: 90, tab: 'home' },
        { type: 'question_checklist', defaultPriority: 85, tab: 'home' },
        { type: 'prev_visit_memo', defaultPriority: 75, tab: 'home' },
        { type: 'medication_list', defaultPriority: 55, tab: 'home' },
      ];
    case 'pet_care':
      return [
        { type: 'pet_profile', defaultPriority: 95, tab: 'home' },
        { type: 'primary_medication', defaultPriority: 90, tab: 'home' },
        { type: 'daily_log_bars', defaultPriority: 75, tab: 'home' },
        { type: 'condition_trend', defaultPriority: 55, tab: 'home' },
      ];
    case 'chronic':
      return chronicWidgets();
    case 'custom':
    default:
      return chronicWidgets();
  }
}

function chronicWidgets(): WidgetConfig[] {
  return [
    { type: 'primary_condition', defaultPriority: 90, tab: 'home' },
    { type: 'weekly_bar_graph', defaultPriority: 80, tab: 'home' },
    { type: 'mood_quicklog', defaultPriority: 70, tab: 'home' },
    { type: 'next_visit', defaultPriority: 50, tab: 'home' },
  ];
}

function caregiverWidgets(): WidgetConfig[] {
  return [
    { type: 'primary_event', defaultPriority: 90, tab: 'home' },
    { type: 'prev_visit_memo', defaultPriority: 80, tab: 'home' },
    { type: 'medication_list', defaultPriority: 70, tab: 'home' },
    { type: 'mood_quicklog', defaultPriority: 50, tab: 'home' },
  ];
}

function nearbyEvents(
  type: ScheduledEvent['type'],
  hoursOffset: number,
  title: string,
  subtitle?: string
): ScheduledEvent[] {
  const at = new Date(Date.now() + hoursOffset * 3_600_000).toISOString();
  return [
    {
      id: `gen-${Date.now()}`,
      type,
      at,
      durationHours: 0.5,
      afterglowHours: 12,
      title,
      subtitle,
    },
  ];
}

function shortDescribe(input: string, fallback: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) return fallback;
  if (trimmed.length <= 20) return trimmed;
  return trimmed.slice(0, 18) + '…';
}

function extractCycleOrFallback(input: string, fb: string): string {
  const m = input.match(/(\d+)\s*회차/);
  if (m) return `시험관 ${m[1]}회차`;
  return fb;
}

function extractRoleOrFallback(input: string, fb: string): string {
  const map: Record<string, string> = {
    어머니: '어머니 항암',
    엄마: '어머니 항암',
    아버지: '아버지 항암',
    아빠: '아버지 항암',
    배우자: '배우자 항암',
    남편: '남편 항암',
    아내: '아내 항암',
  };
  for (const [k, v] of Object.entries(map)) {
    if (input.includes(k)) return v;
  }
  return fb;
}

function extractPetNameOrFallback(input: string, fb: string): string {
  // 한국어 이름 추출은 휴리스틱 — 가장 간단히 첫 단어
  const tokens = input.split(/\s+/);
  for (const t of tokens) {
    if (t.length >= 2 && t.length <= 4 && /^[가-힣]+$/.test(t)) {
      return `${t} 챕터`;
    }
  }
  return fb;
}

let paletteIdx = 0;
function rotatePalette(): PaletteKey {
  const order: PaletteKey[] = ['dusk', 'sage', 'mist', 'blossom', 'dawn'];
  const p = order[paletteIdx % order.length];
  paletteIdx++;
  return p;
}

/** assetStore 의 createAsset 호출용 — formationData 형태로 변환 */
export function toFormationData(input: string, reasoning: string) {
  return {
    responses: { 'demo:freeform': input },
    summary: reasoning,
  };
}
