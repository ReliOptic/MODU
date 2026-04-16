// §6.1 에셋(=챕터) 전환 — V2 ritual
// 타임라인 (총 ≈ 920ms):
//   0  → 280ms : 현재 화면 fade out (opacity 1→0, scale 0.97)
//   280 → 640ms: ritual overlay 표시 (palette + 챕터 이름) — 360ms hold
//                hold 중간(180ms)에 store 업데이트로 새 에셋 commit
//   640 → 920ms: ritual fade out + 새 화면 fade in (opacity 0→1, scale 0.97→1)
// 햅틱 : 시작 시 selection, ritual 중 light impact (네이티브만)
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAssetStore } from '../store/assetStore';
import type { PaletteKey } from '../theme';

const FADE_OUT = 280;
const RITUAL_HOLD = 360;
const FADE_IN = 280;

export type TransitionPhase = 'idle' | 'out' | 'ritual' | 'in';

export interface PendingTarget {
  id: string;
  palette: PaletteKey;
  label: string;
}

export interface UseAssetTransitionResult {
  switchTo: (newAssetId: string) => void;
  phase: TransitionPhase;
  pending: PendingTarget | null;
  /** 현재 화면(outgoing) 에 적용할 reanimated style */
  outgoingStyle: ReturnType<typeof useAnimatedStyle>;
}

export function useAssetTransition(): UseAssetTransitionResult {
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [pending, setPending] = useState<PendingTarget | null>(null);
  const progress = useSharedValue(0);

  const switchTo = useCallback(
    (newAssetId: string) => {
      const target = useAssetStore.getState().assets.find((a) => a.id === newAssetId);
      if (!target) return;
      // 같은 에셋 무시
      if (newAssetId === useAssetStore.getState().currentAssetId) return;

      setPending({ id: newAssetId, palette: target.palette, label: target.displayName });
      setPhase('out');
      safeHaptic('selection');

      progress.value = withTiming(1, {
        duration: FADE_OUT,
        easing: Easing.out(Easing.cubic),
      });

      setTimeout(() => {
        setPhase('ritual');
        safeHaptic('light');
      }, FADE_OUT);

      // ritual 중간 시점에 store commit (새 화면이 mount 되되 invisible)
      const COMMIT_DELAY = FADE_OUT + RITUAL_HOLD / 2;
      setTimeout(() => {
        useAssetStore.getState().switchAsset(newAssetId);
      }, COMMIT_DELAY);

      // ritual 끝 → 새 화면 fade in
      setTimeout(() => {
        setPhase('in');
        progress.value = withTiming(0, {
          duration: FADE_IN,
          easing: Easing.out(Easing.cubic),
        });
      }, FADE_OUT + RITUAL_HOLD);

      // 마무리
      setTimeout(() => {
        setPhase('idle');
        setPending(null);
      }, FADE_OUT + RITUAL_HOLD + FADE_IN);
    },
    [progress]
  );

  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.97]) }],
  }));

  return { switchTo, phase, pending, outgoingStyle };
}

function safeHaptic(kind: 'selection' | 'light' | 'medium') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'selection') Haptics.selectionAsync();
    else if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // 시뮬레이터/웹에서 미지원 시 silent
  }
}
