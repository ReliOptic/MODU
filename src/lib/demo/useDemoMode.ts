// Demo Mode — 투자자 시연용 시간/시나리오 점프
// EXPO_PUBLIC_DEMO_MODE=1 또는 사용자 토글로 활성화.
// 활성 시 useWidgetOrder 가 fakeNow 와 forceUpcomingEvent 를 사용.
import { create } from 'zustand';
import type { ScenarioId, ScenarioDef } from './scenarios';
import { scenarios, getScenario } from './scenarios';

const ENV_DEFAULT = process.env.EXPO_PUBLIC_DEMO_MODE === '1';

export interface DemoModeStore {
  enabled: boolean;
  currentScenarioId: ScenarioId | null;
  /** Demo Control Panel 표시 여부 (자동 + 수동) */
  panelOpen: boolean;
  toggleEnabled: () => void;
  setScenario: (id: ScenarioId | null) => void;
  togglePanel: () => void;
  /** 현재 활성 scenario 객체 */
  getCurrentScenario: () => ScenarioDef | null;
}

export const useDemoMode = create<DemoModeStore>((set, get) => ({
  enabled: ENV_DEFAULT,
  currentScenarioId: ENV_DEFAULT ? 'morning_calm' : null,
  panelOpen: ENV_DEFAULT,

  toggleEnabled: () =>
    set((s) => ({
      enabled: !s.enabled,
      panelOpen: !s.enabled, // 켜면 패널도 열림
      currentScenarioId: !s.enabled ? 'morning_calm' : null,
    })),

  setScenario: (id) => set({ currentScenarioId: id }),

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  getCurrentScenario: () => {
    const id = get().currentScenarioId;
    return id ? getScenario(id) ?? null : null;
  },
}));

export { scenarios };
