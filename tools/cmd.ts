#!/usr/bin/env node
/**
 * tools/cmd.ts - deterministic command registry for the operator chat loop.
 *
 * Contract (operator directive 2026-08-27): when chat contains `?(name)`, this
 * tool reproduces the EXACT same instruction set AND the same recorded result,
 * byte for byte, every single time. There is no re-phrasing path: instructions
 * and results are canonical text stored once and replayed verbatim. A stored
 * entry whose content no longer matches its SHA-256 fails loudly (CMD=FAIL)
 * instead of silently drifting, so a command can never be quietly reworded
 * between deliveries.
 *
 * The reciprocity loop is recorded here too: `add` stores what was SENT to the
 * target, `result` stores the operator's pasted output back, `show` replays the
 * pair forever. Determinism rules: sorted keys everywhere, no generated
 * timestamps in replay paths, one fixed output order, exit 0 only on pass.
 *
 * usage:
 *   node tools/cmd.ts list
 *   node tools/cmd.ts show    <name>              metadata + exact instruction + result blocks
 *   node tools/cmd.ts replay  <name>              exact instructions only, byte-stable
 *   node tools/cmd.ts expand  '<chat text>'       detect every ?(name) token and replay each
 *   node tools/cmd.ts add     <name> [--file=<block>|block-file-positional]
 *                             [--desc=..] [--gate=..] [--rollback=..] [--force] [--keep-result] [--no-lint]
 *   node tools/cmd.ts result  <name>              record operator output from stdin or --file=
 *   node tools/cmd.ts check                       verify SHA-256 integrity of every stored entry
 *   node tools/cmd.ts selftest                    register/replay round-trip in a temp registry
 *
 * registry: --registry=<path>, default commands/registry.json
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

type Entry = {
  desc: string;
  gate: string;
  rollback: string;
  instructions: string;
  sha256: string;
  result: string;
  resultSha256: string;
  recorded: string;
};

type Registry = { schema: string; commands: Record<string, Entry> };

const SCHEMA = 'arena-command-registry.v1';
const TOKEN = /\?\(([^)]+)\)/g;

function flag(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((x) => x.startsWith(prefix))?.slice(prefix.length);
}

function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function registryPath(): string {
  return flag('registry') ?? 'commands/registry.json';
}

/** Canonical text: LF endings, trailing whitespace stripped, blank tail lines removed, single final newline. */
function canonical(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/[ \t]+$/u, ''));
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function load(path: string): Registry {
  if (!existsSync(path)) return { schema: SCHEMA, commands: {} };
  let parsed: Registry;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8')) as Registry;
  } catch (error) {
    console.error(`CMD=FAIL reason=registry-unparsable path=${path} error=${String(error)}`);
    process.exit(1);
  }
  if (parsed.schema !== SCHEMA || typeof parsed.commands !== 'object' || parsed.commands === null) {
    console.error(`CMD=FAIL reason=registry-schema path=${path}`);
    process.exit(1);
  }
  return parsed;
}

/** Save with alphabetically sorted command keys and a fixed field order so the file bytes are deterministic. */
function save(path: string, reg: Registry): void {
  const sorted: Registry = { schema: SCHEMA, commands: {} };
  for (const name of Object.keys(reg.commands).sort()) {
    const e = reg.commands[name];
    sorted.commands[name] = {
      desc: e.desc,
      gate: e.gate,
      rollback: e.rollback,
      instructions: e.instructions,
      sha256: e.sha256,
      result: e.result,
      resultSha256: e.resultSha256,
      recorded: e.recorded,
    };
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n');
}

function names(reg: Registry): string[] {
  return Object.keys(reg.commands).sort();
}

/** Exact match first, then slug fallback, so `?(selftest demo)` finds `selftest-demo`. */
function resolve(reg: Registry, raw: string): string | undefined {
  const wanted = raw.trim();
  if (reg.commands[wanted]) return wanted;
  const slug = wanted.toLowerCase().replace(/\s+/gu, '-');
  if (reg.commands[slug]) return slug;
  return names(reg).find((n) => n.toLowerCase() === wanted.toLowerCase());
}

/** Canonical storage form: lowercase, whitespace runs collapse to single dashes. */
function slug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/gu, '-');
}

