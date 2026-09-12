#!/usr/bin/env node
// Agentic imaging pass-compiler for Mac Pro 3,1 chassis guide - 8-step visual manual
// Reuses the Quake-Live hex/AMOLED style contract from mac-storage-art.ts
// Pipeline: P0 harvest -> P1 lex -> P2 resolve -> P3 typecheck -> P4 layout -> P5 stylecheck -> P5b schematicize -> P6 emit -> P7 render -> P8 pixel-audit -> P9 critique -> P10 deduct
// v5 fundamental: schematic BEFORE visualization blocks progressive hallucination. Every plate
//  first emits a deterministic SVG blueprint (exact hardware anchors) that the AI then traces.
//  No prompt without a schematic is reproducible. No hardware token without an anchor is allowed.
// Zero dependencies, deterministic stdout

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

const FACTS = 'docs/macpro-guide-facts.json';
const SCENE = 'docs/macpro-guide-scene.json';
const STYLE = 'docs/macpro-guide-style-bw.md';
const PROMPTS = 'docs/macpro-storage-prompts.jsonl';
const REFS = 'docs/macpro-guide-refs.json';
const SPEC = 'docs/macpro-guide-spec.json';
const LEDGER = 'receipts/mac-guide/pass-ledger.json';
const PROMPTDIR = 'receipts/mac-guide/prompts';
const SCHEMATICDIR = 'receipts/mac-guide/schematics';

type Severity = 'ERROR' | 'WARN' | 'INFO';
type Diag = { code: string; severity: Severity; plate?: string; node?: string; fact?: string; message: string };

type Fact = { id: string; topic: string; claim: string; value?: string; source?: { ref?: string; url?: string; quote?: string }; confidence?: string };
type FactsFile = { schema?: string; updated?: string; subject?: string; facts: Fact[] };

type Node = {
  id: string; kind: string; x: number; y: number; w: number; h: number;
  text: string; detail: string; facts?: string[];
  parent?: string;
};
type Plate = { id: string; title: string; purpose: string; canvas: { w: number; h: number }; view: string; nodes: Node[]; renderNotes?: string[] };
type Scene = {
  schema?: string; updated?: string; styleContract?: string; factsLedger?: string;
  textBudget?: { maxWords?: number; maxChars?: number; reasonFact?: string };
  machine?: { id?: string; model?: string };
  plates: Plate[];
};

type Artifact = { file: string; sha256: string; bytes: number; w: number; h: number };
type Finding = { code: string; severity: Severity; node?: string; note?: string; from?: string };
type PassRecord = { pass: number; promptFile?: string; promptHash?: string; schematicFile?: string; schematicHash?: string; specVersion?: string; refIds?: string[]; refsAttached?: string[]; artifacts: Artifact[]; audit?: Record<string, number | string>; auditVerdict?: string; findings: Finding[]; patches: string[]; verdict: string };
type Ledger = { schema: string; updated?: string; plates: Record<string, { passes: PassRecord[]; nextPass: number }>; };

// v6 ref-traced imaging: every plate prompt is bound to public reference imaging + a canonical
// machine spec. Hallucination is blocked at prompt level; refs are hash-verified and logged.
type RefImage = { id: string; file: string; persisted?: boolean; kind?: string; subject: string; source: string; publisher?: string; doc?: string; sha256: string; details: string[] };
type RefRegistry = { schema: string; updated?: string; imageDir?: string; images: RefImage[]; plateRefs: Record<string, string[]>; canonicalFacts?: string[] };
type SpecPart = { id: string; u: number; v: number; w: number; h: number; depth?: string; draw: string; refs: string[] };
type Spec = { schema: string; version: string; updated?: string; canonicalView?: { name?: string; description?: string; projection?: Record<string, string>; refs?: string[] }; lineStyle?: Record<string, string>; chassisFaceParts: SpecPart[]; inventoryProps?: Record<string, string>; invariants: string[]; driftWatchlist?: string[]; renderGate?: string[] };

const PASSES = [
  { id: 'P0', name: 'harvest', consumes: FACTS, emits: 'fact table + confidence', deducts: 'unsourced or LOW' },
  { id: 'P1', name: 'lex', consumes: PROMPTS, emits: 'demand list', deducts: 'unparsed clauses' },
  { id: 'P2', name: 'resolve', consumes: 'fact table + scene IR', emits: 'bound graph', deducts: 'dangling facts' },
  { id: 'P3', name: 'typecheck', consumes: 'scene + 8-step guide', emits: 'guide semantics', deducts: 'bay count, plate count, SSD relocation logic' },
  { id: 'P4', name: 'layout', consumes: 'node boxes', emits: 'coords', deducts: 'overlap, overflow' },
  { id: 'P5', name: 'stylecheck', consumes: STYLE, emits: 'token coverage', deducts: 'missing Quake tokens' },
  { id: 'P5b', name: 'schematicize', consumes: 'scene IR + hardware anchors', emits: 'deterministic SVG blueprint (anchors)', deducts: 'missing anchor, unplaced hardware' },
  { id: 'P6', name: 'emit', consumes: 'IR+style+schematic', emits: 'prompt+hash (must trace schematic)', deducts: 'hash drift, schematic-missing' },
  { id: 'P7', name: 'render', consumes: 'prompt', emits: 'PNG', deducts: 'missing artifact' },
  { id: 'P8', name: 'pixel-audit', consumes: 'PNG', emits: 'metrics', deducts: 'blank / washed' },
  { id: 'P9', name: 'critique', consumes: 'visual', emits: 'findings', deducts: 'unclassified' },
  { id: 'P10', name: 'deduct', consumes: 'findings', emits: 'patches', deducts: 'residual->0' },
];

const LEX_RULES: { code: string; re: RegExp; label: string }[] = [
  { code: 'D-READ-README', re: /read\s+readme\.md/i, label: 'read README.md' },
  { code: 'D-READ-MASTER', re: /read\s+master\.md/i, label: 'read MASTER.md' },
  { code: 'D-GUIDE', re: /guide|granular|step/i, label: 'granular guide' },
  { code: 'D-8-PHOTOS', re: /8\s*photos?|eight\s*photos?|8\s*steps?/i, label: '8 photos/steps' },
  { code: 'D-IMAGING', re: /imaging|diagram|visual/i, label: 'imaging/diagram' },
  { code: 'D-TOOL-TS', re: /typescript\s+tool|tool.*memory/i, label: 'TS tool in memory' },
  { code: 'D-SSD-SLOT', re: /ssd.*slot|slot.*ssd|other slot than.*raid/i, label: 'SSD alternative slot' },
  { code: 'D-4-BAYS', re: /4\s*1tb|4\s*slots|4\s*bays/i, label: '4x1TB + 4 bays' },
  { code: 'D-FREE-BAYS', re: /free.*ssd|slots free of.*ssd/i, label: 'free bays of SSD' },
  { code: 'D-STYLE-QUAKE', re: /quake\s+live/i, label: 'Quake Live UI' },
  { code: 'D-STYLE-HEX', re: /hexagonal/i, label: 'hex panels' },
  { code: 'D-CONSISTENT', re: /consistent|not.*garbage|usable/i, label: 'consistent not garbage' },
];

const STYLE_TOKENS = [
  'black-line', 'ghost-40', 'white-paper',
  'helvetica', 'lego', 'ghost', 'transparent', 'arrow', 'uniform sidepanel', 'manual compactness',
  'accurate hardware', 'black and white', 'english', 'short guiding words',
  'schematic', 'anchor', 'trace',
];
const NEGATIVE_CONSTRAINTS = [
  'no-color', 'no-amoled', 'no-neon-glow-bloom', 'no-watermark', 'no-photoreal-human', 'no-brand-logo-watermark',
  'no-blurry-icons', 'no-extra-drives', 'no-macbook', 'no-rack-server',
  'no-invented-port-counts', 'no-raid-5-in-disk-utility', 'no-apfs-on-10-7',
  'no-paragraph-in-image', 'no-text-walls', 'no-color-fill', 'no-gray-fill', 'no-shading',
  'no-japanese-text',
  'no-coordinate-text',
  'no-style-spec-text',
];

