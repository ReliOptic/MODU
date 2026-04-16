// 만성질환 규칙 — V2 (consultation phase + 사용자가 정기 약 복용 여부)
import type { LayoutRule } from '../../types';

export const chronicRules: LayoutRule[] = [
  // ── 진료 (consultation) ─────────────────────────
  {
    id: 'consultation_before',
    condition: { type: 'event_phase', params: { event: 'consultation', phase: 'before' } },
    effect: { widgetId: 'next_visit', action: 'promote' },
    priority: 95,
  },
  {
    id: 'consultation_after_summary',
    condition: { type: 'event_phase', params: { event: 'consultation', phase: 'after' } },
    effect: { widgetId: 'next_visit', action: 'highlight' },
    priority: 70,
  },

  // ── 약 복용 패턴 ──────────────────────────────
  {
    // "매일 챙겨요" → 약 재고 위젯 항상 우선 노출
    id: 'daily_med_user',
    condition: {
      type: 'user_context',
      params: { stepId: 'chronic:step_04', valueEquals: 'daily' },
    },
    effect: { widgetId: 'medication_stock', action: 'promote' },
    priority: 85,
  },
  {
    // 처방 안 받음 → 약 재고 비활성화
    id: 'no_med_demote_stock',
    condition: {
      type: 'user_context',
      params: { stepId: 'chronic:step_04', valueEquals: 'none' },
    },
    effect: { widgetId: 'medication_stock', action: 'demote' },
    priority: 60,
  },

  // ── 증상 추세 ──────────────────────────────────
  {
    id: 'severity_spike',
    condition: { type: 'emotion_state', params: { trend: 'declining' } },
    effect: { widgetId: 'trigger_analysis', action: 'highlight' },
    priority: 75,
  },

  // ── 평온한 날 ─────────────────────────────────
  {
    id: 'calm_day',
    condition: { type: 'day_type', params: { no_events: true } },
    effect: { widgetId: 'weekly_bar_graph', action: 'promote' },
    priority: 50,
  },
];
