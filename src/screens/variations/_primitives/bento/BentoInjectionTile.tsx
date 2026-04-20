// Bento injection tile — 7-day bar chart with day labels and status line.
// Reference: BentoBlock kind='injection' in variation-bento.jsx.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';
import { INJECTION_BAR_HEIGHTS, INJECTION_DAY_LABELS } from '../../fertility/bentoData';

export interface BentoInjectionTileProps {
  readonly palette: PaletteSwatch;
  readonly minHeight: number;
}

const COMPLETED_COUNT = 5;
const TOTAL_COUNT = 7;

export function BentoInjectionTile({
  palette,
  minHeight,
}: BentoInjectionTileProps): React.JSX.Element {
  return (
    <View style={[styles.tile, { backgroundColor: palette[50], minHeight }]}>
      <Text style={[styles.eyebrow, { color: palette[700] }]}>주사 타임라인</Text>
      <View style={styles.bars}>
        {INJECTION_BAR_HEIGHTS.map((v, i) => {
          const filled = i < COMPLETED_COUNT;
          const barHeight = Math.max(4, Math.round(v * 56));
          return (
            <View key={INJECTION_DAY_LABELS[i]} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: filled ? palette.accent : palette[200],
                  },
                ]}
              />
              <Text style={[styles.dayLabel, { color: palette[700] }]}>
                {INJECTION_DAY_LABELS[i]}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.status, { color: palette[900] }]}>
        <Text style={{ color: palette.accent, fontFamily: 'Pretendard_700Bold' }}>
          {COMPLETED_COUNT}/{TOTAL_COUNT} 완료
        </Text>
        {' · 오늘은 없어요'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 1.8,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    marginTop: 10,
    height: 72,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
  },
  dayLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
  },
  status: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
    marginTop: 10,
  },
});
