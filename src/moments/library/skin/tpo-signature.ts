// tpo-signature — skin slot Moment.
//
// Intent: TPO (Time/Place/Occasion) based initial screen tone and signature display.
// App-Open TPO immediacy — W1 retention §2.2, ADR-0013 §Implementation.
//
// Predicate:
//   - L0 quietMode=true  → 0 (always respect user's quiet declaration)
//   - L1 hour + occasion present → 0.3–0.9 scaled by signal richness
//   - fallback (skin always shows) → 0.5
//
// Variants: warm / neutral / minimal
// Locales: en-US + ko-KR co-render (ADR-0014)

import type { Moment, MomentContext, MomentRenderResult } from '../../core/types';

// ---------------------------------------------------------------------------
// Predicate
// ---------------------------------------------------------------------------

function computeScore(ctx: MomentContext): number {
  // L0 always wins — quiet mode suppresses the skin entirely.
  if (ctx.l0?.quietMode === true) return 0;

  const { occasion, hour } = ctx.l1 ?? {};

  let score = 0.3; // base — skin slot should nearly always show

  // Occasion signal
  if (occasion === 'app_open') score += 0.4;
  else if (occasion === 'before_event') score += 0.2;
  else if (occasion === 'post_action') score += 0.1;

  // Hour signal adds richness — morning / evening peaks
  if (hour !== undefined) {
    if ((hour >= 6 && hour <= 9) || (hour >= 19 && hour <= 22)) {
      score += 0.2; // peak TPO window
    } else {
      score += 0.1;
    }
  }

  // Clamp to [0, 1]
  return Math.min(1, score);
}

// ---------------------------------------------------------------------------
// Shared render helper
// ---------------------------------------------------------------------------

function buildExplanation(ctx: MomentContext): string {
  const { occasion, hour } = ctx.l1 ?? {};
  const parts: string[] = [];
  if (occasion === 'app_open') parts.push('the app just opened');
  if (hour !== undefined) parts.push(`the current hour is ${hour}`);
  if (parts.length === 0) parts.push('your profile and current phase');
  return `Shown because ${parts.join(' and ')} match your usual rhythm.`;
}

function makeResult(
  componentId: string,
  role: string,
  variantHint: string,
  ctx: MomentContext,
  accessibilityLabel: string,
): MomentRenderResult {
  const locale = ctx.locale;
  return {
    key: `tpo-signature:${role}:${locale}`,
    componentId,
    props: {
      role,
      locale,
      phase: ctx.phase ?? 'before',
      variant: variantHint,
      hour: ctx.l1?.hour,
      occasion: ctx.l1?.occasion,
    },
    accessibilityLabel,
    minTouchPt: 44,
    explanation: buildExplanation(ctx),
  };
}

// ---------------------------------------------------------------------------
// Role-specific renderers
// ---------------------------------------------------------------------------

function renderSelf(ctx: MomentContext): MomentRenderResult {
  const variant = ctx.l2?.variantHint ?? 'neutral';
  const label =
    ctx.locale === 'ko-KR'
      ? '현재 시간과 상황에 맞게 조정된 앱 테마'
      : 'App theme personalised for your current time and moment.';
  return makeResult('TpoSignatureSelfCard', 'self', variant, ctx, label);
}

function renderPartner(ctx: MomentContext): MomentRenderResult {
  const variant = ctx.l2?.variantHint ?? 'warm';
  const label =
    ctx.locale === 'ko-KR'
      ? '파트너 역할에 맞게 조정된 앱 테마'
      : 'App theme personalised for your partner role.';
  return makeResult('TpoSignaturePartnerCard', 'partner', variant, ctx, label);
}

function renderCaregiver(ctx: MomentContext): MomentRenderResult {
  const variant = ctx.l2?.variantHint ?? 'neutral';
  const label =
    ctx.locale === 'ko-KR'
      ? '간병인 역할에 맞게 조정된 앱 테마'
      : 'App theme personalised for your caregiver role.';
  return makeResult('TpoSignatureCaregiverCard', 'caregiver', variant, ctx, label);
}

// ---------------------------------------------------------------------------
// Moment definition
// ---------------------------------------------------------------------------

export const tpoSignature: Moment = {
  id: 'tpo-signature',
  intent: 'Display TPO-tuned initial screen tone and signature on app open.',
  slot: 'skin',

  predicate: computeScore,

  defaultRenderer: renderSelf,

  roleRenderers: {
    self: renderSelf,
    partner: renderPartner,
    caregiver: renderCaregiver,
  },

  events: {
    exposed: (_ctx) => { /* wired in Task #13 */ },
    tapped: (_ctx) => { /* no-op: skin slot does not capture taps */ },
    dwell: (_ctx, _ms) => { /* no-op: skin slot */ },
    dismissed: (_ctx) => { /* no-op: skin slot */ },
    resultingMemory: (_ctx, _memId) => { /* skin slot does not create memories */ },
  },

  variants: {
    warm: { tone: 'warm', density: 'normal', lang: 'en-US' },
    neutral: { tone: 'neutral', density: 'normal', lang: 'en-US' },
    minimal: { tone: 'gentle', density: 'compact', lang: 'en-US' },
  },
};
