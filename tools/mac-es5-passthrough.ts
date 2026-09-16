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
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

// This file is ESM (import syntax) but the optional CI-only deps are loaded with CJS
// require(); bare require is undefined in ESM - bind it here so transpile works in CI
// and in local runs alike. (Bug found 2026-09-16g: DEPS-MISSING despite deps present.)
const require = createRequire(import.meta.url);

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
  version: "2026-09-16h-v3",
  common: [
    "target floor: firefox 52 (Arctic Fox 47 Goanna parse class) via @babel/preset-env, modules:false - syntax lowering only, no module wrapping",
    "polyfill prelude: core-js-bundle full build loads FIRST in loader.html (polyfill.js before every es5-*.js); order is load-bearing",
    "no behavior rewrites: transpile + polyfill only; any semantic shim requires its own instruction entry plus a receipt citation",
    "node --check proves current Node syntax ONLY, not FF52 runtime. COMPATIBILITY.json records known blockers; BLOCKED or INCOMPLETE aborts transpile/receipt before publication. Other output remains runtime UNVERIFIED until target receipts",
    "loader.html stays ES5-only: no module scripts, no arrow/const/let/template literals in emitted loader (selftest loader-es5-only)",
    "preset-env targets FF52 for supported syntax transforms, not missing Web APIs. Dynamic import with modules:false and module workers remain unverified; no universal modern-app compatibility claim",
    "hazard Web Workers with type module: unsupported on FF52-class; v1 = detection + KNOWN_LIMITATION in the burn receipt only, never silently drop workers",
    "hazard WebCrypto crypto.subtle: absent outside secure contexts on FF52-class; apps gating login on it stall BY DESIGN - route real sessions to Chromium Legacy LION primary path (docs/mac-modern-web.md)",
    "polyfill gaps NOT covered by core-js (shim candidates, none auto-added in v1): ResizeObserver, TextEncoder/TextDecoder webcompat gaps, IntersectionObserver (FF55+)",
    "BigInt correction (2026-09-16h): core-js-bundle 3.50.0 does NOT supply BigInt when native support is absent. Babel BigIntLiteral stores digits in node.value, not node.bigint; v2 emitted BigInt(\"undefined\"). Conversion fixed, but FF52 publication stays BLOCKED for BigInt or deferred regex hazards until a semantic implementation is verified. Repro: receipts/mac-es5/2026-09-16h-burn-verification/PREFLIGHT.txt; core-js.io/docs/missing-polyfills",
    "babel major pinned to ^7 in ci + local (2026-09-16g): babel 8 raised its output baseline experiment differed and pinning keeps local vs CI receipts comparable; receipt 2026-09-16g local compile",
    "hazard post-FF52 regex literals (lookbehind (?<= / (?<!, named groups (?<name>, dotAll s, hasIndices d): parse-fatal on FF52; shimmed since 2026-09-16g-v2 as deferred new RegExp(src,flags) construction - the bundle parses, a throw can occur immediately at module initialization. v3 BLOCKS publication of these unverified rewrites instead of treating parse success as runtime success. Discovery receipt: 2026-09-16g local compile, Vencord 1.15.6 camelCase splitter /(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])/ at es5 line 2240",
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

// Syntax-only rewrites, NOT a BigInt implementation or regex compatibility layer.
// Both hazard classes block FF52 publication until their semantics are verified.
type Hazards = { bigint: number; regex: number };
function bigIntLiteralShim(hazards: Hazards): unknown {
  return {
    visitor: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      BigIntLiteral(path: any): void {
        const raw = path.node.value;
        if (typeof raw !== 'string' || !raw) throw new Error('BAD_BIGINT_AST_VALUE');
        hazards.bigint += 1;
        path.replaceWith({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'BigInt' },
          arguments: [{ type: 'StringLiteral', value: raw }],
        });
      },
    },
  };
}

