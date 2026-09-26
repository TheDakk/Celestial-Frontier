import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';
import { acquireWorkspaceLock } from '../../port/v2/tools/workspacelock.mjs';
import { readNativeTarget } from '../../port/v2/tools/ui-sheet-review.mjs';
const repo = path.resolve(import.meta.dirname, '../..'), app = repo + '/port/v2/apps/game';
const require = createRequire(app + '/package.json');
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
const out = path.resolve(process.argv[2]); fs.mkdirSync(out, { recursive: false });
const files = ['main.ts', 'guide-content.ts', 'guide-briefings.ts', 'release-content.ts', 'training.ts'];
const hash = b => createHash('sha256').update(b).digest('hex');
const sources = Object.fromEntries(files.map(f => [f, hash(fs.readFileSync(app + '/src/' + f))]));
const report = { schema: 'cf-d19-native-guide/v1', status: 'RUNNING', certification: false,
  scope: 'Actual local Vite app; isolated fresh save, native input. Scoped Guide review, not Slice/Glass/I5.', sources, rows: [], errors: [] };
const write = () => fs.writeFileSync(out + '/report.json', JSON.stringify(report, null, 2) + '\n');
let server, browser; const release = acquireWorkspaceLock('D19 native Guide');
try {
  write(); server = await createServer({ root: app, configFile: app + '/vite.config.ts', server: { host: '127.0.0.1', port: 0 } }); await server.listen();
  browser = await openChromiumCdp({ label: 'D19 Guide review', userDataPrefix: 'cf-d19-guide', onEvent(e) { if (e.method === 'Runtime.exceptionThrown') report.errors.push(e.params); } }); report.browser = browser.browser;
  for (const vp of [{ width: 390, height: 844, mobile: true }, { width: 1440, height: 900, mobile: false }]) {
    const { browserContextId } = await browser.send('Target.createBrowserContext');
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (m, p = {}) => browser.send(m, p, sessionId);
    const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
    const wait = condition => evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+20000;function step(){if(${condition})resolve(true);else if(performance.now()>end)reject(Error('readiness: '+${JSON.stringify(condition)}));else setTimeout(step,40)}step()})`);
    const frames = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    const row = { viewport: vp, inputs: [], pages: [], controls: [] }; report.rows.push(row);
    await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { ...vp, deviceScaleFactor: 1 });
    await send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile });
    await send('Page.navigate', { url: server.resolvedUrls.local[0] });
    await wait("document.querySelector('canvas')&&document.querySelector('[data-sel=tutskip]')");
    async function click(selector) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const target = await evaluate(`(${readNativeTarget.toString()})(${JSON.stringify(selector)})`);
        if (target.available) {
          await evaluate(`window.__d19events=[];document.querySelector(${JSON.stringify(selector)}).addEventListener('click', e=>window.__d19events.push({trusted:e.isTrusted}),{once:true})`);
          if (vp.mobile) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...target.point, id: 1 }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
          else { await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...target.point, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...target.point, button: 'left', clickCount: 1 }); }
          await frames(); const events = await evaluate('window.__d19events'); assert(events.some(e => e.trusted), 'native delivery ' + selector);
          row.inputs.push({ selector, target, events }); write(); return;
        }
        const scroll = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),p=e?.closest('#guidepanel,#tutcard');if(!p)return null;const r=e.getBoundingClientRect(),b=p.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2,deltaY:r.top+r.height/2-(b.top+b.height/2)}})()`);
        assert(scroll && Number.isFinite(scroll.deltaY), JSON.stringify(target));
        await send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...scroll, deltaX: 0 }); await new Promise(r => setTimeout(r, 100));
      }
      throw Error('unreachable ' + selector);
    }
    await click('[data-sel=tutskip]'); await wait("!document.querySelector('[data-sel=tutskip]')");
    await click('#dockguide'); await wait("document.querySelectorAll('[data-guide-category]').length===9");
    await click('[data-guide-briefing="0"]');
    for (const [index, id] of ['reach', 'resources', 'companions', 'combat', 'progress'].entries()) {
      await wait(`document.querySelector('[data-guide-briefing-page="${id}"]')`);
      const state = await evaluate(`({id:document.querySelector('[data-guide-briefing-page]').dataset.guideBriefingPage,focus:document.activeElement?.textContent,overflow:document.documentElement.scrollWidth>innerWidth})`);
      assert.equal(state.id, id); assert.equal(state.overflow, false); assert(state.focus.includes('Advanced Briefings')); row.pages.push(state);
      fs.writeFileSync(out + `/${vp.width}-${id}.png`, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
      if (index < 4) await click(`[data-guide-briefing="${index + 1}"]`);
    }
    await click('[data-guide-home]:last-child'); await wait("document.querySelectorAll('[data-guide-category]').length===9");
    // A disabled native ingress cannot open a briefing; restore before continuing.
    await evaluate(`document.querySelector('[data-guide-briefing="0"]').disabled=true`);
    assert.equal((await evaluate(`(${readNativeTarget.toString()})('[data-guide-briefing="0"]')`)).available, false);
    row.controls.push({ disabledIngressRejected: true });
    await evaluate(`document.querySelector('[data-guide-briefing="0"]').disabled=false`);
    if (!vp.mobile) {
      await evaluate(`document.querySelector('[data-guide-briefing="0"]').focus()`);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
      await wait(`document.querySelector('[data-guide-briefing-page="reach"]')`); row.controls.push({ nativeEnterOpened: true });
      await click('[data-gt="landing"]'); await wait(`!document.querySelector('[data-guide-briefing-page]')&&document.querySelector('[data-guide-status]')`);
      row.controls.push({ crossLinkOpened: true });
    }
    write(); await browser.send('Target.disposeBrowserContext', { browserContextId });
  }
  assert.equal(report.errors.length, 0); report.status = 'PASS';
} catch (e) { report.status = 'FAIL'; report.error = String(e.stack || e); process.exitCode = 1; }
finally {
  for (const f of files) if (hash(fs.readFileSync(app + '/src/' + f)) !== sources[f]) { report.status = 'FAIL'; report.error = 'source changed ' + f; process.exitCode = 1; }
  await browser?.close(); await server?.close(); release(); write(); console.log(JSON.stringify({ status: report.status, error: report.error, rows: report.rows.length }));
}
