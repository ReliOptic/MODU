// §3.2 Formation 대화 구조
import type { AssetType } from './asset';

export type ResponseType = 'preset' | 'free' | 'both';

export interface PresetOption {
  id: string;
  label: string;
  shortLabel?: string;
  /** 다음 스텝 ID. 없으면 step.nextStep로 fallback */
  leadsTo?: string;
}

export interface FormationStep {
  id: string;
  aiMessage: string;
  responseType: ResponseType;
  presets?: PresetOption[];
  allowVoice: boolean;
  allowSkip: boolean;
  /** 다음 스텝 ID 또는 분기 함수. 'CONFIRM' = 마지막 confirm 단계 */
  nextStep: string | ((response: string) => string);
}

export interface FormationResponse {
  stepId: string;
  /** 자유 텍스트 또는 preset.id */
  value: string;
  type: 'preset' | 'voice' | 'text' | 'skip';
  shortLabel?: string;
}

export interface FormationContext {
  /** 어떤 에셋 타입을 만들고 있는지 (step_01 응답 후 설정됨) */
  inferredType?: AssetType;
}
