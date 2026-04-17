// §1.1 Asset 인터페이스 — 에셋 시스템의 핵심 타입
import type { PaletteKey } from '../theme';

export type AssetType = 'fertility' | 'cancer_caregiver' | 'pet_care' | 'chronic' | 'custom';

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
  | 'square.grid';

export interface TabConfig {
  id: string;
  icon: TabIcon;
  label: string;
}

export type WidgetType =
  // shared
  | 'primary_event'
  | 'calendar_mini'
  // fertility
  | 'injection_timeline'
  | 'mood_quicklog'
  | 'partner_sync'
  | 'calendar_full'
  | 'calendar_legend'
  | 'event_detail_list'
  // cancer caregiver
  | 'question_checklist'
  | 'prev_visit_memo'
  | 'treatment_timeline'
  | 'medication_list'
  // pet care
  | 'pet_profile'
  | 'primary_medication'
  | 'daily_log_bars'
  | 'vet_memo'
  | 'condition_trend'
  // chronic
  | 'primary_condition'
  | 'weekly_bar_graph'
  | 'monthly_heatmap'
  | 'trigger_analysis'
  | 'next_visit'
  | 'medication_stock';

export interface WidgetConfig {
  type: WidgetType;
  /** 기본 우선순위 (0-100, 높을수록 위) */
  defaultPriority: number;
  /** 어떤 탭에 표시될지 (default 'home') */
  tab?: string;
}

export type AssetStatus = 'forming' | 'active' | 'archived';

export interface FormationData {
  /** Formation 단계별 응답 */
  responses: Record<string, string>;
  /** AI가 추론한 사용자 컨텍스트 (마지막 confirm 메시지 등) */
  summary?: string;
}

import type { LayoutRule } from './layout';
import type { ScheduledEvent } from './event';

/**
 * Minimum shape for any sync-ready entity. Introduced 2026-04-17
 * (ADR-0013 Addendum A4 + ADR-0011 Addendum).
 *
 *   id         — UUID v4. Stable across devices.
 *   updatedAt  — ISO-8601. Last-write-wins base for conflict resolution.
 *   syncedAt   — ISO-8601 of the last successful cloud push, or null for
 *                records that have never been pushed (all records in v1).
 */
export interface Syncable {
  id: string;
  updatedAt: string;
  syncedAt?: string | null;
}

export interface Asset extends Syncable {
  type: AssetType;
  displayName: string;
  palette: PaletteKey;
  tabs: TabConfig[];
  widgets: WidgetConfig[];
  layoutRules: LayoutRule[];
  formationData: FormationData;
  status: AssetStatus;
  createdAt: string;
  lastActiveAt: string;
  /** Representative photo (pet face, appointment card, etc.) — local `fs://` or remote `https://`. */
  photoUri?: string;
  /** Known events on this chapter — LayoutEngine consumes them for time-based widget ranking. */
  events?: ScheduledEvent[];
}
