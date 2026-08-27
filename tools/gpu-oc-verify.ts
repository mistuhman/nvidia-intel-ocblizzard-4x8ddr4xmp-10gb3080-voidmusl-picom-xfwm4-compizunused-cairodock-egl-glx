#!/usr/bin/env node
// Verdict engine: read the receipt ledger written by gpu-bench-parse, rank the metered runs, and
// say ADVANCE / HOLD / REVERT with the reason. Also emits the GWE profile spec for the winner and a
// markdown report for the GitHub job summary. No projections outrank a receipt here.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { LIMITS, STOCK, arg, flag, stepId, validate } from './lib/gpu-model.ts';

const USAGE = `usage:
  node tools/gpu-oc-verify.ts verify --receipts=FILE [--tolerance=2] [--emit-gwe=FILE] [--markdown=FILE] [--json]
  node tools/gpu-oc-verify.ts selftest`;

type Run = {
  id: string;
  coreOffset: number;
  memOffset: number;
  powerPct: number;
  score: number | null;
  watts: number | null;
  tempMaxC: number | null;
  scorePerWatt: number | null;
  deltaScorePctVsStock: number | null;
  verdict: 'PASS' | 'STOP' | 'INCOMPLETE';
  stopRuleHits: string[];
};

// Ladder order used to name the next candidate once a step passes.
const NEXT_STEP: Record<string, { coreOffset: number; memOffset: number; powerPct: number }> = {
  'c0-m0': { coreOffset: 60, memOffset: 250, powerPct: 100 },
  'c60-m250': { coreOffset: 90, memOffset: 400, powerPct: 100 },
  'c90-m400': { coreOffset: 120, memOffset: 500, powerPct: 100 },
  'c120-m500': { coreOffset: 120, memOffset: 500, powerPct: 90 },
};

// Noise-aware fan curve: quiet until the GDDR6X gets real work, hard ramp before the 83C stop rule.
const FAN_CURVE: [number, number][] = [[30, 30], [45, 40], [55, 50], [65, 65], [72, 80], [78, 95], [82, 100]];

function load(path: string): { runs: Run[] } {
  if (!existsSync(path)) throw new Error(`missing receipts file: ${path}`);
  const raw = JSON.parse(readFileSync(path, 'utf8')) as { runs?: Run[] } | Run[];
  const runs = Array.isArray(raw) ? raw : raw.runs ?? [];
  if (runs.length === 0) throw new Error(`no runs in ${path}: ingest receipts with gpu-bench-parse first`);
  return { runs: [...runs].sort((a, b) => a.id.localeCompare(b.id)) };
}

function nextCandidate(run: Run): { coreOffset: number; memOffset: number; powerPct: number } | null {
  // Undervolt tiers walk the power limit down in 10-point steps at the same offsets.
  if (run.powerPct < 100) {
    const nextPct = run.powerPct - 10;
    return nextPct >= LIMITS.powerPctMin + 10 ? { coreOffset: run.coreOffset, memOffset: run.memOffset, powerPct: nextPct } : null;
  }
  return NEXT_STEP[`c${run.coreOffset}-m${run.memOffset}`] ?? null;
}

