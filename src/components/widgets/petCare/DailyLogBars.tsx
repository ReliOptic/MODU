// 산책/식욕/음수 가로 바 (T-PC-03)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

export interface DailyLogBarsProps {
  palette: PaletteKey;
  /** 0~1 비율 + 표시 텍스트 */
  walk: { value: number; label: string }; // {value:0.6, label:'30분'}
  appetite: { value: number; label: string };
  water: { value: number; label: string };
}

export function DailyLogBars({ palette, walk, appetite, water }: DailyLogBarsProps) {
  const items = [
    { name: '산책', ...walk },
    { name: '식욕', ...appetite },
    { name: '음수', ...water },
  ];
  const p = getPalette(palette);
  return (
    <Card>
      <Text style={styles.h}>오늘의 기록</Text>
      <View style={{ gap: 10 }}>
        {items.map((it) => (
          <View key={it.name}>
            <View style={styles.row}>
              <Text style={styles.name}>{it.name}</Text>
              <Text style={styles.label}>{it.label}</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(0, Math.min(1, it.value)) * 100}%` as `${number}%`,
                    backgroundColor: p[300],
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { ...typography.subhead, color: widgetTokens.textSecondary },
  label: { ...typography.subhead, fontWeight: '600', color: widgetTokens.textPrimary },
  track: {
    height: 8,
    backgroundColor: 'rgba(60,60,67,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});
