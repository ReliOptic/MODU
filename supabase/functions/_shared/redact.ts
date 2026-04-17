// PII redaction / minimization for MODU AI Edge Functions
// Strategy: replace detected PII with typed placeholders rather than deleting,
// so downstream prompts retain semantic structure.

/** Placeholder tokens used in redacted text. */
const PLACEHOLDERS = {
  phone: '[PHONE]',
  email: '[EMAIL]',
  rrn: '[RRN]',       // Korean Resident Registration Number (주민등록번호)
  passport: '[PASSPORT]',
} as const;

/**
 * Validates whether a 6-digit YYMMDD prefix is a plausible birth date.
 * Rejects strings like order numbers where month > 12 or day > 31.
 */
function isPlausibleRrnDate(digits: string): boolean {
  // digits is exactly 6 characters: YYMMDD
  const mm = parseInt(digits.slice(2, 4), 10);
  const dd = parseInt(digits.slice(4, 6), 10);
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}

/**
 * Patterns are applied in order. Each entry provides a named label and the
 * regex used to detect the PII class.
 *
 * Korean RRN: YYMMDD-NNNNNNN  (7-digit second part, first digit 1-4 or 9)
 * Phone (KR): 010-XXXX-XXXX, 02-XXXX-XXXX, +82 variants
 * Email: RFC-5321 simplified
 * Passport (KR): two uppercase letters + 7 digits
 *
 * RRN false-positive mitigation:
 *   - YYMMDD portion is validated (month 01-12, day 01-31)
 *   - Gender digit must be 1-4 or 9 (covers all KR/FK/foreign codes)
 *   - Plain 13-digit runs (e.g. order numbers) that fail date validation
 *     are NOT redacted.
 */
const PII_RULES: Array<{
  key: keyof typeof PLACEHOLDERS;
  pattern: RegExp;
  validate?: (match: string) => boolean;
}> = [
  {
    key: 'rrn',
    // 6 digits, optional separator (hyphen or space), gender digit 1-4 or 9, 6 more digits
    pattern: /\b(\d{6})[\s-]?([1-49]\d{6})\b/g,
    validate: (match: string) => {
      // Extract the first 6 digits regardless of separator
      const digits = match.replace(/[\s-]/g, '');
      return isPlausibleRrnDate(digits.slice(0, 6));
    },
  },
  {
    key: 'phone',
    // Matches:
    //   +82 (0|10|2|...) variants with optional spaces/hyphens
    //   0XX-XXXX-XXXX  Korean mobile/landline
    pattern: /(?:\+82[\s-]?(?:0?)?|0)\d{1,2}[\s-]?\d{3,4}[\s-]?\d{4}\b/g,
  },
  {
    key: 'email',
    pattern: /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g,
  },
  {
    key: 'passport',
    pattern: /\b[A-Z]{2}\d{7}\b/g,
  },
];

/**
 * Redacts PII in a string by replacing matches with typed placeholders.
 * Returns the sanitized string.
 */
export function redactString(input: string): string {
  let out = input;
  for (const { key, pattern, validate } of PII_RULES) {
    // Reset lastIndex for global regexes used across calls
    pattern.lastIndex = 0;
    if (validate) {
      out = out.replace(pattern, (match) => (validate(match) ? PLACEHOLDERS[key] : match));
    } else {
      out = out.replace(pattern, PLACEHOLDERS[key]);
    }
  }
  return out;
}

/**
 * Recursively redacts PII in any JSON-serializable value.
 * Strings are redacted; arrays/objects are traversed; primitives are unchanged.
 */
export function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactValue(v);
    }
    return out;
  }
  return value;
}

/**
 * Returns true if any PII pattern matches anywhere in the string.
 */
export function containsPII(input: string): boolean {
  for (const { pattern, validate } of PII_RULES) {
    pattern.lastIndex = 0;
    if (validate) {
      // Need to test each match individually for validate-gated patterns
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(input)) !== null) {
        if (validate(match[0])) return true;
      }
    } else {
      pattern.lastIndex = 0;
      if (pattern.test(input)) return true;
    }
  }
  return false;
}
