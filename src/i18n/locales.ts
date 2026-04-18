// i18n — locale entries verbatim from MODU_LOCALES bundle (i18n.js).
// No domain imports. No React. Pure data only.

import type { LocaleEntry, LocaleId } from './types';

export const LOCALES: readonly LocaleEntry[] = [
  {
    id: 'ko',
    label: '한국어',
    dir: 'ltr',
    displayFont: '"Fraunces", "Pretendard Variable", serif',
    uiFont: 'Pretendard, "Pretendard Variable", -apple-system, sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    displayWeight: 400,
    displayTracking: '-0.035em',
  },
  {
    id: 'en',
    label: 'English',
    dir: 'ltr',
    displayFont: '"Fraunces", serif',
    uiFont: '"Inter", "Pretendard Variable", -apple-system, sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    displayWeight: 400,
    displayTracking: '-0.035em',
  },
  {
    id: 'ja',
    label: '日本語',
    dir: 'ltr',
    displayFont: '"Shippori Mincho", "Noto Serif JP", serif',
    uiFont: '"Noto Sans JP", "Pretendard Variable", sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    displayWeight: 500,
    displayTracking: '0em',
  },
  {
    id: 'de',
    label: 'Deutsch',
    dir: 'ltr',
    displayFont: '"Fraunces", serif',
    uiFont: '"Inter", sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    displayWeight: 400,
    displayTracking: '-0.025em',
  },
  {
    id: 'ar',
    label: 'العربية',
    dir: 'rtl',
    displayFont: '"Amiri", "Noto Naskh Arabic", serif',
    uiFont: '"Noto Kufi Arabic", "Amiri", sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    displayWeight: 700,
    displayTracking: '0em',
  },
] as const;

export const DEFAULT_LOCALE: LocaleId = 'ko';
