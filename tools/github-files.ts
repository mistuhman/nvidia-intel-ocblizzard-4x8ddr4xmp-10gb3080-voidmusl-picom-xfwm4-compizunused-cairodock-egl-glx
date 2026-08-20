#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function run(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function ownerRepoFromOrigin(origin: string): string {
  const cleaned = origin.replace(/\.git$/, '');
  const ssh = cleaned.match(/github\.com[:/]([^/]+\/[^/]+)$/);
  if (ssh) return ssh[1];
  const https = cleaned.match(/github\.com\/([^/]+\/[^/]+)$/);
  if (https) return https[1];
  throw new Error(`cannot parse GitHub origin: ${origin}`);
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

function main(): void {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error('usage: node tools/github-files.ts README.md MASTER.md tools/orient.ts');
    process.exit(2);
  }
  const origin = run('git', ['config', '--get', 'remote.origin.url']);
  const ownerRepo = ownerRepoFromOrigin(origin);
  const branch = run('git', ['branch', '--show-current']);
  const ref = branch;
  for (const path of paths) {
    if (!existsSync(path)) {
      console.log(`MISSING\t${path}`);
      continue;
    }
    const encodedPath = encodePath(path);
    console.log(`FILE\t${path}`);
    console.log(`blob\thttps://github.com/${ownerRepo}/blob/${ref}/${encodedPath}`);
    console.log(`raw\thttps://raw.githubusercontent.com/${ownerRepo}/${ref}/${encodedPath}`);
  }
}

main();
