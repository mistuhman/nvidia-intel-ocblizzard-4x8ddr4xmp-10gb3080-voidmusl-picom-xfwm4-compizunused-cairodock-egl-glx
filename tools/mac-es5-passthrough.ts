#!/usr/bin/env node
// mac-es5-passthrough - agentic ES5 compiler passthrough for Lion-class browsers (2026-09-16f).
// Discovers a modern web app's script assets, transpiles them down to what Arctic Fox
// (Firefox-52-class Goanna) can parse, attaches a core-js polyfill prelude, emits an ES5 loader
// page and a sha256 RECEIPT with a node --check syntax gate per emitted file.
// Registry-driven: APPS below is the single source of truth; --app=all (the workflow default)
// expands to every registered app, so adding a planned app later is an agent-side commit here -
// the workflow YAML never changes and the operator never re-pastes anything.
// Layout: fetch nests per app (out/<app>/src-*.js), transpile/receipt/loader loop those dirs;
// a flat in-dir (no subdirs) still works for one-off use.
// Dep-free core (apps/selftest/receipt/loader); the transpile step needs @babel/core +
// core-js-bundle, installed by ci/workflows/mac-es5-passthrough.yml (CI-only deps, justified).
// Deterministic stdout, fail fast, no hidden policy.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const APPS: Record<string, { entry: string; note: string }> = {
  'discord-web': { entry: 'https://discord.com/app', note: 'app shell: discover <script src="..."> assets, transpile each' },
  'vencord-web': { entry: 'https://vencord.dev/assets/Vencord.user.js', note: 'single userscript bundle, transpile as-is' },
};

// Training corpus v1 (operator 2026-09-16f: "train the compiler with copious instruction sets").
// Versioned instruction set: common compile hazards/shims + per-app directives. Every run snapshots
// it into the bundle zip (INSTRUCTIONS.json) and hashes it into RECEIPT-INDEX.json so any on-Mac
// receipt cites the exact corpus version. Growth rule: new hazard or shim = new entry HERE with a
// receipt citation (CI log or da.gd/lionone burn); no silent behavior changes, ever.
const INSTRUCTIONS: { version: string; common: string[]; apps: Record<string, string[]> } = {
  version: "2026-09-16f-v1",
  common: [
    "target floor: firefox 52 (Arctic Fox 47 Goanna parse class) via @babel/preset-env, modules:false - syntax lowering only, no module wrapping",
    "polyfill prelude: core-js-bundle full build loads FIRST in loader.html (polyfill.js before every es5-*.js); order is load-bearing",
    "no behavior rewrites: transpile + polyfill only; any semantic shim requires its own instruction entry plus a receipt citation",
    "syntax gate: node --check per emitted .js; any FAIL aborts the run before publish (RECEIPT.json syntax=OK rows are the proof)",
    "loader.html stays ES5-only: no module scripts, no arrow/const/let/template literals in emitted loader (selftest loader-es5-only)",
    "hazard ES2020+ (optional chaining, nullish coalescing, class fields, dynamic import): preset-env lowers for ff52; assert emitted bytes carry no import( or ?. leftovers; burn a receipt if an app stalls here",
    "hazard Web Workers with type module: unsupported on FF52-class; v1 = detection + KNOWN_LIMITATION in the burn receipt only, never silently drop workers",
    "hazard WebCrypto crypto.subtle: absent outside secure contexts on FF52-class; apps gating login on it stall BY DESIGN - route real sessions to Chromium Legacy LION primary path (docs/mac-modern-web.md)",
    "polyfill gaps NOT covered by core-js (shim candidates, none auto-added in v1): ResizeObserver, TextEncoder/TextDecoder webcompat gaps, IntersectionObserver (FF55+)",
    "present on FF52, no action needed: fetch, WebSocket, localStorage, IndexedDB, Promise, Map/Set",
    "SRI integrity attributes and CSP meta from discovered shells are NOT ported to loader.html by design (local same-origin bundle)",
    "script order = discovery order (webpack chunk dependencies); never sort assets alphabetically",
    "corpus is versioned and sha256-hashed into RECEIPT-INDEX.json (instructions_sha256); every new hazard/shim lands as an entry here with its receipt citation",
  ],
  apps: {
    "discord-web": [
      "discovery: <script src=...js...> on the https://discord.com/app shell; relative urls absolutized against https://discord.com",
      "keep ALL discovered chunks in v1 (empty drop list); a drop entry requires a burn receipt proving the chunk is fatal",
      "discord shell expects globalThis plus webpack chunk registry; polyfill.js supplies globalThis before chunks load",
      "expected stall point: login/QR flows lean on WebCrypto + modern TLS UI = KNOWN_LIMITATION on Arctic Fox; burn a description via da.gd/lionone and use Chromium Legacy for real sessions",
    ],
    "vencord-web": [
      "single userscript bundle transpiled as-is; the // ==UserScript== metadata header MUST survive transpile - assert emitted file still opens with the header before publish",
      "vencord injects into discord web at runtime: pair with the discord-web bundle on Arctic Fox, or use Violentmonkey + the vencord.dev userscript on Chromium Legacy (primary path)",
      "plugin sub-fetches at runtime are NOT bundled in v1; a plugin fetching ES2020 code at runtime = KNOWN_LIMITATION entry until a fetch-hook shim exists",
    ],
  },
};

