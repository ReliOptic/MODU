// 범례 — 주사/병원/감정 색상 매핑
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../ui';
import { typography, widgetTokens, palettes } from '../../../theme';

const ITEMS = [
  { label: '주사', color: palettes.blossom[300] },
  { label: '병원', color: palettes.mist[300] },
  { label: '감정', color: palettes.sage[300] },
];

export function CalendarLegend() {
  return (
    <Card>
      <Text style={styles.h}>범례</Text>
      <View style={styles.row}>
        {ITEMS.map((it) => (
          <View key={it.label} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: it.color }]} />
            <Text style={styles.label}>{it.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...typography.subhead, color: widgetTokens.textSecondary },
});
