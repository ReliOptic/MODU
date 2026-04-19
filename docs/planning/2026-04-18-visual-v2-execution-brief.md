# MODU v2.1 Visual Language Migration — Full Execution Brief

## Mission
Execute Phase 1→4 of the visual-language v2.1 migration in a single working session.
End state: fertility · cancer_caregiver · pet_care · chronic · custom 이 서로
다른 dominant layout primitive 를 가진 home 화면을 렌더링하고, R14
pattern-opacity lint 가 CI 에서 통과.

## Read first (in this order, in full — do not skim)
1. `CLAUDE.md` — project ground rules, mobile-first, §4.6 lexicon ban
2. `~/.claude/CLAUDE.md` — global production-only rule
3. `docs/design/2026-04-18-visual-language-v2.md` — **v2.1 spec, source of truth**
4. `docs/adr/0013-adaptive-by-default.md` — slot / Moment contract
5. `docs/adr/0018-horizontal-first-pivot.md` — per-asset compliance matrix
6. `docs/grammar/modu-product-grammar.md` §4.6 — anti-lexicon
7. `~/.claude/projects/-Users-reliqbit-mac-projects-MODU/memory/feedback_variation_tpo_driven.md` — no user picker
8. `~/.claude/projects/-Users-reliqbit-mac-projects-MODU/memory/feedback_principles_first.md` — no shortcuts

## Hard guardrails (violating any = halt + ask)
- Production code only. No TODO, no placeholder, no "Coming soon".
- Strict TS (`any` forbidden). Named exports only. File ≤ 200 lines.
- Services ship with types + tests in the same commit.
- No raw hex inside components (palette tokens only, §3.1 R5).
- No user-facing internal metaphor (R9 banned list in spec §4).
- No variation picker UI in prod (memory feedback_variation_tpo_driven).
- No `widgetTokens.card` v1 token deletion until Phase 4 — additive migration.
- `npx tsc --noEmit` must return 0 errors at every phase boundary.
- `npx expo export --platform web` must succeed at every phase boundary.
- Commit at each phase boundary: `feat(visual-v2): phase N — <title>`.

---

## Phase 1 — Tokens v2 (additive, invisible to user)

### Deliverables
- `src/theme/elevation.ts` — L0..L4 per spec §3.1. Each layer:
  `{ shadow: {offsetY, blur, opacity}, blur: number|null, border: string|null, backgroundHint: string }`
  L4 ships two-stop shadow (iOS refraction).
- `src/theme/scales.ts` — `r = { xs:4, sm:8, md:12, lg:20, xl:28, full:999 }`
  and `s = { xs:4, sm:8, md:12, lg:16, xl:24, '2xl':32, '3xl':48, neg:-12 }`.
- `src/theme/motion.ts` — §3.4 curves: Micro/Macro/Ritual/Ambient durations+easings.
- `src/theme/palettes.ts`:
  - Add `heroGradient: { top, mid, bottom }` to every PaletteSwatch.
  - Per spec §3.1.A: dawn/mist/sage/dusk = `{500, 600, 700}`; blossom = `{300, 500, 700}`.
  - Keep existing `gradient` field (deprecated, do not remove).
- `src/theme/widgets.ts`:
  - Add `cardV2 = { borderRadius: r.md, padding: s.lg, ...L2 spread }`.
  - Do not touch existing `widgetTokens.card`.
- `src/theme/index.ts` — re-export elevation, scales, motion.

### Tests
- `tests/unit/theme.heroGradient.test.ts` — every PaletteKey has 3 stops and they differ.
- `tests/unit/theme.elevation.test.ts` — L0..L4 exist; L4 has two-stop shadow.

### Gate
- `npx tsc --noEmit` = 0.
- No visual change (by design).
- Commit: `feat(visual-v2): phase 1 — additive tokens (elevation, scales, hero gradient)`.

---

## Phase 2 — §9 recipe encoding + 2-axis dispatch

### Deliverables
- `src/theme/recipes.ts` — encode spec §9.1 table:
  ```ts
  export type Primitive =
    | 'timeline-spine'
    | 'phase-rails'
    | 'grid-collage'
    | 'heatmap-canvas'
    | 'horizontal-rail'
    | 'calendar-canvas'
    | 'user-determined';

  export interface AssetRecipe {
    readonly primitive: Primitive;
    readonly heroTreatment: 'narrative-gradient' | 'photo-bleed' | 'map-forward'
                          | 'calendar-forward' | 'trend-forward' | 'collage-playful'
                          | 'streak-hero' | 'user-authored';
    readonly rowOrientation: 'vertical' | 'horizontal' | 'grid' | 'mixed';
    readonly rhythm: 'vertical-dominant' | 'horizontal-dominant' | 'grid-2d'
                   | 'data-rhythm' | 'mixed' | 'user-determined';
    readonly momentIds: readonly string[];
  }

  export const RECIPES: Record<AssetType, AssetRecipe> = { ... };
  ```
  Populate all 5 base AssetTypes (fertility, cancer_caregiver, pet_care, chronic, custom)
  + stubs for travel/study/workout behind a `BASE_RECIPES` constant for Phase 2b.
