# MODU — Visual Language v2.1

- Status: **Lead designer spec (D0) — REVISION** of v2 after CEO review.
- Date: 2026-04-18 (v2.1)
- Revised-by: D0 (Lead Designer) after CEO feedback
- v2 → v2.1 deltas (top-of-file changelog):
  - **Dark mode removed from v1 scope** (§3.3, §3.4, §7, §8). L4 dark tokens stay defined for post-v1 pickup.
  - **Chapter Gallery is no longer a root tab** — replaced with chevron-morph carousel (§2 row + new §2.A spec).
  - **§9 NEW**: Per-asset divergence rules — composition recipes per asset type (the brand-defining rule: "MODU is not a template").
  - **§4 R14 NEW**: Pattern opacity — layout pattern must not be legible.
  - **Palette density pushed**: §3.1, §3.3 — Hero L3 uses palette.{500,600,700} 3-stop gradients; floating glass may tint with palette.300 over saturated heroes.
  - **§8 Q3 + Q4 resolved** and folded into §6 (Fraunces KO fallback) and §2 (ritual blob silhouette).
  - **§5 D1 + D3 hand-off updated** for chevron-morph carousel + §9 recipe composer + R14 + R9 lint at `tools/grammar-check.ts`.
- Author: D0 (Lead Designer)
- Supersedes: implicit v1 conventions encoded in `src/theme/widgets.ts` (uniform 14-radius translucent card, homogeneous grid).
- Inputs:
  - Philosophy: `CLAUDE.md` §3 (mobile-first), §4 (Formation UI), §6 (design principles), §8 (per-chapter palettes).
  - Architecture: `docs/adr/0013-adaptive-by-default.md` (5 slots · Moments · Quality Contract).
  - Language: `docs/grammar/modu-product-grammar.md` §4.6 (no internal metaphor in UI).
  - References: `benchmark_modern app_component_2026/` (14 webp).
  - Tokens: `src/theme/{palettes,typography,widgets}.ts`.

> **Diagnosis.** v1 reads as a uniform translucent-card grid: every widget is 14-radius, every surface the same blur 20, every row the same height. The palette is fine, the composition is dead. v2 fixes this by promoting **depth, scale contrast, editorial typography and palette-driven full-bleed** — while staying faithful to ADR-0013 slot discipline and Grammar §4.6 (no internal metaphor words on screen).
>
> **CEO note (v2.1).** v2 was correct in foundation but unified too hard across asset types. v2.1 hard-bakes per-asset divergence (§9 + R14): each asset type is a different *composition recipe*, not a re-skinned template. If a reviewer can describe MODU's home in one formula after seeing 3 chapters, the spec failed.
>
> **Three biggest anti-rigidity moves** (landing on every tab):
> 1. **Hero must eat the screen.** At least one slot per tab is full-bleed palette-gradient, min 56% of viewport height, with a Fraunces display word. This kills the equal-card-grid reflex.
> 2. **Elevation becomes a layout primitive.** Five named depth layers (L0 Skin → L4 Floating Glass) with explicit shadow/blur/border triples. Cards sit at different layers on purpose, not by accident.
> 3. **Scale disrespect is the rule.** Rows must mix heights (a 96 / 128 / 192 tile triplet is the default, a 3× same-height stack is a lint error). Tiles can collide, overlap -8 to -14 on a named "collage" container.

---

## 1. Benchmark Analysis Table

Each of the 14 references is labeled by its first 5 hash characters. For each: the observed pattern, the motion/depth cue MODU should learn from, what to steal, and what must **NOT** be copied (the anti-pattern test — where the reference violates MODU voice or Grammar §4.6).