function decide(runs: Run[], tolerance: number) {
  const passed = runs.filter((r) => r.verdict === 'PASS' && r.score !== null);
  const stopped = runs.filter((r) => r.verdict === 'STOP');
  const incomplete = runs.filter((r) => r.verdict === 'INCOMPLETE');
  const byScore = [...passed].sort((a, b) => (b.score as number) - (a.score as number) || a.id.localeCompare(b.id));
  const byEff = [...passed].sort((a, b) => (b.scorePerWatt ?? 0) - (a.scorePerWatt ?? 0) || a.id.localeCompare(b.id));
  const bestScore = byScore[0] ?? null;
  const bestEff = byEff[0] ?? null;
  const daily = bestScore
    ? byEff.find((r) => (r.score as number) >= (bestScore.score as number) * (1 - tolerance / 100)) ?? bestScore
    : null;
  // Frontier = the most aggressive clean step reached so far (most clock, then least power head-
  // room). File order is not evidence of order-of-run, so we derive it instead of trusting the tail.
  const frontier = [...passed].sort((a, b) => a.coreOffset - b.coreOffset || a.memOffset - b.memOffset || b.powerPct - a.powerPct).at(-1) ?? runs[runs.length - 1];
  const latest = frontier;
  const fullPowerRef = passed.filter((r) => r.powerPct === 100).sort((a, b) => (b.score as number) - (a.score as number))[0] ?? null;

  let action: 'ADVANCE' | 'HOLD' | 'REVERT' | 'REBENCH' = 'HOLD';
  const reasons: string[] = [];
  if (stopped.length > 0) {
    action = 'REVERT';
    reasons.push(`${stopped.length} run(s) hit a stop rule: ${stopped.map((r) => `${r.id} [${r.stopRuleHits.join('; ')}]`).join(' | ')}`);
    if (bestScore) reasons.push(`fall back to ${bestScore.id}, the highest clean metered step`);
  } else if (incomplete.length > 0) {
    action = 'REBENCH';
    reasons.push(`${incomplete.map((r) => r.id).join(', ')} is unmetered: re-run Superposition 1080p Extreme with dmon before judging it`);
  } else if (bestScore && latest.verdict === 'PASS') {
    const gainPct = latest.deltaScorePctVsStock ?? 0;
    const hot = (latest.tempMaxC ?? 0) >= LIMITS.tempStopC - 3;
    const candidate = nextCandidate(latest);
    if (hot) {
      action = 'HOLD';
      reasons.push(`${latest.id} peaked at ${latest.tempMaxC}C, within 3C of the ${LIMITS.tempStopC}C stop rule: trim power before adding clock`);
    } else if (latest.powerPct < 100) {
      // Undervolt tier: the meter is points-per-watt against the same offsets at full power, and the
      // score loss budget, NOT the raw score.
      const lossPct = fullPowerRef?.score ? Math.round((((fullPowerRef.score - (latest.score as number)) / fullPowerRef.score) * 100) * 100) / 100 : null;
      const effGain = fullPowerRef?.scorePerWatt && latest.scorePerWatt ? Math.round(((latest.scorePerWatt - fullPowerRef.scorePerWatt) / fullPowerRef.scorePerWatt) * 10000) / 100 : null;
      if (lossPct !== null && lossPct > tolerance) {
        action = 'HOLD';
        reasons.push(`${latest.id} gives up ${lossPct}% score against ${fullPowerRef?.id} for ${effGain ?? '?'}% efficiency: past the ${tolerance}% loss budget, back off one power tier`);
      } else if (candidate) {
        action = 'ADVANCE';
        reasons.push(`${latest.id} holds within ${lossPct ?? '?'}% of full power at ${latest.watts}W (${effGain ?? '?'}% better pts/W, ${latest.tempMaxC ?? '?'}C): try the next power tier ${stepId(candidate)}`);
      } else {
        action = 'HOLD';
        reasons.push(`${latest.id} is the last authored undervolt tier: hold it for daily use and re-bench weekly`);
      }
    } else if (latest.coreOffset === 0 && latest.memOffset === 0 && latest.powerPct === 100) {
      // The stock run is the anchor, not a plateau: it always advances to recipe step 1.
      action = 'ADVANCE';
      reasons.push(`stock baseline metered at ${latest.score}: start the ladder at ${stepId(candidate ?? { coreOffset: 60, memOffset: 250, powerPct: 100 })}`);
    } else if (gainPct < 0.5) {
      action = 'HOLD';
      reasons.push(`${latest.id} is only ${gainPct}% over stock: past the useful knee, more offset buys noise not score`);
    } else if (candidate) {
      action = 'ADVANCE';
      const v = validate(candidate, false);
      reasons.push(`${latest.id} clean at ${latest.score} (${gainPct}% over stock, ${latest.tempMaxC ?? '?'}C): next step ${stepId(candidate)}${v.warnings.length ? ` [${v.warnings.join('; ')}]` : ''}`);
    } else {
      action = 'HOLD';
      reasons.push(`${latest.id} clean, but it is the end of the authored ladder: hold a week of daily use before authoring anything past it`);
    }
  }
  return { action, reasons, bestScore, bestEff, daily, passed, stopped, incomplete, next: latest ? nextCandidate(latest) : null };
}