- `src/screens/variations/types.ts:13`:
  - Keep `VariationId = 'bento' | 'cinematic' | 'morph'` (proximity axis).
  - Add JSDoc: "proximity-axis mood, orthogonal to asset-type primitive axis."
- `src/screens/variations/index.ts:14` — upgrade registry to 2-axis:
  ```ts
  export const VARIATION_REGISTRY:
    Readonly<Record<AssetType, Record<VariationId, VariationComponent>>>
  ```
  Per asset type, provide 3 primitive-faithful variations. Bento/Cinematic/Morph
  become internal *mood* modifiers *inside* a primitive, not the primitive itself.
  Implement:
    - `src/screens/variations/fertility/TimelineSpine{Bento,Cinematic,Morph}.tsx`
    - `src/screens/variations/pet_care/GridCollage{...}.tsx`
    - `src/screens/variations/chronic/HeatmapCanvas{...}.tsx`
    - `src/screens/variations/cancer_caregiver/PhaseRails{...}.tsx`
    - `src/screens/variations/custom/UserAuthored{...}.tsx`
  Each file ≤ 200 lines. Extract shared pieces (hero shell, meta strip, section
  label) to `src/screens/variations/_primitives/`.
- `src/screens/AssetScreen.tsx:126`:
  ```ts
  const Variation = VARIATION_REGISTRY[current.type]?.[selectVariation(resolvedTPO)]
                  ?? VARIATION_REGISTRY.custom[selectVariation(resolvedTPO)];
  ```
- Delete `ChapterGalleryScreen` wire (Phase 4 will replace with chevron long-press
  §2.A carousel). For Phase 2, remove the `onOpenGallery` callback chain; the
  carousel itself lands in Phase 4.

### Tests
- `tests/unit/recipe-divergence.test.ts` — every AssetType maps to a unique
  `primitive`; same proximity in two different AssetTypes mounts different
  components.
- `tests/unit/variations.registry.test.ts` — registry is complete over
  (AssetType × VariationId); no undefined cells.

### Gate
- `npx tsc --noEmit` = 0.
- Visual diff: fertility home ≠ pet_care home at the same proximity. Verify in
  simulator on 375px viewport.
- Commit: `feat(visual-v2): phase 2 — per-asset recipes + 2-axis dispatch`.

---

## Phase 3 — Hero dominance + pastel-page removal

### Deliverables
- `src/screens/AssetScreen.tsx:154-158` — replace `LinearGradient[50,100,50]`
  with `palette.bgMesh` radial skin (L0 only). Page no longer pastel-washed.
- Each variation file (fertility/pet_care/chronic/cancer_caregiver/custom ×
  bento/cinematic/morph): remove root `backgroundColor: palette[50]`. Root is
  transparent. Color lives in hero only.
- All heroes switch from `palette.gradient` to `palette.heroGradient` (Phase 1
  token). Hero min-height = 56% viewport (R1). Enforce via `s['3xl']` + measured
  `useWindowDimensions()` helper in `_primitives/HeroFrame.tsx`.
- L3 hero shadow = `elevation.L3`. L4 tab bar tint becomes context-aware:
  if the current hero is palette-dense (heroGradient visible), TabBar tints
  `palette[300] @ 0.6`; else `light @ 0.78`. Implement in
  `src/components/TabBar.tsx` via a `tintOverSaturated: boolean` prop derived
  from `selectVariation` output or recipe.heroTreatment.
- R6 one-accent-per-stack: audit each variation — at most one L3 palette-filled
  element per visible region.

### Tests
- `tests/unit/hero-dominance.test.ts` — snapshot of rendered hero measures
  height ≥ 0.56 × 812.
- Visual QA: fertility dawn hero = terracotta `{500,600,700}` not
  `{light→mid→pastel}`.

### Gate
- `npx tsc --noEmit` = 0.
- `npx expo export --platform web` success.
- Simulator check: each asset type's home has dense saturated hero, page background
  near-neutral.
- Commit: `feat(visual-v2): phase 3 — hero dominance, pastel-page removal`.

---

## Phase 4 — Lint (R9 + R14) + v1 token reclamation + §2.A carousel

