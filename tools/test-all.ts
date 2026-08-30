#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function run(command: string, args: string[]): void {
  console.log(`$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit' });
}

// deterministic-tool gate: every workflow answer comes from a tool, never from prose memory
for (const name of readdirSync('tools').filter((x) => x.endsWith('.ts')).sort()) run('node', ['--check', join('tools', name)]);
for (const name of readdirSync('tools/lib').filter((x) => x.endsWith('.ts')).sort()) run('node', ['--check', join('tools/lib', name)]);
run('python3', ['-m', 'json.tool', 'MASTER.md']);
run('node', ['tools/cmd.ts', 'selftest']);
run('node', ['tools/cmd.ts', 'check']);
run('node', ['tools/orient.ts', 'orient']);
run('node', ['tools/next-gate.ts']);
run('node', ['tools/agent-deploy.ts', '--objective=tool self test']);
run('node', ['tools/recovery-research.ts', '--plan']);
// GPU OC lab: model, planner, receipt parser, verdict engine, and the target-facing applier
run('node', ['tools/gpu-oc-plan.ts', 'selftest']);
run('node', ['tools/gpu-curve.ts', 'selftest']);
run('node', ['tools/gpu-bench-parse.ts', 'selftest']);
run('node', ['tools/gpu-oc-verify.ts', 'selftest']);
run('bash', ['-n', 'scripts/gpu-oc-apply']);
run('bash', ['-n', 'scripts/gpu-dmon-summary']);
run('bash', ['-n', 'scripts/cpu-park-ctrl']);
run('bash', ['-n', 'scripts/rgb-omen']);
// every cmd_* in a target script must actually be reachable from its dispatcher
run('node', ['tools/script-dispatch-check.ts', 'scripts/gpu-oc-apply']);
run('node', ['tools/script-dispatch-check.ts', 'scripts/cpu-park-ctrl']);
run('node', ['tools/script-dispatch-check.ts', 'scripts/rgb-omen']);
// CPU OC tally: ledger + gate verdicts (real ledger validates JSON shape in CI)
run('node', ['tools/cpu-oc-tally.ts']);
run('node', ['tools/cpu-oc-tally.ts', 'selftest']);
// DDR4 lab: 3733 baseline -> 4000 MT/s target, with the ZFS integrity gate
run('node', ['tools/ram-oc-plan.ts', 'selftest']);
run('node', ['tools/ram-validate-parse.ts', 'selftest']);
run('bash', ['-n', 'scripts/ram-validate']);
run('node', ['tools/web-scrape.ts', '--max=80', 'README.md']);
execFileSync('node tools/paste-proof.ts --target-console --root', { input: 'id -u\ndf -h /\nls -l MASTER.md\n', stdio: ['pipe', 'inherit', 'inherit'], shell: true });
console.log('TEST_ALL=PASS');
