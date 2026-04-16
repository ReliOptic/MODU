// 프리셋 선택지 — Claude UI 스타일 numbered list
// 1. 옵션 A     ›
// 2. 옵션 B     ›
// 3. 옵션 C     ›
// 4. 옵션 D     ›
// 자유입력은 부모 컴포넌트에서 별도 (FreeTextInput "기타" 자리).
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PresetOption } from '../../types';
import { typography, getPalette, PaletteKey, widgetTokens } from '../../theme';

export interface PresetOptionsProps {
  options: PresetOption[];
  onSelect: (option: PresetOption) => void;
  palette?: PaletteKey;
  disabled?: boolean;
}

export function PresetOptions({ options, onSelect, palette = 'dawn', disabled }: PresetOptionsProps) {
  const p = getPalette(palette);
  return (
    <View style={styles.list}>
      {options.map((o, i) => (
        <Pressable
          key={o.id}
          disabled={disabled}
          onPress={() => onSelect(o)}
          style={({ pressed }) => [
            styles.row,
            { borderColor: p[200] },
            pressed && { backgroundColor: p[50], borderColor: p[300] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${i + 1}. ${o.label}`}
        >
          <View style={[styles.numberBadge, { backgroundColor: p[100] }]}>
            <Text style={[styles.numberText, { color: p[500] }]}>{i + 1}</Text>
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {o.label}
          </Text>
          <Text style={[styles.chevron, { color: p[300] }]}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
    minHeight: 56,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...typography.subhead,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    ...typography.body,
    color: widgetTokens.textPrimary,
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 22,
    paddingLeft: 4,
  },
});
