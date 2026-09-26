#!/usr/bin/env node
/* Scoped native CSS regression diagnostic. It imports current presentation
 * owners, but does not build or boot the game, certify Compendium, or retry. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openChromiumCdp } from '../../../port/v2/tools/browsercdp.mjs';
import { acquireWorkspaceLock } from '../../../port/v2/tools/workspacelock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const v2 = path.join(repo, 'port/v2');
const sourceDir = path.join(v2, 'apps/game/src');
const oldHead = '61c37f3a846429bcbc0167ea92de12623593e750';
const args = process.argv.slice(2);
assert.equal(args.length, 2, 'Usage: focus-review.mjs NEW_OUTPUT_DIRECTORY RUN_ID');
const output = path.resolve(args[0]), runId = args[1];
assert(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(runId), 'run ID must be a safe filename token');
assert(!fs.existsSync(output), 'output directory must be new; no overwrite or retry');
assert(output.startsWith(here + path.sep), 'write evidence only below this I5 packet');
assert(process.env.CF_BROWSER && path.isAbsolute(process.env.CF_BROWSER), 'pin the exact Edge executable in CF_BROWSER');
const git = (...tokens) => execFileSync('git', tokens, { cwd: repo, encoding: 'utf8' }).trim();
assert.equal(fs.realpathSync(git('rev-parse', '--show-toplevel')), repo);
assert.equal(git('branch', '--show-current'), 'openai/mac');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFiles = new Map();
const readSource = file => {
  const bytes = fs.readFileSync(file);
  sourceFiles.set(file, sha(bytes));
  return bytes.toString('utf8');
};
const release = acquireWorkspaceLock('I5 native focus CSS regression review', { inheritFromParent: true });
const report = {
  schema: 'cf.i5-native-focus-review/v1', runId, status: 'RUNNING',
  startedAt: new Date().toISOString(), node: process.version,
  invocation: { executable: process.execPath, arguments: process.argv.slice(1), exactBrowser: process.env.CF_BROWSER },
  scope: 'Native keyboard/computed-style/clipping diagnostic on a narrow source-CSS fixture; not a game, virtualization, memory, or art certificate.',
  policy: { attempts: 1, automaticRetries: 0 },
  source: { begin: git('rev-parse', 'HEAD'), branch: 'openai/mac' },
  styles: [], rows: [], screenshots: [], errors: [],
  limitations: [
    'The fixture preserves real stylesheet owner order and actual Compendium row/scroller classes; three positioned rows stand in for the virtualized inventory.',
    'Geometry plus computed visible outline and native focus are machine-assessed; retained screenshots support human pixel review.',
    'No generated game bundle, species art, save, gameplay route, or Compendium certificate is exercised.',
  ],
};
let scratch, bundle, browser, contextId, send, evaluate;
fs.mkdirSync(output, { recursive: false });
const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
const retained = (name, bytes) => {
  const data = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  fs.writeFileSync(path.join(output, name), data, { flag: 'wx' });
  return { file: name, bytes: data.length, sha256: sha(data) };
};
const oldRule = (relative, prefix) => {
  const text = execFileSync('git', ['show', oldHead + ':' + relative], { cwd: repo, encoding: 'utf8' });
  const rules = text.split('\n').filter(line => line.startsWith(prefix) && line.includes(':focus-visible{'));
  assert.equal(rules.length, 1, 'one exact historical focus rule required: ' + relative);
  return { source: relative, sourceCommit: oldHead, sourceSha256: sha(Buffer.from(text)), css: rules[0] };
};

/* This function is serialized into the browser; it reads actual native state. */
function observation(selector) {
  const node = document.querySelector(selector), scroller = document.querySelector('[data-sel="codex-scroll"]');
  const rectangle = el => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  };
  if (!node || !scroller) throw new Error('missing source-class fixture nodes');
  const rect = rectangle(node), s = getComputedStyle(node), box = rectangle(scroller);
  const width = parseFloat(s.outlineWidth) || 0, offset = parseFloat(s.outlineOffset) || 0;
  const outer = width + offset;
  const ring = { left: rect.left - outer, right: rect.right + outer, top: rect.top - outer, bottom: rect.bottom + outer };
  const clip = { left: box.left + scroller.clientLeft, top: box.top + scroller.clientTop,
    right: box.left + scroller.clientLeft + scroller.clientWidth,
    bottom: box.top + scroller.clientTop + scroller.clientHeight };
  const clips = [];
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX + style.overflowY)) {
      const r = rectangle(parent);
      clips.push({ id: parent.id, className: parent.className,
        left: r.left + parent.clientLeft, top: r.top + parent.clientTop,
        right: r.left + parent.clientLeft + parent.clientWidth,
        bottom: r.top + parent.clientTop + parent.clientHeight });
    }
  }
  const inside = (inner, outerRect) => inner.left >= outerRect.left && inner.right <= outerRect.right
    && inner.top >= outerRect.top && inner.bottom <= outerRect.bottom;
  const points = [
    [rect.left + 4, (rect.top + rect.bottom) / 2],
    [rect.right - 4, (rect.top + rect.bottom) / 2],
    [(rect.left + rect.right) / 2, rect.top + 4],
    [(rect.left + rect.right) / 2, rect.bottom - 4],
  ].map(([x, y]) => {
    const hit = document.elementFromPoint(x, y);
    return { x, y, owned: hit === node || node.contains(hit), hit: hit?.id || hit?.tagName || null };
  });
  return { selector, activeId: document.activeElement?.id, focused: document.activeElement === node,
    focusVisible: node.matches(':focus-visible'), native: node.tagName === 'BUTTON' && !node.disabled,
    rect, scroller: { ...box, ...clip, overflowX: getComputedStyle(scroller).overflowX,
      overflowY: getComputedStyle(scroller).overflowY }, clips, ring,
    outlineWidth: width, outlineOffset: offset, outlineStyle: s.outlineStyle,
    outlineColor: s.outlineColor, boxShadow: s.boxShadow,
    visible: s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0
      && rect.width > 0 && rect.height > 0,
    intersects: rect.bottom > clip.top + 0.5 && rect.top < clip.bottom - 0.5,
    rowInsideScroller: inside(rect, clip), ringInsideScroller: inside(ring, clip),
    ringInsideAncestors: clips.every(parent => inside(ring, parent)),
    ringInsideViewport: inside(ring, { left: 0, top: 0, right: innerWidth, bottom: innerHeight }),
    points, nativeEvents: window.__focusEvents,
  };
}
function assess(value, row = true) {
  const errors = [];
  for (const key of ['focused', 'focusVisible', 'native', 'visible']) if (value[key] !== true) errors.push(key);
  if (value.outlineStyle !== 'solid' || value.outlineColor === 'transparent'
    || value.outlineColor === 'rgba(0, 0, 0, 0)') errors.push('visible-outline');
  if (row) {
    if (value.outlineWidth < 3) errors.push('outline-width');
    if (value.outlineOffset > -value.outlineWidth) errors.push('outline-not-inset');
    for (const key of ['intersects', 'rowInsideScroller', 'ringInsideScroller', 'ringInsideAncestors', 'ringInsideViewport']) {
      if (value[key] !== true) errors.push(key);
    }
  } else if (value.outlineWidth < 2 || value.outlineOffset < 0) errors.push('generic-outline');
  if (!value.points.every(p => p.owned)) errors.push('visible-hit-owner');
  const entries = value.nativeEvents.filter(e => e.type === 'focusin' && e.target === value.activeId);
  if (!entries.length || entries.some(e => !e.trusted)
    || !value.nativeEvents.some(e => e.type === 'keydown' && e.key === 'Tab' && e.trusted)) errors.push('native-Tab-receipt');
  return { pass: errors.length === 0, errors };
}

