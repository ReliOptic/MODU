// 주간 두통 강도 바 (T-CH-02, T-CH-03)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export interface WeeklyBarGraphProps {
  palette: PaletteKey;
  /** 7일치 severity 0-10 */
  values: number[];
  /** 0=오늘이 일요일, 6=토요일 — 오늘 인덱스 */
  todayIndex?: number;
}

export function WeeklyBarGraph({ palette, values, todayIndex = 6 }: WeeklyBarGraphProps) {
  const p = getPalette(palette);
  const max = 10;
  return (
    <Card>
      <Text style={styles.h}>주간 두통 강도</Text>
      <View style={styles.chart}>
        {values.map((v, i) => {
          const isToday = i === todayIndex;
          const h = Math.max(4, (v / max) * 100);
          return (
            <View key={i} style={styles.col}>
              <View style={styles.barWrap}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${h}%` as `${number}%`,
                      backgroundColor: isToday ? p.accent : p[200],
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, isToday && { color: p[500], fontWeight: '600' }]}>{DAYS[i]}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 12 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 110 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 2 },
  barWrap: { width: 22, height: 80, justifyContent: 'flex-end' },
  bar: { width: 22, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  label: { ...typography.caption2, color: widgetTokens.textTertiary, marginTop: 6 },
});
