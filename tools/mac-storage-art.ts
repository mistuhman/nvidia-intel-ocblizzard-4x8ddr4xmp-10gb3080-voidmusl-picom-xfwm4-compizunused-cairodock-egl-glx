#!/usr/bin/env node
// Agentic imaging pass-compiler for the Mac Pro 1,1 storage diagram.
//
// The pipeline is modelled on a compiler: every stage consumes the previous
// stage's output, emits diagnostics with codes and severities, and the loop
// (critique -> deduct -> re-emit) drives the residual error set toward zero.
// Same inputs -> same stdout bytes. Zero dependencies.
//
// Passes
//   P0 harvest      load the fact ledger; every fact must carry a source
//   P1 lex          tokenize operator prompts into a numbered demand list
//   P2 resolve      bind scene nodes to facts
//   P3 typecheck    hardware/RAID arithmetic semantics
//   P4 layout       geometry solve: bounds, overlap, leader lines, text fit
//   P5 stylecheck   style-contract tokens present in the emitted prompt
//   P6 emit         assemble the render prompt, hash it, write it to disk
//   P7 render       external (agent calls the image tool); artifact recorded
//   P8 pixel-audit  decode the PNG, measure it against the style contract
//   P9 critique     structured findings from visual review
//   P10 deduct      map findings -> patches -> next pass; stop at fixpoint
//
// Usage
//   node tools/mac-storage-art.ts passes
//   node tools/mac-storage-art.ts facts [--only=HIGH] [--json]
//   node tools/mac-storage-art.ts demands
//   node tools/mac-storage-art.ts ir [--plate=ID]
//   node tools/mac-storage-art.ts lint [--json]
//   node tools/mac-storage-art.ts layout [--plate=ID]
//   node tools/mac-storage-art.ts prompt --plate=ID --pass=N
//   node tools/mac-storage-art.ts render --plate=ID --pass=N --file=docs/x.png
//   node tools/mac-storage-art.ts audit --file=docs/x.png
//   node tools/mac-storage-art.ts findings --plate=ID --pass=N --add='{...}'
//   node tools/mac-storage-art.ts deduct [--plate=ID]
//   node tools/mac-storage-art.ts patch --plate=ID --node=ID --set=text:BAY1
//   node tools/mac-storage-art.ts svg --plate=ID --out=docs/x.svg
//   node tools/mac-storage-art.ts queue --add="next instruction"
//   node tools/mac-storage-art.ts next
//   node tools/mac-storage-art.ts status
//   node tools/mac-storage-art.ts selftest

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

const FACTS = 'docs/macpro-storage-facts.json';
const SCENE = 'docs/macpro-storage-scene.json';
const STYLE = 'docs/macpro-storage-style.md';
const PROMPTS = 'docs/macpro-storage-prompts.jsonl';
const LEDGER = 'receipts/mac-art/pass-ledger.json';
const PROMPTDIR = 'receipts/mac-art/prompts';

type Severity = 'ERROR' | 'WARN' | 'INFO';
type Diag = { code: string; severity: Severity; plate?: string; node?: string; fact?: string; message: string };

type Fact = { id: string; topic: string; claim: string; value?: string; source?: { ref?: string; url?: string; quote?: string }; confidence?: string };
type FactsFile = { schema?: string; updated?: string; subject?: string; facts: Fact[] };

type Node = {
  id: string; kind: string; x: number; y: number; w: number; h: number;
  text: string; detail: string; facts?: string[];
  // parent: the node lives inside this box, so parent/child overlap is legal.
  // Cables are routing elements and are exempt from the overlap rule.
  parent?: string;
};
// renderNotes carry the deductions from the critique pass back into the IR, so a
// recompiled prompt fixes the defect instead of a hand-edited prompt file.
type Plate = { id: string; title: string; purpose: string; canvas: { w: number; h: number }; view: string; nodes: Node[]; renderNotes?: string[] };
type Scene = {
  schema?: string; updated?: string; styleContract?: string; factsLedger?: string;
  textBudget?: { maxWords?: number; maxChars?: number; reasonFact?: string };
  machine?: { id?: string; model?: string; bays?: { id: string; index: number; occupant: string }[]; slots?: { id: string; name: string; lanes: string; occupant?: string }[]; optical?: { count: number; bus: string } };
  raid?: { level?: number; members?: number; memberCapacityTB?: number; rawTB?: number; usableTB?: number; tolerance?: number; filesystem?: string };
  plates: Plate[];
};

type Artifact = { file: string; sha256: string; bytes: number; w: number; h: number };
type Finding = { code: string; severity: Severity; node?: string; note?: string; from?: string };
type PassRecord = { pass: number; promptFile?: string; promptHash?: string; artifacts: Artifact[]; audit?: Record<string, number | string>; auditVerdict?: string; findings: Finding[]; patches: string[]; verdict: string };
type Ledger = { schema: string; updated?: string; plates: Record<string, { passes: PassRecord[]; nextPass: number }> };

const PASSES: { id: string; name: string; consumes: string; emits: string; deducts: string }[] = [
  { id: 'P0', name: 'harvest', consumes: 'docs/macpro-storage-facts.json', emits: 'fact table + confidence', deducts: 'unsourced or LOW-confidence claims used by a plate' },
  { id: 'P1', name: 'lex', consumes: 'docs/macpro-storage-prompts.jsonl', emits: 'numbered demand list', deducts: 'operator clauses that match no grammar rule' },
  { id: 'P2', name: 'resolve', consumes: 'fact table + scene IR', emits: 'bound node graph', deducts: 'nodes with no fact binding, dangling fact ids' },
  { id: 'P3', name: 'typecheck', consumes: 'bound node graph + machine model', emits: 'hardware/RAID semantics', deducts: 'bay count, RAID capacity arithmetic, bus/link sanity' },
  { id: 'P4', name: 'layout', consumes: 'node boxes', emits: 'coordinates, wrap plan', deducts: 'out-of-bounds, overlapping boxes, text overflow' },
  { id: 'P5', name: 'stylecheck', consumes: 'docs/macpro-storage-style.md', emits: 'token coverage', deducts: 'missing style tokens and negative constraints' },
  { id: 'P6', name: 'emit', consumes: 'IR + style + layout', emits: 'render prompt + sha256', deducts: 'prompt drift (hash change without IR change)' },
  { id: 'P7', name: 'render', consumes: 'prompt file', emits: 'PNG artifact', deducts: 'missing artifact, wrong aspect ratio' },
  { id: 'P8', name: 'pixel-audit', consumes: 'PNG bytes', emits: 'luminance/contrast/edge metrics', deducts: 'blank plates, washed-out panels, missing silver text' },
  { id: 'P9', name: 'critique', consumes: 'visual review', emits: 'structured findings', deducts: 'unclassified defects' },
  { id: 'P10', name: 'deduct', consumes: 'findings + audit', emits: 'patches + next pass', deducts: 'residual error set toward zero, stop at fixpoint' },
];

