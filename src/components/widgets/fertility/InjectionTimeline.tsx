// 주사 스케줄 타임라인 — 완료=세이지닷+완료✓, 예정=블러섬닷+예정 (T-FT-04, T-FT-05)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Badge, Separator } from '../../ui';
import { typography, widgetTokens, palettes } from '../../../theme';

export interface InjectionItem {
  time: string; // "09:00"
  drug: string; // "FSH"
  site?: string; // "복부"
  status: 'done' | 'upcoming' | 'now';
}

export interface InjectionTimelineProps {
  items: InjectionItem[];
}

export function InjectionTimeline({ items }: InjectionTimelineProps) {
  return (
    <Card>
      <Text style={styles.h}>주사 타임라인</Text>
      {items.map((it, i) => (
        <View key={i}>
          <View style={styles.row}>
            <View style={[styles.dot, dotStyle(it.status)]} />
            <View style={styles.text}>
              <Text style={styles.time}>{it.time}</Text>
              <Text style={styles.drug}>{it.drug}{it.site ? `  ·  ${it.site}` : ''}</Text>
            </View>
            <Badge
              label={statusLabel(it.status)}
              tone={it.status === 'done' ? 'success' : 'warning'}
            />
          </View>
          {i < items.length - 1 && <Separator inset={26} />}
        </View>
      ))}
    </Card>
  );
}

function dotStyle(s: InjectionItem['status']) {
  switch (s) {
    case 'done':
      return { backgroundColor: palettes.sage[500] };
    case 'upcoming':
      return { backgroundColor: palettes.blossom[300] };
    case 'now':
      return { backgroundColor: palettes.dawn[500] };
  }
}

function statusLabel(s: InjectionItem['status']) {
  return s === 'done' ? '완료 ✓' : s === 'now' ? '지금' : '예정';
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  text: { flex: 1 },
  time: { ...typography.headline, color: widgetTokens.textPrimary },
  drug: { ...typography.footnote, color: widgetTokens.textSecondary, marginTop: 1 },
});
