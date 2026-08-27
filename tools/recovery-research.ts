#!/usr/bin/env node
/**
 * Reproducible, bounded recovery research fan-out.
 *
 * The tool launches exactly 80 logical research agents in one Promise.all wave. Each
 * agent owns one fixed source URL and one narrow question. Network safety is enforced
 * independently of the fan-out: only allowlisted hosts are fetched, redirects cannot
 * leave the allowlist, bodies are capped, timeouts are finite, and each host has a
 * small concurrency limit. The result records hashes and evidence snippets so a later
 * run can distinguish a source change from an interpretation change.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const AGENT_COUNT = 80;
const MAX_HOST_CONCURRENCY = 4;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 600_000;
const DEFAULT_MAX_CHARS = 18_000;
const USER_AGENT = 'arena-recovery-research/1.0 (+reproducible bounded source audit)';

type SourceKind = 'primary' | 'community' | 'vendor' | 'api';
type AgentSpec = {
  id: string;
  lane: string;
  question: string;
  url: string;
  keywords: string[];
  kind: SourceKind;
};
type Evidence = { score: number; text: string; hits: string[] };
type AgentResult = {
  id: string;
  lane: string;
  question: string;
  url: string;
  kind: SourceKind;
  status: number;
  finalUrl: string;
  contentType: string;
  bytes: number;
  sha256: string;
  title: string;
  quality: 'primary' | 'community' | 'vendor' | 'api' | 'blocked' | 'error';
  outcome: 'useful' | 'empty' | 'blocked' | 'error';
  trapSignals: string[];
  evidence: Evidence[];
  error?: string;
};

type Lane = {
  name: string;
  question: string;
  keywords: string[];
  kind: SourceKind;
  urls: string[];
};

const ALLOWED_HOSTS = new Set([
  'api.github.com',
  'avsforum.com',
  'corsair.com',
  'coreboot.org',
  'docs.kernel.org',
  'documentation.ubuntu.com',
  'elevenforum.com',
  'evga.com',
  'flashrom.org',
  'flathub.org',
  'freedesktop.org',
  'formfactors.org',
  'fwupd.github.io',
  'github.com',
  'hardwareluxx.de',
  'intel.com',
  'kernel.org',
  'linuxfoundation.org',
  'man7.org',
  'microsoft.com',
  'manualslib.com',
  'msi.com',
  'overclockers.com',
  'reddit.com',
  'superuser.com',
  'tianocore.org',
  'tomshardware.com',
  'uefi.org',
  'www.avsforum.com',
  'www.corsair.com',
  'www.elevenforum.com',
  'www.evga.com',
  'www.freedesktop.org',
  'www.formfactors.org',
  'www.intel.com',
  'www.msi.com',
  'www.reddit.com',
  'www.superuser.com',
  'www.tomshardware.com',
  'www.uefi.org',
]);

const BOILERPLATE = [
  /create an account/i,
  /sign in/i,
  /cookie(?:s| policy)?/i,
  /mark as new/i,
  /bookmark/i,
  /subscribe/i,
  /permalink/i,
  /flag post/i,
  /all rights reserved/i,
];

const TRAP_RULES: Array<[string, RegExp]> = [
  ['support-escalation', /contact (?:hp|support|a technician|a service center)|call (?:support|this number)/i],
  ['commercial-cta', /buy now|shop now|affiliate|sponsored|coupon|best price/i],
  ['generic-checklist', /restart your computer|update your drivers|run diagnostics|try a different (?:cable|outlet|psu)/i],
  ['credential-wall', /create an account|sign in to continue|log in to view/i],
  ['seo-filler', /in this comprehensive guide|ultimate guide|you have come to the right place/i],
];

const LANES: Lane[] = [
  {
    name: 'uefi-varstore',
    question: 'What does the UEFI variable store actually persist, and can CMOS clearing affect it?',
    keywords: ['efivarfs', 'variable store', 'varstore', 'SPI', 'non-volatile', 'POST', 'CMOS'],
    kind: 'primary',
    urls: [
      'https://docs.kernel.org/filesystems/efivarfs.html',
      'https://uefi.org/specs/UEFI/2.10/03_Boot_Manager.html',
      'https://uefi.org/specs/UEFI/2.10/08_Services_Runtime_Services.html',
      'https://github.com/tianocore/edk2/blob/master/MdeModulePkg/Universal/Variable/RuntimeDxe/VariableDxe.c',
      'https://github.com/tianocore/edk2/blob/master/MdeModulePkg/Universal/Variable/RuntimeDxe/Variable.h',
      'https://github.com/datasone/grub-mod-setup_var',
      'https://github.com/dreamwhite/bios-extraction-guide/blob/master/setup_var.efi.md',
      'https://man7.org/linux/man-pages/man8/efibootmgr.8.html',
    ],
  },
  {
    name: 'spi-firmware',
    question: 'What is the boundary between a firmware-image rewrite, a setup-varstore write, and an external SPI read/write?',
    keywords: ['flashrom', 'SPI', 'descriptor', 'ME', 'UEFI', 'varstore', 'backup', 'write-protect'],
    kind: 'primary',
    urls: [
      'https://flashrom.org/',
      'https://github.com/flashrom/flashrom',
      'https://github.com/flashrom/flashrom/blob/main/README.md',
      'https://github.com/chipsec/chipsec',
      'https://github.com/chipsec/chipsec/wiki',
      'https://github.com/LongSoft/UEFITool',
      'https://github.com/linuxboot/fiano',
      'https://github.com/IntelSecurity/chipsec',
    ],
  },
  {
    name: 'boot-recovery',
    question: 'Which recovery mechanisms run before normal POST, and what observable activity proves they ran?',
    keywords: ['boot block', 'recovery', 'capsule', 'USB', 'POST', 'firmware', 'flash', 'EFI'],
    kind: 'primary',
    urls: [
      'https://github.com/Rixmerz/hp-omen-bios-flash-linux',
      'https://github.com/Rixmerz/hp-omen-bios-flash-linux/blob/main/README.md',
      'https://github.com/Rixmerz/hp-omen-bios-flash-linux/blob/main/scripts/extract-softpaq.sh',
      'https://github.com/Rixmerz/hp-omen-bios-flash-linux/blob/main/scripts/make-bios-usb.sh',
      'https://github.com/Ocean-Moist/hp-bios-flash-linux',
      'https://github.com/Ocean-Moist/hp-bios-flash-linux/blob/main/docs/how-it-works.md',
      'https://github.com/Ocean-Moist/hp-bios-flash-linux/blob/main/scripts/make-capsule.sh',
      'https://github.com/Ocean-Moist/hp-bios-flash-linux/blob/main/src/fwflash.c',
    ],
  },
  {
    name: 'power-control',
    question: 'What do an immediate power drop and an automatic AC-start cycle say about PS_ON, protection, EC, or board sequencing?',
    keywords: ['PS_ON', 'power cycle', 'protection', 'short', 'PSU', 'ATX', 'POST', 'shutdown'],
    kind: 'primary',
    urls: [
      'https://www.corsair.com/us/en/explorer/diy-builder/power-supply-units/what-is-ps_on/',
      'https://www.evga.com/support/faq/FAQdetails.aspx?faqid=58462',
      'https://www.msi.com/support/technical_details/MB_Boot_RepeatOnOff',
      'https://forums.tomshardware.com/threads/pc-starts-for-half-a-second-then-turns-off-help.3511078/',
      'https://forums.tomshardware.com/threads/psu-powers-on-for-1-second-then-turns-off.3695430/',
      'https://www.elevenforum.com/t/pc-powering-on-for-1-second-then-turning-off-and-repeating.16154/',
      'https://www.avsforum.com/threads/motherboard-immediately-powers-off-why.220351/',
      'https://superuser.com/questions/1792437/4pin-cpu-connectors-on-hp-omen-45l',
    ],
  },
  {
    name: 'omen-peer-1',
    question: 'What do independent OMEN 40L/45L reports reveal about identical power loops, beeps, BIOS revisions, and BBR?',
    keywords: ['OMEN', '45L', '40L', '8917', 'BlizzardOC', 'beep', 'power cycle', 'BBR'],
    kind: 'community',
    urls: [
      'https://www.reddit.com/r/HPOmen/comments/1h7nmk3/hp_omen_turning_offon/',
      'https://www.reddit.com/r/HPOmen/comments/123523c/hp_omen_45l_psu_replacement/',
      'https://www.reddit.com/r/HPOmen/comments/17j53iw/omen_45l_safe_to_update_bios/',
      'https://www.reddit.com/r/HPOmen/comments/vazg1j/hp_omen_with_bad_bios_flash_recovery/',
      'https://www.reddit.com/r/HPOmen/comments/v93d6x/hp_omen_wont_display_bioscmos_issue_not_resolved/',
      'https://www.reddit.com/r/HPOmen/comments/16tfiep/omen_45l_any_issues_what_has_been_your_experience/',
      'https://www.overclockers.com/forums/threads/trying-to-unlock-and-overclock-my-hp-45l-pc-however-many-of-the-power-settings-are-being-locked-limited-by-hp-is-there-a-way-to-get-around-this.802885/',
      'https://www.hardwareluxx.de/community/threads/hp-omen-hp-oasis-mainboard-z590h-ursache-gefunden-warum-bios-nicht-aufrufbar-kann-mir-das-jemand-erkl%C3%A4ren.1338551/',
    ],
  },
  {
    name: 'recovery-peer-2',
    question: 'What non-vendor reports distinguish a successful BBR/recovery read from a dead USB attempt?',
    keywords: ['BBR', 'BIOS recovery', 'Win+B', 'Win+V', 'USB', 'beep', 'LED', 'jumper'],
    kind: 'community',
    urls: [
      'https://www.reddit.com/r/GeekSquad/comments/17t9e5m/hp_omen_looping_on_start_up_not_posting_replaced/',
      'https://www.reddit.com/r/HPOmen/comments/1ej0zdx/bios_update_just_bricked_my_45l_now_what/',
      'https://www.elevenforum.com/t/hp-bios-recovery-fails.10819/',
      'https://www.reddit.com/r/HPOmen/comments/1aue2p4/will_my_hp_45l_support_an_i9_cpu_upgrade/',
      'https://www.reddit.com/r/Hewlett_Packard/comments/gq03jg/help_how_can_i_fix_incompatible_power_source/',
      'https://forums.tomshardware.com/threads/motherboard-shuts-off-immediately-after-being-turned-on-expert-help-needed.3417736/',
      'https://www.reddit.com/r/techsupport/comments/jc7oh6/stupid_hp_bios_boot_from_usb_not_found/',
      'https://www.reddit.com/r/HPOmen/comments/1fi10ne/hp_omen_obelisk_desktop_stuck_on_omen_logo_or/',
    ],
  },
  {
    name: 'intel-platform',
    question: 'Which Intel platform facts constrain this diagnosis: 12700KF memory training, Z690 reset, ATX power, and CPU/GPU requirements?',
    keywords: ['12700KF', 'Z690', 'DDR4', 'memory training', 'ATX', 'power', 'reset', 'integrated graphics'],
    kind: 'primary',
    urls: [
      'https://www.intel.com/content/www/us/en/products/sku/134599/intel-core-i712700kf-processor-25m-cache-up-to-4-90-ghz/specifications.html',
      'https://www.intel.com/content/www/us/en/products/sku/218831/intel-z690-chipset/specifications.html',
      'https://www.intel.com/content/www/us/en/support/articles/000005721/server-products.html',
      'https://www.intel.com/content/dam/www/public/us/en/documents/guides/power-supply-design-guide.pdf',
      'https://www.formfactors.org/developer/specs/atx2_2.pdf',
      'https://www.formfactors.org/developer/specs/atx12v_psdg2_0_public_br2.pdf',
      'https://github.com/Intel-BMC/openbmc',
      'https://github.com/platomav/MEAnalyzer/wiki',
    ],
  },
  {
    name: 'linux-efi',
    question: 'What can Linux observe or safely change in EFI state, and what is explicitly not equivalent to setup-variable repair?',
    keywords: ['efibootmgr', 'efivar', 'EFI', 'runtime', 'read-only', 'BootNext', 'BootOrder', 'SMM'],
    kind: 'primary',
    urls: [
      'https://www.kernel.org/doc/html/latest/admin-guide/efi-stub.html',
      'https://www.freedesktop.org/wiki/Software/efibootmgr/',
      'https://github.com/rhboot/efibootmgr',
      'https://github.com/rhboot/efivar',
      'https://github.com/rhboot/shim',
      'https://github.com/systemd/systemd',
      'https://github.com/efibootguard/efibootguard',
      'https://github.com/systemd/systemd/blob/main/src/boot/efi/efi-entry.c',
    ],
  },
  {
    name: 'firmware-analysis',
    question: 'What tools and artifacts can identify a real setup/varstore/ME/Boot Guard boundary without blindly writing anything?',
    keywords: ['UEFI', 'BIOS', 'varstore', 'IFR', 'ME', 'Boot Guard', 'descriptor', 'read'],
    kind: 'primary',
    urls: [
      'https://github.com/platomav/BIOSUtilities',
      'https://github.com/platomav/MEAnalyzer',
      'https://github.com/LongSoft/UEFITool_NE',
      'https://github.com/corna/me_cleaner',
      'https://github.com/0x6d696368/uefi-firmware-parser',
      'https://github.com/nsacyber/BootGuard',
      'https://github.com/IntelSecurity/chipsec/blob/main/README.md',
      'https://github.com/Cr4sh/UEFI-Repair',
    ],
  },
  {
    name: 'github-query',
    question: 'What concrete code, issue, or discussion evidence exists for this exact failure shape?',
    keywords: ['FDO', 'BBR', 'BlizzardOC', 'Omen', 'efivarfs', 'setup_var', 'PS_ON', 'recovery'],
    kind: 'api',
    urls: [
      'https://api.github.com/search/issues?q=%22FDO%2FPSWD%2FBBR%22',
      'https://api.github.com/search/issues?q=%22BlizzardOC%22',
      'https://api.github.com/search/issues?q=%22HP+Omen%22+%22BIOS+recovery%22',
      'https://api.github.com/search/issues?q=efivarfs+%22fail+to+POST%22',
      'https://api.github.com/search/issues?q=setup_var+%22no+POST%22',
      'https://api.github.com/search/issues?q=flashrom+%22HP+Omen%22',
      'https://api.github.com/search/issues?q=%22PS_ON%22+%22power+cycle%22+motherboard',
      'https://api.github.com/search/issues?q=BBR+%22BIOS+recovery%22+jumper',
    ],
  },
];

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function hostOf(url: string): string {
  return new URL(url).hostname.toLowerCase();
}

function allowedHost(host: string): boolean {
  if (ALLOWED_HOSTS.has(host)) return true;
  for (const allowed of ALLOWED_HOSTS) {
    if (host.endsWith(`.${allowed}`)) return true;
  }
  return false;
}

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function numberOption(name: string, fallback: number, minimum: number, maximum: number): number {
  const raw = option(name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`--${name} must be between ${minimum} and ${maximum}`);
  }
  return Math.floor(value);
}

function buildAgents(): AgentSpec[] {
  const agents: AgentSpec[] = [];
  for (const lane of LANES) {
    for (const url of lane.urls) {
      const ordinal = agents.length + 1;
      agents.push({
        id: `research-${String(ordinal).padStart(3, '0')}`,
        lane: lane.name,
        question: lane.question,
        url,
        keywords: lane.keywords,
        kind: lane.kind,
      });
    }
  }
  if (agents.length !== AGENT_COUNT) {
    throw new Error(`agent manifest has ${agents.length} entries; expected exactly ${AGENT_COUNT}`);
  }
  const ids = new Set(agents.map((agent) => agent.id));
  if (ids.size !== AGENT_COUNT) throw new Error('agent IDs are not unique');
  const urls = new Set(agents.map((agent) => agent.url));
  if (urls.size !== AGENT_COUNT) throw new Error('agent URLs are not unique');
  return agents;
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  };
  return value
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, digits: string) => String.fromCodePoint(parseInt(digits, 16)))
    .replace(/&([a-z]+);/gi, (whole, name: string) => named[name.toLowerCase()] ?? whole);
}

function htmlText(html: string): { title: string; text: string } {
  const title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim());
  const text = decodeEntities(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|pre|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
  return { title, text };
}

function isSelfReference(value: unknown): boolean {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return /mistuhman\/nvidia-intel-ocblizzard|nvidia-intel-ocblizzard/i.test(text);
}

function jsonText(body: string): { title: string; text: string } {
  try {
    const value = JSON.parse(body) as Record<string, unknown>;
    if (Array.isArray(value.items)) {
      const items = value.items
        .filter((item) => !isSelfReference(item))
        .map((item) => {
          const row = item as Record<string, unknown>;
          const repository = row.repository as Record<string, unknown> | undefined;
          const repositoryUrl = typeof row.repository_url === 'string' ? row.repository_url : '';
          const title = typeof row.title === 'string' ? row.title : '';
          const repoName = typeof repository?.full_name === 'string'
            ? repository.full_name
            : repositoryUrl.replace(/^https:\/\/api\.github\.com\/repos\//, '');
          const state = typeof row.state === 'string' ? row.state : '';
          const body = typeof row.body === 'string' ? row.body.slice(0, 8_000) : '';
          const comments = typeof row.comments === 'number' ? row.comments : 0;
          return `REPOSITORY: ${repoName}\nTITLE: ${title}\nSTATE: ${state}\nCOMMENTS: ${comments}\nBODY:\n${body}`;
        });
      return {
        title: 'GitHub search results',
        text: `TOTAL_RESULTS: ${value.total_count ?? items.length}\n${items.join('\n---\n')}`,
      };
    }
    const fullName = typeof value.full_name === 'string' ? value.full_name : '';
    const name = typeof value.name === 'string' ? value.name : '';
    const description = typeof value.description === 'string' ? value.description : '';
    const topics = Array.isArray(value.topics) ? value.topics.filter((topic) => typeof topic === 'string').join(', ') : '';
    const branch = typeof value.default_branch === 'string' ? value.default_branch : '';
    return {
      title: name,
      text: `REPOSITORY: ${fullName}\nNAME: ${name}\nDESCRIPTION: ${description}\nTOPICS: ${topics}\nDEFAULT_BRANCH: ${branch}`,
    };
  } catch {
    return { title: '', text: body };
  }
}

function trimBoilerplate(text: string): string {
  return text.split('\n').filter((line) => {
    if (!line.trim()) return false;
    return !BOILERPLATE.some((pattern) => pattern.test(line));
  }).join('\n');
}

function trapSignals(text: string): string[] {
  return TRAP_RULES.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

function qualityFor(kind: SourceKind, url: string): AgentResult['quality'] {
  if (kind === 'api') return 'api';
  const host = hostOf(url);
  if (host === 'h30434.www3.hp.com' || host.endsWith('.hp.com')) return 'vendor';
  if (kind === 'community') return 'community';
  return 'primary';
}

function extractEvidence(text: string, keywords: string[], maxChars: number): Evidence[] {
  const fragments = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|(?<=:)\s+/)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length >= 35 && fragment.length <= 800);
  const rows: Evidence[] = [];
  for (const fragment of fragments) {
    const hits = keywords.filter((keyword) => fragment.toLowerCase().includes(keyword.toLowerCase()));
    const technical = ['POST', 'SPI', 'UEFI', 'BIOS', 'EC', 'SMM', 'USB', 'PS_ON', 'BBR', 'FDO', 'varstore']
      .filter((term) => fragment.toLowerCase().includes(term.toLowerCase()));
    const score = hits.length * 3 + technical.length * 2 - (fragment.length > 500 ? 1 : 0);
    if (hits.length > 0 && score > 3) rows.push({ score, text: fragment.slice(0, maxChars), hits });
  }
  const unique = new Map<string, Evidence>();
  for (const row of rows.sort((a, b) => b.score - a.score || a.text.localeCompare(b.text))) {
    if (!unique.has(row.text)) unique.set(row.text, row);
  }
  return [...unique.values()].slice(0, 8);
}

class HostLimiter {
  private readonly active = new Map<string, number>();
  private readonly queues = new Map<string, Array<() => void>>();

  async run<T>(host: string, task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queue = this.queues.get(host) ?? [];
      queue.push(() => {
        this.active.set(host, (this.active.get(host) ?? 0) + 1);
        task().then(resolve, reject).finally(() => {
          this.active.set(host, (this.active.get(host) ?? 1) - 1);
          this.drain(host);
        });
      });
      this.queues.set(host, queue);
      this.drain(host);
    });
  }

  private drain(host: string): void {
    const queue = this.queues.get(host);
    if (!queue) return;
    while ((this.active.get(host) ?? 0) < MAX_HOST_CONCURRENCY && queue.length > 0) {
      queue.shift()?.();
    }
    if (queue.length === 0) this.queues.delete(host);
  }
}

async function readCapped(response: Response, maxBytes: number): Promise<{ body: string; bytes: number }> {
  if (!response.body) {
    const body = await response.text();
    const bytes = Buffer.byteLength(body);
    if (bytes > maxBytes) throw new Error(`body exceeds ${maxBytes} bytes`);
    return { body, bytes };
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = '';
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error(`body exceeds ${maxBytes} bytes`);
    }
    body += decoder.decode(part.value, { stream: true });
  }
  body += decoder.decode();
  return { body, bytes };
}

function githubEndpoint(url: string): { endpoint: string; raw: boolean } {
  const parsed = new URL(url);
  if (parsed.hostname.toLowerCase() === 'api.github.com') {
    return { endpoint: `${parsed.pathname.replace(/^\//, '')}${parsed.search}`, raw: false };
  }
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 2) throw new Error(`GitHub URL has no repository: ${url}`);
  const owner = parts[0];
  const repo = parts[1];
  if (parts[2] === 'blob' && parts.length >= 5) {
    const branch = parts[3];
    const path = parts.slice(4).map((part) => encodeURIComponent(part)).join('/');
    return { endpoint: `repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`, raw: true };
  }
  return { endpoint: `repos/${owner}/${repo}`, raw: false };
}

async function fetchGithubWithGh(url: string, timeoutMs: number, maxBytes: number): Promise<{
  status: number;
  finalUrl: string;
  contentType: string;
  body: string;
  bytes: number;
}> {
  const parsed = new URL(url);
  if (!allowedHost(parsed.hostname.toLowerCase())) throw new Error(`blocked GitHub host: ${parsed.hostname}`);
  const target = githubEndpoint(url);
  const args = ['api', target.endpoint, '--header', target.raw ? 'Accept: application/vnd.github.raw' : 'Accept: application/vnd.github+json'];
  const result = await execFileAsync('gh', args, { timeout: timeoutMs, maxBuffer: maxBytes + 4_096 });
  const body = result.stdout;
  const bytes = Buffer.byteLength(body);
  if (bytes > maxBytes) throw new Error(`GitHub response exceeds ${maxBytes} bytes`);
  return {
    status: 200,
    finalUrl: url,
    contentType: target.raw ? 'text/plain' : 'application/json',
    body,
    bytes,
  };
}

async function fetchSafe(url: string, timeoutMs: number, maxBytes: number): Promise<{
  status: number;
  finalUrl: string;
  contentType: string;
  body: string;
  bytes: number;
}> {
  const host = hostOf(url);
  if (host === 'github.com' || host === 'api.github.com') return fetchGithubWithGh(url, timeoutMs, maxBytes);
  let current = url;
  for (let hop = 0; hop <= 3; hop += 1) {
    const parsed = new URL(current);
    if (parsed.protocol !== 'https:' || !allowedHost(parsed.hostname.toLowerCase())) {
      throw new Error(`blocked host or protocol: ${current}`);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          accept: 'text/html,application/json,text/plain,application/pdf;q=0.2,*/*;q=0.1',
          'user-agent': USER_AGENT,
        },
      });
    } finally {
      clearTimeout(timer);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`redirect without location (${response.status})`);
      current = new URL(location, current).toString();
      continue;
    }
    const type = response.headers.get('content-type') ?? '';
    const { body, bytes } = await readCapped(response, maxBytes);
    return { status: response.status, finalUrl: current, contentType: type, body, bytes };
  }
  throw new Error('redirect limit exceeded');
}

