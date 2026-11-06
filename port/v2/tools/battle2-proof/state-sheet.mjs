#!/usr/bin/env node
/* Fallback evidence (no browser): 12 sampled stage states of the Civet-vs-Platypus turn as an SVG sheet —
 * civet skeleton (FK over the fixture hierarchy) and platypus portrait box on their stands, run-up, effect
 * track bounds, shake/flash/number values, parallax offsets. Deterministic: byte-identical on re-run.
 * Usage: node tools/battle2-proof/state-sheet.mjs <outDir> */
import '../motion-proof/ts-loader.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const { buildTurnPlan, sampleTurn, composeArena, parallaxOffset, solvePose, turnPlanInputFromTranscriptEvent } = await import('../../apps/game/src/battle2/index.ts');
const { compileBodyCard } = await import('../../apps/game/src/motion/body-card.ts');
const { parseEffectSequenceAnchors } = await import('../../apps/game/src/effects/anchors.ts');
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../..'), outDir = process.argv[2];
if (!outDir) { console.error('usage: state-sheet.mjs <outDir>'); process.exit(2); }
const read = (rel) => JSON.parse(readFileSync(path.join(repo, rel), 'utf8'));
const record = read('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'), recipe = read('audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json');
const anchors = parseEffectSequenceAnchors(read('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json')); if (!anchors.ok) throw new Error(anchors.reason);
const FRAME = { width: 1024, height: 576 }, PLATE = { width: 1672, height: 941 };
const layout = composeArena({ id: recipe.battleContext.worldKey, groundLineNormalized: recipe.groundLineNormalized, plates: { far: PLATE, mid: PLATE, near: PLATE } }, FRAME);
const card = compileBodyCard(record);
// Civet: rig height 1/3..1/2 of frame by mass; skeleton drawn in cut-out space scaled to the stage (same rule as the stage). Widths here are sheet estimates (the stage measures the keyed alpha).
const alphaH = 0.55, civetScale = (FRAME.height * (1 / 3 + (1 / 6) * Math.min(1, Math.max(0, (card.massClass.multiplier - 0.7) / 0.9)))) / (alphaH * 1254), foot = { x: record.landmarks.root[0], y: record.geometry.groundLineY };
const ctx = { A: { side: 'A', name: 'Civet', mass: card.massClass.multiplier, card, theme: 'wild', seed: record.identity.seed >>> 0 }, B: { side: 'B', name: 'Platypus', mass: 0.85, card: null, theme: 'wild', seed: 424242 },
  arena: { groundLineY: layout.groundLineY, stands: layout.stands, halfWidths: { left: 0.86 * 1254 * civetScale / (2 * FRAME.width), right: 0.6 * (FRAME.height * (1 / 3 + (1 / 6) * (0.15 / 0.9))) * 1.2 / FRAME.width } }, seed: recipe.seed, anchorsForTheme: () => anchors.anchors, readyMs: 900, commandMs: 400 };
const adapted = turnPlanInputFromTranscriptEvent({ side: 'A', an: 'Civet', dn: 'Platypus', dmg: 12, crit: false, hpA: 30, hpB: 18 }, ctx); if (adapted.kind !== 'turn') throw new Error(adapted.reason);
const plan = buildTurnPlan(adapted.input), b = plan.beats;
const TIMES = [['ready', 450], ['command', b.readyEnd + 100], ['approach', b.commandEnd + 180], ['anticipation', b.actionStart + 60], ['launch', b.impactAt - 30], ['strike', b.impactAt], ['hitstop', b.impactAt + plan.hitstopMs / 2],
  ['flash fade', b.hitstopEnd + 40], ['number rise', b.impactAt + 250], ['recovery', b.actionEnd - 100], ['return', b.actionEnd + 150], ['idle', b.end - 100]];
