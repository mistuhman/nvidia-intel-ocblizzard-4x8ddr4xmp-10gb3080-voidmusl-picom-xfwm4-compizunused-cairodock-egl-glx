#!/usr/bin/env node
// image-read.ts — deterministic zero-dependency PNG pixel profiler.
// Reads images the agent cannot see and reports measurable material facts:
// gradient ramps, specular reflectivity, brush anisotropy, palette, blue share.
// No interpretation beyond the printed numbers; no assumed features.
//
// Usage: node tools/image-read.ts <image.png> [more.png ...] [--json]
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const args = process.argv.slice(2);
const json = args.includes('--json');
const files = args.filter((a) => !a.startsWith('--'));
if (files.length === 0) {
  console.error('usage: node tools/image-read.ts <image.png> [...] [--json]');
  process.exit(1);
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type Px = [number, number, number, number]; // r,g,b,a straight (0-255)

function fail(msg: string): never {
  throw new Error(`ERROR: ${msg}`);
}

function decodePng(buf: Buffer): { width: number; height: number; px: Px[] } {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) fail('not a PNG (only PNG input is supported)');
  let pos = 8;
  let width = 0, height = 0, depth = 0, colorType = -1, interlace = 0;
  const idat: Buffer[] = [];
  let palette: Buffer | null = null;
  let trns: Buffer | null = null;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const kind = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (kind === 'PLTE') palette = data;
    else if (kind === 'tRNS') trns = data;
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
  }
  if (!width || colorType < 0) fail('missing IHDR');
  if (interlace !== 0) fail('Adam7 interlace unsupported');
  if (depth !== 8 && depth !== 16) fail(`unsupported bit depth ${depth}`);
  if (![0, 2, 3, 4, 6].includes(colorType)) fail(`unsupported color type ${colorType}`);
  if (colorType === 3 && !palette) fail('palette image without PLTE');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]!;
  const raw = inflateSync(Buffer.concat(idat));
  const bop = depth === 16 ? 2 : 1;
  const stride = width * channels * bop;
  if (raw.length < height * (stride + 1)) fail(`truncated IDAT ${raw.length} < ${height * (stride + 1)}`);
  const px: Px[] = new Array(width * height);
  let prev = new Uint8Array(stride);
  let off = 0;
  for (let y = 0; y < height; y++) {
    const ft = raw[off++];
    const line = raw.subarray(off, off + stride);
    off += stride;
    const cur = new Uint8Array(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels * bop ? cur[i - channels * bop] : 0;
      const b = prev[i];
      const c = i >= channels * bop ? prev[i - channels * bop] : 0;
      let pred = 0;
      if (ft === 0) pred = 0;
      else if (ft === 1) pred = a;
      else if (ft === 2) pred = b;
      else if (ft === 3) pred = (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else fail(`unsupported PNG filter ${ft}`);
      cur[i] = (line[i] + pred) & 0xff;
    }
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, al = 255;
      const s = x * channels * bop;
      const v = (i: number) => (depth === 16 ? (cur[i] << 8 | cur[i + 1]) >> 8 : cur[i]);
      if (colorType === 0) { r = g = b = v(s); }
      else if (colorType === 2) { r = v(s); g = v(s + bop); b = v(s + 2 * bop); }
      else if (colorType === 3) {
        const idx = cur[s];
        if (!palette || idx * 3 + 2 >= palette.length) fail(`palette index ${idx} out of range`);
        r = palette[idx * 3]; g = palette[idx * 3 + 1]; b = palette[idx * 3 + 2];
        if (trns && idx < trns.length) al = trns[idx];
      } else if (colorType === 4) { r = g = b = v(s); al = v(s + bop); }
      else { r = v(s); g = v(s + bop); b = v(s + 2 * bop); al = v(s + 3 * bop); }
      px[y * width + x] = [r, g, b, al];
    }
    prev = cur;
  }
  return { width, height, px };
}

const luma = (p: Px) => (54 * p[0] + 183 * p[1] + 19 * p[2]) >> 8;
const r1 = (n: number) => Math.round(n * 10) / 10;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function percentile(sorted: number[], q: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))];
}

