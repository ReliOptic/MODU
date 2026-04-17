// Moment engine core — public re-export surface.
//
// Import from 'src/moments/core' for types, registry, render dispatch,
// and Quality Contract utilities.

export type {
  Slot,
  Role,
  L0Signals,
  L1Signals,
  L2Signals,
  MomentContext,
  MomentEventSchema,
  VariantKey,
  VariantConfig,
  MomentRenderResult,
  Moment,
} from './types';

export {
  registerMoment,
  registerMoments,
  getMoment,
  getCandidates,
  getBestMoment,
  listRegistered,
  _clearRegistryForTesting,
} from './registry';

export {
  FALLBACK_THRESHOLD,
  dispatchRender,
  render,
  renderN,
} from './render';

export { emitMomentExposed, hashSignals } from './events';

export type { ClauseId, QualityClause } from './qualityContract';
export {
  QUALITY_CLAUSES,
  assertQualityContract,
  collectViolations,
  QualityContractViolation,
} from './qualityContract';
