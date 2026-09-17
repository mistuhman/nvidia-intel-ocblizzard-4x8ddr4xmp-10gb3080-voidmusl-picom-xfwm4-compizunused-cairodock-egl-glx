#!/usr/bin/env node
// absolution.ts - ONE NAME for the whole Lion clear+harden channel.
//
// Operator directive 2026-09-17: "burn page has to be shortened (no TinyURL), use the typescript
// repo tooling to make it reproducible and persistent on the same link, with clear indication of
// which branch and pr its on, and which rollout it is. one name for the command in this chat, one
// name for it in the page and the log. organized and streamlined. absolution"
//
// THE NAME IS "absolution". It is the same string everywhere, by construction:
//   chat command : absolution
//   download     : absolution.command
//   page         : absolution.html      (short link https://da.gd/absolution)
//   bundle       : absolution.zip
//   log tag      : ABSOLUTION1 ... ABSOLUTION1_DONE
// selftest asserts every one of those derives from the single NAME constant below, so the names
// cannot drift apart in a later edit.
//
// PERSISTENT LINK: https://da.gd/absolution is write-once at da.gd and pinned to this session
// branch. Branch-pinning is safe here because the repo has delete_branch_on_merge=false (verified
// 2026-09-17 via gh api), so the branch - and therefore the link - survives the merge of PR #91.
// Re-running `emit` regenerates byte-identical files, so the same link always serves the current
// rollout without ever minting a second slug.
//
// Channel facts (measured 2026-09-17, not assumed):
//   - curl to da.gd and webhook.site both return HTTP 000 from the sandbox (TLS blocked). The agent
//     mints and reads ONLY with fetch_page. This tool performs no network I/O.
//   - webhook.site stores a text/plain POST body in `content` and GET ?log= in `query.log`; both are
//     agent-readable. Multipart attachments are NOT. So the report travels as text.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { KEEP, APPLE_PREFIX } from './lion-clean-plan.ts';

// ---------------------------------------------------------------- the one name
export const NAME = 'absolution';
export const TAG = `${NAME.toUpperCase()}1`;              // ABSOLUTION1
export const DONE = `${TAG}_DONE No disk was erased.`;
const COMMAND = `${NAME}.command`;
const PAGE = `${NAME}.html`;
const ZIP = `${NAME}.zip`;
const SHORT = `https://da.gd/${NAME}`;

// ---------------------------------------------------------------- rollout identity
// Printed in the chat, stamped into the page, and echoed into the log, so a receipt can always be
// traced back to the exact bytes that produced it.
export const ROLLOUT = 'R1';
const BRANCH = 'arena/01a0ad71-nvidia-intel-ocblizzard-4x8ddr';
const PR = 91;
const SESSION = '01a0ad71';
const WAVE_DATE = '2026-09-17';

const REPO = 'mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx';
const RAW = (f: string) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${f}`;
const PR_URL = `https://github.com/${REPO}/pull/${PR}`;
const PAGE_URL = `https://htmlpreview.github.io/?https://github.com/${REPO}/blob/${BRANCH}/${PAGE}`;

const INBOX_ID = 'a078e138-e87d-4369-9868-0c0c1f3500d6';
const INBOX_POST = `https://webhook.site/${INBOX_ID}`;
const INBOX_READ = `https://webhook.site/token/${INBOX_ID}/requests?limit=5&sorting=newest`;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

// KEEP_CASE is imported from lion-clean-plan.ts so the probe classifier and the sweep block can
// never disagree about what is protected. Form: "Literal"* - quotes around the literal, glob outside.
const KEEP_CASE = KEEP.map((k) => `"${k.prefix}"${k.wild ? '*' : ''}`).sort().join('|');

const STAMP = `${TAG} rollout=${ROLLOUT} branch=${BRANCH} pr=${PR} session=${SESSION} date=${WAVE_DATE}`;

