// 수의사 메모 + 다음 검진 (T-PC-04)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Badge } from '../../ui';
import { typography, widgetTokens, PaletteKey } from '../../../theme';

export interface VetMemoProps {
  palette: PaletteKey;
  notes: string;
  nextVisit: string; // "5/12 오전 10:30"
}

export function VetMemo({ palette, notes, nextVisit }: VetMemoProps) {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.h}>수의사 메모</Text>
        <Badge label={`다음 검진 · ${nextVisit}`} tone="accent" palette={palette} />
      </View>
      <Text style={styles.notes}>{notes}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' },
  h: { ...typography.headline, color: widgetTokens.textPrimary },
  notes: { ...typography.body, color: widgetTokens.textPrimary, lineHeight: 23 },
});
