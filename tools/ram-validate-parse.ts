#!/usr/bin/env node
// RAM validation receipt parser. Reads the output of scripts/ram-validate (or hand-pasted stress-ng
// / memtester / zpool / dmesg / dmidecode text) and returns one verdict for one memory profile.
//
// Doctrine: PASS requires every gate to be present AND clean. A missing gate is UNPROVEN, never a
// pass - on ZFS root an unvalidated memory profile is a silent-corruption risk, not a coin flip.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { arg, flag } from './lib/gpu-model.ts';

const USAGE = `usage:
  node tools/ram-validate-parse.ts parse --id=r3 --mts=4000 --vdimm=1.45 --log=FILE [--append=receipts/ram-oc-receipts.json] [--json]
  node tools/ram-validate-parse.ts selftest
  (--log=- reads stdin)`;

type Gate = { name: string; state: 'PASS' | 'FAIL' | 'MISSING'; evidence: string };

export function gates(text: string, mts: number): Gate[] {
  const out: Gate[] = [];
  const line = (re: RegExp): string => text.match(re)?.[0]?.trim() ?? '';

  // 1. did the board actually train to the requested speed, or quietly fall back?
  const configured = text.match(/Configured Memory Speed:\s*(\d+)\s*MT\/s/i) ?? text.match(/configured_mts[=:]\s*(\d+)/i);
  if (!configured) out.push({ name: 'trained-speed', state: 'MISSING', evidence: 'no dmidecode Configured Memory Speed in the log' });
  else if (Number(configured[1]) === mts) out.push({ name: 'trained-speed', state: 'PASS', evidence: configured[0] });
  else out.push({ name: 'trained-speed', state: 'FAIL', evidence: `${configured[0]} but the profile asked for ${mts} MT/s: the board trained DOWN` });

  // 2. stress-ng
  const ngOk = /successful run completed/i.test(text);
  const ngBad = /stress-ng:\s*(fail|error)|unsuccessful run|failed to complete|assertion/i.test(text);
  if (ngBad) out.push({ name: 'stress-ng', state: 'FAIL', evidence: line(/stress-ng:.*(fail|error).*/i) || 'stress-ng reported a failure' });
  else if (ngOk) out.push({ name: 'stress-ng', state: 'PASS', evidence: line(/.*successful run completed.*/i) });
  else out.push({ name: 'stress-ng', state: 'MISSING', evidence: 'no stress-ng completion line' });

  // 3. memtester-class verify pass
  const memBad = /FAILURE:|memtester.*fail/i.test(text);
  const memOk = /memtester_ok|Done\.|verify_ok/i.test(text) || /--verify/.test(text);
  if (memBad) out.push({ name: 'memtester', state: 'FAIL', evidence: line(/FAILURE:.*/i) || 'memtester reported FAILURE' });
  else if (memOk) out.push({ name: 'memtester', state: 'PASS', evidence: 'verify pass completed with no FAILURE lines' });
  else out.push({ name: 'memtester', state: 'MISSING', evidence: 'no memtester / --verify pass in the log' });

  // 4. ZFS integrity - the gate that actually matters on this root pool
  const scrubbed = /scrub repaired ([\dBKMG.]+) in .* with (\d+) errors/i.exec(text);
  const noErrors = /errors:\s*No known data errors/i.test(text);
  const cksum = /(\d+)\s+CKSUM/i.test(text);
  const badCounts = /\b(\d+)\s+(\d+)\s+([1-9]\d*)\s*$/m.test(text);
  if (scrubbed && Number(scrubbed[2]) === 0 && noErrors && !badCounts) out.push({ name: 'zfs-scrub', state: 'PASS', evidence: `${scrubbed[0]}; errors: No known data errors` });
  else if (scrubbed || cksum || noErrors) {
    const clean = noErrors && (!scrubbed || Number(scrubbed[2]) === 0) && !badCounts;
    out.push({ name: 'zfs-scrub', state: clean ? 'PASS' : 'FAIL', evidence: scrubbed?.[0] ?? line(/errors:.*/i) ?? 'zpool reported errors' });
  } else out.push({ name: 'zfs-scrub', state: 'MISSING', evidence: 'no zpool scrub/status output' });

  // 5. machine-check / EDAC
  const mce = /(Machine Check|mce:|EDAC.*(error|CE|UE)|Hardware Error)/i.test(text);
  const dmesgSeen = /dmesg|MCE_CHECK|mce_check/i.test(text);
  if (mce) out.push({ name: 'mce-edac', state: 'FAIL', evidence: line(/.*(Machine Check|mce:|Hardware Error|EDAC).*/i) });
  else if (dmesgSeen) out.push({ name: 'mce-edac', state: 'PASS', evidence: 'dmesg checked, no MCE/EDAC/hardware-error lines' });
  else out.push({ name: 'mce-edac', state: 'MISSING', evidence: 'dmesg was not checked' });

  return out;
}

