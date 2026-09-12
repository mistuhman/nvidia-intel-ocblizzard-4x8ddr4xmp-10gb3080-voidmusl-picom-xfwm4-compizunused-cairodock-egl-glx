#!/usr/bin/env node
// Agentic imaging pass-compiler for Mac Pro 3,1 chassis guide - 8-step visual manual
// Reuses the Quake-Live hex/AMOLED style contract from mac-storage-art.ts
// Pipeline: P0 harvest -> P1 lex -> P2 resolve -> P3 typecheck -> P4 layout -> P5 stylecheck -> P6 emit -> P7 render -> P8 pixel-audit -> P9 critique -> P10 deduct
// Zero dependencies, deterministic stdout

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

const FACTS = 'docs/macpro-guide-facts.json';
const SCENE = 'docs/macpro-guide-scene.json';
const STYLE = 'docs/macpro-guide-style-bw.md';
const PROMPTS = 'docs/macpro-storage-prompts.jsonl';
const LEDGER = 'receipts/mac-guide/pass-ledger.json';
const PROMPTDIR = 'receipts/mac-guide/prompts';

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
type PassRecord = { pass: number; promptFile?: string; promptHash?: string; artifacts: Artifact[]; audit?: Record<string, number | string>; auditVerdict?: string; findings: Finding[]; patches: string[]; verdict: string };
type Ledger = { schema: string; updated?: string; plates: Record<string, { passes: PassRecord[]; nextPass: number }> };

