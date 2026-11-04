#!/usr/bin/env node
// A2 visual evidence: sample the Wild sequence schedule at 12 frames and draw an SVG sheet.
// Deterministic: the emitter runs at the adapter's fixed 60 Hz step from the recipe seed; no clock is read.
// Usage: node tools/effects-proof/sequence-sheet.mjs [--seed=N] [--out=DIR]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as nodeModule from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolveTs } from './resolve-ts-hook.mjs';

if (typeof nodeModule.registerHooks === 'function') nodeModule.registerHooks({ resolve: resolveTs });
else nodeModule.register('./resolve-ts-hook.mjs', import.meta.url);

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..', '..');
const anchorsPath = path.join(repoRoot, 'audits', 'ARENA_EFFECTS_V42_PROOF_20260912', 'wild-anchors.json');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const seed = Number.parseInt(args.seed ?? '5259749', 10); // 0x50A1E5, the player seed anchor
const outDir = path.resolve(args.out ?? path.join(repoRoot, 'audits', 'LONG_SESSION_20260913', 'a2-sequence-sheet'));
const effectsUrl = pathToFileURL(path.join(here, '..', '..', 'apps', 'game', 'src', 'effects', 'index.ts')).href;
const fx = await import(effectsUrl);

const parsed = fx.parseEffectSequenceAnchors(JSON.parse(readFileSync(anchorsPath, 'utf8')));
if (!parsed.ok) throw new Error(`anchors refused: ${parsed.reason}`);
const anchors = parsed.anchors;
const stands = { attacker: { x: 0.3, y: fx.ARENA_GROUND_LINE_Y }, target: { x: 0.7, y: fx.ARENA_GROUND_LINE_Y } };
const placement = fx.placeEffectSequence(anchors, stands);
const schedule = fx.buildEffectSchedule(anchors, { delivery: 'melee', attackerMassClass: 1 }, placement);

const ARENA = { width: 640, height: 360 };
const FRAMES = 12;
const frameTimes = Array.from({ length: FRAMES }, (_, i) => Math.round((schedule.durationMs * i) / (FRAMES - 1) * 1000) / 1000);

// Drive the emitters exactly as the adapter does: fixed steps, spawning from the sampled transform.
const emitters = new Map(['launch', 'travel', 'impact'].map((phase, i) => [phase, fx.createEmitterState(fx.EMITTER_PRESETS[phase], (seed + i * 7919) | 0)]));
let simMs = 0;
const frames = [];
for (const ms of frameTimes) {
  while (simMs + fx.EFFECT_FIXED_STEP_MS <= ms) {
    const at = fx.sampleSchedule(schedule, simMs);
    const origin = { x: at.transform.x * ARENA.width, y: at.transform.y * ARENA.height };
    for (const [phase, state] of emitters) {
      if (at.emitterPhase !== phase && state.stepIndex === 0) continue;
      const c = state.config;
      const scaled = { ...c, speed: [c.speed[0] * ARENA.width, c.speed[1] * ARENA.width], gravity: c.gravity * ARENA.width };
      emitters.set(phase, { ...fx.stepEmitter({ ...state, config: scaled }, fx.EFFECT_FIXED_STEP_MS, origin), config: c });
    }
    simMs += fx.EFFECT_FIXED_STEP_MS;
  }
  const sample = fx.sampleSchedule(schedule, ms);
  const particles = [...emitters.entries()].flatMap(([phase, s]) => s.particles.map((p) => ({ phase, x: p.x, y: p.y, size: p.size, alpha: p.alpha })));
  frames.push({ ms, sample, particles });
}

