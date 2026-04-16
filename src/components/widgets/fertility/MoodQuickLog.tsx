// 감정 퀵로그 — 4 이모지 토글 (T-FT-06)
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

const EMOJIS = [
  { id: 'calm', emoji: '😌', label: '평온' },
  { id: 'tired', emoji: '😮‍💨', label: '지침' },
  { id: 'down', emoji: '😢', label: '울적' },
  { id: 'hopeful', emoji: '🌱', label: '기대' },
];

export interface MoodQuickLogProps {
  palette: PaletteKey;
  onLog?: (id: string) => void;
}

export function MoodQuickLog({ palette, onLog }: MoodQuickLogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const p = getPalette(palette);
  return (
    <Card>
      <Text style={styles.h}>오늘 마음은 어때요?</Text>
      <View style={styles.row}>
        {EMOJIS.map((e) => {
          const active = selected === e.id;
          return (
            <Pressable
              key={e.id}
              onPress={() => {
                setSelected(active ? null : e.id);
                onLog?.(e.id);
              }}
              style={({ pressed }) => [
                styles.cell,
                active && { backgroundColor: p[100], borderColor: p[300] },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.emoji}>{e.emoji}</Text>
              <Text style={[styles.label, active && { color: p[500], fontWeight: '600' }]}>{e.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cell: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(60,60,67,0.06)',
    alignItems: 'center',
  },
  emoji: { fontSize: 28 },
  label: { ...typography.footnote, color: widgetTokens.textSecondary, marginTop: 4 },
});
