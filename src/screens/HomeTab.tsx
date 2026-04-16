// 홈 탭 — 위젯 리스트 (Phase 5/6에서 동적 순서로 확장)
// 지금은 현재 에셋의 widgets[]를 defaultPriority 정렬해서 placeholder 렌더.
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import type { Asset } from '../types';
import { typography, widgetTokens, getPalette } from '../theme';
import { Card, PrimaryCard } from '../components/ui';

export interface HomeTabProps {
  asset: Asset;
}

export function HomeTab({ asset }: HomeTabProps) {
  const homeWidgets = useMemo(
    () =>
      asset.widgets
        .filter((w) => (w.tab ?? 'home') === 'home')
        .sort((a, b) => b.defaultPriority - a.defaultPriority),
    [asset]
  );
  const palette = getPalette(asset.palette);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.greeting, { color: palette[500] }]}>{getGreeting(asset.displayName)}</Text>
      {homeWidgets.map((w) => (
        <View key={w.type} style={styles.slot}>
          {w.type.startsWith('primary_') ? (
            <PrimaryCard palette={asset.palette}>
              <Text style={[styles.primaryLabel, { color: '#FFFFFF' }]}>{labelFor(w.type)}</Text>
              <Text style={[styles.primaryHint, { color: 'rgba(255,255,255,0.85)' }]}>
                placeholder · phase 5에서 실제 위젯으로 교체
              </Text>
            </PrimaryCard>
          ) : (
            <Card>
              <Text style={styles.cardLabel}>{labelFor(w.type)}</Text>
              <Text style={styles.cardHint}>priority {w.defaultPriority}</Text>
            </Card>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function labelFor(type: string): string {
  const map: Record<string, string> = {
    primary_event: '다음 이벤트',
    primary_medication: '다음 약 복용',
    primary_condition: '오늘 컨디션',
    calendar_mini: '이번 달',
    injection_timeline: '주사 타임라인',
    mood_quicklog: '감정 기록',
    partner_sync: '파트너 동기화',
    question_checklist: '진료 시 물어볼 것',
    prev_visit_memo: '지난 회차 메모',
    treatment_timeline: '치료 히스토리',
    medication_list: '복용 약',
    pet_profile: '반려동물 프로필',
    daily_log_bars: '오늘의 기록',
    vet_memo: '수의사 메모',
    condition_trend: '7일 컨디션',
    weekly_bar_graph: '주간 그래프',
    monthly_heatmap: '월간 히트맵',
    trigger_analysis: '트리거 분석 (AI)',
    next_visit: '다음 진료',
    medication_stock: '약 재고',
  };
  return map[type] ?? type;
}

function getGreeting(displayName: string): string {
  return `${displayName}, 오늘도 함께해요.`;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  greeting: {
    ...typography.displayLarge,
    marginBottom: 16,
  },
  slot: {
    marginBottom: 12,
  },
  primaryLabel: {
    ...typography.title1,
  },
  primaryHint: {
    ...typography.subhead,
    marginTop: 4,
  },
  cardLabel: {
    ...typography.headline,
    color: widgetTokens.textPrimary,
  },
  cardHint: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
    marginTop: 4,
  },
});
