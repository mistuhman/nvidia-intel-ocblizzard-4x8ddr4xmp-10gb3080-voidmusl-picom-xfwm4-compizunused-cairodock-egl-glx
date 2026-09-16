#!/usr/bin/env node
// Arctic Fox hardener tests: lion-arcticfox-harden.command is a config-only reporter.
// Syntax (sh/posix/dash), forbidden mutation tokens, required probes, mocked run against a fake
// HOME that holds an ArcticFox profile with prefs.js. Additive gate wired into tools/test-all.ts.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = 'lion-arcticfox-harden.command';
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
  if (!text.startsWith('#!/bin/sh')) fail('H-shebang', 'need #!/bin/sh');
  else pass('H-shebang', '#!/bin/sh');
  const forbidden: Array<[string, RegExp]> = [
    ['sudo', /sudo/],
    ['curl', /\bcurl\b/],
    ['rm', /\brm\s/],
    ['asr', /\basr\b/],
    ['disk-erase', /diskutil\s+erase|eraseDisk/i],
    ['bless-mutate', /bless\s+--(folder|file|mount)/],
    ['nvram-mutate', /nvram\s+-d|nvram\s+[^=\n]*=/],
    ['dbl-bracket', /\[\[/],
    ['local-kw', /^\s*local\s/m],
    ['pipefail', /pipefail/],
    ['bash4-lower', /\$\{[A-Za-z_][A-Za-z0-9_]*[,,]{2}/],
  ];
  for (const [id, re] of forbidden) {
    if (re.test(text)) fail(`H-${id}`, 'forbidden token present');
    else pass(`H-${id}`, 'absent');
  }
  const required: Array<[string, RegExp]> = [
    ['header', /LIONARCTIC1 /],
    ['done', /LIONARCTIC1_DONE config only/],
    ['noerase', /no disk was erased/],
    ['profile-find', /find "\$SUPPORT" -name prefs\.js/],
    ['backup', /prefs\.js\.prehardened/],
    ['userjs', /cat > "\$PROFILE\/user\.js"/],
    ['tls-min', /security\.tls\.version\.min", 3/],
    ['cookies', /network\.cookie\.cookieBehavior", 1/],
    ['tracking', /privacy\.trackingprotection\.enabled", true/],
    ['xpinstall', /xpinstall\.signatures\.required", false/],
    ['rollback-line', /rollback: delete/],
    ['report', /lion-arcticfox\.txt/],
  ];
  for (const [id, re] of required) {
    if (!re.test(text)) fail(`H-need-${id}`, 'missing element');
    else pass(`H-need-${id}`, 'present');
  }
  for (const [id, args] of [
    ['H-bash-n', ['bash', ['-n', SCRIPT]]],
    ['H-posix-n', ['bash', ['--posix', '-n', SCRIPT]]],
    ['H-dash-n', ['dash', ['-n', SCRIPT]]],
  ] as const) {
    const r = spawnSync(args[0], args[1], { encoding: 'utf8' });
    if (r.error) pass(id, `${args[0]} not installed - skipped`);
    else if (r.status !== 0) fail(id, r.stderr || 'syntax error');
    else pass(id, `${args[0]} -n`);
  }
}

function agentRun(): void {
  const root = mkdtempSync(join(tmpdir(), 'lion-arctic-'));
  try {
    const bin = join(root, 'bin');
    const home = join(home0(root));
    const profile = join(home, 'Library/Application Support/ArcticFox/Profiles/abc.default');
    mkdirSync(bin, { recursive: true });
    mkdirSync(profile, { recursive: true });
    writeFileSync(join(profile, 'prefs.js'), 'user_pref("app.update.auto", true);\n');
    writeMock(bin, 'defaults', 'printf "%s\\n" "47.3"');
    writeMock(bin, 'open', `printf '%s\\n' "$*" >> "${root}/open.log"`);
    const env = { ...process.env, PATH: `${bin}:/bin:/usr/bin`, HOME: home };
    const r = spawnSync('sh', [join(process.cwd(), SCRIPT)], { encoding: 'utf8', env, timeout: 20000 });
    if ((r.status ?? 99) !== 0) {
      fail('HR-status', `exit=${r.status} out=${(r.stdout || '') + (r.stderr || '')}`.slice(-400));
      return;
    }
    pass('HR-status', 'exit 0');
    const report = join(home, 'Desktop/lion-arcticfox.txt');
    if (!existsSync(report)) {
      fail('HR-report', 'report not written');
      return;
    }
    const text = readFileSync(report, 'utf8');
    for (const needle of [
      'LIONARCTIC1 arcticfox hardening report',
      'LIONARCTIC1_DONE config only - Arctic Fox kept, no disk was erased.',
      'profile=',
      'created prefs.js.prehardened',
      'userprefs-locked=11',
      'arcticfox-version=47.3',
    ]) {
      if (text.indexOf(needle) < 0) fail('HR-needle', `missing ${needle}`);
      else pass('HR-needle', needle);
    }
    const userjs = readFileSync(join(profile, 'user.js'), 'utf8');
    if (userjs.indexOf('user_pref("security.tls.version.min", 3);') < 0) fail('HR-userjs', 'tls pref missing');
    else pass('HR-userjs', 'user.js written with tls min 3');
    if (!existsSync(join(profile, 'prefs.js.prehardened'))) fail('HR-backup', 'prefs backup missing');
    else pass('HR-backup', 'prefs.js.prehardened exists');
    const prefsAfter = readFileSync(join(profile, 'prefs.js'), 'utf8');
    if (prefsAfter !== 'user_pref("app.update.auto", true);\n') fail('HR-prefs-untouched', 'prefs.js mutated');
    else pass('HR-prefs-untouched', 'prefs.js untouched (config-only)');
    const opened = existsSync(join(root, 'open.log')) ? readFileSync(join(root, 'open.log'), 'utf8') : '';
    if (opened.indexOf('lion-arcticfox.txt') < 0) fail('HR-open', 'report not opened');
    else pass('HR-open', 'open called');
    // second run is idempotent: backup line flips to already-present, no duplication
    const r2 = spawnSync('sh', [join(process.cwd(), SCRIPT)], { encoding: 'utf8', env, timeout: 20000 });
    const text2 = r2.status === 0 ? readFileSync(report, 'utf8') : '';
    if (text2.indexOf('prefs.js.prehardened already present') < 0) fail('HR-idem', 'second run not idempotent');
    else pass('HR-idem', 'second run keeps the first backup');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function home0(root: string): string {
  const home = join(root, 'home');
  mkdirSync(join(home, 'Desktop'), { recursive: true });
  return home;
}

function writeMock(bin: string, name: string, body: string): void {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
}

function main(): void {
  console.log('agent H = arcticfox hardener syntax + config-only contract');
  agentSyntax();
  console.log('agent HR = mocked hardener run (backup, user.js, report, idempotence)');
  agentRun();
  if (failed) {
    console.log(`ARCTIC_TEST=FAIL count=${failed}`);
    process.exit(1);
  }
  console.log('ARCTIC_TEST=PASS');
}

main();
