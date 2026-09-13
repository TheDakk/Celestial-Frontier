#!/usr/bin/env node
/* Pose sheet: compiles a body card from a resolved-anatomy record, builds the
 * idle / melee:bite / hit timelines, samples every key pose and draws stick
 * figures (joints as circles, bones as lines, ground line) to an SVG.
 * Usage: node tools/motion-proof/pose-sheet.mjs <record.json> <outDir> [--genome=<genome.json>] [--name=<id>] [--actions=a,b,c]
 * Any registered template renders (A11): chains, fins, wings, antennae and fronds are drawn as bones
 * coloured by part group. Default actions: quadruped idle/melee:bite/hit; other fauna idle/approach/melee/hit;
 * plants sway/disturb. Deterministic: the same inputs write byte-identical SVG/JSON. */
import './ts-loader.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const { buildTimeline, compileBodyCard, sampleTimeline, checkBudget } = await import('../../apps/game/src/motion/index.ts');

const [recordPath, outDir, ...flags] = process.argv.slice(2);
if (!recordPath || !outDir) { console.error('usage: pose-sheet.mjs <record.json> <outDir> [--genome=<genome.json>] [--name=<id>]'); process.exit(2); }
const flag = (k) => flags.find((f) => f.startsWith('--' + k + '='))?.slice(k.length + 3);
const record = JSON.parse(readFileSync(recordPath, 'utf8'));
const genome = flag('genome') ? JSON.parse(readFileSync(flag('genome'), 'utf8')) : undefined;
const name = flag('name') ?? path.basename(recordPath).replace(/\..*$/, '');
const card = compileBodyCard(record, genome);
const budget = checkBudget(card);
const seed = card.identity.seed >>> 0;
const isPlant = card.template.id.startsWith('plant-');
const ACTIONS = flag('actions')?.split(',') ?? (card.template.id === 'quadruped' ? ['idle', 'melee:bite', 'hit'] : isPlant ? ['sway', 'disturb'] : ['idle', 'approach', 'melee', 'hit']);
const timelines = ACTIONS.map((id) => buildTimeline(card, id, seed));

