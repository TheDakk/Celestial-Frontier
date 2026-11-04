/* Battle scene v2 proof page: arena plates + Civet fixture rig (landmark-derived parts) versus
 * Platypus whole-portrait fallback, one Wild melee each way, world life at arena density, real
 * clock injected into the stage. Exposes window.cfBattle { state, frame, capture, report }. */
import { Application, Container, Graphics, Sprite, Text, Texture, Particle, ParticleContainer } from 'pixi.js';
import { keyAndDespill } from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import { BattleStage, composeArena, createFixtureRig, createPortraitRig, cutFixtureParts, turnPlanInputFromTranscriptEvent } from '../../apps/game/src/battle2/index.ts';
import { compileBodyCard } from '../../apps/game/src/motion/body-card.ts';
import { parseEffectSequenceAnchors } from '../../apps/game/src/effects/anchors.ts';
import { createPixiEffectHost } from '../../apps/game/src/effects/pixi-adapter.ts';
import { EffectThemeLibrary, isProceduralImage } from '../../apps/game/src/effects/theme-library.ts';
import { PARTICLE_DISC_SIZE, particleDiscRgba } from '../../apps/game/src/effects/particle-texture.ts';
import { compileWorldLife } from '../../apps/game/src/worldlife/spec.ts';
import { WorldLifePixiAdapter } from '../../apps/game/src/worldlife/pixi-adapter.ts';
import { primeRecorder } from '../quadruped-proof/capture-contract.mjs';

