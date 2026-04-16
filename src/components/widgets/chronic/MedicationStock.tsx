// 약 재고 + 리필 알림 (T-CH-06)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Badge, Separator } from '../../ui';
import { typography, widgetTokens, PaletteKey } from '../../../theme';

export interface MedicationStockItem {
  name: string;
  remainingDays: number;
  refillAlert?: boolean;
}

export interface MedicationStockProps {
  palette: PaletteKey;
  items: MedicationStockItem[];
}

export function MedicationStock({ palette, items }: MedicationStockProps) {
  return (
    <Card>
      <Text style={styles.h}>약 재고</Text>
      {items.map((it, i) => (
        <View key={it.name}>
          <View style={styles.row}>
            <Text style={styles.name}>{it.name}</Text>
            <View style={styles.right}>
              <Text style={[styles.days, it.remainingDays <= 5 && styles.daysWarn]}>
                {it.remainingDays}일 남음
              </Text>
              {it.refillAlert && <Badge label="리필 필요" tone="warning" />}
              {!it.refillAlert && it.remainingDays > 5 && (
                <Badge label="충분" tone="accent" palette={palette} />
              )}
            </View>
          </View>
          {i < items.length - 1 && <Separator />}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: 12 },
  name: { ...typography.body, color: widgetTokens.textPrimary, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  days: { ...typography.subhead, color: widgetTokens.textSecondary, fontVariant: ['tabular-nums'] },
  daysWarn: { color: '#9A4636', fontWeight: '600' },
});
