// 항암 보호자 — fertility 와 동일 구조의 5스텝
import type { FormationStep } from '../../types';

export const cancerCaregiverSteps: FormationStep[] = [
  {
    id: 'cancer_caregiver:step_02',
    aiMessage: '함께해주셔서 감사해요. 어느 분의 치료를 돕고 계세요?',
    responseType: 'preset',
    presets: [
      { id: 'parent', label: '부모님이세요' },
      { id: 'spouse', label: '배우자예요' },
      { id: 'sibling', label: '형제·자매예요' },
      { id: 'other', label: '다른 가족이에요' },
    ],
    allowVoice: true,
    allowSkip: false,
    nextStep: 'cancer_caregiver:step_03',
  },
  {
    id: 'cancer_caregiver:step_03',
    aiMessage: '치료는 어느 단계에 계세요?',
    responseType: 'preset',
    presets: [
      { id: 'diagnosis', label: '진단 직후예요' },
      { id: 'mid_treatment', label: '치료 중이에요' },
      { id: 'late_treatment', label: '치료 막바지예요' },
      { id: 'post_treatment', label: '치료를 마쳤어요' },
    ],
    allowVoice: true,
    allowSkip: true,
    nextStep: 'cancer_caregiver:step_04',
  },
  {
    id: 'cancer_caregiver:step_04',
    aiMessage: '돌보면서 가장 어려운 부분은 어떤 거예요?',
    responseType: 'both',
    presets: [
      { id: 'info', label: '의료 정보 정리가 어려워요' },
      { id: 'questions', label: '진료 때 뭘 물어봐야 할지 모르겠어요' },
      { id: 'emotional', label: '감정적으로 버겁다는 느낌이에요' },
      { id: 'logistics', label: '일정·약 관리가 복잡해요' },
    ],
    allowVoice: true,
    allowSkip: true,
    nextStep: 'cancer_caregiver:step_05_confirm',
  },
  {
    id: 'cancer_caregiver:step_05_confirm',
    aiMessage:
      '말씀해주신 걸 정리하면\n① 진료 전 체크리스트가 가장 도움이 되고\n② 지난 회차 메모 자동 정리가 필요하며\n③ 약 관리는 한눈에 보이는 형태가 좋겠어요.\n이대로 만들어드릴까요?',
    responseType: 'preset',
    presets: [
      { id: 'confirm', label: '좋아요, 만들어주세요', leadsTo: 'CONFIRM' },
      { id: 'adjust', label: '조금 다르게 하고 싶어요', leadsTo: 'cancer_caregiver:step_04' },
    ],
    allowVoice: false,
    allowSkip: false,
    nextStep: 'CONFIRM',
  },
];
