// Variation picker — segmented control for switching home renderer.
// Three-way pill (Bento / Cinematic / Morph). Width fills its container,
// height fixed at 30 to live alongside header chevron.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PaletteSwatch } from '../theme';
import { VARIATIONS, type VariationId } from '../screens/variations/types';

export interface VariationPickerProps {
  readonly value: VariationId;
  readonly onChange: (id: VariationId) => void;
  readonly palette: PaletteSwatch;
}

export function VariationPicker({ value, onChange, palette }: VariationPickerProps): React.JSX.Element {
  return (
    <View style={[styles.row, { backgroundColor: palette[100], borderColor: palette[200] }]}>
      {VARIATIONS.map((v) => {
        const active = v.id === value;
        return (
          <Pressable
            key={v.id}
            accessibilityRole="button"
            accessibilityLabel={`${v.label} 변형`}
            accessibilityHint={v.description}
            accessibilityState={{ selected: active }}
            onPress={() => { if (!active) onChange(v.id); }}
            style={({ pressed }) => [
              styles.cell,
              active && { backgroundColor: palette.accent },
              pressed && !active && { opacity: 0.65 },
            ]}
            hitSlop={6}
          >
            <Text
              style={[
                styles.label,
                { color: active ? '#fff' : palette[700] },
              ]}
              numberOfLines={1}
            >
              {v.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 3,
    minHeight: 30,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.4,
    fontFamily: 'JetBrainsMono_400Regular',
  },
});
