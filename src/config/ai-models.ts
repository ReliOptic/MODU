// MODU AI model registry — single source of truth for model IDs and metadata
// ADR-0012: Gemma routing via OpenRouter; Claude used as synthesis fallback only.

// ─── Model ID constants ───────────────────────────────────────────────────────

/** Default model for Formation flow, Asset-Spawn, and Roleplay interactions. */
export const FORMATION_MODEL = 'google/gemma-4-31b-it' as const;

/** Model used when spawning a new life-asset via conversational onboarding. */
export const ASSET_SPAWN_MODEL = 'google/gemma-4-31b-it' as const;

/** Model used for chapter-companion roleplay / narrative responses. */
export const ROLEPLAY_MODEL = 'google/gemma-4-31b-it' as const;

/**
 * Fallback used when OpenRouter is unavailable or returns 5xx.
 * Maps to the ai-claude Edge Function (ADR-0002).
 */
export const SYNTHESIS_FALLBACK = 'claude-haiku-4-5' as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LLMProvider = 'openrouter' | 'anthropic';

export interface ModelMeta {
  readonly id: string;
  readonly provider: LLMProvider;
  /** Context window in tokens. */
  readonly contextWindow: number;
  /** Approximate cost per 1M input tokens (USD). */
  readonly costPerMInputUsd: number;
  /** Approximate cost per 1M output tokens (USD). */
  readonly costPerMOutputUsd: number;
  /** Whether this model is currently gated behind the allowlist on the server. */
  readonly serverAllowed: boolean;
}

// ─── Registry ────────────────────────────────────────────────────────────────

export const MODEL_REGISTRY: Readonly<Record<string, ModelMeta>> = {
  'google/gemma-4-31b-it': {
    id: 'google/gemma-4-31b-it',
    provider: 'openrouter',
    contextWindow: 128_000,
    costPerMInputUsd: 0.10,
    costPerMOutputUsd: 0.10,
    serverAllowed: true,
  },
  'google/gemma-4-31b-it:free': {
    id: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    contextWindow: 128_000,
    costPerMInputUsd: 0.0,
    costPerMOutputUsd: 0.0,
    serverAllowed: true,
  },
  'google/gemma-4-26b-a4b-it': {
    id: 'google/gemma-4-26b-a4b-it',
    provider: 'openrouter',
    contextWindow: 128_000,
    costPerMInputUsd: 0.10,
    costPerMOutputUsd: 0.10,
    serverAllowed: true,
  },
  'google/gemma-3-27b-it': {
    id: 'google/gemma-3-27b-it',
    provider: 'openrouter',
    contextWindow: 128_000,
    costPerMInputUsd: 0.10,
    costPerMOutputUsd: 0.10,
    serverAllowed: true,
  },
  'google/gemma-3-27b-it:free': {
    id: 'google/gemma-3-27b-it:free',
    provider: 'openrouter',
    contextWindow: 128_000,
    costPerMInputUsd: 0.0,
    costPerMOutputUsd: 0.0,
    serverAllowed: true,
  },
  'claude-haiku-4-5': {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    contextWindow: 200_000,
    costPerMInputUsd: 0.80,
    costPerMOutputUsd: 4.00,
    serverAllowed: true,
  },
} as const;
