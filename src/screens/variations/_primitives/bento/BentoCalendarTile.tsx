// Bento calendar tile — 4-week dot grid.
// Reference: BentoBlock kind='calendar' in variation-bento.jsx.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';

export interface BentoCalendarTileProps {
  readonly palette: PaletteSwatch;
  readonly minHeight: number;
  /** 1-based day numbers that have events marked. */
  readonly eventDays?: ReadonlyArray<number>;
  /** 1-based day number to highlight as today. */
  readonly todayDay?: number;
}

const DEFAULT_EVENT_DAYS: ReadonlyArray<number> = [7, 11, 17, 23];
const DEFAULT_TODAY = 16;
const TOTAL_DAYS = 28;

export function BentoCalendarTile({
  palette,
  minHeight,
  eventDays = DEFAULT_EVENT_DAYS,
  todayDay = DEFAULT_TODAY,
}: BentoCalendarTileProps): React.JSX.Element {
  const eventSet = new Set(eventDays);

  return (
    <View style={[styles.tile, { backgroundColor: palette[50], minHeight }]}>
      <Text style={[styles.eyebrow, { color: palette[700] }]}>5월</Text>
      <View style={styles.grid}>
        {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
          const day = i + 1;
          const isToday = day === todayDay;
          const hasEvent = eventSet.has(day) && !isToday;
          return (
            <View
              key={day}
              style={[
                styles.cell,
                {
                  backgroundColor: isToday ? palette.accent : 'transparent',
                  borderColor: hasEvent ? palette.accent : palette[200],
                  borderWidth: hasEvent ? 1 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  { color: isToday ? '#FFFFFF' : palette[700] },
                ]}
              >
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 1.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 3,
  },
  cell: {
    width: '12.5%',
    aspectRatio: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
  },
});
