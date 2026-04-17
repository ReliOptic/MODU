// MODU ai-whisper Edge Function — OpenAI Whisper STT proxy
// ADR-0002
//
// POST /functions/v1/ai-whisper
//   Authorization: Bearer <supabase user JWT>
//   Content-Type: multipart/form-data
//   Fields: audio (Blob), locale (string, e.g. 'ko-KR')
//   Response: { transcript: string, language: string, duration_s: number, request_id: string }
//
// Deploy: supabase functions deploy ai-whisper --no-verify-jwt=false
// Secrets: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { corsPreFlight, jsonResp } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { insertWhisperAudit } from '../_shared/audit.ts';

// ─── Constants ───────────────────────────────────────────────────────────────

const WHISPER_API = 'https://api.openai.com/v1/audio/transcriptions';
const RATE_LIMIT_PER_MINUTE = 20;
// 25 MB — OpenAI Whisper hard limit
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

// Locale → BCP-47 language hint for Whisper `language` parameter
const LOCALE_TO_LANG: Record<string, string> = {
  'ko-KR': 'ko',
  'ko': 'ko',
  'en-US': 'en',
  'en': 'en',
  'ja-JP': 'ja',
  'ja': 'ja',
  'zh-CN': 'zh',
  'de-DE': 'de',
  'fr-FR': 'fr',
};

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreFlight();
  if (req.method !== 'POST') return jsonResp(405, { error: 'Method not allowed' });

  // 1) Auth
  let userId: string;
  try {
    const auth = await getUserFromRequest(req);
    userId = auth.userId;
  } catch (resp) {
    return resp as Response;
  }

  // 2) Rate limit
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const allowed = await checkRateLimit(
    supabaseUrl,
    serviceKey,
    userId,
    'ai-whisper',
    RATE_LIMIT_PER_MINUTE
  );
  if (!allowed) {
    return jsonResp(429, { error: 'Rate limit exceeded. Maximum 20 requests per minute.' });
  }

  // 3) Parse multipart form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonResp(400, { error: 'Expected multipart/form-data with audio field' });
  }

  const audioField = formData.get('audio');
  if (!audioField || !(audioField instanceof File || audioField instanceof Blob)) {
    return jsonResp(400, { error: 'Missing audio field (must be a Blob/File)' });
  }

  const locale = (formData.get('locale') as string | null) ?? 'en';
  const audioBlob = audioField as Blob;

  if (audioBlob.size > MAX_AUDIO_BYTES) {
    return jsonResp(413, { error: 'Audio file exceeds 25 MB limit' });
  }

  // 4) Call OpenAI Whisper
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return jsonResp(500, { error: 'STT service not configured' });

  const language = LOCALE_TO_LANG[locale] ?? locale.split('-')[0] ?? 'en';

  const whisperForm = new FormData();
  whisperForm.append('file', audioBlob, 'audio.webm');
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('language', language);
  whisperForm.append('response_format', 'verbose_json');

  const t0 = Date.now();
  let whisperResp: Response;
  try {
    whisperResp = await fetch(WHISPER_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });
  } catch (err) {
    console.error('[ai-whisper] fetch error:', err);
    return jsonResp(502, { error: 'STT service unreachable' });
  }

  const durationMs = Date.now() - t0;

  if (!whisperResp.ok) {
    const errText = await whisperResp.text();
    console.error('[ai-whisper] upstream error:', whisperResp.status, errText.slice(0, 300));
    return jsonResp(502, { error: 'STT upstream error', upstream_status: whisperResp.status });
  }

  const whisperJson = await whisperResp.json() as {
    text: string;
    language: string;
    duration?: number;
    segments?: unknown[];
  };

  // 5) Audit log
  const requestId = await insertWhisperAudit(supabaseUrl, serviceKey, {
    userId,
    bytesIn: audioBlob.size,
    durationMs,
  });

  return jsonResp(200, {
    transcript: whisperJson.text ?? '',
    language: whisperJson.language ?? language,
    duration_s: whisperJson.duration ?? 0,
    request_id: requestId,
  });
});
