#!/usr/bin/env node
// Baseline test gate: syntax, MASTER JSON validity, every tool, block hygiene, and the
// paste-proof round trip. Deterministic order; fails fast with nonzero exit.
// This is the gate CI runs (ci/workflows/agent-baseline-ci.yml).
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function run(command: string, args: string[]): void {
  console.log(`$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit' });
}

// syntax: every tool must at least parse
for (const name of readdirSync('tools').filter((x) => x.endsWith('.ts')).sort()) run('node', ['--check', join('tools', name)]);
// MASTER.md is machine-readable JSON, not prose
run('python3', ['-m', 'json.tool', 'MASTER.md']);
// deterministic tools: every workflow answer comes from a tool, never from prose memory
run('node', ['tools/orient.ts', 'orient']);
run('node', ['tools/next-gate.ts']);
run('node', ['tools/agent-deploy.ts', '--objective=baseline self test']);
// target-script convention: every cmd_* reachable, every label has a function
run('bash', ['-n', 'scripts/sample-target']);
run('node', ['tools/script-dispatch-check.ts', 'scripts/sample-target']);
// agentic memory ledger: add/list/check/hash integrity
run('node', ['tools/agent-memory.ts', 'selftest']);
// block hygiene on the convention sample (root + strict console)
run('node', ['tools/block-lint.ts', '--root', 'etc/sample.block']);
run('node', ['tools/block-lint.ts', '--target-console', '--root', 'etc/sample.block']);
// research tool against a local file (offline-safe)
run('node', ['tools/web-scrape.ts', '--max=80', 'README.md']);
// PR line budget
run('node', ['tools/pr-budget.ts', 'main', '405']);
// paste proof round trip on a known-good block
execFileSync('node tools/paste-proof.ts --target-console --root', { input: 'id -u\ndf -h /\nls -l MASTER.md\n', stdio: ['pipe', 'inherit', 'inherit'], shell: true });
console.log('TEST_ALL=PASS');
