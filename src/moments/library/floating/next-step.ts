// next-step — floating slot Moment.
//
// Intent: Show the single next-action prompt relevant to the current context.
// Zero-friction action-message loop. Only one prompt shown at a time.
//
// Predicate:
//   - L0 quietMode=true → 0
//   - phase='before' + occasion='app_open' → highest (0.85)
//   - phase='before' alone → 0.6
//   - occasion='app_open' alone → 0.55
//   - occasion='before_event' → 0.5
//   - otherwise → 0.3
//
// Role dispatch:
//   - self     → self-care / personal next action
//   - partner  → coordinate with partner
//   - caregiver → caregiving note / reminder
//
// Locales: en-US + ko-KR co-render (ADR-0014)

import type { Moment, MomentContext, MomentRenderResult } from '../../core/types';

// ---------------------------------------------------------------------------
// Predicate
// ---------------------------------------------------------------------------

function computeScore(ctx: MomentContext): number {
  // L0 quietMode always wins.
  if (ctx.l0?.quietMode === true) return 0;

  const phase = ctx.l1?.phase ?? ctx.phase;
  const occasion = ctx.l1?.occasion;

  if (phase === 'before' && occasion === 'app_open') return 0.85;
  if (phase === 'before') return 0.6;
  if (occasion === 'app_open') return 0.55;
  if (occasion === 'before_event') return 0.5;
  return 0.3;
}

// ---------------------------------------------------------------------------
// Copy helpers
// ---------------------------------------------------------------------------

function selfCopy(ctx: MomentContext): { title: string; cta: string } {
  const isKo = ctx.locale === 'ko-KR';
  const phase = ctx.l1?.phase ?? ctx.phase;
  if (phase === 'before') {
    return {
      title: isKo ? '오늘 챙겨야 할 한 가지' : 'One thing to take care of today',
      cta: isKo ? '지금 확인하기' : 'Check now',
    };
  }
  if (phase === 'after') {
    return {
      title: isKo ? '오늘 어땠나요?' : 'How did today go?',
      cta: isKo ? '기록하기' : 'Log it',
    };
  }
  return {
    title: isKo ? '지금 할 수 있는 한 가지' : 'One thing you can do right now',
    cta: isKo ? '시작하기' : 'Start',
  };
}

function partnerCopy(ctx: MomentContext): { title: string; cta: string } {
  const isKo = ctx.locale === 'ko-KR';
  return {
    title: isKo ? '파트너와 조율할 것' : 'Coordinate with your partner',
    cta: isKo ? '메시지 보내기' : 'Send a note',
  };
}

function caregiverCopy(ctx: MomentContext): { title: string; cta: string } {
  const isKo = ctx.locale === 'ko-KR';
  return {
    title: isKo ? '간병 메모 남기기' : 'Leave a caregiving note',
    cta: isKo ? '메모 작성' : 'Write note',
  };
}

// ---------------------------------------------------------------------------
// Role-specific renderers
// ---------------------------------------------------------------------------

function renderSelf(ctx: MomentContext): MomentRenderResult {
  const { title, cta } = selfCopy(ctx);
  const label =
    ctx.locale === 'ko-KR'
      ? `다음 할 일: ${title}`
      : `Next step: ${title}`;
  return {
    key: `next-step:self:${ctx.locale}`,
    componentId: 'NextStepPrompt',
    props: { role: 'self', title, cta, locale: ctx.locale, phase: ctx.l1?.phase ?? ctx.phase },
    accessibilityLabel: label,
    minTouchPt: 44,
    explanation:
      ctx.locale === 'ko-KR'
        ? '현재 단계와 상황을 바탕으로 가장 적절한 다음 행동을 제안합니다.'
        : 'Suggested based on your current phase and occasion.',
  };
}

function renderPartner(ctx: MomentContext): MomentRenderResult {
  const { title, cta } = partnerCopy(ctx);
  const label =
    ctx.locale === 'ko-KR'
      ? `파트너 조율: ${title}`
      : `Partner action: ${title}`;
  return {
    key: `next-step:partner:${ctx.locale}`,
    componentId: 'NextStepPrompt',
    props: { role: 'partner', title, cta, locale: ctx.locale, phase: ctx.l1?.phase ?? ctx.phase },
    accessibilityLabel: label,
    minTouchPt: 44,
    explanation:
      ctx.locale === 'ko-KR'
        ? '파트너 역할에서 지금 할 수 있는 가장 적절한 행동을 제안합니다.'
        : 'Suggested next action for your partner role in the current context.',
  };
}

function renderCaregiver(ctx: MomentContext): MomentRenderResult {
  const { title, cta } = caregiverCopy(ctx);
  const label =
    ctx.locale === 'ko-KR'
      ? `간병 다음 행동: ${title}`
      : `Caregiver next step: ${title}`;
  return {
    key: `next-step:caregiver:${ctx.locale}`,
    componentId: 'NextStepPrompt',
    props: { role: 'caregiver', title, cta, locale: ctx.locale, phase: ctx.l1?.phase ?? ctx.phase },
    accessibilityLabel: label,
    minTouchPt: 44,
    explanation:
      ctx.locale === 'ko-KR'
        ? '간병 역할에서 지금 가장 필요한 다음 행동을 제안합니다.'
        : 'Suggested based on your caregiving role and the current phase.',
  };
}

// ---------------------------------------------------------------------------
// Moment definition
// ---------------------------------------------------------------------------

export const nextStep: Moment = {
  id: 'next-step',
  intent: 'Show the single most relevant next-action prompt for the current context.',
  slot: 'floating',

  predicate: computeScore,

  defaultRenderer: renderSelf,

  roleRenderers: {
    self: renderSelf,
    partner: renderPartner,
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
    warm: { tone: 'warm', density: 'compact', lang: 'en-US' },
    neutral: { tone: 'neutral', density: 'compact', lang: 'en-US' },
    minimal: { tone: 'gentle', density: 'compact', lang: 'en-US' },
  },
};
