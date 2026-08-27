#!/usr/bin/env node
import { readFileSync } from 'node:fs';

type Agent = { id: string; task: string; method: string; inputs: string[]; output: string; gate: string };

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((x) => x.startsWith(prefix))?.slice(prefix.length);
}

function fileLines(path: string): string[] {
  try { return readFileSync(path, 'utf8').split(/\r?\n/).map((x) => x.trim()).filter(Boolean); }
  catch { return []; }
}

const objective = arg('objective') ?? 'activeObjective from MASTER.md';
const urls = [...fileLines(arg('urls') ?? ''), ...(arg('url') ? [arg('url') as string] : [])];
const hypotheses = fileLines(arg('hypotheses') ?? '');
const verify = fileLines(arg('verify') ?? '');
const agents: Agent[] = [];

agents.push({ id: 'context', task: `Reduce ${objective} to current facts and missing gates`, method: 'read README.md, MASTER.md, ToDo.md, git state', inputs: ['README.md', 'MASTER.md', 'ToDo.md', 'git status'], output: 'fact list with receipts only', gate: 'no claim without path/hash/output' });
agents.push({ id: 'gate', task: 'Current objective gate plus command-registry state', method: 'node tools/next-gate.ts; node tools/cmd.ts check; node tools/cmd.ts list', inputs: ['MASTER.md', 'commands/registry.json'], output: 'ordered live gates plus registry integrity verdict', gate: 'every command quoted in chat must resolve through ?(name) from the registry; unregistered means register first' });
for (const [i, url] of urls.entries()) agents.push({ id: `web-${i + 1}`, task: `Scrape and summarize source ${url}`, method: 'node tools/web-scrape.ts URL', inputs: [url], output: 'source facts plus URL receipt', gate: 'source fetched and quoted, or marked unavailable' });
for (const [i, h] of hypotheses.entries()) agents.push({ id: `hypothesis-${i + 1}`, task: h, method: 'prove or falsify one hypothesis only', inputs: ['repo', 'target transcript if provided'], output: 'pass/fail/unknown with receipt', gate: 'unknown is allowed; guessing is fail' });
for (const [i, v] of verify.entries()) agents.push({ id: `verify-${i + 1}`, task: `Verify command block ${v}`, method: 'node tools/paste-proof.ts --target-console --root FILE', inputs: [v], output: 'lint and syntax result', gate: 'PASTE_PROOF=PASS before operator paste' });

console.log(JSON.stringify({ objective, agentCount: agents.length, agents }, null, 2));
