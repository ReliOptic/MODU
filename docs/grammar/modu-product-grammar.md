# MODU Product Grammar — One Product, One Language

- Status: **English-master** (per ADR-0014, 2026-04-17). Korean preserved at `modu-product-grammar.ko.md`.
- Live document. Update commit: `docs(grammar): ...`
- Audience: CEO / CPO / CTO / CDO / SA / Engineering / Design / external advisors.
- Principle: **This document is MODU.** Meetings, code, copy, external talks all follow this grammar.

> **Why this exists**
> When personas multiply, vocabulary fragments. When vocabulary fragments, decisions slow.
> Compounding begins the moment every person on one product points at the same thing with the same word.
> This document is the single language of MODU.

---

## 0. One-sentence identity

> **MODU is *the permanent library of life's medical chapters*.**

Four core metaphors descend from that sentence: **Chapter · Memory · Library · Companion**.

---

## 1. Core Metaphors (7)

| Metaphor | Meaning | Appears in | Exposure | Anti-metaphor (avoid) |
|----------|---------|-----------|----------|------------------------|
| **Chapter** (ko: 챕터) | A span of life — with a beginning, an arc, a close | Asset user-facing name, Birth/Archive rituals | user-facing | "project", "case", "campaign" |
| **Memory** (ko: 기억) | An accumulated trace that does not fade | ChapterMemory, MemoryGlance | user-facing | "data", "log", "entry" |
| **Library** (ko: 라이브러리 / "my shelf": 서가) | Collection of chapters; ended chapters are preserved | Chapter Archive, "my shelf" | user-facing | "archive", "dashboard", "history" |
| **River** (ko: 강) | Flow of time — up is past, down is future | TimeRiver | **internal** (user sees "Today") | "timeline", "feed", "stream" |
| **Companion** (ko: 동반자) | MODU's identity — walks alongside | AI tone, FormationFlow messages | **internal** (tone only) | "assistant", "helper", "bot" |
| **Light** (ko: 빛) *minor* | Soft emphasis that never blinks | AmbientPalette accent, highlight | **internal** | "alert", "badge", "popup" |
| **Moments** (ko: 순간) *added 2026-04-17* | Atomic unit of meaning the AI can select, compose, learn (widget < Moment < screen) | Moment library (ADR-0013) | **internal** | "widget", "component" |

**Exposure rule** (2026-04-17): user-facing words = **Chapter · Memory · Library**. Internal-only (never surfaced in UI labels or copy) = **River · Companion · Light · Moments**. See §4.6 for the internal-metaphor UI ban.

**Application rule**: when naming a new feature, check alignment with one of the 7 metaphors. If none fit, justify why before inventing a new metaphor.

---

## 2. Lexicon — Core terms

Each row: **(Code) — User-facing copy (en / ko) — Definition — Never say**.

### 2.1 Entities

| Code | User copy (en / ko) | Definition | Never |
|------|---------------------|------------|-------|
| `Asset` | **Chapter** / **챕터** | One care journey for one user (3rd IVF cycle, mom's chemo, Bori's joint care) | "project", "case" |
| `ChapterMemory` | **Memory** / **기억** | Append-only timeline event (note, med, photo, mood, visit) | "record", "entry", "log" |
| `ScheduledEvent` | **Upcoming / Past** / **다가오는 일 · 지나간 일** | Time-coordinate event (procedure, visit, injection) | "event", "appointment" |
| `PartnerLink` | **Someone walking with you** / **함께하는 사람** | Person sharing the chapter (spouse, family, doctor) | "collaborator", "shared user" |
| `MediaArtifact` | **Photo / Document** / **사진 · 문서** | Attachment on a chapter | "file", "attachment" |
| `ChapterArchive` | **Completed Chapter** / **마무리된 챕터** | Permanent preservation of a closed chapter | "deleted", "hidden" |

### 2.2 Rituals

Rituals are moments where the user feels conscious weight. Distinct from ordinary transitions.

