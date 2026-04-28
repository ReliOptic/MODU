import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/index.js';
import type {
  TPOContext,
  EvalOptions,
  RulePack,
  Registry,
  LockedSlots,
  PolicyPack,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// G5 — README example integration
// 5-field context + 5 rules covering all four output blocks:
// locked / selected / suppressed / abstention
// ---------------------------------------------------------------------------

describe('G5 README example — integration', () => {
  it('returns all four blocks (locked, selected, suppressed, abstentions) populated', () => {
    const context: TPOContext = {
      event: 'KCD Korea 2026',
      stage: 'registered',
      role: 'attendee',
      time: { phase: 'D-3', offsetDays: -3 },
      place: { type: 'conference-venue', city: 'Seoul' },
      locale: 'ko-KR',
      device: 'mobile',
    };

    const rules: RulePack = {
      version: '1.0.0',
      rules: [
        // → selected: stage + role match
        {
          id: 'r-checkin',
          componentKey: 'SessionCheckInPrompt',
          slot: 'primary_action',
          conditions: [
            { field: 'stage', op: 'eq', value: 'registered' },
            { field: 'role',  op: 'eq', value: 'attendee'   },
          ],
          priority: 1,
        },
        // → selected: locale match
        {
          id: 'r-schedule',
          componentKey: 'ScheduleAtAGlanceCard',
          slot: 'contextual_cards',
          conditions: [
            { field: 'locale', op: 'eq', value: 'ko-KR' },
          ],
          priority: 2,
        },
        // → suppressed via policy
        {
          id: 'r-feedback',
          componentKey: 'SpeakerFeedbackForm',
          slot: 'feedback',
          conditions: [
            { field: 'stage', op: 'eq', value: 'registered' },
          ],
          priority: 3,
        },
        // → abstained: confidenceHint below threshold
        {
          id: 'r-dining',
          componentKey: 'LocalDiningRecommendation',
          slot: 'dining',
          conditions: [
            { field: 'stage', op: 'eq', value: 'registered' },
          ],
          priority: 4,
          confidenceHint: 0.41,
        },
        // → suppressed via policy (stage=post-session not met here, but
        //   policy condition on role=attendee fires directly)
        {
          id: 'r-afterparty',
          componentKey: 'AfterPartyInviteCard',
          slot: 'social',
          conditions: [
            { field: 'stage', op: 'eq', value: 'registered' },
          ],
          priority: 5,
        },
      ],
    };

    const registry: Registry = {
      SponsorBannerKCD2026:        { key: 'SponsorBannerKCD2026',        label: 'Sponsor Banner'          },
      SessionCheckInPrompt:        { key: 'SessionCheckInPrompt',        label: 'Session Check-in'        },
      ScheduleAtAGlanceCard:       { key: 'ScheduleAtAGlanceCard',       label: 'Schedule At A Glance'    },
      SpeakerFeedbackForm:         { key: 'SpeakerFeedbackForm',         label: 'Speaker Feedback Form'   },
      LocalDiningRecommendation:   { key: 'LocalDiningRecommendation',   label: 'Local Dining'            },
      AfterPartyInviteCard:        { key: 'AfterPartyInviteCard',        label: 'After Party Invite'      },
    };

    const lockedSlots: LockedSlots = [
      {
        slot: 'hero',
        componentKey: 'SponsorBannerKCD2026',
        reason: 'business-fixed',
        priority: 0,
      },
    ];

    const policy: PolicyPack = [
      {
        id: 'policy-p-007',
        componentKey: 'SpeakerFeedbackForm',
        action: 'suppress',
        condition: { field: 'role', op: 'eq', value: 'attendee' },
      },
      {
        id: 'policy-p-012',
        componentKey: 'AfterPartyInviteCard',
        action: 'suppress',
        condition: { field: 'stage', op: 'eq', value: 'registered' },
      },
    ];

    const opts: EvalOptions = {
      rules,
      registry,
      lockedSlots,
      policy,
      confidenceThreshold: 0.60,
    };

    const result = evaluate(context, opts);

    // --- locked block ---
    expect(result.locked.length).toBeGreaterThanOrEqual(1);
    expect(result.locked.some((l) => l.componentKey === 'SponsorBannerKCD2026')).toBe(true);

    // --- selected block ---
    expect(result.selected.length).toBeGreaterThanOrEqual(1);
    const selectedKeys = result.selected.map((s) => s.componentKey);
    expect(selectedKeys).toContain('SessionCheckInPrompt');

    // --- suppressed block ---
    expect(result.suppressed.length).toBeGreaterThanOrEqual(1);
    const suppressedKeys = result.suppressed.map((s) => s.componentKey);
    expect(suppressedKeys).toContain('SpeakerFeedbackForm');

    // --- abstentions block ---
    expect(result.abstentions.length).toBeGreaterThanOrEqual(1);
    const abstainedKeys = result.abstentions.map((a) => a.componentKey);
    expect(abstainedKeys).toContain('LocalDiningRecommendation');

    // --- meta sanity ---
    expect(result.meta.traceVersion).toBe('v1');
    expect(result.meta.deterministic).toBe(true);
    expect(result.meta.ruleCount).toBe(5);
  });
});
