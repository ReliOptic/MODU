// Morph mood — dayof single fullscreen pod. Gradient fill, breathing copy.
// R1: minHeight 200pt to ensure it anchors the dayof hero stack.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { PaletteSwatch } from '../../../../theme';
import { s } from '../../../../theme';

export interface MorphBigPodProps {
  readonly palette: PaletteSwatch;
  readonly reduceMotion: boolean;
}

export function MorphBigPod({
  palette,
  reduceMotion,
}: MorphBigPodProps): React.JSX.Element {
  const entering = reduceMotion ? undefined : FadeIn.delay(80).duration(480);

  return (
    <Animated.View entering={entering} style={[styles.outer, { elevation: 6 }]}>
      {/* Shadow on outer, gradient in clipped inner */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.clip,
        ]}
      >
        <LinearGradient
          colors={[palette.heroGradient.top, palette.heroGradient.mid, palette.heroGradient.bottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>오늘은, 이것만</Text>
        <Text style={styles.headline}>호흡</Text>
        <Text style={styles.body}>
          들이쉬고 4, 멈추고 7, 내쉬고 8. 세 번씩.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: s.lg,
    minHeight: 200,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    justifyContent: 'flex-end',
  },
  clip: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  content: {
    padding: 28,
    gap: s.md,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.88)',
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -1.2,
    color: '#FFFFFF',
  },
  body: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
    maxWidth: 260,
  },
});
