/* Battle scene v2 proof runner (modelled on quadruped-proof/runner.mjs): builds the page, serves it on
 * 127.0.0.1, drives a Chromium-family browser over CDP, captures ten seconds (webm → mp4 via ffmpeg) and
 * frame PNGs at the strike and other beats. Browser-owning: run OUTSIDE the macOS sandbox.
 * Usage: node tools/battle2-proof/runner.mjs <newEvidenceDir> */
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import crypto from 'node:crypto'; import { spawnSync, execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import { requireTenSecondMedia } from '../quadruped-proof/capture-contract.mjs';
import { openChromiumCdp } from '../browsercdp.mjs'; import { acquireWorkspaceLock } from '../workspacelock.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..'), out = path.resolve(process.argv[2]);
const FFMPEG = process.env.FFMPEG ?? '/opt/homebrew/bin/ffmpeg';
if (!process.argv[2] || fs.existsSync(out)) throw Error('Evidence directory must be new');
fs.mkdirSync(out, { recursive: true });
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex'), git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8' }).trim();
const report = { status: 'RUNNING', source: git('rev-parse', 'HEAD'), worktreeStatus: git('status', '--porcelain', '--untracked-files=all').split('\n').filter((x) => x && !x.endsWith('.DS_Store')), errors: [], captures: [], frames: [] };
const persist = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n'); persist();
let browser, server, release;
try {
  release = acquireWorkspaceLock('battle2 ten-second proof');
  const built = spawnSync(process.execPath, [path.join(here, 'build.mjs'), path.join(out, 'build')], { cwd: repo, encoding: 'utf8', timeout: 120000 });
  fs.writeFileSync(path.join(out, 'build.log'), (built.stdout ?? '') + (built.stderr ?? '')); if (built.status !== 0) throw Error('Build failed; no browser successor');
  const build = path.join(out, 'build'), manifest = JSON.parse(fs.readFileSync(path.join(build, 'manifest.json'))), files = new Map(manifest.files.map((r) => [r.path, r]));
  const verify = () => { for (const row of manifest.sources) { const b = fs.readFileSync(path.join(repo, row.path)); if (sha(b) !== row.sha256) throw Error('Source changed: ' + row.path); } }; verify();
  const mime = (n) => n.endsWith('.html') ? 'text/html' : n.endsWith('.js') ? 'text/javascript' : n.endsWith('.json') ? 'application/json' : 'image/png';
  server = http.createServer((req, res) => { try { const name = new URL(req.url, 'http://127.0.0.1').pathname.slice(1) || 'index.html', row = files.get(name); if (!row) throw Error('not listed'); const b = fs.readFileSync(path.join(build, name)); if (sha(b) !== row.sha256) throw Error('hash'); res.writeHead(200, { 'Content-Type': mime(name), 'Cache-Control': 'no-store' }); res.end(b); } catch { res.writeHead(404); res.end(); } });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); report.origin = 'http://127.0.0.1:' + server.address().port;
  browser = await openChromiumCdp({ label: 'battle2 ten-second proof', userDataPrefix: 'cf-battle2-proof', commandTimeoutMs: 60000, onEvent: (e) => { if (e.method === 'Runtime.exceptionThrown') report.errors.push(e.params.exceptionDetails); } }); report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p = {}) => browser.send(m, p, sessionId), evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 720, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: report.origin });
  const deadline = performance.now() + 90000;
  for (;;) { const status = await evaluate('window.cfBattle?.state.status'); if (status === 'FAIL') { report.observation = await evaluate('window.cfBattle.state'); throw Error('Entry refused: ' + JSON.stringify(report.observation.errors)); } if (status === 'READY') break; if (performance.now() > deadline) throw Error('Readiness deadline'); await new Promise((r) => setTimeout(r, 100)); }
  report.observation = await evaluate('window.cfBattle.report()'); persist();
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 105, y: 32, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 105, y: 32, button: 'left', clickCount: 1 });
  const result = await evaluate('window.cfBattle.capturePromise'); const webm = path.join(out, 'civet-vs-platypus-10s.webm'); fs.writeFileSync(webm, Buffer.from(result.video, 'base64')); delete result.video;
  const media = JSON.parse(execFileSync(path.join(path.dirname(FFMPEG), 'ffprobe'), ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,codec_type', '-of', 'json', webm], { encoding: 'utf8' }));
  result.encodedMedia = media; requireTenSecondMedia(Number(media.format.duration));
  const mp4 = path.join(out, 'civet-vs-platypus-10s.mp4'); execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '60', '-movflags', '+faststart', mp4]); result.mp4 = { path: path.basename(mp4), bytes: fs.statSync(mp4).size, sha256: sha(fs.readFileSync(mp4)) };
  report.captures.push(result); persist();
  const strikeMs = await evaluate('window.cfBattle.strikeMs()'); const p0 = result.plans[0].beats;
  const rect = await evaluate('(() => { const r = document.querySelector("canvas").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()'); report.canvasRect = rect;
  for (const [label, ms] of [['ready', 400], ['command', p0.readyEnd + 120], ['approach', p0.commandEnd + 150], ['strike', strikeMs], ['hitstop', strikeMs + 20], ['flash-fade', strikeMs + 80], ['number', strikeMs + 300], ['return', p0.actionEnd + 100], ['turn2-strike', result.plans[1].startMs + result.plans[1].beats.impactAt + 0.5 /* inside the first hitstop frame; the exact sum lands one ulp short after the JSON round-trip */]]) {
    await evaluate(`window.cfBattle.reset(); window.cfBattle.frame(${ms})`);
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 } }); const file = path.join(out, `frame-${label}.png`); fs.writeFileSync(file, Buffer.from(data, 'base64')); report.frames.push({ label, ms, file: path.basename(file), sha256: sha(fs.readFileSync(file)) });
  }
  verify(); report.status = 'REVIEW'; if (report.errors.length) throw Error('Browser errors');
} catch (error) { report.status = 'FAIL'; report.error = String(error.stack ?? error); process.exitCode = 1; }
finally { await browser?.close(); if (server) await new Promise((r) => server.close(r)); release?.(); report.closed = true; persist(); }
console.log(JSON.stringify({ status: report.status, source: report.source, out, frames: report.frames.length, capture: report.captures[0] && { frames: report.captures[0].frames, updateP95Ms: report.captures[0].updateP95Ms, mp4: report.captures[0].mp4 }, error: report.error }));
