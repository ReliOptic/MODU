// i18n — shared type definitions.
// No domain imports. No React. Pure types only.

export type LocaleId = 'ko' | 'en' | 'ja' | 'de' | 'ar';

export type Dir = 'ltr' | 'rtl';

export interface LocaleEntry {
  readonly id: LocaleId;
  readonly label: string;
  readonly dir: Dir;
  readonly displayFont: string;
  readonly uiFont: string;
  readonly monoFont: string;
  readonly displayWeight: number;
  readonly displayTracking: string;
}

// Partial record of locale-keyed strings. A string need not exist for every locale;
// selectors cascade ko → en → first value → ''.
export type LocalizedString = Partial<Record<LocaleId, string>>;

export type StringKey =
  | 'brand_tag'
  | 'hero_1'
  | 'hero_2'
  | 'hero_3'
  | 'intro'
  | 'time_axis'
  | 'place_axis'
  | 'role_axis'
  | 'tod_axis'
  | 'chapter_my'
  | 'chapter_new'
  | 'tap_to_switch'
  | 'cinematic_desc'
  | 'bento_desc'
  | 'morph_desc'
  | 'engine_desc';