const S = 0.5, CW = FRAME.width * S, CH = FRAME.height * S, PAD = 12, COLS = 3, HEAD = 78;
const fmt = (n) => (Math.round(n * 100) / 100).toString(), esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const COLOR = { body: '#1d3557', head: '#457b9d', legs: '#2a9d8f', tail: '#e76f51', ears: '#f4a261' };
function cell(label, ms, x0, y0) {
  const s = sampleTurn(plan, ms), w = FRAME.width, h = FRAME.height, off = parallaxOffset(s.runUpX * w), out = [];
  const tx = (px) => x0 + (px + s.camera.shake.x) * S, ty = (py) => y0 + (py + s.camera.shake.y) * S;
  out.push(`<rect x="${x0}" y="${y0}" width="${CW}" height="${CH}" fill="#1b2a33" stroke="#405a68"/>`);
  for (const p of layout.plates) out.push(`<rect x="${tx(p.x + off[p.id])}" y="${ty(p.y)}" width="${p.width * S}" height="${p.height * S}" fill="none" stroke="${p.id === 'far' ? '#3a5566' : p.id === 'mid' ? '#5b8a6e' : '#8a6e4b'}" stroke-dasharray="4 3"/>`);
  out.push(`<line x1="${x0}" y1="${ty(layout.groundLinePx)}" x2="${x0 + CW}" y2="${ty(layout.groundLinePx)}" stroke="#c9b27a" stroke-width="1"/>`);
  // Civet skeleton at its stand + run-up, facing right.
  const ax = (layout.stands.left.x + s.attacker.displacementX) * w, ay = layout.groundLinePx, solved = solvePose(record, card.bodyLength, s.attacker.pose);
  const P = (j) => [ax + (solved.position[j][0] - foot.x) * 1254 * civetScale, ay + (solved.position[j][1] - foot.y) * 1254 * civetScale];
  for (const part of card.parts) { const a = P(part.parent), c = P(part.joint); out.push(`<line x1="${fmt(tx(a[0]))}" y1="${fmt(ty(a[1]))}" x2="${fmt(tx(c[0]))}" y2="${fmt(ty(c[1]))}" stroke="${COLOR[part.group]}" stroke-width="${part.group === 'body' ? 3 : 1.6}" stroke-linecap="round"/>`); }
  // Platypus portrait box (whole-portrait fallback): root offsets only, facing left.
  const pb = 0.85, ph = FRAME.height * (1 / 3 + (1 / 6) * ((pb - 0.7) / 0.9)), pw = ph * 1.2, pr = s.target.pose.root ?? { rotation: 0, dx: 0, dy: 0 }, bl = pw * 0.6;
  const px = layout.stands.right.x * w - (pr.dx ?? 0) * bl, py = layout.groundLinePx + (pr.dy ?? 0) * bl;
  out.push(`<g transform="translate(${fmt(tx(px))} ${fmt(ty(py))}) rotate(${fmt(-(pr.rotation) * 180 / Math.PI)})"><rect x="${-pw * S / 2}" y="${-ph * S}" width="${pw * S}" height="${ph * S}" fill="#4b3a2a" fill-opacity="0.55" stroke="#c9a37a"/><text x="0" y="${-ph * S / 2}" fill="#eee" font-size="9" text-anchor="middle">portrait</text></g>`);
  if (s.effect) for (const t of s.effect.tracks) { if (!t.visible) continue; const ph2 = anchors.anchors.phases[t.index], bw = t.transform.scale * w, bh = bw * (ph2.canvasSize.height / ph2.canvasSize.width), ex = t.transform.x * w - t.transform.scale * w * ph2.originAnchor[0] * 0 - (t.transform.flipX ? 1 - t.transform.scale : 0);
    const originX = t.transform.x * w, originY = t.transform.y * h, anchor = t.index === anchors.anchors.phases.length - 1 ? ph2.contactAnchor : ph2.originAnchor;
    out.push(`<rect x="${fmt(tx(originX - anchor.x * bw))}" y="${fmt(ty(originY - anchor.y * bh))}" width="${fmt(bw * S)}" height="${fmt(bh * S)}" fill="#ffb347" fill-opacity="${fmt(0.15 * t.transform.alpha)}" stroke="#ffb347" stroke-opacity="${fmt(t.transform.alpha)}"/><text x="${fmt(tx(originX))}" y="${fmt(ty(originY) - 3)}" fill="#ffb347" font-size="8">${t.phase} α${fmt(t.transform.alpha)}</text>`); void ex; }
  if (s.camera.flash > 0) out.push(`<rect x="${x0}" y="${y0}" width="${CW}" height="${CH}" fill="#fff" fill-opacity="${fmt(s.camera.flash * 0.85)}"/>`);
  for (const n of s.numbers) out.push(`<text x="${fmt(tx(n.x * w))}" y="${fmt(ty(n.y * h))}" fill="#fff2c8" fill-opacity="${fmt(n.alpha)}" font-size="${fmt(17 * n.scale)}" font-weight="700" text-anchor="middle">${esc(n.text)}</text>`);
  out.push(`<rect x="${x0 + 8}" y="${y0 + 6}" width="${fmt((CW - 16) * s.timingBar)}" height="4" fill="${s.timingBar >= 1 ? '#f2e3b6' : '#8fb7c9'}"/>`);
  if (s.cursor.visible && s.cursor.on) out.push(`<polygon points="${fmt(tx(layout.stands.right.x * w) - 5)},${fmt(ty(layout.groundLinePx - h * 0.5))} ${fmt(tx(layout.stands.right.x * w) + 5)},${fmt(ty(layout.groundLinePx - h * 0.5))} ${fmt(tx(layout.stands.right.x * w))},${fmt(ty(layout.groundLinePx - h * 0.5) + 7)}" fill="#ffd166"/>`);
  out.push(`<text x="${x0 + 6}" y="${y0 + CH + 14}" fill="#e6dfcd" font-size="10">${esc(label)} · ${fmt(ms)} ms · ${s.phase} · flash ${fmt(s.camera.flash)} · shake ${fmt(Math.hypot(s.camera.shake.x, s.camera.shake.y))} px · run-up ${fmt(s.runUpX * w)} px · parallax far/mid/near ${fmt(off.far)}/${fmt(off.mid)}/${fmt(off.near)}</text>`);
  return out.join('\n');
}
const rows = Math.ceil(TIMES.length / COLS), width = PAD + COLS * (CW + PAD), height = HEAD + rows * (CH + 30);
const header = [`fixture rig (landmark-derived parts) · Civet melee:wild → Platypus (whole-portrait fallback) · arena ${recipe.battleContext.worldKey} ground ${recipe.groundLineNormalized}`,
  `beats ms: ready ${fmt(b.readyEnd)} · command ${fmt(b.commandEnd)} · action ${fmt(b.actionStart)} · impact ${fmt(b.impactAt)} (= effect impactAt ${fmt(plan.effect.schedule.impactAt)} after action start) · hitstop ${fmt(plan.hitstopMs)} → ${fmt(b.hitstopEnd)} · flash ${fmt(b.flashEnd)} · shake ${fmt(b.shakeEnd)} · numbers ${fmt(b.numbersEnd)} · action end ${fmt(b.actionEnd)} · return ${fmt(b.returnEnd)} · end ${fmt(b.end)}`,
  `mass: attacker ${card.massClass.name} ${card.massClass.multiplier} (from the body card) · target portrait 0.85 · stands x = 1/3, 2/3 · run-up ${fmt(plan.runUp * FRAME.width)} px · parallax .10/.50/1.20 · SVG fallback evidence (browser capture is the runner's job)`];
