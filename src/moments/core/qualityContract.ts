// Quality Contract — 7 clauses from ADR-0013.
//
// Runtime invariants and dev-only assertions that every Moment must satisfy.
// In dev (NODE_ENV !== 'production') violations throw. In production only
// the Fallback clause (§6) is enforced at the engine level; all other
// clauses degrade to no-ops so there is zero performance impact.
//
// ADR-0013 Quality Contract (verbatim):
//   1. Bounded variation — Moment 라이브러리 외 신규 UX 생성 금지.
//   2. Observable — 모든 노출이 {signals_hash, moment_id, variant, slot, outcome} 이벤트로 기록 (PostHog opt-in, ADR-0005).
//   3. Predictable — 같은 signals → 같은 rule 결정. Variant 변주는 weekly cache 에서 파생, 매 진입마다 재생성 X.
//   4. Reversible — 문제 Moment 는 L2 hint flag 로 즉시 전 사용자 OFF (앱 재배포 X).
//   5. Auditable / Explainable — Moment tap & hold 시 "왜 지금 이게 보이는지" 한 줄 노출 (XAI).
//   6. Fallback — predicate < threshold 이면 canonical default. "AI 가 모르면 가만히 있는다."
//   7. Accessibility floor — 모든 render 는 VoiceOver label, 44pt touch, WCAG AA contrast 를 helper 로 강제.

import type { Moment, MomentContext, MomentRenderResult } from './types';

// ---------------------------------------------------------------------------
// Clause definitions (typed for programmatic use)
// ---------------------------------------------------------------------------

export type ClauseId =
  | 'bounded_variation'
  | 'observable'
  | 'predictable'
  | 'score_range'
  | 'reversible'
  | 'auditable_explainable'
  | 'fallback'
  | 'accessibility_floor';

export interface QualityClause {
  id: ClauseId;
  /** ADR-0013 verbatim description (Korean, as authored). */
  description: string;
  /**
   * Runtime check. Returns a violation message string if the clause is
   * violated, or `null` if it passes.
   *
   * `result` may be undefined for clauses that check registration-time
   * properties rather than render output.
   */
  check: (moment: Moment, ctx: MomentContext, result?: MomentRenderResult) => string | null;
}

// ---------------------------------------------------------------------------
// The 7 clauses — verbatim from ADR-0013
// ---------------------------------------------------------------------------

