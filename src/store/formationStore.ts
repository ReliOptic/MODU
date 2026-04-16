// Formation 진행 상태 — Zustand
import { create } from 'zustand';
import type { FormationResponse, FormationContext, AssetType } from '../types';

export interface FormationStore {
  currentStepId: string;
  responses: FormationResponse[];
  context: FormationContext;
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

  advance: (response, nextStepId) => {
    set((s) => ({
      responses: [...s.responses, response],
      currentStepId: nextStepId,
    }));
  },

  setInferredType: (type) => {
    set((s) => ({ context: { ...s.context, inferredType: type } }));
  },

  reset: () => {
    set({ currentStepId: INITIAL_STEP, responses: [], context: {} });
  },

  getLastResponse: () => {
    const r = get().responses;
    return r[r.length - 1];
  },
}));
