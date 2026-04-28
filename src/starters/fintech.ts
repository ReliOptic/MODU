import type { TPOContext, EvalOptions } from '../index.js';

const fintechContext: TPOContext = {
  stage: 'onboarding-complete',
  role: 'new-user',
  time: { phase: 'first-week', offsetDays: -3 },
  device: 'mobile',
  locale: 'ko-KR',
};

const fintechOptions: EvalOptions = {
  rules: {
    version: '1.0.0',
    rules: [
      {
        id: 'r-transfer',
        componentKey: 'FirstTransferGuide',
        slot: 'primary_cta',
        conditions: [{ field: 'stage', op: 'eq', value: 'onboarding-complete' }],
        priority: 1,
        confidenceHint: 0.90,
      },
      {
        id: 'r-invest',
        componentKey: 'InvestmentStartBanner',
        slot: 'hero',
        conditions: [
          { field: 'role', op: 'eq', value: 'new-user' },
          { field: 'time.phase', op: 'eq', value: 'first-week' },
        ],
        priority: 2,
        confidenceHint: 0.45,
      },
      {
        id: 'r-emergency',
        componentKey: 'EmergencyLoanInfo',
        slot: 'nudge',
        conditions: [{ field: 'role', op: 'eq', value: 'new-user' }],
        priority: 3,
        confidenceHint: 0.55,
      },
      {
        id: 'r-send-money',
        componentKey: 'SendMoneyPromo',
        slot: 'contextual',
        conditions: [
          { field: 'device', op: 'eq', value: 'mobile' },
          { field: 'locale', op: 'eq', value: 'ko-KR' },
        ],
        priority: 4,
        confidenceHint: 0.80,
      },
    ],
  },
  policy: [
    {
      id: 'P-INVEST-KYC',
      componentKey: 'InvestmentStartBanner',
      action: 'suppress',
      condition: { field: 'stage', op: 'not-in', value: ['kyc-verified', 'invested'] },
    },
  ],
  confidenceThreshold: 0.60,
};

export { fintechContext, fintechOptions };
