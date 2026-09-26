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
const files = ['main.ts', 'training.ts', 'training-forge-practice.ts', 'living-species-preview.ts', 'ui-sheet-style.ts'];
const hash = b => createHash('sha256').update(b).digest('hex');
const sources = Object.fromEntries(files.map(f => [f, hash(fs.readFileSync(app + '/src/' + f))]));
const report = { schema: 'cf-parked-gameplay-native/v1', status: 'RUNNING', certification: false,
  scope: 'Actual local Vite app; isolated fresh save, native input. Synthetic lesson/corpus setup, native Forge and portrait controls. Not full Slice/Glass/I5.', sources, rows: [], errors: [] };
const write = () => fs.writeFileSync(out + '/report.json', JSON.stringify(report, null, 2) + '\n');
let server, browser; const release = acquireWorkspaceLock('parked gameplay native');
try {
  write(); server = await createServer({ root: app, mode: 'evidence', configFile: app + '/vite.config.ts', server: { host: '127.0.0.1', port: 0 } }); await server.listen();
  browser = await openChromiumCdp({ label: 'D19 Guide review', userDataPrefix: 'cf-d19-guide', onEvent(e) { if (e.method === 'Runtime.exceptionThrown') report.errors.push(e.params); } }); report.browser = browser.browser;
  for (const vp of process.argv.includes('--small') ? [{ width: 320, height: 568, mobile: true }] : [{ width: 390, height: 844, mobile: true }, { width: 1440, height: 900, mobile: false }]) {
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
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__recoveryErrors=[];addEventListener('error',e=>{if(e.message)window.__recoveryErrors.push(e.message)});addEventListener('unhandledrejection',e=>window.__recoveryErrors.push(String(e.reason)));` });
    await send('Page.navigate', { url: server.resolvedUrls.local[0] });
    await wait("window.__CF_SLICE__?.api&&document.querySelector('[data-sel=tutskip]')");
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
        const scroll = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),p=e?.closest('#shipyardpanel,#codexpanel,#guidepanel,#tutcard');if(!p)return null;const r=e.getBoundingClientRect(),b=p.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2,deltaY:r.top+r.height/2-(b.top+b.height/2)}})()`);
        assert(scroll && Number.isFinite(scroll.deltaY), JSON.stringify(target));
        await send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...scroll, deltaX: 0 }); await new Promise(r => setTimeout(r, 100));
      }
      throw Error('unreachable ' + selector);
    }
    await click('[data-sel=tutbtn]');
    await evaluate(`(async()=>{const t=await import('/src/training.ts');t.gameEvent('survey',{planetSeed:133});document.querySelector('[data-sel=tutbtn]').click();t.gameEvent('atlas-add',{id:'p133'});t.gameEvent('atlas-open',{open:true});t.gameEvent('landfall',{planetSeed:133});document.querySelector('[data-sel=tutbtn]').click();return true})()`);
    await wait("window.__CF_SLICE__.api.state().tutStep==='engineering-open'");
    await click(vp.mobile?'#dockshipyard':'#railshipyard');
    await wait("document.querySelector('[data-training-forge-practice]')&&!document.querySelector('[data-training-forge-practice]').disabled");
    const capture = `JSON.stringify({save:window.__CF_SLICE__.api.state().save,local:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage[k]]))})`;
    const before=await evaluate(capture);
    row.practiceLocks=await evaluate(`(()=>{const p=document.querySelector('#shipyardpanel [data-recipe-pin]');return {pinLocked:!!p?.closest('[inert]'),otherActionsLocked:[...document.querySelectorAll('#shipyardpanel [data-engineering-action]:not([data-training-forge-practice])')].every(b=>b.disabled||b.closest('[inert]'))}})()`);
    assert(row.practiceLocks.pinLocked&&row.practiceLocks.otherActionsLocked,'only practice can act');
    const firstSession=await evaluate('window.__CF_SLICE__.api.shipyardDiagnostics().trainingPractice.generation');
    await click('#shipyardpanel [data-pnx="shipyard"]');
    assert.equal(await evaluate('window.__CF_SLICE__.api.shipyardDiagnostics().trainingPractice.retainedSandboxCount'),0);
    await click(vp.mobile?'#dockshipyard':'#railshipyard');
    await wait("document.querySelector('[data-training-forge-practice]')&&!document.querySelector('[data-training-forge-practice]').disabled");
    assert((await evaluate('window.__CF_SLICE__.api.shipyardDiagnostics().trainingPractice.generation'))>firstSession);
    await click('[data-training-forge-practice]');
    await wait("window.__CF_SLICE__.api.state().tutStep==='engineering-tour'");
    assert.equal(await evaluate(capture),before,'practice changes no save/inventory/storage');
    row.practice=await evaluate('window.__CF_SLICE__.api.shipyardDiagnostics().trainingPractice');
    assert.equal(row.practice.retainedSandboxCount,0);assert.equal(row.practice.status,'closed');
    fs.writeFileSync(out+`/${vp.width}-forge.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    row.bounds=await evaluate(`(()=>{const p=document.getElementById('shipyardpanel').getBoundingClientRect(),t=document.getElementById('tutcard').getBoundingClientRect();return {panelBottom:p.bottom,lessonTop:t.top}})()`);
    assert(row.bounds.panelBottom<=row.bounds.lessonTop-7,'panel clears lesson');
    row.overlapControl=await evaluate(`(()=>{const p=document.getElementById('shipyardpanel');p.style.setProperty('max-height','900px','important');const bad=p.getBoundingClientRect().bottom>document.getElementById('tutcard').getBoundingClientRect().top;p.style.removeProperty('max-height');return bad})()`);
    assert.equal(row.overlapControl,true,'old unbounded panel must overlap');await frames();

    await click('[data-sel=tutskip]');await wait("!window.__CF_SLICE__.api.state().tutActive");
    const source=JSON.parse(fs.readFileSync(repo+'/audits/G2_QUADRUPED_PILOT_20260926/01-coyote/subject-source.json'));
    const fixture=[['recovery-coyote',{id:'recovery-coyote',name:'Coyote',kind:'fauna',realm:'Earth',g:source.genome,count:1}]];
    await evaluate(`window.__CF_SLICE__.api.__compendiumEvidence.installFixture(${JSON.stringify(fixture)})`);
    await click(vp.mobile?'#dockcodex':'#railcodex');
    await wait("document.querySelector('[data-sel=codex-entry]')");
    await click('[data-sel=codex-entry]');
    await wait("window.__CF_SLICE__.api.compendiumDiagnostics().panel.livingPreview.state==='animating'");
    row.preview=await evaluate('window.__CF_SLICE__.api.compendiumDiagnostics().panel.livingPreview');
    assert.equal(row.preview.live.imageCount,1);assert.equal(row.preview.live.tickerCount,1);
    const first=await evaluate("document.querySelector('[data-sel=detail-portrait]').style.transform");
    await new Promise(r=>setTimeout(r,180));
    assert.notEqual(await evaluate("document.querySelector('[data-sel=detail-portrait]').style.transform"),first);
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await wait("window.__CF_SLICE__.api.compendiumDiagnostics().panel.livingPreview.state==='static'");
    row.reduced=await evaluate('window.__CF_SLICE__.api.compendiumDiagnostics().panel.livingPreview');
    assert.equal(row.reduced.live.tickerCount,0);assert.equal(row.reduced.live.imageCount,1);
    fs.writeFileSync(out+`/${vp.width}-portrait.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    await click('#codexback');
    row.closed=await evaluate('window.__CF_SLICE__.api.compendiumDiagnostics().panel.livingPreview');
    assert.equal(row.closed.state,'idle');assert.equal(row.closed.live.imageCount,0);assert.equal(row.closed.live.tickerCount,0);
    row.runtimeErrors=await evaluate('window.__recoveryErrors');assert.deepEqual(row.runtimeErrors,[]);
    write();await browser.send('Target.closeTarget',{targetId});
  }
  report.status='PASS';write();
}catch(error){report.status='FAIL';report.errors.push(String(error.stack??error));write();throw error;}
finally{await browser?.close();await server?.close();release();}
