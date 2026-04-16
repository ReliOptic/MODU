// 진료 시 물어볼 것 — 토글 체크리스트 (T-CC-02, T-CC-03)
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card, Separator } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

export interface ChecklistItem {
  id: string;
  text: string;
  checked?: boolean;
}

export interface QuestionChecklistProps {
  palette: PaletteKey;
  items: ChecklistItem[];
  onToggle?: (id: string, next: boolean) => void;
}

export function QuestionChecklist({ palette, items: initial, onToggle }: QuestionChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initial);
  useEffect(() => setItems(initial), [initial]);
  const p = getPalette(palette);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next = !it.checked;
        onToggle?.(id, next);
        return { ...it, checked: next };
      })
    );
  };

  return (
    <Card>
      <Text style={styles.h}>진료 시 꼭 물어볼 것</Text>
      {items.map((it, i) => {
        const checked = !!it.checked;
        return (
          <View key={it.id}>
            <Pressable
              onPress={() => toggle(it.id)}
              style={({ pressed }) => [
                styles.row,
                checked && { backgroundColor: p[100] },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.box, { borderColor: p[300] }, checked && { backgroundColor: p[500], borderColor: p[500] }]}>
                {checked && <Text style={styles.check}>✓</Text>}
              </View>
              <Text style={[styles.text, checked && { color: p[500], textDecorationLine: 'line-through' }]} numberOfLines={2}>
                {it.text}
              </Text>
            </Pressable>
            {i < items.length - 1 && <Separator inset={36} />}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.headline, color: widgetTokens.textPrimary, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, lineHeight: 16 },
  text: { ...typography.body, color: widgetTokens.textPrimary, flex: 1 },
});
