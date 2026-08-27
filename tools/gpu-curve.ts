#!/usr/bin/env node
// Undervolt graph: sweep the power limit (the only real Linux "undervolt" knob on Ampere) at fixed
// clock offsets and draw score, watts and points-per-watt. Emits ASCII, CSV and SVG.
// Optional --measured=FILE (gpu-bench-parse receipts) overlays real runs and refits the model.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { STOCK, arg, flag, parseRange, project } from './lib/gpu-model.ts';
import type { Baseline, Projection } from './lib/gpu-model.ts';

const USAGE = `usage:
  node tools/gpu-curve.ts curve [--core=120] [--mem=500] [--pl=60:110:5] [--knee-tolerance=3] [--measured=FILE] [--csv=FILE] [--svg=FILE] [--json]
  node tools/gpu-curve.ts selftest`;

type Measured = { id?: string; coreOffset: number; memOffset: number; powerPct: number; score: number; watts: number; tempMaxC?: number };

function readMeasured(path: string): Measured[] {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const rows = Array.isArray(raw) ? raw : ((raw as { runs?: Measured[] }).runs ?? []);
  return rows
    .filter((r) => Number.isFinite(r.score) && Number.isFinite(r.powerPct) && Number.isFinite(r.watts))
    .sort((a, b) => a.powerPct - b.powerPct || (a.id ?? '').localeCompare(b.id ?? ''));
}

// Coarse deterministic grid search over the two anchors we do not trust: the card's real default
// power limit and its draw at stock clock. Never invents data - it only fits what was pasted.
function calibrate(measured: Measured[]): { base: Baseline; rmsePct: number; samples: number } {
  let best = { base: STOCK, rmsePct: Number.POSITIVE_INFINITY, samples: measured.length };
  if (measured.length === 0) return { ...best, rmsePct: 0 };
  for (let pl = 280; pl <= 400; pl += 5) {
    for (let ref = 240; ref <= 400; ref += 5) {
      const base: Baseline = { ...STOCK, powerLimitW: pl, referenceW: ref };
      let sum = 0;
      for (const m of measured) {
        const p = project({ coreOffset: m.coreOffset, memOffset: m.memOffset, powerPct: m.powerPct }, base);
        sum += (((p.projectedScore - m.score) / m.score) * 100) ** 2;
      }
      const rmsePct = Math.round(Math.sqrt(sum / measured.length) * 100) / 100;
      if (rmsePct < best.rmsePct) best = { base, rmsePct, samples: measured.length };
    }
  }
  return best;
}

function sparkline(values: number[], width: number): string {
  const glyphs = '▁▂▃▄▅▆▇█';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.slice(0, width).map((v) => glyphs[Math.min(glyphs.length - 1, Math.floor(((v - min) / span) * (glyphs.length - 1) + 0.5))]).join('');
}

function bar(value: number, min: number, max: number, width: number): string {
  const span = max - min || 1;
  const filled = Math.max(0, Math.min(width, Math.round(((value - min) / span) * width)));
  return '#'.repeat(filled).padEnd(width, '.');
}

function svg(rows: Projection[], measured: Measured[]): string {
  const w = 720;
  const h = 360;
  const pad = 48;
  const xs = rows.map((r) => r.projectedWatts);
  const ys = rows.map((r) => r.projectedScore);
  const xmin = Math.min(...xs, ...measured.map((m) => m.watts));
  const xmax = Math.max(...xs, ...measured.map((m) => m.watts));
  const ymin = Math.min(...ys, ...measured.map((m) => m.score));
  const ymax = Math.max(...ys, ...measured.map((m) => m.score));
  const px = (x: number) => Math.round(((x - xmin) / (xmax - xmin || 1)) * (w - 2 * pad) + pad);
  const py = (y: number) => Math.round(h - pad - ((y - ymin) / (ymax - ymin || 1)) * (h - 2 * pad));
  const path = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${px(r.projectedWatts)},${py(r.projectedScore)}`).join(' ');
  const dots = measured.map((m) => `<circle cx="${px(m.watts)}" cy="${py(m.score)}" r="4" fill="#e05c2b"><title>${m.id ?? ''} ${m.score} @ ${m.watts}W</title></circle>`).join('');
  const labels = rows.map((r) => `<text x="${px(r.projectedWatts)}" y="${py(r.projectedScore) - 8}" font-size="9" fill="#8fa3b0" text-anchor="middle">${r.powerPct}%</text>`).join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    '<rect width="100%" height="100%" fill="#11161a"/>',
    `<text x="${pad}" y="24" font-size="13" fill="#dfe7ec">RTX 3080 10GB undervolt graph — Superposition 1080p Extreme score vs board watts</text>`,
    `<line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#3a4750"/>`,
    `<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#3a4750"/>`,
    `<text x="${w - pad}" y="${h - pad + 20}" font-size="10" fill="#8fa3b0" text-anchor="end">watts ${Math.round(xmin)}..${Math.round(xmax)}</text>`,
    `<text x="${pad}" y="${pad - 12}" font-size="10" fill="#8fa3b0">score ${Math.round(ymin)}..${Math.round(ymax)}</text>`,
    `<path d="${path}" fill="none" stroke="#4fb3ff" stroke-width="2"/>`,
    labels,
    dots,
    measured.length ? `<text x="${pad}" y="${h - 12}" font-size="10" fill="#e05c2b">orange dots = measured receipts (${measured.length})</text>` : '',
    '</svg>',
  ].filter(Boolean).join('\n');
}

function write(path: string | undefined, body: string, label: string): void {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body.endsWith('\n') ? body : `${body}\n`);
  console.log(`wrote ${label} ${path}`);
}

