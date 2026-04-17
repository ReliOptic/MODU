# MODU Supabase Edge Functions

AI boundary layer — all model API calls happen here, never in the client app.

## Functions

| Function | Purpose | Upstream API |
|---|---|---|
| `ai-claude` | Anthropic Claude LLM proxy | Anthropic API |
| `ai-whisper` | Speech-to-text proxy | OpenAI Whisper |
| `ai/` | Intent-based legacy proxy (ADR-0002 v1) — **deprecated, sunset 2026-05-01** | Anthropic API |
| `r2-presign` | Cloudflare R2 presigned URL generator (upload & download) | Cloudflare R2 |
| `r2-complete` | Finalise upload — inserts `attachments` row in Supabase | — |

## Server secrets setup

Edge Functions require server-only secrets that must **never** appear in `.env.example` or client bundles.

Copy the example file and fill in real values for local development:

```bash
cp supabase/functions/.env.functions.example supabase/functions/.env.functions
# edit .env.functions with actual keys
```

Then serve locally:
```bash
supabase functions serve ai-claude --env-file supabase/functions/.env.functions
```

For production, register secrets with Supabase Vault (never commit `.env.functions`):
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set R2_ACCOUNT_ID=<account-id>
supabase secrets set R2_ACCESS_KEY_ID=<key-id>
supabase secrets set R2_SECRET_ACCESS_KEY=<secret>
supabase secrets set R2_BUCKET_NAME=<bucket>
```

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Project linked: `supabase link --project-ref <project-ref>`

## Setting secrets (required before deploy)

```bash
# Anthropic — ai-claude function
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# OpenAI — ai-whisper function
supabase secrets set OPENAI_API_KEY=sk-...

# Supabase service role (auto-injected by platform, manual for local serve)
# supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Verify secrets are set:
```bash
supabase secrets list
```

## Running migrations

Apply the ai_audit + ai_rate_limits tables before deploying functions:

```bash
supabase db push
# or for a specific migration:
supabase migration up
```

## Deploying

```bash
# Deploy ai-claude
supabase functions deploy ai-claude --no-verify-jwt=false

# Deploy ai-whisper
supabase functions deploy ai-whisper --no-verify-jwt=false

# Deploy legacy ai function (preserve existing)
supabase functions deploy ai --no-verify-jwt=false
```

`--no-verify-jwt=false` enforces JWT verification (default secure posture).

## Local development

```bash
supabase start          # start local Supabase stack
supabase functions serve ai-claude --env-file .env.local
supabase functions serve ai-whisper --env-file .env.local
```

Create `.env.local` for local serve (never commit this file):
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key from supabase start output>
```

## Calling ai-claude

```bash
curl -X POST \
  'https://<project>.supabase.co/functions/v1/ai-claude' \
  -H 'Authorization: Bearer <user-jwt>' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [{"role": "user", "content": "이번 주를 요약해줘"}],
    "context": {"role": "self", "locale": "ko-KR"}
  }'
```

Response:
```json
{
  "content": "이번 주는...",
  "model": "claude-sonnet-4-6",
  "usage": { "input_tokens": 30, "output_tokens": 120, "cache_read_tokens": 0 },
  "request_id": "<uuid from ai_audit>"
}
```

Optional fields:
- `system` (string): additional system prompt appended after tone guard
- `model`: `"claude-opus-4-7"` | `"claude-sonnet-4-6"` | `"claude-haiku-4-5-20251001"`

## Calling ai-whisper

```bash
curl -X POST \
  'https://<project>.supabase.co/functions/v1/ai-whisper' \
  -H 'Authorization: Bearer <user-jwt>' \
  -F 'audio=@recording.webm' \
  -F 'locale=ko-KR'
