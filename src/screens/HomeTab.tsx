// 홈 탭 — useWidgetOrder()로 정렬된 위젯 렌더 + 실제 위젯 + mock 데이터
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import type { Asset, WidgetType } from '../types';
import { typography, getPalette, PaletteKey } from '../theme';
import { useWidgetOrder } from '../hooks/useWidgetOrder';
import {
  PrimaryEventCard,
  CalendarMiniWidget,
  InjectionTimeline,
  MoodQuickLog,
  PartnerSyncBar,
  CalendarFullView,
  CalendarLegend,
  QuestionChecklist,
  PrevVisitMemo,
  TreatmentTimeline,
  MedicationList,
  PetProfileCard,
  DailyLogBars,
  VetMemo,
  ConditionTrend,
  WeeklyBarGraph,
  MonthlyHeatmap,
  TriggerAnalysis,
  NextVisitCard,
  MedicationStock,
} from '../components/widgets';
import {
  fertilityMock,
  cancerMock,
  petMock,
  chronicMock,
} from '../data/mock/widgetData';

export interface HomeTabProps {
  asset: Asset;
}

export function HomeTab({ asset }: HomeTabProps) {
  const { homeOrder, highlighted } = useWidgetOrder(asset, { tab: 'home' });
  const palette = getPalette(asset.palette);
  const mock = useMemo(() => pickMock(asset.type), [asset.type]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.greeting, { color: palette[500] }]}>
        {greetingFor(asset.displayName)}
      </Text>
      {homeOrder.map((type) => (
        <View
          key={type}
          style={[
            styles.slot,
            highlighted.has(type) && {
              shadowColor: palette.accent,
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            },
          ]}
        >
          {renderWidget(type, asset.palette, mock)}
        </View>
      ))}
    </ScrollView>
  );
}

function pickMock(type: Asset['type']): Record<string, unknown> | undefined {
  switch (type) {
    case 'fertility':
      return fertilityMock as Record<string, unknown>;
    case 'cancer_caregiver':
      return cancerMock as Record<string, unknown>;
    case 'pet_care':
      return petMock as Record<string, unknown>;
    case 'chronic':
      return chronicMock as Record<string, unknown>;
    default:
      return undefined;
  }
}

/** mock 객체에서 키를 꺼내고 palette 충돌을 피하기 위해 Omit 으로 간주 */
function pick<K extends string, T>(m: Record<string, unknown> | undefined, key: K, fallback: T): T {
  return ((m?.[key] as T) ?? fallback);
}

