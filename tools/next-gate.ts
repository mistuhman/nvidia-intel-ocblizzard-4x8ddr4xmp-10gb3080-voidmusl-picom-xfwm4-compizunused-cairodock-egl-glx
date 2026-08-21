#!/usr/bin/env node
// Print the post-failure handoff: gate, next question to the operator, and the paste blocks they can pick.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Master = {
  activeObjective?: {
    bootGate?: string;
    nextGateAskFirst?: string;
    handoffFixUnconfirmed?: string[];
    afterBootGate?: string[];
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
const obj = master.activeObjective ?? {};
const args = process.argv.slice(2);
const show = args.includes('--show');

console.log('BOOT_GATE:', obj.bootGate ?? '(unset)');
console.log('NEXT_GATE_ASK_FIRST:', obj.nextGateAskFirst ?? '(unset)');
console.log('HANDOFF_FIX_UNCONFIRMED:');
for (const h of obj.handoffFixUnconfirmed ?? []) console.log(`  - ${h}`);
console.log('AVAILABLE_BLOCKS:', listBlocks('etc').join(' '));
console.log('AFTER_BOOT_GATE:');
for (const a of obj.afterBootGate ?? []) console.log(`  - ${a}`);

if (show) {
  for (const b of listBlocks('etc')) showBlock(join('etc', b));
}