```

Response:
```json
{
  "transcript": "오늘 진료에서 의사가...",
  "language": "ko",
  "duration_s": 8.4,
  "request_id": "<uuid from ai_audit>"
}
```

## Architecture notes

- **Rate limit**: 20 requests/minute per user per function. Enforced via two layers:
  - L1: in-process memory (fast path, resets on cold-start)
  - L2: `ai_rate_limits` Supabase table (persistent, survives isolate recycling)
- **PII redaction**: messages are scanned for phone numbers, emails, Korean RRN, and passports before being forwarded to the model. Matches are replaced with typed placeholders (`[PHONE]`, `[EMAIL]`, `[RRN]`, `[PASSPORT]`).
- **Audit log**: every call writes a row to `ai_audit` (metadata only — no prompt content). Users can read their own rows; only service_role can insert.
- **Prompt caching**: Claude system prompt includes `cache_control: ephemeral` to reduce token cost on repeated calls (~90% system prompt savings).
- **service_role key**: used inside Edge Functions only. Never returned to client. Never appears in client code, `.env.example`, or tests.
- **CORS**: `Access-Control-Allow-Origin: *` is intentional for the current React Native-only build. **WARNING**: when adding a web build, restrict this to an explicit origin allowlist in `_shared/cors.ts` before shipping.

## Pre-deploy checklist

- [ ] `ANTHROPIC_API_KEY` set via `supabase secrets set`
- [ ] `OPENAI_API_KEY` set via `supabase secrets set`
- [ ] Migration `20260417000004_07_ai_audit.sql` applied (`supabase db push`)
- [ ] `ai_rate_limits` table exists in target project
- [ ] Functions deployed with `--no-verify-jwt=false`
- [ ] Test with a real user JWT (not anon key) — auth is enforced
- [ ] Verify `ai_audit` rows appear after a test call
- [ ] Check Supabase Function logs for any cold-start errors

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

Example: `u/abc-123/a/def-456/20260417/550e8400-e29b-41d4-a716-446655440000.jpg`

- Prefix `u/{user_id}/` scopes all objects to the owner — enforced server-side.
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

Maximum **20 MB** (`20 * 1024 * 1024` bytes). Exceeded size returns **413 Request Entity Too Large**.

### Setting R2 secrets (required before deploy)

```bash
supabase secrets set R2_ACCOUNT_ID=<your-cloudflare-account-id>
supabase secrets set R2_ACCESS_KEY_ID=<r2-access-key>
supabase secrets set R2_SECRET_ACCESS_KEY=<r2-secret-key>
supabase secrets set R2_BUCKET_NAME=<bucket-name>
```

These secrets are server-only. They must never appear in client code, `.env.example`, or test files.

### Deploying r2-presign / r2-complete

```bash
supabase functions deploy r2-presign --no-verify-jwt=false
supabase functions deploy r2-complete --no-verify-jwt=false
```

Apply the r2_audit migration before deploying:

```bash
supabase db push
# or: supabase migration up
```

### Local development

```bash
supabase functions serve r2-presign --env-file .env.local
supabase functions serve r2-complete --env-file .env.local
```

Add to `.env.local` (never commit):
```
R2_ACCOUNT_ID=<dev-account-id>
R2_ACCESS_KEY_ID=<dev-key>
R2_SECRET_ACCESS_KEY=<dev-secret>
R2_BUCKET_NAME=modu-dev
```

### Calling from the client

Use `src/lib/r2Client.ts` — never call R2 presigned URLs from raw fetch in product code.

```ts
import { uploadAttachment, getAttachmentUrl } from '@/lib/r2Client';

// Upload
const { attachment_id, key } = await uploadAttachment({
  assetId: 'asset-uuid',
  file: audioBlob,
  mime: 'audio/webm',
  onProgress: (bytes) => console.log(`uploaded ${bytes} bytes`),
});

// Download (presigned GET URL, valid 5 min)
const { url, expires_in } = await getAttachmentUrl({
  attachmentId: attachment_id,
  assetId: 'asset-uuid',
  mime: 'audio/webm',
});
```

### Pre-deploy checklist

- [ ] `R2_ACCOUNT_ID` set via `supabase secrets set`
- [ ] `R2_ACCESS_KEY_ID` set via `supabase secrets set`
- [ ] `R2_SECRET_ACCESS_KEY` set via `supabase secrets set`
- [ ] `R2_BUCKET_NAME` set via `supabase secrets set`
- [ ] Migration `20260417000008_08_r2_audit.sql` applied (`supabase db push`)
- [ ] R2 bucket CORS configured to allow PUT from your app domain:
  ```json
  [{"AllowedOrigins":["https://your-app.com"],"AllowedMethods":["PUT","GET"],"AllowedHeaders":["Content-Type","Content-Length"],"MaxAgeSeconds":600}]
  ```
- [ ] Functions deployed with `--no-verify-jwt=false`
- [ ] Test upload with a real user JWT — verify `attachments` row inserted and `r2_audit` row written
- [ ] Verify presigned PUT URL expires after 10 min, GET URL after 5 min

---

## Task #20 reference — auth path for R2 presigned URLs

The same `getUserFromRequest` helper in `_shared/auth.ts` can be reused by an
`r2-presign` Edge Function. The pattern is identical:

```ts
import { getUserFromRequest } from '../_shared/auth.ts';

// Inside the handler:
const { userId } = await getUserFromRequest(req); // throws 401 Response on failure
// userId is now a verified Supabase auth.uid() — safe to use as R2 object prefix
```

The user JWT (`Authorization: Bearer <token>`) is the single authentication
surface. The Edge Function extracts and validates it via Supabase Auth, then
uses the verified `userId` to scope any downstream resource access (R2, S3, etc.).