function lintBlock(text: string): string[] {
  const errors: string[] = [];
  const lint = spawnSync('node', ['tools/block-lint.ts'], { input: text, encoding: 'utf8' });
  if (lint.status !== 0) errors.push(...lint.stdout.trim().split('\n').slice(1));
  const temp = join(tmpdir(), `cmd-lint-${process.pid}.sh`);
  writeFileSync(temp, text);
  const syntax = spawnSync('bash', ['-n', temp], { encoding: 'utf8' });
  rmSync(temp, { force: true });
  if (syntax.status !== 0) errors.push(`bash -n: ${syntax.stderr.trim()}`);
  return errors;
}

function entryBlock(name: string, entry: Entry): void {
  const actual = sha256(entry.instructions);
  if (actual !== entry.sha256) {
    console.error(`CMD=FAIL reason=hash-mismatch name=${name} stored=${entry.sha256} actual=${actual}`);
    process.exit(1);
  }
  console.log(`CMD=EXACT name=${name} sha256=${entry.sha256}`);
  console.log(`desc: ${entry.desc}`);
  console.log(`gate: ${entry.gate}`);
  console.log(`rollback: ${entry.rollback}`);
  if (entry.result) {
    console.log(`result=RECORDED resultSha256=${entry.resultSha256} recorded=${entry.recorded}`);
  } else {
    console.log(`result=NONE (record the operator paste with: node tools/cmd.ts result ${name})`);
  }
  console.log('--- INSTRUCTIONS (byte-exact replay) ---');
  process.stdout.write(entry.instructions);
  if (entry.result) {
    console.log('--- RECORDED RESULT (byte-exact replay) ---');
    process.stdout.write(entry.result);
  }
}

function requireEntry(reg: Registry, raw: string): { name: string; entry: Entry } {
  const name = resolve(reg, raw ?? '');
  if (!name || !reg.commands[name]) {
    console.error(`CMD=UNKNOWN name=${JSON.stringify(raw ?? '')}`);
    console.error(`registered: ${names(reg).join(' ') || '(none - seed with: node tools/cmd.ts add <name> --file=<block>)'}`);
    process.exit(2);
  }
  return { name, entry: reg.commands[name] };
}

/** Resolve input text from --file=, an existing positional file path, or stdin. */
function inputText(positional: string[]): string {
  const file = flag('file');
  if (file) return readFileSync(file, 'utf8');
  const asPath = positional.find((p) => existsSync(p));
  if (asPath) return readFileSync(asPath, 'utf8');
  return readFileSync(0, 'utf8');
}

function extractComment(text: string, key: string): string {
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^#\s*([A-Za-z ]+):\s*(.*)$/u);
    if (m && m[1].trim().toLowerCase() === key) return m[2].trim();
  }
  return '';
}

function cmdAdd(reg: Registry, regFile: string, positional: string[]): void {
  const name = slug(positional.filter((p) => !existsSync(p)).join(' ') || positional[0] || '');
  if (!/^[a-z0-9][a-z0-9 ._-]*$/iu.test(name)) {
    console.error(`CMD=FAIL reason=bad-name name=${JSON.stringify(name)} (want alnum with space . _ -)`);
    process.exit(2);
  }
  if (reg.commands[name] && !has('force')) {
    console.error(`CMD=FAIL reason=already-registered name=${name} (use --force to replace)`);
    process.exit(1);
  }
  const instructions = canonical(inputText(positional));
  if (instructions.length === 0) { console.error('CMD=FAIL reason=empty-instructions'); process.exit(2); }
  if (!has('no-lint')) {
    const lintErrors = lintBlock(instructions);
    if (lintErrors.length > 0) {
      console.error(`CMD=FAIL reason=lint name=${name}\n${lintErrors.join('\n')}`);
      process.exit(1);
    }
  }
  const previous = reg.commands[name];
  const keep = has('keep-result') && previous ? previous : { result: '', resultSha256: '', recorded: '' };
  reg.commands[name] = {
    desc: flag('desc') || extractComment(instructions, 'why') || name,
    gate: flag('gate') || extractComment(instructions, 'gate')
      || 'operator pastes target output back; agent records it with: node tools/cmd.ts result ' + name,
    rollback: flag('rollback') || extractComment(instructions, 'rollback')
      || 'exact inverse required before any forward re-run (MASTER qualityGate)',
    instructions,
    sha256: sha256(instructions),
    result: keep.result,
    resultSha256: keep.resultSha256,
    recorded: keep.recorded,
  };
  save(regFile, reg);
  console.log(`CMD=ADDED name=${name} sha256=${reg.commands[name].sha256} registry=${regFile}`);
}

