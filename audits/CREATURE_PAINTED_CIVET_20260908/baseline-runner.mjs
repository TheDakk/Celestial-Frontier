import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from '../../port/v2/node_modules/vite/dist/node/index.js';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';
import { acquireWorkspaceLock } from '../../port/v2/tools/workspacelock.mjs';

const repo = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
assert.equal(fs.realpathSync(process.cwd()), repo);
assert.equal(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(), repo);
assert.equal(execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(), 'openai/mac');
assert.equal(process.platform, 'darwin');
const base = path.dirname(fileURLToPath(import.meta.url)), out = path.join(base, 'baseline');
assert(!fs.existsSync(out), 'Immutable baseline output already exists; no retry');
const release = acquireWorkspaceLock('canonical Civet baseline native capture');
fs.mkdirSync(out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = { schema: 'cf-civet-baseline-native/v1', certification: false, status: 'RUNNING', startedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), node: process.version, sources: {}, artifacts: {}, runtimeErrors: [], cleanupErrors: [], limitations: ['Standalone audit harness, not native game navigation, motion qualification, human art acceptance or certification.', '300px image is the current 440px polished source downsample; 132 uses the actual thumbnail owner.', 'Alpha crop preserves the actual source ink and shadow with 12px padding; no retouching or anatomy alteration.'] };
const persist = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
let browser, server;
try {
  fs.copyFileSync(fileURLToPath(import.meta.url), path.join(out, 'runner.mjs'), fs.constants.COPYFILE_EXCL);
  for (const file of ['baseline.html', 'baseline-harness.ts']) fs.copyFileSync(path.join(base, file), path.join(out, file), fs.constants.COPYFILE_EXCL);
  persist();
  const dist = path.join(out, 'dist');
  await build({ root: base, configFile: false, logLevel: 'warn', plugins: [{ name: 'baseline-source-binding', transform(_code, id) {
    const source = id.split('?')[0];
    if (source.startsWith(repo + path.sep) && !source.includes('/node_modules/') && fs.existsSync(source) && fs.statSync(source).isFile()) report.sources[path.relative(repo, source)] = sha(fs.readFileSync(source));
    return null;
  } }], build: { outDir: dist, emptyOutDir: false, minify: false, sourcemap: false, rollupOptions: { input: path.join(base, 'baseline.html') } } });
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  server = http.createServer((request, response) => {
    try {
      assert(['GET', 'HEAD'].includes(request.method));
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const file = fs.realpathSync(path.resolve(dist, '.' + (pathname === '/' ? '/baseline.html' : pathname)));
      assert(file.startsWith(dist + path.sep));
      response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); response.end(request.method === 'HEAD' ? undefined : fs.readFileSync(file));
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  browser = await openChromiumCdp({ label: 'canonical Civet native baseline', userDataPrefix: 'cf-civet-baseline-20260908', commandTimeoutMs: 15000, onEvent: event => { if (event.method === 'Runtime.exceptionThrown') report.runtimeErrors.push(event.params.exceptionDetails); } });
  report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params = {}) => browser.send(method, params, sessionId);
  const evaluate = async expression => {
    report.pendingEvaluation = { expression, sha256: sha(expression) }; persist();
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); report.pendingEvaluation = null; return result.result.value;
  };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/' });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    const state = await evaluate('({ready:!!window.__CF_CIVET_BASELINE_PROMISE__,failure:window.__CF_CIVET_BASELINE_FAILURE__||null})');
    assert(!state.failure, state.failure); if (state.ready) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, 'Baseline module did not initialize');
  const data = await evaluate('window.__CF_CIVET_BASELINE_PROMISE__');
  assert.equal(data.outputs.length, 7); assert(data.originalLayerPixelParity && data.omittedCivetChangesPixels);
  for (const output of data.outputs) {
    assert(/^[a-z0-9-]+\.png$/.test(output.name)); assert(output.dataURL.startsWith('data:image/png;base64,'));
    const bytes = Buffer.from(output.dataURL.split(',')[1], 'base64');
    fs.writeFileSync(path.join(out, output.name), bytes, { flag: 'wx' });
    report.artifacts[output.name] = { bytes: bytes.length, sha256: sha(bytes), width: output.width, height: output.height };
    delete output.dataURL;
  }
  report.capture = data;
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(out, 'native-baseline-review.png'), Buffer.from(screenshot.data, 'base64'), { flag: 'wx' });
  const background = 'port/v2/apps/game/src/assets/painted/earth-riverbank-v1.webp';
  fs.copyFileSync(path.join(repo, background), path.join(out, 'earth-background-original.webp'), fs.constants.COPYFILE_EXCL);
  report.background = { source: background, sha256: sha(fs.readFileSync(path.join(repo, background))) };
  for (const [source, digest] of Object.entries(report.sources)) assert.equal(sha(fs.readFileSync(path.join(repo, source))), digest, 'Source changed during baseline: ' + source);
  assert.deepEqual(report.runtimeErrors, []); report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.failure = String(error?.stack || error); process.exitCode = 1; }
finally {
  if (browser) try { await browser.close(); report.browserClosed = true; } catch (error) { report.cleanupErrors.push(String(error)); }
  if (server) try { await new Promise(resolve => server.close(resolve)); } catch (error) { report.cleanupErrors.push(String(error)); }
  try { release(); } catch (error) { report.cleanupErrors.push(String(error)); }
  if (report.cleanupErrors.length) { report.status = 'FAIL'; process.exitCode = 1; }
  report.finishedAt = new Date().toISOString(); persist();
  console.log(JSON.stringify({ status: report.status, out, artifacts: report.artifacts, rawBounds: report.capture?.rawBounds, failure: report.failure, cleanupErrors: report.cleanupErrors }, null, 2));
}
