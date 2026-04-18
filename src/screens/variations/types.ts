// Shared interfaces for variation renderers (Phase 3A — Metamorphic refactor).
// Renderers consume only ResolvedTPO + RendererBlock + TimelineDay shapes;
// they never import from src/types/asset.ts, src/store/, or src/data/.
import type { ComponentType } from 'react';
import type { RendererBlock, ResolvedTPO, TimelineDay } from '../../adapters';
import type { PaletteSwatch } from '../../theme';

export type VariationId = 'bento' | 'cinematic' | 'morph';

export interface VariationProps {
  readonly tpo: ResolvedTPO;
  readonly blocks: readonly RendererBlock[];
  readonly timeline: readonly TimelineDay[];
  readonly palette: PaletteSwatch;
}

export type VariationComponent = ComponentType<VariationProps>;

export interface VariationMeta {
  readonly id: VariationId;
  readonly label: string;
  readonly description: string;
}

export const VARIATIONS: readonly VariationMeta[] = [
  { id: 'bento', label: '벤토', description: '정보 밀도 + 격자' },
  { id: 'cinematic', label: '시네마틱', description: '풀블리드 헤로 + 흐름' },
  { id: 'morph', label: '모프', description: '유기체 블롭 + 팟' },
] as const;

export const DEFAULT_VARIATION: VariationId = 'bento';

/** D-day style label per proximity. */
export function proximityLabel(p: ResolvedTPO['proximity']): string {
  switch (p) {
    case 'dayof': return 'D-DAY';
    case 'near':  return 'D-1';
    case 'week':  return 'D-3';
    case 'after': return 'D+1';
    case 'far':   return 'D-7+';
  }
}
