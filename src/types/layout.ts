// §4.1 동적 레이아웃 규칙
import type { WidgetType } from './asset';

export type LayoutConditionType =
  | 'time_proximity'
  | 'event_phase'      // before / during / after — ScheduledEvent 와 매칭
  | 'emotion_state'
  | 'day_type'
  | 'user_context'     // formationData.responses 매칭 — 사용자 특성
  | 'manual';

export interface LayoutCondition {
  type: LayoutConditionType;
  params: Record<string, unknown>;
}

export type LayoutAction =
  | 'promote'
  | 'demote'
  | 'expand'
  | 'collapse'
  | 'highlight';

export interface LayoutEffect {
  widgetId: WidgetType;
  action: LayoutAction;
}

export interface LayoutRule {
  id: string;
  condition: LayoutCondition;
  effect: LayoutEffect;
  /** 0-100, 높을수록 우선 */
  priority: number;
}

/** layoutEngine 평가 시 입력 컨텍스트 */
export interface LayoutContext {
  /** 현재 시간 (테스트 가능하게 주입) */
  now: Date;
  /** 다가오는 이벤트들 (시간/타입) */
  upcomingEvents?: Array<{ type: string; at: Date }>;
  /** 진행 중 / 직후 phase 의 이벤트들 — event_phase condition 평가용 */
  activeEvents?: Array<{ type: string; phase: 'before' | 'during' | 'after' }>;
  /** 최근 감정 추세 */
  emotionTrend?: 'declining' | 'stable' | 'rising';
  /** 오늘 이벤트 없음? */
  noEventsToday?: boolean;
  /** Formation 응답 (사용자 특성). user_context condition 평가용 */
  userResponses?: Record<string, string>;
}
