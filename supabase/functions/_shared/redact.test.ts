// Deno unit tests for PII redaction logic (Task #19)
// Run with: deno test supabase/functions/_shared/redact.test.ts

import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { redactString, redactValue, containsPII } from './redact.ts';

// ─── redactString ─────────────────────────────────────────

Deno.test('redactString: replaces Korean phone number', () => {
  const result = redactString('문의: 010-1234-5678 입니다');
  assertEquals(result, '문의: [PHONE] 입니다');
});

Deno.test('redactString: replaces Korean landline', () => {
  const result = redactString('연락처 02-555-1234');
  assertEquals(result, '연락처 [PHONE]');
});

Deno.test('redactString: replaces +82 international phone (mobile)', () => {
  const result = redactString('전화 +82 10-1234-5678 입니다');
  assertEquals(result, '전화 [PHONE] 입니다');
});

Deno.test('redactString: replaces +82 international phone (no space)', () => {
  const result = redactString('+82-10-9999-1234');
  assertEquals(result, '[PHONE]');
});

Deno.test('redactString: replaces +82 landline variant', () => {
  const result = redactString('TEL: +8202-555-1234');
  assertEquals(result, 'TEL: [PHONE]');
});

Deno.test('redactString: replaces email address', () => {
  const result = redactString('이메일은 user@example.com 입니다');
  assertEquals(result, '이메일은 [EMAIL] 입니다');
});

Deno.test('redactString: replaces Korean RRN (주민등록번호)', () => {
  // Format: YYMMDD-NNNNNNN
  const result = redactString('주민번호: 901225-1234567 입력');
  assertEquals(result, '주민번호: [RRN] 입력');
});

Deno.test('redactString: replaces RRN without hyphen', () => {
  const result = redactString('주민번호 9012251234567 제출');
  assertEquals(result, '주민번호 [RRN] 제출');
});

Deno.test('redactString: does NOT redact 13-digit order number (invalid month)', () => {
  // Month=99 is invalid — should not be treated as RRN
  const result = redactString('주문번호 9913011234567');
  assertEquals(result, '주문번호 9913011234567');
});

Deno.test('redactString: does NOT redact 13-digit number with day=00', () => {
  // Day=00 is invalid
  const result = redactString('트랜잭션 9001001234567');
  assertEquals(result, '트랜잭션 9001001234567');
});

Deno.test('redactString: replaces RRN with gender digit 9 (foreign resident)', () => {
  const result = redactString('외국인 등록번호 901225-9123456');
  assertEquals(result, '외국인 등록번호 [RRN]');
});

Deno.test('redactString: replaces Korean passport number', () => {
  const result = redactString('여권번호 AB1234567 제출');
  assertEquals(result, '여권번호 [PASSPORT] 제출');
});

Deno.test('redactString: replaces multiple PII in one string', () => {
  const input = '이름: 홍길동, 이메일: hong@test.kr, 전화: 010-9999-0000';
  const result = redactString(input);
  assertStringIncludes(result, '[EMAIL]');
  assertStringIncludes(result, '[PHONE]');
  assertEquals(result.includes('hong@test.kr'), false);
  assertEquals(result.includes('010-9999-0000'), false);
});

Deno.test('redactString: leaves clean text unchanged', () => {
  const input = '오늘 날씨가 좋네요. 산책을 다녀왔습니다.';
  assertEquals(redactString(input), input);
});

// ─── redactValue ─────────────────────────────────────────

Deno.test('redactValue: redacts inside object string values', () => {
  const obj = { note: '전화 010-1111-2222 로 연락', count: 5 };
  const result = redactValue(obj) as typeof obj;
  assertEquals(result.note, '전화 [PHONE] 로 연락');
  assertEquals(result.count, 5);
});

Deno.test('redactValue: redacts inside nested array', () => {
  const arr = [{ content: 'call me at user@foo.com' }];
  const result = redactValue(arr) as typeof arr;
  assertEquals(result[0].content, 'call me at [EMAIL]');
});

Deno.test('redactValue: passes through null and numbers unchanged', () => {
  assertEquals(redactValue(null), null);
  assertEquals(redactValue(42), 42);
  assertEquals(redactValue(true), true);
});

// ─── containsPII ─────────────────────────────────────────

Deno.test('containsPII: detects email', () => {
  assertEquals(containsPII('reach me at foo@bar.com'), true);
});

Deno.test('containsPII: detects +82 phone', () => {
  assertEquals(containsPII('+82 10-1234-5678 로 연락'), true);
});

Deno.test('containsPII: returns false for clean text', () => {
  assertEquals(containsPII('no personal info here'), false);
});

Deno.test('containsPII: returns false for 13-digit order number (invalid month)', () => {
  assertEquals(containsPII('order 9913011234567'), false);
});
