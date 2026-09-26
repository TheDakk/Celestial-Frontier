// The individual on the CARD, for Nick's eye: six archetypes × (identity, two morphs) as 132 thumbs, plus one 440
// portrait — rendered by the same PaintedCardSource the game's species-art loader asks first.
// Run from port/v2: node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/MORPH_20260922/card-sheet.mjs
import fs from 'node:fs'; import path from 'node:path';
import { writePng } from '../../port/v2/tools/anatomy-verify/png.mjs';
const { PaintedCardSource } = await import('../../port/v2/apps/game/src/morph/painted-card-source.ts');
const { CARD_ARCHETYPES } = await import('../../port/v2/apps/game/src/morph/card-archetypes.ts');
const { decodePng } = await import('../../port/v2/apps/game/src/morph/png-decode.ts');
const { archetypeGenomeV1 } = await import('../../port/v2/apps/game/src/morph/morph-params.ts');
const R = path.resolve(import.meta.dirname, '../..');
const src = new PaintedCardSource({ assets: { json: async (p) => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8')), bytes: async (p) => new Uint8Array(fs.readFileSync(path.join(R, p))) }, registry: CARD_ARCHETYPES });
const OWN = Object.fromEntries(CARD_ARCHETYPES.map((a) => [a.earthName, archetypeGenomeV1(JSON.parse(fs.readFileSync(path.join(R, a.dir, 'record.json'), 'utf8')))]));
const GEN = (name, over) => ({ ...OWN[name], _earthName: name, ...over }); // identity column = the archetype's OWN genome → the painting as painted
const cols = [{ label: 'own genome (as painted)', g: {} }, { label: 'crimson / turquoise, head 7', g: { seed: 77, color: 1, accent: 4, head: 7 } }, { label: 'golden / indigo, tail 6', g: { seed: 12, color: 3, accent: 5, tail: 6 } }];
const T = 132, PAD = 8, W = PAD + cols.length * (T + PAD) + 440 + PAD, H = PAD + CARD_ARCHETYPES.length * (T + PAD), out = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) out.set([20, 29, 34, 255], i * 4);
const blit = (rgba, s, ox, oy) => { for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const i = (y * s + x) * 4, a = rgba[i + 3] / 255, j = ((oy + y) * W + ox + x) * 4; for (let c = 0; c < 3; c++) out[j + c] = rgba[i + c] * a + out[j + c] * (1 - a); } };
const fromUrl = async (u) => decodePng(new Uint8Array(Buffer.from(u.slice('data:image/png;base64,'.length), 'base64')));
const manifest = [];
for (const [r, a] of CARD_ARCHETYPES.entries()) for (const [c, col] of cols.entries()) { const asset = await src.card(GEN(a.earthName, col.g), 'thumb'); const png = await fromUrl(asset.url); blit(png.rgba, T, PAD + c * (T + PAD), PAD + r * (T + PAD)); manifest.push({ row: a.earthName, col: col.label, key: asset.key.slice(0, 40), bytes: asset.encodedBytes }); }
const portrait = await src.card(GEN('Crab', cols[1].g), 'portrait'); blit((await fromUrl(portrait.url)).rgba, 440, PAD + cols.length * (T + PAD), PAD); manifest.push({ portrait: 'Crab crimson/turquoise head 7 @440', bytes: portrait.encodedBytes });
fs.writeFileSync(path.join(import.meta.dirname, 'card-sheet-01.png'), writePng(W, H, out)); fs.writeFileSync(path.join(import.meta.dirname, 'card-sheet-01.json'), JSON.stringify({ renders: src.renders, tiles: manifest }, null, 1) + '\n');
console.log(JSON.stringify({ W, H, renders: src.renders }));