function renderWidget(
  type: WidgetType,
  palette: PaletteKey,
  mock: Record<string, unknown> | undefined
): React.ReactNode {
  switch (type) {
    case 'primary_event': {
      const d = pick(mock, 'primary_event', { title: '다음 이벤트', timeLabel: '—' } as Omit<Parameters<typeof PrimaryEventCard>[0], 'palette'>);
      return <PrimaryEventCard palette={palette} title={d.title} timeLabel={d.timeLabel} countdown={d.countdown} subtitle={d.subtitle} />;
    }
    case 'calendar_mini': {
      const d = pick(mock, 'calendar_mini', {} as Omit<Parameters<typeof CalendarMiniWidget>[0], 'palette'>);
      return <CalendarMiniWidget palette={palette} month={d.month} dots={d.dots} today={d.today} />;
    }
    case 'injection_timeline': {
      const d = pick(mock, 'injection_timeline', { items: [] } as Parameters<typeof InjectionTimeline>[0]);
      return <InjectionTimeline items={d.items} />;
    }
    case 'mood_quicklog':
      return <MoodQuickLog palette={palette} />;
    case 'partner_sync': {
      const d = pick(mock, 'partner_sync', { partnerName: '파트너', syncEnabled: false } as Omit<Parameters<typeof PartnerSyncBar>[0], 'palette'>);
      return <PartnerSyncBar palette={palette} partnerName={d.partnerName} syncEnabled={d.syncEnabled} />;
    }
    case 'calendar_full': {
      const d = pick(mock, 'calendar_full', {} as Omit<Parameters<typeof CalendarFullView>[0], 'palette'>);
      return <CalendarFullView palette={palette} month={d.month} today={d.today} dots={d.dots} />;
    }
    case 'calendar_legend':
      return <CalendarLegend />;
    case 'question_checklist': {
      const d = pick(mock, 'question_checklist', { items: [] } as Omit<Parameters<typeof QuestionChecklist>[0], 'palette'>);
      return <QuestionChecklist palette={palette} items={d.items} />;
    }
    case 'prev_visit_memo': {
      const d = pick(mock, 'prev_visit_memo', { date: '—', notes: '' } as Omit<Parameters<typeof PrevVisitMemo>[0], 'palette'>);
      return <PrevVisitMemo palette={palette} date={d.date} notes={d.notes} medicationChanges={d.medicationChanges} />;
    }
    case 'treatment_timeline': {
      const d = pick(mock, 'treatment_timeline', { sessions: [] } as Omit<Parameters<typeof TreatmentTimeline>[0], 'palette'>);
      return <TreatmentTimeline palette={palette} sessions={d.sessions} />;
    }
    case 'medication_list': {
      const d = pick(mock, 'medication_list', { items: [] } as Parameters<typeof MedicationList>[0]);
      return <MedicationList items={d.items} />;
    }
    case 'pet_profile': {
      const d = pick(mock, 'pet_profile', {
        emoji: '🐾', name: '아이', species: '—', age: '—', weight: '—',
      } as Omit<Parameters<typeof PetProfileCard>[0], 'palette'>);
      return <PetProfileCard palette={palette} {...d} />;
    }
    case 'primary_medication': {
      const d = pick(mock, 'primary_medication', { title: '다음 약', timeLabel: '—' } as Omit<Parameters<typeof PrimaryEventCard>[0], 'palette'>);
      return <PrimaryEventCard palette={palette} title={d.title} timeLabel={d.timeLabel} countdown={d.countdown} subtitle={d.subtitle} />;
    }
    case 'daily_log_bars': {
      const d = pick(mock, 'daily_log_bars', {
        walk: { value: 0, label: '—' },
        appetite: { value: 0, label: '—' },
        water: { value: 0, label: '—' },
      } as Omit<Parameters<typeof DailyLogBars>[0], 'palette'>);
      return <DailyLogBars palette={palette} walk={d.walk} appetite={d.appetite} water={d.water} />;
    }
    case 'vet_memo': {
      const d = pick(mock, 'vet_memo', { notes: '', nextVisit: '—' } as Omit<Parameters<typeof VetMemo>[0], 'palette'>);
      return <VetMemo palette={palette} notes={d.notes} nextVisit={d.nextVisit} />;
    }
    case 'condition_trend': {
      const d = pick(mock, 'condition_trend', { values: [] } as Omit<Parameters<typeof ConditionTrend>[0], 'palette'>);
      return <ConditionTrend palette={palette} values={d.values} />;
    }
    case 'primary_condition': {
      const d = pick(mock, 'primary_condition', { title: '오늘 컨디션', timeLabel: '—' } as Omit<Parameters<typeof PrimaryEventCard>[0], 'palette'>);
      return <PrimaryEventCard palette={palette} title={d.title} timeLabel={d.timeLabel} countdown={d.countdown} subtitle={d.subtitle} />;
    }
    case 'weekly_bar_graph': {
      const d = pick(mock, 'weekly_bar_graph', { values: [0, 0, 0, 0, 0, 0, 0] } as Omit<Parameters<typeof WeeklyBarGraph>[0], 'palette'>);
      return <WeeklyBarGraph palette={palette} values={d.values} todayIndex={d.todayIndex} />;
    }
    case 'monthly_heatmap': {
      const d = pick(mock, 'monthly_heatmap', { intensities: [] } as Omit<Parameters<typeof MonthlyHeatmap>[0], 'palette'>);
      return <MonthlyHeatmap palette={palette} intensities={d.intensities} daysInMonth={d.daysInMonth} />;
    }
    case 'trigger_analysis': {
      const d = pick(mock, 'trigger_analysis', { factors: [] } as Omit<Parameters<typeof TriggerAnalysis>[0], 'palette'>);
      return <TriggerAnalysis palette={palette} factors={d.factors} summary={d.summary} />;
    }
    case 'next_visit': {
      const d = pick(mock, 'next_visit', { date: '—' } as Omit<Parameters<typeof NextVisitCard>[0], 'palette'>);
      return <NextVisitCard palette={palette} date={d.date} doctor={d.doctor} summary={d.summary} />;
    }
    case 'medication_stock': {
      const d = pick(mock, 'medication_stock', { items: [] } as Omit<Parameters<typeof MedicationStock>[0], 'palette'>);
      return <MedicationStock palette={palette} items={d.items} />;
    }
    case 'event_detail_list':
      return null;
  }
}

function greetingFor(name: string): string {
  return `${name}, 오늘도 함께해요.`;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 120 },
  greeting: { ...typography.displayLarge, marginBottom: 16 },
  slot: { marginBottom: 12, borderRadius: 14 },
});
