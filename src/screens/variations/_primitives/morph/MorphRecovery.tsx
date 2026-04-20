// Morph mood — after-proximity recovery metrics panel.
// Three-column stat row: 휴식 / 호흡 / 수분.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../../theme';
import { s } from '../../../../theme';

export interface MorphRecoveryProps {
  readonly palette: PaletteSwatch;
  /** Rows: [label, value, sub] */
  readonly rows: ReadonlyArray<readonly [string, string, string]>;
  readonly reduceMotion: boolean;
}

export function MorphRecovery({
  palette,
  rows,
  reduceMotion,
}: MorphRecoveryProps): React.JSX.Element {
  const entering = reduceMotion ? undefined : FadeIn.delay(80).duration(400);

  return (
    <Animated.View
      entering={entering}
      style={[
        styles.card,
        { backgroundColor: palette[100], borderColor: palette[200] },
      ]}
    >
      <View style={styles.eyebrowRow}>
        <View style={[styles.eyebrowDot, { backgroundColor: palette.accent }]} />
        <Text style={[styles.eyebrow, { color: palette[600] }]}>
          다음 날의 몸
        </Text>
      </View>
      <View style={styles.statsRow}>
        {rows.map(([label, value, sub]) => (
          <View key={label} style={styles.statCol}>
            <Text style={[styles.statLabel, { color: palette[600] }]}>
              {label.toUpperCase()}
            </Text>
            <Text style={[styles.statValue, { color: palette.accent }]}>
              {value}
            </Text>
            <Text style={[styles.statSub, { color: palette[500] }]}>{sub}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s.lg,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    gap: 3,
  },
  statLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  statSub: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
    lineHeight: 14,
  },
});
