// The SECOND ARCHETYPE's sheets (MORPH_SYSTEM_DESIGN §3, Claude's step 7): one generator over CARD_ARCHETYPES, so the
// Civet and the crab are judged by the SAME instrument, through the REAL shipped card path (PaintedCardSource →
// renderCardIndividualV1 on the sealed 512² card master). Two sheets per archetype:
//   <slug>-palette-sheet-01.png  — the archetype as painted + 12 palette morphs from 12 seeds (portrait, 440)
//   <slug>-markings-sheet-01.png — the eight v1 patterns × three rows (own+turquoise accent / same lumin / crimson+golden), 132
// Controls in the JSON (both directions): the own genome renders IDENTITY (card composite byte-identical to the sealed
// master), the 12 palette tiles are pairwise distinct, and every MASKED pattern differs from plain (a painted mask that
// never lands would show as a duplicate of plain — the whole point of the Civet sheet).
// Run from port/v2:
//   node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/MORPH_20260923/archetype-sheet.mjs "Civet" civet
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { writePng } from '../../port/v2/tools/anatomy-verify/png.mjs';
const { PaintedCardSource } = await import('../../port/v2/apps/game/src/morph/painted-card-source.ts');
const { CARD_ARCHETYPES } = await import('../../port/v2/apps/game/src/morph/card-archetypes.ts');
const { decodePng } = await import('../../port/v2/apps/game/src/morph/png-decode.ts');
const { archetypeGenomeV1, morphParamsV1 } = await import('../../port/v2/apps/game/src/morph/morph-params.ts');
const { PATTERN_NAMES, MASKED_PATTERNS } = await import('../../port/v2/apps/game/src/morph/morph-markings.ts');
const { cardCompositeV1 } = await import('../../port/v2/apps/game/src/morph/morph-card.ts');
const { compileBodyCard } = await import('../../port/v2/apps/game/src/motion/body-card.ts');

const EARTH_NAME = process.argv[2], SLUG = process.argv[3];
if (!EARTH_NAME || !SLUG) throw new Error('usage: archetype-sheet.mjs <EarthName> <slug>');
const R = path.resolve(import.meta.dirname, '../..'), OUT = import.meta.dirname;
const entry = CARD_ARCHETYPES.find((a) => a.earthName === EARTH_NAME);
if (!entry) throw new Error('no painted archetype named ' + EARTH_NAME + ' in CARD_ARCHETYPES');
const assets = { json: async (p) => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8')), bytes: async (p) => new Uint8Array(fs.readFileSync(path.join(R, p))) };
const src = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES, cacheEntries: { thumb: 64, portrait: 64 } });
const dir = entry.dir.endsWith('/') ? entry.dir : entry.dir + '/';
const record = JSON.parse(fs.readFileSync(path.join(R, dir, 'record.json'), 'utf8'));
const receipt = JSON.parse(fs.readFileSync(path.join(R, dir, 'card/card.json'), 'utf8'));
const own = archetypeGenomeV1(record);
const sha = (u8) => crypto.createHash('sha256').update(Buffer.from(u8.buffer ?? u8, u8.byteOffset ?? 0, u8.byteLength ?? u8.length)).digest('hex');
const render = async (genome, kind) => { const p = src.card(genome, kind); if (!p) throw new Error('no card for ' + JSON.stringify(genome)); const a = await p; const png = await decodePng(new Uint8Array(Buffer.from(a.url.slice(22), 'base64'))); return { a, png }; };

