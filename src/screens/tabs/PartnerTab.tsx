// PartnerTab — fertility partner sync + shared moments
import React, { useMemo } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import type { Asset } from '../../types';
import { typography, getPalette } from '../../theme';
import { PartnerSyncBar, NarrativeMoment, StepMoment } from '../../components/widgets';
import type { StepItem } from '../../components/widgets/atomic/StepMoment';

export interface PartnerTabProps {
  asset: Asset;
}

const CONTENT_STYLE = {
  paddingHorizontal: 16,
  paddingBottom: 120,
  paddingTop: 4,
} as const;

const SHARED_MOMENTS = [
  { date: '어제', note: '병원 동행' },
  { date: '지난 주', note: '결과 공유' },
  { date: '2주 전', note: '첫 상담' },
];

export function PartnerTab({ asset }: PartnerTabProps) {
  const palette = getPalette(asset.palette);
  const responses = asset.formationData.responses;

  const partnerName: string =
    (responses['fertility:step_04_partner_name'] as string | undefined) ?? '파트너';
  const syncEnabled: boolean =
    Boolean(responses['fertility:step_04_partner']);

  const nextSteps = useMemo<StepItem[]>(() => {
    const visitEvents = (asset.events ?? []).filter((e) =>
      e.type === 'visit' || e.type === 'transfer' || e.type === 'retrieval'
    );
    const base: StepItem[] = [
      { id: 'together', label: '함께 갈까요?', status: visitEvents.length > 0 ? 'current' : 'upcoming' },
      { id: 'medication', label: '약 이름 기억하기', status: 'upcoming' },
      { id: 'questions', label: '다음 질문 정리', status: 'upcoming' },
    ];
    return base;
  }, [asset.events]);

  return (
    <ScrollView contentContainerStyle={CONTENT_STYLE}>
      <Text style={[styles.heading, { color: palette[500] }]}>파트너</Text>

      <PartnerSyncBar
        palette={asset.palette}
        partnerName={partnerName}
        syncEnabled={syncEnabled}
      />

      <Text style={[styles.sectionTitle, { color: palette[700] }]}>함께한 순간</Text>

      {SHARED_MOMENTS.map((m) => (
        <NarrativeMoment
          key={m.date}
          palette={asset.palette}
          timestamp={m.date}
          content={m.note}
        />
      ))}

      <StepMoment
        palette={asset.palette}
        title="다음 함께할 일"
        steps={nextSteps}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.displayLarge,
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.headline,
    marginTop: 8,
    marginBottom: 8,
  },
});