/** Forward kinematics over the template graph; returns screen positions in normalized units. */
function solve(card, pose) {
  const lm = card.landmarks, L = card.bodyLength, pos = {}, ang = {};
  pos.root = [lm.root[0] + pose.root.dx * L, lm.root[1] + pose.root.dy * L]; ang.root = pose.joints.root ?? 0;
  for (const p of card.parts) {
    const a = (ang[p.parent] ?? 0) + (pose.joints[p.joint] ?? 0); ang[p.joint] = a;
    const vx = lm[p.joint][0] - lm[p.parent][0], vy = lm[p.joint][1] - lm[p.parent][1];
    pos[p.joint] = [pos[p.parent][0] + vx * Math.cos(a) - vy * Math.sin(a), pos[p.parent][1] + vx * Math.sin(a) + vy * Math.cos(a)];
  }
  return pos;
}
const S = 200, CELL_W = 230, CELL_H = 280, PAD = 16, HEAD = 110, COLOR = { body: '#1d3557', head: '#457b9d', legs: '#2a9d8f', tail: '#e76f51', ears: '#f4a261', wings: '#8e44ad', fins: '#0077b6', antennae: '#b5179e', fronds: '#2d6a4f', arms: '#c9184a' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = (n) => (Math.round(n * 1000) / 1000).toString();
function figure(card, pose, x0, y0, label, sub, sub2 = '') {
  const pos = solve(card, pose), gy = y0 + card.groundLineY * S, cx = x0 + pos.root[0] * S;
  const parts = card.parts.map((p) => `<line x1="${fmt(x0 + pos[p.parent][0] * S)}" y1="${fmt(y0 + pos[p.parent][1] * S)}" x2="${fmt(x0 + pos[p.joint][0] * S)}" y2="${fmt(y0 + pos[p.joint][1] * S)}" stroke="${COLOR[p.group]}" stroke-width="${p.group === 'body' ? 4 : 2.5}" stroke-linecap="round"/>`);
  const joints = Object.entries(pos).map(([j, [x, y]]) => `<circle cx="${fmt(x0 + x * S)}" cy="${fmt(y0 + y * S)}" r="${j === 'root' ? 4 : 2.6}" fill="${j === 'root' ? '#000' : '#fff'}" stroke="#333" stroke-width="1"><title>${esc(j)}</title></circle>`);
  const tf = `translate(${fmt(cx)} ${fmt(gy)}) scale(${fmt(pose.scale.x)} ${fmt(pose.scale.y)}) translate(${fmt(-cx)} ${fmt(-gy)})`;
  return [`<g><rect x="${x0 - 6}" y="${y0 - 6}" width="${S + 12}" height="${S + 12}" fill="#fafafa" stroke="#ddd"/>`,
    `<line x1="${x0 - 6}" y1="${fmt(gy)}" x2="${x0 + S + 6}" y2="${fmt(gy)}" stroke="#8d6e63" stroke-width="1.5" stroke-dasharray="4 3"/>`,
    `<g transform="${tf}">${parts.join('')}${joints.join('')}</g>`,
    `<text x="${x0}" y="${y0 + S + 22}" font-family="monospace" font-size="11" fill="#222">${esc(label)}</text>`,
    `<text x="${x0}" y="${y0 + S + 36}" font-family="monospace" font-size="10" fill="#666">${esc(sub)}</text>`,
    `<text x="${x0}" y="${y0 + S + 50}" font-family="monospace" font-size="10" fill="#666">${esc(sub2)}</text></g>`].join('');
}
/** Sample times: every distinct key time of the body tracks plus the secondary's tail. */
function keyTimes(tl) {
  const ms = new Set([0]);
  for (const keys of [...Object.values(tl.tracks), tl.root.dx]) for (const k of keys) ms.add(Math.round(k.ms * 1000) / 1000);
  if (!tl.loop) ms.add(tl.durationMs);
  return [...ms].sort((a, b) => a - b);
}
const rows = timelines.map((tl) => ({ tl, times: keyTimes(tl) }));
const cols = Math.max(...rows.map((r) => r.times.length));
const width = Math.max(1500, PAD * 2 + cols * CELL_W), height = HEAD + rows.length * CELL_H + PAD;
const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fff"/>`];
const title = `${name} — ${card.identity.earthName ?? 'procedural'} · ${card.template.id} v${card.template.version} · mass ${card.massClass.name} ×${card.massClass.multiplier} · ${card.locomotion.gait} (${card.locomotion.loco ?? 'default'}) · ${card.materials.body} · weapons ${card.weapons.join('/')} · luminous ${card.luminous} · realm ${card.realm}`;
out.push(`<text x="${PAD}" y="24" font-family="sans-serif" font-size="14" font-weight="bold">${esc(title)}</text>`);
const info = [
  `recipe ${card.recipeHash ?? 'none'} · timelines ${timelines.map((t) => `${t.actionId}=${t.hash}`).join(' ')}`,
  `budget ${budget.ok ? 'ok' : 'REDUCED ' + budget.dropped.join(',')} (${budget.parts} parts / ${budget.bones} bones) · bounds ${card.bounds.inside ? 'inside' : 'CLAMPED ' + card.bounds.clamped.map((c) => c.id).join(',')} · notes: ${card.notes.join(' | ') || 'none'}`,
  `stick figure: joints as circles, bones as lines, dashed ground line; root offsets in body lengths (${fmt(card.bodyLength)}) · legend: ${Object.entries(COLOR).filter(([g]) => card.parts.some((p) => p.group === g)).map(([g, c]) => `${g} ${c}`).join(' ')}`,
  `+ rotation = clockwise (front dips) for a right-facing body · mechanical evidence, not visual acceptance${card.identity.ownerId.startsWith('synthetic') ? ' · SYNTHETIC FIXTURE RECORD (hand-placed landmarks, not painter output)' : ''}`,
];
info.forEach((line, i) => out.push(`<text x="${PAD}" y="${44 + i * 16}" font-family="monospace" font-size="11" fill="#444">${esc(line)}</text>`));
rows.forEach(({ tl, times }, r) => {
  const phases = tl.phases.map(([n, ms]) => `${n} ${fmt(ms)}`).join(', ');
  out.push(`<text x="${PAD}" y="${HEAD + r * CELL_H - 2}" font-family="sans-serif" font-size="12" font-weight="bold">${esc(tl.actionId)} — body ${fmt(tl.bodyMs)} ms, total ${fmt(tl.durationMs)} ms${tl.hitstopMs ? `, hitstop ${fmt(tl.hitstopMs)}` : ''} · phases: ${esc(phases)}</text>`);
  times.forEach((ms, c) => {
    const pose = sampleTimeline(tl, ms), x0 = PAD + c * CELL_W + 8, y0 = HEAD + r * CELL_H + 10;
    const top = Object.entries(pose.joints).filter(([j]) => j !== 'root').sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]) || (a[0] < b[0] ? -1 : 1)).slice(0, 2).map(([j, r]) => `${j} ${fmt(r * 180 / Math.PI)}°`).join(' ');
    out.push(figure(card, pose, x0, y0, `t=${fmt(ms / tl.bodyMs)} · ${fmt(ms)} ms`, `dx ${fmt(pose.root.dx)} dy ${fmt(pose.root.dy)} root ${fmt(pose.root.rotation * 180 / Math.PI)}°`, top));
  });
});
out.push('</svg>');
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, name + '.pose-sheet.svg'), out.join('\n') + '\n');
writeFileSync(path.join(outDir, name + '.body-card.json'), JSON.stringify(card, null, 1) + '\n');
writeFileSync(path.join(outDir, name + '.timelines.json'), JSON.stringify(Object.fromEntries(timelines.map((t) => [t.actionId, t])), null, 1) + '\n');
console.log(`${name}: card ${card.recipeHash ?? 'no-hash'} · ${timelines.map((t) => `${t.actionId} ${t.hash} (${fmt(t.durationMs)} ms)`).join(' · ')} · budget ${budget.ok ? 'ok' : 'reduced'} → ${path.join(outDir, name + '.pose-sheet.svg')}`);