/* ---------- sheet 1: palette ---------- */
const T = 440, PAD = 10, COLS = 4, SEEDS = 12;
const paletteGenomes = [{ label: 'archetype as painted (its own genome)', g: { ...own } }];
for (let s = 1; s <= SEEDS; s++) paletteGenomes.push({ label: 'seed ' + (1000 + s * 7919), g: { _earthName: EARTH_NAME, seed: 1000 + s * 7919, color: (s * 5) % 17, accent: (s * 11 + 3) % 17 } });
const rowsP = Math.ceil(paletteGenomes.length / COLS), PW = PAD + COLS * (T + PAD), PH = PAD + rowsP * (T + PAD);
const psheet = new Uint8Array(PW * PH * 4); for (let i = 0; i < PW * PH; i++) psheet.set([20, 29, 34, 255], i * 4);
const blit = (sheet, SW, rgba, tile, ox, oy) => { for (let y = 0; y < tile; y++) for (let x = 0; x < tile; x++) { const i = (y * tile + x) * 4, al = rgba[i + 3] / 255, j = ((oy + y) * SW + ox + x) * 4; for (let c = 0; c < 3; c++) sheet[j + c] = rgba[i + c] * al + sheet[j + c] * (1 - al); } };
const paletteTiles = [];
for (const [k, t] of paletteGenomes.entries()) {
  const { a, png } = await render(t.g, 'portrait');
  blit(psheet, PW, png.rgba, T, PAD + (k % COLS) * (T + PAD), PAD + Math.floor(k / COLS) * (T + PAD));
  const params = morphParamsV1(t.g, record.recipeHash, own);
  paletteTiles.push({ tile: k, label: t.label, genome: t.g, identity: params.identity, base: params.base, accent: params.accent, proportion: params.proportion, encodedBytes: a.encodedBytes, sha256: sha(png.rgba) });
}
fs.writeFileSync(path.join(OUT, SLUG + '-palette-sheet-01.png'), writePng(PW, PH, psheet));

/* ---------- sheet 2: markings ---------- */
const MT = 132, MPAD = 8;
// ROWS (corrected 2026-09-23). The 2026-09-22 crab sheet's second row was `{accent:4, lumin:true}` and came out
// BYTE-IDENTICAL to its first row: BOTH painted archetypes' own genomes carry `lumin: true`, so the lumin gene is an
// identity channel for them by the "the painting is its own genome" rule — a row that claimed to show M4 and showed
// nothing. M4 is demonstrated on this sheet by the IRIDESCENT column instead (emissive without a painted mask, which
// does NOT depend on the lumin gene), and the freed row now carries M1 proportion, which no sheet showed before.
const mrows = [{ label: 'own genome + accent turquoise', g: { accent: 4 } }, { label: 'crimson base, accent golden', g: { color: 1, accent: 3 } }, { label: 'own genome + accent turquoise, head gene 7 (M1 proportion)', g: { accent: 4, head: 7 } }];
const MW = MPAD + PATTERN_NAMES.length * (MT + MPAD), MH = MPAD + mrows.length * (MT + MPAD);
const msheet = new Uint8Array(MW * MH * 4); for (let i = 0; i < MW * MH; i++) msheet.set([20, 29, 34, 255], i * 4);
const markingTiles = [];
for (const [r, row] of mrows.entries()) for (const [c, pattern] of PATTERN_NAMES.entries()) {
  const g = { ...own, _earthName: EARTH_NAME, seed: 1000 + c, ...row.g, pattern: c };
  const { a, png } = await render(g, 'thumb');
  blit(msheet, MW, png.rgba, MT, MPAD + c * (MT + MPAD), MPAD + r * (MT + MPAD));
  markingTiles.push({ row: row.label, rowIndex: r, pattern, masked: MASKED_PATTERNS.has(pattern), encodedBytes: a.encodedBytes, sha256: sha(png.rgba) });
}
fs.writeFileSync(path.join(OUT, SLUG + '-markings-sheet-01.png'), writePng(MW, MH, msheet));