const LEX_RULES: { code: string; re: RegExp; label: string }[] = [
  { code: 'D-READ-README', re: /read\s+readme\.md/i, label: 'read README.md' },
  { code: 'D-READ-MASTER', re: /read\s+master\.md/i, label: 'read MASTER.md' },
  { code: 'D-ART-DIAGRAM', re: /\bdiagram\b/i, label: 'produce a diagram' },
  { code: 'D-SUBJECT-MACPRO11', re: /mac\s*pro\s*1,?1/i, label: 'subject is the Mac Pro 1,1' },
  { code: 'D-DETAIL-MACHINE', re: /\bdetailing?\b|\bproper visualization\b/i, label: 'accurate detailing of the machine' },
  { code: 'D-ICON-OSX', re: /mac\s*os\s*x\s+iconography/i, label: 'Mac OS X iconography' },
  { code: 'D-ICON-SKEUO', re: /ske?umorphic/i, label: 'skeuomorphic sub-iconography' },
  { code: 'D-BTC-COLD', re: /btc\s+cold\s+storage|bitcoin/i, label: 'BTC cold storage purpose' },
  { code: 'D-3X1TB', re: /3\s+1\s?tb\s+hdd|three\s+1\s?tb/i, label: 'three 1 TB HDDs' },
  { code: 'D-REPLACEMENTS', re: /replacements?/i, label: 'drives are replacements' },
  { code: 'D-RAID5', re: /raid\s*5/i, label: 'RAID 5' },
  { code: 'D-PCIE-CARD', re: /\bpcie\b/i, label: 'RAID lives on a PCIe controller' },
  { code: 'D-BOOT-SSD', re: /boot\s+ssd|\bthe ssd\b/i, label: 'separate boot SSD' },
  { code: 'D-TOOL-TS', re: /typescript\s+tool|agentic/i, label: 'TypeScript agentic tool' },
  { code: 'D-IMG-GEN', re: /generating images|image generation/i, label: 'image generation routed through the tool' },
  { code: 'D-PASS-CYCLE', re: /reproduc\w*\s+cycle|granular/i, label: 'granular reproduction cycle' },
  { code: 'D-PASS-COMPILER', re: /compil\w*\s+passes|compiling passes/i, label: 'compiler-like passes' },
  { code: 'D-ACCURACY', re: /absolute\s+accuracy/i, label: 'deduce for absolute accuracy' },
  { code: 'D-STYLE-QUAKE', re: /quake\s+live/i, label: 'Quake Live UI style' },
  { code: 'D-STYLE-HEX', re: /hexagonal/i, label: 'hexagonal back panels' },
  { code: 'D-STYLE-AMOLED', re: /amoled/i, label: 'semi transparent AMOLED black panels' },
  { code: 'D-STYLE-SILVER', re: /silver\s+white/i, label: 'silver-white lining' },
  { code: 'D-STYLE-GLOSS', re: /glossy/i, label: 'glossy lining elements' },
  { code: 'D-LABEL-PURPOSE', re: /labell?ed with its purpose|each one being labelled/i, label: 'every drive labelled with purpose' },
  { code: 'D-DRIVE-POSITION', re: /correct place on the mac|shown in the correct place/i, label: 'drives in their real bay position' },
  { code: 'D-REUSABLE', re: /reuse between the user and model|for reuse/i, label: 'artifact reusable by operator and model' },
  { code: 'D-CONTINUE', re: /continue with further user prompt|further user prompt/i, label: 'accept and continue with further prompts' },
];

const STYLE_TOKENS = [
  'amoled-black', 'panel-black-70', 'silver-white', 'gloss-edge', 'gunmetal', 'quake-amber', 'raid-cyan', 'cold-ice',
  'hexagonal', 'semi transparent', 'glossy', 'skeuomorphic', 'padlock', 'SFF-8087',
];
const NEGATIVE_CONSTRAINTS = [
  'no-text-walls', 'no-paragraph-in-image', 'no-watermark', 'no-photoreal-human', 'no-brand-logo-watermark',
  'no-neon-glow-bloom', 'no-blurry-icons', 'no-extra-drives', 'no-macbook', 'no-rack-server',
  'no-invented-port-counts', 'no-raid-5-in-disk-utility', 'no-apfs-on-10-7',
];

function loadJson<T>(path: string): T {
  if (!existsSync(path)) { console.error(`missing ${path}`); process.exit(1); }
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}
function loadText(path: string): string {
  if (!existsSync(path)) { console.error(`missing ${path}`); process.exit(1); }
  return readFileSync(path, 'utf8');
}
function sha256(buf: Buffer | string): string { return createHash('sha256').update(buf).digest('hex'); }
function words(s: string): string[] { return s.split(/\s+/).filter(Boolean); }
// Punctuation-only tokens (middots, slashes, bullets) are separators, not words:
// "BAY 1 · BOOT SSD" is four words, not five.
function realWords(s: string): string[] { return words(s).filter((t) => /[a-z0-9]/i.test(t)); }

function loadLedger(): Ledger {
  if (!existsSync(LEDGER)) return { schema: 'mac-art-ledger.v1', plates: {} };
  return JSON.parse(readFileSync(LEDGER, 'utf8')) as Ledger;
}
function saveLedger(l: Ledger): void {
  mkdirSync('receipts/mac-art', { recursive: true });
  writeFileSync(LEDGER, JSON.stringify(l, null, 2) + '\n');
}
function plateEntry(l: Ledger, plate: string): { passes: PassRecord[]; nextPass: number } {
  if (!l.plates[plate]) l.plates[plate] = { passes: [], nextPass: 1 };
  return l.plates[plate];
}

// ---------------------------------------------------------------- P0 harvest
function harvest(facts: FactsFile, scene: Scene): Diag[] {
  const d: Diag[] = [];
  const known = new Set(facts.facts.map((f) => f.id));
  const used = new Set<string>();
  for (const p of scene.plates) for (const n of p.nodes) for (const f of n.facts ?? []) used.add(f);
  for (const f of facts.facts) {
    const src = f.source ?? {};
    if (!src.ref && !src.url) d.push({ code: 'ART-F-001', severity: 'ERROR', fact: f.id, message: `fact ${f.id} has no source ref or url` });
    if (!f.confidence) d.push({ code: 'ART-F-002', severity: 'ERROR', fact: f.id, message: `fact ${f.id} has no confidence rating` });
    if (f.confidence === 'LOW') d.push({ code: 'ART-F-003', severity: 'WARN', fact: f.id, message: `fact ${f.id} is LOW confidence: ${f.topic}` });
  }
  const ids = [...used].sort();
  for (const id of ids) if (!known.has(id)) d.push({ code: 'ART-F-004', severity: 'ERROR', fact: id, message: `scene references unknown fact ${id}` });
  return d;
}

