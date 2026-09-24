#!/usr/bin/env node
/** Local unmorphed ARCHETYPE study runner (Codex, 2026-09-22; renamed from native-runner.mjs at the sprint merge into anthropic/mac,
 * where native-runner.mjs is the E1.5 morph/guardian harness). Bundles `archetype-native-entry.mjs` against THIS lane's `apps/game/src`, serves the
 * two fits + arena proof assets flat, drives Microsoft Edge over the shared CDP launcher, writes report.json, per-turn
 * stills (approach 50 %, impact, reaction 50 %) and a 10 s webm, and hashes every source it read. Diagnostic study.
 * Usage: node tools/battle2-proof/native-runner.mjs <leftFitDir> <rightFitDir> <outDir> [script.json]
 * A fit dir holds record.json, binding.json, parts/keyed.png, parts/manifest.json, parts/atlas/<id>.png; the painter
 * master is `record.source` (repo-relative). Browser-owning: on macOS run with approved out-of-sandbox execution. */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import http from 'node:http'; import { execFileSync } from 'node:child_process'; import { createHash } from 'node:crypto';
import { rolldown } from 'rolldown';
import { openChromiumCdp } from '../browsercdp.mjs';
import { acquireWorkspaceLock } from '../workspacelock.mjs';
import { requireTenSecondMedia } from '../quadruped-proof/capture-contract.mjs';
import { inspectEncodedFrames } from '../quadruped-proof/motion-proof-contract.mjs';

