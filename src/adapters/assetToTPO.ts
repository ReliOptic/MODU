// Adapter: domain Asset + TPOInputState → ResolvedTPO
// Bridges src/types/asset + src/types/event onto the Phase 1 TPO engine.
// Pure functions only — no side effects, no stored state.
import type { Asset } from '../types/asset';
import type { ScheduledEvent } from '../types/event';
import type {
  AssetCopyKey,
  LocaleId,
  Proximity,
  ResolvedCopy,
  RoleId,
  TimeOfDay,
  TPOVisual,
} from '../engine/tpo';
import { getTPOCopy, getTPOVisual, hourToTimeOfDay } from '../engine/tpo';
import { eventPhaseAt } from '../types/event';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface TPOInputState {
  readonly locale: LocaleId;
  readonly placeId: string;
  /** Explicit user role override. null → infer from Asset. */
  readonly role: RoleId | null;
  /** ISO now override for demos. null → use provided `now`. */
  readonly nowOverride: string | null;
}

export interface ResolvedTPO {
  readonly proximity: Proximity;
  readonly timeOfDay: TimeOfDay;
  readonly role: RoleId;
  readonly placeId: string;
  readonly locale: LocaleId;
  readonly assetKey: AssetCopyKey;
  readonly copy: ResolvedCopy;
  readonly visual: TPOVisual;
  /** The event (if any) driving the proximity read. null when proximity='far'. */
  readonly anchorEventId: string | null;
}

// ---------------------------------------------------------------------------
// Helper predicates (exported for testability)
// ---------------------------------------------------------------------------

/** Infer role from Asset type + envelope when no user override is set. */
export function inferRole(asset: Asset): RoleId {
  if (asset.type === 'cancer_caregiver') return 'guardian';
  if (asset.type === 'pet_care') return 'guardian';
  if (asset.envelope === 'E3') return 'parent';
  if (asset.envelope === 'E2') return 'parent';
  return 'self';
}

/** Map Asset.type to the engine's AssetCopyKey. */
export function mapAssetKey(type: Asset['type']): AssetCopyKey {
  if (type === 'fertility') return 'fertility';
  if (type === 'cancer_caregiver') return 'cancer';
  if (type === 'pet_care') return 'pet';
  // 'chronic', 'custom', or unknown → engine falls back via COPY_FALLBACK
  return 'fertility';
}

interface ProximityResult {
  readonly proximity: Proximity;
  readonly anchorEventId: string | null;
}

/**
 * Compute proximity from a list of scheduled events relative to now.
 * Uses a 168-hour (7-day) look-ahead window. Earlier events win ties.
 */
export function computeProximity(
  events: readonly ScheduledEvent[],
  now: Date,
): ProximityResult {
  // Sort ascending by start time so earlier events win ties.
  const sorted = [...events].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  let duringEvent: ScheduledEvent | null = null;
  let afterEvent: ScheduledEvent | null = null;
  let nearEvent: ScheduledEvent | null = null;   // before AND ≤ 24h
  let weekEvent: ScheduledEvent | null = null;   // before AND ≤ 72h

  for (const e of sorted) {
    const phase = eventPhaseAt(e, now, 168);
    if (phase === undefined) continue;

    const startMs = new Date(e.at).getTime();
    const diffHours = (startMs - now.getTime()) / 3_600_000;

    if (phase === 'during' && duringEvent === null) {
      duringEvent = e;
    } else if (phase === 'after' && afterEvent === null) {
      afterEvent = e;
    } else if (phase === 'before') {
      if (diffHours <= 24 && nearEvent === null) {
        nearEvent = e;
      } else if (diffHours <= 72 && weekEvent === null) {
        weekEvent = e;
      }
    }
  }

  // Priority: during > after > near > week > far
  if (duringEvent !== null) {
    return { proximity: 'dayof', anchorEventId: duringEvent.id };
  }
  if (afterEvent !== null) {
    return { proximity: 'after', anchorEventId: afterEvent.id };
  }
  if (nearEvent !== null) {
    return { proximity: 'near', anchorEventId: nearEvent.id };
  }
  if (weekEvent !== null) {
    return { proximity: 'week', anchorEventId: weekEvent.id };
  }
  return { proximity: 'far', anchorEventId: null };
}

// ---------------------------------------------------------------------------
// Effective-now resolution
// ---------------------------------------------------------------------------

function resolveEffectiveNow(state: TPOInputState, now: Date): Date {
  if (state.nowOverride === null) return now;
  const d = new Date(state.nowOverride);
  return Number.isNaN(d.getTime()) ? now : d;
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

export function resolveTPO(
  asset: Asset,
  state: TPOInputState,
  now: Date,
): ResolvedTPO {
  const effectiveNow = resolveEffectiveNow(state, now);

  const timeOfDay: TimeOfDay = hourToTimeOfDay(effectiveNow.getHours());

  const { proximity, anchorEventId } = computeProximity(
    asset.events ?? [],
    effectiveNow,
  );

  const role: RoleId = state.role !== null ? state.role : inferRole(asset);

  const assetKey: AssetCopyKey = mapAssetKey(asset.type);

  const copy: ResolvedCopy = getTPOCopy({
    assetKey,
    proximity,
    time: timeOfDay,
    role,
    locale: state.locale,
  });

  const visual: TPOVisual = getTPOVisual(proximity, timeOfDay);

  return {
    proximity,
    timeOfDay,
    role,
    placeId: state.placeId,
    locale: state.locale,
    assetKey,
    copy,
    visual,
    anchorEventId,
  };
}
