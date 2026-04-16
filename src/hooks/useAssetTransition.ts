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
  /** newAssetId 로 전환. mode='quick' (default) 또는 'ritual' (의식 필요 시) */
  switchTo: (newAssetId: string, mode?: TransitionMode) => void;
  phase: TransitionPhase;
  /** 현재 transition 의 mode — overlay 렌더 결정용 */
  mode: TransitionMode;
  pending: PendingTarget | null;
  /** 현재 화면(outgoing) 에 적용할 reanimated style */
  outgoingStyle: ReturnType<typeof useAnimatedStyle>;
}

export function useAssetTransition(): UseAssetTransitionResult {
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [mode, setMode] = useState<TransitionMode>('quick');
  const [pending, setPending] = useState<PendingTarget | null>(null);
  const progress = useSharedValue(0);

  const switchTo = useCallback(
    (newAssetId: string, requestedMode: TransitionMode = 'quick') => {
      const target = useAssetStore.getState().assets.find((a) => a.id === newAssetId);
      if (!target) return;
      if (newAssetId === useAssetStore.getState().currentAssetId) return;

      setPending({ id: newAssetId, palette: target.palette, label: target.displayName });
      setMode(requestedMode);
      setPhase('out');
      safeHaptic('selection');

      if (requestedMode === 'quick') {
        // ── Discord-like quick switch: 280ms cross-fade, no ritual overlay ──
        progress.value = withTiming(1, {
          duration: QUICK_HALF,
          easing: Easing.out(Easing.cubic),
        });
        setTimeout(() => {
          useAssetStore.getState().switchAsset(newAssetId);
          setPhase('in');
          progress.value = 0;
          progress.value = withTiming(0, {
            duration: QUICK_HALF,
            easing: Easing.out(Easing.cubic),
          });
        }, QUICK_HALF);
        setTimeout(() => {
          setPhase('idle');
          setPending(null);
        }, QUICK_HALF * 2);
        return;
      }

      // ── Ritual mode: 920ms with ChapterRitualOverlay ──
      progress.value = withTiming(1, {
        duration: FADE_OUT,
        easing: Easing.out(Easing.cubic),
      });

      setTimeout(() => {
        setPhase('ritual');
        safeHaptic('light');
      }, FADE_OUT);

      const COMMIT_DELAY = FADE_OUT + RITUAL_HOLD / 2;
      setTimeout(() => {
        useAssetStore.getState().switchAsset(newAssetId);
      }, COMMIT_DELAY);

      setTimeout(() => {
        setPhase('in');
        progress.value = withTiming(0, {
          duration: FADE_IN,
          easing: Easing.out(Easing.cubic),
        });
      }, FADE_OUT + RITUAL_HOLD);

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

  return { switchTo, phase, mode, pending, outgoingStyle };
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