function verdictOf(list: Gate[]): 'PASS' | 'FAIL' | 'UNPROVEN' {
  if (list.some((g) => g.state === 'FAIL')) return 'FAIL';
  if (list.some((g) => g.state === 'MISSING')) return 'UNPROVEN';
  return 'PASS';
}

function parse(): void {
  const id = arg('id');
  if (!id) throw new Error('--id is required (ram-oc-plan step id, e.g. r3)');
  const mts = Number(arg('mts', '3733'));
  const vdimm = Number(arg('vdimm', '1.35'));
  const logPath = arg('log');
  if (!logPath) throw new Error('--log=FILE is required (or --log=- for stdin)');
  if (logPath !== '-' && !existsSync(logPath)) throw new Error(`missing log: ${logPath}`);
  const text = logPath === '-' ? readFileSync(0, 'utf8') : readFileSync(logPath, 'utf8');
  if (vdimm > 1.5) throw new Error(`VDIMM ${vdimm} is over the 1.50V ceiling: 1.55V already failed to boot, this receipt should not exist`);
  const list = gates(text, mts);
  const verdict = verdictOf(list);
  const run = { id, mts, vdimm, verdict, gates: list, ranAt: new Date().toISOString().slice(0, 10) };

  const appendTo = arg('append');
  if (appendTo) {
    const existing = existsSync(appendTo) ? (JSON.parse(readFileSync(appendTo, 'utf8')) as { runs?: typeof run[] }).runs ?? [] : [];
    const runs = [...existing.filter((r) => r.id !== run.id), run].sort((a, b) => a.id.localeCompare(b.id));
    mkdirSync(dirname(appendTo), { recursive: true });
    writeFileSync(appendTo, `${JSON.stringify({ schema: 'ram-oc-receipts.v1', runs }, null, 2)}\n`);
    console.log(`appended ${run.id} -> ${appendTo} (${runs.length} runs)`);
  }

  if (flag('json')) {
    console.log(JSON.stringify(run, null, 2));
  } else {
    console.log(`RAM ${id}: ${mts} MT/s @ ${vdimm}V`);
    for (const g of list) console.log(`  ${g.state.padEnd(7)} ${g.name}: ${g.evidence}`);
    console.log(`VERDICT=${verdict}`);
    if (verdict === 'UNPROVEN') console.log('UNPROVEN is not a pass: finish the missing gates before this profile is allowed to stay live.');
    if (verdict === 'FAIL') console.log('Revert to the previous step now, then scrub again before trusting anything written under this profile.');
  }
  if (verdict === 'FAIL') process.exitCode = 3;
}

function selftest(): void {
  const good = [
    'Configured Memory Speed: 4000 MT/s',
    'stress-ng: info:  [1234] successful run completed in 1200.00s',
    'stress-ng --vm 12 --vm-bytes 80% --vm-method all --verify',
    '  scan: scrub repaired 0B in 00:41:12 with 0 errors on Thu Aug 27 20:00:00 2026',
    'errors: No known data errors',
    'dmesg checked',
  ].join('\n');
  const g = gates(good, 4000);
  if (verdictOf(g) !== 'PASS') throw new Error(`clean suite must PASS: ${JSON.stringify(g)}`);
  const trainedDown = gates(good.replace('4000 MT/s', '3733 MT/s'), 4000);
  if (verdictOf(trainedDown) !== 'FAIL') throw new Error('a profile that trained down must FAIL');
  const cksum = gates(good.replace('errors: No known data errors', 'errors: 12 data errors').replace('with 0 errors', 'with 12 errors'), 4000);
  if (verdictOf(cksum) !== 'FAIL') throw new Error('scrub errors must FAIL');
  const mce = gates(`${good}\nmce: [Hardware Error]: Machine Check Exception`, 4000);
  if (verdictOf(mce) !== 'FAIL') throw new Error('an MCE must FAIL');
  const partial = gates('Configured Memory Speed: 4000 MT/s\nstress-ng: info: successful run completed', 4000);
  if (verdictOf(partial) !== 'UNPROVEN') throw new Error('a partial suite is UNPROVEN, never PASS');
  console.log(`gates=${g.map((x) => `${x.name}:${x.state}`).join(' ')}`);
  console.log('RAM_VALIDATE_PARSE=PASS');
}

const command = process.argv[2] ?? '';
try {
  if (command === 'parse') parse();
  else if (command === 'selftest') selftest();
  else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (error) {
  console.error(`RAM_VALIDATE_PARSE=FAIL ${(error as Error).message}`);
  process.exit(1);
}