function gweProfile(run: Run) {
  return {
    schema: 'gwe-profile-spec.v1',
    note: 'GWE 0.15.5 stores profiles in its own db; these are the values to key into the GWE sliders, or to apply with scripts/gpu-oc-apply. Keep "apply on login" OFF until a week of daily use passes.',
    name: `oc-${run.id}`,
    gpu_clock_offset_mhz: run.coreOffset,
    memory_transfer_rate_offset_mhz: run.memOffset,
    memory_clock_offset_mhz: run.memOffset / 2,
    power_limit_pct: run.powerPct,
    power_limit_w: Math.round((STOCK.powerLimitW * run.powerPct) / 100),
    fan_profile: { mode: run.powerPct < 100 ? 'quiet-trim' : 'auto-until-step3', points: FAN_CURVE.map(([tempC, dutyPct]) => ({ tempC, dutyPct })) },
    evidence: { score: run.score, watts: run.watts, tempMaxC: run.tempMaxC, scorePerWatt: run.scorePerWatt, deltaScorePctVsStock: run.deltaScorePctVsStock },
  };
}

function markdown(runs: Run[], d: ReturnType<typeof decide>): string {
  const rows = runs.map((r) => `| ${r.id} | +${r.coreOffset} | +${r.memOffset} | ${r.powerPct}% | ${r.score ?? '—'} | ${r.watts ?? '—'} | ${r.tempMaxC ?? '—'} | ${r.scorePerWatt ?? '—'} | ${r.deltaScorePctVsStock ?? '—'}% | ${r.verdict} |`);
  return [
    '## RTX 3080 OC lab — metered runs',
    '',
    `stock anchor: Superposition 1080p Extreme **${STOCK.score}**, dmon peaks ${STOCK.referenceW}W / ${STOCK.tempMaxC}C / pclk ${STOCK.coreMHz} / mclk ${STOCK.mclkMHz}`,
    '',
    '| step | core | mem | pl | score | W | °C | pts/W | Δ stock | verdict |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
    `**ACTION: ${d.action}**`,
    '',
    ...d.reasons.map((r) => `- ${r}`),
    '',
    d.bestScore ? `- best score: \`${d.bestScore.id}\` ${d.bestScore.score} (${d.bestScore.deltaScorePctVsStock}% vs stock)` : '- best score: none yet',
    d.bestEff ? `- best efficiency: \`${d.bestEff.id}\` ${d.bestEff.scorePerWatt} pts/W at ${d.bestEff.watts}W` : '- best efficiency: none yet',
    d.daily ? `- recommended daily profile: \`${d.daily.id}\`` : '- recommended daily profile: none yet',
  ].join('\n');
}

function write(path: string | undefined, body: string, label: string): void {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body.endsWith('\n') ? body : `${body}\n`);
  console.log(`wrote ${label} ${path}`);
}

function verify(): void {
  const path = arg('receipts');
  if (!path) throw new Error('--receipts=FILE is required');
  const tolerance = Number(arg('tolerance', '2'));
  const { runs } = load(path);
  const d = decide(runs, tolerance);
  write(arg('markdown'), markdown(runs, d), 'markdown');
  if (arg('emit-gwe')) {
    if (!d.daily) throw new Error('no clean metered run to turn into a GWE profile');
    write(arg('emit-gwe'), `${JSON.stringify(gweProfile(d.daily), null, 2)}\n`, 'gwe profile');
  }
  if (flag('json')) {
    console.log(JSON.stringify({ action: d.action, reasons: d.reasons, bestScore: d.bestScore, bestEff: d.bestEff, daily: d.daily, next: d.next, runs }, null, 2));
    return;
  }
  console.log(markdown(runs, d));
  if (d.action === 'REVERT') process.exitCode = 3;
}

