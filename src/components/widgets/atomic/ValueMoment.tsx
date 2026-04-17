import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { typography, getPalette, PaletteKey } from '../../../theme';

export interface ValueMomentProps {
  palette: PaletteKey;
  label: string;
  value: number | string;
  unit?: string;
  target?: number;
  trend?: 'up' | 'down' | 'stable';
  onPress?: () => void;
}

/**
 * ValueMoment: 수치 추적을 위한 범용 모먼트.
 * 학업(공부시간), 의료(용량), 운동(거리) 등 모든 수치 데이터에 대응.
 */
export const ValueMoment: React.FC<ValueMomentProps> = ({
  palette: paletteKey,
  label,
  value,
  unit,
  target,
  trend,
  onPress,
}) => {
  const palette = getPalette(paletteKey);
  const progress = typeof value === 'number' && target ? Math.min(value / target, 1) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: palette[50] },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: palette[600] }]}>{label}</Text>
        {trend && (
          <Text style={[styles.trend, { color: palette[500] }]}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </Text>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: palette[900] }]}>{value}</Text>
        {unit && <Text style={[styles.unit, { color: palette[500] }]}>{unit}</Text>}
      </View>

      {progress !== null && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: palette.accent, width: `${progress * 100}%` },
            ]}
          />
        </View>
      )}

      {target && (
        <Text style={[styles.targetLabel, { color: palette[400] }]}>
          목표: {target}{unit}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  trend: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  value: {
    ...typography.displaySmall,
    fontWeight: '700',
    marginRight: 4,
  },
  unit: {
    ...typography.bodyMedium,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  targetLabel: {
    ...typography.bodySmall,
    textAlign: 'right',
  },
});
