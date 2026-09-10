#!/usr/bin/env node
// Snow Leopard 10.6.8 agent tests for lion-mirror.command
// Agent A: syntax / forbidden tokens (bash 4, date-hack, curl)
// Agent B: mocked 10.6 diskutil/asr/bless/osascript scenarios
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = 'lion-mirror.command';
const ZIP = 'lion-mirror.zip';
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
  if (!text.startsWith('#!/bin/sh')) fail('A-shebang', 'need #!/bin/sh') ;
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
  ];
  for (const [id, re] of forbidden) {
    if (re.test(text)) fail(`A-${id}`, 'forbidden token present');
    else pass(`A-${id}`, 'absent');
  }
  if (!/asr restore -source/.test(text)) fail('A-asr', 'missing 10.6 asr -source form');
  else pass('A-asr', '10.6 asr -source present');
  if (!/bless --folder/.test(text)) fail('A-bless', 'missing bless --folder');
  else pass('A-bless', 'bless --folder present');
  if (!/Erase Bay 4/.test(text)) fail('A-confirm', 'missing confirm');
  else pass('A-confirm', 'Erase Bay 4 confirm');
  if (!/start disk clone/.test(text) || !/Lion SSD Base/.test(text)) fail('A-keep', 'missing keep-list');
  else pass('A-keep', 'Bay 1 and Bay 3 named');

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
  haveSource?: boolean;
}): void {
  const bin = join(root, 'bin');
  const vols = join(root, 'Volumes');
  const apps = join(root, 'Applications');
  const home = join(root, 'home');
  mkdirSync(join(home, 'Desktop'), { recursive: true });
  mkdirSync(join(vols, 'Lion SSD Base'), { recursive: true });
  mkdirSync(join(vols, 'start disk clone'), { recursive: true });
  mkdirSync(join(vols, 'Mac OS X Install ESD'), { recursive: true });
  if (opts.haveSource !== false) {
    const dmg = join(apps, 'Install OS X Lion.app/Contents/SharedSupport/InstallESD.dmg');
    mkdirSync(join(dmg, '..'), { recursive: true });
    writeFileSync(dmg, 'fake-installesd');
  }

  const bootName = opts.bootName ?? 'Lion SSD Base';
  const destName = opts.destName ?? 'Mac OS X Install ESD';
  const destProto = opts.destProto ?? 'SATA';
  const destMedia = opts.destMedia ?? 'ST2000NM0033-9ZM175';
  write(join(root, 'info-boot.txt'), infoBlob(bootName, '/dev/disk2s2', 'SATA', 'TOSHIBA DT01ACA200'));
  write(join(root, 'info-clone.txt'), infoBlob('start disk clone', '/dev/disk0s2', 'SATA', 'CT1000MX500SSD1'));
  write(join(root, 'info-dest.txt'), infoBlob(destName, '/dev/disk1s2', destProto, destMedia));
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
    elif [ "\$target" = "/dev/disk0s2" ] || [ "\$base" = "start disk clone" ]; then
      cat "\$ROOT/info-clone.txt"
    elif [ "\$target" = "/dev/disk1s2" ] || [ "\$base" = "Mac OS X Install ESD" ]; then
      cat "\$ROOT/info-dest.txt"
    else
      printf '%s\\n' "   Volume Name:              Unknown"
      printf '%s\\n' "   Device Node:"
      printf '%s\\n' "   Protocol:                 SATA"
    fi
    exit 0 ;;
  unmount|mount) echo "mock \$cmd \$*"; exit 0 ;;
  *) echo "mock diskutil \$cmd \$*"; exit 0 ;;
esac
`, 0o755);

  write(join(bin, 'asr'), `#!/bin/sh
echo "mock asr $*" >> "${root}/asr.log"
VOL="${vols}/Mac OS X Install ESD"
mkdir -p "$VOL/Packages" "$VOL/System/Library/CoreServices"
echo mpkg > "$VOL/Packages/OSInstall.mpkg"
echo efi > "$VOL/System/Library/CoreServices/boot.efi"
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
printf '%s\\n' "ProductName:	Mac OS X"
printf '%s\\n' "ProductVersion:	10.6.8"
printf '%s\\n' "BuildVersion:	10K549"
`, 0o755);

  write(join(bin, 'open'), `#!/bin/sh
