// §1.1 Asset 인터페이스 — 에셋 시스템의 핵심 타입
import type { PaletteKey } from '../theme';

export type AssetType = 'fertility' | 'cancer_caregiver' | 'pet_care' | 'chronic' | 'custom' | string;

/**
 * 에셋의 성격에 따른 규제 봉투 및 UI 톤 결정자.
 * E1(일반), E2(미성년), E3(가족/관계), E4(건강/민감)
 */
export type Envelope = 'E1' | 'E2' | 'E3' | 'E4';

export type TabIcon =
  | 'house'
  | 'calendar'
  | 'face.smile'
  | 'person.2'
  | 'checklist'
  | 'lightbulb'
  | 'pawprint'
  | 'gear'
  | 'chart.line'
  | 'square.grid'
  | 'list.bullet'
  | 'pencil'
  | 'trophy';

export interface TabConfig {
  id: string;
  icon: TabIcon;
  label: string;
}

/**
 * Atomic Moment Types — 도메인 불가지론적 위젯 타입
 */
export type AtomicMomentType =
  | 'core.value'      // 수치/목표 추적
  | 'core.narrative'  // 텍스트/사진 기록
  | 'core.step'       // 단계/체크리스트
  | 'core.glance';    // 요약/대시보드

export type WidgetType =
  | AtomicMomentType
  // legacy shared
  | 'primary_event'
  | 'calendar_mini'
  // ... (rest of the legacy types)
  | 'medication_stock';

export interface WidgetConfig {
  type: WidgetType;
  /** 기본 우선순위 (0-100) */
  defaultPriority: number;
  /** 어떤 탭에 표시될지 */
  tab?: string;
  /** 위젯별 설정 데이터 (AI가 생성) */
  props?: Record<string, any>;
}

/**
 * TPO 기반 동적 레이아웃 규칙
 */
export interface TPORule {
  trigger: 'time' | 'place' | 'occasion' | 'phase_change';
  condition: string;
  action: 'rank_up' | 'rank_down' | 'hide' | 'highlight';
  targetMoment: WidgetType;
}

/**
 * 에셋 설계도 — AI(Spawner)가 생성하는 핵심 데이터
 */
export interface AssetBlueprint {
  envelope: Envelope;
  moments: WidgetConfig[];
  tpoRules: TPORule[];
  initialDisplayName?: string;
}

export type AssetStatus = 'forming' | 'active' | 'archived';

// ... (Syncable interface remains same)

export interface Asset extends Syncable {
  type: AssetType;
  displayName: string;
  palette: PaletteKey;
  envelope: Envelope; // 추가
  tabs: TabConfig[];
  widgets: WidgetConfig[]; // blueprint.moments와 동기화되거나 우선함
  blueprint?: AssetBlueprint; // 추가: 동적 에셋인 경우 존재
  layoutRules: LayoutRule[];
  formationData: FormationData;
  status: AssetStatus;
  createdAt: string;
  lastActiveAt: string;
  photoUri?: string;
  events?: ScheduledEvent[];
}
