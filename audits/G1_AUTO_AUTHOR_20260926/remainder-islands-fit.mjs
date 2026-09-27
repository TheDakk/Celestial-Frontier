/** Remainder-island placement (Claude 2026-09-27, C109 bird pattern): a polygon fit gives every painted pixel no polygon claims to the
 * REMAINDER part (the body). Where two polygons leave a sliver between them (the neck/back join of Seabird and Snow Petrel; the
 * Hummingbird's crown above its head polygon), that sliver becomes a body island DISCONNECTED from the body. It is skinned to the body,
 * so when the head dips in the late idle the sliver stays behind and floats above the back. This step moves each disconnected remainder
 * island to the neighbouring part it shares the longest border with, exactly on the label raster, then compiles the fit through the
 * unchanged keyed-label intake (`cf.keyed-part-intake/v1`: exact labels on the established authored keyer output).
 * Guards: labels are RECOMPUTED from the source declaration (cutAuthoredParts) and must equal the fit's ownership.png; only remainder
 * pixels in islands move; an island with no painted neighbour stays; an island over MAX_SHARE of the remainder refuses (a detached
 * body chunk is a structural fault, not a sliver); source RGBA untouched; placement only (no verdict).
 * Usage (repo root): node .../remainder-islands-fit.mjs <id> <srcFitDir> <outDir> -> <outDir>/fit + <outDir>/receipt.json */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { createHash } from 'node:crypto';
import { hashJSON } from '../../port/v2/tools/creature-animation/quadruped-template.mjs';
import { intakeAuthoredPixels } from '../../port/v2/tools/creature-animation/authored-intake.mjs';
import { cutAuthoredParts } from '../../port/v2/tools/creature-animation/part-masks.mjs';
import { buildAuthoredParts } from '../../port/v2/tools/creature-animation/build-authored-parts.mjs';
import { buildPaintSkin } from '../../port/v2/tools/creature-animation/build-paint-skin.mjs';
import { splitObservedSurfaces } from '../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import { createSourceJoinProbe } from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import { familyContactChains, familyContractForRecord } from '../../port/v2/tools/creature-animation/family-contracts.mjs';

export const MAX_SHARE = 0.05;

/** Pure: move every remainder island (8-connected components other than the largest) to the neighbour owner with the longest 4-border.
 * Returns the new labels and a per-island receipt. `remainder` is a 1-based label value. */
