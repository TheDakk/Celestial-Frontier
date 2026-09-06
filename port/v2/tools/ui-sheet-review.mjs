#!/usr/bin/env node
/* U2 presentation diagnostic only. Normal game markup/CSS; no evidence API,
 * imported save, gameplay farming, pixel-diff gate or automatic browser retry. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';
import { GLASS_MATRIX_VIEWPORTS } from './glassmatrix-evidence-contract.mjs';
import { installNativeReviewTrace, assessNativeReviewDelivery } from './ui-shell-review.mjs';
import { createReviewEvaluator, reviewFrameSettlement, readReviewFrameSettlements, assessReviewFrameSettlement } from './ui-review-evaluation.mjs';

export const U2_VIEWPORTS = Object.freeze(GLASS_MATRIX_VIEWPORTS.slice(0, 10));
export const U2_PREFERENCES = Object.freeze(['default', 'fs-xl font-mono']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

/** Serialized, read-only geometry: constants are independent of product tokens. */
export function readSheetGeometry() {
  const rect = node => {
    if (!node) return null;
    const r = node.getBoundingClientRect(), s = getComputedStyle(node);
    return { x: r.x, y: r.y, left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height, visible: s.display !== 'none' && s.visibility !== 'hidden'
        && Number(s.opacity) > 0 && r.width > 0 && r.height > 0,
      position: s.position, z: Number(s.zIndex), scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight, clientHeight: node.clientHeight, overflowY: s.overflowY };
  };
  const ids = ['setpanel', 'survey', 'planetside', 'toast', 'hintpill', 'ctxbar', 'dock', 'tutcard', 'topbar'];
  const roots = Object.fromEntries(ids.map(id => [id, rect(document.getElementById(id))]));
  const panel = document.getElementById('setpanel'), header = panel.querySelector('.sheet-header'), close = panel.querySelector('[data-pnx]');
  const c = rect(close), hit = c?.visible ? document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2) : null;
  const root = getComputedStyle(document.documentElement), a = roots.setpanel, b = roots.tutcard;
  const intersection = a && b ? { left: Math.max(a.left,b.left), top: Math.max(a.top,b.top), right: Math.min(a.right,b.right), bottom: Math.min(a.bottom,b.bottom) } : null;
  const trainingOverlap = intersection && intersection.right > intersection.left && intersection.bottom > intersection.top
    ? { ...intersection, owner: document.elementFromPoint((intersection.left+intersection.right)/2,(intersection.top+intersection.bottom)/2)?.closest('#setpanel,#tutcard')?.id ?? null } : null;
  return { viewport: { width: innerWidth, height: innerHeight }, roots, trainingOverlap, header: rect(header), close: c,
    closeCount: panel.querySelectorAll('[data-pnx]').length, closeNative: close?.tagName === 'BUTTON' && !close.disabled,
    closeHit: !!hit && (hit === close || close.contains(hit)), closeName: close?.getAttribute('aria-label'),
    sheetFloor: parseFloat(root.getPropertyValue('--cf-sheet-floor')), lowerTop: parseFloat(root.getPropertyValue('--cf-lower-top')),
    bodyClass: document.body.className, focused: document.activeElement?.id || document.activeElement?.getAttribute('data-pnx'),
    overflow: document.documentElement.scrollWidth > innerWidth + 1 };
}
export function assessSheetGeometry(state, { panel = false, training = false, fixture = false } = {}) {
  const errors = [], r = state.roots, v = state.viewport;
  const overlaps = (a, b) => a?.visible && b?.visible && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
    && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const inside = a => a?.visible && a.left >= -1 && a.top >= -1 && a.right <= v.width + 1 && a.bottom <= v.height + 1;
  if (state.overflow) errors.push('page-overflow');
  for (const a of ['setpanel', 'survey', 'planetside', 'toast']) if (r[a]?.visible) {
    if (!inside(r[a])) errors.push(a + '-viewport');
    for (const b of ['hintpill', 'ctxbar', 'dock']) if (overlaps(r[a], r[b])) errors.push(a + '-' + b);
  }
  if (fixture) {
    if (!r.planetside?.visible || !r.toast?.visible) errors.push('fixture-empty');
    if (overlaps(r.toast, r.planetside)) errors.push('toast-planetside');
    if (overlaps(r.survey, r.planetside)) errors.push('survey-planetside');
  }
  if (panel) {
    if (!inside(r.setpanel) || !inside(state.header) || state.header.position !== 'sticky'
      || state.header.top < r.setpanel.top - 1 || state.header.bottom > r.setpanel.bottom + 1) errors.push('panel-header');
    if (!state.close?.visible || state.close.position !== 'sticky' || state.close.width < 44 || state.close.height < 44
      || state.closeCount !== 1 || !state.closeNative || !state.closeHit || !state.closeName) errors.push('panel-close');
  }
  if (training && (!r.tutcard?.visible || !r.setpanel?.visible || !(r.setpanel.z > r.tutcard.z))) errors.push('settings-training-order');
  return { pass: errors.length === 0, errors };
}

