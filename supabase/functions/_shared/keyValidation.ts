// _shared/keyValidation.ts — pure R2 key helpers (no Deno env access)
// Extracted for testability under Deno test runner.

/**
 * Build a deterministic R2 object key.
 * Format: u/{userId}/a/{assetId}/{YYYYMMDD}/{uuid}.{ext}
 * Dates are always UTC to avoid timezone-dependent path splits.
 */
export function buildKey(
  userId: string,
  assetId: string,
  mime: string,
  mimeToExt: Record<string, string>,
  now: Date = new Date(),
): string {
  const ext = mimeToExt[mime] ?? 'bin';
  const yyyymmdd =
    now.getUTCFullYear().toString() +
    (now.getUTCMonth() + 1).toString().padStart(2, '0') +
    now.getUTCDate().toString().padStart(2, '0');
  const uuid = crypto.randomUUID();
  return `u/${userId}/a/${assetId}/${yyyymmdd}/${uuid}.${ext}`;
}

/**
 * Validate that a key is strictly scoped to the given user and asset.
 * Returns true only when the key begins with `u/{userId}/a/{assetId}/`.
 */
export function validateKeyPrefix(
  key: string,
  userId: string,
  assetId: string,
): boolean {
  return key.startsWith(`u/${userId}/a/${assetId}/`);
}