function curve(): void {
  const coreOffset = Number(arg('core', '120'));
  const memOffset = Number(arg('mem', '500'));
  const tolerance = Number(arg('knee-tolerance', '3'));
  const pls = parseRange(arg('pl', '60:110:5') as string, 'pl');
  const measuredPath = arg('measured');
  const measured = measuredPath ? readMeasured(measuredPath) : [];
  const fit = calibrate(measured);
  const base = measured.length ? fit.base : STOCK;
  const rows = pls.map((powerPct) => project({ coreOffset, memOffset, powerPct }, base));
  const peak = rows.reduce((a, b) => (b.projectedScore > a.projectedScore ? b : a), rows[0]);
  const knee = rows.find((r) => r.projectedScore >= peak.projectedScore * (1 - tolerance / 100)) ?? peak;
  const bestEff = rows.reduce((a, b) => (b.projectedScorePerWatt > a.projectedScorePerWatt ? b : a), rows[0]);
  const wattMin = Math.min(...rows.map((r) => r.projectedWatts));
  const wattMax = Math.max(...rows.map((r) => r.projectedWatts));
  const scoreMin = Math.min(...rows.map((r) => r.projectedScore));
  const scoreMax = Math.max(...rows.map((r) => r.projectedScore));

  const text = [
    `UNDERVOLT GRAPH core=+${coreOffset} mem=+${memOffset} points=${rows.length}`,
    measured.length
      ? `calibration: ${fit.samples} measured runs, fitted defaultPL=${base.powerLimitW}W referenceW=${base.referenceW}W, rmse=${fit.rmsePct}%`
      : 'calibration: none (model anchors from MASTER stockBaseline; feed --measured to refit)',
    'pl%\tplW\tcoreMHz\twatts\tscore\tpts/W\ttempC\tscore-bar',
    ...rows.map((r) => [r.powerPct, r.powerLimitW, r.projectedCoreMHz, r.projectedWatts, r.projectedScore, r.projectedScorePerWatt, r.projectedTempC, bar(r.projectedScore, scoreMin, scoreMax, 24)].join('\t')),
    `score  ${sparkline(rows.map((r) => r.projectedScore), rows.length)}  ${scoreMin}..${scoreMax}`,
    `pts/W  ${sparkline(rows.map((r) => r.projectedScorePerWatt), rows.length)}`,
    `watts  ${sparkline(rows.map((r) => r.projectedWatts), rows.length)}  ${wattMin}..${wattMax}W`,
    `peak_score: ${peak.powerPct}% -> ${peak.projectedScore} at ${peak.projectedWatts}W`,
    `efficiency_knee (within ${tolerance}% of peak): ${knee.powerPct}% -> ${knee.projectedScore} at ${knee.projectedWatts}W, saves ${Math.round(peak.projectedWatts - knee.projectedWatts)}W for ${Math.abs(Math.round(((peak.projectedScore - knee.projectedScore) / peak.projectedScore) * 1000) / 10)}% score`,
    `best_pts_per_watt: ${bestEff.powerPct}% -> ${bestEff.projectedScorePerWatt} pts/W`,
    'REMINDER: Ampere on Linux has no per-point voltage curve. This graph is power-limit trim, not Afterburner undervolting.',
  ].join('\n');

  write(arg('csv'), ['pl_pct,pl_w,core_mhz,mem_clk_mhz,watts,score,fps_avg,pts_per_watt,temp_c', ...rows.map((r) => [r.powerPct, r.powerLimitW, r.projectedCoreMHz, r.projectedMemClkMHz, r.projectedWatts, r.projectedScore, r.projectedFpsAvg, r.projectedScorePerWatt, r.projectedTempC].join(','))].join('\n'), 'csv');
  write(arg('svg'), svg(rows, measured), 'svg');
  if (flag('json')) console.log(JSON.stringify({ coreOffset, memOffset, calibration: measured.length ? fit : null, peak, knee, bestEff, rows, measured }, null, 2));
  else console.log(text);
}

function selftest(): void {
  const rows = [60, 80, 100].map((powerPct) => project({ coreOffset: 120, memOffset: 500, powerPct }));
  if (!(rows[0].projectedScore < rows[1].projectedScore && rows[1].projectedScore < rows[2].projectedScore)) throw new Error('score must rise with power limit');
  if (!(rows[0].projectedScorePerWatt > rows[2].projectedScorePerWatt)) throw new Error('efficiency must fall as power rises');
  const s = svg(rows, [{ id: 'm', coreOffset: 120, memOffset: 500, powerPct: 80, score: 8000, watts: 250 }]);
  if (!s.startsWith('<svg') || !s.includes('</svg>')) throw new Error('svg malformed');
  const fit = calibrate([
    { id: 'a', coreOffset: 0, memOffset: 0, powerPct: 100, score: 8717, watts: 320 },
    { id: 'b', coreOffset: 0, memOffset: 0, powerPct: 70, score: 7300, watts: 224 },
  ]);
  if (!(fit.rmsePct < 5)) throw new Error(`calibration failed to fit clean anchors: rmse=${fit.rmsePct}`);
  console.log(`fit_pl=${fit.base.powerLimitW} fit_ref=${fit.base.referenceW} rmse=${fit.rmsePct}`);
  console.log(`spark=${sparkline(rows.map((r) => r.projectedScore), 3)}`);
  console.log('GPU_CURVE=PASS');
}

const command = process.argv[2] ?? '';
try {
  if (command === 'curve') curve();
  else if (command === 'selftest') selftest();
  else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (error) {
  console.error(`GPU_CURVE=FAIL ${(error as Error).message}`);
  process.exit(1);
}
