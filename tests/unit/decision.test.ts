import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/evaluate.js';
import { summarizeDecision, toAuditEvent, expectDecision } from '../../src/decision.js';
import type { TPOContext, EvalOptions } from '../../src/types.js';

const ctx: TPOContext = {
  stage: 'active',
  role: 'premium',
  time: { phase: 'mid-year' },
};

const opts: EvalOptions = {
  rules: {
    version: '2.0.0',
    rules: [
      { id: 'r1', componentKey: 'HeroCard', slot: 'hero', conditions: [{ field: 'role', op: 'eq', value: 'premium' }], priority: 1 },
      { id: 'r2', componentKey: 'BannerAd', slot: 'banner', conditions: [{ field: 'stage', op: 'eq', value: 'active' }], priority: 2 },
      { id: 'r3', componentKey: 'LowCard', slot: 'hero', conditions: [{ field: 'stage', op: 'eq', value: 'active' }], priority: 3 },
    ],
  },
  policy: [{ id: 'P-001', componentKey: 'BannerAd', action: 'suppress', condition: { field: 'role', op: 'eq', value: 'premium' } }],
};

const result = evaluate(ctx, opts);

describe('summarizeDecision', () => {
  it('maps context fields', () => {
    const s = summarizeDecision(result, ctx);
    expect(s.context).toEqual({ stage: 'active', role: 'premium', phase: 'mid-year' });
  });

  it('lists selected components with slot', () => {
    const s = summarizeDecision(result, ctx);
    expect(s.selected).toContainEqual({ slot: 'hero', componentKey: 'HeroCard' });
  });

  it('lists excluded with reason string', () => {
    const s = summarizeDecision(result, ctx);
    const banned = s.excluded.find((e) => e.componentKey === 'BannerAd');
    expect(banned).toBeDefined();
    expect(banned?.reason).toContain('P-001');
  });

  it('includes riskTier', () => {
    const s = summarizeDecision(result, ctx);
    expect(['low', 'medium', 'high']).toContain(s.riskTier);
  });
});

describe('toAuditEvent', () => {
  it('sets eventType', () => {
    const e = toAuditEvent(result, ctx);
    expect(e.eventType).toBe('tpo.decision.v1');
  });

  it('uses supplied timestamp', () => {
    const ts = '2026-04-28T00:00:00.000Z';
    const e = toAuditEvent(result, ctx, ts);
    expect(e.timestamp).toBe(ts);
  });

  it('generates ISO timestamp when omitted', () => {
    const e = toAuditEvent(result, ctx);
    expect(() => new Date(e.timestamp)).not.toThrow();
    expect(e.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes rulePackVersion from meta', () => {
    const e = toAuditEvent(result, ctx);
    expect(e.meta.rulePackVersion).toBe('2.0.0');
  });

  it('lists policyHits with policyId', () => {
    const e = toAuditEvent(result, ctx);
    expect(e.outcome.policyHits).toContainEqual({ policyId: 'P-001', componentKey: 'BannerAd' });
  });

  it('lists suppressed component keys', () => {
    const e = toAuditEvent(result, ctx);
    expect(e.outcome.suppressed).toContain('BannerAd');
  });
});

describe('expectDecision', () => {
  it('passes toSelectInSlot for matching slot+component', () => {
    expect(() => expectDecision(result).toSelectInSlot('hero', 'HeroCard')).not.toThrow();
  });

  it('throws toSelectInSlot on wrong component', () => {
    expect(() => expectDecision(result).toSelectInSlot('hero', 'LowCard')).toThrow();
  });

  it('throws toSelectInSlot on missing slot', () => {
    expect(() => expectDecision(result).toSelectInSlot('nonexistent', 'HeroCard')).toThrow();
  });

  it('passes toExclude for suppressed component', () => {
    expect(() => expectDecision(result).toExclude('BannerAd')).not.toThrow();
  });

  it('throws toExclude for selected component', () => {
    expect(() => expectDecision(result).toExclude('HeroCard')).toThrow();
  });

  it('passes toHaveRiskTier', () => {
    expect(() => expectDecision(result).toHaveRiskTier(result.riskTier)).not.toThrow();
  });

  it('throws toHaveRiskTier on mismatch', () => {
    const wrong = result.riskTier === 'low' ? 'high' : 'low';
    expect(() => expectDecision(result).toHaveRiskTier(wrong)).toThrow();
  });

  it('chains multiple assertions', () => {
    expect(() =>
      expectDecision(result)
        .toSelectInSlot('hero', 'HeroCard')
        .toExclude('BannerAd')
        .toHaveRiskTier(result.riskTier)
    ).not.toThrow();
  });

  it('not.toSelect passes for suppressed component', () => {
    expect(() => expectDecision(result).not.toSelect('BannerAd')).not.toThrow();
  });

  it('not.toSelect throws for selected component', () => {
    expect(() => expectDecision(result).not.toSelect('HeroCard')).toThrow();
  });
});
