// ChecklistTab — cancer_caregiver daily checklist + visit memo
import React, { useMemo } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import type { Asset } from '../../types';
import { typography, getPalette } from '../../theme';
import { QuestionChecklist, GlanceMoment, PrevVisitMemo } from '../../components/widgets';
import { cancerMock } from '../../data/mock/widgetData';
import type { ChecklistItem } from '../../components/widgets/cancerCaregiver/QuestionChecklist';

export interface ChecklistTabProps {
  asset: Asset;
}

const CONTENT_STYLE = {
  paddingHorizontal: 16,
  paddingBottom: 120,
  paddingTop: 4,
} as const;

const FALLBACK_ITEMS: ChecklistItem[] = [
  { id: 'bp', text: '오늘 혈압 기록', checked: false },
  { id: 'med', text: '약 1시간 간격 확인', checked: false },
  { id: 'symptom', text: '이상 증상 메모', checked: false },
  { id: 'visit', text: '다음 방문 준비', checked: false },
];

export function ChecklistTab({ asset }: ChecklistTabProps) {
  const palette = getPalette(asset.palette);

  const items: ChecklistItem[] = useMemo(() => {
    const mockItems = cancerMock.question_checklist?.items;
    if (mockItems && mockItems.length > 0) {
      return mockItems.map((it) => ({
        id: it.id,
        text: it.text,
        checked: it.checked ?? false,
      }));
    }
    return FALLBACK_ITEMS;
  }, []);

  const completedCount = items.filter((it) => it.checked).length;
  const totalCount = items.length;

  const prevVisit = cancerMock.prev_visit_memo;

  return (
    <ScrollView contentContainerStyle={CONTENT_STYLE}>
      <Text style={[styles.heading, { color: palette[500] }]}>체크</Text>

      <QuestionChecklist palette={asset.palette} items={items} />

      <GlanceMoment
        palette={asset.palette}
        title="완료한 항목"
        stats={[
          { label: '완료', value: `${completedCount} / ${totalCount}` },
          { label: '남은 항목', value: totalCount - completedCount },
        ]}
      />

      <PrevVisitMemo
        palette={asset.palette}
        date={prevVisit.date}
        notes={prevVisit.notes}
        medicationChanges={prevVisit.medicationChanges}
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