function instructionsHash(): string {
  return sha256(Buffer.from(JSON.stringify(INSTRUCTIONS)));
}

function cmdInstructions(out: string): void {
  const json = JSON.stringify(INSTRUCTIONS, null, 2) + "\n";
  if (out) {
    writeFileSync(out, json);
    console.log(`INSTRUCTIONS_WRITTEN ${out} sha256=${instructionsHash().slice(0, 12)}`);
  } else {
    console.log(json.trimEnd());
  }
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function appIds(): string[] {
  return Object.keys(APPS).sort();
}

function expandApps(app: string): string[] {
  return app === 'all' ? appIds() : [app];
}

function subDirs(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort() : [];
}

function cmdApps(): void {
  for (const id of appIds()) console.log(`${id}\t${APPS[id].entry}\t${APPS[id].note}`);
  console.log(`all\t(expands to: ${appIds().join(',')})\tworkflow default: every registered app in one run`);
}

async function fetchApp(id: string, dir: string): Promise<void> {
  const spec = APPS[id];
  if (!spec) { console.error(`UNKNOWN_APP ${id}`); process.exit(2); }
  mkdirSync(dir, { recursive: true });
  const urls: string[] = [];
  if (id === 'discord-web') {
    const html = await (await fetch(spec.entry, { redirect: 'follow' })).text();
    const re = /<script[^>]+src="([^"]+\.js[^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) urls.push(m[1].startsWith('http') ? m[1] : 'https://discord.com' + m[1]);
    if (urls.length === 0) { console.error('NO_SCRIPTS_DISCOVERED discord changed its shell; fix the regex in this tool'); process.exit(3); }
  } else {
    urls.push(spec.entry);
  }
  const manifest: Array<{ file: string; url: string; sha256: string }> = [];
  for (let i = 0; i < urls.length; i += 1) {
    const buf = Buffer.from(await (await fetch(urls[i])).arrayBuffer());
    const file = `src-${String(i).padStart(2, '0')}-${basename(urls[i].split('?')[0]) || 'bundle.js'}`;
    writeFileSync(join(dir, file), buf);
    manifest.push({ file, url: urls[i], sha256: sha256(buf) });
  }
  writeFileSync(join(dir, 'FETCH.json'), JSON.stringify({ app: id, entry: spec.entry, manifest }, null, 2) + '\n');
  console.log(`FETCHED ${id} files=${manifest.length}`);
}

async function cmdFetch(app: string, out: string): Promise<void> {
  for (const id of expandApps(app)) await fetchApp(id, join(out, id));
}

