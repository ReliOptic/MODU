// 반려동물 — 5스텝
import type { FormationStep } from '../../types';

export const petCareSteps: FormationStep[] = [
  {
    id: 'pet_care:step_02',
    aiMessage: '예쁜 아이 이야기 해주실래요? 아이의 이름이 뭐예요?',
    responseType: 'free',
    allowVoice: true,
    allowSkip: false,
    nextStep: 'pet_care:step_03',
  },
  {
    id: 'pet_care:step_03',
    aiMessage: '어떤 종이에요? 그리고 몇 살이에요?',
    responseType: 'free',
    allowVoice: true,
    allowSkip: false,
    nextStep: 'pet_care:step_03_photo',
  },
  {
    id: 'pet_care:step_03_photo',
    aiMessage: '아이 사진을 한 장 보여주실래요? 에셋 첫 화면에 자리잡을 거예요. (건너뛰셔도 돼요)',
    responseType: 'photo',
    allowVoice: false,
    allowSkip: true,
    nextStep: 'pet_care:step_04',
  },
  {
    id: 'pet_care:step_04',
    aiMessage: '요즘 가장 신경 쓰이는 부분은 어떤 거예요?',
    responseType: 'both',
    presets: [
      { id: 'joints', label: '관절이 좀 안 좋아 보여요' },
      { id: 'appetite', label: '식욕이 들쭉날쭉해요' },
      { id: 'medication', label: '약을 꾸준히 챙겨야 해요' },
      { id: 'behavior', label: '행동이 평소랑 달라요' },
    ],
    allowVoice: true,
    allowSkip: true,
    nextStep: 'pet_care:step_05_confirm',
  },
  {
    id: 'pet_care:step_05_confirm',
    aiMessage:
      '대화 잘 들었어요. 이 아이의 에셋은\n① 매일의 컨디션·식욕·산책 기록이 핵심이고\n② 약 시간 알림이 도움될 거예요.\n③ 수의사 메모도 한 곳에 모을 수 있어요.\n이대로 만들어드릴까요?',
    responseType: 'preset',
    presets: [
      { id: 'confirm', label: '좋아요, 만들어주세요', leadsTo: 'CONFIRM' },
      { id: 'adjust', label: '조금 다르게 하고 싶어요', leadsTo: 'pet_care:step_04' },
    ],
    allowVoice: false,
    allowSkip: false,
    nextStep: 'CONFIRM',
  },
];
