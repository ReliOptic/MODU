// 치료 히스토리 — 4차→5차 (T-CC-05)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

export interface TreatmentSession {
  number: number;
  date: string;
  status: 'done' | 'today' | 'upcoming';
  notes?: string;
}

export interface TreatmentTimelineProps {
  palette: PaletteKey;
  sessions: TreatmentSession[];
}

export function TreatmentTimeline({ palette, sessions }: TreatmentTimelineProps) {
  const p = getPalette(palette);
  return (
    <Card>
      <Text style={styles.h}>치료 히스토리</Text>
      <View style={styles.row}>
        {sessions.map((s, i) => {
          const dotColor =
            s.status === 'done' ? p[300] : s.status === 'today' ? p[500] : 'rgba(60,60,67,0.18)';
          const isLast = i === sessions.length - 1;
          return (
            <React.Fragment key={s.number}>
              <View style={styles.node}>
                <View style={[styles.dot, { backgroundColor: dotColor }]}>
                  {s.status === 'today' && <View style={styles.ring} />}
                </View>
                <Text style={styles.label}>{s.number}차</Text>
                <Text style={styles.date}>{s.date}</Text>
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: 'rgba(60,60,67,0.12)' }]} />}
            </React.Fragment>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  node: { alignItems: 'center', minWidth: 48 },
  dot: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },
  label: { ...typography.subhead, fontWeight: '600', color: widgetTokens.textPrimary, marginTop: 6 },
  date: { ...typography.caption2, color: widgetTokens.textTertiary, marginTop: 2 },
  line: { flex: 1, height: 1, marginHorizontal: 4 },
});
