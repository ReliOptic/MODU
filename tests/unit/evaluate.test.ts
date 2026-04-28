import { describe, it, expect } from 'vitest';
import { evaluate, formatTrace, TPOInputError } from '../../src/index.js';
import type {
  TPOContext,
  EvalOptions,
  RulePack,
  Registry,
  LockedSlots,
  PolicyPack,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// Shared KCD Korea fixtures
// ---------------------------------------------------------------------------

const kcdContext: TPOContext = {
  event: 'KCD Korea 2026',
  stage: 'registered',
  role: 'attendee',
  time: { phase: 'D-3', offsetDays: -3 },
  place: { type: 'conference-venue', city: 'Seoul' },
  locale: 'ko-KR',
  device: 'mobile',
};

const baseRegistry: Registry = {
  SessionCheckInPrompt: { key: 'SessionCheckInPrompt', label: 'Session Check-in' },
  SponsorBannerKCD2026: { key: 'SponsorBannerKCD2026', label: 'Sponsor Banner' },
  NetworkingMatchCard:  { key: 'NetworkingMatchCard',  label: 'Networking Match' },
  ScheduleCard:         { key: 'ScheduleCard',          label: 'Schedule' },
  FeedbackForm:         { key: 'FeedbackForm',          label: 'Feedback Form' },
  LocalDining:          { key: 'LocalDining',           label: 'Local Dining' },
  AltCard:              { key: 'AltCard',               label: 'Alt Card' },
  CardA:                { key: 'CardA',                 label: 'Card A' },
  CardB:                { key: 'CardB',                 label: 'Card B' },
};

// ---------------------------------------------------------------------------
// 1. Happy path — stage/role matching → selected ≥ 1, trace populated
// ---------------------------------------------------------------------------

describe('evaluate — happy path', () => {
  it('returns at least one selected component and a non-empty trace', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-001',
          componentKey: 'SessionCheckInPrompt',
          slot: 'primary_action',
          conditions: [
            { field: 'stage', op: 'eq', value: 'registered' },
            { field: 'role',  op: 'eq', value: 'attendee'   },
          ],
          priority: 1,
        },
      ],
    };
    const result = evaluate(kcdContext, { rules, registry: baseRegistry });

    expect(result.selected.length).toBeGreaterThanOrEqual(1);
    expect(result.selected[0]?.componentKey).toBe('SessionCheckInPrompt');
    expect(result.trace.length).toBeGreaterThan(0);
    expect(result.meta.deterministic).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Locked slot preservation — hero slot fixed, policy suppress ignored (A5)
// ---------------------------------------------------------------------------

describe('evaluate — locked slot preservation', () => {
  it('keeps locked component in result.locked regardless of policy suppress', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-002',
          componentKey: 'SponsorBannerKCD2026',
          slot: 'hero',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
        },
      ],
    };
    const lockedSlots: LockedSlots = [
      { slot: 'hero', componentKey: 'SponsorBannerKCD2026', reason: 'business-fixed' },
    ];
    const policy: PolicyPack = [
      {
        id: 'pol-001',
        componentKey: 'SponsorBannerKCD2026',
        action: 'suppress',
        condition: { field: 'stage', op: 'eq', value: 'registered' },
      },
    ];
    const result = evaluate(kcdContext, { rules, registry: baseRegistry, lockedSlots, policy });

    expect(result.locked).toHaveLength(1);
    expect(result.locked[0]?.componentKey).toBe('SponsorBannerKCD2026');
    // must NOT appear in suppressed
    const suppressedKeys = result.suppressed.map((s) => s.componentKey);
    expect(suppressedKeys).not.toContain('SponsorBannerKCD2026');
  });
});

// ---------------------------------------------------------------------------
// 3. Policy suppress — matching condition moves component to suppressed
// ---------------------------------------------------------------------------