| # | Ref | Observed pattern | Motion / depth cue | Steal for MODU | DO NOT copy |
|---|-----|------------------|--------------------|----------------|-------------|
| 1 | `0f998` (dark delivery nav) | Two dark slabs with monospace distance display + barcode progress tick. Floating dropdown chevron tabs; full-width electric-blue primary CTA with chevron marks. | 4-layer depth: map → glass slab → inner card → pinned CTA. Distance is the hero, map is skin. | **Ritual overlay** for chapter-switch (920 ms): dark slab over dimmed content, one mono-like line of progress, no illustration. Electric-accent CTA pattern for the one unmissable action. | Monospace typewriter as body font (conflicts with Pretendard). Dark-only theme — MODU v1 ships **light-only** (dark deferred post-v1; tokens kept dormant in L4 dark branch). |
| 2 | `30cb9` (shipment triptych) | Pastel lilac page bg, floating white cards, one saturated-orange "tracking" tile breaks monotony. Flag-pair list rows, **floating pill tab bar** detached from bottom edge. | Tab bar lifts off screen (margin 12 bottom, radius 28, shadow L3). Single accent tile acts as a "heartbeat" in an otherwise soft grid. | **Floating pill tab bar** (replace current 84-height safe-area bar on web/native). Accent-tile pattern: per-tab, exactly one card uses `palette.500` gradient, rest are glass. | The orange "action grid" (Send package / Issue invoice) — MODU does not offer fixed task menus. Flag-pair iconography — no territory semantics. |
| 3 | `3aeb4` (health quick-look) | Serif display headline ("A quick look at your health"), tiles of **mismatched heights and pastels** (lilac sleep / pink bpm / blue bar-chart steps / cream weight line). Diagonal floating cards mid-screen. Bar chart uses diagonal-stripe fill. | Mixed-elevation collage, serif+sans pairing, data viz sits inside the card as texture not a chart-page. | **This is Home anchor for fertility + chronic.** Fraunces display + mixed-pastel-height tile grid, each tile a different Moment (row slot). Diagonal stripe as "past/historic" bar fill. | The slanted mid-screen cards (decorative rotation). Hard "Get Started" CTA — MODU has no onboarding button on Home. Emoji-stickers — keep flat geometric icons. |
| 4 | `3d3e6` (filmstrip travel) | **Filmstrip perforations used as the layout device**, giant display serif bleeds off viewport, italic-accent word inside title. | Typography creates the hierarchy, not cards. The content image is the card. | **Chevron-morph carousel cards (§2.A)**: Fraunces chapter title bleeds off the right edge; italicized one-word emphasis (*"begins"*, *"closes"*); cover photo is the card. | The literal Kodak filmstrip (too costumed). Typewriter caption font. Any "KODAK" branding echoes. |
| 5 | `4073e` (Savanna) | Full-bleed editorial hero photo with Fraunces-like serif overlay on top. Second screen: map as **globe with red dot counts**, typewriter body. | Hero photo = skin. Map data viz (dots + counts) is non-chart data visualization. | **Primary Event / chapter cover hero** + **travel asset hero (§9)** — full-bleed photo OR palette-gradient, one display word + one-line context. Ingredient for chevron-morph carousel: dot-density viz of chapters across time. | "Level 5 Ranger" gamification header (Anti-Lexicon §4.1). Tagline-style marketing copy ("Begin your journey" = Anti-Lexicon §4.3 data-distancing). |
| 6 | `52cff` (appointment) | Segmented toggle at top, **chip date strip** with single active chip in black pill, 3D emoji service icons in paired cards, specialist rows with star + review count. | Active-state contrast: one black chip in a row of gray = instantly readable. Chip tabs > segmented controls for longer sets. | **Calendar mini + study asset countdown (§9)**: chip-date strip pattern for TimeRiver day anchor. Black-pill active chip contrast. | 3D emoji / Memoji icons — too consumer-childish for care contexts (Voice §3.1 warmth restrained). Star-rating UI — MODU does not rate people. |
| 7 | `55b54` (money dark) | Black bg, neon-yellow primary, **donut chart with colored legend dots** matched to slices, **circular FAB in center of tab bar**. | Accent-on-black keyboard keys; donut with direct legend mapping — no chart-reading required. | **Data viz rule + chronic/workout heroes (§9)**: legend dots are always the exact slice color; donut is the canonical distribution viz. Trend-line treatment for chronic. FAB pattern is *rejected* — see DO NOT. | Central FAB on tab bar — MODU has no "create" action in the tab bar; NextActionPrompt is floating, role-adaptive. Neon yellow — too aggressive for care voice; use per-palette accent. |
| 8 | `5ff06` (liquid blob wallet) | **Organic SVG blob shape** — lilac card "drips" into black page frame. Same blob repeats on second screen as transfer surface. | Singular shape invention. No rectangles here — the surface itself is the brand mark. | **Ritual Overlay shape**: one palette-agnostic organic silhouette SVG, palette-filled by the *incoming* asset (Q4 resolved — see §2 ritual row). Also: AmbientPalette skin can use this as background silhouette, not full bleed. | Full keypad with big circle keys — MODU has no transaction keypad. Over-saturated black/lilac contrast — soften to palette light tokens. Literal VISA branding. |
| 9 | `624b1` (travel For you) | **Circular category portraits** above flag pill selector above large photo cards with page-dots, with **liquid-glass floating tab bar** (rainbow-blurred photo underneath). | Six simultaneous layers: hero photo, page dots, gradient fade, sticky section head, floating glass tab, status bar — all legible because elevation + blur discipline. | **travel + pet_care asset rows (§9)**: horizontal swipeable day-cards / mood-grid. **Liquid-glass tab bar**: expo-blur intensity 60 + 0.78 tint + 16 border-radius + bottom margin 16. | Star rating / "4.9 reviews" pattern. Discount pricing UI (`$299` with strikethrough) — MODU is free-tier, no e-commerce. |
| 10 | `a2372` (Where to Next) | Editorial serif title, **horizontally stacked image cards** with captions bottom-left, faux-3D perspective. Chips beneath. Second screen: cover photo with page-dots, serif title bleeds below photo; third: stacked tabs atop article. | Card stack with slight Y offset creates horizontal rhythm. Caption inside image (no side-card metadata column). | **Chevron-morph carousel (§2.A) + travel hero (§9)**: horizontal swipable chapter covers, Fraunces title, caption in image bottom-left with gradient scrim 0→0.6 black. Chip filter row for chapter state (active / paused / completed). | "Accomodation / Booking / General" top tabs (MODU's AssetSwitcher dropdown covers this). Blurry 3D perspective mockup — straight cards only. |
| 11 | `a2eaf` (smart assistant) | **3D aurora gradient orb** as the product avatar. Glassmorphic rounded rectangles with long-diffuse shadow. Chat bubble from orb, voice waveform inside bubble with play control. | The orb is skin + identity in one object. Glass cards feel "wet" because shadow is blurred to 40+ px offset. | **Companion voice Moment** (floating slot): gradient-orb avatar (generated from current palette), chat bubble with play + waveform, same shape used for `quiet-weave` hero. **Deep soft shadow token** (shadow-L3: offset 0/24, blur 48, 0.08 opacity). | The anthropomorphic "face with eyes" — MODU companion is ambient, not a character. Purple default gradient on white (AI-slop). |
| 12 | `acf68` (Wanderia magazine) | **Editorial magazine layout**: italic-serif display ("Discover the *Beauty* of Tuscany"), uppercase small-caps subhead, pill tab with two black-outline segments, green rating badge notch. | Italic word inside display title creates a second register. Full-bleed photo + bottom pill anchor = calm. | **Ritual title card + study hero (§9)**: Fraunces display with one italic word ("*begins*", "*holds*", "*closes*"). Pill segment inside photo for period filter (This year · 1y ago · All). | "MENU" top-right burger — MODU does not use hamburger menus (AssetSwitcher is the nav). Green rating badge. "Booking Now" CTA copy. |
| 13 | `eae7d` (lilac liquid wallet 2) | Same blob DNA as #8, applied to wallet + analytics + transfer. Bar chart with **tooltip callout on bar peak** ($2000). Savings-goal list with embedded progress bar. | Chart callout on the peak bar acts as a narrative annotation (not a tooltip on hover). Progress bar inside the row, not beneath. | **Data viz bar + chronic/cancer heroes (§9)**: tallest bar gets a callout bubble in palette accent. Progress row: bar lives inside the row height, not as a separate element. | Clock-style keypad UI. "Savings" vocabulary — MODU is not a tracker of achievement %. Solid-color name chips over face. |
| 14 | `fc7c4` (mood) | **Asymmetric decorative floral shapes** frame a warm-pink hero. Mood chips with embedded emoji face, mood calendar as a grid of colored emoji per day. Stat tiles in mixed-pastel grid with one gradient summary card. | Decorative organic shape = brand. Calendar month view = grid of emoji-colored circles (mood as pixel). | **Mood picker + pet_care hero (§9)**: chip with one emotion face + one word, 5 horizontally scrollable. **Mood calendar month view**: grid of dots, each dot is the day's mood color. This is a native MODU pattern — adopt directly. | The baseline illustration (model photos) — MODU does not use stock photo people. "Home / Schedule / Statistics / More" tab labels — Anti-Lexicon §4.6 (MODU tabs use metaphor-clean words). |

---

## 2. Anchor Map — per surface, the benchmark that defines its visual target

For each MODU surface, one **primary anchor** (dominant), one **secondary anchor** (supporting detail), and the **invariant** (MODU-specific constraint that overrides the anchor).

| Surface | Primary anchor | Secondary anchor | MODU invariant |
|---------|----------------|------------------|----------------|
| **Home hero / Primary Event card** (hero slot, 1-2 per screen) | per §9 recipe, default `3aeb4` | `4073e` — full-bleed photo option when chapter has a cover | Must use current `palette[assetType]` gradient (3-stop palette.{500,600,700} per §3.1) or user photo — never a stock landscape. Display copy is user-generated ("Gonal-F this morning") not marketing. |
| **Timeline row widgets** (row slot, 3-7 per screen) | per §9 recipe — default `624b1` itinerary | `13 eae7d` — inline progress bar inside row | Each row mixes heights across the stack (96 / 128 / 96 / 192 / 96 is a valid rhythm). Grammar §4.6: row labels are metaphoric ("this morning", "tomorrow") not data-language ("2026-04-18 08:00"). |
| **Mood picker + emotion surface** | `fc7c4` — chip + emoji + word, 5 horizontal | `52cff` — chip-date strip for active-state contrast | Voice §3.1: no gamified "mood score". No ranking. Chip uses palette.50 bg, palette.500 border when selected (44pt touch). |
| **Calendar month view** | `fc7c4` — grid of colored circles (mood as pixel) | `52cff` — chip-date strip for mini | Today marker = palette.500 ring, not a fill. Future days = 0.06 hairline dot. Past = saturated. §4.6: no "streak" language. |
| **Chevron-morph chapter carousel (§2.A)** | `3d3e6` filmstrip framing + `a2372` horizontal stack | `4073e` cover fallback, `5ff06` shape memory for the morph | User-facing label = **"내 챕터 / My chapters"**. NEVER "Asset", NEVER "gallery", NEVER "library". Cover image falls back to per-asset palette full-bleed gradient (3-stop §3.1) + chapter Fraunces name bleeding off-right when no photo. Each card is **styled per asset type per §9**, not skinned. |
| **Asset Switcher chevron + sheet** | `30cb9` — floating pill bar with lifted tab as root DNA | `a2eaf` — glass card with deep soft shadow for active selection | Header chevron is the entry. **Tap = quick dropdown (existing behavior preserved)**. **Long-press = chevron-morph chapter carousel (§2.A)**. User copy: "Switch chapter" / "챕터 전환" — never "Switch asset". On web = modal dropdown; on native = bottom sheet (already enforced — keep). |
| **Settings list + consent toggles** | `30cb9` — single saturated tile as emphasis in otherwise soft list | `52cff` — chip toggles with black-pill active | Consent rows: 17pt body + 13pt secondary explain. Data-class toggles use palette.500 when ON, hairline when OFF. §4.6: "These memories live only on this device right now" — not "Cloud sync OFF". |
| **Data viz (heatmap, bar, trend)** | `55b54` — donut with legend dots (distribution) | `eae7d` — bar chart with callout on peak + `3aeb4` — diagonal stripes for historic | Always pair chart with one human-written sentence. Legend dots match slice color exactly. No hover tooltips (mobile-first). |
| **Tab bar + nav elevation** | `624b1` — liquid-glass floating bar | `30cb9` — pill lift off bottom | 16 margin from bottom, radius 28, blur 60 intensity, tint 0.78 palette.50. Active tab = palette.500 circle token (36×36), label below active only. **No FAB** (kills `55b54`). **No "Chapters" tab** — chapter carousel is gesture-driven from the chevron, not a nav destination. |
| **Ritual overlay** (chapter switch 920 ms) | `5ff06` — **single palette-agnostic organic silhouette SVG, palette-filled by incoming asset** (Q4 resolved) | `0f998` — single-line progress as anchor, `acf68` Fraunces italic for the line | Frame 0-280ms fade-out current palette, 280-640ms ambient-black with the silhouette growing from chevron origin (or NextActionPrompt origin), filled by incoming `palette.gradient` (3-stop), 640-920ms fade-in new skin. Exactly one Fraunces line: "*Moving to ○○*" — 1.5s total ceiling. |

### 2.A Chevron-morph chapter carousel — full spec

This replaces any earlier "Asset Gallery as a root tab" framing. The carousel is not a destination; it is a **gesture-revealed surface** anchored to the existing chevron.

**Entry — gesture grammar**:
- **Tap** on the AssetSwitcher chevron → quick dropdown (existing v1 behavior, unchanged).
- **Long-press** (≥ 280 ms) on the same chevron → triggers **zoom-out ritual** into the carousel.
- Long-press feedback: at 120 ms, `Haptics.selection()`. At 280 ms commit, `Haptics.impact('light')` + scene scale begins.

**Transition — zoom-out (~600ms, Macro class)**:
- Current chapter scene scales `1.0 → 0.78`, opacity `1 → 0.5`, easing `cubic-bezier(0.32, 0.72, 0, 1)`.
- Background fades to `rgba(14,14,16,0.55)` over the same 600 ms.
- The receding scene fades into the gallery surface (the carousel renders behind, scaled-up `1.06 → 1.0`, opacity `0 → 1`).

**Gallery surface — the carousel itself**:
- Horizontal paginated shelf, `snap-to-card`, one chapter per page.
- Card geometry: `width = viewport - s.lg*2` (343 on 375 viewport), `height = 78% viewport`, `r.lg = 20`.
- Faux-3D perspective: adjacent cards peek 16pt with `scale 0.94`, `opacity 0.7`. Center card is the active.
- **Each card is composed by §9 recipe for that chapter's asset_type**, NOT a uniform skin:
  - Background: full-bleed palette fill, 3-stop gradient `palette.{500,600,700}` (or `palette.{300,500,700}` for pet_care/travel/workout per §3.1).
  - Cover layer: chapter cover photo at 0.92 opacity over the gradient if present; else gradient stands alone.
  - Title: Fraunces displayLarge, the chapter name **bleeds off the right edge** of the card (`overflow: hidden`, `paddingRight: -32`). Italic word per R13.
  - **Live Moment peek as texture, not as chart component**:
    - `fertility` → injection-timeline peek baked into the lower-third (vertical timeline-spine motif rendered as illustrative texture, not a real chart).
    - `pet_care` → daily-log bar peek as horizontal blocks across the bottom edge.
    - `chronic` → trend-line peek as a 1.5-stroke line drawn through the lower-third with one annotation dot.
    - `travel` → map-fragment + 3 itinerary chips peek across the bottom.
    - `study` → mini calendar peek with countdown-day glyph.
    - `workout` → streak heatmap peek (5×7 dots) bottom-right.
    - `cancer_caregiver` → overlapping phase-rail peek mid-card.
    - `custom` → user's input texture renders as the peek (one phrase, one photo, or one Moment — whatever they have).
- Caption: chapter "phase" word in Pretendard 13pt small-caps over a 0→0.6 black scrim, bottom-left.
- Page dots: hairline 4-dot indicator, bottom-center, palette.500 active.

**Exit — zoom-in (~600ms, Macro; or 920ms Ritual when a switch is committed)**:
- Tap a non-active card (ie a chapter switch is committed) → **Ritual class** (920 ms): the card itself becomes the morph silhouette (per Q4-resolved ritual blob), expanding to fill the viewport while palette swaps. Haptic `medium` at 640 ms.
- Tap the center (already-active) card OR swipe down → **Macro class** (~600ms zoom-in): the card scales `1.0 → 1.0`, the carousel fades `1 → 0`, the underlying scene scales `0.78 → 1.0`. No ritual, same chapter.

**Motion budget**: same-chapter preview = Macro. Crossing to a committed switch = Ritual (R11 exempt).

**Grammar §4.6 enforcement**: user-facing label is **"내 챕터" / "My chapters"** — never "gallery", never "library" if it sounds merchandisey, never "asset".

---

## 3. Token Tables — concrete numbers

All numbers below must land in `src/theme/` as named tokens (D3 owns the migration). Components read tokens; no hardcoded hex, no hardcoded shadow.

### 3.1 Elevation scale — five depth layers

| Layer | Name | Use | Shadow (offset Y / blur / spread / opacity) | Blur intensity (expo-blur) | Border (RN hairline) | Background |
|-------|------|-----|---------------------------------------------|----------------------------|----------------------|------------|
| **L0** | Skin | Page background / AmbientPalette | none | none | none | `palette.bgMesh` (radial) over `#F2F2F7` base |
| **L1** | Inline | Separator, inline chip on page | none | none | 0.5 @ `rgba(60,60,67,0.06)` | transparent |
| **L2** | Surface | Standard row / settings cell / list card | `0 / 8 / 0 / 0.04` | 12 | 0.5 @ `rgba(60,60,67,0.08)` | `rgba(255,255,255,0.82)` |
| **L3** | Hero | Primary event card, carousel card, NextActionPrompt | `0 / 24 / 0 / 0.10` | 24 | none | **palette-dense gradient — see §3.1.A** OR photo |
| **L4** | Floating glass | Tab bar, AssetSwitcher sheet, quiet-weave hero bubble | `0 / 32 / 0 / 0.12` + `0 / 2 / 0 / 0.06` (two-stop shadow for iOS refraction) | 60 | 0.5 @ `rgba(255,255,255,0.35)` inner | **context-aware tint — see §3.3** |

#### 3.1.A Hero L3 gradient density (CEO-flagged "timidity fix")

The L3 hero MUST NOT use pastel `palette.{50,100}` washes. The new baseline is dense palette fills:

| Asset type | Hero L3 gradient (3-stop, top → mid → bottom) | Notes |
|------------|------------------------------------------------|-------|
| `fertility` (dawn) | `palette.500 → palette.600 → palette.700` | Warm, grounded; serif overlay reads in `light` text. |
| `cancer_caregiver` (mist) | `palette.500 → palette.600 → palette.700` | Calm, deep blue; restrained. |
| `chronic` (sage) | `palette.500 → palette.600 → palette.700` | Steady. |
| `pet_care` (blossom) | `palette.300 → palette.500 → palette.700` | Higher contrast for energy/play. |
| `travel` (uses dusk or custom photo + dusk fallback) | `palette.300 → palette.500 → palette.700` | Editorial, photo-first when possible. |
| `workout` (uses sage variant or custom) | `palette.300 → palette.500 → palette.700` | Punchy. |
| `study` (uses mist variant) | `palette.500 → palette.600 → palette.700` | Calm/steady; not playful. |
| `custom` | designer-mapped at spawn time per recipe | See §9. |
| **Ritual moment (any asset)** | **flat single `palette.700`** (saturated, no gradient) | Used during the 360 ms ritual hold. |

**Web fallback**: `expo-blur` is simulated via `backdrop-filter: blur(${intensity / 2}px) saturate(140%)`. If `backdrop-filter` unsupported → L2 → opaque `palette.50`, L4 → opaque `rgba(249,249,249,0.96)` + elevated shadow stays.

**Rigidity test**: if two adjacent surfaces sit on the same layer, one must promote or demote. No stack is permitted to have 3+ consecutive L2 cards (see §4).

### 3.2 Radius scale

| Token | Value | Use |
|-------|-------|-----|
| `r.xs` | 4 | Hairline badge, chart callout tail |
| `r.sm` | 8 | Chips, small input, icon tile 32×32 |
| `r.md` | 12 | Inline row card (L2 default — replaces current 14) |
| `r.lg` | 20 | Hero card (L3), carousel card, modal sheet corner |
| `r.xl` | 28 | Floating glass tab bar (L4), ritual blob anchor |
| `r.full` | 999 | Avatar, pill date chip, mood emoji circle |

> v1 used `14` for every card. v2 retires 14 entirely. Default card is `r.md = 12`, and hero escalates to `r.lg = 20`.

### 3.3 Glass / blur per surface

| Surface role | Blur intensity | Tint | Border | When disabled (low-end Android / web fallback) |
|--------------|----------------|------|--------|-----------------------------------------------|
| AmbientPalette skin (L0) | 0 | radial gradient | — | identical |
| Row card (L2) | 12 | `light` @ 0.82 | 0.5 hairline | solid `palette.50` |
| Hero card (L3) | 0 (gradient not glass) | — see §3.1.A — | — | identical |
| Floating tab bar (L4) — over neutral L0 | 60 | `light` @ 0.78 | 0.5 hairline | solid `rgba(249,249,249,0.96)` + retain shadow |
| Floating tab bar (L4) — over saturated hero | 60 | **`palette.300 @ 0.6`** | 0.5 hairline | solid `palette.100` |
| AssetSwitcher sheet (L4) | 60 | `light` @ 0.72 (default), `palette.300 @ 0.6` (over saturated hero) | 0.5 hairline | solid `#FFFFFF` |
| Ritual overlay | 40 | `dark` @ 0.55 | none | solid `rgba(14,14,16,0.72)` |

> **CEO-flagged timidity fix.** Pastel restraint is out; dense palette fills are the new baseline. Floating L4 surfaces are *context-aware* — when sitting over a saturated palette hero (per §3.1.A), they tint with `palette.300 @ 0.6` instead of neutral `light @ 0.78`. Components must still pass WCAG AA contrast on any text rendered over a `palette.500–700` fill (verify per palette: dawn/cancer_caregiver/chronic/blossom/sage/dusk all pre-validated for white body 17pt + Pretendard 13pt secondary at AA).

### 3.4 Motion curves

Three interaction classes, **three default durations**. Any deviation requires designer review.

| Class | Duration | Easing (cubic-bezier) | Example |
|-------|----------|------------------------|---------|
| **Micro** | 120 ms | `cubic-bezier(0.2, 0, 0, 1)` (iOS default "ease-out-quint") | Pressable press state, chip toggle, haptic feedback |
| **Macro** | 280 ms (chevron-morph zoom-out/in: 600 ms by exception, see §2.A) | `cubic-bezier(0.32, 0.72, 0, 1)` (Material emphasized) | Sheet open, row expand, card height change, chevron carousel zoom |
| **Ritual** | 920 ms total (280 out + 360 hold + 280 in) | out: `cubic-bezier(0.4, 0, 1, 1)` → hold: linear → in: `cubic-bezier(0, 0, 0.2, 1)` | Chapter switch, Birth Ritual, Archive Ritual, carousel-card commit |
| **Ambient** | 1800 ms loop | `cubic-bezier(0.45, 0, 0.55, 1)` (sine) | AmbientPalette warmth drift, quiet-weave halo breath |

Haptics (native only):
- Micro → `Haptics.selection()`
- Macro sheet → `Haptics.impact('light')`
- Long-press chevron commit (280 ms) → `Haptics.impact('light')`
- Ritual hold-end → `Haptics.impact('medium')` once at 640 ms

Reduce-motion (iOS setting): Micro→0 ms, Macro→opacity-only 160 ms, Ritual→380 ms fade only, Ambient→disabled, chevron-carousel zoom→opacity-only 200 ms. Enforce via `AccessibilityInfo.isReduceMotionEnabled()` helper.

### 3.5 Spacing rhythm

Use only the named values below. Do not use `10`, `18`, `30` (common drift).

| Token | Value | Use |
|-------|-------|-----|
| `s.xs` | 4 | Icon↔label inside a chip, hairline offset |
| `s.sm` | 8 | Chip padding, tight row metadata |
| `s.md` | 12 | Row internal padding (replaces v1's 14) |
| `s.lg` | 16 | Card internal padding default, viewport side margin |
| `s.xl` | 24 | Section spacing, between hero and first row |
| `s.2xl` | 32 | Page top safe-area to first content |
| `s.3xl` | 48 | Hero vertical breathing (hero takes ≥ 56% viewport → top 48 + Fraunces + bottom 48) |

Overlap token (for collage container): `s.neg` = `-8` to `-14` (negative margin). Only use inside a `CollageStack` component; never free-form on a flat flex.

---

## 4. Rigidity Test — lint rules that kill the "boring uniform grid" pathology

These are the **hard rules**. D1/D2/D3 treat these as PR-blockers. Include them in the component design review checklist.

**R1 — Hero dominance.** Every primary screen (Home / each tab) must have **exactly one L3 or full-bleed hero** occupying ≥ 56% of initial viewport height (812 on iPhone 14 → ≥ 455). Hero uses the per-asset 3-stop gradient from §3.1.A OR a user-provided cover photo with 0→0.4 black scrim bottom-left.

**R2 — No 3-same stack.** A vertical stack cannot contain 3+ consecutive rows of the same height AND same elevation layer. A run of 3+ identical L2 cards is a lint error. Break rhythm with one of:
  - promote 1 to L3 (palette tile),
  - demote 1 to L1 inline,
  - insert an Ambient spacer (Section title with Fraunces accent + 24pt breathing).

**R3 — Elevation discipline.** Any screen must use at least **two distinct depth layers** from L0–L4. A screen composed only of L2 cards is rejected.

**R4 — Typography pairing.** Every screen exposes Pretendard (body/UI) AND Fraunces LightItalic **at least once**. Fraunces never in body/chips/CTAs; Pretendard never in the chapter display name on a hero.

**R5 — Palette-first, no raw hex.** Components may read `palette[assetType].{50,100,300,500,600,700,gradient,accent}` only. Hex literals in component files are a PR reject. (`widgetTokens.baseBackground` et al. are the sole exception — neutral surfaces.)

**R6 — One accent per stack.** In any visible screen region, at most ONE L3 palette-filled element acts as accent (see `30cb9` single orange tile). More than one = visual shouting. Exception: hero dominates → row slot L2 stays neutral.

**R7 — Radius discipline.** Use only `r.*` tokens. Adjacent cards must not mix `r.md` and `r.lg` on the same elevation layer (they read as "cards from two different apps").

**R8 — Scale disrespect.** In a grid/collage of ≥ 3 tiles, at least one tile must be ≥ 1.5× the height (or 2× width) of another. Equal-size 2×2 grids are explicitly forbidden on Home.

**R9 — No user-facing internal metaphors** (Grammar §4.6 — mechanical check list, prefix-match reject):
  Forbidden in any string literal, copy file, i18n key's English value: `Asset`, `Chapter` (when labeling the entity — user sees "○○" or chapter-typed name; "My chapters" / "내 챕터" is the only exception, locale-allowed), `Moment`, `TimeRiver`, `Agora`, `quiet-weave`, `AmbientPalette`, `slot`, `predicate`, `Role`, `Phase`, `L0/L1/L2/L4`, `TPO`, `signals`, `hero slot`, `row slot`, `partner-echo`, `bonding predicate`, `gallery`, `library` (when used as a destination label). Add lint in `tools/grammar-check.ts` (D3).

**R10 — 44pt everywhere.** Every Pressable/Touchable: minimum hit-target 44×44 enforced via `hitSlop` or actual padding. CI fails on `<Pressable>` without either.

**R11 — Motion budget.** Any single interaction triggers at most **one Macro transition**. Parallel Macros = rejected; sequence them. Ritual is exempt (it IS the ritual). Chevron-morph zoom (600 ms) counts as one Macro.

**R12 — No FAB in tab bar.** Center-tab action buttons (reference `55b54`) are explicitly rejected — NextActionPrompt is a floating slot driven by Adaptive-by-Default, not a fixed tab position. **And no "Chapters" tab** — the carousel is gesture-revealed (§2.A), never a nav destination.

**R13 — One word of Fraunces italic per hero.** Display title may contain one italicized word (e.g. *"begins"*) to create a second register — zero or one, never two.

**R14 — Pattern opacity (CEO-directed, brand-defining).** The layout pattern must not be legible to the user. If a reviewer, after using 3 asset types, can summarize MODU's layout as a single formula ("Hero + 3 cards + tabs", "Same template, different color", etc.), the offending asset's Home is **rejected at design review**. Enforcement:
  - For every asset type, the composition must share tokens (palette, elevation, spacing) with other assets BUT differ in **dominant layout primitive**, **hero treatment**, AND **vertical/horizontal rhythm**.
  - **Skin-only variants** (same primitive, just different color) fail R14.
  - The §9 recipe table is the contract; D1 + D3 enforce at the composer level (`composeMoments(home, assetType)`).
  - Designer-review gate: D0 signs off each asset's first-render against R14 before D1 ships.

---

## 5. Hand-off Matrix — D1 / D2 / D3

Three component designers pick up specialized slices. Each row gives: Moments (per ADR-0013 componentId) they own, benchmarks they reference, tokens they touch, invariants they enforce.

### D1 — Home composer + Chevron-morph carousel (Surface composition + narrative tiles)

| Owns | ADR-0013 Moment IDs (slot) | Primary benchmarks | Secondary benchmarks | Tokens |
|------|----------------------------|--------------------|----------------------|--------|
| **Per-asset Home composer** — `composeMoments(home, assetType)` consumes the §9 recipe table to pick the dominant primitive and Moment set per `currentAsset.type` | `composeMoments(home)` | varies per recipe | varies | L0 AmbientPalette skin, L3 hero per §3.1.A, collage spacing s.neg |
| Primary Event hero (default for fertility) | `primary-event` (hero) | `4073e`, `3aeb4` | `acf68` Fraunces italic | `palette.gradient` (3-stop §3.1.A), Fraunces displayLarge, r.lg, shadow L3 |
| Row timeline cards | `injection-row`, `mood-row`, `visit-row`, `memory-note` (row) | `624b1` itinerary | `13 eae7d` inline progress | L2 surface, r.md, mixed heights (96/128/192) |
| Mood picker + calendar month | `mood-chip-strip`, `mood-month-grid` (row) | `fc7c4` mood pattern | `52cff` chip-date | palette.accent for selected, r.full chips |
| **Chevron-morph chapter carousel (§2.A)** — replaces v1's `chapter-shelf-horizontal` Moment | `chapter-carousel` (gesture-surface, not a Home Moment) | `3d3e6` filmstrip, `a2372` stacked cards | `4073e` cover fallback, `5ff06` shape memory | r.lg cards, palette gradient 3-stop, Fraunces title bleed-off, per-asset Moment-peek as texture per §9 |
| Memory Glance ("One year ago today") | `memory-glance` (glance) | `acf68` small-caps | `3aeb4` pastel tile | L2 surface, Fraunces displayAccent, palette.100 bg |
| Asset-recipe mapping table | infrastructure (`src/theme/recipes.ts`) | — | — | encodes §9 recipe table → typed enum, consumed by composer |
| Rigidity rules to enforce | R1, R2, R4, R6, R7, R8, R13, **R14** | | | |

### D2 — Data viz + Dashboard (Charts, summaries, compliance indicators)

| Owns | ADR-0013 Moment IDs (slot) | Primary benchmarks | Secondary benchmarks | Tokens |
|------|----------------------------|--------------------|----------------------|--------|
| Weekly Distill card | `weekly-distill` (hero) | `3aeb4` tile composition | `55b54` legend discipline | palette.gradient soft variant (0.6 alpha), r.lg |
| Donut / distribution viz | `phase-distribution`, `role-distribution` (row) | `55b54` donut + legend | — | palette accent + 3 tonal steps (palette.{100,300,500}), r.md card wrapper |
| Bar chart (weekly pattern) | `weekly-bar` (row) | `13 eae7d` callout on peak | `3aeb4` diagonal stripe for historic | palette.500 active bar, hairline historic, callout uses palette.accent bubble |
| Trend line (longitudinal — chronic hero foundation per §9) | `trend-line` (row) | `3aeb4` cream weight line | `13 eae7d` progress bar | 1.5 stroke, palette.500, single anchor dot at "now" |
| Heatmap (compliance / logging density — workout hero foundation per §9) | `logging-density` (glance) | `fc7c4` mood month grid | — | dot grid with `palette.{50,100,300,500}` ramp, r.full dots, no year labels |
| Consent / data-class toggles dashboard | `data-class-matrix` (row, settings) | `52cff` chip tabs | `30cb9` single accent tile | palette.500 ON, hairline OFF, L2 surface, §4.6 metaphoric copy |
| Export / delete hero (compliance moment) | `export-library`, `delete-chapter` (hero) | `acf68` editorial | `0f998` single-line primary action | palette.gradient, r.lg, Fraunces one-line confirmation |
| Rigidity rules to enforce | R4, R5, R6, R9, R11 | | | Every chart must pair with **one sentence of human narrative** (non-negotiable). |

### D3 — Nav + Settings + Transitions (Chrome, system surfaces, motion)

| Owns | ADR-0013 Moment IDs (slot) | Primary benchmarks | Secondary benchmarks | Tokens |
|------|----------------------------|--------------------|----------------------|--------|
| Floating glass tab bar | tab shell (chrome — not a Moment) | `624b1` liquid-glass | `30cb9` pill lift | L4 elevation, r.xl, expo-blur 60, margin-bottom 16, **context-aware tint per §3.3** |
| AssetSwitcher (header chevron → sheet/dropdown) | chrome | `30cb9` floating pill | `a2eaf` deep shadow sheet | L4 surface, palette per entry, Fraunces chapter title, §4.6 label "Switch chapter" |
| **Chevron long-press gesture + chevron-morph carousel transition** (zoom-out/zoom-in) | chrome (system-level) | `3d3e6`, `a2372` | `5ff06` morph silhouette | Macro 600ms zoom; Ritual 920ms when committing a chapter switch; Haptics light @ 280ms long-press commit; Haptics medium @ 640ms ritual hold-end |
| NextActionPrompt (floating slot) | `next-step`, `just-did` (floating) | `a2eaf` glass bubble | `0f998` single-line CTA | L3 card, r.lg, palette.500 CTA, one-line verb copy |
| Quiet-weave hero halo | `quiet-weave-self`, `quiet-weave-partner`, `quiet-weave-caregiver` (hero) | `a2eaf` aurora orb | `5ff06` organic blob | palette.gradient radial, r.xl, 1800 ms ambient breath |
| Settings list | chrome | `30cb9` single-accent | `52cff` chip toggles | L2 surface, r.md, 17pt body, §4.6 metaphoric copy |
| Ritual overlay (chapter switch, birth, archive) | ritual surfaces (outside Moment library, system-level) | `5ff06` **single palette-agnostic silhouette SVG, palette-filled by incoming asset (Q4 resolved)** | `0f998` single mono line, `acf68` Fraunces italic | ritual motion curve (280/360/280), palette-in-palette-out, haptic medium @ 640 ms |
| TokenProvider + theme migration | infrastructure | — | — | Migrate `src/theme/widgets.ts` to named elevation/radius/spacing tables above. Add `palette.{600,700}` stops and `palette.300` for high-contrast variants. **Dark-mode token branches stay defined but DORMANT for v1** (post-v1 pickup). |
| **Grammar lint (R9) + Pattern-opacity lint (R14) at `tools/grammar-check.ts`** | infrastructure | — | — | R9: prefix-match against §4.6 ban list. R14: scan composer output → verify each asset type maps to a §9 recipe and at least one dimension (primitive/hero/rhythm) differs from every other recipe in the codebase. Wire to CI. |
| Rigidity rules to enforce | R1, R3, R9, R10, R11, R12, **R14** | | | Reduce-motion respect is D3's primary a11y deliverable. |

---

## 6. Cross-cutting constraints (re-asserted, non-negotiable)

- **Mobile viewport first.** All specs above assume 375–430 primary. Web renders inside MobileFrame (already present in `MainNavigator`); no layout change at web breakpoints beyond centering.
- **Palette never hardcoded.** Components import from `src/theme/palettes.ts` via `getPalette(assetType)`. v1 drift (raw hex inside components) is out by this spec. Palettes ship `{50,100,300,500,600,700, gradient, accent}` stops as of v2.1.
- **Typography.** Pretendard (body + UI), Fraunces LightItalic (display + chapter titles, at Memory Glance accent). No system / Inter / Roboto / Space Grotesk (§Success Criteria anti-list).
- **Fraunces Korean fallback (Q3 RESOLVED — accepted).** Fraunces LightItalic has no CJK glyphs. Korean display titles fall back to **Pretendard-Bold with 4-degree oblique skew** at displayLarge size (verified on iOS — no artifacts at 22pt+). This is the rule, not an open question.
- **§4.6 UI copy ban.** Forbidden tokens listed in R9. "Asset" never appears on screen; user sees their chapter name and metaphoric labels ("Today" / "오늘", **"My chapters" / "내 챕터"**, "Switch chapter" / "챕터 전환"). "Gallery" and "library" (as nav labels) are now banned in R9.
- **ADR-0013 slot discipline.** Every new component declares `slot ∈ { skin, glance, hero, row, floating }` and a `predicate(ctx)` in 0..1. No free-floating components.
- **Per-asset divergence (R14 + §9).** Any new asset type added by the spawner LLM must be mapped to a §9 recipe before it can render. No render = no recipe.
- **44pt touch targets** on every interactive element. CI check on `<Pressable>` lineage.

---

## 7. Acceptance — how D0 will sign off each surface

A surface is accepted when:

1. **R1–R14** all pass in the rendered mobile viewport (375 or 430).
2. At least **two depth layers** visible, **mixed heights** in any 3+ stack, **one Fraunces italic word** in the hero region.
3. `en-US` and `ko-KR` both render without truncation (Fraunces italic verified per locale — Korean chapter titles fall back to Pretendard-Bold 4° oblique per §6).
4. Reduce-motion off-path renders (Macro→opacity-only, Ritual→fade-only, chevron-morph zoom→opacity-only 200 ms).
5. `npx tsc --noEmit` 0 errors. `npx expo export --platform web` passes.
6. Grammar lint (R9) + Pattern-opacity lint (R14) pass — no banned lexicon, no two recipes identical at the primitive level.
7. **Per-asset acceptance gate**: D0 visually reviews the first render of each asset type against §9 recipe + R14 before D1 closes that asset's Home.

---

## 8. Open questions for D0 to resolve with CEO/CPO

(v2.1 — Q1, Q2, Q3, Q4 from v2 are all resolved. Remaining open:)

1. **Carousel deep-link.** Should a notification ("Today's Gonal-F") tap that targets a non-active chapter open the carousel pre-pointed at that card, or land directly in the chapter's Home with a back-affordance? Recommend the latter (one-tap to context, carousel only on user gesture). CEO/CPO confirm.
2. **Recipe spawner contract (LLM ↔ §9).** When the asset-spawner LLM at step_01 produces a chapter type not in §9's 8 base recipes, does it (a) propose a recipe + designer review, or (b) auto-fall back to `custom` recipe? Recommend (a) for the first 100 unique types, then revisit.

---

## 9. Per-asset divergence rules (CEO-directed, brand-defining)

CEO pushback on v2: the spec unifies too hard. Each asset type must feel like a different *world*, not a re-skinned template. **The hard rule (R14): a user must never be able to describe MODU's layout as "Hero + 3 row cards + tab bar".** If the pattern becomes legible, the spec has failed.

Each asset type below is a distinct **composition recipe**: it specifies the dominant layout primitive, the hero treatment, which Moments are active, and the rhythm balance. Recipes share tokens (palette structure, elevation scale, spacing rhythm) but **no two recipes use the same dominant primitive**.

### 9.1 Per-asset composition recipes

| asset_type (envelope) | Hero primitive | Primary row orientation | Active Moment IDs | Anchor benchmarks | Collage density | Rhythm dominance | Dominant layout primitive |
|-----------------------|----------------|--------------------------|-------------------|-------------------|-----------------|-------------------|---------------------------|
| `fertility` (E4) | Narrative + **timeline spine** — Fraunces displayLarge + vertical injection-timeline column running edge-to-edge | Vertical timeline (date-anchored, left-rail spine, right-side cards) | `primary-event`, `injection-row`, `mood-row`, `quiet-weave-partner`, `memory-note`, `weekly-distill` | `3aeb4` + `5ff06` | medium | vertical-dominant | **Timeline spine (vertical)** |
| `cancer_caregiver` (E4) | Timeline-dominant **with overlapping phase rails** — two horizontal phase bars (treatment cycle, recovery) layered behind a Fraunces display | **Horizontal medication rail** at top + **vertical visit stack** below (mixed orientation by design) | `phase-rail`, `medication-rail-h`, `visit-row`, `caregiver-handoff`, `quiet-weave-caregiver`, `weekly-distill`, `data-class-matrix` | `13 eae7d` + `0f998` | medium-low | mixed (top horizontal, bottom vertical) | **Phase rails + mixed rhythm** |
| `pet_care` (E3) | Playful **collage** — asymmetric photo (pet portrait) overlapping a daily-log bar grid; Fraunces "for ○○" italicized | **Mood-grid** (5×7 dot grid as primary surface) + heatmap-forward stat tiles | `pet-portrait-collage`, `daily-log-bar`, `mood-month-grid`, `feeding-row`, `vet-reminder`, `memory-note` | `fc7c4` + `624b1` | **high** | grid (2D) | **Grid collage** |
| `chronic` (E4) | **Trend-line dominant** — full-width 1.5-stroke trend line across the hero with one annotation callout bubble (per `13 eae7d`); Fraunces title above | **Heatmap-forward** (logging density 5×7) + mood-pattern row below | `trend-line`, `logging-density`, `mood-row`, `medication-rail-h`, `weekly-distill`, `data-class-matrix`, `memory-note` | `55b54` + `13 eae7d` | low | data-rhythm (horizontal data, vertical interpretation) | **Heatmap canvas + trend overlay** |
| `travel` (E1) | **Map-forward** — full-bleed map fragment (or photo) with itinerary day-cards floating L4 on top; Fraunces destination word bleeds off-right | **Horizontal rail of day-cards**, swipeable, snap-to-day. NOT a vertical stack. | `map-hero`, `day-card-h-rail`, `itinerary-row`, `memory-note`, `companion-voice` | `624b1` + `a2372` + `4073e` | medium | **horizontal-dominant** | **Horizontal rail (paginated)** |
| `study` (E2) | **Calendar-forward** — full month calendar + countdown glyph (D-365, D-30, D-7) as the hero number; Fraunces "until ○○" italicized | **Daily schedule vertical** (time-blocked agenda, 06:00 → 22:00 spine) | `calendar-month-hero`, `countdown-glyph`, `daily-schedule-v`, `study-block-row`, `memory-note`, `quiet-weave-self` | `52cff` + `acf68` | low | vertical (time-axis) | **Calendar canvas + time-axis** |
| `workout` (E1) | **Streak viz + data-forward** — large heatmap (12-week × 7-day) as hero with one streak number in Fraunces; palette.300→700 punch | **Vertical log** (recent sessions) + **weekly bar** below | `streak-heatmap-hero`, `session-log-v`, `weekly-bar`, `pr-callout`, `quiet-weave-self`, `memory-note` | `55b54` + `13 eae7d` | low-medium | vertical-dominant with horizontal data tile | **Heatmap canvas (data-hero)** |
| `custom` (E1) | **User-authored** — single tone-photo OR single user phrase as hero (whichever they offered at spawn) in Fraunces | Whatever Moments the user accumulated — order-of-creation, no template | varies (composer reads user's accumulated Moments) | varies | **unpredictable by design** | **mirrors user's input texture** | **User-determined (unpredictable)** |

### 9.2 Primitive coverage check (R14 enforcement)

Across the 8 base recipes, the following **distinct dominant primitives** are represented:

1. **Timeline spine (vertical)** — fertility
2. **Phase rails + mixed rhythm** — cancer_caregiver
3. **Grid collage** — pet_care
4. **Heatmap canvas (+ trend overlay)** — chronic, workout
5. **Horizontal rail (paginated)** — travel
6. **Calendar canvas + time-axis** — study
7. **User-determined** — custom

Five+ truly distinct primitives across 8 recipes. **No recipe is identical to another at the primitive level.** This is the brand test.

### 9.3 Spawner contract

Chapters spawned by the asset-spawner LLM at step_01 must be mapped to one of these recipes before render. Mismatched mapping → **designer review (D0), not auto-accept**. **Travel / workout / study warm-start recipes live alongside fertility in the spawner's memory** — fertility is the warm-start seed, not the only render path.

When the spawner produces a type outside the 8 base recipes, the spawner emits a `recipe_proposal` payload (`{ dominant_primitive, hero_treatment, row_orientation, suggested_moments[], rhythm_dominance }`) routed to D0 review queue. Only after D0 acceptance does the new recipe land in `src/theme/recipes.ts` and become a render target.

### 9.4 Worked divergence example (the brand proof)

`travel` vs `fertility`:
- **Primitive**: travel = horizontal paginated rail. fertility = vertical timeline spine. Different *axis of attention*.
- **Hero**: travel = full-bleed map + floating day-cards on L4. fertility = narrative Fraunces over palette gradient + spine descending from hero.
- **Rhythm**: travel = horizontal-dominant (swipe between days). fertility = vertical-dominant (scroll through time).
- **Same tokens** (palette structure, elevation scale, spacing, typography, motion). **Different world.** A user who has both chapters cannot describe MODU as one layout.

---

## References

- `CLAUDE.md` §3, §4, §6, §8
- `docs/adr/0013-adaptive-by-default.md` (slot model, Quality Contract)
- `docs/adr/0018-horizontal-first-pivot.md` (Signal Axes, per-asset compliance envelope)
- `docs/grammar/modu-product-grammar.md` §4.6 (anti-internal-metaphor UI ban)
- `docs/strategy/2026-04-17-w1-retention-and-scale-vision.md` (app-open TPO lever = Hero dominance → R1)
- `src/theme/palettes.ts`, `src/theme/typography.ts`, `src/theme/widgets.ts` (D3 migration target)
- `src/theme/recipes.ts` (NEW, D1 owns — encodes §9 recipe table)
- `tools/grammar-check.ts` (NEW, D3 owns — R9 + R14 lint)
- `benchmark_modern app_component_2026/` — 14 references, catalogued in §1