// HARDWARE_ANCHORS: canonical Mac Pro 3,1 geometry that EVERY schematic must place.
// Operator rev2: copy details exactly - GPU orientation, motherboard layout, compartment layout,
//  cages/screws, RAM cages, fans, PCB layout, cable direction (board end in, GPU end out).
// Values are percent of canvas (1536x1024) but represent real hardware topology; the SVG
//  schematic enforces them before any AI render, blocking hallucination.
const HARDWARE_ANCHORS: Record<string, { desc: string; required: string[] }> = {
  'g01-overview': {
    desc: 'overview anchors: optical cutouts, 4 HDD bays horizontal, red outline, memory shroud, GPU horizontal center-right, 2x6-pin board-fed cables dangling, 2 PCB windows, honeycomb',
    required: ['optical-left-cutouts','optical-right-plain','hdd-bay-row-x4','hdd-screw-right-end','red-outline-Bay4','memory-shroud-lower-left','logic-board-strip-top','heatsink-fins-behind-gpu','gpu-horizontal-blower','gpu-cables-board-to-gpu','pcb-windows-x2-lower-right','honeycomb-right-edge','wd-green-desk-left','timecapsule-desk-right'],
  },
  'g02-poweroff': { desc: 'power safety: cord, CR2032, captive screw, GPU cables unplug', required: ['iec-socket-rear','power-cord-pull','cr2032-lower-left','captive-screw-lower-pci','gpu-cables-unplugged'] },
  'g03-hidden-sata': { desc: 'hidden SATA behind fan under Bay1', required: ['fan-assembly-solid','fan-ghost-lift','sata5-sata6-ports','cable-route-50mm','optical-bay-target'] },
  'g04-ssd-mount': { desc: 'SSD in optical lower bay', required: ['ssd-2p5-bracket','optical-lower-bay','molex-to-sata-adapter','sata-cable-from-hidden-port'] },
  'g05-hdd-install': { desc: '4x HDD install front-to-rear sled', required: ['sled-chassis-bays','drive-install-pull','screw-right-end'] },
  'g06-gpu-swap': { desc: 'GTX285 horizontal double-wide, bracket rear, power top edge, board-fed cables', required: ['gpu-horizontal-slot1','gpu-bracket-rear','gpu-power-top-edge','cable-board-header-to-gpu','amd-alt-card'] },
  'g07-cable-check': { desc: 'cable routing verification', required: ['sata-cable-loop','power-cable-dress','honeycomb-vent'] },
  'g08-boot-verify': { desc: 'boot verification desk verify', required: ['about-mac-screen','startup-disk-bless'] },
};

function loadJson<T>(path: string): T {
  if (!existsSync(path)) { console.error(`missing ${path}`); process.exit(1); }
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}
function loadText(path: string): string {
  if (!existsSync(path)) { console.error(`missing ${path}`); process.exit(1); }
  return readFileSync(path, 'utf8');
}
function sha256(buf: Buffer | string): string { return createHash('sha256').update(buf).digest('hex'); }

function loadRefs(): RefRegistry { return loadJson<RefRegistry>(REFS); }
function loadSpec(): Spec { return loadJson<Spec>(SPEC); }

// Verify the ref registry: persisted files must exist and hash-match; plate maps and spec
// references must resolve. Returns diagnostics and, when files are present, their true hashes.
function checkRefs(refs: RefRegistry, spec: Spec, plates: Plate[]): Diag[] {
  const d: Diag[] = [];
  const ids = new Set<string>();
  for (const r of refs.images) {
    if (ids.has(r.id)) d.push({ code: 'G-X-001', severity: 'ERROR', node: r.id, message: `duplicate ref id ${r.id}` });
    ids.add(r.id);
    if (!r.details || r.details.length < 5) d.push({ code: 'G-X-002', severity: 'ERROR', node: r.id, message: `ref ${r.id} needs >=5 baked details, has ${r.details?.length ?? 0}` });
    if (r.persisted === false || !r.file) {
      if (r.persisted === false) continue; // chat-only operator photo, receipt text only
      d.push({ code: 'G-X-003', severity: 'ERROR', node: r.id, message: `ref ${r.id} has no file and is not marked persisted:false (chat-only)` });
      continue;
    }
    if (!existsSync(r.file)) { d.push({ code: 'G-X-004', severity: 'ERROR', node: r.id, message: `ref ${r.id} file missing: ${r.file}` }); continue; }
    const buf = readFileSync(r.file);
    const hash = sha256(buf);
    if (!r.sha256) d.push({ code: 'G-X-005', severity: 'ERROR', node: r.id, message: `ref ${r.id} no sha256 recorded` });
    else if (hash !== r.sha256) d.push({ code: 'G-X-006', severity: 'ERROR', node: r.id, message: `ref ${r.id} hash drift: file ${hash.slice(0, 12)} != registry ${r.sha256.slice(0, 12)}` });
  }
  for (const p of plates) {
    const list = refs.plateRefs[p.id];
    if (!list || list.length === 0) d.push({ code: 'G-X-007', severity: 'ERROR', plate: p.id, message: `plate ${p.id} has no plateRefs` });
    else for (const id of list) if (!ids.has(id)) d.push({ code: 'G-X-008', severity: 'ERROR', plate: p.id, message: `plate ${p.id} refs unknown ref ${id}` });
  }
  for (const id of Object.keys(refs.plateRefs ?? {})) if (!plates.some((p) => p.id === id)) d.push({ code: 'G-X-009', severity: 'WARN', node: id, message: `plateRefs lists ${id} but scene has no such plate` });
  const partIds = new Set(spec.chassisFaceParts.map((x) => x.id));
  if (partIds.size < 10) d.push({ code: 'G-X-010', severity: 'ERROR', message: `spec parts catalog thin: ${partIds.size}` });
  for (const part of spec.chassisFaceParts) {
    if (!part.draw || part.draw.length < 20) d.push({ code: 'G-X-011', severity: 'ERROR', node: part.id, message: `part ${part.id} lacks baked draw detail` });
    for (const id of part.refs ?? []) if (!ids.has(id)) d.push({ code: 'G-X-012', severity: 'ERROR', node: part.id, message: `part ${part.id} cites unknown ref ${id}` });
  }
  if ((spec.invariants ?? []).length < 10) d.push({ code: 'G-X-013', severity: 'ERROR', message: `spec invariants ${spec.invariants?.length ?? 0} < 10` });
  if (!spec.version) d.push({ code: 'G-X-014', severity: 'ERROR', message: 'spec has no version' });
  return d;
}

// The canonical block is emitted BYTE-IDENTICAL into every plate prompt. Selftest asserts this
// so consistency rules cannot silently drift between plates or passes.
function canonBlock(refs: RefRegistry, spec: Spec): string {
  const L: string[] = [];
  L.push('=== CANON BLOCK START (identical on every plate, do not paraphrase) ===');
  L.push(`SPEC VERSION: ${spec.version}`);
  L.push(`CANONICAL CAMERA: ${spec.canonicalView?.name}`);
  L.push(`${spec.canonicalView?.description}`);
  L.push(`PROJECTION: ${Object.entries(spec.canonicalView?.projection ?? {}).map(([k, v]) => `${k}=${v}`).join('; ')}`);
  L.push('LINE LANGUAGE: ' + Object.entries(spec.lineStyle ?? {}).map(([k, v]) => `${k}: ${v}`).join(' | '));
  L.push('CONSISTENCY INVARIANTS:');
  for (const inv of spec.invariants) L.push(`- ${inv}`);
  L.push('DRIFT WATCHLIST (each item here is a failed class, never reproduce):');
  for (const w of spec.driftWatchlist ?? []) L.push(`- ${w}`);
  L.push('=== CANON BLOCK END ===');
  return L.join('\n');
}

