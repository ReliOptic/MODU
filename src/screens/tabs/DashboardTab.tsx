// DashboardTab — chronic 에셋의 'dashboard' 탭
// 지표 요약 + 다음 진료 + 약 재고 + 트리거 분석
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import type { Asset } from '../../types';
import { typography, getPalette, widgetTokens } from '../../theme';
import {
  NextVisitCard,
  MedicationStock,
  TriggerAnalysis,
} from '../../components/widgets';
import { chronicMock } from '../../data/mock/widgetData';

export interface DashboardTabProps {
  asset: Asset;
}

const CONTENT_STYLE = {
  paddingHorizontal: 16,
  paddingBottom: 120,
  paddingTop: 4,
} as const;

interface StatCard {
  label: string;
  value: string;
  trend: string;
}

const STAT_CARDS: StatCard[] = [
  { label: '이번 주 발작 수', value: '3', trend: '-1' },
  { label: '기록 일수', value: '6', trend: '+2' },
  { label: '복약 순응도', value: '92%', trend: '+4%' },
  { label: '평균 수면', value: '6.5시간', trend: '-0.3' },
];

export function DashboardTab({ asset }: DashboardTabProps) {
  const palette = getPalette(asset.palette);

  const nextVisitData = chronicMock.next_visit ?? {
    date: '4월 29일',
    doctor: '김○○ 내과',
    summary: '정기검진',
  };

  const medicationItems = chronicMock.medication_stock?.items ?? [
    { name: '토피라메이트', remainingDays: 12 },
    { name: '마그네슘', remainingDays: 7 },
  ];

  const triggerFactors = chronicMock.trigger_analysis?.factors ?? [
    { name: '수면부족', correlation: 0.62 },
    { name: '스트레스', correlation: 0.48 },
    { name: '날씨', correlation: 0.31 },
  ];

  const triggerSummary =
    chronicMock.trigger_analysis?.summary ??
    '충분한 수면이 가장 큰 보호 요인이에요.';

  return (
    <ScrollView contentContainerStyle={CONTENT_STYLE}>
      <Text style={[styles.heading, { color: palette[500] }]}>대시보드</Text>

      <View style={styles.grid}>
        {STAT_CARDS.map((card) => {
          const isNegativeTrend = card.trend.startsWith('-');
          const trendColor = isNegativeTrend ? '#C14B73' : palette[500];
          return (
            <View
              key={card.label}
              style={[styles.statCard, { backgroundColor: palette[50] }]}
            >
              <Text style={[styles.statValue, { color: palette[700] }]}>
                {card.value}
              </Text>
              <Text style={[styles.statTrend, { color: trendColor }]}>
                {card.trend}
              </Text>
              <Text style={[styles.statLabel, { color: widgetTokens.textSecondary }]}>
                {card.label}
              </Text>
            </View>
          );
        })}
      </View>

      <NextVisitCard
        palette={asset.palette}
        date={nextVisitData.date}
        doctor={nextVisitData.doctor}
        summary={nextVisitData.summary}
      />

      <MedicationStock
        palette={asset.palette}
        items={medicationItems}
      />

      <TriggerAnalysis
        palette={asset.palette}
        factors={triggerFactors}
        summary={triggerSummary}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.displayLarge,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 14,
    padding: 16,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  statValue: {
    ...typography.displaySmall,
    fontWeight: '700',
  },
  statTrend: {
    ...typography.subhead,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.footnote,
    marginTop: 4,
  },
});
