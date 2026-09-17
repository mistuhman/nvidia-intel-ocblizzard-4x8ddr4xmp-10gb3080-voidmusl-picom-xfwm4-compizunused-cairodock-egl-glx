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
// Usage: node tools/lion-disk-plan.ts <emit|guards|sim|selftest>
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

// ---------------------------------------------------------------- 2026-09-17: IDENTITY RESOLVED
// The operator's Disk Utility photo (chat-only bytes; perception receipt agent-memory seq 158)
// closed the name collision that blocked the previous turn. Full sidebar, nothing inferred:
//
//   1 TB WDC WD10EACS-0...   -> RAID Slice for "Raid X"
//   1 TB WDC WD10EAVS-0...   -> RAID Slice for "Raid X"
//   1 TB WDC WD10EACS-0...   -> RAID Slice for "Raid X"
//   1 TB CT1000MX500SSD...   -> "start disk clone"      <- THE ONLY SSD
//   3 TB Raid X              -> "Raid X"                 (logical, from the 3 slices above)
//   SuperDrive               -> "Peaks And Troughs"      (a CD)
//
// CONCLUSION THAT CHANGES THE ORDER: the Mac Pro 3,1 has four bays and all four are full. The one
// and only SSD is the CT1000MX500SSD, and its volume is "start disk clone" - which the ABSOLUTION
// burn proves is the LIVE BOOT disk (/dev/disk3s2 on /, 931Gi, 899Gi used, 97%). There is no second
// MX500, no spare SSD, no empty bay. So "wipe the SSD" as written in ToDo item 3 has no executable
// target: the only SSD is the running system. This is not a policy refusal - it is arithmetic.
export type DiskFact = { sidebar: string; volume: string; role: string; erase: string };
export const PHOTO_INVENTORY: DiskFact[] = [
  { sidebar: '1 TB WDC WD10EACS-0...', volume: 'RAID Slice for "Raid X"', role: 'Raid X member 1/3', erase: 'NEVER (destroys Raid X)' },
  { sidebar: '1 TB WDC WD10EAVS-0...', volume: 'RAID Slice for "Raid X"', role: 'Raid X member 2/3', erase: 'NEVER (destroys Raid X)' },
  { sidebar: '1 TB WDC WD10EACS-0...', volume: 'RAID Slice for "Raid X"', role: 'Raid X member 3/3', erase: 'NEVER (destroys Raid X)' },
  { sidebar: '1 TB CT1000MX500SSD...', volume: 'start disk clone', role: 'THE ONLY SSD = LIVE BOOT /dev/disk3s2', erase: 'NEVER (current boot)' },
  { sidebar: '3 TB Raid X', volume: 'Raid X', role: 'logical stripe over the 3 WD members', erase: 'NEVER (live data)' },
];
// 3 members x 1 TB presenting as 3 TB means CONCATENATED/STRIPED with NO redundancy: a mirror would
// show 1 TB and a RAID 5 would show 2 TB. Losing any one WD loses all 3 TB. Relevant because the
// operator's stated end-goal is "new drives for raid" - the current set has zero fault tolerance.
export const RAID_X_REDUNDANCY = 'NONE (3x1TB -> 3TB = stripe/concat; any single member loss = total loss)';
export const SSD_IDENTITY_RESOLVED = true;

// ---------------------------------------------------------------- wipe-block safety simulation
// Claim under test: "if the operator pasted the old etc/lion-ssd-wipe.block today, could it erase
// the boot SSD?" That must be MEASURED, not asserted. This mocks diskutil/mount to reproduce the
// photographed disk set exactly, replays the block's own embedded shell, and asserts it aborts.
// (An earlier prose draft claimed the block would select the boot disk. This simulation disproved
// it: the BOOT skip fires first. Receipts outrank the model, including when the model is me.)
const MOCK_DISKUTIL = `#!/bin/sh
case "$1" in
  info)
    case "$2" in
      disk0) echo "   Device / Media Name: WDC WD10EACS-00D6B1"; echo "   Disk Size: 1.0 TB";;
      disk1) echo "   Device / Media Name: WDC WD10EAVS-00D7B1"; echo "   Disk Size: 1.0 TB";;
      disk2) echo "   Device / Media Name: WDC WD10EACS-00D6B1"; echo "   Disk Size: 1.0 TB";;
      disk3) echo "   Device / Media Name: CT1000MX500SSD1"; echo "   Disk Size: 1.0 TB";;
      disk4) echo "   Device / Media Name: Raid X"; echo "   Disk Size: 3.0 TB";;
      *) exit 1;;
    esac ;;
  appleRAID) echo "disk0s2"; echo "disk1s2"; echo "disk2s2"; echo "disk4";;
  coreStorage) echo "No CoreStorage logical volume groups found";;
  list) echo "(mock diskutil list)";;
  eraseDisk) echo "MOCK-ERASE-CALLED $@";;
  unmountDisk) echo "MOCK-UNMOUNT-CALLED $@";;
esac
`;
const MOCK_MOUNT = '#!/bin/sh\necho "/dev/disk3s2 on / (hfs, local, journaled)"\n';

