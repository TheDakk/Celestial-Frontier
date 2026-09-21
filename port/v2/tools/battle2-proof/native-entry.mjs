/** E1.5 — battle2 native proof (browser side). Two REAL source paint-skin fits on the REAL BattleStage over
 * the accepted Earth-temperate plates: Codex's rigs through the parts-rig adapter (performance owner + contact
 * solver), anatomy attacks from `compileAnatomyAttack`, the Wild painted effect, the habitat-selected stands,
 * a scripted transcript, a manual clock. Films 10 s and renders stills on demand. Diagnostic study, not visual
 * acceptance; every number it reports is read from the live stage. */
import { Application, Container, Graphics, Particle, ParticleContainer, Sprite, Text, Texture } from 'pixi.js';
import { compileAnatomyAttack } from 'cf-proof/anatomy-attacks.ts';
import { combatantScale, composeArena } from 'cf-proof/battle2/arena.ts';
import { selectHabitatArena } from 'cf-proof/battle2/habitat-arena.ts';
import { createPartsRig } from 'cf-proof/battle2/parts-rig.ts';
import { BattleStage, GUARDIAN_FRAME_FILL, turnPlanInputFromTranscriptEvent } from 'cf-proof/battle2/stage.ts';
import { individualFromGenomeV1 } from 'cf-proof/morph/morph-individual.ts';
import { loadCreatureRigV1 } from 'cf-proof/creature-rig.ts';
import { parseEffectSequenceAnchors } from 'cf-proof/effects/anchors.ts';
import { PARTICLE_DISC_SIZE, particleDiscRgba } from 'cf-proof/effects/particle-texture.ts';
import { createPixiEffectHost } from 'cf-proof/effects/pixi-adapter.ts';
import { EffectThemeLibrary, isProceduralImage } from 'cf-proof/effects/theme-library.ts';
import { compileBodyCard } from 'cf-proof/motion/body-card.ts';
import { primeRecorder } from '../quadruped-proof/capture-contract.mjs';

