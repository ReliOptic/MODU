import { widgetToBlock, widgetsToBlocks } from '../../adapters/widgetToBlock';
import type { WidgetConfig } from '../../types/asset';

// ---------------------------------------------------------------------------
// widgetToBlock — variant mapping
// ---------------------------------------------------------------------------

describe('widgetToBlock', () => {
  it('maps primary_event → hero variant', () => {
    const w: WidgetConfig = { type: 'primary_event', defaultPriority: 95 };
    const block = widgetToBlock(w);
    expect(block.variant).toBe('hero');
    expect(block.priority).toBe(95);
    expect(block.widgetType).toBe('primary_event');
  });

  it('maps calendar_full → grid variant', () => {
    const w: WidgetConfig = { type: 'calendar_full', defaultPriority: 50 };
    const block = widgetToBlock(w);
    expect(block.variant).toBe('grid');
  });

  it('maps calendar_mini → grid variant', () => {
    const block = widgetToBlock({ type: 'calendar_mini', defaultPriority: 40 });
    expect(block.variant).toBe('grid');
  });

  it('maps monthly_heatmap → grid variant', () => {
    const block = widgetToBlock({ type: 'monthly_heatmap', defaultPriority: 30 });
    expect(block.variant).toBe('grid');
  });

  it('maps mood_quicklog → stat variant', () => {
    const block = widgetToBlock({ type: 'mood_quicklog', defaultPriority: 60 });
    expect(block.variant).toBe('stat');
  });

  it('maps core.glance → stat variant', () => {
    const block = widgetToBlock({ type: 'core.glance', defaultPriority: 55 });
    expect(block.variant).toBe('stat');
  });

  it('maps event_detail_list → list variant', () => {
    const block = widgetToBlock({ type: 'event_detail_list', defaultPriority: 45 });
    expect(block.variant).toBe('list');
  });

  it('maps injection_timeline → card variant', () => {
    const block = widgetToBlock({ type: 'injection_timeline', defaultPriority: 70 });
    expect(block.variant).toBe('card');
  });

  it('maps condition_trend → strip variant', () => {
    const block = widgetToBlock({ type: 'condition_trend', defaultPriority: 35 });
    expect(block.variant).toBe('strip');
  });

  it('maps an unknown widget type → card (safe default)', () => {
    // Cast through unknown to simulate a future unknown type.
    const w = { type: 'future_widget_type' as WidgetConfig['type'], defaultPriority: 50 };
    const block = widgetToBlock(w);
    expect(block.variant).toBe('card');
  });

  it('defaults tab to "home" when WidgetConfig.tab is absent', () => {
    const block = widgetToBlock({ type: 'primary_event', defaultPriority: 80 });
    expect(block.tab).toBe('home');
  });

  it('passes through tab field when provided', () => {
    const block = widgetToBlock({ type: 'calendar_full', defaultPriority: 50, tab: 'calendar' });
    expect(block.tab).toBe('calendar');
  });

  it('passes through props from input', () => {
    const props = { label: 'IVF Round 3', highlight: true };
    const block = widgetToBlock({ type: 'primary_event', defaultPriority: 90, props });
    expect(block.props).toEqual(props);
  });

  it('clamps priority below 0 to 0', () => {
    const block = widgetToBlock({ type: 'core.value', defaultPriority: -5 });
    expect(block.priority).toBe(0);
  });

  it('clamps priority above 100 to 100', () => {
    const block = widgetToBlock({ type: 'core.value', defaultPriority: 150 });
    expect(block.priority).toBe(100);
  });

  it('builds a stable id from widgetType + tab + priority', () => {
    const block = widgetToBlock({ type: 'mood_quicklog', defaultPriority: 60, tab: 'home' });
    expect(block.id).toBe('mood_quicklog:home:60');
  });
});

// ---------------------------------------------------------------------------
// widgetsToBlocks — sorting + stable order
// ---------------------------------------------------------------------------

describe('widgetsToBlocks', () => {
  it('returns empty array for empty input', () => {
    expect(widgetsToBlocks([])).toEqual([]);
  });

  it('sorts 5 widgets descending by priority', () => {
    const widgets: WidgetConfig[] = [
      { type: 'calendar_mini',       defaultPriority: 40 },
      { type: 'primary_event',       defaultPriority: 95 },
      { type: 'mood_quicklog',       defaultPriority: 60 },
      { type: 'injection_timeline',  defaultPriority: 70 },
      { type: 'event_detail_list',   defaultPriority: 55 },
    ];

    const blocks = widgetsToBlocks(widgets);

    expect(blocks).toHaveLength(5);
    const priorities = blocks.map((b) => b.priority);
    expect(priorities).toEqual([95, 70, 60, 55, 40]);
  });

  it('preserves template order for widgets with equal priority (stable sort)', () => {
    const widgets: WidgetConfig[] = [
      { type: 'core.narrative', defaultPriority: 50 }, // index 0
      { type: 'core.step',      defaultPriority: 50 }, // index 1
      { type: 'core.glance',    defaultPriority: 50 }, // index 2
    ];

    const blocks = widgetsToBlocks(widgets);

    // All same priority → original template order preserved
    expect(blocks[0].widgetType).toBe('core.narrative');
    expect(blocks[1].widgetType).toBe('core.step');
    expect(blocks[2].widgetType).toBe('core.glance');
  });

  it('returns readonly array (RendererBlock.props is frozen-object shape)', () => {
    const widgets: WidgetConfig[] = [
      { type: 'primary_event', defaultPriority: 80, tab: 'home', props: { x: 1 } },
    ];
    const blocks = widgetsToBlocks(widgets);
    expect(blocks[0].props).toEqual({ x: 1 });
  });
});
