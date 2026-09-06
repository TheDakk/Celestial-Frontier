#!/usr/bin/env node
/* U1-only review diagnostic. Normal game build, isolated raw CDP, no player
 * profile or evidence hooks. Golden raster differences are HUMAN review data;
 * CSS-pixel deltas, live mutations and restoration establish scoped geometry. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';

/** Serialized into the owned document by Slice, Glass and U1 review. This
 * independent oracle intentionally names the approved metrics, not product
 * token values. It is the adapted phone inventory outcome, not a U4 gate. */
export function readU1PhoneShell(training = false) {
  const errors = [], expected = ['dockcharters', 'dockcodex', 'primechip', 'dockshipyard', 'dockatlas',
    'dockrecords', 'docknotifications', 'dockguide', 'docksets'];
  const roots = ['dock', 'topbar', 'sceneactions'].map(id => document.getElementById(id)).filter(Boolean);
  const prior = roots.map(node => ({ node, pointer: node.style.getPropertyValue('pointer-events'),
    priority: node.style.getPropertyPriority('pointer-events'), inert: node.hasAttribute('inert') }));
  const box = node => {
    if (!node) return null;
    const r = node.getBoundingClientRect(), s = getComputedStyle(node);
    return { id: node.id, left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2,
      visible: s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 };
  };
  const available = node => {
    const r = box(node), hit = r?.visible ? document.elementFromPoint(r.cx, r.cy) : null;
    return { id: node?.id ?? null, rect: r, named: !!(node?.getAttribute('aria-label') || node?.textContent || '').trim(),
      hit: !!hit && (hit === node || node.contains(hit)), parent: node?.parentElement?.id ?? null };
  };
  try {
    if (training) for (const { node } of prior) { node.style.setProperty('pointer-events', 'auto', 'important'); node.removeAttribute('inert'); }
    const dock = document.getElementById('dock'), rect = box(dock), display = dock ? getComputedStyle(dock).display : null;
    const buttons = dock ? [...dock.querySelectorAll(':scope > button')].filter(button => box(button)?.visible) : [];
    const ids = buttons.map(button => button.id), centres = buttons.map(available), rows = [];
    if (JSON.stringify(ids) !== JSON.stringify(expected)) errors.push('dock button identity/order drifted: ' + JSON.stringify(ids));
    for (const [index, button] of buttons.entries()) {
      const r = box(button); let row = rows.find(candidate => Math.abs(candidate.top - r.top) < 2);
      if (!row) { row = { top: r.top, height: r.height, ids: [], centres: [] }; rows.push(row); }
      row.height = Math.max(row.height, r.height); row.ids.push(button.id); row.centres.push(r.cx);
      const board = expected.indexOf(button.id) < 5 && expected.includes(button.id), width = board ? 58 : 44;
      if (Math.abs(r.width - width) > 1 || r.height < 44 || (!board && Math.abs(r.height - 44) > 1))
        errors.push(button.id + ' does not retain its ' + width + 'px width and 44px touch floor');
      if (!centres[index].hit) errors.push(button.id + ' is not hit-testable at its centre');
      if (!centres[index].named) errors.push(button.id + ' is unnamed');
      if (!board) {
        const face = button.querySelector('.utility-face'), f = box(face);
        if (!f || Math.abs(f.width - 36) > 1 || Math.abs(f.height - 36) > 1)
          errors.push(button.id + ' utility face is not 36px inside its target');
      }
    }
    rows.sort((a, b) => a.top - b.top);
    if (rows.length !== 2 || rows[0]?.ids.length !== 5 || rows[1]?.ids.length !== 4)
      errors.push('dock is not two rows (5+4): ' + JSON.stringify(rows.map(row => row.ids.length)));
    for (const row of rows) for (let i = 1; i < row.centres.length; i++)
      if (Math.abs(row.centres[i] - row.centres[i - 1] - 64) > 1) errors.push('dock pitch is not 64px: ' + row.ids[i]);
    if (display !== 'grid' || !rect || Math.abs(rect.width - 320) > 1) errors.push('phone dock is not a 320px grid');
    if (rows.length === 2 && (Math.abs(rows[1].top - rows[0].top - rows[0].height - 4) > 1
      || Math.abs(rect.height - rows[0].height - 48) > 1)) errors.push('phone dock row gap or measured height drifted');
    const inventoryNode = document.getElementById('dockinventory'), relocatedInventory = available(inventoryNode);
    if (!inventoryNode?.closest('#topbar') || !relocatedInventory.rect?.visible || !relocatedInventory.hit
      || !relocatedInventory.named || relocatedInventory.rect.width < 44 || relocatedInventory.rect.height < 44)
      errors.push('relocated Inventory is missing or not actionable in topbar');
    const sceneactions = ['docksurvey', 'dockcharts'].map(id => available(document.getElementById(id)));
    for (const action of sceneactions) if (action.parent !== 'sceneactions' || !action.rect?.visible || !action.hit
      || !action.named || action.rect.width < 44 || action.rect.height < 44)
      errors.push((action.id ?? 'scene action') + ' is missing or not actionable in sceneactions');
    return { ok: errors.length === 0, errors, display, ids, expected, rows, rect, centres, relocatedInventory, sceneactions };
  } finally {
    if (training) for (const { node, pointer, priority, inert } of prior) {
      if (pointer) node.style.setProperty('pointer-events', pointer, priority); else node.style.removeProperty('pointer-events');
      if (inert) node.setAttribute('inert', ''); else node.removeAttribute('inert');
    }
  }
}