export const QUALITY_CLAUSES: QualityClause[] = [
  {
    id: 'bounded_variation',
    description:
      'Bounded variation — Moment 라이브러리 외 신규 UX 생성 금지.',
    check: (moment) => {
      // Structural check: a registered Moment must have a stable id and slot.
      // The "no new UX outside the library" invariant is enforced at registration
      // time by the registry — only Moment objects conforming to the interface
      // can be registered.
      if (!moment.id || !moment.slot) {
        return `[bounded_variation] Moment is missing required 'id' or 'slot'. id="${moment.id}" slot="${moment.slot}"`;
      }
      return null;
    },
  },
  {
    id: 'observable',
    description:
      'Observable — 모든 노출이 {signals_hash, moment_id, variant, slot, outcome} 이벤트로 기록 (PostHog opt-in, ADR-0005).',
    check: (moment) => {
      // Each Moment must declare an events schema so the engine can hook
      // into exposed/tapped/dwell/dismissed/resultingMemory.
      // Clause passes as long as events property is present (hooks may be
      // undefined individually — partial observation is acceptable at v1).
      if (moment.events === undefined) {
        return `[observable] Moment "${moment.id}" has no events schema. Declare 'events: {}' at minimum.`;
      }
      return null;
    },
  },
  {
    id: 'predictable',
    description:
      'Predictable — 같은 signals → 같은 rule 결정. Variant 변주는 weekly cache 에서 파생, 매 진입마다 재생성 X.',
    check: (moment, ctx) => {
      // Runtime check: predicate must be a pure function (deterministic).
      // Run 3 consecutive calls with the same ctx to detect closure/state leaks,
      // then 1 call with a structurally identical clone to catch reference-equality
      // dependencies. All 4 results must be equal.
      const a = moment.predicate(ctx);
      const b = moment.predicate(ctx);
      const c = moment.predicate(ctx);
      // Structurally equal clone — detects ctx reference capture bugs.
      const ctxClone: typeof ctx = JSON.parse(JSON.stringify(ctx));
      const d = moment.predicate(ctxClone);
      if (a !== b || b !== c) {
        return `[predictable] Moment "${moment.id}" predicate is non-deterministic across consecutive calls: [${a}, ${b}, ${c}].`;
      }
      if (a !== d) {
        return `[predictable] Moment "${moment.id}" predicate result differs for structurally equal ctx clone (reference capture?): original=${a}, clone=${d}.`;
      }
      return null;
    },
  },
  {
    id: 'score_range',
    description:
      'Score range — predicate 반환값은 반드시 [0, 1] 범위여야 한다.',
    check: (moment, ctx) => {
      const score = moment.predicate(ctx);
      if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 1) {
        return `[score_range] Moment "${moment.id}" predicate returned ${String(score)} — must be a number in [0, 1].`;
      }
      return null;
    },
  },
  {
    id: 'reversible',
    description:
      'Reversible — 문제 Moment 는 L2 hint flag 로 즉시 전 사용자 OFF (앱 재배포 X).',
    check: (moment) => {
      // Structural check: id must be non-empty so the kill-switch list
      // (ctx.l2.disabledMomentIds) can reference this Moment by id, and
      // intent must be present for human-readable kill-switch surface.
      if (!moment.id || moment.id.trim().length === 0) {
        return `[reversible] Moment has empty 'id' — kill-switch cannot target it.`;
      }
      if (!moment.intent || moment.intent.trim().length === 0) {
        return `[reversible] Moment "${moment.id}" has no 'intent' description. Required for L2 kill-switch surface.`;
      }
      return null;
    },
  },
  {
    id: 'auditable_explainable',
    description:
      'Auditable / Explainable — Moment tap & hold 시 "왜 지금 이게 보이는지" 한 줄 노출 (XAI).',
    check: (_moment, _ctx, result) => {
      if (!result) return null;
      if (!result.explanation || result.explanation.trim().length === 0) {
        return `[auditable_explainable] MomentRenderResult for "${_moment.id}" is missing 'explanation'. Required for XAI tap-and-hold surface.`;
      }
      return null;
    },
  },
  {
    id: 'fallback',
    description:
      'Fallback — predicate < threshold 이면 canonical default. "AI 가 모르면 가만히 있는다."',
    check: (moment, ctx) => {
      // Verify predicate returns a numeric value (non-NaN) so the fallback
      // threshold comparison in render.ts can function correctly.
      const score = moment.predicate(ctx);
      if (typeof score !== 'number' || isNaN(score)) {
        return `[fallback] Moment "${moment.id}" predicate returned non-numeric value: ${String(score)}. Fallback threshold comparison will break.`;
      }
      return null;
    },
  },
  {
    id: 'accessibility_floor',
    description:
      'Accessibility floor — 모든 render 는 VoiceOver label, 44pt touch, WCAG AA contrast 를 helper 로 강제.',
    check: (_moment, _ctx, result) => {
      if (!result) return null;
      const violations: string[] = [];
      if (!result.accessibilityLabel || result.accessibilityLabel.trim().length === 0) {
        violations.push('accessibilityLabel is empty');
      }
      if (typeof result.minTouchPt !== 'number' || result.minTouchPt < 44) {
        violations.push(`minTouchPt=${result.minTouchPt} (must be >= 44)`);
      }
      if (violations.length > 0) {
        return `[accessibility_floor] Moment "${_moment.id}" render result violations: ${violations.join('; ')}.`;
      }
      return null;
    },
  },
];

// ---------------------------------------------------------------------------
// Assertion helper
// ---------------------------------------------------------------------------

const IS_DEV = process.env['NODE_ENV'] !== 'production';

/**
 * Run all Quality Contract clause checks for a rendered Moment.
 *
 * In dev mode: throws on the first violation.
 * In production: no-op (only §6 Fallback is enforced at the engine level).
 */
export function assertQualityContract(
  moment: Moment,
  ctx: MomentContext,
  result?: MomentRenderResult,
): void {
  if (!IS_DEV) return;

  for (const clause of QUALITY_CLAUSES) {
    const violation = clause.check(moment, ctx, result);
    if (violation !== null) {
      throw new QualityContractViolation(violation);
    }
  }
}

/**
 * Run all checks and return a list of violation messages without throwing.
 * Useful for test assertions that need to inspect multiple violations at once.
 */
export function collectViolations(
  moment: Moment,
  ctx: MomentContext,
  result?: MomentRenderResult,
): string[] {
  const violations: string[] = [];
  for (const clause of QUALITY_CLAUSES) {
    const v = clause.check(moment, ctx, result);
    if (v !== null) violations.push(v);
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class QualityContractViolation extends Error {
  constructor(message: string) {
    super(`QualityContractViolation: ${message}`);
    this.name = 'QualityContractViolation';
  }
}