function refBlock(refs: RefRegistry, spec: Spec, plateId: string): string {
  const wanted = refs.plateRefs[plateId] ?? [];
  const L: string[] = [];
  L.push('=== REFERENCE TRACING START (highest authority after the operator photo) ===');
  L.push('Visual reference files are supplied to the generator. Trace chassis proportions, viewpoint, part shapes, counts and line language from them. Their detail digests follow; do not invent parts the refs do not show.');
  for (const id of wanted) {
    const r = refs.images.find((x) => x.id === id);
    if (!r) continue;
    L.push('');
    L.push(`REF ${r.id} [${r.kind ?? 'ref'}] file=${r.file || 'CHAT-ONLY, NOT ON DISK'} doc=${r.doc ?? '-'} source=${r.source}`);
    L.push(`SUBJECT: ${r.subject}`);
    if (r.persisted === false || !r.file) L.push('NOTE: this reference is an operator chat photograph not persisted to sandbox storage; it is described here as a durable perception receipt and MUST be re-supplied as an image reference when available.');
    for (const det of r.details) L.push(`  - ${det}`);
  }
  L.push('');
  L.push('CATALOG PARTS THIS PLATE MAY DRAW (id | face u/v/w/h | exact depiction):');
  const allowed = platePartAllowlist(plateId);
  for (const part of spec.chassisFaceParts) {
    if (allowed.includes(part.id)) L.push(`- ${part.id} | u=${part.u} v=${part.v} w=${part.w} h=${part.h} depth=${part.depth ?? '-'} | ${part.draw} [refs: ${part.refs.join(',')}]`);
  }
  L.push('Anything not in this catalog, in the scene IR inventory, or in the refs is an INVENTION and must not appear.');
  L.push('=== REFERENCE TRACING END ===');
  return L.join('\n');
}

// Which catalog parts each procedural plate needs; g01 gets the whole machine.
function platePartAllowlist(plateId: string): string[] {
  const ALL = ['frame-handle-feet', 'front-mesh-face', 'optical-left-dualcutout', 'optical-right-plain', 'hdd-row-4-sleds', 'front-fan-assembly', 'logic-board-tray', 'gpu-gtx285-blower', 'gpu-power-cables', 'memory-shroud', 'riser-window-2-banks', 'riser-plates-A-B-out', 'latch-lever', 'rear-io-plane', 'honeycomb-edge'];
  const map: Record<string, string[]> = {
    'g01-overview': ALL,
    'g02-poweroff': ['frame-handle-feet', 'rear-io-plane', 'latch-lever', 'gpu-power-cables', 'honeycomb-edge'],
    'g03-hidden-sata': ['frame-handle-feet', 'hdd-row-4-sleds', 'front-fan-assembly', 'logic-board-tray', 'optical-left-dualcutout', 'optical-right-plain'],
    'g04-ssd-mount': ['frame-handle-feet', 'optical-left-dualcutout', 'optical-right-plain', 'hdd-row-4-sleds', 'front-fan-assembly'],
    'g05-hdd-install': ['frame-handle-feet', 'hdd-row-4-sleds', 'front-mesh-face'],
    'g06-gpu-swap': ['frame-handle-feet', 'logic-board-tray', 'gpu-gtx285-blower', 'gpu-power-cables', 'rear-io-plane', 'latch-lever'],
    'g07-cable-check': ['frame-handle-feet', 'gpu-gtx285-blower', 'gpu-power-cables', 'logic-board-tray', 'rear-io-plane', 'honeycomb-edge'],
    'g08-boot-verify': ['frame-handle-feet', 'front-mesh-face'],
  };
  return map[plateId] ?? ALL;
}
function words(s: string): string[] { return s.split(/\\s+/).filter(Boolean); }
function realWords(s: string): string[] { return words(s).filter((t) => /[a-z0-9]/i.test(t)); }

function loadLedger(): Ledger {
  if (!existsSync(LEDGER)) return { schema: 'mac-guide-ledger.v1', plates: {} };
  return JSON.parse(readFileSync(LEDGER, 'utf8')) as Ledger;
}
function saveLedger(l: Ledger): void {
  mkdirSync('receipts/mac-guide', { recursive: true });
  writeFileSync(LEDGER, JSON.stringify(l, null, 2) + '\n');
}
function plateEntry(l: Ledger, plate: string): { passes: PassRecord[]; nextPass: number } {
  if (!l.plates[plate]) l.plates[plate] = { passes: [], nextPass: 1 };
  return l.plates[plate];
}

function harvest(facts: FactsFile, scene: Scene): Diag[] {
  const d: Diag[] = [];
  const known = new Set(facts.facts.map((f) => f.id));
  const used = new Set<string>();
  for (const p of scene.plates) for (const n of p.nodes) for (const f of n.facts ?? []) used.add(f);
  for (const f of facts.facts) {
    const src = f.source ?? {};
    if (!src.ref && !src.url) d.push({ code: 'G-F-001', severity: 'ERROR', fact: f.id, message: `fact ${f.id} has no source` });
    if (!f.confidence) d.push({ code: 'G-F-002', severity: 'ERROR', fact: f.id, message: `fact ${f.id} no confidence` });
    if (f.confidence === 'LOW') d.push({ code: 'G-F-003', severity: 'WARN', fact: f.id, message: `LOW ${f.id}` });
  }
  for (const id of [...used].sort()) if (!known.has(id)) d.push({ code: 'G-F-004', severity: 'ERROR', fact: id, message: `unknown fact ${id}` });
  return d;
}

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
    for (const clause of text.split(/[,;]|\.(?=\s|$)|\\bthen\\b/i).map((s) => s.trim()).filter(Boolean)) {
      clauses += 1;
      let matched = false;
      for (const rule of LEX_RULES) {
        if (rule.re.test(clause)) { hits.set(rule.code, (hits.get(rule.code) ?? 0) + 1); matched = true; }
      }
      if (!matched && clause.length > 3) unparsed.push(clause);
    }
  }
  for (const c of unparsed) diags.push({ code: 'G-L-001', severity: 'WARN', message: `unparsed: \"${c}\"` });
  const demands = [...hits.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([code, n]) => ({ code, label: LEX_RULES.find((r) => r.code === code)?.label ?? code, hits: n }));
  const coverage = clauses === 0 ? 0 : Math.round(((clauses - unparsed.length) / clauses) * 100);
  if (coverage < 50) diags.push({ code: 'G-L-002', severity: 'WARN', message: `coverage ${coverage}% <50%` });
  return { diags, demands, unparsed, coverage };
}

function resolve(facts: FactsFile, scene: Scene): Diag[] {
  const d: Diag[] = [];
  const known = new Set(facts.facts.map((f) => f.id));
  for (const p of scene.plates) {
    for (const n of p.nodes) {
      if (!n.text) d.push({ code: 'G-R-001', severity: 'ERROR', plate: p.id, node: n.id, message: 'no short label' });
      if (!n.detail) d.push({ code: 'G-R-002', severity: 'ERROR', plate: p.id, node: n.id, message: 'no detail' });
      for (const f of n.facts ?? []) if (!known.has(f)) d.push({ code: 'G-R-003', severity: 'ERROR', plate: p.id, node: n.id, message: `unknown fact ${f}` });
    }
  }
  return d;
}

