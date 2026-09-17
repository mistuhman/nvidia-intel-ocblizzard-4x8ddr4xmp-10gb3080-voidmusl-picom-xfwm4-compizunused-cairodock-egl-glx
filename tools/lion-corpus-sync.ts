#!/usr/bin/env node
/* Keeps the burned context artifact byte-identical to the compiler's instruction corpus.

   Why this exists as a tool and not as a memory: the corpus lives in tools/mac-es5-passthrough.ts, and
   the Lion burn carries a snapshot of it inside lion-compiler-context.command (single-quoted shell
   assignment + a sha256 it checks against itself at run time). Every corpus bump used to require hand
   edits across four files; when one was missed, tools/lion-one-test.ts C2-corpus-source went red and the
   Mac would have burned a stale instruction set. Now: bump the corpus, run sync, the artifact follows.

   usage:
     node tools/lion-corpus-sync.ts verify      # what tools/test-all.ts runs; exits 1 on drift
     node tools/lion-corpus-sync.ts sync [--zip] # rewrite the artifact (and rebuild lion-one.zip)
*/
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const TOOL = 'tools/mac-es5-passthrough.ts';
const CTX = 'lion-compiler-context.command';
const HTML = 'lion-one.html';
const CMD = 'etc/lion-command.txt';
const ZIP = 'lion-one.zip';
const ZIP_ENTRIES = ['lion-compiler-context.command', 'lion-one.command', 'lion-one.html'];

type Corpus = { version: string; sha256: string; compact: string; rev: string };

function corpus(): Corpus {
  // `instructions` prints pretty JSON; the artifact re-serialises what it decoded, so the embedded copy
  // has to be the compact form byte-for-byte or C2-corpus-source's stringify equality cannot hold.
  const pretty = execFileSync(process.execPath, [TOOL, 'instructions'], { encoding: 'utf8' });
  const parsed = JSON.parse(pretty);
  const compact = JSON.stringify(parsed);
  return {
    version: String(parsed.version),
    sha256: createHash('sha256').update(Buffer.from(compact)).digest('hex'),
    compact,
    rev: /-v(\d+)$/.exec(String(parsed.version)) ? 'v' + /-v(\d+)$/.exec(String(parsed.version))![1] : String(parsed.version),
  };
}

/* The corpus is carried in a shell single-quoted assignment. Apostrophes inside the JSON (plenty of them:
   "compat layer's", BigInt('undefined')) would end the quote, so each one becomes the '\'' splice. The
   decoded value is what the artifact hashes, so escaping does not move the sha. */
const toShell = (s: string): string => s.split("'").join(`'\\''`);
const fromShell = (s: string): string => s.split(`'\\''`).join("'");

function readShellCorpus(text: string): string | null {
  /* dot, not [\s\S]: the corpus is one long line, and a greedy newline-crossing match runs to the last
  ** quote in the FILE and decodes to something else - indistinguishable from a stale artifact. */
  const m = /^CORPUS='(.*)'$/m.exec(text);
  return m ? fromShell(m[1]) : null;
}

function sub(text: string, re: RegExp, to: string, where: string, errors: string[]): string {
  if (!re.test(text)) { errors.push(`${where}: pattern not found (${re})`); return text; }
  return text.replace(re, to);
}

function expectedLines(c: Corpus): [string, string] {
  return [`CORPUS_SHA_EXPECTED="${c.sha256}"`, `CORPUS='${toShell(c.compact)}'`];
}

