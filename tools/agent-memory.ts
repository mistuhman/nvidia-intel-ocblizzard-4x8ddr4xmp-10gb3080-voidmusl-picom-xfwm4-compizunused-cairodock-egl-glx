#!/usr/bin/env node
// Agentic memory cache: verbatim operator prompts <-> agent response digests <-> perception receipts.
// Purpose (operator directive 2026-09-12, session 01a09434): reach 1:1 accuracy in how agents
// respond and perceive OVER making up discrepancies. Every claim an agent makes about the chat
// history or an image must trace to an entry here; `check` prints MISSING when nothing is recorded.
// Zero dependencies, deterministic stdout.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DEFAULT_LEDGER = 'receipts/agent-memory/memory.json';

type Claim = { claim: string; evidence: string; confidence: string };
type Side = { claim: string; source: string };
type Entry = {
  seq: number; date: string; kind: string; sha256: string;
  verbatim?: string; demands?: string[]; from?: string;
  to?: number; summary?: string; actions?: string[];
  target?: string; tool?: string; claims?: Claim[]; discrepancies?: string[];
  topic?: string; status?: string; owner?: string; sides?: Side[];
  key?: string; value?: string; source?: string;
  text?: string;
};
type Ledger = { schema: string; created: string; updated: string; lastSeq: number; entries: Entry[] };

function argVals(args: string[], key: string): string[] {
  const pre = `--${key}=`;
  return args.filter((a) => a.startsWith(pre)).map((a) => a.slice(pre.length));
}
function argVal(args: string[], key: string): string | undefined { return argVals(args, key)[0]; }
function sha256(s: string): string { return createHash('sha256').update(s).digest('hex'); }
function today(): string { return new Date().toISOString().slice(0, 10); }
function splitList(s: string | undefined): string[] { return (s ?? '').split(';;').map((x) => x.trim()).filter(Boolean); }

function load(file: string): Ledger {
  if (!existsSync(file)) return { schema: 'agent-memory.v1', created: today(), updated: today(), lastSeq: 0, entries: [] };
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Ledger;
  if (raw.schema !== 'agent-memory.v1') { console.error(`bad schema ${raw.schema}`); process.exit(1); }
  raw.entries.sort((a, b) => a.seq - b.seq);
  return raw;
}
function save(file: string, l: Ledger): void {
  l.updated = today();
  l.entries.sort((a, b) => a.seq - b.seq);
  mkdirSync(file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '.', { recursive: true });
  writeFileSync(file, JSON.stringify(l, null, 2) + '\n');
}
function contentOf(e: Omit<Entry, 'seq' | 'sha256'>): string { return JSON.stringify(e); }

function addEntry(file: string, partial: Omit<Entry, 'seq' | 'sha256'>): Entry {
  const l = load(file);
  const seq = l.lastSeq + 1;
  const entry: Entry = { seq, ...partial, sha256: sha256(contentOf(partial)) };
  l.entries.push(entry);
  l.lastSeq = seq;
  save(file, l);
  console.log(`ADDED seq=${seq} kind=${entry.kind} sha256=${entry.sha256.slice(0, 16)}`);
  return entry;
}

function oneLine(e: Entry): string {
  const body = e.verbatim ?? e.summary ?? e.target ?? e.topic ?? e.key ?? e.text ?? '(no body)';
  const clipped = body.length > 72 ? body.slice(0, 69) + '...' : body;
  const link = e.to ? ` ->seq${e.to}` : '';
  return `${String(e.seq).padStart(3)}\t${e.date}\t${e.kind.padEnd(11)}\t${clipped}${link}`;
}

