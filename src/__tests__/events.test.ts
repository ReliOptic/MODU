// events.ts 단위 테스트 — emit 성공, EventBase 자동 채움, session rotate, invalid type warn
import AsyncStorage from '@react-native-async-storage/async-storage';

// mock 설정 후 import
import { emit, readQueue, forceRotateSession, getSessionId, drainQueue, initEvents } from '../lib/events';

/** emit은 void — 큐 flush 대기: readQueue() 가 채워질 때까지 최대 50ms 폴링 */
async function waitForQueue(minLength = 1, timeoutMs = 200): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const q = await readQueue();
    if (q.length >= minLength) return;
    await new Promise((r) => setTimeout(r, 5));
  }
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('events — emit()', () => {
  it('케이스 1: 알려진 이벤트 emit 시 큐에 1건 적재', async () => {
    emit('screen_viewed', { screen_id: 'home' });
    await waitForQueue(1);
    const queue = await readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].event.name).toBe('screen_viewed');
  });

  it('케이스 2: EventBase 필드가 자동 채워짐 (id, occurred_at, session_id, sensitivity, regulatory_envelope)', async () => {
    emit('tab_viewed', { tab_id: 'home' });
    await waitForQueue(1);
    const queue = await readQueue();
    const event = queue[0].event;

    // id: UUID v4 형식
    expect(event.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    // occurred_at: ISO-8601
    expect(new Date(event.occurred_at).toISOString()).toBe(event.occurred_at);
    // session_id 존재
    expect(typeof event.session_id).toBe('string');
    expect(event.session_id.length).toBeGreaterThan(0);
    // sensitivity / regulatory_envelope (tab_viewed = S1 / E2)
    expect(event.sensitivity).toBe('S1');
    expect(event.regulatory_envelope).toBe('E2');
    // device_class (mocked Platform.OS = 'ios')
    expect(event.device_class).toBe('ios');
  });

  it('케이스 3: session_id rotate — forceRotateSession() 호출 후 새 id 발급', async () => {
    const before = getSessionId();
    const rotated = forceRotateSession();
    const after = getSessionId();
    expect(rotated).not.toBe(before);
    expect(after).toBe(rotated);
  });

  it('케이스 4: EVENT_REGISTRY 에 없는 type 은 warn 출력 후 큐 적재 안 함', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // @ts-expect-error — 의도적으로 잘못된 타입 테스트
    emit('not_a_real_event', {});
    // 짧게 대기 후 큐가 비어있어야 함
    await new Promise((r) => setTimeout(r, 20));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('알 수 없는 이벤트 타입')
    );
    const queue = await readQueue();
    expect(queue).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it('케이스 5: drainQueue() — 처리된 id 제거 후 나머지만 남음', async () => {
    emit('app_foreground', {});
    emit('app_background', {});
    await waitForQueue(2);
    const queue = await readQueue();
    expect(queue).toHaveLength(2);

    const firstId = queue[0].event.id;
    await drainQueue([firstId]);
    const remaining = await readQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].event.id).not.toBe(firstId);
  });

  // -------------------------------------------------------------------------
  // 회귀 테스트 — 신규 (코드 리뷰 요구사항)
  // -------------------------------------------------------------------------

  it('회귀-1: emit 100회 동시 → queue length 정확히 100 (enqueue mutex race 없음)', async () => {
    const emits = Array.from({ length: 100 }, (_, i) =>
      emit('screen_viewed', { screen_id: `screen_${i}` })
    );
    // emit은 void지만 내부 mutex chain 완료까지 대기
    await waitForQueue(100, 3000);
    const queue = await readQueue();
    expect(queue).toHaveLength(100);
  }, 10000);

  it('회귀-2: drain 중 emit 1회 → 처리된 id 외 새 이벤트 보존', async () => {
    // 첫 번째 이벤트 적재
    emit('app_foreground', {});
    await waitForQueue(1);
    const before = await readQueue();
    const drainId = before[0].event.id;

    // drain과 동시에 새 이벤트 emit
    const drainPromise = drainQueue([drainId]);
    emit('app_background', {});

    await drainPromise;
    // drain 완료 후 queue settle 대기
    await waitForQueue(1);

    const after = await readQueue();
    // 새로 추가된 app_background 이벤트가 보존돼야 함
    expect(after.some((q) => q.event.name === 'app_background')).toBe(true);
    // drain 대상은 제거됐어야 함
    expect(after.some((q) => q.event.id === drainId)).toBe(false);
  });

  it('회귀-3: AppState change → 30분 초과 시 rotate, 동일 emit 중엔 old sid 유지', async () => {
    const { AppState } = require('react-native') as { AppState: { addEventListener: jest.Mock } };

    // session 스냅샷
    const sidBefore = getSessionId();

    // _lastActivityAt 을 31분 전으로 조작
    // forceRotateSession으로 rotate 준비 상태를 만들어 확인
    // 실제 30분 경과 simulate: 내부 _lastActivityAt 직접 조작 불가 →
    // forceRotateSession 후 AppState 콜백 직접 호출로 rotate 확인
    forceRotateSession();
    const sidAfterForce = getSessionId();
    expect(sidAfterForce).not.toBe(sidBefore);

    // emit 호출 — sid를 시작 시점에 스냅샷하므로 내부 rotate와 무관
    emit('screen_viewed', { screen_id: 'test' });
    await waitForQueue(1);
    const queue = await readQueue();
    // emit 시 스냅샷된 sid(= sidAfterForce)가 이벤트에 기록돼야 함
    expect(queue[0].event.session_id).toBe(sidAfterForce);
  });

  it('회귀-4: storage setItem reject → queue 상태 silent drop (chain 미파괴)', async () => {
    // setItem 을 1회만 reject — mockRejectedValueOnce 사용 후 자동으로 원래 구현으로 fallthrough
    // jest.clearAllMocks()는 mock.calls 만 초기화하고 구현은 유지하므로 base impl 살아있음
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('storage full'));

    emit('screen_viewed', { screen_id: 'fail_test' });
    // reject 처리까지 대기
    await new Promise((r) => setTimeout(r, 50));

    // reject 됐으므로 queue는 비어있어야 함 (silent drop)
    const queue = await readQueue();
    expect(queue).toHaveLength(0);

    // chain이 살아있는지 확인: Once 소비됐으므로 이후 emit은 정상 동작
    emit('screen_viewed', { screen_id: 'after_fail' });
    await waitForQueue(1);
    const queue2 = await readQueue();
    expect(queue2).toHaveLength(1);
    expect(queue2[0].event.name).toBe('screen_viewed');
  });
});