| Code | User copy (en / ko) | Definition |
|------|---------------------|------------|
| `Birth Ritual` | **Your first chapter begins** / **첫 챕터가 시작됩니다** | Formation complete → chapter born. 1.5s hold + haptic |
| `Chapter Switch Ritual` | **Moving to ○○** / **○○ 챕터로 이동** | 920ms ritual (fade-out 280 + hold 360 + fade-in 280) |
| `Archive Ritual` | *(not yet built)* **This chapter closes** / **챕터를 마무리합니다** | Close. User leaves a one-line farewell |
| `Memory Glance` | **One year ago today** / **1년 전 오늘** | Last-year same-day ChapterMemory surfacing. Only meaningful days |

### 2.3 Surfaces (UI units)

| Code | User copy (en / ko) | Definition |
|------|---------------------|------------|
| `TimeRiver` | **Today** / **오늘** (home tab) | Past above, future below, NOW sticky |
| `StoryCard` | *(no label, just a card)* | One narrative line + data. Not a plain info card |
| `AmbientPalette` | *(invisible, background)* | Background tone that shifts with time / place / phase / mood |
| `NextActionPrompt` | **Next step** / **다음 한 걸음** | Floating action card, zero-friction logging |
| `AssetSwitcher` | *(header ▾)* **Switch chapter** / **에셋 전환** | Inter-chapter entry point |

### 2.4 Process

| Code | User copy (en / ko) | Definition |
|------|---------------------|------------|
| `Formation` | **First conversation** / **첫 대화** | 5-step interview that creates a new chapter |
| `Weekly Distill` | **This week in one line** / **이번 주의 한 줄** | Sunday-dawn AI summary of the week's ChapterMemories |
| `Layout Engine` | *(invisible)* | Widget re-prioritization on TPO change |
| `Context Hints` | *(invisible)* | User patterns extracted for the next render |

### 2.5 Infrastructure (internal only)

| Code | Definition |
|------|------------|
| `L1 ~ L4` | Adaptive engine's 4-layer cache (device / hint / edge / cron) |
| `intent` | Edge Function `ai/{intent}` call unit (`formation.summarize`, etc.) |
| `palette` | Chapter-type color tokens (`dawn` / `mist` / `blossom` / `sage` / `dusk`) |
| `phase` | Event stage (`before` / `during` / `after`) |
| `TPO` | Time / Place / Occasion — adaptive UI signal |
| `Moment` | Adaptive-by-Default atomic render unit — `id · intent · slot · predicate · render · events · variants` (ADR-0013) |
| `Slot` | Five screen regions (`skin` / `glance` / `hero` / `row` / `floating`) — Moment placement |
| `Signal Axes` | L0 (user declaration) > L1 (observed: TPO · Role · Phase) > L2 (AI inference) — priority enforced |
| `Role` | `self` / `partner` / `caregiver` / `doctor` — primary render-branch key (same chapter × different role → different Moment set) |
| `Quality Contract` | 7 constraints on Moment render (Bounded · Observable · Predictable · Reversible · Auditable · Fallback · A11y) |
| `Agora` *internal philosophy* | Chatless shared care (not a solo diary). Never user-facing — §4.6 |
| `quiet-weave` | P0 hero Moment — weaves partner signals into the user's timeline without surfacing (ADR-0013 A1) |
| `bonding predicate` | Trigger for sync invitation (activity ≥ 7d · ChapterMemory ≥ 5 · photos ≥ 1 · phase transition ≥ 1 — ADR-0011 Addendum) |

---

## 3. Voice & Tone — speaking to the user

### 3.1 Five tonal principles

1. **Warm, restrained.** Light encouragement is fine; excess cheer is rude.
2. **Verbs over nouns.** *"Write it down"* over *"record"*.
3. **Second person, not first.** *"The note you wrote"* over *"the data we tracked"*.
4. **Everyday time.** *"tomorrow morning"* over *"D-1"* over *"23 hours until transfer"*. Earlier is better.
5. **Acknowledge weight.** IVF, chemo, caregiving are not light. Pause half a beat: *"Hold on..."*.

### 3.2 Tone examples (good vs bad)

