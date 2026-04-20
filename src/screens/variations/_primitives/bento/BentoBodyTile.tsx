// Bento body/condition tile — 7-column opacity-scaled bar chart.
// Reference: BentoBlock kind='body' in variation-bento.jsx.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';
import { CONDITION_BAR_VALUES } from '../../fertility/bentoData';

export interface BentoBodyTileProps {
  readonly palette: PaletteSwatch;
  readonly minHeight: number;
}

export function BentoBodyTile({ palette, minHeight }: BentoBodyTileProps): React.JSX.Element {
  return (
    <View style={[styles.tile, { backgroundColor: palette[50], minHeight }]}>
      <Text style={[styles.eyebrow, { color: palette[700] }]}>컨디션</Text>
      <View style={styles.bars}>
        {CONDITION_BAR_VALUES.map((v, i) => {
          const opacity = 0.3 + v * 0.7;
          return (
            <View
              key={`body-bar-${i}`}
              style={[
                styles.bar,
                {
                  backgroundColor: palette.accent,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.caption, { color: palette[700] }]}>점진적 안정</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
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
  bars: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    height: 34,
    alignItems: 'flex-end',
  },
  bar: {
    flex: 1,
    height: 34,
    borderRadius: 2,
  },
  caption: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 10,
    marginTop: 8,
  },
});
