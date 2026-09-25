// M3/M4 on the card for Nick's eye: the crab archetype × the eight v1 patterns (plain, striped, spotted, banded,
// mottled, iridescent, marbled, eye-spotted) at 132, then the same with lumin (emissive) — through the real PaintedCardSource.
// Run from port/v2: node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/MORPH_20260922/card-markings-sheet.mjs
import fs from 'node:fs'; import path from 'node:path';
import { writePng } from '../../port/v2/tools/anatomy-verify/png.mjs';
const { PaintedCardSource } = await import('../../port/v2/apps/game/src/morph/painted-card-source.ts');
const { CARD_ARCHETYPES } = await import('../../port/v2/apps/game/src/morph/card-archetypes.ts');
const { decodePng } = await import('../../port/v2/apps/game/src/morph/png-decode.ts');
const { archetypeGenomeV1 } = await import('../../port/v2/apps/game/src/morph/morph-params.ts');
const { PATTERN_NAMES } = await import('../../port/v2/apps/game/src/morph/morph-markings.ts');
const R = path.resolve(import.meta.dirname, '../..');
const src = new PaintedCardSource({ assets: { json: async (p) => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8')), bytes: async (p) => new Uint8Array(fs.readFileSync(path.join(R, p))) }, registry: CARD_ARCHETYPES });
const own = archetypeGenomeV1(JSON.parse(fs.readFileSync(path.join(R, CARD_ARCHETYPES[0].dir, 'record.json'), 'utf8')));
const T = 132, PAD = 8, rows = [{ label: 'own genome + accent turquoise', g: { accent: 4 } }, { label: 'same, lumin (emissive)', g: { accent: 4, lumin: true } }, { label: 'crimson base, accent golden', g: { color: 1, accent: 3 } }];
const W = PAD + PATTERN_NAMES.length * (T + PAD), H = PAD + rows.length * (T + PAD), out = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) out.set([20, 29, 34, 255], i * 4);
const blit = (rgba, ox, oy) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const i = (y * T + x) * 4, a = rgba[i + 3] / 255, j = ((oy + y) * W + ox + x) * 4; for (let c = 0; c < 3; c++) out[j + c] = rgba[i + c] * a + out[j + c] * (1 - a); } };
const tiles = [];
for (const [r, row] of rows.entries()) for (const [c, pattern] of PATTERN_NAMES.entries()) { const asset = await src.card({ ...own, _earthName: 'Crab', seed: 1000 + c, ...row.g, pattern: c }, 'thumb'); const png = await decodePng(new Uint8Array(Buffer.from(asset.url.slice(22), 'base64'))); blit(png.rgba, PAD + c * (T + PAD), PAD + r * (T + PAD)); tiles.push({ row: row.label, pattern, bytes: asset.encodedBytes }); }
fs.writeFileSync(path.join(import.meta.dirname, 'card-markings-sheet-01.png'), writePng(W, H, out)); fs.writeFileSync(path.join(import.meta.dirname, 'card-markings-sheet-01.json'), JSON.stringify({ columns: [...PATTERN_NAMES], tiles }, null, 1) + '\n');
console.log(JSON.stringify({ W, H, renders: src.renders }));