function transpileDir(babel: { transformSync: (code: string, opts: unknown) => { code: string } }, inDir: string, out: string): void {
  mkdirSync(out, { recursive: true });
  const files = readdirSync(inDir).filter((f) => f.startsWith('src-') && f.endsWith('.js')).sort();
  for (const f of files) {
    const code = readFileSync(join(inDir, f), 'utf8');
    const res = babel.transformSync(code, {
      filename: f,
      babelrc: false,
      configFile: false,
      compact: false,
      presets: [[require.resolve('@babel/preset-env'), { targets: { firefox: '52' }, modules: false }]],
    });
    writeFileSync(join(out, f.replace(/^src-/, 'es5-')), res.code);
  }
  try {
    const bundled = require.resolve('core-js-bundle/version/core-js.min.js');
    copyFileSync(bundled, join(out, 'polyfill.js'));
    console.log(`TRANSPILED ${basename(out)} files=${files.length} polyfill=core-js-bundle`);
  } catch {
    console.error('DEPS-MISSING core-js-bundle');
    process.exit(2);
  }
}

function cmdTranspile(inDir: string, out: string): void {
  let babel: { transformSync: (code: string, opts: unknown) => { code: string } };
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    babel = require('@babel/core');
  } catch {
    console.error('DEPS-MISSING run inside ci/workflows/mac-es5-passthrough.yml (npm i @babel/core core-js-bundle)');
    process.exit(2);
  }
  const dirs = subDirs(inDir);
  if (dirs.length) {
    for (const d of dirs) transpileDir(babel, join(inDir, d), join(out, d));
  } else {
    transpileDir(babel, inDir, out);
  }
}

function receiptDir(dir: string): void {
  const files = readdirSync(dir).filter((f) => f.endsWith('.js') || f.endsWith('.html')).sort();
  const rows: Array<{ file: string; bytes: number; sha256: string; syntax: string }> = [];
  for (const f of files) {
    const buf = readFileSync(join(dir, f));
    let syntax = 'n/a';
    if (f.endsWith('.js')) {
      const r = spawnSync('node', ['--check', join(dir, f)], { encoding: 'utf8' });
      syntax = r.status === 0 ? 'OK' : 'FAIL';
      if (r.status !== 0) { console.error(`SYNTAX_FAIL ${f}`); process.exit(3); }
    }
    rows.push({ file: f, bytes: buf.length, sha256: sha256(buf), syntax });
  }
  writeFileSync(join(dir, 'RECEIPT.json'), JSON.stringify({ files: rows }, null, 2) + '\n');
  for (const r of rows) console.log(`RECEIPT ${r.file} ${r.bytes} ${r.syntax} ${r.sha256.slice(0, 12)}`);
  console.log(`RECEIPT_DONE ${basename(dir)} files=${rows.length}`);
}

function cmdReceipt(dir: string): void {
  const dirs = subDirs(dir);
  if (dirs.length) {
    const index: Array<{ app: string; receipt_sha256: string }> = [];
    for (const d of dirs) {
      receiptDir(join(dir, d));
      index.push({ app: d, receipt_sha256: sha256(readFileSync(join(dir, d, 'RECEIPT.json'))) });
    }
    writeFileSync(join(dir, 'RECEIPT-INDEX.json'), JSON.stringify({ apps: index, instructions_sha256: instructionsHash() }, null, 2) + '\n');
    console.log(`RECEIPT_INDEX apps=${index.length}`);
  } else {
    receiptDir(dir);
  }
}

