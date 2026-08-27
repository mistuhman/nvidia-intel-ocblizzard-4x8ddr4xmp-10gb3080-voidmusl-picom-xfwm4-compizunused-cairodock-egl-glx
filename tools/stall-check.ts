#!/usr/bin/env node
import { readFileSync } from 'node:fs';

type Master = {
  activeObjective?: {
    nextGateAskFirst?: string;
    crisis?: { closedTestClasses?: string[]; haltPhrase?: string };
  };
  interactionModel?: { crisisDiscipline?: { haltWhen?: string[]; requiredHaltLine?: string } };
};

function load(): Master {
  return JSON.parse(readFileSync('MASTER.md', 'utf8')) as Master;
}

const m = load();
const haltWhen = m.interactionModel?.crisisDiscipline?.haltWhen ?? [];
const phrase = m.interactionModel?.crisisDiscipline?.requiredHaltLine
  ?? 'Achtung, Halt!';
const closed = m.activeObjective?.crisis?.closedTestClasses ?? [];
const gate = m.activeObjective?.nextGateAskFirst ?? '';

const flags: string[] = [];
if (/DO NOT POWER ON/i.test(gate)) flags.push('power_on_forbidden');
if (closed.length >= 4) flags.push('many_closed_classes');
if (/jumper class/i.test(gate) && /CLOSED/i.test(gate)) flags.push('jumper_class_closed');
if (/HALT_NEW_CHAT/i.test(gate)) flags.push('gate_halt');

const halt = flags.includes('gate_halt') || (flags.includes('power_on_forbidden') && flags.includes('jumper_class_closed'));
const verdict = halt ? 'HALT_NEW_CHAT' : 'CONTINUE';

console.log(JSON.stringify({
  verdict,
  requiredHaltLine: phrase,
  flags,
  closedTestClasses: closed,
  haltWhen,
  nextGateAskFirst: gate,
  rule: halt
    ? 'Print Achtung, Halt! Freeze repo files (poisoning ban). Only pull request and merge. No further MASTER/docs/tool edits.'
    : 'Continue only with a new receipt class, not a closed ritual.',
  freezeRepo: halt,
  allowAfterHalt: halt ? ['gh pr create', 'gh pr merge'] : [],
}, null, 2));
