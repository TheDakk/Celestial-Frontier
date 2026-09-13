#!/usr/bin/env node
/** A5 world-life evidence: compiles the Earth temperate rain card (arena-recipe seed) and writes an
 * SVG sheet of 8 sampled frames plus a JSON receipt with a replay digest. Deterministic: no clock.
 * Usage (from port/v2): node tools/worldlife-proof/life-sheet.mjs [--surface=landfall|arena] */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '..', '..');
const ROOT = path.resolve(V2, '..', '..');
const WORLDLIFE = path.join(V2, 'apps', 'game', 'src', 'worldlife');
// Node strips types natively but does not rewrite the workspace's `.js` specifiers; map them inside worldlife only.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('./') && specifier.endsWith('.js') && context.parentURL?.startsWith(pathToFileURL(WORLDLIFE).href)) {
      return next(specifier.slice(0, -3) + '.ts', context);
    }
    return next(specifier, context);
  },
});
const { compileWorldLife, sampleWorldLife } = await import(pathToFileURL(path.join(WORLDLIFE, 'index.ts')).href);

const surface = (process.argv.find((a) => a.startsWith('--surface=')) ?? '--surface=landfall').slice(10);
const cardPath = path.join(ROOT, 'audits', 'ARENA_EFFECTS_V42_PROOF_20260912', 'system-card.txt');
const recipe = JSON.parse(readFileSync(path.join(ROOT, 'audits', 'ARENA_EFFECTS_V42_PROOF_20260912', 'arena-recipe.json'), 'utf8'));
const card = readFileSync(cardPath, 'utf8');
const spec = compileWorldLife(card, recipe.seed, surface);
const W = 1024, H = 576, FRAMES = 8, STEP_MS = 400, COLS = 2, SCALE = 0.5;
const ground = spec.frame.groundLine;
const sha = (s) => createHash('sha256').update(s).digest('hex');

const fern = (x, y, angle, size, band) => {
  const fronds = [];
  for (let i = 1; i <= 4; i++) {
    const t = i / 4, yy = -size * t, len = size * 0.42 * (1 - t * 0.6);
    fronds.push(`<line x1="0" y1="${yy.toFixed(1)}" x2="${(-len).toFixed(1)}" y2="${(yy - len * 0.3).toFixed(1)}"/><line x1="0" y1="${yy.toFixed(1)}" x2="${len.toFixed(1)}" y2="${(yy - len * 0.3).toFixed(1)}"/>`);
  }
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(angle * 180 / Math.PI).toFixed(3)})" stroke="${['#3f7a3a', '#5a8f4e', '#7ea377'][band]}" stroke-width="${3 - band}" fill="none" data-band="${band}"><line x1="0" y1="0" x2="0" y2="${(-size).toFixed(1)}"/>${fronds.join('')}</g>`;
};

