// Variation C — Morphing Canvas (TPO-reactive).
// Single asymmetric blob hero + organic pods. Proximity drives blob size,
// pod composition (grid4/grid2/singleBig/resting), and section visibility.
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { RendererBlock, ResolvedTPO } from '../../adapters';
import type { PaletteSwatch } from '../../theme';
import type { VariationProps } from './types';
import { proximityLabel } from './types';

type PodMode = 'grid4' | 'grid2' | 'singleBig' | 'resting';

interface MorphShape {
  readonly blobPx: number;
  readonly heroBonus: number;
  readonly podMode: PodMode;
  readonly showRecovery: boolean;
}

function shapeFor(p: ResolvedTPO['proximity']): MorphShape {
  switch (p) {
    case 'far':   return { blobPx: 220, heroBonus: 20,  podMode: 'grid4',     showRecovery: false };
    case 'week':  return { blobPx: 280, heroBonus: 40,  podMode: 'grid2',     showRecovery: false };
    case 'near':  return { blobPx: 340, heroBonus: 80,  podMode: 'grid2',     showRecovery: false };
    case 'dayof': return { blobPx: 420, heroBonus: 140, podMode: 'singleBig', showRecovery: false };
    case 'after': return { blobPx: 260, heroBonus: 0,   podMode: 'resting',   showRecovery: true };
  }
}

export function MorphVariation({ tpo, blocks, palette }: VariationProps): React.JSX.Element {
  const S = useMemo(() => shapeFor(tpo.proximity), [tpo.proximity]);
  const dim = tpo.visual.dim;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette[50], opacity: dim }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <MetaStrip palette={palette} tpo={tpo} />
      <BlobHero palette={palette} tpo={tpo} shape={S} />
      <Whisper palette={palette} tpo={tpo} />
      <Pods palette={palette} blocks={blocks} mode={S.podMode} />
      {S.showRecovery && <RecoveryStrip palette={palette} />}
      <View style={styles.tailSpacer} />
    </ScrollView>
  );
}

function MetaStrip({ palette, tpo }: { palette: PaletteSwatch; tpo: ResolvedTPO }): React.JSX.Element {
  return (
    <View style={styles.metaStrip}>
      <View style={styles.metaLeft}>
        <View style={[styles.metaDot, { backgroundColor: palette.accent }]} />
        <Text style={[styles.metaText, { color: palette[700] }]}>
          MODU · {tpo.assetKey.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.metaText, { color: palette[700] }]}>
        {proximityLabel(tpo.proximity)} · {tpo.timeOfDay.toUpperCase()}
      </Text>
    </View>
  );
}

interface BlobHeroProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly shape: MorphShape;
}

function BlobHero({ palette, tpo, shape }: BlobHeroProps): React.JSX.Element {
  const heroSize = tpo.proximity === 'dayof' ? 64 : 48 + tpo.visual.heroScale * 8;
  return (
    <View style={[styles.heroFrame, { height: 360 + shape.heroBonus }]}>
      <View style={[styles.blob, { width: shape.blobPx, height: shape.blobPx }]}>
        <LinearGradient
          colors={[palette.gradient.start, palette.gradient.mid, palette.gradient.end]}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.9, y: 0.95 }}
          style={styles.blobFill}
        />
      </View>
      <View style={styles.heroContent}>
        <Text style={styles.heroEyebrow}>
          {proximityLabel(tpo.proximity)} · {tpo.timeOfDay.toUpperCase()}
        </Text>
        <Text style={[styles.heroWord, { fontSize: heroSize, lineHeight: heroSize * 0.95 }]} numberOfLines={2}>
          {tpo.copy.heroWord}
        </Text>
        <Text style={styles.heroWhisper} numberOfLines={3}>{tpo.copy.whisper}</Text>
      </View>
    </View>
  );
}

function Whisper({ palette, tpo }: { palette: PaletteSwatch; tpo: ResolvedTPO }): React.JSX.Element {
  return (
    <View style={[styles.whisperCard, { backgroundColor: palette[100], borderColor: palette[200] }]}>
      <Text style={[styles.whisperText, { color: palette[900] }]}>
        {tpo.copy.headline}
        {' '}
        <Text style={{ color: palette.accent }}>{tpo.copy.heroWord}</Text>
      </Text>
    </View>
  );
}

interface PodsProps {
  readonly palette: PaletteSwatch;
  readonly blocks: readonly RendererBlock[];
  readonly mode: PodMode;
}

