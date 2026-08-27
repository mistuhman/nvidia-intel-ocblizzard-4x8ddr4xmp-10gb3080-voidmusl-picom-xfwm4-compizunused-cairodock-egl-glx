#!/usr/bin/env node
// Receipt ingester: turn pasted target output into one normalized, comparable run record.
// Accepts nvidia-smi dmon output (CSV or column form), Unigine Superposition score/log text, and
// Geekbench 6 result text/URL. Applies the docs/oc-3080-gwe-recipe.md stop rules and diffs the run
// against the MASTER stock baseline. Refuses to guess: missing fields stay null and are reported.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { LIMITS, STOCK, arg, flag, project } from './lib/gpu-model.ts';

const USAGE = `usage:
  node tools/gpu-bench-parse.ts parse --id=cp60-m250-pl100 [--core=60] [--mem=250] [--pl=100] [--dmon=FILE] [--superposition=FILE] [--geekbench=FILE] [--append=receipts.json] [--json]
  node tools/gpu-bench-parse.ts selftest
  (any of --dmon/--superposition/--geekbench may be "-" to read stdin)`;

type Dmon = { samples: number; pwrMaxW: number | null; pwrAvgW: number | null; tempMaxC: number | null; pclkMaxMHz: number | null; mclkMaxMHz: number | null; smUtilAvgPct: number | null };
type Super = { score: number | null; fpsMin: number | null; fpsAvg: number | null; fpsMax: number | null; preset: string | null };
type Geek = { singleCore: number | null; multiCore: number | null; compute: number | null; url: string | null };

function readSource(spec: string | undefined): string | null {
  if (!spec) return null;
  if (spec === '-') return readFileSync(0, 'utf8');
  if (!existsSync(spec)) throw new Error(`missing input file: ${spec}`);
  return readFileSync(spec, 'utf8');
}

function num(x: string): number | null {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
}