// -------------------------------------------------------------------- P1 lex
function lex(): { diags: Diag[]; demands: { code: string; label: string; hits: number }[]; unparsed: string[]; coverage: number } {
  const diags: Diag[] = [];
  const lines = loadText(PROMPTS).split(/\r?\n/).filter((l) => l.trim().length > 0);
  const hits = new Map<string, number>();
  const unparsed: string[] = [];
  let clauses = 0;
  for (const line of lines) {
    let entry: { verbatim?: string } = {};
    try { entry = JSON.parse(line); } catch { continue; }
    const text = entry.verbatim ?? '';
    // Split on commas/semicolons/terminal periods and "then" only. Splitting on
    // "and"/"so" shredded filenames ("read README.md" -> "read README") and
    // produced phantom unparsed clauses.
    for (const clause of text.split(/[,;]|\.(?=\s|$)|\bthen\b/i).map((s) => s.trim()).filter(Boolean)) {
      clauses += 1;
      let matched = false;
      for (const rule of LEX_RULES) {
        if (rule.re.test(clause)) { hits.set(rule.code, (hits.get(rule.code) ?? 0) + 1); matched = true; }
      }
      if (!matched && clause.length > 3) unparsed.push(clause);
    }
  }
  for (const c of unparsed) diags.push({ code: 'ART-L-001', severity: 'WARN', message: `unparsed operator clause: "${c}"` });
  const demands = [...hits.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([code, n]) => ({
    code,
    label: LEX_RULES.find((r) => r.code === code)?.label ?? code,
    hits: n,
  }));
  const coverage = clauses === 0 ? 0 : Math.round(((clauses - unparsed.length) / clauses) * 100);
  if (coverage < 70) diags.push({ code: 'ART-L-002', severity: 'WARN', message: `demand coverage ${coverage}% is below the 70% floor` });
  return { diags, demands, unparsed, coverage };
}

// --------------------------------------------------------------- P2 resolve
function resolve(facts: FactsFile, scene: Scene): Diag[] {
  const d: Diag[] = [];
  const known = new Set(facts.facts.map((f) => f.id));
  for (const p of scene.plates) {
    for (const n of p.nodes) {
      if (!n.text) d.push({ code: 'ART-R-001', severity: 'ERROR', plate: p.id, node: n.id, message: 'node has no short label' });
      if (!n.detail) d.push({ code: 'ART-R-002', severity: 'ERROR', plate: p.id, node: n.id, message: 'node has no overlay detail text' });
      for (const f of n.facts ?? []) if (!known.has(f)) d.push({ code: 'ART-R-003', severity: 'ERROR', plate: p.id, node: n.id, message: `unknown fact ${f}` });
      for (const f of n.facts ?? []) {
        const conf = facts.facts.find((x) => x.id === f)?.confidence;
        if (conf === 'LOW') d.push({ code: 'ART-R-004', severity: 'WARN', plate: p.id, node: n.id, fact: f, message: `node leans on LOW-confidence fact ${f}` });
      }
    }
  }
  return d;
}

// ------------------------------------------------------------- P3 typecheck
function typecheck(scene: Scene): Diag[] {
  const d: Diag[] = [];
  const m = scene.machine;
  const r = scene.raid;
  if (!m?.bays) { d.push({ code: 'ART-T-001', severity: 'ERROR', message: 'machine has no bays' }); return d; }
  if (m.bays.length !== 4) d.push({ code: 'ART-T-002', severity: 'ERROR', message: `bay count ${m.bays.length} != 4 (Apple: four bays)` });
  const idx = m.bays.map((b) => b.index);
  for (const b of m.bays) if (idx.filter((i) => i === b.index).length !== 1) d.push({ code: 'ART-T-003', severity: 'ERROR', message: `duplicate bay index ${b.index}` });
  if (r) {
    const expectUsable = (r.members ?? 0) > 0 ? ((r.members as number) - (r.level === 5 ? 1 : 0)) * (r.memberCapacityTB as number) : 0;
    if (r.level === 5 && (r.members ?? 0) < 3) d.push({ code: 'ART-T-004', severity: 'ERROR', message: 'RAID 5 needs at least three members' });
    if (r.usableTB !== expectUsable) d.push({ code: 'ART-T-005', severity: 'ERROR', message: `usable ${r.usableTB} TB != computed ${expectUsable} TB for RAID ${r.level} of ${r.members} x ${r.memberCapacityTB} TB` });
    if (r.level === 5 && r.tolerance !== 1) d.push({ code: 'ART-T-006', severity: 'ERROR', message: `RAID 5 tolerates exactly 1 member loss, scene says ${r.tolerance}` });
    if (r.filesystem && !/Mac OS Extended|HFS\+/.test(r.filesystem)) d.push({ code: 'ART-T-007', severity: 'ERROR', message: `10.7 cannot mount ${r.filesystem}; use Mac OS Extended (Journaled)` });
  }
  const boot = m.bays.find((b) => b.occupant === 'ssd-boot');
  if (!boot) d.push({ code: 'ART-T-008', severity: 'ERROR', message: 'no bay carries the boot SSD' });
  if (boot && boot.index !== 1) d.push({ code: 'ART-T-009', severity: 'WARN', message: `boot SSD is in bay ${boot.index}; repo receipts put Lion SSD Base in Bay 1` });
  const members = m.bays.filter((b) => b.occupant.startsWith('hdd-member')).length;
  if (members !== 3) d.push({ code: 'ART-T-010', severity: 'ERROR', message: `${members} HDD members declared, directive says 3` });
  const card = m.slots?.find((s) => s.occupant === 'raid-card');
  if (!card) d.push({ code: 'ART-T-011', severity: 'ERROR', message: 'no PCIe slot carries the RAID card' });
  if (card && !/^x(4|8|16)$/.test(card.lanes)) d.push({ code: 'ART-T-012', severity: 'WARN', message: `RAID card in a ${card.lanes} slot; PCIe 1.0 x1 starves three HDDs` });
  return d;
}

// ---------------------------------------------------------------- P4 layout
function wrapText(text: string, boxWidthPx: number, fontSize: number): string[] {
  const charW = fontSize * 0.55;
  const perLine = Math.max(4, Math.floor(boxWidthPx / charW));
  const out: string[] = [];
  let line = '';
  for (const w of words(text)) {
    if (line.length === 0) line = w;
    else if ((line + ' ' + w).length <= perLine) line += ' ' + w;
    else { out.push(line); line = w; }
  }
  if (line) out.push(line);
  return out;
}
const HEADER_PX = 20;
const BODY_PX = 11;
const LINE_H = 1.3;

function layout(scene: Scene, plateId?: string): { diags: Diag[]; rows: string[] } {
  const d: Diag[] = [];
  const rows: string[] = [];
  const budget = scene.textBudget ?? {};
  const maxWords = budget.maxWords ?? 4;
  const maxChars = budget.maxChars ?? 24;
  for (const p of scene.plates) {
    if (plateId && p.id !== plateId) continue;
    const cw = p.canvas.w / 100;
    const ch = p.canvas.h / 100;
    for (const n of p.nodes) {
      if (n.x < 0 || n.y < 0 || n.x + n.w > 100 || n.y + n.h > 100) {
        d.push({ code: 'ART-G-001', severity: 'ERROR', plate: p.id, node: n.id, message: `box ${n.x},${n.y} ${n.w}x${n.h} leaves the canvas` });
      }
      const nw = realWords(n.text).length;
      if (nw > maxWords) d.push({ code: 'ART-G-002', severity: 'ERROR', plate: p.id, node: n.id, message: `in-image label "${n.text}" is ${nw} words (budget ${maxWords})` });
      if (n.text.length > maxChars) d.push({ code: 'ART-G-003', severity: 'ERROR', plate: p.id, node: n.id, message: `in-image label "${n.text}" is ${n.text.length} chars (budget ${maxChars})` });
      const lines = wrapText(n.detail, n.w * cw - 16, BODY_PX);
      const cap = Math.floor((n.h * ch - HEADER_PX - 10) / (BODY_PX * LINE_H));
      if (lines.length > cap) d.push({ code: 'ART-G-004', severity: 'WARN', plate: p.id, node: n.id, message: `overlay detail needs ${lines.length} lines but the box fits ${cap}` });
      rows.push(`${p.id}\t${n.id}\t${n.kind}\tbox=${n.x},${n.y},${n.w}x${n.h}\tlabel="${n.text}"\tlines=${lines.length}/${cap}`);
    }
    for (let i = 0; i < p.nodes.length; i += 1) {
      for (let j = i + 1; j < p.nodes.length; j += 1) {
        const a = p.nodes[i];
        const b = p.nodes[j];
        if (a.parent === b.id || b.parent === a.id) continue;
        if (a.kind === 'cable' || b.kind === 'cable') continue;
        // containers legitimately enclose everything drawn inside them
        if (a.kind === 'chassis' || b.kind === 'chassis') continue;
        const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
        const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        const overlap = ox * oy;
        if (overlap > 12) d.push({ code: 'ART-G-005', severity: 'WARN', plate: p.id, node: `${a.id}~${b.id}`, message: `boxes overlap by ${overlap.toFixed(1)} sq-units (${a.id} vs ${b.id})` });
      }
    }
  }
  return { diags: d, rows };
}

