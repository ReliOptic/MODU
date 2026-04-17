// Moment engine core tests.
//
// Covers:
//   - Registry registration and lookup
//   - Slot-based priority ordering
//   - Hybrid (c) role dispatch (self / partner / caregiver)
//   - Quality Contract violation detection (dev mode throws)
//   - §2 Observable: moment_exposed emit on dispatchRender
//   - §4 Reversible: kill-switch via ctx.l2.disabledMomentIds
//   - §3 Predictable: 3-call + ctx-clone determinism check

import {
  registerMoment,
  registerMoments,
  getMoment,
  getCandidates,
  getBestMoment,
  _clearRegistryForTesting,
  dispatchRender,
  render,
  FALLBACK_THRESHOLD,
  collectViolations,
  QualityContractViolation,
  assertQualityContract,
  hashSignals,
} from '../core';
import type { Moment, MomentContext, MomentRenderResult } from '../core';
import { tpoSignature } from '../library/skin/tpo-signature';

// ---------------------------------------------------------------------------
// Mock emit from lib/events so we can spy on moment_exposed calls
// ---------------------------------------------------------------------------

jest.mock('../../lib/events', () => ({
  emit: jest.fn(),
}));

import { emit } from '../../lib/events';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<MomentContext> = {}): MomentContext {
  return {
    role: 'self',
    locale: 'en-US',
    phase: 'before',
    l1: { occasion: 'app_open' },
    ...overrides,
  };
}

function makeResult(id: string): MomentRenderResult {
  return {
    key: id,
    componentId: 'TestComponent',
    props: {},
    accessibilityLabel: 'Test label',
    minTouchPt: 44,
    explanation: 'Shown because test conditions match.',
  };
}