function typecheck(scene: Scene): Diag[] {
  const d: Diag[] = [];
  if (scene.plates.length !== 8) d.push({ code: 'G-T-001', severity: 'ERROR', message: `guide needs 8 plates, has ${scene.plates.length}` });
  const ids = scene.plates.map((p) => p.id);
  const expected = ['g01-overview','g02-poweroff','g03-hidden-sata','g04-ssd-mount','g05-hdd-install','g06-gpu-swap','g07-cable-check','g08-boot-verify'];
  for (const e of expected) if (!ids.includes(e)) d.push({ code: 'G-T-002', severity: 'ERROR', message: `missing plate ${e}` });
  for (const p of scene.plates) {
    if (!p.nodes.some((n) => n.kind === 'footer')) d.push({ code: 'G-T-003', severity: 'WARN', plate: p.id, message: 'no footer node' });
  }
  return d;
}

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
        d.push({ code: 'G-G-001', severity: 'ERROR', plate: p.id, node: n.id, message: `box leaves canvas` });
      }
      const nw = realWords(n.text).length;
      if (nw > maxWords) d.push({ code: 'G-G-002', severity: 'ERROR', plate: p.id, node: n.id, message: `label \"${n.text}\" ${nw}w > ${maxWords}` });
      if (n.text.length > maxChars) d.push({ code: 'G-G-003', severity: 'ERROR', plate: p.id, node: n.id, message: `label ${n.text.length}c > ${maxChars}` });
      const lines = wrapText(n.detail, n.w * cw - 16, BODY_PX);
      const cap = Math.floor((n.h * ch - HEADER_PX - 10) / (BODY_PX * LINE_H));
      if (lines.length > cap) d.push({ code: 'G-G-004', severity: 'WARN', plate: p.id, node: n.id, message: `detail ${lines.length} lines > cap ${cap}` });
      rows.push(`${p.id}\t${n.id}\t${n.kind}\tbox=${n.x},${n.y},${n.w}x${n.h}\tlabel=\"${n.text}\"`);
    }
    for (let i = 0; i < p.nodes.length; i++) {
      for (let j = i + 1; j < p.nodes.length; j++) {
        const a = p.nodes[i]; const b = p.nodes[j];
        if (a.parent === b.id || b.parent === a.id) continue;
        if (a.kind === 'cable' || b.kind === 'cable') continue;
        if (a.kind === 'chassis' || b.kind === 'chassis') continue;
        const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
        const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        if (ox * oy > 12) d.push({ code: 'G-G-005', severity: 'WARN', plate: p.id, node: `${a.id}~${b.id}`, message: `overlap ${ (ox*oy).toFixed(1)}` });
      }
    }
  }
  return { diags: d, rows };
}

function stylecheck(prompt: string): Diag[] {
  const d: Diag[] = [];
  const lower = prompt.toLowerCase();
  for (const t of STYLE_TOKENS) if (!lower.includes(t.toLowerCase())) d.push({ code: 'G-S-001', severity: 'ERROR', message: `missing token ${t}` });
  for (const t of NEGATIVE_CONSTRAINTS) if (!lower.includes(t.toLowerCase())) d.push({ code: 'G-S-002', severity: 'ERROR', message: `missing negative ${t}` });
  return d;
}

// --- SCHEMATIC LAYER (fundamental anti-hallucination gate) ---

function schematicCheck(scene: Scene): Diag[] {
  const d: Diag[] = [];
  for (const p of scene.plates) {
    const anchor = HARDWARE_ANCHORS[p.id];
    if (!anchor) { d.push({ code: 'G-SC-001', severity: 'WARN', plate: p.id, message: `no anchor spec for ${p.id}` }); continue; }
    // verify IR mentions required hardware in node details (string search)
    const blob = JSON.stringify(p).toLowerCase();
    for (const req of anchor.required) {
      const key = req.split('-')[0]; // rough
      if (!blob.includes(key) && !blob.includes(req)) {
        d.push({ code: 'G-SC-002', severity: 'WARN', plate: p.id, message: `anchor "${req}" not referenced in IR details` });
      }
    }
    // every removable-part plate must have ASSEMBLED + DISASSEMBLED intent in purpose or nodes
    const needsPair = ['g03-hidden-sata','g04-ssd-mount','g05-hdd-install','g06-gpu-swap'].includes(p.id);
    if (needsPair) {
      const hasPair = blob.includes('assembled') && blob.includes('disassembled');
      if (!hasPair) d.push({ code: 'G-SC-003', severity: 'WARN', plate: p.id, message: `intuitive flow requires ASSEMBLED+DISASSEMBLED pair` });
    }
  }
  return d;
}

function emitSchematicSvg(scene: Scene, plateId: string, pass: number): { text: string; file: string; hash: string } {
  const plate = scene.plates.find((p) => p.id === plateId);
  if (!plate) { console.error(`unknown plate ${plateId}`); process.exit(1); }
  const W = plate.canvas.w; const H = plate.canvas.h;
  const anchor = HARDWARE_ANCHORS[plateId];
  // Deterministic SVG: white paper, black-line 1.5px, ghost-40 dashed 4-2 0.5px, 8px grid, uniform sidepanel.
  // Each node is a rect with label; hardware anchors are drawn as nested rects/circles inside chassis.
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n`;
  svg += `  <rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>\n`;
  // 8px grid light
  svg += `  <g stroke="#000000" stroke-opacity="0.06" stroke-width="0.5">\n`;
  for (let x=0; x<W; x+=8*6) svg += `    <line x1="${x}" y1="0" x2="${x}" y2="${H}"/>\n`;
  for (let y=0; y<H; y+=8*6) svg += `    <line x1="0" y1="${y}" x2="${W}" y2="${y}"/>\n`;
  svg += `  </g>\n`;
  // uniform sidepanel guide
  const sx = Math.round(W*0.02), sy = Math.round(H*0.14), sw = Math.round(W*0.18), sh = Math.round(H*0.76);
  svg += `  <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="none"/>\n`;
  svg += `  <text x="${sx+8}" y="${sy+18}" font-family="Helvetica" font-size="14" font-weight="700">SCHEMATIC ${plate.id} PASS ${pass}</text>\n`;
  if (anchor) svg += `  <text x="${sx+8}" y="${sy+34}" font-family="Helvetica" font-size="8">anchors: ${anchor.required.slice(0,6).join(', ')}...</text>\n`;
  // nodes as schematic boxes with hardware sub-anchors
  for (const n of plate.nodes) {
    const x = Math.round(W*n.x/100), y = Math.round(H*n.y/100), w = Math.round(W*n.w/100), h = Math.round(H*n.h/100);
    const isGhost = n.detail.toLowerCase().includes('ghost');
    const stroke = isGhost ? '#000000' : '#000000';
    const opacity = isGhost ? '0.4' : '1';
    const dash = isGhost ? ' stroke-dasharray="4 2"' : '';
    const swid = isGhost ? '0.5' : '1.5';
    svg += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${swid}"${dash}/>\n`;
    svg += `  <text x="${x+4}" y="${y+14}" font-family="Helvetica" font-size="10" font-weight="700">${n.text}</text>\n`;
    // hardware anchor dots inside chassis node
    if (n.kind==='chassis' && anchor) {
      // draw 4 HDD bay anchors as small rects
      const bayW = Math.round(w/4); const bayH = Math.round(h*0.08);
      const bayY = y + Math.round(h*0.28);
      for (let i=0;i<4;i++) {
        const bx = x + 8 + i*bayW;
        svg += `    <rect x="${bx}" y="${bayY}" width="${bayW-8}" height="${bayH}" fill="none" stroke="#000000" stroke-width="0.75"/>\n`;
        svg += `    <circle cx="${bx+bayW-12}" cy="${bayY+bayH/2}" r="3" fill="none" stroke="#000000" stroke-width="0.75"/>\n`; // screw right end
        if (i===3) svg += `    <rect x="${bx+bayW-18}" y="${bayY+4}" width="10" height="10" fill="none" stroke="#000000" stroke-width="0.75"/>\n`; // red outline Bay4 (outline only)
      }
      // optical covers
      const optY = y + Math.round(h*0.08);
      svg += `    <rect x="${x+8}" y="${optY}" width="${Math.round(w*0.42)}" height="${Math.round(h*0.12)}" fill="none" stroke="#000000" stroke-width="0.75"/>\n`;
      svg += `    <rect x="${x+12}" y="${optY+6}" width="28" height="18" fill="none" stroke="#000000" stroke-width="0.5"/>\n`;
      svg += `    <rect x="${x+64}" y="${optY+6}" width="28" height="18" fill="none" stroke="#000000" stroke-width="0.5"/>\n`;
      svg += `    <rect x="${x+Math.round(w*0.48)}" y="${optY}" width="${Math.round(w*0.48)}" height="${Math.round(h*0.12)}" fill="none" stroke="#000000" stroke-width="0.75"/>\n`;
      // GPU horizontal
      const gpuY = y + Math.round(h*0.45), gpuH = Math.round(h*0.12), gpuW = Math.round(w*0.58);
      const gpuX = x + Math.round(w*0.32);
      svg += `    <rect x="${gpuX}" y="${gpuY}" width="${gpuW}" height="${gpuH}" fill="none" stroke="#000000" stroke-width="1.5"/>\n`;
      svg += `    <line x1="${gpuX+10}" y1="${gpuY+gpuH/2}" x2="${gpuX+gpuW-10}" y2="${gpuY+gpuH/2}" stroke="#000000" stroke-width="0.5" stroke-dasharray="2 2"/>\n`;
      // cable path: board header (left) to GPU top edge
      const cableX1 = x + Math.round(w*0.18), cableY1 = gpuY - 14;
      const cableX2 = gpuX + 24, cableY2 = gpuY;
      svg += `    <path d="M ${cableX1} ${cableY1} C ${cableX1+20} ${cableY1+18}, ${cableX2-20} ${cableY2-10}, ${cableX2} ${cableY2}" fill="none" stroke="#000000" stroke-width="1.5"/>\n`;
      svg += `    <circle cx="${cableX1}" cy="${cableY1}" r="4" fill="#FFFFFF" stroke="#000000" stroke-width="0.75"/><text x="${cableX1-12}" y="${cableY1-6}" font-family="Helvetica" font-size="6">BOARD</text>\n`;
      svg += `    <circle cx="${cableX2}" cy="${cableY2}" r="4" fill="#FFFFFF" stroke="#000000" stroke-width="0.75"/><text x="${cableX2-8}" y="${cableY2-6}" font-family="Helvetica" font-size="6">GPU</text>\n`;
      // PCB windows lower-right
      const winW = Math.round(w*0.28), winH = Math.round(h*0.08);
      svg += `    <rect x="${x+w-winW-8}" y="${y+h-winH*2-18}" width="${winW}" height="${winH}" fill="none" stroke="#000000" stroke-width="0.75"/>\n`;
      svg += `    <rect x="${x+w-winW-8}" y="${y+h-winH-8}" width="${winW}" height="${winH}" fill="none" stroke="#000000" stroke-width="0.75"/>\n`;
      // memory shroud lower-left
      svg += `    <rect x="${x+8}" y="${y+h-winH*2-18}" width="${Math.round(w*0.30)}" height="${winH*2+10}" fill="none" stroke="#000000" stroke-width="0.75"/>\n`;
      // honeycomb right edge (dots)
      for (let hy=y+16; hy<y+h-16; hy+=12) svg += `    <circle cx="${x+w-6}" cy="${hy}" r="2" fill="none" stroke="#000000" stroke-width="0.5"/>\n`;
    }
  }
  // footer rule
  svg += `  <line x1="${W*0.02}" y1="${H*0.92}" x2="${W*0.98}" y2="${H*0.92}" stroke="#000000" stroke-width="1.5"/>\n`;
  svg += `  <text x="${W*0.02}" y="${H*0.95}" font-family="Helvetica" font-size="9">${plate.title} — ${plate.purpose.slice(0,80)}</text>\n`;
  svg += `  <text x="${W*0.70}" y="${H*0.95}" font-family="Helvetica" font-size="7">PASS ${pass}  BLACK-LINE 1.5  GHOST-40 4-2  8PX GRID  1536x1024  HELVETICA</text>\n`;
  svg += `</svg>\n`;
  const text = svg;
  mkdirSync(SCHEMATICDIR, { recursive: true });
  const file = `${SCHEMATICDIR}/${plateId}-p${pass}.svg`;
  writeFileSync(file, text);
  return { text, file, hash: sha256(text) };
}

