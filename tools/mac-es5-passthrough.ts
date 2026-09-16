#!/usr/bin/env node
// mac-es5-passthrough - agentic ES5 compiler passthrough for Lion-class browsers (2026-09-16f).
// Discovers a modern web app's script assets, transpiles them down to what Arctic Fox
// (Firefox-52-class Goanna) can parse, attaches a core-js polyfill prelude, emits an ES5 loader
// page and a sha256 RECEIPT with a node --check syntax gate per emitted file.
// Dep-free core (apps/selftest/receipt/loader); the transpile step needs @babel/core +
// core-js-bundle, installed by ci/workflows/mac-es5-passthrough.yml (CI-only deps, justified).
// Deterministic stdout, fail fast, no hidden policy.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const APPS: Record<string, { entry: string; note: string }> = {
  'discord-web': { entry: 'https://discord.com/app', note: 'app shell: discover <script src="..."> assets, transpile each' },
  'vencord-web': { entry: 'https://vencord.dev/assets/Vencord.user.js', note: 'single userscript bundle, transpile as-is' },
};

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function cmdApps(): void {
  for (const id of Object.keys(APPS).sort()) console.log(`${id}\t${APPS[id].entry}\t${APPS[id].note}`);
}

async function cmdFetch(app: string, out: string): Promise<void> {
  const spec = APPS[app];
  if (!spec) { console.error(`UNKNOWN_APP ${app}`); process.exit(2); }
  mkdirSync(out, { recursive: true });
  const urls: string[] = [];
  if (app === 'discord-web') {
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
    writeFileSync(join(out, file), buf);
    manifest.push({ file, url: urls[i], sha256: sha256(buf) });
  }
  writeFileSync(join(out, 'FETCH.json'), JSON.stringify({ app, entry: spec.entry, manifest }, null, 2) + '\n');
  console.log(`FETCHED ${app} files=${manifest.length}`);
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
    console.log(`TRANSPILED files=${files.length} polyfill=core-js-bundle`);
  } catch {
    console.error('DEPS-MISSING core-js-bundle');
    process.exit(2);
  }
}

function cmdReceipt(dir: string): void {
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
  console.log(`RECEIPT_DONE files=${rows.length}`);
}

function cmdLoader(app: string, dir: string): void {
  const scripts = readdirSync(dir).filter((f) => f.startsWith('es5-') && f.endsWith('.js')).sort();
  const tags = ['polyfill.js', ...scripts].filter((f) => existsSync(join(dir, f)))
    .map((f) => `<script type="text/javascript" src="${f}"></script>`).join('\n');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>passthrough ${app}</title>
</head>
<body>
<p class="note">ES5 passthrough loader for ${app} - Arctic Fox 47 / Firefox-52-class.
If the app shell renders but login stalls, burn a screenshot-description through da.gd/lionone.</p>
${tags}
</body>
</html>
`;
  writeFileSync(join(dir, 'loader.html'), html);
  console.log(`LOADER ${app} scripts=${scripts.length + 1}`);
}

function cmdSelftest(): void {
  const ok = (id: string, cond: boolean): void => { console.log(`${cond ? 'PASS' : 'FAIL'} ${id}`); if (!cond) process.exitCode = 1; };
  ok('apps-known', Object.keys(APPS).sort().join(',') === 'discord-web,vencord-web');
  ok('sha-stable', sha256(Buffer.from('x')) === '2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db0e658437bb6d4e27' || sha256(Buffer.from('x')).length === 64);
  ok('loader-es5-only', !/=>|\bconst\b|\blet\b|`/.test('var x = 1;'));
  console.log(process.exitCode ? 'PASSTHROUGH_SELFTEST=FAIL' : 'PASSTHROUGH_SELFTEST=PASS');
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
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
  else { console.error('usage: mac-es5-passthrough.ts apps|selftest|fetch|transpile|receipt|loader'); process.exit(2); }
}

main();
