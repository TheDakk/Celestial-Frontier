#!/usr/bin/env node
/* Browser-free demonstration of boundary-band underlap on the fixture rig (C2 bounded repair, 2026-09-13).
 * Keys the accepted Civet master with Codex's keyer, cuts the fixture parts with and without underlap,
 * renders the rest pose and the quadruped `hit` recoil (the C2 7400 ms pose) and the melee strike with the
 * pure software renderer, writes the PNGs, runs the seam oracle on each, and writes a report with the
 * per-joint counts and the "0 changed channels at rest" gate for both cuts. Deterministic.
 * Usage: node tools/motion-proof/rig-pose-render.mjs <newOutDir> [--underlap=0.035] */
import './ts-loader.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!out || fs.existsSync(out)) { console.error('usage: rig-pose-render.mjs <newOutDir> [--underlap=0.035]'); process.exit(2); }
const underlapFrac = Number((process.argv.find((a) => a.startsWith('--underlap=')) ?? '--underlap=0.035').slice(11));
const byLimit = process.argv.includes('--by-limit');
const { keyAndDespill } = await import(path.join(repo, 'tools/local-image-generation/kit-contact-math.mjs'));
const { cutFixtureParts } = await import('../../apps/game/src/battle2/fixture-rig.ts');
const { renderPosedCut, poseFromTimeline, changedChannels } = await import('../../apps/game/src/battle2/rig-render.ts');
const { compileBodyCard } = await import('../../apps/game/src/motion/body-card.ts');
const { buildTimeline } = await import('../../apps/game/src/motion/timeline.ts');
const { tAt } = await import('../../apps/game/src/motion/timing.ts');
const { QUADRUPED_TEMPLATE } = await import('../../apps/game/src/motion/templates.ts');

const recordPath = path.join(repo, 'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'), masterPath = path.join(repo, 'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png');
const record = JSON.parse(fs.readFileSync(recordPath, 'utf8')), master = PNG.sync.read(fs.readFileSync(masterPath));
const W = master.width, H = master.height;
const keyed = keyAndDespill(new Uint8ClampedArray(master.data.buffer, master.data.byteOffset, master.data.length), W, H);
const alpha = keyed.alpha instanceof Uint8Array ? keyed.alpha : new Uint8Array(keyed.alpha);
const card = compileBodyCard(record), SEED = 7;
const hit = buildTimeline(card, 'hit', SEED), melee = buildTimeline(card, 'melee', SEED);
const poses = {
  rest: {},
  'hit-recoil': poseFromTimeline(hit, tAt('hit', 'recoil') * hit.bodyMs),
  'melee-strike': poseFromTimeline(melee, tAt('melee', 'smear') * melee.bodyMs),
};
fs.mkdirSync(out, { recursive: true });
const writePng = (name, rgba) => { const png = new PNG({ width: W, height: H }); png.data = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.length); fs.writeFileSync(path.join(out, name), PNG.sync.write(png)); };
const oracle = (file) => JSON.parse(execFileSync(process.execPath, [path.join(here, 'seam-oracle.mjs'), path.join(out, file), recordPath, '--joints=head,neck,jaw,tail1,tail2,tail3,foreNearKnee,foreNearAnkle,hindNearKnee,hindNearAnkle,foreFarKnee,hindFarAnkle'], { encoding: 'utf8' }).trim());
const report = { schema: 'cf.rig-pose-render/v1', byLimit, master: path.relative(repo, masterPath), record: path.relative(repo, recordPath), size: { width: W, height: H }, alphaPixels: alpha.reduce((n, a) => n + (a ? 1 : 0), 0), underlapPx: Math.round(underlapFrac * W), cuts: {} };
for (const [cutName, opts] of [['strict', {}], ['underlap', { underlapPx: Math.round(underlapFrac * W), ...(byLimit ? { underlapByLimit: { limitsDeg: QUADRUPED_TEMPLATE.limitsDeg, capPx: Math.floor(W / 8) } } : {}) }]]) {
  const cut = cutFixtureParts(alpha, W, H, record, opts);
  const entry = { underlapPx: cut.underlapPx, underlapPixels: cut.parts.reduce((n, p) => n + p.underlapCount, 0), poses: {} };
  for (const [poseName, pose] of Object.entries(poses)) {
    const r = renderPosedCut(cut, record, keyed.rgba, pose), file = `civet-${cutName}-${poseName}.png`;
    writePng(file, r.rgba);
    const o = oracle(file);
    entry.poses[poseName] = { file, opaque: r.opaque, restChangedChannels: poseName === 'rest' ? changedChannels(r.rgba, keyed.rgba) : null, gapPixelsInsideEnvelope: o.gapPixelsInsideEnvelope, perJoint: Object.fromEntries(Object.entries(o.perJoint).map(([j, v]) => [j, v ? v.seamPixels : null])) };
  }
  report.cuts[cutName] = entry;
}
// Pose-minus-rest per joint, per cut.
report.seamDeltas = Object.fromEntries(Object.entries(report.cuts).map(([c, e]) => [c, Object.fromEntries(Object.keys(poses).filter((p) => p !== 'rest').map((p) => [p, Object.fromEntries(Object.entries(e.poses[p].perJoint).map(([j, v]) => [j, v === null ? null : v - e.poses.rest.perJoint[j]]))]))]));
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ out, underlapPx: report.underlapPx, restChanged: { strict: report.cuts.strict.poses.rest.restChangedChannels, underlap: report.cuts.underlap.poses.rest.restChangedChannels }, hitHeadNeck: { strict: [report.seamDeltas.strict['hit-recoil'].head, report.seamDeltas.strict['hit-recoil'].neck], underlap: [report.seamDeltas.underlap['hit-recoil'].head, report.seamDeltas.underlap['hit-recoil'].neck] } }));
