// 만성질환 — 5스텝
import type { FormationStep } from '../../types';

export const chronicSteps: FormationStep[] = [
  {
    id: 'chronic:step_02',
    aiMessage: '어떤 증상을 함께 관리해드릴까요?',
    responseType: 'both',
    presets: [
      { id: 'migraine', label: '편두통이에요' },
      { id: 'diabetes', label: '당뇨를 관리해요' },
      { id: 'hypertension', label: '고혈압이 있어요' },
      { id: 'pain', label: '만성 통증이 있어요' },
    ],
    allowVoice: true,
    allowSkip: false,
    nextStep: 'chronic:step_03',
  },
  {
    id: 'chronic:step_03',
    aiMessage: '주로 언제 더 심해지나요?',
    responseType: 'both',
    presets: [
      { id: 'morning', label: '아침에' },
      { id: 'night', label: '밤에' },
      { id: 'weather', label: '날씨가 안 좋을 때' },
      { id: 'stress', label: '스트레스 받을 때' },
    ],
    allowVoice: true,
    allowSkip: true,
    nextStep: 'chronic:step_04',
  },
  {
    id: 'chronic:step_04',
    aiMessage: '약은 정기적으로 드시나요?',
    responseType: 'preset',
    presets: [
      { id: 'daily', label: '매일 챙겨요' },
      { id: 'as_needed', label: '필요할 때만요' },
      { id: 'none', label: '아직 처방받지 않았어요' },
    ],
    allowVoice: true,
    allowSkip: false,
    nextStep: 'chronic:step_05_confirm',
  },
  {
    id: 'chronic:step_05_confirm',
    aiMessage:
      '정리해드릴게요.\n① 증상 강도를 매일 한 번 빠르게 기록하고\n② 트리거(원인 추정)를 AI가 분석하며\n③ 약 재고와 진료일을 잊지 않게 해드릴게요.\n이대로 만들어드릴까요?',
    responseType: 'preset',
    presets: [
      { id: 'confirm', label: '좋아요, 만들어주세요', leadsTo: 'CONFIRM' },
      { id: 'adjust', label: '조금 다르게 하고 싶어요', leadsTo: 'chronic:step_04' },
    ],
    allowVoice: false,
    allowSkip: false,
    nextStep: 'CONFIRM',
  },
];
