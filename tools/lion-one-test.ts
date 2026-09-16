#!/usr/bin/env node
// One-link channel tests: lion-one.command (safe read-only reporter) + lion-one.zip
// (reporter + page, two files) + the One page shape. Additive to the frozen-era
// lion-mirror-sl-test.ts, which keeps asserting the old bundle byte-shape.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = 'lion-one.command';
const PAGE = 'lion-one.html';
const ZIP = 'lion-one.zip';
let failed = 0;

function pass(id: string, msg: string): void {
  console.log(`PASS ${id} ${msg}`);
}
function fail(id: string, msg: string): void {
  failed += 1;
  console.log(`FAIL ${id} ${msg}`);
}

function agentSyntax(): void {
  const text = readFileSync(SCRIPT, 'utf8');
  if (!text.startsWith('#!/bin/sh')) fail('O-shebang', 'need #!/bin/sh');
  else pass('O-shebang', '#!/bin/sh');
  const forbidden: Array<[string, RegExp]> = [
    ['asr', /\basr\b/],
    ['erase', /diskutil\s+erase|erase\s+Bay/i],
    ['bless-mutate', /bless\s+--(folder|file|mount)/],
    ['nvram-mutate', /nvram\s+-d|nvram\s+[^\n]*=/],
    ['mount', /diskutil\s+mount/],
    ['rm', /\brm\s/],
    ['curl', /\bcurl\b/],
    ['date-mutate', /date\s+(0101|0808)/],
    ['dbl-bracket', /\[\[/],
    ['local-kw', /^\s*local\s/m],
    ['pipefail', /pipefail/],
    ['bash4-lower', /\$\{[A-Za-z_][A-Za-z0-9_]*[,,]{2}/],
  ];
  for (const [id, re] of forbidden) {
    if (re.test(text)) fail(`O-${id}`, 'forbidden token present');
    else pass(`O-${id}`, 'absent');
  }
  const required: Array<[string, RegExp]> = [
    ['header', /LIONONE1/],
    ['report', /lion-one\.txt/],
    ['noerase', /No disk was erased/],
    ['swvers', /sw_vers/],
    ['disks', /diskutil list/],
    ['airport', /airport/],
    ['arctic', /ArcticFox\.app/],
    ['audio', /SPAudioDataType/],
    ['displays', /SPDisplaysDataType/],
    ['firewall', /socketfilterfw --getglobalstate/],
  ];
  for (const [id, re] of required) {
    if (!re.test(text)) fail(`O-need-${id}`, 'missing probe');
    else pass(`O-need-${id}`, 'present');
  }
  if (!/No sudo, no network/.test(text)) fail('O-contract', 'missing no-sudo/no-network contract');
  else pass('O-contract', 'read-only contract');
  for (const [id, args] of [['O-bash-n', ['bash', ['-n', SCRIPT]]], ['O-posix-n', ['bash', ['--posix', '-n', SCRIPT]]], ['O-dash-n', ['dash', ['-n', SCRIPT]]]] as const) {
    const r = spawnSync(args[0], args[1], { encoding: 'utf8' });
    if (r.error) pass(id, `${args[0]} not installed — skipped`);
    else if (r.status !== 0) fail(id, r.stderr || 'syntax error');
    else pass(id, `${args[0]} -n`);
  }
}

function agentPage(): void {
  const text = readFileSync(PAGE, 'utf8');
  const required: Array<[string, RegExp]> = [
    ['title', /<title>One<\/title>/],
    ['onelink', /da\.gd\/lionone/],
    ['picker', /id="pick"/],
    ['burn-armed', /id="burn"[^>]*disabled="disabled"/],
    ['burn-handler', /\$\("burn"\)\.onclick = burn/],
    ['direct', /straight to the model/],
    ['no-merge', /no merge, no pull request/i],
    ['inbox', /webhook\.site\/a078e138-e87d-4369-9868-0c0c1f3500d6/],
    ['cmd-pull', /etc\/lion-command\.txt/],
    ['branch', /arena\/01a0a9ee-nvidia-intel-ocblizzard-4x8ddr/],
    ['zip', /lion-one\.zip/],
    ['header-compat', /LIONMIRROR1 size=/],
    ['escape', /function esc\(s\)/],
  ];
  for (const [id, re] of required) {
    if (!re.test(text)) fail(`P-${id}`, 'missing page element');
    else pass(`P-${id}`, 'present');
  }
  const banned: Array<[string, RegExp]> = [
    ['fetch', /\bfetch\(/],
    ['arrow', /=>/],
    ['template', /`(?:[^`\\]|\\.)*`/],
    ['const', /\bconst\s/],
    ['let', /\blet\s/],
  ];
  for (const [id, re] of banned) {
    const body = text.slice(text.indexOf('<script'));
    if (re.test(body)) fail(`P-no-${id}`, 'non-ES5 token in script');
    else pass(`P-no-${id}`, 'absent');
  }
}

function writeMock(bin: string, name: string, body: string): void {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
}

function agentRun(): void {
  const root = mkdtempSync(join(tmpdir(), 'lion-one-'));
  try {
    const bin = join(root, 'bin');
    const home = join(root, 'home');
    mkdirSync(join(home, 'Desktop'), { recursive: true });
    mkdirSync(bin, { recursive: true });
    writeMock(bin, 'sw_vers', 'printf "%s\\n" "MOCK-SW-VERS 10.7.5"');
    writeMock(bin, 'uname', 'printf "%s\\n" "MOCK-UNAME Darwin"');
    writeMock(bin, 'sysctl', 'printf "%s\\n" "MOCK-SYSCTL hw.model"');
    writeMock(bin, 'diskutil', 'printf "%s\\n" "MOCK-DISKUTIL list"');
    writeMock(bin, 'mount', 'printf "%s\\n" "MOCK-MOUNT /"');
    writeMock(bin, 'date', 'printf "%s\\n" "MOCK-DATE"');
    writeMock(bin, 'hostname', 'printf "%s\\n" "MOCK-HOST"');
    writeMock(bin, 'defaults', 'printf "%s\\n" "MOCK-ARCTIC 47.3"');
    writeMock(bin, 'system_profiler', 'printf "%s\\n" "MOCK-PROFILER $1"');
    writeMock(bin, 'networksetup', 'printf "%s\\n" "MOCK-NETSETUP"');
    writeMock(bin, 'airport', 'printf "%s\\n" "MOCK-AIRPORT -I"');
    writeMock(bin, 'ls', 'printf "%s\\n" "MOCK-LS $*"');
    writeMock(bin, 'open', `printf '%s\\n' "$*" >> "${root}/open.log"`);
    const env = { ...process.env, PATH: `${bin}:/bin:/usr/bin`, HOME: home };
    const r = spawnSync('sh', [join(process.cwd(), SCRIPT)], { encoding: 'utf8', env, timeout: 20000 });
    if ((r.status ?? 99) !== 0) {
      fail('R-status', `exit=${r.status} out=${(r.stdout || '') + (r.stderr || '')}`.slice(-400));
      return;
    }
    pass('R-status', 'exit 0');
    const report = join(home, 'Desktop/lion-one.txt');
    if (!existsSync(report)) {
      fail('R-report', 'report not written');
      return;
    }
    const text = readFileSync(report, 'utf8');
    for (const needle of ['LIONONE1 one-link report', 'LIONONE1_DONE No disk was erased.', 'MOCK-SW-VERS', 'MOCK-DISKUTIL', 'MOCK-AIRPORT', 'MOCK-ARCTIC', 'MOCK-PROFILER SPAudioDataType', 'MOCK-PROFILER SPDisplaysDataType', 'MOCK-NETSETUP', 'firewall UNKNOWN']) {
      if (text.indexOf(needle) < 0) fail('R-needle', `missing ${needle}`);
      else pass('R-needle', needle);
    }
    const opened = existsSync(join(root, 'open.log')) ? readFileSync(join(root, 'open.log'), 'utf8') : '';
    if (opened.indexOf('lion-one.txt') < 0) fail('R-open', 'report not opened');
    else pass('R-open', 'open called');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function execEntries(zip: string): { names: string[]; exec: string[] } {
  const info = execFileSync('zipinfo', ['-l', zip], { encoding: 'utf8' });
  const names: string[] = [];
  const exec: string[] = [];
  for (const line of info.split('\n')) {
    const p = line.trim().split(/\s+/);
    if (p.length < 9) { continue; }
    if (!/^[drwxst\-@]{9,10}$/.test(p[0])) { continue; }
    const name = p[p.length - 1];
    if (!/[.][A-Za-z0-9]+$/.test(name)) { continue; }
    names.push(name);
    if (p[0][3] === 'x') { exec.push(name); }
  }
  return { names, exec };
}

function agentZip(): void {
  if (!existsSync(ZIP)) {
    fail('Z-exists', `${ZIP} missing`);
    return;
  }
  const { names, exec } = execEntries(ZIP);
  const sorted = names.slice().sort().join(',');
  if (sorted !== [PAGE, SCRIPT].sort().join(',')) fail('Z-entries', sorted);
  else pass('Z-entries', sorted);
  if (exec.slice().sort().join(',') !== SCRIPT) fail('Z-exec', exec.join(',') || 'none');
  else pass('Z-exec', 'unix exec bit on the reporter only');
}

function main(): void {
  console.log('agent O = one-link reporter syntax + read-only contract');
  agentSyntax();
  console.log('agent P = one page shape (armed Burn, direct send, ES5)');
  agentPage();
  console.log('agent R = mocked reporter run');
  agentRun();
  console.log('agent Z = one zip carries reporter + page, two files');
  agentZip();
  if (failed) {
    console.log(`ONE_TEST=FAIL count=${failed}`);
    process.exit(1);
  }
  console.log('ONE_TEST=PASS');
}

main();
