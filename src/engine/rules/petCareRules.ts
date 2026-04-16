// 반려동물 규칙
import type { LayoutRule } from '../../types';

export const petCareRules: LayoutRule[] = [
  {
    id: 'medication_30min',
    condition: { type: 'time_proximity', params: { event: 'medication', hours_before: 0.5 } },
    effect: { widgetId: 'primary_medication', action: 'promote' },
    priority: 95,
  },
  {
    id: 'vet_visit_d1',
    condition: { type: 'time_proximity', params: { event: 'vet_visit', hours_before: 24 } },
    effect: { widgetId: 'vet_memo', action: 'promote' },
    priority: 80,
  },
  {
    id: 'low_appetite_streak',
    condition: { type: 'emotion_state', params: { trend: 'declining', window_hours: 72 } },
    effect: { widgetId: 'condition_trend', action: 'highlight' },
    priority: 70,
  },
  {
    id: 'quiet_day',
    condition: { type: 'day_type', params: { no_events: true } },
    effect: { widgetId: 'daily_log_bars', action: 'promote' },
    priority: 50,
  },
];