exit 0
`, 0o755);

  write(join(bin, 'uname'), `#!/bin/sh
if [ "$1" = "-a" ]; then echo "Darwin macpro 10.8.0 Darwin Kernel Version 10.8.0 i386"; else echo Darwin; fi
`, 0o755);

  chmodSync(join(bin, 'diskutil'), 0o755);
  chmodSync(join(bin, 'asr'), 0o755);
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
    LION_APPS: join(root, 'Applications'),
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
      opts: { button: 'Erase Bay 4' },
      wantFail: false,
      needles: ['sudo OK', 'LOCKED DEST_DEV=/dev/disk1s2', 'boot.efi present', 'operator confirmed Erase Bay 4', 'WITHDRAWN: 2016 clock'],
    },
    {
      id: 'B-cancel',
      opts: { button: 'Cancel' },
      wantFail: true,
      needles: ['operator cancelled', 'No disk was erased'],
    },
    {
      id: 'B-boot-esd',
      opts: { button: 'Erase Bay 4', bootName: 'Mac OS X Install ESD' },
      wantFail: true,
      needles: ['booted from the installer volume'],
    },
    {
      id: 'B-image',
      opts: { button: 'Erase Bay 4', destProto: 'Disk Image' },
      wantFail: true,
      needles: ['no physical volume named Mac OS X Install ESD'],
    },
    {
      id: 'B-mx500-named-esd',
      opts: { button: 'Erase Bay 4', destMedia: 'CT1000MX500SSD1' },
      wantFail: true,
      needles: ['MX500'],
    },
    {
      id: 'B-nosource',
      opts: { button: 'Erase Bay 4', haveSource: false },
      wantFail: true,
      needles: ['InstallESD.dmg not found', 'No disk was erased'],
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
        fail(c.id, `status=${r.status} wantFail=${c.wantFail} tail=${blob.slice(-400)}`);
      } else {
        const missing = c.needles.filter((n) => blob.indexOf(n) < 0);
        if (missing.length) fail(c.id, `missing ${missing.join(' | ')}`);
        else pass(c.id, `status=${r.status}`);
      }
      if (c.id === 'B-cancel' || c.id === 'B-nosource' || c.id === 'B-boot-esd') {
        if (existsSync(join(root, 'asr.log'))) fail(`${c.id}-noasr`, 'asr ran on a refuse/cancel path');
        else pass(`${c.id}-noasr`, 'asr not invoked');
      }
      if (c.id === 'B-happy') {
        const bless = existsSync(join(root, 'bless.log')) ? readFileSync(join(root, 'bless.log'), 'utf8') : '';
        if (bless.indexOf('--label') < 0) fail('B-happy-bless', bless);
        else pass('B-happy-bless', 'bless --label');
        const asr = existsSync(join(root, 'asr.log')) ? readFileSync(join(root, 'asr.log'), 'utf8') : '';
        if (asr.indexOf('-source') < 0 || asr.indexOf('/dev/disk1s2') < 0) fail('B-happy-asr', asr);
        else pass('B-happy-asr', 'asr targeted disk1s2');
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
}

function agentZip(): void {
  if (!existsSync(ZIP)) {
    fail('Z-zip', 'lion-mirror.zip missing');
    return;
  }
  const listing = execFileSync('zipinfo', ['-1', ZIP], { encoding: 'utf8' }).trim().split('\n');
  if (listing.length !== 1 || listing[0] !== SCRIPT) fail('Z-onefile', listing.join(','));
  else pass('Z-onefile', SCRIPT);
  const info = execFileSync('zipinfo', ['-l', ZIP], { encoding: 'utf8' });
  if (!/-rwx/.test(info)) fail('Z-exec', info);
  else pass('Z-exec', 'unix exec bit');
}

function main(): void {
  console.log('agent A = Snow Leopard syntax');
  agentA_syntax();
  console.log('agent B = mocked 10.6.8 asr / refuse paths');
  agentB_scenarios();
  console.log('agent Z = zip is one script');
  agentZip();
  if (failed) {
    console.log(`SL_TEST=FAIL count=${failed}`);
    process.exit(1);
  }
  console.log('SL_TEST=PASS');
}

main();
