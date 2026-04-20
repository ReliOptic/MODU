// Smoke tests — editorial primitives.
// Each test only asserts "renders without throwing".
// Deeper assertions follow in later test cycles.
import React from 'react';
import { act } from 'react-test-renderer';
import renderer from 'react-test-renderer';
import { palettes } from '../theme/palettes';
import type { PaletteSwatch } from '../theme/palettes';
import type { ResolvedTPO } from '../adapters/assetToTPO';
import {
  CinematicHero,
  EditorialEventPanel,
  EditorialTimeline,
  EditorialMoodPalette,
  EditorialResources,
  EditorialRecoveryMetrics,
  EditorialPartner,
  PullQuote,
  ClosingCard,
} from '../screens/variations/_primitives/editorial';
import { useSharedValue } from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PALETTE: PaletteSwatch = palettes.dawn;

const TPO: ResolvedTPO = {
  proximity: 'near',
  timeOfDay: 'morning',
  role: 'self',
  placeId: 'kr_seoul',
  locale: 'ko',
  assetKey: 'fertility',
  copy: {
    heroWord: 'Ready',
    headline: '배아 이식 · D-1',
    whisper: '수분 섭취와 가벼운 산책만.',
  },
  visual: { dim: 1, heroScale: 1, density: 1, blobSize: 1, ritualStrength: 1 },
  anchorEventId: null,
};

// ---------------------------------------------------------------------------
// CinematicHero — requires a SharedValue from Reanimated
// ---------------------------------------------------------------------------

function CinematicHeroWrapper(): React.JSX.Element {
  const scrollY = useSharedValue(0);
  return (
    <CinematicHero
      palette={PALETTE}
      tpo={TPO}
      chapterNum="03"
      chapterName="전야"
      height={640}
      titleFontSize={84}
      scrollY={scrollY}
      brandLabel="Dawn"
      placeLabel="서울"
    />
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('editorial primitives — smoke renders', () => {
  it('CinematicHero renders without throwing', async () => {
    await act(async () => {
      renderer.create(<CinematicHeroWrapper />);
    });
  });

  it('EditorialEventPanel renders without throwing', async () => {
    await act(async () => {
      renderer.create(
        <EditorialEventPanel
          palette={PALETTE}
          tpo={TPO}
          eventLabel="내일 · 09:00"
          title="배아 이식"
          stats={[
            { key: '회차', value: '3 / 3' },
            { key: '준비', value: '92%' },
            { key: '동행', value: '김지윤' },
          ]}
        />,
      );
    });
  });

  it('EditorialTimeline renders without throwing', async () => {
    await act(async () => {
      renderer.create(
        <EditorialTimeline
          palette={PALETTE}
          sectionTitle="24시간의 흐름"
          items={[
            { time: '내일 09:00', title: '배아 이식', icon: 'heart-outline', note: '20분', primary: true },
            { time: '내일 11:30', title: '귀가', icon: 'home-outline', note: '48시간 휴식' },
          ]}
        />,
      );
    });
  });

  it('EditorialMoodPalette renders without throwing', async () => {
    await act(async () => {
      renderer.create(<EditorialMoodPalette palette={PALETTE} />);
    });
  });

  it('EditorialResources renders without throwing (non-empty)', async () => {
    await act(async () => {
      renderer.create(
        <EditorialResources
          palette={PALETTE}
          placeLabel="서울"
          items={[{ kind: 'clinic', label: '강남 세브란스', note: '불임클리닉' }]}
        />,
      );
    });
  });

  it('EditorialResources returns null for empty items', async () => {
    let tree: renderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(
        <EditorialResources palette={PALETTE} placeLabel="서울" items={[]} />,
      );
    });
    expect(tree!.toJSON()).toBeNull();
  });

  it('EditorialRecoveryMetrics renders without throwing', async () => {
    await act(async () => {
      renderer.create(
        <EditorialRecoveryMetrics
          palette={PALETTE}
          rows={[
            ['휴식', '9시간 12분', '평균 +1시간'],
            ['호흡', '느리게', '11 bpm'],
            ['수분', '2.1L', '순조롭게'],
          ]}
        />,
      );
    });
  });

  it('EditorialPartner renders without throwing (partner role)', async () => {
    const partnerTPO: ResolvedTPO = { ...TPO, role: 'partner' };
    await act(async () => {
      renderer.create(<EditorialPartner palette={PALETTE} tpo={partnerTPO} />);
    });
  });

  it('EditorialPartner returns null for self role (no partner message)', async () => {
    let tree: renderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(<EditorialPartner palette={PALETTE} tpo={TPO} />);
    });
    // 'self' role has no partner content
    expect(tree!.toJSON()).toBeNull();
  });

  it('PullQuote renders without throwing', async () => {
    await act(async () => {
      renderer.create(
        <PullQuote
          palette={PALETTE}
          headline="배아 이식 · D-1"
          heroWord="Ready"
          tpo={TPO}
        />,
      );
    });
  });

  it('ClosingCard renders without throwing', async () => {
    await act(async () => {
      renderer.create(
        <ClosingCard palette={PALETTE} tpo={TPO} assetLabel="난임 여정" />,
      );
    });
  });
});
