#!/usr/bin/env node
/** E1.5 — battle2 native proof runner. Bundles `native-entry.mjs` against THIS lane's `apps/game/src`, serves the
 * two fits + arena proof assets flat, drives Microsoft Edge over the shared CDP launcher, writes report.json, per-turn
 * stills (approach 50 %, impact, reaction 50 %) and a complete-script webm (at least 10 s), and hashes every source it read. Diagnostic study.
 * Usage: node tools/battle2-proof/native-runner.mjs <leftFitDir> <rightFitDir> <outDir> [script.json]
 * A fit dir holds record.json, binding.json, parts/keyed.png, parts/manifest.json, parts/atlas/<id>.png; the painter
 * master is `record.source` (repo-relative). Browser-owning: on macOS run with approved out-of-sandbox execution. */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import http from 'node:http'; import { execFileSync } from 'node:child_process'; import { createHash } from 'node:crypto';
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const requireAtV2=createRequire(new URL('../../port/v2/package.json',import.meta.url));const {rolldown}=await import(pathToFileURL(requireAtV2.resolve('rolldown')).href);
import { repoRelativeSource } from '../../port/v2/tools/creature-animation/record-source.mjs';
import { CARD_ARCHETYPES } from '../../port/v2/tools/morph/build-card-masters.mjs';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';
import { acquireWorkspaceLock } from '../../port/v2/tools/workspacelock.mjs';
import {requireBattleCaptureTimeline,requireBattleCaptureMedia} from '../../port/v2/tools/battle2-proof/capture-timeline.mjs';
import { summarizeCpuProfile } from '../../port/v2/tools/battle2-proof/cpu-profile.mjs';