function cmdResult(reg: Registry, regFile: string, positional: string[]): void {
  const name = positional[0] ?? '';
  const { name: resolved, entry } = requireEntry(reg, name);
  const rest = positional.slice(1);
  const result = canonical(flag('file') ? readFileSync(flag('file') as string, 'utf8') : readFileSync(0, 'utf8'));
  if (result.length === 0) { console.error('CMD=FAIL reason=empty-result (pipe the operator paste on stdin or pass --file=)'); process.exit(2); }
  entry.result = result;
  entry.resultSha256 = sha256(result);
  entry.recorded = new Date().toISOString();
  reg.commands[resolved] = entry;
  save(regFile, reg);
  console.log(`CMD=RECORDED name=${resolved} resultSha256=${entry.resultSha256} chars=${result.length}`);
}

function cmdSelftest(): void {
  const dir = join(tmpdir(), `cmd-selftest-${process.pid}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const regPath = join(dir, 'registry.json');
  const demo = 'id -u\n# selftest demo block\n# Why: prove add/replay/expand determinism\n# Gate: echo prints selftest-demo-ok\n# Rollback: none needed (sandbox only)\necho selftest-demo-ok\n';
  const demoFile = join(dir, 'demo.block');
  writeFileSync(demoFile, demo);
  const run = (args: string[], input?: string) =>
    spawnSync('node', ['tools/cmd.ts', ...args, `--registry=${regPath}`], { encoding: 'utf8', input });
  const steps: string[] = [];
  const add = run(['add', 'selftest', 'demo', '--file=' + demoFile]);
  steps.push(`add with spaced name: ${add.status === 0 && add.stdout.includes('CMD=ADDED')}`);
  const show1 = run(['show', 'selftest-demo']);
  const show2 = run(['show', 'selftest demo']);
  steps.push(`show byte-identical across token forms: ${show1.stdout === show2.stdout && show1.status === 0}`);
  const replay = run(['replay', 'selftest-demo']);
  steps.push(`replay byte-exact vs canonical input: ${replay.stdout === demo}`);
  const rec = run(['result', 'selftest-demo'], '0\nselftest-demo-ok\n');
  steps.push(`result recorded: ${rec.status === 0 && rec.stdout.includes('CMD=RECORDED')}`);
  const exp1 = run(['expand', 'operator says: please run ?(selftest demo) now']);
  const exp2 = run(['expand', 'second read ?(selftest-demo) again']);
  const bodyOf = (out: string) => out.split('\n').filter((l) => !l.startsWith('=== ?(')).join('\n');
  steps.push(`expand deterministic across calls and forms: ${exp1.status === 0 && exp2.status === 0 && bodyOf(exp1.stdout) === bodyOf(exp2.stdout)}`);
  steps.push(`expand replays gate, instruction AND result text: ${(exp1.stdout.match(/selftest-demo-ok/gu) ?? []).length === 4 && exp1.stdout.includes('INSTRUCTIONS') && exp1.stdout.includes('RECORDED RESULT')}`);
  const unknown = run(['expand', '?(no-such-command)']);
  steps.push(`unknown token fails loudly with exit 2: ${unknown.status === 2 && unknown.stderr.includes('CMD=UNKNOWN')}`);
  const check = run(['check']);
  steps.push(`check pass: ${check.stdout.includes('CMD_CHECK=PASS')}`);
  const corrupt = run(['add', 'selftest-demo', '--no-lint', '--force', '--desc=tampered'], 'id -u\necho tampered\n');
  // force a mismatch by rewriting instructions without updating hash
  const reg = load(regPath);
  reg.commands['selftest-demo'].instructions = 'id -u\necho tampered-drift\n';
  save(regPath, reg);
  const caught = run(['check']);
  steps.push(`silent drift caught by check: ${caught.status === 1 && caught.stdout.includes('MISMATCH')}`);
  steps.push(`corrupt replay refuses output: ${run(['replay', 'selftest-demo']).status === 1}`);
  void corrupt;
  rmSync(dir, { recursive: true, force: true });
  for (const s of steps) console.log(`- ${s}`);
  const ok = steps.every((s) => s.includes(': true'));
  console.log(ok ? 'CMD_SELFTEST=PASS' : 'CMD_SELFTEST=FAIL');
  if (!ok) process.exit(1);
}

function main(): void {
  const command = process.argv[2] ?? 'help';
  const rest = process.argv.slice(3);
  const regFile = registryPath();
  const positional = rest.filter((a) => !a.startsWith('--'));

  if (command === 'help' || command === '--help' || has('help')) {
    const src = readFileSync(new URL(import.meta.url).pathname, 'utf8');
    console.log(src.split('*/')[0].replace(/^\/\*\*?\n?/u, ''));
    return;
  }
  const reg = load(regFile);

  if (command === 'list') {
    const list = names(reg);
    console.log(`CMD_LIST entries=${list.length} registry=${regFile}`);
    for (const name of list) {
      const e = reg.commands[name];
      const state = e.result ? `result@${e.resultSha256.slice(0, 12)}` : 'result=PENDING';
      console.log(`${name}\tsha256=${e.sha256.slice(0, 12)}\t${state}\t${e.desc}`);
    }
    return;
  }
  if (command === 'show') {
    const { name, entry } = requireEntry(reg, positional.join(' '));
    entryBlock(name, entry);
    return;
  }
  if (command === 'replay') {
    const { entry } = requireEntry(reg, positional.join(' '));
    if (sha256(entry.instructions) !== entry.sha256) {
      console.error('CMD=FAIL reason=hash-mismatch');
      process.exit(1);
    }
    process.stdout.write(entry.instructions);
    return;
  }
  if (command === 'expand') {
    const text = rest.includes('--stdin') ? readFileSync(0, 'utf8') : positional.join(' ') || readFileSync(0, 'utf8');
    const found: string[] = [];
    for (const m of text.matchAll(TOKEN)) {
      const trimmed = m[1].trim();
      if (trimmed && !found.includes(trimmed)) found.push(trimmed);
    }
    if (found.length === 0) { console.log('CMD_EXPAND=NOTHING (no ?(name) tokens in input)'); return; }
    console.log(`CMD_EXPAND tokens=${found.length}`);
    for (const raw of found) {
      const name = resolve(reg, raw);
      if (!name || !reg.commands[name]) {
        console.error(`CMD=UNKNOWN token=?(${raw}) registered: ${names(reg).join(' ') || '(none)'}`);
        process.exit(2);
      }
      console.log(`=== ?(${raw}) -> ${name} ===`);
      entryBlock(name, reg.commands[name]);
    }
    return;
  }
  if (command === 'add') { cmdAdd(reg, regFile, positional); return; }
  if (command === 'result') { cmdResult(reg, regFile, positional); return; }
  if (command === 'check') {
    let fail = 0;
    for (const name of names(reg)) {
      const e = reg.commands[name];
      const problems: string[] = [];
      if (sha256(e.instructions) !== e.sha256) problems.push(`instructions-hash stored=${e.sha256.slice(0, 12)} actual=${sha256(e.instructions).slice(0, 12)}`);
      if (e.result && sha256(e.result) !== e.resultSha256) problems.push(`result-hash stored=${e.resultSha256.slice(0, 12)} actual=${sha256(e.result).slice(0, 12)}`);
      if (problems.length > 0) { console.log(`${name}\tMISMATCH ${problems.join('; ')}`); fail += 1; }
      else console.log(`${name}\tOK`);
    }
    console.log(fail === 0 ? `CMD_CHECK=PASS entries=${names(reg).length}` : `CMD_CHECK=FAIL failing=${fail}`);
    if (fail > 0) process.exit(1);
    return;
  }
  if (command === 'selftest') { cmdSelftest(); return; }

  console.error('usage: node tools/cmd.ts <list|show|replay|expand|add|result|check|selftest> [name...] [--registry=path]');
  process.exit(2);
}

main();
