import type {
  TPOContext, EvalOptions, TPOResult, Rule, Condition,
  SelectedComponent, SuppressedComponent, AbstainedComponent,
  TraceEntry, RiskTier,
} from './types.js';
import { TPOInputError } from './types.js';

function getField(ctx: TPOContext, field: string): string | number | undefined {
  let cur: unknown = ctx;
  for (const part of field.split('.')) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' || typeof cur === 'number' ? cur : undefined;
}

function evalCondition(ctx: TPOContext, c: Condition): boolean {
  const raw = getField(ctx, c.field);
  if (c.op === 'exists') return raw !== undefined;
  if (raw === undefined) return false;
  if (c.op === 'eq') return raw === c.value;
  if (c.op === 'in') return Array.isArray(c.value) && (c.value as readonly string[]).includes(String(raw));
  if (c.op === 'not-in') return Array.isArray(c.value) && !(c.value as readonly string[]).includes(String(raw));
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
  const t = typeof c.value === 'number' ? c.value : parseFloat(String(c.value));
  if (isNaN(n) || isNaN(t)) return false;
  return c.op === 'lt' ? n < t : c.op === 'lte' ? n <= t : c.op === 'gt' ? n > t : n >= t;
}

function validateContext(ctx: TPOContext): void {
  if (!ctx.stage?.trim()) throw new TPOInputError('stage', 'TPOContext.stage is required');
  if (!ctx.role?.trim()) throw new TPOInputError('role', 'TPOContext.role is required');
  if (!ctx.time?.phase?.trim()) throw new TPOInputError('time.phase', 'TPOContext.time.phase is required');
}

function validateOptions(options: EvalOptions): void {
  if (!Array.isArray(options.rules?.rules)) {
    throw new TPOInputError('rules.rules', 'EvalOptions.rules.rules must be an array');
  }
  if (!options.rules.version?.trim()) {
    throw new TPOInputError('rules.version', 'EvalOptions.rules.version is required');
  }
  for (const rule of options.rules.rules) {
    if (!rule?.id?.trim()) throw new TPOInputError('rule.id', "Rule is missing required field 'id'");
    if (!rule?.componentKey?.trim()) throw new TPOInputError('rule.componentKey', `Rule '${rule.id}' missing 'componentKey'`);
    if (!rule?.slot?.trim()) throw new TPOInputError('rule.slot', `Rule '${rule.id}' missing 'slot'`);
    if (!Array.isArray(rule?.conditions)) throw new TPOInputError('rule.conditions', `Rule '${rule.id}' conditions must be an array`);
    if (rule.conditions.length === 0) throw new TPOInputError('rule.conditions', `Rule '${rule.id}' must have at least one condition`);
    if (typeof rule?.priority !== 'number') throw new TPOInputError('rule.priority', `Rule '${rule.id}' priority must be a number`);
    if (rule.confidenceHint !== undefined && (rule.confidenceHint < 0 || rule.confidenceHint > 1)) {
      throw new TPOInputError('rule.confidenceHint', `Rule '${rule.id}' confidenceHint must be in [0, 1]`);
    }
  }
}

interface BuildSelectedResult {
  readonly selected: readonly SelectedComponent[];
  readonly conditionMismatched: readonly SuppressedComponent[];
}

function collectConditionMismatched(
  rules: readonly Rule[],
  ctx: TPOContext,
  selectedKeys: ReadonlySet<string>,
): readonly SuppressedComponent[] {
  const seen = new Set<string>();
  const result: SuppressedComponent[] = [];
  for (const rule of rules) {
    if (!rule || rule.conditions.length === 0) continue;
    if (selectedKeys.has(rule.componentKey)) continue;
    const failedCond = rule.conditions.find((c) => !evalCondition(ctx, c));
    if (failedCond === undefined) continue; // all conditions met — handled by selected path
    if (seen.has(rule.componentKey)) continue;
    seen.add(rule.componentKey);
    const actual = getField(ctx, failedCond.field) ?? 'undefined';
    result.push({
      componentKey: rule.componentKey,
      whyNot: `${failedCond.field} ${failedCond.op} ${JSON.stringify(failedCond.value)} — got ${JSON.stringify(actual)} (rule ${rule.id})`,
      policyId: undefined,
      ruleId: rule.id,
    });
  }
  return result;
}

function buildSelected(rules: readonly Rule[], ctx: TPOContext): BuildSelectedResult {
  const maxConds = rules.reduce((m, r) => Math.max(m, r.conditions.length), 0) || 1;
  const candidates: Array<{ rule: Rule; specificity: number; index: number }> = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!rule || rule.conditions.length === 0) continue;
    const met = rule.conditions.filter((c) => evalCondition(ctx, c)).length;
    if (met < rule.conditions.length) continue;
    candidates.push({ rule, specificity: rule.conditions.length / maxConds, index: i });
  }
  candidates.sort((a, b) =>
    b.specificity !== a.specificity ? b.specificity - a.specificity :
    a.rule.priority !== b.rule.priority ? a.rule.priority - b.rule.priority :
    a.index - b.index,
  );
  const slotMap = new Map<string, SelectedComponent>();
  for (const { rule, specificity } of candidates) {
    const existing = slotMap.get(rule.slot);
    if (!existing) {
      slotMap.set(rule.slot, { slot: rule.slot, componentKey: rule.componentKey, specificity, priority: rule.priority, matchedRules: [rule.id] });
    } else if (existing.componentKey === rule.componentKey) {
      slotMap.set(rule.slot, { ...existing, matchedRules: [...existing.matchedRules, rule.id] });
    }
  }
  const selected = [...slotMap.values()].sort((a, b) => a.priority - b.priority);
  const selectedKeys = new Set(selected.map((s) => s.componentKey));
  const conditionMismatched = collectConditionMismatched(rules, ctx, selectedKeys);
  return { selected, conditionMismatched };
}

