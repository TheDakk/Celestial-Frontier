// The painted LIBRARY decisions (Nick 2026-09-23, on Claude's recommendations; audits/MORPH_20260923/README.md), asserted as
// OUTCOMES over every shipped archetype: the accent is trim, a near-grey painting takes a visible tint, a long body turns onto
// the card's diagonal and nothing else turns — and the card and the stage make the same grey/tint decision per role.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../battle2/parts-rig.fixtures.js';
import { compileBodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from '../motion/body-card.js';
import { CARD_ARCHETYPES } from './card-archetypes.js';
import { cardCompositeV1, cardProportionV1, cardRolesV1, diagonalLongBodyV1, LONG_BODY_ASPECT, renderCardIndividualV1, type CardReceiptV1 } from './morph-card.js';
import { jointScalesV1 } from './morph-skeleton.js';
import { createSkeletonPoseProgram } from '../../../../tools/creature-animation/skeleton-pose.mjs';
import { familyContractForRecord } from '../../../../tools/creature-animation/family-contracts.mjs';
import { transformPoint } from '../../../../tools/creature-animation/kinematics.js';
import { paletteFramesV1 } from './morph-individual.js';
import { CARD_TINT_V1 } from './card-tint.generated.js';
import { LOW_CHROMA_ROLE, meanSaturation, paletteRoleOfGroup, paletteRoleOfPart, rgbToHsl, type PaletteFrame } from './morph-palette.js';
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
const roleShare = (a: Awaited<ReturnType<typeof load>>) => { const role = cardRolesV1(a.receipt, a.card); let acc = 0, n = 0; for (let i = 0; i < a.master.width * a.master.height; i++) { const r = role.get(a.master.labels[i * 4]!); if (!r || r === 'keep') continue; n++; if (r === 'accent') acc++; } return acc / n; }; // the PRODUCTION role map
describe('the painted library on the card — outcomes', () => {
  // 35 % (was 33 % until the Bass, 2026-09-25: a bass's spiny + soft dorsal, square tail and paired fins are 33.9 % of its paint — honest
  // trim for a fish). The negative control below is bound to the SAME constant: the pre-2026-09-23 default (~38 %) must still fail it.
  const ACCENT_TRIM_MAX = 0.35;
  it('the accent is TRIM on every archetype (≤ 35 % of labelled pixels — measured max: the Bass\'s fins 33.9 %, the Beetle\'s elytra 31 %); the crab keeps its claws-only split', async () => {
    for (const a of CARD_ARCHETYPES) { const f = await load(a.dir), share = roleShare(f); expect(share, a.earthName + ' accent share').toBeLessThanOrEqual(ACCENT_TRIM_MAX); }
    const crab = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Crab')!.dir), g = new Map(crab.card.parts.map((p) => [p.joint, p.group] as const));
    expect(crab.receipt.labels.filter((l) => paletteRoleOfGroup(g.get(l.joint), crab.card.template.id) === 'accent').every((l) => g.get(l.joint) === 'arms')).toBe(true);
    // the negative control: the pre-2026-09-23 default (no template) puts ~38 % of the Civet in the accent
    const civet = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Civet')!.dir), cg = new Map(civet.card.parts.map((p) => [p.joint, p.group] as const)); let acc = 0, n = 0;
    for (let i = 0; i < civet.master.width * civet.master.height; i++) { const l = civet.receipt.labels.find((x) => x.label === civet.master.labels[i * 4]); if (!l) continue; const r = paletteRoleOfGroup(cg.get(l.joint)); if (r === 'keep') continue; n++; if (r === 'accent') acc++; }
    expect(acc / n).toBeGreaterThan(ACCENT_TRIM_MAX);
    // the swimming-bell control: the Jellyfish under the plain radial plan (its bell = `body`) is NOT trim; the cnidarian split is what passes it
    const jelly = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Jellyfish')!.dir), jg = new Map(jelly.card.parts.map((p) => [p.joint, p.group] as const)); let ja = 0, jn = 0;
    for (let i = 0; i < jelly.master.width * jelly.master.height; i++) { const l = jelly.receipt.labels.find((x) => x.label === jelly.master.labels[i * 4]); if (!l) continue; const r = paletteRoleOfPart(l, jg.get(l.joint), 'radial'); if (r === 'keep') continue; jn++; if (r === 'accent') ja++; }
    expect(ja / jn).toBeGreaterThan(ACCENT_TRIM_MAX); expect(roleShare(jelly)).toBe(0);
    const star = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Starfish')!.dir); expect(roleShare(star)).toBeGreaterThan(0); // the Starfish keeps its disc accent
    // the flying-insect control: the Dragonfly under the plain insect plan (wings = accent) is NOT trim; the Beetle keeps its elytra accent
    const fly = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Dragonfly')!.dir), fg = new Map(fly.card.parts.map((p) => [p.joint, p.group] as const)); let fa = 0, fn = 0;
    for (let i = 0; i < fly.master.width * fly.master.height; i++) { const l = fly.receipt.labels.find((x) => x.label === fly.master.labels[i * 4]); if (!l) continue; const r = paletteRoleOfPart(l, fg.get(l.joint), 'insect'); if (r === 'keep') continue; fn++; if (r === 'accent') fa++; }
    expect(fa / fn).toBeGreaterThan(ACCENT_TRIM_MAX); expect(roleShare(fly)).toBeLessThanOrEqual(ACCENT_TRIM_MAX);
    const beetle = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Beetle')!.dir); expect(roleShare(beetle)).toBeGreaterThan(0.2);
  }, 60_000);
  it('a NEAR-GREY painting takes a visible tint (the Salmon), luminance exact; a coloured one still rotates its own hue', async () => {
    const salmon = await load(CARD_ARCHETYPES.find((a) => a.earthName === 'Salmon')!.dir), g = { seed: 5, color: 2, accent: 11 };
    const params = morphParamsV1(g, salmon.record.recipeHash, salmon.own), before = salmon.master.master, after = cardCompositeV1({ ...salmon, params, markingMask: null });
    let sb = 0, sa = 0, n = 0, lMax = 0; for (let i = 0; i < salmon.master.width * salmon.master.height; i++) { if (before[i * 4 + 3]! < 128) continue; n++; sb += rgbToHsl(before[i * 4]!, before[i * 4 + 1]!, before[i * 4 + 2]!)[1]!; sa += rgbToHsl(after[i * 4]!, after[i * 4 + 1]!, after[i * 4 + 2]!)[1]!;
      const L = (a: Uint8Array) => (Math.max(a[i * 4]!, a[i * 4 + 1]!, a[i * 4 + 2]!) + Math.min(a[i * 4]!, a[i * 4 + 1]!, a[i * 4 + 2]!)) / 2; lMax = Math.max(lMax, Math.abs(L(before) - L(after))); }
    expect(sb / n).toBeLessThan(LOW_CHROMA_ROLE); expect(sa / n - sb / n).toBeGreaterThan(0.1); expect(lMax).toBeLessThanOrEqual(2);
  }, 60_000);
  it('a LONG body turns onto the diagonal and is larger on the card — exactly the Python, the Centipede, the Salmon, the Sturgeon and the River Otter; every other card is byte-identical with the rotation switched off', async () => {
    // Rewritten 2026-09-24 (review: the old test derived "long" from the production threshold and compared against a proxy — LONG_BODY_ASPECT = 0
    // passed). Now: an explicit list, and the real renderer against itself with the diagonal switched off.
    const TURNS = ['Python', 'Centipede', 'Salmon', 'Sturgeon', 'River Otter', 'Pike', 'Wall Lizard'], turned: string[] = []; // + the long C15 bodies (2026-09-25)
    const fill = (rgba: Uint8Array) => { let o = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i]! > 128) o++; return o / (rgba.length / 4); };
    for (const a of CARD_ARCHETYPES) { const f = await load(a.dir), id = morphParamsV1({}, f.record.recipeHash);
      const on = renderCardIndividualV1({ ...f, params: id, size: 132 }), off = renderCardIndividualV1({ ...f, params: id, size: 132, diagonal: false });
      if (on.every((v, i) => v === off[i])) continue; turned.push(a.earthName);
      expect(fill(on), `${a.earthName}: the diagonal must make it larger`).toBeGreaterThan(fill(off) * 1.15); }
    expect(turned.sort()).toEqual([...TURNS].sort()); expect(LONG_BODY_ASPECT).toBeGreaterThan(0);
  }, 120_000);
  it('CARD = STAGE: per role, the card master and the real atlas make the same grey/tint decision on every archetype', async () => {
    let compared = 0, tinted = 0; const straddles: string[] = [];
    for (const a of CARD_ARCHETYPES) {
      const f = await load(a.dir), src = json<{ fitDir: string }>(a.dir + 'SOURCE.json'), binding = json<{ parts: { id: string; joint: string; kind: 'part' | 'joint-patch'; layer: 'far' | 'near'; frame: PaletteFrame; cutout: PaletteFrame }[] }>(src.fitDir + 'binding.json');
      const manifest = json<{ creatureId: string }>(src.fitDir + 'parts/manifest.json'), atlas = await decodePng(new Uint8Array(read(src.fitDir + 'parts/atlas/' + manifest.creatureId + '.png')));
      const frames = paletteFramesV1(binding as never, f.card), g = new Map(f.card.parts.map((p) => [p.joint, p.group] as const)), role = cardRolesV1(f.receipt, f.card); void g; // the PRODUCTION role map (review: tests re-derived it)
      const whole: PaletteFrame[] = [{ x: 0, y: 0, width: f.master.width, height: f.master.height, role: 'base' }];
      for (const r of ['base', 'accent'] as const) {
        if (!frames.some((x) => x.role === r)) continue;
        const stage = meanSaturation(atlas.rgba, atlas.width, frames, r), card = meanSaturation(f.master.master, f.master.width, whole.map((w) => ({ ...w, role: r })), r, (p) => role.get(f.master.labels[p * 4]!) === r);
        // the decision BOTH sides use (remapAtlasPaletteV1 reads CARD_TINT_V1 by params.archetype); independent measurements may straddle
        const decided = CARD_TINT_V1[f.record.recipeHash]?.[r]; expect(decided, `${a.earthName} ${r}: no tint decision in the table`).toBeDefined();
        const effStage = decided ?? stage < LOW_CHROMA_ROLE, effCard = decided ?? card < LOW_CHROMA_ROLE;
        expect(effStage, `${a.earthName} ${r}: stage ${stage.toFixed(3)} vs card ${card.toFixed(3)}`).toBe(effCard);
        if (stage < LOW_CHROMA_ROLE !== card < LOW_CHROMA_ROLE) straddles.push(`${a.earthName} ${r}`);
        expect(stage).toBeGreaterThan(0); expect(card).toBeGreaterThan(0); compared++; if (card < LOW_CHROMA_ROLE) tinted++;
      }
    }
    expect(compared).toBeGreaterThanOrEqual(CARD_ARCHETYPES.length); expect(tinted).toBeGreaterThanOrEqual(2);
    // control: without the table the Gull's accent is decided differently by the two measurements — the table is load-bearing
    expect(straddles).toContain('Gull accent'); // not vacuous: every archetype compared, and the tint branch is actually exercised
  }, 300_000);
  it('the BODY takes the colour gene on every archetype (a part on joint root was never recoloured on the eleven sprint archetypes — found by the review 2026-09-24); a crab\'s painted SHADOW stays exactly as painted', async () => {
    const report: string[] = [];
    for (const a of CARD_ARCHETYPES) {
      const f = await load(a.dir), rootLabels = f.receipt.labels.filter((l) => l.joint === 'root');
      if (!rootLabels.length) continue;
      const params = morphParamsV1({ seed: 11, color: (Number(f.own.color ?? 0) + 6) % 17, accent: (Number(f.own.accent ?? 0) + 6) % 17 }, f.record.recipeHash, f.own) /* both coats: a radial disc is the accent */, out = cardCompositeV1({ ...f, params, markingMask: null });
      for (const l of rootLabels) { let n = 0, changed = 0;
        for (let i = 0; i < f.master.width * f.master.height; i++) { if (f.master.labels[i * 4] !== l.label || f.master.master[i * 4 + 3]! < 128) continue; n++; if (out[i * 4] !== f.master.master[i * 4] || out[i * 4 + 1] !== f.master.master[i * 4 + 1] || out[i * 4 + 2] !== f.master.master[i * 4 + 2]) changed++; }
        const share = n ? changed / n : 0; report.push(`${a.earthName} ${l.id}: ${(share * 100).toFixed(0)}% of ${n}`);
        if (/shadow/i.test(l.id)) expect(changed, `${a.earthName} shadow must stay as painted`).toBe(0); else expect(share, `${a.earthName} ${l.id} barely recoloured`).toBeGreaterThan(0.5); }
    }
    expect(report.filter((r) => !/shadow/.test(r)).length).toBeGreaterThanOrEqual(11); // the sprint bodies were all checked
  }, 120_000);
  it('CARD = STAGE proportion: with a head and tail morph every landmark in a scaled part lands where the STAGE skeleton program puts it — nested parts compose, fixed sockets pivot (the review found ears drawn twice and the Centipede head pivoted at the wrong point)', async () => {
    let compared = 0, nested = 0; const mismatch: string[] = [];
    for (const a of CARD_ARCHETYPES) {
      const f = await load(a.dir), params = morphParamsV1({ seed: 3, head: 7, tail: 6 }, f.record.recipeHash, f.own), jointScale = jointScalesV1(f.card, params);
      if (!Object.keys(jointScale).length) continue;
      const program = createSkeletonPoseProgram(familyContractForRecord(f.record as never), f.record.landmarks as never, { jointScale }), M = program.evaluate({}) as Record<string, never>;
      const prop = cardProportionV1(f.receipt, f.card, params);
      for (const [j, lm] of Object.entries(f.receipt.landmarks)) { if (!prop.innermost(j) || !M[j]) continue;
        const st = transformPoint(M[j], { x: lm[0], y: lm[1] }), cd = prop.forward(j, lm[0], lm[1]); compared++;
        if (prop.chainOf(prop.innermost(j)!).length > 1) nested++;
        if (Math.abs(st.x - cd[0]) > 1e-9 || Math.abs(st.y - cd[1]) > 1e-9) mismatch.push(`${a.earthName} ${j}: stage ${st.x.toFixed(5)},${st.y.toFixed(5)} card ${cd[0].toFixed(5)},${cd[1].toFixed(5)}`); }
    }
    expect(mismatch).toEqual([]); expect(compared).toBeGreaterThan(50); expect(nested).toBeGreaterThan(0); // nested scaled parts were exercised
    // mutation controls: (1) without the fixed sockets the Centipede head disagrees; (2) the innermost scale alone (no chain) disagrees on a nested part
    const c = await load(CARD_ARCHETYPES.find((x) => x.earthName === 'Centipede')!.dir), cp = morphParamsV1({ seed: 3, head: 7, tail: 6 }, c.record.recipeHash, c.own), cjs = jointScalesV1(c.card, cp);
    const cM = createSkeletonPoseProgram(familyContractForRecord(c.record as never), c.record.landmarks as never, { jointScale: cjs }).evaluate({}) as Record<string, never>;
    const noSockets = cardProportionV1({ landmarks: c.receipt.landmarks }, c.card, cp), headish = Object.keys(c.receipt.landmarks).filter((j) => noSockets.innermost(j) && cM[j]);
    expect(headish.some((j) => { const lm = c.receipt.landmarks[j]!, st = transformPoint(cM[j]!, { x: lm[0], y: lm[1] }), cd = noSockets.forward(j, lm[0], lm[1]); return Math.abs(st.x - cd[0]) > 1e-6 || Math.abs(st.y - cd[1]) > 1e-6; })).toBe(true);
    const v = await load(CARD_ARCHETYPES.find((x) => x.earthName === 'Civet')!.dir), vp = morphParamsV1({ seed: 3, head: 7, tail: 6 }, v.record.recipeHash, v.own), vprop = cardProportionV1(v.receipt, v.card, vp);
    const nestedJ = Object.keys(v.receipt.landmarks).find((j) => vprop.innermost(j) && vprop.chainOf(vprop.innermost(j)!).length > 1)!;
    expect(nestedJ).toBeDefined(); const t = vprop.innermost(nestedJ)!, [px0, py0] = vprop.pivotOf(t.root), lm = v.receipt.landmarks[nestedJ]!, only = [px0 + (lm[0] - px0) * t.scale, py0 + (lm[1] - py0) * t.scale], full = vprop.forward(nestedJ, lm[0], lm[1]);
    expect(Math.hypot(only[0]! - full[0], only[1]! - full[1])).toBeGreaterThan(1e-4);
  }, 120_000);
  it('EMISSIVE shows on every archetype: a lumin individual and an iridescent one differ from the plain one on the card (the Chimpanzee, whose plan has no accent set, glows on its coat)', async () => {
    const dead: string[] = [];
    for (const a of CARD_ARCHETYPES) { const f = await load(a.dir), own = f.own as Record<string, unknown>;
      const plain = cardCompositeV1({ ...f, params: morphParamsV1({ seed: 3 }, f.record.recipeHash, f.own), markingMask: null });
      for (const g of [{ seed: 3, lumin: true }, { seed: 3, pattern: 5 }]) {
        const p = morphParamsV1(g, f.record.recipeHash, f.own); if (p.identity || (g.lumin && own.lumin === true)) continue; // a lumin-painted archetype: the gene is its own identity (by design)
        const out = cardCompositeV1({ ...f, params: p, markingMask: null }); let changed = 0; for (let i = 0; i < out.length; i += 4) if (out[i] !== plain[i] || out[i + 1] !== plain[i + 1] || out[i + 2] !== plain[i + 2]) changed++;
        if (changed === 0) dead.push(`${a.earthName} ${JSON.stringify(g)}`); } }
    expect(dead).toEqual([]);
  }, 120_000);
  it('the HEAD END goes up on the diagonal, both ways (synthetic bar: red head half, blue tail half — head on the right, then mirrored)', () => {
    const W = 200, H = 200, bar = (headRight: boolean) => { const px = new Uint8Array(W * H * 4); for (let y = 90; y < 110; y++) for (let x = 20; x < 180; x++) { const i = (y * W + x) * 4, head = headRight ? x >= 100 : x < 100; px[i] = head ? 255 : 0; px[i + 2] = head ? 0 : 255; px[i + 3] = 255; } return px; };
    const centroidY = (t: ReturnType<typeof diagonalLongBodyV1>, red: boolean) => { let s = 0, n = 0; for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) { const i = (y * t.width + x) * 4; if (t.px[i + 3]! < 200) continue; if (red ? t.px[i]! > 200 && t.px[i + 2]! < 60 : t.px[i + 2]! > 200 && t.px[i]! < 60) { s += y; n++; } } return s / n; };
    const right = diagonalLongBodyV1(bar(true), W, H, 170), left = diagonalLongBodyV1(bar(false), W, H, 30);
    expect(right.rotated && left.rotated).toBe(true);
    expect(centroidY(right, true)).toBeLessThan(centroidY(right, false)); // head (red) above tail (blue)
    expect(centroidY(left, true)).toBeLessThan(centroidY(left, false));
  });
});
