#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--target-console');
const root = args.includes('--root');
const sandboxRun = args.includes('--sandbox-run');
const file = args.find((x) => !x.startsWith('--'));
const text = file ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8');
const lines = text.split(/\r?\n/);
const errors: string[] = [];
const commands = lines.map((line, index) => ({ line, n: index + 1 })).filter((x) => x.line.trim() && !x.line.trim().startsWith('#'));

if (root && commands[0]?.line.trim() !== 'id -u') errors.push('line 1: root block must start with id -u');
for (const { line, n } of commands) {
  if (line.includes('sudo -i')) errors.push(`line ${n}: sudo -i must be separate`);
  if (/curl\s/.test(line)) errors.push(`line ${n}: curl delivery forbidden`);
  if (/pgrep\s+-f\s+[^'"^]/.test(line)) errors.push(`line ${n}: unanchored pgrep -f forbidden`);
  if (strict && /[<>&]/.test(line)) errors.push(`line ${n}: strict paste forbids < > &`);
  if (strict && /&&|\|\||;/.test(line)) errors.push(`line ${n}: strict paste forbids chaining`);
}

const temp = join(tmpdir(), `paste-proof-${process.pid}.sh`);
writeFileSync(temp, text);
const syntax = spawnSync('bash', ['-n', temp], { encoding: 'utf8' });
if (syntax.status !== 0) errors.push(`bash -n failed: ${syntax.stderr.trim()}`);

if (!commands.some((x) => x.line.includes('df -h /'))) console.log('warning: no df -h / gate found');
if (!commands.some((x) => x.line.includes('ls -l'))) console.log('warning: no ls -l file gate found');
if (errors.length) {
  console.log('PASTE_PROOF=FAIL');
  console.log(errors.join('\n'));
  process.exit(1);
}
if (sandboxRun) execFileSync('bash', [temp], { stdio: 'inherit' });
console.log('PASTE_PROOF=PASS');
console.log(`commands=${commands.length}`);
