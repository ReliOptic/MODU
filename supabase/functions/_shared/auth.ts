// Auth helper — validate Supabase JWT from incoming request
// Used by all MODU Edge Functions that require user authentication.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { CORS_HEADERS } from './cors.ts';

export interface AuthResult {
  userId: string;
  /** Raw Supabase user object for any additional metadata reads. */
  email?: string;
}

/**
 * Extracts the Bearer token from the Authorization header and validates it
 * against Supabase Auth. Returns the authenticated user's ID on success.
 *
 * Throws a Response (401/500) on failure so callers can do:
 *   const auth = await getUserFromRequest(req).catch(r => r);
 *   if (auth instanceof Response) return auth;
 *
 * All error responses include CORS headers so preflight clients handle them
 * correctly.
 */
export async function getUserFromRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Use service role client but forward the user token so getUser() validates
  // the JWT and returns the correct user (not the service account).
  const client = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  return { userId: data.user.id, email: data.user.email ?? undefined };
}
