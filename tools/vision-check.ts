#!/usr/bin/env node
// vision-check.ts — blind, falsifiable image-sight verification for the chat model.
//
// Why it exists: MASTER repo.priorSessions records "SESSION LIMIT: the 01a082d3 chat model
// has NO image input". Sight is therefore a per-session capability that must be PROVEN,
// not assumed, before any imaging/photo-receipt work (docs/imaging-contract.md P7/P8).
//
// Anti-fake design: `gen` draws randomized content from crypto randomness and SEALS the
// answer key to a path outside the repo. Only the image path + hashes are printed, so the
// agent's text context never contains the answer. The agent views ONLY the pixels, commits
// a reading to JSON, and `grade` diffs reading vs sealed key afterwards. A model without
// sight cannot pass; a model with sight cannot cheat from context.
//
// Usage:
//   node tools/vision-check.ts gen   --out=IMG.png --key=/tmp/key.json [--seed=HEX]
//   node tools/vision-check.ts grade --key=/tmp/key.json --reading=READ.json [--json]
//   node tools/vision-check.ts selftest
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { deflateSync } from 'node:zlib';

type Rgb = [number, number, number];

const PALETTE: Record<string, Rgb> = {
  RED: [220, 40, 40], GREEN: [40, 190, 80], BLUE: [60, 120, 240], YELLOW: [240, 210, 50],
  MAGENTA: [220, 60, 200], CYAN: [60, 210, 220], ORANGE: [240, 140, 40], WHITE: [245, 245, 245],
};
const BACKGROUNDS: Record<string, Rgb> = {
  BLACK: [12, 12, 14], 'DARK BLUE': [14, 22, 56], 'DARK GREY': [58, 58, 62], 'DARK GREEN': [10, 46, 26],
};
const SHAPES = ['CIRCLE', 'SQUARE', 'TRIANGLE', 'DIAMOND'] as const;
type Shape = (typeof SHAPES)[number];
// Words are project vocabulary so the render looks like a repo artifact, but WHICH word,
// code, shape, count and colours appear is decided by crypto randomness at gen time.
const WORDS = ['BLIZZARD', 'VOIDMUSL', 'OMEN45L', 'GEFORCE', 'COOLBITS', 'ZFSBOOT', 'PICOM', 'XFWM4'];

// ---------------------------------------------------------------- 5x7 glyph font
// Compact encoding: "<char><7 base32 digits>", one row per digit, 5 bits per row (MSB = left
// pixel). '_' stands for space. Expanded once at load into FONT[char] = 7 rows of 5 bits.
const FONT_ENC =
  '0ehjlphe 14c4444e 2eh1248v 3v2421he 426aiv22 5vgu11he 668guhhe 7v124888 8ehhehhe 9ehhf12c ' +
  'Aehhvhhh Buhhuhhu Cehggghe Dsihhhis Evgguggv Fvgguggg Gehgnhhf Hhhhvhhh Ie44444e J72222ic ' +
  'Khikokih Lggggggv Mhrllhhh Nhpljhhh Oehhhhhe Puhhuggg Qehhhlid Ruhhukih Sfgge11u Tv444444 ' +
  'Uhhhhhhe Vhhhhha4 Whhhllrh Xhha4ahh Yhha4444 Zv1248gv _0000000';
const FONT: Record<string, string[]> = {};
for (const tok of FONT_ENC.split(' ')) {
  if (!tok) continue;
  const ch = tok[0] === '_' ? ' ' : tok[0];
  FONT[ch] = [...tok.slice(1)].map((d) => parseInt(d, 32).toString(2).padStart(5, '0'));
}

