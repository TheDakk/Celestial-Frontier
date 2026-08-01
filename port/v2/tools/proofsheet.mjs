/* proofsheet.mjs — the ART VERDICT sheet: the shipped v1.8.9 golden screens
   beside the slice's current render, one page, so judging is minutes not
   archaeology (the HD-engine-law "proof-sheet all art" convention).
   Output: apps/game/smoke/proof-sheet.png. Run AFTER slicesmoke (it uses
   the smoke's screenshots). Usage: node tools/proofsheet.mjs */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const smoke = path.join(here, '..', 'apps', 'game', 'smoke');
const golden = path.join(here, '..', '..', 'baseline-v1.8.9', 'screens');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = (p) => 'file:///' + p.replace(/\\/g, '/');

const ROWS = [
  ['THE SYSTEM VIEW', f(path.join(golden, 'ui-main-desktop.png')), 'v1.8.9 shipped (golden screen)', f(path.join(smoke, 'slice-sol.png')), 'the slice, same recipes (Sol)'],
  ['THE PHONE', f(path.join(golden, 'ui-main-phone.png')), 'v1.8.9 shipped (golden screen)', f(path.join(smoke, 'slice-phone.png')), 'the slice at 390×844 @3x'],
  ['THE GALAXY (slice)', f(path.join(smoke, 'slice-galaxy.png')), 'painterly stars/deco/haze — judge against ART_DIRECTION.md', f(path.join(smoke, 'slice-solmark.png')), 'deep zoom: Sun marker + fine-star resolve'],
  ['THE SURFACE (slice)', f(path.join(smoke, 'slice-earth.png')), 'Earth + full survey card', f(path.join(smoke, 'slice-universe.png')), 'the streamed universe'],
];
const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#070a12;color:#cfe0f4;font:14px/1.5 system-ui,sans-serif;padding:24px">
<h1 style="font:600 22px system-ui;color:#f4f8ff;margin:0 0 4px">Celestial Frontier — port slice proof sheet</h1>
<div style="color:#8fa3c4;margin-bottom:18px">generated ${new Date().toISOString().slice(0, 10)} · left = reference · right = the Pixi slice · verdicts: ART (does the slice hold the game's painterly bar?) + SOUND (run <code>npx vite dev</code>, headphones: whoosh on travel, sonar ping on survey — do they feel like the game?)</div>
${ROWS.map(([title, l, lc, r, rc]) => `
<h2 style="font:600 15px system-ui;color:#ffd9a0;margin:22px 0 6px">${title}</h2>
<div style="display:flex;gap:14px">
  <figure style="margin:0;flex:1"><img src="${l}" style="width:100%;border:1px solid #22304a;border-radius:8px"><figcaption style="color:#8fa3c4;margin-top:4px">${lc}</figcaption></figure>
  <figure style="margin:0;flex:1"><img src="${r}" style="width:100%;border:1px solid #22304a;border-radius:8px"><figcaption style="color:#8fa3c4;margin-top:4px">${rc}</figcaption></figure>
</div>`).join('')}
<div style="margin-top:24px;padding:14px;border:1px solid #2a3c5e;border-radius:10px;color:#a8bcd8">
<b style="color:#eaf2ff">The two verdicts this sheet serves</b><br>
1. <b>ART</b> — the slice speaks the Renderer's recipes number-for-number; what it cannot borrow it bakes from the same painters. Thumbs up here green-lights Phases 5–6 asset production.<br>
2. <b>SOUND</b> — only the shipped stings are carried (whoosh/ping over your save's own settings). Everything further waits on the listening test (port/LISTENING_TEST.md).
</div></body>`;
const page = path.join(os.tmpdir(), 'cf-proofsheet.html');
fs.writeFileSync(page, html);

const udd = path.join(os.tmpdir(), 'cf-proof-' + Date.now());
const port = 9833 + (process.pid % 100);
const edge = spawn(EDGE, ['--headless=new', '--no-sandbox', '--no-first-run', '--allow-file-access-from-files',
  '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
let ws0 = null;
for (let t = 0; t < 50 && !ws0; t++) { await sleep(400); try { ws0 = (await (await fetch('http://127.0.0.1:' + port + '/json/version')).json()).webSocketDebuggerUrl; } catch { /* boot */ } }
if (!ws0) { console.error('no CDP'); edge.kill(); process.exit(2); }
const ws = new WebSocket(ws0);
let mid = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params })); });
const t = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sess = at.sessionId;
await send('Page.enable', {}, sess);
await send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1000, deviceScaleFactor: 1, mobile: false }, sess);
await send('Page.navigate', { url: f(page) }, sess);
await sleep(2500);
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sess);
fs.writeFileSync(path.join(smoke, 'proof-sheet.png'), Buffer.from(shot.data, 'base64'));
ws.close(); edge.kill();
console.log('PROOF SHEET → apps/game/smoke/proof-sheet.png');
