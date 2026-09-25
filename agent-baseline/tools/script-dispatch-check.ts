#!/usr/bin/env node
// Guard for the bug that cost a wave: a cmd_* function existed in a target script but the case
// dispatcher never routed to it, so the subcommand silently printed usage. Every cmd_NAME must be
// reachable, and every case label must have a function.
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node tools/script-dispatch-check.ts FILE...');
  process.exit(2);
}
const errors: string[] = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const funcs = [...text.matchAll(/^cmd_([a-z_]+)\(\)/gm)].map((m) => m[1]).sort();
  const dispatchBlock = text.slice(text.indexOf('case "$action" in'));
  for (const fn of funcs) {
    if (!new RegExp(`cmd_${fn}\\b`).test(dispatchBlock)) errors.push(`${file}: cmd_${fn} is defined but never dispatched`);
  }
  const labels = [...dispatchBlock.matchAll(/^([a-z][a-z-]*)\)/gm)].map((m) => m[1]);
  for (const label of labels) {
    const fn = `cmd_${label.replace(/-/g, '_')}`;
    if (!text.includes(`${fn}()`)) errors.push(`${file}: case label ${label}) has no ${fn} function`);
  }
  console.log(`${file}: ${funcs.length} subcommands, ${labels.length} case labels`);
}
if (errors.length > 0) {
  console.log('SCRIPT_DISPATCH=FAIL');
  console.log(errors.join('\n'));
  process.exit(1);
}
console.log('SCRIPT_DISPATCH=PASS');
