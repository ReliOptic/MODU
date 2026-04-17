// Global test setup

// Seed demo assets so assetStore initialises with mock data
process.env.EXPO_PUBLIC_SEED_DEMO = '1';

// Polyfill crypto for uuid generation
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  (global as any).crypto = webcrypto;
}

// Silence console during tests (optional — remove if you want logs)
// global.console.log = jest.fn();
// global.console.warn = jest.fn();
