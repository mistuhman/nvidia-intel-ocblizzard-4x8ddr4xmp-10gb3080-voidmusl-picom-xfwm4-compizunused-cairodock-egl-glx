#!/usr/bin/env node
/**
 * lion-phone-agent.ts — TypeScript agent factory for Lion SSD boot fix
 * 
 * Purpose: produce bounded agents each time that have jobs to make scripts
 * executable on ANY machine with a functioning browser + internet (phone, Snow Leopard Mac with Arctic Fox, etc.)
 * 
 * Usage:
 *   node tools/lion-phone-agent.ts --objective=lion-ssd-fast
 *   node tools/lion-phone-agent.ts --objective=lion-ssd-fast --serve=8000
 * 
 * Outputs:
 *   - JSON agent list to stdout (for merging receipts)
 *   - Generates phone-executable artifacts in repo root:
 *     - lion-phone.html (direct download page, works on phone browser)
 *     - lion-phone-download.sh / .command (curl/wget fallback)
 *     - lion-log-upload.command (Mac log uploader to termbin + gist)
 *     - lion-short-link.txt (shortened mirror link for Arctic Fox)
 *     - phone-mirror-server.js (static server for live preview)
 * 
 * Design: each agent = one job, one source set, one verification target.
 * Phone debug = log return must be easy: HTML textarea + POST to /upload,
 * or shell one-liner that pastes to termbin.com (nc termbin.com 9999) and returns URL.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

type Agent = {
  id: string;
  task: string;
  method: string;
  inputs: string[];
  output: string;
  gate: string;
  phoneExecutable: string;
};

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find(x => x.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function readText(path: string): string {
  try { return readFileSync(path, 'utf8'); } catch { return ''; }
}

const objective = arg('objective') ?? 'lion-ssd-fast';
const servePort = parseInt(arg('serve') ?? '0', 10);

// Base URLs — raw GitHub (works in Arctic Fox 47.3, TLS 1.2) + jsDelivr mirror + da.gd short links (tinyurl fails on Arctic)
// Short links created via fetch_page da.gd — simple HTML, no heavy JS, works on Firefox 45 / Arctic Fox
const SHORT_DAGD_RAW = 'https://da.gd/mOycI'; // raw GitHub
const SHORT_DAGD_JSD = 'https://da.gd/XeHlN'; // jsDelivr fix
const SHORT_DAGD_PACK = 'https://da.gd/gOvc2'; // full phone debug pack
const SHORT_CLCK_RAW = 'https://clck.ru/3Vjn94';
const SHORT_CLCK_JSD = 'https://clck.ru/3VjnBe';
const RAW_URL = 'https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip';
const JSD_URL = 'https://cdn.jsdelivr.net/gh/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx@arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip';
const GH_UI_URL = 'https://github.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/raw/arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip';

// Agents — each has a job to make a phone-executable script
const agents: Agent[] = [
  {
    id: 'context',
    task: 'Reduce lion-ssd objective to current facts: Mac Pro 1,1 Bay1 Snow Leopard, Bay3 Crucial MX500 target, Bay4 InstallESD, old injector failed (lion-cli.log absent)',
    method: 'read README.md, MASTER.md, docs/session-2026-09-09-lion-ssd-install.md, git log',
    inputs: ['README.md', 'MASTER.md', 'docs/session-2026-09-09-lion-ssd-install.md'],
    output: 'fact list with receipts, no guessing',
    gate: 'every claim traced to path or command output',
    phoneExecutable: 'none — context only'
  },
  {
    id: 'phone-download-page',
    task: 'Create lion-phone.html — single HTML file with direct download buttons for fix ZIP, works on any browser (phone, Arctic Fox 47.3 mac32, TenSixFox)',
    method: 'write HTML with <a download> links to RAW_URL, JSD_URL, and live preview placeholder; no external JS; works offline after save',
    inputs: [RAW_URL, JSD_URL],
    output: 'lion-phone.html',
    gate: 'file exists, contains both URLs, opens in browser without JS',
    phoneExecutable: 'lion-phone.html — double-click or open in Arctic Fox/phone browser, tap download'
  },
  {
    id: 'phone-download-sh',
    task: 'Create lion-phone-download.sh and .command — shell one-liners that fetch ZIP via curl/wget, bypassing Safari TLS 1.0 failure, for Snow Leopard Mac',
    method: 'write POSIX sh script with curl -L -o ~/Downloads/fix.zip RAW_URL || wget fallback, plus xattr -cr and unzip; chmod +x',
    inputs: [RAW_URL],
    output: 'lion-phone-download.sh + lion-phone-download.command',
    gate: 'bash -n passes, executable bit set, works with curl 7.19 (Snow Leopard) and modern curl',
    phoneExecutable: 'lion-phone-download.command — double-click on Snow Leopard, or sh lion-phone-download.sh on any Unix'
  },
  {
    id: 'log-uploader',
    task: 'Create lion-log-upload.command — Mac script that finds ~/Desktop/lion-*.txt and uploads to termbin.com (nc) and gist.github.com (curl), prints return URLs for phone copy-paste',
    method: 'find Desktop logs, cat | nc termbin.com 9999, and curl -X POST to gist API; write URLs to Desktop/upload-links.txt; open TextEdit',
    inputs: ['/bin/sh', 'nc', 'curl'],
    output: 'lion-log-upload.command + Desktop/upload-links.txt',
    gate: 'script is read-only against disks, only reads Desktop logs, never erases',
    phoneExecutable: 'lion-log-upload.command — double-click on Snow Leopard Mac after running fix, then copy returned URL to phone browser or paste in Arena chat'
  },
  {
    id: 'short-link',
    task: 'Create lion-short-link.txt — shortened, phone-typeable link for Arctic Fox that goes directly to file mirror; also generate QR-friendly URL',
    method: 'write short link file with RAW_URL, JSD_URL, and live preview URL pattern https://{port}-{sandboxId}.e2b.app/lion-ssd-lion-boot-fix.zip; instruct user to create is.gd/tinyurl alias via phone browser if needed',
    inputs: [RAW_URL],
    output: 'lion-short-link.txt',
    gate: 'file contains at least 2 working mirrors, each URL tested with curl -I 200',
    phoneExecutable: 'lion-short-link.txt — open on phone, tap link to download ZIP directly'
  },
  {
    id: 'mirror-server',
    task: 'Create phone-mirror-server.js — Node static server on 0.0.0.0:8000 serving ZIP and accepting POST /upload for logs, visible as Live Preview https://8000-{sandboxId}.e2b.app/',
    method: 'write Node http server: GET / -> lion-phone.html, GET /zip -> ZIP file, POST /upload -> save to uploads/ and return URL; bind 0.0.0.0 for Arena preview',
    inputs: ['lion-ssd-lion-boot-fix.zip', 'lion-phone.html'],
    output: 'phone-mirror-server.js + uploads/ dir',
    gate: 'server binds 0.0.0.0, serves ZIP with correct MIME, POST /upload returns 200 and saves file',
    phoneExecutable: 'phone-mirror-server.js — node phone-mirror-server.js on sandbox, then phone browser opens https://8000-...e2b.app/ to download and upload logs'
  },
  {
    id: 'sight-verify',
    task: 'Verify model sight capability — generate and read image, confirm agent has vision',
    method: 'node tools/orient.ts orient; generate_image docs/macpro-lion-ssd-diagram.png; read_file image',
    inputs: ['tools/orient.ts', 'docs/macpro-lion-ssd-diagram.png'],
    output: 'sight verification receipt',
    gate: 'image returned as visible content, not text description only',
    phoneExecutable: 'none — verification only, but diagram is phone-viewable'
  }
];

// Generate phone-executable artifacts — da.gd short links work on Arctic Fox (tinyurl fails)

const phoneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lion SSD Fix — Mac Pro 1,1 Phone Mirror</title>
<style>
body{font-family:-apple-system,Helvetica,Arial,sans-serif;margin:0;padding:16px;line-height:1.5;background:#f5f5f7;color:#111}
h1{font-size:22px;margin:0 0 8px}
h2{font-size:18px;margin:24px 0 8px}
a.btn{display:block;background:#007aff;color:#fff;text-decoration:none;padding:14px 18px;border-radius:10px;margin:10px 0;text-align:center;font-weight:600}
a.btn.secondary{background:#34c759}
a.btn.tertiary{background:#5856d6}
pre{background:#fff;border:1px solid #ddd;padding:12px;border-radius:8px;overflow:auto;font-size:13px}
textarea{width:100%;height:180px;border:1px solid #ccc;border-radius:8px;padding:10px;font-family:monospace}
.card{background:#fff;border-radius:12px;padding:16px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.small{font-size:12px;color:#666}
</style>
</head>
<body>
<h1>Mac Pro 1,1 Lion SSD Fix</h1>
<p class="small">Fast SSD: Crucial MX500 Bay3 — boot Lion 10.7.5 off SSD + new admin. Works on phone, Arctic Fox 47.3, TenSixFox. No tinyurl (fails on Arctic), using da.gd + clck.ru (simple, old-browser friendly).</p>

<div class="card">
<h2>1 — Download Fix ZIP (tap, works in Arctic Fox)</h2>
<a class="btn" href="${SHORT_DAGD_RAW}">da.gd/mOycI — raw GitHub (11K)</a>
<a class="btn secondary" href="${SHORT_DAGD_JSD}">da.gd/XeHlN — jsDelivr CDN (11K, faster)</a>
<a class="btn tertiary" href="${SHORT_DAGD_PACK}">da.gd/gOvc2 — Full Phone Debug Pack (19K)</a>
<p class="small">Backup: ${SHORT_CLCK_RAW} , ${SHORT_CLCK_JSD}<br>
Long: ${JSD_URL}</p>
</div>

<div class="card">
<h2>2 — Type from phone into Mac (Arctic Fox address bar)</h2>
<pre>${SHORT_DAGD_RAW}</pre>
<p class="small">Type exactly, Enter, Save to ~/Downloads, unzip to Desktop, double-click lion-ssd-lion-boot-fix.command. If exec bit lost: chmod +x ~/Desktop/*.command</p>
</div>

<div class="card">
<h2>3 — Terminal one-liner (no browser, type from phone)</h2>
<pre>curl -L -o ~/Downloads/fix.zip ${SHORT_DAGD_RAW}
unzip -o ~/Downloads/fix.zip -d ~/Desktop
chmod +x ~/Desktop/*.command
~/Desktop/lion-ssd-lion-boot-fix.command</pre>
</div>

<div class="card">
<h2>4 — Phone debug: send log back (easy from phone)</h2>
<p>After fix script, run log uploader:</p>
<pre>~/Desktop/lion-log-upload.command</pre>
<p>It prints <code>https://termbin.com/xxxx</code> — open that URL on phone, copy, paste in Arena chat.</p>
<textarea id="logBox" placeholder="Or paste log here to upload to this mirror if running..."></textarea>
<p><button onclick="uploadLog()" style="padding:12px 18px;border-radius:8px;border:0;background:#ff3b30;color:#fff;font-weight:600;width:100%">Upload Log to Mirror</button></p>
<pre id="uploadResult" class="small"></pre>
</div>

<script>
function uploadLog(){
  const text = document.getElementById('logBox').value;
  if(!text.trim()){ alert('Paste log first'); return; }
  fetch('/upload', {method:'POST', body:text, headers:{'Content-Type':'text/plain'}})
    .then(r=>r.text()).then(t=>{
      document.getElementById('uploadResult').textContent = 'Uploaded: ' + t;
    }).catch(e=>{
      document.getElementById('uploadResult').textContent = 'Upload failed: ' + e + '\\nFallback: cat log | nc termbin.com 9999';
    });
}
</script>
</body>
</html>
`;

const downloadSh = `#!/bin/sh
# lion-phone-download.sh — phone/browser compatible downloader for Snow Leopard Mac
# Works on any machine with curl or wget + internet. Uses da.gd short links (tinyurl fails on Arctic)
PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
set -e
URL_SHORT="${SHORT_DAGD_RAW}"
URL_RAW="${RAW_URL}"
URL_JSD="${JSD_URL}"
OUT="$HOME/Downloads/lion-ssd-lion-boot-fix.zip"
mkdir -p "$HOME/Downloads"
echo "Lion SSD Fix — downloading via da.gd short link (Arctic Fox friendly)..."
if command -v curl >/dev/null 2>&1; then
  echo "Trying ${SHORT_DAGD_RAW}..."
  curl -L -o "$OUT" "${SHORT_DAGD_RAW}" && echo "Saved $OUT via curl da.gd" && exit 0
  echo "da.gd failed, trying raw..."
  curl -L -o "$OUT" "$URL_RAW" && echo "Saved $OUT via curl raw" && exit 0
  curl -L -o "$OUT" "$URL_JSD" && echo "Saved $OUT via curl jsDelivr" && exit 0
fi
if command -v wget >/dev/null 2>&1; then
  wget -O "$OUT" "${SHORT_DAGD_RAW}" && echo "Saved $OUT via wget da.gd" && exit 0
  wget -O "$OUT" "$URL_RAW" && echo "Saved $OUT via wget raw" && exit 0
fi
echo "FAIL: no curl/wget. Open in Arctic Fox browser:"
echo "${SHORT_DAGD_RAW}"
echo "${SHORT_DAGD_JSD}"
echo "$URL_RAW"
exit 1
`;

const downloadCommand = downloadSh + `
# .command variant — double-clickable on Snow Leopard
chmod +x "$0" 2>/dev/null || true
# Auto-unzip after download
if [ -f "$OUT" ]; then
  echo "Unzipping..."
  cd "$HOME/Desktop"
  unzip -o "$OUT"
  chmod +x "$HOME/Desktop/"*.command 2>/dev/null || true
  echo "Done. Double-click lion-ssd-lion-boot-fix.command"
  open -a TextEdit "$HOME/Desktop/README_LION_SSD_FIX.txt" 2>/dev/null || true
fi
`;

const logUploadCommand = `#!/bin/sh
# lion-log-upload.command — easy log return from Snow Leopard Mac, phone-friendly
# Finds ~/Desktop/lion-*.txt and uploads to termbin.com + saves local copy
PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
SELF="$0"
[ -f "$SELF" ] && chmod 755 "$SELF" 2>/dev/null || true
REPORT_DIR="$HOME/Desktop"
OUT="$REPORT_DIR/upload-links.txt"
echo "Lion log uploader — $(date)" | tee "$OUT"
echo "" | tee -a "$OUT"
for F in "$REPORT_DIR"/lion-*.txt "$REPORT_DIR"/lion-*.log; do
  [ -f "$F" ] || continue
  echo "--- $F ---" | tee -a "$OUT"
  ls -lh "$F" | tee -a "$OUT"
  echo "Uploading to termbin.com (nc)..." | tee -a "$OUT"
  if command -v nc >/dev/null 2>&1; then
    URL=$(cat "$F" | nc termbin.com 9999 2>&1)
    echo "termbin URL: $URL" | tee -a "$OUT"
  else
    echo "nc not found, trying curl to file.io" | tee -a "$OUT"
    URL=$(curl -s -F "file=@$F" https://file.io 2>&1 | grep -o 'https://file.io/[^"]*' | head -n1)
    echo "file.io URL: $URL" | tee -a "$OUT"
  fi
  echo "" | tee -a "$OUT"
done
echo "" | tee -a "$OUT"
echo "Copy the termbin URL above to your phone browser or paste in Arena chat for debugging." | tee -a "$OUT"
cat "$OUT"
open -a TextEdit "$OUT" 2>/dev/null || true
`;

const shortLinkTxt = `Lion SSD Fix — Shortened links for Arctic Fox 47.3 mac32 (NO tinyurl, fails on Arctic)

PRIMARY — da.gd (open-source, minimal HTML, works on Firefox 45 / Arctic Fox):
${SHORT_DAGD_RAW}  -> raw GitHub lion-ssd-lion-boot-fix.zip (11K)
${SHORT_DAGD_JSD}  -> jsDelivr CDN fix (11K, faster)
${SHORT_DAGD_PACK} -> jsDelivr lion-phone-debug-pack.zip (19K, full phone tools)

BACKUP — clck.ru (also simple, works on old browsers):
${SHORT_CLCK_RAW} -> raw GitHub
${SHORT_CLCK_JSD} -> jsDelivr

LONG PERMANENT (if shortener fails):
${JSD_URL}
${RAW_URL}

TYPE FROM PHONE INTO MAC (Arctic Fox address bar):
${SHORT_DAGD_RAW}

One-liner Terminal (type from phone into Mac Terminal, no browser):
curl -L -o ~/Downloads/fix.zip ${SHORT_DAGD_RAW} && unzip -o ~/Downloads/fix.zip -d ~/Desktop && chmod +x ~/Desktop/*.command

Phone debug log return (easy from phone):
- After running lion-ssd-lion-boot-fix.command, run lion-log-upload.command
- It prints https://termbin.com/xxxx — open that URL on phone, copy, paste in Arena chat
- Or open live mirror if still running: POST log to /upload

All scripts executable on any machine with browser+internet:
- lion-phone.html — open in any browser, tap download (uses da.gd)
- lion-phone-download.sh — sh lion-phone-download.sh on any Unix
- lion-phone-download.command — double-click on Snow Leopard
- lion-log-upload.command — double-click to upload logs

Generated: ${new Date().toISOString()}
Note: e2b.app sandbox links expire (Sandbox Not Found) — use da.gd permanent links above.
`;

const mirrorServerJs = `#!/usr/bin/env node
// phone-mirror-server.js — static file mirror for phone + Snow Leopard debugging
// Binds 0.0.0.0 for Arena Live Preview: https://{port}-{sandboxId}.e2b.app/
// Usage: node phone-mirror-server.js [port]
// Serves: / -> lion-phone.html, /zip -> lion-ssd-lion-boot-fix.zip, POST /upload -> saves log

import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, mkdirSync, createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';

const port = parseInt(process.argv[2] ?? '8000', 10);
const root = process.cwd();

function serveFile(res, filePath, contentType='application/octet-stream') {
  if (!existsSync(filePath)) {
    res.writeHead(404, {'Content-Type':'text/plain'});
    res.end('Not found: ' + filePath);
    return;
  }
  const stat = statSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Content-Disposition': \`attachment; filename="\${filePath.split('/').pop()}"\`,
    'Access-Control-Allow-Origin': '*'
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  console.log(new Date().toISOString(), req.method, req.url);
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.url === '/' || req.url === '/index.html') {
    const htmlPath = join(root, 'lion-phone.html');
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf8');
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      res.end(html);
    } else {
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end('<h1>Lion SSD Fix Mirror</h1><a href="/zip">Download ZIP</a>');
    }
    return;
  }
  if (req.url === '/zip' || req.url === '/lion-ssd-lion-boot-fix.zip') {
    const zipPath = join(root, 'lion-ssd-lion-boot-fix.zip');
    serveFile(res, zipPath, 'application/zip');
    return;
  }
  if (req.url.startsWith('/upload') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      mkdirSync(join(root, 'uploads'), {recursive:true});
      const fname = 'upload-' + Date.now() + '.txt';
      const fpath = join(root, 'uploads', fname);
      writeFileSync(fpath, body, 'utf8');
      console.log('Saved upload', fpath, body.length, 'bytes');
      res.writeHead(200, {'Content-Type':'text/plain', 'Access-Control-Allow-Origin':'*'});
      res.end('Saved as ' + fname + ' (' + body.length + ' bytes) at /uploads/' + fname + '\\nAccess via: ' + req.headers.host + '/uploads/' + fname);
    });
    return;
  }
  if (req.url.startsWith('/uploads/')) {
    const fname = req.url.split('/').pop() || '';
    const safe = fname.replace(/[^a-zA-Z0-9._-]/g, '');
    const fpath = join(root, 'uploads', safe);
    serveFile(res, fpath, 'text/plain');
    return;
  }
  res.writeHead(404, {'Content-Type':'text/plain'});
  res.end('Not found. Try / , /zip , POST /upload');
});

server.listen(port, '0.0.0.0', () => {
  console.log('Phone mirror server listening on 0.0.0.0:' + port);
  console.log('Local: http://localhost:' + port + '/');
  console.log('Live Preview: https://' + port + '-{sandboxId}.e2b.app/ (replace {sandboxId})');
  console.log('ZIP: /zip');
  console.log('Upload: POST /upload with log text');
});
`;

// Write artifacts
writeFileSync('lion-phone.html', phoneHtml, 'utf8');
writeFileSync('lion-phone-download.sh', downloadSh, {mode: 0o755});
writeFileSync('lion-phone-download.command', downloadCommand, {mode: 0o755});
writeFileSync('lion-log-upload.command', logUploadCommand, {mode: 0o755});
writeFileSync('lion-short-link.txt', shortLinkTxt, 'utf8');
writeFileSync('phone-mirror-server.js', mirrorServerJs, 'utf8');
try { mkdirSync('uploads', {recursive:true}); } catch {}

console.log(JSON.stringify({objective, agentCount: agents.length, agents, artifacts: ['lion-phone.html','lion-phone-download.sh','lion-phone-download.command','lion-log-upload.command','lion-short-link.txt','phone-mirror-server.js'], mirrors: {raw: RAW_URL, jsdelivr: JSD_URL, livePreviewPattern: 'https://8000-{sandboxId}.e2b.app/zip'}}, null, 2));
