#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const rootRequired = args.includes('--root');
const strictConsole = args.includes('--target-console');
const file = args.find((arg) => !arg.startsWith('--'));
const input = file ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8');
const lines = input.split(/\r?\n/);
const errors: string[] = [];

function add(lineNumber: number, message: string): void {
  errors.push(`line ${lineNumber}: ${message}`);
}

const nonEmpty = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.trim().length > 0);
if (rootRequired && nonEmpty[0]?.line.trim() !== 'id -u') {
  errors.push('first non-empty line must be exactly: id -u');
}

for (const { line, index } of nonEmpty) {
  const number = index + 1;
  const trimmed = line.trim();
  if (trimmed.startsWith('#')) continue;
  if (strictConsole) {
    if (/[<>&]/.test(line)) add(number, 'target-console mode forbids < > & because the web console has escaped them before');
    if (/["']/.test(line)) add(number, 'target-console mode forbids quotes; split the step or make it a checked file instead');
    if (/\|\||&&|;/.test(line)) add(number, 'target-console mode forbids chained commands');
  }
  if (trimmed.includes('sudo -i')) add(number, 'sudo -i/root-shell entry must be delivered as a separate step, not inside a block');
  if (/pgrep\s+-f\s+[^'^"]/.test(trimmed)) add(number, 'unanchored pgrep -f is forbidden by MASTER.md');
  if (/curl\s+/.test(trimmed)) add(number, 'curl delivery is forbidden; use heredoc or git checkout');
}

if (errors.length > 0) {
  console.log('BLOCK_LINT=FAIL');
  console.log(errors.join('\n'));
  process.exit(1);
}

console.log('BLOCK_LINT=PASS');
console.log(`lines_checked=${nonEmpty.length}`);