// ------------------------------------------------------------- P5 stylecheck
function stylecheck(prompt: string): Diag[] {
  const d: Diag[] = [];
  const lower = prompt.toLowerCase();
  for (const t of STYLE_TOKENS) if (!lower.includes(t.toLowerCase())) d.push({ code: 'ART-S-001', severity: 'ERROR', message: `style token missing from prompt: ${t}` });
  for (const t of NEGATIVE_CONSTRAINTS) if (!lower.includes(t.toLowerCase())) d.push({ code: 'ART-S-002', severity: 'ERROR', message: `negative constraint missing from prompt: ${t}` });
  return d;
}

// ------------------------------------------------------------------ P6 emit
function emitPrompt(scene: Scene, style: string, plateId: string, pass: number): { text: string; file: string; hash: string } {
  const plate = scene.plates.find((p) => p.id === plateId);
  if (!plate) { console.error(`unknown plate ${plateId}`); process.exit(1); }
  const lines: string[] = [];
  lines.push(`PLATE ${plate.id} — ${plate.title}`);
  lines.push(`PURPOSE: ${plate.purpose}`);
  lines.push(`VIEW: ${plate.view}`);
  lines.push(`CANVAS: ${plate.canvas.w} x ${plate.canvas.h} px (fixed aspect, do not crop)`);
  lines.push('');
  lines.push('ELEMENTS (draw every one, in exactly these relative positions, x/y/w/h are percent of canvas, origin top-left):');
  for (const n of plate.nodes) {
    lines.push(`- ${n.id} [${n.kind}] at x=${n.x} y=${n.y} w=${n.w} h=${n.h}`);
    lines.push(`    SHORT LABEL (the only text allowed inside the image): ${n.text}`);
    lines.push(`    MEANING (convey visually, do not render as text): ${n.detail}`);
  }
  lines.push('');
  lines.push('STYLE CONTRACT (authoritative, from docs/macpro-storage-style.md):');
  lines.push(style.trim());
  lines.push('');
  lines.push(`NEGATIVE CONSTRAINTS: ${NEGATIVE_CONSTRAINTS.join(', ')}.`);
  if (plate.renderNotes?.length) {
    lines.push('');
    lines.push(`PASS-${pass} CORRECTIONS (carried in the scene IR; each one closes a critique finding):`);
    for (const note of plate.renderNotes) lines.push(`- ${note}`);
  }
  lines.push('Render text sparingly: only the SHORT LABEL strings above, in silver-white heavy condensed caps.');
  lines.push(`PASS: ${pass}`);
  const text = lines.join('\n');
  mkdirSync(PROMPTDIR, { recursive: true });
  const file = `${PROMPTDIR}/${plate.id}-p${pass}.txt`;
  writeFileSync(file, text);
  return { text, file, hash: sha256(text) };
}

// --------------------------------------------------------- P8 pixel auditing
type Png = { w: number; h: number; bitDepth: number; colorType: number; interlace: number; raw: Buffer };
function parsePng(buf: Buffer): Png {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.subarray(0, 8).equals(sig)) throw new Error('not a PNG');
  let off = 8;
  let w = 0; let h = 0; let bitDepth = 0; let colorType = 0; let interlace = 0;
  const idat: Buffer[] = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  return { w, h, bitDepth, colorType, interlace, raw: inflateSync(Buffer.concat(idat)) };
}
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
function unfilter(png: Png): number[] {
  const ch = CHANNELS[png.colorType];
  if (!ch) throw new Error(`unsupported color type ${png.colorType}`);
  if (png.bitDepth !== 8) throw new Error(`unsupported bit depth ${png.bitDepth}`);
  if (png.interlace !== 0) throw new Error('interlaced PNG unsupported');
  const stride = png.w * ch;
  const out = new Array<number>(png.w * png.h).fill(0);
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);
  let pos = 0;
  for (let y = 0; y < png.h; y += 1) {
    const filter = png.raw[pos]; pos += 1;
    png.raw.copy(cur, 0, pos, pos + stride); pos += stride;
    for (let i = 0; i < stride; i += 1) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = cur[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
      }
      cur[i] = v & 0xff;
    }
    cur.copy(prev);
    const rowBase = y * png.w;
    for (let x = 0; x < png.w; x += 1) {
      const i = x * ch;
      if (ch >= 3) out[rowBase + x] = 0.2126 * cur[i] + 0.7152 * cur[i + 1] + 0.0722 * cur[i + 2];
      else out[rowBase + x] = cur[i];
    }
  }
  return out;
}
type Audit = { w: number; h: number; mean: number; stddev: number; pctDark: number; pctBright: number; edgeRatio: number; unique: number; verdict: string; diags: Diag[] };
function auditPng(file: string): Audit {
  const buf = readFileSync(file);
  const png = parsePng(buf);
  const lum = unfilter(png);
  const stride = 3;
  const vals: number[] = [];
  const colors = new Set<number>();
  let dark = 0; let bright = 0; let edges = 0; let pairs = 0;
  for (let y = 0; y < png.h; y += stride) {
    for (let x = 0; x < png.w; x += stride) {
      const v = lum[y * png.w + x];
      vals.push(v);
      colors.add(Math.round(v / 8));
      if (v < 40) dark += 1;
      if (v > 200) bright += 1;
      if (x + stride < png.w) {
        const r = lum[y * png.w + x + stride];
        if (Math.abs(v - r) > 40) edges += 1;
        pairs += 1;
      }
    }
  }
  const n = vals.length || 1;
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const variance = vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
  const stddev = Math.sqrt(variance);
  const pctDark = dark / n;
  const pctBright = bright / n;
  const edgeRatio = pairs ? edges / pairs : 0;
  const diags: Diag[] = [];
  if (pctDark < 0.25) diags.push({ code: 'ART-PX-001', severity: 'ERROR', message: `dark coverage ${(pctDark * 100).toFixed(1)}% < 25%: AMOLED-black panels are missing` });
  if (pctDark > 0.97) diags.push({ code: 'ART-PX-002', severity: 'ERROR', message: `dark coverage ${(pctDark * 100).toFixed(1)}% > 97%: plate is nearly all black` });
  if (pctBright < 0.001) diags.push({ code: 'ART-PX-003', severity: 'ERROR', message: `silver-white highlight coverage ${(pctBright * 100).toFixed(3)}% < 0.1%: no glossy lining or text` });
  if (stddev < 12) diags.push({ code: 'ART-PX-004', severity: 'ERROR', message: `luminance stddev ${stddev.toFixed(1)} < 12: plate is flat` });
  if (edgeRatio < 0.01) diags.push({ code: 'ART-PX-005', severity: 'WARN', message: `edge ratio ${edgeRatio.toFixed(4)} < 0.01: very little detail` });
  const verdict = diags.some((x) => x.severity === 'ERROR') ? 'FAIL' : (diags.length ? 'PASS-WITH-WARN' : 'PASS');
  return { w: png.w, h: png.h, mean, stddev, pctDark, pctBright, edgeRatio, unique: colors.size, verdict, diags };
}

