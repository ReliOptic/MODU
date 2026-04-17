// 홈 탭 — useWidgetOrder()로 정렬된 위젯 렌더 + 실제 위젯 + mock 데이터
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import type { Asset, WidgetType } from '../types';
import { typography, getPalette, PaletteKey } from '../theme';
import { useWidgetOrder } from '../hooks/useWidgetOrder';
import {
  PrimaryEventCard,
  CalendarMiniWidget,
  ValueMoment, // 추가
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
import type { WidgetConfig } from '../types/asset';

export interface HomeTabProps {
  asset: Asset;
}

/** 
 * 위젯 타입별 컴포넌트 레지스트리.
 * 새로운 모먼트 추가 시 이곳에 등록만 하면 HomeTab 수정 없이 즉시 반영됨 (Zero-Code Ready).
 */
const WIDGET_REGISTRY: Record<string, React.FC<any>> = {
  'core.value': ValueMoment,
  'core.narrative': NarrativeMoment,
  'core.step': StepMoment,
  'core.glance': GlanceMoment,
  'primary_event': PrimaryEventCard,
  'calendar_mini': CalendarMiniWidget,
  'injection_timeline': InjectionTimeline,
  'mood_quicklog': MoodQuickLog,
  'partner_sync': PartnerSyncBar,
  'calendar_full': CalendarFullView,
  'calendar_legend': CalendarLegend,
  'question_checklist': QuestionChecklist,
  'prev_visit_memo': PrevVisitMemo,
  'treatment_timeline': TreatmentTimeline,
  'medication_list': MedicationList,
  'pet_profile': PetProfileCard,
  'daily_log_bars': DailyLogBars,
  'vet_memo': VetMemo,
  'condition_trend': ConditionTrend,
  'weekly_bar_graph': WeeklyBarGraph,
  'monthly_heatmap': MonthlyHeatmap,
  'trigger_analysis': TriggerAnalysis,
  'next_visit': NextVisitCard,
  'medication_stock': MedicationStock,
};

export function HomeTab({ asset }: HomeTabProps) {
  const { homeOrder, highlighted } = useWidgetOrder(asset, { tab: 'home' });
  const palette = getPalette(asset.palette);
  const mock = useMemo(() => pickMock(asset.type), [asset.type]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.greeting, { color: palette[500] }]}>
        {greetingFor(asset.displayName)}
      </Text>
      {homeOrder.map((type) => {
        // 현재 에셋의 위젯 설정 찾기 (props 포함)
        const config = asset.widgets.find(w => w.type === type);
        
        return (
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
            {renderWidget(type, asset.palette, mock, config)}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ... pickMock, pick 함수들은 유지 ...

function renderWidget(
  type: WidgetType,
  palette: PaletteKey,
  mock: Record<string, unknown> | undefined,
  config?: WidgetConfig
): React.ReactNode {
  const Component = WIDGET_REGISTRY[type];
  if (!Component) return null;

  // 1. AI Blueprint의 props가 있다면 최우선 적용
  if (config?.props) {
    return <Component palette={palette} {...config.props} />;
  }

  // 2. Legacy/Fallback: 하드코딩된 매핑 (Mock 데이터 기반)
  switch (type) {
    case 'primary_event': {
      const d = pick(mock, 'primary_event', { title: '다음 이벤트', timeLabel: '—' } as Omit<Parameters<typeof PrimaryEventCard>[0], 'palette'>);
      return <PrimaryEventCard palette={palette} title={d.title} timeLabel={d.timeLabel} countdown={d.countdown} subtitle={d.subtitle} />;
    }
    case 'calendar_mini': {
      const d = pick(mock, 'calendar_mini', {} as Omit<Parameters<typeof CalendarMiniWidget>[0], 'palette'>);
      return <CalendarMiniWidget palette={palette} month={d.month} dots={d.dots} today={d.today} />;
    }
    case 'core.value': // 신규 범용 모먼트 (props 필수)
      return null; 
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
    default:
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
