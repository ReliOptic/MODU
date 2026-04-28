import { describe, it, expect } from 'vitest';
import { evaluate, formatTrace } from '../../src/index.js';
import type { TPOContext, EvalOptions, RulePack, Registry, LockedSlots, PolicyPack } from '../../src/index.js';

// ---------------------------------------------------------------------------
// Shared fixtures for trace tests
// ---------------------------------------------------------------------------

const ctx: TPOContext = {
  event: 'KCD Korea 2026',
  stage: 'registered',
  role: 'attendee',
  time: { phase: 'D-3', offsetDays: -3 },
  place: { type: 'conference-venue', city: 'Seoul' },
  locale: 'ko-KR',
  device: 'mobile',
};

const registry: Registry = {
  SponsorBannerKCD2026:  { key: 'SponsorBannerKCD2026' },
  SessionCheckInPrompt:  { key: 'SessionCheckInPrompt' },
  FeedbackForm:          { key: 'FeedbackForm' },
  LocalDining:           { key: 'LocalDining' },
};

function buildFullResult() {
  const rules: RulePack = {
    version: '1.0.0',
    rules: [
      {
        id: 'r-selected',
        componentKey: 'SessionCheckInPrompt',
        slot: 'primary_action',
        conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
        priority: 1,
      },
      {
        id: 'r-suppress',
        componentKey: 'FeedbackForm',
        slot: 'feedback',
        conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
        priority: 2,
      },
      {
        id: 'r-abstain',
        componentKey: 'LocalDining',
        slot: 'dining',
        conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
        priority: 3,
        confidenceHint: 0.41,
      },
    ],
  };
  const lockedSlots: LockedSlots = [
    { slot: 'hero', componentKey: 'SponsorBannerKCD2026', reason: 'business-fixed' },
  ];
  const policy: PolicyPack = [
    {
      id: 'pol-feedback',
      componentKey: 'FeedbackForm',
      action: 'suppress',
      condition: { field: 'role', op: 'eq', value: 'attendee' },
    },
  ];
  const opts: EvalOptions = {
    rules,
    registry,
    lockedSlots,
    policy,
    confidenceThreshold: 0.60,
  };
  return { result: evaluate(ctx, opts), ctx };
}

// ---------------------------------------------------------------------------
// 1. formatTrace block presence — LOCKED/SELECTED/SUPPRESSED/ABSTENTION/RISK/META
// ---------------------------------------------------------------------------

describe('formatTrace — block presence', () => {
  it('contains all required section headers in the output string', () => {
    const { result, ctx: context } = buildFullResult();
    const output = formatTrace(result, context);

    expect(output).toContain('--- LOCKED ---');
    expect(output).toContain('--- SELECTED ---');
    expect(output).toContain('--- SUPPRESSED ---');
    expect(output).toContain('--- ABSTENTION ---');
    expect(output).toContain('--- RISK ---');
    expect(output).toContain('--- META ---');
  });
});

// ---------------------------------------------------------------------------
// 2. 70-character line width — every line must be ≤ 70 characters
// ---------------------------------------------------------------------------

describe('formatTrace — 70-character line width', () => {
  it('keeps every line at or under 70 characters', () => {
    const { result, ctx: context } = buildFullResult();
    const output = formatTrace(result, context);
    const lines = output.split('\n');
    const violations = lines.filter((line) => line.length > 70);

    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. deterministic: true — always present in META block
// ---------------------------------------------------------------------------

describe('formatTrace — deterministic flag', () => {
  it('outputs "deterministic   : true" in every trace', () => {
    const { result, ctx: context } = buildFullResult();
    const output = formatTrace(result, context);

    expect(output).toContain('deterministic');
    expect(output).toContain('true');
    expect(result.meta.deterministic).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. governance mode — section headers use organizational vocabulary
// ---------------------------------------------------------------------------

describe('formatTrace — governance mode sections', () => {
  it('outputs COMMITMENTS HONORED, ALGORITHM SELECTED, EXCLUDED WITH REASON, DEFERRED', () => {
    const { result, ctx: context } = buildFullResult();
    const output = formatTrace(result, context, { mode: 'governance' });

    expect(output).toContain('COMMITMENTS HONORED');
    expect(output).toContain('ALGORITHM SELECTED');
    expect(output).toContain('EXCLUDED WITH REASON');
    expect(output).toContain('DEFERRED');
    expect(output).toContain('ACCOUNTABILITY SUMMARY');
  });
});

// ---------------------------------------------------------------------------
// 5. governance mode — does NOT contain developer-mode section headers
// ---------------------------------------------------------------------------

describe('formatTrace — governance mode vocabulary isolation', () => {
  it('does not emit --- SELECTED --- or --- SUPPRESSED --- in governance mode', () => {
    const { result, ctx: context } = buildFullResult();
    const output = formatTrace(result, context, { mode: 'governance' });

    expect(output).not.toContain('--- SELECTED ---');
    expect(output).not.toContain('--- SUPPRESSED ---');
    expect(output).not.toContain('--- LOCKED ---');
    expect(output).not.toContain('--- META ---');
  });
});

// ---------------------------------------------------------------------------
// 6. governance mode — byte-determinism
// ---------------------------------------------------------------------------

describe('formatTrace — governance mode byte-determinism', () => {
  it('produces identical output on two calls with the same inputs', () => {
    const { result, ctx: context } = buildFullResult();
    const out1 = formatTrace(result, context, { mode: 'governance' });
    const out2 = formatTrace(result, context, { mode: 'governance' });
    expect(out1).toBe(out2);
  });
});

// ---------------------------------------------------------------------------
// 7. governance mode — policy gate shown as "policy gate: {policyId}"
// ---------------------------------------------------------------------------

describe('formatTrace — governance mode policy gate label', () => {
  it('shows "policy gate: pol-feedback" for policy-suppressed component', () => {
    const { result, ctx: context } = buildFullResult();
    const output = formatTrace(result, context, { mode: 'governance' });
    expect(output).toContain('policy gate: pol-feedback');
  });
});

// ---------------------------------------------------------------------------
// 8. governance mode — (rule r-xxx) stripped from condition-mismatch entries
// ---------------------------------------------------------------------------

describe('formatTrace — governance mode rule id stripped', () => {
  it('does not show raw rule ids like (rule r-xxx) in condition-mismatch lines', () => {
    const rules = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-timing',
          componentKey: 'NetworkingMatchCard',
          slot: 'networking',
          conditions: [{ field: 'time.phase' as const, op: 'in' as const, value: ['D-day', 'D+1'] as readonly string[] }],
          priority: 1,
        },
      ],
    };
    const result = evaluate(ctx, { rules });
    const output = formatTrace(result, ctx, { mode: 'governance' });
    expect(output).toContain('NetworkingMatchCard');
    expect(output).not.toMatch(/\(rule r-[a-z0-9-]+\)/);
  });
});
