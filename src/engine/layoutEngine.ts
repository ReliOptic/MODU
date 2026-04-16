// §4.1 Widget Priority Engine — V2
// 입력: 에셋의 widgets[] (defaultPriority) + layoutRules[] + LayoutContext
// 출력: WidgetType[] (정렬) + highlight / collapsed / expanded set
// V2 변경:
//   - event_phase condition: ScheduledEvent 의 before/during/after phase 매칭
//   - user_context condition: formationData.responses 매칭
//   - LayoutContext 에 activeEvents (phase 포함) + userResponses
import type {
  WidgetConfig,
  WidgetType,
  LayoutRule,
  LayoutCondition,
  LayoutContext,
} from '../types';

export interface LayoutResult {
  order: WidgetType[];
  highlighted: Set<WidgetType>;
  collapsed: Set<WidgetType>;
  expanded: Set<WidgetType>;
  appliedRules: string[];
}

const PROMOTE_BOOST = 1000;
const DEMOTE_PENALTY = -1000;

export function computeLayout(
  widgets: WidgetConfig[],
  rules: LayoutRule[],
  context: LayoutContext
): LayoutResult {
  const score = new Map<WidgetType, number>();
  for (const w of widgets) score.set(w.type, w.defaultPriority);

  const highlighted = new Set<WidgetType>();
  const collapsed = new Set<WidgetType>();
  const expanded = new Set<WidgetType>();
  const applied: string[] = [];

  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    if (!score.has(rule.effect.widgetId)) continue;
    if (!evaluate(rule.condition, context)) continue;

    applied.push(rule.id);
    switch (rule.effect.action) {
      case 'promote':
        score.set(
          rule.effect.widgetId,
          (score.get(rule.effect.widgetId) ?? 0) + PROMOTE_BOOST + rule.priority
        );
        break;
      case 'demote':
        score.set(
          rule.effect.widgetId,
          (score.get(rule.effect.widgetId) ?? 0) + DEMOTE_PENALTY - rule.priority
        );
        break;
      case 'highlight':
        highlighted.add(rule.effect.widgetId);
        break;
      case 'collapse':
        collapsed.add(rule.effect.widgetId);
        break;
      case 'expand':
        expanded.add(rule.effect.widgetId);
        break;
    }
  }

  const order = widgets
    .slice()
    .sort((a, b) => (score.get(b.type) ?? 0) - (score.get(a.type) ?? 0))
    .map((w) => w.type);

  return { order, highlighted, collapsed, expanded, appliedRules: applied };
}

function evaluate(c: LayoutCondition, ctx: LayoutContext): boolean {
  switch (c.type) {
    case 'time_proximity': {
      const event = String(c.params.event ?? '');
      const hoursBefore = Number(c.params.hours_before ?? 0);
      const upcoming = ctx.upcomingEvents ?? [];
      for (const e of upcoming) {
        if (e.type !== event) continue;
        const diffMs = e.at.getTime() - ctx.now.getTime();
        const diffHours = diffMs / 3_600_000;
        if (diffHours >= 0 && diffHours <= hoursBefore) return true;
      }
      return false;
    }
    case 'event_phase': {
      const eventType = String(c.params.event ?? '');
      const phase = String(c.params.phase ?? '');
      const active = ctx.activeEvents ?? [];
      return active.some((e) => e.type === eventType && e.phase === phase);
    }
    case 'emotion_state': {
      const trend = c.params.trend;
      return ctx.emotionTrend === trend;
    }
    case 'day_type': {
      if (c.params.no_events === true) return ctx.noEventsToday === true;
      return false;
    }
    case 'user_context': {
      // params: { stepId: 'fertility:step_04_partner', valueIn: ['alone'] }
      const stepId = String(c.params.stepId ?? '');
      const valueIn = (c.params.valueIn as string[] | undefined) ?? [];
      const valueEquals = c.params.valueEquals as string | undefined;
      const responses = ctx.userResponses ?? {};
      const v = responses[stepId];
      if (!v) return false;
      if (valueEquals !== undefined) return v === valueEquals;
      if (valueIn.length > 0) return valueIn.includes(v);
      return true; // 응답 존재 자체만 체크
    }
    case 'manual':
      return false;
  }
}
