// 반려동물 프로필 (T-PC-01) — 이모지·이름·종·나이·체중·상태뱃지
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Badge } from '../../ui';
import { typography, widgetTokens, PaletteKey } from '../../../theme';

export interface PetProfileCardProps {
  palette: PaletteKey;
  emoji: string; // "🐶"
  name: string;
  species: string; // "포메라니안"
  age: string; // "9살"
  weight: string; // "4.2kg"
  conditions?: string[]; // ["관절염"]
}

export function PetProfileCard({ palette, emoji, name, species, age, weight, conditions = [] }: PetProfileCardProps) {
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {species} · {age} · {weight}
          </Text>
          {conditions.length > 0 && (
            <View style={styles.badgeRow}>
              {conditions.map((c) => (
                <Badge key={c} label={c} tone="accent" palette={palette} />
              ))}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emoji: { fontSize: 44 },
  info: { flex: 1 },
  name: { ...typography.title1, color: widgetTokens.textPrimary },
  meta: { ...typography.subhead, color: widgetTokens.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
});
