// Section-order tests for TimelineSpineCinematic.
// For each proximity, renders the component and asserts the correct
// section testIDs appear in the JSON tree.
import React from 'react';
import { act } from 'react-test-renderer';
import renderer from 'react-test-renderer';
import { palettes } from '../theme/palettes';
import type { PaletteSwatch } from '../theme/palettes';
import type { ResolvedTPO } from '../adapters/assetToTPO';
import { TimelineSpineCinematic } from '../screens/variations/fertility/TimelineSpineCinematic';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PALETTE: PaletteSwatch = palettes.dawn;

const MOCK_VISUAL = { dim: 1, heroScale: 1, density: 1, blobSize: 1, ritualStrength: 1 } as const;
const MOCK_COPY = {
  heroWord: 'Ready',
  headline: '배아 이식 · D-1',
  whisper: '수분 섭취와 가벼운 산책만.',
} as const;

function makeTpo(proximity: ResolvedTPO['proximity']): ResolvedTPO {
  return {
    proximity,
    timeOfDay: 'morning',
    role: 'self',
    placeId: 'kr_seoul',
    locale: 'ko',
    assetKey: 'fertility',
    copy: MOCK_COPY,
    visual: MOCK_VISUAL,
    anchorEventId: null,
  };
}

const MOCK_BLOCKS = [] as const;
const MOCK_TIMELINE = [] as const;

// ---------------------------------------------------------------------------
// Helper: collect all testID values from a rendered tree recursively
// ---------------------------------------------------------------------------

function collectTestIds(node: ReturnType<typeof renderer.create>): ReadonlyArray<string> {
  const ids: string[] = [];
  function walk(n: unknown): void {
    if (n === null || typeof n !== 'object') return;
    const obj = n as Record<string, unknown>;
    if (obj.props && typeof (obj.props as Record<string, unknown>).testID === 'string') {
      ids.push((obj.props as Record<string, unknown>).testID as string);
    }
    if (Array.isArray(obj.children)) {
      for (const child of obj.children) walk(child);
    } else if (obj.children !== undefined && obj.children !== null) {
      walk(obj.children);
    }
  }
  walk(node.toJSON());
  return ids;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TimelineSpineCinematic section order by proximity', () => {
  it('far: hero + pullquote + mood + closing', async () => {
    let tree: renderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(
        <TimelineSpineCinematic
          tpo={makeTpo('far')}
          blocks={MOCK_BLOCKS}
          timeline={MOCK_TIMELINE}
          palette={PALETTE}
        />,
      );
    });
    const ids = collectTestIds(tree!);
    expect(ids).toContain('section-hero');
    expect(ids).toContain('section-pullquote');
    expect(ids).toContain('section-mood');
    expect(ids).toContain('section-closing');
    expect(ids).not.toContain('section-event');
    expect(ids).not.toContain('section-timeline');
    expect(ids).not.toContain('section-recovery');
  });

  it('week: hero + pullquote + timeline + mood + closing', async () => {
    let tree: renderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(
        <TimelineSpineCinematic
          tpo={makeTpo('week')}
          blocks={MOCK_BLOCKS}
          timeline={MOCK_TIMELINE}
          palette={PALETTE}
        />,
      );
    });
    const ids = collectTestIds(tree!);
    expect(ids).toContain('section-hero');
    expect(ids).toContain('section-pullquote');
    expect(ids).toContain('section-timeline');
    expect(ids).toContain('section-mood');
    expect(ids).toContain('section-closing');
    expect(ids).not.toContain('section-event');
    expect(ids).not.toContain('section-recovery');
  });

  it('near: hero + event + timeline + pullquote + mood + closing', async () => {
    let tree: renderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(
        <TimelineSpineCinematic
          tpo={makeTpo('near')}
          blocks={MOCK_BLOCKS}
          timeline={MOCK_TIMELINE}
          palette={PALETTE}
        />,
      );
    });
    const ids = collectTestIds(tree!);
    expect(ids).toContain('section-hero');
    expect(ids).toContain('section-event');
    expect(ids).toContain('section-timeline');
    expect(ids).toContain('section-pullquote');
    expect(ids).toContain('section-mood');
    expect(ids).toContain('section-closing');
    expect(ids).not.toContain('section-recovery');
  });

  it('dayof: hero + event + partner-wrapper + closing (no timeline/pullquote/recovery)', async () => {
    let tree: renderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(
        <TimelineSpineCinematic
          tpo={makeTpo('dayof')}
          blocks={MOCK_BLOCKS}
          timeline={MOCK_TIMELINE}
          palette={PALETTE}
        />,
      );
    });
    const ids = collectTestIds(tree!);
    expect(ids).toContain('section-hero');
    expect(ids).toContain('section-event');
    expect(ids).toContain('section-partner');
    expect(ids).toContain('section-closing');
    expect(ids).not.toContain('section-timeline');
    expect(ids).not.toContain('section-pullquote');
    expect(ids).not.toContain('section-recovery');
  });

  it('after: hero + recovery + partner-wrapper + mood + closing', async () => {
    let tree: renderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(
        <TimelineSpineCinematic
          tpo={makeTpo('after')}
          blocks={MOCK_BLOCKS}
          timeline={MOCK_TIMELINE}
          palette={PALETTE}
        />,
      );
    });
    const ids = collectTestIds(tree!);
    expect(ids).toContain('section-hero');
    expect(ids).toContain('section-recovery');
    expect(ids).toContain('section-partner');
    expect(ids).toContain('section-mood');
    expect(ids).toContain('section-closing');
    expect(ids).not.toContain('section-event');
    expect(ids).not.toContain('section-timeline');
    expect(ids).not.toContain('section-pullquote');
  });
});