const PASSES = [
  { id: 'P0', name: 'harvest', consumes: FACTS, emits: 'fact table + confidence', deducts: 'unsourced or LOW' },
  { id: 'P1', name: 'lex', consumes: PROMPTS, emits: 'demand list', deducts: 'unparsed clauses' },
  { id: 'P2', name: 'resolve', consumes: 'fact table + scene IR', emits: 'bound graph', deducts: 'dangling facts' },
  { id: 'P3', name: 'typecheck', consumes: 'scene + 8-step guide', emits: 'guide semantics', deducts: 'bay count, plate count, SSD relocation logic' },
  { id: 'P4', name: 'layout', consumes: 'node boxes', emits: 'coords', deducts: 'overlap, overflow' },
  { id: 'P5', name: 'stylecheck', consumes: STYLE, emits: 'token coverage', deducts: 'missing Quake tokens' },
  { id: 'P6', name: 'emit', consumes: 'IR+style', emits: 'prompt+hash', deducts: 'hash drift' },
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
  'helvetica', 'lego', 'ghost', 'transparent', 'arrow', 'uniform sidepanel', 'japanese compactness',
  'accurate hardware', 'black and white',
];
const NEGATIVE_CONSTRAINTS = [
  'no-color', 'no-amoled', 'no-neon-glow-bloom', 'no-watermark', 'no-photoreal-human', 'no-brand-logo-watermark',
  'no-blurry-icons', 'no-extra-drives', 'no-macbook', 'no-rack-server',
  'no-invented-port-counts', 'no-raid-5-in-disk-utility', 'no-apfs-on-10-7',
  'no-paragraph-in-image', 'no-text-walls', 'no-color-fill', 'no-gray-fill', 'no-shading',
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
  const lines = loadText(PROMPTS).split(/\\r?\\n/).filter((l) => l.trim().length > 0);
  const hits = new Map<string, number>();
  const unparsed: string[] = [];
  let clauses = 0;
  for (const line of lines) {
    let entry: { verbatim?: string } = {};
    try { entry = JSON.parse(line); } catch { continue; }
    const text = entry.verbatim ?? '';
    for (const clause of text.split(/[,;]|\\.(?=\\s|$)|\\bthen\\b/i).map((s) => s.trim()).filter(Boolean)) {
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
  // each plate must have a footer
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

function emitPrompt(scene: Scene, style: string, plateId: string, pass: number): { text: string; file: string; hash: string } {
  const plate = scene.plates.find((p) => p.id === plateId);
  if (!plate) { console.error(`unknown plate ${plateId}`); process.exit(1); }
  const lines: string[] = [];
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
  lines.push('STYLE CONTRACT (authoritative, from docs/macpro-storage-style.md):');
  lines.push(style.trim());
  lines.push('');
  lines.push(`NEGATIVE CONSTRAINTS: ${NEGATIVE_CONSTRAINTS.join(', ')}.`);
  if (plate.renderNotes?.length) {
    lines.push('');
    lines.push(`PASS-${pass} CORRECTIONS:`);
    for (const note of plate.renderNotes) lines.push(`- ${note}`);
  }
  lines.push('Render text sparingly: only SHORT LABEL strings, silver-white heavy condensed caps, 4 words max.');
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
function unfilter(png: Png): number[] {
  const ch=CHANNELS[png.colorType]; if(!ch) throw new Error(`color ${png.colorType}`); if(png.bitDepth!==8) throw new Error(`depth ${png.bitDepth}`); if(png.interlace!==0) throw new Error('interlaced');
  const stride=png.w*ch; const out=new Array<number>(png.w*png.h).fill(0); const prev=Buffer.alloc(stride); const cur=Buffer.alloc(stride); let pos=0;
  for(let y=0;y<png.h;y++){ const filter=png.raw[pos]; pos++; png.raw.copy(cur,0,pos,pos+stride); pos+=stride;
    for(let i=0;i<stride;i++){ const a=i>=ch?cur[i-ch]:0; const b=prev[i]; const c=i>=ch?prev[i-ch]:0; let v=cur[i];
      if(filter===1) v+=a; else if(filter===2) v+=b; else if(filter===3) v+= (a+b)>>1; else if(filter===4){ const p=a+b-c; const pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c); v+= pa<=pb&&pa<=pc?a:(pb<=pc?b:c); }
      cur[i]=v&0xff;
    }
    cur.copy(prev); const rowBase=y*png.w;
    for(let x=0;x<png.w;x++){ const i=x*ch; if(ch>=3) out[rowBase+x]=0.2126*cur[i]+0.7152*cur[i+1]+0.0722*cur[i+2]; else out[rowBase+x]=cur[i]; }
  }
  return out;
}
type Audit = { w:number;h:number;mean:number;stddev:number;pctDark:number;pctBright:number;edgeRatio:number;unique:number;verdict:string;diags:Diag[] };
function auditPng(file: string): Audit {
  const buf=readFileSync(file); const png=parsePng(buf); const lum=unfilter(png); const stride=3; const vals:number[]=[]; const colors=new Set<number>(); let dark=0,bright=0,edges=0,pairs=0;
  for(let y=0;y<png.h;y+=stride){ for(let x=0;x<png.w;x+=stride){ const v=lum[y*png.w+x]; vals.push(v); colors.add(Math.round(v/8)); if(v<40) dark++; if(v>200) bright++; if(x+stride<png.w){ const r=lum[y*png.w+x+stride]; if(Math.abs(v-r)>40) edges++; pairs++; } } }
  const n=vals.length||1; const mean=vals.reduce((a,b)=>a+b,0)/n; const variance=vals.reduce((a,b)=>a+(b-mean)*(b-mean),0)/n; const stddev=Math.sqrt(variance);
  const pctDark=dark/n; const pctBright=bright/n; const edgeRatio=pairs?edges/pairs:0;
  // BW efficient style: white paper #FFFFFF, black-line 1.5px, mostly bright, low dark is correct
  const diags: Diag[]=[];
  if(pctDark<0.01) diags.push({ code:'G-PX-001', severity:'ERROR', message:`dark ${(pctDark*100).toFixed(1)}% <1% blank` });
  if(pctDark>0.90) diags.push({ code:'G-PX-002', severity:'ERROR', message:`dark ${(pctDark*100).toFixed(1)}% >90% too dark for BW` });
  if(pctBright<0.30) diags.push({ code:'G-PX-003', severity:'ERROR', message:`bright ${(pctBright*100).toFixed(1)}% <30% not white paper` });
  if(stddev<8) diags.push({ code:'G-PX-004', severity:'ERROR', message:`stddev ${stddev.toFixed(1)} <8 flat` });
  if(edgeRatio<0.01) diags.push({ code:'G-PX-005', severity:'WARN', message:`edge ${edgeRatio.toFixed(4)} <0.01 little detail` });
  const verdict=diags.some(x=>x.severity==='ERROR')?'FAIL':(diags.length?'PASS-WITH-WARN':'PASS');
  return { w:png.w,h:png.h,mean,stddev,pctDark,pctBright,edgeRatio,unique:colors.size,verdict,diags };
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
function cmdLint(args: string[]): number {
  const facts=loadJson<FactsFile>(FACTS); const scene=loadJson<Scene>(SCENE); const style=loadText(STYLE);
  const diags: Diag[]=[...harvest(facts,scene),...lex().diags,...resolve(facts,scene),...typecheck(scene),...layout(scene).diags];
  for(const p of scene.plates) diags.push(...stylecheck(emitPrompt(scene,style,p.id,0).text));
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
  const plate=args.find(a=>a.startsWith('--plate='))?.split('=')[1] ?? scene.plates[0].id;
  const pass=Number(args.find(a=>a.startsWith('--pass='))?.split('=')[1] ?? '1');
  const out=emitPrompt(scene,style,plate,pass);
  const ledger=loadLedger(); const entry=plateEntry(ledger,plate);
  const rec: PassRecord={ pass, promptFile:out.file, promptHash:out.hash, artifacts:[], findings:[], patches:[], verdict:'PROMPT-EMITTED' };
  const existing=entry.passes.findIndex(p=>p.pass===pass);
  if(existing>=0) entry.passes[existing]={ ...entry.passes[existing], ...rec, findings:entry.passes[existing].findings, artifacts:entry.passes[existing].artifacts };
  else entry.passes.push(rec);
  entry.nextPass=Math.max(entry.nextPass,pass+1); saveLedger(ledger);
  console.log(out.text); console.log(`PROMPT_FILE=${out.file}`); console.log(`PROMPT_SHA256=${out.hash}`);
}
function cmdRender(args: string[]): number {
  const plate=args.find(a=>a.startsWith('--plate='))?.split('=')[1]; const pass=Number(args.find(a=>a.startsWith('--pass='))?.split('=')[1] ?? '1'); const file=args.find(a=>a.startsWith('--file='))?.split('=')[1];
  if(!plate||!file){ console.error('usage: render --plate=ID --pass=N --file=PATH'); return 1; }
  if(!existsSync(file)){ console.error(`missing ${file}`); return 1; }
  const buf=readFileSync(file); const a=auditPng(file); const scene=loadJson<Scene>(SCENE); const p=scene.plates.find(x=>x.id===plate);
  const diags: Diag[]=[...a.diags]; if(p){ const want=p.canvas.w/p.canvas.h; const got=a.w/a.h; if(Math.abs(want-got)>0.02) diags.push({ code:'G-RN-001', severity:'WARN', plate, message:`aspect ${got.toFixed(3)} != ${want.toFixed(3)}` }); }
  const ledger=loadLedger(); const entry=plateEntry(ledger,plate); let rec=entry.passes.find(x=>x.pass===pass); if(!rec){ rec={ pass, artifacts:[], findings:[], patches:[], verdict:'RENDERED' }; entry.passes.push(rec); }
  rec.artifacts=[{ file, sha256:sha256(buf), bytes:buf.length, w:a.w, h:a.h }]; rec.audit={ mean:Number(a.mean.toFixed(2)), stddev:Number(a.stddev.toFixed(2)), pctDark:Number(a.pctDark.toFixed(4)), pctBright:Number(a.pctBright.toFixed(4)), edgeRatio:Number(a.edgeRatio.toFixed(4)), unique:a.unique }; rec.auditVerdict=a.verdict; rec.verdict=diags.some(d=>d.severity==='ERROR')?'RENDER-FAIL':'RENDERED'; saveLedger(ledger);
  console.log(`file=${file}`); console.log(`sha256=${sha256(buf)}`); console.log(`bytes=${buf.length}`); console.log(`dimensions=${a.w}x${a.h}`); console.log(`AUDIT=${a.verdict}`); for(const d of diags) console.log(`${d.severity}\t${d.code}\t${d.message}`); return 0;
}
function cmdAudit(args: string[]): number {
  const file=args.find(a=>a.startsWith('--file='))?.split('=')[1]; if(!file){ console.error('usage: audit --file=PATH'); return 1; }
  const a=auditPng(file); console.log(`file=${file} dim=${a.w}x${a.h} mean=${a.mean.toFixed(2)} std=${a.stddev.toFixed(2)} dark=${(a.pctDark*100).toFixed(1)}% bright=${(a.pctBright*100).toFixed(2)}% edge=${a.edgeRatio.toFixed(4)} verdict=${a.verdict}`); for(const d of a.diags) console.log(`${d.severity}\t${d.code}\t${d.message}`); return a.verdict==='FAIL'?1:0;
}
function cmdFindings(args: string[]): number {
  const plate=args.find(a=>a.startsWith('--plate='))?.split('=')[1]; const pass=Number(args.find(a=>a.startsWith('--pass='))?.split('=')[1] ?? '1'); const inline=args.find(a=>a.startsWith('--add='))?.slice(6); const file=args.find(a=>a.startsWith('--file='))?.split('=')[1];
  if(!plate){ console.error('usage: findings --plate=ID --pass=N --add=JSON'); return 1; }
  const incoming: Finding[]=[]; if(inline) incoming.push(JSON.parse(inline)); if(file) incoming.push(...JSON.parse(readFileSync(file,'utf8')));
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
  checks.push({ name:'facts-parse', ok:facts.facts.length>=10, detail:`facts=${facts.facts.length}` });
  checks.push({ name:'facts-sourced', ok:facts.facts.every(f=>(f.source?.ref??f.source?.url??'')!==''), detail:'sourced' });
  checks.push({ name:'eight-plates', ok:scene.plates.length===8, detail:`plates=${scene.plates.length}` });
  checks.push({ name:'harvest-clean', ok:harvest(facts,scene).filter(d=>d.severity==='ERROR').length===0, detail:'harvest' });
  checks.push({ name:'typecheck-clean', ok:typecheck(scene).filter(d=>d.severity==='ERROR').length===0, detail:'typecheck' });
  checks.push({ name:'layout-clean', ok:layout(scene).diags.filter(d=>d.severity==='ERROR').length===0, detail:'layout' });
  for(const p of scene.plates){ const pr=emitPrompt(scene,style,p.id,0).text; const s=stylecheck(pr); checks.push({ name:`style-${p.id}`, ok:s.length===0, detail:`missing=${s.length}` }); }
  const a=emitPrompt(scene,style,scene.plates[0].id,1); const b=emitPrompt(scene,style,scene.plates[0].id,1); checks.push({ name:'deterministic', ok:a.hash===b.hash, detail:a.hash.slice(0,12) });
  for(const c of checks) console.log(`${c.ok?'PASS':'FAIL'}\t${c.name}\t${c.detail}`);
  const failed=checks.filter(c=>!c.ok).length; console.log(`SELFTEST checks=${checks.length} failed=${failed}`); return failed?1:0;
}
function argVal(args: string[], key: string): string|undefined { const hit=args.find(a=>a.startsWith(`${key}=`)); return hit?hit.slice(key.length+1):undefined; }

function main(): void {
  const [cmd,...rest]=process.argv.slice(2);
  switch(cmd){
    case 'passes': cmdPasses(); break;
    case 'facts': cmdFacts(rest); break;
    case 'ir': cmdIr(rest); break;
    case 'lint': process.exit(cmdLint(rest)); break;
    case 'layout': process.exit(cmdLayout(rest)); break;
    case 'prompt': cmdPrompt(rest); break;
    case 'render': process.exit(cmdRender(rest)); break;
    case 'audit': process.exit(cmdAudit(rest)); break;
    case 'findings': process.exit(cmdFindings(rest)); break;
    case 'deduct': process.exit(cmdDeduct(rest)); break;
    case 'status': cmdStatus(); break;
    case 'selftest': process.exit(cmdSelftest()); break;
    default: console.log('usage: node tools/mac-guide-art.ts <passes|facts|ir|lint|layout|prompt|render|audit|findings|deduct|status|selftest>'); process.exit(2);
  }
}
main();
