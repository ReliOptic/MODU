// 에셋 타입 별 룰 매핑
import type { AssetType, LayoutRule } from '../../types';
import { fertilityRules } from './fertilityRules';
import { cancerRules } from './cancerRules';
import { petCareRules } from './petCareRules';
import { chronicRules } from './chronicRules';

export const rulesByType: Record<AssetType, LayoutRule[]> = {
  fertility: fertilityRules,
  cancer_caregiver: cancerRules,
  pet_care: petCareRules,
  chronic: chronicRules,
  custom: [],
};

export { fertilityRules, cancerRules, petCareRules, chronicRules };
