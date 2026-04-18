// Adapter: WidgetConfig → renderer-agnostic RendererBlock.
// Pure functions, no side effects, no React, no domain store imports.
import type { WidgetConfig, WidgetType } from '../types/asset';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type BlockVariant =
  | 'hero'   // singular primary card
  | 'card'   // standard mid-priority card
  | 'list'   // vertical list of items
  | 'strip'  // horizontal bar / strip
  | 'grid'   // calendar-style grid
  | 'stat';  // single metric

export interface RendererBlock {
  readonly id: string;          // widgetType + ':' + tab + ':' + priority
  readonly widgetType: WidgetType;
  readonly variant: BlockVariant;
  readonly tab: string;         // 'home' when WidgetConfig.tab is absent
  readonly priority: number;    // 0–100, clamped
  readonly props: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// WidgetType → BlockVariant mapping
// ---------------------------------------------------------------------------

const HERO_TYPES = new Set<WidgetType>([
  'primary_event',
  'primary_medication',
  'primary_condition',
  'pet_profile',
]);

const GRID_TYPES = new Set<WidgetType>([
  'calendar_full',
  'calendar_mini',
  'monthly_heatmap',
]);

const STRIP_TYPES = new Set<WidgetType>([
  'calendar_legend',
  'condition_trend',
  'weekly_bar_graph',
  'daily_log_bars',
]);

const STAT_TYPES = new Set<WidgetType>([
  'mood_quicklog',
  'next_visit',
  'medication_stock',
  'core.glance',
  'core.value',
]);

const LIST_TYPES = new Set<WidgetType>([
  'event_detail_list',
  'medication_list',
  'question_checklist',
  'trigger_analysis',
  'core.step',
]);

const CARD_TYPES = new Set<WidgetType>([
  'injection_timeline',
  'treatment_timeline',
  'partner_sync',
  'prev_visit_memo',
  'vet_memo',
  'core.narrative',
]);

function resolveVariant(type: WidgetType): BlockVariant {
  if (HERO_TYPES.has(type)) return 'hero';
  if (GRID_TYPES.has(type)) return 'grid';
  if (STRIP_TYPES.has(type)) return 'strip';
  if (STAT_TYPES.has(type)) return 'stat';
  if (LIST_TYPES.has(type)) return 'list';
  if (CARD_TYPES.has(type)) return 'card';
  // Unknown widget type → safe default
  return 'card';
}

// ---------------------------------------------------------------------------
// Priority clamp
// ---------------------------------------------------------------------------

function clampPriority(p: number): number {
  return Math.max(0, Math.min(100, p));
}

// ---------------------------------------------------------------------------
// widgetToBlock
// ---------------------------------------------------------------------------

export function widgetToBlock(w: WidgetConfig): RendererBlock {
  const tab = w.tab ?? 'home';
  const priority = clampPriority(w.defaultPriority);
  const id = `${w.type}:${tab}:${priority}`;
  const props: Readonly<Record<string, unknown>> =
    w.props !== undefined ? (w.props as Readonly<Record<string, unknown>>) : {};

  return {
    id,
    widgetType: w.type,
    variant: resolveVariant(w.type),
    tab,
    priority,
    props,
  };
}

// ---------------------------------------------------------------------------
// widgetsToBlocks
// ---------------------------------------------------------------------------

/**
 * Maps each WidgetConfig to a RendererBlock and sorts descending by priority.
 * Stable sort: widgets with equal priority retain their original template order.
 */
export function widgetsToBlocks(
  widgets: readonly WidgetConfig[],
): readonly RendererBlock[] {
  const blocks = widgets.map(widgetToBlock);
  // Stable descending sort by priority.
  return blocks.slice().sort((a, b) => b.priority - a.priority);
}
