# MODU Data Export — Regulatory Compliance Reference

**Task #21 · Schema v1.0.0-2026-04-17**

This document records how the one-tap export feature (`src/lib/export.ts`,
`src/lib/remoteExport.ts`, `src/screens/ExportScreen.tsx`) satisfies the
right-of-access provisions of five concurrent data protection regulations.

---

## Architecture Summary

```
ExportScreen (UI)
  └─ exportToJson()              src/lib/export.ts
       ├─ buildExportBundle()
       │    ├─ LocalAssetRepository.list()        AsyncStorage → assets[]
       │    ├─ LocalEventRepository.list()        AsyncStorage → events[] (S1–S4)
       │    ├─ fetchFormation()                   Supabase → formation_sessions + answers
       │    ├─ fetchCare()                        Supabase → notes + medications + daily_logs
       │    ├─ fetchAttachments()                 Supabase metadata + R2 presigned GET URLs
       │    └─ readConsentRecord()                AsyncStorage → consent record
       └─ FileSystem.writeAsStringAsync()         expo-file-system → app-private JSON file
```

Output: `<documentDirectory>/modu-export-<YYYYMMDD-HHmmss>.json`
Format: JSON (UTF-8, pretty-printed, schema version tagged)
Access: app-private storage only; shared via OS share sheet (expo-sharing)

---

## Regulation-by-Regulation Checklist

### 1. HIPAA §164.524 — Individual's Right of Access to PHI (USA)

| Requirement | How fulfilled |
|---|---|
| Access to designated record set within **30 days** | Instant local export — 0-day fulfillment |
| PHI provided in the **form or format requested** | JSON (structured, machine-readable) |
| Electronic PHI delivered electronically | File written to device; shared via share sheet |
| Accounting: the access event itself is auditable | `screen_viewed { screen_id: 'export_complete' }` emitted (S4 audit placeholder; see TODO below) |

**Code location:** `src/lib/export.ts` — `buildExportBundle()`, `exportToJson()`

---

### 2. GDPR Art. 15 — Right of Access by the Data Subject (EU/EEA)

| Requirement | How fulfilled |
|---|---|
| Confirmation that personal data is being processed | Bundle includes all stored personal data categories |
| Copy of personal data in **structured, commonly used, machine-readable format** | JSON with schema version and regulatory envelope labels |
| Information about purposes, categories, recipients | `regulatory_envelopes` field in bundle; envelope descriptions embedded |
| Without undue delay, **within 1 month** | Instant local export |
| Data portability (Art. 20) | Same JSON file; user can transfer to any system |

**Code location:** `src/lib/export.ts:REGULATORY_ENVELOPE_DESCRIPTIONS`, `ExportBundle.regulatory_envelopes`

---

### 3. PIPA §35 — Right to Inspect Personal Information (대한민국)

| Requirement | How fulfilled |
|---|---|
| 개인정보 열람 청구권 — data subject may request inspection | Export button directly accessible; no institutional delay |
| Includes all personal information held by the controller | Assets (local) + events (local) + formation/care/attachments (Supabase) |
| Consent record accessible | `ExportBundle.consent` field includes the stored ConsentRecord |

**Code location:** `src/screens/ExportScreen.tsx` — UI copy explicitly names PIPA §35; `src/lib/export.ts` — consent included in bundle

---

### 4. APPI §33 — Disclosure of Retained Personal Data (日本)

| Requirement | How fulfilled |
|---|---|
| 保有個人データの開示 — disclosure to the data subject | All retained data categories (S1–S4 sensitivity levels) exported |
| S4 immutable audit records (partner/consent events) included | `includeS4Audit: true` (default); S4 records are never purged (EventRepository) |
| Timely disclosure | Instant local export |

**Code location:** `src/lib/export.ts:buildExportBundle({ includeS4Audit: true })`; `src/data/repositories/EventRepository.ts:purgeExpired` (S4 guard)

---

### 5. PIPEDA Principle 9 — Individual Access (Canada)

| Requirement | How fulfilled |
|---|---|
| Individual's right to access their own personal information | Complete bundle including all stored categories |
| Information must be **accurate and complete** | Direct read from AsyncStorage + Supabase (no server-side filtering beyond RLS) |
| Provided in **understandable form** | JSON with human-readable `regulatory_envelopes` descriptions |
| Within a **reasonable time** | Instant local export |

**Code location:** `src/lib/export.ts:REGULATORY_ENVELOPE_DESCRIPTIONS` (understandable classifications); `src/lib/remoteExport.ts` (complete Supabase fetch)

---

## Sensitivity Level Coverage

| Level | Description | Included in export | Purge policy |
|---|---|---|---|
| S1 | Session / navigation (90-day rolling) | Yes | Purged after 90 days |
| S2 | Moment engagement (90-day rolling) | Yes | Purged after 90 days |
| S3 | Chapter / memory / care events | Yes | Never purged |
| S4 | Partner / consent / audit (immutable) | Yes (default) | Never purged |

The user's legal right of access covers all sensitivity levels of their own data,
including S4 audit records. Set `includeS4Audit: false` only in specific compliance
contexts where audit log segregation is explicitly required.

---

## Security Notes

- Output file is written to `expo-file-system` `documentDirectory` — app-private,
  not accessible to other apps on iOS or Android.
- Attachment presigned GET URLs expire **15 minutes** after `exported_at`.
  The UI warns the user to share promptly. Re-export generates fresh URLs.
- No raw PII (email, name, phone) appears in event properties — the event schema
  enforces this via `signals_hash` (SHA-256) and opaque `partner_id` fields.
- S4 audit events emitted on export are themselves subject to the same immutable
  retention guarantee.

---

## Remaining TODOs

| Item | Notes |
|---|---|
| Add `data_export_requested` to `EVENT_REGISTRY` (S4/E4) | Currently proxied via `screen_viewed`; Task #22 |
| PDF export (`exportToPdf`) | Placeholder throws; requires `expo-print` + design work |
| Streaming progress for large attachment sets | `onProgress` fires per-step; per-attachment progress deferred |
| Re-export flow with URL refresh | UI has "Re-export" button; deep-link or Settings shortcut TBD |
