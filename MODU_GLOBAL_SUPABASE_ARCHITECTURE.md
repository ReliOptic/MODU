# MODU Global Architecture Note

## Purpose

This note defines the minimum safe architecture for launching **MODU as a global health-and-care app** while using **Supabase** as the initial backend platform.

The goal is not "use Supabase by default," but "use Supabase with clear boundaries, migration room, and strong data isolation."

---

## Decision

**Recommendation:** Start with **Supabase** for v1, but only with a **region-aware, security-first architecture**.

Supabase is a reasonable choice for MODU because:

- MODU needs product speed, iteration speed, and a managed Postgres backend.
- The core data model fits relational storage well: users, assets, notes, schedules, events, logs.
- Auth, Postgres, storage metadata, and edge functions cover most v1 backend needs.

Supabase is **not** enough by itself for global trust. MODU must add strict application-level controls for privacy, region handling, and AI access.

---

## Risk Profile

MODU handles sensitive user context, including:

- fertility journey data
- caregiver and treatment notes
- chronic condition logs
- medication schedules
- free-text personal health context

This is not a casual productivity app. It should be treated as a **sensitive personal data platform** from day one.

---

## Required Architecture

### 1. Region-aware backend from the start

Do **not** design MODU as one undifferentiated global database.

Minimum rule:

- assign each user to a primary data region at signup
- store user-owned operational data in that region
- keep region assignment stable unless a deliberate migration flow exists

Recommended early shape:

- `ap-northeast-*` for Korea / East Asia users
- `eu-*` for EU users
- `us-*` for US and default English-market users

This keeps future compliance and migration manageable.

### 2. Strict row-level isolation

Every user-owned table must enforce **RLS** with ownership checks based on `auth.uid()`.

At minimum, apply this to:

- `profiles`
- `assets`
- `formation_sessions`
- `formation_answers`
- `events`
- `notes`
- `medications`
- `daily_logs`
- `shared_access` if collaboration is added

Default posture:

- deny by default
- allow only owner access
- add explicit sharing rules later if needed

### 3. Server-side AI boundary

Client apps must never call model providers directly with privileged keys.

Use **Supabase Edge Functions** as the AI boundary for:

- Claude or other LLM requests
- prompt assembly
- redaction or minimization
- rate limiting
- audit logging

This is mandatory for controlling data exposure and key leakage.

### 4. Secrets and privileged access

Never expose `service_role` in the mobile app or web client.

Rules:

- client uses anon key only
- privileged jobs run only in edge functions or trusted server environments
- admin queries are isolated and audited

### 5. Backup and recovery

Daily backups are not enough for a sensitive global app once real usage starts.

Minimum production standard:

- enable backup monitoring immediately
- enable PITR for production once user data matters
- document restore steps before launch
- test restore on a non-production project

### 6. Data minimization

Do not store more health detail than MODU truly needs.

Rules:

- separate structured care data from free-text narrative
- keep raw transcripts only if they provide direct product value
- avoid storing unnecessary identifiers
- treat uploaded files as higher-risk than notes

If highly sensitive documents or medical records are introduced later, the security bar must increase again.

---

## What This Means for MODU

Supabase is appropriate for:

- MVP
- first public launch
- multi-country early growth
- product iteration with moderate operational overhead

Supabase becomes risky if MODU does any of the following without stronger controls:

- stores highly regulated medical records
- mixes all countries into one data plane
- relies on client-side direct AI calls
- runs without tested backup and restore procedures
- treats RLS as optional

---

## Recommended v1 Stack

- **Auth:** Supabase Auth
- **Primary DB:** Supabase Postgres
- **Server logic:** Supabase Edge Functions
- **Authorization:** RLS on every user data table
- **AI integration:** Edge Function proxy only
- **Observability:** structured logs for auth, AI calls, and failures
- **Recovery:** backups + PITR for production

---

## Final Position

**Yes, MODU can start on Supabase.**

But for a global health-and-care product, the correct strategy is:

**Start on Supabase, design for regional isolation, enforce RLS everywhere, keep AI server-side, and preserve the option to split infrastructure later.**

That is the line between a fast MVP backend and a backend that can grow into a trusted global service.
