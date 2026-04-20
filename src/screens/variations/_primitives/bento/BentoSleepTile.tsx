// Bento sleep tile — large duration stat + caption.
// Reference: BentoBlock kind='sleep' in variation-bento.jsx.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';

export interface BentoSleepTileProps {
  readonly palette: PaletteSwatch;
  readonly minHeight: number;
  readonly duration?: string;
  readonly caption?: string;
}

export function BentoSleepTile({
  palette,
  minHeight,
  duration = '7h 20m',
  caption = '평균보다 +22분',
}: BentoSleepTileProps): React.JSX.Element {
  return (
    <View style={[styles.tile, { backgroundColor: palette[50], minHeight }]}>
      <Text style={[styles.eyebrow, { color: palette[700] }]}>수면</Text>
      <Text style={[styles.stat, { color: palette[900] }]} numberOfLines={1}>
        {duration}
      </Text>
      <Text style={[styles.caption, { color: palette[700] }]}>{caption}</Text>
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
  stat: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -1,
  },
  caption: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 10,
  },
});