describe('evaluate — policy suppress', () => {
  it('moves a matching component to suppressed with whyNot and policyId', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-003',
          componentKey: 'FeedbackForm',
          slot: 'feedback',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
        },
      ],
    };
    const policy: PolicyPack = [
      {
        id: 'policy-p-007',
        componentKey: 'FeedbackForm',
        action: 'suppress',
        condition: { field: 'role', op: 'eq', value: 'attendee' },
      },
    ];
    const result = evaluate(kcdContext, { rules, registry: baseRegistry, policy });

    expect(result.suppressed).toHaveLength(1);
    expect(result.suppressed[0]?.componentKey).toBe('FeedbackForm');
    expect(result.suppressed[0]?.policyId).toBe('policy-p-007');
    expect(result.suppressed[0]?.whyNot).toContain('policy-p-007');
    expect(result.selected.map((s) => s.componentKey)).not.toContain('FeedbackForm');
  });
});

// ---------------------------------------------------------------------------
// 4. Low-confidence abstention — confidenceHint < threshold → abstentions
// ---------------------------------------------------------------------------

describe('evaluate — low-confidence abstention', () => {
  it('moves component to abstentions when confidenceHint is below threshold', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-004',
          componentKey: 'LocalDining',
          slot: 'dining',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
          confidenceHint: 0.41,
        },
      ],
    };
    const result = evaluate(kcdContext, {
      rules,
      registry: baseRegistry,
      confidenceThreshold: 0.60,
    });

    expect(result.abstentions).toHaveLength(1);
    expect(result.abstentions[0]?.componentKey).toBe('LocalDining');
    expect(result.abstentions[0]?.confidence).toBe(0.41);
    expect(result.abstentions[0]?.threshold).toBe(0.60);
    expect(result.selected.map((s) => s.componentKey)).not.toContain('LocalDining');
  });
});

// ---------------------------------------------------------------------------
// 5. Duplicate rules — same componentKey/slot, specificity higher wins
// ---------------------------------------------------------------------------

describe('evaluate — duplicate rules for same slot', () => {
  it('selects the rule with higher specificity (more conditions)', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-low',
          componentKey: 'ScheduleCard',
          slot: 'schedule',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
        },
        {
          id: 'r-high',
          componentKey: 'ScheduleCard',
          slot: 'schedule',
          conditions: [
            { field: 'stage',  op: 'eq', value: 'registered' },
            { field: 'locale', op: 'eq', value: 'ko-KR'      },
          ],
          priority: 1,
        },
      ],
    };
    const result = evaluate(kcdContext, { rules, registry: baseRegistry });

    expect(result.selected).toHaveLength(1);
    expect(result.selected[0]?.componentKey).toBe('ScheduleCard');
    // higher-specificity rule must appear in matchedRules
    expect(result.selected[0]?.matchedRules).toContain('r-high');
  });
});

// ---------------------------------------------------------------------------
// 6. Missing required field — stage absent → TPOInputError
// ---------------------------------------------------------------------------

describe('evaluate — missing required field', () => {
  it('throws TPOInputError when stage is absent', () => {
    const incompleteContext = {
      role: 'attendee',
      time: { phase: 'D-3' },
    } as unknown as TPOContext;

    const rules: RulePack = { version: '1.0.0', rules: [] };
    expect(() => evaluate(incompleteContext, { rules, registry: baseRegistry })).toThrow(
      TPOInputError,
    );
  });
});

// ---------------------------------------------------------------------------
// 7. Empty registry — no error, empty selected
// ---------------------------------------------------------------------------

describe('evaluate — empty registry', () => {
  it('runs without error when registry is an empty object', () => {
    const rules: RulePack = { version: '1.0.0', rules: [] };
    const result = evaluate(kcdContext, { rules, registry: {} });

    expect(result.selected).toHaveLength(0);
    expect(result.suppressed).toHaveLength(0);
    expect(result.abstentions).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Decision order — selected sorted by specificity desc, priority asc
// ---------------------------------------------------------------------------

describe('evaluate — decision order', () => {
  it('sorts selected by specificity descending then priority ascending', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-p2',
          componentKey: 'ScheduleCard',
          slot: 'slot-b',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 2,
        },
        {
          id: 'r-p1',
          componentKey: 'SessionCheckInPrompt',
          slot: 'slot-a',
          conditions: [
            { field: 'stage',  op: 'eq', value: 'registered' },
            { field: 'locale', op: 'eq', value: 'ko-KR'      },
          ],
          priority: 1,
        },
      ],
    };
    const result = evaluate(kcdContext, { rules, registry: baseRegistry });

    // slot-a has specificity=1.0 (2/2), slot-b has specificity=1.0 (1/1)
    // both 1.0 — then priority: slot-a priority=1 comes first
    expect(result.selected[0]?.slot).toBe('slot-a');
    expect(result.selected[1]?.slot).toBe('slot-b');
  });
});

