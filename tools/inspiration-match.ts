#!/usr/bin/env node
// inspiration-match.ts — score images against an explicit theme description.
// Zero assumptions: every word in the spec must be a known measurable signal
// or a listed stopword; anything else fails the run. Descriptors are ANDed.
//
// Usage: node tools/inspiration-match.ts --spec spec.json image1.png image2.png ...
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const specArg = argv.find((a) => a.startsWith('--spec='));
const specFile = specArg ? specArg.slice('--spec='.length) : argv[argv.indexOf('--spec') + 1];
const images = argv.filter((a) => !a.startsWith('--') && a !== specFile);
if (!specFile || images.length === 0) {
  console.error('usage: node tools/inspiration-match.ts --spec spec.json <image.png> [...]');
  process.exit(1);
}

type Profile = ReturnType<typeof readProfiles>[number];

function readProfiles(files: string[]) {
  const out = execFileSync(process.execPath, [join(import.meta.dirname, 'image-read.ts'), ...files, '--json'], {
    encoding: 'utf8', maxBuffer: 1 << 28,
  });
  return JSON.parse(out).profiles as any[];
}

// Measurable signals only. Unknown spec tokens fail the run — no assumed features.
const STOPWORDS = new Set(['with', 'and', 'a', 'the', 'of', 'like', 'textured', 'texture', 'high', 'def', 'stylization', 'ui']);

type Signal = (p: any) => { pass: boolean; score: number; detail: string };

const band = (v: number, lo: number, hi: number) =>
  v >= lo && v <= hi ? 1 : Math.max(0, 1 - Math.min(Math.abs(v - lo), Math.abs(v - hi)) / Math.max(1, (hi - lo)));

const SIGNALS: Record<string, Signal> = {
  black: (p) => ({ pass: p.darkShare >= 0.38, score: band(p.darkShare, 0.38, 1.01), detail: `darkShare=${p.darkShare}` }),
  blacks: (p) => SIGNALS.black(p),
  grey: (p) => ({ pass: p.midShare >= 0.2, score: band(p.midShare, 0.2, 1.01), detail: `midShare=${p.midShare}` }),
  gray: (p) => SIGNALS.grey(p),
  'dark grey': (p) => ({ pass: p.midShare >= 0.2 && p.meanLuma <= 110, score: (band(p.midShare, 0.2, 1.01) + band(p.meanLuma, 0, 110)) / 2, detail: `midShare=${p.midShare} meanLuma=${p.meanLuma}` }),
  'dark gray': (p) => SIGNALS['dark grey'](p),
  gunmetal: (p) => ({ pass: p.saturation <= 0.28 && p.darkShare + p.midShare >= 0.7, score: (band(p.saturation, 0, 0.28) + band(p.darkShare + p.midShare, 0.7, 1.01)) / 2, detail: `sat=${p.saturation} dark+mid=${Math.round((p.darkShare + p.midShare) * 100) / 100}` }),
  brushed: (p) => ({ pass: p.anisotropyHorizontal >= 1.15, score: band(p.anisotropyHorizontal, 1.15, 4), detail: `anisotropyH=${p.anisotropyHorizontal}` }),
  reflective: (p) => ({ pass: p.specularShare >= 0.01 && p.topLightBias >= 1.25, score: (band(p.specularShare, 0.01, 0.5) + band(p.topLightBias, 1.25, 6)) / 2, detail: `specular=${p.specularShare} topBias=${p.topLightBias}` }),
  gradients: (p) => {
    // "gradients blending blacks": ordered descent without flat plateaus.
    // Sharp rim falloff is a designed specular edge, not banding, so only
    // dead-flat adjacent bands (|delta| < 2) count against the image.
    const drops = p.vGradientBands.slice(1).filter((v: number, i: number) => v < p.vGradientBands[i]).length;
    const flats = p.vGradientBands.slice(1).filter((v: number, i: number) => Math.abs(v - p.vGradientBands[i]) < 2).length;
    const pass = drops >= 5 && flats <= 1;
    return { pass, score: (band(drops, 5, 7.01) + band(flats, 0, 1.01)) / 2, detail: `vDrops=${drops}/7 vFlats=${flats}/7` };
  },
  skeuomorphic: (p) => {
    const s = [SIGNALS.reflective(p), SIGNALS.brushed(p), SIGNALS.gradients(p)];
    return { pass: s.every((x) => x.pass), score: s.reduce((a, x) => a + x.score, 0) / 3, detail: s.map((x) => x.detail).join(' | ') };
  },
  white: (p) => ({ pass: p.specularShare >= 0.02 || p.lumaP95 >= 220, score: Math.max(band(p.specularShare, 0.02, 0.5), band(p.lumaP95, 220, 256)), detail: `specular=${p.specularShare} p95=${p.lumaP95}` }),
  blue: (p) => ({ pass: p.blueShare >= 0.005, score: band(p.blueShare, 0.005, 0.4), detail: `blueShare=${p.blueShare}` }),
  'prussian blue': (p) => {
    const deep = typeof p.deepBlueShare === 'number' ? p.deepBlueShare : 0;
    const pass = p.blueShare >= 0.003 && deep >= 0.002;
    return { pass, score: (band(p.blueShare, 0.003, 0.4) + band(deep, 0.002, 0.3)) / 2, detail: `blueShare=${p.blueShare} deepBlueShare=${deep}` };
  },
};

