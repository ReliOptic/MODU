import type { CopyBlock, Proximity, RoleId, TimeOfDay } from './types';

export const FERTILITY_COPY: Readonly<
  Partial<
    Record<
      RoleId,
      Readonly<
        Partial<Record<Proximity, Readonly<Partial<Record<TimeOfDay, CopyBlock>>>>>
      >
    >
  >
> = {
  self: {
    far: {
      evening: {
        heroWord: { ko: 'Ease', en: 'Ease', ja: 'やすらぎ', de: 'Ruhe', ar: 'هدوء' },
        headline: { ko: '저녁을 천천히', en: 'A slower evening', ja: 'ゆっくり夜へ', de: 'Ein ruhiger Abend', ar: 'مساء بطيء' },
        whisper:  { ko: '오늘 하루도 충분했어요.', en: 'Today was enough.', ja: '今日も十分でした。', de: 'Heute war genug.', ar: 'كان اليوم كافياً.' },
      },
      night: {
        heroWord: { ko: 'Rest', en: 'Rest', ja: '休息', de: 'Ruhe', ar: 'راحة' },
        headline: { ko: '충분히 쉬어요', en: 'Rest now', ja: 'しっかり休んで', de: 'Ruh dich aus', ar: 'ارتاحي' },
        whisper:  { ko: '좋은 꿈을 빌어요.', en: 'Sweet dreams.', ja: '良い夢を。', de: 'Träum schön.', ar: 'أحلام جميلة.' },
      },
    },
    near: {
      day: {
        heroWord: { ko: 'Ready', en: 'Ready', ja: '準備', de: 'Bereit', ar: 'جاهزة' },
        headline: { ko: '배아 이식 · D-1', en: 'Transfer · D-1', ja: '移植 · D-1', de: 'Transfer · D-1', ar: 'نقل · D-1' },
        whisper:  { ko: '수분 섭취와 가벼운 산책만.', en: 'Hydrate. Walk gently.', ja: '水分と軽い散歩だけ。', de: 'Trinken. Sanft gehen.', ar: 'اشربي ماءً. مشيٌ خفيف.' },
      },
      night: {
        heroWord: { ko: 'Still', en: 'Still', ja: '静けさ', de: 'Stille', ar: 'سكون' },
        headline: { ko: '고요한 밤', en: 'Quiet night', ja: '静かな夜', de: 'Stille Nacht', ar: 'ليلة هادئة' },
        whisper:  { ko: '이 밤은 오로지 당신 것.', en: 'This night is yours.', ja: 'この夜はあなたのもの。', de: 'Diese Nacht gehört dir.', ar: 'هذه الليلة لك.' },
      },
    },
    dayof: {
      morning: {
        heroWord: { ko: 'Now', en: 'Now', ja: '今', de: 'Jetzt', ar: 'الآن' },
        headline: { ko: '오늘이에요', en: 'Today', ja: '今日です', de: 'Heute ist es', ar: 'اليوم' },
        whisper:  { ko: '09:00 · 강남 세브란스. 호흡 세 번.', en: '9:00 · Clinic. Three breaths.', ja: '9:00 · 病院。深呼吸を三回。', de: '9:00 · Klinik. Dreimal atmen.', ar: '9:00 · العيادة. تنفسي ثلاثاً.' },
      },
    },
    after: {
      day: {
        heroWord: { ko: 'Wait', en: 'Wait', ja: '待つ', de: 'Warten', ar: 'انتظار' },
        headline: { ko: '평온한 일상', en: 'Soft days', ja: '穏やかな日々', de: 'Sanfte Tage', ar: 'أيام لطيفة' },
        whisper:  { ko: '일상의 속도로 돌아와요.', en: 'Return to your pace.', ja: '普段の速さに戻って。', de: 'Zurück zu deinem Tempo.', ar: 'عودي إلى إيقاعك.' },
      },
    },
  },
  partner: {
    near: {
      evening: {
        heroWord: { ko: 'Gather', en: 'Gather', ja: 'そなえ', de: 'Bereiten', ar: 'نستعد' },
        headline: { ko: '함께 준비해요', en: 'Prepare together', ja: '一緒に準備', de: 'Gemeinsam vorbereiten', ar: 'نستعد معاً' },
        whisper:  { ko: '가방과 동선을 한 번 더.', en: 'Bag and route — once more.', ja: '荷物と道順をもう一度。', de: 'Tasche und Weg — noch einmal.', ar: 'الحقيبة والطريق — مرة أخرى.' },
      },
    },
    dayof: {
      morning: {
        heroWord: { ko: 'With', en: 'With', ja: '共に', de: 'Mit dir', ar: 'معاً' },
        headline: { ko: '옆에 있을게요', en: "I'm here", ja: 'そばにいるよ', de: 'Ich bin da', ar: 'أنا هنا' },
        whisper:  { ko: '우리가 같이 해요.', en: "We're in this together.", ja: '一緒に乗り越えよう。', de: 'Wir schaffen das zusammen.', ar: 'نحن معاً.' },
      },
    },
  },
};
