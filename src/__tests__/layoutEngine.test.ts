// §4 layoutEngine 검증 — T-DL-01 ~ T-DL-04
import { computeLayout } from '../engine/layoutEngine';
import { fertilityRules } from '../engine/rules/fertilityRules';
import { assetTemplates } from '../data/assetTemplates';
import type { LayoutContext } from '../types';

const fertilityHomeWidgets = assetTemplates.fertility.widgets.filter((w) => (w.tab ?? 'home') === 'home');

function makeContext(over: Partial<LayoutContext> = {}): LayoutContext {
  return {
    now: new Date('2026-04-17T08:00:00Z'),
    ...over,
  };
}

describe('layoutEngine', () => {
  it('default order follows defaultPriority', () => {
    const r = computeLayout(fertilityHomeWidgets, [], makeContext());
    expect(r.order[0]).toBe('primary_event'); // priority 90
    expect(r.order[r.order.length - 1]).toBe('partner_sync'); // priority 50
  });

  it('T-DL-01: transfer D-1 promotes primary_event to top', () => {
    const ctx = makeContext({
      upcomingEvents: [{ type: 'transfer', at: new Date('2026-04-18T03:00:00Z') }],
    });
    const r = computeLayout(fertilityHomeWidgets, fertilityRules, ctx);
    expect(r.order[0]).toBe('primary_event');
    expect(r.appliedRules).toContain('transfer_d1');
  });

  it('T-DL-02: injection 30min before promotes injection_timeline to top', () => {
    const now = new Date('2026-04-17T08:00:00Z');
    const ctx = makeContext({
      now,
      // 25분 후 주사 (0.5h 이내)
      upcomingEvents: [{ type: 'injection', at: new Date(now.getTime() + 25 * 60 * 1000) }],
    });
    const r = computeLayout(fertilityHomeWidgets, fertilityRules, ctx);
    expect(r.order[0]).toBe('injection_timeline');
    expect(r.appliedRules).toContain('injection_30min');
  });

  it('T-DL-03: emotion declining highlights partner_sync', () => {
    const ctx = makeContext({ emotionTrend: 'declining' });
    const r = computeLayout(fertilityHomeWidgets, fertilityRules, ctx);
    expect(r.highlighted.has('partner_sync')).toBe(true);
    expect(r.appliedRules).toContain('emotion_drop');
  });

  it('T-DL-04: quiet day promotes mood_quicklog', () => {
    const ctx = makeContext({ noEventsToday: true });
    const r = computeLayout(fertilityHomeWidgets, fertilityRules, ctx);
    // mood_quicklog 가 default 보다 더 위로 (default 60 → +1050)
    expect(r.order[0]).toBe('mood_quicklog');
    expect(r.appliedRules).toContain('quiet_day');
  });

  it('rules referencing widgets not in asset are ignored', () => {
    const slimWidgets = fertilityHomeWidgets.filter((w) => w.type !== 'partner_sync');
    const ctx = makeContext({ emotionTrend: 'declining' });
    const r = computeLayout(slimWidgets, fertilityRules, ctx);
    // partner_sync 가 없으므로 emotion_drop 규칙은 무시됨
    expect(r.highlighted.has('partner_sync')).toBe(false);
    expect(r.appliedRules).not.toContain('emotion_drop');
  });
});
