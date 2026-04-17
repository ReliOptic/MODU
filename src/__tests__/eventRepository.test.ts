// EventRepository 단위 테스트 — Task #12
//
// 케이스:
//  1) save + list — 기본 저장 및 전체 조회
//  2) list filter — sensitivity / since / asset_id 필터 조합
//  3) purgeExpired — S1/S2 90일 초과 제거, S3 보존
//  4) S4 immutable — purgeExpired 가 S4 레코드를 절대 삭제하지 않음
//  5) drainQueue 실패 복구 — save 실패 시 큐 항목 보존
//  6) Syncable 필드 백필 — id / updatedAt / syncedAt 올바르게 설정

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
import { emit, readQueue } from '../lib/events';
import type { MoguEvent } from '../types/events';

/** emit은 void — queue가 minLength 이상이 될 때까지 폴링 대기 */
async function waitForQueue(minLength = 1, timeoutMs = 500): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const q = await readQueue();
    if (q.length >= minLength) return;
    await new Promise((r) => setTimeout(r, 5));
  }
}

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

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('EventRepository', () => {
  // -------------------------------------------------------------------------
  // 케이스 1: save + list 기본 동작
  // -------------------------------------------------------------------------
  it('케이스 1: save 후 list() 가 전체 레코드를 반환한다', async () => {
    const repo = createLocalEventRepository();
    const e1 = makeEvent({ name: 'screen_viewed', properties: { screen_id: 'home' } });
    const e2 = makeEvent({ name: 'app_foreground', properties: {} });

    await repo.save(e1);
    await repo.save(e2);

    const records = await repo.list();
    expect(records).toHaveLength(2);
    expect(records.map((r) => r.event.id)).toContain(e1.id);
    expect(records.map((r) => r.event.id)).toContain(e2.id);

    const count = await repo.count();
    expect(count).toBe(2);
  });

  // -------------------------------------------------------------------------
  // 케이스 2: list filter — sensitivity / since / asset_id
  // -------------------------------------------------------------------------
  it('케이스 2: list(filter) — sensitivity, since, asset_id 필터 각각 동작', async () => {
    const repo = createLocalEventRepository();

    const s1Event = makeEvent({ sensitivity: 'S1', occurred_at: daysAgo(5) });
    const s3Event = makeEvent({
      sensitivity: 'S3',
      regulatory_envelope: 'E3',
      asset_id: 'asset-abc',
      occurred_at: daysAgo(1),
    });
    const s4Event = makeEvent({
      sensitivity: 'S4',
      regulatory_envelope: 'E4',
      occurred_at: daysAgo(100),
    });

    await repo.save(s1Event);
    await repo.save(s3Event);
    await repo.save(s4Event);

    // sensitivity filter
    const s1Only = await repo.list({ sensitivity: 'S1' });
    expect(s1Only).toHaveLength(1);
    expect(s1Only[0].event.sensitivity).toBe('S1');

    // since filter — only events from last 10 days
    const recent = await repo.list({ since: daysAgo(10) });
    expect(recent).toHaveLength(2); // s1Event (5d ago) + s3Event (1d ago)

    // asset_id filter
    const byAsset = await repo.list({ asset_id: 'asset-abc' });
    expect(byAsset).toHaveLength(1);
    expect(byAsset[0].event.asset_id).toBe('asset-abc');
  });

  // -------------------------------------------------------------------------
  // 케이스 3: purgeExpired — S1/S2 90일 초과 제거, S3 무기한 보존
  // -------------------------------------------------------------------------
  it('케이스 3: purgeExpired() — S1/S2 90일 초과 항목 제거, S3 보존', async () => {
    const repo = createLocalEventRepository();

    const oldS1 = makeEvent({ sensitivity: 'S1', occurred_at: daysAgo(91) });
    const recentS2 = makeEvent({ sensitivity: 'S2', occurred_at: daysAgo(10) });
    const oldS3 = makeEvent({
      sensitivity: 'S3',
      regulatory_envelope: 'E3',
      occurred_at: daysAgo(200),
    });

    await repo.save(oldS1);
    await repo.save(recentS2);
    await repo.save(oldS3);

    await repo.purgeExpired(new Date());

    const remaining = await repo.list();
    const ids = remaining.map((r) => r.event.id);

    expect(ids).not.toContain(oldS1.id);   // S1 91일 → 삭제
    expect(ids).toContain(recentS2.id);    // S2 10일 → 보존
    expect(ids).toContain(oldS3.id);       // S3 → 무조건 보존
  });

  // -------------------------------------------------------------------------
  // 케이스 4: S4 immutable — purgeExpired 가 절대 삭제하지 않음
  // -------------------------------------------------------------------------
  it('케이스 4: S4 immutable — purgeExpired() 가 S4 레코드를 제거하지 않는다', async () => {
    const repo = createLocalEventRepository();

    const s4Old = makeEvent({
      sensitivity: 'S4',
      regulatory_envelope: 'E4',
      occurred_at: daysAgo(365),
    });
    const s4Recent = makeEvent({
      sensitivity: 'S4',
      regulatory_envelope: 'E4',
      occurred_at: daysAgo(1),
    });

    await repo.save(s4Old);
    await repo.save(s4Recent);

    await repo.purgeExpired(new Date());

    const remaining = await repo.list();
    expect(remaining).toHaveLength(2);
    expect(remaining.map((r) => r.event.id)).toContain(s4Old.id);
    expect(remaining.map((r) => r.event.id)).toContain(s4Recent.id);
  });

  // -------------------------------------------------------------------------
  // 케이스 5: flushQueue — save 실패 시 큐 항목 보존
  // -------------------------------------------------------------------------
  it('케이스 5: flushQueue() — save 실패 시 해당 이벤트가 큐에 남는다', async () => {
    const repo = createLocalEventRepository();

    // emit 으로 큐에 2건 적재 (emit은 void — queue settle 대기)
    emit('screen_viewed', { screen_id: 'home' });
    emit('app_foreground', {});
    await waitForQueue(2);

    const queueBefore = await readQueue();
    expect(queueBefore).toHaveLength(2);

    // save 가 두 번째 호출에서 throw 하도록 spy
    let callCount = 0;
    const originalSave = repo.save.bind(repo);
    repo.save = jest.fn(async (event: MoguEvent) => {
      callCount += 1;
      if (callCount === 2) throw new Error('storage full');
      return originalSave(event);
    });

    await repo.flushQueue();

    // 첫 번째 이벤트는 저장됨
    const saved = await repo.list();
    expect(saved).toHaveLength(1);

    // 두 번째 이벤트는 큐에 남아있어야 함
    const queueAfter = await readQueue();
    expect(queueAfter).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // 케이스 6: Syncable 필드 백필
  // -------------------------------------------------------------------------
  it('케이스 6: save() 가 Syncable 필드(id, updatedAt, syncedAt)를 올바르게 설정한다', async () => {
    const repo = createLocalEventRepository();
    const event = makeEvent({ occurred_at: '2026-04-17T10:00:00.000Z' });

    await repo.save(event);

    const records = await repo.list();
    expect(records).toHaveLength(1);

    const record = records[0];
    // id mirrors event.id
    expect(record.id).toBe(event.id);
    // updatedAt mirrors event.occurred_at
    expect(record.updatedAt).toBe(event.occurred_at);
    // syncedAt is null (not yet pushed to cloud)
    expect(record.syncedAt).toBeNull();
    // savedAt is an ISO string
    expect(() => new Date(record.savedAt)).not.toThrow();
    expect(record.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
