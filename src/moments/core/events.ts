// Moment engine observability helpers — ADR-0013 §2 Observable.
//
// Every successful render emits a 'moment_exposed' event carrying a
// deterministic signals_hash so PostHog / analytics can reconstruct
// which signal combination drove the selection — without storing raw PII.

import { emit } from '../../lib/events';
import type { Moment, MomentContext } from './types';

// ---------------------------------------------------------------------------
// djb2 hash — lightweight, no crypto dependency, deterministic
// ---------------------------------------------------------------------------

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // hash * 33 ^ char
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    // keep in 32-bit signed int range
    hash |= 0;
  }
  // unsigned hex string
  return hash >>> 0;
}

/**
 * Produce a deterministic hex string from a MomentContext.
 *
 * Only signal fields are included (l0/l1/l2) — never PII fields
 * (assetId, role, locale) which are carried separately on EventBase.
 * Result is stable for equal signal values regardless of insertion order
 * because JSON.stringify of a plain object preserves declaration order,
 * and MomentContext fields are always declared in the same order.
 */
export function hashSignals(ctx: MomentContext): string {
  const signals = {
    l0: ctx.l0 ?? null,
    l1: ctx.l1 ?? null,
    l2: ctx.l2
      ? {
          variantHint: ctx.l2.variantHint ?? null,
          patternNotes: ctx.l2.patternNotes ?? null,
          // disabledMomentIds is operational, not a signal — excluded from hash
        }
      : null,
    phase: ctx.phase ?? null,
  };
  return djb2(JSON.stringify(signals)).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Public emission helper
// ---------------------------------------------------------------------------

/**
 * Emit the 'moment_exposed' analytics event for a successfully rendered Moment.
 *
 * Called by dispatchRender() after a successful render. ADR-0013 §2 Observable:
 * every exposure must be recorded with {signals_hash, moment_id, variant, slot, outcome}.
 */
export function emitMomentExposed(moment: Moment, ctx: MomentContext): void {
  emit(
    'moment_exposed',
    {
      moment_id: moment.id,
      slot: moment.slot,
      variant: ctx.l2?.variantHint ?? 'default',
      signals_hash: hashSignals(ctx),
      outcome: 'rendered',
    },
    {
      asset_id: ctx.assetId,
      role: ctx.role,
      locale: ctx.locale,
    },
  );
}
