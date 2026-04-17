// P0 Moments integration tests.
//
// Covers:
//   - tpo-signature (skin): predicate scores, role dispatch, quietMode=0
//   - next-step (floating): predicate scores, role dispatch, quietMode=0
//   - quiet-weave (hero): predicate scores, partner-active hint, P0.5 placeholder
//   - render() slot routing: skin→tpo-signature, floating→next-step, hero→quiet-weave
//   - kill-switch: disabledMomentIds suppresses the Moment
//   - Quality Contract: assertQualityContract passes for all 3 Moments × all roles
//   - en-US vs ko-KR locale difference confirmed

import {
  registerMoment,
  _clearRegistryForTesting,
  render,
  collectViolations,
  assertQualityContract,
} from '../../core';
import type { MomentContext } from '../../core';
import { registerAllMoments } from '../index';
import { tpoSignature } from '../skin/tpo-signature';
import { nextStep } from '../floating/next-step';
import { quietWeave } from '../hero/quiet-weave';

// ---------------------------------------------------------------------------
// Mock lib/events so emitMomentExposed does not blow up in test env
// ---------------------------------------------------------------------------

jest.mock('../../../lib/events', () => ({ emit: jest.fn() }));

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<MomentContext> = {}): MomentContext {
  return {
    role: 'self',
    locale: 'en-US',
    phase: 'before',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  _clearRegistryForTesting();
});

// ===========================================================================
// tpo-signature (skin)
// ===========================================================================

