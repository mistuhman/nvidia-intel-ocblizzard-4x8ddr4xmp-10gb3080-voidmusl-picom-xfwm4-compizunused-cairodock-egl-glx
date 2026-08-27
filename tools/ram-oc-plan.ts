#!/usr/bin/env node
// DDR4 OC planner for 4x8GB @ 2DPC on a 12700KF (rated DDR4-3200, lower at 4 DIMMs) with ZFS root.
// The binding limit is the CPU memory controller, not the DIMMs, and the failure mode is SILENT
// CORRUPTION, not a crash. So every step here carries a validation suite and an inverse, and no step
// is "stable" until the suite passes end to end.
//
// Receipts this is built on (MASTER durableFacts / lessons):
//   - live baseline XMP 3733 @1.35V, itself NEVER formally validated
//   - 4000 @1.50V BOOTED once but was never stability-validated -> marginal-unproven, not known-good
//   - 1.55V FAILED TO BOOT -> hard ceiling 1.50V, do not repeat
//   - 4 DIMMs 2DPC: more VDIMM does not fix IMC marginality
import { arg, flag } from './lib/gpu-model.ts';

const USAGE = `usage:
  node tools/ram-oc-plan.ts ladder [--json]
  node tools/ram-oc-plan.ts step --id=r3 [--json]
  node tools/ram-oc-plan.ts suite --id=r3 [--hours=8]
  node tools/ram-oc-plan.ts selftest`;

const VDIMM_HARD_MAX = 1.5;   // receipt: 1.55V did not boot
const RATED_MTS = 3200;       // 12700KF JEDEC rating; 2DPC derates it further

type Step = {
  id: string;
  mts: number;
  vdimm: number;
  gear: 1 | 2;
  commandRate: '1T' | '2T';
  timings: string;
  vccsa: string;
  bios: string[];
  why: string;
  inverse: string;
};

const LADDER: Step[] = [
  {
    id: 'r0', mts: 3733, vdimm: 1.35, gear: 2, commandRate: '2T', timings: 'XMP profile 1 as-shipped',
    vccsa: 'auto (do not touch yet)',
    bios: ['Advanced > Memory > XMP Profile 1', 'confirm 3733 MT/s and 1.35V are what the board reports', 'no remnant of the old 4000 custom profile'],
    why: 'the live baseline has NEVER been formally validated. A booted profile is not a stable profile, and on ZFS root an unvalidated baseline poisons every comparison after it.',
    inverse: 'none needed - this IS the fallback state',
  },
  {
    id: 'r1', mts: 3800, vdimm: 1.35, gear: 2, commandRate: '2T', timings: 'XMP primaries, tREFI/tRFC auto',
    vccsa: 'auto',
    bios: ['Advanced > Memory > Custom', 'Frequency 3800', 'VDIMM 1.35 (unchanged)', 'leave primaries at the XMP values'],
    why: 'smallest real step past the validated baseline; separates "the IMC is at its edge at 3733" from "there is headroom".',
    inverse: 'reload XMP profile 1 (3733/1.35V)',
  },
  {
    id: 'r2', mts: 3866, vdimm: 1.4, gear: 2, commandRate: '2T', timings: 'XMP primaries, +1 on tCL if it will not train',
    vccsa: 'auto; if training fails twice, +0.05 VCCSA and stop there',
    bios: ['Frequency 3866', 'VDIMM 1.40', 'tCL +1 only if the board refuses to train'],
    why: 'first voltage bump. 1.40V is unremarkable for DDR4 B-die-class sticks and still far from the 1.50V ceiling.',
    inverse: 'back to r1 (3800/1.35V); if it will not POST, clear CMOS and reload XMP',
  },
  {
    id: 'r3', mts: 4000, vdimm: 1.45, gear: 2, commandRate: '2T', timings: 'XMP primaries, tCL +1..+2 expected',
    vccsa: 'auto first; +0.05 only if training fails',
    bios: ['Frequency 4000', 'VDIMM 1.45', 'Gear 2', 'Command Rate 2T', 'tCL +1'],
    why: 'the operator target. 4000 at 2DPC is above what this IMC is rated for, so it is a candidate, not an expectation - the suite decides.',
    inverse: 'back to r2 (3866/1.40V); on no-POST, clear CMOS (jumper receipt already known-good) and reload XMP',
  },
  {
    id: 'r4', mts: 4000, vdimm: 1.5, gear: 2, commandRate: '2T', timings: 'XMP primaries, tCL +2, tRCD/tRP +1',
    vccsa: '+0.05 max',
    bios: ['Frequency 4000', 'VDIMM 1.50 - THE CEILING', 'tCL +2', 'tRCD/tRP +1'],
    why: 'last legal attempt at 4000. This is the profile that once booted and was never validated; treat it as unproven, not as a known-good return point.',
    inverse: 'back to r3, then r2. NEVER go to 1.55V - that already failed to boot (receipt).',
  },
];

// Escalating suite: cheap tests first, the ZFS integrity gate last because it is the slow one.
function suite(step: Step, hours: number): string[] {
  return [
    `1. POST + boot, then confirm the board actually applied it: dmidecode reports Configured Memory Speed ${step.mts} MT/s (a booted profile that trained DOWN is a silent failure)`,
    '2. 20 min stress-ng --vm 12 --vm-bytes 80% --vm-method all --verify: fastest way to catch a profile that is plainly broken',
    '3. 1 h memtester-style pass (stress-ng --vm-method all --verify, or memtester if installed): catches the marginal bit flips the 20 min run misses',
    '4. zpool scrub on the root pool, then zpool status: ZERO checksum errors. THIS is the gate that matters on ZFS root - a memory OC failure here shows up as data damage, not a crash',
    `5. ${hours} h of ordinary daily use with the profile live, then a second scrub`,
    '6. dmesg clean of MCE / EDAC / hardware error lines across all of the above',
  ];
}

