// AI 트리거 분석 (T-CH-05) — "AI" 배지 + 상관관계 텍스트
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Badge } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

export interface TriggerFactor {
  name: string;
  /** -1 ~ 1 */
  correlation: number;
}

export interface TriggerAnalysisProps {
  palette: PaletteKey;
  factors: TriggerFactor[];
  summary?: string;
}

export function TriggerAnalysis({ palette, factors, summary }: TriggerAnalysisProps) {
  const p = getPalette(palette);
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.h}>트리거 분석</Text>
        <Badge label="AI" tone="accent" palette={palette} />
      </View>
      {summary && <Text style={styles.summary}>{summary}</Text>}
      <View style={styles.list}>
        {factors.map((f) => {
          const w = Math.min(1, Math.abs(f.correlation));
          return (
            <View key={f.name} style={styles.row}>
              <Text style={styles.factor}>{f.name}</Text>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${w * 100}%` as `${number}%`, backgroundColor: f.correlation > 0 ? p[500] : 'rgba(60,60,67,0.4)' },
                  ]}
                />
              </View>
              <Text style={[styles.value, { color: f.correlation > 0 ? p[500] : widgetTokens.textSecondary }]}>
                {f.correlation > 0 ? '+' : ''}{f.correlation.toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  h: { ...typography.headline, color: widgetTokens.textPrimary },
  summary: { ...typography.subhead, color: widgetTokens.textSecondary, marginBottom: 12 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factor: { ...typography.subhead, color: widgetTokens.textPrimary, width: 80 },
  barBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(60,60,67,0.08)', overflow: 'hidden' },
  barFill: { height: '100%' },
  value: { ...typography.footnote, fontVariant: ['tabular-nums'], width: 48, textAlign: 'right' },
});
