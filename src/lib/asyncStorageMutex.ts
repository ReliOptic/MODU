// asyncStorageMutex — key별 Promise-chain mutex.
// 동일 key 에 대한 concurrent 접근을 직렬화해 AsyncStorage read→mutate→write 원자성 보장.
// EventRepository.save/flushQueue 와 events.ts enqueue/drainQueue 가 공유.

const locks = new Map<string, Promise<void>>();

/**
 * key 에 대한 직렬 실행 보장. 동일 key 의 이전 작업 완료 후 fn 실행.
 * fn 내부에서 동일 key 로 withKeyLock 재진입 시 데드락 발생 주의
 * (flushQueue → save 중첩은 별도 key 분리로 해결).
 */
export function withKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  // 내부 에러가 chain 을 오염시키지 않도록 void-settled promise 만 보관
  locks.set(key, next.then(() => {}, () => {}));
  return next;
}
