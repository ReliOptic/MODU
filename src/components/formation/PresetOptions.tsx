// 프리셋 선택지 — 1~4개 둥근 칩 (가로 wrap)
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PresetOption } from '../../types';
import { typography, getPalette, PaletteKey, widgetTokens } from '../../theme';

export interface PresetOptionsProps {
  options: PresetOption[];
  onSelect: (option: PresetOption) => void;
  palette?: PaletteKey;
  /** 선택 중 lock (전송 직후 중복 입력 방지) */
  disabled?: boolean;
}

export function PresetOptions({ options, onSelect, palette = 'dawn', disabled }: PresetOptionsProps) {
  const p = getPalette(palette);
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Pressable
          key={o.id}
          disabled={disabled}
          onPress={() => onSelect(o)}
          style={({ pressed }) => [
            styles.chip,
            { borderColor: p[200] },
            pressed && { backgroundColor: p[50] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={o.label}
        >
          <Text style={[styles.label, { color: widgetTokens.textPrimary }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  label: {
    ...typography.callout,
  },
});
