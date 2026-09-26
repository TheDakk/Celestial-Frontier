/** C45(b): DERIVED OWNERSHIP EVIDENCE (not a manual label source, not an anatomical admission) for the four pinned creatures that
 * have no labels.png: Civet, Eel, Rat, Salamander. Ownership is derived from each genuine pin's admitted binding exactly as the card
 * builder does (tools/morph/build-card-masters.mjs, the `derived from the binding` branch): `kind=part` order gives label = index + 1,
 * each part's atlas-frame alpha is painted into its native cut-out box, far layer before near (stable), R = label, A = 255.
 * Differences from the card builder, per Codex's C45.md: malformed geometry (rotated / resized / out-of-bounds frames or cut-outs)
 * REFUSES instead of clipping, and every input is hash-checked against the genuine bundled pin first.
 * Controls (run by this generator and recorded in each receipt):
 *  - reproduction: the nearest-sampled 512 downscale of the derived map equals the SHIPPED card labels-512.png byte for byte;
 *  - changed binding: one part's cut-out moved by one pixel no longer reproduces it;
 *  - changed dimensions: a master of the wrong size refuses;
 *  - finisher conservation (unchanged instrument) PASSES for an identity finish against the derived ownership.
 * Run from the repository root: node audits/G5_DERIVED_LABELS_20260926/derive-labels.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto'; import { createRequire } from 'node:module';
import { pinRecordSha256 } from '../../port/v2/tools/morph/battle2-pin-contract.mjs';
import { finishConservation } from '../../port/v2/tools/painted-creature/finish-conservation.mjs';
const ROOT = path.resolve(import.meta.dirname, '../..'), HERE = import.meta.dirname;
const require = createRequire(path.join(ROOT, 'port/v2/package.json')), sharp = createRequire(require.resolve('free-tex-packer-core'))('sharp');
const sha = (b) => createHash('sha256').update(b).digest('hex'), read = (p) => fs.readFileSync(path.join(ROOT, p));
// the pinned cut-out alpha ships only in the arena mirror (core pack or on-demand library), never in the evidence folder
const readShipped = (p) => { for (const base of ['port/v2/apps/game/public/battle2/', 'port/v2/apps/game/public/library/battle2/']) if (fs.existsSync(path.join(ROOT, base + p))) return read(base + p); throw Error('shipped alpha not found: ' + p); };
const rgbaOf = async (bytes) => { const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data: new Uint8Array(data), width: info.width, height: info.height }; };
const pngOf = (data, w, h) => sharp(Buffer.from(data), { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
const PINS = fs.readFileSync(path.join(ROOT, 'port/v2/apps/game/src/battle2-master-pins.generated.ts'), 'utf8');
const pinOf = (id) => { const m = PINS.match(new RegExp(`creatureId: '${id}'[^)]*`)); if (!m) throw Error('no pin ' + id); const f = (k) => m[0].match(new RegExp(`${k}: '([^']+)'`))?.[1] ?? null, n = (k) => Number(m[0].match(new RegExp(`${k}: (\\d+)`))?.[1]);
  return { creatureId: id, masterPath: f('masterPath'), masterSha256: f('masterSha256'), masterWidth: n('masterWidth'), masterHeight: n('masterHeight'), recordPath: f('recordPath'), recordSha256: f('recordSha256'), recipeHash: f('recipeHash'),
    alphaPath: f('alphaPath'), alphaSha256: f('alphaSha256'), bindingSha256: f('bindingSha256'), atlasPath: f('atlasPath'), atlasSha256: f('atlasSha256') }; };
const GENERATOR_SHA = sha(fs.readFileSync(import.meta.filename));

/** The derivation (pure). Refuses malformed geometry. Returns the RGBA map, the ordered label map and inventories. */
export function deriveOwnership(binding, atlas, width, height) {
  const parts = binding.parts.filter((p) => p.kind === 'part'); if (!parts.length) throw Error('no bound parts');
  const labelList = parts.map((p, i) => ({ label: i + 1, id: p.id, joint: p.joint, layer: p.layer }));
  for (const p of parts) { const f = p.frame, c = p.cutout;
    if (f.rotated || p.rotated) throw Error(`part ${p.id}: rotated frame`);
    if (f.width !== c.width || f.height !== c.height) throw Error(`part ${p.id}: frame is not its cut-out's own size`);
    if (f.x < 0 || f.y < 0 || f.x + f.width > atlas.width || f.y + f.height > atlas.height) throw Error(`part ${p.id}: frame outside the atlas`);
    if (c.x < 0 || c.y < 0 || c.x + c.width > width || c.y + c.height > height) throw Error(`part ${p.id}: cut-out outside the master`); }
  const data = new Uint8Array(width * height * 4), writes = new Uint16Array(width * height), overwrite = {};
  const order = [...parts.entries()].sort((x, y) => (x[1].layer === y[1].layer ? 0 : x[1].layer === 'far' ? -1 : 1));
  for (const [i, p] of order) for (let y = 0; y < p.frame.height; y++) for (let x = 0; x < p.frame.width; x++) {
    if (!atlas.data[((p.frame.y + y) * atlas.width + p.frame.x + x) * 4 + 3]) continue;
    const q = (p.cutout.y + y) * width + p.cutout.x + x, j = q * 4;
    if (data[j] && data[j] !== i + 1) { const k = `${parts[data[j] - 1].id}→${p.id}`; overwrite[k] = (overwrite[k] ?? 0) + 1; }
    data[j] = i + 1; data[j + 3] = 255; writes[q]++; }
  return { data, labelList, overwrite };
}
const nearest = (img, dw, dh) => { const o = new Uint8Array(dw * dh * 4), sx = img.width / dw, sy = img.height / dh; for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const i = (Math.floor((y + 0.5) * sy) * img.width + Math.floor((x + 0.5) * sx)) * 4, j = (y * dw + x) * 4; o[j] = img.data[i]; o[j + 1] = img.data[i + 1]; o[j + 2] = img.data[i + 2]; o[j + 3] = img.data[i + 3]; } return o; };
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

