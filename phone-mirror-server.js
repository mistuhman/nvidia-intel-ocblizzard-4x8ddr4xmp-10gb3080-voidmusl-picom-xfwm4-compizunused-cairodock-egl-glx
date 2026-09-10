#!/usr/bin/env node
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
    'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
    'Access-Control-Allow-Origin': '*'
  });
  createReadStream(filePath).pipe(res);
}
const server = createServer((req, res) => {
  console.log(new Date().toISOString(), req.method, req.url);
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
      res.end('<h1>Lion SSD Fix Mirror</h1><a href="/zip">Download ZIP</a> <a href="/phone-pack">Phone Pack</a>');
    }
    return;
  }
  if (req.url === '/zip' || req.url === '/lion-ssd-lion-boot-fix.zip') {
    serveFile(res, join(root, 'lion-ssd-lion-boot-fix.zip'), 'application/zip');
    return;
  }
  if (req.url === '/phone-pack' || req.url === '/lion-phone-debug-pack.zip') {
    serveFile(res, join(root, 'lion-phone-debug-pack.zip'), 'application/zip');
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
      console.log('Saved upload', fpath, body.length);
      res.writeHead(200, {'Content-Type':'text/plain'});
      res.end('Saved as ' + fname + ' (' + body.length + ' bytes) at /uploads/' + fname + '\nAccess: https://' + (process.env.E2B_SANDBOX_ID || '8000-xxx') + '.e2b.app/uploads/' + fname);
    });
    return;
  }
  if (req.url.startsWith('/uploads/')) {
    const fname = (req.url.split('/').pop() || '').replace(/[^a-zA-Z0-9._-]/g, '');
    serveFile(res, join(root, 'uploads', fname), 'text/plain');
    return;
  }
  res.writeHead(404, {'Content-Type':'text/plain'});
  res.end('Not found. Try / , /zip , /phone-pack , POST /upload');
});
server.listen(port, '0.0.0.0', () => {
  console.log('Phone mirror server listening on 0.0.0.0:' + port);
  console.log('Local: http://localhost:' + port + '/');
  console.log('Live Preview: https://' + port + '-' + (process.env.E2B_SANDBOX_ID || '{sandboxId}') + '.e2b.app/');
});
