// Deterministic TPO → home renderer selector.
//
// MODU is metamorphic: the system, not the user, picks the renderer that
// matches the chapter's current rhythm. Each variation embodies one mode:
//
//   - cinematic — moment of significance (full-bleed reverence, single flow).
//                 Used when the user is *in* the event window.
//   - bento    — orchestration mode (multi-tile, high-density scan).
//                 Used when the event is approaching (≤ 7 days) and the user
//                 is in planning / preparation headspace.
//   - morph    — ambient mode (organic, soft, low-stakes).
//                 Used in the long flat ("far") and recovery ("after") zones,
//                 where MODU should feel like a breath rather than a dashboard.
//
// V1 is proximity-only. Future axes (role / timeOfDay / preference) can be
// layered as tiebreakers without changing the contract — see selectVariation
// callers, which receive ResolvedTPO so the full signal set is available.
import type { ResolvedTPO } from '../../adapters';
import type { VariationId } from './types';

export function selectVariation(tpo: ResolvedTPO): VariationId {
  switch (tpo.proximity) {
    case 'dayof':
      return 'cinematic';
    case 'near':
    case 'week':
      return 'bento';
    case 'far':
    case 'after':
      return 'morph';
  }
}