function emptyResult(agent: AgentSpec, outcome: AgentResult['outcome'], error: string, quality: AgentResult['quality']): AgentResult {
  return {
    id: agent.id,
    lane: agent.lane,
    question: agent.question,
    url: agent.url,
    kind: agent.kind,
    status: 0,
    finalUrl: agent.url,
    contentType: '',
    bytes: 0,
    sha256: '',
    title: '',
    quality,
    outcome,
    trapSignals: [],
    evidence: [],
    error,
  };
}

async function runAgent(agent: AgentSpec, limiter: HostLimiter, timeoutMs: number, maxBytes: number, maxChars: number): Promise<AgentResult> {
  let initialHost = '';
  try {
    initialHost = hostOf(agent.url);
    if (!allowedHost(initialHost)) return emptyResult(agent, 'blocked', `host not allowlisted: ${initialHost}`, 'blocked');
  } catch (error) {
    return emptyResult(agent, 'error', String(error), 'error');
  }
  try {
    const fetched = await limiter.run(initialHost, () => fetchSafe(agent.url, timeoutMs, maxBytes));
    const quality = qualityFor(agent.kind, fetched.finalUrl);
    if (fetched.status < 200 || fetched.status > 299) {
      return { ...emptyResult(agent, 'blocked', `HTTP ${fetched.status}`, quality), status: fetched.status, finalUrl: fetched.finalUrl, contentType: fetched.contentType, bytes: fetched.bytes, sha256: sha256(fetched.body) };
    }
    const parsed = fetched.contentType.includes('json') || agent.kind === 'api'
      ? jsonText(fetched.body)
      : fetched.contentType.includes('text/plain')
        ? { title: '', text: fetched.body }
        : fetched.contentType.includes('html') || fetched.contentType === ''
          ? htmlText(fetched.body)
          : { title: '', text: '' };
    const cleaned = trimBoilerplate(parsed.text);
    const signals = trapSignals(cleaned);
    const evidence = extractEvidence(cleaned, agent.keywords, maxChars);
    const outcome: AgentResult['outcome'] = parsed.text.length === 0 ? 'empty' : evidence.length > 0 ? 'useful' : 'empty';
    return {
      id: agent.id,
      lane: agent.lane,
      question: agent.question,
      url: agent.url,
      kind: agent.kind,
      status: fetched.status,
      finalUrl: fetched.finalUrl,
      contentType: fetched.contentType,
      bytes: fetched.bytes,
      sha256: sha256(cleaned),
      title: parsed.title.slice(0, 300),
      quality,
      outcome,
      trapSignals: signals,
      evidence,
    };
  } catch (error) {
    return emptyResult(agent, 'error', String(error), 'error');
  }
}