const frames = [], digests = [];
for (let f = 0; f < FRAMES; f++) {
  const ms = f * STEP_MS, s = sampleWorldLife(spec, ms);
  digests.push(sha(JSON.stringify(s)));
  const parts = [`<rect width="${W}" height="${H}" fill="#8f9ba3"/>`, `<rect y="${(ground * H).toFixed(0)}" width="${W}" height="${((1 - ground) * H).toFixed(0)}" fill="#4d5f46"/>`];
  s.driftOffsets.forEach(([x, y, r, a]) => parts.push(`<circle cx="${(x * W).toFixed(1)}" cy="${(y * H).toFixed(1)}" r="${(r * H).toFixed(1)}" fill="#${spec.drift.color.toString(16).padStart(6, '0')}" fill-opacity="${a.toFixed(3)}"/>`));
  if (spec.shimmer) s.shimmerBandPhases.forEach((ph, i) => {
    const y = ground * H + (i + 1) * 0.03 * H, amp = spec.shimmer.amplitude * 0.02 * H, pts = [];
    for (let x = 0; x <= W; x += W / 32) pts.push(`${x.toFixed(0)},${(y + amp * Math.sin((x / W) * Math.PI * 2 * (3 + i) + ph * Math.PI * 2)).toFixed(2)}`);
    parts.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#d8ecf6" stroke-opacity="0.6"/>`);
  });
  const p = spec.precipitation;
  if (p) {
    const d = [];
    for (let i = 0; i < s.streaks.length; i += 5) d.push(`M${(s.streaks[i] * W).toFixed(1)} ${(s.streaks[i + 1] * H).toFixed(1)}L${(s.streaks[i + 2] * W).toFixed(1)} ${(s.streaks[i + 3] * H).toFixed(1)}`);
    parts.push(`<path d="${d.join('')}" stroke="#${p.color.toString(16).padStart(6, '0')}" stroke-opacity="${Math.min(1, p.opacity * 4).toFixed(3)}" stroke-width="${p.kind === 'rain' ? 1.2 : 2.4}" fill="none"/>`);
  }
  s.swayAngles.forEach((angle, band) => { for (let k = 0; k < 3; k++) parts.push(fern(W * (0.12 + 0.3 * k + 0.08 * band), ground * H - band * 14, angle, 70 - band * 18, band)); });
  s.fliers.forEach(([x, y]) => parts.push(`<circle cx="${(x * W).toFixed(1)}" cy="${(y * H).toFixed(1)}" r="${spec.fliers.kind === 'bird' ? 3 : 4}" fill="#2c3138"/>`));
  s.flicker.forEach(([x, y, k]) => parts.push(`<circle cx="${(x * W).toFixed(1)}" cy="${(y * H).toFixed(1)}" r="${(6 + 10 * k).toFixed(1)}" fill="#bfe6ff" fill-opacity="${(0.35 * k).toFixed(3)}"/>`));
  parts.push(`<line x1="0" y1="${(ground * H).toFixed(0)}" x2="${W}" y2="${(ground * H).toFixed(0)}" stroke="#ffe08a" stroke-dasharray="6 6"/>`);
  parts.push(`<text x="12" y="28" font-family="monospace" font-size="22" fill="#fff">t=${ms}ms  streaks=${p ? p.count : 0}  drift=${s.driftOffsets.length}  sway=[${s.swayAngles.map((a) => (a * 180 / Math.PI).toFixed(2)).join(', ')}]°  fliers=${s.fliers.length}</text>`);
  const col = f % COLS, row = Math.floor(f / COLS);
  frames.push(`<g transform="translate(${col * (W * SCALE + 16)} ${row * (H * SCALE + 16) + 40}) scale(${SCALE})">${parts.join('')}</g>`);
}
const sheetW = COLS * (W * SCALE + 16), sheetH = Math.ceil(FRAMES / COLS) * (H * SCALE + 16) + 40;
const title = `A5 world life — Earth temperate rain, ${surface}, seed ${recipe.seed}, strength ${spec.card.strength}, ${spec.card.timeOfDay}; ground .78; frames every ${STEP_MS}ms`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}"><rect width="${sheetW}" height="${sheetH}" fill="#1c1f24"/><text x="8" y="26" font-family="monospace" font-size="16" fill="#e8e8e8">${title}</text>${frames.join('')}</svg>`;

const outDir = path.join(ROOT, 'audits', 'LONG_SESSION_20260913', 'a5-life-sheet');
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, `life-sheet-${surface}.svg`), svg);
const receipt = {
  schema: 'cf.worldlife.life-sheet/v1', surface, seed: recipe.seed, cardSource: path.relative(ROOT, cardPath), cardSha256: sha(card),
  frameMs: Array.from({ length: FRAMES }, (_, i) => i * STEP_MS), frameDigests: digests, replayDigest: sha(digests.join('\n')),
  spec: { ...spec, precipitation: spec.precipitation ? { ...spec.precipitation, field: `[${spec.precipitation.field.length} numbers]` } : null },
};
writeFileSync(path.join(outDir, `life-sheet-${surface}.json`), JSON.stringify(receipt, null, 2) + '\n');
console.log(`wrote ${path.relative(ROOT, outDir)}/life-sheet-${surface}.{svg,json}  replayDigest=${receipt.replayDigest.slice(0, 16)}  streaks=${spec.precipitation?.count ?? 0}${spec.precipitation?.overBudget ? ' (capped)' : ''} drift=${spec.drift.count} fliers=${spec.fliers?.count ?? 0}`);
