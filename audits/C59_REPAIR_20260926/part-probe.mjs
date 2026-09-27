#!/usr/bin/env node
/** E1.5 — battle2 native proof runner. Bundles `native-entry.mjs` against THIS lane's `apps/game/src`, serves the
 * two fits + arena proof assets flat, drives Microsoft Edge over the shared CDP launcher, writes report.json, per-turn
 * stills (approach 50 %, impact, reaction 50 %) and a complete-script webm (at least 10 s), and hashes every source it read. Diagnostic study.
 * Usage: node tools/battle2-proof/native-runner.mjs <leftFitDir> <rightFitDir> <outDir> [script.json]
 * A fit dir holds record.json, binding.json, parts/keyed.png, parts/manifest.json, parts/atlas/<id>.png; the painter
 * master is `record.source` (repo-relative). Browser-owning: on macOS run with approved out-of-sandbox execution. */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import http from 'node:http'; import { execFileSync } from 'node:child_process'; import { createHash } from 'node:crypto';
import {createRequire} from 'node:module'; const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)); const {rolldown}=await import(require.resolve('rolldown'));
import { repoRelativeSource } from '../../port/v2/tools/creature-animation/record-source.mjs';
import { CARD_ARCHETYPES } from '../../port/v2/tools/morph/build-card-masters.mjs';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';
import { acquireWorkspaceLock } from '../../port/v2/tools/workspacelock.mjs';
import {requireBattleCaptureTimeline,requireBattleCaptureMedia} from '../../port/v2/tools/battle2-proof/capture-timeline.mjs';
import { summarizeCpuProfile } from '../../port/v2/tools/battle2-proof/cpu-profile.mjs';

