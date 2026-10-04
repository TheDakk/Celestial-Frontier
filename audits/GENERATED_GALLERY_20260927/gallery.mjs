/** Master gallery for Dakk's single end-of-pass visual review (Claude 2026-09-27): every GENERATED creature (G2 painting → automatic
 * G1 author → intake → static → native, zero hand edits) whose best current version passes the native battle harness, one tile each
 * from its hit-reaction still (the hardest pose), grouped by family, with the known faults. Thumbnails only; every tile's full-size
 * stills and film stay in its native directory (listed in gallery.json). Usage (repo root): node audits/GENERATED_GALLERY_20260927/gallery.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const req = createRequire(path.resolve('port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const HERE = 'audits/GENERATED_GALLERY_20260927';
/* entries come from gallery-registry.json (seeded with the 38 tiles of 2026-09-27; score-batch.mjs appends native passes) */
const CROPS = { land: { left: 90, top: 200, width: 844, height: 290 }, water: { left: 150, top: 300, width: 724, height: 220 }, snake: { left: 0, top: 370, width: 1024, height: 200 } };
const FAMILY_TITLE = { quadruped: 'Quadrupeds', serpent: 'Snakes (serpent strip author)', 'biped-bird': 'Birds', fish: 'Fish', insect: 'Insects' };
const reg = JSON.parse(fs.readFileSync(path.join(HERE, 'gallery-registry.json'), 'utf8')), order = [];
for (const e of reg) { const fam = FAMILY_TITLE[e.family] ?? e.family; let g = order.find(([f]) => f === fam); if (!g) order.push(g = [fam, []]); g[1].push({ ...e, dir: e.nativeDir, crop: CROPS[e.crop ?? (e.family === 'serpent' ? 'snake' : e.family === 'fish' ? 'water' : 'land')] }); }
const FAMILIES = order;
const TW = 560, TH = 210, COLS = 3, comp = [], manifest = []; let y = 80;
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
for (const [family, entries] of FAMILIES) {
  comp.push({ input: Buffer.from(`<svg width="1720" height="40"><text x="10" y="30" font-size="26" font-family="Arial" font-weight="bold" fill="#eddfbb">${esc(family)} — ${entries.length}</text></svg>`), left: 0, top: y }); y += 44;
  for (let k = 0; k < entries.length; k++) { const e = entries[k], f = ['turn1-hit-reaction-50.png', 'turn0-hit-reaction-50.png'].map((n) => path.join(e.dir, n)).find((q) => fs.existsSync(q)) ?? path.join(e.dir, 'turn1-hit-reaction-50.png'), x = 10 + (k % COLS) * (TW + 10), ty = y + Math.floor(k / COLS) * (TH + 44);
    if (!fs.existsSync(f)) throw Error('missing still: ' + f);
    comp.push({ input: await sharp(f).extract(e.crop).resize(TW, TH, { fit: 'fill' }).png().toBuffer(), left: x, top: ty + 38 });
    comp.push({ input: Buffer.from(`<svg width="${TW}" height="38"><text x="2" y="17" font-size="17" font-family="Arial" fill="white">${esc(e.name)}</text><text x="2" y="34" font-size="14" font-family="Arial" fill="#9fb3bf">${esc(e.note)}</text></svg>`), left: x, top: ty });
    manifest.push({ family, name: e.name, nativeDir: e.dir, report: JSON.parse(fs.readFileSync(path.join(e.dir, 'report.json'))).status, note: e.note }); }
  y += Math.ceil(entries.length / COLS) * (TH + 44) + 10; }
const total = manifest.length, H = y + 10;
const bg = Buffer.from(`<svg width="1720" height="${H}"><rect width="100%" height="100%" fill="#0d151a"/><text x="10" y="40" font-size="30" font-family="Arial" fill="white">Generated Earth creatures in battle — ${total} passing the native harness (zero hand edits)</text><text x="10" y="68" font-size="17" font-family="Arial" fill="#9fb3bf">Hit-reaction still (hardest pose). Not yet visually accepted or admitted; notes list known faults. 2026-09-27.</text></svg>`);
await sharp(bg).composite(comp).jpeg({ quality: 84 }).toFile(path.join(HERE, 'gallery.jpg'));
fs.writeFileSync(path.join(HERE, 'gallery.json'), JSON.stringify({ schema: 'cf.generated-gallery/v1', total, entries: manifest }, null, 1) + '\n');
console.log(total, manifest.filter((m) => m.report !== 'DIAGNOSTIC_PASS').map((m) => m.name));