// ---------------------------------------------------------------- canvas
class Canvas {
  readonly w: number;
  readonly h: number;
  private readonly buf: Uint8Array;
  constructor(w: number, h: number, bg: Rgb) {
    this.w = w;
    this.h = h;
    this.buf = new Uint8Array(w * h * 3);
    for (let i = 0; i < w * h; i++) { this.buf[i * 3] = bg[0]; this.buf[i * 3 + 1] = bg[1]; this.buf[i * 3 + 2] = bg[2]; }
  }
  set(x: number, y: number, c: Rgb): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.buf[i] = c[0]; this.buf[i + 1] = c[1]; this.buf[i + 2] = c[2];
  }
  rect(x0: number, y0: number, w: number, h: number, c: Rgb): void {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, c);
  }
  text(s: string, x0: number, y0: number, scale: number, c: Rgb): void {
    let cx = x0;
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch] ?? FONT[' '];
      for (let gy = 0; gy < 7; gy++) {
        for (let gx = 0; gx < 5; gx++) {
          if (g[gy][gx] === '1') this.rect(cx + gx * scale, y0 + gy * scale, scale, scale, c);
        }
      }
      cx += 6 * scale;
    }
  }
  shape(kind: Shape, cx: number, cy: number, r: number, c: Rgb): void {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx, dy = y - cy;
        let inside = false;
        if (kind === 'CIRCLE') inside = dx * dx + dy * dy <= r * r;
        else if (kind === 'SQUARE') inside = Math.abs(dx) <= r * 0.85 && Math.abs(dy) <= r * 0.85;
        else if (kind === 'DIAMOND') inside = Math.abs(dx) + Math.abs(dy) <= r;
        else inside = dy >= -r * 0.8 && dy <= r * 0.8 && Math.abs(dx) <= ((r * 0.8 - dy) / 1.6);
        if (inside) this.set(x, y, c);
      }
    }
  }
  png(): Buffer {
    const stride = this.w * 3;
    const raw = Buffer.alloc((stride + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (stride + 1)] = 0; // filter: none — keeps output byte-deterministic
      Buffer.from(this.buf.subarray(y * stride, (y + 1) * stride)).copy(raw, y * (stride + 1) + 1);
    }
    const chunk = (kind: string, data: Buffer): Buffer => {
      const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
      const body = Buffer.concat([Buffer.from(kind, 'ascii'), data]);
      const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
      return Buffer.concat([len, body, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0); ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; ihdr[9] = 2;
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

let CRC_TABLE: Int32Array | null = null;
function crc32(buf: Buffer): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

// ---------------------------------------------------------------- deterministic RNG from seed
function rng(seedHex: string): () => number {
  let counter = 0;
  let pool = Buffer.alloc(0);
  let off = 0;
  return () => {
    if (off + 4 > pool.length) { pool = createHash('sha256').update(`${seedHex}:${counter++}`).digest(); off = 0; }
    const v = pool.readUInt32BE(off); off += 4;
    return v / 0x100000000;
  };
}
const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

// ---------------------------------------------------------------- challenge
interface Key {
  seed: string; width: number; height: number; background: string; word: string; code: string;
  shape: Shape; shape_count: number; shape_color: string; word_color: string;
  code_color: string; bar_count: number;
}

function buildKey(seedHex: string): Key {
  const r = rng(seedHex);
  const colorNames = Object.keys(PALETTE);
  const shape_color = pick(r, colorNames);
  const word_color = pick(r, colorNames.filter((c) => c !== shape_color));
  const code_color = pick(r, colorNames.filter((c) => c !== shape_color && c !== word_color));
  return {
    seed: seedHex,
    width: 760,
    height: 460,
    background: pick(r, Object.keys(BACKGROUNDS)),
    word: pick(r, WORDS),
    code: String(Math.floor(r() * 90000) + 10000), // 5 digits, exists nowhere in agent context
    shape: pick(r, SHAPES),
    shape_count: 2 + Math.floor(r() * 5), // 2..6
    shape_color,
    word_color,
    code_color,
    bar_count: 1 + Math.floor(r() * 5), // 1..5
  };
}

function render(k: Key): Buffer {
  const c = new Canvas(k.width, k.height, BACKGROUNDS[k.background]);
  c.text(k.word, 40, 44, 6, PALETTE[k.word_color]);
  c.text(k.code, 40, 150, 9, PALETTE[k.code_color]);
  const r = 34;
  for (let i = 0; i < k.shape_count; i++) c.shape(k.shape, 74 + i * 96, 300, r, PALETTE[k.shape_color]);
  for (let i = 0; i < k.bar_count; i++) c.rect(40 + i * 40, 400, 26, 30, PALETTE[k.word_color]);
  return c.png();
}

const GRADED: (keyof Key)[] = [
  'width', 'height', 'background', 'word', 'code', 'shape',
  'shape_count', 'shape_color', 'word_color', 'code_color', 'bar_count',
];

function arg(name: string): string | undefined {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) { console.error(`ERROR: --${name}= is required`); process.exit(1); }
  return v;
}
const sha256 = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
const norm = (v: unknown): string => String(v).trim().toUpperCase().replace(/\s+/g, ' ');
function cmdGen(): void {
  const out = need('out'), keyPath = need('key');
  const k = buildKey(arg('seed') ?? randomBytes(16).toString('hex'));
  const png = render(k);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  mkdirSync(dirname(keyPath), { recursive: true });
  const keyJson = `${JSON.stringify(k, null, 2)}\n`;
  writeFileSync(keyPath, keyJson);
  // Print NOTHING that reveals content: paths and hashes only. The key hash is the seal —
  // it proves after grading that the key was fixed BEFORE the reading was written.
  console.log('VISION CHALLENGE GENERATED');
  console.log(`image      ${out}`);
  console.log(`image_sha  ${sha256(png)}`);
  console.log(`bytes      ${png.length}`);
  console.log(`key_sealed ${keyPath} (NOT printed)`);
  console.log(`key_sha    ${sha256(Buffer.from(keyJson))}`);
  console.log(`fields     ${GRADED.join(',')}`);
}

function cmdGrade(): void {
  const keyRaw = readFileSync(need('key'));
  const k = JSON.parse(keyRaw.toString()) as Key;
  const reading = JSON.parse(readFileSync(need('reading'), 'utf8')) as Record<string, unknown>;
  const rows = GRADED.map((f) => {
    const got = reading[f], want = k[f];
    const ok = got !== undefined && norm(got) === norm(want);
    return { field: f, read: got === undefined ? '(missing)' : String(got), truth: String(want), result: ok ? 'PASS' : 'FAIL' };
  });
  const pass = rows.filter((r) => r.result === 'PASS').length;
  const verdict = pass === rows.length ? 'PASS' : 'FAIL';
  if (arg('json') !== undefined || process.argv.includes('--json')) {
    console.log(JSON.stringify({ verdict, pass, total: rows.length, key_sha: sha256(keyRaw), rows }, null, 2));
    if (verdict !== 'PASS') process.exit(2);
    return;
  }
  console.log('| field | read blind | ground truth | result |');
  console.log('|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.field} | ${r.read} | ${r.truth} | ${r.result} |`);
  console.log(`\nkey_sha  ${sha256(keyRaw)}`);
  console.log(`VISION_TEST=${verdict} (${pass}/${rows.length} fields)`);
  if (verdict !== 'PASS') process.exit(2);
}

function cmdSelftest(): void {
  const checks: [string, boolean][] = [];
  // same seed => byte-identical image and key (determinism, so a receipt is reproducible)
  const a = buildKey('deadbeef'), b = buildKey('deadbeef');
  checks.push(['seed determinism (key)', JSON.stringify(a) === JSON.stringify(b)]);
  checks.push(['seed determinism (png)', sha256(render(a)) === sha256(render(b))]);
  checks.push(['different seeds differ', sha256(render(buildKey('1111'))) !== sha256(render(buildKey('2222')))]);
  const png = render(a);
  checks.push(['png signature', png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))]);
  checks.push(['png IEND', png.subarray(png.length - 8, png.length - 4).toString('ascii') === 'IEND']);
  // the repo's own PNG reader must be able to decode what we emit (image-read.ts contract)
  checks.push(['ihdr dims', png.readUInt32BE(16) === a.width && png.readUInt32BE(20) === a.height]);
  checks.push(['code is 5 digits', /^\d{5}$/.test(a.code)]);
  checks.push(['shape_count in 2..6', a.shape_count >= 2 && a.shape_count <= 6]);
  checks.push(['colors distinct', new Set([a.shape_color, a.word_color, a.code_color]).size === 3]);
  checks.push(['graded fields all in key', GRADED.every((f) => f in a)]);
  let bad = 0;
  for (const [name, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`); if (!ok) bad++; }
  console.log(`vision-check selftest: ${checks.length - bad}/${checks.length}`);
  if (bad) process.exit(1);
}

const sub = process.argv[2];
if (sub === 'gen') cmdGen();
else if (sub === 'grade') cmdGrade();
else if (sub === 'selftest') cmdSelftest();
else {
  console.error('usage: node tools/vision-check.ts <gen|grade|selftest>');
  console.error('  gen   --out=IMG.png --key=/tmp/key.json [--seed=HEX]');
  console.error('  grade --key=/tmp/key.json --reading=READ.json [--json]');
  process.exit(1);
}
