// 샘플 에셋 인스턴스 (Supabase 연동 전 개발용)
// 각 에셋은 오늘 살아있는 일정(events) 을 포함 — LayoutEngine V2 가 시간에 따라 위젯을 재배치한다.
import type { Asset } from '../../types';
import { assetTemplates } from '../assetTemplates';
import { fertilityEvents, cancerEvents, petCareEvents } from './events';

const now = '2026-04-17T09:00:00.000Z';

function fromTemplate(
  type: keyof typeof assetTemplates,
  overrides: Partial<Asset>
): Asset {
  const t = assetTemplates[type];
  return {
    id: overrides.id ?? `${type}-mock`,
    type: t.type,
    displayName: overrides.displayName ?? t.defaultDisplayName,
    palette: t.palette,
    envelope: t.envelope,
    tabs: t.tabs,
    widgets: t.widgets,
    layoutRules: [],
    formationData: { responses: {} },
    status: 'active',
    createdAt: now,
    lastActiveAt: now,
    // Sync-ready fields (ADR-0013 A4 + ADR-0011 Addendum). Mocks default
    // updatedAt to the same frozen `now` so deterministic tests stay stable.
    updatedAt: now,
    syncedAt: null,
    ...overrides,
  };
}

export const mockAssets: Asset[] = [
  fromTemplate('fertility', {
    id: 'a-fertility',
    displayName: '시험관 3회차',
    formationData: { responses: { 'fertility:step_04_partner': 'spouse' } },
    events: fertilityEvents(),
  }),
  fromTemplate('pet_care', {
    id: 'a-petcare',
    displayName: '보리 관절관리',
    events: petCareEvents(),
  }),
  fromTemplate('cancer_caregiver', {
    id: 'a-cancer',
    displayName: '어머니 항암',
    formationData: { responses: { 'cancer_caregiver:step_03': 'mid_treatment' } },
    events: cancerEvents(),
  }),
];
