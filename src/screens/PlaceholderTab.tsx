// 비-home 탭의 임시 화면 — Calendar / Mood / Partner / Insight / Graph 등
// 각 위젯이 충분히 채워질 때까지 placeholder 카드 1개만 표시.
import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Card } from '../components/ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../theme';

export interface PlaceholderTabProps {
  tabLabel: string;
  palette: PaletteKey;
  message?: string;
}

export function PlaceholderTab({ tabLabel, palette, message }: PlaceholderTabProps) {
  const p = getPalette(palette);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: p[500] }]}>{tabLabel}</Text>
      <Card>
        <Text style={styles.message}>{message ?? `이 탭은 다음 단계에서 채워질 예정이에요.`}</Text>
        <Text style={styles.hint}>홈 탭에서 핵심 위젯을 먼저 확인해보세요.</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  title: { ...typography.title1, marginBottom: 14 },
  message: { ...typography.body, color: widgetTokens.textPrimary },
  hint: { ...typography.subhead, color: widgetTokens.textSecondary, marginTop: 8 },
});