// ----------------------------------------------------------------- commands
function cmdPasses(): void {
  for (const p of PASSES) console.log(`${p.id}\t${p.name}\tconsumes=${p.consumes}\temits=${p.emits}\tdeducts=${p.deducts}`);
  console.log(`PASSES=${PASSES.length}`);
}

function cmdFacts(args: string[]): void {
  const facts = loadJson<FactsFile>(FACTS);
  const only = argVal(args, '--only');
  const list = facts.facts.filter((f) => !only || (f.confidence ?? '').toUpperCase() === only.toUpperCase()).sort((a, b) => a.id.localeCompare(b.id));
  if (args.includes('--json')) { console.log(JSON.stringify(list, null, 2)); return; }
  for (const f of list) console.log(`${f.id}\t${f.confidence ?? '?'}\t${f.topic}\t${f.value ?? ''}\t${f.source?.ref ?? f.source?.url ?? '(no source)'}`);
  const counts = new Map<string, number>();
  for (const f of facts.facts) counts.set(f.confidence ?? '?', (counts.get(f.confidence ?? '?') ?? 0) + 1);
  for (const k of [...counts.keys()].sort()) console.log(`confidence_${k}=${counts.get(k)}`);
  console.log(`FACTS=${list.length}`);
}

function cmdDemands(): void {
  const { demands, unparsed, coverage, diags } = lex();
  demands.forEach((x, i) => console.log(`${String(i + 1).padStart(2, '0')}\t${x.code}\thits=${x.hits}\t${x.label}`));
  for (const u of unparsed) console.log(`UNPARSED\t${u}`);
  for (const d of diags) console.log(`${d.severity}\t${d.code}\t${d.message}`);
  console.log(`DEMAND_COVERAGE=${coverage}%`);
  console.log(`DEMANDS=${demands.length}`);
}

function cmdIr(args: string[]): void {
  const scene = loadJson<Scene>(SCENE);
  const plateId = argVal(args, '--plate');
  console.log(`machine: ${scene.machine?.model ?? '?'}`);
  console.log(`bays: ${(scene.machine?.bays ?? []).map((b) => `${b.index}:${b.occupant}`).join(' ')}`);
  console.log(`slots: ${(scene.machine?.slots ?? []).map((s) => `${s.name}:${s.lanes}:${s.occupant ?? '-'}`).join(' ')}`);
  const r = scene.raid ?? {};
  console.log(`raid: level=${r.level} members=${r.members}x${r.memberCapacityTB}TB raw=${r.rawTB}TB usable=${r.usableTB}TB tolerance=${r.tolerance}`);
  for (const p of scene.plates) {
    if (plateId && p.id !== plateId) continue;
    console.log(`plate ${p.id}: ${p.title} [${p.canvas.w}x${p.canvas.h}] nodes=${p.nodes.length}`);
    for (const n of p.nodes) console.log(`  ${n.id}\t${n.kind}\t${n.text}\tfacts=${(n.facts ?? []).join(',')}`);
  }
}

function cmdLint(args: string[]): number {
  const facts = loadJson<FactsFile>(FACTS);
  const scene = loadJson<Scene>(SCENE);
  const style = loadText(STYLE);
  const diags: Diag[] = [
    ...harvest(facts, scene),
    ...lex().diags,
    ...resolve(facts, scene),
    ...typecheck(scene),
    ...layout(scene).diags,
  ];
  for (const p of scene.plates) diags.push(...stylecheck(emitPrompt(scene, style, p.id, 0).text));
  if (args.includes('--json')) console.log(JSON.stringify(diags, null, 2));
  else for (const d of diags.sort((a, b) => a.code.localeCompare(b.code))) {
    console.log(`${d.severity}\t${d.code}\t${d.plate ?? '-'}\t${d.node ?? '-'}\t${d.message}`);
  }
  const errs = diags.filter((d) => d.severity === 'ERROR').length;
  const warns = diags.filter((d) => d.severity === 'WARN').length;
  console.log(`LINT errors=${errs} warnings=${warns} diagnostics=${diags.length}`);
  return errs ? 1 : 0;
}

function cmdLayout(args: string[]): number {
  const scene = loadJson<Scene>(SCENE);
  const { diags, rows } = layout(scene, argVal(args, '--plate'));
  for (const r of rows) console.log(r);
  for (const d of diags) console.log(`${d.severity}\t${d.code}\t${d.plate ?? '-'}\t${d.node ?? '-'}\t${d.message}`);
  console.log(`LAYOUT nodes=${rows.length} diagnostics=${diags.length}`);
  return diags.filter((d) => d.severity === 'ERROR').length ? 1 : 0;
}

function cmdPrompt(args: string[]): void {
  const scene = loadJson<Scene>(SCENE);
  const style = loadText(STYLE);
  const plate = argVal(args, '--plate') ?? scene.plates[0].id;
  const pass = Number(argVal(args, '--pass') ?? '1');
  const out = emitPrompt(scene, style, plate, pass);
  const ledger = loadLedger();
  const entry = plateEntry(ledger, plate);
  const rec: PassRecord = { pass, promptFile: out.file, promptHash: out.hash, artifacts: [], findings: [], patches: [], verdict: 'PROMPT-EMITTED' };
  const existing = entry.passes.findIndex((p) => p.pass === pass);
  if (existing >= 0) entry.passes[existing] = { ...entry.passes[existing], ...rec, findings: entry.passes[existing].findings, artifacts: entry.passes[existing].artifacts };
  else entry.passes.push(rec);
  entry.nextPass = Math.max(entry.nextPass, pass + 1);
  saveLedger(ledger);
  console.log(out.text);
  console.log(`PROMPT_FILE=${out.file}`);
  console.log(`PROMPT_SHA256=${out.hash}`);
}

