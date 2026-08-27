#!/usr/bin/env node
// Print the current objective gate list, the unconfirmed handoff items, and the paste blocks the operator can pick.
// Deterministic: sorted block names, fixed section order, same MASTER bytes -> same output bytes.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Master = {
  objective?: {
    id?: string;
    summary?: string;
    officialCompare?: string;
    stockBaseline?: string[];
    liveGates?: string[];
    unconfirmedHandoff?: string[];
  };
};

function loadMaster(): Master {
  return JSON.parse(readFileSync('MASTER.md', 'utf8')) as Master;
}

function listBlocks(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.block')).sort();
}

function showBlock(path: string): void {
  console.log(`--- ${path} ---`);
  console.log(readFileSync(path, 'utf8'));
}

const master = loadMaster();
const obj = master.objective ?? {};
const args = process.argv.slice(2);
const show = args.includes('--show');

console.log('OBJECTIVE:', obj.id ?? '(unset)');
console.log('SUMMARY:', obj.summary ?? '(unset)');
console.log('OFFICIAL_COMPARE:', obj.officialCompare ?? '(unset)');
console.log('LIVE_GATES (ordered):');
for (const g of obj.liveGates ?? []) console.log(`  - ${g}`);
console.log('UNCONFIRMED_HANDOFF:');
for (const h of obj.unconfirmedHandoff ?? []) console.log(`  - ${h}`);
console.log('AVAILABLE_BLOCKS:', listBlocks('etc').join(' '));

if (show) {
  for (const b of listBlocks('etc')) showBlock(join('etc', b));
}
