// 항암 보호자 규칙
import type { LayoutRule } from '../../types';

export const cancerRules: LayoutRule[] = [
  {
    id: 'visit_today',
    condition: { type: 'time_proximity', params: { event: 'visit', hours_before: 12 } },
    effect: { widgetId: 'question_checklist', action: 'promote' },
    priority: 95,
  },
  {
    id: 'visit_d1',
    condition: { type: 'time_proximity', params: { event: 'visit', hours_before: 24 } },
    effect: { widgetId: 'primary_event', action: 'promote' },
    priority: 90,
  },
  {
    id: 'caregiver_emotion_drop',
    condition: { type: 'emotion_state', params: { trend: 'declining', window_hours: 24 } },
    effect: { widgetId: 'prev_visit_memo', action: 'highlight' },
    priority: 70,
  },
];