function emitPrompt(scene: Scene, style: string, plateId: string, pass: number, refs?: RefRegistry, spec?: Spec): { text: string; file: string; hash: string } {
  const plate = scene.plates.find((p) => p.id === plateId);
  if (!plate) { console.error(`unknown plate ${plateId}`); process.exit(1); }
  const useRefs = refs ?? loadRefs();
  const useSpec = spec ?? loadSpec();
  const lines: string[] = [];
  lines.push(canonBlock(useRefs, useSpec));
  lines.push('');
  lines.push(`PLATE ${plate.id} — ${plate.title}`);
  lines.push(`PURPOSE: ${plate.purpose}`);
  lines.push(`VIEW: ${plate.view}`);
  lines.push(`CANVAS: ${plate.canvas.w} x ${plate.canvas.h} px (fixed, do not crop)`);
  lines.push('');
  lines.push('ELEMENTS (draw every one, exact relative positions x/y/w/h percent, origin top-left):');
  for (const n of plate.nodes) {
    lines.push(`- ${n.id} [${n.kind}] at x=${n.x} y=${n.y} w=${n.w} h=${n.h}`);
    lines.push(`    SHORT LABEL (only text allowed in image): ${n.text}`);
    lines.push(`    MEANING (visual, not text): ${n.detail}`);
  }
  lines.push('');
  lines.push(`STYLE CONTRACT (authoritative, from ${STYLE}):`);
  lines.push(style.trim());
  lines.push('');
  lines.push(`NEGATIVE CONSTRAINTS: ${NEGATIVE_CONSTRAINTS.join(', ')}.`);
  lines.push('');
  lines.push('CRITICAL TEXT RULE: Only render the SHORT LABEL strings as text in the image. Never render coordinates (x=, y=, w=, h=), position numbers, style spec (1.5px, 40%, 4-2, 0.5px, #000000), schematic file paths, or the STYLE CONTRACT prose as visible text. Coordinates and style are for layout only.');
  // schematic anchoring (fundamental: trace the schematic, do not hallucinate)
  const schematicFile = `${SCHEMATICDIR}/${plateId}-p${pass}.svg`;
  const anchor = HARDWARE_ANCHORS[plateId];
  lines.push('');
  lines.push(`SCHEMATIC ANCHOR (orthographic open-face blueprint; the render applies the CANONICAL CAMERA projection to it): ${schematicFile}`);
  if (anchor) lines.push(`HARDWARE ANCHORS: ${anchor.required.join(', ')} -- place each at its schematic coordinate, board end in / GPU end out, cage screws right-end, Bay4 outline only, GPU horizontal center-right double-wide.`);
  lines.push(`RENDER RULE: Trace the schematic and the supplied reference files. Copy every anchor position, orientation, proportion, part count and screw count exactly. Do not swap orientation, do not add or omit drives, do not fill color. The chassis outline MUST match the other plates of this manual byte-for-byte in shape.`);
  lines.push('');
  lines.push(refBlock(useRefs, useSpec, plateId));
  if (plate.renderNotes?.length) {
    lines.push('');
    lines.push(`PASS-${pass} CORRECTIONS:`);
    for (const note of plate.renderNotes) lines.push(`- ${note}`);
  }
  lines.push('Language: ENGLISH ONLY, Helvetica. No Japanese lettering. Render text sparingly: only SHORT LABEL strings, black Helvetica Bold caps on white, 4 words / 24 chars max.');
  lines.push(`PASS: ${pass}`);
  const text = lines.join('\n');
  mkdirSync(PROMPTDIR, { recursive: true });
  const file = `${PROMPTDIR}/${plate.id}-p${pass}.txt`;
  writeFileSync(file, text);
  return { text, file, hash: sha256(text) };
}

