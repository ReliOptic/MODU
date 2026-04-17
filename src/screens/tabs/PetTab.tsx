// PetTab — pet_care 에셋의 'pet' 탭
// 반려동물 프로필 + 오늘의 기록 + 수의사 메모
import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import type { Asset } from '../../types';
import { typography, getPalette, widgetTokens } from '../../theme';
import {
  PetProfileCard,
  DailyLogBars,
  VetMemo,
  ConditionTrend,
  NarrativeMoment,
} from '../../components/widgets';
import { petMock } from '../../data/mock/widgetData';

export interface PetTabProps {
  asset: Asset;
}

const CONTENT_STYLE = {
  paddingHorizontal: 16,
  paddingBottom: 120,
  paddingTop: 4,
} as const;

const NARRATIVE_ENTRIES: Array<{ title: string; content: string; timestamp: string }> = [
  {
    title: '아침 산책',
    content: '오늘 아침 한강변 30분 산책. 컨디션 좋아 보였고 활발하게 뛰어다녔어요.',
    timestamp: '07:30',
  },
  {
    title: '점심 식사',
    content: '사료 80% 섭취. 간식은 반 정도 먹고 남겼어요. 식욕이 약간 줄었을 수 있어요.',
    timestamp: '12:00',
  },
  {
    title: '저녁 수의사 통화',
    content: '관절 상태 경과 통화. 계단 자제하고 산책 30분 이내로 유지하라는 조언 받았어요.',
    timestamp: '19:15',
  },
];

export function PetTab({ asset }: PetTabProps) {
  const palette = getPalette(asset.palette);

  const profile = petMock.pet_profile ?? {
    emoji: '🐾',
    name: asset.displayName,
    species: '강아지',
    age: '4세',
    weight: '6.2kg',
  };

  const dailyLog = petMock.daily_log_bars ?? {
    walk: { value: 0.75, label: '30분' },
    appetite: { value: 0.6, label: '사료 80%' },
    water: { value: 0.85, label: '250ml' },
  };

  const vetMemoData = petMock.vet_memo ?? {
    notes: '지난 방문: 체중 증가, 식단 점검 권고',
    nextVisit: '2주 후',
  };

  const conditionValues = petMock.condition_trend?.values ?? [0.5, 0.6, 0.55, 0.65, 0.7, 0.6, 0.75];

  return (
    <ScrollView contentContainerStyle={CONTENT_STYLE}>
      <Text style={[styles.heading, { color: palette[500] }]}>
        {asset.displayName}
      </Text>

      <PetProfileCard
        palette={asset.palette}
        emoji={profile.emoji}
        name={profile.name}
        species={profile.species}
        age={profile.age}
        weight={profile.weight}
        conditions={(profile as typeof profile & { conditions?: string[] }).conditions}
      />

      <DailyLogBars
        palette={asset.palette}
        walk={dailyLog.walk}
        appetite={dailyLog.appetite}
        water={dailyLog.water}
      />

      <Text style={[styles.sectionTitle, { color: palette[700] }]}>오늘의 기록</Text>

      {NARRATIVE_ENTRIES.map((entry) => (
        <NarrativeMoment
          key={entry.title}
          palette={asset.palette}
          title={entry.title}
          content={entry.content}
          timestamp={entry.timestamp}
        />
      ))}

      <Text style={[styles.sectionTitle, { color: palette[700] }]}>7일 컨디션 추이</Text>

      <ConditionTrend
        palette={asset.palette}
        values={conditionValues}
      />

      <VetMemo
        palette={asset.palette}
        notes={vetMemoData.notes}
        nextVisit={vetMemoData.nextVisit}
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
    marginTop: 16,
    marginBottom: 10,
    color: widgetTokens.textPrimary,
  },
});
