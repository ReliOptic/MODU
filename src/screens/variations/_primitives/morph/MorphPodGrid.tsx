// Morph mood — pod grid dispatcher. Renders grid4 / grid2 / singleBig / resting
// based on PodMode derived from MORPH_SHAPES.
// Tapped state for grid2 pods managed by TimelineSpineMorph (lifted up).
import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import type { PodMode } from '../../fertility/morphTypes';
import { MorphPod } from './MorphPod';
import { MorphBigPod } from './MorphBigPod';
import { MorphRestingPod } from './MorphRestingPod';
import { s } from '../../../../theme';

export interface MorphPodGridProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly podMode: PodMode;
  readonly tapped: string | null;
  readonly onTap: (key: string | null) => void;
  readonly reduceMotion: boolean;
}

// Static pod data — same seed values as the reference JSX
const GRID4_PODS = [
  { key: 'mood',    label: '감정',  value: '고요',   sub: '이번 주' },
  { key: 'sleep',   label: '수면',  value: '7:40',   sub: '평균 +18분' },
  { key: 'ritual',  label: '리추얼', value: '3×',    sub: '주 3회' },
  { key: 'vitamin', label: '영양제', value: '5/5',   sub: '매일' },
] as const;

const GRID2_PODS = [
  { key: 'mood',  label: '감정', value: '설렘', sub: '2h 전' },
  { key: 'sleep', label: '수면', value: '7:20', sub: '+22분 평균' },
] as const;

export function MorphPodGrid({
  palette,
  podMode,
  tapped,
  onTap,
  reduceMotion,
}: MorphPodGridProps): React.JSX.Element | null {
  if (podMode === 'singleBig') {
    return <MorphBigPod palette={palette} reduceMotion={reduceMotion} />;
  }

  if (podMode === 'resting') {
    return <MorphRestingPod palette={palette} reduceMotion={reduceMotion} />;
  }

  if (podMode === 'grid4') {
    return (
      <View style={styles.gridWrap}>
        <View style={styles.row}>
          {GRID4_PODS.slice(0, 2).map((p, i) => (
            <MorphPod
              key={p.key}
              palette={palette}
              label={p.label}
              value={p.value}
              sub={p.sub}
              seed={i}
              reduceMotion={reduceMotion}
            />
          ))}
        </View>
        <View style={styles.row}>
          {GRID4_PODS.slice(2).map((p, i) => (
            <MorphPod
              key={p.key}
              palette={palette}
              label={p.label}
              value={p.value}
              sub={p.sub}
              seed={i + 2}
              reduceMotion={reduceMotion}
            />
          ))}
        </View>
      </View>
    );
  }

  // grid2
  return (
    <View style={styles.gridWrap}>
      <View style={styles.row}>
        {GRID2_PODS.map((p, i) => (
          <MorphPod
            key={p.key}
            palette={palette}
            label={p.label}
            value={p.value}
            sub={p.sub}
            tapped={tapped === p.key}
            onTap={() => onTap(tapped === p.key ? null : p.key)}
            seed={i}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    paddingHorizontal: s.lg,
    gap: s.md,
  },
  row: {
    flexDirection: 'row',
    gap: s.md,
  },
});
