// MODU shared AI types — used by aiClient.ts and ai-models.ts
// Strict: no `any`. Discriminated union for success/error results.

// ─── Branded model ID ─────────────────────────────────────────────────────────

declare const _modelIdBrand: unique symbol;
/** Branded string type for validated model identifiers. */
export type ModelId = string & { readonly [_modelIdBrand]: 'ModelId' };

/** Cast a plain string to ModelId (only at validated call sites). */
export function toModelId(raw: string): ModelId {
  return raw as ModelId;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export type LLMProvider = 'openrouter' | 'anthropic';

// ─── Chat message ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ─── OpenRouter call result ───────────────────────────────────────────────────

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterResult {
  content: string;
  usage: OpenRouterUsage;
  model: string;
  latency_ms: number;
  request_id: string | null;
}

// ─── Generic chat result (discriminated union) ────────────────────────────────

export interface ChatResultSuccess {
  readonly ok: true;
  readonly content: string;
  readonly usage: OpenRouterUsage;
  readonly model: string;
  readonly latency_ms: number;
  readonly request_id: string | null;
  readonly provider: LLMProvider;
  /** True when the primary provider failed and Claude fallback was used. */
  readonly usedFallback: boolean;
}

export interface ChatResultError {
  readonly ok: false;
  readonly code: AIErrorCode;
  readonly message: string;
}

export type ChatResult = ChatResultSuccess | ChatResultError;

// ─── Error codes ──────────────────────────────────────────────────────────────

export type AIErrorCode =
  | 'UNAUTHORIZED_NO_AUTH_HEADER'
  | 'UNAUTHORIZED_INVALID_TOKEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MODEL_NOT_ALLOWED'
  | 'VALIDATION_ERROR'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_UNREACHABLE'
  | 'SERVICE_NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export class AIClientError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}
