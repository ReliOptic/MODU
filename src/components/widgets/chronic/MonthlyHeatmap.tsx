// 월간 히트맵 — 색 농도 4단계 (T-CH-04)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

export interface MonthlyHeatmapProps {
  palette: PaletteKey;
  /** 일별 강도. index = 일(1~31)-1. 0=없음, 1=약, 2=중, 3=강 */
  intensities: number[];
  /** 일수 (28~31) */
  daysInMonth?: number;
}

export function MonthlyHeatmap({ palette, intensities, daysInMonth = 30 }: MonthlyHeatmapProps) {
  const p = getPalette(palette);
  const colors = [
    'rgba(60,60,67,0.06)',
    p[100],
    p[300],
    p[500],
  ];
  const cells: number[] = [];
  for (let i = 0; i < daysInMonth; i++) cells.push(intensities[i] ?? 0);

  return (
    <Card>
      <Text style={styles.h}>월간 히트맵</Text>
      <View style={styles.grid}>
        {cells.map((v, i) => (
          <View
            key={i}
            style={[styles.cell, { backgroundColor: colors[Math.max(0, Math.min(3, v))] }]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>없음</Text>
        {colors.map((c, i) => (
          <View key={i} style={[styles.legendChip, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendLabel}>강</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 22, height: 22, borderRadius: 4 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  legendLabel: { ...typography.caption2, color: widgetTokens.textTertiary },
  legendChip: { width: 14, height: 14, borderRadius: 3 },
});
