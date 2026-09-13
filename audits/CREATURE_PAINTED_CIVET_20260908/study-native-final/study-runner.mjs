/* One immutable local-study run. This is not a product certificate or admission lane.
 * Usage (after source review): node tools/with-toolchain-lock.mjs --label civet-study --
 *   node audits/CREATURE_PAINTED_CIVET_20260908/study-runner.mjs FRESH_OUTPUT_NAME
 */
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
const repo = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url))), base = path.dirname(fileURLToPath(import.meta.url));
assert.equal(fs.realpathSync(process.cwd()), repo); assert.equal(process.platform, 'darwin');
assert.equal(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(), repo);
assert.equal(execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(), 'openai/mac');
assert.equal(process.argv.length, 3); assert(/^[a-z0-9][a-z0-9-]*$/.test(process.argv[2]), 'A fresh simple output name is required');
const out = path.join(base, process.argv[2]); assert(!fs.existsSync(out), 'Output exists; this runner does not retry or overwrite');
const release = acquireWorkspaceLock('painted Civet immutable local study'); fs.mkdirSync(out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const write = (file, bytes) => fs.writeFileSync(path.join(out, file), bytes, { flag: 'wx' });
const report = { schema: 'cf-painted-civet-study-native/v1', certification: false, status: 'RUNNING', startedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), node: process.version, sources: {}, modes: [], runtimeErrors: [], cleanupErrors: [], pending: null, limitations: [
  'Standalone local authoring bench. No native Compendium, battle, world navigation, protected save or product certificate claim.',
  'One-view texture deformation supports finite breathing and neck brace/thrust/recoil, not jaw articulation, walking, a 3D rig or unseen anatomy.',
  'Single shared decoded Civet texture within each document; measurements are resource-owner facts, not native driver heap, device heat or a total app memory cap.',
  'Recovered matte retains attenuated whiskers and a small light fringe at magnification; production clean-edge and human art acceptance remain open.',
  'DOM-hidden cancellation and synthetic document-hidden event coverage are distinct. Physical background-tab/PWA/Safari behavior remains unqualified.',
] };
const persist = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
let server, browser;
function png(file, data) { assert(data.startsWith('data:image/png;base64,')); const bytes = Buffer.from(data.split(',')[1], 'base64'); write(file, bytes); return { path: file, bytes: bytes.length, sha256: sha(bytes) }; }
function acceptProbe(value, needsMotion = true) {
  assert(value.sourceFixed, 'Texture recipe or complete genome changed'); assert.equal(value.outputs.length, 3);
  const largest = value.outputs.find(row => row.size === 440); assert(largest, '440px pixel ruler missing');
  for (const row of value.outputs) {
    assert.equal(row.width, row.size); assert.equal(row.height, row.size);
    assert(row.delta.contactInk > 0, 'Ground-contact ruler observes no solid ink at ' + row.size);
    assert(Array.isArray(row.delta.contactFeet) && row.delta.contactFeet.length === 4, 'Four-paw coverage receipt missing at ' + row.size);
    assert.deepEqual(row.delta.contactFeet.map(foot => [foot.sourceX0, foot.sourceX1]), [[270, 325], [325, 385], [428, 486], [486, 548]], 'Canonical paw partitions changed');
    for (const [index, foot] of row.delta.contactFeet.entries()) assert(foot.solid > 0, 'Paw ' + (index + 1) + ' has no solid contact ink at ' + row.size);
    assert.equal(row.delta.contact, 0, 'Actual planted ground-contact pixels moved at ' + row.size);
  }
  if (needsMotion) {
    assert(largest.delta.all > 20, 'Actual rendered motion is absent');
    if (value.clip === 'breathe') { assert(largest.delta.bodyInk > 20); assert(largest.delta.body > 10, 'Actual breathing body pixels did not change'); }
    else { assert(largest.delta.headInk > 20); assert(largest.delta.head > 10, 'Actual neck/head pixels did not change'); }
  } else for (const row of value.outputs) assert.equal(row.delta.all, 0, 'Rest pixels differ from exact baseline');
}
function acceptGeometry(geometry, mode) {
  assert.deepEqual(geometry.viewport, [mode.width, mode.height, mode.dpr]);
  // A classic vertical scrollbar legitimately reduces document.clientWidth.
  assert(geometry.documentWidth > 0 && geometry.documentWidth <= mode.width);
  assert.equal(geometry.scrollWidth, geometry.documentWidth, 'Review document overflows horizontally');
  assert(geometry.canvas.width > 0 && geometry.canvas.width <= geometry.view.width);
}
function keepProbe(mode, label, value) {
  for (const row of value.outputs) { row.image = png(`${mode}-${label}-${row.size}.png`, row.png); row.baseline = png(`${mode}-${label}-${row.size}-rest.png`, row.baselinePng); delete row.png; delete row.baselinePng; }
  value.scene = png(`${mode}-${label}-earth.png`, value.scenePng); delete value.scenePng; return value;
}
try {
  for (const name of ['study.html', 'study-harness.ts', 'study-runner.mjs', 'serve-study.mjs', 'study.tsconfig.json', 'asset.json']) {
    const bytes = fs.readFileSync(path.join(base, name)); write(name, bytes); report.sources[path.relative(repo, path.join(base, name))] = sha(bytes);
  }
  const asset = JSON.parse(fs.readFileSync(path.join(base, 'asset.json'), 'utf8'));
  assert.equal(asset.schema, 'cf-painted-civet-study-asset/v1'); assert.equal(asset.path, 'civet-painted-v1.webp');
  const assetBytes = fs.readFileSync(path.join(base, asset.path)); assert.equal(sha(assetBytes), asset.sha256); assert.equal(assetBytes.length, asset.bytes);
  const baseline = JSON.parse(fs.readFileSync(path.join(base, 'baseline/report.json'), 'utf8')); assert.equal(baseline.status, 'PASS');
  const scene = { background: { path: './study-assets/earth-background-original.webp', sha256: baseline.background.sha256, width: 960, height: 430 }, residents: { path: './study-assets/earth-residents-without-civet.png', sha256: baseline.artifacts['earth-residents-without-civet.png'].sha256, width: 960, height: 430 } };
  const normalized = { path: './study-assets/' + asset.path, sha256: asset.sha256, width: asset.width, height: asset.height, alphaBounds: asset.alphaBounds, contactY: asset.contactY };
  report.asset = asset; report.scene = scene; persist();
  const dist = path.join(out, 'dist');
  await build({ root: base, configFile: false, logLevel: 'warn', resolve: { alias: { 'pixi.js': path.join(repo, 'port/v2/node_modules/pixi.js/lib/index.mjs') } }, define: { __CF_CIVET_ASSET__: JSON.stringify(normalized), __CF_CIVET_SCENE__: JSON.stringify(scene) }, plugins: [{ name: 'immutable-study-inputs', transform(_code, id) {
    const file = id.split('?')[0];
    if (file.startsWith(repo + path.sep) && !file.includes('/node_modules/') && fs.existsSync(file) && fs.statSync(file).isFile()) report.sources[path.relative(repo, file)] = sha(fs.readFileSync(file));
    return null;
  } }], build: { outDir: dist, emptyOutDir: false, minify: false, sourcemap: false, rollupOptions: { input: path.join(base, 'study.html') } } });
  fs.mkdirSync(path.join(dist, 'study-assets'));
  fs.copyFileSync(path.join(base, asset.path), path.join(dist, 'study-assets', asset.path), fs.constants.COPYFILE_EXCL);
  for (const name of ['earth-background-original.webp', 'earth-residents-without-civet.png']) {
    const bytes = fs.readFileSync(path.join(base, 'baseline', name)), expected = name.endsWith('.webp') ? scene.background : scene.residents;
    assert.equal(sha(bytes), expected.sha256); fs.writeFileSync(path.join(dist, 'study-assets', name), bytes, { flag: 'wx' });
  }
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp' };
  server = http.createServer((request, response) => {
    try {
      assert(['GET', 'HEAD'].includes(request.method)); const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const file = fs.realpathSync(path.resolve(dist, '.' + (pathname === '/' ? '/study.html' : pathname))); assert(file.startsWith(dist + path.sep));
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(request.method === 'HEAD' ? undefined : fs.readFileSync(file));
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  browser = await openChromiumCdp({ label: 'painted Civet local study', userDataPrefix: 'cf-painted-civet-study-20260908', commandTimeoutMs: 15000, onEvent: event => { if (event.method === 'Runtime.exceptionThrown') report.runtimeErrors.push(event.params.exceptionDetails); } });
  report.browser = browser.browser;
  for (const mode of [{ name: 'desktop', width: 1440, height: 1200, dpr: 1, mobile: false }, { name: 'phone', width: 390, height: 844, dpr: 2, mobile: true }]) {
    const result = { ...mode, events: [], probes: [], controls: [], screenshots: [], status: 'RUNNING' }; report.modes.push(result); persist();
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }); const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params = {}) => browser.send(method, params, sessionId);
    const evaluate = async expression => { report.pending = { mode: mode.name, expression, sha256: sha(expression) }; persist(); const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); assert(!value.exceptionDetails, JSON.stringify(value.exceptionDetails)); report.pending = null; return value.result.value; };
    const api = 'window.__CF_CIVET_STUDY__';
    const waitFor = async (expression, milliseconds = 7000) => { const deadline = Date.now() + milliseconds; while (Date.now() < deadline) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 80)); } throw Error('Named study condition timed out: ' + expression); };
    const frames = () => evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
    const native = async id => {
      await evaluate(`document.getElementById(${JSON.stringify(id)}).scrollIntoView({block:'center'})`); await frames();
      const hit = await evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)}),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);return{x,y,width:r.width,height:r.height,disabled:!!e.disabled,hit:h===e||e.contains(h)}})()`);
      assert(hit.hit && !hit.disabled && hit.width > 0 && hit.height > 0, 'Native control is unavailable: ' + id);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: hit.x, y: hit.y, button: 'left', clickCount: 1 }); await frames();
      result.events.push({ id, hit });
    };
    const snapshot = () => evaluate(`${api}.snapshot()`);
    const checkRest = state => { assert.equal(state.clip, 'rest'); assert.equal(state.pendingRaf, false); assert(state.actors.every(actor => actor.restExact)); assert(state.sourceIdentityUnchanged); assert.deepEqual(state.failures, []); };
    await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: mode.width, height: mode.height, deviceScaleFactor: mode.dpr, mobile: mode.mobile });
    await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/' });
    await waitFor(`!!${api}`, 10000); result.initial = await evaluate(`${api}.ready`); await frames();
    checkRest(await snapshot()); assert(result.initial.allActorsShareOneCreatureTexture); assert.equal(result.initial.counters.decodedCreature, 1); assert.equal(result.initial.counters.creatureTextures, 1); assert.equal(result.initial.counters.creatureSources, 1);
    const controls = await evaluate(`${api}.assetControls()`); assert(controls.hashRejected && controls.opaqueRejected && controls.immutableGenome); result.controls.push({ kind: 'asset-admission', ...controls });
    for (const next of ['breathe', 'strike', 'recoil']) {
      const before = await snapshot(); await native(next); const started = await snapshot();
      assert.equal(started.counters.started, before.counters.started + 1); assert.equal(started.clip, next); assert(started.journal.some(row => row.event === 'request' && row.clip === next && row.trusted === true));
      await waitFor(`${api}.snapshot().clip==='rest'`); const settled = await snapshot(); checkRest(settled); assert.equal(settled.counters.completed, before.counters.completed + 1); assert(settled.counters.frames > before.counters.frames); result.events.push({ kind: 'finite-native-clip', clip: next, started: started.counters, settled: settled.counters });
    }
    for (const [next, elapsed] of [['breathe', 2100], ['strike', 480], ['recoil', 175]]) {
      const value = await evaluate(`${api}.probe(${JSON.stringify(next)},${elapsed})`); keepProbe(mode.name, next, value); result.probes.push(value); acceptProbe(value); checkRest(await snapshot());
    }
    for (const mutation of ['constant-rest', 'shift-paws']) {
      const value = await evaluate(`${api}.probe('strike',480,${JSON.stringify(mutation)})`); keepProbe(mode.name, mutation, value); result.probes.push(value);
      let rejection = null; try { acceptProbe(value); } catch (error) { rejection = String(error); } assert(rejection, 'Negative control was accepted: ' + mutation); result.controls.push({ kind: mutation, rejected: true, reason: rejection }); checkRest(await snapshot());
      const restored = await evaluate(`${api}.probe('rest',0)`); keepProbe(mode.name, mutation + '-restored', restored); result.probes.push(restored); acceptProbe(restored, false);
    }
    for (const id of ['reduced', 'effects']) {
      await native('breathe'); const beforePolicy = await snapshot(); assert.equal(beforePolicy.clip, 'breathe'); await native(id); const stopped = await snapshot(); checkRest(stopped);
      await native('strike'); const refused = await snapshot(); checkRest(refused); assert.equal(refused.counters.started, beforePolicy.counters.started); result.events.push({ kind: 'motion-policy', id, stopped: stopped.counters, refused: refused.counters });
      await native(id); checkRest(await snapshot());
    }
    await native('breathe'); await native('hide'); const hidden = await snapshot(); checkRest(hidden); assert.equal(hidden.policy.visible, false);
    await native('hide'); const shown = await snapshot(); checkRest(shown); assert.equal(shown.policy.visible, true); result.events.push({ kind: 'native-dom-hide-show', hidden, shown });
    await native('strike');
    const documentHidden = await evaluate(`(()=>{const d=Object.getOwnPropertyDescriptor(document,'hidden');try{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));return ${api}.snapshot()}finally{if(d)Object.defineProperty(document,'hidden',d);else delete document.hidden}})()`);
    checkRest(documentHidden); assert.equal(documentHidden.lastCancellation, 'document hidden'); await frames(); checkRest(await snapshot()); result.controls.push({ kind: 'synthetic-document-hidden', evidence: documentHidden, nativeBackgroundTabQualified: false });
    const finalRest = await evaluate(`${api}.probe('rest',0)`); keepProbe(mode.name, 'final-rest', finalRest); result.probes.push(finalRest); acceptProbe(finalRest, false);
    await evaluate('window.scrollTo(0,0)'); await frames();
    const geometryExpression = `(()=>{const v=document.getElementById('study-view'),c=v.querySelector('canvas');return{viewport:[innerWidth,innerHeight,devicePixelRatio],documentWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,view:v.getBoundingClientRect().toJSON(),canvas:c.getBoundingClientRect().toJSON()}})()`;
    const geometry = await evaluate(geometryExpression);
    result.geometry = geometry; // Keep compared rectangles even if a geometry assertion stops.
    acceptGeometry(geometry, mode);
    let overflow;
    try {
      await evaluate(`(()=>{const e=document.createElement('div');e.id='study-overflow-negative-control';e.style.cssText='position:absolute;left:0;top:0;height:1px;width:'+(${mode.width}+2000)+'px';document.body.append(e)})()`); await frames();
      overflow = await evaluate(geometryExpression); assert(overflow.scrollWidth > overflow.documentWidth, 'Overflow mutant did not create measured overflow'); let rejection = null;
      try { acceptGeometry(overflow, mode); } catch (error) { rejection = String(error); }
      assert(rejection, 'Actual horizontal-overflow mutant was accepted');
      result.controls.push({ kind: 'horizontal-overflow', geometry: overflow, rejected: true, reason: rejection });
    } finally { await evaluate(`document.getElementById('study-overflow-negative-control')?.remove()`); await frames(); }
    const restoredGeometry = await evaluate(geometryExpression); acceptGeometry(restoredGeometry, mode);
    assert.deepEqual(restoredGeometry, geometry, 'Geometry was not restored after overflow control'); checkRest(await snapshot());
    const layoutMetrics = await send('Page.getLayoutMetrics');
    const page = layoutMetrics.cssContentSize; assert(page.width <= mode.width + 1 && page.height < 6000, 'Unexpected review document capture extent');
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: page.width, height: page.height, scale: 1 } }); write(`${mode.name}-native-study.png`, Buffer.from(shot.data, 'base64')); result.screenshots.push(`${mode.name}-native-study.png`);
    await native('dispose'); const retired = await snapshot(); assert(retired.disposed); assert.equal(retired.pendingRaf, false); assert.equal(retired.counters.meshesDestroyed, 4); assert.equal(retired.counters.geometriesDestroyed, 4); assert.equal(retired.counters.texturesDestroyed, 3); assert.equal(retired.counters.sourcesDestroyed, 3); assert.equal(retired.counters.bitmapsClosed, 3);
    assert(retired.actors.every(actor => actor.meshDestroyed && actor.geometryDestroyed && actor.rootDestroyed)); assert(retired.earthDestroyed); assert(retired.resources.every(row => row.textureDestroyed && row.sourceDestroyed && row.bitmapWidth === 0 && row.bitmapHeight === 0)); assert.deepEqual(retired.failures, []); result.retired = retired;
    const repeated = await evaluate(`${api}.dispose()`); assert.deepEqual(repeated.counters, retired.counters, 'Repeated disposal changed owner counts');
    await browser.send('Target.closeTarget', { targetId }); result.status = 'PASS'; persist();
  }
  for (const [file, expected] of Object.entries(report.sources)) assert.equal(sha(fs.readFileSync(path.join(repo, file))), expected, 'Source changed during frozen study: ' + file);
  assert.equal(sha(fs.readFileSync(path.join(base, asset.path))), asset.sha256); assert.deepEqual(report.runtimeErrors, []);
  const inventory = [];
  const walk = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const full = path.join(directory, entry.name); if (entry.isDirectory()) walk(full); else { const bytes = fs.readFileSync(full); inventory.push({ path: path.relative(dist, full), bytes: bytes.length, sha256: sha(bytes) }); } } };
  walk(dist); report.dist = { path: path.relative(repo, dist), inventory }; report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.failure = String(error?.stack || error); process.exitCode = 1; }
finally {
  if (browser) try { await browser.close(); report.browserClosed = true; } catch (error) { report.cleanupErrors.push(String(error)); }
  if (server) try { await new Promise(resolve => server.close(resolve)); } catch (error) { report.cleanupErrors.push(String(error)); }
  try { release(); } catch (error) { report.cleanupErrors.push(String(error)); }
  if (report.cleanupErrors.length) { report.status = 'FAIL'; process.exitCode = 1; }
  report.finishedAt = new Date().toISOString(); persist();
  console.log(JSON.stringify({ status: report.status, out, modes: report.modes.map(mode => ({ name: mode.name, status: mode.status, probes: mode.probes.length, controls: mode.controls.length })), failure: report.failure, runtimeErrors: report.runtimeErrors, cleanupErrors: report.cleanupErrors }, null, 2));
}
