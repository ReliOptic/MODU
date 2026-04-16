// §3.3 Fertility — 5스텝 (entry 제외, step_02 ~ step_05_confirm)
import type { FormationStep } from '../../types';

export const fertilitySteps: FormationStep[] = [
  {
    id: 'fertility:step_02',
    aiMessage: '함께하게 되어 반가워요. 처음이신가요, 아니면 이번이 몇 번째세요?',
    responseType: 'preset',
    presets: [
      { id: 'first', label: '처음이에요', leadsTo: 'fertility:step_03_first' },
      { id: 'second', label: '두 번째예요', leadsTo: 'fertility:step_03_repeat' },
      { id: 'third_plus', label: '세 번째 이상이에요', leadsTo: 'fertility:step_03_repeat' },
    ],
    allowVoice: true,
    allowSkip: false,
    nextStep: (r) => (r === 'first' ? 'fertility:step_03_first' : 'fertility:step_03_repeat'),
  },
  {
    id: 'fertility:step_03_first',
    aiMessage: '처음이시면 알아야 할 것이 많아요. 가장 먼저 도움이 필요한 부분은 어떤 거예요?',
    responseType: 'both',
    presets: [
      { id: 'schedule', label: '일정 관리가 어려워요' },
      { id: 'medical', label: '의학 정보를 알기 쉽게 받고 싶어요' },
      { id: 'emotional', label: '감정적으로 의지할 곳이 필요해요' },
    ],
    allowVoice: true,
    allowSkip: true,
    nextStep: 'fertility:step_04_partner',
  },
  {
    id: 'fertility:step_03_repeat',
    aiMessage: '여러 번이면 많이 지치셨을 것 같아요. 지난번에 가장 힘드셨던 부분은 어떤 거였어요?',
    responseType: 'both',
    presets: [
      { id: 'physical', label: '신체적으로 힘들었어요' },
      { id: 'emotional', label: '감정적으로 힘들었어요' },
      { id: 'lonely', label: '혼자라는 느낌이 힘들었어요' },
      { id: 'financial', label: '경제적으로 힘들었어요' },
    ],
    allowVoice: true,
    allowSkip: true,
    nextStep: 'fertility:step_04_partner',
  },
  {
    id: 'fertility:step_04_partner',
    aiMessage: '옆에서 함께 챙겨주시는 분이 계세요?',
    responseType: 'both',
    presets: [
      { id: 'spouse', label: '배우자가 함께해요' },
      { id: 'family', label: '가족이 도와줘요' },
      { id: 'alone', label: '혼자 하고 있어요' },
    ],
    allowVoice: true,
    allowSkip: false,
    nextStep: 'fertility:step_05_confirm',
  },
  {
    id: 'fertility:step_05_confirm',
    aiMessage:
      '대화로 느껴진 건, 당신의 경우\n① 감정적 지원이 우선이고\n② 파트너와의 공유 구조가 중요하며\n③ 의학 정보는 간결한 형태를 선호하시는 것 같아요.\n이대로 에셋을 만들어볼까요?',
    responseType: 'preset',
    presets: [
      { id: 'confirm', label: '좋아요, 만들어주세요', leadsTo: 'CONFIRM' },
      { id: 'adjust', label: '조금 다르게 하고 싶어요', leadsTo: 'fertility:step_04_partner' },
    ],
    allowVoice: false,
    allowSkip: false,
    nextStep: 'CONFIRM',
  },
];
