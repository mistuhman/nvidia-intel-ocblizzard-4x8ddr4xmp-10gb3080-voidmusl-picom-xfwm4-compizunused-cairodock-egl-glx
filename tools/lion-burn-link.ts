#!/usr/bin/env node
// lion-burn-link.ts - burn + write-link tool for the 2026-09-17 "clear + harden the Lion SSD" wave.
//
// Operator directive 2026-09-17: "use the typescript burn and write link tool so we can get any
// missing context before running a final wipe".
//
// Purpose: the sweep list must be computed from the MACHINE, not from memory. This tool emits a
// read-only Mac-side probe (lion-clean-probe.command) whose output the operator burns through the
// One page into the webhook inbox, which the agent reads with fetch_page. It then parses that burn
// into a decided sweep plan.
//
// Channel facts (measured, not assumed):
//   - sandbox shell/curl CANNOT reach webhook.site or da.gd (TLS HTTP 000, MASTER lionMac.logChannel).
//     The agent reads the inbox ONLY with fetch_page. This tool therefore never performs network I/O;
//     it prints the exact URL to read and parses text the operator or fetch_page supplies.
//   - webhook.site stores a text/plain POST body in the JSON `content` field, and a GET ?log=
//     querystring in `query.log`. Both are agent-readable; multipart file attachments are NOT
//     (content arrives empty, per-file routes need owner auth). So the probe report must travel as
//     TEXT, which is what the One page's postText/postQuery paths already do.
//
// Zero dependency, deterministic stdout, no network.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { KEEP, APPLE_PREFIX } from './lion-clean-plan.ts';

const INBOX_ID = 'a078e138-e87d-4369-9868-0c0c1f3500d6';
const INBOX_POST = `https://webhook.site/${INBOX_ID}`;
const INBOX_READ = `https://webhook.site/token/${INBOX_ID}/requests?limit=5&sorting=newest`;
const REPO = 'mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx';
const BRANCH = 'arena/01a0ad71-nvidia-intel-ocblizzard-4x8ddr';
const RAW = (f: string) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${f}`;
const PAGE_URL = `https://htmlpreview.github.io/?https://github.com/${REPO}/blob/${BRANCH}/lion-clean.html`;

const TAG = 'LIONCLEAN1';
const DONE = `${TAG}_DONE No disk was erased.`;
const PROBE = 'lion-clean-probe.command';
const PAGE = 'lion-clean.html';
const ZIP = 'lion-clean.zip';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

// KEEP_CASE is imported from the clean plan so the burn probe and the sweep block can never disagree
// about what is protected. Pattern form "Literal"* - quotes around the literal, wildcard outside.
const KEEP_CASE = KEEP.map((k) => `"${k.prefix}"${k.wild ? '*' : ''}`).sort().join('|');