export function placeRemainderIslands(labels, w, h, remainder, maxShare = MAX_SHARE) {
  const comp = new Int32Array(labels.length).fill(-1), sizes = [];
  for (let i = 0; i < labels.length; i++) { if (labels[i] !== remainder || comp[i] >= 0) continue; const id = sizes.length, st = [i]; comp[i] = id; let n = 0;
    while (st.length) { const j = st.pop(); n++; const x = j % w, y = (j / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && Y >= 0 && X < w && Y < h) { const k = Y * w + X; if (labels[k] === remainder && comp[k] < 0) { comp[k] = id; st.push(k); } } } }
    sizes.push(n); }
  const total = sizes.reduce((s, n) => s + n, 0), main = sizes.indexOf(Math.max(...sizes)), out = Uint8Array.from(labels), islands = [];
  if (!total) throw Error('remainder owns no pixels');
  const border = sizes.map(() => new Map());
  for (let i = 0; i < labels.length; i++) { const c = comp[i]; if (c < 0 || c === main) continue; const x = i % w;
    for (const k of [i - 1, i + 1, i - w, i + w]) { if (k < 0 || k >= labels.length || Math.abs((k % w) - x) > 1) continue; const v = labels[k]; if (v && v !== remainder) border[c].set(v, (border[c].get(v) ?? 0) + 1); } }
  for (let c = 0; c < sizes.length; c++) { if (c === main) continue;
    const ranked = [...border[c].entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]), to = ranked[0]?.[0] ?? null;
    if (sizes[c] > maxShare * total) throw Error(`remainder island of ${sizes[c]} px is ${(100 * sizes[c] / total).toFixed(1)}% of the remainder (> ${100 * maxShare}%): structural, not a sliver`);
    islands.push({ pixels: sizes[c], to, border: Object.fromEntries(ranked) });
    if (to !== null) for (let i = 0; i < labels.length; i++) if (comp[i] === c) out[i] = to; }
  return { labels: out, islands, remainderPixels: total, moved: islands.filter((s) => s.to !== null).reduce((s, x) => s + x.pixels, 0) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [id, srcArg, outArg] = process.argv.slice(2), root = process.cwd(), src = path.resolve(srcArg), out = path.resolve(outArg);
  const req = createRequire(root + '/port/v2/package.json'), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp'), sha = (b) => createHash('sha256').update(b).digest('hex');
  if (fs.existsSync(out)) throw Error('Fresh output required');
  const read = (n) => JSON.parse(fs.readFileSync(path.join(src, n))), record = read('record.json'), declaration = read('declaration.json');
  if (declaration.schema !== 'cf.authored-part-masks/v1') throw Error('Polygon (authored-part-masks) fit required');
  const remainderId = read('pre-split-binding.json').sourceJoinTopology?.remainderPartId; if (!remainderId || remainderId !== declaration.remainderPart) throw Error('remainder part unknown or disagrees');
  const masterFile = path.join(root, record.source), master = fs.readFileSync(masterFile); if (sha(master) !== record.geometry.cutoutAssetHash) throw Error('Original master hash');
  const { data, info } = await sharp(master).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), w = info.width, h = info.height;
  const keyed = intakeAuthoredPixels(new Uint8ClampedArray(data), w, h), cut = await cutAuthoredParts(record, master, keyed.rgba, declaration);
  const parts = cut.parts.map(({ id: pid, joint, layer }) => ({ id: pid, joint, layer })), remainder = parts.findIndex((p) => p.id === remainderId) + 1; if (!remainder) throw Error('remainder not among parts');
  /* the recomputed labels must be the fit's own ownership (same colour law as build-authored-parts) */
  const own = await sharp(path.join(src, 'parts/ownership.png')).ensureAlpha().raw().toBuffer(); let ownershipMismatch = 0;
  for (let i = 0; i < w * h; i++) { const k = cut.labels[i], want = k ? [(k * 83) % 200 + 35, (k * 137) % 200 + 35, (k * 47) % 200 + 35] : null;
    if (want ? (own[i * 4] !== want[0] || own[i * 4 + 1] !== want[1] || own[i * 4 + 2] !== want[2]) : own[i * 4 + 3] !== 0) ownershipMismatch++; }
  if (ownershipMismatch) throw Error('recomputed labels disagree with the fit ownership: ' + ownershipMismatch);
  const placed = placeRemainderIslands(cut.labels, w, h, remainder); if (!placed.moved) throw Error('no remainder island to place');
  let conservationErrors = 0; for (let i = 0; i < w * h; i++) if (placed.labels[i] !== cut.labels[i] && cut.labels[i] !== remainder) conservationErrors++;
  if (conservationErrors) throw Error('conservation: ' + conservationErrors);
  const pixels = Buffer.alloc(w * h * 4); for (let i = 0; i < w * h; i++) pixels.set([placed.labels[i], placed.labels[i], placed.labels[i], 255], i * 4);
  const png = await sharp(pixels, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  fs.mkdirSync(path.join(out, 'fit'), { recursive: true }); const fit = path.join(out, 'fit'), write = (n, v) => fs.writeFileSync(path.join(fit, n), JSON.stringify(v, null, 2) + '\n', { flag: 'wx' });
  write('record.json', record); fs.writeFileSync(path.join(fit, 'labels.png'), png);
  const keyedRgbaSha256 = createHash('sha256').update(keyed.rgba).digest('hex');
  const body = { schema: 'cf.keyed-part-intake/v1', recordRecipeHash: record.recipeHash, cutoutSha256: record.geometry.cutoutAssetHash, parts, labelsFile: 'labels.png', labelsSha256: sha(png), keyedRgbaSha256 };
  write('declaration.json', { ...body, declarationHash: await hashJSON(body) });
  const intake = await buildAuthoredParts({ id, recordFile: path.join(fit, 'record.json'), masterFile, declarationFile: path.join(fit, 'declaration.json'), output: path.join(fit, 'parts') });
  const built = await buildPaintSkin(path.join(fit, 'parts'), { seamBridges: { groups: [] } }, record, { boundaryStep: 24, interiorStep: 56, includeTopology: true });
  const { bindingHash, ...bb } = built.binding; bb.sourceJoinTopology = { remainderPartId: remainderId }; const binding = { ...bb, bindingHash: await hashJSON(bb) }; write('pre-split-binding.json', binding);
  const a = await sharp(path.join(fit, 'parts/atlas', id + '.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const probe = createSourceJoinProbe({ record, binding, atlas: { rgba: a.data, width: a.info.width, height: a.info.height } });
  const opts = { fixedJoints: ['root'], shapeJoints: [...new Set(binding.parts.filter((p) => p.joint !== 'root').map((p) => p.joint))], contactEndpoints: familyContactChains(familyContractForRecord(record)).map((c) => c.end) };
  const split = await splitObservedSurfaces(binding, record, probe, opts); write('binding.json', split.binding);
  const named = placed.islands.map((s) => ({ ...s, to: s.to === null ? null : parts[s.to - 1].id, border: Object.fromEntries(Object.entries(s.border).map(([k, v]) => [parts[k - 1].id, v])) }));
  fs.writeFileSync(path.join(out, 'receipt.json'), JSON.stringify({ schema: 'cf.g1-remainder-islands/v1', sourceFit: path.relative(root, src), sourceMasterSha256: sha(master), keyedRgbaSha256, remainder: remainderId,
    remainderPixels: placed.remainderPixels, movedPixels: placed.moved, islands: named, ownershipMismatch: 0, conservationErrors: 0, sourceRgbaChanges: 0, placementOnly: true, verdictChanged: false,
    rule: 'each 8-connected remainder component other than the largest goes to the neighbour owner with the longest 4-border; > 5% refuses', intake, split: split.receipt }, null, 2) + '\n');
  console.log(id, JSON.stringify({ moved: placed.moved, islands: named.map((s) => `${s.pixels}->${s.to}`) }));
}
