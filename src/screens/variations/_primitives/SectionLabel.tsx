// v2.1 — accent-line + label. Used as section header within a primitive.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../theme';
import { s } from '../../../theme';

export interface SectionLabelProps {
  readonly palette: PaletteSwatch;
  readonly children: React.ReactNode;
  /** When true, renders with white line + white@0.85 text (for use on dark gradient cards). */
  readonly light?: boolean;
}

export function SectionLabel({ palette, children, light = false }: SectionLabelProps): React.JSX.Element {
  const lineColor = light ? 'rgba(255,255,255,0.6)' : palette.accent;
  const textColor = light ? 'rgba(255,255,255,0.85)' : palette.accent;
  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: lineColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: s.lg,
    paddingVertical: s.md,
  },
  line: { width: 24, height: 1 },
  text: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'JetBrainsMono_400Regular',
  },
});
