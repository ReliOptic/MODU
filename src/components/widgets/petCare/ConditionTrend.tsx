// 7일 컨디션 미니 그래프 (T-PC-05)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export interface ConditionTrendProps {
  palette: PaletteKey;
  /** 최근 7일 (가장 오래된 → 오늘). 0~1 비율. */
  values: number[];
}

export function ConditionTrend({ palette, values }: ConditionTrendProps) {
  const p = getPalette(palette);
  const padded = values.length === 7 ? values : padTo7(values);
  return (
    <Card>
      <Text style={styles.h}>7일 컨디션</Text>
      <View style={styles.row}>
        {padded.map((v, i) => {
          const isToday = i === padded.length - 1;
          return (
            <View key={i} style={styles.col}>
              <View style={styles.barWrap}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(8, v * 100)}%` as `${number}%`,
                      backgroundColor: isToday ? p.accent : p[200],
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, isToday && { color: p[500], fontWeight: '600' }]}>
                {DAY_LABELS[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function padTo7(v: number[]): number[] {
  const out = [...v];
  while (out.length < 7) out.unshift(0);
  return out.slice(-7);
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', height: 88 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 2 },
  barWrap: { width: 18, height: 64, justifyContent: 'flex-end' },
  bar: { width: 18, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  label: { ...typography.caption2, color: widgetTokens.textTertiary, marginTop: 6 },
});
