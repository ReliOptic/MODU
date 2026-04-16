// 공통 Primary 이벤트 카드 — "다음 시술 · 09:00" 같은 최우선 이벤트
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrimaryCard, Badge } from '../../ui';
import { typography, PaletteKey } from '../../../theme';

export interface PrimaryEventCardProps {
  palette: PaletteKey;
  /** "배아 이식" 같은 이벤트명 */
  title: string;
  /** "09:00" 같은 시간 */
  timeLabel: string;
  /** "D-1" / "오늘" / "내일" 같은 상태 */
  countdown?: string;
  /** 보조 라벨 — 클리닉/약명 */
  subtitle?: string;
}

export function PrimaryEventCard({ palette, title, timeLabel, countdown, subtitle }: PrimaryEventCardProps) {
  return (
    <PrimaryCard palette={palette}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {countdown && <Badge label={countdown} tone="onPrimary" />}
      </View>
      <Text style={styles.time}>{timeLabel}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </PrimaryCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.title1, color: '#FFFFFF', flex: 1, marginRight: 8 },
  time: { ...typography.largeTitle, color: '#FFFFFF', marginTop: 2 },
  subtitle: { ...typography.subhead, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});