function applyPolicy(
  selected: readonly SelectedComponent[],
  options: EvalOptions,
  ctx: TPOContext,
  lockedSlotNames: ReadonlySet<string>,
): { kept: readonly SelectedComponent[]; suppressed: readonly SuppressedComponent[] } {
  const { policy } = options;
  if (!policy?.length) return { kept: selected, suppressed: [] };
  const kept: SelectedComponent[] = [];
  const suppressed: SuppressedComponent[] = [];
  for (const comp of selected) {
    const hit = policy.find((p) => p.componentKey === comp.componentKey && evalCondition(ctx, p.condition));
    if (hit && !lockedSlotNames.has(comp.slot)) {
      suppressed.push({ componentKey: comp.componentKey, whyNot: `policy gate: ${hit.action} (${hit.id})`, policyId: hit.id });
    } else {
      kept.push(comp);
    }
  }
  return { kept, suppressed };
}

function applyAbstentions(
  kept: readonly SelectedComponent[],
  rules: readonly Rule[],
  threshold: number,
): { final: readonly SelectedComponent[]; abstentions: readonly AbstainedComponent[] } {
  const final: SelectedComponent[] = [];
  const abstentions: AbstainedComponent[] = [];
  for (const comp of kept) {
    const hint = rules.find((r) => r.componentKey === comp.componentKey && r.slot === comp.slot)?.confidenceHint;
    if (hint !== undefined && hint < threshold) {
      abstentions.push({ componentKey: comp.componentKey, confidence: hint, threshold, reason: `confidenceHint ${hint} below threshold ${threshold}` });
    } else {
      final.push(comp);
    }
  }
  return { final, abstentions };
}

function evaluate(context: TPOContext, options: EvalOptions): TPOResult {
  const clock = options.clock ?? Date.now;
  const t0 = clock();
  validateContext(context);
  validateOptions(options);
  const threshold = options.confidenceThreshold ?? 0.60;
  const locked = options.lockedSlots ?? [];
  const lockedSlotNames = new Set(locked.map((l) => l.slot));

  const { selected: allSelected, conditionMismatched } = buildSelected(options.rules.rules, context);
  const displacedByLock: readonly SuppressedComponent[] = allSelected
    .filter((s) => {
      const lock = locked.find((l) => l.slot === s.slot);
      return lock !== undefined && lock.componentKey !== s.componentKey;
    })
    .map((s): SuppressedComponent => ({
      componentKey: s.componentKey,
      whyNot: `slot '${s.slot}' is locked (${locked.find((l) => l.slot === s.slot)?.reason ?? 'locked'})`,
      policyId: undefined,
    }));
  const selected0 = allSelected.filter((s) => !lockedSlotNames.has(s.slot));
  const { kept, suppressed: policySuppressed } = applyPolicy(selected0, options, context, lockedSlotNames);
  const { final: selected, abstentions } = applyAbstentions(kept, options.rules.rules, threshold);

  const suppressedKeys = new Set([...policySuppressed, ...displacedByLock].map((s) => s.componentKey));
  const dedupedCondMismatch = conditionMismatched.filter((s) => !suppressedKeys.has(s.componentKey));
  const suppressed: readonly SuppressedComponent[] = [...dedupedCondMismatch, ...displacedByLock, ...policySuppressed];

  const policyHits = policySuppressed.length;
  const n = abstentions.length;
  const noOutput = selected.length === 0 && locked.length === 0;
  const riskTier: RiskTier =
    (noOutput || n >= 3 || policyHits >= 2) ? 'high' :
    (n >= 2 || policyHits >= 1) ? 'medium' :
    'low';
  const allMatchedIds = new Set(selected.flatMap((s) => [...s.matchedRules]));

  const trace: readonly TraceEntry[] = Object.freeze([
    ...locked.map((l): TraceEntry => ({ kind: 'locked', slot: l.slot, componentKey: l.componentKey, reason: l.reason })),
    ...selected.map((s): TraceEntry => ({ kind: 'selected', componentKey: s.componentKey, slot: s.slot, specificity: s.specificity, priority: s.priority, matchedRules: s.matchedRules })),
    ...suppressed.map((s): TraceEntry => ({ kind: 'suppressed', componentKey: s.componentKey, whyNot: s.whyNot, policyId: s.policyId })),
    ...abstentions.map((a): TraceEntry => ({ kind: 'abstained', componentKey: a.componentKey, confidence: a.confidence, threshold: a.threshold, reason: a.reason, fallback: a.fallback })),
  ]);

  return {
    locked, selected, suppressed, abstentions, riskTier, trace,
    meta: { evaluateMs: clock() - t0, ruleCount: options.rules.rules.length, matchedRuleCount: allMatchedIds.size, traceVersion: 'v1', deterministic: true },
  };
}

export { evaluate };
