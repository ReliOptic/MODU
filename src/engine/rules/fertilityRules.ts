// §4.2 Fertility 규칙
import type { LayoutRule } from '../../types';

export const fertilityRules: LayoutRule[] = [
  {
    id: 'transfer_d1',
    condition: { type: 'time_proximity', params: { event: 'transfer', hours_before: 24 } },
    effect: { widgetId: 'primary_event', action: 'promote' },
    priority: 95,
  },
  {
    id: 'injection_30min',
    condition: { type: 'time_proximity', params: { event: 'injection', hours_before: 0.5 } },
    effect: { widgetId: 'injection_timeline', action: 'promote' },
    priority: 90,
  },
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
