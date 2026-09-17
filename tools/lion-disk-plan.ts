#!/usr/bin/env node
// lion-disk-plan.ts - the gate that stands between "wipe the ssd" and an irreversible mistake.
//
// WHY THIS EXISTS (2026-09-17, session 01a0ae24). ToDo.md item 3 orders:
//   "SSD wipe (the superseded Bay 3 start-disk clone media)"
// but the live ABSOLUTION burn of 2026-09-17 shows that same volume is the RUNNING SYSTEM:
//   /dev/disk3s2 on / (hfs, local, journaled)   931Gi  899Gi used  97%
//   Finished file system verification on disk3s2 start disk clone
// and docs/lion-workflow.json marks it erase=NEVER (current boot), location UNVERIFIED.
// The wipe order and the live receipt name the SAME STRING for DIFFERENT media. Until a probe
// says which physical disk is which, "the SSD" is not a resolvable target - so nothing is armed.
//
// The old etc/lion-ssd-wipe.block selects on media name matching crucial|mx500|ssd. No receipt in
// this repo has ever printed a Solid State flag for a Mac disk (verified: 0 hits under receipts/),
// and the only MX500 with a receipt is ata-CT1000MX500SSD1_... which is in the OMEN running Void -
// a DIFFERENT MACHINE. Arming a name-matching erase on unproven identity is the 1.55V lesson in
// disk form: log the interface, prove the target, then act.
//
// So this tool emits a READ-ONLY identity probe and REFUSES to emit any erase. It also encodes the
// protected set as data, so a future erase wave can be checked against receipts instead of memory.
//
// Usage: node tools/lion-disk-plan.ts <emit|guards|selftest>
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// ---------------------------------------------------------------- protected set (from receipts)
export type Guard = { node: string; name: string; why: string; source: string };
export const NEVER_ERASE: Guard[] = [
  {
    node: '/dev/disk3s2', name: 'start disk clone',
    why: 'CURRENT BOOT, mounted at /, Lion 10.7.5, 931Gi 97% full',
    source: 'receipts/absolution/R1/burn-2026-09-17.txt + docs/lion-workflow.json volumes[0]',
  },
  {
    node: '/dev/disk0s2', name: 'Apple_RAID member', why: '~999.9 GB RAID member',
    source: 'docs/lion-workflow.json volumes[Apple_RAID members]',
  },
  {
    node: '/dev/disk1s2', name: 'Apple_RAID member', why: '~999.9 GB RAID member',
    source: 'docs/lion-workflow.json volumes[Apple_RAID members]',
  },
  {
    node: '/dev/disk2s2', name: 'Apple_RAID member', why: '~999.9 GB RAID member',
    source: 'docs/lion-workflow.json volumes[Apple_RAID members]',
  },
  {
    node: '/dev/disk4', name: 'Raid X',
    why: '3.0 TB logical HFS volume with live data, mounted at /Volumes/Raid X',
    source: 'docs/lion-workflow.json volumes[Raid X]',
  },
];

// Every disk with a receipt is NEVER-erase. That is the finding, not an omission: no free disk has
// ever been observed on this Mac, so the wipe wave currently has NO proven target at all.
export const PROVEN_FREE_DISKS: string[] = [];

// ---------------------------------------------------------------- the read-only probe
// Console-safe per MASTER hardConstraints.consolePaste: one command per line, no chaining.
export function identityBlock(): string {
  const guards = NEVER_ERASE.map((g) => `#   ${g.node.padEnd(14)} ${g.name.padEnd(20)} ${g.why}`).join('\n');
  return `id -u
# lion-disk-identity.block - Mac Pro 3,1, ROOT shell (sudo -s, then paste). READ-ONLY.
# Purpose: resolve WHICH PHYSICAL DISK IS WHICH before the word "wipe" is used again.
# It runs diskutil/system_profiler reads only. No erase, no unmount, no bless, no move, no delete.
#
# Why a probe instead of the wipe block: ToDo item 3 names "the superseded Bay 3 start-disk clone
# media" as the wipe target, but the 2026-09-17 burn proves "start disk clone" is the LIVE BOOT
# volume (/dev/disk3s2, 931Gi, 97% full). Same name, different media, and the physical identity was
# never measured. etc/lion-ssd-wipe.block stays UN-ARMED until this output names a real target.
#
# Protected by rule (never selectable by any future erase wave):
${guards}
#
# Paste the FULL output back. Nothing here changes the machine.
echo == WHOAMI AND BOOT
date
whoami
mount | grep ' on / '
df -h /
echo == ALL PHYSICAL DISKS, WITH THE SSD FLAG THAT WAS NEVER MEASURED
diskutil list
echo == PER-DISK IDENTITY: media name, size, protocol, SSD flag, removable
for d in 0 1 2 3 4 5 6 7
do
diskutil info disk$d 2>/dev/null | grep -Ei 'Device Identifier|Device / Media Name|Total Size|Disk Size|Protocol|Solid State|Medium Type|Removable Media|Virtual|Read-Only Media|Mount Point'
echo ---
done
echo == RAID MEMBERSHIP, SO MEMBERS CAN BE EXCLUDED BY RECEIPT NOT BY MEMORY
diskutil appleRAID list
diskutil coreStorage list
echo == PHYSICAL BAY MAPPING FROM THE HARDWARE TREE
system_profiler SPSerialATADataType 2>/dev/null | grep -Ei 'Bay|SATA|Model|Capacity|Medium Type|Rotational|BSD Name|Unit Number'
echo == MOUNTED VOLUMES
ls -l /Volumes
echo == FREE SPACE ON EVERY MOUNT
df -h
echo LIONDISK1_DONE No disk was erased.
`;
}

