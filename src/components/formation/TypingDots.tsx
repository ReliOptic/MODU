// TypingDots — AI "thinking" indicator for FormationFlow.
// Three dots pulse in sequence while waiting for Gemma reflection.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { widgetTokens } from '../../theme';

interface DotProps {
  delay: number;
}

function Dot({ delay }: DotProps) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 600 }), -1, true)
    );
    return () => cancelAnimation(v);
  }, [delay, v]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + v.value * 0.6,
    transform: [{ translateY: -2 * v.value }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function TypingDots() {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <Dot delay={0} />
          <Dot delay={160} />
          <Dot delay={320} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', marginBottom: 12 },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(60,60,67,0.06)',
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: widgetTokens.textSecondary,
  },
});