// ---------------------------------------------------------------------------
// 9. G1 — trace byte-determinism: matches fixtures/trace-basic.txt structure
// ---------------------------------------------------------------------------

describe('evaluate — G1 trace byte-determinism', () => {
  it('G1 byte-determinism: formatTrace output is identical across two calls and contains required sections', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-det',
          componentKey: 'SessionCheckInPrompt',
          slot: 'primary_action',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
        },
      ],
    };
    const opts: EvalOptions = { rules, registry: baseRegistry };

    const result = evaluate(kcdContext, opts);
    const trace1 = formatTrace(result, kcdContext);
    const trace2 = formatTrace(result, kcdContext);

    // byte-determinism: identical result + context → identical string
    expect(trace1).toBe(trace2);

    // SELECTED, RISK, META are always present; LOCKED/SUPPRESSED/ABSTENTION
    // are omitted when empty — consistent with fixtures/trace-basic.txt format
    expect(trace1).toContain('--- SELECTED ---');
    expect(trace1).toContain('--- RISK ---');
    expect(trace1).toContain('--- META ---');
    expect(trace1).toContain('deterministic   : true');

    expect(result.meta.deterministic).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. G2 — locked × policy suppress conflict: locked wins, position preserved
// ---------------------------------------------------------------------------

describe('evaluate — G2 locked × policy suppress conflict', () => {
  it('locked slot stays in result.locked even when policy would suppress it', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-g2',
          componentKey: 'SponsorBannerKCD2026',
          slot: 'hero',
          conditions: [{ field: 'role', op: 'eq', value: 'attendee' }],
          priority: 1,
        },
      ],
    };
    const lockedSlots: LockedSlots = [
      { slot: 'hero', componentKey: 'SponsorBannerKCD2026', reason: 'promotion' },
    ];
    const policy: PolicyPack = [
      {
        id: 'pol-conflict',
        componentKey: 'SponsorBannerKCD2026',
        action: 'suppress',
        condition: { field: 'role', op: 'eq', value: 'attendee' },
      },
    ];
    const result = evaluate(kcdContext, {
      rules,
      registry: baseRegistry,
      lockedSlots,
      policy,
    });

    expect(result.locked[0]?.componentKey).toBe('SponsorBannerKCD2026');
    expect(result.locked[0]?.slot).toBe('hero');
    const suppressedKeys = result.suppressed.map((s) => s.componentKey);
    expect(suppressedKeys).not.toContain('SponsorBannerKCD2026');
  });
});

// ---------------------------------------------------------------------------
// 11. G4 — malformed RulePack (missing rules field) → TPOInputError or TypeError
// ---------------------------------------------------------------------------

describe('evaluate — G4 malformed RulePack', () => {
  it('throws TPOInputError when RulePack has no rules array', () => {
    const malformed = {} as unknown as RulePack;
    expect(() =>
      evaluate(kcdContext, { rules: malformed, registry: baseRegistry }),
    ).toThrow(TPOInputError);
  });
});

// ---------------------------------------------------------------------------
// 12. G6 — empty lockedSlots [] equals undefined (null-object equivalence)
// ---------------------------------------------------------------------------