// ---------------------------------------------------------------- Mac-side probe
// Read-only. Writes one Desktop file and opens it. No sudo, no network, no disk or firmware change.
// Mirrors lion-one.command's proven shape (that script's receipt is readable in the inbox today).
function probeScript(): string {
  return `#!/bin/sh
# ${PROBE} - READ-ONLY context probe for the clear + harden wave (Lion 10.7, double-click).
# Writes ONLY ~/Desktop/lion-clean.txt then opens it for the One page txt picker.
# No sudo, no network, no erase, no move, no delete. Every probe is best-effort.
REPORT="$HOME/Desktop/lion-clean.txt"
{
echo "${TAG} clear-and-harden context probe"
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

// ---------------------------------------------------------------- Burn page
// ES5 only (Arctic Fox 47 is Firefox-52 class): var, function, XMLHttpRequest, FileReader.
// No fetch, no arrow functions, no template literals, no const/let.
function pageHtml(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Lion clear + harden - Burn</title>
<style type="text/css">
body{background:#1d1f21;color:#e8e8e8;font:13px "Lucida Grande",Helvetica,sans-serif;margin:0;padding:18px}
.card{max-width:720px;margin:0 auto;background:#2b2e31;border:1px solid #111;border-radius:8px;padding:16px}
h1{font-size:17px;margin:0 0 4px}
.note{color:#9aa0a6;font-size:11px}
fieldset{border:1px solid #3a3d41;border-radius:6px;margin:12px 0;padding:10px}
legend{color:#b8bcc0;font-size:11px;padding:0 4px}
.aqua{background:#4a90d9;color:#fff;border:1px solid #2a70b9;border-radius:12px;padding:5px 14px;font-size:12px;cursor:pointer}
.aqua[disabled]{background:#555;border-color:#444;cursor:default}
a.link{color:#7fb2e5}
pre{background:#202225;border:1px solid #3a3d41;border-radius:4px;padding:8px;font:11px Monaco,monospace;white-space:pre-wrap;max-height:220px;overflow:auto}
iframe{display:none}
</style></head>
<body><div class="card">
<h1>Lion clear + harden &mdash; context burn</h1>
<p class="note">Read-only probe. Nothing is erased, moved or deleted by this page or its script.
The report travels as <b>text</b>, which is the only form the agent can read back.</p>

<fieldset><legend>1. Get the probe</legend>
<p class="note">Download, then double-click <b>${PROBE}</b>. It writes
<b>~/Desktop/lion-clean.txt</b> and opens it.</p>
<p><a class="link" href="${RAW(PROBE)}">${PROBE}</a>
&nbsp;|&nbsp; <a class="link" href="${RAW(ZIP)}">${ZIP}</a></p>
</fieldset>

<fieldset><legend>2. Attach the report</legend>
<div><input type="file" id="pick" accept=".txt,text/plain"></div>
<p id="pv" class="note">no file chosen</p>
<pre id="prev"></pre>
</fieldset>

<fieldset><legend>3. Burn it to the agent</legend>
<button class="aqua" type="button" id="burn" disabled="disabled">Burn</button>
<span class="note" id="st"></span>
</fieldset>

<p class="note">Inbox: ${INBOX_POST}</p>
</div>
<iframe name="dropframe"></iframe>
<script type="text/javascript">
// ES5 only: Arctic Fox 47 is Firefox 52 class. No fetch, no arrows, no template literals.
var INBOX = "${INBOX_POST}";
var TAG = "${TAG}";
var BODY = null;

function $(id){ return document.getElementById(id); }

function setStatus(t){ $("st").innerHTML = t; }

$("pick").onchange = function(){
  var f = this.files && this.files[0];
  if (!f) { return; }
  var r = new FileReader();
  r.onload = function(){
    BODY = String(r.result || "");
    var lines = BODY.split("\\n").length;
    $("pv").innerHTML = "loaded " + f.name + " - " + BODY.length + " bytes, " + lines + " lines";
    $("prev").innerHTML = BODY.substring(0, 1500).replace(/</g, "&lt;");
    $("burn").disabled = BODY.indexOf(TAG) === -1;
    if (BODY.indexOf(TAG) === -1) { setStatus("that file is not a " + TAG + " report"); }
    else { setStatus("ready to burn"); }
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
  var head = TAG + " size=" + BODY.length + " lines=" + BODY.split("\\n").length + " page=clean\\n";
  var full = head + "----- report follows -----\\n" + BODY;
  var a = postText(full);
  // querystring copy is capped: it is the fallback the agent reads if the POST body is missing
  var b = postQuery(head + BODY.substring(0, 1200));
  if (a || b) { setStatus("BURNED - tell the agent it is burned"); }
  else { setStatus("burn failed - copy the text into chat instead"); }
};
</script>
</body></html>
`;
}

// ---------------------------------------------------------------- burn parser
export type ParsedApp = { cls: string; size: string; bundle: string; name: string };
export type ParsedBurn = {
  tag: string;
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
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('host=')) host = line.slice(5);
    if (/^--- /.test(line)) {
      section = line.replace(/^---\s*/, '').replace(/\s*---$/, '');
      continue;
    }
    if (line.startsWith('APP ')) {
      const parts = line.slice(4).split('|').map((p) => p.trim());
      if (parts.length >= 4) apps.push({ cls: parts[0], size: parts[1], bundle: parts[2], name: parts.slice(3).join(' | ') });
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
  const out: string[] = [];
  out.push(`BURN ${p.tag} complete=${p.complete ? 'YES' : 'NO (truncated - re-burn or paste full text)'}`);
  out.push(`host=${p.host ?? 'UNKNOWN'}`);
  out.push(`boot=${p.bootVolume ?? 'UNKNOWN'}`);
  out.push(`apps_seen=${p.apps.length} protected=${p.protectedApps.length} candidates=${p.candidates.length}`);
  out.push('');
  out.push('PROTECTED (never swept):');
  for (const a of p.protectedApps) out.push(`  ${a.cls.padEnd(9)} ${a.size.padStart(6)}  ${a.name}`);
  out.push('');
  out.push('SWEEP CANDIDATES (quarantine, reversible):');
  if (p.candidates.length === 0) out.push('  none - nothing to sweep');
  for (const a of p.candidates) out.push(`  ${a.size.padStart(6)}  ${a.name}  [${a.bundle}]`);
  out.push('');
  out.push('KEEP DIRS (must survive byte-identical):');
  for (const d of p.keepDirs) out.push(`  ${d}`);
  out.push('');
  out.push('RECLAIMABLE:');
  for (const d of p.reclaimable) out.push(`  ${d}`);
  out.push('');
  out.push(`FIREWALL: ${p.firewall ?? 'UNKNOWN'}`);
  out.push('VERIFY TAIL:');
  for (const v of p.verify) out.push(`  ${v}`);
  out.push('');
  out.push(p.complete ? 'GATE: plan is decidable from this burn.' : 'GATE: burn INCOMPLETE - do not sweep.');
  return out.join('\n');
}

