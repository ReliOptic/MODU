import type { TPOContext, EvalOptions } from '../index.js';

const bankingContext: TPOContext = {
  stage: 'pre-maturity',
  role: 'premier',
  time: { phase: 'year-end', offsetDays: -7 },
  place: { type: 'mobile-app' },
  locale: 'ko-KR',
  device: 'mobile',
  meta: { dsrTier: 'under-40pct', taxBracket: 'high', productHolding: 'deposit-only' },
};

const bankingOptions: EvalOptions = {
  rules: {
    version: '1.0.0',
    rules: [
      {
        id: 'r-isa',
        componentKey: 'ISAAccountConversion',
        slot: 'primary_cta',
        conditions: [
          { field: 'stage', op: 'eq', value: 'pre-maturity' },
          { field: 'meta.taxBracket', op: 'eq', value: 'high' },
        ],
        priority: 1,
        confidenceHint: 0.88,
      },
      {
        id: 'r-pension',
        componentKey: 'PensionTaxCredit',
        slot: 'nudge',
        conditions: [
          { field: 'time.phase', op: 'eq', value: 'year-end' },
          { field: 'role', op: 'eq', value: 'premier' },
        ],
        priority: 2,
        confidenceHint: 0.75,
      },
      {
        id: 'r-loan',
        componentKey: 'PersonalLoanOffer',
        slot: 'loan_cta',
        conditions: [{ field: 'role', op: 'eq', value: 'premier' }],
        priority: 3,
      },
      {
        id: 'r-wealth',
        componentKey: 'WealthManagementInvite',
        slot: 'contextual',
        conditions: [
          { field: 'role', op: 'eq', value: 'premier' },
          { field: 'meta.productHolding', op: 'eq', value: 'deposit-only' },
        ],
        priority: 4,
        confidenceHint: 0.82,
      },
    ],
  },
  lockedSlots: [
    { slot: 'risk-disclosure', componentKey: 'InvestmentRiskGradeNotice', reason: 'compliance' },
  ],
  policy: [
    {
      id: 'P-DSR-040',
      componentKey: 'PersonalLoanOffer',
      action: 'suppress',
      condition: { field: 'meta.dsrTier', op: 'eq', value: 'over-40pct' },
    },
  ],
  confidenceThreshold: 0.70,
};

export { bankingContext, bankingOptions };