/** Reveal from measured content bounds. Fixed wheel steps can oscillate across a
 * short scrollport without ever exposing a 44px control (retained e88ea7b). */
export function readSettingsReveal(selector) {
  const node = document.querySelector(selector), panel = document.getElementById('setpanel');
  if (!node || !panel) throw new Error('missing Settings scroll target: ' + selector);
  const target = node.getBoundingClientRect(), sheet = panel.getBoundingClientRect();
  const header = panel.querySelector('.sheet-header')?.getBoundingClientRect();
  const top = Math.max(sheet.top + 8, (header?.bottom ?? sheet.top) + 8), bottom = sheet.bottom - 8;
  if (target.height > bottom - top) throw new Error('Settings target cannot fit below sticky header: ' + selector);
  return { inside: target.top >= top && target.bottom <= bottom,
    delta: (target.top + target.bottom - top - bottom) / 2,
    target: { top: target.top, bottom: target.bottom, height: target.height }, content: { top, bottom } };
}

/** Fixtures populate existing nodes only; preserve child identity and all original attributes. */
export function sheetFixture(restore = false) {
  const snapshot = node => ({ node, attributes: [...node.attributes].map(a => [a.name, a.value]), children: node === document.body ? null : [...node.childNodes] });
  const attributes = node => [...node.attributes].map(a => [a.name, a.value]);
  if (restore) {
    const saved = window.__cfU2Fixture;
    if (!saved) throw new Error('missing fixture restoration owner');
    const rows = saved.map(({ node, attributes: prior, children }) => {
      if (children) node.replaceChildren(...children);
      for (const a of [...node.attributes]) node.removeAttribute(a.name);
      for (const [name, value] of prior) node.setAttribute(name, value);
      return { id: node.id || 'body', attributesExact: JSON.stringify(attributes(node)) === JSON.stringify(prior),
        childrenExact: !children || (children.length === node.childNodes.length && children.every((child, i) => child === node.childNodes[i])) };
    });
    delete window.__cfU2Fixture; return rows;
  }
  if (window.__cfU2Fixture) throw new Error('fixture already active');
  const side = document.getElementById('planetside'), toast = document.getElementById('toast');
  window.__cfU2Fixture = [document.body, side, toast].map(snapshot);
  document.body.classList.add('surface-mode');
  side.dataset.u2Fixture = 'presentation-only'; side.style.display = 'block';
  const rows = Array.from({ length: 12 }, (_, i) => { const line = document.createElement('div');
    line.textContent = `Presentation fixture — biosphere row ${i + 1}`; return line; });
  side.replaceChildren(...rows);
  toast.dataset.u2Fixture = 'presentation-only'; toast.textContent = 'Homecoming — presentation fixture, no reward or saved event'; toast.style.opacity = '1';
  return { scope: 'presentation-only: native containers, synthetic text; no gameplay outcome', ids: [side.id, toast.id] };
}
export function sheetFault(kind, restore = false) {
  if (restore) {
    const saved = window.__cfU2Fault;
    if (!saved) throw new Error('missing fault restoration owner');
    for (const style of saved.styles || []) style.remove();
    if (saved.node) saved.attribute === null ? saved.node.removeAttribute('style') : saved.node.setAttribute('style', saved.attribute);
    delete window.__cfU2Fault;
    return { exactStyle: !saved.node || saved.node.getAttribute('style') === saved.attribute, stylesheetRemoved: (saved.styles || []).every(style => !style.isConnected) };
  }
  if (kind === 'earlier-fix-last') { const saved = window.__cfU2Fault; if (!saved?.fix) throw new Error('missing earlier fix'); document.head.append(saved.fix); return { movedExactFix: true }; }
  if (window.__cfU2Fault) throw new Error('fault already active');
  const saved = {}; window.__cfU2Fault = saved;
  if (kind === 'settings-below-training') {
    const node = document.getElementById('setpanel'), card = document.getElementById('tutcard'), r = card.getBoundingClientRect();
    saved.node = node; saved.attribute = node.getAttribute('style');
    for (const [k,v] of Object.entries({top:r.top+'px',left:r.left+'px',right:'auto',bottom:'auto',transform:'none',width:r.width+'px',height:r.height+'px','max-height':r.height+'px','z-index':String(Number(getComputedStyle(card).zIndex)-1)})) node.style.setProperty(k,v,'important');
  } else if (kind === 'toast-over-biosphere') {
    const node = document.getElementById('toast'), r = document.getElementById('planetside').getBoundingClientRect();
    saved.node = node; saved.attribute = node.getAttribute('style');
    for (const [k, v] of Object.entries({ top: r.top + 'px', bottom: 'auto', left: r.left + 'px', right: 'auto',
      width: Math.max(44, r.width) + 'px', height: Math.max(44, r.height) + 'px', transform: 'none', opacity: '1' })) node.style.setProperty(k, v, 'important');
  } else {
    const style = document.createElement('style'); saved.styles = [style];
    style.textContent = kind === 'earlier-equal-specificity' ? '.panel .sheet-header{position:static}' : '#setpanel .sheet-header{position:static!important}';
    if (kind === 'earlier-equal-specificity') { const fix = document.createElement('style'); fix.textContent = '.panel .sheet-header{position:sticky}'; saved.fix = fix; saved.styles.push(fix); document.head.prepend(fix); }
    document.head.append(style);
  }
  return { kind };
}

