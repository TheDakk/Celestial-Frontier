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
    'dock', 'primechip', 'objchip', 'trail', 'ctxbar', 'hintpill', 'sceneactions', 'dockinventory'];
  return { viewport: { width: innerWidth, height: innerHeight }, rects: Object.fromEntries(ids.map(id => [id, r(id)])),
    font: getComputedStyle(document.body).fontFamily, fontSize: getComputedStyle(document.body).fontSize,
    topbarPublished: parseFloat(styles.getPropertyValue('--topbar-h')), row1Published: parseFloat(styles.getPropertyValue('--row1-h')),
    safeBottom: parseFloat(styles.getPropertyValue('--safe-bottom')) || 0,
    dock: [...document.querySelectorAll(innerWidth <= 700 ? '#dock > button' : '#dock > .dock-utility')].map(node => r(node.id)).filter(row => row?.visible),
    bodyClasses: document.body.className, horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
}
function metricDeltas(state) {
  const { rects: r, viewport: v, safeBottom } = state, phone = v.width <= 700, rows = [];
  const add = (name, actual, expected, scope = 'v1 law') => rows.push({ name, actual, expected, delta: actual - expected,
    pass: Number.isFinite(actual) && Math.abs(actual - expected) <= 1, scope });
  add('topbar published height', state.topbarPublished, r.topbar.height, 'measured sync');
  add('objective left inset', r.objchip.left, 18);
  add('objective top offset', r.objchip.top - r.topbar.height, 128);
  if (r.trail.visible) add('trail top offset', r.trail.top - r.topbar.height, 8, 'v2 continuation in reserved lane');
  if (phone) {
    add('phone shelf height', r.topbar.height, 88, 'U1 default content height; v1 has no fixed shelf-height law');
    add('phone dock bottom', v.height - r.dock.bottom - safeBottom, 12);
    add('phone dock width', r.dock.width, 320);
    add('phone dock height (default text)', r.dock.height, 92);
    add('phone hint bottom', v.height - r.hintpill.bottom - safeBottom, 124);
    add('phone caption bottom', v.height - r.ctxbar.bottom - safeBottom, 164);
    const boards = state.dock.slice(0, 5), utilities = state.dock.slice(5);
    for (const [group, buttons] of [['boards', boards], ['utilities', utilities]])
      for (let i = 1; i < buttons.length; i++) add(group + ' centre pitch ' + i,
        buttons[i].left + buttons[i].width / 2 - buttons[i - 1].left - buttons[i - 1].width / 2, 64);
  } else {
    add('Prime centre', r.primechip.left + r.primechip.width / 2, v.width / 2);
    add('utility right inset', v.width - r.dock.right, 12);
    for (let i = 1; i < state.dock.length; i++) add('desktop utility centre pitch ' + i,
      state.dock[i].left + state.dock[i].width / 2 - state.dock[i - 1].left - state.dock[i - 1].width / 2,
      44, '44px touch floor; intentional +2px vs legacy 42px');
  }
  return rows;
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
    status: 'RUNNING', rows: [], images: [], errors: [], limitations: [
      'U1 geometry diagnostic only, not U4, full Glass, real iPhone or HUMAN visual acceptance.',
      'Golden raster differences reflect scene/save/browser/font differences as well as design; no pixel-equality verdict.',
      'New game uses its native Skip journey, not a legacy import; named scene differences remain visible in the comparison.',
      'Desktop utility pitch is 44px for the retained touch floor, +2px against legacy 42px intention.',
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
  let browser;
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
    for (const [name, width, height, mobile] of cases) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
      await send('Page.navigate', { url: origin + '/' });
      await wait(`document.querySelector('canvas') && document.getElementById('primechip')?.textContent.includes('/9')`);
      if (await evaluate(`!!document.querySelector('[data-sel=tutskip]')`)) {
        const point = await evaluate(`(()=>{const e=document.querySelector('[data-sel=tutskip]'),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);if(!(h===e||e.contains(h)))throw new Error('Skip center covered');return{x,y}})()`);
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
      }
      await wait(`!document.body.classList.contains('training') && !document.querySelector('[data-sel=tutskip]')`);
      await evaluate(`document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))))`);
      const state = await evaluate(`(${shellGeometry.toString()})()`), deltas = metricDeltas(state);
      const phone = width <= 700 ? await evaluate(`(${readU1PhoneShell.toString()})(false)`) : null;
      const candidate = await capture(`u1-main-${name}.png`);
      const goldenFile = `ui-main-${name}.png`, golden = fs.readFileSync(path.join(goldenRoot, goldenFile));
      assert.equal(sha(golden), goldenManifest.find(row => row.file === goldenFile)?.sha256, 'golden integrity');
      const row = { name, state, deltas, phone, golden: { file: goldenFile, sha256: sha(golden) },
        pass: deltas.every(delta => delta.pass) && !state.horizontalOverflow && (!phone || phone.ok), controls: [] };
      report.rows.push(row); writeReport();
      assert(row.pass, name + ' U1 geometry: ' + JSON.stringify({ deltas: deltas.filter(d => !d.pass), phone: phone?.errors }));
      // Break a measured anchor in the live document, require red, restore and re-observe green.
      const control = await evaluate(`(()=>{const e=document.getElementById('objchip'),p=e.style.getPropertyValue('left'),priority=e.style.getPropertyPriority('left');
        let broken;try{e.style.setProperty('left','118px','important');broken=(${shellGeometry.toString()})();}finally{if(p)e.style.setProperty('left',p,priority);else e.style.removeProperty('left');}
        return{broken,restored:(${shellGeometry.toString()})()};})()`);
      assert(metricDeltas(control.broken).some(d => d.name === 'objective left inset' && !d.pass));
      assert(metricDeltas(control.restored).every(d => d.pass));
      row.controls.push({ name: 'live objective displaced100px; exact style restored', brokenDeltas: metricDeltas(control.broken), restored: true });
      const metricMutations = [
        ['topbar published height', ':root', '--topbar-h', '321px'],
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
          ['Prime centre', '#primechip', 'transform', 'translateX(20px)'],
          ['utility right inset', '#dock', 'right', '112px'],
          ...state.dock.slice(1).map((button, i) => ['desktop utility centre pitch ' + (i + 1), '#' + button.id, 'transform', 'translateX(10px)']),
        ]),
      ];
      for (const [metric, selector, property, value] of metricMutations) {
        const proof = await evaluate(`(()=>{const node=document.querySelector(${JSON.stringify(selector)}),property=${JSON.stringify(property)},
          prior=node.style.getPropertyValue(property),priority=node.style.getPropertyPriority(property);let broken;
          try{node.style.setProperty(property,${JSON.stringify(value)},'important');broken=(${shellGeometry.toString()})();}
          finally{if(prior)node.style.setProperty(property,prior,priority);else node.style.removeProperty(property);}
          return{broken,restored:(${shellGeometry.toString()})(),propertyRestored:node.style.getPropertyValue(property)===prior&&node.style.getPropertyPriority(property)===priority};})()`);
        const brokenDelta = metricDeltas(proof.broken).find(delta => delta.name === metric), restoredDeltas = metricDeltas(proof.restored);
        row.controls.push({ name: metric, selector, property, value, brokenDelta, propertyRestored: proof.propertyRestored,
          restored: restoredDeltas.every(delta => delta.pass) });
        assert(brokenDelta && !brokenDelta.pass && proof.propertyRestored && restoredDeltas.every(delta => delta.pass),
          name + ' geometry control failed: ' + JSON.stringify(row.controls.at(-1)));
      }
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
  } catch (error) { report.status = 'FAIL'; report.failure = String(error); throw error;
  } finally { await browser?.close(); if (server.listening) await new Promise(resolve => server.close(resolve)); report.endedAt = new Date().toISOString(); writeReport(); }
  console.log(`U1 REVIEW PASS: ${report.rows.length} scoped viewports; ${report.images.length} PNGs; ${source}`);
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runUiShellReview(process.argv[2], process.argv[3]);
}