describe('tpo-signature predicate', () => {
  it('returns 0 when L0 quietMode=true', () => {
    const ctx = makeCtx({ l0: { quietMode: true } });
    expect(tpoSignature.predicate(ctx)).toBe(0);
  });

  it('returns 0.9 for app_open + morning hour (peak TPO window)', () => {
    const ctx = makeCtx({ l1: { occasion: 'app_open', hour: 7 } });
    const score = tpoSignature.predicate(ctx);
    // base 0.3 + occasion 0.4 + peak hour 0.2 = 0.9
    expect(score).toBeCloseTo(0.9);
  });

  it('returns 0.7 for app_open without hour signal', () => {
    const ctx = makeCtx({ l1: { occasion: 'app_open' } });
    const score = tpoSignature.predicate(ctx);
    // base 0.3 + occasion 0.4 = 0.7
    expect(score).toBeCloseTo(0.7);
  });

  it('returns lower score for post_action occasion', () => {
    const appOpenCtx = makeCtx({ l1: { occasion: 'app_open' } });
    const postActionCtx = makeCtx({ l1: { occasion: 'post_action' } });
    expect(tpoSignature.predicate(postActionCtx)).toBeLessThan(
      tpoSignature.predicate(appOpenCtx),
    );
  });

  it('score is within [0, 1] for all inputs', () => {
    const ctxs: MomentContext[] = [
      makeCtx(),
      makeCtx({ l1: { occasion: 'app_open', hour: 21 } }),
      makeCtx({ l0: { quietMode: false }, l1: { occasion: 'before_event', hour: 14 } }),
    ];
    for (const ctx of ctxs) {
      const s = tpoSignature.predicate(ctx);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});

describe('tpo-signature role dispatch', () => {
  it('self renderer uses TpoSignatureSelfCard componentId', () => {
    const ctx = makeCtx({ role: 'self' });
    const result = (tpoSignature.roleRenderers!.self!)(ctx);
    expect(result.componentId).toBe('TpoSignatureSelfCard');
    expect(result.props['role']).toBe('self');
  });

  it('partner renderer uses TpoSignaturePartnerCard componentId', () => {
    const ctx = makeCtx({ role: 'partner' });
    const result = (tpoSignature.roleRenderers!.partner!)(ctx);
    expect(result.componentId).toBe('TpoSignaturePartnerCard');
    expect(result.props['role']).toBe('partner');
  });

  it('caregiver renderer uses TpoSignatureCaregiverCard componentId', () => {
    const ctx = makeCtx({ role: 'caregiver' });
    const result = (tpoSignature.roleRenderers!.caregiver!)(ctx);
    expect(result.componentId).toBe('TpoSignatureCaregiverCard');
    expect(result.props['role']).toBe('caregiver');
  });

  it('ko-KR label differs from en-US label', () => {
    const enCtx = makeCtx({ role: 'self', locale: 'en-US' });
    const koCtx = makeCtx({ role: 'self', locale: 'ko-KR' });
    const enResult = (tpoSignature.roleRenderers!.self!)(enCtx);
    const koResult = (tpoSignature.roleRenderers!.self!)(koCtx);
    expect(enResult.accessibilityLabel).not.toBe(koResult.accessibilityLabel);
  });
});

// ===========================================================================
// next-step (floating)
// ===========================================================================

describe('next-step predicate', () => {
  it('returns 0 when L0 quietMode=true', () => {
    const ctx = makeCtx({ l0: { quietMode: true } });
    expect(nextStep.predicate(ctx)).toBe(0);
  });

  it('returns 0.85 for phase=before + occasion=app_open (highest)', () => {
    const ctx = makeCtx({ phase: 'before', l1: { occasion: 'app_open', phase: 'before' } });
    expect(nextStep.predicate(ctx)).toBe(0.85);
  });

  it('returns 0.6 for phase=before without occasion', () => {
    const ctx = makeCtx({ phase: 'before', l1: { phase: 'before' } });
    expect(nextStep.predicate(ctx)).toBe(0.6);
  });

  it('returns 0.55 for app_open without phase=before', () => {
    const ctx = makeCtx({ phase: 'during', l1: { occasion: 'app_open', phase: 'during' } });
    expect(nextStep.predicate(ctx)).toBe(0.55);
  });

  it('returns 0.3 as base for other contexts', () => {
    const ctx = makeCtx({ phase: 'after', l1: { phase: 'after' } });
    expect(nextStep.predicate(ctx)).toBe(0.3);
  });

  it('self > partner predicate is equal (role-blind predicate)', () => {
    const selfCtx = makeCtx({ role: 'self', l1: { occasion: 'app_open', phase: 'before' } });
    const partnerCtx = makeCtx({ role: 'partner', l1: { occasion: 'app_open', phase: 'before' } });
    // predicate is role-blind per ADR-0013 Q4
    expect(nextStep.predicate(selfCtx)).toBe(nextStep.predicate(partnerCtx));
  });
});

describe('next-step role dispatch', () => {
  it('self renderer returns NextStepPrompt with self role', () => {
    const ctx = makeCtx({ role: 'self' });
    const result = (nextStep.roleRenderers!.self!)(ctx);
    expect(result.componentId).toBe('NextStepPrompt');
    expect(result.props['role']).toBe('self');
  });

  it('partner renderer returns NextStepPrompt with partner role', () => {
    const ctx = makeCtx({ role: 'partner' });
    const result = (nextStep.roleRenderers!.partner!)(ctx);
    expect(result.componentId).toBe('NextStepPrompt');
    expect(result.props['role']).toBe('partner');
  });

  it('caregiver renderer returns NextStepPrompt with caregiver role', () => {
    const ctx = makeCtx({ role: 'caregiver' });
    const result = (nextStep.roleRenderers!.caregiver!)(ctx);
    expect(result.componentId).toBe('NextStepPrompt');
    expect(result.props['role']).toBe('caregiver');
  });

  it('ko-KR title differs from en-US title (locale co-render)', () => {
    const enResult = (nextStep.roleRenderers!.self!)(makeCtx({ locale: 'en-US' }));
    const koResult = (nextStep.roleRenderers!.self!)(makeCtx({ locale: 'ko-KR' }));
    expect(enResult.props['title']).not.toBe(koResult.props['title']);
  });
});

// ===========================================================================
// quiet-weave (hero)
// ===========================================================================

describe('quiet-weave predicate', () => {
  it('returns 0 when L0 quietMode=true', () => {
    const ctx = makeCtx({ l0: { quietMode: true } });
    expect(quietWeave.predicate(ctx)).toBe(0);
  });

  it('returns 0.85 when L2 variantHint=partner-active', () => {
    const ctx = makeCtx({ l2: { variantHint: 'partner-active' } });
    expect(quietWeave.predicate(ctx)).toBe(0.85);
  });

  it('returns 0.4 for general self mode (no special hints)', () => {
    const ctx = makeCtx();
    expect(quietWeave.predicate(ctx)).toBe(0.4);
  });

  it('partner-active score > general self score', () => {
    const partnerActive = makeCtx({ l2: { variantHint: 'partner-active' } });
    const general = makeCtx();
    expect(quietWeave.predicate(partnerActive)).toBeGreaterThan(
      quietWeave.predicate(general),
    );
  });
});

describe('quiet-weave role dispatch', () => {
  it('self renderer uses QuietWeaveSelfCard componentId', () => {
    const ctx = makeCtx({ role: 'self' });
    const result = (quietWeave.roleRenderers!.self!)(ctx);
    expect(result.componentId).toBe('QuietWeaveSelfCard');
  });

  it('self renderer sets partnerActive=true when variantHint=partner-active', () => {
    const ctx = makeCtx({ role: 'self', l2: { variantHint: 'partner-active' } });
    const result = (quietWeave.roleRenderers!.self!)(ctx);
    expect(result.props['partnerActive']).toBe(true);
  });

  it('partner renderer uses QuietWeavePartnerCard (P0.5 placeholder)', () => {
    const ctx = makeCtx({ role: 'partner' });
    const result = (quietWeave.roleRenderers!.partner!)(ctx);
    expect(result.componentId).toBe('QuietWeavePartnerCard');
    expect(result.props['placeholder']).toBe(true);
  });

  it('caregiver renderer uses QuietWeaveCaregiverCard componentId', () => {
    const ctx = makeCtx({ role: 'caregiver' });
    const result = (quietWeave.roleRenderers!.caregiver!)(ctx);
    expect(result.componentId).toBe('QuietWeaveCaregiverCard');
  });

  it('ko-KR explanation differs from en-US for self renderer', () => {
    const enResult = (quietWeave.roleRenderers!.self!)(makeCtx({ locale: 'en-US' }));
    const koResult = (quietWeave.roleRenderers!.self!)(makeCtx({ locale: 'ko-KR' }));
    expect(enResult.explanation).not.toBe(koResult.explanation);
  });
});

// ===========================================================================
// render() slot routing
// ===========================================================================

describe('render() slot routing', () => {
  beforeEach(() => {
    registerAllMoments();
  });

  it('render("skin", ctx) selects tpo-signature', () => {
    const ctx = makeCtx({ l1: { occasion: 'app_open' } });
    const result = render('skin', ctx);
    expect(result).toBeDefined();
    // tpo-signature self renderer componentId
    expect(result!.componentId).toBe('TpoSignatureSelfCard');
  });

  it('render("floating", ctx) selects next-step', () => {
    const ctx = makeCtx({ phase: 'before', l1: { occasion: 'app_open', phase: 'before' } });
    const result = render('floating', ctx);
    expect(result).toBeDefined();
    expect(result!.componentId).toBe('NextStepPrompt');
  });

  it('render("hero", ctx) selects quiet-weave', () => {
    const ctx = makeCtx({ l2: { variantHint: 'partner-active' } });
    const result = render('hero', ctx);
    expect(result).toBeDefined();
    expect(result!.componentId).toBe('QuietWeaveSelfCard');
  });
});

// ===========================================================================
// Kill-switch: disabledMomentIds
// ===========================================================================

describe('kill-switch — disabledMomentIds', () => {
  beforeEach(() => {
    registerAllMoments();
  });

  it('returns undefined for skin slot when tpo-signature is disabled (array)', () => {
    const ctx = makeCtx({
      l1: { occasion: 'app_open' },
      l2: { disabledMomentIds: ['tpo-signature'] },
    });
    const result = render('skin', ctx);
    expect(result).toBeUndefined();
  });

  it('returns undefined for floating slot when next-step is disabled (Set)', () => {
    const ctx = makeCtx({
      phase: 'before',
      l1: { occasion: 'app_open', phase: 'before' },
      l2: { disabledMomentIds: new Set(['next-step']) },
    });
    const result = render('floating', ctx);
    expect(result).toBeUndefined();
  });

  it('returns undefined for hero slot when quiet-weave is disabled', () => {
    const ctx = makeCtx({
      l2: { variantHint: 'partner-active', disabledMomentIds: ['quiet-weave'] },
    });
    const result = render('hero', ctx);
    expect(result).toBeUndefined();
  });
});

// ===========================================================================
// Quality Contract — all 3 Moments × all roles
// ===========================================================================

describe('Quality Contract — all P0 Moments pass', () => {
  const roles: MomentContext['role'][] = ['self', 'partner', 'caregiver'];

  for (const role of roles) {
    it(`tpo-signature passes Quality Contract for role=${role}`, () => {
      const ctx = makeCtx({ role, l1: { occasion: 'app_open' } });
      const renderer = tpoSignature.roleRenderers![role] ?? tpoSignature.defaultRenderer;
      const result = renderer(ctx);
      const violations = collectViolations(tpoSignature, ctx, result);
      expect(violations).toHaveLength(0);
      expect(() => assertQualityContract(tpoSignature, ctx, result)).not.toThrow();
    });

    it(`next-step passes Quality Contract for role=${role}`, () => {
      const ctx = makeCtx({
        role,
        phase: 'before',
        l1: { occasion: 'app_open', phase: 'before' },
      });
      const renderer = nextStep.roleRenderers![role] ?? nextStep.defaultRenderer;
      const result = renderer(ctx);
      const violations = collectViolations(nextStep, ctx, result);
      expect(violations).toHaveLength(0);
      expect(() => assertQualityContract(nextStep, ctx, result)).not.toThrow();
    });

    it(`quiet-weave passes Quality Contract for role=${role}`, () => {
      const ctx = makeCtx({ role, l2: { variantHint: 'partner-active' } });
      const renderer = quietWeave.roleRenderers![role] ?? quietWeave.defaultRenderer;
      const result = renderer(ctx);
      const violations = collectViolations(quietWeave, ctx, result);
      expect(violations).toHaveLength(0);
      expect(() => assertQualityContract(quietWeave, ctx, result)).not.toThrow();
    });
  }
});

// ===========================================================================
// Locale co-render — en-US vs ko-KR produce different output
// ===========================================================================

describe('locale co-render — en-US vs ko-KR', () => {
  it('tpo-signature partner: ko-KR label differs from en-US', () => {
    const en = (tpoSignature.roleRenderers!.partner!)(makeCtx({ role: 'partner', locale: 'en-US' }));
    const ko = (tpoSignature.roleRenderers!.partner!)(makeCtx({ role: 'partner', locale: 'ko-KR' }));
    expect(en.accessibilityLabel).not.toBe(ko.accessibilityLabel);
  });

  it('next-step caregiver: ko-KR title differs from en-US', () => {
    const en = (nextStep.roleRenderers!.caregiver!)(makeCtx({ role: 'caregiver', locale: 'en-US' }));
    const ko = (nextStep.roleRenderers!.caregiver!)(makeCtx({ role: 'caregiver', locale: 'ko-KR' }));
    expect(en.props['title']).not.toBe(ko.props['title']);
  });

  it('quiet-weave self: ko-KR explanation differs from en-US (partner-active)', () => {
    const ctx_en = makeCtx({ role: 'self', locale: 'en-US', l2: { variantHint: 'partner-active' } });
    const ctx_ko = makeCtx({ role: 'self', locale: 'ko-KR', l2: { variantHint: 'partner-active' } });
    const en = (quietWeave.roleRenderers!.self!)(ctx_en);
    const ko = (quietWeave.roleRenderers!.self!)(ctx_ko);
    expect(en.explanation).not.toBe(ko.explanation);
  });
});

// ===========================================================================
// registerAllMoments — idempotent, all 3 Moments registered
// ===========================================================================

describe('registerAllMoments', () => {
  it('registers tpo-signature, next-step, quiet-weave into the registry', () => {
    registerAllMoments();
    // Verify by rendering each slot
    expect(render('skin', makeCtx({ l1: { occasion: 'app_open' } }))).toBeDefined();
    expect(render('floating', makeCtx({ phase: 'before', l1: { occasion: 'app_open', phase: 'before' } }))).toBeDefined();
    expect(render('hero', makeCtx({ l2: { variantHint: 'partner-active' } }))).toBeDefined();
  });

  it('calling registerAllMoments twice is idempotent (no duplicate errors)', () => {
    expect(() => {
      registerAllMoments();
      registerAllMoments();
    }).not.toThrow();
  });
});
