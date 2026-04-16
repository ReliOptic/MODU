// 비-home 탭의 임시 화면 — Calendar / Mood / Partner / Insight / Graph 등
// 외부 빌드에서는 "곧 만나요 · 알림 신청" 으로 노출 (개발 메시지 노출 금지)
// CPO Review §1.2 / 부록 반영.
import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { Card } from '../components/ui';
import { typography, widgetTokens, getPalette, PaletteKey } from '../theme';

export interface PlaceholderTabProps {
  tabLabel: string;
  palette: PaletteKey;
  /** override message — 개발 모드 디버그용 */
  message?: string;
}

const IS_DEV = process.env.EXPO_PUBLIC_DEV_MESSAGES === '1';

export function PlaceholderTab({ tabLabel, palette, message }: PlaceholderTabProps) {
  const p = getPalette(palette);
  const [requested, setRequested] = useState(false);

  const headline = IS_DEV
    ? message ?? '이 탭은 다음 단계에서 채워질 예정이에요.'
    : `${tabLabel} 챕터, 곧 만나요`;
  const sub = IS_DEV
    ? '홈 탭에서 핵심 위젯을 먼저 확인해보세요.'
    : '준비되는 즉시 알려드릴게요.';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        style={[styles.title, { color: p[500] }]}
        accessibilityRole="header"
      >
        {tabLabel}
      </Text>
      <Card>
        <Text style={styles.message}>{headline}</Text>
        <Text style={styles.hint}>{sub}</Text>

        {!IS_DEV && (
          <Pressable
            onPress={() => setRequested(true)}
            disabled={requested}
            accessibilityRole="button"
            accessibilityLabel={
              requested ? '알림 신청 완료' : `${tabLabel} 알림 신청`
            }
            accessibilityHint={
              requested ? undefined : '준비되면 알림으로 알려드립니다'
            }
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: requested ? 'rgba(60,60,67,0.08)' : p[500] },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={[
                styles.ctaLabel,
                { color: requested ? widgetTokens.textSecondary : '#FFFFFF' },
              ]}
            >
              {requested ? '신청됨 ✓' : '알림 신청하기'}
            </Text>
          </Pressable>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  title: { ...typography.title1, marginBottom: 14 },
  message: { ...typography.headline, color: widgetTokens.textPrimary, fontWeight: '600' },
  hint: { ...typography.subhead, color: widgetTokens.textSecondary, marginTop: 8 },
  cta: {
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    ...typography.subhead,
    fontWeight: '600',
  },
});
