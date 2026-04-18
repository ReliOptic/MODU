# MODU Supabase Edge Functions

AI + storage boundary layer — all third-party API calls happen here, never in the client app.

## Functions

| Function | Purpose | Upstream API | Auth |
|---|---|---|---|
| `ai-openrouter` | OpenRouter LLM proxy (Gemma 3, ADR-0012) | OpenRouter | `X-Device-Id` (ADR-0011) |
| `r2-presign` | Cloudflare R2 presigned URL generator (upload & download) | Cloudflare R2 | Bearer JWT (Phase 3: device-id) |
| `r2-complete` | Finalise upload — inserts `attachments` row in Supabase | — | Bearer JWT (Phase 3: device-id) |

> 2026-04-18: `ai`, `ai-claude`, `ai-whisper` retired together with the Bearer-JWT client path (ADR-0012 update). If a Claude/Whisper path returns, it must use the device-identity convention (`_shared/deviceAuth.ts`), not legacy user JWT.

## Server secrets setup

Edge Functions require server-only secrets that must **never** appear in `.env.example` or client bundles. Copy the example file and fill in real values for local development:

```bash
cp supabase/functions/.env.functions.example supabase/functions/.env.functions
# edit .env.functions with actual keys
```

Then serve locally:
```bash
supabase functions serve ai-openrouter --env-file supabase/functions/.env.functions
```

For production, register secrets with Supabase Vault (never commit `.env.functions`):
```bash
supabase secrets set OPENROUTER_API_KEY=<openrouter-key>
supabase secrets set R2_ACCOUNT_ID=<account-id>
supabase secrets set R2_ACCESS_KEY_ID=<key-id>
supabase secrets set R2_SECRET_ACCESS_KEY=<secret>
supabase secrets set R2_BUCKET_NAME=<bucket>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the platform and do not need manual setup for deployed functions.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Project linked: `supabase link --project-ref <project-ref>`

## Running migrations

```bash
supabase db push
# or for a specific migration:
supabase migration up
```

## Deploying

```bash
# ai-openrouter — device-id path (no gateway JWT verification)
supabase functions deploy ai-openrouter --no-verify-jwt

# r2-presign / r2-complete — user JWT path (Phase 3 will transition to device-id)
supabase functions deploy r2-presign --no-verify-jwt=false
supabase functions deploy r2-complete --no-verify-jwt=false
```

## Calling ai-openrouter

Identity comes from a device-local UUID v4 sent in the `X-Device-Id` header (see `src/lib/deviceId.ts`). No user account, no Bearer token.

```bash
curl -X POST \
  'https://<project>.supabase.co/functions/v1/ai-openrouter' \
  -H 'X-Device-Id: 550e8400-e29b-41d4-a716-446655440000' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [{"role": "user", "content": "이번 주를 요약해줘"}],
    "model": "google/gemma-4-31b-it"
  }'
```

Response:
```json
{
  "content": "...",
  "usage": { "prompt_tokens": 30, "completion_tokens": 120, "total_tokens": 150 },
  "model": "google/gemma-4-31b-it",
  "latency_ms": 820,
  "request_id": "<uuid from ai_audit>"
}
```

Optional fields: `temperature`, `max_tokens`, `response_format: { type: 'json_object' }`.

## Architecture notes

- **Rate limit**: 20 requests/minute per device per function. Two-layer enforcement:
  - L1: in-process memory (fast path, resets on cold-start)
  - L2: `ai_device_rate_limits` Supabase table via atomic RPC (persistent across isolate recycling)
- **Audit log**: every call writes a row to `ai_audit` (metadata only — no prompt content). Device-id-scoped rows are invisible to any authenticated user per RLS. See migration `20260418000010_10_device_identity.sql`.
- **service_role key**: used inside Edge Functions only. Never returned to client. Never appears in client code, `.env.example`, or tests.
- **CORS**: `Access-Control-Allow-Origin: *` — acceptable while React Native is the primary client. Tighten in `_shared/cors.ts` before shipping a web build to production.

## r2-presign / r2-complete

### Overview — 2-step presigned URL flow

```
Client                  Edge Function (r2-presign)       Cloudflare R2
  │                             │                              │
  │─ POST /r2-presign ─────────►│                              │
  │  { asset_id, mime,          │── generate presigned PUT ───►│
  │    byte_size, op:'upload' } │◄─ signed URL ───────────────│
  │◄─ { url, key, headers } ───│                              │
  │                             │                              │
  │─ PUT <signed URL> ─────────────────────────────────────────►│
  │◄─ 200 OK ──────────────────────────────────────────────────│
  │                             │                              │
  │─ POST /r2-complete ────────►│                              │
  │  { key, asset_id,           │── INSERT attachments row ───►│ (Supabase)
  │    mime, byte_size }        │◄─ attachment_id ────────────│
  │◄─ { attachment_id } ───────│                              │
```

Download flow (single step):
```
Client                  Edge Function (r2-presign)       Cloudflare R2
  │─ POST /r2-presign ─────────►│                              │
  │  { asset_id, mime,          │── generate presigned GET ───►│
  │    op:'download',           │◄─ signed URL ───────────────│
  │    attachment_id }          │                              │
  │◄─ { url, expires_in } ─────│                              │
  │─ GET <signed URL> ─────────────────────────────────────────►│
```

### Object key format

```
u/{user_id}/a/{asset_id}/{YYYYMMDD}/{uuid}.{ext}
```

- Prefix `u/{user_id}/` scopes all objects to the owner. Phase 3 switches the prefix to `d/{device_id}/` to match ADR-0011.
- Extension is derived from the mime type, never from the client filename.

### Mime whitelist

| MIME type | Extension |
|---|---|
| `image/jpeg` | `.jpg` |
| `image/png` | `.png` |
| `image/webp` | `.webp` |
| `audio/m4a` | `.m4a` |
| `audio/mp3` / `audio/mpeg` | `.mp3` |
| `audio/webm` | `.webm` |
| `application/pdf` | `.pdf` |

Any other MIME type returns **415 Unsupported Media Type**.

### File size limit

Maximum **20 MB**. Exceeded size returns **413 Request Entity Too Large**.

### Pre-deploy checklist

- [ ] `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` set via `supabase secrets set`
- [ ] Migration `20260417000008_08_r2_audit.sql` applied
- [ ] R2 bucket CORS configured to allow PUT/GET from app domain:
  ```json
  [{"AllowedOrigins":["https://your-app.com"],"AllowedMethods":["PUT","GET"],"AllowedHeaders":["Content-Type","Content-Length"],"MaxAgeSeconds":600}]
  ```
- [ ] Functions deployed with the appropriate `--no-verify-jwt` flag
- [ ] `attachments` row and `r2_audit` row created after a test upload
- [ ] Presigned PUT URL expires after 10 min, GET URL after 5 min