### Deliverables
- `tools/grammar-check.ts` — new CLI:
  - R9 prefix-match over `src/**/*.{ts,tsx}` + i18n bundles:
    banned = `['Asset', 'Moment', 'TimeRiver', 'Agora', 'quiet-weave',
    'AmbientPalette', 'slot', 'predicate', 'TPO', 'signals', 'partner-echo',
    'bonding predicate', 'gallery', 'library']`.
    Allowlist for non-string-literal usage (TS type names, file paths) via AST walk.
  - R14: load `RECIPES`, assert every AssetType has a recipe, primitives are
    distinct across base types, every recipe's `momentIds` resolve in the
    atomic moment registry.
  - Exit non-zero on any violation.
- `package.json` — add script `"lint:grammar": "tsx tools/grammar-check.ts"`.
  Wire into existing CI (check `.github/workflows/*.yml`).
- `src/components/AssetSwitcher.tsx` — chevron `onLongPress` (280ms,
  `Haptics.impact('light')` at commit) triggers §2.A chapter carousel.
  Tap unchanged (quick dropdown).
- `src/screens/ChapterCarousel.tsx` (replaces `ChapterGalleryScreen.tsx`):
  per §2.A spec. Each card composed by §9 recipe (not skinned). Zoom-out 600ms
  Macro; zoom-in on center tap 600ms; ritual 920ms on switch commit.
- Delete `src/screens/ChapterGalleryScreen.tsx` and its callers.
  User-facing label: "내 챕터" / "My chapters". Never "gallery"/"library".
- `src/components/DemoControlPanel.tsx` — remove from `AssetScreen.tsx:196`.
  Mount only behind `__DEV__` on a dedicated `/dev` route (expo-router).
- v1 token reclamation — replace `widgetTokens.card` usages one file at a time
  with `widgetTokens.cardV2`. Order:
    1. `src/screens/HomeTab.tsx`
    2. `src/screens/tabs/*.tsx`
    3. `src/components/ui/Card.tsx`
    4. `src/components/widgets/**`
    5. `src/components/AssetSwitcher.tsx`
    6. `src/components/DemoControlPanel.tsx`
    7. `src/screens/ExportScreen.tsx`, `ConsentScreen.tsx`
    8. Test files
  After all 17 files green, delete `widgetTokens.card` (v1) from
  `src/theme/widgets.ts`. Delete deprecated `palette.gradient` field.
  Update `src/__tests__/theme.test.ts`.

### Tests
- `tests/unit/lint.grammar.test.ts` — feeds a known-bad string, expects non-zero exit.
- `tests/unit/lint.r14.test.ts` — mutate RECIPES in-memory to duplicate a primitive,
  expects non-zero exit.
- `tests/integration/chapter-carousel.test.tsx` — long-press chevron opens
  carousel; tap center card dismisses; tap side card triggers ritual.

### Gate
- `npm run lint:grammar` exits 0 on `main` HEAD.
- `npx tsc --noEmit` = 0.
- `npx expo export --platform web` success.
- Visual QA: carousel reachable only via long-press; no "gallery" label anywhere.
- Commit: `feat(visual-v2): phase 4 — R9/R14 lint + v1 reclamation + §2.A carousel`.

---

## Final verification (after Phase 4)
- `npx tsc --noEmit` — 0 errors.
- `npm run lint:grammar` — 0 violations.
- `npm test` — all green.
- `npx expo export --platform web` — success.
- Simulator (375 viewport) — capture home screenshot for each AssetType.
  Visually verify: 5 different dominant primitives. No two look like re-skins.
- Update `progress.md` — same or next commit:
  `docs: progress snapshot YYYY-MM-DD — visual v2.1 migration complete`.

## What NOT to do
- Do not introduce a user-facing variation picker anywhere in prod.
- Do not delete the deprecated `palette.gradient` or `widgetTokens.card`
  before Phase 4's final reclamation step.
- Do not skip tests. Every new service/primitive ships with its test file.
- Do not merge Bento/Cinematic/Morph into "the same thing for all asset types"
  at the registry level — keep them as mood modifiers *within* each primitive.
- Do not use `any`, `console.log`, empty `catch {}`, `process.env` outside
  `src/config/`.
- Do not create docs/plans as intermediate artifacts. Work from spec, commit code.

## If blocked
- Unclear recipe for a new AssetType: halt, request D0 review, do not auto-fall
  to `custom` (per spec §9.3).
- Any lint rule ambiguous about an edge case: add the edge case to
  `tools/grammar-check.ts` spec comments, ask user once, do not silently exclude.
- Any phase gate failing: fix before moving on. No parallel phases.
