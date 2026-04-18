import type { Proximity, ProximityEntry, TimeOfDay, TimeOfDayEntry } from './types';

export const PROXIMITIES: readonly ProximityEntry[] = [
  { id: 'far',   label: 'D-7+',  urgency: 0.1,  hero: 'ambient'  },
  { id: 'week',  label: 'D-3',   urgency: 0.35, hero: 'preview'  },
  { id: 'near',  label: 'D-1',   urgency: 0.75, hero: 'focus'    },
  { id: 'dayof', label: 'D-day', urgency: 1.0,  hero: 'singular' },
  { id: 'after', label: 'D+1',   urgency: 0.4,  hero: 'recovery' },
];

export const TIMES_OF_DAY: readonly TimeOfDayEntry[] = [
  { id: 'dawn',    label: { ko: '새벽', en: 'Dawn',    ja: '夜明け', de: 'Dämmerung', ar: 'الفجر'   }, hourRange: [4,  7],  mood: 'gentle',  bgTint: 0.92, density: 0.5 },
  { id: 'morning', label: { ko: '아침', en: 'Morning', ja: '朝',     de: 'Morgen',     ar: 'الصباح' }, hourRange: [7,  11], mood: 'focused', bgTint: 1.0,  density: 1.0 },
  { id: 'day',     label: { ko: '낮',   en: 'Day',     ja: '昼',     de: 'Tag',        ar: 'النهار' }, hourRange: [11, 17], mood: 'steady',  bgTint: 1.05, density: 1.0 },
  { id: 'evening', label: { ko: '저녁', en: 'Evening', ja: '夕方',   de: 'Abend',      ar: 'المساء' }, hourRange: [17, 21], mood: 'warm',    bgTint: 0.85, density: 0.8 },
  { id: 'night',   label: { ko: '밤',   en: 'Night',   ja: '夜',     de: 'Nacht',      ar: 'الليل'  }, hourRange: [21, 24], mood: 'quiet',   bgTint: 0.55, density: 0.4 },
];

/**
 * Map a 0-23 hour to a TimeOfDay id.
 * Night range [21,24] also catches 0-3 → 'night'. Default: 'morning'.
 */
export function hourToTimeOfDay(hour: number): TimeOfDay {
  // Midnight-to-3 counts as night
  if (hour >= 0 && hour < 4) return 'night';
  for (const t of TIMES_OF_DAY) {
    if (hour >= t.hourRange[0] && hour < t.hourRange[1]) return t.id;
  }
  return 'morning';
}

/** Never-null lookup; falls back to first entry. */
export function findProximity(id: Proximity): ProximityEntry {
  return PROXIMITIES.find((p) => p.id === id) ?? PROXIMITIES[0];
}

/** Never-null lookup; falls back to 'morning'. */
export function findTimeOfDay(id: TimeOfDay): TimeOfDayEntry {
  return (
    TIMES_OF_DAY.find((t) => t.id === id) ??
    TIMES_OF_DAY.find((t) => t.id === 'morning') ??
    TIMES_OF_DAY[1]
  );
}