function cmdRender(args: string[]): number {
  const plate = argVal(args, '--plate');
  const pass = Number(argVal(args, '--pass') ?? '1');
  const file = argVal(args, '--file');
  if (!plate || !file) { console.error('usage: render --plate=ID --pass=N --file=PATH'); return 1; }
  if (!existsSync(file)) { console.error(`missing artifact ${file}`); return 1; }
  const buf = readFileSync(file);
  const a = auditPng(file);
  const scene = loadJson<Scene>(SCENE);
  const p = scene.plates.find((x) => x.id === plate);
  const diags: Diag[] = [...a.diags];
  if (p) {
    const want = p.canvas.w / p.canvas.h;
    const got = a.w / a.h;
    if (Math.abs(want - got) > 0.02) diags.push({ code: 'ART-RN-001', severity: 'WARN', plate, message: `aspect ${got.toFixed(3)} != required ${want.toFixed(3)}` });
  }
  const ledger = loadLedger();
  const entry = plateEntry(ledger, plate);
  let rec = entry.passes.find((x) => x.pass === pass);
  if (!rec) { rec = { pass, artifacts: [], findings: [], patches: [], verdict: 'RENDERED' }; entry.passes.push(rec); }
  rec.artifacts = [{ file, sha256: sha256(buf), bytes: buf.length, w: a.w, h: a.h }];
  rec.audit = { mean: Number(a.mean.toFixed(2)), stddev: Number(a.stddev.toFixed(2)), pctDark: Number(a.pctDark.toFixed(4)), pctBright: Number(a.pctBright.toFixed(4)), edgeRatio: Number(a.edgeRatio.toFixed(4)), unique: a.unique };
  rec.auditVerdict = a.verdict;
  rec.verdict = diags.some((d) => d.severity === 'ERROR') ? 'RENDER-FAIL' : 'RENDERED';
  saveLedger(ledger);
  console.log(`file=${file}`);
  console.log(`sha256=${sha256(buf)}`);
  console.log(`bytes=${buf.length}`);
  console.log(`dimensions=${a.w}x${a.h}`);
  console.log(`mean_luminance=${a.mean.toFixed(2)}`);
  console.log(`stddev=${a.stddev.toFixed(2)}`);
  console.log(`pct_dark=${(a.pctDark * 100).toFixed(2)}`);
  console.log(`pct_bright=${(a.pctBright * 100).toFixed(3)}`);
  console.log(`edge_ratio=${a.edgeRatio.toFixed(4)}`);
  for (const d of diags) console.log(`${d.severity}\t${d.code}\t${d.message}`);
  console.log(`AUDIT=${a.verdict}`);
  return 0;
}

function cmdAudit(args: string[]): number {
  const file = argVal(args, '--file');
  if (!file) { console.error('usage: audit --file=PATH'); return 1; }
  const a = auditPng(file);
  console.log(`file=${file}`);
  console.log(`dimensions=${a.w}x${a.h}`);
  console.log(`mean_luminance=${a.mean.toFixed(2)}`);
  console.log(`stddev=${a.stddev.toFixed(2)}`);
  console.log(`pct_dark=${(a.pctDark * 100).toFixed(2)}`);
  console.log(`pct_bright=${(a.pctBright * 100).toFixed(3)}`);
  console.log(`edge_ratio=${a.edgeRatio.toFixed(4)}`);
  console.log(`unique_luma_buckets=${a.unique}`);
  for (const d of a.diags) console.log(`${d.severity}\t${d.code}\t${d.message}`);
  console.log(`AUDIT=${a.verdict}`);
  return a.verdict === 'FAIL' ? 1 : 0;
}

function cmdFindings(args: string[]): number {
  const plate = argVal(args, '--plate');
  const pass = Number(argVal(args, '--pass') ?? '1');
  const inline = argVal(args, '--add');
  const file = argVal(args, '--file');
  if (!plate) { console.error('usage: findings --plate=ID --pass=N --add=JSON|--file=PATH'); return 1; }
  const incoming: Finding[] = [];
  if (inline) incoming.push(JSON.parse(inline) as Finding);
  if (file) incoming.push(...(JSON.parse(readFileSync(file, 'utf8')) as Finding[]));
  for (const f of incoming) {
    if (!f.code) { console.error('finding needs a code'); return 1; }
    if (!f.severity) f.severity = 'ERROR';
  }
  const ledger = loadLedger();
  const entry = plateEntry(ledger, plate);
  let rec = entry.passes.find((x) => x.pass === pass);
  if (!rec) { rec = { pass, artifacts: [], findings: [], patches: [], verdict: 'CRITIQUED' }; entry.passes.push(rec); }
  rec.findings.push(...incoming);
  rec.verdict = rec.findings.some((f) => f.severity === 'ERROR') ? 'FAIL' : 'PASS-WITH-WARN';
  saveLedger(ledger);
  for (const f of rec.findings) console.log(`${f.severity}\t${f.code}\t${f.node ?? '-'}\t${f.note ?? ''}`);
  console.log(`FINDINGS=${rec.findings.length} errors=${rec.findings.filter((f) => f.severity === 'ERROR').length}`);
  return 0;
}

function patchFor(code: string): string {
  if (code.startsWith('ART-VIS-TEXT') || code.startsWith('ART-G-002') || code.startsWith('ART-G-003')) return 'tighten in-image text budget: move the offending copy to the deterministic overlay layer';
  if (code.startsWith('ART-VIS-POS')) return 're-place the node box in the scene IR and re-run layout';
  if (code.startsWith('ART-VIS-ICON')) return 'strengthen the skeuomorphic iconography instruction for that node';
  if (code.startsWith('ART-PX-001')) return 'raise panel opacity / darken substrate: more AMOLED-black coverage';
  if (code.startsWith('ART-PX-002')) return 'lighten panels or add content: plate is too dark';
  if (code.startsWith('ART-PX-003')) return 'add silver-white glossy lining and larger short labels';
  if (code.startsWith('ART-PX-004')) return 'add contrast: panels, icons and labels are too uniform';
  if (code.startsWith('ART-PX-005')) return 'add detail: icons, cabling, bevels';
  return 'classify the defect, then patch the IR or the style contract';
}

function cmdDeduct(args: string[]): number {
  const ledger = loadLedger();
  const plateId = argVal(args, '--plate');
  const plates = plateId ? [plateId] : Object.keys(ledger.plates).sort();
  let residual = 0;
  for (const id of plates) {
    const entry = ledger.plates[id];
    if (!entry) continue;
    const rows: string[] = [];
    for (const rec of entry.passes.slice().sort((a, b) => a.pass - b.pass)) {
      const errs = rec.findings.filter((f) => f.severity === 'ERROR').length;
      const px = rec.auditVerdict === 'FAIL' ? 1 : 0;
      rows.push(`  pass ${rec.pass}: verdict=${rec.verdict} audit=${rec.auditVerdict ?? '-'} findings=${rec.findings.length} errors=${errs} pixel=${px} patches=${rec.patches.length}`);
    }
    // Residual means "still open at the latest rendered pass", not "ever seen":
    // summing history would make a fixpoint unreachable by construction.
    const assessed = entry.passes.filter((r) => r.findings.length > 0 || r.artifacts.length > 0);
    const last = assessed.length ? assessed[assessed.length - 1] : undefined;
    const open: Finding[] = (last?.findings ?? []).filter((f) => f.severity === 'ERROR');
    residual += open.length;
    console.log(`plate ${id}: nextPass=${entry.nextPass}`);
    for (const r of rows) console.log(r);
    for (const f of open) console.log(`  RESIDUAL\t${f.code}\t${f.node ?? '-'}\t-> ${patchFor(f.code)}`);
    const nextRec = entry.passes.find((p) => p.pass === entry.nextPass);
    if (!nextRec) entry.passes.push({ pass: entry.nextPass, artifacts: [], findings: [], patches: open.map((f) => patchFor(f.code)), verdict: 'PATCHED' });
    else nextRec.patches = open.map((f) => patchFor(f.code));
    console.log(`  DEDUCTION open=${open.length} -> next pass ${entry.nextPass}${open.length === 0 ? ' (FIXPOINT)' : ''}`);
  }
  saveLedger(ledger);
  console.log(`RESIDUAL=${residual}`);
  return 0;
}