export async function runUiSheetReview(buildDir, outDir) {
  assert(buildDir && outDir, 'usage: ui-sheet-review.mjs BUILD_DIRECTORY NEW_OUTPUT_DIRECTORY');
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  const build = fs.realpathSync(buildDir), output = path.resolve(outDir), source = git(['rev-parse', 'HEAD']);
  assert.equal(git(['status', '--porcelain', '--untracked-files=all']), '', 'requires clean committed candidate');
  assert(!fs.existsSync(output), 'output must be new: previous/red evidence is immutable');
  const index = fs.readFileSync(path.join(build, 'index.html')), worker = fs.readFileSync(path.join(build, 'service-worker.js'));
  assert(/name="cf-build-mode" content="distributable"/.test(index.toString()), 'normal distributable build required');
  const inventory = /const ASSETS=Object\.freeze\((\[[^\n]+\])\);/u.exec(worker.toString()); assert(inventory, 'missing build inventory');
  const assets = JSON.parse(inventory[1]).map(row => { const file = fs.realpathSync(path.resolve(build, '.' + row.path));
    assert(file.startsWith(build + path.sep)); const bytes = fs.readFileSync(file); assert.equal(sha(bytes), row.sha256); return { ...row, bytes: bytes.length }; });
  fs.mkdirSync(output, { recursive: true });
  const report = { schema: 'cf-u2-sheet-review/v1', certification: false, source, startedAt: new Date().toISOString(), status: 'RUNNING',
    selection: U2_VIEWPORTS, omittedViewports: GLASS_MATRIX_VIEWPORTS.slice(10).map(v => v.label), preferences: U2_PREFERENCES,
    build: { path: build, indexSha256: sha(index), workerSha256: sha(worker), assets }, rows: [], nativeInputs: [], wheels: [],
    frames: [], evaluations: {}, images: [], errors: [], limitations: ['Not U4, full Glass, device UAT or visual acceptance.',
      'Planetside/toast fixtures are geometry only, with exact native node/attribute restoration; no capture, reward, persistence or gameplay evidence.',
      'Preference classes are labelled presentation variants, not a persistence test. Survey is measured only if its native current-route card exists.',
      'Build byte inventory is retained; source/build association relies on the caller building this exact clean source. No embedded source identity is invented.'] };
  const write = () => fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify(report, null, 2) + '\n');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };
  const server = http.createServer((request, response) => { try {
    const p = new URL(request.url, 'http://localhost').pathname, file = fs.realpathSync(path.resolve(build, '.' + (p === '/' ? '/index.html' : decodeURIComponent(p))));
    assert(file.startsWith(build + path.sep) && fs.statSync(file).isFile());
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(file).pipe(response);
  } catch { response.writeHead(404); response.end(); } });
  const release = acquireWorkspaceLock('U2 scoped sheet review', { inheritFromParent: true });
  let browser, evaluate, send, row, fixtureActive = false, faultActive = false, contextId;
  try {
    write(); await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    browser = await openChromiumCdp({ label: 'U2 isolated sheet diagnostic', userDataPrefix: 'cf-u2-sheet', onEvent: event => {
      if (event.method === 'Runtime.exceptionThrown') { report.errors.push(event.params.exceptionDetails); write(); }
    } }); report.browser = browser.browser;
    const origin = `http://127.0.0.1:${server.address().port}`;
    const frames = async label => { await evaluate(`(${reviewFrameSettlement.toString()})(${JSON.stringify(label)})`, label);
      const all = await evaluate(`(${readReviewFrameSettlements.toString()})()`, label + '.receipt'), receipt = all.invocations.at(-1);
      const verdict = assessReviewFrameSettlement(receipt, row.viewport); report.frames.push({ row: row.id, receipt, verdict }); write(); assert(verdict.pass && !all.overflow); };
    const wait = (condition, label) => evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+10000;const poll=()=>{if(${condition})resolve(true);else if(performance.now()>end)reject(new Error('U2 readiness: '+${JSON.stringify(label)}));else setTimeout(poll,40)};poll()})`, label);
    const state = () => evaluate(`(${readSheetGeometry.toString()})()`, row.id + '.geometry');
    const check = async (label, options) => { const geometry = await state(), verdict = assessSheetGeometry(geometry, options);
      row.checks.push({ label, geometry, verdict }); write();
      if (row.preference !== 'default') assert(row.preference.split(' ').every(name => geometry.bodyClass.split(' ').includes(name)), 'requested presentation variant lost its classes');
      assert(verdict.pass, label + ': ' + verdict.errors.join(', ')); return geometry; };
    const capture = async label => { const file = row.id + '-' + label + '.png', { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const bytes = Buffer.from(data, 'base64'); fs.writeFileSync(path.join(output, file), bytes, { flag: 'wx' }); report.images.push({ file, sha256: sha(bytes), bytes: bytes.length }); write(); };
    const wheel = async (selector, delta) => {
      const p = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return{x:r.left+Math.min(30,r.width/2),y:r.top+r.height/2,before:e.scrollTop,start:window.__cfU2Wheels.length}})()`, 'wheel.prepare');
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: p.x, y: p.y, deltaX: 0, deltaY: delta }); await frames('native-wheel.frames');
      const after = await evaluate(`({scroll:document.querySelector(${JSON.stringify(selector)}).scrollTop,events:window.__cfU2Wheels.slice(${p.start})})`, 'wheel.receipt');
      const receipt = { row: row.id, selector, delta, ...p, ...after }; report.wheels.push(receipt); write();
      assert(after.events.length > 0 && after.events.every(e => e.trusted && e.owner === selector.slice(1)), 'native wheel owner'); return receipt;
    };
    const reveal = async selector => { for (let i = 0; i < 12; i++) {
      const r = await evaluate(`(${readSettingsReveal.toString()})(${JSON.stringify(selector)})`, 'control.scroll-readiness');
      (row.reveals ??= []).push({ selector, ...r }); write();
      if (r.inside) return; await wheel('#setpanel', r.delta);
    } throw new Error('native scroll did not reveal ' + selector); };
    const click = async selector => {
      const proof = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace,e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('missing native target');const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);if(e.tagName!=='BUTTON'||e.disabled||e.closest('[inert]')||r.width<44||r.height<44||!(h===e||e.contains(h)))throw new Error('unavailable native target '+${JSON.stringify(selector)});const id=++t.nextId;t.active={id,selector:${JSON.stringify(selector)},node:e};return{id,selector:${JSON.stringify(selector)},point:{x,y},start:t.events.length}})()`, 'native.prepare');
      proof.row = row.id; report.nativeInputs.push(proof); write();
      try { if (row.viewport.mobile) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...proof.point, id: 1 }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
        else { await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...proof.point, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...proof.point, button: 'left', clickCount: 1 }); }
      } catch (error) { proof.dispatchError = String(error); throw error; }
      finally { Object.assign(proof, await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace;t.active=null;return{events:t.events.slice(${proof.start}),overflow:t.overflow}})()`, 'native.receipt')); proof.verdict = assessNativeReviewDelivery(proof); write(); }
      assert(proof.verdict.pass, 'native delivery failed'); await frames('native.frames');
    };
    const control = async (kind, options) => {
      const proof = { kind, before: await state() }; row.controls.push(proof); write();
      let primary;
      try { faultActive = true; await evaluate(`(${sheetFault.toString()})(${JSON.stringify(kind)})`, 'fault.' + kind); await frames('fault.frames');
        proof.broken = await state(); proof.verdict = assessSheetGeometry(proof.broken, options);
        const expected = kind === 'toast-over-biosphere' ? 'toast-planetside' : kind === 'settings-below-training' ? 'settings-training-order' : 'panel-header';
        proof.detected = proof.verdict.errors.includes(expected); assert(proof.detected, 'fault did not produce its exact expected result');
        if (kind === 'settings-below-training') assert.equal(proof.broken.trainingOverlap?.owner, 'tutcard', 'layer fault must cover the actual shared point');
        if (kind === 'earlier-equal-specificity') { await evaluate(`(${sheetFault.toString()})('earlier-fix-last')`, 'earlier-fix.move-last'); await frames('earlier-fix.frames');
          proof.corrected = await state(); proof.correctedVerdict = assessSheetGeometry(proof.corrected, options); assert(proof.correctedVerdict.pass, 'exact late fix did not repair the rendered header'); }
      } catch (error) { primary = error; proof.firstFailure = String(error); }
      try { proof.restoration = await evaluate(`(${sheetFault.toString()})('',true)`, 'fault.restore'); faultActive = false; await frames('fault.restore.frames');
        proof.restored = await state(); proof.restoredVerdict = assessSheetGeometry(proof.restored, options);
        assert(proof.restoration.exactStyle && proof.restoration.stylesheetRemoved && proof.restoredVerdict.pass, 'fault restoration failed');
      } catch (error) { proof.cleanupFailure = String(error); if (!primary) primary = error; }
      write(); if (primary) throw primary;
    };
    for (const viewport of U2_VIEWPORTS) for (const preference of U2_PREFERENCES) {
      row = { id: viewport.label + (preference === 'default' ? '-default' : '-xl-mono'), viewport, preference, checks: [], controls: [], status: 'RUNNING' }; report.rows.push(row); write();
      ({ browserContextId: contextId } = await browser.send('Target.createBrowserContext'));
      const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId: contextId });
      const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
      send = (method, params = {}) => browser.send(method, params, sessionId);
      report.evaluations[row.id] = {};
      evaluate = createReviewEvaluator({ send, ready: async () => {}, evidence: report.evaluations[row.id], onRecord: write });
      await send('Runtime.enable'); await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.dpr, mobile: viewport.mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: viewport.mobile, maxTouchPoints: 5 }); await send('Page.navigate', { url: origin + '/' });
      await wait(`document.querySelector('canvas')&&document.querySelector('[data-sel=tutskip]')`, 'fresh-training-ready');
      await evaluate(`(${installNativeReviewTrace.toString()})(${JSON.stringify(row.id)})`, 'native.install');
      await evaluate(`window.__cfU2Wheels=[];document.addEventListener('wheel',e=>window.__cfU2Wheels.push({trusted:e.isTrusted,owner:e.target.closest?.('#setpanel')?.id??null,delta:e.deltaY}),{capture:true,passive:true});document.body.classList.add(...${JSON.stringify(preference.split(' ').filter(v => v !== 'default'))});true`, 'presentation.preference');
      if (viewport.safe) await evaluate(`(()=>{for(const[k,v]of Object.entries(${JSON.stringify(viewport.safe)}))document.documentElement.style.setProperty('--safe-'+k,v+'px');return true})()`, 'presentation.safe-area');
      await frames('boot.frames'); await click('#docksets'); await check('Settings above Training', { panel: true, training: true }); await capture('training-settings'); await control('settings-below-training', { panel: true, training: true });
      await click('#setpanel [data-pnx]'); await click('[data-sel=tutskip]'); await wait(`!document.body.classList.contains('training')&&!document.querySelector('[data-sel=tutskip]')`, 'skip-complete');
      await evaluate(`document.body.classList.add(...${JSON.stringify(preference.split(' ').filter(v => v !== 'default'))});true`, 'presentation.preference-after-skip');
      await click('#docksets'); await check('Settings native open', { panel: true });
      await control('earlier-equal-specificity', { panel: true }); await control('header-not-sticky', { panel: true });
      const before = await state(); const movement = await wheel('#setpanel', 10000); const scrolled = await check('Settings scrolled', { panel: true });
      assert(before.roots.setpanel.scrollHeight <= before.roots.setpanel.clientHeight + 1 || movement.scroll > movement.before, 'scrollable Settings did not move');
      row.sticky = { before: before.header, after: scrolled.header }; await capture('settings-scrolled');
      await reveal('#setcharts'); const charts = await evaluate(`document.getElementById('setcharts').getAttribute('aria-pressed')`, 'charts.before'); row.charts = [];
      for (let i = 0; i < 2; i++) { await reveal('#setcharts'); await click('#setcharts');
        await evaluate(`document.body.classList.add(...${JSON.stringify(preference.split(' ').filter(v => v !== 'default'))});true`, 'presentation.preference-after-Charts'); await frames('Charts.preference.frames');
        const actual = await evaluate(`({button:document.getElementById('setcharts').getAttribute('aria-pressed'),dock:document.getElementById('dockcharts').getAttribute('aria-pressed')})`, 'charts.after');
        row.charts.push(actual); assert.equal(actual.button, i === 0 ? String(charts !== 'true') : charts); assert.equal(actual.dock, actual.button); }
      await click('#setpanel [data-pnx]'); assert.equal(await evaluate(`document.activeElement?.id`, 'Close.focus-return'), 'docksets');
      row.survey = await evaluate(`({available:!!document.querySelector('#survey .survey-head'),visible:getComputedStyle(document.getElementById('survey')).display!=='none'})`, 'Survey.native-availability');
      row.survey.scope = 'Native current-route card only; no fabricated Survey markup';
      if (row.survey.available && !row.survey.visible) await click('#docksurvey');
      row.survey.status = row.survey.available ? 'MEASURED' : 'NOT RUN: no current-route card';
      await wait(`document.getElementById('toast').style.opacity!=='1'&&Number(getComputedStyle(document.getElementById('toast')).opacity)===0`, 'native-toast-finished-before-fixture');
      fixtureActive = true; row.fixture = await evaluate(`(${sheetFixture.toString()})()`, 'presentation.fixture'); await frames('fixture.frames');
      await check('populated lower lanes', { fixture: true }); await capture('lower-lanes'); await control('toast-over-biosphere', { fixture: true });
      row.fixtureRestoration = await evaluate(`(${sheetFixture.toString()})(true)`, 'presentation.fixture.restore'); fixtureActive = false;
      assert(row.fixtureRestoration.every(v => v.attributesExact && v.childrenExact)); await frames('fixture.restore.frames'); await check('restored native layout');
      row.nativeTrace = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace;return{events:t.events,keys:t.keys,overflow:t.overflow}})()`, 'native.complete-trace');
      assert(!row.nativeTrace.overflow && row.nativeTrace.keys.length === 0);
      assert.deepEqual(row.nativeTrace.events, report.nativeInputs.filter(p => p.row === row.id).flatMap(p => p.events));
      row.status = 'PASS'; write(); await browser.send('Target.disposeBrowserContext', { browserContextId: contextId }); contextId = null;
      assert.equal(report.errors.length, 0, 'runtime errors');
    }
    assert.equal(git(['rev-parse', 'HEAD']), source); assert.equal(git(['status', '--porcelain', '--untracked-files=all']), ''); report.status = 'PASS';
  } catch (error) { report.status = 'FAIL'; report.failure = String(error); if (row) row.status = 'FAIL'; }
  finally {
    for (const [active, expression, label] of [[faultActive, `(${sheetFault.toString()})('',true)`, 'fault'], [fixtureActive, `(${sheetFixture.toString()})(true)`, 'fixture']]) if (active) {
      try { report[label + 'EmergencyRestoration'] = await evaluate(expression, label + '.emergency-restoration'); } catch (error) { report.errors.push({ cleanup: label, error: String(error) }); }
    }
    try { await browser?.close(); } catch (error) { report.status = 'FAIL'; report.errors.push({ cleanup: 'browser', error: String(error) }); }
    if (server.listening) await new Promise(resolve => server.close(resolve)); report.endedAt = new Date().toISOString(); write(); release();
  }
  if (report.status !== 'PASS') throw new Error(report.failure || 'U2 review cleanup failed');
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 4, 'usage: ui-sheet-review.mjs BUILD_DIRECTORY NEW_OUTPUT_DIRECTORY');
  await runUiSheetReview(process.argv[2], process.argv[3]);
}
