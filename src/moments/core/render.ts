// Moment render dispatcher — Hybrid (c) pattern.
//
// ADR-0013 Q4: one Moment file, render(ctx) dispatches to
//   Moment.roleRenderers[ctx.role] ?? Moment.defaultRenderer
//
// Quality Contract §6 Fallback: if predicate < threshold, returns undefined
// and the caller should fall back to the canonical default.

import { getCandidates } from './registry';
import { assertQualityContract } from './qualityContract';
import { emitMomentExposed } from './events';
import type { Moment, MomentContext, MomentRenderResult, Slot } from './types';

/**
 * Predicate score floor. Below this, slot returns canonical default.
 * ADR-0013 §6 "AI가 모르면 가만히 있는다" — empirical noise floor.
 * Per-slot override via composition engine (future).
 */
export const FALLBACK_THRESHOLD = 0.1;

// ---------------------------------------------------------------------------
// Core dispatch
// ---------------------------------------------------------------------------

/**
 * Dispatch render for a single Moment given a context.
 *
 * Hybrid (c) role dispatch:
 *   1. Check roleRenderers[ctx.role] — role-specific sub-component.
 *   2. Fall back to defaultRenderer if no role-specific renderer exists.
 *
 * Runs Quality Contract assertions in dev mode after render.
 */
export function dispatchRender(moment: Moment, ctx: MomentContext): MomentRenderResult {
  const renderer = moment.roleRenderers?.[ctx.role] ?? moment.defaultRenderer;
  const result = renderer(ctx);

  // Dev-only Quality Contract assertion (§7 Accessibility floor, §5 Explainable).
  // In production the assertion is a no-op; only fallback behaviour is enforced.
  assertQualityContract(moment, ctx, result);

  // ADR-0013 §2 Observable — emit exposure event for every successful render.
  emitMomentExposed(moment, ctx);

  return result;
}

// ---------------------------------------------------------------------------
// Slot-level render
// ---------------------------------------------------------------------------

/**
 * Select the best Moment for a slot and render it.
 *
 * Returns `undefined` when:
 *   - No Moments are registered for the slot, OR
 *   - The best candidate's predicate score is below FALLBACK_THRESHOLD
 *     (Quality Contract §6 Fallback — "AI가 모르면 가만히 있는다").
 */
export function render(
  slot: Slot,
  ctx: MomentContext,
  options?: { threshold?: number },
): MomentRenderResult | undefined {
  const threshold = options?.threshold ?? FALLBACK_THRESHOLD;
  const candidates = getCandidates(slot, ctx);

  if (candidates.length === 0) return undefined;

  // ADR-0013 §4 Reversible — skip any Moment whose id appears in the kill-switch list.
  const disabled = ctx.l2?.disabledMomentIds;
  const isDisabled = disabled
    ? (id: string) =>
        disabled instanceof Set ? disabled.has(id) : (disabled as string[]).includes(id)
    : () => false;

  const best = candidates.find((c) => !isDisabled(c.moment.id));
  if (!best) return undefined;
  if (best.score < threshold) return undefined;

  return dispatchRender(best.moment, ctx);
}

/**
 * Render the top-N Moments for a slot (used for `row` slot which allows 3–7).
 *
 * Only candidates with score >= threshold are included.
 */
export function renderN(
  slot: Slot,
  ctx: MomentContext,
  maxN: number,
  options?: { threshold?: number },
): MomentRenderResult[] {
  const threshold = options?.threshold ?? FALLBACK_THRESHOLD;

  // ADR-0013 §4 Reversible — exclude kill-switched Moments.
  const disabled = ctx.l2?.disabledMomentIds;
  const isDisabled = disabled
    ? (id: string) =>
        disabled instanceof Set ? disabled.has(id) : (disabled as string[]).includes(id)
    : () => false;

  const candidates = getCandidates(slot, ctx).filter(
    (c) => c.score >= threshold && !isDisabled(c.moment.id),
  );
  const top = candidates.slice(0, maxN);
  return top.map((c) => dispatchRender(c.moment, ctx));
}
