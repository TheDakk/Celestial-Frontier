/* devpreviewcheck.mjs — boot the exact packaged development preview in a
   real browser over loopback and verify its guard/banner/app outcome.

   Usage: node tools/devpreviewcheck.mjs --root=<extracted-preview-root> */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { verifyPackage } from './devpreview.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const args = process.argv.slice(2);
if (args.length !== 1 || !args[0].startsWith('--root=')) {
  console.error('usage: node tools/devpreviewcheck.mjs --root=<extracted-preview-root>');
  process.exit(2);
}

const requested = args[0].slice('--root='.length);
let root;
let manifest;
let releaseWorkspaceLock = null;
try {
  releaseWorkspaceLock = acquireWorkspaceLock('development preview browser check');
  root = fs.realpathSync(requested);
  manifest = verifyPackage(root);
} catch (error) {
  if (releaseWorkspaceLock) releaseWorkspaceLock();
  console.error(`DEV PREVIEW BROWSER CHECK: FAIL — ${error.message}`);
  process.exit(1);
}

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { allow: 'GET, HEAD' }); response.end(); return;
    }
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://preview.invalid').pathname);
    if (pathname.includes('\0') || pathname.includes('\\')) throw new Error('invalid path');
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const absolute = path.resolve(root, relative);
    if (!(absolute === root || absolute.startsWith(`${root}${path.sep}`))) throw new Error('path escaped root');
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not a real file');
    const body = fs.readFileSync(absolute);
    response.writeHead(200, {
      'content-type': MIME[path.extname(absolute).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    if (request.method === 'GET') response.end(body); else response.end();
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); response.end('not found');
  }
});

let browser = null;
const events = [];
let exitCode = 0;
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('preview server did not expose a TCP port');
  const url = `http://127.0.0.1:${address.port}/`;
  browser = await openChromiumCdp({
    label: 'development preview browser check',
    userDataPrefix: 'cf-devpreview-check',
    commandTimeoutMs: 30000,
    onEvent: (event) => events.push(event),
  });
  const target = await browser.send('Target.createTarget', { url: 'about:blank' });
  const attached = await browser.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const session = attached.sessionId;
  await browser.send('Runtime.enable', {}, session);
  await browser.send('Page.enable', {}, session);
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 320, height: 568, deviceScaleFactor: 2, mobile: true,
  }, session);
  await browser.send('Page.navigate', { url }, session);

  const deadline = Date.now() + 20000;
  let outcome = null;
  let last = 'page did not evaluate';
  while (Date.now() < deadline) {
    try {
      const result = await browser.send('Runtime.evaluate', {
        expression: `(()=>{ try {
          const dev=window.__CF_DEV_PREVIEW__, slice=window.__CF_SLICE__;
          const banner=document.getElementById('cf-dev-preview-banner'), dock=document.getElementById('dock');
          const box=(el)=>{ if(!el) return null; const b=el.getBoundingClientRect(); return {l:b.left,t:b.top,r:b.right,b:b.bottom,w:b.width,h:b.height}; };
          const bb=box(banner), db=box(dock), overlap=!!bb&&!!db&&bb.l<db.r&&bb.r>db.l&&bb.t<db.b&&bb.b>db.t;
          const state=slice?.api?.state?.();
          return {ready:!!dev&&!!state&&!!document.querySelector('canvas'),dev,state:state?{mode:state.mode}:null,
            banner:banner?{text:banner.textContent,title:banner.title,box:bb,pointer:getComputedStyle(banner).pointerEvents}:null,
            dock:db,overlap,blocked:document.documentElement.dataset.cfPreviewBlocked||null};
        } catch(error){ return {ready:false,why:String(error&&error.message||error)}; } })()`,
        returnByValue: true,
      }, session);
      if (!result.exceptionDetails) {
        outcome = result.result.value;
        last = outcome?.why || JSON.stringify(outcome);
        if (outcome?.ready) break;
      } else last = result.exceptionDetails.text || 'runtime exception';
    } catch (error) { last = error.message; }
    await sleep(50);
  }
  if (!outcome?.ready) throw new Error(`packaged app did not become ready (${last})`);
  if (outcome.blocked) throw new Error(`loopback package was blocked (${outcome.blocked})`);
  if (outcome.dev.sourceCommit !== manifest.source.commit
    || outcome.dev.expectedOrigin !== manifest.expectedOrigin
    || outcome.dev.publishable !== manifest.publishable) {
    throw new Error(`runtime/manifest binding drifted (${JSON.stringify(outcome.dev)})`);
  }
  if (!outcome.banner || outcome.banner.text.trim() !== `DEV · ${manifest.source.shortCommit.slice(0, 7)}`
    || outcome.banner.title !== `Development preview · ${manifest.source.commit} · ${manifest.source.state === 'dirty-local-only' ? 'dirty · local only' : manifest.publishable ? 'approved candidate' : 'review artifact'}`
    || !(outcome.banner.box.w > 0 && outcome.banner.box.h > 0)
    || outcome.banner.pointer !== 'none') {
    throw new Error(`DEV banner is not visible/non-blocking/bound (${JSON.stringify(outcome.banner)})`);
  }
  if (outcome.overlap) throw new Error(`DEV banner overlaps the 320px gameplay dock (${JSON.stringify({ banner: outcome.banner.box, dock: outcome.dock })})`);
  const errors = events.filter((event) => event.method === 'Runtime.exceptionThrown'
    || (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error'));
  if (errors.length) throw new Error(`packaged app emitted ${errors.length} console error(s): ${JSON.stringify(errors[0].params).slice(0, 400)}`);
  console.log(`DEV PREVIEW BROWSER CHECK: PASS — ${manifest.source.commit}`);
  console.log(`  loopback boot mode ${outcome.state.mode}; 320x568 banner clear of dock`);
  console.log(`  expected remote origin ${manifest.expectedOrigin}; publishable ${String(manifest.publishable)}`);
} catch (error) {
  exitCode = 1;
  console.error(`DEV PREVIEW BROWSER CHECK: FAIL — ${error.message}`);
} finally {
  if (browser) {
    try { await browser.close(); }
    catch (error) { exitCode = 1; console.error(`DEV PREVIEW BROWSER CHECK: FAIL — browser cleanup (${error.message})`); }
  }
  await new Promise((resolve) => server.close(resolve));
  if (releaseWorkspaceLock) releaseWorkspaceLock();
}
process.exit(exitCode);