| Situation | ❌ Bad | ✅ Good |
|-----------|-------|---------|
| Injection done | "1 injection complete! Today's mission cleared 🎯" | "Gonal-F this morning. Well done." |
| Day after chemo | "Round 5/7 in progress. You got this!" | "Yesterday was round 5. Take today slowly." |
| Memory surfacing | "Memory Unlock! 1 year ago today" | "One year ago today, you had your first shot." |
| Error | "Error occurred. Please retry." | "Trouble connecting just now — one more try?" |
| Empty state | "No data yet." | "Your first memory will settle here." |

### 3.3 Linguistic texture per locale

- **`en-US` / `en-CA`**: second-person *"you"*, lowercase brand voice (*"we listen"*), no exclamation marks.
- **`ko-KR`**: formal register (존댓말), name-address *"○○님"*, self-reference *"저희"*.
- **`ja-JP`**: 敬語 baseline (parallels Korean register), reserved enthusiasm.
- **`de-DE`**: du / Sie — default **Sie** for medical register, switch only on explicit opt-in.
- **`fr-FR` / `fr-CA`**: vous by default; fr-CA allows warmer softening ("on") in empathy contexts.

Cultural role semantics per locale live in ADR-0014.

---

## 4. Anti-Lexicon — never say

### 4.1 Gamification vocabulary (permanent ban)

> Medical / care is not a game. The moment chemo round 5 becomes an "achievement", the brand dies.

`streak` `badge` `level` `XP` `points` `mission` `quest` `clear` `achieve` `ranking` `leaderboard` `challenge` `reward`

### 4.2 Medical-distancing vocabulary

> The user is not a *patient*. They are a person living their chapter.

`patient` `diagnosis` `prescription` `administration` `symptom management` `case`

→ Instead: *○○ / them / medication / visit / together*.

### 4.3 Data-distancing vocabulary

> The user is not entering data. They are leaving memories.

`data entry` `log` `entry` `record` `field` `value`

→ Instead: *memory / jot / leave / note*.

### 4.4 AI self-aggrandizing vocabulary

> The AI is a *companion*, not a teacher.

`AI analysis` `diagnosis` `we recommend` `solution` `optimal answer`

→ Instead: *we looked together / a pattern shows / what if*.

### 4.5 Judgmental vocabulary

> We do not evaluate the user's condition, decision, or feeling.

`bad` `dangerous` `failure` `wrong` `giving up`

→ Instead: *it passed / next time / slowly / that can happen*.

### 4.6 Internal metaphor / system vocabulary exposed in UI (added 2026-04-17)

> MODU does not *prove* what it is; it quietly guides the user to *feel* it. (ADR-0013 A3)

Internal metaphor and system terms — usable in design, code, ADRs, and commits only — are banned everywhere user-facing (UI, copy, labels, onboarding, settings):

`Agora` `Moments` `순간` `quiet-weave` `TimeRiver` `StoryCard` `AmbientPalette` `Signal Axes` `slot` `predicate` `Role` `phase` `L0` `L1` `L2` `L4` `TPO` `bonding predicate`

**Copy that surfaces the relationship is also banned** — care feels natural, not announced:

| ❌ Surfaced | ✅ Metaphoric guide |
|-------------|---------------------|
| "Your partner took their injection" | *(no alert; it simply appears in the timeline, and your "next step" subtly shifts)* |
| "Your partner is in the Agora" | *(not shown)* |
| "AI Moment starting" | *(render changes; no UI explanation)* |
| "Role: Partner mode" | *(UI is already role-adaptive; no label needed)* |
| "Turn on cloud sync" | "These memories live only on this device right now" (ADR-0011 Addendum) |

When naming a new Moment / component / copy, pass **two gates**:
1. Would this word feel clumsy if it appeared in user-facing copy?
2. Does it convey *what it makes the user feel*, not *what it is*?

If both fail, keep it as an internal codename.

---

## 5. Decision Phrasing — meetings, docs, commits

### 5.1 In meetings

- *"This feels like gamification."* → §4.1 hit; reframe now.
- *"Is this inside Chapter vocabulary?"* → prove it against §1 before inventing a metaphor.
- *"Ritual or transition?"* → if the user must feel weight, it's a ritual.