function profile(file: string) {
  const { width, height, px } = decodePng(readFileSync(file));
  const visible = px.filter((p) => p[3] >= 32);
  if (visible.length < 16) fail(`image has too few visible pixels: ${file}`);
  const lumas = visible.map(luma).sort((a, b) => a - b);
  const mean = lumas.reduce((s, v) => s + v, 0) / lumas.length;
  const darkShare = lumas.filter((v) => v < 32).length / lumas.length;
  const midShare = lumas.filter((v) => v >= 32 && v <= 160).length / lumas.length;
  const specular = lumas.filter((v) => v > 200).length / lumas.length;
  const bright = lumas.filter((v) => v > 160).length / lumas.length;

  // Palette: 4-bit-per-channel buckets, top clusters with exact shares.
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (const p of visible) {
    const key = ((p[0] >> 4) << 8) | ((p[1] >> 4) << 4) | (p[2] >> 4);
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += p[0]; e.g += p[1]; e.b += p[2];
    buckets.set(key, e);
  }
  const palette = [...buckets.entries()]
    .sort((x, y) => y[1].n - x[1].n)
    .slice(0, 8)
    .map(([, e]) => ({
      rgb: [Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n)] as [number, number, number],
      share: r3(e.n / visible.length),
    }));

  // Blue accent share (b dominant over r by margin, minimum presence).
  const blueShare = visible.filter((p) => p[2] > p[0] + 20 && p[2] > 60).length / visible.length;
  // Deep-blue family share (Prussian-range channels, not sky/cyan).
  const deepBlueShare = visible.filter((p) => p[2] > p[0] + 15 && p[2] >= 40 && p[2] <= 160).length / visible.length;
  const saturation = visible.reduce((s, p) => {
    const mx = Math.max(p[0], p[1], p[2]), mn = Math.min(p[0], p[1], p[2]);
    return s + (mx === 0 ? 0 : (mx - mn) / mx);
  }, 0) / visible.length;

  // Gradient profile: mean luminance per row/column eighth.
  const vBands: number[] = [], hBands: number[] = [];
  for (let b = 0; b < 8; b++) {
    let vs = 0, vn = 0, hs = 0, hn = 0;
    const y0 = Math.floor((b * height) / 8), y1 = Math.floor(((b + 1) * height) / 8);
    const x0 = Math.floor((b * width) / 8), x1 = Math.floor(((b + 1) * width) / 8);
    for (let y = y0; y < y1; y++) for (let x = 0; x < width; x++) {
      const p = px[y * width + x]; if (p[3] < 32) continue; vs += luma(p); vn++;
    }
    for (let y = 0; y < height; y++) for (let x = x0; x < x1; x++) {
      const p = px[y * width + x]; if (p[3] < 32) continue; hs += luma(p); hn++;
    }
    vBands.push(vn ? r1(vs / vn) : 0);
    hBands.push(hn ? r1(hs / hn) : 0);
  }

  // Reflectivity: light biased to the upper third vs lower third.
  const topMean = vBands.slice(0, 2).reduce((s, v) => s + v, 0) / 2;
  const bottomMean = vBands.slice(6).reduce((s, v) => s + v, 0) / 2;
  const topBias = r1(bottomMean > 1 ? topMean / bottomMean : topMean > 0 ? 99 : 0);

  // Brush anisotropy: Sobel |gy| vs |gx| energy on luminance.
  let gyE = 0, gxE = 0;
  for (let y = 1; y < height - 1; y += Math.max(1, Math.floor(height / 200))) {
    for (let x = 1; x < width - 1; x += Math.max(1, Math.floor(width / 200))) {
      const l = (xx: number, yy: number) => luma(px[yy * width + xx]);
      const gx =
        -l(x - 1, y - 1) - 2 * l(x - 1, y) - l(x - 1, y + 1) +
        l(x + 1, y - 1) + 2 * l(x + 1, y) + l(x + 1, y + 1);
      const gy =
        -l(x - 1, y - 1) - 2 * l(x, y - 1) - l(x + 1, y - 1) +
        l(x - 1, y + 1) + 2 * l(x, y + 1) + l(x + 1, y + 1);
      gxE += Math.abs(gx); gyE += Math.abs(gy);
    }
  }
  const anisotropy = r1(gxE > 0 ? gyE / gxE : 0); // >1 => horizontal streaks

  return {
    file, width, height,
    meanLuma: r1(mean),
    lumaP05: percentile(lumas, 0.05), lumaP50: percentile(lumas, 0.5), lumaP95: percentile(lumas, 0.95),
    darkShare: r3(darkShare), midShare: r3(midShare), brightShare: r3(bright), specularShare: r3(specular),
    topLightBias: topBias, anisotropyHorizontal: anisotropy,
    saturation: r3(saturation), blueShare: r3(blueShare), deepBlueShare: r3(deepBlueShare),
    vGradientBands: vBands, hGradientBands: hBands, palette,
  };
}

const profiles = files.map((f) => {
  try { return profile(f); } catch (e) { return { file: f, error: String((e as Error).message) }; }
});
if (json) console.log(JSON.stringify({ schema: 'image-read.v1', profiles }, null, 2));
else {
  console.log('IMAGE_READ schema=image-read.v1');
  for (const p of profiles) {
    if ('error' in p) { console.log(`${p.file}: ${p.error}`); continue; }
    console.log(`${p.file}: ${p.width}x${p.height} luma mean=${p.meanLuma} p05/p50/p95=${p.lumaP05}/${p.lumaP50}/${p.lumaP95}`);
    console.log(`  shares dark=${p.darkShare} mid=${p.midShare} bright=${p.brightShare} specular=${p.specularShare} blue=${p.blueShare} deepBlue=${p.deepBlueShare} sat=${p.saturation}`);
    console.log(`  reflect: topBias=${p.topLightBias} brushAnisotropyH=${p.anisotropyHorizontal}`);
    console.log(`  vBands=${p.vGradientBands.join(',')}`);
    console.log(`  hBands=${p.hGradientBands.join(',')}`);
    console.log(`  palette=${p.palette.map((c) => `rgb(${c.rgb.join(',')})@${c.share}`).join(' ')}`);
  }
}
