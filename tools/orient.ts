#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

type Master = {
  schema?: string;
  updated?: string;
  activeObjective?: { id?: string; summary?: string; bootGate?: string; nextGateAskFirst?: string; currentState?: string[] };
  repo?: { branchFixed?: string; files?: Record<string, string> };
};

function run(command: string, args: string[] = []): string {
  return execFileSync(command, args, { encoding: 'utf8' }).trimEnd();
}

function safeRun(command: string, args: string[] = []): string {
  try { return run(command, args); } catch { return `UNAVAILABLE: ${command} ${args.join(' ')}`; }
}

function listDir(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).sort().filter((name) => statSync(join(path, name)).isFile());
}

function fileSummary(path: string): string {
  if (!existsSync(path)) return `${path}: missing`;
  const text = readFileSync(path, 'utf8');
  return `${path}: ${text.split(/\r?\n/).length} lines, ${Buffer.byteLength(text)} bytes`;
}

function readMaster(): { raw: string; json?: Master } {
  const raw = existsSync('MASTER.md') ? readFileSync('MASTER.md', 'utf8') : '';
  try { return { raw, json: JSON.parse(raw) as Master }; } catch { return { raw }; }
}

function legacyActiveObjective(master: string): string {
  const match = master.match(/^### .*ACTIVE OBJECTIVE.*$/m);
  if (!match || match.index === undefined) return 'ACTIVE OBJECTIVE not found';
  const rest = master.slice(match.index);
  const next = rest.slice(match[0].length + 1).search(/^### /m);
  return (next === -1 ? rest : rest.slice(0, match[0].length + 1 + next)).split('\n').slice(0, 28).join('\n').trimEnd();
}

function printObjective(master: { raw: string; json?: Master }): void {
  if (!master.json?.activeObjective) {
    console.log(legacyActiveObjective(master.raw));
    return;
  }
  const objective = master.json.activeObjective;
  console.log(`id: ${objective.id ?? '(none)'}`);
  console.log(`summary: ${objective.summary ?? '(none)'}`);
  if (objective.nextGateAskFirst) console.log(`next_gate_first: ${objective.nextGateAskFirst}`);
  if (objective.bootGate) console.log(`boot_gate: ${objective.bootGate}`);
  if (objective.currentState?.length) {
    console.log('current_state:');
    for (const item of objective.currentState.slice(0, 8)) console.log(`- ${item}`);
  }
}

function main(): void {
  const command = process.argv[2] ?? 'orient';
  if (command !== 'orient') {
    console.error('usage: node tools/orient.ts orient');
    process.exit(2);
  }
  const master = readMaster();
  const branch = safeRun('git', ['branch', '--show-current']);
  console.log('ORIENTATION');
  console.log(`branch: ${branch}`);
  console.log(`head: ${safeRun('git', ['rev-parse', '--short', 'HEAD'])}`);
  if (master.json?.repo?.branchFixed && branch !== master.json.repo.branchFixed) console.log(`BRANCH_MISMATCH expected=${master.json.repo.branchFixed}`);
  console.log('\nrecent_commits:');
  console.log(safeRun('git', ['log', '--oneline', '-5']) || '(none)');
  console.log('\nstatus:');
  console.log(safeRun('git', ['status', '--short']) || 'clean');
  console.log('\nfiles:');
  for (const file of ['README.md', 'MASTER.md', 'ToDo.md']) console.log(`- ${fileSummary(file)}`);
  console.log('\nscripts:');
  console.log(listDir('scripts').map((name) => `- ${name}`).join('\n') || '(none)');
  console.log('\ntools:');
  console.log(listDir('tools').map((name) => `- ${name}`).join('\n') || '(none)');
  console.log('\nactive_objective:');
  printObjective(master);
}

main();
