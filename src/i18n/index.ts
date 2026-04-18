// i18n — barrel re-exports.

export type { LocaleId, Dir, LocaleEntry, LocalizedString, StringKey } from './types';
export { LOCALES, DEFAULT_LOCALE } from './locales';
export { STRINGS } from './registry';
export { tr, getLocale, lpick, isRTL } from './selectors';
export type { LocaleSnapshot } from './use-locale';
export { useLocale, useTr } from './use-locale';