function cmdAdd(args: string[]): number {
  const what = args[0];
  const file = argVal(args, 'file') ?? DEFAULT_LEDGER;
  const date = argVal(args, 'date') ?? today();
  if (what === 'prompt') {
    const verbatim = argVal(args, 'verbatim');
    if (!verbatim) { console.error('usage: add prompt --verbatim="..." [--demands="a;;b"]'); return 1; }
    const demands = splitList(argVal(args, 'demands'));
    addEntry(file, { date, kind: 'prompt', from: 'operator', verbatim, ...(demands.length ? { demands } : {}) });
    return 0;
  }
  if (what === 'response') {
    const to = Number(argVal(args, 'to'));
    const summary = argVal(args, 'summary');
    if (!to || !summary) { console.error('usage: add response --to=N --summary="..." [--actions="a;;b"]'); return 1; }
    const actions = splitList(argVal(args, 'actions'));
    addEntry(file, { date, kind: 'response', to, summary, ...(actions.length ? { actions } : {}) });
    return 0;
  }
  if (what === 'perception') {
    const target = argVal(args, 'target');
    const claimsRaw = argVal(args, 'claims');
    if (!target || !claimsRaw) { console.error('usage: add perception --target=PATH --claims=\'[{"claim":..,"evidence":..,"confidence":..}]\''); return 1; }
    const claims = JSON.parse(claimsRaw) as Claim[];
    const discrepancies = splitList(argVal(args, 'discrepancies'));
    addEntry(file, { date, kind: 'perception', target, tool: argVal(args, 'tool') ?? 'read_file vision', claims, ...(discrepancies.length ? { discrepancies } : {}) });
    return 0;
  }
  if (what === 'discrepancy') {
    const topic = argVal(args, 'topic');
    const sides = argVals(args, 'side').map((s) => { const i = s.indexOf('::'); if (i < 0) { console.error('side form: --side="claim::source"'); process.exit(1); } return { claim: s.slice(0, i), source: s.slice(i + 2) }; });
    if (!topic || sides.length < 2) { console.error('usage: add discrepancy --topic=T --side="claim::source" --side="claim::source" [--status=UNRESOLVED] [--owner=operator]'); return 1; }
    addEntry(file, { date, kind: 'discrepancy', topic, sides, status: argVal(args, 'status') ?? 'UNRESOLVED', owner: argVal(args, 'owner') ?? 'operator' });
    return 0;
  }
  if (what === 'value') {
    const key = argVal(args, 'key'); const value = argVal(args, 'value'); const source = argVal(args, 'source');
    if (!key || value === undefined || !source) { console.error('usage: add value --key=K --value=V --source=S'); return 1; }
    addEntry(file, { date, kind: 'value', key, value, source });
    return 0;
  }
  if (what === 'note') {
    const text = argVal(args, 'text');
    if (!text) { console.error('usage: add note --text="..."'); return 1; }
    addEntry(file, { date, kind: 'note', text });
    return 0;
  }
  console.error('usage: add <prompt|response|perception|discrepancy|value|note> ...');
  return 1;
}

function match(file: string, q: string): Entry[] {
  const needle = q.toLowerCase();
  return load(file).entries.filter((e) => JSON.stringify(e).toLowerCase().includes(needle));
}

function cmdList(args: string[]): number {
  const file = argVal(args, 'file') ?? DEFAULT_LEDGER;
  const kind = argVal(args, 'kind');
  const last = Number(argVal(args, 'last') ?? '0');
  let rows = load(file).entries;
  if (kind) rows = rows.filter((e) => e.kind === kind);
  if (last > 0) rows = rows.slice(-last);
  for (const e of rows) console.log(oneLine(e));
  console.log(`LIST count=${rows.length}`);
  return 0;
}

function cmdShow(args: string[]): number {
  const file = argVal(args, 'file') ?? DEFAULT_LEDGER;
  const seq = Number(argVal(args, 'seq'));
  const e = load(file).entries.find((x) => x.seq === seq);
  if (!e) { console.error(`no entry seq=${seq}`); return 1; }
  console.log(JSON.stringify(e, null, 2));
  return 0;
}

function cmdSearch(args: string[]): number {
  const file = argVal(args, 'file') ?? DEFAULT_LEDGER;
  const q = argVal(args, 'q');
  if (!q) { console.error('usage: search --q=TEXT'); return 1; }
  const hits = match(file, q);
  for (const e of hits) console.log(oneLine(e));
  console.log(`SEARCH q="${q}" hits=${hits.length}`);
  return 0;
}

function cmdCheck(args: string[]): number {
  const file = argVal(args, 'file') ?? DEFAULT_LEDGER;
  const q = argVal(args, 'q');
  if (!q) { console.error('usage: check --q=CLAIM'); return 1; }
  const hits = match(file, q);
  console.log(`CHECK "${q}"`);
  for (const e of hits) {
    console.log(`  [seq ${e.seq} ${e.date} ${e.kind}] ${JSON.stringify(e.verbatim ?? e.summary ?? e.claims ?? e.sides ?? e.value ?? e.text).slice(0, 400)}`);
    console.log(`  sha256=${e.sha256}`);
  }
  console.log(`COVERAGE=${hits.length}`);
  if (hits.length === 0) {
    console.log('MISSING: no recorded receipt for this claim - do NOT invent it; gather a receipt or ask the operator.');
    return 2;
  }
  return 0;
}

