// Device-identity validator for MODU Edge Functions (ADR-0011 local-first).
// Clients send an opaque UUID v4 in X-Device-Id; server validates format only.
// No auth.users FK — truly anonymous per ADR-0005 privacy-as-moat.

import { CORS_HEADERS } from './cors.ts';

export interface DeviceAuthResult {
  deviceId: string;
}

// UUID v4 pattern (RFC 4122 §4.4). Rejects anything else to prevent abuse
// via attacker-chosen bucket keys (e.g. '' or 'admin' poisoning rate-limit rows).
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Extracts and validates the X-Device-Id header as a UUID v4.
 *
 * Throws a Response (400/401) on failure so callers can:
 *   const auth = await requireDeviceId(req).catch(r => r);
 *   if (auth instanceof Response) return auth;
 */
export function requireDeviceId(req: Request): DeviceAuthResult {
  const raw = req.headers.get('X-Device-Id') ?? '';
  if (!raw) {
    throw new Response(
      JSON.stringify({ code: 'MISSING_DEVICE_ID', message: 'X-Device-Id header required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const trimmed = raw.trim().toLowerCase();
  if (!UUID_V4_RE.test(trimmed)) {
    throw new Response(
      JSON.stringify({ code: 'INVALID_DEVICE_ID', message: 'X-Device-Id must be a UUID v4' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  return { deviceId: trimmed };
}
