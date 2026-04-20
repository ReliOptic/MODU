// Render tests for bento-local primitives (Phase 5B).
// Verifies each primitive renders without error for each palette.
import React from 'react';
import { act } from 'react-test-renderer';
import renderer from 'react-test-renderer';
import { palettes } from '../theme/palettes';
import type { PaletteSwatch } from '../theme/palettes';
import type { ResolvedTPO } from '../adapters/assetToTPO';
import {
  BentoHeroTile,
  BentoClockTile,
  BentoMoodTile,
  BentoInjectionTile,
  BentoCalendarTile,
  BentoPartnerTile,
  BentoWhisperTile,
  BentoBodyTile,
  BentoSleepTile,
} from '../screens/variations/_primitives/bento';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_VISUAL = { dim: 1, heroScale: 1, density: 1, blobSize: 1, ritualStrength: 1 } as const;
const MOCK_COPY = {
  heroWord: '배아 이식',
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

const ALL_PALETTES: ReadonlyArray<[string, PaletteSwatch]> = Object.entries(palettes) as ReadonlyArray<[string, PaletteSwatch]>;
const NEAR_TPO = makeTpo('near');
const MIN_HEIGHT = 120;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function renderTile(element: React.JSX.Element): Promise<renderer.ReactTestRenderer> {
  let tree: renderer.ReactTestRenderer | null = null;
  await act(async () => {
    tree = renderer.create(element);
  });
  return tree!;
}

// ---------------------------------------------------------------------------
// BentoHeroTile
// ---------------------------------------------------------------------------

describe('BentoHeroTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoHeroTile palette={palette} tpo={NEAR_TPO} minHeight={MIN_HEIGHT} eyebrow="내일 · 09:00 · D-1" />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders heroWord from tpo.copy', async () => {
    const tree = await renderTile(
      <BentoHeroTile palette={palettes.dawn} tpo={NEAR_TPO} minHeight={MIN_HEIGHT} eyebrow="내일 · 09:00 · D-1" />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('배아 이식');
  });
});

// ---------------------------------------------------------------------------
// BentoClockTile
// ---------------------------------------------------------------------------

describe('BentoClockTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoClockTile palette={palette} tpo={NEAR_TPO} minHeight={MIN_HEIGHT} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  it('shows D-1 for near proximity', async () => {
    const tree = await renderTile(
      <BentoClockTile palette={palettes.dawn} tpo={NEAR_TPO} minHeight={MIN_HEIGHT} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('D-1');
  });

  it('shows D-DAY for dayof proximity', async () => {
    const tree = await renderTile(
      <BentoClockTile palette={palettes.dawn} tpo={makeTpo('dayof')} minHeight={MIN_HEIGHT} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('D-DAY');
  });
});

// ---------------------------------------------------------------------------
// BentoMoodTile
// ---------------------------------------------------------------------------

describe('BentoMoodTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoMoodTile palette={palette} minHeight={MIN_HEIGHT} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders all 4 mood labels', async () => {
    const tree = await renderTile(
      <BentoMoodTile palette={palettes.dawn} minHeight={MIN_HEIGHT} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('평온');
    expect(json).toContain('설렘');
    expect(json).toContain('불안');
    expect(json).toContain('피곤');
  });
});

// ---------------------------------------------------------------------------
// BentoInjectionTile
// ---------------------------------------------------------------------------

describe('BentoInjectionTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoInjectionTile palette={palette} minHeight={MIN_HEIGHT} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  it('shows completion status text', async () => {
    const tree = await renderTile(
      <BentoInjectionTile palette={palettes.dawn} minHeight={MIN_HEIGHT} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('완료');
  });
});

// ---------------------------------------------------------------------------
// BentoCalendarTile
// ---------------------------------------------------------------------------

describe('BentoCalendarTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoCalendarTile palette={palette} minHeight={MIN_HEIGHT} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders 28 day cells', async () => {
    const tree = await renderTile(
      <BentoCalendarTile palette={palettes.dawn} minHeight={MIN_HEIGHT} />,
    );
    const json = JSON.stringify(tree.toJSON());
    // Day 28 should be present
    expect(json).toContain('"28"');
  });
});

// ---------------------------------------------------------------------------
// BentoPartnerTile
// ---------------------------------------------------------------------------

describe('BentoPartnerTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoPartnerTile palette={palette} minHeight={MIN_HEIGHT} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  it('shows sync ON status', async () => {
    const tree = await renderTile(
      <BentoPartnerTile palette={palettes.dawn} minHeight={MIN_HEIGHT} syncEnabled />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('동기화 ON');
  });

  it('shows sync OFF status', async () => {
    const tree = await renderTile(
      <BentoPartnerTile palette={palettes.dawn} minHeight={MIN_HEIGHT} syncEnabled={false} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('동기화 OFF');
  });
});

// ---------------------------------------------------------------------------
// BentoWhisperTile
// ---------------------------------------------------------------------------

describe('BentoWhisperTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoWhisperTile palette={palette} text="조용히, 천천히." minHeight={MIN_HEIGHT} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders provided text', async () => {
    const tree = await renderTile(
      <BentoWhisperTile palette={palettes.dawn} text="조용히, 천천히." minHeight={MIN_HEIGHT} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('조용히, 천천히.');
  });
});

// ---------------------------------------------------------------------------
// BentoBodyTile
// ---------------------------------------------------------------------------

describe('BentoBodyTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoBodyTile palette={palette} minHeight={MIN_HEIGHT} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// BentoSleepTile
// ---------------------------------------------------------------------------

describe('BentoSleepTile', () => {
  it.each(ALL_PALETTES)('renders with palette %s', async (_name, palette) => {
    const tree = await renderTile(
      <BentoSleepTile palette={palette} minHeight={MIN_HEIGHT} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders default duration', async () => {
    const tree = await renderTile(
      <BentoSleepTile palette={palettes.dawn} minHeight={MIN_HEIGHT} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('7h 20m');
  });

  it('renders custom duration', async () => {
    const tree = await renderTile(
      <BentoSleepTile palette={palettes.dawn} minHeight={MIN_HEIGHT} duration="8h 05m" />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('8h 05m');
  });
});
