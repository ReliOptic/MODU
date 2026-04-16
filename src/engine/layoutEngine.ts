// §4.1 Widget Priority Engine
// 입력: 에셋의 widgets[] (defaultPriority) + layoutRules[] + LayoutContext
// 출력: WidgetType[] (정렬된 순서) + 부수 효과(highlight 등)
import type {
  WidgetConfig,
  WidgetType,
  LayoutRule,
  LayoutCondition,
  LayoutContext,
} from '../types';

export interface LayoutResult {
  /** 정렬된 위젯 순서 (defaultPriority + 적용 규칙 반영) */
  order: WidgetType[];
  /** 하이라이트 표시할 위젯 */
  highlighted: Set<WidgetType>;
  /** collapse 상태 위젯 */
  collapsed: Set<WidgetType>;
  /** expand 상태 위젯 */
  expanded: Set<WidgetType>;
  /** 적용된 규칙 ID들 (디버깅) */
  appliedRules: string[];
}

const PROMOTE_BOOST = 1000;
const DEMOTE_PENALTY = -1000;

/** 레이아웃 계산. context 가 없으면 defaultPriority 만으로 정렬. */
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

  // priority 높은 규칙부터 적용
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    if (!score.has(rule.effect.widgetId)) continue; // 해당 위젯이 에셋에 없음
    if (!evaluate(rule.condition, context)) continue;

    applied.push(rule.id);
    switch (rule.effect.action) {
      case 'promote':
        score.set(rule.effect.widgetId, (score.get(rule.effect.widgetId) ?? 0) + PROMOTE_BOOST + rule.priority);
        break;
      case 'demote':
        score.set(rule.effect.widgetId, (score.get(rule.effect.widgetId) ?? 0) + DEMOTE_PENALTY - rule.priority);
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

/** 단일 condition 평가 */
function evaluate(c: LayoutCondition, ctx: LayoutContext): boolean {
  switch (c.type) {
    case 'time_proximity': {
      const event = String(c.params.event ?? '');
      const hoursBefore = Number(c.params.hours_before ?? 0);
      const upcoming = ctx.upcomingEvents ?? [];
      for (const e of upcoming) {
        if (e.type !== event) continue;
        const diffMs = e.at.getTime() - ctx.now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours >= 0 && diffHours <= hoursBefore) return true;
      }
      return false;
    }
    case 'emotion_state': {
      const trend = c.params.trend;
      // window_hours 는 호출 측에서 emotionTrend 계산할 때 적용한다고 가정
      return ctx.emotionTrend === trend;
    }
    case 'day_type': {
      if (c.params.no_events === true) return ctx.noEventsToday === true;
      return false;
    }
    case 'manual':
      return false;
  }
}
