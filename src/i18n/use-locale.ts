// i18n — React hook. The ONLY file in src/i18n/ that imports React.
// Reads locale from tpoStore (Worker C). If tpoStore is not yet present,
// tsc will report an error here — that is expected and acceptable.

import { useCallback } from 'react';
import { useTPOStore } from '../store/tpoStore';
import type { LocaleId, LocaleEntry } from './types';
import type { StringKey } from './types';
import { DEFAULT_LOCALE } from './locales';
import { getLocale, tr } from './selectors';

export interface LocaleSnapshot {
  readonly id: LocaleId;
  readonly entry: LocaleEntry;
  readonly isRTL: boolean;
}

export function useLocale(): LocaleSnapshot {
  const id = (useTPOStore((s) => s.locale) ?? DEFAULT_LOCALE) as LocaleId;
  const entry = getLocale(id);
  return { id, entry, isRTL: entry.dir === 'rtl' } as const;
}

export function useTr(): (key: StringKey) => string {
  const { id } = useLocale();
  return useCallback((key: StringKey) => tr(key, id), [id]);
}
