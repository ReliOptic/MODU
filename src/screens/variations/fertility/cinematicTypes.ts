// Shared types for fertility cinematic variation.
import type { ResolvedTPO } from '../../../adapters';

export type SectionId =
  | 'hero' | 'event' | 'timeline' | 'pullquote'
  | 'mood' | 'recovery' | 'partner' | 'resources' | 'closing';

export type Proximity = ResolvedTPO['proximity'];