function cmdStats(args: string[]): number {
  const file = argVal(args, 'file') ?? DEFAULT_LEDGER;
  const l = load(file);
  const byKind = new Map<string, number>();
  for (const e of l.entries) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);
  for (const k of [...byKind.keys()].sort()) console.log(`${k}\t${byKind.get(k)}`);
  const broken = l.entries.filter((e) => {
    const { seq, sha256: h, ...rest } = e;
    return sha256(contentOf(rest as Omit<Entry, 'seq' | 'sha256'>)) !== h;
  });
  console.log(`entries=${l.entries.length} lastSeq=${l.lastSeq} hashIntegrity=${broken.length === 0 ? 'OK' : `BROKEN x${broken.length}`}`);
  console.log(`file=${file}`);
  return broken.length === 0 ? 0 : 1;
}

function cmdSelftest(args: string[]): number {
  const tmp = argVal(args, 'file') ?? 'receipts/agent-memory/selftest-tmp.json';
  if (existsSync(tmp)) rmSync(tmp);
  const checks: { name: string; ok: boolean; detail: string }[] = [];
  const a = addEntry(tmp, { date: '2026-09-12', kind: 'prompt', from: 'operator', verbatim: 'alpha requires beta' });
  const b = addEntry(tmp, { date: '2026-09-12', kind: 'response', to: a.seq, summary: 'did alpha with beta', actions: ['step1;;step2'] });
  const c = addEntry(tmp, { date: '2026-09-12', kind: 'perception', target: 'x.png', tool: 'read_file vision', claims: [{ claim: 'slider present', evidence: 'visible right column', confidence: 'HIGH' }] });
  checks.push({ name: 'seq-increments', ok: a.seq === 1 && b.seq === 2 && c.seq === 3, detail: `seq=${a.seq},${b.seq},${c.seq}` });
  const again = addEntry(tmp, { date: '2026-09-12', kind: 'prompt', from: 'operator', verbatim: 'alpha requires beta' });
  checks.push({ name: 'deterministic-hash', ok: again.sha256 === a.sha256, detail: again.sha256.slice(0, 12) });
  const found = match(tmp, 'beta');
  checks.push({ name: 'check-hits', ok: found.length === 3, detail: `hits=${found.length}` });
  const none = match(tmp, 'zebra-quantum');
  checks.push({ name: 'check-missing-path', ok: none.length === 0, detail: 'MISSING reachable' });
  const integrity = cmdStats(['--file=' + tmp]) === 0;
  checks.push({ name: 'hash-integrity', ok: integrity, detail: 'stats rc=0' });
  rmSync(tmp);
  for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}\t${c.name}\t${c.detail}`);
  const failed = checks.filter((x) => !x.ok).length;
  console.log(`SELFTEST checks=${checks.length} failed=${failed}`);
  return failed ? 1 : 0;
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2);
  let rc = 0;
  switch (cmd) {
    case 'add': rc = cmdAdd(rest); break;
    case 'list': rc = cmdList(rest); break;
    case 'show': rc = cmdShow(rest); break;
    case 'search': rc = cmdSearch(rest); break;
    case 'check': rc = cmdCheck(rest); break;
    case 'stats': rc = cmdStats(rest); break;
    case 'selftest': rc = cmdSelftest(rest); break;
    default:
      console.log('usage: node tools/agent-memory.ts <add|list|show|search|check|stats|selftest>');
      console.log('  add prompt --verbatim=... [--demands=a;;b]           operator message, word-for-word');
      console.log('  add response --to=N --summary=... [--actions=a;;b]   what the agent did about seq N');
      console.log('  add perception --target=IMG --claims=JSON            what the agent SAW, with evidence');
      console.log('  add discrepancy --topic=T --side="c::s" --side=...   conflicting recorded claims, never self-resolved');
      console.log('  add value --key=K --value=V --source=S               stored design requirement');
      console.log('  add note --text=...                                  free note');
      console.log('  check --q=CLAIM                                      1:1 gate: quoted receipts or MISSING (rc=2)');
      process.exit(2);
  }
  process.exit(rc);
}
main();