### 5.2 Commit messages

```
feat(chapter): birth ritual after formation completion
docs(grammar): add Archive Ritual definition
fix(memory): MemoryGlance crash on empty ChapterMemory
refactor(layout-engine): L2 cache hint integration
```

- `type(scope)` — scope uses lexicon terms (`chapter` / `memory` / `layout` / `ritual` / `formation` / `partner` / `media` / `lexicon` / `engine` / `moments` / `adr` / `grammar` / `strategy` ...).
- English commit subjects per ADR-0014.

### 5.3 PR titles and design filenames

- *"Add widget"* ❌ → *"Add PartnerSync StoryCard"* ✅
- *"Improve home"* ❌ → *"TimeRiver NOW marker sticky"* ✅

---

## 6. Persona Cards — C-level lenses

Same lexicon, different decision lenses.

### 6.1 CEO — *"What is this in 10 years?"*
- Prioritizes: mission, long-term assets, trust
- Rejects: anti-lexicon to chase short-term growth / ad monetization / data sale
- Signature: *"Will this still matter to the user in 5 years?"*

### 6.2 CPO — *"Why would the user love this?"*
- Prioritizes: UX, PMF, differentiation
- Rejects: tech-first / internal convenience / over-optioned UI
- Signature: *"Does the user grasp this in the first 3 seconds?"*

### 6.3 CTO — *"How does this survive 1K → 10M users?"*
- Prioritizes: cost curve, scale, reliability, security
- Rejects: linear AI cost / no caching / single point of failure
- Signature: *"Is this an L1 decision, or does it need L4?"*

### 6.4 CDO — *"Is this MODU?"*
- Prioritizes: design system, voice/tone, motion language
- Rejects: anti-lexicon / off-palette color / inconsistent transitions
- Signature: *"Is this in Chapter vocabulary? Ritual or transition?"*

### 6.5 SA (Solutions Architect) — *"Can we make this decision without regret?"*
- Prioritizes: ADRs, explicit trade-offs, future optionality
- Rejects: lock-in / undocumented big decisions / *"let's just do it"*
- Signature: *"This belongs in an ADR."*

### 6.6 External advisor (CPO / CFO / Legal / Medical) — *"Blind spots I can't see from inside"*
- Prioritizes: regulatory, market reality, user research
- Rejects: internal-only consensus / no user signal
- Signature: *"Did you actually talk to users about this?"*

---

## 7. Naming Conventions — making new things

### 7.1 Components

