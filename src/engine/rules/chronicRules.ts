// 만성질환 규칙
import type { LayoutRule } from '../../types';

export const chronicRules: LayoutRule[] = [
  {
    id: 'visit_d1',
    condition: { type: 'time_proximity', params: { event: 'visit', hours_before: 24 } },
    effect: { widgetId: 'next_visit', action: 'promote' },
    priority: 90,
  },
  {
    id: 'low_stock',
    condition: { type: 'manual', params: { trigger: 'low_stock' } },
    effect: { widgetId: 'medication_stock', action: 'promote' },
    priority: 85,
  },
  {
    id: 'severity_spike',
    condition: { type: 'emotion_state', params: { trend: 'declining' } },
    effect: { widgetId: 'trigger_analysis', action: 'highlight' },
    priority: 75,
  },
  {
    id: 'calm_day',
    condition: { type: 'day_type', params: { no_events: true } },
    effect: { widgetId: 'weekly_bar_graph', action: 'promote' },
    priority: 50,
  },
];
