// Bento mood tile — 4 mood swatches with label.
// Reference: BentoBlock kind='mood' in variation-bento.jsx.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';

export interface BentoMoodTileProps {
  readonly palette: PaletteSwatch;
  readonly minHeight: number;
}

const MOOD_LABELS = ['평온', '설렘', '불안', '피곤'] as const;
const DEFAULT_SELECTED = 1;

export function BentoMoodTile({ palette, minHeight }: BentoMoodTileProps): React.JSX.Element {
  return (
    <View style={[styles.tile, { backgroundColor: palette[50], minHeight }]}>
      <Text style={[styles.eyebrow, { color: palette[700] }]}>지금 감정</Text>
      <View style={styles.swatchRow}>
        {MOOD_LABELS.map((label, i) => {
          const selected = i === DEFAULT_SELECTED;
          return (
            <View
              key={label}
              style={[
                styles.swatch,
                {
                  backgroundColor: selected ? palette.accent : palette[200],
                  opacity: selected ? 1 : 0.6,
                },
              ]}
            >
              <Text
                style={[
                  styles.swatchText,
                  { color: selected ? '#FFFFFF' : palette[700] },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.caption, { color: palette[700] }]}>2시간 전 기록</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 1.8,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  swatch: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
  },
  caption: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 10,
    marginTop: 8,
  },
});
