// 공통 step_01 — 모든 Formation 의 진입점.
// 응답에 따라 step_02_{type} 으로 분기.
import type { FormationStep } from '../../types';

export const stepEntry: FormationStep = {
  id: 'step_01',
  aiMessage: '어떤 일로 MODU를 찾아주셨어요?',
  responseType: 'preset',
  presets: [
    { id: 'fertility', label: '시험관을 하고 있어요', leadsTo: 'fertility:step_02' },
    { id: 'cancer_caregiver', label: '항암 치료 중이에요', leadsTo: 'cancer_caregiver:step_02' },
    { id: 'pet_care', label: '가족·반려동물을 돌보고 있어요', leadsTo: 'pet_care:step_02' },
    { id: 'chronic', label: '다른 상황이에요', leadsTo: 'chronic:step_02' },
  ],
  allowVoice: true,
  allowSkip: false,
  nextStep: (response) => {
    // response 는 preset.id
    return `${response}:step_02`;
  },
};
