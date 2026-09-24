// The painted LIBRARY decisions (Nick 2026-09-23, on Claude's recommendations; audits/MORPH_20260923/README.md), asserted as
// OUTCOMES over every shipped archetype: the accent is trim, a near-grey painting takes a visible tint, a long body turns onto
// the card's diagonal and nothing else turns — and the card and the stage make the same grey/tint decision per role.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../battle2/parts-rig.fixtures.js';
import { compileBodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from '../motion/body-card.js';
import { CARD_ARCHETYPES } from './card-archetypes.js';
import { alphaBoxV1, cardCompositeV1, diagonalLongBodyV1, LONG_BODY_ASPECT, renderCardIndividualV1, type CardReceiptV1 } from './morph-card.js';
import { paletteFramesV1 } from './morph-individual.js';
import { LOW_CHROMA_ROLE, meanSaturation, paletteRoleOfGroup, rgbToHsl, type PaletteFrame } from './morph-palette.js';
import { archetypeGenomeV1, morphParamsV1 } from './morph-params.js';
import { decodePng } from './png-decode.js';
const read = (p: string) => readFileSync(new URL(p, REPO_ROOT));
const json = <T,>(p: string): T => JSON.parse(read(p).toString('utf8')) as T;
async function load(dir: string) {
  const record = json<ResolvedAnatomyRecord & { recipeHash: string; template: { id: string } }>(dir + 'record.json'), receipt = json<CardReceiptV1>(dir + 'card/card.json');
  const m = await decodePng(new Uint8Array(read(dir + 'card/master-512.png'))), l = await decodePng(new Uint8Array(read(dir + 'card/labels-512.png')));
  const own = archetypeGenomeV1(record as never), card = compileBodyCard(record, own as MotionGenomeFields);
  return { record, receipt, own, card, master: { width: m.width, height: m.height, master: m.rgba, labels: l.rgba } };
}
const roleShare = (a: Awaited<ReturnType<typeof load>>) => { const g = new Map(a.card.parts.map((p) => [p.joint, p.group] as const)), role = new Map(a.receipt.labels.map((x) => [x.label, paletteRoleOfGroup(g.get(x.joint), a.card.template.id)] as const)); let acc = 0, n = 0; for (let i = 0; i < a.master.width * a.master.height; i++) { const r = role.get(a.master.labels[i * 4]!); if (!r || r === 'keep') continue; n++; if (r === 'accent') acc++; } return acc / n; };
describe('the painted library on the card — outcomes', () => {
  it('the accent is TRIM on every archetype (≤ 33 % of labelled pixels — measured max: the Beetle\'s elytra 31 %); the crab keeps its claws-only split', async () => {
    for (const a of CARD_ARCHETYPES) { const f = await load(a.dir), share = roleShare(f); expect(share, a.earthName + ' accent share').toBeLessThanOrEqual(0.33); }
    const crab = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Crab')!.dir), g = new Map(crab.card.parts.map((p) => [p.joint, p.group] as const));
    expect(crab.receipt.labels.filter((l) => paletteRoleOfGroup(g.get(l.joint), crab.card.template.id) === 'accent').every((l) => g.get(l.joint) === 'arms')).toBe(true);
    // the negative control: the pre-2026-09-23 default (no template) puts ~38 % of the Civet in the accent
    const civet = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Civet')!.dir), cg = new Map(civet.card.parts.map((p) => [p.joint, p.group] as const)); let acc = 0, n = 0;
    for (let i = 0; i < civet.master.width * civet.master.height; i++) { const l = civet.receipt.labels.find((x) => x.label === civet.master.labels[i * 4]); if (!l) continue; const r = paletteRoleOfGroup(cg.get(l.joint)); if (r === 'keep') continue; n++; if (r === 'accent') acc++; }
    expect(acc / n).toBeGreaterThan(0.33);
  }, 60_000);
  it('a NEAR-GREY painting takes a visible tint (the Salmon), luminance exact; a coloured one still rotates its own hue', async () => {
    const salmon = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Salmon')!.dir), g = { seed: 5, color: 2, accent: 11 };
    const params = morphParamsV1(g, salmon.record.recipeHash, salmon.own), before = salmon.master.master, after = cardCompositeV1({ ...salmon, params, markingMask: null });
    let sb = 0, sa = 0, n = 0, lMax = 0; for (let i = 0; i < salmon.master.width * salmon.master.height; i++) { if (before[i * 4 + 3]! < 128) continue; n++; sb += rgbToHsl(before[i * 4]!, before[i * 4 + 1]!, before[i * 4 + 2]!)[1]!; sa += rgbToHsl(after[i * 4]!, after[i * 4 + 1]!, after[i * 4 + 2]!)[1]!;
      const L = (a: Uint8Array) => (Math.max(a[i * 4]!, a[i * 4 + 1]!, a[i * 4 + 2]!) + Math.min(a[i * 4]!, a[i * 4 + 1]!, a[i * 4 + 2]!)) / 2; lMax = Math.max(lMax, Math.abs(L(before) - L(after))); }
    expect(sb / n).toBeLessThan(LOW_CHROMA_ROLE); expect(sa / n - sb / n).toBeGreaterThan(0.1); expect(lMax).toBeLessThanOrEqual(2);
  }, 60_000);
  it('a LONG body turns onto the diagonal and is larger on the card; no other archetype turns', async () => {
    for (const a of CARD_ARCHETYPES) { const f = await load(a.dir), id = morphParamsV1({}, f.record.recipeHash), px = cardCompositeV1({ ...f, params: id, markingMask: null }), b = alphaBoxV1(px, f.master.width, f.master.height);
      const long = (b.y1 - b.y0 + 1) / (b.x1 - b.x0 + 1) < LONG_BODY_ASPECT, turned = diagonalLongBodyV1(px, f.master.width, f.master.height, null);
      expect(turned.rotated, a.earthName).toBe(long);
      if (!long) continue;
      const fill = (rgba: Uint8Array) => { let o = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i]! > 128) o++; return o / (rgba.length / 4); };
      const flat = (() => { const bw = b.x1 - b.x0 + 1, side = Math.round(bw * 1.12); return fill(px) * (f.master.width * f.master.height) / (side * side); })(); // the old square crop's fill
      expect(fill(renderCardIndividualV1({ ...f, params: id, size: 132 })), a.earthName + ' fill').toBeGreaterThan(flat * 1.15); }
    expect(CARD_ARCHETYPES.filter((a) => ['Python', 'Centipede', 'Salmon'].includes(a.earthName)).length).toBe(3);
  }, 120_000);
  it('CARD = STAGE: per role, the card master and the real atlas make the same grey/tint decision on every archetype', async () => {
    let compared = 0, tinted = 0;
    for (const a of CARD_ARCHETYPES) {
      const f = await load(a.dir), src = json<{ fitDir: string }>(a.dir + 'SOURCE.json'), binding = json<{ parts: { id: string; joint: string; kind: 'part' | 'joint-patch'; layer: 'far' | 'near'; frame: PaletteFrame; cutout: PaletteFrame }[] }>(src.fitDir + 'binding.json');
      const manifest = json<{ creatureId: string }>(src.fitDir + 'parts/manifest.json'), atlas = await decodePng(new Uint8Array(read(src.fitDir + 'parts/atlas/' + manifest.creatureId + '.png')));
      const frames = paletteFramesV1(binding as never, f.card), g = new Map(f.card.parts.map((p) => [p.joint, p.group] as const)), role = new Map(f.receipt.labels.map((x) => [x.label, paletteRoleOfGroup(g.get(x.joint), f.card.template.id)] as const));
      const whole: PaletteFrame[] = [{ x: 0, y: 0, width: f.master.width, height: f.master.height, role: 'base' }];
      for (const r of ['base', 'accent'] as const) {
        if (!frames.some((x) => x.role === r)) continue;
        const stage = meanSaturation(atlas.rgba, atlas.width, frames, r), card = meanSaturation(f.master.master, f.master.width, whole.map((w) => ({ ...w, role: r })), r, (p) => role.get(f.master.labels[p * 4]!) === r);
        expect(stage < LOW_CHROMA_ROLE, `${a.earthName} ${r}: stage ${stage.toFixed(3)} vs card ${card.toFixed(3)}`).toBe(card < LOW_CHROMA_ROLE);
        expect(stage).toBeGreaterThan(0); expect(card).toBeGreaterThan(0); compared++; if (card < LOW_CHROMA_ROLE) tinted++;
      }
    }
    expect(compared).toBeGreaterThanOrEqual(CARD_ARCHETYPES.length); expect(tinted).toBeGreaterThanOrEqual(2); // not vacuous: every archetype compared, and the tint branch is actually exercised
  }, 300_000);
});
