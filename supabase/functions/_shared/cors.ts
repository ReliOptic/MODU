// CORS headers for MODU Edge Functions
// All functions import this to keep headers consistent.

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Returns a 204 pre-flight response. */
export function corsPreFlight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Wraps a JSON body with CORS headers. */
export function jsonResp(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