const CARD_DIRS = { civet: 'port/v2/apps/game/assets/painted-cards/civet-sentinel-input-01/', eel: 'port/v2/apps/game/public/library/cards/eel/', rat: 'port/v2/apps/game/public/library/cards/rat/', salamander: 'port/v2/apps/game/public/library/cards/salamander/' };
const summary = [];
for (const id of ['civet', 'eel', 'rat', 'salamander']) {
  const out = path.join(HERE, id); fs.mkdirSync(out, { recursive: true });
  try {
    const pin = pinOf(id), recordBytes = read(pin.recordPath), record = JSON.parse(recordBytes), master = read(pin.masterPath), alpha = readShipped(pin.alphaPath), atlasBytes = read(pin.atlasPath);
    const bindingBytes = read(pin.recordPath.replace(/record\.json$/, 'binding.json')), binding = JSON.parse(bindingBytes);
    const checks = { record: (await pinRecordSha256(record)) === pin.recordSha256, master: sha(master) === pin.masterSha256, alpha: sha(alpha) === pin.alphaSha256, binding: sha(bindingBytes) === pin.bindingSha256, atlas: sha(atlasBytes) === pin.atlasSha256, recipe: record.recipeHash === pin.recipeHash };
    for (const [k, ok] of Object.entries(checks)) if (!ok) throw Error(`source ${k} differs from the genuine pin`);
    const m = await rgbaOf(master), atlas = await rgbaOf(atlasBytes), cut = await rgbaOf(alpha);
    if (m.width !== pin.masterWidth || m.height !== pin.masterHeight) throw Error('master dimensions differ from the pin');
    const d = deriveOwnership(binding, atlas, m.width, m.height), png = await pngOf(d.data, m.width, m.height);
    let unowned = 0, painted = 0; for (let q = 0; q < m.width * m.height; q++) { if (!cut.data[q * 4 + 3] && !cut.data[q * 4]) continue; painted++; if (!d.data[q * 4]) unowned++; }
    // controls
    const shipped = await rgbaOf(read(CARD_DIRS[id] + 'card/labels-512.png')), s = Math.min(1, 512 / Math.max(m.width, m.height)), dw = Math.round(m.width * s), dh = Math.round(m.height * s);
    const reproduction = same(nearest({ data: d.data, width: m.width, height: m.height }, dw, dh), shipped.data);
    const moved = JSON.parse(JSON.stringify(binding)), big = moved.parts.filter((p) => p.kind === 'part').reduce((a, p) => (p.cutout.width * p.cutout.height > a.cutout.width * a.cutout.height ? p : a)); big.cutout.x += big.cutout.x > 0 ? -1 : 1;
    const changedBinding = !same(nearest({ data: deriveOwnership(moved, atlas, m.width, m.height).data, width: m.width, height: m.height }, dw, dh), shipped.data);
    let changedDimensions = false; try { deriveOwnership(binding, atlas, Math.floor(m.width / 2), m.height); } catch { changedDimensions = true; }
    const conservation = finishConservation(m.data, m.data, d.data, m.width, m.height);
    fs.writeFileSync(path.join(out, 'labels.png'), png);
    const receipt = { schema: 'cf.derived-ownership-evidence/v1', kind: 'DERIVED OWNERSHIP EVIDENCE: derived from the admitted binding; not a manual label source, not an anatomical admission',
      creatureId: id, generatorSha256: GENERATOR_SHA, derivation: 'tools/morph/build-card-masters.mjs derived-from-binding branch (kind=part order, atlas alpha into native cut-out, far before near, R=label, A=255); malformed geometry refuses',
      pin: { ...pin }, sourceChecks: checks, dimensions: { width: m.width, height: m.height },
      labels: { pngSha256: sha(png), rgbaSha256: sha(Buffer.from(d.data)), map: d.labelList, overwrites: d.overwrite, paintedPixels: painted, unownedPaintedPixels: unowned },
      controls: { reproducesShippedCardLabels512: reproduction, changedBindingBreaksReproduction: changedBinding, changedDimensionsRefuse: changedDimensions, identityFinishConservation: conservation.status },
      note: id === 'civet' ? 'Civet: the original master is opaque (keyed); these labels do not change that and do not make it card-eligible (C45.md).' : undefined };
    fs.writeFileSync(path.join(out, 'receipt.json'), JSON.stringify(receipt, null, 1) + '\n');
    summary.push({ id, reproduction, changedBinding, changedDimensions, conservation: conservation.status, labels: receipt.labels.map.length, unowned, painted, pngSha256: receipt.labels.pngSha256 });
  } catch (e) { summary.push({ id, status: 'REFUSED', error: String(e) }); }
}
fs.writeFileSync(path.join(HERE, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary));
