// Moment registry — slot-keyed registration and priority-ordered lookup.
//
// Moments register themselves here. The composition engine (render.ts /
// future engine.ts) calls `getCandidates(slot, ctx)` to get an ordered list
// and picks the top-N for that slot's capacity.

import type { Moment, MomentContext, Slot } from './types';

// ---------------------------------------------------------------------------
// Internal store
// ---------------------------------------------------------------------------

const _registry: Map<string, Moment> = new Map();

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a Moment. Overwrites any previously registered Moment with the
 * same `id` (idempotent re-import safe).
 */
export function registerMoment(moment: Moment): void {
  _registry.set(moment.id, moment);
}

/**
 * Register multiple Moments at once. Convenience for library index files.
 */
export function registerMoments(moments: Moment[]): void {
  for (const m of moments) {
    registerMoment(m);
  }
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Retrieve a registered Moment by id.
 * Returns `undefined` if no Moment with that id has been registered.
 */
export function getMoment(id: string): Moment | undefined {
  return _registry.get(id);
}

/**
 * Return all Moments registered for the given slot, sorted by descending
 * predicate score against `ctx`.
 *
 * Moments whose `predicate(ctx)` returns 0 are still included so callers
 * can apply their own threshold (Quality Contract §6 Fallback — threshold
 * enforcement is the caller's responsibility).
 */
export function getCandidates(slot: Slot, ctx: MomentContext): Array<{ moment: Moment; score: number }> {
  const candidates: Array<{ moment: Moment; score: number }> = [];

  for (const moment of _registry.values()) {
    if (moment.slot !== slot) continue;
    const score = moment.predicate(ctx);
    candidates.push({ moment, score });
  }

  // Descending score — deterministic tie-break by id (alphabetical) for
  // Quality Contract §3 Predictable (same signals → same order).
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.moment.id.localeCompare(b.moment.id);
  });

  return candidates;
}

/**
 * Return the single best Moment for a slot, or `undefined` if no Moments
 * are registered for that slot.
 */
export function getBestMoment(slot: Slot, ctx: MomentContext): Moment | undefined {
  const candidates = getCandidates(slot, ctx);
  return candidates[0]?.moment;
}

// ---------------------------------------------------------------------------
// Registry inspection (dev / test utilities)
// ---------------------------------------------------------------------------

/** List all registered Moment ids. */
export function listRegistered(): string[] {
  return Array.from(_registry.keys());
}

/**
 * Clear the registry. Intended for testing only — do not call in production.
 */
export function _clearRegistryForTesting(): void {
  _registry.clear();
}
