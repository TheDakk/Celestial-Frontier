// Card masters (Nick 2026-09-22: the painted individual is the creature EVERYWHERE, phone included — D1 amended for
// the card): a sealed ≤512² downscale of each archetype's master + its labels (nearest), derived once, deterministic,
// so a phone renders the individual's card without the full master. Run from port/v2:
//   node tools/morph/build-card-masters.mjs
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';
import { readPng, writePng } from '../anatomy-verify/png.mjs';
export const CARD_MASTER_SIDE = 512;
const R = path.resolve(import.meta.dirname, '../../../..');
export const CARD_ARCHETYPES = Object.freeze([
  { earthName: 'Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/' }, { earthName: 'Coconut Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/' },
  { earthName: 'Freshwater Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/' }, { earthName: 'Mud Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/' },
  { earthName: 'Vent Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/' }, { earthName: 'Civet', dir: 'audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/' },
]);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const box = (img, dw, dh) => { const o = new Uint8Array(dw * dh * 4), sx = img.width / dw, sy = img.height / dh;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx)), y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy)); let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = (yy * img.width + xx) * 4, al = img.data[i + 3]; r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al; n++; }
    const j = (y * dw + x) * 4; if (a > 0) { o[j] = Math.round(r / a); o[j + 1] = Math.round(g / a); o[j + 2] = Math.round(b / a); o[j + 3] = Math.round(a / n); } } return o; };
const nearest = (img, dw, dh) => { const o = new Uint8Array(dw * dh * 4), sx = img.width / dw, sy = img.height / dh; for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const i = (Math.floor((y + 0.5) * sy) * img.width + Math.floor((x + 0.5) * sx)) * 4, j = (y * dw + x) * 4; o[j] = img.data[i]; o[j + 1] = img.data[i + 1]; o[j + 2] = img.data[i + 2]; o[j + 3] = img.data[i + 3]; } return o; };
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  for (const a of CARD_ARCHETYPES) {
    const dir = path.join(R, a.dir), record = JSON.parse(fs.readFileSync(path.join(dir, 'record.json'))), masterBytes = fs.readFileSync(path.join(R, record.source)), binding = JSON.parse(fs.readFileSync(path.join(dir, 'binding.json')));
    const master = readPng(masterBytes);
    // the cut-out's alpha is `parts/keyed.png` (record.geometry space) — a master may be an opaque keyed painting (the Civet)
    const keyedBytes = fs.readFileSync(path.join(dir, 'parts/keyed.png')), keyed = readPng(keyedBytes); if (keyed.width !== master.width || keyed.height !== master.height) throw Error(a.earthName + ': keyed size');
    for (let i = 0; i < master.width * master.height; i++) master.data[i * 4 + 3] = keyed.data[i * 4 + 3];
    let labels, labelList, labelSource, labelsSha256;
    if (fs.existsSync(path.join(dir, 'labels.png'))) { // the compiler/hand-fit label map + declaration order (value = index + 1)
      const labelsBytes = fs.readFileSync(path.join(dir, 'labels.png')); labels = readPng(labelsBytes); labelsSha256 = sha(labelsBytes); labelSource = 'labels.png + declaration.json';
      const decl = JSON.parse(fs.readFileSync(path.join(dir, 'declaration.json'))); labelList = decl.parts.map((p, i) => ({ label: i + 1, id: p.id, joint: p.joint, layer: p.layer }));
    } else { // derived from the binding: each part's atlas frame alpha painted into its cut-out box, far layer first, value = part index + 1
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'parts/manifest.json'))), atlas = readPng(fs.readFileSync(path.join(dir, 'parts/atlas/' + manifest.creatureId + '.png')));
      const parts = binding.parts.filter((p) => p.kind === 'part'); labelList = parts.map((p, i) => ({ label: i + 1, id: p.id, joint: p.joint, layer: p.layer }));
      const data = new Uint8Array(master.width * master.height * 4); const order = [...parts.entries()].sort((x, y) => (x[1].layer === y[1].layer ? 0 : x[1].layer === 'far' ? -1 : 1));
      for (const [i, p] of order) for (let y = 0; y < p.frame.height; y++) for (let x = 0; x < p.frame.width; x++) { const a = atlas.data[((p.frame.y + y) * atlas.width + p.frame.x + x) * 4 + 3]; if (!a) continue; const mx = p.cutout.x + x, my = p.cutout.y + y; if (mx < 0 || my < 0 || mx >= master.width || my >= master.height) continue; const j = (my * master.width + mx) * 4; data[j] = i + 1; data[j + 3] = 255; }
      labels = { width: master.width, height: master.height, data }; labelsSha256 = sha(writePng(master.width, master.height, data)); labelSource = 'binding parts (atlas frames → cut-out boxes, far then near)';
    }
    if (labels.width !== master.width || labels.height !== master.height) throw Error(a.earthName + ': labels size');
    const s = Math.min(1, CARD_MASTER_SIDE / Math.max(master.width, master.height)), dw = Math.round(master.width * s), dh = Math.round(master.height * s);
    const out = path.join(dir, 'card'); fs.mkdirSync(out, { recursive: true });
    const m = writePng(dw, dh, box(master, dw, dh)), l = writePng(dw, dh, nearest(labels, dw, dh));
    fs.writeFileSync(path.join(out, 'master-512.png'), m); fs.writeFileSync(path.join(out, 'labels-512.png'), l);
    const receipt = { schema: 'cf.card-master/v1', earthName: a.earthName, recordRecipeHash: record.recipeHash, source: { master: record.source, masterSha256: sha(masterBytes), keyedSha256: sha(keyedBytes), alpha: 'parts/keyed.png', labelsSha256, labelSource, width: master.width, height: master.height }, labels: labelList, landmarks: record.landmarks, card: { width: dw, height: dh, scale: s, masterSha256: sha(m), labelsSha256: sha(l), filter: 'alpha-weighted box; labels nearest' } };
    fs.writeFileSync(path.join(out, 'card.json'), JSON.stringify(receipt, null, 1) + '\n');
    console.log(JSON.stringify({ earthName: a.earthName, from: [master.width, master.height], to: [dw, dh], masterSha256: receipt.card.masterSha256.slice(0, 12) }));
  }
}