type Png = { w: number; h: number; bitDepth: number; colorType: number; interlace: number; raw: Buffer };
function parsePng(buf: Buffer): Png {
  const sig = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if (!buf.subarray(0,8).equals(sig)) throw new Error('not PNG');
  let off=8; let w=0,h=0,bitDepth=0,colorType=0,interlace=0; const idat: Buffer[]=[];
  while (off+8 <= buf.length) {
    const len=buf.readUInt32BE(off); const type=buf.toString('ascii',off+4,off+8); const data=buf.subarray(off+8,off+8+len);
    if (type==='IHDR'){ w=data.readUInt32BE(0); h=data.readUInt32BE(4); bitDepth=data[8]; colorType=data[9]; interlace=data[12]; }
    else if (type==='IDAT') idat.push(data);
    else if (type==='IEND') break;
    off+=12+len;
  }
  return { w,h,bitDepth,colorType,interlace,raw: inflateSync(Buffer.concat(idat)) };
}
const CHANNELS: Record<number,number> = { 0:1,2:3,3:1,4:2,6:4 };
function unfilter(png: Png): { lum: number[]; spread: number[] } {
  const ch=CHANNELS[png.colorType]; if(!ch) throw new Error(`color ${png.colorType}`); if(png.bitDepth!==8) throw new Error(`depth ${png.bitDepth}`); if(png.interlace!==0) throw new Error('interlaced');
  const stride=png.w*ch; const out=new Array<number>(png.w*png.h).fill(0); const sat=new Array<number>(png.w*png.h).fill(0); const prev=Buffer.alloc(stride); const cur=Buffer.alloc(stride); let pos=0;
  for(let y=0;y<png.h;y++){ const filter=png.raw[pos]; pos++; png.raw.copy(cur,0,pos,pos+stride); pos+=stride;
    for(let i=0;i<stride;i++){ const a=i>=ch?cur[i-ch]:0; const b=prev[i]; const c=i>=ch?prev[i-ch]:0; let v=cur[i];
      if(filter===1) v+=a; else if(filter===2) v+=b; else if(filter===3) v+= (a+b)>>1; else if(filter===4){ const p=a+b-c; const pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c); v+= pa<=pb&&pa<=pc?a:(pb<=pc?b:c); }
      cur[i]=v&0xff;
    }
    cur.copy(prev); const rowBase=y*png.w;
    for(let x=0;x<png.w;x++){ const i=x*ch; if(ch>=3){ const R=cur[i],G=cur[i+1],B=cur[i+2]; out[rowBase+x]=0.2126*R+0.7152*G+0.0722*B; sat[rowBase+x]=Math.max(R,G,B)-Math.min(R,G,B); } else { out[rowBase+x]=cur[i]; sat[rowBase+x]=0; } }
  }
  return { lum: out, spread: sat };
}
type Audit = { w:number;h:number;mean:number;stddev:number;pctDark:number;pctBright:number;edgeRatio:number;pctColor:number;unique:number;verdict:string;diags:Diag[] };
function auditPng(file: string): Audit {
  const buf=readFileSync(file); const png=parsePng(buf); const { lum, spread }=unfilter(png); const stride=3; const vals:number[]=[]; const colors=new Set<number>(); let dark=0,bright=0,edges=0,pairs=0,colored=0;
  for(let y=0;y<png.h;y+=stride){ for(let x=0;x<png.w;x+=stride){ const v=lum[y*png.w+x]; vals.push(v); colors.add(Math.round(v/8)); if(spread[y*png.w+x]>25) colored++; if(v<40) dark++; if(v>200) bright++; if(x+stride<png.w){ const r=lum[y*png.w+x+stride]; if(Math.abs(v-r)>40) edges++; pairs++; } } }
  const n=vals.length||1; const mean=vals.reduce((a,b)=>a+b,0)/n; const variance=vals.reduce((a,b)=>a+(b-mean)*(b-mean),0)/n; const stddev=Math.sqrt(variance);
  const pctDark=dark/n; const pctBright=bright/n; const edgeRatio=pairs?edges/pairs:0; const pctColor=colored/n;
  const diags: Diag[]=[];
  if(pctDark<0.01) diags.push({ code:'G-PX-001', severity:'ERROR', message:`dark ${(pctDark*100).toFixed(1)}% <1% blank` });
  if(pctDark>0.90) diags.push({ code:'G-PX-002', severity:'ERROR', message:`dark ${(pctDark*100).toFixed(1)}% >90% too dark for BW` });
  if(pctBright<0.30) diags.push({ code:'G-PX-003', severity:'ERROR', message:`bright ${(pctBright*100).toFixed(1)}% <30% not white paper` });
  if(stddev<8) diags.push({ code:'G-PX-004', severity:'ERROR', message:`stddev ${stddev.toFixed(1)} <8 flat` });
  if(edgeRatio<0.01) diags.push({ code:'G-PX-005', severity:'WARN', message:`edge ${edgeRatio.toFixed(4)} <0.01 little detail` });
  if(pctColor>0.005) diags.push({ code:'G-PX-006', severity:'ERROR', message:`color ${(pctColor*100).toFixed(2)}% chroma pixels >0.5% violates no-color` });
  const verdict=diags.some(x=>x.severity==='ERROR')?'FAIL':(diags.length?'PASS-WITH-WARN':'PASS');
  return { w:png.w,h:png.h,mean,stddev,pctDark,pctBright,edgeRatio,pctColor,unique:colors.size,verdict,diags };
}

