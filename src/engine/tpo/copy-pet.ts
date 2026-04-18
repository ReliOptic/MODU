import type { CopyBlock, Proximity, RoleId, TimeOfDay } from './types';

export const PET_COPY: Readonly<
  Partial<
    Record<
      RoleId,
      Readonly<
        Partial<Record<Proximity, Readonly<Partial<Record<TimeOfDay, CopyBlock>>>>>
      >
    >
  >
> = {
  guardian: {
    near: {
      morning: {
        heroWord: { ko: 'Walk', en: 'Walk', ja: '散歩', de: 'Gehen', ar: 'مشي' },
        headline: { ko: '보리의 재활', en: "Bori's rehab", ja: 'ボリのリハビリ', de: 'Boris Reha', ar: 'إعادة تأهيل بوري' },
        whisper:  { ko: '30분 가벼운 산책. 경사 낮은 길로.', en: '30 min gentle walk. Flat paths.', ja: '30分の軽い散歩。平坦な道で。', de: '30 Min sanft. Ebene Wege.', ar: '30 دقيقة مشي خفيف. طرق مستوية.' },
      },
    },
    dayof: {
      day: {
        heroWord: { ko: 'Paws', en: 'Paws', ja: 'あしあと', de: 'Pfoten', ar: 'أقدام' },
        headline: { ko: '동물병원 · 2시', en: 'Vet · 2pm', ja: '病院・14時', de: 'Tierarzt · 14 Uhr', ar: 'البيطري · 2 م' },
        whisper:  { ko: 'X-ray 재촬영. 11시 이후 금식.', en: 'X-ray recheck. Fast after 11.', ja: 'レントゲン再撮影。11時以降は絶食。', de: 'Röntgen-Kontrolle. Ab 11 nüchtern.', ar: 'أشعة. صيام بعد 11.' },
      },
    },
  },
};
