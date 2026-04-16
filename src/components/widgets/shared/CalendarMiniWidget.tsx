// 미니 달력 — 5x6 그리드 + 컬러 닷
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../ui';
import { typography, getPalette, PaletteKey, widgetTokens } from '../../../theme';

export interface CalendarDot {
  /** 1~31 */
  day: number;
  /** dot 색상 (HEX 또는 rgba) */
  color: string;
}

export interface CalendarMiniWidgetProps {
  palette: PaletteKey;
  /** ISO month string e.g. '2026-05' (없으면 현재 월) */
  month?: string;
  dots?: CalendarDot[];
  /** 오늘 날짜 (없으면 현재) */
  today?: number;
}

const WEEKS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarMiniWidget({ palette, month, dots = [], today }: CalendarMiniWidgetProps) {
  const p = getPalette(palette);
  const { year, monthIdx, daysInMonth, firstDayOfWeek, monthLabel } = useMemo(() => {
    const d = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const fdow = new Date(y, m, 1).getDay();
    return { year: y, monthIdx: m, daysInMonth: dim, firstDayOfWeek: fdow, monthLabel: `${m + 1}월` };
  }, [month]);
  const todayDay = today ?? new Date().getDate();

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dotMap = new Map<number, string[]>();
  for (const d of dots) {
    if (!dotMap.has(d.day)) dotMap.set(d.day, []);
    dotMap.get(d.day)!.push(d.color);
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Text style={styles.yearLabel}>{year}</Text>
      </View>
      <View style={styles.weekRow}>
        {WEEKS.map((w) => (
          <Text key={w} style={styles.weekLabel}>{w}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          const isToday = d === todayDay;
          const dotColors = d ? (dotMap.get(d) ?? []) : [];
          return (
            <View key={i} style={styles.cell}>
              {d != null && (
                <>
                  <View style={[styles.dayCircle, isToday && { backgroundColor: p.accent }]}>
                    <Text style={[styles.dayLabel, isToday && { color: '#FFFFFF', fontWeight: '700' }]}>{d}</Text>
                  </View>
                  <View style={styles.dotRow}>
                    {dotColors.slice(0, 3).map((c, idx) => (
                      <View key={idx} style={[styles.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>
      {/* monthIdx 변수는 빌드 silence */}
      <View style={{ height: 0 }}>{monthIdx >= 0 ? null : null}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 },
  monthLabel: { ...typography.headline, color: widgetTokens.textPrimary },
  yearLabel: { ...typography.footnote, color: widgetTokens.textSecondary },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { ...typography.caption2, color: widgetTokens.textTertiary, flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dayCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { ...typography.subhead, color: widgetTokens.textPrimary },
  dotRow: { flexDirection: 'row', marginTop: 2, gap: 2, height: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