function cmdPatch(args: string[]): number {
  const plate = argVal(args, '--plate');
  const nodeId = argVal(args, '--node');
  const set = argVal(args, '--set');
  if (!plate || !nodeId || !set) { console.error('usage: patch --plate=ID --node=ID --set=field:value'); return 1; }
  const idx = set.indexOf(':');
  if (idx < 0) { console.error('--set needs field:value'); return 1; }
  const field = set.slice(0, idx);
  const value = set.slice(idx + 1);
  const scene = loadJson<Scene>(SCENE);
  const p = scene.plates.find((x) => x.id === plate);
  if (!p) { console.error(`unknown plate ${plate}`); return 1; }
  const n = p.nodes.find((x) => x.id === nodeId);
  if (!n) { console.error(`unknown node ${nodeId}`); return 1; }
  if (field === 'text' || field === 'detail' || field === 'kind') (n as unknown as Record<string, string>)[field] = value;
  else if (['x', 'y', 'w', 'h'].includes(field)) (n as unknown as Record<string, number>)[field] = Number(value);
  else { console.error(`unpatchable field ${field}`); return 1; }
  writeFileSync(SCENE, JSON.stringify(scene, null, 2) + '\n');
  console.log(`PATCHED ${plate}/${nodeId} ${field}=${value}`);
  return 0;
}

function cmdNote(args: string[]): number {
  const plate = argVal(args, '--plate');
  const add = argVal(args, '--add');
  const clear = args.includes('--clear');
  if (!plate) { console.error('usage: note --plate=ID [--add=TEXT|--clear]'); return 1; }
  const scene = loadJson<Scene>(SCENE);
  const p = scene.plates.find((x) => x.id === plate);
  if (!p) { console.error(`unknown plate ${plate}`); return 1; }
  if (clear) p.renderNotes = [];
  if (add) { p.renderNotes = p.renderNotes ?? []; p.renderNotes.push(add); }
  writeFileSync(SCENE, JSON.stringify(scene, null, 2) + '\n');
  console.log(`NOTES plate=${plate} count=${p.renderNotes?.length ?? 0}`);
  return 0;
}

function cmdNodeAdd(args: string[]): number {
  const plate = argVal(args, '--plate');
  const id = argVal(args, '--node');
  const kind = argVal(args, '--kind') ?? 'panel';
  const text = argVal(args, '--text') ?? '';
  const detail = argVal(args, '--detail') ?? '';
  const box = argVal(args, '--box');
  if (!plate || !id || !box) { console.error('usage: node-add --plate=ID --node=ID --kind=K --text="LABEL" --detail="..." --box=x,y,w,h'); return 1; }
  const [x, y, w, h] = box.split(',').map(Number);
  if ([x, y, w, h].some((n) => !Number.isFinite(n))) { console.error('--box needs x,y,w,h'); return 1; }
  const scene = loadJson<Scene>(SCENE);
  const p = scene.plates.find((q) => q.id === plate);
  if (!p) { console.error(`unknown plate ${plate}`); return 1; }
  if (p.nodes.some((n) => n.id === id)) { console.error(`node ${id} exists; use patch`); return 1; }
  p.nodes.push({ id, kind, x, y, w, h, text, detail });
  writeFileSync(SCENE, JSON.stringify(scene, null, 2) + '\n');
  const over = layout(scene).diags.filter((d) => d.node === id);
  console.log(`NODE_ADDED ${plate}/${id} box=${x},${y},${w}x${h} diagnostics=${over.length}`);
  for (const d of over) console.log(`  ${d.severity}\t${d.code}\t${d.message}`);
  return 0;
}

function hexPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2; const cy = y + h / 2;
  const rx = w / 2; const ry = h / 2;
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cmdSvg(args: string[]): void {
  const scene = loadJson<Scene>(SCENE);
  const plateId = argVal(args, '--plate') ?? scene.plates[0].id;
  const out = argVal(args, '--out') ?? `docs/macpro-storage-${plateId}-overlay.svg`;
  const plate = scene.plates.find((p) => p.id === plateId);
  if (!plate) { console.error(`unknown plate ${plateId}`); return; }
  const W = plate.canvas.w; const H = plate.canvas.h;
  const cw = W / 100; const ch = H / 100;
  const svg: string[] = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif">`);
  svg.push(`<rect width="${W}" height="${H}" fill="#05070A"/>`);
  svg.push(`<text x="24" y="42" fill="#E8EDF4" font-size="28" font-weight="700" letter-spacing="2">${esc(plate.title.toUpperCase())}</text>`);
  for (const n of plate.nodes) {
    const x = n.x * cw; const y = n.y * ch; const w = n.w * cw; const h = n.h * ch;
    svg.push(`<path d="${hexPath(x, y, w, h)}" fill="#0A0E14" fill-opacity="0.72" stroke="#E8EDF4" stroke-opacity="0.55" stroke-width="2"/>`);
    svg.push(`<text x="${(x + 14).toFixed(1)}" y="${(y + 30).toFixed(1)}" fill="#E8EDF4" font-size="${HEADER_PX}" font-weight="700" letter-spacing="1.5">${esc(n.text.toUpperCase())}</text>`);
    const lines = wrapText(n.detail, w - 28, BODY_PX);
    const cap = Math.max(1, Math.floor((h - HEADER_PX - 10) / (BODY_PX * LINE_H)));
    lines.slice(0, cap).forEach((line, i) => {
      svg.push(`<text x="${(x + 14).toFixed(1)}" y="${(y + 30 + HEADER_PX + 8 + i * BODY_PX * LINE_H).toFixed(1)}" fill="#A9B6C6" font-size="${BODY_PX}">${esc(line)}</text>`);
    });
    if (lines.length > cap) svg.push(`<text x="${(x + 14).toFixed(1)}" y="${(y + h - 8).toFixed(1)}" fill="#F2A93B" font-size="${BODY_PX}">+${lines.length - cap} lines truncated</text>`);
  }
  svg.push('</svg>');
  writeFileSync(out, svg.join('\n') + '\n');
  console.log(`SVG_FILE=${out}`);
  console.log(`SVG_NODES=${plate.nodes.length}`);
}

function cmdQueue(args: string[]): void {
  const add = argVal(args, '--add');
  if (add) {
    const lines = existsSync(PROMPTS) ? loadText(PROMPTS).split(/\r?\n/).filter((l) => l.trim()) : [];
    const seq = lines.length + 1;
    const rec = { seq, date: new Date().toISOString().slice(0, 10), from: 'operator', verbatim: add, status: 'pending' };
    writeFileSync(PROMPTS, lines.concat(JSON.stringify(rec)).join('\n') + '\n');
    console.log(`QUEUED seq=${seq} status=pending`);
    console.log(`VERBATIM=${add}`);
    const { demands } = lex();
    for (const d of demands) console.log(`DEMAND\t${d.code}\t${d.label}`);
    console.log('NEXT_RUN: node tools/mac-storage-art.ts next');
    return;
  }
  const lines = loadText(PROMPTS).split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const r = JSON.parse(line) as { seq: number; status: string; verbatim: string };
    console.log(`${r.seq}\t${r.status}\t${r.verbatim}`);
  }
}