describe('evaluate — G6 empty lockedSlots equivalence', () => {
  it('produces identical results for lockedSlots=[] and lockedSlots=undefined', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-g6',
          componentKey: 'ScheduleCard',
          slot: 'schedule',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
        },
      ],
    };
    const withEmpty = evaluate(kcdContext, {
      rules,
      registry: baseRegistry,
      lockedSlots: [],
    });
    const withUndefined = evaluate(kcdContext, {
      rules,
      registry: baseRegistry,
      lockedSlots: undefined,
    });

    expect(withEmpty.locked).toHaveLength(0);
    expect(withUndefined.locked).toHaveLength(0);
    expect(JSON.stringify(withEmpty.selected)).toBe(JSON.stringify(withUndefined.selected));
    expect(JSON.stringify(withEmpty.trace)).toBe(JSON.stringify(withUndefined.trace));
  });
});

// ---------------------------------------------------------------------------
// 14. condition mismatch → suppressed with whyNot mentioning the field
// ---------------------------------------------------------------------------

describe('evaluate — condition mismatch suppressed', () => {
  it('records a component in suppressed when its rule conditions do not match the context', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-cond-mismatch',
          componentKey: 'NetworkingMatchCard',
          slot: 'contextual_cards',
          conditions: [
            { field: 'time.phase', op: 'in', value: ['D-day', 'D+1'] },
          ],
          priority: 1,
        },
      ],
    };
    // kcdContext has time.phase = 'D-3' — does not match ['D-day', 'D+1']
    const result = evaluate(kcdContext, { rules, registry: baseRegistry });

    expect(result.selected.map((s) => s.componentKey)).not.toContain('NetworkingMatchCard');
    const suppressed = result.suppressed.find((s) => s.componentKey === 'NetworkingMatchCard');
    expect(suppressed).toBeDefined();
    expect(suppressed?.whyNot).toContain('time.phase');
  });
});

// ---------------------------------------------------------------------------
// 15. locked-displaced → suppressed with whyNot mentioning 'locked'
// ---------------------------------------------------------------------------

describe('evaluate — locked-displaced suppressed', () => {
  it('records a rule-matched component in suppressed when its slot is taken by a locked slot', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-locked-disp',
          componentKey: 'SessionCheckInPrompt',
          slot: 'primary_action',
          conditions: [
            { field: 'stage', op: 'eq', value: 'registered' },
          ],
          priority: 1,
        },
      ],
    };
    const lockedSlots: LockedSlots = [
      { slot: 'primary_action', componentKey: 'SponsorWidget', reason: 'promotion' },
    ];
    // context satisfies the rule (stage = registered), but slot is locked by SponsorWidget
    const result = evaluate(kcdContext, { rules, registry: baseRegistry, lockedSlots });

    expect(result.selected.map((s) => s.componentKey)).not.toContain('SessionCheckInPrompt');
    const suppressed = result.suppressed.find((s) => s.componentKey === 'SessionCheckInPrompt');
    expect(suppressed).toBeDefined();
    expect(suppressed?.whyNot).toContain('locked');
  });
});

// ---------------------------------------------------------------------------
// 13. G7 — tie-break stable sort: same specificity + priority → rule id
//          lexicographic order (insertion index order in rules array)
// ---------------------------------------------------------------------------

describe('evaluate — G7 tie-break stable sort', () => {
  it('breaks specificity+priority ties by insertion order (index) deterministically', () => {
    // Two different slots, both with one condition, same priority.
    // slot-alpha rule appears first in the array → lower index → wins first slot order.
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-alpha',
          componentKey: 'CardA',
          slot: 'slot-alpha',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
        },
        {
          id: 'r-beta',
          componentKey: 'CardB',
          slot: 'slot-beta',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
        },
      ],
    };
    const result = evaluate(kcdContext, { rules, registry: baseRegistry });

    expect(result.selected).toHaveLength(2);
    // Both have identical specificity (1.0) and priority (1).
    // buildSelected sorts by priority asc, then index asc — r-alpha at index 0 first.
    const keys = result.selected.map((s) => s.componentKey);
    expect(keys[0]).toBe('CardA');
    expect(keys[1]).toBe('CardB');
  });
});

// ---------------------------------------------------------------------------
// Sprint — S1: rules.version missing → TPOInputError
// ---------------------------------------------------------------------------

