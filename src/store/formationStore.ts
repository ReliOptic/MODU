// Formation 진행 상태 — Zustand
import { create } from 'zustand';
import type { FormationResponse, FormationContext, AssetType } from '../types';
import { emit } from '../lib/events';
import { isKnownChapterType } from '../types/events';

export interface FormationStore {
  currentStepId: string;
  responses: FormationResponse[];
  context: FormationContext;
  /** formation_completed emit 중복 방어 — reset() 시 false로 초기화 */
  completedFired: boolean;
  /** 다음 스텝으로 이동 + 응답 기록 */
  advance: (response: FormationResponse, nextStepId: string) => void;
  /** 추론된 에셋 타입 설정 (step_01 응답 시) */
  setInferredType: (type: AssetType) => void;
  /** 처음으로 리셋 */
  reset: () => void;
  /** 마지막 응답 반환 (현재 스텝의) */
  getLastResponse: () => FormationResponse | undefined;
}

const INITIAL_STEP = 'step_01';

export const useFormationStore = create<FormationStore>((set, get) => ({
  currentStepId: INITIAL_STEP,
  responses: [],
  context: {},
  completedFired: false,

  advance: (response, nextStepId) => {
    set((s) => {
      // 동일 스텝 재진입 방지 (더블탭 / race condition guard)
      if (s.currentStepId === nextStepId) return s;

      const nextResponses = [...s.responses, response];

      // formation_completed: 1회만 emit (completedFired flag)
      if (nextStepId === 'CONFIRM' && !s.completedFired) {
        const inferredType = s.context.inferredType;
        if (isKnownChapterType(inferredType)) {
          // classifier step (step_01, type-preset) 제외하고 content 답변만 카운트
          const contentAnsweredCount = nextResponses.filter(
            (r) => r.type !== 'skip' && r.stepId !== 'step_01'
          ).length;
          emit('formation_completed', {
            asset_type: inferredType,
            steps_answered: contentAnsweredCount,
          });
          return { responses: nextResponses, currentStepId: nextStepId, completedFired: true };
        } else if (inferredType !== undefined) {
          // 알 수 없는 타입 — emit skip + dev warn
          if (__DEV__) {
            console.warn('[formationStore] unknown inferredType, skipping formation_completed emit', inferredType);
          }
        }
      }

      return { responses: nextResponses, currentStepId: nextStepId };
    });
  },

  setInferredType: (type) => {
    set((s) => ({ context: { ...s.context, inferredType: type } }));
  },

  reset: () => {
    set({ currentStepId: INITIAL_STEP, responses: [], context: {}, completedFired: false });
  },

  getLastResponse: () => {
    const r = get().responses;
    return r[r.length - 1];
  },
}));
