#!/usr/bin/env node
// Snow Leopard 10.6.8 agent tests for lion-mirror.command (ESD boot repair)
// Agent A: syntax / forbidden tokens
// Agent B: mocked 10.6 diskutil/bless/nvram/osascript scenarios
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = 'lion-mirror.command';
const BOOT_LOG = 'lion-boot-log.command';
const ZIP = 'lion-mirror.zip';
const ZIP2 = 'lion-mirror2.zip';
let failed = 0;

function pass(id: string, msg: string): void {
  console.log(`PASS ${id} ${msg}`);
}
function fail(id: string, msg: string): void {
  failed += 1;
  console.log(`FAIL ${id} ${msg}`);
}

function agentA_syntax(): void {
  const text = readFileSync(SCRIPT, 'utf8');
  if (!text.startsWith('#!/bin/sh')) fail('A-shebang', 'need #!/bin/sh');
  else pass('A-shebang', '#!/bin/sh');

  const forbidden: Array<[string, RegExp]> = [
    ['date-2016', /date\s+0101000016/],
    ['date-2015', /date\s+0808111115/],
    ['curl', /\bcurl\b/],
    ['python', /\bpython/],
    ['bash4-lower', /\$\{[A-Za-z_][A-Za-z0-9_]*[,,]{2}/],
    ['dbl-bracket', /\[\[/],
    ['local-kw', /^\s*local\s/m],
    ['mapfile', /\bmapfile\b/],
    ['assoc-array', /declare\s+-A/],
    ['pipefail', /pipefail/],
    ['createinstallmedia', /createinstallmedia/],
    ['asr', /\basr\b/],
    ['erase-bay-4', /Erase Bay 4/],
    ['ditto', /\bditto\b/],
  ];
  for (const [id, re] of forbidden) {
    if (re.test(text)) fail(`A-${id}`, 'forbidden token present');
    else pass(`A-${id}`, 'absent');
  }
  if (!/bless --folder/.test(text)) fail('A-bless', 'missing bless --folder');
  else pass('A-bless', 'bless --folder present');
  if (!/nvram -d/.test(text)) fail('A-nvram', 'missing nvram -d');
  else pass('A-nvram', 'nvram -d present');
  if (!/Repair/.test(text)) fail('A-repair', 'missing Repair confirm');
  else pass('A-repair', 'Repair confirm');
  if (!/start disk clone/.test(text) || !/Lion SSD Base/.test(text)) fail('A-keep', 'missing keep-list');
  else pass('A-keep', 'Bay 1 and Bay 3 named');
  if (!/No disk was erased/.test(text)) fail('A-noerase', 'missing no-erase line');
  else pass('A-noerase', 'no erase');

  const shn = spawnSync('bash', ['-n', SCRIPT], { encoding: 'utf8' });
  if (shn.status !== 0) fail('A-bash-n', shn.stderr);
  else pass('A-bash-n', 'bash -n');
  const posix = spawnSync('bash', ['--posix', '-n', SCRIPT], { encoding: 'utf8' });
  if (posix.status !== 0) fail('A-posix-n', posix.stderr);
  else pass('A-posix-n', 'bash --posix -n');
  const dash = spawnSync('dash', ['-n', SCRIPT], { encoding: 'utf8' });
  if (dash.error) pass('A-dash-n', 'dash not installed — skipped');
  else if (dash.status !== 0) fail('A-dash-n', dash.stderr);
  else pass('A-dash-n', 'dash -n');
}

function agentBootLog_syntax(): void {
  const text = readFileSync(BOOT_LOG, 'utf8');
  if (!text.startsWith('#!/bin/sh')) fail('C-shebang', '#!/bin/sh');
  else pass('C-shebang', '#!/bin/sh');
  const forbidden: Array<[string, RegExp]> = [
    ['C-asr', /\basr\b/],
    ['C-erase', /diskutil\s+erase|erase\s+Bay/i],
    ['C-bless-mutate', /bless\s+--(folder|file|mount)/],
    ['C-nvram-mutate', /nvram\s+-d|nvram\s+[^\n]*=/],
    ['C-mount', /diskutil\s+mount/],
    ['C-rm', /\brm\s/],
    ['C-date-mutate', /date\s+(0101|0808)/],
  ];
  for (const [id, re] of forbidden) {
    if (re.test(text)) fail(id, 'forbidden mutation present');
    else pass(id, 'absent');
  }
  if (!/ROOT_REPORT=.*lion-boot-log\.txt/.test(text)) fail('C-root-report', 'missing root-level report');
  else pass('C-root-report', '/lion-boot-log.txt');
  if (!/sudo cp/.test(text)) fail('C-root-copy', 'missing root copy');
  else pass('C-root-copy', 'sudo cp');
  if (!/dmesg/.test(text) || !/system\.log/.test(text)) fail('C-boot-evidence', 'missing dmesg/system.log');
  else pass('C-boot-evidence', 'dmesg + system.log');
  for (const [id, args] of [['C-bash-n', ['bash', ['-n', BOOT_LOG]]], ['C-posix-n', ['bash', ['--posix', '-n', BOOT_LOG]]], ['C-dash-n', ['dash', ['-n', BOOT_LOG]]]] as const) {
    const r = spawnSync(args[0], args[1], { encoding: 'utf8' });
    if (r.error) pass(id, `${args[0]} not installed — skipped`);
    else if (r.status !== 0) fail(id, r.stderr || 'syntax error');
    else pass(id, `${args[0]} -n`);
  }
}

function write(path: string, body: string, mode = 0o644): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, body, { mode });
}

function infoBlob(name: string, dev: string, proto: string, media: string): string {
  return [
    `   Device Node:              ${dev}`,
    `   Volume Name:              ${name}`,
    `   Protocol:                 ${proto}`,
    `   Media Name:               ${media}`,
    `   File System Personality:  Journaled HFS+`,
    '',
  ].join('\n');
}

function makeMock(root: string, opts: {
  button: string;
  bootName?: string;
  destProto?: string;
  destMedia?: string;
  destName?: string;
  haveEsd?: boolean;
  haveBootEfi?: boolean;
  haveBootPlist?: boolean;
}): void {
  const bin = join(root, 'bin');
  const vols = join(root, 'Volumes');
  const home = join(root, 'home');
  mkdirSync(join(home, 'Desktop'), { recursive: true });
  mkdirSync(join(vols, 'Lion SSD Base'), { recursive: true });
  mkdirSync(join(vols, 'start disk clone'), { recursive: true });
  if (opts.haveEsd !== false) {
    const esd = join(vols, 'Mac OS X Install ESD');
    mkdirSync(join(esd, 'System/Library/CoreServices'), { recursive: true });
    mkdirSync(join(esd, 'Library/Preferences/SystemConfiguration'), { recursive: true });
    if (opts.haveBootEfi !== false) {
      writeFileSync(join(esd, 'System/Library/CoreServices/boot.efi'), 'efi');
      writeFileSync(join(esd, 'boot.efi'), 'efi-root');
    }
    if (opts.haveBootPlist !== false) {
      writeFileSync(join(esd, 'Library/Preferences/SystemConfiguration/com.apple.Boot.plist'), 'plist');
    }
  }

  const bootName = opts.bootName ?? 'Lion SSD Base';
  const destName = opts.destName ?? 'Mac OS X Install ESD';
  const destProto = opts.destProto ?? 'SATA';
  const destMedia = opts.destMedia ?? 'ST2000NM0033-9ZM175';
  write(join(root, 'info-boot.txt'), infoBlob(bootName, '/dev/disk2s2', 'SATA', 'starrt disk clone'));
  write(join(root, 'info-clone.txt'), infoBlob('start disk clone', '/dev/disk3s2', 'SATA', 'CT1000MX500SSD1'));
  write(join(root, 'info-dest.txt'), infoBlob(destName, '/dev/disk0s2', destProto, destMedia));

  write(join(bin, 'diskutil'), `#!/bin/sh
ROOT="${root}"
cmd="$1"
shift
target="$1"
base=\`basename "\$target"\`
case "$cmd" in
  list) echo "mock diskutil list"; exit 0 ;;
  info)
    if [ "\$target" = "/" ] || [ "\$target" = "/dev/disk2s2" ] || [ "\$base" = "Lion SSD Base" ]; then
      cat "\$ROOT/info-boot.txt"
    elif [ "\$target" = "/dev/disk3s2" ] || [ "\$base" = "start disk clone" ]; then
      cat "\$ROOT/info-clone.txt"
    elif [ "\$target" = "/dev/disk0s2" ] || [ "\$base" = "Mac OS X Install ESD" ]; then
      cat "\$ROOT/info-dest.txt"
    else
      printf '%s\\n' "   Volume Name:              Unknown"
      printf '%s\\n' "   Device Node:"
      printf '%s\\n' "   Protocol:                 SATA"
    fi
    exit 0 ;;
  *) echo "mock \$cmd \$*"; exit 0 ;;
esac
`, 0o755);

  write(join(bin, 'rm'), `#!/bin/sh
echo "mock rm $*" >> "${root}/rm.log"
/bin/rm "$@"
`, 0o755);

  write(join(bin, 'nvram'), `#!/bin/sh
echo "mock nvram $*" >> "${root}/nvram.log"
exit 0
`, 0o755);

  write(join(bin, 'bless'), `#!/bin/sh
echo "mock bless $*" >> "${root}/bless.log"
exit 0
`, 0o755);

  write(join(bin, 'osascript'), `#!/bin/sh
printf '%s\\n' "${opts.button}"
exit 0
`, 0o755);

  write(join(bin, 'sudo'), `#!/bin/sh
if [ "$1" = "-v" ]; then exit 0; fi
exec "$@"
`, 0o755);

  write(join(bin, 'sw_vers'), `#!/bin/sh
printf '%s\\n' "ProductName:\tMac OS X"
printf '%s\\n' "ProductVersion:\t10.6.8"
printf '%s\\n' "BuildVersion:\t10K549"
`, 0o755);

  write(join(bin, 'open'), `#!/bin/sh
exit 0
`, 0o755);

  write(join(bin, 'uname'), `#!/bin/sh
if [ "$1" = "-a" ]; then echo "Darwin macpro 10.8.0 Darwin Kernel Version 10.8.0 i386"; else echo Darwin; fi
`, 0o755);

  chmodSync(join(bin, 'diskutil'), 0o755);
  chmodSync(join(bin, 'rm'), 0o755);
  chmodSync(join(bin, 'nvram'), 0o755);
  chmodSync(join(bin, 'bless'), 0o755);
  chmodSync(join(bin, 'osascript'), 0o755);
  chmodSync(join(bin, 'sudo'), 0o755);
  chmodSync(join(bin, 'sw_vers'), 0o755);
  chmodSync(join(bin, 'open'), 0o755);
  chmodSync(join(bin, 'uname'), 0o755);
}

function runScript(root: string): { status: number; out: string } {
  const env = {
    ...process.env,
    PATH: `${join(root, 'bin')}:/bin:/usr/bin`,
    LION_PATH: join(root, 'bin'),
    HOME: join(root, 'home'),
    LION_VOLS: join(root, 'Volumes'),
    LION_SLEEP: '0',
  };
  const r = spawnSync('sh', [join(process.cwd(), SCRIPT)], { encoding: 'utf8', env, timeout: 20000 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  writeFileSync(join(root, 'run.out'), out);
  return { status: r.status ?? 99, out };
}

function agentB_scenarios(): void {
  const cases: Array<{ id: string; opts: Parameters<typeof makeMock>[1]; wantFail: boolean; needles: string[] }> = [
    {
      id: 'B-happy',
      opts: { button: 'Repair' },
      wantFail: false,
      needles: ['sudo OK', 'LOCKED ESD_DEV=/dev/disk0s2', 'boot.efi present', 'operator confirmed Repair', 'bless OK', 'No disk was erased', 'Snow Leopard 10.6.8'],
    },
    {
      id: 'B-cancel',
      opts: { button: 'Cancel' },
      wantFail: true,
      needles: ['operator cancelled', 'No disk was erased'],
    },
    {
      id: 'B-boot-esd',
      opts: { button: 'Repair', bootName: 'Mac OS X Install ESD' },
      wantFail: true,
      needles: ['booted from the installer volume'],
    },
    {
      id: 'B-image',
      opts: { button: 'Repair', destProto: 'Disk Image' },
      wantFail: true,
      needles: ['Mac OS X Install ESD is not mounted'],
    },
    {
      id: 'B-mx500-named-esd',
      opts: { button: 'Repair', destMedia: 'CT1000MX500SSD1' },
      wantFail: true,
      needles: ['MX500'],
    },
    {
      id: 'B-noesd',
      opts: { button: 'Repair', haveEsd: false },
      wantFail: true,
      needles: ['Mac OS X Install ESD is not mounted', 'No disk was erased'],
    },
    {
      id: 'B-nobootefi',
      opts: { button: 'Repair', haveBootEfi: false },
      wantFail: true,
      needles: ['boot.efi missing', 'No disk was erased'],
    },
  ];

  for (const c of cases) {
    const root = mkdtempSync(join(tmpdir(), `lion-sl-${c.id}-`));
    try {
      makeMock(root, c.opts);
      const r = runScript(root);
      const report = existsSync(join(root, 'home/Desktop/lion-mirror.txt'))
        ? readFileSync(join(root, 'home/Desktop/lion-mirror.txt'), 'utf8')
        : '';
      const blob = `${r.out}\n${report}`;
      const failedRun = r.status !== 0 || /FAIL:/.test(blob);
      if (c.wantFail !== failedRun) {
        fail(c.id, `status=${r.status} wantFail=${c.wantFail} tail=${blob.slice(-500)}`);
      } else {
        const missing = c.needles.filter((n) => blob.indexOf(n) < 0);
        if (missing.length) fail(c.id, `missing ${missing.join(' | ')}`);
        else pass(c.id, `status=${r.status}`);
      }
      if (c.id === 'B-cancel' || c.id === 'B-noesd' || c.id === 'B-boot-esd' || c.id === 'B-nobootefi') {
        if (existsSync(join(root, 'bless.log'))) fail(`${c.id}-nobless`, 'bless ran on a refuse/cancel path');
        else pass(`${c.id}-nobless`, 'bless not invoked');
      }
      if (c.id === 'B-happy') {
        const bless = existsSync(join(root, 'bless.log')) ? readFileSync(join(root, 'bless.log'), 'utf8') : '';
        if (bless.indexOf('--folder') < 0 || bless.indexOf('--label') < 0) fail('B-happy-bless', bless);
        else pass('B-happy-bless', 'bless --folder --label');
        const nv = existsSync(join(root, 'nvram.log')) ? readFileSync(join(root, 'nvram.log'), 'utf8') : '';
        if (nv.indexOf('-d') < 0) fail('B-happy-nvram', nv);
        else pass('B-happy-nvram', 'nvram -d');
        const rm = existsSync(join(root, 'rm.log')) ? readFileSync(join(root, 'rm.log'), 'utf8') : '';
        if (rm.indexOf('com.apple.Boot.plist') < 0) fail('B-happy-rm', rm);
        else pass('B-happy-rm', 'removed Boot.plist');
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
}

const PAGE = 'lion.html';

function execEntries(zip: string): { names: string[]; exec: string[] } {
  // zipinfo -l rows are: mode ver host lengthCompr method ratio date time name
  // Parse by whitespace and a unix-mode shape test; a fixed field-count regex broke
  // once because the row is nine fields, not eight.
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
    // owner-execute is the fourth character of the mode string
    if (p[0][3] === 'x') { exec.push(name); }
  }
  return { names, exec };
}

function agentZip(): void {
  // Both zip names carry the SAME bytes on purpose. da.gd/lmz resolves to a jsDelivr
  // branch path that the CDN caches for ~12h, so a cache that has not refreshed must
  // still land the operator the relay page: either name works, and the new name exists
  // so a fresh cache lookup can never serve the pre-page archive.
  const want = [SCRIPT, BOOT_LOG, PAGE];
  for (const z of [ZIP, ZIP2]) {
    if (!existsSync(z)) {
      fail('Z-exists', `${z} missing`);
      continue;
    }
    const { names, exec } = execEntries(z);
    const sorted = names.slice().sort().join(',');
    if (sorted !== want.slice().sort().join(',')) fail(`Z-entries:${z}`, sorted);
    else pass(`Z-entries:${z}`, sorted);
    // Both shell tools are executable; the relay page is not.
    const expectedExec = [SCRIPT, BOOT_LOG].sort().join(',');
    if (exec.slice().sort().join(',') !== expectedExec) fail(`Z-exec:${z}`, exec.join(',') || 'none');
    else pass(`Z-exec:${z}`, 'unix exec bits on repair + boot-log tools');
  }
  const a = execFileSync('sha256sum', [ZIP, ZIP2], { encoding: 'utf8' }).split('\n');
  const hash = (l: string) => l.trim().split(/\s+/)[0];
  if (a.length < 2 || hash(a[0]) !== hash(a[1])) fail('Z-identical', 'the two zips diverged');
  else pass('Z-identical', hash(a[0]).slice(0, 12));
}

function main(): void {
  console.log('agent A = Snow Leopard syntax');
  agentA_syntax();
  console.log('agent B = mocked 10.6.8 ESD repair / refuse paths');
  agentB_scenarios();
  console.log('agent C = read-only root-level post-fallback boot log');
  agentBootLog_syntax();
  console.log('agent Z = zips carry two executable tools, page non-exec');
  agentZip();
  if (failed) {
    console.log(`SL_TEST=FAIL count=${failed}`);
    process.exit(1);
  }
  console.log('SL_TEST=PASS');
}

main();