- React: `PascalCase` + metaphor (`TimeRiver`, `StoryCard`, `MemoryGlance`)
- The user-facing label is separate (`<TimeRiver>`'s header is *"Today"* / *"오늘"*)

### 7.2 Data / functions

- `snake_case` for DB columns (`chapter_memories`, `context_hints`)
- `camelCase` for TS (`computeLayout`, `useWidgetOrder`)

### 7.3 Documents

- `docs/{category}/{YYYY-MM-DD}-{topic}.md` or `docs/adr/{NNNN}-{topic}.md`
- categories: `adr` / `reviews` / `strategy` / `planning` / `grammar`
- Master file in English. Korean translations, when authored, use the `.ko.md` suffix (e.g., `modu-product-grammar.ko.md`).

### 7.4 Commit type

`feat` `fix` `refactor` `docs` `chore` `test` `perf` — scope uses lexicon.

---

## 8. Versioning — how this doc changes

Live document. Triggers to update:

- A new metaphor is introduced
- An anti-lexicon violation is seen 2+ times
- A new persona card is added
- C-level consensus changes lexicon

Update commit: `docs(grammar): add/update/remove [term]`

Large changes pair with an ADR (e.g., ADR-0014 English-First).

---

## 9. Practical checklist

When building a new feature / UI / doc / presentation:

- [ ] Does user-facing copy avoid the anti-lexicon (including §4.6)?
- [ ] Is the component named within the 7 metaphors?
- [ ] Does it pass the 5 tonal principles?
- [ ] Does the commit scope use lexicon terms?
- [ ] Is it a ritual or a transition, and is that clear?
- [ ] Will the vocabulary still hold up in 5 years?
- [ ] Is user-facing copy authored in English first (ADR-0014)?
- [ ] Does the Moment render correctly in both `en-US` and `ko-KR`?

---

## 10. Quick Reference — 7 things to memorize

1. **Chapter / Memory / Library / River / Companion / Light / Moments** — seven metaphors (last four are internal-only, never surfaced in UI)
2. **Users are not patients. They are people living a chapter.**
3. **Ritual = the user feels weight.**
4. **Every interaction = a ChapterMemory append.**
5. **A well-chosen option beats an empty screen.**
6. **No ad SDK ever. No data sale ever.**
7. **Listen to your life.**

---

## 11. External register — speaking to regulators and institutions

MODU's internal register (§1-§10) is for the team. When speaking to regulators, grant bodies, health systems, research institutions, or institutional investors, **translate to the register those audiences already index on**. The full mapping and country-level strategy live in `docs/strategy/2026-04-17-regulatory-welcome-and-b2g.md`; the abbreviated table below exists so internal-lexicon leakage into external documents is caught at the authoring moment.

| Internal | External equivalent |
|----------|---------------------|
| Chapter (Asset) | Longitudinal care episode |
| ChapterMemory | Patient-generated health data (PGHD) entry |
| Library | Patient-owned longitudinal personal health record (PHR) |
| Companion | Non-SaMD patient-facing digital health tool |
| Moments | Adaptive UI surface (non-clinical) |
| Agora / quiet-weave | Patient-delegated shared-care coordination |
| Role = partner / caregiver | Patient-delegated caregiver access, revocable + audited |
| Privacy as Moat | Data minimization by design (GDPR Art. 5(1)(c), HIPAA-aligned) |
| Post-bonding sync invitation | Cross-device provisioning with explicit consent |
| Formation | Patient-reported intake |

**Rule**: external-audience artifacts — grant applications, DiGA / PECAN submissions, NHS DTAC packs, B2G RFP responses, institutional-investor decks — use the **right** column only. Internal artifacts (ADRs, commits, code, internal strategy docs) may use either. Mixing registers within one external document is the failure mode; catch it at review.

**Supporting permanent constraint**: *Stay non-SaMD.* No diagnostic claims, no treatment recommendations, no clinical alerting. MODU surfaces memory and context; clinicians interpret. See the strategy doc for full rationale and candidate ADR-0015.

---

## References

- `CLAUDE.md` §2-7 (north star · voice · 5-year retention test)
- `docs/strategy/2026-04-17-ceo-decision-pack.md` (strategic basis for metaphors)
- `docs/planning/2026-04-17-timeflow-frontend-plan.md` (surface vocabulary source)
- `docs/planning/2026-04-17-adaptive-engine-cto-plan.md` (infrastructure vocabulary source)
- `docs/adr/0013-adaptive-by-default.md` (Moments origin)
- `docs/adr/0014-english-first-global-native.md` (this doc's language rule)
- `docs/grammar/modu-product-grammar.ko.md` (prior Korean master, preserved)

---

## 요약 (ko)

본 문서는 MODU 의 **단일 언어 시스템**. 2026-04-17 부로 **English-master** 전환 (ADR-0014). 기존 한국어 Grammar 는 `modu-product-grammar.ko.md` 로 보존.

핵심 7 메타포 = **Chapter · Memory · Library · River · Companion · Light · Moments** (챕터 · 기억 · 라이브러리 · 강 · 동반자 · 빛 · 순간). 뒤 4개는 **내부 전용** — UI 라벨·카피 노출 절대 금지 (§4.6).

보이스 5원칙: Warm restrained · Verbs over nouns · 2nd person · Everyday time · Acknowledge weight.

Anti-Lexicon 6 범주 (§4) 중 §4.6 은 내부 메타포의 UI 노출 전면 금지 (ADR-0013 A3).

상세 한국어 어휘·예문·설명은 `modu-product-grammar.ko.md` 참조.
