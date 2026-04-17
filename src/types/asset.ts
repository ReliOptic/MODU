// §1.1 Asset 인터페이스 — 에셋 시스템의 핵심 타입
import type { PaletteKey } from '../theme';
import type { LayoutRule } from './layout';
import type { ScheduledEvent } from './event';

/**
 * Sync-ready base per ADR-0013 Addendum A4 / ADR-0011.
 * Every persisted entity carries UUID id + monotonic update clock +
 * last-synced timestamp (null → local-only, never pushed).
 */
export interface Syncable {
  id: string;
  updatedAt: string; // ISO-8601 UTC
  syncedAt: string | null;
}

/**
 * Raw formation transcript + AI-inferred summary captured during the
 * interactive asset-spawner flow. Persisted verbatim so chapters can be
 * explained back to the user and so future models can reinterpret.
 */
export interface FormationData {
  /** Map of FormationStep.id → user response value (preset id or free text). */
  responses: Record<string, string>;
  /** AI-generated one-paragraph reasoning. Surfaced in confirmation screen. */
  summary?: string;
}

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
  // shared
  | 'primary_event'
  | 'calendar_mini'
  | 'calendar_full'
  | 'calendar_legend'
  // fertility
  | 'injection_timeline'
  | 'mood_quicklog'
  | 'partner_sync'
  | 'question_checklist'
  | 'prev_visit_memo'
  // cancer caregiver
  | 'treatment_timeline'
  | 'medication_list'
  | 'primary_medication'
  | 'event_detail_list'
  // pet care
  | 'pet_profile'
  | 'daily_log_bars'
  | 'vet_memo'
  // chronic
  | 'condition_trend'
  | 'primary_condition'
  | 'weekly_bar_graph'
  | 'monthly_heatmap'
  | 'trigger_analysis'
  | 'next_visit'
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
