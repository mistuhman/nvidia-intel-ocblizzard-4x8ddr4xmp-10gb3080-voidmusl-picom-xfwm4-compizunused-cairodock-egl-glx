#!/usr/bin/env node
/** Deterministically render one XMB role and encode a seamless 60-second loop. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {once} from 'node:events';
import {spawn, spawnSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const home = os.homedir();
const root = process.env.XMB_BAKE_ROOT || '/mnt/games/xmb-wave-bake';
const puppeteer = require(path.join(home, '.local/share/xmb-wave/node_modules/puppeteer'));
const chromium = process.env.CHROMIUM || '/usr/bin/chromium';
const ffmpeg = process.env.FFMPEG || '/usr/bin/ffmpeg';
const ffprobe = process.env.FFPROBE || '/usr/bin/ffprobe';
const editorUrl = process.env.XMB_EDITOR_URL || 'http://127.0.0.1:8765/';
const expected = {
  sleep: '57bdad0e6f67dcdafc9f626c2abd4a82a8791b9243706fe02555fe52ff662dbe',
  'main-red': 'af0d75e4c102f29fe4b7c53314ec93b7ddda1ee92b62e8b508f46bcd7db0998b',
  'work-monochrome': 'a3efb5063867d7de93974c451f3bda006d06ab118aa5cec33f61d72a58fdf730',
};
const role = process.argv[2];
const width = 4480;
const height = 1440;
const fps = 60;
const loopSeconds = 60;
const blendSeconds = 2.3;
const captureSeconds = loopSeconds + blendSeconds;
const frameCount = Math.round(captureSeconds * fps);
const seed = 0x584d4233;

function fail(message) {
  throw new Error(message);
}
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function checkExecutable(file) {
  if (!fs.existsSync(file)) fail(`missing executable: ${file}`);
}
function loadPreset() {
  if (!Object.hasOwn(expected, role)) {
    fail(`usage: xmb-bake-video <${Object.keys(expected).join('|')}>`);
  }
  const file = path.join(root, 'presets', `${role}.json`);
  if (!fs.existsSync(file)) fail(`missing preset: ${file}`);
  const bytes = fs.readFileSync(file);
  const actual = sha256(bytes);
  if (actual !== expected[role]) {
    fail(`preset hash mismatch: expected ${expected[role]}, got ${actual}`);
  }
  const value = JSON.parse(bytes);
  if (value.role !== role || Object.keys(value.spline || {}).length !== 50) {
    fail('preset schema/key mismatch');
  }
  return {file, value, sha256: actual};
}
function runChecked(command, args, label) {
  const result = spawnSync(command, args, {encoding: 'utf8'});
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) fail(`${label} failed with status ${result.status}`);
  return result.stdout;
}
async function runProcess(command, args, label) {
  const child = spawn(command, args, {stdio: ['ignore', 'inherit', 'inherit']});
  const [code, signal] = await once(child, 'exit');
  if (code !== 0) fail(`${label} failed: code=${code} signal=${signal}`);
}
async function installDeterminism(page) {
  await page.evaluateOnNewDocument((initialSeed) => {
    let clockMs = 0;
    let queuedFrame = null;
    let nextFrameId = 1;
    let randomState = initialSeed >>> 0;
    function seededRandom() {
      randomState = (randomState + 0x6D2B79F5) >>> 0;
      let value = randomState;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    }
    Object.defineProperty(Math, 'random', {configurable: true, value: seededRandom});
    Object.defineProperty(performance, 'now', {configurable: true, value: () => clockMs});
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback) => { queuedFrame = callback; return nextFrameId++; },
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {configurable: true, value: () => {}});
    window.__deterministicBake = {
      resetRandom(value) { randomState = value >>> 0; },
      advanceTo(value) {
        clockMs = Number(value);
        if (typeof queuedFrame !== 'function') throw new Error('no frame queued');
        const callback = queuedFrame;
        queuedFrame = null;
        callback(clockMs);
      },
      hasQueuedFrame() { return typeof queuedFrame === 'function'; },
    };
  }, seed);
}
async function startEncoder(masterTemporary) {
  const args = [
    '-y', '-hide_banner', '-loglevel', 'warning',
    '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'png', '-i', 'pipe:0',
    '-an', '-c:v', 'h264_nvenc', '-preset', 'p5', '-tune', 'hq',
    '-rc', 'vbr', '-cq', '16', '-b:v', '0', '-g', String(fps * 2),
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-colorspace', 'bt709', '-movflags', '+faststart', masterTemporary,
  ];
  const child = spawn(ffmpeg, args, {stdio: ['pipe', 'inherit', 'inherit']});
  let spawnError = null;
  child.on('error', (error) => { spawnError = error; });
  return {
    child,
    async write(buffer) {
      if (spawnError) throw spawnError;
      if (!child.stdin.write(buffer)) await once(child.stdin, 'drain');
    },
    async finish() {
      child.stdin.end();
      const [code, signal] = await once(child, 'exit');
      if (spawnError) throw spawnError;
      if (code !== 0) fail(`frame encoder failed: code=${code} signal=${signal}`);
    },
  };
}
async function renderMaster(preset, masterTemporary) {
  const browser = await puppeteer.launch({
    executablePath: chromium,
    headless: true,
    defaultViewport: null,
    args: [
      '--no-sandbox', '--disable-dev-shm-usage', '--enable-gpu',
      '--use-gl=angle', '--use-angle=default', '--hide-scrollbars',
      '--force-device-scale-factor=1',
    ],
  });
  const page = await browser.newPage();
  let encoder;
  try {
    await page.setViewport({width, height, deviceScaleFactor: 1});
    await installDeterminism(page);
    await page.goto(editorUrl, {waitUntil: 'networkidle0', timeout: 30000});
    await page.addStyleTag({content: `
      .settings-panel, .settings-show-btn, .settings-layer-host,
      .ui-layer-root, #xmb-preset-capture { display: none !important; }
      html, body, canvas { margin: 0 !important; padding: 0 !important; }
    `});
    const setup = await page.evaluate(({preset, seed}) => {
      if (!window.__deterministicBake?.hasQueuedFrame()) throw new Error('clock hook missing');
      Object.assign(window.SPLINE_SETTINGS, preset.spline);
      Object.assign(window.PARTICLE_SETTINGS, preset.particles);
      window.__deterministicBake.resetRandom(seed);
      const canvas = document.getElementById('wave-canvas');
      const gl = canvas?.getContext('webgl2');
      if (!gl) throw new Error('WebGL2 unavailable');
      return {
        canvas: [canvas.width, canvas.height],
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
      };
    }, {preset, seed});
    if (setup.canvas[0] !== width || setup.canvas[1] !== height) {
      fail(`canvas is ${setup.canvas.join('x')}, expected ${width}x${height}`);
    }
    console.log(`setup: ${JSON.stringify(setup)}`);
    console.log(`rendering ${frameCount} frames (${captureSeconds}s @ ${fps})`);
    encoder = await startEncoder(masterTemporary);
    const started = Date.now();
    for (let frame = 0; frame < frameCount; frame += 1) {
      await page.evaluate((timeMs) => {
        window.__deterministicBake.advanceTo(timeMs);
        document.getElementById('wave-canvas').getContext('webgl2').finish();
      }, frame * 1000 / fps);
      const png = await page.screenshot({
        type: 'png', fullPage: false, captureBeyondViewport: false,
      });
      await encoder.write(png);
      if (frame % fps === 0 || frame + 1 === frameCount) {
        const elapsed = (Date.now() - started) / 1000;
        const renderedSeconds = frame / fps;
        console.log(`progress frame=${frame + 1}/${frameCount} t=${renderedSeconds.toFixed(1)}s elapsed=${elapsed.toFixed(1)}s`);
      }
    }
    await encoder.finish();
    encoder = null;
    return setup;
  } finally {
    if (encoder) encoder.child.kill('SIGTERM');
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
function probeVideo(file) {
  const text = runChecked(ffprobe, [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames:format=duration,size,bit_rate',
    '-of', 'json', file,
  ], `ffprobe ${file}`);
  return JSON.parse(text);
}

async function main() {
  checkExecutable(chromium);
  checkExecutable(ffmpeg);
  checkExecutable(ffprobe);
  const preset = loadPreset();
  const encoderList = runChecked(ffmpeg, ['-hide_banner', '-encoders'], 'ffmpeg encoder inventory');
  if (!encoderList.includes('h264_nvenc')) fail('h264_nvenc unavailable');
  const health = await fetch('http://127.0.0.1:8765/api/status');
  if (!health.ok) fail(`editor service health HTTP ${health.status}`);

  const roleDir = path.join(root, 'out', role);
  fs.mkdirSync(roleDir, {recursive: true});
  const master = path.join(roleDir, `${role}.master-62.3s.mp4`);
  const masterTemporary = master.replace(/\.mp4$/, '.partial.mp4');
  const loop = path.join(roleDir, `${role}.loop-60s.mp4`);
  const loopTemporary = loop.replace(/\.mp4$/, '.partial.mp4');
  const receiptPath = path.join(roleDir, 'BAKE-RECEIPT.json');
  for (const item of [master, masterTemporary, loop, loopTemporary, receiptPath]) {
    if (fs.existsSync(item)) fail(`output already exists; refusing overwrite: ${item}`);
  }

  console.log(`role=${role} preset=${preset.sha256} seed=${seed}`);
  const setup = await renderMaster(preset.value, masterTemporary);
  fs.renameSync(masterTemporary, master);
  console.log(`master: ${master} ${sha256(fs.readFileSync(master))}`);

  const mainEnd = loopSeconds;
  const mainStart = blendSeconds;
  const filter = [
    '[0:v]split=3[base][tail0][head0]',
    `[base]trim=start=${mainStart}:end=${mainEnd},setpts=PTS-STARTPTS[main]`,
    `[tail0]trim=start=${mainEnd}:end=${captureSeconds},setpts=PTS-STARTPTS[tail]`,
    `[head0]trim=start=0:end=${blendSeconds},setpts=PTS-STARTPTS[head]`,
    `[tail][head]blend=all_expr='A*(1-T/${blendSeconds})+B*(T/${blendSeconds})':shortest=1[blend]`,
    '[main][blend]concat=n=2:v=1:a=0[out]',
  ].join(';');
  await runProcess(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'warning', '-i', master,
    '-filter_complex', filter, '-map', '[out]', '-an', '-r', String(fps),
    '-fps_mode', 'cfr', '-c:v', 'h264_nvenc', '-preset', 'p5', '-tune', 'hq',
    '-rc', 'vbr', '-cq', '19', '-b:v', '0', '-g', String(fps * 2),
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-colorspace', 'bt709', '-movflags', '+faststart', loopTemporary,
  ], 'seamless-loop encode');
  fs.renameSync(loopTemporary, loop);

  const masterProbe = probeVideo(master);
  const loopProbe = probeVideo(loop);
  const stream = loopProbe.streams?.[0] || {};
  const duration = Number(loopProbe.format?.duration);
  if (stream.width !== width || stream.height !== height) fail('loop dimensions mismatch');
  if (stream.avg_frame_rate !== '60/1') fail(`loop frame rate mismatch: ${stream.avg_frame_rate}`);
  if (!Number.isFinite(duration) || Math.abs(duration - loopSeconds) > 0.05) {
    fail(`loop duration mismatch: ${duration}`);
  }
  const receipt = {
    schema: 1, role, seed, fps, width, height,
    loop_seconds: loopSeconds,
    blend_seconds: blendSeconds,
    capture_seconds: captureSeconds,
    frame_count: frameCount,
    preset_sha256: preset.sha256,
    renderer: setup,
    master: {path: master, sha256: sha256(fs.readFileSync(master)), probe: masterProbe},
    loop: {path: loop, sha256: sha256(fs.readFileSync(loop)), probe: loopProbe},
  };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  console.log(`loop: ${loop} ${receipt.loop.sha256}`);
  console.log(`receipt: ${receiptPath} ${sha256(fs.readFileSync(receiptPath))}`);
  console.log(`${role.toUpperCase().replaceAll('-', '_')}_VIDEO_BAKE=PASS`);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
