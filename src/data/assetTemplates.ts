// §2 에셋 타입별 기본 tabs / widgets / palette 매핑
import type { AssetType, Envelope, TabConfig, WidgetConfig } from '../types';
import type { PaletteKey } from '../theme';

export interface AssetTemplate {
  type: AssetType;
  palette: PaletteKey;
  envelope: Envelope;
  defaultDisplayName: string;
  tabs: TabConfig[];
  widgets: WidgetConfig[];
}

export const assetTemplates: Record<AssetType, AssetTemplate> = {
  fertility: {
    type: 'fertility',
    palette: 'dawn',
    envelope: 'E4',
    defaultDisplayName: '시험관 1회차',
    tabs: [
      { id: 'home', icon: 'house', label: '홈' },
      { id: 'calendar', icon: 'calendar', label: '달력' },
      { id: 'mood', icon: 'face.smile', label: '감정' },
      { id: 'partner', icon: 'person.2', label: '파트너' },
    ],
    widgets: [
      { type: 'primary_event', defaultPriority: 90, tab: 'home' },
      { type: 'injection_timeline', defaultPriority: 80, tab: 'home' },
      { type: 'mood_quicklog', defaultPriority: 60, tab: 'home' },
      { type: 'partner_sync', defaultPriority: 50, tab: 'home' },
      { type: 'calendar_full', defaultPriority: 90, tab: 'calendar' },
      { type: 'calendar_legend', defaultPriority: 80, tab: 'calendar' },
      { type: 'event_detail_list', defaultPriority: 70, tab: 'calendar' },
    ],
  },
  cancer_caregiver: {
    type: 'cancer_caregiver',
    palette: 'mist',
    envelope: 'E4',
    defaultDisplayName: '어머니 항암',
    tabs: [
      { id: 'home', icon: 'house', label: '홈' },
      { id: 'checklist', icon: 'checklist', label: '체크' },
      { id: 'insight', icon: 'lightbulb', label: '인사이트' },
      { id: 'share', icon: 'person.2', label: '공유' },
    ],
    widgets: [
      { type: 'primary_event', defaultPriority: 90, tab: 'home' },
      { type: 'question_checklist', defaultPriority: 85, tab: 'home' },
      { type: 'prev_visit_memo', defaultPriority: 75, tab: 'home' },
      { type: 'treatment_timeline', defaultPriority: 65, tab: 'home' },
      { type: 'medication_list', defaultPriority: 55, tab: 'home' },
    ],
  },
  pet_care: {
    type: 'pet_care',
    palette: 'blossom',
    envelope: 'E1',
    defaultDisplayName: '보리 관절 관리',
    tabs: [
      { id: 'home', icon: 'house', label: '홈' },
      { id: 'calendar', icon: 'calendar', label: '달력' },
      { id: 'pet', icon: 'pawprint', label: '보리' }, // 동적: pet name
      { id: 'settings', icon: 'gear', label: '설정' },
    ],
    widgets: [
      { type: 'pet_profile', defaultPriority: 95, tab: 'home' },
      { type: 'primary_medication', defaultPriority: 90, tab: 'home' },
      { type: 'daily_log_bars', defaultPriority: 75, tab: 'home' },
      { type: 'vet_memo', defaultPriority: 65, tab: 'home' },
      { type: 'condition_trend', defaultPriority: 55, tab: 'home' },
    ],
  },
  chronic: {
    type: 'chronic',
    palette: 'sage',
    envelope: 'E4',
    defaultDisplayName: '편두통 관리',
    tabs: [
      { id: 'home', icon: 'house', label: '홈' },
      { id: 'graph', icon: 'chart.line', label: '그래프' },
      { id: 'dashboard', icon: 'square.grid', label: '대시보드' },
      { id: 'settings', icon: 'gear', label: '설정' },
    ],
    widgets: [
      { type: 'primary_condition', defaultPriority: 90, tab: 'home' },
      { type: 'weekly_bar_graph', defaultPriority: 80, tab: 'home' },
      { type: 'monthly_heatmap', defaultPriority: 70, tab: 'home' },
      { type: 'trigger_analysis', defaultPriority: 60, tab: 'home' },
      { type: 'next_visit', defaultPriority: 50, tab: 'home' },
      { type: 'medication_stock', defaultPriority: 40, tab: 'home' },
    ],
  },
  custom: {
    type: 'custom',
    palette: 'dusk',
    envelope: 'E1',
    defaultDisplayName: '내 에셋',
    tabs: [
      { id: 'home', icon: 'house', label: '홈' },
      { id: 'settings', icon: 'gear', label: '설정' },
    ],
    widgets: [{ type: 'mood_quicklog', defaultPriority: 50, tab: 'home' }],
  },
};
