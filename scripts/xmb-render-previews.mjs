#!/usr/bin/env node
/** Render each captured XMB manifest twice with a seeded, explicit clock.
 * Refuses nondeterministic or blank output. Does not encode full videos.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const home = os.homedir();
const root = process.env.XMB_BAKE_ROOT || '/mnt/games/xmb-wave-bake';
const puppeteerRoot = path.join(home, '.local/share/xmb-wave/node_modules/puppeteer');
const puppeteer = require(puppeteerRoot);
const chromium = process.env.CHROMIUM || '/usr/bin/chromium';
const editorUrl = process.env.XMB_EDITOR_URL || 'http://127.0.0.1:8765/';
const outDir = path.join(root, 'previews-deterministic');
const roles = ['sleep', 'main-red', 'work-monochrome'];
const expected = {
  sleep: '57bdad0e6f67dcdafc9f626c2abd4a82a8791b9243706fe02555fe52ff662dbe',
  'main-red': 'af0d75e4c102f29fe4b7c53314ec93b7ddda1ee92b62e8b508f46bcd7db0998b',
  'work-monochrome': 'a3efb5063867d7de93974c451f3bda006d06ab118aa5cec33f61d72a58fdf730',
};
const width = 4480;
const height = 1440;
const fps = 60;
const previewSecond = 5;
const seed = 0x584d4233; // ASCII-ish "XMB3"; fixed across roles and runs.

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function loadPreset(role) {
  const file = path.join(root, 'presets', `${role}.json`);
  if (!fs.existsSync(file)) fail(`missing preset: ${file}`);
  const bytes = fs.readFileSync(file);
  const actual = sha256(bytes);
  if (actual !== expected[role]) {
    fail(`${role} preset hash mismatch: expected ${expected[role]}, got ${actual}`);
  }
  const data = JSON.parse(bytes);
  if (data.role !== role || Object.keys(data.spline || {}).length !== 50) {
    fail(`${role} preset schema/key mismatch`);
  }
  return data;
}

async function installDeterministicClock(page) {
  await page.evaluateOnNewDocument((initialSeed) => {
    let clockMs = 0;
    let queuedFrame = null;
    let nextFrameId = 1;
    let randomState = initialSeed >>> 0;

    function seededRandom() {
      // mulberry32: compact deterministic uint32 PRNG.
      randomState = (randomState + 0x6D2B79F5) >>> 0;
      let value = randomState;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    }

    Object.defineProperty(Math, 'random', {
      configurable: true,
      value: seededRandom,
    });
    Object.defineProperty(performance, 'now', {
      configurable: true,
      value: () => clockMs,
    });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback) => {
        queuedFrame = callback;
        return nextFrameId++;
      },
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: () => {},
    });

    window.__deterministicBake = {
      resetRandom(value) {
        randomState = value >>> 0;
      },
      advanceTo(value) {
        clockMs = Number(value);
        if (typeof queuedFrame !== 'function') {
          throw new Error('no requestAnimationFrame callback queued');
        }
        const callback = queuedFrame;
        queuedFrame = null;
        callback(clockMs);
      },
      hasQueuedFrame() {
        return typeof queuedFrame === 'function';
      },
    };
  }, seed);
}

async function renderPass(browser, role, preset, pass) {
  const page = await browser.newPage();
  await page.setViewport({width, height, deviceScaleFactor: 1});
  await installDeterministicClock(page);
  await page.goto(editorUrl, {waitUntil: 'networkidle0', timeout: 30000});
  await page.addStyleTag({content: `
    .settings-panel, .settings-show-btn, .settings-layer-host,
    .ui-layer-root, #xmb-preset-capture { display: none !important; }
    html, body, canvas { margin: 0 !important; padding: 0 !important; }
  `});

  const setup = await page.evaluate(({preset, seed}) => {
    if (!window.SPLINE_SETTINGS || !window.PARTICLE_SETTINGS) {
      throw new Error('settings objects missing');
    }
    if (!window.__deterministicBake?.hasQueuedFrame()) {
      throw new Error('deterministic clock did not capture initial frame');
    }
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

  // Advance every simulation frame in one renderer-process call. This preserves
  // temporal smoothing while avoiding wall-clock/requestAnimationFrame timing.
  const metrics = await page.evaluate(({fps, previewSecond}) => {
    const bake = window.__deterministicBake;
    const finalFrame = Math.round(fps * previewSecond);
    for (let frame = 0; frame <= finalFrame; frame += 1) {
      bake.advanceTo(frame * 1000 / fps);
    }
    const canvas = document.getElementById('wave-canvas');
    const gl = canvas.getContext('webgl2');
    gl.finish();
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let nonblack = 0;
    let maximum = 0;
    let rgbSum = 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const bright = Math.max(r, g, b);
      if (bright > 3) nonblack += 1;
      if (bright > maximum) maximum = bright;
      rgbSum += r + g + b;
    }
    return {
      width: canvas.width,
      height: canvas.height,
      nonblack,
      maximum,
      average: rgbSum / (canvas.width * canvas.height * 3),
    };
  }, {fps, previewSecond});

  if (metrics.width !== width || metrics.height !== height) {
    await page.close();
    fail(`${role} canvas is ${metrics.width}x${metrics.height}, expected ${width}x${height}`);
  }
  if (metrics.nonblack < width * height / 10000 || metrics.maximum <= 3) {
    await page.close();
    fail(`${role} framebuffer is blank/nearly blank: ${JSON.stringify(metrics)}`);
  }

  const output = path.join(outDir, `${role}.pass${pass}.png`);
  await page.screenshot({path: output, type: 'png', fullPage: false, captureBeyondViewport: false});
  const outputBytes = fs.readFileSync(output);
  const result = {
    role,
    pass,
    output,
    sha256: sha256(outputBytes),
    bytes: outputBytes.length,
    setup,
    metrics,
  };
  await page.close();
  return result;
}

async function main() {
  if (!fs.existsSync(chromium)) fail(`Chromium missing: ${chromium}`);
  fs.mkdirSync(outDir, {recursive: true});
  for (const name of fs.readdirSync(outDir)) {
    if (/\.(png|json)$/.test(name)) fs.rmSync(path.join(outDir, name));
  }
  const presets = Object.fromEntries(roles.map((role) => [role, loadPreset(role)]));
  const browser = await puppeteer.launch({
    executablePath: chromium,
    headless: true,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--enable-gpu',
      '--use-gl=angle',
      '--use-angle=default',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
    ],
  });
  const receipt = {
    schema: 1,
    seed,
    fps,
    preview_second: previewSecond,
    viewport: [width, height],
    chromium,
    preset_hashes: expected,
    results: {},
  };
  try {
    for (const role of roles) {
      const first = await renderPass(browser, role, presets[role], 1);
      const second = await renderPass(browser, role, presets[role], 2);
      console.log(JSON.stringify(first));
      console.log(JSON.stringify(second));
      if (first.sha256 !== second.sha256) {
        fail(`${role} preview is nondeterministic: ${first.sha256} != ${second.sha256}`);
      }
      const canonical = path.join(outDir, `${role}.png`);
      fs.copyFileSync(first.output, canonical);
      receipt.results[role] = {
        sha256: first.sha256,
        bytes: first.bytes,
        setup: first.setup,
        metrics: first.metrics,
      };
      console.log(`${role}: DETERMINISTIC PASS ${first.sha256}`);
    }
  } finally {
    await browser.close();
  }
  const receiptPath = path.join(outDir, 'PREVIEW-RECEIPT.json');
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  console.log(`receipt: ${receiptPath} ${sha256(fs.readFileSync(receiptPath))}`);
  console.log('XMB_DETERMINISTIC_PREVIEWS=PASS');
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