const [leftArg, rightArg, outArg, scriptArg] = process.argv.slice(2);
if (!leftArg || !rightArg || !outArg) throw Error('usage: native-runner.mjs <leftFitDir> <rightFitDir> <outDir> [script.json]');
const repo = path.resolve(import.meta.dirname, '../..'), producer = path.resolve(repo, 'port/v2/apps/game/src'), arena = path.resolve(repo, 'audits/ARENA_EFFECTS_V42_PROOF_20260912');
const left = path.resolve(leftArg), right = path.resolve(rightArg), out = path.resolve(outArg);
if (fs.existsSync(out)) throw Error('New output directory required'); fs.mkdirSync(out, { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-battle2-proof-')), sources = new Map(), remember = (p) => sources.set(p, { path: p, sha256: sha(fs.readFileSync(p)) });
const report = { status: 'RUNNING', diagnostic: true, source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), scope: 'C163 audit copy of the actual battle stage; registered fits/supports, explicit representative world and accepted painted plates. Native performance is unmeasured until this runner is separately authorized and run.' };
const safe=v=>typeof v==='string'?v.replaceAll(os.homedir(),'~'):v;const save = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report,(_k,v)=>safe(v),2)+'\n');
const assetPath=p=>path.isAbsolute(p)?p:path.resolve(repo,p.replace(/^~\//,os.homedir()+'/'));
const arenaManifest=process.env.CF_ARENA_MANIFEST?JSON.parse(fs.readFileSync(assetPath(process.env.CF_ARENA_MANIFEST),'utf8')):null;
const arenaAssets=arenaManifest?Object.fromEntries(['recipe','far','mid','near'].map(k=>{if(typeof arenaManifest[k]!=='string')throw Error('arena manifest requires '+k);return[k,assetPath(arenaManifest[k])];})):null;
const effectPath=process.env.CF_EFFECT_ANCHORS?assetPath(process.env.CF_EFFECT_ANCHORS):path.join(arena,'wild-anchors.json'),effectRoot=path.dirname(effectPath);
const overrides=process.env.CF_PROOF_SOURCE_OVERRIDES?JSON.parse(fs.readFileSync(assetPath(process.env.CF_PROOF_SOURCE_OVERRIDES),'utf8')):{};
const proofDir=path.join(repo,'port/v2/tools/battle2-proof');
const auditEntry=path.join(import.meta.dirname,'native-entry.mjs');
const pairCase=process.env.CF_ALL_PAIRS_CASE?JSON.parse(fs.readFileSync(assetPath(process.env.CF_ALL_PAIRS_CASE))):null;
if(pairCase)report.pairCase={id:pairCase.id,scriptSha256:pairCase.scriptSha256};
remember(import.meta.filename);remember(auditEntry);if(pairCase)remember(assetPath(process.env.CF_ALL_PAIRS_CASE));
report.exactAssetInputs={effectAnchors:path.relative(repo,effectPath),arenaManifest:process.env.CF_ARENA_MANIFEST??null,sourceOverrides:Object.keys(overrides)};
if(pairCase){if(Object.keys(overrides).length)throw Error('All-pairs source overrides refused');if(path.relative(repo,left)!==pairCase.fitConfig.left.dir||path.relative(repo,right)!==pairCase.fitConfig.right.dir)throw Error('All-pairs actual fit paths differ');if(path.relative(repo,effectPath)!==pairCase.effectAnchors)throw Error('All-pairs effect input differs');for(const k of ['recipe','far','mid','near'])if(!arenaAssets||path.relative(repo,arenaAssets[k])!==pairCase.arena[k])throw Error('All-pairs actual arena differs '+k);report.pairAssetBinding={left:path.relative(repo,left),right:path.relative(repo,right),effect:path.relative(repo,effectPath),arena:Object.fromEntries(['recipe','far','mid','near'].map(k=>[k,path.relative(repo,arenaAssets[k])]))};}
let release, server, browser;
try {
  release = acquireWorkspaceLock('battle2 E1 native proof');
  const bundle = await rolldown({ input: auditEntry, platform: 'browser', plugins: [{ name: 'read-only-producer', resolveId(id,importer) { if(id==='pixi.js')return requireAtV2.resolve(id);const normal=id.startsWith('cf-proof/')?path.resolve(producer,id.slice(9)):id.startsWith('.')&&importer?path.resolve(path.dirname(importer),id):null;const relative=normal?path.relative(repo,normal):id;const swap=overrides[id]??overrides[relative];if(swap)return assetPath(swap);if(id.startsWith('cf-proof/'))return normal; }, transform(_, id) { if (path.isAbsolute(id) && fs.existsSync(id) && fs.statSync(id).isFile()) remember(id); } }] });
  try { await bundle.write({ dir: scratch, format: 'es', entryFileNames: 'bundle.js', sourcemap: true }); } finally { await bundle.close(); } // the map attributes CF_CPU_PROFILE samples to source files
  const side = (dir, name) => { const record = JSON.parse(fs.readFileSync(path.join(dir, 'record.json'))), id = JSON.parse(fs.readFileSync(path.join(dir, 'parts/manifest.json'))).creatureId;
    // the painted masks live in the fit, or in the archetype's registered markings folder (the Salmon's are their own packet)
    const reg = CARD_ARCHETYPES.find((a) => path.resolve(repo, a.dir) === path.resolve(dir)), mdir = pairCase?.fitConfig?.[name]?.markingsDir ? path.resolve(repo,pairCase.fitConfig[name].markingsDir) : reg?.markings ? path.resolve(repo, reg.markings) : dir;
    const markings = {}; if (fs.existsSync(path.join(mdir, 'markings.json'))) { markings[name + '-markings.json'] = path.join(mdir, 'markings.json'); const mj = JSON.parse(fs.readFileSync(path.join(mdir, 'markings.json'))); for (const [k, v] of Object.entries(mj.patterns ?? {})) if (v?.file) markings[name + '-marking-' + k + '.png'] = path.join(mdir, v.file); }
    return { ...markings, [name + '-record.json']: path.join(dir, 'record.json'), [name + '-binding.json']: path.join(dir, 'binding.json'), [name + '-keyed.png']: path.join(dir, 'parts/keyed.png'), [name + '-atlas.png']: path.join(dir, 'parts/atlas/' + id + '.png'), [name + '-master.png']: path.resolve(repo, repoRelativeSource(record.source)) }; };
  const anchors = JSON.parse(fs.readFileSync(effectPath));remember(effectPath);if(process.env.CF_ARENA_MANIFEST)remember(assetPath(process.env.CF_ARENA_MANIFEST));if(process.env.CF_PROOF_SOURCE_OVERRIDES)remember(assetPath(process.env.CF_PROOF_SOURCE_OVERRIDES));
  const assets = { ...side(left, 'left'), ...side(right, 'right'), 'arena-recipe.json': arenaAssets?.recipe??path.join(arena,'arena-recipe.json'), 'wild-anchors.json': effectPath, 'arena-far.png': arenaAssets?.far??path.join(arena,'arena-far.png'), 'arena-mid.png': arenaAssets?.mid??path.join(arena,'keyed/arena-mid.png'), 'arena-near.png': arenaAssets?.near??path.join(arena,'keyed/arena-near.png') };
  for (const p of anchors.phases) if (p.keyedImage && !/^procedural:/.test(p.keyedImage)) assets[path.basename(p.keyedImage)] = path.resolve(effectRoot,p.keyedImage);
  for (const [n, p] of Object.entries(assets)) { remember(p); fs.copyFileSync(p, path.join(scratch, n)); }
  const leftName = JSON.parse(fs.readFileSync(path.join(left, 'record.json'))).identity.earthName, rightName = JSON.parse(fs.readFileSync(path.join(right, 'record.json'))).identity.earthName;
  const script = scriptArg ? JSON.parse(fs.readFileSync(path.resolve(scriptArg))) : { readyMs: 600, commandMs: 300, themes: { A: 'wild', B: 'stone' }, rows: [
    { side: 'A', an: leftName, dn: rightName, dmg: 9, crit: false, hpA: 30, hpB: 21 }, { an: leftName, dn: rightName, dodge: true }, { side: 'A', an: leftName, dn: rightName, dmg: 21, crit: true, hpA: 30, hpB: 0 }] };
  report.script = script; report.scriptSha256=sha(JSON.stringify(script));if(scriptArg)remember(path.resolve(scriptArg));if(pairCase){for(const p of pairCase.inputs)remember(path.resolve(repo,p.path));if(report.scriptSha256!==pairCase.scriptSha256)throw Error('All-pairs exact script differs');}
  fs.writeFileSync(path.join(scratch, 'script.json'), JSON.stringify(script));
  fs.writeFileSync(path.join(scratch, 'index.html'), '<body style="margin:0;background:#141d22"><script type="module" src="bundle.js"></script></body>');
  server = http.createServer((req, res) => { const n = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html'; if (n.includes('/') || !fs.existsSync(path.join(scratch, n))) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', n.endsWith('.js') ? 'text/javascript' : n.endsWith('.json') ? 'application/json' : n.endsWith('.html') ? 'text/html' : path.extname(assets[n]??n)==='.webp' ? 'image/webp' : 'image/png'); res.end(fs.readFileSync(path.join(scratch, n))); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  browser = await openChromiumCdp({ label: 'battle2 E1 native proof', userDataPrefix: 'cf-battle2-proof', commandTimeoutMs: 60000 }); report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 576, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port });
  const deadline = performance.now() + 90000; for (;;) { const s = await evaluate('window.cfBattle2Proof?.state'); if (s?.status === 'FAIL') throw Error(s.error); if (s?.status === 'READY') break; if (performance.now() > deadline) throw Error('Readiness timeout'); await new Promise((r) => setTimeout(r, 100)); }
  report.gates = await evaluate('window.cfBattle2Proof.gates()'); save();
  report.stills = [];
  for (const t of report.gates.turns) { const b = t.beats, o = t.offsetMs, marks = [['launch',o+b.actionStart],['launch-plus-40',o+b.actionStart+40],['approach-50', o + (b.commandEnd + b.actionStart) / 2], ['impact', o + b.impactAt], ['reaction-50', o + (b.reactionStart + b.reactionEnd) / 2], ['return-end', o + b.returnEnd], ...(t.turn === report.gates.turns.length - 1 ? [['idle-50', o + (b.returnEnd + b.end) / 2], ['idle-90', o + b.returnEnd + 0.9 * (b.end - b.returnEnd)]] : [])];
    for (const [name, ms] of marks) { const file = `turn${t.turn}-${t.outcome}-${name}.png`; fs.writeFileSync(path.join(out, file), Buffer.from(await evaluate('window.cfBattle2Proof.still(' + ms + ')'), 'base64')); report.stills.push({ turn: t.turn, name, ms, file }); } }
  // CF_CPU_THROTTLE=N (optional, phone-tier studies): Chrome slows the page's CPU N× for the capture (CDP Emulation.setCPUThrottlingRate)
  const throttle = Number(process.env.CF_CPU_THROTTLE ?? '4'); if (!(throttle >= 1 && throttle <= 20)) throw Error('CF_CPU_THROTTLE must be 1..20');
  if(pairCase&&throttle!==4)throw Error('All-pairs requires exact 4x CPU');
  if (throttle > 1) await send('Emulation.setCPUThrottlingRate', { rate: throttle }); report.cpuThrottle = throttle;
  // CF_CPU_PROFILE=1 (optional, cost breakdowns): Chrome's sampling profiler around the capture; self time is attributed to the
  // ORIGINAL source file of each sample through the bundle's source map, then written as cpu-breakdown.json (per file and per group)
  const profiling = process.env.CF_CPU_PROFILE === '1';
  if (profiling) { await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 }); await send('Profiler.start'); }
  remember(path.join(proofDir,'capture-timeline.mjs'));
  remember(path.join(repo,'port/v2/tools/animation-completion/review-schedule.mjs'));
  remember(path.join(repo,'port/v2/tools/quadruped-proof/motion-proof-contract.mjs'));
  report.capture = await evaluate('window.cfBattle2Proof.capture()');
  const sampleBytes=Buffer.from(JSON.stringify(report.capture.frameSamples)+'\n');fs.writeFileSync(path.join(out,'frame-samples.json'),sampleBytes,{flag:'wx'});report.capture.sampleLedger={file:'frame-samples.json',sha256:sha(sampleBytes)};
  if (profiling) {
    const { profile } = await send('Profiler.stop');
    const { SourceMapConsumer } = requireAtV2('source-map-js');
    const consumer = new SourceMapConsumer(JSON.parse(fs.readFileSync(path.join(scratch, 'bundle.js.map'), 'utf8')));
    remember(path.join(proofDir, 'cpu-profile.mjs'));
    const resolveSource = cf => {
      if (cf.url?.endsWith('bundle.js') && cf.lineNumber >= 0) return String(consumer.originalPositionFor({ line: cf.lineNumber + 1, column: Math.max(0, cf.columnNumber) }).source ?? 'bundle?').replace(/^.*?\/(apps|packages|tools|node_modules)\//, '$1/');
      if (cf.functionName === '(idle)' || cf.functionName === '(program)') return cf.functionName;
      if (cf.functionName === '(garbage collector)') return '(gc)';
      return cf.url ? 'other-script:' + cf.url.split('/').pop() : 'native:' + (cf.functionName || '?');
    };
    const breakdown = summarizeCpuProfile(profile, resolveSource, {frames: report.capture.frames, cpuThrottle: report.cpuThrottle});
    fs.writeFileSync(path.join(out, 'cpu-profile.json'), JSON.stringify(profile) + '\n');
    fs.writeFileSync(path.join(out, 'cpu-breakdown.json'), JSON.stringify(breakdown, null, 1) + '\n');
  } fs.writeFileSync(path.join(out, 'battle-full.webm'), Buffer.from(report.capture.video, 'base64')); delete report.capture.video;
  const media = JSON.parse(execFileSync('/opt/homebrew/bin/ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'format=duration:stream=codec_type,nb_read_frames,width,height', '-of', 'json', path.join(out, 'battle-full.webm')], { encoding: 'utf8' }));
  report.capture.encodedMedia = media; save();
  report.capture.timelineProof=requireBattleCaptureTimeline(report.gates,report.capture);
  report.capture.encodedFrames=requireBattleCaptureMedia(media,report.capture.timelineProof.plannedDurationMs);
  const refusals = report.capture.refusalsAtEnd; report.status = refusals.left === 0 && refusals.right === 0 ? 'DIAGNOSTIC_PASS' : 'FAIL'; if (report.status === 'FAIL') throw Error('rig refusals in play: ' + JSON.stringify(refusals) + ' ' + JSON.stringify(report.capture.lastRefusal));
} catch (e) { report.status = 'FAIL'; report.error = String(e.stack ?? e); process.exitCode = 1; }
finally { report.sources = [...sources.values()].map(r=>({...r,path:path.relative(repo,r.path)})); for (const r of sources.values()) if (sha(fs.readFileSync(r.path)) !== r.sha256) { report.status = 'FAIL'; report.error = 'source changed: ' + r.path; process.exitCode = 1; } if(pairCase&&report.status==='DIAGNOSTIC_PASS'){try{const {validatePairReport}=await import('./validate.mjs');report.allPairsResult=validatePairReport(pairCase,report);}catch(e){report.status='FAIL';report.error=String(e.stack??e);process.exitCode=1;}}save(); await browser?.close(); if (server) await new Promise((r) => server.close(r)); release?.(); fs.rmSync(scratch, { recursive: true, force: true }); }
console.log(JSON.stringify({ status: report.status, error: report.error, refusals: report.capture?.refusalsAtEnd, attacks: report.gates?.attacks, capture: report.capture && { frames: report.capture.frames, cpuP95Ms: report.capture.cpuP95Ms, frameDeltaP95Ms: report.capture.frameDeltaP95Ms } }));
