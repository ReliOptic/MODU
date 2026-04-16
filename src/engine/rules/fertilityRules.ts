// §4.2 Fertility 규칙 — V2 (event_phase + user_context)
import type { LayoutRule } from '../../types';

export const fertilityRules: LayoutRule[] = [
  // ── 시술 (transfer) phase 별 ─────────────────────────────
  {
    id: 'transfer_before',
    condition: { type: 'event_phase', params: { event: 'transfer', phase: 'before' } },
    effect: { widgetId: 'primary_event', action: 'promote' },
    priority: 95,
  },
  {
    id: 'transfer_during',
    condition: { type: 'event_phase', params: { event: 'transfer', phase: 'during' } },
    effect: { widgetId: 'primary_event', action: 'promote' },
    priority: 99,
  },
  {
    id: 'transfer_after_calm',
    condition: { type: 'event_phase', params: { event: 'transfer', phase: 'after' } },
    effect: { widgetId: 'mood_quicklog', action: 'promote' },
    priority: 88,
  },
  {
    id: 'transfer_after_partner_highlight',
    condition: { type: 'event_phase', params: { event: 'transfer', phase: 'after' } },
    effect: { widgetId: 'partner_sync', action: 'highlight' },
    priority: 86,
  },

  // ── 주사 (injection) ───────────────────────────────────
  {
    id: 'injection_imminent',
    condition: { type: 'time_proximity', params: { event: 'injection', hours_before: 0.75 } },
    effect: { widgetId: 'injection_timeline', action: 'promote' },
    priority: 90,
  },
  {
    id: 'injection_during',
    condition: { type: 'event_phase', params: { event: 'injection', phase: 'during' } },
    effect: { widgetId: 'injection_timeline', action: 'promote' },
    priority: 92,
  },

  // ── 사용자 컨텍스트 ─────────────────────────────────────
  {
    // "혼자 하고 있어요" → 파트너 위젯의 비중 낮춤 (없는 사람에게 외로움 강조 X)
    id: 'alone_demote_partner',
    condition: {
      type: 'user_context',
      params: { stepId: 'fertility:step_04_partner', valueEquals: 'alone' },
    },
    effect: { widgetId: 'partner_sync', action: 'demote' },
    priority: 80,
  },
  {
    id: 'spouse_or_family_promote_partner',
    condition: {
      type: 'user_context',
      params: { stepId: 'fertility:step_04_partner', valueIn: ['spouse', 'family'] },
    },
    effect: { widgetId: 'partner_sync', action: 'promote' },
    priority: 60,
  },

  // ── 감정 / 평온한 날 ──────────────────────────────────
  {
    id: 'emotion_drop',
    condition: { type: 'emotion_state', params: { trend: 'declining', window_hours: 24 } },
    effect: { widgetId: 'partner_sync', action: 'highlight' },
    priority: 85,
  },
  {
    id: 'quiet_day',
    condition: { type: 'day_type', params: { no_events: true } },
    effect: { widgetId: 'mood_quicklog', action: 'promote' },
    priority: 50,
  },
];
