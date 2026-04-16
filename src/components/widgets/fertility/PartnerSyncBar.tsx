// 파트너 동기화 바 — 이름 + ON 상태 (T-FT-07)
import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Card, Badge } from '../../ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../../theme';

export interface PartnerSyncBarProps {
  palette: PaletteKey;
  partnerName: string;
  syncEnabled: boolean;
  onToggle?: (next: boolean) => void;
}

export function PartnerSyncBar({ palette, partnerName, syncEnabled, onToggle }: PartnerSyncBarProps) {
  const p = getPalette(palette);
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.title}>{partnerName}</Text>
          <Badge
            label={syncEnabled ? '동기화 ON' : '동기화 OFF'}
            tone={syncEnabled ? 'accent' : 'neutral'}
            palette={palette}
            style={{ marginTop: 6 }}
          />
        </View>
        <Switch
          value={syncEnabled}
          onValueChange={onToggle}
          trackColor={{ true: p[300], false: 'rgba(60,60,67,0.18)' }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor={'rgba(60,60,67,0.18)'}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flex: 1 },
  title: { ...typography.headline, color: widgetTokens.textPrimary },
});
