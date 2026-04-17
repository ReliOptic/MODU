// 현재 에셋 + 컨텍스트 기반 위젯 순서 훅 — V2
// V2 변경:
//   - asset.events 에서 upcomingEvents / activeEvents 자동 계산
//   - asset.formationData.responses 를 userResponses 로 자동 주입
//   - 1분마다 now tick → 시간 흐름에 따라 위젯 순서가 부드럽게 변함
import { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import type { Asset, LayoutContext, LayoutRule, WidgetType } from '../types';
import { computeLayout, LayoutResult } from '../engine/layoutEngine';
import { rulesByType } from '../engine/rules';
import { eventPhaseAt } from '../types/event';
import { useDemoMode } from '../lib/demo/useDemoMode';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TICK_MS = 60_000; // 1분마다 재평가
const LOOK_AHEAD_HOURS = 36; // 36시간 이내 이벤트는 'before' phase 후보

export interface UseWidgetOrderOptions {
  /** 현재 시간 강제 주입 (스토리북/테스트). 없으면 1분 tick 자동 갱신. */
  now?: Date;
  /** 외부에서 수동으로 주입할 컨텍스트 (formationData 외) */
  emotionTrend?: LayoutContext['emotionTrend'];
  /** 'home' / 'calendar' 등. default 'home' */
  tab?: string;
  /** 부드러운 재정렬 애니 (T-DL-05) */
  animate?: boolean;
}

export interface UseWidgetOrderResult extends LayoutResult {
  homeOrder: WidgetType[];
}

export function useWidgetOrder(
  asset: Asset | null,
  opts: UseWidgetOrderOptions = {}
): UseWidgetOrderResult {
  const tab = opts.tab ?? 'home';
  const animate = opts.animate ?? true;

  // Demo mode 통합 — fakeNow / 강제 이벤트 / emotion 주입
  const demoEnabled = useDemoMode((s) => s.enabled);
  const demoScenarioId = useDemoMode((s) => s.currentScenarioId);
  const demoScenario = useDemoMode((s) => s.getCurrentScenario());

  // 1분 tick — opts.now 우선 → demo fakeNow 차순 → 실시간
  const [tickedNow, setTickedNow] = useState(() => opts.now ?? new Date());
  useEffect(() => {
    if (opts.now) {
      setTickedNow(opts.now);
      return;
    }
    if (demoEnabled && demoScenario) {
      setTickedNow(demoScenario.fakeNow());
      return;
    }
    setTickedNow(new Date());
    const id = setInterval(() => setTickedNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [opts.now, demoEnabled, demoScenarioId, demoScenario]);

  const result = useMemo<LayoutResult>(() => {
    if (!asset) {
      return {
        order: [],
        highlighted: new Set(),
        collapsed: new Set(),
        expanded: new Set(),
        appliedRules: [],
      };
    }

    // 1) asset.events 에서 upcomingEvents + activeEvents 자동 계산
    const upcomingEvents: NonNullable<LayoutContext['upcomingEvents']> = [];
    const activeEvents: NonNullable<LayoutContext['activeEvents']> = [];
    for (const e of asset.events ?? []) {
      const phase = eventPhaseAt(e, tickedNow, LOOK_AHEAD_HOURS);
      if (!phase) continue;
      if (phase === 'before') upcomingEvents.push({ type: e.type, at: new Date(e.at) });
      activeEvents.push({ type: e.type, phase });
    }

    // Demo: scenario 가 강제 이벤트를 주입한 경우 추가
    if (demoEnabled && demoScenario?.forceUpcomingEvent) {
      const fe = demoScenario.forceUpcomingEvent;
      const diffH = (fe.at.getTime() - tickedNow.getTime()) / 3_600_000;
      if (diffH > 0) upcomingEvents.push({ type: fe.type, at: fe.at });
      // phase 계산 (단순화): 0.5h 이내 = before, 그 이후 over 시 during
      if (diffH > -1 && diffH <= 24) {
        activeEvents.push({
          type: fe.type,
          phase: diffH < 0 ? 'during' : 'before',
        });
      }
    }

    // 2) 오늘 이벤트 없음 판단 — activeEvents 가 비어있고 upcoming 도 24시간 내 없음
    const has24hEvent =
      activeEvents.length > 0 ||
      (asset.events ?? []).some((e) => {
        const diffH = (new Date(e.at).getTime() - tickedNow.getTime()) / 3_600_000;
        return diffH >= -12 && diffH <= 24;
      });
    const noEventsToday = !has24hEvent;

    const ctx: LayoutContext = {
      now: tickedNow,
      upcomingEvents,
      activeEvents,
      emotionTrend:
        opts.emotionTrend ??
        (demoEnabled ? demoScenario?.emotionTrend : undefined),
      noEventsToday,
      userResponses: asset.formationData?.responses ?? {},
    };

    // 3) Blueprint 기반 동적 규칙 생성 (Zero-Code Engine)
    const actionMap: Record<string, LayoutRule['effect']['action']> = {
      rank_up: 'promote',
      rank_down: 'demote',
      hide: 'collapse',
      highlight: 'highlight',
    };
    const blueprintRules: LayoutRule[] = (asset.blueprint?.tpoRules ?? []).map((r) => ({
      id: `bp-${r.trigger}-${r.targetMoment}`,
      condition: { type: 'manual', params: { raw: r.condition } },
      effect: {
        widgetId: r.targetMoment,
        action: actionMap[r.action] ?? 'highlight',
      },
      priority: 60,
    }));

    const tabWidgets = asset.widgets.filter((w) => (w.tab ?? 'home') === tab);
    const allRules = [
      ...(asset.layoutRules ?? []),
      ...blueprintRules, // AI가 생성한 동적 규칙 추가
      ...rulesByType[asset.type],
    ];

    if (animate) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    return computeLayout(tabWidgets, allRules, ctx);
    // animate flag 의존 X — 첫 호출 시점에서만 적용.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset, tab, tickedNow, opts.emotionTrend, demoEnabled, demoScenarioId]);

  return { ...result, homeOrder: result.order };
}
