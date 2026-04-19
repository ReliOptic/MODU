// v2.1 — accent-line + label. Used as section header within a primitive.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../theme';
import { s } from '../../../theme';

export interface SectionLabelProps {
  readonly palette: PaletteSwatch;
  readonly children: React.ReactNode;
}

export function SectionLabel({ palette, children }: SectionLabelProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: palette.accent }]} />
      <Text style={[styles.text, { color: palette.accent }]}>{children}</Text>
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