// ---------------------------------------------------------------- absolution.command
function commandScript(): string {
  return `#!/bin/sh
# ${COMMAND} - READ-ONLY context probe for the Lion clear + harden wave (Lion 10.7, double-click).
# Rollout ${ROLLOUT} | branch ${BRANCH} | PR ${PR} | session ${SESSION}
# Writes ONLY ~/Desktop/${NAME}.txt then opens it for the page picker.
# No sudo, no network, no erase, no move, no delete. Every probe is best-effort.
REPORT="$HOME/Desktop/${NAME}.txt"
{
echo "${STAMP}"
echo "date=$(date 2>/dev/null || echo UNKNOWN)"
echo "host=$(hostname 2>/dev/null || echo UNKNOWN)"
echo "user=$(whoami 2>/dev/null || echo UNKNOWN)"
echo "--- boot volume ---"
mount 2>/dev/null | grep ' on / ' || echo "mount UNKNOWN"
df -h / 2>/dev/null || echo "df UNKNOWN"
echo "--- apps: CLASS | size | bundle | name ---"
for a in /Applications/*.app /Applications/Utilities/*.app; do
  [ -e "$a" ] || continue
  B=$(defaults read "$a/Contents/Info" CFBundleIdentifier 2>/dev/null)
  [ -z "$B" ] && B="(none)"
  N=$(basename "$a" .app)
  SZ=$(du -hs "$a" 2>/dev/null | awk '{print $1}')
  C="CANDIDATE"
  case "$B" in ${APPLE_PREFIX}*) C="APPLE";; esac
  case "$N" in ${KEEP_CASE}) C="KEEP";; esac
  echo "APP $C | $SZ | $B | $N"
done
echo "--- keep dirs ---"
for u in $(ls /Users 2>/dev/null | grep -v Shared); do
  echo "USER $u"
  du -hs "/Users/$u/Downloads" 2>/dev/null || echo "  no Downloads"
  du -hs "/Users/$u/Library/Application Support/CandyBar" 2>/dev/null || echo "  no CandyBar support"
  du -hs "/Users/$u/Library/Application Support/Flavours" 2>/dev/null || echo "  no Flavours support"
  ls "/Users/$u/Library/Preferences/com.panic.CandyBar3.plist" 2>/dev/null || echo "  no CandyBar plist"
done
echo "--- theme payloads (first 20) ---"
find /Users -maxdepth 4 -iname "*.icontainer" -o -maxdepth 4 -iname "*.iconset" -o -maxdepth 4 -iname "*.flavour" 2>/dev/null | head -20
echo "--- reclaimable ---"
du -hs /Library/Caches 2>/dev/null || echo "no /Library/Caches"
du -hs /private/var/log 2>/dev/null || echo "no /private/var/log"
for u in $(ls /Users 2>/dev/null | grep -v Shared); do
  du -hs "/Users/$u/Library/Caches" 2>/dev/null
  du -hs "/Users/$u/.Trash" 2>/dev/null
done
echo "--- harden state ---"
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "firewall UNKNOWN"
/usr/libexec/ApplicationFirewall/socketfilterfw --getstealthmode 2>/dev/null || echo "stealth UNKNOWN"
defaults read /Library/Preferences/com.apple.loginwindow GuestEnabled 2>/dev/null || echo "guest UNSET"
echo "--- filesystem ---"
diskutil verifyVolume / 2>&1 | tail -6 || echo "verify UNKNOWN"
echo "${DONE}"
} > "$REPORT" 2>&1
open "$REPORT" 2>/dev/null || true
echo "wrote $REPORT"
`;
}

