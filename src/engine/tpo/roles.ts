import type { RoleEntry, RoleId } from './types';

export const ROLES: readonly RoleEntry[] = [
  { id: 'self',         label: { ko: '당사자',         en: 'Myself',        ja: '自分',             de: 'Selbst',             ar: 'بنفسي'        }, tone: 'first-person' },
  { id: 'partner',      label: { ko: '배우자/파트너',   en: 'Partner',       ja: 'パートナー',        de: 'Partner:in',         ar: 'شريك'         }, tone: 'we'           },
  { id: 'parent',       label: { ko: '부모로서',        en: 'As a parent',   ja: '親として',          de: 'Als Elternteil',     ar: 'كوالد'        }, tone: 'protective'   },
  { id: 'child',        label: { ko: '자녀로서',        en: 'As a child',    ja: '子として',          de: 'Als Kind',           ar: 'كابن/ابنة'    }, tone: 'devoted'      },
  { id: 'guardian',     label: { ko: '보호자',          en: 'Caregiver',     ja: '介護者',            de: 'Betreuer:in',        ar: 'مقدم رعاية'  }, tone: 'sustaining'   },
  { id: 'project_lead', label: { ko: '프로젝트 주도자', en: 'Project lead',  ja: 'プロジェクト主導',   de: 'Projektleiter:in',   ar: 'قائد مشروع'  }, tone: 'organized'    },
  { id: 'clinician',    label: { ko: '의료진',          en: 'Clinician',     ja: '医療者',            de: 'Kliniker:in',        ar: 'طبيب'         }, tone: 'steady'       },
];

/** Never-null lookup; falls back to first entry. */
export function findRole(id: RoleId): RoleEntry {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}
