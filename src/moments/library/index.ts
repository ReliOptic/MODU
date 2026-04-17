// Moment library index — registers all P0 Moments.
//
// Call registerAllMoments() once at app mount to load every Moment into the
// registry so the composition engine can find them via getCandidates().
//
// Usage (App.tsx or equivalent entry point):
//
//   import { registerAllMoments } from 'src/moments/library';
//
//   // Call once before the first render that needs Moments.
//   registerAllMoments();
//
// registerMoment is idempotent — calling registerAllMoments() multiple times
// is safe (later calls simply overwrite with the same object).

import { registerMoment } from '../core/registry';
import { tpoSignature } from './skin/tpo-signature';
import { nextStep } from './floating/next-step';
import { quietWeave } from './hero/quiet-weave';

/**
 * Register all P0 Moments into the global registry.
 *
 * Registered Moments (in order):
 *   - tpo-signature  (skin)     — TPO-tuned initial screen tone
 *   - next-step      (floating) — single next-action prompt
 *   - quiet-weave    (hero)     — partner-signal woven into self timeline
 */
export function registerAllMoments(): void {
  registerMoment(tpoSignature);
  registerMoment(nextStep);
  registerMoment(quietWeave);
}

// Re-export individual Moments for direct import in tests / stories.
export { tpoSignature } from './skin/tpo-signature';
export { nextStep } from './floating/next-step';
export { quietWeave } from './hero/quiet-weave';
