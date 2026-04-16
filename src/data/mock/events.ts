// Mock 이벤트 — 각 에셋 타입의 "오늘"을 살아있게 만든다.
// 실 시간 기준으로 +/- 시간을 지정해 시연 시 항상 적절한 phase 가 활성됨.
import type { ScheduledEvent } from '../../types';

const now = new Date();
function offsetISO(hours: number): string {
  return new Date(now.getTime() + hours * 3_600_000).toISOString();
}

export function fertilityEvents(): ScheduledEvent[] {
  return [
    {
      id: 'inj-1',
      type: 'injection',
      at: offsetISO(-2),
      durationHours: 0.1,
      afterglowHours: 4,
      title: '아침 Gonal-F',
      subtitle: '복부 · 완료',
    },
    {
      id: 'inj-2',
      type: 'injection',
      at: offsetISO(0.4),
      durationHours: 0.1,
      afterglowHours: 1,
      title: '저녁 Cetrotide',
      subtitle: '복부',
      associatedWidgets: ['injection_timeline'],
    },
    {
      id: 'transfer-1',
      type: 'transfer',
      at: offsetISO(22), // 약 22시간 뒤 → before phase
      durationHours: 1.5,
      afterglowHours: 24,
      title: '배아 이식',
      subtitle: 'CHA 강남',
      associatedWidgets: ['primary_event'],
    },
  ];
}

export function cancerEvents(): ScheduledEvent[] {
  return [
    {
      id: 'chemo-5',
      type: 'chemo',
      at: offsetISO(-0.5), // 30분 전 시작 → during phase
      durationHours: 4,
      afterglowHours: 36, // 항암 후 1.5일 동안 회복 모드
      title: '항암 5차',
      subtitle: '서울대병원 · 본관 5층',
      associatedWidgets: ['primary_event', 'question_checklist'],
    },
    {
      id: 'visit-next',
      type: 'visit',
      at: offsetISO(28 * 24), // 4주 뒤
      durationHours: 1,
      afterglowHours: 12,
      title: '항암 6차 외래',
      subtitle: '예약됨',
    },
  ];
}

export function petCareEvents(): ScheduledEvent[] {
  return [
    {
      id: 'med-evening',
      type: 'medication',
      at: offsetISO(2), // 2시간 후
      durationHours: 0.1,
      afterglowHours: 1,
      title: '관절약',
      subtitle: '0.5정 · 식후',
      associatedWidgets: ['primary_medication'],
    },
    {
      id: 'vet-checkup',
      type: 'vet_visit',
      at: offsetISO(20 * 24), // 약 3주 뒤
      durationHours: 1,
      afterglowHours: 24,
      title: 'X-ray 재검사',
      subtitle: '동물의료원',
      associatedWidgets: ['vet_memo'],
    },
  ];
}

export function chronicEvents(): ScheduledEvent[] {
  return [
    {
      id: 'consult-next',
      type: 'consultation',
      at: offsetISO(33 * 24),
      durationHours: 0.5,
      afterglowHours: 12,
      title: '신경과 진료',
      subtitle: '박지수 선생님',
      associatedWidgets: ['next_visit'],
    },
  ];
}