const FRAME = { width: 1024, height: 576 };
const get = (n) => fetch(n).then((r) => { if (!r.ok) throw Error(n); return r; });
const json = (n) => get(n).then((r) => r.json());
const bytes = async (n) => new Uint8Array(await (await get(n)).arrayBuffer());
const image = async (n) => { const b = await bytes(n), bmp = await createImageBitmap(new Blob([b])), c = new OffscreenCanvas(bmp.width, bmp.height); c.getContext('2d').drawImage(bmp, 0, 0); return { bytes: b, canvas: c, width: bmp.width, height: bmp.height, rgba: c.getContext('2d').getImageData(0, 0, c.width, c.height).data }; };
const alphaBox = (rgba, w, h) => { let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 < 0) throw Error('empty alpha'); return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }; };
const state = { status: 'LOADING' }; window.cfBattle2Proof = { state };
try {
  const app = new Application(); await app.init({ width: FRAME.width, height: FRAME.height, resolution: 1, background: 0x141d22, antialias: true, autoStart: false, preference: 'webgl' }); document.body.append(app.canvas);
  const script = await json('script.json');
  const loadSide = async (side) => {
    const record = await json(side + '-record.json'), binding = await json(side + '-binding.json'), keyed = await image(side + '-keyed.png'), master = await bytes(side + '-master.png'), atlas = await bytes(side + '-atlas.png');
    const alpha = new Uint8Array(keyed.width * keyed.height); for (let i = 0; i < alpha.length; i++) alpha[i] = keyed.rgba[i * 4 + 3];
    const card = compileBodyCard(record, record.genome);
    // morph system: script.morph[side] is a genome (color/accent/head/tail/seed) → this individual on the archetype
    const morph = individualFromGenomeV1({ record, binding, card, genome: script.morph?.[side] ?? null });
    const paintRig = await loadCreatureRigV1(record, binding, master, alpha, atlas, undefined, { ...(morph.jointScale ? { jointScale: morph.jointScale } : {}), ...(morph.atlasPixels ? { atlasPixels: morph.atlasPixels } : {}) });
    return { record, card, morph: morph.params, rig: createPartsRig({ record, rig: paintRig, card, alphaBox: alphaBox(keyed.rgba, keyed.width, keyed.height), binding, ...(morph.jointScale ? { jointScale: morph.jointScale } : {}), ...(script.supports === 'observed' ? { contactSupports: 'observed' } : {}) }), name: record.identity.earthName ?? record.kind };
  };
  const [left, right] = await Promise.all([loadSide('left'), loadSide('right')]);
  const [recipe, anchorsRaw, far, mid, near] = await Promise.all([json('arena-recipe.json'), json('wild-anchors.json'), image('arena-far.png'), image('arena-mid.png'), image('arena-near.png')]);
  const parsed = parseEffectSequenceAnchors(anchorsRaw); if (!parsed.ok) throw Error(parsed.reason); const anchors = parsed.anchors, themes = new EffectThemeLibrary([anchors]);
  const texture = (img) => Texture.from(img.canvas);
  // D2 G6: a guardian record moves the stands (GUARDIAN_STANDS) and fills the frame by its tallest pose, as the stage does
  const guardianSide = left.rig.guardian ? 'left' : right.rig.guardian ? 'right' : undefined;
  const layout = composeArena({ id: recipe.battleContext?.worldKey ?? 'arena', groundLineNormalized: recipe.groundLineNormalized, plates: { far, mid, near } }, FRAME, guardianSide ? { guardianSide } : {});
  const masses = { left: left.card.massClass.multiplier, right: right.card.massClass.multiplier };
  const painted = (s, mass) => { const k = combatantScale(s.rig.bounds, s.rig.cutout.height, mass, FRAME.height, s.rig.guardian ? { frameFill: GUARDIAN_FRAME_FILL, tallestHeight: s.rig.tallestHeight } : {}); return { height: k.heightFraction, footBelowCentre: (s.rig.foot.y - 0.5) * s.rig.cutout.height * k.scale / FRAME.height }; };
  const habitat = selectHabitatArena({ contextId: 'battle2-proof', seed: recipe.seed, round: 0, kind: 'wild', worlds: null, groundLineY: layout.groundLineY,
    left: { record: left.record, genome: null, label: left.name, painted: painted(left, masses.left) }, right: { record: right.record, genome: null, label: right.name, painted: painted(right, masses.right) } });
  if (habitat.status !== 'READY') throw Error('habitat: ' + habitat.reason);
  const stagedLayout = { ...layout, stands: { left: { x: layout.stands.left.x, y: habitat.stands.left.y }, right: { x: layout.stands.right.x, y: habitat.stands.right.y } } };
  const phaseTextures = new Map(); for (const p of anchors.phases) if (!isProceduralImage(p.keyedImage)) phaseTextures.set(p.keyedImage, texture(await image(p.keyedImage.split('/').pop())));
  const dot = particleDiscRgba(PARTICLE_DISC_SIZE), dotCanvas = new OffscreenCanvas(PARTICLE_DISC_SIZE, PARTICLE_DISC_SIZE), dotImage = dotCanvas.getContext('2d').createImageData(PARTICLE_DISC_SIZE, PARTICLE_DISC_SIZE); dotImage.data.set(dot); dotCanvas.getContext('2d').putImageData(dotImage, 0, 0);
  const style = { fontFamily: 'system-ui', fontSize: 34, fontWeight: '700', fill: '#fff2c8', stroke: { color: '#2a1a0a', width: 4 } };
  let clockMs = 0;
  const stage = new BattleStage({ factory: { container: () => new Container(), sprite: (t) => new Sprite(t), text: (t) => new Text({ text: t, style, anchor: 0.5 }), graphics: () => new Graphics() }, clock: () => clockMs, layout: stagedLayout,
    plates: { far: texture(far), mid: texture(mid), near: texture(near) }, rigs: { left: left.rig, right: right.rig }, masses, worldLife: null, cues: null,
    effects: { host: createPixiEffectHost({ Sprite, Particle, ParticleContainer }), particleTexture: Texture.from(dotCanvas), seed: recipe.seed,
      phaseTextures: (a) => a.phases.map((p) => (isProceduralImage(p.keyedImage) ? null : phaseTextures.get(p.keyedImage) ?? (() => { throw Error('phase image ' + p.keyedImage); })())),
      emittersForTheme: (t) => themes.emittersFor(t, 'desktop'), tintForTheme: (t) => themes.tintFor(t) } });
  app.stage.addChild(stage.root);
  const attackLabels = { left: null, right: null }, mediums = { A: habitat.stands.left.medium, B: habitat.stands.right.medium };
  const attackFor = (side, ordinal) => { const s = side === 'A' ? left : right, key = side === 'A' ? 'left' : 'right'; try { const r = compileAnatomyAttack(s.card, mediums[side], ordinal); attackLabels[key] = `${r.attack.verb} (${r.attack.contactJoint})`; return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; } catch (e) { attackLabels[key] ??= 'family delivery clip (' + (e?.message ?? e) + ')'; return null; } };
  const ctx = { A: { side: 'A', name: left.name, mass: masses.left, card: left.card, theme: script.themes?.A ?? 'wild', seed: 1 }, B: { side: 'B', name: right.name, mass: masses.right, card: right.card, theme: script.themes?.B ?? 'stone', seed: 2 },
    arena: { groundLineY: layout.groundLineY, stands: stagedLayout.stands, halfWidths: stage.halfWidths() }, seed: recipe.seed, anchorsForTheme: (t) => themes.anchorsFor(t), readyMs: script.readyMs ?? 600, commandMs: script.commandMs ?? 300, attackFor };
  const ordinals = { A: 0, B: 0 }, turns = [], skipped = [];
  for (const row of script.rows) { const side = row.side === 'B' || (row.dodge === true && row.an === right.name) ? 'B' : 'A'; const t = turnPlanInputFromTranscriptEvent(row, ctx, ordinals[side]); if (t.kind === 'turn') { turns.push(t.input); ordinals[side]++; } else skipped.push(t.reason); }
  if (!turns.length) throw Error('script has no stageable turn');
  // Turn offsets on one global clock: each turn starts where the previous plan ended.
  const plans = [], offsets = []; let at = 0; for (const input of turns) { clockMs = at; const plan = stage.play(input); plans.push(plan); offsets.push(at); at += plan.beats.end; }
  const totalMs = at; let current = -1;
  const stageAt = (g) => { let i = 0; while (i + 1 < plans.length && g >= offsets[i + 1]) i++; if (current !== i) { clockMs = offsets[i]; stage.play(turns[i]); current = i; } clockMs = Math.min(g, offsets[i] + plans[i].beats.end - 1e-6); const frame = stage.tick(); app.renderer.render(app.stage); return frame; };
  const holderX = (side) => { const rig = side === 'left' ? left.rig : right.rig; return stage.root.children.find((n) => n.children?.includes(rig.root)); };
  const contactWorld = (side, joint) => { const s = side === 'left' ? left : right, h = holderX(side), j = s.rig.jointPosition(joint); if (!h || !j) return null; return { x: h.x + h.scale.x * (j.x - s.rig.foot.x * s.rig.cutout.width), y: h.y + h.scale.y * (j.y - s.rig.foot.y * s.rig.cutout.height) }; };
  const gates = () => {
    stageAt(0);
    const rows = plans.map((plan, i) => { const b = plan.beats, o = offsets[i], side = plan.attacker.side; const row = { turn: i, outcome: plan.outcome, attacker: side, attack: plan.attack ? { verb: plan.attack.verb, contactMs: plan.attack.contactMs, contactJoint: plan.attack.contactJoint } : null, beats: { ...b }, offsetMs: o, runUp: plan.runUp, effectImpactAt: plan.effect ? plan.effect.schedule.impactAt : null };
      if (plan.attack) { stageAt(o + b.impactAt); const c = contactWorld(side, plan.attack.contactJoint), targetStand = stagedLayout.stands[plan.target.side]; row.contactAtImpact = c ? { x: c.x / FRAME.width, y: c.y / FRAME.height, targetStandX: targetStand.x, gapToTargetStand: Math.abs(targetStand.x - c.x / FRAME.width) } : null; }
      return row; });
    stageAt(0);
    return { status: 'DIAGNOSTIC', frame: FRAME, rigs: { left: left.rig.label, right: right.rig.label }, names: { left: left.name, right: right.name }, habitat: habitat.label, stands: stagedLayout.stands, attacks: { ...attackLabels }, turns: rows, skipped, totalMs, refusals: { left: left.rig.refusals(), right: right.rig.refusals() }, lastRefusal: { left: left.rig.lastRefusal(), right: right.rig.lastRefusal() } };
  };
  const still = (g) => { stageAt(g); return app.canvas.toDataURL('image/png').split(',')[1]; };
  async function capture() {
    const stream = app.canvas.captureStream(0), track = stream.getVideoTracks()[0], chunks = [], recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 5000000 }), stopped = new Promise((r) => (recorder.onstop = r));
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    let started = false, recordError = null; recorder.onstart = () => { started = true; }; recorder.onerror = (e) => { recordError = e.error ?? Error('Recorder failed'); };
    stageAt(0); recorder.start();
    await primeRecorder({ started: () => started, paint: () => stageAt(0), requestFrame: () => track.requestFrame(), schedule: requestAnimationFrame, now: () => performance.now() });
    const frames = [], refusalLog = []; let start;
    await new Promise((resolve) => { const step = (t) => { start ??= t; const elapsed = t - start; const cpu = performance.now(); const before = { left: left.rig.refusals(), right: right.rig.refusals() }; const frame = stageAt(Math.min(elapsed, totalMs)); for (const side of ['left', 'right']) { const s = side === 'left' ? left : right; if (s.rig.refusals() !== before[side]) refusalLog.push({ side, turn: current, ms: elapsed, phase: frame?.sample.phase ?? null, context: frame ? (plans[current].attacker.side === side ? frame.sample.attacker.context : frame.sample.target.context) : null, error: s.rig.lastRefusal() }); } frames.push({ ms: elapsed, cpuMs: performance.now() - cpu, refusals: left.rig.refusals() + right.rig.refusals() }); track.requestFrame(); if (elapsed >= 10000) resolve(); else requestAnimationFrame(step); }; requestAnimationFrame(step); });
    recorder.stop(); await stopped; if (recordError) throw recordError;
    const blob = new Blob(chunks, { type: 'video/webm' }), buffer = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buffer.length; i += 8192) s += String.fromCharCode(...buffer.subarray(i, i + 8192));
    const cpu = frames.map((f) => f.cpuMs).sort((a, b) => a - b), deltas = frames.slice(1).map((f, i) => f.ms - frames[i].ms).sort((a, b) => a - b);
    return { video: btoa(s), frames: frames.length, durationMs: frames.at(-1)?.ms ?? 0, cpuP95Ms: cpu[Math.floor(cpu.length * 0.95)] ?? null, frameDeltaP95Ms: deltas[Math.floor(deltas.length * 0.95)] ?? null, refusalsAtEnd: { left: left.rig.refusals(), right: right.rig.refusals() }, lastRefusal: { left: left.rig.lastRefusal(), right: right.rig.lastRefusal() }, refusalLog: refusalLog.slice(0, 40) };
  }
  window.cfBattle2Proof = { state, gates, still, capture }; state.status = 'READY'; stageAt(0);
} catch (e) { state.status = 'FAIL'; state.error = String(e?.stack ?? e); }