const [leftArg, rightArg, outArg, scriptArg] = process.argv.slice(2);
if (!leftArg || !rightArg || !outArg) throw Error('usage: native-runner.mjs <leftFitDir> <rightFitDir> <outDir> [script.json]');
const repo = path.resolve(path.resolve(process.cwd(),'port/v2/tools/battle2-proof'), '../../../..'), producer = path.resolve(repo, 'port/v2/apps/game/src'), arena = path.resolve(repo, 'audits/ARENA_EFFECTS_V42_PROOF_20260912');
const left = path.resolve(leftArg), right = path.resolve(rightArg), out = path.resolve(outArg);
if (fs.existsSync(out)) throw Error('New output directory required'); fs.mkdirSync(out, { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-battle2-proof-')), sources = new Map(), remember = (p) => sources.set(p, { path: p, sha256: sha(fs.readFileSync(p)) });
const report = { status: 'RUNNING', diagnostic: true, source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), scope: 'E1.5 battle2 native proof: two real paint-skin fits on the real stage over the accepted Earth-temperate plates; diagnostic study, not visual acceptance.' };
const save = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
let release, server, browser;
try {
  release = acquireWorkspaceLock('battle2 E1 native proof');
  const bundle = await rolldown({ input: path.join(path.resolve(process.cwd(),'port/v2/tools/battle2-proof'), 'native-entry.mjs'), platform: 'browser', plugins: [{ name: 'read-only-producer', resolveId(id) { if (id.startsWith('cf-proof/')) return path.resolve(producer, id.slice(9)); }, transform(_, id) { if (path.isAbsolute(id) && fs.existsSync(id) && fs.statSync(id).isFile()) remember(id); if(id.endsWith('/native-entry.mjs')) { const old='window.cfBattle2Proof = { state, gates, still, capture };'; if(_.split(old).length!==2) throw Error('Unique diagnostic injection'); return _.replace(old, `window.cfBattle2Proof = { state, gates, still, capture, partStill(g,id){ stageAt(g);const entries=left.rig.parts;const previous=entries.map(p=>p.display.visible);try {for(const p of entries)p.display.visible=p.id===id;right.rig.root.visible=false;app.renderer.render(app.stage);return app.canvas.toDataURL('image/png').split(',')[1];}finally{entries.forEach((p,i)=>p.display.visible=previous[i]);right.rig.root.visible=true;} } };`); } } }] });
  try { await bundle.write({ dir: scratch, format: 'es', entryFileNames: 'bundle.js', sourcemap: true }); } finally { await bundle.close(); } // the map attributes CF_CPU_PROFILE samples to source files
  const side = (dir, name) => { const record = JSON.parse(fs.readFileSync(path.join(dir, 'record.json'))), id = JSON.parse(fs.readFileSync(path.join(dir, 'parts/manifest.json'))).creatureId;
    // the painted masks live in the fit, or in the archetype's registered markings folder (the Salmon's are their own packet)
    const reg = CARD_ARCHETYPES.find((a) => path.resolve(repo, a.dir) === path.resolve(dir)), mdir = reg?.markings ? path.resolve(repo, reg.markings) : dir;
    const markings = {}; if (fs.existsSync(path.join(mdir, 'markings.json'))) { markings[name + '-markings.json'] = path.join(mdir, 'markings.json'); const mj = JSON.parse(fs.readFileSync(path.join(mdir, 'markings.json'))); for (const [k, v] of Object.entries(mj.patterns ?? {})) if (v?.file) markings[name + '-marking-' + k + '.png'] = path.join(mdir, v.file); }
    return { ...markings, [name + '-record.json']: path.join(dir, 'record.json'), [name + '-binding.json']: path.join(dir, 'binding.json'), [name + '-keyed.png']: path.join(dir, 'parts/keyed.png'), [name + '-atlas.png']: path.join(dir, 'parts/atlas/' + id + '.png'), [name + '-master.png']: path.resolve(repo, repoRelativeSource(record.source)) }; };
  const anchors = JSON.parse(fs.readFileSync(path.join(arena, 'wild-anchors.json')));
  const assets = { ...side(left, 'left'), ...side(right, 'right'), 'arena-recipe.json': path.join(arena, 'arena-recipe.json'), 'wild-anchors.json': path.join(arena, 'wild-anchors.json'), 'arena-far.png': path.join(arena, 'arena-far.png'), 'arena-mid.png': path.join(arena, 'keyed/arena-mid.png'), 'arena-near.png': path.join(arena, 'keyed/arena-near.png') };
  for (const p of anchors.phases) if (p.keyedImage && !/^procedural:/.test(p.keyedImage)) assets[path.basename(p.keyedImage)] = path.join(arena, p.keyedImage);
  for (const [n, p] of Object.entries(assets)) { remember(p); fs.copyFileSync(p, path.join(scratch, n)); }
  const leftName = JSON.parse(fs.readFileSync(path.join(left, 'record.json'))).identity.earthName, rightName = JSON.parse(fs.readFileSync(path.join(right, 'record.json'))).identity.earthName;
  const script = scriptArg ? JSON.parse(fs.readFileSync(path.resolve(scriptArg))) : { readyMs: 600, commandMs: 300, themes: { A: 'wild', B: 'stone' }, rows: [
    { side: 'A', an: leftName, dn: rightName, dmg: 9, crit: false, hpA: 30, hpB: 21 }, { an: leftName, dn: rightName, dodge: true }, { side: 'A', an: leftName, dn: rightName, dmg: 21, crit: true, hpA: 30, hpB: 0 }] };
  report.script = script; fs.writeFileSync(path.join(scratch, 'script.json'), JSON.stringify(script));
  fs.writeFileSync(path.join(scratch, 'index.html'), '<body style="margin:0;background:#141d22"><script type="module" src="bundle.js"></script></body>');
  server = http.createServer((req, res) => { const n = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html'; if (n.includes('/') || !fs.existsSync(path.join(scratch, n))) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', n.endsWith('.js') ? 'text/javascript' : n.endsWith('.json') ? 'application/json' : n.endsWith('.html') ? 'text/html' : 'image/png'); res.end(fs.readFileSync(path.join(scratch, n))); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  browser = await openChromiumCdp({ label: 'battle2 E1 native proof', userDataPrefix: 'cf-battle2-proof', commandTimeoutMs: 60000 }); report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 576, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port });
  const deadline = performance.now() + 90000; for (;;) { const s = await evaluate('window.cfBattle2Proof?.state'); if (s?.status === 'FAIL') throw Error(s.error); if (s?.status === 'READY') break; if (performance.now() > deadline) throw Error('Readiness timeout'); await new Promise((r) => setTimeout(r, 100)); }
  report.gates = await evaluate('window.cfBattle2Proof.gates()'); save();
  report.partStills=[];
  const turn=report.gates.turns[0],ms=turn.offsetMs+(turn.beats.commandEnd+turn.beats.actionStart)/2;
  for(const id of ['fore-near-root','fore-near-knee','fore-far-root','neck','chest','spine']){
    const file=id+'.png';fs.writeFileSync(path.join(out,file),Buffer.from(await evaluate('window.cfBattle2Proof.partStill('+ms+','+JSON.stringify(id)+')'),'base64'));report.partStills.push({id,ms,file});
  }
  report.status='DIAGNOSTIC_ONLY';
} catch (e) { report.status = 'FAIL'; report.error = String(e.stack ?? e); process.exitCode = 1; }
finally { report.sources = [...sources.values()]; for (const r of report.sources) if (sha(fs.readFileSync(r.path)) !== r.sha256) { report.status = 'FAIL'; report.error = 'source changed: ' + r.path; process.exitCode = 1; } save(); await browser?.close(); if (server) await new Promise((r) => server.close(r)); release?.(); fs.rmSync(scratch, { recursive: true, force: true }); }
console.log(JSON.stringify({ status: report.status, error: report.error, refusals: report.capture?.refusalsAtEnd, attacks: report.gates?.attacks, capture: report.capture && { frames: report.capture.frames, cpuP95Ms: report.capture.cpuP95Ms, frameDeltaP95Ms: report.capture.frameDeltaP95Ms } }));
