// 위젯 통합 export — WidgetType → 컴포넌트 매핑은 HomeTab/registry에서 사용
export { PrimaryEventCard } from './shared/PrimaryEventCard';
export { CalendarMiniWidget } from './shared/CalendarMiniWidget';

// atomic moments (universal)
export { ValueMoment } from './atomic/ValueMoment';
export { NarrativeMoment } from './atomic/NarrativeMoment';
export { StepMoment } from './atomic/StepMoment';
export { GlanceMoment } from './atomic/GlanceMoment';

// fertility
export { InjectionTimeline } from './fertility/InjectionTimeline';
export { MoodQuickLog } from './fertility/MoodQuickLog';
export { PartnerSyncBar } from './fertility/PartnerSyncBar';
export { CalendarFullView } from './fertility/CalendarFullView';
export { CalendarLegend } from './fertility/CalendarLegend';
// cancer caregiver
export { QuestionChecklist } from './cancerCaregiver/QuestionChecklist';
export { PrevVisitMemo } from './cancerCaregiver/PrevVisitMemo';
export { TreatmentTimeline } from './cancerCaregiver/TreatmentTimeline';
export { MedicationList } from './cancerCaregiver/MedicationList';
// pet care
export { PetProfileCard } from './petCare/PetProfileCard';
export { DailyLogBars } from './petCare/DailyLogBars';
export { VetMemo } from './petCare/VetMemo';
export { ConditionTrend } from './petCare/ConditionTrend';
// chronic
export { WeeklyBarGraph } from './chronic/WeeklyBarGraph';
export { MonthlyHeatmap } from './chronic/MonthlyHeatmap';
export { TriggerAnalysis } from './chronic/TriggerAnalysis';
export { NextVisitCard } from './chronic/NextVisitCard';
export { MedicationStock } from './chronic/MedicationStock';
