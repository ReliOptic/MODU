interface TPOContext {
  readonly event?: string;
  readonly stage: string;
  readonly role: string;
  readonly time: { readonly phase: string; readonly offsetDays?: number };
  readonly place?: { readonly type: string; readonly city?: string; readonly region?: string };
  readonly locale?: string;
  readonly device?: string;
  readonly meta?: Readonly<Record<string, string>>;
}
interface Condition {
  readonly field: string;
  readonly op: 'eq' | 'in' | 'lt' | 'lte' | 'gt' | 'gte' | 'exists' | 'not-in';
  readonly value: string | number | readonly string[];
}
interface Rule {
  readonly id: string;
  readonly componentKey: string;
  readonly slot: string;
  readonly conditions: readonly Condition[];
  readonly priority: number;
  readonly confidenceHint?: number;
}
interface RulePack { readonly rules: readonly Rule[]; readonly version: string }
interface LockedSlot {
  readonly slot: string;
  readonly componentKey: string;
  readonly reason: 'business-fixed' | 'ad' | 'compliance' | 'promotion';
  readonly priority?: number;
}
type LockedSlots = readonly LockedSlot[];
interface ComponentEntry { readonly key: string; readonly label?: string }
type Registry = Readonly<Record<string, ComponentEntry>>;
type PolicyAction = 'suppress';
interface PolicyRule { readonly id: string; readonly componentKey: string; readonly action: PolicyAction; readonly condition: Condition }
type PolicyPack = readonly PolicyRule[];
interface EvalOptions {
  readonly rules: RulePack;
  readonly registry?: Registry;
  readonly lockedSlots?: LockedSlots;
  readonly policy?: PolicyPack;
  readonly confidenceThreshold?: number;
  readonly clock?: () => number;
}
interface FormatOptions {
  readonly generatedAt?: string;
  readonly traceId?: string;
  readonly mode?: 'developer' | 'governance';
}
interface SelectedComponent {
  readonly slot: string;
  readonly componentKey: string;
  readonly specificity: number;
  readonly priority: number;
  readonly matchedRules: readonly string[];
}
interface SuppressedComponent { readonly componentKey: string; readonly whyNot: string; readonly policyId?: string; readonly ruleId?: string }
interface AbstainedComponent { readonly componentKey: string; readonly confidence: number; readonly threshold: number; readonly reason: string; readonly fallback?: string }
type TraceEntry =
  | { readonly kind: 'locked'; readonly slot: string; readonly componentKey: string; readonly reason: LockedSlot['reason'] }
  | { readonly kind: 'selected'; readonly componentKey: string; readonly slot: string; readonly specificity: number; readonly priority: number; readonly matchedRules: readonly string[] }
  | { readonly kind: 'suppressed'; readonly componentKey: string; readonly whyNot: string; readonly policyId?: string }
  | { readonly kind: 'abstained'; readonly componentKey: string; readonly confidence: number; readonly threshold: number; readonly reason: string; readonly fallback?: string };
type RiskTier = 'low' | 'medium' | 'high';
interface EvalMeta { readonly evaluateMs: number; readonly ruleCount: number; readonly matchedRuleCount: number; readonly rulePackVersion: string; readonly traceVersion: 'v1'; readonly deterministic: true }
interface DecisionSummary {
  readonly context: { readonly stage: string; readonly role: string; readonly phase: string };
  readonly selected: ReadonlyArray<{ readonly slot: string; readonly componentKey: string }>;
  readonly excluded: ReadonlyArray<{ readonly componentKey: string; readonly reason: string }>;
  readonly deferred: ReadonlyArray<{ readonly componentKey: string; readonly confidence: number }>;
  readonly locked: ReadonlyArray<{ readonly slot: string; readonly componentKey: string; readonly reason: LockedSlot['reason'] }>;
  readonly riskTier: RiskTier;
}
interface AuditEvent {
  readonly eventType: 'tpo.decision.v1';
  readonly timestamp: string;
  readonly context: TPOContext;
  readonly outcome: {
    readonly selected: readonly string[];
    readonly suppressed: readonly string[];
    readonly abstained: readonly string[];
    readonly locked: readonly string[];
    readonly riskTier: RiskTier;
    readonly policyHits: ReadonlyArray<{ readonly policyId: string; readonly componentKey: string }>;
  };
  readonly meta: EvalMeta;
}
interface DecisionExpectation {
  toSelectInSlot(slot: string, componentKey: string): DecisionExpectation;
  toExclude(componentKey: string): DecisionExpectation;
  toHaveRiskTier(tier: RiskTier): DecisionExpectation;
  toBeLocked(slot: string): DecisionExpectation;
  readonly not: { toSelect(componentKey: string): DecisionExpectation };
}
interface TPOResult {
  readonly locked: readonly LockedSlot[];
  readonly selected: readonly SelectedComponent[];
  readonly suppressed: readonly SuppressedComponent[];
  readonly abstentions: readonly AbstainedComponent[];
  readonly riskTier: RiskTier;
  readonly trace: readonly TraceEntry[];
  readonly meta: EvalMeta;
}
class TPOInputError extends Error {
  constructor(readonly field: string, message: string) { super(message); this.name = 'TPOInputError'; }
}
export type {
  TPOContext, Condition, Rule, RulePack, LockedSlot, LockedSlots,
  ComponentEntry, Registry, PolicyRule, PolicyPack, PolicyAction, EvalOptions,
  SelectedComponent, SuppressedComponent, AbstainedComponent,
  TraceEntry, RiskTier, EvalMeta, TPOResult, FormatOptions,
  DecisionSummary, AuditEvent, DecisionExpectation,
};
export { TPOInputError };
