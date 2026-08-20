#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

function textFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url: string): Promise<{ url: string; status: number; finalUrl: string; text: string }> {
  if (url.startsWith('file://')) {
    const path = new URL(url);
    const body = readFileSync(path, 'utf8');
    return { url, status: 200, finalUrl: url, text: textFromHtml(body) };
  }
  if (!/^https?:/i.test(url)) {
    const body = readFileSync(url, 'utf8');
    return { url, status: 200, finalUrl: url, text: textFromHtml(body) };
  }
  const response = await fetch(url, { redirect: 'follow' });
  const body = await response.text();
  const type = response.headers.get('content-type') ?? '';
  return { url, status: response.status, finalUrl: response.url, text: type.includes('html') ? textFromHtml(body) : body };
}

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((x) => x.startsWith(prefix))?.slice(prefix.length);
}

async function main(): Promise<void> {
  const outDir = option('out');
  const maxChars = Number(option('max') ?? 12000);
  const urls = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  if (!urls.length) {
    console.error('usage: node tools/web-scrape.ts [--out=.scratch/docs] [--max=12000] URL...');
    process.exit(2);
  }
  if (outDir) mkdirSync(outDir, { recursive: true });
  const results = await Promise.all(urls.map(async (url) => {
    try {
      const result = await fetchText(url);
      const sha256 = createHash('sha256').update(result.text).digest('hex');
      const clipped = result.text.slice(0, maxChars);
      const row = { ...result, sha256, chars: result.text.length, text: clipped };
      if (outDir) {
        const parsed = /^https?:|^file:/i.test(url) ? new URL(url).pathname : url;
        writeFileSync(join(outDir, `${basename(parsed) || 'index'}-${sha256.slice(0, 12)}.json`), JSON.stringify(row, null, 2));
      }
      return row;
    } catch (error) {
      return { url, status: 0, finalUrl: url, sha256: '', chars: 0, text: '', error: String(error) };
    }
  }));
  console.log(JSON.stringify({ fetchedAt: new Date().toISOString(), results }, null, 2));
  if (results.some((x) => x.status < 200 || x.status > 299)) process.exit(1);
}

main();
