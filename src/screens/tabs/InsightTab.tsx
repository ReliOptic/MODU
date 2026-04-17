// InsightTab — cancer_caregiver weekly pattern + value tracking
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import type { Asset } from '../../types';
import { typography, getPalette } from '../../theme';
import { NarrativeMoment, GlanceMoment, ValueMoment } from '../../components/widgets';

export interface InsightTabProps {
  asset: Asset;
}

const CONTENT_STYLE = {
  paddingHorizontal: 16,
  paddingBottom: 120,
  paddingTop: 4,
} as const;

export function InsightTab({ asset }: InsightTabProps) {
  const palette = getPalette(asset.palette);

  return (
    <ScrollView contentContainerStyle={CONTENT_STYLE}>
      <Text style={[styles.heading, { color: palette[500] }]}>인사이트</Text>

      <NarrativeMoment
        palette={asset.palette}
        title="이번 주 흐름"
        content={
          '지난 주에는 오전 기록이 부족했어요. ' +
          '아침 루틴 안에서 약을 드릴 때마다 컨디션을 한 줄만 적어주세요. ' +
          '꾸준한 기록이 다음 방문에서 큰 도움이 됩니다.'
        }
      />

      <GlanceMoment
        palette={asset.palette}
        title="규칙적인 기록"
        stats={[
          { label: '매일 기록', value: '5 / 7일' },
          { label: '평균 컨디션', value: '보통' },
          { label: '주의 요인', value: '피로' },
        ]}
      />

      <ValueMoment
        palette={asset.palette}
        label="3시간 기록 루틴"
        value={14}
        unit="일"
        trend="up"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.displayLarge,
    marginBottom: 16,
  },
});
