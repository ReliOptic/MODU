// TPO Engine v2 — type definitions (no domain imports, self-contained)

export type Proximity = 'far' | 'week' | 'near' | 'dayof' | 'after';

export type TimeOfDay = 'dawn' | 'morning' | 'day' | 'evening' | 'night';

export type RoleId =
  | 'self'
  | 'partner'
  | 'parent'
  | 'child'
  | 'guardian'
  | 'project_lead'
  | 'clinician';

export type AssetCopyKey = 'fertility' | 'cancer' | 'pet';

export type LocaleId = 'ko' | 'en' | 'ja' | 'de' | 'ar';

export type LocalizedString = Partial<Record<LocaleId, string>>;

export interface ProximityEntry {
  readonly id: Proximity;
  readonly label: string;
  readonly urgency: number;
  readonly hero: 'ambient' | 'preview' | 'focus' | 'singular' | 'recovery';
}

export interface TimeOfDayEntry {
  readonly id: TimeOfDay;
  readonly label: LocalizedString;
  readonly hourRange: readonly [number, number];
  readonly mood: 'gentle' | 'focused' | 'steady' | 'warm' | 'quiet';
  readonly bgTint: number;
  readonly density: number;
}

export interface RoleEntry {
  readonly id: RoleId;
  readonly label: LocalizedString;
  readonly tone:
    | 'first-person'
    | 'we'
    | 'protective'
    | 'devoted'
    | 'sustaining'
    | 'organized'
    | 'steady';
}

export interface PlaceResourceItem {
  readonly kind: 'subsidy' | 'clinic' | 'event' | 'pharmacy';
  readonly label: LocalizedString;
  readonly note?: LocalizedString;
}

export interface Place {
  readonly id: string;
  readonly country: string;
  readonly region: string;
  readonly label: LocalizedString;
  readonly flag: string;
  readonly resources: Readonly<
    Partial<Record<AssetCopyKey, readonly PlaceResourceItem[]>>
  >;
}

export interface CopyBlock {
  readonly heroWord: LocalizedString;
  readonly headline: LocalizedString;
  readonly whisper: LocalizedString;
}

export interface ResolvedCopy {
  readonly heroWord: string;
  readonly headline: string;
  readonly whisper: string;
}

export interface TPOVisual {
  readonly heroScale: number;
  readonly density: number;
  readonly dim: number;
  readonly blobSize: number;
  readonly ritualStrength: number;
}

export interface ResolvedPlaceResources {
  readonly place: Place;
  readonly placeLabel: string;
  readonly items: ReadonlyArray<{
    readonly kind: PlaceResourceItem['kind'];
    readonly label: string;
    readonly note: string;
  }>;
}
