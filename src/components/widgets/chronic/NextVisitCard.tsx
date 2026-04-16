// 다음 진료 + 자동 요약
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Badge } from '../../ui';
import { typography, widgetTokens, PaletteKey } from '../../../theme';

export interface NextVisitCardProps {
  palette: PaletteKey;
  date: string; // "5/20 오후 2:00"
  doctor?: string;
  summary?: string;
}

export function NextVisitCard({ palette, date, doctor, summary }: NextVisitCardProps) {
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.h}>다음 진료</Text>
        <Badge label={date} tone="accent" palette={palette} />
      </View>
      {doctor && <Text style={styles.doctor}>{doctor}</Text>}
      {summary && <Text style={styles.summary}>{summary}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  h: { ...typography.headline, color: widgetTokens.textPrimary },
  doctor: { ...typography.subhead, color: widgetTokens.textSecondary, marginTop: 6 },
  summary: { ...typography.body, color: widgetTokens.textPrimary, marginTop: 8, lineHeight: 23 },
});
