import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, getPalette, PaletteKey } from '../../../theme';

export interface GlanceStat {
  label: string;
  value: string | number;
  subValue?: string;
}

export interface GlanceMomentProps {
  palette: PaletteKey;
  title: string;
  stats: GlanceStat[];
}

/**
 * GlanceMoment: 에셋의 주요 지표를 요약해 보여주는 범용 대시보드 모먼트.
 * 수치 요약, 상태 요약 등에 대응.
 */
export const GlanceMoment: React.FC<GlanceMomentProps> = ({
  palette: paletteKey,
  title,
  stats,
}) => {
  const palette = getPalette(paletteKey);

  return (
    <View style={[styles.container, { backgroundColor: palette[900] }]}>
      <Text style={[styles.title, { color: palette[100] }]}>{title}</Text>
      
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: palette[300] }]}>{stat.label}</Text>
            {stat.subValue && (
              <Text style={[styles.subValue, { color: palette.accent }]}>{stat.subValue}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
  },
  title: {
    ...typography.labelMedium,
    fontWeight: '600',
    marginBottom: 20,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '45%',
    marginBottom: 16,
  },
  statValue: {
    ...typography.displaySmall,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subValue: {
    ...typography.labelSmall,
    marginTop: 2,
    fontWeight: '700',
  },
});