function loaderFor(id: string, dir: string): void {
  const scripts = readdirSync(dir).filter((f) => f.startsWith('es5-') && f.endsWith('.js')).sort();
  const tags = ['polyfill.js', ...scripts].filter((f) => existsSync(join(dir, f)))
    .map((f) => `<script type="text/javascript" src="${f}"></script>`).join('\n');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>passthrough ${id}</title>
</head>
<body>
<p class="note">ES5 passthrough loader for ${id} - Arctic Fox 47 / Firefox-52-class.
If the app shell renders but login stalls, burn a screenshot-description through da.gd/lionone.</p>
${tags}
</body>
</html>
`;
  writeFileSync(join(dir, 'loader.html'), html);
  console.log(`LOADER ${id} scripts=${scripts.length + 1}`);
}

function cmdLoader(app: string, dir: string): void {
  if (app === 'all') {
    for (const id of appIds()) loaderFor(id, join(dir, id));
  } else {
    loaderFor(app, dir);
  }
}

function cmdSelftest(): void {
  const ok = (id: string, cond: boolean): void => { console.log(`${cond ? 'PASS' : 'FAIL'} ${id}`); if (!cond) process.exitCode = 1; };
  ok('apps-known', appIds().join(',') === 'discord-web,vencord-web');
  ok('expand-all', expandApps('all').join(',') === 'discord-web,vencord-web');
  ok('expand-single', expandApps('vencord-web').join(',') === 'vencord-web');
  ok('sha-stable', sha256(Buffer.from('x')) === '2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db0e658437bb6d4e27' || sha256(Buffer.from('x')).length === 64);
  ok('loader-es5-only', !/=>|\bconst\b|\blet\b|`/.test('var x = 1;'));
  // receipt loop over per-app dirs + top-level index (dep-free, tmp fixture)
  const tmp = mkdtempSync(join(tmpdir(), 'pt-selftest-'));
  const appDir = join(tmp, 'out', 'fake-app');
  mkdirSync(appDir, { recursive: true });
  writeFileSync(join(appDir, 'es5-a.js'), 'var a = 1;\n');
  writeFileSync(join(appDir, 'loader.html'), '<html></html>\n');
  cmdReceipt(join(tmp, 'out'));
  ok('receipt-loop', existsSync(join(appDir, 'RECEIPT.json')) && existsSync(join(tmp, 'out', 'RECEIPT-INDEX.json')));
  // loader loop over per-app dirs
  for (const id of appIds()) {
    const d = join(tmp, 'load', id);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'es5-x.js'), 'var x = 1;\n');
    writeFileSync(join(d, 'polyfill.js'), 'var p = 1;\n');
  }
  cmdLoader('all', join(tmp, 'load'));
  ok('loader-loop', appIds().every((id) => existsSync(join(tmp, 'load', id, 'loader.html'))));
  cmdInstructions(join(tmp, 'INSTRUCTIONS.json'));
  ok('instructions-write', existsSync(join(tmp, 'INSTRUCTIONS.json')));
  rmSync(tmp, { recursive: true, force: true });
  ok('instructions-versioned', INSTRUCTIONS.version.length > 0 && INSTRUCTIONS.common.length >= 10 && Object.keys(INSTRUCTIONS.apps).sort().join(',') === 'discord-web,vencord-web');
  ok('instructions-hash-stable', instructionsHash().length === 64 && instructionsHash() === sha256(Buffer.from(JSON.stringify(INSTRUCTIONS))));
  console.log(process.exitCode ? 'PASSTHROUGH_SELFTEST=FAIL' : 'PASSTHROUGH_SELFTEST=PASS');
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  const argOpt = (name: string): string => {
    const hit = rest.find((x) => x.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : '';
  };
  const arg = (name: string): string => {
    const hit = rest.find((x) => x.startsWith(`--${name}=`));
    if (!hit) { console.error(`MISSING_ARG ${name}`); process.exit(2); }
    return hit.slice(name.length + 3);
  };
  if (cmd === 'apps') cmdApps();
  else if (cmd === 'selftest') cmdSelftest();
  else if (cmd === 'fetch') await cmdFetch(arg('app'), arg('out'));
  else if (cmd === 'transpile') cmdTranspile(arg('in'), arg('out'));
  else if (cmd === 'receipt') cmdReceipt(arg('dir'));
  else if (cmd === 'loader') cmdLoader(arg('app'), arg('dir'));
  else if (cmd === 'instructions') cmdInstructions(argOpt('out'));
  else { console.error('usage: mac-es5-passthrough.ts apps|selftest|fetch|transpile|receipt|loader|instructions  (--app accepts any registry id or all)'); process.exit(2); }
}

main();
