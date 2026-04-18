// i18n — string registry verbatim from MODU_STRINGS bundle (i18n.js).
// 16 keys. No domain imports. No React. Pure data only.

import type { LocalizedString, StringKey } from './types';

export const STRINGS: Readonly<Record<StringKey, LocalizedString>> = {
  brand_tag: {
    ko: 'MODU · Metamorphic Home Study · v3',
    en: 'MODU · Metamorphic Home Study · v3',
    ja: 'MODU · メタモーフィック・ホーム · v3',
    de: 'MODU · Metamorphe Startstudie · v3',
    ar: 'مودو · دراسة البيت المتحول · الإصدار ٣',
  },
  hero_1: { ko: 'Listen', en: 'Listen', ja: '聴く', de: 'Hör', ar: 'استمع' },
  hero_2: { ko: 'to your', en: 'to your', ja: 'あなたの', de: 'auf dein', ar: 'إلى' },
  hero_3: { ko: 'life.', en: 'life.', ja: '命に。', de: 'Leben.', ar: 'حياتك.' },
  intro: {
    ko: '같은 사람·같은 순간이어도 챕터·시간·역할·장소가 바뀌면 UI 호흡도 바뀝니다. TPO 스크러버로 직접 체감해보세요.',
    en: 'Same person, same moment — but when chapter, time, role or place shifts, the UI breathes differently. Try the TPO scrubber.',
    ja: '同じ人、同じ瞬間でも、章・時・役割・場所が変われば UI の呼吸も変わる。TPO スクラバーで試してみて。',
    de: 'Dieselbe Person, derselbe Moment — aber Kapitel, Zeit, Rolle und Ort verändern den Atem der UI. Probier den TPO-Regler.',
    ar: 'الشخص ذاته، اللحظة ذاتها — لكن الفصل والوقت والدور والمكان تغيّر إيقاع الواجهة. جرّب مفتاح TPO.',
  },
  time_axis: { ko: 'Time (시간)', en: 'Time', ja: 'Time', de: 'Zeit', ar: 'الوقت' },
  place_axis: { ko: 'Place (장소)', en: 'Place', ja: 'Place', de: 'Ort', ar: 'المكان' },
  role_axis: { ko: 'Occasion (역할)', en: 'Occasion', ja: 'Occasion', de: 'Rolle', ar: 'الدور' },
  tod_axis: { ko: 'Time of day', en: 'Time of day', ja: '時間帯', de: 'Tageszeit', ar: 'وقت النهار' },
  chapter_my: { ko: '나의 챕터', en: 'My Chapters', ja: 'マイチャプター', de: 'Meine Kapitel', ar: 'فصولي' },
  chapter_new: { ko: '새 챕터 만들기', en: 'New Chapter', ja: '新しい章を作る', de: 'Neues Kapitel', ar: 'فصل جديد' },
  tap_to_switch: { ko: '탭해서 전환', en: 'Tap to switch', ja: 'タップで切替', de: 'Zum Wechseln tippen', ar: 'اضغط للتبديل' },
  cinematic_desc: {
    ko: '풀블리드 이미지+팔레트 스크림. D-day엔 히어로가 확대, 밤엔 저휘도로.',
    en: 'Full-bleed image + palette scrim. Hero expands on D-day, dims at night.',
    ja: 'フルブリード画像＋パレットスクリム。D-day で拡大、夜に減光。',
    de: 'Vollflächiges Bild + Paletten-Schleier. Held wächst am D-Day, dämpft nachts.',
    ar: 'صورة كاملة + طبقة لونية. يتضخم المشهد في اليوم المحدد، ويخفت ليلاً.',
  },
  bento_desc: {
    ko: '블록 순서·크기가 TPO에 따라 자동 재구성.',
    en: 'Block order & size auto-recompose by TPO.',
    ja: 'ブロックの順序とサイズが TPO で自動再構成。',
    de: 'Blockreihenfolge und -größe ordnen sich nach TPO.',
    ar: 'ترتيب الكتل وحجمها يتكيّف مع TPO تلقائياً.',
  },
  morph_desc: {
    ko: '블롭이 호흡한다. 긴급도에 따라 커지고, 시간대에 따라 가라앉는다.',
    en: 'The blob breathes. It grows with urgency, settles at night.',
    ja: 'ブロブが呼吸する。緊急度で膨らみ、夜に沈む。',
    de: 'Der Blob atmet. Er wächst mit Dringlichkeit, ruht nachts.',
    ar: 'الشكل يتنفّس. يكبر مع الإلحاح، ويهدأ ليلاً.',
  },
  engine_desc: {
    ko: '5 × 5 × 7 축 반응형. 문구·레이아웃·히어로 크기·밝기가 전부 변합니다.',
    en: '5 × 5 × 7 responsive axes. Copy, layout, hero scale, dim — all react.',
    ja: '5×5×7 の反応軸。文言・レイアウト・規模・明度が変化。',
    de: '5 × 5 × 7 reaktive Achsen. Text, Layout, Maßstab, Helligkeit.',
    ar: '5×5×7 محاور تفاعلية. النص والتخطيط والحجم والإضاءة.',
  },
} as const;