// ---------------------------------------------------------------- outputs
const OUTPUTS: Array<[string, () => string]> = [['etc/lion-disk-identity.block', identityBlock]];

// Verbs that must never appear in a probe. `diskutil list`/`info` are reads; these are not.
const DESTRUCTIVE = [
  'eraseDisk', 'eraseVolume', 'partitionDisk', 'reformat', 'secureErase',
  'newfs', 'diskutil unmount', 'zeroDisk', 'randomDisk', 'bless', 'asr ',
  'rm -rf', 'rm -r ', 'mv /Volumes', 'dd ', 'nvram ',
];

function selftest(): void {
  let fail = 0;
  const check = (n: string, ok: boolean): void => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`);
    if (!ok) fail++;
  };
  const b = identityBlock();
  // Comments describe what the probe REFUSES to do ("no bless, no move"), so the destructive-verb
  // scan must read executable lines only - scanning the prose made the selftest fail on its own
  // safety note. Receipts over vibes applies to the checker too.
  const code = b.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));

  check('block starts with id -u (root-block rule)', b.split('\n')[0] === 'id -u');
  for (const verb of DESTRUCTIVE) {
    check(`probe contains no "${verb.trim()}"`, !code.some((l) => l.includes(verb)));
  }
  // CONFIRM is the arming token of the old wipe block; a probe must never carry one.
  check('probe carries no CONFIRM arming token', !/CONFIRM=/.test(b));
  check('probe ends with a completion marker', b.includes('LIONDISK1_DONE No disk was erased.'));

  // Console-paste hygiene: delegate to the repo's own linter so this block is held to exactly the
  // same standard as every other block, instead of a second opinion that can drift from it.
  writeFileSync('/tmp/lion-disk-identity.lintcheck', b);
  const lint = spawnSync('node', ['tools/block-lint.ts', '--root', '/tmp/lion-disk-identity.lintcheck'], { encoding: 'utf8' });
  check('block-lint --root passes', lint.status === 0 && lint.stdout.includes('BLOCK_LINT=PASS'));
  check('no chaining operators in code lines', !code.some((l) => /&&|\|\||;/.test(l)));
  // Only 2>/dev/null is permitted (the repo-standard best-effort probe idiom, as in
  // etc/lion-harden.block); any other redirect could create or truncate a file.
  check('only 2>/dev/null redirects', code.every((l) => l.replace(/2>\/dev\/null/g, '').match(/[<>]/) === null));

  // the guard set must actually be quoted into the block, or the operator cannot see the rule
  for (const g of NEVER_ERASE) check(`guard ${g.node} is quoted in the block`, b.includes(g.node));
  check('every guard cites a source', NEVER_ERASE.every((g) => g.source.length > 0));
  check('no proven-free disk is claimed', PROVEN_FREE_DISKS.length === 0);
  // the boot volume and the ToDo wipe target are the SAME STRING - the whole reason this gate exists
  check('boot guard names the ToDo target string',
    NEVER_ERASE.some((g) => g.name === 'start disk clone' && g.why.includes('CURRENT BOOT')));

  console.log(fail === 0 ? 'LION_DISK_PLAN_SELFTEST=PASS' : `LION_DISK_PLAN_SELFTEST=FAIL failures=${fail}`);
  if (fail > 0) process.exit(1);
}

function guards(): void {
  console.log('NEVER ERASE - every disk with a receipt on this Mac:');
  for (const g of NEVER_ERASE) console.log(`  ${g.node.padEnd(14)} ${g.name.padEnd(20)} ${g.why}\n${' '.repeat(18)}src: ${g.source}`);
  console.log(`\nPROVEN FREE DISKS: ${PROVEN_FREE_DISKS.length === 0 ? 'NONE - the wipe wave has no target yet' : PROVEN_FREE_DISKS.join(', ')}`);
  console.log('VERDICT: no erase may be authored until node tools/lion-disk-plan.ts guards shows a free disk.');
}

const cmd = process.argv[2] ?? 'selftest';
if (cmd === 'emit') {
  for (const [path, gen] of OUTPUTS) {
    writeFileSync(path, gen());
    console.log(`WROTE ${path}`);
  }
} else if (cmd === 'guards') guards();
else if (cmd === 'selftest') selftest();
else {
  console.log('usage: node tools/lion-disk-plan.ts <emit|guards|selftest>');
  process.exit(1);
}
