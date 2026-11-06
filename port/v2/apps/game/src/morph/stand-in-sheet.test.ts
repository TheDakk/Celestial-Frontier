// Review sheet (not a gate): procedural creatures and Earth species drawn by their PAINTED stand-in through the real card path.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { REPO_ROOT } from '../battle2/parts-rig.fixtures.js';
import { PaintedCardSource, type PaintedCardAssets } from './painted-card-source.js';
import { CARD_ARCHETYPES } from './card-archetypes.js';
import { decodePng } from './png-decode.js';
import { proceduralFamilyV1 } from './painted-stand-in.js';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { write(p: { width: number; height: number; data: Buffer }): Buffer } } };
const writePng = (width: number, height: number, data: Uint8Array) => PNG.sync.write({ width, height, data: Buffer.from(data) });
const OUT = new URL('../../../../../../audits/PAINTED_STAND_INS_20260924/', import.meta.url);
const assets: PaintedCardAssets = { json: async (p) => JSON.parse(readFileSync(new URL(p, REPO_ROOT), 'utf8')), bytes: async (p) => new Uint8Array(readFileSync(new URL(p, REPO_ROOT))) };
// Opt-in review generator: CF_STANDIN_SHEET=1 npx vitest run apps/game/src/morph/stand-in-sheet.test.ts (skipped in the battery)
it.skipIf(!process.env.CF_STANDIN_SHEET)('stand-in review sheet', async () => {
  const src = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES, yieldToHost: () => Promise.resolve() });
  const want = ['Python', 'Beetle', 'Salmon', 'Fruit Bat', 'Tarantula', 'Civet', 'Crab', 'Octopus', 'Tree Frog'], per = 4, rows: { label: string; g: Record<string, unknown> }[][] = [];
  const pool = Array.from({ length: 20000 }, (_, i) => makeGenome(777 + i * 15485863, 'fauna', (i % 10) / 10) as unknown as Record<string, unknown>);
  for (const name of want) { const row: { label: string; g: Record<string, unknown> }[] = []; for (const g of pool) { if (row.length === per) break; if (src.standInFor(g)?.earthName === name) row.push({ label: proceduralFamilyV1(g), g }); } rows.push(row); }
  const earth = ['Brown Bear', 'Tiger', 'Wolf', 'Garter Snake', 'Ladybug', 'Blue Whale', 'Owl', 'Orangutan'].map((n, i) => ({ label: n, g: { ...makeGenome(900 + i, 'fauna', 0.5), _earthName: n } as Record<string, unknown> }));
  rows.push(earth.slice(0, 4), earth.slice(4));
  const T = 132, PAD = 4, cols = per, W = PAD + cols * (T + PAD), H = PAD + rows.length * (T + PAD), out = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) out.set([20, 26, 30, 255], i * 4);
  const legend: string[] = [];
  for (const [r, row] of rows.entries()) for (const [c, { label, g }] of row.entries()) {
    const card = src.card(g, 'thumb'); if (!card) { legend.push(`${r},${c} ${label}: no stand-in`); continue; }
    const a = await card, png = await decodePng(new Uint8Array(Buffer.from(a.url.slice(a.url.indexOf(',') + 1), 'base64')));
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const s = (y * png.width + x) * 4, al = png.rgba[s + 3]! / 255, o = ((PAD + r * (T + PAD) + y) * W + PAD + c * (T + PAD) + x) * 4;
      for (let k = 0; k < 3; k++) out[o + k] = Math.round(png.rgba[s + k]! * al + out[o + k]! * (1 - al)); }
    legend.push(`row ${r + 1} col ${c + 1}: ${label} → ${src.standInFor(g)!.earthName} (${src.standInFor(g)!.kind})`);
  }
  writeFileSync(new URL('stand-in-sheet-01.png', OUT), writePng(W, H, out)); writeFileSync(new URL('stand-in-sheet-01.txt', OUT), legend.join('\n') + '\n');
}, 600_000);