function shellGeometry() {
  const r = id => { const node = document.getElementById(id); if (!node) return null;
    const b = node.getBoundingClientRect(), s = getComputedStyle(node);
    return { id, left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height,
      visible: s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0 }; };
  const styles = getComputedStyle(document.documentElement), ids = ['topbar', 'playerchip', 'hpbar', 'searchbox',
    'dock', 'primechip', 'objchip', 'trail', 'ctxbar', 'hintpill', 'sceneactions', 'dockinventory', 'shelfnotifications', 'raillft', 'railrgt'];
  const dockNode = document.getElementById('dock'), first = r('dockcharters'), second = r('dockcodex');
  const gapPoint = first?.visible && second?.visible ? { x: (first.right + second.left) / 2, y: first.top + first.height / 2 } : null;
  const gapHit = gapPoint ? document.elementFromPoint(gapPoint.x, gapPoint.y) : null;
  return { viewport: { width: innerWidth, height: innerHeight }, rects: Object.fromEntries(ids.map(id => [id, r(id)])),
    dockGap: { point: gapPoint, owned: gapHit === dockNode, hit: gapHit?.id || gapHit?.tagName || null },
    font: getComputedStyle(document.body).fontFamily, fontSize: getComputedStyle(document.body).fontSize,
    topbarPublished: parseFloat(styles.getPropertyValue('--topbar-h')), row1Published: parseFloat(styles.getPropertyValue('--row1-h')),
    safeBottom: parseFloat(styles.getPropertyValue('--safe-bottom')) || 0,
    safeRight: parseFloat(styles.getPropertyValue('--safe-right')) || 0,
    hintHeight: document.getElementById('hintpill')?.offsetHeight ?? 0,
    dockDisplay: getComputedStyle(document.getElementById('dock')).display,
    dockPointerEvents: getComputedStyle(document.getElementById('dock')).pointerEvents,
    dock: [...document.querySelectorAll('#dock > button')].map(node => {
      const rect = r(node.id), face = node.querySelector('.utility-face'), f = face?.getBoundingClientRect();
      const hit = rect?.visible ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
      return { ...rect, named: !!(node.getAttribute('aria-label') || node.textContent || '').trim(),
        native: node.tagName === 'BUTTON' && !node.disabled && !node.closest('[inert]'),
        hit: !!hit && (hit === node || node.contains(hit)),
        face: f ? { width: f.width, height: f.height } : null };
    }).filter(row => row.visible),
    bodyClasses: document.body.className, horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
}
function metricDeltas(state) {
  const { rects: r, viewport: v, safeBottom, safeRight } = state, phone = v.width <= 700, rows = [];
  const add = (name, actual, expected, scope = 'v1 law', tolerance = 1) => rows.push({ name, actual, expected, delta: actual - expected,
    pass: Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, scope, tolerance });
  add('topbar published height', state.topbarPublished, r.topbar.height, 'measured sync');
  for (const id of ['raillft', 'railrgt']) add(id + ' hidden', r[id]?.visible ? 1 : 0, 0, 'centered launcher has no visible side rails', 0);
  add('Search/bell gap', r.shelfnotifications.left - r.searchbox.right, 8);
  add('shelf bell right inset', v.width - r.shelfnotifications.right - safeRight, phone ? 10 : 18);
  add('Search/bell centre alignment', r.searchbox.top + r.searchbox.height / 2
    - r.shelfnotifications.top - r.shelfnotifications.height / 2, 0);
  add('objective left inset', r.objchip.left, 18);
  add('objective top offset', r.objchip.top - r.topbar.height, 128);
  if (r.trail.visible) add('trail top offset', r.trail.top - r.topbar.height, 8, 'v2 continuation in reserved lane');
  if (phone) {
    add('phone shelf height', r.topbar.height, 88, 'U1 default content height; v1 has no fixed shelf-height law');
    add('phone dock bottom', v.height - r.dock.bottom - safeBottom, 12);
    add('phone dock width', r.dock.width, 320);
    add('phone dock height (default text)', r.dock.height, 92, 'U1 default Inter content baseline; larger text may grow');
    add('phone hint bottom', v.height - r.hintpill.bottom - safeBottom, 124);
    add('phone caption bottom', v.height - r.ctxbar.bottom - safeBottom, 164);
    const boards = state.dock.slice(0, 5), utilities = state.dock.slice(5);
    for (const [group, buttons] of [['boards', boards], ['utilities', utilities]])
      for (let i = 1; i < buttons.length; i++) add(group + ' centre pitch ' + i,
        buttons[i].left + buttons[i].width / 2 - buttons[i - 1].left - buttons[i - 1].width / 2, 64);
  } else {
    const desktop = v.width >= 1100, pitch = desktop ? 80 : 72, target = desktop ? 56 : 48;
    const boardWidth = desktop ? 74 : 66, face = desktop ? 44 : 40;
    add('launcher tray gap owner', state.dockGap?.owned ? 1 : 0, 1, 'visible tray owns empty launcher gaps', 0);
    add('launcher centre', r.dock.left + r.dock.width / 2, v.width / 2, 'centered launcher');
    add('launcher bottom', v.height - r.dock.bottom - safeBottom, 12, 'centered launcher');
    add('launcher width', r.dock.width, desktop ? 752 : 672, 'nine scaled tracks and symmetric padding');
    add('launcher height (default text)', r.dock.height, desktop ? 88 : 72, 'default Inter content baseline; larger text may grow');
    add('launcher hint bottom', v.height - r.hintpill.bottom - safeBottom, Math.max(96, r.dock.height + 28), 'measured launcher clearance');
    add('launcher caption bottom', v.height - r.ctxbar.bottom - safeBottom,
      Math.max(136, r.dock.height + 28 + state.hintHeight + 8), 'measured launcher and hint clearance');
    for (const [index, button] of state.dock.entries()) {
      add(button.id + ' launcher width', button.width, index < 5 ? boardWidth : target, 'scaled native launcher');
      add(button.id + ' launcher height', button.height, target, 'default Inter target baseline; board text may grow');
      add(button.id + ' launcher row centre', button.top + button.height / 2, r.dock.top + r.dock.height / 2, 'single centered row');
      if (index >= 5) {
        add(button.id + ' utility face width', button.face?.width, face, 'scaled painted face');
        add(button.id + ' utility face height', button.face?.height, face, 'scaled painted face');
      }
      if (index > 0) add('launcher centre pitch ' + index,
        button.left + button.width / 2 - state.dock[index - 1].left - state.dock[index - 1].width / 2, pitch, 'scaled launcher rhythm');
    }
  }
  return rows;
}
const LAUNCHER_PANELS = [
  ['dockcharters', 'chpanel'], ['dockcodex', 'codexpanel'], ['primechip', 'primepanel'],
  ['dockshipyard', 'shipyardpanel'], ['dockatlas', 'atlaspanel'], ['dockrecords', 'recpanel'],
  ['docknotifications', 'notificationpanel'], ['dockguide', 'guidepanel'], ['docksets', 'setpanel'],
];
function launcherOutcome(state) {
  const expected = LAUNCHER_PANELS.map(([id]) => id), ids = state.dock.map(button => button.id), errors = [];
  if (JSON.stringify(ids) !== JSON.stringify(expected)) errors.push('native launcher identity/order drifted: ' + JSON.stringify(ids));
  for (const button of state.dock) if (!button.native || !button.named || !button.hit)
    errors.push(button.id + ' is not a named, native, center-hit-testable opener');
  if (state.dockDisplay !== 'grid') errors.push('launcher is not a grid');
  if (state.viewport.width > 700 && (state.dockPointerEvents !== 'auto' || !state.dockGap?.owned)) errors.push('visible launcher tray does not own its measured empty gap');
  return { pass: errors.length === 0, ids, expected, errors };
}
/** Passive review-owned observations of public DOM/input only. No product
 * evidence hook, navigation write, event cancellation or recovery action. */
function installNativeReviewTrace(viewport) {
  const snapshot = () => ({ at: performance.now(), trail: [...document.querySelectorAll('#trail .seg')].map(node => node.textContent),
    context: document.getElementById('ctxbar')?.textContent ?? null, focusedId: document.activeElement?.id ?? null,
    bodyClasses: document.body.className });
  const describe = node => node instanceof Element ? { tag: node.tagName, id: node.id || null,
    sel: node.getAttribute('data-sel'), close: node.getAttribute('data-pnx') } : { tag: node === document ? '#document' : '#window' };
  const trace = { viewport, events: [], changes: [], active: null, nextId: 0, overflow: false, snapshot };
  const append = (list, entry) => { if (list.length >= 1000) trace.overflow = true; else list.push(entry); };
  for (const type of ['pointerdown', 'pointerup', 'click']) document.addEventListener(type, event => {
    const path = event.composedPath(), requested = trace.active;
    append(trace.events, { ...snapshot(), type, eventTime: event.timeStamp, trusted: event.isTrusted,
      x: event.clientX, y: event.clientY, pointerType: event.pointerType || null, pressId: requested?.id ?? null,
      selector: requested?.selector ?? null, requestedControlInPath: !!requested && path.includes(requested.node),
      requestedControlConnected: requested?.node.isConnected ?? false, target: describe(event.target), path: path.map(describe) });
  }, { capture: true, passive: true });
  let priorTrail = JSON.stringify(snapshot().trail);
  const observer = new MutationObserver(() => {
    const next = snapshot(), serialized = JSON.stringify(next.trail);
    if (serialized !== priorTrail) { append(trace.changes, { ...next, pressId: trace.active?.id ?? null }); priorTrail = serialized; }
  });
  observer.observe(document.getElementById('trail'), { childList: true, subtree: true, characterData: true });
  trace.changes.push({ ...snapshot(), pressId: null, initial: true });
  Object.defineProperty(window, '__cfU1ReviewNativeTrace', { value: trace, configurable: true });
  return snapshot();
}
function assessNativeReviewDelivery(proof) {
  const expectedTypes = ['pointerdown', 'pointerup', 'click'], events = proof.events ?? [];
  const exactTypes = JSON.stringify(events.map(event => event.type)) === JSON.stringify(expectedTypes);
  const exactOwner = events.every(event => event.pressId === proof.id && event.selector === proof.selector
    && event.trusted === true && event.requestedControlInPath === true && event.requestedControlConnected === true);
  return { pass: !proof.dispatchError && !proof.overflow && exactTypes && exactOwner, exactTypes, exactOwner };
}
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export async function runUiShellReview(buildArgument, outputArgument) {
  assert(buildArgument && outputArgument, 'usage: node tools/ui-shell-review.mjs BUILD_DIRECTORY NEW_OUTPUT_DIRECTORY');
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  const source = git(['rev-parse', 'HEAD']); assert.equal(git(['diff', '--name-only', 'HEAD']), '', 'review source must be committed');
  const build = fs.realpathSync(buildArgument), output = path.resolve(outputArgument);
  assert(!fs.existsSync(output), 'review output must be new; never overwrite previous/red evidence');
  fs.mkdirSync(output, { recursive: true });
  const index = fs.readFileSync(path.join(build, 'index.html'), 'utf8');
  assert(/name="cf-build-mode" content="distributable"/.test(index), 'review requires a normal distributable build, not evidence mode');
  const workerBytes = fs.readFileSync(path.join(build, 'service-worker.js'));
  const assetMatch = /const ASSETS=Object\.freeze\((\[[^\n]+\])\);/u.exec(workerBytes.toString());
  assert(assetMatch, 'normal build has no asset inventory');
  const assets = JSON.parse(assetMatch[1]).map(row => { const file = path.resolve(build, '.' + row.path);
    assert(file.startsWith(build + path.sep) && fs.lstatSync(file).isFile(), 'unsafe asset carrier');
    const bytes = fs.readFileSync(file); assert.equal(sha(bytes), row.sha256, 'build asset digest'); return { ...row, bytes: bytes.length }; });
  const goldenRoot = path.join(repo, 'port/baseline-v1.8.9/screens');
  const goldenManifest = JSON.parse(fs.readFileSync(path.join(goldenRoot, 'MANIFEST.json'))).shots;
  const cases = [['phone', 390, 844, true], ['desktop', 1440, 900, false], ['tablet', 834, 1112, true]];
  const report = { schema: 'cf-u1-shell-review/v1', certification: false, source, startedAt: new Date().toISOString(),
    build: { indexSha256: sha(Buffer.from(index)), serviceWorkerSha256: sha(workerBytes), assets },
    status: 'RUNNING', rows: [], journeys: [], nativeInputs: [], nativeTraces: [], images: [], errors: [], limitations: [
      'U1 geometry diagnostic only, not U4, full Glass, real iPhone or HUMAN visual acceptance.',
      'Golden raster differences reflect scene/save/browser/font differences as well as design; no pixel-equality verdict.',
      'New game uses native Skip then bounded Escape ascent to the visible Cosmos breadcrumb, not a legacy import; camera, progression and save differences remain visible in the comparison.',
      'Notification screenshots use only naturally available messages; this diagnostic does not certify cross-session persistence.',
      'Tablet and desktop now use a centered nine-button launcher at 72px and 80px pitch respectively; golden rasters retain the earlier layout for human comparison.',
      'The three default-text viewports do not certify the separate short-landscape panel-open placement or enlarged Settings text.',
    ] };
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.webp': 'image/webp', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
  const server = http.createServer((request, response) => {
    try { const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = path.resolve(build, '.' + (name === '/' ? '/index.html' : name));
      assert(file.startsWith(build + path.sep) && fs.statSync(file).isFile());
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(response);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  let browser, collectNativeTrace;
  const writeReport = () => fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify(report, null, 2) + '\n');
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await openChromiumCdp({ label: 'U1 isolated normal-game review', userDataPrefix: 'cf-u1-review',
      onEvent: event => { if (event.method === 'Runtime.exceptionThrown') report.errors.push(event.params.exceptionDetails.exception?.description ?? event.params.exceptionDetails.text); } });
    report.browser = browser.browser;
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params = {}) => browser.send(method, params, sessionId);
    await send('Runtime.enable'); await send('Page.enable');
    const evaluate = async expression => { const answer = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      assert(!answer.exceptionDetails, answer.exceptionDetails?.exception?.description ?? answer.exceptionDetails?.text); return answer.result.value; };
    const wait = condition => evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+25000;const tick=()=>{if(${condition})resolve(true);else if(performance.now()>end)reject(new Error('U1 readiness deadline'));else setTimeout(tick,50)};tick()})`);
    const capture = async (file, clip) => { const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? { clip } : {}) });
      const bytes = Buffer.from(data, 'base64'); fs.writeFileSync(path.join(output, file), bytes);
      report.images.push({ file, bytes: bytes.length, sha256: sha(bytes) }); return bytes; };
    const frames = () => evaluate(`document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))))`);
    const scene = () => evaluate(`({trail:[...document.querySelectorAll('#trail .seg')].map(node=>node.textContent),context:document.getElementById('ctxbar')?.textContent,bodyClasses:document.body.className})`);
    collectNativeTrace = async () => {
      const trace = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace;return t?{viewport:t.viewport,events:t.events,changes:t.changes,overflow:t.overflow,final:t.snapshot()}:null;})()`);
      if (trace) {
        const previous = report.nativeTraces.findIndex(row => row.viewport === trace.viewport);
        if (previous < 0) report.nativeTraces.push(trace); else report.nativeTraces[previous] = trace;
        writeReport();
      }
    };
    const clickNative = async (selector, expectedTrail = ['Cosmos']) => {
      const proof = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace,e=document.querySelector(${JSON.stringify(selector)});if(!t||!e)throw new Error('Native control/trace missing');
        const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);
        if(e.tagName!=='BUTTON'||e.disabled||e.closest('[inert]')||r.width<=0||r.height<=0||!(h===e||e.contains(h)))throw new Error('Native control unavailable: '+${JSON.stringify(selector)});
        const id=++t.nextId;t.active={id,selector:${JSON.stringify(selector)},node:e};
        return{id,selector:${JSON.stringify(selector)},viewport:t.viewport,point:{x,y},eventStart:t.events.length,changeStart:t.changes.length,beforePress:t.snapshot()};})()`);
      report.nativeInputs.push(proof); writeReport();
      if (expectedTrail) assert.deepEqual(proof.beforePress.trail, expectedTrail, selector + ' native input predecessor changed scope');
      let dispatchError;
      try {
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...proof.point, button: 'left', clickCount: 1 });
        proof.afterDown = await evaluate('window.__cfU1ReviewNativeTrace.snapshot()');
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...proof.point, button: 'left', clickCount: 1 });
        proof.afterUp = await evaluate('window.__cfU1ReviewNativeTrace.snapshot()');
      } catch (error) { dispatchError = error; proof.dispatchError = String(error); }
      const observed = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace,events=t.events.slice(${proof.eventStart}),changes=t.changes.slice(${proof.changeStart});
        t.active=null;return{events,changes,overflow:t.overflow};})()`);
      Object.assign(proof, observed); proof.delivery = assessNativeReviewDelivery(proof); writeReport();
      if (dispatchError) throw dispatchError;
      assert(proof.delivery.pass, selector + ' did not receive the exact trusted native pointer sequence: ' + JSON.stringify(proof));
    };
    for (const [name, width, height, mobile] of cases) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
      await send('Page.navigate', { url: origin + '/' });
      await wait(`document.querySelector('canvas') && document.getElementById('primechip')?.textContent.includes('/9')`);
      await evaluate(`(${installNativeReviewTrace.toString()})(${JSON.stringify(name)})`);
      if (await evaluate(`!!document.querySelector('[data-sel=tutskip]')`)) await clickNative('[data-sel=tutskip]', null);
      await wait(`!document.body.classList.contains('training') && !document.querySelector('[data-sel=tutskip]')`);
      await frames();
      const journey = { name, before: await scene(), steps: [], after: null };
      report.journeys.push(journey); writeReport();
      let currentScene = journey.before;
      for (let presses = 0; JSON.stringify(currentScene.trail) !== '["Cosmos"]' && presses < 6; presses++) {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
        await frames(); currentScene = await scene(); journey.steps.push({ input: 'Escape', after: currentScene }); writeReport();
      }
      journey.after = currentScene; writeReport();
      assert.deepEqual(currentScene.trail, ['Cosmos'], name + ' native ascent did not reach Cosmos within six Escape presses');
      const state = await evaluate(`(${shellGeometry.toString()})()`), deltas = metricDeltas(state);
      const phone = width <= 700 ? await evaluate(`(${readU1PhoneShell.toString()})(false)`) : null;
      const candidate = await capture(`u1-main-${name}.png`);
      const goldenFile = `ui-main-${name}.png`, golden = fs.readFileSync(path.join(goldenRoot, goldenFile));
      assert.equal(sha(golden), goldenManifest.find(row => row.file === goldenFile)?.sha256, 'golden integrity');
      const launcher = launcherOutcome(state);
      const row = { name, scene: currentScene, state, deltas, phone, launcher, golden: { file: goldenFile, sha256: sha(golden) },
        pass: deltas.every(delta => delta.pass) && launcher.pass && !state.horizontalOverflow && (!phone || phone.ok), controls: [] };
      report.rows.push(row); writeReport();
      assert(row.pass, name + ' U1 geometry: ' + JSON.stringify({ deltas: deltas.filter(d => !d.pass), phone: phone?.errors, launcher: launcher.errors }));
      // Open and close the real shelf bell without seeding history or modifying panel styling.
      await clickNative('#shelfnotifications');
      await wait(`getComputedStyle(document.getElementById('notificationpanel')).display !== 'none'`);
      await frames();
      const notification = await evaluate(`(()=>{const panel=document.getElementById('notificationpanel'),close=panel.querySelector('[data-pnx]');
        const box=node=>{if(!node)return null;const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
        const p=box(panel),c=box(close),hit=c?document.elementFromPoint(c.left+c.width/2,c.top+c.height/2):null;
        return{panel:p,close:c,closeNamed:!!close?.getAttribute('aria-label'),closeNative:close?.tagName==='BUTTON'&&!close.disabled&&!close.closest('[inert]'),closeHit:!!hit&&(hit===close||close.contains(hit)),historyRows:panel.querySelectorAll('.notification-entry').length,emptyState:!!panel.querySelector('.notification-empty'),viewport:{width:innerWidth,height:innerHeight}};})()`);
      row.notifications = notification;
      await capture(`u1-notifications-${name}.png`); writeReport();
      const notificationBoundsPass = proof => !!proof.panel && !!proof.close
        && proof.panel.left >= -1 && proof.panel.top >= -1
        && proof.panel.right <= proof.viewport.width + 1 && proof.panel.bottom <= proof.viewport.height + 1
        && proof.close.left >= Math.max(0, proof.panel.left) - 1 && proof.close.top >= Math.max(0, proof.panel.top) - 1
        && proof.close.right <= Math.min(proof.viewport.width, proof.panel.right) + 1
        && proof.close.bottom <= Math.min(proof.viewport.height, proof.panel.bottom) + 1
        && proof.close.width >= 44 && proof.close.height >= 44 && proof.closeNamed && proof.closeNative && proof.closeHit;
      notification.pass = notificationBoundsPass(notification); writeReport();
      assert(notification.pass, name + ' native Notifications panel/Close is not bounded and actionable: ' + JSON.stringify(notification));
      notification.controls = [
        ['panel outside viewport', { ...notification, panel: { ...notification.panel, left: -2 } }],
        ['Close below touch floor', { ...notification, close: { ...notification.close, height: 43 } }],
        ['Close covered', { ...notification, closeHit: false }],
        ['Close unnamed', { ...notification, closeNamed: false }],
      ].map(([controlName, proof]) => ({ name: controlName, rejected: !notificationBoundsPass(proof) }));
      assert(notification.controls.every(control => control.rejected), 'Notifications geometry oracle accepted a malformed observation');
      await clickNative('#notificationpanel [data-pnx]');
      await wait(`getComputedStyle(document.getElementById('notificationpanel')).display === 'none'`);
      await frames();
      const restoredState = await evaluate(`(${shellGeometry.toString()})()`);
      notification.closed = { focusedId: await evaluate(`document.activeElement?.id`), scene: await scene(),
        deltas: metricDeltas(restoredState), phone: width <= 700 ? await evaluate(`(${readU1PhoneShell.toString()})(false)`) : null };
      writeReport();
      assert.equal(notification.closed.focusedId, 'shelfnotifications', name + ' Notifications Close did not restore its exact native opener');
      assert.deepEqual(notification.closed.scene.trail, ['Cosmos']);
      assert(notification.closed.deltas.every(delta => delta.pass) && launcherOutcome(restoredState).pass && !restoredState.horizontalOverflow
        && (!notification.closed.phone || notification.closed.phone.ok), name + ' main shell did not restore after Notifications Close');
      // Every launcher owner must reach its own real panel and return focus to
      // that same button. This is shell reachability, not a U2 panel redesign.
      row.launcherJourneys = [];
      for (const [openerId, panelId] of LAUNCHER_PANELS) {
        const action = { openerId, panelId }; row.launcherJourneys.push(action); writeReport();
        assert.equal(await evaluate(`document.getElementById(${JSON.stringify(openerId)})?.getAttribute('aria-controls')`),
          panelId, name + ' launcher opener is wired to a different panel: ' + openerId);
        await clickNative('#' + openerId);
        await wait(`getComputedStyle(document.getElementById(${JSON.stringify(panelId)})).display !== 'none'`);
        await frames();
        action.opened = await evaluate(`(()=>{const opener=document.getElementById(${JSON.stringify(openerId)}),panel=document.getElementById(${JSON.stringify(panelId)}),close=panel.querySelector('[data-pnx]');
          const r=panel.getBoundingClientRect(),c=close?.getBoundingClientRect(),h=c?document.elementFromPoint(c.left+c.width/2,c.top+c.height/2):null;
          return{expanded:opener.getAttribute('aria-expanded'),panelHidden:panel.getAttribute('aria-hidden'),panelVisible:getComputedStyle(panel).visibility!=='hidden'&&r.width>0&&r.height>0,
            closeNamed:!!(close?.getAttribute('aria-label')||close?.textContent||'').trim(),closeNative:close?.tagName==='BUTTON'&&!close.disabled&&!close.closest('[inert]'),
            closeHit:!!h&&(h===close||close.contains(h)),closeWidth:c?.width??0,closeHeight:c?.height??0,focusedClose:document.activeElement===close};})()`);
        const opened = action.opened;
        action.openPass = opened.expanded === 'true' && opened.panelHidden === 'false' && opened.panelVisible
          && opened.closeNamed && opened.closeNative && opened.closeHit && opened.closeWidth >= 44 && opened.closeHeight >= 44 && opened.focusedClose;
        writeReport(); assert(action.openPass, name + ' native launcher open failed: ' + JSON.stringify(action));
        await clickNative('#' + panelId + ' [data-pnx]');
        await wait(`getComputedStyle(document.getElementById(${JSON.stringify(panelId)})).display === 'none'`);
        await frames();
        const closedState = await evaluate(`(${shellGeometry.toString()})()`);
        action.closed = { focusedId: await evaluate('document.activeElement?.id'),
          expanded: await evaluate(`document.getElementById(${JSON.stringify(openerId)}).getAttribute('aria-expanded')`),
          scene: await scene(), deltas: metricDeltas(closedState), launcher: launcherOutcome(closedState),
          phone: width <= 700 ? await evaluate(`(${readU1PhoneShell.toString()})(false)`) : null };
        action.closePass = action.closed.focusedId === openerId && action.closed.expanded === 'false'
          && JSON.stringify(action.closed.scene.trail) === '["Cosmos"]' && action.closed.deltas.every(delta => delta.pass)
          && action.closed.launcher.pass && !closedState.horizontalOverflow && (!action.closed.phone || action.closed.phone.ok);
        writeReport(); assert(action.closePass, name + ' native launcher Close did not restore its exact opener and shell: ' + JSON.stringify(action));
      }
      // Break a measured anchor in the live document, require red, restore and re-observe green.
      const control = await evaluate(`(()=>{const e=document.getElementById('objchip'),prior={present:e.hasAttribute('style'),value:e.getAttribute('style')};
        let broken;try{e.style.setProperty('left','118px','important');broken=(${shellGeometry.toString()})();}
        finally{e.setAttribute('style','');e.removeAttribute('style');if(prior.present)e.setAttribute('style',prior.value);}
        return{broken,restored:(${shellGeometry.toString()})(),styleRestored:e.hasAttribute('style')===prior.present&&e.getAttribute('style')===prior.value};})()`);
      assert(metricDeltas(control.broken).some(d => d.name === 'objective left inset' && !d.pass));
      assert(control.styleRestored && metricDeltas(control.restored).every(d => d.pass) && launcherOutcome(control.restored).pass);
      row.controls.push({ name: 'live objective displaced100px; exact style restored', brokenDeltas: metricDeltas(control.broken), styleRestored: control.styleRestored, restored: true });
      const metricMutations = [
        ['raillft hidden', '#raillft', 'display', 'flex'],
        ['railrgt hidden', '#railrgt', 'display', 'flex'],
        ['topbar published height', ':root', '--topbar-h', '321px'],
        ['Search/bell gap', '#searchbox', 'transform', 'translateX(10px)'],
        ['shelf bell right inset', '#shelfnotifications', 'transform', 'translateX(10px)'],
        ['Search/bell centre alignment', '#searchbox', 'transform', 'translateY(10px)'],
        ['objective top offset', '#objchip', 'top', '1px'],
        ...(state.rects.trail.visible ? [['trail top offset', '#trail', 'top', '1px']] : []),
        ...(width <= 700 ? [
          ['phone shelf height', '#topbar', 'min-height', '188px'],
          ['phone dock bottom', '#dock', 'bottom', '1px'],
          ['phone dock width', '#dock', 'width', '280px'],
          ['phone dock height (default text)', '#dock', 'height', '120px'],
          ['phone hint bottom', '#hintpill', 'bottom', '1px'],
          ['phone caption bottom', '#ctxbar', 'bottom', '1px'],
          ...state.dock.slice(1, 5).map((button, i) => ['boards centre pitch ' + (i + 1), '#' + button.id, 'transform', 'translateX(10px)']),
          ...state.dock.slice(6).map((button, i) => ['utilities centre pitch ' + (i + 1), '#' + button.id, 'transform', 'translateX(10px)']),
        ] : [
          ['launcher tray gap owner', '#dock', 'pointer-events', 'none'],
          ['launcher centre', '#dock', 'transform', 'translateX(-40%)'],
          ['launcher bottom', '#dock', 'bottom', '1px'],
          ['launcher width', '#dock', 'width', '620px'],
          ['launcher height (default text)', '#dock', 'height', '120px'],
          ['launcher hint bottom', '#hintpill', 'bottom', '1px'],
          ['launcher caption bottom', '#ctxbar', 'bottom', '1px'],
          ['launcher centre pitch 1', '#dock', 'grid-template-columns', 'repeat(9,52px)'],
          ...state.dock.slice(1).map((button, i) => ['launcher centre pitch ' + (i + 1), '#' + button.id, 'transform', 'translateX(10px)']),
          ['dockcharters launcher width', '#dockcharters', 'width', '100px'],
          ['dockcharters launcher height', '#dockcharters', 'height', '100px'],
          ['dockcharters launcher row centre', '#dockcharters', 'transform', 'translateY(10px)'],
          ['dockrecords launcher width', '#dockrecords', 'width', '100px'],
          ['dockrecords launcher height', '#dockrecords', 'height', '100px'],
          ['dockrecords utility face width', '#dockrecords .utility-face', 'width', '30px'],
          ['dockrecords utility face height', '#dockrecords .utility-face', 'height', '30px'],
        ]),
      ];
      for (const [metric, selector, property, value] of metricMutations) {
        const proof = await evaluate(`(()=>{const node=document.querySelector(${JSON.stringify(selector)}),property=${JSON.stringify(property)},
          prior={present:node.hasAttribute('style'),value:node.getAttribute('style')},propertyValue=node.style.getPropertyValue(property),priority=node.style.getPropertyPriority(property);let broken;
          try{node.style.setProperty(property,${JSON.stringify(value)},'important');broken=(${shellGeometry.toString()})();}
          finally{node.setAttribute('style','');node.removeAttribute('style');if(prior.present)node.setAttribute('style',prior.value);}
          return{broken,restored:(${shellGeometry.toString()})(),styleRestored:node.hasAttribute('style')===prior.present&&node.getAttribute('style')===prior.value,
            propertyRestored:node.style.getPropertyValue(property)===propertyValue&&node.style.getPropertyPriority(property)===priority};})()`);
        const brokenDelta = metricDeltas(proof.broken).find(delta => delta.name === metric), restoredDeltas = metricDeltas(proof.restored);
        row.controls.push({ name: metric, selector, property, value, brokenDelta, broken: proof.broken, restoredObservation: proof.restored,
          styleRestored: proof.styleRestored, propertyRestored: proof.propertyRestored,
          restored: restoredDeltas.every(delta => delta.pass) && launcherOutcome(proof.restored).pass });
        writeReport();
        assert(brokenDelta && !brokenDelta.pass && proof.styleRestored && proof.propertyRestored && row.controls.at(-1).restored,
          name + ' geometry control failed: ' + JSON.stringify(row.controls.at(-1)));
      }
      for (const [controlName, selector, property, value] of [
        ['missing native Prime opener', '#primechip', 'display', 'none'],
        ['Settings opener cannot receive a native pointer', '#docksets', 'pointer-events', 'none'],
      ]) {
        const proof = await evaluate(`(()=>{const node=document.querySelector(${JSON.stringify(selector)}),prior={present:node.hasAttribute('style'),value:node.getAttribute('style')};let broken;
          try{node.style.setProperty(${JSON.stringify(property)},${JSON.stringify(value)},'important');broken=(${shellGeometry.toString()})();}
          finally{node.setAttribute('style','');node.removeAttribute('style');if(prior.present)node.setAttribute('style',prior.value);}
          return{broken,restored:(${shellGeometry.toString()})(),styleRestored:node.hasAttribute('style')===prior.present&&node.getAttribute('style')===prior.value};})()`);
        const broken = launcherOutcome(proof.broken), restored = launcherOutcome(proof.restored);
        row.controls.push({ name: controlName, selector, property, value, broken, brokenObservation: proof.broken,
          styleRestored: proof.styleRestored, restoredObservation: proof.restored, restored: restored.pass && metricDeltas(proof.restored).every(delta => delta.pass) });
        writeReport();
        assert(!broken.pass && proof.styleRestored && row.controls.at(-1).restored,
          name + ' native launcher control failed: ' + JSON.stringify(row.controls.at(-1)));
      }
      await collectNativeTrace();
      // Use an isolated generated proof page for exact-sized originals, raster difference and contact sheet.
      const imageData = [golden, candidate].map(bytes => 'data:image/png;base64,' + bytes.toString('base64'));
      await send('Page.navigate', { url: 'about:blank' });
      await evaluate(`(async()=>{document.body.style.cssText='margin:0;background:#101624;color:#edf2fa;font:16px system-ui';
        const sources=${JSON.stringify(imageData)},labels=['Production v1.8.9 golden','U1 candidate','Raster difference — review only'];
        const images=await Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;})));
        const grid=document.createElement('div');grid.style.cssText='display:flex;gap:16px;padding:16px;width:max-content';
        const canvases=images.map(i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);return c});
        const diff=document.createElement('canvas');diff.width=${width};diff.height=${height};const a=canvases[0].getContext('2d').getImageData(0,0,${width},${height}),b=canvases[1].getContext('2d').getImageData(0,0,${width},${height}),ctx=diff.getContext('2d'),d=ctx.createImageData(${width},${height});
        for(let i=0;i<d.data.length;i+=4){for(let c=0;c<3;c++)d.data[i+c]=Math.abs(a.data[i+c]-b.data[i+c]);d.data[i+3]=255;}ctx.putImageData(d,0,0);canvases.push(diff);
        canvases.forEach((canvas,i)=>{const col=document.createElement('section'),label=document.createElement('div');label.textContent=labels[i];label.style.cssText='height:32px';col.append(label,canvas);grid.append(col)});document.body.append(grid);return true;})()`);
      await send('Emulation.setDeviceMetricsOverride', { width: width * 3 + 64, height: height + 64, deviceScaleFactor: 1, mobile: false });
      await capture(`u1-main-${name}-comparison.png`, { x: 0, y: 0, width: width * 3 + 64, height: height + 64, scale: 1 });
    }
    assert.equal(report.errors.length, 0, report.errors.join('\n'));
    assert.equal(git(['rev-parse', 'HEAD']), source, 'source changed during review');
    assert.equal(git(['diff', '--name-only', 'HEAD']), '', 'source became dirty during review');
    report.status = 'PASS';
  } catch (error) {
    report.status = 'FAIL'; report.failure = String(error);
    try { await collectNativeTrace?.(); } catch (traceError) { report.nativeTraceCollectionError = String(traceError); }
    throw error;
  } finally { await browser?.close(); if (server.listening) await new Promise(resolve => server.close(resolve)); report.endedAt = new Date().toISOString(); writeReport(); }
  console.log(`U1 REVIEW PASS: ${report.rows.length} scoped viewports; ${report.images.length} PNGs; ${source}`);
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runUiShellReview(process.argv[2], process.argv[3]);
}