const COLOUR = { launch: '#e0a030', travel: '#4fa3e0', impact: '#e04f4f' };
const esc = (n) => Number(n).toFixed(2);
const panelW = ARENA.width, panelH = ARENA.height, gap = 24, cols = 4, rows = FRAMES / cols;
const sheetW = cols * panelW + (cols + 1) * gap, sheetH = rows * (panelH + 44) + gap;
const keyedDir = path.relative(outDir, path.join(repoRoot, 'audits', 'ARENA_EFFECTS_V42_PROOF_20260912'));
let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}" font-family="Inter, system-ui, sans-serif">\n`;
svg += `<rect width="100%" height="100%" fill="#14161b"/>\n`;
frames.forEach((f, i) => {
  const px = gap + (i % cols) * (panelW + gap), py = gap + Math.floor(i / cols) * (panelH + 44);
  svg += `<g transform="translate(${px} ${py})">\n<rect width="${panelW}" height="${panelH}" fill="#2a2f38" stroke="#555" />\n`;
  const gy = fx.ARENA_GROUND_LINE_Y * panelH;
  svg += `<line x1="0" y1="${esc(gy)}" x2="${panelW}" y2="${esc(gy)}" stroke="#8a8" stroke-dasharray="6 4"/>\n`;
  for (const s of [stands.attacker, stands.target]) svg += `<line x1="${esc(s.x * panelW)}" y1="${esc(gy - 40)}" x2="${esc(s.x * panelW)}" y2="${esc(gy)}" stroke="#ccc" stroke-width="2"/>\n`;
  f.sample.tracks.forEach((t, k) => {
    if (!t.visible) return;
    const phase = anchors.phases[t.index];
    const w = t.transform.scale * panelW, h = w * phase.canvasSize.height / phase.canvasSize.width;
    const ax = t.transform.x * panelW, ay = t.transform.y * panelH;
    const sx = t.transform.flipX ? -1 : 1;
    const anchor = schedule.tracks[k].anchor;
    const left = ax - anchor.x * w * sx, top = ay - anchor.y * h;
    const b = phase.alphaBoundsPixels, cw = phase.canvasSize.width, ch = phase.canvasSize.height;
    const g = `<g transform="translate(${esc(left)} ${esc(top)}) scale(${sx} 1)" opacity="${esc(t.transform.alpha)}">`;
    svg += g + `<image xlink:href="${keyedDir}/${phase.keyedImage}" width="${esc(w)}" height="${esc(h)}" preserveAspectRatio="none"/>`;
    svg += `<rect x="${esc(b.x / cw * w)}" y="${esc(b.y / ch * h)}" width="${esc(b.width / cw * w)}" height="${esc(b.height / ch * h)}" fill="none" stroke="${COLOUR[t.phase]}" stroke-width="1.5"/>`;
    svg += `<circle cx="${esc(phase.originAnchor.x * w)}" cy="${esc(phase.originAnchor.y * h)}" r="4" fill="#fff" stroke="${COLOUR[t.phase]}"/>`;
    svg += `<rect x="${esc(phase.contactAnchor.x * w - 4)}" y="${esc(phase.contactAnchor.y * h - 4)}" width="8" height="8" fill="#fff" stroke="${COLOUR[t.phase]}"/></g>\n`;
  });
  for (const p of f.particles) svg += `<circle cx="${esc(p.x)}" cy="${esc(p.y)}" r="${esc(Math.max(0.8, p.size * 0.5))}" fill="${COLOUR[p.phase]}" opacity="${esc(p.alpha)}"/>\n`;
  svg += `<text x="8" y="${panelH + 18}" fill="#ddd" font-size="13">frame ${i + 1}/${FRAMES} · ${esc(f.ms)} ms · ${f.sample.phase} · emitter ${f.sample.emitterPhase} · particles ${f.particles.length}</text>\n</g>\n`;
});
svg += `<text x="${gap}" y="${sheetH - 8}" fill="#999" font-size="12">${anchors.sequenceId} · melee mass 1.00 · stand distance ${esc(placement.standDistance)} · scale ${esc(placement.scale)} · hitstop ${schedule.hitstopMs} ms at ${schedule.hitstopAt} ms · seed ${seed} · circle = origin anchor, square = contact anchor, rectangle = alpha bounds</text>\n</svg>\n`;

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'wild-sequence-sheet.svg'), svg);
writeFileSync(path.join(outDir, 'wild-sequence-frames.json'), JSON.stringify({ seed, arena: ARENA, placement, schedule, frames }, null, 2) + '\n');
console.log(`wrote ${path.join(outDir, 'wild-sequence-sheet.svg')} (${FRAMES} frames, ${frames.reduce((n, f) => n + f.particles.length, 0)} particle dots, duration ${schedule.durationMs} ms)`);
