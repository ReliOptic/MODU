// UUID v4 helper. Per ADR-0013 Addendum A4 every sync-ready entity must
// have a UUID identifier from day one. Uses Web Crypto when available,
// falls back to a Math.random implementation for older React Native.
// Intentionally synchronous so it can be called inline during entity
// creation without turning every caller into an async function.

function mathRandomUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function uuid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto && typeof g.crypto.randomUUID === 'function') {
    return g.crypto.randomUUID();
  }
  return mathRandomUuidV4();
}

/** ISO-8601 UTC timestamp for `updatedAt` / `createdAt` / `syncedAt` fields. */
export function nowIso(): string {
  return new Date().toISOString();
}
