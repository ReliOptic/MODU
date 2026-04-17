// GraphTab — chronic 에셋의 'graph' 탭
// 주간 바 그래프 + 컨디션 추이 + 패턴 분석 카드 + 월간 히트맵
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import type { Asset } from '../../types';
import { typography, getPalette, widgetTokens } from '../../theme';
import {
  WeeklyBarGraph,
  MonthlyHeatmap,
} from '../../components/widgets';
import { ConditionTrend } from '../../components/widgets/petCare/ConditionTrend';
import { chronicMock } from '../../data/mock/widgetData';

export interface GraphTabProps {
  asset: Asset;
}

const CONTENT_STYLE = {
  paddingHorizontal: 16,
  paddingBottom: 120,
  paddingTop: 4,
} as const;

const MONTHLY_FALLBACK = Array.from({ length: 30 }, (_, i) => (i * 7 + 3) % 5);

export function GraphTab({ asset }: GraphTabProps) {
  const palette = getPalette(asset.palette);

  const weeklyValues: number[] =
    chronicMock.weekly_bar_graph?.values ?? [42, 38, 65, 55, 30, 48, 72];
  const todayIndex = 6;

  const conditionValues: number[] = [0.3, 0.4, 0.2, 0.5, 0.3, 0.4, 0.3, 0.2, 0.4, 0.5, 0.3, 0.2];

  const monthlyIntensities: number[] =
    chronicMock.monthly_heatmap?.intensities ?? MONTHLY_FALLBACK;

  return (
    <ScrollView contentContainerStyle={CONTENT_STYLE}>
      <Text style={[styles.heading, { color: palette[500] }]}>그래프</Text>

      <WeeklyBarGraph
        palette={asset.palette}
        values={weeklyValues}
        todayIndex={todayIndex}
      />

      <ConditionTrend
        palette={asset.palette}
        values={conditionValues.slice(0, 7)}
      />

      <View style={[styles.patternCard, { backgroundColor: palette[50] }]}>
        <Text style={[styles.patternTitle, { color: palette[700] }]}>지난 주 패턴</Text>
        <Text style={[styles.patternBody, { color: widgetTokens.textPrimary }]}>
          {'편두통이 목요일 저녁과 일요일 아침에 반복됐어요. 수면과 수분 섭취가 관련 있어 보여요.'}
        </Text>
      </View>

      <MonthlyHeatmap
        palette={asset.palette}
        intensities={monthlyIntensities}
        daysInMonth={30}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.displayLarge,
    marginBottom: 16,
  },
  patternCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  patternTitle: {
    ...typography.headline,
    marginBottom: 8,
  },
  patternBody: {
    ...typography.body,
    lineHeight: 23,
  },
});