function Pods({ palette, blocks, mode }: PodsProps): React.JSX.Element | null {
  if (mode === 'singleBig') {
    return (
      <LinearGradient
        colors={[palette.gradient.start, palette.gradient.mid, palette.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bigPod}
      >
        <Text style={styles.bigPodEyebrow}>오늘은, 이것만</Text>
        <Text style={styles.bigPodTitle}>호흡</Text>
        <Text style={styles.bigPodBody}>들이쉬고 4, 멈추고 7, 내쉬고 8. 세 번씩.</Text>
      </LinearGradient>
    );
  }
  if (mode === 'resting') {
    return (
      <View style={[styles.restingPod, { backgroundColor: palette[100], borderColor: palette[200] }]}>
        <View style={[styles.restingDot, { backgroundColor: palette.accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.restingEyebrow, { color: palette[700] }]}>오늘</Text>
          <Text style={[styles.restingTitle, { color: palette[900] }]}>그저, 쉼</Text>
          <Text style={[styles.restingBody, { color: palette[700] }]}>오늘은 해야 할 일이 없어요. 몸이 일하고 있어요.</Text>
        </View>
      </View>
    );
  }
  const slice = mode === 'grid4' ? 4 : 2;
  const items = blocks.slice(0, slice);
  return (
    <View style={styles.podGrid}>
      {items.map((b, i) => (
        <Animated.View
          key={b.id}
          entering={FadeIn.delay(i * 60).duration(360)}
          style={[styles.pod, { backgroundColor: palette[100], borderColor: palette[200] }]}
        >
          <Text style={[styles.podEyebrow, { color: palette[700] }]}>{b.variant.toUpperCase()}</Text>
          <Text style={[styles.podValue, { color: palette.accent }]} numberOfLines={1}>
            {b.widgetType.split(/[_.]/).slice(-1)[0] ?? '—'}
          </Text>
          <Text style={[styles.podSub, { color: palette[700] }]}>tab {b.tab}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

function RecoveryStrip({ palette }: { palette: PaletteSwatch }): React.JSX.Element {
  const rows: readonly (readonly [string, string])[] = [
    ['휴식', '9h 12m'],
    ['호흡', '느리게'],
    ['수분', '2.1L'],
  ];
  return (
    <View style={[styles.recovery, { backgroundColor: palette[100], borderColor: palette[200] }]}>
      {rows.map(([k, v]) => (
        <View key={k} style={{ flex: 1 }}>
          <Text style={[styles.recoveryLabel, { color: palette[700] }]}>{k}</Text>
          <Text style={[styles.recoveryValue, { color: palette.accent }]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20, gap: 16 },
  metaStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 18,
  },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { width: 6, height: 6, borderRadius: 3 },
  metaText: { fontSize: 10, letterSpacing: 2.2, fontFamily: 'JetBrainsMono_400Regular' },
  heroFrame: { alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute', borderRadius: 200, overflow: 'hidden', opacity: 0.92 },
  blobFill: { flex: 1 },
  heroContent: { alignItems: 'center', padding: 28, gap: 10, zIndex: 1 },
  heroEyebrow: {
    fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,0.92)',
    fontFamily: 'JetBrainsMono_400Regular', marginBottom: 4,
  },
  heroWord: {
    fontFamily: 'Fraunces_400Regular',
    color: '#fff', letterSpacing: -1.2, textAlign: 'center',
  },
  heroWhisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 13, lineHeight: 19,
    color: 'rgba(255,255,255,0.92)', textAlign: 'center', maxWidth: 240,
  },
  whisperCard: { padding: 22, borderRadius: 28, borderWidth: 1 },
  whisperText: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 19, lineHeight: 26, letterSpacing: -0.4,
  },
  podGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pod: {
    flexBasis: '48%', flexGrow: 1, borderWidth: 1, borderRadius: 24,
    padding: 16, gap: 10, minHeight: 130, justifyContent: 'space-between',
  },
  podEyebrow: { fontSize: 9, letterSpacing: 2, fontFamily: 'JetBrainsMono_400Regular' },
  podValue: { fontFamily: 'Fraunces_400Regular', fontSize: 26, letterSpacing: -0.6 },
  podSub: { fontSize: 11, fontFamily: 'Pretendard_400Regular' },
  bigPod: { padding: 26, borderRadius: 36, gap: 10, minHeight: 200 },
  bigPodEyebrow: {
    fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,0.88)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  bigPodTitle: { fontFamily: 'Fraunces_400Regular', fontSize: 44, color: '#fff', letterSpacing: -1 },
  bigPodBody: {
    fontFamily: 'Pretendard_400Regular', fontSize: 14, lineHeight: 21,
    color: 'rgba(255,255,255,0.92)', maxWidth: 240,
  },
  restingPod: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 22, borderRadius: 28, borderWidth: 1,
  },
  restingDot: { width: 14, height: 14, borderRadius: 7 },
  restingEyebrow: { fontSize: 9, letterSpacing: 2, fontFamily: 'JetBrainsMono_400Regular' },
  restingTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22, letterSpacing: -0.4, marginTop: 4,
  },
  restingBody: { fontFamily: 'Pretendard_400Regular', fontSize: 12, marginTop: 4 },
  recovery: {
    flexDirection: 'row', gap: 14,
    padding: 22, borderRadius: 24, borderWidth: 1,
  },
  recoveryLabel: { fontSize: 10, letterSpacing: 2, fontFamily: 'JetBrainsMono_400Regular' },
  recoveryValue: { fontFamily: 'Fraunces_400Regular', fontSize: 22, letterSpacing: -0.4, marginTop: 6 },
  tailSpacer: { height: 60 },
});
