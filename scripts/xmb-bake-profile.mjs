#!/usr/bin/env node
/**
 * Read-only bake profiler. Answers two questions the bake log cannot:
 *   1. Is WebGL actually on the RTX 3080, or on a software rasterizer?
 *      The bake prints "WebKit WebGL" because Chromium MASKS the real strings.
 *      WEBGL_debug_renderer_info unmasks them (W-150 / U-004).
 *   2. Where does the ~133 ms/frame go — scene render, PNG encode, or transfer?
 * Writes nothing under out/. Does not encode. Safe to run at any time.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const home = os.homedir();
const root = process.env.XMB_BAKE_ROOT || '/mnt/games/xmb-wave-bake';
const puppeteer = require(path.join(home, '.local/share/xmb-wave/node_modules/puppeteer'));
const chromium = process.env.CHROMIUM || '/usr/bin/chromium';
const editorUrl = process.env.XMB_EDITOR_URL || 'http://127.0.0.1:8765/';
const role = process.argv[2] || 'main-red';
const sampleFrames = Number(process.env.XMB_PROFILE_FRAMES || 20);
const width = 4480;
const height = 1440;
const fps = 60;
const bakeFrames = 3738;
const seed = 0x584d4233;

function fail(message) { throw new Error(message); }
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function fmt(ms) { return `${ms.toFixed(1).padStart(7)} ms`; }
function project(msPerFrame) {
  const seconds = (msPerFrame * bakeFrames) / 1000;
  return `${seconds.toFixed(0)}s (${(seconds / 60).toFixed(1)} min)`;
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

async function main() {
  const presetFile = path.join(root, 'presets', `${role}.json`);
  if (!fs.existsSync(presetFile)) fail(`missing preset: ${presetFile}`);
  const preset = JSON.parse(fs.readFileSync(presetFile));

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
  try {
    await page.setViewport({width, height, deviceScaleFactor: 1});
    await installDeterminism(page);
    await page.goto(editorUrl, {waitUntil: 'networkidle0', timeout: 30000});
    await page.addStyleTag({content: `
      .settings-panel, .settings-show-btn, .settings-layer-host,
      .ui-layer-root, #xmb-preset-capture { display: none !important; }
      html, body, canvas { margin: 0 !important; padding: 0 !important; }
    `});

    const gpu = await page.evaluate(({preset, seed}) => {
      Object.assign(window.SPLINE_SETTINGS, preset.spline);
      Object.assign(window.PARTICLE_SETTINGS, preset.particles);
      window.__deterministicBake.resetRandom(seed);
      const canvas = document.getElementById('wave-canvas');
      const gl = canvas.getContext('webgl2');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        canvas: [canvas.width, canvas.height],
        masked_vendor: gl.getParameter(gl.VENDOR),
        masked_renderer: gl.getParameter(gl.RENDERER),
        unmasked_vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : 'EXTENSION_UNAVAILABLE',
        unmasked_renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'EXTENSION_UNAVAILABLE',
        max_texture: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        version: gl.getParameter(gl.VERSION),
      };
    }, {preset, seed});

    console.log('--- WebGL identity (unmasked) ---');
    for (const [key, value] of Object.entries(gpu)) console.log(`  ${key}: ${value}`);
    const software = /swiftshader|llvmpipe|softwarerasterizer|mesa offscreen/i
      .test(String(gpu.unmasked_renderer));
    console.log(`  VERDICT: ${software ? 'SOFTWARE RASTERIZER (no GPU)' : 'hardware-backed or undetermined'}`);

    /* Chromium's own GPU report is the cross-check on the flags, per X-005. */
    const gpuPage = await browser.newPage();
    await gpuPage.goto('chrome://gpu', {waitUntil: 'domcontentloaded', timeout: 30000});
    const gpuReport = await gpuPage.evaluate(() => {
      const text = document.body.innerText || '';
      const pick = (label) => {
        const line = text.split('\n').find((row) => row.trim().startsWith(label));
        return line ? line.trim() : `${label}: NOT FOUND`;
      };
      return [
        pick('WebGL2:'), pick('Canvas:'), pick('Video Decode:'),
        pick('OpenGL:'), pick('Vulkan:'),
      ];
    });
    console.log('--- chrome://gpu ---');
    for (const row of gpuReport) console.log(`  ${row}`);
    await gpuPage.close();

    console.log(`--- per-stage timing over ${sampleFrames} frames @ ${width}x${height} ---`);
    const timings = {advance: [], png: [], pngFast: [], readPixels: []};
    let pngBytes = 0;
    let pngFastBytes = 0;
    let fastSupported = true;

    for (let frame = 0; frame < sampleFrames; frame += 1) {
      let mark = Date.now();
      await page.evaluate((timeMs) => {
        window.__deterministicBake.advanceTo(timeMs);
        document.getElementById('wave-canvas').getContext('webgl2').finish();
      }, frame * 1000 / fps);
      timings.advance.push(Date.now() - mark);

      mark = Date.now();
      const png = await page.screenshot({type: 'png', fullPage: false, captureBeyondViewport: false});
      timings.png.push(Date.now() - mark);
      pngBytes = png.length;

      if (fastSupported) {
        try {
          mark = Date.now();
          const fastPng = await page.screenshot({
            type: 'png', fullPage: false, captureBeyondViewport: false, optimizeForSpeed: true,
          });
          timings.pngFast.push(Date.now() - mark);
          pngFastBytes = fastPng.length;
        } catch {
          fastSupported = false;
        }
      }

      mark = Date.now();
      const raw = await page.evaluate(() => {
        const gl = document.getElementById('wave-canvas').getContext('webgl2');
        const buffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
          gl.RGBA, gl.UNSIGNED_BYTE, buffer);
        let nonblack = 0;
        for (let i = 0; i < buffer.length; i += 4000) {
          if (buffer[i] || buffer[i + 1] || buffer[i + 2]) nonblack += 1;
        }
        return {sampled: Math.ceil(buffer.length / 4000), nonblack};
      });
      timings.readPixels.push(Date.now() - mark);
      if (frame === 0) {
        console.log(`  content check: ${raw.nonblack}/${raw.sampled} sampled pixels non-black`);
        if (raw.nonblack === 0) console.log('  WARNING: first frame sampled entirely black');
      }
    }

    const advance = median(timings.advance);
    const png = median(timings.png);
    const pngFast = fastSupported && timings.pngFast.length ? median(timings.pngFast) : null;
    const readPixels = median(timings.readPixels);
    console.log(`  scene render + gl.finish : ${fmt(advance)}`);
    console.log(`  screenshot PNG           : ${fmt(png)}   (${pngBytes} bytes)`);
    console.log(`  screenshot PNG fast      : ${pngFast === null ? '  unsupported by this puppeteer' : `${fmt(pngFast)}   (${pngFastBytes} bytes)`}`);
    console.log(`  readPixels round-trip    : ${fmt(readPixels)}`);

    console.log('--- projection for the full 3738-frame bake ---');
    console.log(`  current path (render+PNG)     : ${project(advance + png)}`);
    if (pngFast !== null) {
      console.log(`  with optimizeForSpeed         : ${project(advance + pngFast)}`);
    }
    console.log(`  theoretical floor (render only): ${project(advance)}`);
    const dominant = advance > png ? 'SCENE RENDER' : 'PNG CAPTURE';
    console.log(`  BOTTLENECK: ${dominant}`);
    console.log('XMB_BAKE_PROFILE=PASS');
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