function selftest(): void {
  const base = { stopRuleHits: [] as string[] };
  const clean: Run[] = [
    { ...base, id: 'cp0-m0-pl100', coreOffset: 0, memOffset: 0, powerPct: 100, score: 8717, watts: 320, tempMaxC: 74, scorePerWatt: 27.24, deltaScorePctVsStock: 0, verdict: 'PASS' },
    { ...base, id: 'cp60-m250-pl100', coreOffset: 60, memOffset: 250, powerPct: 100, score: 8901, watts: 322, tempMaxC: 76, scorePerWatt: 27.64, deltaScorePctVsStock: 2.11, verdict: 'PASS' },
  ];
  const advance = decide(clean, 2);
  if (advance.action !== 'ADVANCE' || advance.next?.coreOffset !== 90) throw new Error(`expected ADVANCE to +90: ${JSON.stringify(advance.action)}`);
  const hot = decide([...clean, { ...base, id: 'cp90-m400-pl100', coreOffset: 90, memOffset: 400, powerPct: 100, score: 9000, watts: 330, tempMaxC: 87, scorePerWatt: 27.3, deltaScorePctVsStock: 3.25, verdict: 'STOP', stopRuleHits: ['gtemp max 87C over the 83C stop rule (rule 3)'] }], 2);
  if (hot.action !== 'REVERT' || hot.bestScore?.id !== 'cp60-m250-pl100') throw new Error('stop rule must force REVERT to the best clean step');
  const eff: Run[] = [...clean, { ...base, id: 'cp60-m250-pl80', coreOffset: 60, memOffset: 250, powerPct: 80, score: 8760, watts: 256, tempMaxC: 68, scorePerWatt: 34.22, deltaScorePctVsStock: 0.49, verdict: 'PASS' }];
  const daily = decide(eff, 2).daily;
  if (daily?.id !== 'cp60-m250-pl80') throw new Error(`efficiency pick drifted: ${daily?.id}`);
  const uvTight = decide(eff, 2);
  if (uvTight.action !== 'ADVANCE' || uvTight.next?.powerPct !== 70) throw new Error(`undervolt tier inside the loss budget must advance, got ${uvTight.action}`);
  const uvLossy = decide([...clean, { ...base, id: 'cp60-m250-pl70', coreOffset: 60, memOffset: 250, powerPct: 70, score: 8100, watts: 224, tempMaxC: 63, scorePerWatt: 36.16, deltaScorePctVsStock: -7.08, verdict: 'PASS' }], 2);
  if (uvLossy.action !== 'HOLD') throw new Error('an undervolt tier past the loss budget must HOLD, not advance');
  const profile = gweProfile(eff[2]);
  if (profile.memory_clock_offset_mhz !== 125 || profile.power_limit_w !== 256) throw new Error(`gwe profile drifted: ${JSON.stringify(profile)}`);
  if (decide([{ ...base, id: 'x', coreOffset: 0, memOffset: 0, powerPct: 100, score: null, watts: null, tempMaxC: null, scorePerWatt: null, deltaScorePctVsStock: null, verdict: 'INCOMPLETE' }], 2).action !== 'REBENCH') throw new Error('unmetered run must ask for a rebench');
  console.log(`advance_next=${stepId(advance.next as { coreOffset: number; memOffset: number; powerPct: number })}`);
  console.log('GPU_OC_VERIFY=PASS');
}

const command = process.argv[2] ?? '';
try {
  if (command === 'verify') verify();
  else if (command === 'selftest') selftest();
  else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (error) {
  console.error(`GPU_OC_VERIFY=FAIL ${(error as Error).message}`);
  process.exit(1);
}