const [leftArg, rightArg, outArg, scriptArg] = process.argv.slice(2);
if (!leftArg || !rightArg || !outArg) throw Error('usage: native-runner.mjs <leftFitDir> <rightFitDir> <outDir> [script.json]');
const repo = path.resolve(import.meta.dirname, '../../../..'), producer = path.resolve(repo, 'port/v2/apps/game/src'), arena = path.resolve(repo, 'audits/ARENA_EFFECTS_V42_PROOF_20260912');
const left = path.resolve(leftArg), right = path.resolve(rightArg), out = path.resolve(outArg);
if (fs.existsSync(out)) throw Error('New output directory required'); fs.mkdirSync(out, { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-battle2-proof-')), sources = new Map(), remember = (p) => sources.set(p, { path: p, sha256: sha(fs.readFileSync(p)) });
const report = { status: 'RUNNING', diagnostic: true, source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), scope: 'Local unmorphed archetype native proof: actual stage, motion/contact and paint-skin owners. Canonical source world with labelled procedural water overlay when aquatic. Human art review remains separate.' };
const save = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
let release, server, browser;
try {
  release = acquireWorkspaceLock('battle2 local archetype proof'); remember(new URL(import.meta.url).pathname);
  const snapshotFile = path.join(repo, 'audits/ART_KIT_ENGINE_FIRST_20260912/canonical-snapshot.json'), cardFile = path.join(repo, 'audits/ART_KIT_ENGINE_FIRST_20260912/family-compiled-inputs.json');
  remember(snapshotFile); remember(cardFile); const snapshot = JSON.parse(fs.readFileSync(snapshotFile)), compiled = JSON.parse(fs.readFileSync(cardFile));
  const world = { key: snapshot.request.worldKey, biome: snapshot.request.biomeKey, seed: snapshot.roster.planetSeed, solid: true, atmosphere: true, liquid: snapshot.request.options.water === 'liquid' ? 'water' : null, surfaceWater: snapshot.request.options.water === 'liquid', signature: snapshot.request.options.wx, cardHash: sha(Buffer.from(JSON.stringify(compiled.systemCard))) };
  const worldBytes = Buffer.from(JSON.stringify(world)); fs.writeFileSync(path.join(scratch, 'world.json'), worldBytes); fs.writeFileSync(path.join(out, 'world.json'), worldBytes); report.worldSha256 = sha(worldBytes);
  const bundle = await rolldown({ input: path.join(import.meta.dirname, 'archetype-native-entry.mjs'), platform: 'browser', plugins: [{ name: 'read-only-producer', resolveId(id) { if (id.startsWith('cf-proof/')) return path.resolve(producer, id.slice(9)); }, transform(_, id) { if (path.isAbsolute(id) && fs.existsSync(id) && fs.statSync(id).isFile()) remember(id); } }] });
  try { await bundle.write({ dir: scratch, format: 'es', entryFileNames: 'bundle.js' }); } finally { await bundle.close(); }
  const side = (dir, name) => { remember(path.join(dir, 'parts/manifest.json')); const record = JSON.parse(fs.readFileSync(path.join(dir, 'record.json'))), id = JSON.parse(fs.readFileSync(path.join(dir, 'parts/manifest.json'))).creatureId;
    const markings = {}; if (fs.existsSync(path.join(dir, 'markings.json'))) { markings[name + '-markings.json'] = path.join(dir, 'markings.json'); const mj = JSON.parse(fs.readFileSync(path.join(dir, 'markings.json'))); for (const [k, v] of Object.entries(mj.patterns ?? {})) if (v?.file) markings[name + '-marking-' + k + '.png'] = path.join(dir, v.file); }
    return { ...markings, [name + '-record.json']: path.join(dir, 'record.json'), [name + '-binding.json']: path.join(dir, 'binding.json'), [name + '-keyed.png']: path.join(dir, 'parts/keyed.png'), [name + '-atlas.png']: path.join(dir, 'parts/atlas/' + id + '.png'), [name + '-master.png']: path.resolve(repo, record.source) }; };
  const anchors = JSON.parse(fs.readFileSync(path.join(arena, 'wild-anchors.json')));
  const assets = { ...side(left, 'left'), ...side(right, 'right'), 'arena-recipe.json': path.join(arena, 'arena-recipe.json'), 'wild-anchors.json': path.join(arena, 'wild-anchors.json'), 'arena-far.png': path.join(arena, 'arena-far.png'), 'arena-mid.png': path.join(arena, 'keyed/arena-mid.png'), 'arena-near.png': path.join(arena, 'keyed/arena-near.png') };
  for (const p of anchors.phases) if (p.keyedImage && !/^procedural:/.test(p.keyedImage)) assets[path.basename(p.keyedImage)] = path.join(arena, p.keyedImage);
  for (const [n, p] of Object.entries(assets)) { remember(p); fs.copyFileSync(p, path.join(scratch, n)); }
  const leftName = JSON.parse(fs.readFileSync(path.join(left, 'record.json'))).identity.earthName, rightName = JSON.parse(fs.readFileSync(path.join(right, 'record.json'))).identity.earthName;
  const script = scriptArg ? JSON.parse(fs.readFileSync(path.resolve(scriptArg))) : { readyMs: 600, commandMs: 300, themes: { A: 'wild', B: 'stone' }, rows: [
    { side: 'A', an: leftName, dn: rightName, dmg: 9, crit: false, hpA: 30, hpB: 21 }, { an: leftName, dn: rightName, dodge: true }, { side: 'A', an: leftName, dn: rightName, dmg: 21, crit: true, hpA: 30, hpB: 0 }] };
  if (Object.hasOwn(script, 'morph')) throw Error('Local archetype-only harness refuses morph requests');
  const scriptBytes = scriptArg ? fs.readFileSync(path.resolve(scriptArg)) : Buffer.from(JSON.stringify(script)); if (scriptArg) remember(path.resolve(scriptArg));
  report.script = script; report.scriptSha256 = sha(scriptBytes); report.runId = script.runId ?? path.basename(out); fs.writeFileSync(path.join(scratch, 'script.json'), scriptBytes); fs.writeFileSync(path.join(out, 'script.json'), scriptBytes);
  fs.writeFileSync(path.join(scratch, 'index.html'), '<body style="margin:0;background:#141d22"><script type="module" src="bundle.js"></script></body>');
  server = http.createServer((req, res) => { const n = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html'; if (n.includes('/') || !fs.existsSync(path.join(scratch, n))) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', n.endsWith('.js') ? 'text/javascript' : n.endsWith('.json') ? 'application/json' : n.endsWith('.html') ? 'text/html' : 'image/png'); res.end(fs.readFileSync(path.join(scratch, n))); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  browser = await openChromiumCdp({ label: 'battle2 E1 native proof', userDataPrefix: 'cf-battle2-proof', commandTimeoutMs: 60000 }); report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 576, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port });
  const deadline = performance.now() + 90000; for (;;) { const s = await evaluate('window.cfBattle2Proof?.state'); if (s?.status === 'FAIL') throw Error(s.error); if (s?.status === 'READY') break; if (performance.now() > deadline) throw Error('Readiness timeout'); await new Promise((r) => setTimeout(r, 100)); }
  report.gates = await evaluate('window.cfBattle2Proof.gates()'); save(); if (report.gates.status !== 'DIAGNOSTIC_PASS') throw Error('Native gate refused');
  report.stills = [];
  for (const t of report.gates.turns) { const b = t.beats, o = t.offsetMs, marks = [['approach-50', o + (b.commandEnd + b.actionStart) / 2], ['impact', o + b.impactAt], ['reaction-50', o + (b.reactionStart + b.reactionEnd) / 2], ['return-end', o + b.returnEnd]];
    for (const [name, ms] of marks) { const file = `turn${t.turn}-${t.outcome}-${name}.png`; fs.writeFileSync(path.join(out, file), Buffer.from(await evaluate('window.cfBattle2Proof.still(' + ms + ')'), 'base64')); report.stills.push({ turn: t.turn, name, ms, file }); } }
  report.capture = await evaluate('window.cfBattle2Proof.capture()'); fs.writeFileSync(path.join(out, 'battle-10s.webm'), Buffer.from(report.capture.video, 'base64')); delete report.capture.video;
  const media = JSON.parse(execFileSync('/opt/homebrew/bin/ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'format=duration:stream=codec_type,nb_read_frames,width,height', '-of', 'json', path.join(out, 'battle-10s.webm')], { encoding: 'utf8' }));
  report.capture.encodedMedia = media; save(); requireTenSecondMedia(Number(media.format.duration)); report.capture.encodedFrames = inspectEncodedFrames(media.streams);
  const refusals = report.capture.refusalsAtEnd; if (refusals.left !== 0 || refusals.right !== 0) throw Error('rig refusals in play: ' + JSON.stringify(refusals) + ' ' + JSON.stringify(report.capture.lastRefusal));
  if (!(report.capture.durationMs >= 10000) || report.gates.totalMs > 10000) throw Error('Incomplete live script capture');
  report.paintedTier = { limitMs: 3.5, scope: report.capture.timingScope, perRig: report.capture.perRigUpdateP95Ms };
  for (const side of ['left', 'right']) if (!Number.isFinite(report.paintedTier.perRig?.[side]) || report.paintedTier.perRig[side] > 3.5) throw Error('Desktop painted tier exceeded: ' + JSON.stringify(report.paintedTier));
  report.status = 'DIAGNOSTIC_PASS';
} catch (e) { report.status = 'FAIL'; report.error = String(e.stack ?? e); process.exitCode = 1; }
finally { report.sources = [...sources.values()]; for (const r of report.sources) if (sha(fs.readFileSync(r.path)) !== r.sha256) { report.status = 'FAIL'; report.error = 'source changed: ' + r.path; process.exitCode = 1; } save(); await browser?.close(); if (server) await new Promise((r) => server.close(r)); release?.(); fs.rmSync(scratch, { recursive: true, force: true }); }
console.log(JSON.stringify({ status: report.status, error: report.error, refusals: report.capture?.refusalsAtEnd, attacks: report.gates?.attacks, capture: report.capture && { frames: report.capture.frames, cpuP95Ms: report.capture.cpuP95Ms, frameDeltaP95Ms: report.capture.frameDeltaP95Ms } }));
