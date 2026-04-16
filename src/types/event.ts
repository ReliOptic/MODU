// 에셋이 알고 있는 "삶의 챕터 상의 이벤트" — 시술 일정, 항암, 진료, 주사, 약 복용
// LayoutEngine 의 event_phase condition 이 이 데이터를 평가한다.
import type { WidgetType } from './asset';

export type ScheduledEventType =
  // fertility
  | 'transfer'        // 배아 이식
  | 'injection'       // 주사
  | 'retrieval'       // 난자 채취
  // cancer
  | 'chemo'           // 항암
  | 'visit'           // 외래
  // pet care
  | 'medication'      // 정기 약 복용
  | 'vet_visit'
  // chronic
  | 'consultation';

export type EventPhase = 'before' | 'during' | 'after';

export interface ScheduledEvent {
  id: string;
  type: ScheduledEventType;
  /** 이벤트 시작 시각 (ISO) */
  at: string;
  /** 진행 시간 (시간 단위). 0 = 점이벤트, 4 = 4시간 진행 */
  durationHours?: number;
  /** 이벤트 종료 후 "여운" 시간 — 이 기간 동안 'after' phase 유지 */
  afterglowHours?: number;
  /** 이벤트 표시명 */
  title: string;
  /** 보조 정보 (장소, 메모 등) */
  subtitle?: string;
  /** 이 이벤트가 강조해야 할 위젯 (선택) — 룰에서 참조 */
  associatedWidgets?: WidgetType[];
}

/**
 * 주어진 시각 (now) 기준으로 이벤트가 어느 phase 인지 계산.
 * - now < at - lookAheadHours      → 'far' (반환 X = undefined)
 * - at - lookAheadHours <= now < at → 'before'
 * - at <= now < at + duration       → 'during'
 * - at+duration <= now < at+duration+afterglow → 'after'
 * - 그 외                           → undefined
 */
export function eventPhaseAt(
  e: ScheduledEvent,
  now: Date,
  lookAheadHours: number = 24
): EventPhase | undefined {
  const start = new Date(e.at).getTime();
  const dur = (e.durationHours ?? 0) * 3600_000;
  const after = (e.afterglowHours ?? 12) * 3600_000;
  const lookAheadMs = lookAheadHours * 3600_000;
  const t = now.getTime();

  if (t < start - lookAheadMs) return undefined;
  if (t < start) return 'before';
  if (t < start + dur) return 'during';
  if (t < start + dur + after) return 'after';
  return undefined;
}
