// CalendarTab — month grid with tappable dates + bottom event sheet.
// No duplicate with HomeTab (calendar_mini removed from fertility home template).
import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { Asset, ScheduledEvent } from '../../types';
import { typography, getPalette } from '../../theme';

export interface CalendarTabProps {
  asset: Asset;
}

const CONTENT_STYLE = { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 } as const;
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface DayCellState {
  day: number;
  inMonth: boolean;
  date: Date;
  isToday: boolean;
  events: ScheduledEvent[];
}

function buildMonthGrid(month: Date, events: ScheduledEvent[]): DayCellState[] {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const startOffset = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const cells: DayCellState[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(y, m, i - startOffset + 1);
    cells.push({ day: d.getDate(), inMonth: false, date: d, isToday: false, events: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    const dayEvents = events.filter((e) => {
      const ed = new Date(e.at);
      return ed.getFullYear() === y && ed.getMonth() === m && ed.getDate() === d;
    });
    cells.push({
      day: d,
      inMonth: true,
      date,
      isToday:
        today.getFullYear() === y &&
        today.getMonth() === m &&
        today.getDate() === d,
      events: dayEvents,
    });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ day: d.getDate(), inMonth: false, date: d, isToday: false, events: [] });
  }
  return cells;
}

function formatDayLabel(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_LABELS[d.getDay()]})`;
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function CalendarTab({ asset }: CalendarTabProps) {
  const palette = getPalette(asset.palette);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<DayCellState | null>(null);

  const events = asset.events ?? [];

  const cells = useMemo(() => buildMonthGrid(cursor, events), [cursor, events]);

  const monthLabel = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;

  const prevMonth = useCallback(() => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }, []);
  const nextMonth = useCallback(() => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.at).getTime() >= now)
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
      .slice(0, 5);
  }, [events]);

  return (
    <>
      <ScrollView contentContainerStyle={CONTENT_STYLE}>
        <Text style={[styles.heading, { color: palette[500] }]}>달력</Text>

        <View style={[styles.monthBar, { backgroundColor: palette[50] }]}>
          <Pressable
            onPress={prevMonth}
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            hitSlop={12}
            style={({ pressed }) => [styles.monthBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.monthChev, { color: palette[500] }]}>‹</Text>
          </Pressable>
          <Text style={[styles.monthLabel, { color: palette[800] }]}>{monthLabel}</Text>
          <Pressable
            onPress={nextMonth}
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            hitSlop={12}
            style={({ pressed }) => [styles.monthBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.monthChev, { color: palette[500] }]}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekHeader}>
          {WEEKDAY_LABELS.map((w, i) => (
            <Text
              key={w}
              style={[
                styles.weekLabel,
                { color: i === 0 ? palette[500] : palette[400] },
              ]}
            >
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((c, i) => {
            const hasEvent = c.events.length > 0;
            return (
              <Pressable
                key={`${i}-${c.date.toISOString()}`}
                onPress={() => setSelected(c)}
                disabled={!c.inMonth}
                accessibilityRole="button"
                accessibilityLabel={
                  c.inMonth
                    ? `${c.day}일${hasEvent ? `, 일정 ${c.events.length}개` : ''}`
                    : ''
                }
                style={({ pressed }) => [
                  styles.cell,
                  c.isToday && { backgroundColor: palette[100] },
                  pressed && c.inMonth && { backgroundColor: palette[200] },
                ]}
              >
                <Text
                  style={[
                    styles.cellDay,
                    { color: c.inMonth ? palette[800] : 'rgba(0,0,0,0.18)' },
                    c.isToday && { color: palette[500], fontWeight: '700' },
                  ]}
                >
                  {c.day}
                </Text>
                {hasEvent && (
                  <View style={[styles.cellDot, { backgroundColor: palette[500] }]} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: palette[700] }]}>다가오는 일정</Text>
        {upcoming.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: palette[50] }]}>
            <Text style={[styles.emptyText, { color: palette[500] }]}>
              아직 등록된 일정이 없어요. 날짜를 눌러 추가할 곳을 확인하세요.
            </Text>
          </View>
        ) : (
          upcoming.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => {
                const d = new Date(e.at);
                setSelected({
                  day: d.getDate(),
                  inMonth: true,
                  date: d,
                  isToday: false,
                  events: events.filter(
                    (x) =>
                      new Date(x.at).toDateString() === d.toDateString()
                  ),
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={`${e.title} 자세히 보기`}
              style={({ pressed }) => [
                styles.upcomingRow,
                { backgroundColor: palette[50] },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.upcomingDot, { backgroundColor: palette[500] }]} />
              <View style={styles.upcomingBody}>
                <Text style={[styles.upcomingTitle, { color: palette[800] }]} numberOfLines={1}>
                  {e.title}
                </Text>
                <Text style={[styles.upcomingSub, { color: palette[500] }]}>
                  {formatDayLabel(new Date(e.at))} · {formatTime(e.at)}
                </Text>
              </View>
              <Text style={[styles.upcomingChev, { color: palette[400] }]}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <DaySheet
        cell={selected}
        onClose={() => setSelected(null)}
        palette={palette}
      />
    </>
  );
}

interface DaySheetProps {
  cell: DayCellState | null;
  onClose: () => void;
  palette: ReturnType<typeof getPalette>;
}

function DaySheet({ cell, onClose, palette }: DaySheetProps) {
  const visible = cell !== null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="닫기"
        style={styles.scrim}
      >
        {cell && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={styles.sheet}
          >
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: palette[800] }]}>
                {formatDayLabel(cell.date)}
              </Text>
              <Text style={[styles.sheetSub, { color: palette[400] }]}>
                {cell.events.length > 0 ? `${cell.events.length}개 일정` : '일정 없음'}
              </Text>
            </View>
            {cell.events.length === 0 ? (
              <Text style={[styles.sheetEmpty, { color: palette[500] }]}>
                이 날은 비어있어요. 다음 루틴은 formation 에서 AI 가 제안해요.
              </Text>
            ) : (
              cell.events.map((e) => (
                <View key={e.id} style={[styles.sheetEventRow, { borderColor: palette[100] }]}>
                  <Text style={[styles.sheetEventTime, { color: palette[500] }]}>
                    {formatTime(e.at)}
                  </Text>
                  <View style={styles.sheetEventBody}>
                    <Text style={[styles.sheetEventTitle, { color: palette[800] }]}>
                      {e.title}
                    </Text>
                    {e.subtitle ? (
                      <Text style={[styles.sheetEventSub, { color: palette[500] }]}>
                        {e.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="닫기"
              style={({ pressed }) => [
                styles.sheetClose,
                { backgroundColor: palette[100] },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.sheetCloseLabel, { color: palette[700] }]}>닫기</Text>
            </Pressable>
          </Animated.View>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.displayLarge, marginBottom: 14 },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 12,
  },
  monthBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthChev: { fontSize: 24, lineHeight: 26 },
  monthLabel: { ...typography.headline, fontWeight: '700' },
  weekHeader: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', ...typography.caption1, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  cellDay: { ...typography.subhead },
  cellDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  sectionTitle: { ...typography.headline, marginTop: 4, marginBottom: 10 },
  emptyCard: { borderRadius: 14, padding: 18 },
  emptyText: { ...typography.footnote, lineHeight: 18 },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    gap: 10,
  },
  upcomingDot: { width: 8, height: 8, borderRadius: 4 },
  upcomingBody: { flex: 1 },
  upcomingTitle: { ...typography.subhead, fontWeight: '600' },
  upcomingSub: { ...typography.footnote, marginTop: 2 },
  upcomingChev: { fontSize: 22, lineHeight: 24 },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(10,10,12,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  sheetHead: { marginBottom: 4 },
  sheetTitle: { ...typography.title1, fontWeight: '700' },
  sheetSub: { ...typography.footnote, marginTop: 2 },
  sheetEmpty: { ...typography.body, paddingVertical: 16, textAlign: 'center' },
  sheetEventRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetEventTime: { ...typography.subhead, fontWeight: '600', width: 62 },
  sheetEventBody: { flex: 1 },
  sheetEventTitle: { ...typography.subhead, fontWeight: '600' },
  sheetEventSub: { ...typography.footnote, marginTop: 2 },
  sheetClose: {
    marginTop: 8,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseLabel: { ...typography.subhead, fontWeight: '600' },
});
