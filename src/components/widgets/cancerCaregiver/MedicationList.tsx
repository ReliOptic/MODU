// 환자 약 목록 (T-CC-06)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Separator } from '../../ui';
import { typography, widgetTokens } from '../../../theme';

export interface MedicationItem {
  name: string;
  schedule: string; // "아침/저녁"
  notes?: string;
}

export interface MedicationListProps {
  items: MedicationItem[];
}

export function MedicationList({ items }: MedicationListProps) {
  return (
    <Card>
      <Text style={styles.h}>복용 중인 약</Text>
      {items.map((m, i) => (
        <View key={m.name}>
          <View style={styles.row}>
            <View style={styles.text}>
              <Text style={styles.name}>{m.name}</Text>
              {m.notes && <Text style={styles.notes}>{m.notes}</Text>}
            </View>
            <Text style={styles.schedule}>{m.schedule}</Text>
          </View>
          {i < items.length - 1 && <Separator />}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  text: { flex: 1 },
  name: { ...typography.body, color: widgetTokens.textPrimary },
  notes: { ...typography.footnote, color: widgetTokens.textSecondary, marginTop: 2 },
  schedule: { ...typography.subhead, color: widgetTokens.textSecondary },
});
