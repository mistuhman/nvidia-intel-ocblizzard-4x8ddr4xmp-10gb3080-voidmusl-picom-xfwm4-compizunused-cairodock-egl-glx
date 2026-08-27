#!/usr/bin/env node
// GPU OC plan generator: recipe ladder, full knob sweeps, and console-safe apply/revert blocks.
// Deterministic: same args -> same bytes. Nothing here touches hardware; it only orders candidates
// so the operator applies the fewest, safest steps on the target.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { LIMITS, STOCK, arg, flag, parseRange, project, stepId, validate } from './lib/gpu-model.ts';
import type { Point, Projection } from './lib/gpu-model.ts';

const USAGE = `usage:
  node tools/gpu-oc-plan.ts ladder [--uvoc] [--json]
  node tools/gpu-oc-plan.ts sweep --core=0:150:30 --mem=0:800:200 --pl=70:100:10 [--top=N] [--sort=score|eff|watts] [--allow-pl-raise] [--json] [--out=FILE]
  node tools/gpu-oc-plan.ts blocks --core=60 --mem=250 [--pl=100] [--install-dir=/home/sd/oc-meters] [--out=FILE]
  node tools/gpu-oc-plan.ts selftest`;

// docs/oc-3080-gwe-recipe.md steps, plus the Linux-only "undervolt" tier (power trim, no voltage curve).
const LADDER: { step: string; note: string; point: Point }[] = [
  { step: '0-stock', note: 'baseline; never skip, re-run after any driver change', point: { coreOffset: 0, memOffset: 0, powerPct: 100 } },
  { step: '1', note: 'first OC run', point: { coreOffset: 60, memOffset: 250, powerPct: 100 } },
  { step: '2', note: 'only if step 1 clean', point: { coreOffset: 90, memOffset: 400, powerPct: 100 } },
  { step: '3', note: 'HOLD one week of daily use here', point: { coreOffset: 120, memOffset: 500, powerPct: 100 } },
  { step: 'uv-90', note: 'soft undervolt: 90% power, offsets held', point: { coreOffset: 120, memOffset: 500, powerPct: 90 } },
  { step: 'uv-80', note: 'soft undervolt: 80% power, the usual efficiency knee', point: { coreOffset: 120, memOffset: 500, powerPct: 80 } },
  { step: 'uv-70', note: 'soft undervolt: 70% power, quiet/cool profile', point: { coreOffset: 120, memOffset: 500, powerPct: 70 } },
  { step: '4-dead', note: 'power raise: IMPOSSIBLE, power.max_limit == default 320W (receipt 2026-08-27)', point: { coreOffset: 120, memOffset: 500, powerPct: 110 } },
];

// UV+OC ladder (operator directive 2026-08-27: "we need to undervolt AND overclock the 3080").
// On Linux the pair means: keep the clock offsets (they shift the V/F curve, so the same watts buy
// more MHz) and trim the power limit at the same time. Score per watt climbs hard; absolute score
// gives up a little. Run these AFTER the matching full-power step has proven clean.
const UVOC: { step: string; note: string; point: Point }[] = [
  { step: 'uvoc-1', note: '+60/+250 at 90% power: first pair, should be near score-neutral', point: { coreOffset: 60, memOffset: 250, powerPct: 90 } },
  { step: 'uvoc-2', note: '+90/+400 at 85% power', point: { coreOffset: 90, memOffset: 400, powerPct: 85 } },
  { step: 'uvoc-3', note: '+120/+500 at 80% power: the usual daily sweet spot on a pinned 3080', point: { coreOffset: 120, memOffset: 500, powerPct: 80 } },
  { step: 'uvoc-4', note: '+120/+500 at 70% power: quiet/cool profile, expect real score loss', point: { coreOffset: 120, memOffset: 500, powerPct: 70 } },
  { step: 'uvoc-max', note: '+150/+600 at 75% power: most clock the trim can hold', point: { coreOffset: 150, memOffset: 600, powerPct: 75 } },
];

function fmt(n: number, w: number): string {
  return String(n).padStart(w);
}

function table(rows: (Projection & { step?: string; note?: string; verdict: string })[]): string {
  const head = ['step', 'core', 'mem', 'pl%', 'plW', 'coreMHz', 'W', 'score', 'fps', 'C', 'pts/W', 'dScore%', 'verdict'];
  const lines = [head.join('\t')];
  for (const r of rows) {
    lines.push([
      r.step ?? stepId(r),
      `+${r.coreOffset}`,
      `+${r.memOffset}`,
      String(r.powerPct),
      String(r.powerLimitW),
      String(r.projectedCoreMHz),
      String(r.projectedWatts),
      String(r.projectedScore),
      String(r.projectedFpsAvg),
      String(r.projectedTempC),
      String(r.projectedScorePerWatt),
      String(r.deltaScorePct),
      r.verdict,
    ].join('\t'));
  }
  return lines.join('\n');
}

