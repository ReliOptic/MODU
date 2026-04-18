import type {
  AssetCopyKey,
  LocaleId,
  LocalizedString,
  Proximity,
  ResolvedCopy,
  ResolvedPlaceResources,
  RoleId,
  TimeOfDay,
  TPOVisual,
} from './types';
import { COPY } from './copy';
import { findProximity, findTimeOfDay } from './time';
import { findPlace } from './places';

/**
 * Locale-aware string picker.
 * Cascade: obj[locale] → obj.en → obj.ko → first value → ''.
 */
export function lpick(obj: LocalizedString | undefined, locale: LocaleId): string {
  if (!obj) return '';
  const direct = obj[locale];
  if (direct !== undefined) return direct;
  if (obj.en !== undefined) return obj.en;
  if (obj.ko !== undefined) return obj.ko;
  const first = firstValue(obj);
  return first ?? '';
}

/** First defined value in a partial record — preserves generic without `as` casts. */
function firstValue<V>(obj: { readonly [k: string]: V | undefined } | undefined): V | undefined {
  if (!obj) return undefined;
  for (const v of Object.values(obj)) {
    if (v !== undefined) return v;
  }
  return undefined;
}

interface GetTPOCopyArgs {
  readonly assetKey: AssetCopyKey;
  readonly proximity: Proximity;
  readonly time: TimeOfDay;
  readonly role?: RoleId;
  readonly locale?: LocaleId;
}

const COPY_FALLBACK = {
  heroWord: { ko: 'Listen', en: 'Listen' },
  headline: { ko: '오늘의 챕터', en: 'Today' },
  whisper:  { ko: '당신의 속도로.', en: 'Your pace.' },
} as const;

/**
 * Resolve copy block for the given TPO context.
 * Fallback cascade mirrors the JS bundle: asset → role → proximity → time.
 */
export function getTPOCopy(args: GetTPOCopyArgs): ResolvedCopy {
  const { assetKey, proximity, time, role = 'self', locale = 'ko' } = args;

  const assetTable = COPY[assetKey] ?? COPY.fertility;
  const byRole = assetTable[role] ?? assetTable.self ?? firstValue(assetTable);
  const byProx = byRole
    ? (byRole[proximity] ?? firstValue(byRole))
    : undefined;
  const block = byProx
    ? (byProx[time] ?? firstValue(byProx))
    : undefined;

  const b = block ?? COPY_FALLBACK;

  return {
    heroWord: lpick(b.heroWord, locale),
    headline: lpick(b.headline, locale),
    whisper:  lpick(b.whisper,  locale),
  };
}

/**
 * Compute visual modulation parameters from proximity + time-of-day.
 * Ports exact formulas from the JS bundle.
 */
export function getTPOVisual(proximity: Proximity, time: TimeOfDay): TPOVisual {
  const occ = findProximity(proximity);
  const tod = findTimeOfDay(time);
  return {
    heroScale:      0.7 + occ.urgency * 0.5,
    density:        Math.max(0.3, tod.density * (1.2 - occ.urgency * 0.5)),
    dim:            tod.bgTint,
    blobSize:       0.8 + occ.urgency * 0.6,
    ritualStrength: occ.urgency,
  };
}

interface GetPlaceResourcesArgs {
  readonly placeId: string;
  readonly assetKey: AssetCopyKey;
  readonly locale?: LocaleId;
}

/** Resolve place resources with localized strings. */
export function getPlaceResources(args: GetPlaceResourcesArgs): ResolvedPlaceResources {
  const { placeId, assetKey, locale = 'ko' } = args;
  const place = findPlace(placeId);
  const list = place.resources[assetKey] ?? [];
  return {
    place,
    placeLabel: lpick(place.label, locale),
    items: list.map((it) => ({
      kind:  it.kind,
      label: lpick(it.label, locale),
      note:  lpick(it.note,  locale),
    })),
  };
}