/* ---------- controls (both directions) ---------- */
// (a) the own genome is IDENTITY: the card composite must be the sealed master's own bytes
const masterPng = await decodePng(new Uint8Array(fs.readFileSync(path.join(R, dir, 'card/master-512.png'))));
const labelsPng = await decodePng(new Uint8Array(fs.readFileSync(path.join(R, dir, 'card/labels-512.png'))));
const ownParams = morphParamsV1(own, record.recipeHash, own);
const ownComposite = cardCompositeV1({ master: { width: masterPng.width, height: masterPng.height, master: masterPng.rgba, labels: labelsPng.rgba }, receipt, card: compileBodyCard(record, own), params: ownParams, markingMask: null });
const identityByteIdentical = ownParams.identity && sha(ownComposite) === sha(masterPng.rgba);
// (b) the twelve palette morphs are pairwise distinct AND each differs from the archetype tile
const pHashes = paletteTiles.map((t) => t.sha256), paletteDistinct = new Set(pHashes).size === pHashes.length;
// (c) every MASKED pattern differs from plain in its own row (a mask that never lands duplicates plain)
const byRow = new Map(); for (const t of markingTiles) { const m = byRow.get(t.rowIndex) ?? new Map(); m.set(t.pattern, t.sha256); byRow.set(t.rowIndex, m); }
const maskedLanding = [...byRow.entries()].map(([rowIndex, m]) => ({ rowIndex, patterns: [...MASKED_PATTERNS].map((p) => ({ pattern: p, differsFromPlain: m.get(p) !== m.get('plain') })) }));
const allMasksLand = maskedLanding.every((r) => r.patterns.every((p) => p.differsFromPlain));
// (d) M4 is visible: the IRIDESCENT column (emissive, no painted mask) differs from plain in every row
const emissiveVisible = [...byRow.values()].every((m) => m.get('iridescent') !== m.get('plain'));
// (e) M1 is visible: the proportion row differs from row 0 on every pattern
const proportionLive = PATTERN_NAMES.every((p) => byRow.get(0).get(p) !== byRow.get(2).get(p));
// (f) RETAINED FINDING + its both-way control: the lumin GENE is inert for an archetype whose own genome is lumin
//     (the 2026-09-22 sheet's second row) — and live for an archetype genome that is not.
const luminRow = [];
for (const [c, pattern] of PATTERN_NAMES.entries()) { const base = { ...own, _earthName: EARTH_NAME, seed: 1000 + c, accent: 4, pattern: c };
  const withLumin = await render({ ...base, lumin: true }, 'thumb'), without = await render(base, 'thumb');
  // the control in the other direction: the SAME individual against an archetype genome that is NOT lumin must differ
  const ownNoLumin = { ...own, lumin: false };
  const pA = morphParamsV1({ ...base, lumin: true }, record.recipeHash, own), pB = morphParamsV1({ ...base, lumin: true }, record.recipeHash, ownNoLumin);
  luminRow.push({ pattern, archetypeOwnLumin: own.lumin === true, luminGeneInert: sha(withLumin.png.rgba) === sha(without.png.rgba), paramsLuminUnderOwn: pA.lumin, paramsLuminUnderNonLuminArchetype: pB.lumin }); }
const luminFinding = { archetypeOwnLumin: own.lumin === true, inertOnEveryPattern: luminRow.every((r) => r.luminGeneInert), liveAgainstNonLuminArchetype: luminRow.every((r) => r.paramsLuminUnderNonLuminArchetype === true), perPattern: luminRow };

const report = { schema: 'cf.archetype-sheet/v1', earthName: EARTH_NAME, dir, recipeHash: record.recipeHash, master: record.source,
  cardReceipt: { master: receipt.card, labels: receipt.labels.length, landmarks: Object.keys(receipt.landmarks).length },
  archetypeGenome: own, renders: src.renders,
  controls: { identityByteIdentical, paletteDistinct, allMasksLand, emissiveVisible, proportionLive, maskedLanding }, luminFinding,
  paletteSheet: { file: SLUG + '-palette-sheet-01.png', width: PW, height: PH, tile: T, tiles: paletteTiles },
  markingsSheet: { file: SLUG + '-markings-sheet-01.png', width: MW, height: MH, tile: MT, columns: [...PATTERN_NAMES], tiles: markingTiles } };
fs.writeFileSync(path.join(OUT, SLUG + '-sheet-01.json'), JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify({ earthName: EARTH_NAME, palette: [PW, PH], markings: [MW, MH], renders: src.renders, controls: { identityByteIdentical, paletteDistinct, allMasksLand, emissiveVisible, proportionLive }, lumin: { inert: luminFinding.inertOnEveryPattern, liveAgainstNonLuminArchetype: luminFinding.liveAgainstNonLuminArchetype } }));