function decorate(point: Point, allowPlRaise: boolean, step?: string, note?: string) {
  const v = validate(point, allowPlRaise);
  const p = project(point);
  const verdict = v.ok ? (v.warnings.length ? 'OK-WARN' : 'OK') : 'BLOCKED';
  return { ...p, step, note, verdict, errors: v.errors, warnings: v.warnings };
}

function emit(payload: unknown, text: string): void {
  const out = arg('out');
  const body = flag('json') ? `${JSON.stringify(payload, null, 2)}\n` : `${text}\n`;
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, body);
    console.log(`wrote ${out} (${body.split('\n').length - 1} lines)`);
    return;
  }
  process.stdout.write(body);
}

function ladder(): void {
  const source = flag('uvoc') ? UVOC : [...LADDER, ...UVOC];
  const rows = source.map((l) => decorate(l.point, false, l.step, l.note));
  const text = [
    `RTX 3080 10GB — ${flag('uvoc') ? 'UV+OC ladder' : 'recipe ladder + UV+OC tiers'} (projected, model only; meter with Superposition 1080p Extreme + dmon)`,
    `anchor: stock score ${STOCK.score}, core ${STOCK.coreMHz}MHz (ceiling ${STOCK.coreCeilingMHz}MHz), mclk ${STOCK.mclkMHz}MHz, PL ${STOCK.powerLimitW}W default = ${STOCK.powerMaxLimitW}W max (receipt 2026-08-27, Coolbits LIVE)`,
    table(rows),
    ...rows.filter((r) => r.errors.length || r.warnings.length).map((r) => `${r.step}: ${[...r.errors.map((e) => `ERROR ${e}`), ...r.warnings.map((w) => `WARN ${w}`)].join(' | ')}`),
  ].join('\n');
  emit({ anchor: STOCK, limits: LIMITS, steps: rows }, text);
}

function sweep(): void {
  const allowPlRaise = flag('allow-pl-raise');
  const cores = parseRange(arg('core', '0:150:30') as string, 'core');
  const mems = parseRange(arg('mem', '0:800:200') as string, 'mem');
  const pls = parseRange(arg('pl', '70:100:10') as string, 'pl');
  const sort = arg('sort', 'score') as string;
  const top = Number(arg('top', '20'));
  if (!Number.isFinite(top) || top <= 0) throw new Error(`bad --top: ${arg('top')}`);
  const all = [];
  for (const coreOffset of cores) for (const memOffset of mems) for (const powerPct of pls) all.push(decorate({ coreOffset, memOffset, powerPct }, allowPlRaise));
  const ok = all.filter((r) => r.verdict !== 'BLOCKED');
  const key = (r: (typeof all)[number]) => (sort === 'eff' ? r.projectedScorePerWatt : sort === 'watts' ? -r.projectedWatts : r.projectedScore);
  // stable, deterministic: primary key desc, then step id asc
  ok.sort((a, b) => key(b) - key(a) || stepId(a).localeCompare(stepId(b)));
  const rows = ok.slice(0, top);
  const bestScore = ok.reduce((a, b) => (b.projectedScore > a.projectedScore ? b : a), ok[0]);
  const bestEff = ok.reduce((a, b) => (b.projectedScorePerWatt > a.projectedScorePerWatt ? b : a), ok[0]);
  const text = [
    `SWEEP core=${arg('core', '0:150:30')} mem=${arg('mem', '0:800:200')} pl=${arg('pl', '70:100:10')} candidates=${all.length} allowed=${ok.length} blocked=${all.length - ok.length} sort=${sort}`,
    table(rows),
    bestScore ? `best_score: ${stepId(bestScore)} -> ${bestScore.projectedScore} (${bestScore.deltaScorePct}% vs stock)` : 'best_score: none',
    bestEff ? `best_efficiency: ${stepId(bestEff)} -> ${bestEff.projectedScorePerWatt} pts/W at ${bestEff.projectedWatts}W` : 'best_efficiency: none',
    'NOTE: projections order the queue; only pasted dmon + Superposition receipts decide anything.',
  ].join('\n');
  emit({ sweep: { core: arg('core'), mem: arg('mem'), pl: arg('pl'), sort, top }, counts: { total: all.length, allowed: ok.length, blocked: all.length - ok.length }, bestScore, bestEff, rows }, text);
}