// ---------------------------------------------------------------- emit + selftest
function emit(): void {
  writeFileSync(PROBE, probeScript());
  spawnSync('chmod', ['+x', PROBE]);
  writeFileSync(PAGE, pageHtml());
  const zipRes = spawnSync('zip', ['-q', '-X', '-FS', ZIP, PROBE, PAGE], { encoding: 'utf8' });
  console.log(`WROTE ${PROBE} sha256=${sha(probeScript()).slice(0, 16)}`);
  console.log(`WROTE ${PAGE} sha256=${sha(pageHtml()).slice(0, 16)}`);
  console.log(zipRes.status === 0 ? `WROTE ${ZIP}` : `ZIP SKIPPED (${zipRes.stderr || 'no zip binary'})`);
}

function links(): void {
  console.log('BURN CHANNEL - clear + harden wave');
  console.log(`page          ${PAGE_URL}`);
  console.log(`probe (raw)   ${RAW(PROBE)}`);
  console.log(`bundle (raw)  ${RAW(ZIP)}`);
  console.log(`inbox POST    ${INBOX_POST}`);
  console.log(`inbox READ    ${INBOX_READ}`);
  console.log('read rule     agent uses fetch_page on inbox READ; curl cannot reach it (TLS 000)');
  console.log(`tag           ${TAG} ... ${DONE}`);
}