describe('evaluate — S1 rules.version required', () => {
  it('throws TPOInputError when rules.version is absent', () => {
    const malformed = { rules: [] } as unknown as RulePack;
    expect(() => evaluate(kcdContext, { rules: malformed })).toThrow(TPOInputError);
  });
});

// ---------------------------------------------------------------------------
// Sprint — S2: malformed rule (missing id) → TPOInputError
// ---------------------------------------------------------------------------

describe('evaluate — S2 per-rule validation', () => {
  it('throws TPOInputError when a rule is missing id', () => {
    const bad = {
      version: '1.0.0',
      rules: [{ componentKey: 'X', slot: 's', conditions: [], priority: 1 }],
    } as unknown as RulePack;
    expect(() => evaluate(kcdContext, { rules: bad })).toThrow(TPOInputError);
  });

  it('throws TPOInputError when confidenceHint is out of [0, 1]', () => {
    const bad: RulePack = {
      version: '1.0.0',
      rules: [{ id: 'r-bad', componentKey: 'X', slot: 's', conditions: [{ field: 'stage', op: 'eq', value: 'registered' }], priority: 1, confidenceHint: 1.5 }],
    };
    expect(() => evaluate(kcdContext, { rules: bad })).toThrow(TPOInputError);
  });
});

// ---------------------------------------------------------------------------
// Sprint — S3: ruleId on condition-mismatch suppressed entry
// ---------------------------------------------------------------------------

describe('evaluate — S3 ruleId on suppressed condition-mismatch', () => {
  it('populates ruleId on a condition-mismatch suppressed component', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-mismatch',
          componentKey: 'NetworkingMatchCard',
          slot: 'networking',
          conditions: [{ field: 'time.phase', op: 'in', value: ['D-day', 'D+1'] }],
          priority: 1,
        },
      ],
    };
    const result = evaluate(kcdContext, { rules });
    const entry = result.suppressed.find((s) => s.componentKey === 'NetworkingMatchCard');
    expect(entry).toBeDefined();
    expect(entry?.ruleId).toBe('r-mismatch');
  });
});

// ---------------------------------------------------------------------------
// Sprint — S4: empty output (no selected, no locked) → riskTier: 'high'
// ---------------------------------------------------------------------------

describe('evaluate — S4 empty output riskTier escalation', () => {
  it('returns riskTier "high" when no components are selected or locked', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-no-match',
          componentKey: 'SomeCard',
          slot: 'hero',
          conditions: [{ field: 'stage', op: 'eq', value: 'never-matches' }],
          priority: 1,
        },
      ],
    };
    const result = evaluate(kcdContext, { rules });
    expect(result.selected).toHaveLength(0);
    expect(result.locked).toHaveLength(0);
    expect(result.riskTier).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// Sprint — S6: empty conditions array → TPOInputError
// ---------------------------------------------------------------------------

describe('evaluate — S6 empty conditions array rejected', () => {
  it('throws TPOInputError when a rule has zero conditions', () => {
    const bad: RulePack = {
      version: '1.0.0',
      rules: [{ id: 'r-empty', componentKey: 'X', slot: 's', conditions: [], priority: 1 }],
    };
    expect(() => evaluate(kcdContext, { rules: bad })).toThrow(TPOInputError);
  });
});

// ---------------------------------------------------------------------------
// Sprint — S5: evaluateMs is a non-negative number (Date.now default)
// ---------------------------------------------------------------------------

describe('evaluate — S5 evaluateMs is a number', () => {
  it('returns a non-negative evaluateMs without clock injection', () => {
    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        {
          id: 'r-s5',
          componentKey: 'SessionCheckInPrompt',
          slot: 'primary_action',
          conditions: [{ field: 'stage', op: 'eq', value: 'registered' }],
          priority: 1,
        },
      ],
    };
    const result = evaluate(kcdContext, { rules });
    expect(typeof result.meta.evaluateMs).toBe('number');
    expect(result.meta.evaluateMs).toBeGreaterThanOrEqual(0);
  });
});
