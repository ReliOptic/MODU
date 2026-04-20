// Render tests for Morph mood primitives.
// Verifies each primitive mounts without crashing across all palettes.
import React from 'react';
import { render } from '@testing-library/react-native';
import { palettes } from '../theme/palettes';
import type { PaletteKey } from '../theme/palettes';
import { MorphWhisper } from '../screens/variations/_primitives/morph/MorphWhisper';
import { MorphPod } from '../screens/variations/_primitives/morph/MorphPod';
import { MorphBigPod } from '../screens/variations/_primitives/morph/MorphBigPod';
import { MorphRestingPod } from '../screens/variations/_primitives/morph/MorphRestingPod';
import { MorphRecovery } from '../screens/variations/_primitives/morph/MorphRecovery';
import { MorphTapDetail } from '../screens/variations/_primitives/morph/MorphTapDetail';
import { MORPH_RECOVERY_ROWS } from '../screens/variations/fertility/morphData';
import type { ResolvedTPO } from '../adapters';

// ---------------------------------------------------------------------------
// Mock TPO for tests
// ---------------------------------------------------------------------------

function makeTPO(
  proximity: ResolvedTPO['proximity'],
): ResolvedTPO {
  return {
    proximity,
    timeOfDay: 'morning',
    role: 'self',
    placeId: 'kr_seoul',
    locale: 'ko',
    assetKey: 'fertility',
    copy: {
      heroWord: '배아 이식',
      headline: '오늘',
      whisper: '오늘은 당신의 날이에요.',
    },
    visual: { dim: 1, heroScale: 1, density: 1, blobSize: 300, ritualStrength: 0.8 },
    anchorEventId: null,
  };
}

const ALL_PALETTE_KEYS: ReadonlyArray<PaletteKey> = [
  'dawn', 'mist', 'blossom', 'sage', 'dusk',
];
const PROXIMITIES: ReadonlyArray<ResolvedTPO['proximity']> = [
  'far', 'week', 'near', 'dayof', 'after',
];

// ---------------------------------------------------------------------------
// MorphWhisper — renders with each palette × proximity
// ---------------------------------------------------------------------------

describe('MorphWhisper', () => {
  it('renders without crash for each palette × proximity', () => {
    for (const key of ALL_PALETTE_KEYS) {
      for (const p of PROXIMITIES) {
        const { unmount } = render(
          <MorphWhisper
            palette={palettes[key]}
            tpo={makeTPO(p)}
            whisperShape={p === 'dayof' ? 'tight' : p === 'after' ? 'pill' : 'organic'}
            reduceMotion={false}
          />,
        );
        unmount();
      }
    }
  });

  it('renders with reduceMotion=true without crash', () => {
    const { getByText } = render(
      <MorphWhisper
        palette={palettes.dawn}
        tpo={makeTPO('near')}
        whisperShape="organic"
        reduceMotion={true}
      />,
    );
    // Whisper card should show copy
    expect(getByText(/수면의 질/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// MorphPod
// ---------------------------------------------------------------------------

describe('MorphPod', () => {
  it('renders value and label text', () => {
    const { getByText } = render(
      <MorphPod
        palette={palettes.dawn}
        label="수면"
        value="7:40"
        sub="평균 +18분"
        reduceMotion={false}
      />,
    );
    expect(getByText('7:40')).toBeTruthy();
  });

  it('renders tapped state without crash', () => {
    const { unmount } = render(
      <MorphPod
        palette={palettes.mist}
        label="감정"
        value="고요"
        sub="이번 주"
        tapped={true}
        onTap={() => undefined}
        reduceMotion={true}
      />,
    );
    unmount();
  });
});

// ---------------------------------------------------------------------------
// MorphBigPod — dayof singleBig
// ---------------------------------------------------------------------------

describe('MorphBigPod', () => {
  it('renders across all palettes', () => {
    for (const key of ALL_PALETTE_KEYS) {
      const { unmount } = render(
        <MorphBigPod palette={palettes[key]} reduceMotion={false} />,
      );
      unmount();
    }
  });

  it('contains 호흡 headline', () => {
    const { getByText } = render(
      <MorphBigPod palette={palettes.dawn} reduceMotion={true} />,
    );
    expect(getByText('호흡')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// MorphRestingPod — after resting
// ---------------------------------------------------------------------------

describe('MorphRestingPod', () => {
  it('renders without crash across all palettes', () => {
    for (const key of ALL_PALETTE_KEYS) {
      const { unmount } = render(
        <MorphRestingPod palette={palettes[key]} reduceMotion={false} />,
      );
      unmount();
    }
  });

  it('shows 그저, 쉼 text', () => {
    const { getByText } = render(
      <MorphRestingPod palette={palettes.dawn} reduceMotion={true} />,
    );
    expect(getByText('그저, 쉼')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// MorphRecovery
// ---------------------------------------------------------------------------

describe('MorphRecovery', () => {
  it('renders recovery rows without crash', () => {
    const { getByText } = render(
      <MorphRecovery
        palette={palettes.dawn}
        rows={MORPH_RECOVERY_ROWS}
        reduceMotion={false}
      />,
    );
    expect(getByText('9시간 12분')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// MorphTapDetail
// ---------------------------------------------------------------------------

describe('MorphTapDetail', () => {
  it('renders mood detail copy', () => {
    const { getByText } = render(
      <MorphTapDetail palette={palettes.dawn} podKey="mood" reduceMotion={false} />,
    );
    expect(getByText(/설렘이/)).toBeTruthy();
  });

  it('renders sleep detail copy', () => {
    const { getByText } = render(
      <MorphTapDetail palette={palettes.dawn} podKey="sleep" reduceMotion={true} />,
    );
    expect(getByText(/22분/)).toBeTruthy();
  });

  it('returns null for unknown podKey', () => {
    const { toJSON } = render(
      <MorphTapDetail palette={palettes.dawn} podKey="unknown" reduceMotion={false} />,
    );
    expect(toJSON()).toBeNull();
  });
});