function verify(c: Corpus): number {
  const problems: string[] = [];
  const ctx = readFileSync(CTX, 'utf8');
  const lines = ctx.split('\n');
  const shaIdx = lines.findIndex((l) => l.startsWith('CORPUS_SHA_EXPECTED='));
  const corpusIdx = lines.findIndex((l) => l.startsWith("CORPUS='"));
  if (shaIdx < 0 || corpusIdx < 0) { console.log('CORPUS_SYNC=FAIL embedded corpus block missing'); return 1; }
  if (lines[shaIdx] !== expectedLines(c)[0]) problems.push('CORPUS_SHA_EXPECTED is not the corpus sha');
  const embedded = readShellCorpus(ctx);
  if (embedded === null) problems.push('CORPUS line could not be decoded');
  else if (embedded !== c.compact) problems.push('embedded corpus differs from the compiler corpus');
  if (!ctx.includes(`(corpus ${c.version})`)) problems.push(`${CTX} header does not name corpus ${c.version}`);
  if (!ctx.includes(`CORPUS_VERSION=${c.version}`)) problems.push(`${CTX} echoes a stale CORPUS_VERSION`);
  for (const [f, re] of [[HTML, new RegExp(`carry ${c.rev} ${c.sha256.slice(0, 12)}`)], [CMD, new RegExp(`carry ${c.rev} ${c.sha256.slice(0, 12)}`)]] as Array<[string, RegExp]>) {
    if (existsSync(f) && !re.test(readFileSync(f, 'utf8'))) problems.push(`${f} still points at an older corpus snapshot`);
  }
  if (existsSync(ZIP)) {
    for (const entry of ZIP_ENTRIES) {
      let inZip = '';
      try { inZip = execFileSync('unzip', ['-p', ZIP, entry], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch { problems.push(`${ZIP}: ${entry} missing`); continue; }
      const onDisk = readFileSync(entry, 'utf8');
      if (inZip !== onDisk) problems.push(`${ZIP}: ${entry} differs from the working file (rebuild with: node tools/lion-corpus-sync.ts sync --zip)`);
    }
  }
  if (problems.length) {
    for (const p of problems) console.log('CORPUS_DRIFT ' + p);
    console.log(`CORPUS_SYNC=FAIL compiler=${c.version} ${c.sha256.slice(0, 12)}`);
    return 1;
  }
  console.log(`CORPUS_SYNC=PASS corpus=${c.version} sha=${c.sha256.slice(0, 12)}${existsSync(ZIP) ? ' zip-in-step' : ' (no zip present)'}`);
  return 0;
}

function sync(c: Corpus, withZip: boolean): number {
  const problems: string[] = [];
  const [shaLine, corpusLine] = expectedLines(c);
  const ctx = readFileSync(CTX, 'utf8');
  const lines = ctx.split('\n');
  const shaIdx = lines.findIndex((l) => l.startsWith('CORPUS_SHA_EXPECTED='));
  const corpusIdx = lines.findIndex((l) => l.startsWith("CORPUS='"));
  if (shaIdx < 0 || corpusIdx < 0) { console.log('CORPUS_SYNC=FAIL embedded corpus block missing'); return 1; }
  lines[shaIdx] = shaLine;
  lines[corpusIdx] = corpusLine;
  let text = lines.join('\n');
  text = sub(text, /\(corpus [^\)]*\)/, `(corpus ${c.version})`, `${CTX} header`, problems);
  text = sub(text, /CORPUS_VERSION=[0-9][^\s"']*/, `CORPUS_VERSION=${c.version}`, `${CTX} echo`, problems);
  if (problems.length) { for (const p of problems) console.log('CORPUS_SYNC=SKIP ' + p); }
  writeFileSync(CTX, text);
  /* the page and the inbound command channel quote the corpus snapshot they were built with: same version
     token, same 12-hex prefix, or a Mac that re-reads them cannot tell a fresh artifact from a stale one */
  for (const f of [HTML, CMD]) {
    if (!existsSync(f)) continue;
    let t2 = readFileSync(f, 'utf8');
    const re = new RegExp(`carry v\\d+ [0-9a-f]{12}(?= and explicitly report this HOLD)`);
    if (!re.test(t2)) { console.log(`CORPUS_SYNC=SKIP ${f}: no corpus snapshot line to refresh`); continue; }
    t2 = t2.replace(re, `carry ${c.rev} ${c.sha256.slice(0, 12)}`);
    writeFileSync(f, t2);
    console.log(`REFRESHED ${f} -> ${c.rev} ${c.sha256.slice(0, 12)}`);
  }
  if (withZip) {
    /* rebuild from nothing: zip updates entries in place and carries over the stored mode bits, so an
    ** in-place refresh is how an artifact ends up without its exec bit on the Mac */
    if (existsSync(ZIP)) rmSync(ZIP);
    execFileSync('zip', ['-X', ZIP, ...ZIP_ENTRIES], { stdio: 'inherit' });
    console.log('ZIPPED ' + ZIP);
  }
  return verify(c);
}

const mode = process.argv[2] === 'sync' ? 'sync' : 'verify';
const c = corpus();
const rc = mode === 'sync' ? sync(c, process.argv.indexOf('--zip') >= 0) : verify(c);
console.log(`CORPUS_VERSION=${c.version}`);
console.log(`CORPUS_SHA256=${c.sha256}`);
process.exit(rc);
