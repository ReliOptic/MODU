// quiet-weave — hero slot Moment.
//
// Intent: Weave the partner's state into the self timeline without a
//         disruptive notification card. ADR-0013 A1 — quiet-weave rename.
//
// P0 scope: self logic fully implemented.
// P0.5 scope: partner logic is a minimal placeholder — TODO for Task #18+.
//
// Predicate:
//   - L2 variantHint === 'partner-active' → 0.85 (partner state present)
//   - general self mode → 0.4
//   - L0 quietMode=true → 0
//
// Role dispatch (ADR-0013 Q4 Hybrid c):
//   - self     → detailed self timeline view, partner signals woven quietly
//   - partner  → P0.5 TODO placeholder (minimal lint-passing renderer)
//   - caregiver → simplified self-equivalent view
//
// Locales: en-US + ko-KR co-render (ADR-0014)

import type { Moment, MomentContext, MomentRenderResult } from '../../core/types';

// ---------------------------------------------------------------------------
// Predicate
// ---------------------------------------------------------------------------

function computeScore(ctx: MomentContext): number {
  // L0 always wins.
  if (ctx.l0?.quietMode === true) return 0;

  // L2 partner-active hint → elevated score for quiet-weave
  if (ctx.l2?.variantHint === 'partner-active') return 0.85;

  // General self / caregiver mode
  return 0.4;
}

// ---------------------------------------------------------------------------
// Self renderer — P0 full implementation
// ---------------------------------------------------------------------------

function renderSelf(ctx: MomentContext): MomentRenderResult {
  const isKo = ctx.locale === 'ko-KR';
  const isPartnerActive = ctx.l2?.variantHint === 'partner-active';

  // Tone shifts quietly based on partner signal — no explicit label.
  // ADR-0013 A1: partner state woven, not announced.
  const tone = isPartnerActive ? 'warm' : 'neutral';

  const title = isKo
    ? '오늘의 흐름'
    : "Today's flow";

  const subtitle = isKo
    ? '지금 가장 중요한 것에 집중하세요.'
    : 'Focus on what matters most right now.';

  const label = isKo
    ? `타임라인 요약: ${title}`
    : `Timeline summary: ${title}`;

  const explanation = isKo
    ? (isPartnerActive
        ? '현재 상황과 파트너의 최근 신호를 바탕으로 오늘의 흐름을 조용히 조율했습니다.'
        : '현재 단계와 시간대를 바탕으로 오늘의 흐름을 표시합니다.')
    : (isPartnerActive
        ? 'Your timeline is quietly shaped by your current context and a recent signal from your partner.'
        : 'Shown based on your current phase and the time of day.');

  return {
    key: `quiet-weave:self:${ctx.locale}`,
    componentId: 'QuietWeaveSelfCard',
    props: {
      role: 'self',
      locale: ctx.locale,
      phase: ctx.l1?.phase ?? ctx.phase,
      tone,
      title,
      subtitle,
      partnerActive: isPartnerActive,
    },
    accessibilityLabel: label,
    minTouchPt: 44,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// Partner renderer — P0.5 TODO placeholder
// Minimal implementation so the Moment passes Quality Contract in dev.
// Full partner logic deferred to Task #18+ (ADR-0013 A1 P0.5 scope).
// ---------------------------------------------------------------------------

function renderPartner(ctx: MomentContext): MomentRenderResult {
  // P0.5 TODO: implement partner-facing quiet-weave view.
  // For now returns a minimal valid result so lint + Quality Contract pass.
  const isKo = ctx.locale === 'ko-KR';
  const label = isKo
    ? '파트너 타임라인 (준비 중)'
    : 'Partner timeline (coming soon)';
  return {
    key: `quiet-weave:partner:${ctx.locale}`,
    componentId: 'QuietWeavePartnerCard',
    props: {
      role: 'partner',
      locale: ctx.locale,
      phase: ctx.l1?.phase ?? ctx.phase,
      placeholder: true,
    },
    accessibilityLabel: label,
    minTouchPt: 44,
    explanation: isKo
      ? '파트너 역할 화면은 다음 업데이트에서 제공됩니다.'
      : 'Partner view is available in the next update.',
  };
}

// ---------------------------------------------------------------------------
// Caregiver renderer — simplified self-equivalent
// ---------------------------------------------------------------------------

function renderCaregiver(ctx: MomentContext): MomentRenderResult {
  const isKo = ctx.locale === 'ko-KR';

  const title = isKo
    ? '오늘의 간병 흐름'
    : "Today's caregiving flow";

  const subtitle = isKo
    ? '지금 가장 필요한 것에 집중하세요.'
    : 'Focus on what is most needed right now.';

  const label = isKo
    ? `간병 타임라인: ${title}`
    : `Caregiving timeline: ${title}`;

  return {
    key: `quiet-weave:caregiver:${ctx.locale}`,
    componentId: 'QuietWeaveCaregiverCard',
    props: {
      role: 'caregiver',
      locale: ctx.locale,
      phase: ctx.l1?.phase ?? ctx.phase,
      tone: 'neutral',
      title,
      subtitle,
    },
    accessibilityLabel: label,
    minTouchPt: 44,
    explanation: isKo
      ? '현재 간병 단계와 시간대를 바탕으로 오늘의 흐름을 표시합니다.'
      : 'Shown based on your caregiving phase and the time of day.',
  };
}

// ---------------------------------------------------------------------------
// Moment definition
// ---------------------------------------------------------------------------

export const quietWeave: Moment = {
  id: 'quiet-weave',
  intent:
    'Weave partner state into the self timeline without disruptive notification cards.',
  slot: 'hero',

  predicate: computeScore,

  defaultRenderer: renderSelf,

  roleRenderers: {
    self: renderSelf,
    partner: renderPartner,     // P0.5 placeholder
    caregiver: renderCaregiver,
  },

  events: {
    exposed: (_ctx) => { /* wired in Task #13 */ },
    tapped: (_ctx) => { /* wired in Task #13 */ },
    dwell: (_ctx, _ms) => { /* wired in Task #13 */ },
    dismissed: (_ctx) => { /* wired in Task #13 */ },
    resultingMemory: (_ctx, _memId) => { /* wired in Task #13 */ },
  },

  variants: {
    warm: { tone: 'warm', density: 'normal', lang: 'en-US' },
    neutral: { tone: 'neutral', density: 'normal', lang: 'en-US' },
    minimal: { tone: 'gentle', density: 'compact', lang: 'en-US' },
  },
};
