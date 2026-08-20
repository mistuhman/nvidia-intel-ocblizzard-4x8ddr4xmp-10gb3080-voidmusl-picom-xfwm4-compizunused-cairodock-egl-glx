#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const DEFAULT_LIMIT = 405;

type Row = { path: string; added: number; deleted: number; binary: boolean; source: string };

function run(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: 'utf8' }).trimEnd();
}

function tryRun(command: string, args: string[]): string {
  try {
    return run(command, args);
  } catch {
    return '';
  }
}

function countLines(path: string): number {
  if (!existsSync(path) || !statSync(path).isFile()) return 0;
  const text = readFileSync(path, 'utf8');
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function parseNumstat(text: string, source: string): Row[] {
  if (!text.trim()) return [];
  return text.split('\n').filter(Boolean).map((line) => {
    const [addedRaw, deletedRaw, ...pathParts] = line.split('\t');
    const binary = addedRaw === '-' || deletedRaw === '-';
    return {
      path: pathParts.join('\t'),
      added: binary ? 0 : Number(addedRaw),
      deleted: binary ? 0 : Number(deletedRaw),
      binary,
      source,
    };
  });
}

function main(): void {
  const baseArg = process.argv[2] ?? 'main';
  const limit = Number(process.argv[3] ?? DEFAULT_LIMIT);
  const mergeBase = tryRun('git', ['merge-base', 'HEAD', baseArg]) || baseArg;
  const tracked = parseNumstat(tryRun('git', ['diff', '--numstat', mergeBase, '--']), 'tracked');
  const untracked = tryRun('git', ['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)
    .map((path) => ({ path, added: countLines(path), deleted: 0, binary: false, source: 'untracked' }));
  const rows = [...tracked, ...untracked].sort((a, b) => a.path.localeCompare(b.path));
  const changedLines = rows.reduce((sum, row) => sum + row.added + row.deleted, 0);
  const binaryCount = rows.filter((row) => row.binary).length;

  console.log(`base: ${baseArg}`);
  console.log(`merge_base: ${mergeBase}`);
  console.log(`limit: ${limit}`);
  console.log(`changed_lines: ${changedLines}`);
  console.log(`binary_files: ${binaryCount}`);
  console.log(changedLines <= limit ? 'PR_BUDGET=PASS' : 'PR_BUDGET=FAIL');
  for (const row of rows) {
    const marker = row.binary ? 'binary' : `${row.added}+${row.deleted}`;
    console.log(`${marker}\t${row.source}\t${row.path}`);
  }
  if (changedLines > limit) process.exit(1);
}

main();
