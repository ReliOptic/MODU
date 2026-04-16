// 반려동물 규칙 — V2 (medication phase + 사용자가 신경쓰는 부분)
import type { LayoutRule } from '../../types';

export const petCareRules: LayoutRule[] = [
  // ── 약 복용 (medication) ────────────────────────
  {
    id: 'medication_imminent',
    condition: { type: 'time_proximity', params: { event: 'medication', hours_before: 1 } },
    effect: { widgetId: 'primary_medication', action: 'promote' },
    priority: 95,
  },
  {
    id: 'medication_during',
    condition: { type: 'event_phase', params: { event: 'medication', phase: 'during' } },
    effect: { widgetId: 'primary_medication', action: 'promote' },
    priority: 98,
  },

  // ── 수의사 방문 ──────────────────────────────────
  {
    id: 'vet_visit_before',
    condition: { type: 'event_phase', params: { event: 'vet_visit', phase: 'before' } },
    effect: { widgetId: 'vet_memo', action: 'promote' },
    priority: 80,
  },
  {
    id: 'vet_visit_after_trend',
    condition: { type: 'event_phase', params: { event: 'vet_visit', phase: 'after' } },
    effect: { widgetId: 'condition_trend', action: 'promote' },
    priority: 75,
  },

  // ── 사용자가 신경 쓰는 부분 ────────────────────────
  {
    // "관절이 안 좋아 보여요" → condition_trend 가 더 위로
    id: 'concern_joints',
    condition: {
      type: 'user_context',
      params: { stepId: 'pet_care:step_04', valueEquals: 'joints' },
    },
    effect: { widgetId: 'condition_trend', action: 'highlight' },
    priority: 70,
  },
  {
    // "식욕이 들쭉날쭉" → daily_log_bars highlight
    id: 'concern_appetite',
    condition: {
      type: 'user_context',
      params: { stepId: 'pet_care:step_04', valueEquals: 'appetite' },
    },
    effect: { widgetId: 'daily_log_bars', action: 'promote' },
    priority: 70,
  },

  {
    id: 'low_appetite_streak',
    condition: { type: 'emotion_state', params: { trend: 'declining', window_hours: 72 } },
    effect: { widgetId: 'condition_trend', action: 'highlight' },
    priority: 65,
  },
  {
    id: 'quiet_day',
    condition: { type: 'day_type', params: { no_events: true } },
    effect: { widgetId: 'daily_log_bars', action: 'promote' },
    priority: 50,
  },
];