const FRAME = { width: 1024, height: 576 }, required = (v, m) => { if (!v) throw Error(m); };
const json = (p) => fetch(p).then((r) => { required(r.ok, p); return r.json(); });
const bytes = (p) => fetch(p).then((r) => { required(r.ok, p); return r.arrayBuffer(); });
const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const imageCanvas = async (b) => { const bm = await createImageBitmap(new Blob([b])); const c = canvas(bm.width, bm.height); c.getContext('2d').drawImage(bm, 0, 0); bm.close(); return c; };
const b64 = (buffer) => { let s = ''; const a = new Uint8Array(buffer); for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode(...a.subarray(i, i + 8192)); return btoa(s); };
const sha256 = async (b) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map((x) => x.toString(16).padStart(2, '0')).join('');
const texture = (c) => { const t = Texture.from(c); t.source.scaleMode = 'linear'; return t; };
const state = { status: 'PREPARING', errors: [], labels: {}, plans: [], cuePlans: [], cues: [], captures: [] }; let lastCue = '—', turnIndexForCue = -1;
window.cfBattle = { state };
const app = new Application(); await app.init({ width: FRAME.width, height: FRAME.height, resolution: 1, background: '#141d22', antialias: true, preference: 'webgl', autoStart: false }); document.body.append(app.canvas);
let tNow = 0; const clock = () => tNow;
try {
  const recipe = await json('arena-recipe.json'), anchorsParse = parseEffectSequenceAnchors(await json('wild-anchors.json')); required(anchorsParse.ok, anchorsParse.reason); const anchors = anchorsParse.anchors;
  // B2/B1: one painted sequence (Wild) plus the labelled procedural emitter for every other theme; cues recorded as they fire.
  const themes = new EffectThemeLibrary([anchors]);
  const cueSink = { play: (c, late) => { state.cues.push({ turn: turnIndexForCue, cueId: c.cueId, atMs: +c.atMs.toFixed(2), lateMs: +late.toFixed(2), source: c.source, beat: c.beat }); lastCue = `${c.cueId} @ ${c.atMs.toFixed(0)} ms (+${late.toFixed(0)})`; } };
  const plateCanvas = { far: await imageCanvas(await bytes('arena-far.png')), mid: await imageCanvas(await bytes('arena-mid.png')), near: await imageCanvas(await bytes('arena-near.png')) };
  const layout = composeArena({ id: recipe.battleContext.worldKey, groundLineNormalized: recipe.groundLineNormalized, plates: plateCanvas }, FRAME);
  // Civet: keyed master + landmark record → fixture rig with one canvas per part (mask applied).
  const civetRecord = await json('civet.landmarks.json'), civetCanvas = await imageCanvas(await bytes('civet.png'));
  const cc = civetCanvas.getContext('2d'), craw = cc.getImageData(0, 0, civetCanvas.width, civetCanvas.height), keyed = keyAndDespill(craw.data, civetCanvas.width, civetCanvas.height);
  const civetCardForCut = compileBodyCard(civetRecord);
  const t0 = performance.now(), cut = cutFixtureParts(keyed.alpha, civetCanvas.width, civetCanvas.height, civetRecord, { underlapPx: Math.round(civetCanvas.width * 0.02), underlapByLimit: { limitsDeg: civetCardForCut.bounds.limitsDeg, capPx: Math.floor(Math.min(civetCanvas.width, civetCanvas.height) / 8) } }); state.cutMs = performance.now() - t0; state.underlapPixels = cut.parts.reduce((n, p) => n + p.underlapCount, 0);
  const partSprite = (part) => {
    const c = canvas(Math.max(1, part.box.width), Math.max(1, part.box.height)), img = c.getContext('2d').createImageData(c.width, c.height);
    for (let y = 0; y < part.box.height; y++) for (let x = 0; x < part.box.width; x++) { if (!part.mask[y * part.box.width + x]) continue; const s = ((part.box.y + y) * civetCanvas.width + part.box.x + x) * 4, d = (y * c.width + x) * 4; img.data.set(keyed.rgba.subarray(s, s + 4), d); }
    c.getContext('2d').putImageData(img, 0, 0); return new Sprite(texture(c));
  };
  const civet = createFixtureRig({ record: civetRecord, cut, factory: { container: () => new Container(), partSprite } }), civetCard = compileBodyCard(civetRecord);
  // Platypus: keyed master only (no landmark record) → labelled whole-portrait fallback.
  const platCanvas = await imageCanvas(await bytes('platypus.png')), pc = platCanvas.getContext('2d'), praw = pc.getImageData(0, 0, platCanvas.width, platCanvas.height), pk = keyAndDespill(praw.data, platCanvas.width, platCanvas.height);
  pc.putImageData(new ImageData(pk.rgba, platCanvas.width, platCanvas.height), 0, 0);
  const platypus = createPortraitRig({ templateId: 'monotreme', recipeHash: await sha256(await bytes('platypus.png')), cutout: { width: platCanvas.width, height: platCanvas.height }, alphaBox: pk.bounds, factory: { container: () => new Container(), portraitSprite: () => new Sprite(texture(platCanvas)) } });
  state.labels = { left: civet.label, right: platypus.label, parts: civet.parts.length, alphaPixels: cut.alphaCount };
  // Effects, world life, stage.
  const phaseTex = new Map(); for (const p of anchors.phases) phaseTex.set(p.keyedImage, texture(await imageCanvas(await bytes(p.keyedImage.replace('keyed/', 'keyed-')))));
  const dot = canvas(PARTICLE_DISC_SIZE, PARTICLE_DISC_SIZE); dot.getContext('2d').putImageData(new ImageData(particleDiscRgba(PARTICLE_DISC_SIZE), PARTICLE_DISC_SIZE, PARTICLE_DISC_SIZE), 0, 0);
  const life = new WorldLifePixiAdapter({ spec: compileWorldLife(recipe.systemCard, recipe.seed, 'arena'), factory: { container: () => new Container(), graphics: () => new Graphics() }, clock, width: FRAME.width, height: FRAME.height });
  const style = { fontFamily: 'system-ui', fontSize: 34, fontWeight: '700', fill: '#fff2c8', stroke: { color: '#2a1a0a', width: 4 } };
  const stage = new BattleStage({ factory: { container: () => new Container(), sprite: (t) => new Sprite(t), text: (t) => new Text({ text: t, style, anchor: 0.5 }), graphics: () => new Graphics() }, clock, layout,
    plates: { far: texture(plateCanvas.far), mid: texture(plateCanvas.mid), near: texture(plateCanvas.near) }, rigs: { left: civet, right: platypus }, masses: { left: civetCard.massClass.multiplier, right: 0.85 },
    worldLife: life, cues: { sink: cueSink }, effects: { host: createPixiEffectHost({ Sprite, Particle, ParticleContainer }), particleTexture: texture(dot), seed: recipe.seed,
      phaseTextures: (a) => a.phases.map((p) => (isProceduralImage(p.keyedImage) ? null : phaseTex.get(p.keyedImage))), emittersForTheme: (t) => themes.emittersFor(t), tintForTheme: (t) => themes.tintFor(t) } });
  app.stage.addChild(stage.root);
  const caption = new Text({ text: '', style: { fontFamily: 'system-ui', fontSize: 15, fill: '#eee2c9' } }); caption.position.set(12, FRAME.height - 62); app.stage.addChild(caption);
  const ctx = { A: { side: 'A', name: 'Civet', mass: civetCard.massClass.multiplier, card: civetCard, theme: 'wild', seed: civetRecord.identity.seed >>> 0 }, B: { side: 'B', name: 'Platypus', mass: 0.85, card: null, theme: 'tide', seed: 424242 },
    arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: recipe.seed, anchorsForTheme: (t) => themes.anchorsFor(t), readyMs: 900, commandMs: 400 };
  state.labels.effects = { left: `wild: ${themes.resolve('wild').label}`, right: `tide: ${themes.resolve('tide').label}` };
  const turns = [turnPlanInputFromTranscriptEvent({ side: 'A', an: 'Civet', dn: 'Platypus', dmg: 12, crit: false, hpA: 30, hpB: 18 }, ctx), turnPlanInputFromTranscriptEvent({ side: 'B', an: 'Platypus', dn: 'Civet', dmg: 7, crit: false, hpA: 23, hpB: 18 }, ctx)];
  for (const t of turns) required(t.kind === 'turn', t.reason);
  let turnIndex = -1, turnStart = 0, plans = [];
  const startTurn = (i, at) => { turnIndex = i; turnIndexForCue = i; turnStart = at; tNow = at; plans[i] = stage.play(turns[i].input); state.plans[i] = { startMs: at, beats: plans[i].beats, hitstopMs: plans[i].hitstopMs, attacker: plans[i].attacker.label, delivery: plans[i].delivery, theme: plans[i].theme, effect: plans[i].effect?.anchors.sequenceId ?? null };
    const cp = stage.cuePlan; state.cuePlans[i] = cp ? { cues: cp.cues.map((c) => `${c.cueId}@${c.atMs.toFixed(0)}`), dropped: cp.dropped.map((d) => `${d.cueId}: ${d.reason}`) } : null; };
  function frame(ms) { // a pure function of ms: turn boundaries fall exactly on the previous plan's end, never on the frame that noticed it
    if (turnIndex < 0) startTurn(0, 0);
    while (turnIndex + 1 < turns.length && ms - turnStart >= plans[turnIndex].beats.end) startTurn(turnIndex + 1, turnStart + plans[turnIndex].beats.end);
    tNow = ms;
    const begin = performance.now(), f = stage.tick(), updateMs = performance.now() - begin;
    caption.text = `${f.label}\n${plans[turnIndex].attacker.label} → ${plans[turnIndex].delivery} · phase ${f.sample.phase} · ${(ms / 1000).toFixed(2)} s · hitstop ${plans[turnIndex].hitstopMs.toFixed(0)} ms · flash ${f.sample.camera.flash.toFixed(2)} · shake ${Math.hypot(f.sample.camera.shake.x, f.sample.camera.shake.y).toFixed(1)} px\n${plans[turnIndex].theme}: ${state.plans[turnIndex].effect} · cues fired ${f.cuesFired} · last ${lastCue}`;
    app.renderer.render(app.stage); return { updateMs, phase: f.sample.phase };
  }
  const reset = () => { turnIndex = -1; plans = []; state.plans = []; state.cuePlans = []; state.cues = []; lastCue = '—'; frame(0); };
  const capture = async () => {
    reset(); const stream = app.canvas.captureStream(0), track = stream.getVideoTracks()[0], chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 7000000 }); recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise((r) => { recorder.onstop = r; }); let started = false; recorder.onstart = () => { started = true; }; recorder.start();
    await primeRecorder({ started: () => started, paint: () => frame(0), requestFrame: () => track.requestFrame(), schedule: requestAnimationFrame, now: () => performance.now() });
    const updates = [], phases = []; let start;
    await new Promise((resolve) => { const tick = (now) => { if (start === undefined) start = now; const ms = Math.min(10000, now - start); const r = frame(ms); updates.push(r.updateMs); if (phases.at(-1)?.phase !== r.phase) phases.push({ phase: r.phase, atMs: ms }); track.requestFrame(); if (ms >= 10000) resolve(); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    await new Promise((r) => setTimeout(r, 100)); recorder.stop(); await stopped; stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks, { type: recorder.mimeType }), b = await blob.arrayBuffer(), sorted = updates.slice().sort((a, c) => a - c);
    const result = { durationMs: 10000, frames: updates.length, updateP95Ms: sorted[Math.floor(sorted.length * 0.95)], updateMaxMs: Math.max(...updates), phases, plans: state.plans, cuePlans: state.cuePlans, cues: state.cues.slice(), effects: state.labels.effects, mimeType: blob.type, bytes: b.byteLength, sha256: await sha256(b), video: b64(b) };
    state.captures.push({ ...result, video: undefined }); return result;
  };
  Object.assign(window.cfBattle, { frame, capture, reset, report: () => state, strikeMs: () => { reset(); frame(1); return state.plans[0].beats.impactAt; } });
  document.querySelector('#start').onclick = () => { window.cfBattle.capturePromise = capture(); window.cfBattle.capturePromise.catch((e) => { state.capturePhase = 'FAIL: ' + String(e); }); };
  frame(0); state.status = 'READY'; document.querySelector('#state').textContent = `Ready — ${civet.label} vs ${platypus.label}`;
} catch (error) { state.status = 'FAIL'; state.errors.push(String(error.stack ?? error)); document.querySelector('#state').textContent = String(error); }