function stat(values: number[], pick: 'max' | 'avg'): number | null {
  if (values.length === 0) return null;
  if (pick === 'max') return Math.max(...values);
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

// dmon column order for `nvidia-smi dmon`: gpu pwr gtemp mtemp sm mem enc dec [jpg ofa] mclk pclk.
// Header lines start with '#'; we key off the header when present, else fall back to that order.
export function parseDmon(text: string): Dmon {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const headerLine = lines.find((l) => l.startsWith('#') && /pwr/i.test(l) && /pclk|mclk|sm/i.test(l));
  const header = headerLine ? headerLine.replace(/^#\s*/, '').split(/[\s,]+/).map((h) => h.toLowerCase()) : ['gpu', 'pwr', 'gtemp', 'mtemp', 'sm', 'mem', 'enc', 'dec', 'mclk', 'pclk'];
  const idx = (name: string) => header.indexOf(name);
  const pwr: number[] = [];
  const temp: number[] = [];
  const pclk: number[] = [];
  const mclk: number[] = [];
  const sm: number[] = [];
  let samples = 0;
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    const cells = line.split(/[\s,]+/);
    if (cells.length < 4) continue;
    const get = (name: string) => {
      const i = idx(name);
      return i >= 0 && i < cells.length ? num(cells[i]) : null;
    };
    const p = get('pwr');
    if (p === null) continue;
    samples += 1;
    pwr.push(p);
    const t = get('gtemp');
    if (t !== null) temp.push(t);
    const pc = get('pclk');
    if (pc !== null) pclk.push(pc);
    const mc = get('mclk');
    if (mc !== null) mclk.push(mc);
    const s = get('sm');
    if (s !== null) sm.push(s);
  }
  return { samples, pwrMaxW: stat(pwr, 'max'), pwrAvgW: stat(pwr, 'avg'), tempMaxC: stat(temp, 'max'), pclkMaxMHz: stat(pclk, 'max'), mclkMaxMHz: stat(mclk, 'max'), smUtilAvgPct: stat(sm, 'avg') };
}

export function parseSuperposition(text: string): Super {
  const score = text.match(/\bscore\D{0,12}?(\d{3,6})\b/i) ?? text.match(/Superposition_Benchmark_v[\d.]+_(\d{3,6})_/);
  const min = text.match(/(?:fps\s*)?min\D{0,10}?([\d.]+)/i);
  const avg = text.match(/(?:fps\s*)?(?:avg|average)\D{0,10}?([\d.]+)/i);
  const max = text.match(/(?:fps\s*)?max\D{0,10}?([\d.]+)/i);
  const preset = text.match(/\b(1080p\s*Extreme|1080p\s*High|1080p\s*Medium|4K\s*Optimized|8K\s*Optimized)\b/i);
  return {
    score: score ? num(score[1]) : null,
    fpsMin: min ? num(min[1]) : null,
    fpsAvg: avg ? num(avg[1]) : null,
    fpsMax: max ? num(max[1]) : null,
    preset: preset ? preset[1].replace(/\s+/g, ' ') : null,
  };
}

export function parseGeekbench(text: string): Geek {
  const sc = text.match(/single[-\s]?core\s*(?:score)?\D{0,6}(\d{3,6})/i);
  const mc = text.match(/multi[-\s]?core\s*(?:score)?\D{0,6}(\d{3,6})/i);
  const cmp = text.match(/(?:opencl|vulkan|compute)\s*(?:score)?\D{0,6}(\d{3,7})/i);
  const url = text.match(/https:\/\/browser\.geekbench\.com\/\S+/);
  return { singleCore: sc ? num(sc[1]) : null, multiCore: mc ? num(mc[1]) : null, compute: cmp ? num(cmp[1]) : null, url: url ? url[0] : null };
}

function stopRules(dmon: Dmon | null, superposition: Super | null, artifacts: boolean): { verdict: 'PASS' | 'STOP' | 'INCOMPLETE'; hits: string[] } {
  const hits: string[] = [];
  if (artifacts) hits.push('operator reported artifacts/crash: stop rule 1/2, revert to the previous step');
  if (dmon?.tempMaxC !== null && dmon?.tempMaxC !== undefined && dmon.tempMaxC > LIMITS.tempStopC) hits.push(`gtemp max ${dmon.tempMaxC}C over the ${LIMITS.tempStopC}C stop rule (rule 3)`);
  if (dmon && dmon.samples === 0) hits.push('dmon parsed 0 samples: the meter did not run, the step is unmetered');
  if (!superposition || superposition.score === null) return { verdict: hits.length ? 'STOP' : 'INCOMPLETE', hits: [...hits, 'no Superposition score parsed: the official meter is missing'] };
  return { verdict: hits.length ? 'STOP' : 'PASS', hits };
}

function parse(): void {
  const id = arg('id');
  if (!id) throw new Error('--id is required (use the gpu-oc-plan step id, e.g. cp60-m250-pl100)');
  const coreOffset = Number(arg('core', '0'));
  const memOffset = Number(arg('mem', '0'));
  const powerPct = Number(arg('pl', '100'));
  const dmonText = readSource(arg('dmon'));
  const superText = readSource(arg('superposition'));
  const geekText = readSource(arg('geekbench'));
  const dmon = dmonText ? parseDmon(dmonText) : null;
  const superposition = superText ? parseSuperposition(superText) : null;
  const geekbench = geekText ? parseGeekbench(geekText) : null;
  const rules = stopRules(dmon, superposition, flag('artifacts'));
  const predicted = project({ coreOffset, memOffset, powerPct });
  const score = superposition?.score ?? null;
  const watts = dmon?.pwrMaxW ?? null;
  const run = {
    id,
    coreOffset,
    memOffset,
    powerPct,
    score,
    watts,
    fpsAvg: superposition?.fpsAvg ?? null,
    tempMaxC: dmon?.tempMaxC ?? null,
    coreMHzMax: dmon?.pclkMaxMHz ?? null,
    memClkMaxMHz: dmon?.mclkMaxMHz ?? null,
    samples: dmon?.samples ?? 0,
    preset: superposition?.preset ?? null,
    geekbench,
    verdict: rules.verdict,
    stopRuleHits: rules.hits,
    deltaScorePctVsStock: score === null ? null : Math.round(((score - STOCK.score) / STOCK.score) * 10000) / 100,
    scorePerWatt: score !== null && watts ? Math.round((score / watts) * 100) / 100 : null,
    modelErrorPct: score === null ? null : Math.round(((predicted.projectedScore - score) / score) * 10000) / 100,
    predicted: { score: predicted.projectedScore, watts: predicted.projectedWatts, coreMHz: predicted.projectedCoreMHz, tempC: predicted.projectedTempC },
  };

  const appendTo = arg('append');
  if (appendTo) {
    const existing = existsSync(appendTo) ? (JSON.parse(readFileSync(appendTo, 'utf8')) as { runs?: typeof run[] }).runs ?? [] : [];
    const runs = [...existing.filter((r) => r.id !== run.id), run].sort((a, b) => a.id.localeCompare(b.id));
    mkdirSync(dirname(appendTo), { recursive: true });
    writeFileSync(appendTo, `${JSON.stringify({ schema: 'gpu-oc-receipts.v1', baseline: STOCK, runs }, null, 2)}\n`);
    console.log(`appended ${run.id} -> ${appendTo} (${runs.length} runs)`);
  }

  if (flag('json')) {
    console.log(JSON.stringify(run, null, 2));
    return;
  }
  console.log(`RUN ${run.id}  core=+${coreOffset} mem=+${memOffset} pl=${powerPct}%`);
  console.log(`score=${run.score ?? 'null'} (${run.deltaScorePctVsStock ?? 'null'}% vs stock ${STOCK.score})  fpsAvg=${run.fpsAvg ?? 'null'}  preset=${run.preset ?? 'null'}`);
  console.log(`dmon samples=${run.samples} pwrMax=${run.watts ?? 'null'}W tempMax=${run.tempMaxC ?? 'null'}C pclkMax=${run.coreMHzMax ?? 'null'} mclkMax=${run.memClkMaxMHz ?? 'null'}`);
  console.log(`pts/W=${run.scorePerWatt ?? 'null'}  model_error=${run.modelErrorPct ?? 'null'}% (predicted ${predicted.projectedScore})`);
  if (geekbench) console.log(`geekbench sc=${geekbench.singleCore ?? 'null'} mc=${geekbench.multiCore ?? 'null'} compute=${geekbench.compute ?? 'null'} url=${geekbench.url ?? 'null'}`);
  console.log(`VERDICT=${run.verdict}`);
  for (const hit of run.stopRuleHits) console.log(`- ${hit}`);
}

function selftest(): void {
  const dmon = parseDmon(['# gpu    pwr gtemp mtemp    sm   mem   enc   dec  mclk  pclk', '# Idx      W     C     C     %     %     %     %   MHz   MHz', '    0    201    47     -   100    62     0     0  9501  1935', '    0    288    79     -   100    64     0     0  9751  1995'].join('\n'));
  if (dmon.samples !== 2 || dmon.pwrMaxW !== 288 || dmon.tempMaxC !== 79 || dmon.pclkMaxMHz !== 1995 || dmon.mclkMaxMHz !== 9751) throw new Error(`dmon parse drifted: ${JSON.stringify(dmon)}`);
  const sup = parseSuperposition('Preset: 1080p Extreme\nScore: 8717\nFPS Min: 19.76 Avg: 65.20 Max: 81.37');
  if (sup.score !== 8717 || sup.fpsAvg !== 65.2 || sup.fpsMin !== 19.76 || sup.preset !== '1080p Extreme') throw new Error(`superposition parse drifted: ${JSON.stringify(sup)}`);
  const fromFilename = parseSuperposition('Superposition_Benchmark_v1.1_9012_1756300000.score');
  if (fromFilename.score !== 9012) throw new Error('score filename fallback drifted');
  const gb = parseGeekbench('Single-Core Score 2715\nMulti-Core Score 14569\nhttps://browser.geekbench.com/v6/cpu/19061796');
  if (gb.singleCore !== 2715 || gb.multiCore !== 14569 || !gb.url) throw new Error(`geekbench parse drifted: ${JSON.stringify(gb)}`);
  const hot = stopRules({ ...dmon, tempMaxC: 86 }, sup, false);
  if (hot.verdict !== 'STOP') throw new Error('83C stop rule not enforced');
  if (stopRules(dmon, sup, false).verdict !== 'PASS') throw new Error('clean run must PASS');
  if (stopRules(dmon, null, false).verdict !== 'INCOMPLETE') throw new Error('missing meter must be INCOMPLETE');
  console.log(`dmon=${JSON.stringify(dmon)}`);
  console.log('GPU_BENCH_PARSE=PASS');
}

const command = process.argv[2] ?? '';
try {
  if (command === 'parse') parse();
  else if (command === 'selftest') selftest();
  else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (error) {
  console.error(`GPU_BENCH_PARSE=FAIL ${(error as Error).message}`);
  process.exit(1);
}