// ---------------------------------------------------------------- absolution.html
// ES5 only (Arctic Fox 47 = Firefox 52 class): var, function, XMLHttpRequest, FileReader.
function pageHtml(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${NAME} ${ROLLOUT}</title>
<style type="text/css">
body{background:#191b1d;color:#e8e8e8;font:13px "Lucida Grande",Helvetica,sans-serif;margin:0;padding:18px}
.card{max-width:700px;margin:0 auto;background:#26292c;border:1px solid #111;border-radius:8px;padding:16px}
h1{font-size:18px;margin:0;letter-spacing:.5px}
.stamp{font:11px Monaco,monospace;color:#8fc48f;background:#1b2b1b;border:1px solid #2f4a2f;border-radius:4px;padding:6px 8px;margin:8px 0;word-break:break-all}
.note{color:#9aa0a6;font-size:11px}
ol{padding-left:20px;margin:6px 0}
li{margin:5px 0}
fieldset{border:1px solid #3a3d41;border-radius:6px;margin:12px 0;padding:10px}
legend{color:#b8bcc0;font-size:11px;padding:0 4px}
.aqua{background:#4a90d9;color:#fff;border:1px solid #2a70b9;border-radius:12px;padding:6px 16px;font-size:12px;cursor:pointer}
.aqua[disabled]{background:#4a4d50;border-color:#3a3d40;color:#8b8f93;cursor:default}
a.link{color:#7fb2e5}
pre{background:#1d1f21;border:1px solid #3a3d41;border-radius:4px;padding:8px;font:11px Monaco,monospace;white-space:pre-wrap;max-height:200px;overflow:auto}
iframe{display:none}
.ok{color:#8fc48f}.bad{color:#e08a8a}
</style></head>
<body><div class="card">
<h1>${NAME}</h1>
<div class="stamp">rollout ${ROLLOUT} &middot; branch ${BRANCH} &middot; <a class="link" href="${PR_URL}">PR #${PR}</a> &middot; session ${SESSION} &middot; ${WAVE_DATE}<br>
permanent link ${SHORT} &middot; log tag ${TAG}</div>
<p class="note">READ-ONLY context probe. Nothing is erased, moved or deleted by this page or by
${COMMAND}. The report travels as <b>text</b>, the only form the agent can read back.</p>

<fieldset><legend>1 &mdash; get it</legend>
<p class="note">Download, then double-click <b>${COMMAND}</b>. It writes
<b>~/Desktop/${NAME}.txt</b> and opens it.</p>
<p><a class="link" href="${RAW(COMMAND)}">${COMMAND}</a>
&nbsp;&middot;&nbsp; <a class="link" href="${RAW(ZIP)}">${ZIP}</a></p>
</fieldset>

<fieldset><legend>2 &mdash; attach it</legend>
<div><input type="file" id="pick" accept=".txt,text/plain"></div>
<p id="pv" class="note">no file chosen</p>
<pre id="prev"></pre>
</fieldset>

<fieldset><legend>3 &mdash; burn it</legend>
<button class="aqua" type="button" id="burn" disabled="disabled">Burn</button>
<span class="note" id="st"></span>
</fieldset>

<p class="note">Then say <b>burned</b> in the chat. Inbox: ${INBOX_POST}</p>
</div>
<iframe name="dropframe"></iframe>
<script type="text/javascript">
// ES5 only: Arctic Fox 47 is Firefox 52 class. No fetch, no arrows, no template literals, no const/let.
var INBOX = "${INBOX_POST}";
var TAG = "${TAG}";
var ROLLOUT = "${ROLLOUT}";
var BODY = null;

function $(id){ return document.getElementById(id); }
function setStatus(t, cls){ var e = $("st"); e.innerHTML = t; e.className = cls ? cls : "note"; }

$("pick").onchange = function(){
  var f = this.files && this.files[0];
  if (!f) { return; }
  var r = new FileReader();
  r.onload = function(){
    BODY = String(r.result || "");
    $("pv").innerHTML = "loaded " + f.name + " - " + BODY.length + " bytes, " + BODY.split("\\n").length + " lines";
    $("prev").innerHTML = BODY.substring(0, 1200).replace(/</g, "&lt;");
    if (BODY.indexOf(TAG) === -1) {
      $("burn").disabled = true;
      setStatus("not an " + TAG + " report", "bad");
    } else {
      $("burn").disabled = false;
      setStatus("ready", "ok");
    }
  };
  r.readAsText(f);
};

function postText(body){
  try {
    var x = new XMLHttpRequest();
    x.open("POST", INBOX, true);
    x.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
    x.send(body);
    return true;
  } catch (e) { return false; }
}

function postQuery(body){
  try {
    var x = new XMLHttpRequest();
    x.open("GET", INBOX + "?log=" + encodeURIComponent(body), true);
    x.send(null);
    return true;
  } catch (e) { return false; }
}

$("burn").onclick = function(){
  if (!BODY) { return; }
  var head = TAG + " rollout=" + ROLLOUT + " size=" + BODY.length + " lines=" + BODY.split("\\n").length + "\\n";
  var a = postText(head + "----- report follows -----\\n" + BODY);
  var b = postQuery(head + BODY.substring(0, 1200));
  if (a || b) { setStatus("BURNED - say burned in the chat", "ok"); }
  else { setStatus("burn failed - paste the text into chat instead", "bad"); }
};
</script>
</body></html>
`;
}

// ---------------------------------------------------------------- burn parser
export type ParsedApp = { cls: string; size: string; bundle: string; name: string };
export type ParsedBurn = {
  tag: string;
  rollout: string | null;
  branch: string | null;
  pr: string | null;
  complete: boolean;
  host: string | null;
  bootVolume: string | null;
  apps: ParsedApp[];
  keepDirs: string[];
  reclaimable: string[];
  firewall: string | null;
  verify: string[];
  candidates: ParsedApp[];
  protectedApps: ParsedApp[];
};

export function parseBurn(text: string): ParsedBurn {
  const lines = text.split(/\r?\n/);
  const apps: ParsedApp[] = [];
  const keepDirs: string[] = [];
  const reclaimable: string[] = [];
  const verify: string[] = [];
  let host: string | null = null;
  let bootVolume: string | null = null;
  let firewall: string | null = null;
  let section = '';
  const grab = (re: RegExp) => text.match(re)?.[1] ?? null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('host=')) host = line.slice(5);
    if (/^--- /.test(line)) {
      section = line.replace(/^---\s*/, '').replace(/\s*---$/, '');
      continue;
    }
    if (line.startsWith('APP ')) {
      const p = line.slice(4).split('|').map((x) => x.trim());
      if (p.length >= 4) apps.push({ cls: p[0], size: p[1], bundle: p[2], name: p.slice(3).join(' | ') });
      continue;
    }
    if (/ on \/ /.test(line) && bootVolume === null) bootVolume = line;
    if (section === 'keep dirs' && line) keepDirs.push(line);
    if (section === 'reclaimable' && line) reclaimable.push(line);
    if (section === 'harden state' && /Firewall|State =/i.test(line) && firewall === null) firewall = line;
    if (section === 'filesystem' && line) verify.push(line);
  }
  return {
    tag: TAG,
    rollout: grab(/rollout=(\S+)/),
    branch: grab(/branch=(\S+)/),
    pr: grab(/pr=(\S+)/),
    complete: text.includes(DONE),
    host,
    bootVolume,
    apps,
    keepDirs,
    reclaimable,
    firewall,
    verify,
    candidates: apps.filter((a) => a.cls === 'CANDIDATE'),
    protectedApps: apps.filter((a) => a.cls !== 'CANDIDATE'),
  };
}

function renderPlan(p: ParsedBurn): string {
  const o: string[] = [];
  o.push(`${p.tag} rollout=${p.rollout ?? 'UNKNOWN'} branch=${p.branch ?? 'UNKNOWN'} pr=${p.pr ?? 'UNKNOWN'}`);
  o.push(`complete=${p.complete ? 'YES' : 'NO'}  host=${p.host ?? 'UNKNOWN'}`);
  o.push(`boot=${p.bootVolume ?? 'UNKNOWN'}`);
  o.push(`apps=${p.apps.length} protected=${p.protectedApps.length} candidates=${p.candidates.length}`);
  o.push('');
  o.push('PROTECTED (never swept):');
  for (const a of p.protectedApps) o.push(`  ${a.cls.padEnd(9)} ${a.size.padStart(6)}  ${a.name}`);
  o.push('');
  o.push('SWEEP CANDIDATES (reversible quarantine):');
  if (p.candidates.length === 0) o.push('  none');
  for (const a of p.candidates) o.push(`  ${a.size.padStart(6)}  ${a.name}  [${a.bundle}]`);
  o.push('');
  o.push('KEEP DIRS:');
  for (const d of p.keepDirs) o.push(`  ${d}`);
  o.push('');
  o.push('RECLAIMABLE:');
  for (const d of p.reclaimable) o.push(`  ${d}`);
  o.push('');
  o.push(`FIREWALL: ${p.firewall ?? 'UNKNOWN'}`);
  for (const v of p.verify) o.push(`  ${v}`);
  o.push('');
  const rolloutOk = p.rollout === ROLLOUT;
  if (!p.complete) o.push('GATE: burn INCOMPLETE - do not sweep.');
  else if (!rolloutOk) o.push(`GATE: rollout MISMATCH (burn=${p.rollout} tool=${ROLLOUT}) - re-download ${COMMAND}.`);
  else o.push('GATE: plan is decidable from this burn.');
  return o.join('\n');
}

// Deterministic ZIP writer (stored, no compression). Node ships zlib but NOT a zip container, and
// the `zip` binary stamps each entry with the file's current mtime, so shelling out produced a
// different archive on every emit - measured, not assumed. A reproducible bundle is a hard
// requirement here ("reproducible and persistent on the same link"), so the container is built by
// hand with a FIXED DOS timestamp. Same inputs => byte-identical zip, forever.
const DOS_TIME = 0x6000; // 12:00:00
const DOS_DATE = 0x5AE1; // 2025-07-01, arbitrary but fixed

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function deterministicZip(entries: Array<[string, string]>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of entries) {
    const data = Buffer.from(content, 'utf8');
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(10, 4);           // version needed
    local.writeUInt16LE(0, 6);            // flags
    local.writeUInt16LE(0, 8);            // method 0 = stored
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);
    locals.push(local, data);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x031E, 4);     // made by unix
    central.writeUInt16LE(10, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);         // extra
    central.writeUInt16LE(0, 32);         // comment
    central.writeUInt16LE(0, 34);         // disk
    central.writeUInt16LE(0, 36);         // internal attrs
    // external attrs: 0100755 for .command (must stay executable), 0100644 otherwise.
    // >>> 0 because 0o100755 << 16 overflows into a negative signed int32 and writeUInt32LE throws.
    central.writeUInt32LE(((name.endsWith('.command') ? 0o100755 : 0o100644) << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);
    centrals.push(central);

    offset += local.length + data.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

// ---------------------------------------------------------------- commands
function emit(): void {
  writeFileSync(COMMAND, commandScript());
  spawnSync('chmod', ['+x', COMMAND]);
  writeFileSync(PAGE, pageHtml());
  const zip = deterministicZip([[COMMAND, commandScript()], [PAGE, pageHtml()]]);
  writeFileSync(ZIP, zip);
  console.log(`WROTE ${COMMAND}  sha256=${sha(commandScript()).slice(0, 16)}`);
  console.log(`WROTE ${PAGE}     sha256=${sha(pageHtml()).slice(0, 16)}`);
  console.log(`WROTE ${ZIP}      sha256=${createHash('sha256').update(zip).digest('hex').slice(0, 16)} (deterministic)`);
}

function links(): void {
  console.log(`${NAME.toUpperCase()} ${ROLLOUT}`);
  console.log(`  name        ${NAME}            (same in chat, page, zip, log)`);
  console.log(`  short link  ${SHORT}           PERMANENT, write-once, re-emit keeps it current`);
  console.log(`  page        ${PAGE_URL}`);
  console.log(`  command     ${RAW(COMMAND)}`);
  console.log(`  bundle      ${RAW(ZIP)}`);
  console.log(`  branch      ${BRANCH}`);
  console.log(`  pr          ${PR_URL}`);
  console.log(`  log tag     ${TAG} ... ${DONE}`);
  console.log(`  inbox read  ${INBOX_READ}`);
  console.log('  read rule   fetch_page only; curl to da.gd/webhook.site returns HTTP 000');
}

function selftest(): void {
  let fail = 0;
  const check = (n: string, ok: boolean) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`);
    if (!ok) fail++;
  };

  // ONE NAME: every artifact name must derive from NAME, or the operator ends up with two vocabularies
  check('command name derives from NAME', COMMAND === `${NAME}.command`);
  check('page name derives from NAME', PAGE === `${NAME}.html`);
  check('zip name derives from NAME', ZIP === `${NAME}.zip`);
  check('tag derives from NAME', TAG === `${NAME.toUpperCase()}1`);
  check('short link derives from NAME', SHORT === `https://da.gd/${NAME}`);
  check('done line derives from TAG', DONE.startsWith(TAG));

  const cmd = commandScript();
  const page = pageHtml();

  // rollout + branch + PR must be visible in all three surfaces
  for (const [where, body] of [['command', cmd], ['page', page]] as Array<[string, string]>) {
    check(`${where} states rollout ${ROLLOUT}`, body.includes(ROLLOUT));
    check(`${where} states the branch`, body.includes(BRANCH));
    check(`${where} states PR ${PR}`, body.includes(String(PR)));
  }
  check('page shows the permanent short link', page.includes(SHORT));
  check('page links the PR', page.includes(PR_URL));
  check('log line carries rollout+branch+pr', STAMP.includes(`rollout=${ROLLOUT}`) && STAMP.includes(`pr=${PR}`));

  // read-only proof on EXECUTABLE lines (the header comment says "no sudo", which a raw scan mis-flags)
  const code = cmd.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
  for (const [id, re] of [
    ['erase', /diskutil\s+erase/], ['partition', /partitionDisk/], ['asr', /\basr\b/],
    ['rm', /\brm\s/], ['mv', /\bmv\s/], ['sudo', /\bsudo\b/], ['curl', /\bcurl\b/],
    ['bless', /\bbless\b/], ['nvram', /\bnvram\b/],
  ] as Array<[string, RegExp]>) {
    check(`command has no ${id}`, !re.test(code));
  }
  check('command declares no-erase', cmd.includes(DONE));
  const tmp = `/tmp/${NAME}-selftest.sh`;
  writeFileSync(tmp, cmd);
  const syn = spawnSync('sh', ['-n', tmp], { encoding: 'utf8' });
  check(`command passes sh -n${syn.status === 0 ? '' : ': ' + (syn.stderr || '').trim()}`, syn.status === 0);

  // ES5 gate on the page script
  const script = page.split('<script type="text/javascript">')[1] ?? '';
  for (const [id, re] of [
    ['arrow functions', /=>/], ['const', /\bconst\s/], ['let', /\blet\s/],
    ['template literals', /`/], ['fetch(', /\bfetch\s*\(/],
  ] as Array<[string, RegExp]>) {
    check(`page script ES5: no ${id}`, !re.test(script));
  }
  check('page posts text/plain', page.includes('text/plain;charset=UTF-8'));
  check('page gates on the tag', page.includes('BODY.indexOf(TAG) === -1'));
  check('no TinyURL anywhere', !cmd.includes('tinyurl') && !page.toLowerCase().includes('tinyurl'));

  // reproducibility: emitting twice must produce identical bytes
  check('command generator is deterministic', commandScript() === cmd);
  check('page generator is deterministic', pageHtml() === page);
  for (const [f, gen] of [[COMMAND, commandScript], [PAGE, pageHtml]] as Array<[string, () => string]>) {
    if (existsSync(f)) check(`${f} on disk matches generator`, readFileSync(f, 'utf8') === gen());
  }

  // parser
  const sample = [
    STAMP, 'host=RevolYOUtionarys-Mac-Pro.local', '--- boot volume ---',
    '/dev/disk3s2 on / (hfs, local, journaled)', '--- apps: CLASS | size | bundle | name ---',
    'APP KEEP | 46M | com.panic.CandyBar3 | CandyBar',
    'APP KEEP | 14M | com.interacto.Flavours | Flavours',
    'APP APPLE | 214M | com.apple.iTunes | iTunes',
    'APP CANDIDATE | 118M | com.zeobit.mackeeper | MacKeeper',
    '--- keep dirs ---', '2.1G\t/Users/samael/Downloads',
    '--- reclaimable ---', '1.4G\t/Library/Caches',
    '--- harden state ---', 'Firewall is disabled. (State = 0)',
    '--- filesystem ---', 'The volume start disk clone appears to be OK', DONE,
  ].join('\n');
  const p = parseBurn(sample);
  check('parser: complete', p.complete);
  check('parser: reads rollout', p.rollout === ROLLOUT);
  check('parser: reads branch', p.branch === BRANCH);
  check('parser: reads pr', p.pr === String(PR));
  check('parser: 1 candidate', p.candidates.length === 1 && p.candidates[0].name === 'MacKeeper');
  check('parser: CandyBar+Flavours protected',
    p.protectedApps.some((a) => a.name === 'CandyBar') && p.protectedApps.some((a) => a.name === 'Flavours'));
  check('parser: truncated burn incomplete', !parseBurn(sample.replace(DONE, '')).complete);
  check('plan: decidable', renderPlan(p).includes('GATE: plan is decidable'));
  check('plan: refuses incomplete', renderPlan(parseBurn(sample.replace(DONE, ''))).includes('do not sweep'));
  check('plan: refuses rollout mismatch',
    renderPlan(parseBurn(sample.replace(`rollout=${ROLLOUT}`, 'rollout=R0'))).includes('rollout MISMATCH'));

  check('keep-list shared with lion-clean-plan', KEEP.length > 0 && KEEP_CASE.includes('"CandyBar"*'));
  check('command embeds shared keep patterns', cmd.includes(KEEP_CASE));

  // the bundle must be byte-identical across runs, or "same link, reproducible" is a false claim.
  // The system `zip` binary fails this (it stamps live mtimes) - measured, which is why the
  // container is hand-built with a fixed timestamp.
  const z1 = deterministicZip([[COMMAND, commandScript()], [PAGE, pageHtml()]]);
  const z2 = deterministicZip([[COMMAND, commandScript()], [PAGE, pageHtml()]]);
  check('zip is byte-reproducible', z1.equals(z2));
  check('zip has both entries', z1.includes(Buffer.from(COMMAND)) && z1.includes(Buffer.from(PAGE)));
  if (existsSync(ZIP)) check(`${ZIP} on disk matches generator`, readFileSync(ZIP).equals(z1));
  const unzipCheck = spawnSync('unzip', ['-t', ZIP], { encoding: 'utf8' });
  if (unzipCheck.status !== null) {
    check(`zip passes unzip -t${unzipCheck.status === 0 ? '' : ': ' + (unzipCheck.stdout || '').trim()}`, unzipCheck.status === 0);
  }

  console.log(fail === 0 ? 'ABSOLUTION_SELFTEST=PASS' : `ABSOLUTION_SELFTEST=FAIL failures=${fail}`);
  if (fail > 0) process.exit(1);
}

function parseFile(path: string): void {
  if (!path || !existsSync(path)) {
    console.log(`NO SUCH FILE ${path || '(none given)'}`);
    console.log(`Save the burn text (read ${INBOX_READ} with fetch_page) to a file, then re-run.`);
    process.exit(1);
  }
  console.log(renderPlan(parseBurn(readFileSync(path, 'utf8'))));
}

const direct = process.argv[1] !== undefined && /absolution\.ts$/.test(process.argv[1]);
if (direct) {
  const cmd = process.argv[2] ?? 'selftest';
  if (cmd === 'emit') emit();
  else if (cmd === 'links') links();
  else if (cmd === 'selftest') selftest();
  else if (cmd === 'parse') parseFile(process.argv[3] ?? '');
  else {
    console.log(`usage: node tools/${NAME}.ts <emit|links|parse FILE|selftest>`);
    process.exit(1);
  }
}
