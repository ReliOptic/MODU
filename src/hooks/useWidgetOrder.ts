// 현재 에셋 + 컨텍스트 기반 위젯 순서 훅
// LayoutAnimation 으로 300ms transition (T-DL-05)
import { useMemo } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import type { Asset, LayoutContext, WidgetType } from '../types';
import { computeLayout, LayoutResult } from '../engine/layoutEngine';
import { rulesByType } from '../engine/rules';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface UseWidgetOrderOptions {
  /** 현재 시간 (테스트 시 주입). default = new Date() */
  now?: Date;
  upcomingEvents?: LayoutContext['upcomingEvents'];
  emotionTrend?: LayoutContext['emotionTrend'];
  noEventsToday?: boolean;
  /** 'home' / 'calendar' 등. default 'home' */
  tab?: string;
  /** 부드러운 재정렬 애니 (T-DL-05) */
  animate?: boolean;
}

export interface UseWidgetOrderResult extends LayoutResult {
  /** 탭별로 필터링된 순서 */
  homeOrder: WidgetType[];
}

export function useWidgetOrder(asset: Asset | null, opts: UseWidgetOrderOptions = {}): UseWidgetOrderResult {
  const tab = opts.tab ?? 'home';
  const animate = opts.animate ?? true;

  const result = useMemo<LayoutResult>(() => {
    if (!asset) {
      return { order: [], highlighted: new Set(), collapsed: new Set(), expanded: new Set(), appliedRules: [] };
    }
    const ctx: LayoutContext = {
      now: opts.now ?? new Date(),
      upcomingEvents: opts.upcomingEvents,
      emotionTrend: opts.emotionTrend,
      noEventsToday: opts.noEventsToday,
    };
    const tabWidgets = asset.widgets.filter((w) => (w.tab ?? 'home') === tab);
    const allRules = [...(asset.layoutRules ?? []), ...rulesByType[asset.type]];
    if (animate) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    return computeLayout(tabWidgets, allRules, ctx);
    // animate 의존 X — opts 변경 시만 재계산. animate flag 는 첫 호출 시점 결정.
  }, [asset, tab, opts.now, opts.upcomingEvents, opts.emotionTrend, opts.noEventsToday]);

  return { ...result, homeOrder: result.order };
}
