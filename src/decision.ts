import type { TPOResult, TPOContext, DecisionSummary, AuditEvent, DecisionExpectation, RiskTier } from './types.js';

function summarizeDecision(result: TPOResult, ctx: TPOContext): DecisionSummary {
  return {
    context: { stage: ctx.stage, role: ctx.role, phase: ctx.time.phase },
    selected: result.selected.map((s) => ({ slot: s.slot, componentKey: s.componentKey })),
    excluded: result.suppressed.map((s) => ({ componentKey: s.componentKey, reason: s.whyNot })),
    deferred: result.abstentions.map((a) => ({ componentKey: a.componentKey, confidence: a.confidence })),
    locked: result.locked.map((l) => ({ slot: l.slot, componentKey: l.componentKey, reason: l.reason })),
    riskTier: result.riskTier,
  };
}

function toAuditEvent(result: TPOResult, ctx: TPOContext, timestamp?: string): AuditEvent {
  return {
    eventType: 'tpo.decision.v1',
    timestamp: timestamp ?? new Date().toISOString(),
    context: ctx,
    outcome: {
      selected: result.selected.map((s) => s.componentKey),
      suppressed: result.suppressed.map((s) => s.componentKey),
      abstained: result.abstentions.map((a) => a.componentKey),
      locked: result.locked.map((l) => l.componentKey),
      riskTier: result.riskTier,
      policyHits: result.suppressed
        .filter((s) => s.policyId !== undefined)
        .map((s) => ({ policyId: s.policyId!, componentKey: s.componentKey })),
    },
    meta: result.meta,
  };
}

function expectDecision(result: TPOResult): DecisionExpectation {
  const self: DecisionExpectation = {
    toSelectInSlot(slot: string, componentKey: string): DecisionExpectation {
      const found = result.selected.find((s) => s.slot === slot);
      if (!found) throw new Error(`expectDecision: slot '${slot}' not in selected — got [${result.selected.map((s) => s.slot).join(', ')}]`);
      if (found.componentKey !== componentKey) throw new Error(`expectDecision: slot '${slot}' selected '${found.componentKey}', expected '${componentKey}'`);
      return self;
    },
    toExclude(componentKey: string): DecisionExpectation {
      const found = result.suppressed.find((s) => s.componentKey === componentKey);
      if (!found) throw new Error(`expectDecision: '${componentKey}' not in suppressed`);
      return self;
    },
    toHaveRiskTier(tier: RiskTier): DecisionExpectation {
      if (result.riskTier !== tier) throw new Error(`expectDecision: riskTier '${result.riskTier}' !== '${tier}'`);
      return self;
    },
    toBeLocked(slot: string): DecisionExpectation {
      const found = result.locked.find((l) => l.slot === slot);
      if (!found) throw new Error(`expectDecision: slot '${slot}' not locked`);
      return self;
    },
    not: {
      toSelect(componentKey: string): DecisionExpectation {
        const inSelected = result.selected.some((s) => s.componentKey === componentKey);
        const inLocked = result.locked.some((l) => l.componentKey === componentKey);
        if (inSelected || inLocked) throw new Error(`expectDecision: '${componentKey}' was selected but expected not to be`);
        return self;
      },
    },
  };
  return self;
}

export { summarizeDecision, toAuditEvent, expectDecision };