function selftest(): void {
  let fail = 0;
  const check = (name: string, ok: boolean) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
    if (!ok) fail++;
  };

  const probe = probeScript();
  check('probe is /bin/sh', probe.startsWith('#!/bin/sh'));
  // Scan EXECUTABLE lines only. The probe's own header says "No sudo, no network, no erase" and a
  // raw-byte scan flags those words as violations - the same false positive the clean-plan selftest
  // hit. Stripping comments is what makes "has no sudo" mean "never runs sudo".
  const probeCode = probe
    .split('\n')
    .filter((l) => !l.trim().startsWith('#'))
    .join('\n');
  // the probe runs on the operator's live daily driver: it must be provably read-only
  for (const [id, re] of [
    ['erase', /diskutil\s+erase/],
    ['partition', /partitionDisk/],
    ['asr', /\basr\b/],
    ['rm', /\brm\s/],
    ['mv', /\bmv\s/],
    ['sudo', /\bsudo\b/],
    ['curl', /\bcurl\b/],
    ['bless', /\bbless\b/],
    ['nvram', /\bnvram\b/],
  ] as Array<[string, RegExp]>) {
    check(`probe has no ${id}`, !re.test(probeCode));
  }
  check('probe declares no-erase', probe.includes(DONE));
  const tmp = '/tmp/lion-burn-probe-selftest.sh';
  writeFileSync(tmp, probe);
  const syn = spawnSync('sh', ['-n', tmp], { encoding: 'utf8' });
  check(`probe passes sh -n${syn.status === 0 ? '' : ': ' + (syn.stderr || '').trim()}`, syn.status === 0);

  const page = pageHtml();
  // Arctic Fox 47 = Firefox 52 class: ES6-only syntax in the page is a hard parse failure
  const script = page.split('<script type="text/javascript">')[1] ?? '';
  for (const [id, re] of [
    ['arrow functions', /=>/],
    ['const', /\bconst\s/],
    ['let', /\blet\s/],
    ['template literals', /`/],
    ['fetch(', /\bfetch\s*\(/],
  ] as Array<[string, RegExp]>) {
    check(`page script is ES5: no ${id}`, !re.test(script));
  }
  check('page posts text/plain', page.includes('text/plain;charset=UTF-8'));
  check('page targets the live inbox', page.includes(INBOX_POST));
  check('page gates on the tag', page.includes(`BODY.indexOf(TAG) === -1`));

  // parser round-trip on a synthetic burn
  const sample = [
    `${TAG} clear-and-harden context probe`,
    'host=RevolYOUtionarys-Mac-Pro.local',
    '--- boot volume ---',
    '/dev/disk3s2 on / (hfs, local, journaled)',
    '--- apps: CLASS | size | bundle | name ---',
    'APP KEEP | 45M | com.panic.CandyBar3 | CandyBar',
    'APP KEEP | 12M | com.interacto.Flavours | Flavours',
    'APP APPLE | 180M | com.apple.iTunes | iTunes',
    'APP CANDIDATE | 90M | com.zeobit.mackeeper | MacKeeper',
    'APP CANDIDATE | 61M | com.skype.skype | Skype',
    '--- keep dirs ---',
    'USER samael',
    '2.1G\t/Users/samael/Downloads',
    '--- reclaimable ---',
    '800M\t/Library/Caches',
    '--- harden state ---',
    'Firewall is disabled. (State = 0)',
    '--- filesystem ---',
    'The volume start disk clone appears to be OK',
    DONE,
  ].join('\n');
  const parsed = parseBurn(sample);
  check('parser: complete', parsed.complete);
  check('parser: host', parsed.host === 'RevolYOUtionarys-Mac-Pro.local');
  check('parser: 5 apps', parsed.apps.length === 5);
  check('parser: 2 candidates', parsed.candidates.length === 2);
  check('parser: candidates are the third-party pair',
    parsed.candidates.map((c) => c.name).sort().join(',') === 'MacKeeper,Skype');
  check('parser: CandyBar protected', parsed.protectedApps.some((a) => a.name === 'CandyBar'));
  check('parser: Flavours protected', parsed.protectedApps.some((a) => a.name === 'Flavours'));
  check('parser: boot volume', (parsed.bootVolume ?? '').includes('disk3s2'));
  check('parser: firewall read', (parsed.firewall ?? '').includes('State = 0'));
  check('parser: keep dirs seen', parsed.keepDirs.some((d) => d.includes('Downloads')));
  // truncation must be detectable, or a partial burn could authorize a sweep
  check('parser: truncated burn is incomplete', !parseBurn(sample.replace(DONE, '')).complete);

  const plan = renderPlan(parsed);
  check('plan names candidates', plan.includes('MacKeeper') && plan.includes('Skype'));
  check('plan marks decidable', plan.includes('GATE: plan is decidable'));
  check('plan refuses on incomplete',
    renderPlan(parseBurn(sample.replace(DONE, ''))).includes('do not sweep'));

  // keep-list must come from the clean plan, never be re-typed here
  check('keep-list shared with lion-clean-plan', KEEP.length > 0 && KEEP_CASE.includes('"CandyBar"*'));
  check('probe embeds the shared keep patterns', probe.includes(KEEP_CASE));

  for (const [f, gen] of [[PROBE, probeScript], [PAGE, pageHtml]] as Array<[string, () => string]>) {
    if (existsSync(f)) check(`${f} on disk matches generator`, readFileSync(f, 'utf8') === gen());
  }

  console.log(fail === 0 ? 'LION_BURN_LINK_SELFTEST=PASS' : `LION_BURN_LINK_SELFTEST=FAIL failures=${fail}`);
  if (fail > 0) process.exit(1);
}

function readBurn(path: string): void {
  if (!existsSync(path)) {
    console.log(`NO SUCH FILE ${path}`);
    console.log(`Save the burn text (from ${INBOX_READ}) to a file, then re-run.`);
    process.exit(1);
  }
  console.log(renderPlan(parseBurn(readFileSync(path, 'utf8'))));
}

const direct = process.argv[1] !== undefined && /lion-burn-link\.ts$/.test(process.argv[1]);
if (direct) {
  const cmd = process.argv[2] ?? 'selftest';
  if (cmd === 'emit') emit();
  else if (cmd === 'links') links();
  else if (cmd === 'selftest') selftest();
  else if (cmd === 'parse') readBurn(process.argv[3] ?? '');
  else {
    console.log('usage: node tools/lion-burn-link.ts <emit|links|parse --file|selftest>');
    process.exit(1);
  }
}