function fail(msg: string): never {
  console.log(`INSPIRATION_MATCH=FAIL`);
  console.log(msg);
  process.exit(1);
}

const spec = JSON.parse(readFileSync(specFile, 'utf8'));
if (spec.schema !== 'inspiration-spec.v1') fail(`unsupported spec schema: ${spec.schema ?? '(missing)'}`);
if (!Array.isArray(spec.descriptors) || spec.descriptors.length === 0) fail('spec.descriptors must be a non-empty array');
const passScore = typeof spec.passScore === 'number' ? spec.passScore : 0.6;

const tokens: string[] = [];
for (const d of spec.descriptors) {
  if (typeof d !== 'string') fail(`descriptor must be a string: ${JSON.stringify(d)}`);
  const lower = d.toLowerCase().trim();
  if (SIGNALS[lower]) { tokens.push(lower); continue; }
  for (const w of lower.split(/\s+/)) {
    if (STOPWORDS.has(w)) continue;
    if (SIGNALS[w]) tokens.push(w);
    else if (w === 'blending') tokens.push('gradients');
    else fail(`unknown descriptor token "${w}" (vocabulary: ${Object.keys(SIGNALS).join(', ')})`);
  }
}
const unique = [...new Set(tokens)];
if (unique.length === 0) fail('spec contained only stopwords; no measurable signals given');

const profiles = readProfiles(images);
const rows: { file: string; ok: boolean; score: number; fails: string[] }[] = [];
for (const p of profiles) {
  if (p.error) { rows.push({ file: p.file, ok: false, score: 0, fails: [p.error] }); continue; }
  const fails: string[] = [];
  let sum = 0;
  for (const t of unique) {
    const r = SIGNALS[t](p);
    sum += r.score;
    if (!r.pass) fails.push(`${t}: ${r.detail}`);
  }
  const score = Math.round((sum / unique.length) * 1000) / 1000;
  rows.push({ file: p.file, ok: fails.length === 0 && score >= passScore, score, fails });
}
rows.sort((a, b) => b.score - a.score);
console.log(`INSPIRATION_MATCH schema=inspiration-spec.v1 descriptors=${unique.join('+')} passScore=${passScore}`);
for (const r of rows) {
  console.log(`${r.ok ? 'MATCH=PASS' : 'MATCH=FAIL'} score=${r.score.toFixed(3)} ${r.file}`);
  for (const f of r.fails) console.log(`  unmet: ${f}`);
}
const anyPass = rows.some((r) => r.ok);
console.log(anyPass ? 'RESULT=PASS' : 'RESULT=NONE');
