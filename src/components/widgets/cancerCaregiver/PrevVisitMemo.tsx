// 지난 회차 메모 — 날짜 배지 + 메모 (T-CC-04)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Badge } from '../../ui';
import { typography, widgetTokens, PaletteKey } from '../../../theme';

export interface PrevVisitMemoProps {
  palette: PaletteKey;
  date: string; // "4/3"
  notes: string;
  medicationChanges?: string;
}

export function PrevVisitMemo({ palette, date, notes, medicationChanges }: PrevVisitMemoProps) {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.h}>지난 회차 메모</Text>
        <Badge label={date} tone="accent" palette={palette} />
      </View>
      <Text style={styles.notes}>{notes}</Text>
      {medicationChanges && (
        <View style={styles.medRow}>
          <Text style={styles.medLabel}>약 변경</Text>
          <Text style={styles.medValue}>{medicationChanges}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  h: { ...typography.headline, color: widgetTokens.textPrimary },
  notes: { ...typography.body, color: widgetTokens.textPrimary, lineHeight: 23 },
  medRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  medLabel: { ...typography.footnote, color: widgetTokens.textSecondary },
  medValue: { ...typography.footnote, color: widgetTokens.textPrimary, flex: 1 },
});