/* Two frames do not imply that a focus transition has finished. Read the
 * browser's finite animation owners and await their actual finished promises;
 * retain both states rather than substituting a fixed delay or disabling CSS. */
async function settleFixtureFocus(selector) {
  const focus = document.querySelector(selector);
  if (!focus || !document.body) throw new Error('focus settlement owner absent');
  getComputedStyle(focus).boxShadow;
  document.body.getBoundingClientRect();
  const ownedAnimations = () => {
    const found = new Set(document.body.getAnimations({ subtree: true }));
    for (let owner = focus; owner; owner = owner.parentElement) {
      for (const animation of owner.getAnimations({ subtree: false })) found.add(animation);
    }
    return [...found];
  };
  const describe = animation => {
    const target = animation.effect?.target, timing = animation.effect?.getComputedTiming();
    return { type: animation.constructor.name, target: target?.id || target?.tagName || null,
      animationName: animation.animationName ?? null, transitionProperty: animation.transitionProperty ?? null,
      playState: animation.playState, pending: animation.pending, currentTime: animation.currentTime,
      endTime: Number.isFinite(timing?.endTime) ? timing.endTime : String(timing?.endTime),
      finite: Number.isFinite(timing?.endTime) };
  };
  const animations = ownedAnimations(), before = animations.map(describe);
  const finite = animations.filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime));
  const startedAt = performance.now();
  await Promise.all(finite.map(animation => animation.finished));
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const after = ownedAnimations().map(describe);
  const unresolved = after.filter(animation => animation.finite
    && (animation.pending || !['finished', 'idle'].includes(animation.playState)));
  return { selector, startedAt, finishedAt: performance.now(), awaitedFinite: finite.length,
    skippedNonfinite: before.filter(animation => !animation.finite), before, after,
    settled: unresolved.length === 0, unresolved };
}

