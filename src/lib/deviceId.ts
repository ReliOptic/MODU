// Device identity — local-first anonymous UUID v4 (ADR-0011, ADR-0005).
// Generated once on first call, persisted in AsyncStorage. No auth.users linkage.
// Used as X-Device-Id header for Edge Function rate-limit + audit buckets.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'modu.device.id.v1';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let memo: string | null = null;
let inflight: Promise<string> | null = null;

/**
 * Returns the persistent device_id, creating one on first call.
 * Concurrency-safe: simultaneous callers share the same inflight promise.
 */
export function getDeviceId(): Promise<string> {
  if (memo) return Promise.resolve(memo);
  if (inflight) return inflight;
  inflight = loadOrCreate().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function loadOrCreate(): Promise<string> {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing && UUID_V4_RE.test(existing)) {
    memo = existing;
    return existing;
  }
  const fresh = uuidV4();
  await AsyncStorage.setItem(STORAGE_KEY, fresh);
  memo = fresh;
  return fresh;
}

/**
 * Rotates the device_id — used by the future "Reset anonymous identity" action
 * in Settings → Privacy. Returns the new id.
 */
export async function rotateDeviceId(): Promise<string> {
  const fresh = uuidV4();
  await AsyncStorage.setItem(STORAGE_KEY, fresh);
  memo = fresh;
  return fresh;
}

/**
 * RFC 4122 §4.4 UUID v4. Uses crypto.getRandomValues when available
 * (iOS/Android Hermes + web) and falls back to Math.random with a dev warning
 * so a crypto-weak id never silently ships.
 */
function uuidV4(): string {
  const bytes = new Uint8Array(16);
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    if (__DEV__) {
      console.warn('[deviceId] crypto.getRandomValues unavailable — Math.random fallback');
    }
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return (
    hex.slice(0, 4).join('') +
    '-' +
    hex.slice(4, 6).join('') +
    '-' +
    hex.slice(6, 8).join('') +
    '-' +
    hex.slice(8, 10).join('') +
    '-' +
    hex.slice(10, 16).join('')
  );
}
