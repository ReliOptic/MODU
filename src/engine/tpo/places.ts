import type { Place } from './types';

export const PLACES: readonly Place[] = [
  {
    id: 'kr_seoul',
    country: 'KR',
    region: 'Seoul',
    label: { ko: '서울 · 대한민국', en: 'Seoul · Korea', ja: 'ソウル · 韓国', de: 'Seoul · Korea', ar: 'سيول · كوريا' },
    flag: '🇰🇷',
    resources: {
      fertility: [
        {
          kind: 'subsidy',
          label: { ko: '난임 시술 정부 지원 (보건복지부)', en: 'Govt. IVF Subsidy (MoHW)', ja: '不妊治療 政府助成', de: 'IVF-Zuschuss (Regierung)', ar: 'دعم حكومي للإخصاب' },
          note: { ko: '최대 110만원/회', en: 'Up to ₩1.1M / cycle' },
        },
        {
          kind: 'clinic',
          label: { ko: '차병원 강남 · 서울 세브란스', en: 'CHA Gangnam · Severance', ja: 'CHA江南・セブランス' },
          note: { ko: '3km 이내' },
        },
      ],
      cancer: [
        {
          kind: 'subsidy',
          label: { ko: '중증질환 산정특례', en: 'Severe Disease Co-pay Cap' },
          note: { ko: '본인부담 5%' },
        },
        {
          kind: 'clinic',
          label: { ko: '삼성서울 · 서울대병원' },
          note: { ko: '항암 주사실' },
        },
      ],
      pet: [
        {
          kind: 'clinic',
          label: { ko: '청담우리 동물병원' },
          note: { ko: '관절 재활' },
        },
      ],
    },
  },
  {
    id: 'jp_tokyo',
    country: 'JP',
    region: 'Tokyo',
    label: { ko: '도쿄 · 일본', en: 'Tokyo · Japan', ja: '東京 · 日本', de: 'Tokio · Japan', ar: 'طوكيو · اليابان' },
    flag: '🇯🇵',
    resources: {
      fertility: [
        {
          kind: 'subsidy',
          label: { ja: '不妊治療 保険適用（厚労省）', en: 'IVF Insurance Coverage (MHLW)' },
          note: { ja: '最大 30万円/周期' },
        },
      ],
      cancer: [
        {
          kind: 'clinic',
          label: { ja: '国立がん研究センター', en: 'National Cancer Center' },
        },
      ],
    },
  },
  {
    id: 'de_berlin',
    country: 'DE',
    region: 'Berlin',
    label: { ko: '베를린 · 독일', en: 'Berlin · Germany', ja: 'ベルリン · ドイツ', de: 'Berlin · Deutschland', ar: 'برلين · ألمانيا' },
    flag: '🇩🇪',
    resources: {
      fertility: [
        {
          kind: 'subsidy',
          label: { de: 'Kinderwunsch-Förderung (BMFSFJ)', en: 'Fertility Subsidy (BMFSFJ)' },
          note: { de: 'Bis 50% der Kosten' },
        },
      ],
    },
  },
  {
    id: 'ae_dubai',
    country: 'AE',
    region: 'Dubai',
    label: { ko: '두바이 · UAE', en: 'Dubai · UAE', ja: 'ドバイ · UAE', de: 'Dubai · VAE', ar: 'دبي · الإمارات' },
    flag: '🇦🇪',
    resources: {
      fertility: [
        {
          kind: 'clinic',
          label: { ar: 'مستشفى الجليلة التخصصي', en: 'Al Jalila Specialty Hospital' },
        },
      ],
    },
  },
];

/** Never-null lookup; falls back to first entry (kr_seoul). */
export function findPlace(id: string): Place {
  return PLACES.find((p) => p.id === id) ?? PLACES[0];
}
