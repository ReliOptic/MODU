// 항암 보호자 규칙 — V2 (chemo before/during/after 분리)
import type { LayoutRule } from '../../types';

export const cancerRules: LayoutRule[] = [
  // ── 항암 (chemo) phase ─────────────────────────────
  {
    id: 'chemo_before',
    condition: { type: 'event_phase', params: { event: 'chemo', phase: 'before' } },
    effect: { widgetId: 'primary_event', action: 'promote' },
    priority: 95,
  },
  {
    id: 'chemo_before_questions',
    condition: { type: 'event_phase', params: { event: 'chemo', phase: 'before' } },
    effect: { widgetId: 'question_checklist', action: 'promote' },
    priority: 92,
  },
  {
    id: 'chemo_during_focus',
    condition: { type: 'event_phase', params: { event: 'chemo', phase: 'during' } },
    effect: { widgetId: 'question_checklist', action: 'promote' },
    priority: 98,
  },
  {
    id: 'chemo_during_timeline',
    condition: { type: 'event_phase', params: { event: 'chemo', phase: 'during' } },
    effect: { widgetId: 'treatment_timeline', action: 'highlight' },
    priority: 90,
  },
  // 항암 직후 = 회복 모드: 큰 카드는 줄이고 지난 메모 + 약 정리에 집중
  {
    id: 'chemo_after_quiet_primary',
    condition: { type: 'event_phase', params: { event: 'chemo', phase: 'after' } },
    effect: { widgetId: 'primary_event', action: 'demote' },
    priority: 80,
  },
  {
    id: 'chemo_after_memo_up',
    condition: { type: 'event_phase', params: { event: 'chemo', phase: 'after' } },
    effect: { widgetId: 'prev_visit_memo', action: 'promote' },
    priority: 85,
  },
  {
    id: 'chemo_after_med_up',
    condition: { type: 'event_phase', params: { event: 'chemo', phase: 'after' } },
    effect: { widgetId: 'medication_list', action: 'promote' },
    priority: 70,
  },

  // ── 사용자 컨텍스트 ─────────────────────────────
  {
    // 진단 직후 사용자에게는 치료 히스토리 비중 낮춤 (데이터가 적기 때문)
    id: 'diagnosis_demote_history',
    condition: {
      type: 'user_context',
      params: { stepId: 'cancer_caregiver:step_03', valueEquals: 'diagnosis' },
    },
    effect: { widgetId: 'treatment_timeline', action: 'demote' },
    priority: 50,
  },

  {
    id: 'caregiver_emotion_drop',
    condition: { type: 'emotion_state', params: { trend: 'declining', window_hours: 24 } },
    effect: { widgetId: 'prev_visit_memo', action: 'highlight' },
    priority: 70,
  },
];
