// 이벤트 emission 헬퍼 — local-first queue + EventBase 자동 채움.
// Task #12 EventRepository 가 이 queue 를 소비해 영구 저장한다.
// 서버 flush 는 이 파일 범위 밖 (EventRepository 담당).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuid, nowIso } from './ids';
import { withKeyLock } from './asyncStorageMutex';
import {
  EVENT_REGISTRY,
  type EventName,
  type MoguEvent,
  type Sensitivity,
  type RegulatoryEnvelope,
  type Locale,
  type DeviceClass,
} from '../types/events';

// ---------------------------------------------------------------------------
// 내부 상수
// ---------------------------------------------------------------------------

const SESSION_KEY = '@modu/session_id';
const QUEUE_KEY = '@modu/event_queue';
const INACTIVITY_MS = 30 * 60 * 1000; // 30분

// ---------------------------------------------------------------------------
// 큐 아이템 타입 (Task #12 에서 소비)
// ---------------------------------------------------------------------------

export interface QueuedEvent {
  event: MoguEvent;
  /** 큐 적재 시각 (ISO) */
  queued_at: string;
}

// ---------------------------------------------------------------------------
// emit() 호출자가 제공하는 컨텍스트 (EventBase 의 선택 필드)
// ---------------------------------------------------------------------------

export interface EmitContext {
  asset_id?: string;
  role?: MoguEvent['role'];
  locale?: Locale;
  tz?: string;
  device_class?: DeviceClass;
}

// ---------------------------------------------------------------------------
// session_id 관리
// ---------------------------------------------------------------------------

let _sessionId: string | null = null;
let _lastActivityAt: number = Date.now();
// AppState.addEventListener 반환값 타입 — { remove(): void }
let _appStateSubscription: { remove(): void } | null = null;
// initEvents() 완료 여부
let _initDone = false;
// initEvents() 이전에 emit된 이벤트를 임시 session으로 묶기 위한 pre-init session
let _preInitSessionId: string | null = null;

/** 현재 session_id 반환 (없으면 새로 생성) */
function currentSessionId(): string {
  if (!_sessionId) {
    if (!_initDone) {
      // initEvents() 전에는 임시 session 재사용
      if (!_preInitSessionId) {
        _preInitSessionId = uuid();
      }
      return _preInitSessionId;
    }
    _sessionId = uuid();
    // 비동기로 저장 (실패해도 메모리 값 사용)
    AsyncStorage.setItem(SESSION_KEY, _sessionId).catch(() => undefined);
  }
  return _sessionId;
}

/** 30분 비활동 후 session rotate */
function rotateSessionIfStale(): void {
  if (Date.now() - _lastActivityAt > INACTIVITY_MS) {
    _sessionId = uuid();
    AsyncStorage.setItem(SESSION_KEY, _sessionId).catch(() => undefined);
  }
  _lastActivityAt = Date.now();
}

/** AppState 포그라운드 이벤트 구독 → session rotate 트리거 */
function ensureAppStateListener(): void {
  if (_appStateSubscription) return;
  // 런타임에 lazy require — Jest 환경에서 mock 이 먼저 등록될 수 있도록
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppState } = require('react-native') as typeof import('react-native');
  _appStateSubscription = AppState.addEventListener(
    'change',
    (nextState: string) => {
      if (nextState === 'active') {
        rotateSessionIfStale();
      }
    }
  );
}

/** 앱 시작 시 이전 session_id 복원 + pre-init 이벤트 merge.
 *  App.tsx에서 mount 시 1회 호출. */
export async function initEvents(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (stored && !_sessionId) {
      _sessionId = stored;
    }
  } catch {
    // 복원 실패 시 새 session 생성 (currentSessionId() 가 처리)
  }

  // pre-init 임시 session 이벤트를 실제 session_id로 재태그
  if (_preInitSessionId && _sessionId && _preInitSessionId !== _sessionId) {
    await withKeyLock(QUEUE_KEY, async () => {
      try {
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        if (!raw) return;
        const arr: QueuedEvent[] = JSON.parse(raw);
        let changed = false;
        for (const item of arr) {
          if (item.event.session_id === _preInitSessionId) {
            // session_id를 복원된 실제 id로 교체
            (item.event as { session_id: string }).session_id = _sessionId!;
            changed = true;
          }
        }
        if (changed) {
          await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
        }
      } catch {
        // merge 실패는 무시 — 임시 session_id로 남아도 허용
      }
    }).catch(() => undefined);
  }

  _initDone = true;
}

// ---------------------------------------------------------------------------
// mutex — enqueue/drain 원자성 보장 (CRITICAL-1, CRITICAL-2)
// withKeyLock(QUEUE_KEY, ...) 로 동일 key 직렬화.
// ---------------------------------------------------------------------------

