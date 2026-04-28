import type { TPOResult, TPOContext, TraceEntry, FormatOptions, SuppressedComponent } from './types.js';

const SEP = '='.repeat(70);
const IND = '  ';
const K = 16;

function kv(key: string, val: string): string {
  const pre = (key + ' ').padEnd(K) + ': ';
  const max = 70 - IND.length - pre.length;
  if (val.length <= max) return IND + pre + val;
  const cont = IND + ' '.repeat(K + 2);
  const out: string[] = [];
  let r = val; let first = true;
  while (r.length) { const l = first ? max : 70 - cont.length; out.push(r.slice(0, l)); r = r.slice(l); first = false; }
  return IND + pre + out.join('\n' + cont);
}

function sec(n: string): string { return `\n--- ${n} ---\n`; }

function fmtEntry(e: TraceEntry, idx?: number): string {
  const num = idx !== undefined ? `#${idx + 1}  ` : '';
  const sub = idx !== undefined ? '    ' : '';
  const p = (k: string): string => IND + (idx !== undefined && k !== 'slot' ? sub : num || '') + (k + ' ').padEnd(K) + ': ';
  if (e.kind === 'locked') return [kv('slot', e.slot), kv('componentKey', e.componentKey), kv('reason', e.reason), kv('note', 'Operator-locked. Policy suppress does NOT apply (locked wins).')].join('\n') + '\n';
  if (e.kind === 'selected') return [p('slot') + e.slot, IND + sub + (('componentKey') + ' ').padEnd(K) + ': ' + e.componentKey, IND + sub + (('specificity') + ' ').padEnd(K) + ': ' + e.specificity.toFixed(2), IND + sub + (('priority') + ' ').padEnd(K) + ': ' + e.priority, IND + sub + (('matched_rules') + ' ').padEnd(K) + ': [' + e.matchedRules.join(', ') + ']'].join('\n') + '\n';
  if (e.kind === 'suppressed') return [kv('componentKey', e.componentKey), kv('why-not', e.whyNot), ...(e.policyId ? [kv('policy_id', e.policyId)] : [])].join('\n') + '\n';
  return [kv('componentKey', e.componentKey), kv('confidence', e.confidence.toFixed(2)), kv('threshold', e.threshold.toFixed(2)), kv('reason', e.reason), ...(e.fallback ? [kv('fallback', e.fallback)] : [])].join('\n') + '\n';
}

function cleanExclusionReason(s: SuppressedComponent): string {
  if (s.policyId) return `policy gate: ${s.policyId}`;
  return s.whyNot.replace(/\s*\(rule [^)]+\)$/, '');
}

function formatGovernanceTrace(result: TPOResult, _ctx: TPOContext, opts?: FormatOptions): string {
  const now = opts?.generatedAt ?? '';
  const id = opts?.traceId ?? '';
  const lines: string[] = [`TPO Decision Governance Report\n${SEP}`];
  if (now) lines.push(`Generated: ${now}`);
  if (id) lines.push(`Trace ID:  ${id}`);

  if (result.locked.length) {
    lines.push(`\nCOMMITMENTS HONORED  (${result.locked.length})`);
    for (const l of result.locked) lines.push(`  ${l.slot}  →  ${l.componentKey}  [${l.reason}]`);
  }
  if (result.selected.length) {
    lines.push(`\nALGORITHM SELECTED  (${result.selected.length})`);
    for (const s of result.selected) lines.push(`  ${s.slot}  →  ${s.componentKey}`);
  }
  if (result.suppressed.length) {
    lines.push(`\nEXCLUDED WITH REASON  (${result.suppressed.length})`);
    for (const s of result.suppressed) lines.push(`  ${s.componentKey}  —  ${cleanExclusionReason(s)}`);
  }
  if (result.abstentions.length) {
    lines.push(`\nDEFERRED  (${result.abstentions.length})`);
    for (const a of result.abstentions) lines.push(`  ${a.componentKey}  —  confidence ${a.confidence.toFixed(2)} (threshold ${a.threshold.toFixed(2)})`);
  }

  const policyCount = result.suppressed.filter((s) => s.policyId).length;
  const condCount = result.suppressed.length - policyCount;
  lines.push(
    `\nACCOUNTABILITY SUMMARY`,
    `  commitments  : ${result.locked.length}`,
    `  algorithm    : ${result.selected.length}`,
    `  excluded     : ${result.suppressed.length}  (${condCount} condition, ${policyCount} policy)`,
    `  deferred     : ${result.abstentions.length}`,
    `  risk level   : ${result.riskTier}`,
    `\n${SEP}`,
  );
  return lines.join('\n');
}

function formatTrace(result: TPOResult, context: TPOContext, opts?: FormatOptions): string {
  if (opts?.mode === 'governance') return formatGovernanceTrace(result, context, opts);
  const now = opts?.generatedAt ?? '';
  const id = opts?.traceId ?? '';
  const bk = (k: TraceEntry['kind']): TraceEntry[] => result.trace.filter((e) => e.kind === k);

  const ctxLines = [
    context.event ? kv('event', context.event) : '',
    kv('stage', context.stage), kv('role', context.role), kv('time.phase', context.time.phase),
    context.place?.type ? kv('place.type', context.place.type) : '',
    context.locale ? kv('locale', context.locale) : '',
    context.device ? kv('device', context.device) : '',
  ].filter(Boolean);

  const header: string[] = [`TPO Funnel Runtime — Decision Trace v1\n${SEP}`];
  if (now) header.push(`Generated: ${now}`);
  if (id) header.push(`Trace ID:  ${id}`);
  const parts: string[] = [...header, sec('Input context'), ...ctxLines];

  const push = (label: string, entries: TraceEntry[], withIdx = false): void => {
    if (!entries.length) return;
    parts.push(sec(label));
    entries.forEach((e, i) => parts.push(fmtEntry(e, withIdx ? i : undefined)));
  };
  push('LOCKED', bk('locked')); push('SELECTED', bk('selected'), true); push('SUPPRESSED', bk('suppressed')); push('ABSTENTION', bk('abstained'));

  const ph = result.suppressed.filter((s) => s.policyId).length;
  const mIds = result.selected.flatMap((s) => [...s.matchedRules]).join(', ');
  parts.push(sec('RISK'), kv('tier', result.riskTier), kv('policy_hits', String(ph)), kv('abstentions', String(result.abstentions.length)), kv('fallbacks', String(result.abstentions.filter((a) => a.fallback).length)), kv('locked_wins', String(result.locked.length)), kv('override_flags', 'none'));
  parts.push(sec('META'), kv('evaluate_ms', String(result.meta.evaluateMs)), kv('rule_count', String(result.meta.ruleCount)), kv('matched_rules', `${result.meta.matchedRuleCount}   (${mIds})`), kv('trace_version', result.meta.traceVersion), kv('deterministic', String(result.meta.deterministic)));
  parts.push('\n' + SEP);
  return parts.join('\n');
}

export { formatTrace };
