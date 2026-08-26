#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function run(command: string, args: string[]): void {
  console.log(`$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit' });
}

for (const name of readdirSync('tools').filter((x) => x.endsWith('.ts')).sort()) run('node', ['--check', join('tools', name)]);
run('python3', ['-m', 'json.tool', 'MASTER.md']);
run('node', ['tools/orient.ts', 'orient']);
run('node', ['tools/agent-deploy.ts', '--objective=tool self test']);
run('node', ['tools/recovery-research.ts', '--plan']);
run('node', ['tools/web-scrape.ts', '--max=80', 'README.md']);
console.log('id -u\ndf -h /\nls -l MASTER.md\n');
execFileSync('node tools/paste-proof.ts --target-console --root', { input: 'id -u\ndf -h /\nls -l MASTER.md\n', stdio: ['pipe', 'inherit', 'inherit'], shell: true });
console.log('TEST_ALL=PASS');
