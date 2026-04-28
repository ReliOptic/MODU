import type { TPOContext, EvalOptions } from '../index.js';

const ecommerceContext: TPOContext = {
  stage: 'cart-abandonment',
  role: 'returning-buyer',
  time: { phase: 'flash-sale', offsetDays: 0 },
  device: 'mobile',
  locale: 'ko-KR',
};

const ecommerceOptions: EvalOptions = {
  rules: {
    version: '1.0.0',
    rules: [
      {
        id: 'r-coupon',
        componentKey: 'CartDiscountCoupon',
        slot: 'primary_cta',
        conditions: [
          { field: 'stage', op: 'eq', value: 'cart-abandonment' },
          { field: 'time.phase', op: 'eq', value: 'flash-sale' },
        ],
        priority: 1,
        confidenceHint: 0.92,
      },
      {
        id: 'r-similar',
        componentKey: 'SimilarProductCarousel',
        slot: 'contextual',
        conditions: [
          { field: 'role', op: 'eq', value: 'returning-buyer' },
          { field: 'device', op: 'eq', value: 'mobile' },
        ],
        priority: 2,
        confidenceHint: 0.78,
      },
      {
        id: 'r-fomo',
        componentKey: 'StockUrgencyBadge',
        slot: 'urgency',
        conditions: [{ field: 'time.phase', op: 'eq', value: 'flash-sale' }],
        priority: 3,
        confidenceHint: 0.65,
      },
      {
        id: 'r-review',
        componentKey: 'WriteReviewPrompt',
        slot: 'nudge',
        conditions: [{ field: 'stage', op: 'eq', value: 'post-purchase' }],
        priority: 4,
      },
    ],
  },
  lockedSlots: [
    { slot: 'promo-banner', componentKey: 'FlashSaleBanner', reason: 'promotion' },
  ],
  confidenceThreshold: 0.60,
};

export { ecommerceContext, ecommerceOptions };
