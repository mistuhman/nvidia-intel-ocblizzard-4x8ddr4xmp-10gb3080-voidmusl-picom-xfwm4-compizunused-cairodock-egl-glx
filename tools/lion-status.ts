#!/usr/bin/env node
// Deterministic Lion SSD workflow printer. Same JSON bytes -> same stdout.
// Usage:
//   node tools/lion-status.ts
//   node tools/lion-status.ts selftest
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const WORKFLOW = 'docs/lion-workflow.json';

type Link = { type: string; url: string; dest?: string; job?: string; why?: string };
type Volume = { name: string; role: string; erase: string; lastNode?: string };
type Tool = { path: string; run: string; job: string };
type Workflow = {
  updated: string;
  session: string;
  machine: string;
  goal: string;
  nextAction: string;
  lastVerifiedBless?: { blessedFile: string; blessedFileDate: string; finderinfoFileId: number };
  volumes: Volume[];
  links: {
    currentZip: Link;
    branchZip: Link;
    attachPage: Link;
    logInbox: Link;
    withdrawn: Link[];
  };
  helper: { command: string; zip: string; job: string; doesNot: string[]; slTest: string; report: string };
  tools: Tool[];
  doNot: string[];
};

function load(): Workflow {
  if (!existsSync(WORKFLOW)) {
    console.error(`missing ${WORKFLOW}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(WORKFLOW, 'utf8')) as Workflow;
}

function printStatus(w: Workflow): void {
  const lines: string[] = [];
  const p = (s: string) => lines.push(s);
  p('LION_STATUS');
  p(`updated: ${w.updated}`);
  p(`session: ${w.session}`);
  p(`machine: ${w.machine}`);
  p(`goal: ${w.goal}`);
  p(`nextAction: ${w.nextAction}`);
  if (w.lastVerifiedBless) {
    p('lastVerifiedBless:');
    p(`  file: ${w.lastVerifiedBless.blessedFile}`);
    p(`  date: ${w.lastVerifiedBless.blessedFileDate}`);
    p(`  finderinfo: ${w.lastVerifiedBless.finderinfoFileId}`);
  }
  p('volumes:');
  for (const v of w.volumes) {
    p(`  - ${v.name} | ${v.lastNode ?? '?'} | ${v.role} | erase=${v.erase}`);
  }
  p('links:');
  p(`  currentZip: ${w.links.currentZip.url} -> ${w.links.currentZip.dest ?? ''}`);
  p(`  branchZip: ${w.links.branchZip.url}`);
  p(`  attachPage: ${w.links.attachPage.url}`);
  p(`  logInbox: ${w.links.logInbox.url}`);
  p('withdrawn:');
  const withdrawn = [...w.links.withdrawn].sort((a, b) => a.type.localeCompare(b.type));
  for (const x of withdrawn) p(`  - ${x.type} ${x.url} :: ${x.why ?? ''}`);
  p(`helper: ${w.helper.command} in ${w.helper.zip}`);
  p(`helper.job: ${w.helper.job}`);
  p(`helper.doesNot: ${w.helper.doesNot.join(', ')}`);
  p(`slTest: ${w.helper.slTest}`);
  p('tools:');
  for (const t of [...w.tools].sort((a, b) => a.path.localeCompare(b.path))) {
    p(`  - ${t.run}`);
  }
  p('doNot:');
  for (const d of w.doNot) p(`  - ${d}`);
  process.stdout.write(lines.join('\n') + '\n');
}

function selftest(w: Workflow): void {
  let failed = 0;
  const fail = (id: string, msg: string) => {
    failed += 1;
    console.log(`FAIL ${id} ${msg}`);
  };
  const pass = (id: string, msg: string) => console.log(`PASS ${id} ${msg}`);

  const required = ['updated', 'session', 'machine', 'goal', 'nextAction', 'volumes', 'links', 'helper', 'tools', 'doNot'] as const;
  for (const k of required) {
    if (!(k in w) || (w as Record<string, unknown>)[k] == null) fail(`key-${k}`, 'missing');
    else pass(`key-${k}`, 'present');
  }
  if (!w.links?.currentZip?.url?.includes('da.gd/lzr')) fail('link-lzr', String(w.links?.currentZip?.url));
  else pass('link-lzr', w.links.currentZip.url);
  if (!w.links?.branchZip?.url?.includes('da.gd/lmz')) fail('link-lmz', String(w.links?.branchZip?.url));
  else pass('link-lmz', w.links.branchZip.url);
  if (!w.links?.attachPage?.url?.includes('da.gd/lpg')) fail('link-lpg', String(w.links?.attachPage?.url));
  else pass('link-lpg', w.links.attachPage.url);
  const withdrawnTypes = (w.links.withdrawn ?? []).map((x) => x.type).sort();
  if (!withdrawnTypes.includes('da.gd/lionfix')) fail('withdrawn-lionfix', withdrawnTypes.join(','));
  else pass('withdrawn-lionfix', 'listed');
  if (!withdrawnTypes.includes('da.gd/lup')) fail('withdrawn-lup', withdrawnTypes.join(','));
  else pass('withdrawn-lup', 'listed');
  if (!existsSync(w.helper.command)) fail('helper-command', w.helper.command);
  else pass('helper-command', w.helper.command);
  if (!existsSync(w.helper.zip)) fail('helper-zip', w.helper.zip);
  else pass('helper-zip', w.helper.zip);
  const cmd = readFileSync(w.helper.command, 'utf8');
  if (/Erase Bay 4/.test(cmd)) fail('no-erase-bay4', 'Erase Bay 4 still in helper');
  else pass('no-erase-bay4', 'absent');
  if (/\basr\b/.test(cmd)) fail('no-asr', 'asr token in helper');
  else pass('no-asr', 'absent');
  if (!/bless --folder/.test(cmd) || !/--file/.test(cmd)) fail('bless-file', 'need bless --folder and --file');
  else pass('bless-file', 'volume-root bless');
  if (!w.doNot.some((d) => /lionfix/i.test(d))) fail('donot-lionfix', 'doNot missing lionfix');
  else pass('donot-lionfix', 'present');
  if (!w.doNot.some((d) => /Lion SSD Base/.test(d))) fail('donot-base', 'doNot missing Lion SSD Base');
  else pass('donot-base', 'present');
  const n = spawnSync('bash', ['-n', w.helper.command], { encoding: 'utf8' });
  if (n.status !== 0) fail('bash-n', n.stderr);
  else pass('bash-n', 'ok');

  if (failed) {
    console.log(`LION_STATUS_SELFTEST=FAIL count=${failed}`);
    process.exit(1);
  }
  console.log('LION_STATUS_SELFTEST=PASS');
}

function main(): void {
  const w = load();
  const mode = process.argv[2] ?? 'print';
  if (mode === 'selftest') selftest(w);
  else if (mode === 'print' || mode === undefined) printStatus(w);
  else {
    console.error('usage: node tools/lion-status.ts [print|selftest]');
    process.exit(2);
  }
}

main();
