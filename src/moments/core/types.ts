// Moment engine core types.
//
// ADR-0013 Adaptive-by-Default: Moments are the unit of generative UI.
// Larger than a widget, smaller than a screen (StoryCard).
// Role axis is the primary render dispatch key (ADR-0013 A2, Q4).

import type { Locale } from '../../types/events';

// ---------------------------------------------------------------------------
// Slot
// ---------------------------------------------------------------------------

/** The 5 surface slots a Moment can occupy on a screen. ADR-0013 §Slot model. */
export type Slot = 'skin' | 'glance' | 'hero' | 'row' | 'floating';

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

/** v1 role enum. `doctor` deferred to v2+ (ADR-0013 A5, Q2). */
export type Role = 'self' | 'partner' | 'caregiver';

// ---------------------------------------------------------------------------
// MomentContext  (= SignalContext in ADR-0013)
// ---------------------------------------------------------------------------

/** L0 — User-declared signal layer. Always wins over L1/L2. */
export interface L0Signals {
  /** Explicit asset type the user chose. */
  assetType?: string;
  /** User-toggled quiet mode ("지금은 조용히"). */
  quietMode?: boolean;
  /** Whether lock-screen personalisation is ON. */
  lockScreenPersonalised?: boolean;
}

/** L1 — Observed TPO + Role + Phase signals (device-observed, 0ms cost). */
export interface L1Signals {
  /** Wall-clock hour 0–23. */
  hour?: number;
  /** ISO day-of-week 1 (Mon) – 7 (Sun). */
  dayOfWeek?: number;
  /** Seconds since most recent chapter event. */
  secondsSinceEvent?: number;
  /** Coarse place signal (opt-in geofence). */
  place?: 'home' | 'clinic' | 'work' | 'unknown';
  /** App-open occasion. */
  occasion?: 'app_open' | 'post_action' | 'before_event';
  /** Phase relative to the nearest chapter event. */
  phase?: 'before' | 'during' | 'after';
}

/** L2 — AI inference hints (Gemma local / Claude edge, weekly cache). Always lowest priority. */
export interface L2Signals {
  /** Suggested variant key from the weekly-cache recommendation. */
  variantHint?: string;
  /** Arbitrary pattern notes produced by the inference layer. */
  patternNotes?: string;
  /**
   * Kill-switch: Moment ids to suppress immediately for all users.
   * ADR-0013 §4 Reversible — "L2 hint flag 로 즉시 전 사용자 OFF (앱 재배포 X)".
   * Checked in render() and renderN() before predicate evaluation.
   */
  disabledMomentIds?: ReadonlySet<string> | string[];
}

/**
 * Full signal context passed to every Moment predicate and renderer.
 *
 * L0 > L1 > L2 priority is the caller's responsibility; this type is the
 * carrier, not the enforcer (enforcement lives in signalContext.ts, future).
 */
export interface MomentContext {
  /** Active chapter (Asset.id), if any. */
  assetId?: string;
  /** Acting role for this session. Primary render-dispatch key (ADR-0013 Q4). */
  role: Role;
  /** Phase relative to nearest chapter event. */
  phase?: 'before' | 'during' | 'after';
  /** BCP-47 locale. P1 = en-US + ko-KR. */
  locale: Locale;
  /** L0 user-declared signals. */
  l0?: L0Signals;
  /** L1 device-observed signals. */
  l1?: L1Signals;
  /** L2 AI-inferred hints. */
  l2?: L2Signals;
}

// ---------------------------------------------------------------------------
// MomentEventSchema
// ---------------------------------------------------------------------------

/**
 * Lifecycle events a Moment must be able to emit.
 * Observable clause (Quality Contract §2) requires all five.
 */
export interface MomentEventSchema {
  exposed?: (ctx: MomentContext) => void;
  tapped?: (ctx: MomentContext) => void;
  dwell?: (ctx: MomentContext, dwellMs: number) => void;
  dismissed?: (ctx: MomentContext) => void;
  resultingMemory?: (ctx: MomentContext, memoryId: string) => void;
}

// ---------------------------------------------------------------------------
// VariantConfig
// ---------------------------------------------------------------------------

export type VariantKey = string;

export interface VariantConfig {
  /** Copy tone. */
  tone?: 'warm' | 'neutral' | 'gentle';
  /** Information density. */
  density?: 'compact' | 'normal' | 'expanded';
  /** Locale override for this variant. */
  lang?: Locale;
}

// ---------------------------------------------------------------------------
// MomentRenderResult
// ---------------------------------------------------------------------------

/**
 * What a Moment renderer returns.
 *
 * Kept as a plain data type (not ReactNode) so core is React-free and
 * testable in a Node environment. Platform adapters (React Native screens)
 * interpret this structure. Accessibility floor (Quality Contract §7) fields
 * are required — renderers that omit them will fail qualityContract assertions.
 */
export interface MomentRenderResult {
  /** Unique key for React reconciliation. */
  key: string;
  /** Component identifier — maps to a concrete RN component in the adapter. */
  componentId: string;
  /** Arbitrary props passed to the component. */
  props: Record<string, unknown>;
  /** VoiceOver / TalkBack accessibility label (Quality Contract §7). */
  accessibilityLabel: string;
  /** Minimum touch target height in points (must be >= 44). Quality Contract §7. */
  minTouchPt: number;
  /** One-sentence XAI explanation shown on tap-and-hold. Quality Contract §5. */
  explanation: string;
}

// ---------------------------------------------------------------------------
// Moment
// ---------------------------------------------------------------------------

/**
 * The canonical Moment interface. ADR-0013 §Unit — Moments.
 *
 * Hybrid (c) dispatch pattern (ADR-0013 Q4):
 *   render(ctx) → roleRenderers[ctx.role] ?? defaultRenderer
 *
 * `predicate` and `id`/`intent` are role-blind; the render layer dispatches.
 */
export interface Moment {
  /** Stable identifier. Exposed in Quality Contract §2 events. */
  id: string;
  /** Human/AI-readable intent description. English-first (ADR-0014). */
  intent: string;
  /** Which screen slot this Moment occupies. */
  slot: Slot;
  /**
   * Fitness score 0–1 for this Moment given the current context.
   * Rule-layer (L1, 0ms). Must be deterministic for same signals
   * (Quality Contract §3 Predictable).
   */
  predicate: (ctx: MomentContext) => number;
  /**
   * Default renderer. Used when no role-specific renderer is registered
   * or when the role has no dedicated sub-component.
   */
  defaultRenderer: (ctx: MomentContext) => MomentRenderResult;
  /**
   * Role-specific renderers. Hybrid (c): overrides defaultRenderer when
   * ctx.role matches. ADR-0013 Q4.
   */
  roleRenderers?: Partial<Record<Role, (ctx: MomentContext) => MomentRenderResult>>;
  /** Lifecycle event hooks. Observable clause requires all five to be hookable. */
  events?: MomentEventSchema;
  /** Tone/density/lang variant configurations. */
  variants?: Record<VariantKey, VariantConfig>;
}