function planReport(agents: AgentSpec[]): Record<string, unknown> {
  const manifest = JSON.stringify(agents);
  return {
    agentCount: agents.length,
    concurrencyWave: 'Promise.all: exactly one task per manifest entry',
    maxHostConcurrency: MAX_HOST_CONCURRENCY,
    allowlistedHostCount: ALLOWED_HOSTS.size,
    manifestSha256: sha256(manifest),
    agents,
  };
}

function researchSummary(results: AgentResult[]): Record<string, unknown> {
  const useful = results.filter((result) => result.outcome === 'useful');
  const evidenceRows = useful.flatMap((result) => result.evidence.map((item) => ({
    id: result.id,
    lane: result.lane,
    quality: result.quality,
    url: result.finalUrl,
    score: item.score,
    hits: item.hits,
    text: item.text,
  }))).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const seen = new Set<string>();
  const evidence = evidenceRows.filter((row) => {
    const key = row.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 30);
  return {
    agentsCompleted: results.length,
    usefulSources: useful.length,
    emptySources: results.filter((result) => result.outcome === 'empty').length,
    blockedSources: results.filter((result) => result.outcome === 'blocked').length,
    erroredSources: results.filter((result) => result.outcome === 'error').length,
    sourcesWithTrapSignals: results.filter((result) => result.trapSignals.length > 0).length,
    evidence,
  };
}

function writeOutput(path: string, value: unknown): void {
  mkdirSync(path.replace(/\/[^/]*$/, '') || '.', { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function main(): Promise<void> {
  const agents = buildAgents();
  const plan = process.argv.includes('--plan');
  const outputPath = option('out');
  if (plan) {
    const report = planReport(agents);
    if (outputPath) writeOutput(outputPath, report);
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const timeoutMs = numberOption('timeout', DEFAULT_TIMEOUT_MS, 1_000, 120_000);
  const maxBytes = numberOption('max-bytes', DEFAULT_MAX_BYTES, 10_000, 5_000_000);
  const maxChars = numberOption('max-chars', DEFAULT_MAX_CHARS, 200, 100_000);
  const summaryOnly = process.argv.includes('--summary');
  const limiter = new HostLimiter();
  const startedAt = new Date().toISOString();
  // This is intentionally one wave: the manifest is fixed at exactly 80 logical agents.
  const results = await Promise.all(agents.map((agent) => runAgent(agent, limiter, timeoutMs, maxBytes, maxChars)));
  const report = {
    tool: 'recovery-research',
    version: 1,
    startedAt,
    completedAt: new Date().toISOString(),
    agentCount: agents.length,
    concurrencyWave: 'Promise.all: exactly one task per manifest entry',
    timeoutMs,
    maxBytes,
    maxChars,
    maxHostConcurrency: MAX_HOST_CONCURRENCY,
    manifestSha256: sha256(JSON.stringify(agents)),
    summary: researchSummary(results),
    results,
  };
  if (outputPath) writeOutput(outputPath, report);
  const printed = summaryOnly
    ? { tool: report.tool, version: report.version, startedAt: report.startedAt, completedAt: report.completedAt, agentCount: report.agentCount, manifestSha256: report.manifestSha256, summary: report.summary }
    : report;
  console.log(JSON.stringify(printed, null, 2));
}

main().catch((error) => {
  console.error(`recovery-research: ${String(error)}`);
  process.exitCode = 1;
});
