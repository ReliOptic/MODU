// §6.1 에셋 전환 애니메이션 — 총 400ms 크로스페이드
// progress.value 0 → 1 → 0 (HALF=200ms씩 두 단계)
// 0~1 구간: 현재 화면 fade out + translateY +20
// 1~0 구간: 새 화면 fade in + translateY -20 → 0
import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { useAssetStore } from '../store/assetStore';

export const TRANSITION_DURATION = 400;
const HALF = TRANSITION_DURATION / 2;

export function useAssetTransition() {
  const progress = useSharedValue(0);
  const switchingTo = useRef<string | null>(null);

  const switchTo = useCallback((newAssetId: string) => {
    switchingTo.current = newAssetId;
    progress.value = withTiming(
      1,
      { duration: HALF, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) return;
        runOnJS(commitSwitch)(newAssetId, progress);
      }
    );
  }, [progress]);

  /** 현재 화면용 애니메이션 스타일 */
  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, 20]) }],
  }));

  /** 새 화면용 애니메이션 스타일 (mount 직전부터) */
  const incomingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [1, 0], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [1, 0], [-20, 0]) }],
  }));

  return { progress, switchTo, outgoingStyle, incomingStyle };
}

function commitSwitch(
  newAssetId: string,
  progress: ReturnType<typeof useSharedValue<number>>
) {
  // Zustand store 업데이트 → re-render → 새 화면 mount
  useAssetStore.getState().switchAsset(newAssetId);
  // 1 → 0 으로 fade in
  progress.value = withTiming(0, { duration: HALF, easing: Easing.out(Easing.cubic) });
}
