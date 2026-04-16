// 풀 캘린더 — 미니와 동일 데이터 형, 셀 크기 큼. 선택 가능.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from '../../ui';
import { typography, getPalette, PaletteKey, widgetTokens } from '../../../theme';

const WEEKS = ['일', '월', '화', '수', '목', '금', '토'];

export interface FullCalendarDot {
  day: number;
  color: string;
}

export interface CalendarFullViewProps {
  palette: PaletteKey;
  month?: string;
  today?: number;
  dots?: FullCalendarDot[];
  onSelectDay?: (day: number) => void;
}

export function CalendarFullView({ palette, month, today, dots = [], onSelectDay }: CalendarFullViewProps) {
  const p = getPalette(palette);
  const [selected, setSelected] = useState<number | null>(null);
  const meta = useMemo(() => buildMeta(month), [month]);
  const todayDay = today ?? new Date().getDate();

  const cells: Array<number | null> = [];
  for (let i = 0; i < meta.firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= meta.daysInMonth; d++) cells.push(d);

  const dotMap = new Map<number, string[]>();
  for (const d of dots) {
    if (!dotMap.has(d.day)) dotMap.set(d.day, []);
    dotMap.get(d.day)!.push(d.color);
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.monthLabel}>{meta.monthLabel}</Text>
        <Text style={styles.yearLabel}>{meta.year}</Text>
      </View>
      <View style={styles.weekRow}>
        {WEEKS.map((w) => (
          <Text key={w} style={styles.weekLabel}>{w}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          const isToday = d === todayDay;
          const isSelected = d === selected;
          const dotColors = d ? (dotMap.get(d) ?? []) : [];
          return (
            <Pressable
              key={i}
              onPress={() => {
                if (d == null) return;
                setSelected(d);
                onSelectDay?.(d);
              }}
              style={styles.cell}
            >
              {d != null && (
                <>
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && { backgroundColor: p.accent },
                      isSelected && !isToday && { backgroundColor: p[100] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        isToday && { color: '#FFFFFF', fontWeight: '700' },
                        isSelected && !isToday && { color: p[500], fontWeight: '600' },
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                  <View style={styles.dotRow}>
                    {dotColors.slice(0, 3).map((c, idx) => (
                      <View key={idx} style={[styles.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function buildMeta(monthIso?: string) {
  const d = monthIso ? new Date(`${monthIso}-01T00:00:00Z`) : new Date();
  const year = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return {
    year,
    monthIdx: m,
    daysInMonth: new Date(year, m + 1, 0).getDate(),
    firstDayOfWeek: new Date(year, m, 1).getDay(),
    monthLabel: `${m + 1}월`,
  };
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 },
  monthLabel: { ...typography.title1, color: widgetTokens.textPrimary },
  yearLabel: { ...typography.footnote, color: widgetTokens.textSecondary },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: { ...typography.caption1, color: widgetTokens.textTertiary, flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 6 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { ...typography.body, color: widgetTokens.textPrimary },
  dotRow: { flexDirection: 'row', marginTop: 3, gap: 3, height: 5 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
