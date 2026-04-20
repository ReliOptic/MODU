// Shared types for fertility morph variation.
import type { ResolvedTPO } from '../../../adapters';

export type MorphSectionId =
  | 'metastrip'
  | 'heroblob'
  | 'whisper'
  | 'pods'
  | 'timeline'
  | 'recovery'
  | 'resources'
  | 'partner'
  | 'closing';

export type Proximity = ResolvedTPO['proximity'];

export type PodMode = 'grid4' | 'grid2' | 'singleBig' | 'resting';

export type WhisperShape = 'organic' | 'tight' | 'pill';

export interface MorphShape {
  /** Blob diameter in points. */
  readonly blobSize: number;
  /** heroHeightBonus added on top of density heroBonus. */
  readonly heroHeightBonus: number;
  readonly showCountdown: boolean;
  readonly podMode: PodMode;
  readonly showPartner: boolean;
  readonly showResources: boolean;
  readonly showRecovery: boolean;
  readonly whisperShape: WhisperShape;
}

export interface MorphStructure {
  readonly sections: ReadonlyArray<MorphSectionId>;
  readonly shape: MorphShape;
}