function blocks(): void {
  const point: Point = { coreOffset: Number(arg('core', '60')), memOffset: Number(arg('mem', '250')), powerPct: Number(arg('pl', '100')) };
  const v = validate(point, flag('allow-pl-raise'));
  if (!v.ok) {
    console.error(`BLOCKED: ${v.errors.join(' | ')}`);
    process.exit(1);
  }
  const dir = arg('install-dir', '/home/sd/oc-meters') as string;
  const id = stepId(point);
  const p = project(point);
  const user = [
    `# user shell — step ${id} (projected ${p.projectedScore} pts, ${p.projectedWatts}W, ${p.projectedTempC}C)`,
    `sh ${dir}/gpu-oc-apply probe`,
    `sh ${dir}/gpu-oc-apply apply ${point.coreOffset} ${point.memOffset}`,
    `sh ${dir}/gpu-oc-apply verify`,
    `sh ${dir}/gpu-oc-apply meter ${id}`,
  ];
  const root = point.powerPct === 100 ? [] : [
    '# root shell — power limit trim (the Linux soft undervolt)',
    'id -u',
    `sh ${dir}/gpu-oc-apply powerlimit ${point.powerPct}`,
  ];
  const revert = [
    `# user shell — inverse of ${id}, run on any stop rule`,
    `sh ${dir}/gpu-oc-apply revert`,
    `sh ${dir}/gpu-oc-apply verify`,
  ];
  const rootRevert = point.powerPct === 100 ? [] : ['# root shell — restore default power limit', 'id -u', `sh ${dir}/gpu-oc-apply powerlimit 100`];
  const text = [user.join('\n'), root.join('\n'), revert.join('\n'), rootRevert.join('\n')].filter(Boolean).join('\n\n');
  emit({ id, point, projection: p, warnings: v.warnings, user, root, revert, rootRevert }, text);
}

function selftest(): void {
  const checks: string[] = [];
  const stock = project({ coreOffset: 0, memOffset: 0, powerPct: 100 });
  if (stock.projectedScore !== STOCK.score) throw new Error(`stock projection drifted: ${stock.projectedScore}`);
  checks.push(`stock_identity=${stock.projectedScore}`);
  const oc = project({ coreOffset: 120, memOffset: 500, powerPct: 100 });
  if (!(oc.projectedScore > stock.projectedScore)) throw new Error('OC must project above stock');
  checks.push(`step3_score=${oc.projectedScore}`);
  const uv = project({ coreOffset: 120, memOffset: 500, powerPct: 70 });
  if (!(uv.projectedWatts < oc.projectedWatts && uv.projectedScorePerWatt > oc.projectedScorePerWatt)) throw new Error('power trim must cut watts and raise pts/W');
  checks.push(`uv70_watts=${uv.projectedWatts} uv70_eff=${uv.projectedScorePerWatt}`);
  if (validate({ coreOffset: 200, memOffset: 0, powerPct: 100 }, false).ok) throw new Error('core cap not enforced');
  if (validate({ coreOffset: 0, memOffset: 900, powerPct: 100 }, false).ok) throw new Error('memory cap not enforced');
  if (validate({ coreOffset: 0, memOffset: 0, powerPct: 110 }, false).ok) throw new Error('PL raise gate not enforced');
  if (validate({ coreOffset: 0, memOffset: 0, powerPct: 110 }, true).ok) throw new Error('a vBIOS-fixed power limit must not be overridable by a flag');
  if (project({ coreOffset: 150, memOffset: 0, powerPct: 100 }).projectedCoreMHz > STOCK.coreCeilingMHz) throw new Error('core ceiling not clamped');
  if (!validate({ coreOffset: 150, memOffset: 0, powerPct: 100 }, false).warnings.some((w) => w.includes('clocks.max.graphics')) === false) checks.push('ceiling_warn=ok');
  checks.push('caps=enforced');
  if (parseRange('0:100:50', 'x').join(',') !== '0,50,100') throw new Error('range parser drifted');
  checks.push('range=ok');
  const pair = project({ coreOffset: 120, memOffset: 500, powerPct: 80 });
  const trimOnly = project({ coreOffset: 0, memOffset: 0, powerPct: 80 });
  if (!(pair.projectedScore > trimOnly.projectedScore && pair.projectedWatts <= trimOnly.projectedWatts + 1)) throw new Error('UV+OC must beat a bare trim at the same watts');
  checks.push(`uvoc80_score=${pair.projectedScore} vs trim_only=${trimOnly.projectedScore} at ${pair.projectedWatts}W`);
  console.log(checks.join('\n'));
  console.log('GPU_OC_PLAN=PASS');
}

const command = process.argv[2] ?? '';
try {
  if (command === 'ladder') ladder();
  else if (command === 'sweep') sweep();
  else if (command === 'blocks') blocks();
  else if (command === 'selftest') selftest();
  else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (error) {
  console.error(`GPU_OC_PLAN=FAIL ${(error as Error).message}`);
  process.exit(1);
}