export function simulateWipeBlock(): { out: string; status: number } {
  const dir = mkdtempSync(join(tmpdir(), 'lion-sim-'));
  writeFileSync(join(dir, 'diskutil'), MOCK_DISKUTIL, { mode: 0o755 });
  writeFileSync(join(dir, 'mount'), MOCK_MOUNT, { mode: 0o755 });
  // extract the heredoc body the block itself writes to /tmp/lion-ssd-wipe.sh
  const block = readFileSync('etc/lion-ssd-wipe.block', 'utf8').split('\n');
  const a = block.findIndex((l) => l.startsWith('cat > /tmp/lion-ssd-wipe.sh'));
  const b = block.findIndex((l) => l.trim() === 'WIPESH');
  if (a < 0 || b < 0) return { out: 'SIM-ERROR: could not extract the wipe script', status: -1 };
  const script = join(dir, 'wipe.sh');
  writeFileSync(script, block.slice(a + 1, b).join('\n'));
  const r = spawnSync('sh', [script], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ''}`, CONFIRM: '' },
  });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  rmSync(dir, { recursive: true, force: true });
  return { out, status: r.status ?? -1 };
}

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
  // The photo inventory must stay consistent with the guard set, or the two drift apart silently.
  check('inventory holds exactly one SSD', PHOTO_INVENTORY.filter((d) => /MX500/.test(d.sidebar)).length === 1);
  check('the only SSD is marked live boot',
    PHOTO_INVENTORY.some((d) => /MX500/.test(d.sidebar) && d.volume === 'start disk clone' && /LIVE BOOT/.test(d.role)));
  check('every inventory disk is erase=NEVER', PHOTO_INVENTORY.every((d) => d.erase.startsWith('NEVER')));
  check('three Raid X members recorded', PHOTO_INVENTORY.filter((d) => /member \d\/3/.test(d.role)).length === 3);
  check('Raid X redundancy recorded as NONE', RAID_X_REDUNDANCY.startsWith('NONE'));
  check('SSD identity flagged resolved', SSD_IDENTITY_RESOLVED === true);
  // measured, not assumed: the old wipe block must refuse on today's real disk set
  const sim = simulateWipeBlock();
  check('wipe-block sim: skips the boot SSD', /skip disk3 \(BOOT\) CT1000MX500SSD1/.test(sim.out));
  check('wipe-block sim: aborts with 0 candidates', /ABORT: selection is 0 SSD candidate/.test(sim.out));
  check('wipe-block sim: nonzero exit', sim.status === 1);
  check('wipe-block sim: never reached an erase', !/MOCK-ERASE-CALLED/.test(sim.out));
  check('wipe-block sim: all 3 RAID members skipped', (sim.out.match(/RAID\/CoreStorage member/g) ?? []).length === 4);
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
  console.log('\nPHYSICAL INVENTORY - operator Disk Utility photo 2026-09-17 (agent-memory seq 158):');
  for (const d of PHOTO_INVENTORY) console.log(`  ${d.sidebar.padEnd(24)} ${d.volume.padEnd(26)} ${d.role}\n${' '.repeat(26)}erase: ${d.erase}`);
  console.log(`\nRaid X redundancy: ${RAID_X_REDUNDANCY}`);
  console.log('SSD IDENTITY: RESOLVED. The only SSD (CT1000MX500SSD) IS the live boot disk.');
  console.log('=> "wipe the SSD" has NO executable target: 4 bays, 4 disks, zero free. Not a refusal - arithmetic.');
  console.log('=> To free the SSD the boot must first move OFF it (clone to Raid X or a new disk), or new media is added.');
}

const cmd = process.argv[2] ?? 'selftest';
if (cmd === 'emit') {
  for (const [path, gen] of OUTPUTS) {
    writeFileSync(path, gen());
    console.log(`WROTE ${path}`);
  }
} else if (cmd === 'guards') guards();
else if (cmd === 'sim') {
  const r = simulateWipeBlock();
  console.log(r.out.trimEnd());
  console.log(`EXIT=${r.status}`);
  console.log(r.status === 1 && !/MOCK-ERASE-CALLED/.test(r.out)
    ? 'WIPE_BLOCK_SIM=SAFE (refused: boot skipped, 0 candidates, no erase reached)'
    : 'WIPE_BLOCK_SIM=UNSAFE - investigate before any paste');
}
else if (cmd === 'selftest') selftest();
else {
  console.log('usage: node tools/lion-disk-plan.ts <emit|guards|sim|selftest>');
  process.exit(1);
}