function makeMoment(
  id: string,
  slot: Moment['slot'],
  score: number,
  overrides: Partial<Moment> = {},
): Moment {
  return {
    id,
    intent: `Test intent for ${id}`,
    slot,
    predicate: () => score,
    defaultRenderer: (_ctx) => makeResult(id),
    events: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  _clearRegistryForTesting();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Registry — registration and lookup
// ---------------------------------------------------------------------------

describe('registry — registration and lookup', () => {
  it('registerMoment stores and getMoment retrieves by id', () => {
    const m = makeMoment('test-skin', 'skin', 0.8);
    registerMoment(m);
    expect(getMoment('test-skin')).toBe(m);
  });

  it('getMoment returns undefined for unknown id', () => {
    expect(getMoment('does-not-exist')).toBeUndefined();
  });

  it('registerMoments bulk-registers multiple Moments', () => {
    const moments = [
      makeMoment('a', 'skin', 0.5),
      makeMoment('b', 'glance', 0.5),
      makeMoment('c', 'hero', 0.5),
    ];
    registerMoments(moments);
    expect(getMoment('a')).toBeDefined();
    expect(getMoment('b')).toBeDefined();
    expect(getMoment('c')).toBeDefined();
  });

  it('re-registering the same id overwrites (idempotent)', () => {
    const m1 = makeMoment('dup', 'skin', 0.5);
    const m2 = makeMoment('dup', 'skin', 0.9);
    registerMoment(m1);
    registerMoment(m2);
    expect(getMoment('dup')).toBe(m2);
  });
});

// ---------------------------------------------------------------------------
// Registry — slot-based priority ordering
// ---------------------------------------------------------------------------

describe('registry — slot-based priority (getCandidates)', () => {
  it('returns only Moments for the requested slot', () => {
    registerMoment(makeMoment('skin-a', 'skin', 0.7));
    registerMoment(makeMoment('hero-a', 'hero', 0.9));
    const skinCandidates = getCandidates('skin', makeCtx());
    expect(skinCandidates.every((c) => c.moment.slot === 'skin')).toBe(true);
    expect(skinCandidates).toHaveLength(1);
  });

  it('sorts candidates by descending score', () => {
    registerMoment(makeMoment('low', 'row', 0.2));
    registerMoment(makeMoment('high', 'row', 0.9));
    registerMoment(makeMoment('mid', 'row', 0.5));
    const candidates = getCandidates('row', makeCtx());
    expect(candidates[0].moment.id).toBe('high');
    expect(candidates[1].moment.id).toBe('mid');
    expect(candidates[2].moment.id).toBe('low');
  });

  it('tie-breaks by id alphabetically for determinism (Quality Contract §3)', () => {
    registerMoment(makeMoment('z-tie', 'floating', 0.6));
    registerMoment(makeMoment('a-tie', 'floating', 0.6));
    const candidates = getCandidates('floating', makeCtx());
    expect(candidates[0].moment.id).toBe('a-tie');
    expect(candidates[1].moment.id).toBe('z-tie');
  });

  it('getBestMoment returns the highest-scoring Moment', () => {
    registerMoment(makeMoment('best', 'glance', 0.95));
    registerMoment(makeMoment('other', 'glance', 0.4));
    const best = getBestMoment('glance', makeCtx());
    expect(best?.id).toBe('best');
  });

  it('getBestMoment returns undefined when slot has no registered Moments', () => {
    expect(getBestMoment('hero', makeCtx())).toBeUndefined();
  });

  it('render() returns undefined when best score is below FALLBACK_THRESHOLD', () => {
    registerMoment(makeMoment('weak', 'skin', FALLBACK_THRESHOLD - 0.01));
    expect(render('skin', makeCtx())).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Hybrid (c) role dispatch
// ---------------------------------------------------------------------------

describe('render — Hybrid (c) role dispatch', () => {
  const roleMoment: Moment = {
    id: 'role-dispatch-test',
    intent: 'Test role dispatch',
    slot: 'hero',
    predicate: () => 0.8,
    defaultRenderer: (_ctx) => ({ ...makeResult('default'), key: 'default' }),
    roleRenderers: {
      self: (_ctx) => ({ ...makeResult('self'), key: 'self' }),
      partner: (_ctx) => ({ ...makeResult('partner'), key: 'partner' }),
      caregiver: (_ctx) => ({ ...makeResult('caregiver'), key: 'caregiver' }),
    },
    events: {},
  };

  beforeEach(() => {
    registerMoment(roleMoment);
  });

  it('dispatches to roleRenderers[self] for role=self', () => {
    const result = dispatchRender(roleMoment, makeCtx({ role: 'self' }));
    expect(result.key).toBe('self');
  });

  it('dispatches to roleRenderers[partner] for role=partner', () => {
    const result = dispatchRender(roleMoment, makeCtx({ role: 'partner' }));
    expect(result.key).toBe('partner');
  });

  it('dispatches to roleRenderers[caregiver] for role=caregiver', () => {
    const result = dispatchRender(roleMoment, makeCtx({ role: 'caregiver' }));
    expect(result.key).toBe('caregiver');
  });

  it('falls back to defaultRenderer when no roleRenderers defined', () => {
    const noRoleMoment: Moment = {
      ...makeMoment('no-role', 'hero', 0.8),
      roleRenderers: undefined,
    };
    const result = dispatchRender(noRoleMoment, makeCtx({ role: 'self' }));
    expect(result.key).toBe('no-role');
  });

  it('falls back to defaultRenderer when roleRenderer for role is missing', () => {
    const partialMoment: Moment = {
      ...makeMoment('partial-role', 'hero', 0.8),
      roleRenderers: {
        self: (_ctx) => ({ ...makeResult('self-only'), key: 'self-only' }),
        // partner and caregiver intentionally absent
      },
    };
    const result = dispatchRender(partialMoment, makeCtx({ role: 'partner' }));
    expect(result.key).toBe('partial-role');
  });

  it('tpoSignature dispatches different keys per role', () => {
    const selfResult = dispatchRender(tpoSignature, makeCtx({ role: 'self' }));
    const partnerResult = dispatchRender(tpoSignature, makeCtx({ role: 'partner' }));
    const caregiverResult = dispatchRender(tpoSignature, makeCtx({ role: 'caregiver' }));
    expect(selfResult.props['role']).toBe('self');
    expect(partnerResult.props['role']).toBe('partner');
    expect(caregiverResult.props['role']).toBe('caregiver');
  });
});

// ---------------------------------------------------------------------------
// Quality Contract violation detection
// ---------------------------------------------------------------------------

describe('Quality Contract — violation detection (dev mode)', () => {
  it('§1 bounded_variation: throws when Moment id is empty', () => {
    const bad: Moment = {
      ...makeMoment('', 'skin', 0.5),
      id: '',
    };
    expect(() => assertQualityContract(bad, makeCtx())).toThrow(QualityContractViolation);
    const violations = collectViolations(bad, makeCtx());
    expect(violations.some((v) => v.includes('bounded_variation'))).toBe(true);
  });

  it('§2 observable: throws when events field is undefined', () => {
    const bad: Moment = {
      id: 'no-events',
      intent: 'Test',
      slot: 'skin',
      predicate: () => 0.5,
      defaultRenderer: (_ctx) => makeResult('no-events'),
      events: undefined,
    };
    const violations = collectViolations(bad, makeCtx());
    expect(violations.some((v) => v.includes('observable'))).toBe(true);
  });

  it('§3 predictable: throws when predicate is non-deterministic', () => {
    let callCount = 0;
    const bad: Moment = {
      ...makeMoment('nondeterministic', 'skin', 0.5),
      predicate: () => { callCount++; return callCount * 0.1; },
    };
    const violations = collectViolations(bad, makeCtx());
    expect(violations.some((v) => v.includes('predictable'))).toBe(true);
  });

  it('§score_range (formerly §3): predicate returning value outside [0,1] triggers score_range violation', () => {
    const bad: Moment = {
      ...makeMoment('out-of-range', 'skin', 1.5),
    };
    const violations = collectViolations(bad, makeCtx());
    expect(violations.some((v) => v.includes('score_range'))).toBe(true);
  });

  it('§4 reversible: throws when intent is empty string', () => {
    const bad: Moment = {
      ...makeMoment('no-intent', 'skin', 0.5),
      intent: '',
    };
    const violations = collectViolations(bad, makeCtx());
    expect(violations.some((v) => v.includes('reversible'))).toBe(true);
  });

  it('§5 auditable_explainable: throws when result.explanation is empty', () => {
    const good = makeMoment('good', 'skin', 0.5);
    const badResult: MomentRenderResult = {
      ...makeResult('good'),
      explanation: '',
    };
    const violations = collectViolations(good, makeCtx(), badResult);
    expect(violations.some((v) => v.includes('auditable_explainable'))).toBe(true);
  });

  it('§6 fallback: throws when predicate returns NaN', () => {
    const bad: Moment = {
      ...makeMoment('nan-score', 'skin', NaN),
    };
    const violations = collectViolations(bad, makeCtx());
    expect(violations.some((v) => v.includes('fallback'))).toBe(true);
  });

  it('§7 accessibility_floor: throws when accessibilityLabel is empty', () => {
    const good = makeMoment('good-a11y', 'skin', 0.5);
    const badResult: MomentRenderResult = {
      ...makeResult('good-a11y'),
      accessibilityLabel: '',
    };
    const violations = collectViolations(good, makeCtx(), badResult);
    expect(violations.some((v) => v.includes('accessibility_floor'))).toBe(true);
  });

  it('§7 accessibility_floor: throws when minTouchPt < 44', () => {
    const good = makeMoment('small-touch', 'skin', 0.5);
    const badResult: MomentRenderResult = {
      ...makeResult('small-touch'),
      minTouchPt: 32,
    };
    const violations = collectViolations(good, makeCtx(), badResult);
    expect(violations.some((v) => v.includes('accessibility_floor'))).toBe(true);
  });

  it('a fully compliant Moment produces zero violations', () => {
    const good = makeMoment('compliant', 'skin', 0.7);
    const result = makeResult('compliant');
    const violations = collectViolations(good, makeCtx(), result);
    expect(violations).toHaveLength(0);
  });

  it('assertQualityContract does not throw for a compliant Moment', () => {
    const good = makeMoment('assert-ok', 'floating', 0.6);
    const result = makeResult('assert-ok');
    expect(() => assertQualityContract(good, makeCtx(), result)).not.toThrow();
  });

  it('§score_range: violation when predicate returns value > 1', () => {
    const bad: Moment = { ...makeMoment('over-range', 'skin', 1.5) };
    const violations = collectViolations(bad, makeCtx());
    expect(violations.some((v) => v.includes('score_range'))).toBe(true);
  });

  it('§score_range: violation when predicate returns value < 0', () => {
    const bad: Moment = { ...makeMoment('under-range', 'skin', -0.1) };
    const violations = collectViolations(bad, makeCtx());
    expect(violations.some((v) => v.includes('score_range'))).toBe(true);
  });

  it('§score_range: no violation for predicate returning 0', () => {
    const good: Moment = { ...makeMoment('zero-score', 'skin', 0) };
    const violations = collectViolations(good, makeCtx());
    expect(violations.every((v) => !v.includes('score_range'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// §2 Observable — emitMomentExposed spy
// ---------------------------------------------------------------------------

describe('§2 Observable — emit moment_exposed', () => {
  const emitMock = emit as jest.MockedFunction<typeof emit>;

  it('dispatchRender emits moment_exposed exactly once on success', () => {
    const m = makeMoment('obs-skin', 'skin', 0.8);
    const ctx = makeCtx();
    dispatchRender(m, ctx);
    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(emitMock).toHaveBeenCalledWith(
      'moment_exposed',
      expect.objectContaining({
        moment_id: 'obs-skin',
        slot: 'skin',
        outcome: 'rendered',
      }),
      expect.objectContaining({ role: 'self', locale: 'en-US' }),
    );
  });

  it('dispatchRender emit includes signals_hash as non-empty string', () => {
    const m = makeMoment('obs-hash', 'glance', 0.7);
    const ctx = makeCtx({ l1: { hour: 9 } });
    dispatchRender(m, ctx);
    const [, props] = emitMock.mock.calls[0];
    expect(typeof (props as Record<string, unknown>)['signals_hash']).toBe('string');
    expect((props as Record<string, unknown>)['signals_hash']).not.toBe('');
  });

  it('render() below threshold does NOT emit moment_exposed', () => {
    registerMoment(makeMoment('weak-obs', 'skin', FALLBACK_THRESHOLD - 0.01));
    render('skin', makeCtx());
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('render() above threshold emits moment_exposed once', () => {
    registerMoment(makeMoment('strong-obs', 'skin', 0.9));
    render('skin', makeCtx());
    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(emitMock).toHaveBeenCalledWith(
      'moment_exposed',
      expect.objectContaining({ moment_id: 'strong-obs' }),
      expect.anything(),
    );
  });

  it('variant in emitted event uses ctx.l2.variantHint when set', () => {
    const m = makeMoment('variant-obs', 'hero', 0.8);
    const ctx = makeCtx({ l2: { variantHint: 'warm' } });
    dispatchRender(m, ctx);
    const [, props] = emitMock.mock.calls[0];
    expect((props as Record<string, unknown>)['variant']).toBe('warm');
  });

  it('variant defaults to "default" when ctx.l2.variantHint is absent', () => {
    const m = makeMoment('variant-default', 'hero', 0.8);
    dispatchRender(m, makeCtx());
    const [, props] = emitMock.mock.calls[0];
    expect((props as Record<string, unknown>)['variant']).toBe('default');
  });
});

// ---------------------------------------------------------------------------
// §4 Reversible — kill-switch via ctx.l2.disabledMomentIds
// ---------------------------------------------------------------------------

describe('§4 Reversible — kill-switch', () => {
  it('render() skips a Moment whose id is in disabledMomentIds (array)', () => {
    registerMoment(makeMoment('tpo-signature', 'skin', 0.9));
    const ctx = makeCtx({ l2: { disabledMomentIds: ['tpo-signature'] } });
    const result = render('skin', ctx);
    expect(result).toBeUndefined();
  });

  it('render() skips a Moment whose id is in disabledMomentIds (ReadonlySet)', () => {
    registerMoment(makeMoment('kill-set', 'skin', 0.9));
    const ctx = makeCtx({ l2: { disabledMomentIds: new Set(['kill-set']) } });
    const result = render('skin', ctx);
    expect(result).toBeUndefined();
  });

  it('render() uses next candidate when first is kill-switched', () => {
    registerMoment(makeMoment('primary', 'skin', 0.9));
    registerMoment(makeMoment('fallback-moment', 'skin', 0.5));
    const ctx = makeCtx({ l2: { disabledMomentIds: ['primary'] } });
    const result = render('skin', ctx);
    expect(result?.key).toBe('fallback-moment');
  });

  it('render() returns result normally when disabledMomentIds is empty', () => {
    registerMoment(makeMoment('allowed', 'skin', 0.9));
    const ctx = makeCtx({ l2: { disabledMomentIds: [] } });
    const result = render('skin', ctx);
    expect(result).toBeDefined();
    expect(result?.key).toBe('allowed');
  });

  it('kill-switch does NOT emit moment_exposed for the skipped Moment', () => {
    const emitMock2 = emit as jest.MockedFunction<typeof emit>;
    registerMoment(makeMoment('no-emit-killed', 'skin', 0.9));
    const ctx = makeCtx({ l2: { disabledMomentIds: ['no-emit-killed'] } });
    render('skin', ctx);
    expect(emitMock2).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// §3 Predictable — 3-call + ctx-clone determinism
// ---------------------------------------------------------------------------

describe('§3 Predictable — determinism enforcement', () => {
  it('closure state leak detected: counter-based predicate fails', () => {
    let n = 0;
    const leaky: Moment = {
      ...makeMoment('leaky', 'skin', 0),
      predicate: () => { n++; return n * 0.1; },
    };
    const violations = collectViolations(leaky, makeCtx());
    expect(violations.some((v) => v.includes('predictable'))).toBe(true);
  });

  it('pure predicate passes 3-call check', () => {
    const pure: Moment = { ...makeMoment('pure', 'skin', 0.5) };
    const violations = collectViolations(pure, makeCtx());
    expect(violations.every((v) => !v.includes('predictable'))).toBe(true);
  });

  it('hashSignals returns identical hash for two equal contexts', () => {
    const ctx1 = makeCtx({ l1: { hour: 8, place: 'home' } });
    const ctx2 = makeCtx({ l1: { hour: 8, place: 'home' } });
    expect(hashSignals(ctx1)).toBe(hashSignals(ctx2));
  });

  it('hashSignals returns different hash for different signal values', () => {
    const ctx1 = makeCtx({ l1: { hour: 8 } });
    const ctx2 = makeCtx({ l1: { hour: 20 } });
    expect(hashSignals(ctx1)).not.toBe(hashSignals(ctx2));
  });

  it('hashSignals excludes disabledMomentIds from hash (operational, not signal)', () => {
    const ctx1 = makeCtx({ l2: { variantHint: 'warm' } });
    const ctx2 = makeCtx({ l2: { variantHint: 'warm', disabledMomentIds: ['foo'] } });
    expect(hashSignals(ctx1)).toBe(hashSignals(ctx2));
  });
});
