import type { CopyBlock, Proximity, RoleId, TimeOfDay } from './types';

export const CANCER_COPY: Readonly<
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
      evening: {
        heroWord: { ko: 'Gently', en: 'Gently', ja: 'やさしく', de: 'Sanft', ar: 'برفق' },
        headline: { ko: '저녁의 돌봄', en: 'Evening care', ja: '夕べのケア', de: 'Abendpflege', ar: 'رعاية المساء' },
        whisper:  { ko: '식사량과 체온. 작은 숫자가 내일을 말해줄 거예요.', en: 'Meals and temp. Small numbers tell tomorrow.', ja: '食事量と体温。小さな数字が明日を教えてくれる。', de: 'Essen und Temperatur. Kleine Zahlen zeigen morgen.', ar: 'الوجبات والحرارة. أرقام صغيرة تروي الغد.' },
      },
    },
    dayof: {
      morning: {
        heroWord: { ko: 'Here', en: 'Here', ja: 'ここに', de: 'Hier', ar: 'هنا' },
        headline: { ko: '병원으로', en: 'To the hospital', ja: '病院へ', de: 'Ins Krankenhaus', ar: 'إلى المستشفى' },
        whisper:  { ko: '책과 담요를 잊지 마세요.', en: "Book and blanket — don't forget.", ja: '本と毛布を忘れずに。', de: 'Buch und Decke — nicht vergessen.', ar: 'الكتاب والبطانية — لا تنسي.' },
      },
    },
    after: {
      evening: {
        heroWord: { ko: 'Soft', en: 'Soft', ja: 'やわらか', de: 'Sanft', ar: 'لين' },
        headline: { ko: '회복의 밤', en: 'Recovery night', ja: '回復の夜', de: 'Erholungsnacht', ar: 'ليلة التعافي' },
        whisper:  { ko: '메스꺼움, 피로, 수분. 가장 중요한 3가지만.', en: 'Nausea, fatigue, water. Just three.', ja: '吐き気・疲労・水分。三つだけ。', de: 'Übelkeit, Müdigkeit, Wasser. Nur drei.', ar: 'الغثيان والتعب والماء. ثلاثة فقط.' },
      },
    },
  },
};
