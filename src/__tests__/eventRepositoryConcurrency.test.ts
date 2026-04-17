// EventRepository 동시성 테스트 — Task #12 CHANGES REQUESTED (HIGH-5)
//
// 케이스:
//  C1) 동일 event.id 동시 save × 2 → 최종 length 1 (idempotency under race)
//  C2) concurrent flushQueue × 2 → 최종 저장 레코드 수 = 원본 queue length (중복 없음)
//  C3) drain 중 emit → 새 이벤트 queue 보존, drained 이벤트 제거

import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    currentState: 'active',
  },
  Platform: { OS: 'ios' },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { createLocalEventRepository } from '../data/repositories/EventRepository';
import { emit, readQueue, drainQueue } from '../lib/events';
import type { MoguEvent } from '../types/events';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<MoguEvent> = {}): MoguEvent {
  return {
    id: `test-id-${Math.random().toString(36).slice(2)}`,
    name: 'screen_viewed',
    occurred_at: new Date().toISOString(),
    session_id: 'session-test',
    locale: 'en-US',
    tz: 'UTC',
    device_class: 'ios',
    sensitivity: 'S1',
    regulatory_envelope: 'E2',
    properties: { screen_id: 'home' },
    ...overrides,
  } as MoguEvent;
}

async function waitForQueue(minLength = 1, timeoutMs = 500): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const q = await readQueue();
    if (q.length >= minLength) return;
    await new Promise((r) => setTimeout(r, 5));
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// C1: concurrent save of same event.id → length 1
// ---------------------------------------------------------------------------

describe('동시성 — EventRepository', () => {
  it('C1: 동일 event.id concurrent save × 2 → 최종 length 1 (중복 없음)', async () => {
    const repo = createLocalEventRepository();
    const event = makeEvent({ id: 'dedup-id-001' });

    // 입력: 동일 event.id 로 동시에 2회 save
    await Promise.all([repo.save(event), repo.save(event)]);

    // 기대: 저장된 레코드가 정확히 1건
    const records = await repo.list();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('dedup-id-001');
  });

  // -------------------------------------------------------------------------
  // C2: concurrent flushQueue × 2 → no duplicates
  // -------------------------------------------------------------------------
  it('C2: concurrent flushQueue × 2 → 최종 StoredEvent 수 = 원본 queue length (중복 없음)', async () => {
    const repo = createLocalEventRepository();

    // 큐에 3건 적재
    emit('screen_viewed', { screen_id: 'a' });
    emit('app_foreground', {});
    emit('app_background', {});
    await waitForQueue(3, 1000);

    const queueBefore = await readQueue();
    expect(queueBefore).toHaveLength(3);

    // 입력: concurrent flushQueue 2회
    await Promise.all([repo.flushQueue(), repo.flushQueue()]);

    // 기대: 저장 레코드 수 = 원본 queue 수 (3), 중복 없음
    const records = await repo.list();
    expect(records).toHaveLength(3);

    // id 유일성 확인
    const ids = records.map((r) => r.id);
    expect(new Set(ids).size).toBe(3);
  }, 10000);

  // -------------------------------------------------------------------------
  // C3: drain 중 emit → 새 이벤트 보존, drained 이벤트 제거
  // -------------------------------------------------------------------------
  it('C3: drain 진행 중 emit → 새 이벤트 queue 보존, drained 항목 제거', async () => {
    // 초기 이벤트 1건 적재
    emit('app_foreground', {});
    await waitForQueue(1);

    const before = await readQueue();
    expect(before).toHaveLength(1);
    const drainId = before[0].event.id;

    // drain 시작과 동시에 새 이벤트 emit (setTimeout 0 으로 인터리브)
    const drainPromise = drainQueue([drainId]);
    await new Promise<void>((resolve) => setTimeout(() => {
      emit('app_background', {});
      resolve();
    }, 0));

    await drainPromise;

    // 새 이벤트가 settle 될 때까지 대기
    await waitForQueue(1, 500);

    const after = await readQueue();

    // 기대: drain 된 이벤트는 제거
    expect(after.some((q) => q.event.id === drainId)).toBe(false);
    // 기대: 새로 emit 된 app_background 이벤트는 보존
    expect(after.some((q) => q.event.name === 'app_background')).toBe(true);
  });
});
