// MODU AI model registry — single source of truth for model IDs.
// ADR-0012: Gemma routing via OpenRouter is the only AI path.
// Claude fallback retired 2026-04-18 (see ADR-0012 and src/lib/aiClient.ts).

/** Default model for Formation flow, Asset-Spawn, and Roleplay interactions. */
export const FORMATION_MODEL = 'google/gemma-4-31b-it' as const;
