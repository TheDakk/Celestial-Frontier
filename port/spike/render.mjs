/* Renders spike.html headless and screenshots it.
   Serves over HTTP because Chromium blocks ES-module imports from file:// — the
   spike imports pixi.js as a module, so a file:// load silently never executes
   and the page just sits at its loading title. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(dir, 'spike-proof.png');

const EDGE = process.env.CF_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const MIME = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.map': 'application/json' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'spike.html';
  const file = path.join(dir, rel);
  if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('not found: ' + rel); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(0, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/spike.html`;
  console.log('serving', url);
  try {
    execFileSync(EDGE, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
      '--hide-scrollbars', '--force-device-scale-factor=1',
      '--virtual-time-budget=12000',
      '--window-size=1046,690',
      '--screenshot=' + OUT,
      url,
    ], { stdio: ['ignore', 'ignore', 'pipe'], timeout: 120000 });
  } catch (e) {
    console.error('edge failed:', (e && e.message) || e);
  }
  const ok = fs.existsSync(OUT);
  console.log(ok ? 'wrote ' + path.relative(process.cwd(), OUT) + ' (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)' : 'NO SCREENSHOT PRODUCED');
  server.close();
  process.exit(ok ? 0 : 1);
});