function risk(step: Step): { score: number; band: 'low' | 'medium' | 'high' | 'severe'; notes: string[] } {
  const notes: string[] = [];
  let score = 0;
  const overRated = ((step.mts - RATED_MTS) / RATED_MTS) * 100;
  score += overRated;
  notes.push(`${Math.round(overRated)}% over the 12700KF's rated ${RATED_MTS} MT/s`);
  score += (step.vdimm - 1.35) * 100;
  if (step.vdimm > 1.35) notes.push(`+${((step.vdimm - 1.35) * 1000).toFixed(0)} mV over the shipped 1.35V`);
  score += 10; // 4 DIMMs, 2 DIMMs per channel: the IMC never likes it
  notes.push('4x8 at 2DPC: the memory controller, not the DIMMs, is the binding limit');
  if (step.mts >= 4000) notes.push('ZFS root: validate with a scrub before trusting any write made under this profile');
  const band = score < 20 ? 'low' : score < 30 ? 'medium' : score < 40 ? 'high' : 'severe';
  return { score: Math.round(score), band, notes };
}

function assertLegal(step: Step): void {
  if (step.vdimm > VDIMM_HARD_MAX) throw new Error(`${step.id} exceeds the ${VDIMM_HARD_MAX}V hard ceiling: 1.55V already failed to boot on this board`);
}

function findStep(id: string): Step {
  const step = LADDER.find((s) => s.id === id);
  if (!step) throw new Error(`unknown step: ${id} (have ${LADDER.map((s) => s.id).join(', ')})`);
  return step;
}

function ladder(): void {
  for (const s of LADDER) assertLegal(s);
  if (flag('json')) {
    console.log(JSON.stringify({ vdimmHardMax: VDIMM_HARD_MAX, ratedMts: RATED_MTS, steps: LADDER.map((s) => ({ ...s, risk: risk(s) })) }, null, 2));
    return;
  }
  console.log('DDR4 4x8 2DPC ladder — XMP 3733 baseline to the 4000 MT/s target (12700KF, ZFS root)');
  console.log('id\tMT/s\tVDIMM\tgear\tCR\trisk\tband\twhy');
  for (const s of LADDER) {
    const r = risk(s);
    console.log([s.id, s.mts, s.vdimm.toFixed(3), s.gear, s.commandRate, r.score, r.band, s.why.slice(0, 64)].join('\t'));
  }
  console.log('');
  console.log(`HARD RULES: VDIMM <= ${VDIMM_HARD_MAX}V (1.55V already failed to boot). One knob per power-on. No step is stable until its suite passes.`);
  console.log('ORDER: r0 must pass its own suite before r1 is worth running - an unvalidated baseline makes every later comparison meaningless.');
}

function step(): void {
  const s = findStep(arg('id', 'r0') as string);
  assertLegal(s);
  const r = risk(s);
  if (flag('json')) {
    console.log(JSON.stringify({ ...s, risk: r, suite: suite(s, Number(arg('hours', '8'))) }, null, 2));
    return;
  }
  console.log(`STEP ${s.id}: ${s.mts} MT/s @ ${s.vdimm}V, Gear ${s.gear}, ${s.commandRate}`);
  console.log(`timings: ${s.timings}`);
  console.log(`vccsa: ${s.vccsa}`);
  console.log(`risk: ${r.score} (${r.band})`);
  for (const n of r.notes) console.log(`  - ${n}`);
  console.log('why:');
  console.log(`  ${s.why}`);
  console.log('BIOS keying (F10, operator-only, one power-on):');
  for (const b of s.bios) console.log(`  - ${b}`);
  console.log('validation suite (all of it, in order):');
  for (const line of suite(s, Number(arg('hours', '8')))) console.log(`  ${line}`);
  console.log('INVERSE:');
  console.log(`  ${s.inverse}`);
}

function suiteOnly(): void {
  const s = findStep(arg('id', 'r0') as string);
  for (const line of suite(s, Number(arg('hours', '8')))) console.log(line);
}

function selftest(): void {
  for (const s of LADDER) assertLegal(s);
  if (LADDER[0].id !== 'r0' || LADDER[0].mts !== 3733) throw new Error('the ladder must start by validating the live 3733 baseline');
  if (LADDER.some((s) => s.vdimm > VDIMM_HARD_MAX)) throw new Error('a step exceeds the 1.50V ceiling');
  const target = findStep('r3');
  if (target.mts !== 4000) throw new Error('the 4000 MT/s target is missing');
  if (risk(findStep('r4')).score <= risk(findStep('r0')).score) throw new Error('risk must climb with frequency and voltage');
  if (!suite(target, 8).some((x) => x.includes('zpool scrub'))) throw new Error('the ZFS integrity gate is mandatory on this root pool');
  if (!suite(target, 8).some((x) => x.includes('Configured Memory Speed'))) throw new Error('a profile that trains down must be caught');
  let threw = false;
  try { assertLegal({ ...target, vdimm: 1.55 }); } catch { threw = true; }
  if (!threw) throw new Error('1.55V must be refused');
  console.log(`steps=${LADDER.map((s) => s.id).join(',')} target=r3 4000MT/s risk=${risk(target).score}`);
  console.log('RAM_OC_PLAN=PASS');
}

const command = process.argv[2] ?? '';
try {
  if (command === 'ladder') ladder();
  else if (command === 'step') step();
  else if (command === 'suite') suiteOnly();
  else if (command === 'selftest') selftest();
  else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (error) {
  console.error(`RAM_OC_PLAN=FAIL ${(error as Error).message}`);
  process.exit(1);
}
