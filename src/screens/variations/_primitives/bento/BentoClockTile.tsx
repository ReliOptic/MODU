// Bento clock tile — D-count display.
// Reference: BentoBlock kind='clock' in variation-bento.jsx.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { proximityLabel } from '../../types';

export interface BentoClockTileProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly minHeight: number;
}

export function BentoClockTile({
  palette,
  tpo,
  minHeight,
}: BentoClockTileProps): React.JSX.Element {
  const dLabel = proximityLabel(tpo.proximity);
  const caption =
    tpo.proximity === 'dayof'
      ? '오늘 시술일'
      : tpo.proximity === 'after'
      ? '시술 완료'
      : '시술까지';

  return (
    <View style={[styles.tile, { backgroundColor: palette[50], minHeight }]}>
      <Text style={[styles.eyebrow, { color: palette[700] }]}>D-COUNT</Text>
      <Text style={[styles.dLabel, { color: palette.accent }]}>{dLabel}</Text>
      <Text style={[styles.caption, { color: palette[700] }]}>{caption}</Text>
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
  dLabel: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -1,
  },
  caption: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
  },
});