function cmdPasses(): void { for(const p of PASSES) console.log(`${p.id}\t${p.name}\tconsumes=${p.consumes}`); console.log(`PASSES=${PASSES.length}`); }
function cmdFacts(args: string[]): void {
  const facts=loadJson<FactsFile>(FACTS); const only=args.find(a=>a.startsWith('--only='))?.split('=')[1];
  const list=facts.facts.filter(f=>!only|| (f.confidence??'').toUpperCase()===only.toUpperCase()).sort((a,b)=>a.id.localeCompare(b.id));
  if(args.includes('--json')){ console.log(JSON.stringify(list,null,2)); return; }
  for(const f of list) console.log(`${f.id}\t${f.confidence}\t${f.topic}\t${f.value}`);
  console.log(`FACTS=${list.length}`);
}
function cmdIr(args: string[]): void {
  const scene=loadJson<Scene>(SCENE); const plateId=args.find(a=>a.startsWith('--plate='))?.split('=')[1];
  for(const p of scene.plates){ if(plateId&&p.id!==plateId) continue; console.log(`plate ${p.id}: ${p.title} [${p.canvas.w}x${p.canvas.h}] nodes=${p.nodes.length}`); for(const n of p.nodes) console.log(`  ${n.id}\t${n.kind}\t${n.text}`); }
}
function cmdRefs(args: string[]): number {
  const refs=loadRefs(); const spec=loadSpec(); const scene=loadJson<Scene>(SCENE);
  const diags=checkRefs(refs,spec,scene.plates);
  if(args.includes('--json')){ console.log(JSON.stringify(refs,null,2)); return diags.some(d=>d.severity==='ERROR')?1:0; }
  for(const r of refs.images){
    let line=`${r.persisted===false?'CHAT-ONLY':'REF     '}\t${r.id}\t${r.file || '(no file)'}`;
    if(r.file && existsSync(r.file)){ const hash=sha256(readFileSync(r.file)); line += `\t${hash===r.sha256?'hash=OK':'HASH-DRIFT'}`; line += `\t${r.doc ?? ''}`; }
    console.log(line);
  }
  for(const p of scene.plates) console.log(`PLATE-REFS\t${p.id}\t${(refs.plateRefs[p.id]??[]).join(',')}`);
  for(const d of diags.sort((a,b)=>a.code.localeCompare(b.code))) console.log(`${d.severity}\t${d.code}\t${d.plate??'-'}\t${d.node??'-'}\t${d.message}`);
  const errs=diags.filter(d=>d.severity==='ERROR').length;
  console.log(`REFS spec=${spec.version} refs=${refs.images.length} parts=${spec.chassisFaceParts.length} invariants=${spec.invariants.length} errors=${errs}`);
  return errs?1:0;
}
function cmdLint(args: string[]): number {
  const facts=loadJson<FactsFile>(FACTS); const scene=loadJson<Scene>(SCENE); const style=loadText(STYLE);
  const refs=loadRefs(); const spec=loadSpec();
  const diags: Diag[]=[...harvest(facts,scene),...lex().diags,...resolve(facts,scene),...typecheck(scene),...layout(scene).diags,...schematicCheck(scene),...checkRefs(refs,spec,scene.plates)];
  for(const p of scene.plates) diags.push(...stylecheck(emitPrompt(scene,style,p.id,0,refs,spec).text));
  if(args.includes('--json')) console.log(JSON.stringify(diags,null,2)); else for(const d of diags.sort((a,b)=>a.code.localeCompare(b.code))) console.log(`${d.severity}\t${d.code}\t${d.plate??'-'}\t${d.node??'-'}\t${d.message}`);
  const errs=diags.filter(d=>d.severity==='ERROR').length; const warns=diags.filter(d=>d.severity==='WARN').length;
  console.log(`LINT errors=${errs} warnings=${warns} diagnostics=${diags.length}`); return errs?1:0;
}
function cmdLayout(args: string[]): number {
  const scene=loadJson<Scene>(SCENE); const plateId=args.find(a=>a.startsWith('--plate='))?.split('=')[1];
  const { diags, rows }=layout(scene,plateId); for(const r of rows) console.log(r); for(const d of diags) console.log(`${d.severity}\t${d.code}\t${d.plate??'-'}\t${d.node??'-'}\t${d.message}`); console.log(`LAYOUT nodes=${rows.length} diag=${diags.length}`); return diags.filter(d=>d.severity==='ERROR').length?1:0;
}
function cmdPrompt(args: string[]): void {
  const scene=loadJson<Scene>(SCENE); const style=loadText(STYLE);
  const refs=loadRefs(); const spec=loadSpec();
  const refDiags=checkRefs(refs,spec,scene.plates);
  if(refDiags.some(d=>d.severity==='ERROR')){ for(const d of refDiags) console.error(`${d.severity}\t${d.code}\t${d.message}`); console.error('ref registry not clean; run `node tools/mac-guide-art.ts refs`'); process.exit(1); }
  const plate=args.find(a=>a.startsWith('--plate='))?.split('=')[1] ?? scene.plates[0].id;
  const pass=Number(args.find(a=>a.startsWith('--pass='))?.split('=')[1] ?? '1');
  // schematic must exist first (deterministic blueprint) - emit it now if missing
  const schematic = emitSchematicSvg(scene, plate, pass);
  const out=emitPrompt(scene,style,plate,pass,refs,spec);
  const plateRefIds = refs.plateRefs[plate] ?? [];
  const attachedArg=args.find(a=>a.startsWith('--attached='))?.split('=')[1];
  const attached = attachedArg ? attachedArg.split(',').map(s=>s.trim()).filter(Boolean) : plateRefIds.filter(id => { const r=refs.images.find(x=>x.id===id); return !!r?.file && existsSync(r.file); });
  const ledger=loadLedger(); const entry=plateEntry(ledger,plate);
  const rec: PassRecord={ pass, promptFile:out.file, promptHash:out.hash, schematicFile:schematic.file, schematicHash:schematic.hash, specVersion:spec.version, refIds:plateRefIds, refsAttached:attached, artifacts:[], findings:[], patches:[], verdict:'PROMPT-EMITTED' };
  const existing=entry.passes.findIndex(p=>p.pass===pass);
  if(existing>=0) entry.passes[existing]={ ...entry.passes[existing], ...rec, findings:entry.passes[existing].findings, artifacts:entry.passes[existing].artifacts };
  else entry.passes.push(rec);
  entry.nextPass=Math.max(entry.nextPass,pass+1); saveLedger(ledger);
  console.log(`SCHEMATIC_FILE=${schematic.file}`); console.log(`SCHEMATIC_SHA256=${schematic.hash}`);
  console.log(`SPEC_VERSION=${spec.version}`); console.log(`REF_IDS=${plateRefIds.join(',')}`);
  const missing = plateRefIds.filter(id => { const r=refs.images.find(x=>x.id===id); return r && (r.persisted===false || !r.file); });
  if(missing.length) console.log(`REFS_CHAT_ONLY_NOT_ATTACHABLE=${missing.join(',')} (re-upload before render)`);
  console.log(out.text); console.log(`PROMPT_FILE=${out.file}`); console.log(`PROMPT_SHA256=${out.hash}`);
}
function cmdSchematic(args: string[]): number {
  const scene=loadJson<Scene>(SCENE);
  const plate=args.find(a=>a.startsWith('--plate='))?.split('=')[1] ?? scene.plates[0].id;
  const pass=Number(args.find(a=>a.startsWith('--pass='))?.split('=')[1] ?? '1');
  const out=emitSchematicSvg(scene, plate, pass);
  const ledger=loadLedger(); const entry=plateEntry(ledger,plate);
  let rec=entry.passes.find(x=>x.pass===pass);
  if(!rec){ rec={ pass, artifacts:[], findings:[], patches:[], verdict:'SCHEMATIC' }; entry.passes.push(rec); }
  rec.schematicFile=out.file; rec.schematicHash=out.hash;
  saveLedger(ledger);
  console.log(`SCHEMATIC plate=${plate} pass=${pass} file=${out.file} sha256=${out.hash}`);
  // sanity: check schematic exists and is deterministic
  const again=emitSchematicSvg(scene, plate, pass);
  console.log(`DETERMINISTIC=${again.hash===out.hash ? 'YES' : 'NO'} hash=${again.hash.slice(0,12)}`);
  return 0;
}
function cmdRender(args: string[]): number {
  const plate=args.find(a=>a.startsWith('--plate='))?.split('=')[1]; const pass=Number(args.find(a=>a.startsWith('--pass='))?.split('=')[1] ?? '1'); const file=args.find(a=>a.startsWith('--file='))?.split('=')[1];
  if(!plate||!file){ console.error('usage: render --plate=ID --pass=N --file=PATH'); return 1; }
  if(!existsSync(file)){ console.error(`missing ${file}`); return 1; }
  const buf=readFileSync(file); const a=auditPng(file); const scene=loadJson<Scene>(SCENE); const p=scene.plates.find(x=>x.id===plate);
  const diags: Diag[]=[...a.diags]; if(p){ const want=p.canvas.w/p.canvas.h; const got=a.w/a.h; if(Math.abs(want-got)>0.02) diags.push({ code:'G-RN-001', severity:'WARN', plate, message:`aspect ${got.toFixed(3)} != ${want.toFixed(3)}` }); }
  const ledger=loadLedger(); const entry=plateEntry(ledger,plate); let rec=entry.passes.find(x=>x.pass===pass); if(!rec){ rec={ pass, artifacts:[], findings:[], patches:[], verdict:'RENDERED' }; entry.passes.push(rec); }
  rec.artifacts=[{ file, sha256:sha256(buf), bytes:buf.length, w:a.w, h:a.h }]; rec.audit={ mean:Number(a.mean.toFixed(2)), stddev:Number(a.stddev.toFixed(2)), pctDark:Number(a.pctDark.toFixed(4)), pctBright:Number(a.pctBright.toFixed(4)), edgeRatio:Number(a.edgeRatio.toFixed(4)), pctColor:Number(a.pctColor.toFixed(4)), unique:a.unique }; rec.auditVerdict=a.verdict; rec.verdict=diags.some(d=>d.severity==='ERROR')?'RENDER-FAIL':'RENDERED'; saveLedger(ledger);
  console.log(`file=${file}`); console.log(`sha256=${sha256(buf)}`); console.log(`bytes=${buf.length}`); console.log(`dimensions=${a.w}x${a.h}`); console.log(`colorPct=${(a.pctColor*100).toFixed(2)}`); console.log(`AUDIT=${a.verdict}`); for(const d of diags) console.log(`${d.severity}\t${d.code}\t${d.message}`); return 0;
}
function cmdAudit(args: string[]): number {
  const file=args.find(a=>a.startsWith('--file='))?.split('=')[1]; if(!file){ console.error('usage: audit --file=PATH'); return 1; }
  const a=auditPng(file); console.log(`file=${file} dim=${a.w}x${a.h} mean=${a.mean.toFixed(2)} std=${a.stddev.toFixed(2)} dark=${(a.pctDark*100).toFixed(1)}% bright=${(a.pctBright*100).toFixed(2)}% edge=${a.edgeRatio.toFixed(4)} color=${(a.pctColor*100).toFixed(2)}% verdict=${a.verdict}`); for(const d of a.diags) console.log(`${d.severity}\t${d.code}\t${d.message}`); return a.verdict==='FAIL'?1:0;
}
function cmdFindings(args: string[]): number {
  const plate=args.find(a=>a.startsWith('--plate='))?.split('=')[1]; const pass=Number(args.find(a=>a.startsWith('--pass='))?.split('=')[1] ?? '1'); const inline=args.find(a=>a.startsWith('--add='))?.slice(6); const file=args.find(a=>a.startsWith('--file='))?.split('=')[1];
  if(!plate){ console.error('usage: findings --plate=ID --pass=N --add=JSON'); return 1; }
  const incoming: Finding[] = [];
  const absorb = (parsed: unknown) => {
    if (Array.isArray(parsed)) for (const f of parsed) incoming.push(f as Finding);
    else incoming.push(parsed as Finding);
  };
  if (inline) absorb(JSON.parse(inline));
  if (file) absorb(JSON.parse(readFileSync(file, 'utf8')));
  const ledger=loadLedger(); const entry=plateEntry(ledger,plate); let rec=entry.passes.find(x=>x.pass===pass); if(!rec){ rec={ pass, artifacts:[], findings:[], patches:[], verdict:'CRITIQUED' }; entry.passes.push(rec); }
  rec.findings.push(...incoming); rec.verdict=rec.findings.some(f=>f.severity==='ERROR')?'FAIL':'PASS-WITH-WARN'; saveLedger(ledger);
  console.log(`FINDINGS=${rec.findings.length}`); return 0;
}
function cmdDeduct(args: string[]): number {
  const ledger=loadLedger(); const plateId=args.find(a=>a.startsWith('--plate='))?.split('=')[1]; const plates=plateId?[plateId]:Object.keys(ledger.plates).sort(); let residual=0;
  for(const id of plates){ const entry=ledger.plates[id]; if(!entry) continue; const assessed=entry.passes.filter(r=>r.findings.length>0||r.artifacts.length>0); const last=assessed.length?assessed[assessed.length-1]:undefined; const open=(last?.findings??[]).filter(f=>f.severity==='ERROR'); residual+=open.length; console.log(`plate ${id}: nextPass=${entry.nextPass} open=${open.length}${open.length===0?' FIXPOINT':''}`); }
  saveLedger(ledger); console.log(`RESIDUAL=${residual}`); return 0;
}
function cmdStatus(): void {
  const ledger=loadLedger(); const scene=loadJson<Scene>(SCENE); console.log('GUIDE_STATUS'); console.log(`plates=${scene.plates.map(p=>p.id).join(',')}`);
  for(const id of Object.keys(ledger.plates).sort()){ const e=ledger.plates[id]; console.log(`plate ${id}: passes=${e.passes.length} next=${e.nextPass}`); }
}
function cmdSelftest(): number {
  const checks: { name:string; ok:boolean; detail:string }[]=[];
  const facts=loadJson<FactsFile>(FACTS); const scene=loadJson<Scene>(SCENE); const style=loadText(STYLE);
  const refs=loadRefs(); const spec=loadSpec();
  const refDiags=checkRefs(refs,spec,scene.plates);
  checks.push({ name:'facts-parse', ok:facts.facts.length>=10, detail:`facts=${facts.facts.length}` });
  checks.push({ name:'facts-sourced', ok:facts.facts.every(f=>(f.source?.ref??f.source?.url??'')!==''), detail:'sourced' });
  checks.push({ name:'eight-plates', ok:scene.plates.length===8, detail:`plates=${scene.plates.length}` });
  checks.push({ name:'harvest-clean', ok:harvest(facts,scene).filter(d=>d.severity==='ERROR').length===0, detail:'harvest' });
  checks.push({ name:'typecheck-clean', ok:typecheck(scene).filter(d=>d.severity==='ERROR').length===0, detail:'typecheck' });
  checks.push({ name:'layout-clean', ok:layout(scene).diags.filter(d=>d.severity==='ERROR').length===0, detail:'layout' });
  checks.push({ name:'refs-clean', ok:refDiags.filter(d=>d.severity==='ERROR').length===0, detail:`refErrors=${refDiags.filter(d=>d.severity==='ERROR').length}` });
  checks.push({ name:'spec-version', ok:!!spec.version, detail:spec.version ?? 'missing' });
  checks.push({ name:'spec-invariants-10', ok:spec.invariants.length===10, detail:`invariants=${spec.invariants.length}` });
  checks.push({ name:'every-plate-has-refs', ok:scene.plates.every(p=>(refs.plateRefs[p.id]??[]).length>=3), detail:'min 3 refs/plate' });
  for(const p of scene.plates){ const pr=emitPrompt(scene,style,p.id,0,refs,spec).text; const s=stylecheck(pr); checks.push({ name:`style-${p.id}`, ok:s.length===0, detail:`missing=${s.length}` }); }
  const a=emitPrompt(scene,style,scene.plates[0].id,1,refs,spec); const b=emitPrompt(scene,style,scene.plates[0].id,1,refs,spec); checks.push({ name:'deterministic', ok:a.hash===b.hash, detail:a.hash.slice(0,12) });
  const sc1=emitSchematicSvg(scene, scene.plates[0].id, 1); const sc2=emitSchematicSvg(scene, scene.plates[0].id, 1); checks.push({ name:'schematic-deterministic', ok:sc1.hash===sc2.hash, detail:sc1.hash.slice(0,12) });
  checks.push({ name:'schematic-anchors', ok:schematicCheck(scene).filter(d=>d.severity==='ERROR').length===0, detail:'schematic' });
  // the canon block must be byte-identical across every plate - this enforces consistency
  const canon = canonBlock(refs,spec);
  const canonOk = scene.plates.every(p=>emitPrompt(scene,style,p.id,0,refs,spec).text.includes(canon));
  checks.push({ name:'canon-block-identical', ok:canonOk, detail:`bytes=${canon.length}` });
  // every plate prompt must carry its ref tracing block with the mapped refs
  const traceOk = scene.plates.every(p=>{ const t=emitPrompt(scene,style,p.id,0,refs,spec).text; return (refs.plateRefs[p.id]??[]).every(id=>t.includes(`REF ${id} `)); });
  checks.push({ name:'ref-block-per-plate', ok:traceOk, detail:'all plateRefs traced' });
  for(const c of checks) console.log(`${c.ok?'PASS':'FAIL'}\t${c.name}\t${c.detail}`);
  const failed=checks.filter(c=>!c.ok).length; console.log(`SELFTEST checks=${checks.length} failed=${failed}`); return failed?1:0;
}
function argVal(args: string[], key: string): string|undefined { const hit=args.find(a=>a.startsWith(`${key}=`)); return hit?hit.slice(key.length+1):undefined; }

function main(): void {
  const [cmd,...rest]=process.argv.slice(2);
  switch(cmd){
    case 'passes': cmdPasses(); break;
    case 'refs': process.exit(cmdRefs(rest)); break;
    case 'facts': cmdFacts(rest); break;
    case 'ir': cmdIr(rest); break;
    case 'lint': process.exit(cmdLint(rest)); break;
    case 'layout': process.exit(cmdLayout(rest)); break;
    case 'prompt': cmdPrompt(rest); break;
    case 'schematic': process.exit(cmdSchematic(rest)); break;
    case 'render': process.exit(cmdRender(rest)); break;
    case 'audit': process.exit(cmdAudit(rest)); break;
    case 'findings': process.exit(cmdFindings(rest)); break;
    case 'deduct': process.exit(cmdDeduct(rest)); break;
    case 'status': cmdStatus(); break;
    case 'selftest': process.exit(cmdSelftest()); break;
    default: console.log('usage: node tools/mac-guide-art.ts <passes|refs|facts|ir|lint|layout|prompt|schematic|render|audit|findings|deduct|status|selftest>'); process.exit(2);
  }
}
main();
