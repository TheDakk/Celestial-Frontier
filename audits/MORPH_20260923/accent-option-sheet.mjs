// ONE PAGE for Nick's open question (2) of 2026-09-22: "`color` recolours the base coat (body + legs) with `accent` on
// head/claws/tail/ears — keep this default or declare base/accent per archetype on the painting side?"
// The second archetype answers it. `paletteRoleOfGroup` sends every non body/legs group to ACCENT; on the crab that is
// claws + eyes (5.6 % of the labelled pixels) and reads as trim, but on the quadruped it is head + jaw + neck + ears +
// tail (38.1 %) with a STRAIGHT SEAM at the shoulder, so a strong accent grafts a second animal onto the body.
// Row 0 = the split as shipped. Row 1 = the same individuals with the HEAD group on the base coat (accent left on ears
// and tail), rendered through the SAME renderer by declaring the variant on the body card — no shipped code changes.
// Control (both directions): on the CRAB the variant is a no-op (no head group) and must be byte-identical.
// Run from port/v2:
//   node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/MORPH_20260923/accent-option-sheet.mjs
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { writePng } from '../../port/v2/tools/anatomy-verify/png.mjs';
const { decodePng } = await import('../../port/v2/apps/game/src/morph/png-decode.ts');
const { archetypeGenomeV1, morphParamsV1 } = await import('../../port/v2/apps/game/src/morph/morph-params.ts');
const { renderCardIndividualV1 } = await import('../../port/v2/apps/game/src/morph/morph-card.ts');
const { compileBodyCard } = await import('../../port/v2/apps/game/src/motion/body-card.ts');
const R = path.resolve(import.meta.dirname, '../..'), OUT = import.meta.dirname;
const load = async (dir) => { const record = JSON.parse(fs.readFileSync(path.join(R, dir, 'record.json'), 'utf8')), receipt = JSON.parse(fs.readFileSync(path.join(R, dir, 'card/card.json'), 'utf8'));
  const m = await decodePng(new Uint8Array(fs.readFileSync(path.join(R, dir, 'card/master-512.png')))), l = await decodePng(new Uint8Array(fs.readFileSync(path.join(R, dir, 'card/labels-512.png'))));
  return { record, receipt, master: { width: m.width, height: m.height, master: m.rgba, labels: l.rgba }, own: archetypeGenomeV1(record) }; };
const sha = (u8) => crypto.createHash('sha256').update(Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)).digest('hex');
// the variant: the head group declared as base coat (ears and tail stay accent)
const headOnBase = (card) => ({ parts: card.parts.map((p) => (p.group === 'head' ? { ...p, group: 'body' } : p)) });

const civet = await load('port/v2/apps/game/assets/painted-cards/civet-sentinel-input-01/');
const genomes = []; for (let s = 1; s <= 12; s++) genomes.push({ _earthName: 'Civet', seed: 1000 + s * 7919, color: (s * 5) % 17, accent: (s * 11 + 3) % 17 });
// the four individuals whose base and accent hues are furthest apart — the split's worst case, not a convenient one
const hueGap = (g) => { const p = morphParamsV1(g, civet.record.recipeHash, civet.own); if (p.base.hue === null || p.accent.hue === null) return -1; const d = Math.abs(p.base.hue - p.accent.hue); return Math.min(d, 360 - d); };
const picked = genomes.map((g) => ({ g, gap: hueGap(g) })).sort((a, b) => b.gap - a.gap).slice(0, 4);
const T = 440, PAD = 10, COLS = 4, W = PAD + COLS * (T + PAD), H = PAD + 2 * (T + PAD);
const sheet = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) sheet.set([20, 29, 34, 255], i * 4);
const blit = (rgba, ox, oy) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const i = (y * T + x) * 4, a = rgba[i + 3] / 255, j = ((oy + y) * W + ox + x) * 4; for (let c = 0; c < 3; c++) sheet[j + c] = rgba[i + c] * a + sheet[j + c] * (1 - a); } };
const tiles = [];
for (const [k, { g, gap }] of picked.entries()) {
  const card = compileBodyCard(civet.record, g), params = morphParamsV1(g, civet.record.recipeHash, civet.own);
  const asShipped = renderCardIndividualV1({ master: civet.master, receipt: civet.receipt, card, params, size: T, markingMask: null });
  const variant = renderCardIndividualV1({ master: civet.master, receipt: civet.receipt, card: headOnBase(card), params, size: T, markingMask: null });
  blit(asShipped, PAD + k * (T + PAD), PAD); blit(variant, PAD + k * (T + PAD), PAD + T + PAD);
  tiles.push({ column: k, genome: g, hueGapDeg: Math.round(gap), base: params.base, accent: params.accent, shippedSha256: sha(asShipped), variantSha256: sha(variant), differs: sha(asShipped) !== sha(variant) });
}
fs.writeFileSync(path.join(OUT, 'civet-accent-option-sheet-01.png'), writePng(W, H, sheet));
// control: the variant is a NO-OP on the crab (it has no head group) — byte-identical both ways
const crab = await load('port/v2/apps/game/assets/painted-cards/crab/');
const cg = { _earthName: 'Crab', seed: 1000 + 7919, color: 5, accent: 14 }, ccard = compileBodyCard(crab.record, cg), cparams = morphParamsV1(cg, crab.record.recipeHash, crab.own);
const crabShipped = renderCardIndividualV1({ master: crab.master, receipt: crab.receipt, card: ccard, params: cparams, size: T, markingMask: null });
const crabVariant = renderCardIndividualV1({ master: crab.master, receipt: crab.receipt, card: headOnBase(ccard), params: cparams, size: T, markingMask: null });
const control = { crabGroups: [...new Set(ccard.parts.map((p) => p.group))], crabVariantIsNoOp: sha(crabShipped) === sha(crabVariant), civetVariantChangesEveryTile: tiles.every((t) => t.differs) };
fs.writeFileSync(path.join(OUT, 'civet-accent-option-sheet-01.json'), JSON.stringify({ schema: 'cf.accent-option-sheet/v1', question: 'MORPH_SYSTEM_DESIGN §5 (2) — base/accent role split', rows: ['as shipped (paletteRoleOfGroup: head+jaw+neck+ears+tail = accent)', 'variant (head group on the base coat; ears and tail stay accent)'], control, tiles }, null, 1) + '\n');
console.log(JSON.stringify({ sheet: [W, H], control }));