try {
  write();
  readSource(fileURLToPath(import.meta.url));
  for (const name of ['browsercdp.mjs', 'browserpath.mjs', 'workspacelock.mjs']) readSource(path.join(v2, 'tools', name));
  const index = readSource(path.join(v2, 'apps/game/index.html'));
  const blocks = [...index.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]);
  assert(blocks.length > 0, 'index stylesheet owner absent');
  const main = readSource(path.join(sourceDir, 'main.ts'));
  assert(main.includes('uiPresentationStyle.textContent = UI_PRESENTATION_CSS + UI_SHELL_CSS + NOTIFICATION_HISTORY_CSS + UI_SHEET_CSS;'), 'presentation stylesheet order changed');
  assert(readSource(path.join(sourceDir, 'audiovisual-pilot.ts')).includes('style.textContent = PILOT_RUNTIME_CSS;'), 'pilot stylesheet owner changed');
  const imports = [
    ['UI_PRESENTATION_CSS', 'ui-presentation-tokens.ts'], ['UI_SHELL_CSS', 'ui-shell-style.ts'],
    ['NOTIFICATION_HISTORY_CSS', 'notification-history.ts'], ['UI_SHEET_CSS', 'ui-sheet-style.ts'],
    ['PILOT_RUNTIME_CSS', 'pilot-runtime-style.ts'],
  ];
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-i5-focus-css-'));
  const entry = path.join(scratch, 'entry.ts');
  fs.writeFileSync(entry, imports.map(([name, file]) => `export { ${name} } from ${JSON.stringify(path.join(sourceDir, file))};`).join('\n'));
  const { rolldown } = await import(pathToFileURL(path.join(v2, 'node_modules/rolldown/dist/index.mjs')).href);
  bundle = await rolldown({ input: entry, platform: 'node', plugins: [{ name: 'retain-source-hashes', transform(_code, id) {
    if (path.isAbsolute(id) && id.startsWith(repo + path.sep) && fs.existsSync(id) && fs.statSync(id).isFile()) readSource(id);
  } }] });
  const compiled = path.join(scratch, 'styles.mjs');
  await bundle.write({ file: compiled, format: 'es' });
  const css = await import(pathToFileURL(compiled).href);
  report.styleImportBundle = { sha256: sha(fs.readFileSync(compiled)), scope: 'temporary CSS imports only; not app build' };
  const nativeCss = css.UI_PRESENTATION_CSS + css.UI_SHELL_CSS + css.NOTIFICATION_HISTORY_CSS + css.UI_SHEET_CSS;
  report.styles = [
    ...blocks.map((text, i) => ({ owner: `index-style-${i}`, sha256: sha(Buffer.from(text)) })),
    ...imports.map(([name, file]) => ({ owner: name, source: path.join('port/v2/apps/game/src', file), sha256: sha(Buffer.from(css[name])) })),
  ];
  report.controls = {
    sheet: oldRule('port/v2/apps/game/src/ui-sheet-style.ts', ':is(.panel,#survey) :is(button,input,select):focus-visible'),
    pilot: oldRule('port/v2/apps/game/src/pilot-runtime-style.ts', 'body[data-cf-pilot-look] :is(.panel,#survey,#planetside,#inventorysheet) :is(button,input,select,textarea,summary):focus-visible'),
  };
  const fixture = pilot => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">${blocks.map(text => `<style>${text}</style>`).join('')}<style id="cf-ui-presentation">${nativeCss}</style>${pilot ? `<style id="cf-pilot-style">${css.PILOT_RUNTIME_CSS}</style>` : ''}</head><body class="panel-open" ${pilot ? 'data-cf-pilot-look="frontier"' : ''}><aside id="codexpanel" class="panel codex-list-mode" aria-hidden="false" style="display:block"><h3 class="sheet-header" data-sheet-kind="codex">Compendium focus fixture</h3><button id="ordinary-control" type="button">Ordinary panel control</button><div class="compendium-scroll" data-sel="codex-scroll" role="group" aria-label="Compendium species"><div class="compendium-virtual-extent" style="height:192px">${[0, 1, 2].map(i => `<button id="focus-row-${i}" class="centry compendium-row" type="button" data-cid="focus-fixture:${i}" data-ci="${i}" style="position:absolute;left:0;right:0;top:${i * 64}px;height:64px"><span class="compendium-thumb" aria-hidden="true"></span><span class="compendium-row-copy"><b>Native focus species ${i + 1}</b><span class="sub">Retained real Compendium styles</span></span></button>`).join('')}</div></div></aside></body></html>`;
  for (const pilot of [false, true]) retained(pilot ? 'fixture-pilot.html' : 'fixture-default.html', fixture(pilot));
  browser = await openChromiumCdp({ label: 'I5 native focus CSS diagnostic', userDataPrefix: 'cf-i5-focus',
    startupTimeoutMs: 45000, webSocketOpenTimeoutMs: 15000, commandTimeoutMs: 5000, shutdownTimeoutMs: 2000,
    onEvent: event => { if (event.method === 'Runtime.exceptionThrown') { report.errors.push(event.params.exceptionDetails); write(); } },
  });
  report.browser = browser.browser;
  assert(/^Edg\//.test(browser.browser.product), 'this diagnostic requires the pinned Edge executable');
  assert.equal(browser.browser.protocol_version, '1.3');
  const screenshot = async (row, label) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    report.screenshots.push({ row: row.id, label, ...retained(`${row.id}-${label}.png`, Buffer.from(data, 'base64')) }); write();
  };
  for (const viewport of [{ id: 'phone', width: 390, height: 844, dpr: 3, mobile: true },
    { id: 'desktop', width: 1440, height: 900, dpr: 1, mobile: false }]) for (const pilot of [false, true]) {
    const row = { id: `${viewport.id}-${pilot ? 'pilot' : 'default'}`, viewport, pilot, checks: [], controls: [], settlements: [], status: 'RUNNING' };
    report.rows.push(row); write();
    ({ browserContextId: contextId } = await browser.send('Target.createBrowserContext'));
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId: contextId });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    row.targetId = targetId; row.sessionId = sessionId;
    send = (method, params = {}) => browser.send(method, params, sessionId);
    evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
    };
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.dpr, mobile: viewport.mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: viewport.mobile, maxTouchPoints: 5 });
    const { frameTree } = await send('Page.getFrameTree');
    await send('Page.setDocumentContent', { frameId: frameTree.frame.id, html: fixture(pilot) });
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }); await send('Page.bringToFront');
    await evaluate(`window.__focusEvents=[];for(const type of ['keydown','keyup','focusin'])document.addEventListener(type,event=>window.__focusEvents.push({type: event.type,key:event.key||null,trusted:event.isTrusted,target:event.target.id||event.target.tagName}),true);true`);
    const frames = () => evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
    await frames();
    const tab = async modifiers => {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers });
      await frames();
    };
    const read = selector => evaluate(`(${observation.toString()})(${JSON.stringify(selector)})`);
    const settle = async (selector, label) => {
      const receipt = await evaluate(`(${settleFixtureFocus.toString()})(${JSON.stringify(selector)})`);
      row.settlements.push({ label, ...receipt }); write();
      assert(receipt.settled, row.id + ' ' + label + ': finite fixture animation remained active');
    };
    const check = async (name, selector, isRow = true) => {
      await settle(selector, name);
      const measured = await read(selector), verdict = assess(measured, isRow);
      row.checks.push({ name, measured, verdict }); write();
      if (!verdict.pass) await screenshot(row, name + '-failure');
      assert(verdict.pass, row.id + ' ' + name + ': ' + verdict.errors.join(', ')); return measured;
    };
    await tab(0); await check('generic-native-focus', '#ordinary-control', false);
    await tab(0); const baseline = await check('row-native-focus', '#focus-row-0');
    await screenshot(row, 'baseline-row');
    for (const kind of pilot ? ['sheet', 'pilot'] : ['sheet']) {
      const control = { kind, originalRule: report.controls[kind], status: 'RUNNING' }; row.controls.push(control); write();
      let primary;
      try {
        const ownerId = kind === 'sheet' ? 'cf-ui-presentation' : 'cf-pilot-style';
        control.placement = await evaluate(`(()=>{if(document.getElementById('focus-old-rule'))throw Error('fault already installed');const owner=document.getElementById(${JSON.stringify(ownerId)});if(!owner)throw Error('historical stylesheet owner absent');const style=document.createElement('style');style.id='focus-old-rule';style.textContent=${JSON.stringify(report.controls[kind].css)};owner.after(style);return {after:style.previousElementSibling?.id,next:style.nextElementSibling?.id||null}})()`);
        await settle('#focus-row-0', kind + '-historical-fault');
        control.broken = await read('#focus-row-0'); control.verdict = assess(control.broken);
        write(); await screenshot(row, kind + '-historical-fault');
        assert(!control.verdict.pass && control.verdict.errors.includes('outline-not-inset'), 'historical generic rule must recreate the actual inset failure');
        assert.equal(control.broken.outlineOffset, 2, 'historical offset was not reproduced');
        assert.equal(control.broken.outlineWidth, kind === 'sheet' ? 2 : 3, 'historical width was not reproduced');
      } catch (error) { primary = error; control.failure = String(error); }
      try {
        control.removed = await evaluate(`(()=>{const style=document.getElementById('focus-old-rule');if(!style)return false;style.remove();return !document.getElementById('focus-old-rule')})()`);
        await settle('#focus-row-0', kind + '-restoration');
        control.restored = await read('#focus-row-0'); control.recoveredVerdict = assess(control.restored);
        assert(control.removed && control.recoveredVerdict.pass, 'historical control must restore a passing source-owned ring');
        for (const key of ['outlineWidth', 'outlineOffset', 'outlineStyle', 'outlineColor', 'boxShadow']) assert.deepEqual(control.restored[key], baseline[key], 'restoration changed ' + key);
        assert.deepEqual(control.restored.rect, baseline.rect, 'restoration changed row geometry');
        await screenshot(row, kind + '-recovered');
      } catch (error) { control.recoveryFailure = String(error); if (!primary) primary = error; }
      control.status = primary ? 'FAIL' : 'PASS'; write(); if (primary) throw primary;
    }
    await tab(8); await check('generic-focus-after-controls', '#ordinary-control', false);
    await screenshot(row, 'generic-recovered');
    row.status = 'PASS'; write(); await browser.send('Target.disposeBrowserContext', { browserContextId: contextId }); contextId = null;
  }
  assert.equal(report.rows.length, 4); assert.equal(report.errors.length, 0, 'browser runtime error');
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.failure = String(error.stack ?? error); process.exitCode = 1;
} finally {
  try { if (contextId && browser) await browser.send('Target.disposeBrowserContext', { browserContextId: contextId }); }
  catch (error) { report.contextCleanupFailure = String(error); report.status = 'FAIL'; process.exitCode = 1; }
  try { await browser?.close(); }
  catch (error) { report.browserCleanupFailure = String(error); report.status = 'FAIL'; process.exitCode = 1; }
  try { await bundle?.close(); if (scratch) fs.rmSync(scratch, { recursive: true }); }
  catch (error) { report.compilerCleanupFailure = String(error); report.status = 'FAIL'; process.exitCode = 1; }
  report.source.end = git('rev-parse', 'HEAD');
  report.source.files = [...sourceFiles].map(([file, digest]) => ({ file: path.relative(repo, file), sha256: digest,
    unchanged: fs.existsSync(file) && sha(fs.readFileSync(file)) === digest }));
  if (report.source.begin !== report.source.end || report.source.files.some(file => !file.unchanged)) {
    report.sourceFailure = 'source changed during the native diagnostic'; report.status = 'FAIL'; process.exitCode = 1;
  }
  report.finishedAt = new Date().toISOString(); write(); release();
}
console.log(JSON.stringify({ runId, status: report.status, rows: report.rows.length,
  controls: report.rows.reduce((n, row) => n + row.controls.length, 0), report: path.join(output, 'report.json') }));