const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="system-ui, sans-serif"><rect width="100%" height="100%" fill="#111820"/>`,
  ...header.map((t, i) => `<text x="${PAD}" y="${20 + i * 18}" fill="#e6dfcd" font-size="${i ? 10 : 13}">${esc(t)}</text>`),
  ...TIMES.map(([label, ms], i) => cell(label, ms, PAD + (i % COLS) * (CW + PAD), HEAD + Math.floor(i / COLS) * (CH + 30))), '</svg>'].join('\n');
mkdirSync(outDir, { recursive: true });
const samples = TIMES.map(([label, ms]) => { const s = sampleTurn(plan, ms); return { label, ms, phase: s.phase, timingBar: s.timingBar, runUpPx: s.runUpX * FRAME.width, parallax: parallaxOffset(s.runUpX * FRAME.width), camera: s.camera, numbers: s.numbers, effectPhase: s.effect?.phase ?? null, attackerRoot: s.attacker.pose.root, targetRoot: s.target.pose.root }; });
writeFileSync(path.join(outDir, 'battle2-state-sheet.svg'), svg);
writeFileSync(path.join(outDir, 'battle2-state-sheet.json'), JSON.stringify({ label: 'fixture rig (landmark-derived parts) versus whole-portrait fallback', beats: b, hitstopMs: plan.hitstopMs, effect: { impactAt: plan.effect.schedule.impactAt, hitstopMs: plan.effect.schedule.hitstopMs, startMs: plan.effect.startMs }, samples }, null, 2) + '\n');
console.log(JSON.stringify({ svg: 'battle2-state-sheet.svg', sha256: createHash('sha256').update(svg).digest('hex'), impactAt: b.impactAt, hitstopMs: plan.hitstopMs, end: b.end }));
