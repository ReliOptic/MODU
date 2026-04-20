// Bento partner tile — accent fill, partner initial, sync status.
// Reference: BentoBlock kind='partner' in variation-bento.jsx.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';

export interface BentoPartnerTileProps {
  readonly palette: PaletteSwatch;
  readonly minHeight: number;
  readonly partnerInitial?: string;
  readonly syncEnabled?: boolean;
}

export function BentoPartnerTile({
  palette,
  minHeight,
  partnerInitial = '김',
  syncEnabled = true,
}: BentoPartnerTileProps): React.JSX.Element {
  return (
    <View style={[styles.tile, { backgroundColor: palette.accent, minHeight }]}>
      <Text style={styles.eyebrow}>파트너</Text>
      <View style={styles.avatar}>
        <Text style={[styles.initial, { color: palette.accent }]}>{partnerInitial}</Text>
      </View>
      <Text style={styles.status}>{syncEnabled ? '동기화 ON' : '동기화 OFF'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.85)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 20,
    // color set inline from palette to ensure white-on-gradient contrast
    color: '#FFFFFF',
  },
  status: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },
});
