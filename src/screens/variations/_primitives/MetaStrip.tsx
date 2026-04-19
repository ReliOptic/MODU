// v2.1 — top eyebrow row. Asset-type indicator + proximity + time-of-day.
// Used above hero on every primitive. Pretendard mono-ish via JetBrainsMono.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../theme';
import type { ResolvedTPO } from '../../../adapters';
import { proximityLabel } from '../types';
import { s } from '../../../theme';

export interface MetaStripProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
}

export function MetaStrip({ palette, tpo }: MetaStripProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: palette.accent }]} />
        <Text style={[styles.text, { color: palette[700] }]}>
          {tpo.assetKey.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.text, { color: palette[700] }]}>
        {proximityLabel(tpo.proximity)} · {tpo.timeOfDay.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s.lg,
    paddingTop: s.lg,
    paddingBottom: s.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: {
    fontSize: 10,
    letterSpacing: 2.2,
    fontFamily: 'JetBrainsMono_400Regular',
  },
});
