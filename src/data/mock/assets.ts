// 샘플 에셋 인스턴스 (Supabase 연동 전 개발용)
import type { Asset } from '../../types';
import { assetTemplates } from '../assetTemplates';

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
    tabs: t.tabs,
    widgets: t.widgets,
    layoutRules: [],
    formationData: { responses: {} },
    status: 'active',
    createdAt: now,
    lastActiveAt: now,
    ...overrides,
  };
}

export const mockAssets: Asset[] = [
  fromTemplate('fertility', { id: 'a-fertility', displayName: '시험관 3회차' }),
  fromTemplate('pet_care', { id: 'a-petcare', displayName: '보리 관절관리' }),
  fromTemplate('cancer_caregiver', { id: 'a-cancer', displayName: '어머니 항암' }),
];