function cmdNext(): void {
  const lines = loadText(PROMPTS).split(/\r?\n/).filter(Boolean);
  const pending = lines.map((l) => JSON.parse(l) as { seq: number; status: string; verbatim: string }).filter((r) => r.status === 'pending').sort((a, b) => a.seq - b.seq);
  if (pending.length === 0) { console.log('QUEUE_EMPTY'); console.log('NEXT_ACTION=operator: run `node tools/mac-storage-art.ts queue --add="..."`'); return; }
  const next = pending[0];
  console.log(`NEXT_PROMPT seq=${next.seq}`);
  console.log(`VERBATIM=${next.verbatim}`);
  const { demands } = lex();
  for (const d of demands) console.log(`DEMAND\t${d.code}\t${d.label}`);
  console.log('PLAN: lex -> resolve -> typecheck -> layout -> stylecheck -> emit -> render -> pixel-audit -> critique -> deduct');
  console.log('RUN: node tools/mac-storage-art.ts lint');
  console.log('RUN: node tools/mac-storage-art.ts prompt --plate=<ID> --pass=<N>');
}

function cmdStatus(): void {
  const ledger = loadLedger();
  const scene = loadJson<Scene>(SCENE);
  console.log('MAC_ART_STATUS');
  console.log(`plates=${scene.plates.map((p) => p.id).join(',')}`);
  for (const id of Object.keys(ledger.plates).sort()) {
    const e = ledger.plates[id];
    console.log(`plate ${id}: passes=${e.passes.length} nextPass=${e.nextPass}`);
    for (const r of e.passes.slice().sort((a, b) => a.pass - b.pass)) {
      const errs = r.findings.filter((f) => f.severity === 'ERROR').length;
      console.log(`  p${r.pass} verdict=${r.verdict} audit=${r.auditVerdict ?? '-'} prompt=${r.promptHash ? r.promptHash.slice(0, 12) : '-'} artifacts=${r.artifacts.length} findings=${r.findings.length} errors=${errs}`);
    }
  }
  console.log('NEXT_ACTION: lint -> prompt -> render -> audit -> findings -> deduct');
}

function cmdSelftest(): number {
  const checks: { name: string; ok: boolean; detail: string }[] = [];
  const facts = loadJson<FactsFile>(FACTS);
  const scene = loadJson<Scene>(SCENE);
  const style = loadText(STYLE);
  checks.push({ name: 'facts-parse', ok: facts.facts.length > 10, detail: `facts=${facts.facts.length}` });
  checks.push({ name: 'facts-sourced', ok: facts.facts.every((f) => (f.source?.ref ?? f.source?.url ?? '') !== ''), detail: 'every fact carries a source' });
  checks.push({ name: 'three-plates', ok: scene.plates.length === 3, detail: `plates=${scene.plates.map((p) => p.id).join(',')}` });
  checks.push({ name: 'four-bays', ok: scene.machine?.bays?.length === 4, detail: 'Mac Pro 1,1 has four bays' });
  checks.push({ name: 'raid5-math', ok: ((scene.raid?.members ?? 0) - 1) * (scene.raid?.memberCapacityTB ?? 0) === (scene.raid?.usableTB ?? -1), detail: 'usable = (n-1) x member' });
  const h = harvest(facts, scene);
  checks.push({ name: 'harvest-clean', ok: h.filter((d) => d.severity === 'ERROR').length === 0, detail: `errors=${h.filter((d) => d.severity === 'ERROR').length}` });
  const t = typecheck(scene);
  checks.push({ name: 'typecheck-clean', ok: t.filter((d) => d.severity === 'ERROR').length === 0, detail: `errors=${t.filter((d) => d.severity === 'ERROR').length}` });
  const l = layout(scene);
  checks.push({ name: 'layout-clean', ok: l.diags.filter((d) => d.severity === 'ERROR').length === 0, detail: `errors=${l.diags.filter((d) => d.severity === 'ERROR').length}` });
  for (const p of scene.plates) {
    const prompt = emitPrompt(scene, style, p.id, 0).text;
    const s = stylecheck(prompt);
    checks.push({ name: `stylecheck-${p.id}`, ok: s.length === 0, detail: `missing=${s.length}` });
  }
  const { demands, coverage } = lex();
  checks.push({ name: 'demands-lexed', ok: demands.length >= 20, detail: `demands=${demands.length}` });
  checks.push({ name: 'demand-coverage', ok: coverage >= 70, detail: `coverage=${coverage}%` });
  const a = emitPrompt(scene, style, 'physical', 1);
  const b = emitPrompt(scene, style, 'physical', 1);
  checks.push({ name: 'emit-deterministic', ok: a.hash === b.hash, detail: `hash=${a.hash.slice(0, 12)}` });
  const wrap = wrapText('alpha beta gamma delta epsilon', 100, 13);
  checks.push({ name: 'wrap-deterministic', ok: wrap.join('|') === wrapText('alpha beta gamma delta epsilon', 100, 13).join('|'), detail: `lines=${wrap.length}` });
  checks.push({ name: 'wrap-respects-width', ok: wrap.every((x) => x.length <= Math.floor(100 / (13 * 0.55))), detail: `perLine=${Math.floor(100 / (13 * 0.55))}` });
  checks.push({ name: 'realwords-middot', ok: realWords('BAY 1 · BOOT SSD').length === 4, detail: 'bullet is a separator, not a word' });
  checks.push({ name: 'layout-parent-exempt', ok: !layout(scene).diags.some((d) => d.code === 'ART-G-005' && (d.node ?? '').startsWith('chassis~')), detail: 'child boxes inside chassis are legal' });
  for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}\t${c.name}\t${c.detail}`);
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`SELFTEST checks=${checks.length} failed=${failed}`);
  return failed ? 1 : 0;
}

function argVal(args: string[], key: string): string | undefined {
  const hit = args.find((a) => a.startsWith(`${key}=`));
  return hit ? hit.slice(key.length + 1) : undefined;
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case 'passes': cmdPasses(); break;
    case 'facts': cmdFacts(rest); break;
    case 'demands': cmdDemands(); break;
    case 'ir': cmdIr(rest); break;
    case 'lint': process.exit(cmdLint(rest)); break;
    case 'layout': process.exit(cmdLayout(rest)); break;
    case 'prompt': cmdPrompt(rest); break;
    case 'render': process.exit(cmdRender(rest)); break;
    case 'audit': process.exit(cmdAudit(rest)); break;
    case 'findings': process.exit(cmdFindings(rest)); break;
    case 'deduct': process.exit(cmdDeduct(rest)); break;
    case 'patch': process.exit(cmdPatch(rest)); break;
    case 'note': process.exit(cmdNote(rest)); break;
    case 'node-add': process.exit(cmdNodeAdd(rest)); break;
    case 'svg': cmdSvg(rest); break;
    case 'queue': cmdQueue(rest); break;
    case 'next': cmdNext(); break;
    case 'status': cmdStatus(); break;
    case 'selftest': process.exit(cmdSelftest()); break;
    default:
      console.log('usage: node tools/mac-storage-art.ts <passes|facts|demands|ir|lint|layout|prompt|render|audit|findings|deduct|patch|svg|queue|next|status|selftest>');
      process.exit(2);
  }
}

main();