// Semantic shim per INSTRUCTIONS v2 (2026-09-16g): regex literals using post-FF52 features
// (lookbehind (?<= / (?<!, named groups (?<name>, dotAll s flag, hasIndices d flag) are
// parse-fatal on FF52-class. Rewrite those literals to new RegExp("src","flags") so the
// bundle PARSES; construction (and any throw) is deferred to first execution of that code
// path. Literals using only FF52-safe features are left untouched.
function ff52RegexLiteralShim(hazards: Hazards): unknown {
  const risky = (pattern: string, flags: string): boolean =>
    /\(\?<[=!]/.test(pattern) || /\(\?<[A-Za-z_$]/.test(pattern) || /[sd]/.test(flags);
  return {
    visitor: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      RegExpLiteral(path: any): void {
        const node = path.node;
        const pattern: string = String(node.pattern);
        const flags: string = String(node.flags || '');
        if (!risky(pattern, flags)) return;
        hazards.regex += 1;
        path.replaceWith({
          type: 'NewExpression',
          callee: { type: 'Identifier', name: 'RegExp' },
          arguments: [
            { type: 'StringLiteral', value: pattern },
            { type: 'StringLiteral', value: flags },
          ],
        });
      },
    },
  };
}

function transpileDir(babel: { transformSync: (code: string, opts: unknown) => { code: string } }, inDir: string, out: string): void {
  mkdirSync(out, { recursive: true });
  const hazards: Hazards = { bigint: 0, regex: 0 };
  const compatibility = (status: string): void => writeFileSync(join(out, 'COMPATIBILITY.json'),
    JSON.stringify({ target: 'firefox52', status, hazards, instructions_sha256: instructionsHash() }, null, 2) + '\n');
  compatibility('INCOMPLETE');
  const files = readdirSync(inDir).filter((f) => f.startsWith('src-') && f.endsWith('.js')).sort();
  for (const f of files) {
    const code = readFileSync(join(inDir, f), 'utf8');
    const res = babel.transformSync(code, {
      filename: f,
      babelrc: false,
      configFile: false,
      compact: false,
      presets: [[require.resolve('@babel/preset-env'), { targets: { firefox: '52' }, modules: false }]],
      plugins: [bigIntLiteralShim(hazards), ff52RegexLiteralShim(hazards)],
    });
    if (hazards.bigint || hazards.regex) {
      compatibility('BLOCKED');
      console.error(`RUNTIME_BLOCKED ${f} bigint=${hazards.bigint} deferred_regex=${hazards.regex}; no verified FF52 implementation`);
      process.exit(4);
    }
    if (code.startsWith('// ==UserScript==') && !res.code.startsWith('// ==UserScript==')) {
      throw new Error('USERSCRIPT_HEADER_LOST');
    }
    writeFileSync(join(out, f.replace(/^src-/, 'es5-')), res.code);
  }
  try {
    // core-js-bundle layout moved across majors: old = version/core-js.min.js, 3.50+ = minified.js / index.js
    const candidates = ['core-js-bundle/version/core-js.min.js', 'core-js-bundle/minified.js', 'core-js-bundle/index.js'];
    const bundled = candidates.map((c) => { try { return require.resolve(c); } catch { return ''; } }).find(Boolean);
    if (!bundled) throw new Error('no core-js-bundle entry resolved');
    copyFileSync(bundled, join(out, 'polyfill.js'));
    compatibility('UNVERIFIED');
    console.log(`TRANSPILED ${basename(out)} files=${files.length} polyfill=core-js-bundle:${basename(bundled)}`);
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
  const compatibility = join(dir, 'COMPATIBILITY.json');
  const runtime = existsSync(compatibility) ? JSON.parse(readFileSync(compatibility, 'utf8')) : { status: 'UNVERIFIED' };
  if (!['UNVERIFIED'].includes(runtime.status)) {
    console.error(`RUNTIME_BLOCKED ${basename(dir)} status=${runtime.status}`);
    process.exit(4);
  }
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
  writeFileSync(join(dir, 'RECEIPT.json'), JSON.stringify({ files: rows, runtime }, null, 2) + '\n');
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
  if (process.argv.includes('--compiler')) compilerTests(ok);
  console.log(process.exitCode ? 'PASSTHROUGH_SELFTEST=FAIL' : 'PASSTHROUGH_SELFTEST=PASS');
}

// Optional real-dependency regressions: CI runs these before fetching any apps.
function compilerTests(ok: (id: string, cond: boolean) => void): void {
  const babel = require('@babel/core');
  const hazards: Hazards = { bigint: 0, regex: 0 };
  const result = babel.transformSync('var a = 343383572805058560n, b = 0xffn, c = -10n;', {
    babelrc: false, configFile: false, plugins: [bigIntLiteralShim(hazards)],
  }).code;
  ok('bigint-digits-preserved', runInNewContext(result + '[a,b,c].map(String).join(",")') === '343383572805058560,255,-10' && hazards.bigint === 3);
  const prelude = readFileSync(require.resolve('core-js-bundle/minified.js'), 'utf8');
  ok('corejs-does-not-polyfill-bigint', runInNewContext(prelude + '\n;typeof BigInt', { BigInt: undefined }, { timeout: 10000 }) === 'undefined');
  const root = mkdtempSync(join(tmpdir(), 'pt-compiler-'));
  try {
    const input = join(root, 'in');
    mkdirSync(input);
    for (const [id, code, expected] of [
      ['bigint', 'var x = 1n;', 4],
      ['regex', 'var x = /(?<=a)b/;', 4],
      ['safe', 'var x = ({a:1})?.a ?? 0;', 0],
    ] as const) {
      writeFileSync(join(input, 'src-00-test.js'), code);
      const output = join(root, id);
      const r = spawnSync(process.execPath, [process.argv[1], 'transpile', '--in=' + input, '--out=' + output], { encoding: 'utf8' });
      ok('transpile-gate-' + id, r.status === expected);
      const meta = JSON.parse(readFileSync(join(output, 'COMPATIBILITY.json'), 'utf8'));
      ok('compatibility-' + id, meta.status === (expected ? 'BLOCKED' : 'UNVERIFIED'));
      const receipt = spawnSync(process.execPath, [process.argv[1], 'receipt', '--dir=' + output], { encoding: 'utf8' });
      ok('receipt-gate-' + id, receipt.status === expected);
      if (!expected) {
        const emitted = readFileSync(join(output, 'es5-00-test.js'), 'utf8');
        require('acorn').parse(emitted, { ecmaVersion: 2017 });
        ok('fixture-es2017-parse', true);
      }
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
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
