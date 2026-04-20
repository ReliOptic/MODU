// Editorial primitive: EditorialRecoveryMetrics — post-procedure metrics table.
// Palette[50] card, hairline border, Fraunces values.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';
import { SectionLabel } from '../SectionLabel';
import { s, r } from '../../../../theme';

export interface EditorialRecoveryMetricsProps {
  readonly palette: PaletteSwatch;
  /** Each row: [key, value, sub] */
  readonly rows: ReadonlyArray<readonly [string, string, string]>;
}

export function EditorialRecoveryMetrics({
  palette,
  rows,
}: EditorialRecoveryMetricsProps): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <SectionLabel palette={palette}>다음 날의 몸</SectionLabel>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette[50],
            borderColor: palette[300],
            borderRadius: r.lg,
          },
        ]}
      >
        {rows.map(([key, value, sub], i) => (
          <View
            key={key}
            style={[
              styles.row,
              i < rows.length - 1
                ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette[300] }
                : null,
            ]}
          >
            <View style={styles.keyCell}>
              <Text style={[styles.keyText, { color: palette[700] }]}>{key}</Text>
            </View>
            <Text style={[styles.valueText, { color: palette[900] }]}>{value}</Text>
            <Text style={[styles.subText, { color: palette.accent }]}>{sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: s.md,
  },
  card: {
    marginHorizontal: s.xl,
    marginTop: s.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.lg,
    paddingVertical: s.lg,
    gap: s.md,
  },
  keyCell: {
    width: 90,
  },
  keyText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  valueText: {
    flex: 1,
    fontFamily: 'Fraunces_400Regular',
    fontSize: 24,
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  subText: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
    lineHeight: 14,
  },
});
