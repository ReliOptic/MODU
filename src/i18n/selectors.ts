// i18n — pure selector functions. No React. No domain imports.

import { LOCALES, DEFAULT_LOCALE } from './locales';
import { STRINGS } from './registry';
import type { LocaleId, LocaleEntry, LocalizedString, StringKey } from './types';

/**
 * Translate a string key to the given locale.
 * Cascade: locale → 'en' → 'ko' → ''.
 * Falls back to DEFAULT_LOCALE ('ko') when locale is omitted.
 */
export function tr(key: StringKey, locale: LocaleId = DEFAULT_LOCALE): string {
  const bundle = STRINGS[key];
  if (!bundle) return '';
  return bundle[locale] ?? bundle['en'] ?? bundle['ko'] ?? '';
}

/**
 * Return the LocaleEntry for the given id.
 * Falls back to the first entry (ko) when the id is not found.
 */
export function getLocale(id: LocaleId): LocaleEntry {
  return LOCALES.find((l) => l.id === id) ?? LOCALES[0];
}

/**
 * Pick a localized value from a LocalizedString map.
 * Cascade: locale → 'en' → 'ko' → first available value → ''.
 */
export function lpick(obj: LocalizedString | undefined, locale: LocaleId): string {
  if (!obj) return '';
  if (obj[locale] !== undefined) return obj[locale] as string;
  if (obj['en'] !== undefined) return obj['en'] as string;
  if (obj['ko'] !== undefined) return obj['ko'] as string;
  const first = Object.values(obj)[0];
  return first ?? '';
}

/**
 * Return true when the given locale is right-to-left.
 */
export function isRTL(id: LocaleId): boolean {
  return getLocale(id).dir === 'rtl';
}