/** 이벤트를 AsyncStorage 큐에 push — mutex 경유 */
function enqueue(event: MoguEvent): Promise<void> {
  return withKeyLock(QUEUE_KEY, async () => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const arr: QueuedEvent[] = raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
    arr.push({ event, queued_at: nowIso() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
  }).catch(() => {
    // 큐 저장 실패 — 이벤트 손실 허용 (local-first 원칙, 재시도는 Task #12)
  });
}

// ---------------------------------------------------------------------------
// 런타임 shape 검증 (개발 모드 전용)
// ---------------------------------------------------------------------------

/** EVENT_REGISTRY 에 없는 type 은 warn */
function validateEventName(name: string): name is EventName {
  const known = name in EVENT_REGISTRY;
  if (!known && __DEV__) {
    console.warn(`[events] 알 수 없는 이벤트 타입: "${name}" — EVENT_REGISTRY 에 등록 필요`);
  }
  return known;
}

/** requiredKeys 기반 payload 검증 (dev 모드) */
function validatePayload(name: EventName, properties: Record<string, unknown>): void {
  if (!__DEV__) return;
  if (typeof properties !== 'object' || properties === null) {
    console.warn(`[events] "${name}" properties 가 object 가 아님`);
    return;
  }
  const { requiredKeys } = EVENT_REGISTRY[name];
  for (const key of (requiredKeys ?? [])) {
    if (!(key in properties)) {
      console.warn(`[events] "${name}" 필수 키 누락: "${key}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// 디바이스 정보 헬퍼
// ---------------------------------------------------------------------------

function getDeviceClass(): DeviceClass {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Platform } = require('react-native') as typeof import('react-native');
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function getSystemLocale(): Locale {
  // expo-localization 없이 최선의 추론
  const tag =
    (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
  const supported: Locale[] = ['en-US', 'ko-KR', 'en-CA', 'fr-CA', 'ja-JP', 'de-DE', 'fr-FR'];
  // 1) 정확 일치 우선
  const exact = supported.find((l) => l === tag) as Locale | undefined;
  if (exact) return exact;
  // 2) 언어 prefix + region 일치 (e.g. "en-CA" matches "en-CA" locale)
  const langRegion = supported.find((l) => tag.startsWith(l)) as Locale | undefined;
  if (langRegion) return langRegion;
  // 3) 언어 prefix 만 일치 (e.g. "en-GB" → "en-US" fallback)
  const langOnly = supported.find((l) => l.split('-')[0] === tag.split('-')[0]) as Locale | undefined;
  return langOnly ?? 'en-US';
}

function getSystemTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

/**
 * 이벤트 emission 진입점.
 *
 * void 반환 — UI를 block하지 않음. 내부적으로 mutex enqueue.
 *
 * @param type  - EVENT_REGISTRY 에 등록된 이벤트 이름
 * @param properties - 해당 이벤트의 payload properties
 * @param ctx   - 호출 시점의 선택적 컨텍스트 (locale, role, asset_id 등)
 */
export function emit<T extends EventName>(
  type: T,
  properties: Extract<MoguEvent, { name: T }>['properties'],
  ctx: EmitContext = {}
): void {
  // 1. 이벤트 타입 유효성 확인
  if (!validateEventName(type)) return;

  validatePayload(type, properties as Record<string, unknown>);

  // 2. session_id를 emit 시작 시점에 스냅샷 — 중간 AppState rotate 영향 없음 (HIGH-1)
  const sid = currentSessionId();

  // 3. session rotate 체크 + activity 갱신 (sid 스냅샷 후 수행)
  rotateSessionIfStale();
  ensureAppStateListener();

  // 4. registry 에서 sensitivity / envelope 주입
  const reg = EVENT_REGISTRY[type];

  // 5. EventBase 자동 채움
  const base = {
    id: uuid(),
    occurred_at: nowIso(),
    session_id: sid,
    locale: ctx.locale ?? getSystemLocale(),
    tz: ctx.tz ?? getSystemTz(),
    device_class: ctx.device_class ?? getDeviceClass(),
    sensitivity: reg.sensitivity as Sensitivity,
    regulatory_envelope: reg.envelope as RegulatoryEnvelope,
    ...(ctx.asset_id !== undefined ? { asset_id: ctx.asset_id } : {}),
    ...(ctx.role !== undefined ? { role: ctx.role } : {}),
  };

  // 6. 완성된 이벤트 객체 (discriminated union 충족)
  const event = {
    ...base,
    name: type,
    properties,
  } as unknown as MoguEvent;

  // 7. 로컬 큐에 push (local-first) — void, non-blocking
  void enqueue(event);
}

// ---------------------------------------------------------------------------
// Task #12 (EventRepository) 에서 사용할 큐 접근 export
// ---------------------------------------------------------------------------

/** 현재 큐 전체 읽기 */
export async function readQueue(): Promise<QueuedEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
  } catch {
    return [];
  }
}

/** 큐에서 처리 완료된 이벤트 제거 (id 목록으로) — mutex 경유 (CRITICAL-2) */
export async function drainQueue(processedIds: string[]): Promise<void> {
  return withKeyLock(QUEUE_KEY, async () => {
    // re-read 후 diff 적용 — drain 중 추가된 이벤트 보존
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedEvent[] = raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
    const remaining = queue.filter((q) => !processedIds.includes(q.event.id));
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }).catch(() => {
    // 드레인 실패 — 다음 시도에서 재처리
  });
}

/** session_id rotate 강제 실행 (테스트 / 로그아웃용) */
export function forceRotateSession(): string {
  _sessionId = uuid();
  _lastActivityAt = Date.now();
  AsyncStorage.setItem(SESSION_KEY, _sessionId).catch(() => undefined);
  return _sessionId;
}

/** 현재 session_id 조회 (읽기 전용) */
export function getSessionId(): string {
  return currentSessionId();
}
