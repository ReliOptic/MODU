// Formation 스텝 통합 — id → step 룩업
import type { AssetType, FormationStep } from '../../types';
import { stepEntry } from './_shared';
import { fertilitySteps } from './fertility';
import { cancerCaregiverSteps } from './cancerCaregiver';
import { petCareSteps } from './petCare';
import { chronicSteps } from './chronic';

export const allSteps: FormationStep[] = [
  stepEntry,
  ...fertilitySteps,
  ...cancerCaregiverSteps,
  ...petCareSteps,
  ...chronicSteps,
];

const stepMap = new Map(allSteps.map((s) => [s.id, s]));

export function getStep(id: string): FormationStep | undefined {
  return stepMap.get(id);
}

export function isConfirmStep(id: string): boolean {
  return id.endsWith('step_05_confirm');
}

export function isTerminal(nextStepId: string): boolean {
  return nextStepId === 'CONFIRM';
}

/** step id 의 prefix 로 AssetType 추론 */
export function typeFromStepId(stepId: string): AssetType | undefined {
  if (stepId.startsWith('fertility:')) return 'fertility';
  if (stepId.startsWith('cancer_caregiver:')) return 'cancer_caregiver';
  if (stepId.startsWith('pet_care:')) return 'pet_care';
  if (stepId.startsWith('chronic:')) return 'chronic';
  return undefined;
}

export { stepEntry };
