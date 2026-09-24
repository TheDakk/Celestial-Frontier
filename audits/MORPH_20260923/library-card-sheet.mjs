// The painted LIBRARY on the card (2026-09-23, after the archetype-sprint merge): every registered archetype through the
// APP's shipped-asset path (createPaintedCardsForApp — the same explicit asset map the production build ships), one row
// each: as painted · three palette morphs (the crab sheet's seeds 1–3) · striped (a painted marking when the archetype
// ships masks, else plain by law — a feature nobody painted does not appear).
// Run from port/v2: node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/MORPH_20260923/library-card-sheet.mjs
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { writePng } from '../../port/v2/tools/anatomy-verify/png.mjs';
const { CARD_ARCHETYPES } = await import('../../port/v2/apps/game/src/morph/card-archetypes.ts');
const { PaintedCardSource } = await import('../../port/v2/apps/game/src/morph/painted-card-source.ts');
const { decodePng } = await import('../../port/v2/apps/game/src/morph/png-decode.ts');
const R = path.resolve(import.meta.dirname, '../..');
// the shipped asset map resolves repo-relative paths; here they are read from disk (the same files the build ships)
const assets = { json: async (p) => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8')), bytes: async (p) => new Uint8Array(fs.readFileSync(path.join(R, p))) };
const src = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES, cacheEntries: { thumb: 256, portrait: 8 } });
const T = 132, PAD = 8, cols = [{ label: 'as painted', g: {} }, ...[1, 2, 3].map((s) => ({ label: 'morph seed ' + s, g: { seed: 1000 + s * 7919, color: (s * 5) % 17, accent: (s * 11 + 3) % 17 } })), { label: 'striped', g: { pattern: 1, accent: 4 } }];
const W = PAD + cols.length * (T + PAD), H = PAD + CARD_ARCHETYPES.length * (T + PAD), out = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) out.set([20, 29, 34, 255], i * 4);
const sha = (u8) => crypto.createHash('sha256').update(u8).digest('hex').slice(0, 16), rows = [];
for (const [r, a] of CARD_ARCHETYPES.entries()) {
  const own = JSON.parse(fs.readFileSync(path.join(R, a.dir, 'record.json'), 'utf8')); const hasMasks = fs.existsSync(path.join(R, a.dir, 'markings.json')); const row = { earthName: a.earthName, template: own.template?.id, hasMasks, tiles: [] };
  for (const [c, col] of cols.entries()) {
    // column 0 is the archetype's OWN genome (the painting is its own genome → identity); the others are individuals of it
    const genome = c === 0 ? { _earthName: a.earthName, kingdom: 'fauna' } : { _earthName: a.earthName, kingdom: 'fauna', ...col.g };
    const asset = await src.card(genome, 'thumb'); const png = await decodePng(new Uint8Array(Buffer.from(asset.url.slice(22), 'base64')));
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const i = (y * T + x) * 4, al = png.rgba[i + 3] / 255, j = ((PAD + r * (T + PAD) + y) * W + PAD + c * (T + PAD) + x) * 4; for (let k = 0; k < 3; k++) out[j + k] = png.rgba[i + k] * al + out[j + k] * (1 - al); }
    row.tiles.push({ column: col.label, sha256: sha(png.rgba) });
  }
  const t = row.tiles.map((x) => x.sha256); row.morphsDistinct = new Set(t.slice(0, 4)).size === 4; row.stripedDiffers = t[4] !== t[0]; rows.push(row);
}
fs.writeFileSync(path.join(import.meta.dirname, 'library-card-sheet-03.png'), writePng(W, H, out));
const summary = { archetypes: rows.length, allMorphsDistinct: rows.every((r) => r.morphsDistinct), masksLandWhereShipped: rows.filter((r) => r.hasMasks).every((r) => r.stripedDiffers), renders: src.renders };
fs.writeFileSync(path.join(import.meta.dirname, 'library-card-sheet-03.json'), JSON.stringify({ schema: 'cf.library-card-sheet/v1', columns: cols.map((c) => c.label), summary, rows }, null, 1) + '\n');
console.log(JSON.stringify(summary));
