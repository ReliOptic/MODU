// Supabase client — 환경변수 wiring + typed schema
// ADR-0001 · Phase 0
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase client. URL/key 미설정 시 stub client 반환 — 개발 모드에서
 * "백엔드 없이도 앱이 실행" 보장. 실제 호출 시도 시 에러 throw.
 */
export const supabase: SupabaseClient<Database> = url && anon
  ? createClient<Database>(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : (createStub() as unknown as SupabaseClient<Database>);

export const isSupabaseConfigured = Boolean(url && anon);

function createStub() {
  const err = new Error(
    'Supabase 가 설정되지 않았습니다. EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 를 .env 에 추가하세요.'
  );
  // Proxy: 어떤 메서드 접근도 친절한 에러 throw
  return new Proxy(
    {},
    {
      get() {
        return () => {
          throw err;
        };
      },
    }
  );
}
