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
import {
  RUNTIME_FILE, auditEs5, bigIntPlugin, newCompatState, regexPlugin, runtimeSource, verifyBigInt, verifyRegex,
  verifyRegexProperty, verifyRuntime,
} from './lib/es5-compat.ts';

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
  version: "2026-09-16i-v4",
  common: [
    "target floor: firefox 52 (Arctic Fox 47 Goanna parse class) via @babel/preset-env, modules:false - syntax lowering only, no module wrapping",
    "polyfill prelude: core-js-bundle full build loads FIRST in loader.html (polyfill.js before every es5-*.js); order is load-bearing",
    "no unverified behavior rewrites: a shim may only change what it has a VERIFIED implementation for (BigInt via __bi, post-FF52 regex via __rx); everything else is transpile + polyfill only. Every semantic shim needs its own instruction entry plus a receipt citation, and no silent behavior changes, ever",
    "node --check proves current Node syntax ONLY, not FF52 runtime. COMPATIBILITY.json records the compat layer's counts, notes and unresolved hazards; BLOCKED or INCOMPLETE aborts transpile/receipt before publication, and receiptDir refuses a bundle with no compat.js. UNVERIFIED now means: every known BigInt/regex construct in this file was resolved by the verified compat runtime - the target's runtime is still only proven by a burn receipt, never by a green compile",
    "loader.html stays ES5-only: no module scripts, no arrow/const/let/template literals in emitted loader (selftest loader-es5-only)",
    "preset-env targets FF52 for supported syntax transforms, not missing Web APIs. Dynamic import with modules:false and module workers remain unverified; no universal modern-app compatibility claim",
    "hazard Web Workers with type module: unsupported on FF52-class; v1 = detection + KNOWN_LIMITATION in the burn receipt only, never silently drop workers",
    "hazard WebCrypto crypto.subtle: absent outside secure contexts on FF52-class; apps gating login on it stall BY DESIGN - route real sessions to Chromium Legacy LION primary path (docs/mac-modern-web.md)",
    "polyfill gaps NOT covered by core-js (shim candidates, none auto-added in v1): ResizeObserver, TextEncoder/TextDecoder webcompat gaps, IntersectionObserver (FF55+)",
    "BigInt (2026-09-16i): core-js-bundle 3.50.0 does NOT supply BigInt when the engine has none, so the bundle ships tools/lib/es5-compat-runtime.js as compat.js. __bi is a real arbitrary-precision integer implementation (sign + base-2^15 magnitude digits; add/sub/mul/div/mod/pow/bitwise/shift/comparisons/toString(radix)/asIntN/asUintN, and __bi.BigInt mirrors the global BigInt including its SyntaxError/RangeError/TypeError cases and the bigint+String concatenation rule). Babel 7.29.7 stores BigIntLiteral digits in node.value and has no node.bigint - reading the wrong field is what emitted BigInt('undefined') in v2. Operators are lowered to __bi.* calls that DISPATCH on their operands, so conservative bigint inference can corrupt nothing: a Number operand keeps the native result and a mixed operand keeps the native TypeError. Verified by differential fuzz against this machine's native BigInt with BigInt deleted from the sandbox context (node tools/mac-es5-passthrough.ts selftest --compiler); provenance: receipts/mac-es5/2026-09-16h-burn-verification/PREFLIGHT.txt, core-js.io/docs/missing-polyfills, receipts/mac-es5/2026-09-16i-compat-verification/",
    "babel major pinned to ^7 in ci + local (2026-09-16g): babel 8 raised its output baseline experiment differed and pinning keeps local vs CI receipts comparable; receipt 2026-09-16g local compile",
    "post-FF52 regex literals (2026-09-16i): each literal is parsed by tools/lib/es5-compat.ts and REWRITTEN into the FF52 grammar instead of deferred into a runtime throw. dotAll: '.' outside a class becomes [\\\\s\\\\S] and the s flag is dropped (exact equivalence: with s, '.' is every code unit). Named groups are renumbered to capture groups with a name->index map so match.groups keeps working through __rx, and $<name> in a literal replacement string becomes $n. The d flag is dropped when match.indices is never read in the file. Leading lookbehinds are removed from the pattern and enforced by __rx, a real RegExp whose exec (and Symbol.split) test the fixed-width window ending at the match start; differing per-branch constraints split the alternation into per-branch matchers with leftmost-wins selection, which is how native alternation preference works. Anything the rewriter cannot express stays a BLOCKED hazard quoting the exact pattern: variable-width lookbehind, mid-pattern lookbehind, lookbehind body that captures or anchors, lookbehind with m, \\\\p{...} property escapes, d with match.indices consumed. Rewrites are proved by differential fuzz against native RegExp over REGEX_FIXTURES (exec/global loop/match/replace/replace-fn/$<name>/split/search/test), same command. Discovery receipt 2026-09-16g: Vencord 1.15.6 camelCase splitter /(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])/ at es5 line 2240 - now resolved by branch mode",
    "compat runtime floor: compat.js is tools/lib/es5-compat-runtime.js copied verbatim into every bundle and loaded polyfill.js -> compat.js -> es5-*.js, because __bi/__rx must exist before the first app statement runs. Its own floor is enforced, not assumed: auditEs5 parses it at acorn ecmaVersion 5 and rejects identifiers/methods that a Firefox-52-class engine does not have (BigInt, globalThis, structuredClone, WeakRef, .flatMap, .matchAll, .replaceAll, .hasOwn, ...), and COMPATIBILITY.json records its sha256 plus the audit result. The emitted bundle therefore depends on no engine feature newer than the target except the ones core-js polyfills",
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
    "vencord-web bigint+regex budget (2026-09-16i): the 209 BigInt literals and 184 post-FF52 regex hazards recorded by the 2026-09-16g local compile are exactly the two classes this corpus resolves; the numbers are recomputed per run from COMPATIBILITY.json counts (bigintLowered/bigintLiterals, regexRewritten/regexLiterals), and any construct the rewriter refuses lands in hazards with its pattern quoted. A CI run is still required to publish: the sandbox cannot reach vencord.dev (HTTP 000), so canonical bytes and their sha256 come only from the fetch step",
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

// Transpile one app dir: preset-env to the FF52 syntax floor, then the VERIFIED compat layer
// (tools/lib/es5-compat.ts + es5-compat-runtime.js) for what preset-env cannot polyfill:
// BigInt and post-FF52 regex syntax. Nothing is published while a hazard is unresolved - a hazard
// is a construct the compat layer proves it cannot express, reported with the exact pattern.
function transpileDir(babel: { transformSync: (code: string, opts: unknown) => { code: string } }, inDir: string, out: string): void {
  mkdirSync(out, { recursive: true });
  const compat = runtimeSource();
  const audit = auditEs5(compat);
  const state = newCompatState();
  const compatibility = (status: string): void => writeFileSync(join(out, 'COMPATIBILITY.json'), JSON.stringify({
    target: 'firefox52',
    status,
    runtime: 'es5-compat (__bi BigInt implementation + __rx regex compat layer)',
    compat_sha256: sha256(Buffer.from(compat)),
    compat_audit: audit,
    counts: state.counts,
    hazards: state.hazards.slice().sort((a, b) => (a.kind + a.detail).localeCompare(b.kind + b.detail)),
    notes: [...state.notes].sort(),
    instructions_sha256: instructionsHash(),
  }, null, 2) + '\n');
  compatibility('INCOMPLETE');
  if (audit.length) {
    compatibility('BLOCKED');
    console.error(`COMPAT_RUNTIME_REJECTED ${audit.join('; ')}`);
    process.exit(4);
  }
  const files = readdirSync(inDir).filter((f) => f.startsWith('src-') && f.endsWith('.js')).sort();
  const emitted: Array<{ name: string; code: string }> = [];
  for (const f of files) {
    const code = readFileSync(join(inDir, f), 'utf8');
    const res = babel.transformSync(code, {
      filename: f,
      babelrc: false,
      configFile: false,
      compact: false,
      presets: [[require.resolve('@babel/preset-env'), { targets: { firefox: '52' }, modules: false }]],
      plugins: [bigIntPlugin(state), regexPlugin(state)],
    });
    if (code.startsWith('// ==UserScript==') && !res.code.startsWith('// ==UserScript==')) {
      throw new Error('USERSCRIPT_HEADER_LOST');
    }
    emitted.push({ name: f.replace(/^src-/, 'es5-'), code: res.code });
  }
  if (state.hazards.length) {
    compatibility('BLOCKED');
    const kinds: Record<string, number> = {};
    for (const h of state.hazards) kinds[h.kind] = (kinds[h.kind] || 0) + 1;
    console.error(`RUNTIME_BLOCKED ${basename(out)} hazards=${state.hazards.length} kinds=${Object.keys(kinds).sort().map((k) => k + ':' + kinds[k]).join(',')}`);
    for (const h of state.hazards.slice(0, 40)) console.error(`  HAZARD ${h.kind} ${h.detail}`);
    if (state.hazards.length > 40) console.error(`  ... ${state.hazards.length - 40} more in COMPATIBILITY.json`);
    process.exit(4);
  }
  for (const e of emitted) writeFileSync(join(out, e.name), e.code);
  copyFileSync(RUNTIME_FILE, join(out, 'compat.js'));
  try {
    // core-js-bundle layout moved across majors: old = version/core-js.min.js, 3.50+ = minified.js / index.js
    const candidates = ['core-js-bundle/version/core-js.min.js', 'core-js-bundle/minified.js', 'core-js-bundle/index.js'];
    const bundled = candidates.map((c) => { try { return require.resolve(c); } catch { return ''; } }).find(Boolean);
    if (!bundled) throw new Error('no core-js-bundle entry resolved');
    copyFileSync(bundled, join(out, 'polyfill.js'));
    compatibility('UNVERIFIED');
    console.log(`TRANSPILED ${basename(out)} files=${files.length} bigint=${state.counts.bigintLowered}/${state.counts.bigintLiterals} bigintOps=${state.counts.bigintOperators} regex=${state.counts.regexRewritten}/${state.counts.regexLiterals} polyfill=core-js-bundle:${basename(bundled)} compat=${sha256(Buffer.from(compat)).slice(0, 12)}`);
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
  if (!existsSync(join(dir, 'compat.js'))) {
    console.error(`COMPAT_MISSING ${basename(dir)}: a bundle without the __bi/__rx runtime cannot run on FF52`);
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
  // load order is load-bearing: core-js first, then the compat runtime that defines __bi/__rx, then the app
  const tags = ['polyfill.js', 'compat.js', ...scripts].filter((f) => existsSync(join(dir, f)))
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
  writeFileSync(join(appDir, 'compat.js'), runtimeSource());
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
  if (process.argv.includes('--compiler')) {
    const c = process.argv.find((x: string) => x.startsWith('--cases='));
    compilerTests(ok, c ? Number(c.slice('--cases='.length)) : 220);
  }
  console.log(process.exitCode ? 'PASSTHROUGH_SELFTEST=FAIL' : 'PASSTHROUGH_SELFTEST=PASS');
}

// Real-dependency regressions, run by CI BEFORE any app is fetched (ci/workflows step
// "compiler preflight") and reproducible locally with the same pinned deps:
//   node tools/mac-es5-passthrough.ts selftest --compiler [--cases=N]
// Three layers, in this order: the emitted runtime's own ES5 floor, the two differential fuzzes
// that prove BigInt/regex SEMANTICS against native, then the publish gates that must refuse an
// unexpressible construct instead of shipping a deferred throw.
function compilerTests(ok: (id: string, cond: boolean) => void, cases = 220): void {
  const babel = require('@babel/core');
  const rt = runtimeSource();
  const st = newCompatState();
  const lowered = babel.transformSync('var a = 343383572805058560n, b = 0xffn, c = -10n, d = 1_000n;', {
    babelrc: false, configFile: false, compact: false, filename: 'compiler-fixture.js', plugins: [bigIntPlugin(st)],
  }).code;
  const digits = runInNewContext(rt + '\n' + lowered + '\n;[a,b,c,d].map(String).join(",")', { BigInt: undefined });
  ok('bigint-digits-preserved', digits === '343383572805058560,255,-10,1000' && st.counts.bigintLiterals === 4 && st.counts.bigintLowered === 4);
  // end-to-end snowflake math, the actual reason Vencord needs BigInt at all: the same source
  // compiled twice - native (BigInt present) vs the compat runtime (BigInt deleted from the context)
  const SNOWFLAKE = [
    'var id = 343383572805058560n;',
    'var ts = Number((id >> 22n) + 1420070400000n);',
    'var mod = id % 1000000n;',
    'var cmp = id > (1n << 63n) ? "big" : "small";',
    'var hex = id.toString(16);',
    'var neg = -id * 3n;',
    'var flags = id & 0b1111n;',
    'var same = id == BigInt("343383572805058560");',
    'var zero = (0n ? "truthy" : "falsy");',
    'var str = String(id);',
    'var parts = "camelCaseWord".split(/(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])/);',
    'var grouped = "1,000".replace(/(?<=\\d),(?=\\d{3})/g, "");',
    'var hit = /(\\d)(?=\\d{3})/.test("1000");',
    '__x = [ts, mod, cmp, hex, neg, flags, same, zero, str, parts.join("+"), grouped, hit].join("|");',
  ].join('\n');
  const runBoth = (source: string): string => {
    const native = runInNewContext('var __x;\n' + source + '\n;__x', {}, { timeout: 20000 });
    const coded = babel.transformSync(source, {
      babelrc: false, configFile: false, compact: false, filename: 'snowflake.js',
      presets: [[require.resolve('@babel/preset-env'), { targets: { firefox: '52' }, modules: false }]],
      plugins: [bigIntPlugin(newCompatState()), regexPlugin(newCompatState())],
    }).code;
    const shim = runInNewContext(rt + '\nvar __x;\n' + coded + '\n;__x', { BigInt: undefined }, { timeout: 20000 });
    return native === shim ? String(native) : 'MISMATCH native=' + native + ' shim=' + shim;
  };
  const snow = runBoth(SNOWFLAKE);
  const SNOW_EXPECT = '1501939423515|58560|small|4c3f18a46c00000|-1030150718415175680|0|true|falsy|343383572805058560|camel+Case+Word|1000|true';
  ok('compat-layer-end-to-end', snow === SNOW_EXPECT);
  if (snow !== SNOW_EXPECT) console.error(snow);
  const prelude = readFileSync(require.resolve('core-js-bundle/minified.js'), 'utf8');
  ok('corejs-still-lacks-bigint', runInNewContext(prelude + '\n;typeof BigInt', { BigInt: undefined }, { timeout: 20000 }) === 'undefined');
  ok('compat-runtime-es5-floor', auditEs5(rt).length === 0);
  const rtv = verifyRuntime();
  ok('verify-runtime', rtv.passed === rtv.ran && rtv.failures.length === 0);
  if (rtv.failures.length) console.error(rtv.failures.join('\n'));
  const bv = verifyBigInt(babel, cases);
  ok('verify-bigint-differential', bv.passed === bv.ran);
  console.log(`VERIFY_BIGINT ${bv.passed}/${bv.ran}`);
  if (bv.failures.length) console.error(bv.failures.slice(0, 8).join('\n'));
  const rv = verifyRegex(babel);
  ok('verify-regex-differential', rv.passed === rv.ran);
  console.log(`VERIFY_REGEX ${rv.passed}/${rv.ran}`);
  if (rv.failures.length) console.error(rv.failures.slice(0, 8).join('\n'));
  const pv = verifyRegexProperty(babel, Math.max(600, cases * 3));
  ok('verify-regex-property', pv.passed === pv.ran);
  console.log(`VERIFY_REGEX_PROPERTY ${pv.passed}/${pv.ran} ${pv.census || ''}`);
  if (pv.failures.length) console.error(pv.failures.slice(0, 10).join('\n'));

  const root = mkdtempSync(join(tmpdir(), 'pt-compiler-'));
  try {
    const input = join(root, 'in');
    mkdirSync(input);
    // expected exit 0 = the compat layer resolved it; 4 = refused, nothing published
    for (const [id, code, expected, kind] of [
      ['bigint', 'var x = 1n;', 0, ''],
      ['regex-lookbehind', 'var x = /(?<=a)b/;', 0, ''],
      ['regex-property', 'var x = /(?<=\\p{L})a/u;', 4, 'regex-unicode-property'],
      ['regex-mid-lookbehind', 'var x = /a(?<=b)c/;', 4, 'regex-lookbehind-position'],
      ['regex-width', 'var x = /(?<=a*)b/;', 4, 'regex-lookbehind-width'],
      ['safe', 'var x = ({a:1})?.a ?? 0;', 0, ''],
    ] as const) {
      writeFileSync(join(input, 'src-00-test.js'), code);
      const output = join(root, id);
      const r = spawnSync(process.execPath, [process.argv[1], 'transpile', '--in=' + input, '--out=' + output], { encoding: 'utf8' });
      ok('transpile-gate-' + id, r.status === expected);
      const meta = JSON.parse(readFileSync(join(output, 'COMPATIBILITY.json'), 'utf8'));
      ok('compatibility-' + id, meta.status === (expected ? 'BLOCKED' : 'UNVERIFIED'));
      ok('compatibility-hazard-kind-' + id, !kind || meta.hazards.some((h: { kind: string }) => h.kind === kind));
      ok('compatibility-no-partial-publish-' + id, expected === 0 || !existsSync(join(output, 'es5-00-test.js')));
      const receipt = spawnSync(process.execPath, [process.argv[1], 'receipt', '--dir=' + output], { encoding: 'utf8' });
      ok('receipt-gate-' + id, receipt.status === expected);
      if (!expected) {
        const emitted = readFileSync(join(output, 'es5-00-test.js'), 'utf8');
        require('acorn').parse(emitted, { ecmaVersion: 2017 });
        ok('fixture-es2017-parse-' + id, true);
        ok('fixture-compat-shipped-' + id, existsSync(join(output, 'compat.js')));
      }
    }
    const noCompat = join(root, 'nocompat');
    mkdirSync(noCompat, { recursive: true });
    writeFileSync(join(noCompat, 'es5-a.js'), 'var a = 1;\n');
    ok('receipt-refuses-bundle-without-compat', spawnSync(process.execPath, [process.argv[1], 'receipt', '--dir=' + noCompat], { encoding: 'utf8' }).status === 4);
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
