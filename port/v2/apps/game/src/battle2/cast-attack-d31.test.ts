/** D31 (Dakk, 2026-10-02): limbless / sessile families fight with a CAST attack. OUTCOME tests on the three real C186 fits
 * (Earthworm annelid, Sponge sessile-filter, Banana Slug gastropod) through the real transcript adapter, the real stage
 * (fake Pixi factory), the real choreography and the real effect schedule — the same path the C186 films threw on
 * (`motion: no admitted <family> melee for weapons []`). Every check below was negative-controlled (audits/CAST_ATTACK_D31_20261002). */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { SPECIALIZED_TEMPLATES } from '../../../../tools/creature-animation/specialized-templates.mjs';
import { familyContractForRecord } from '../../../../tools/creature-animation/family-contracts.mjs';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { sampleSchedule } from '../effects/sequencer.js';
import { compileBodyCard, type BodyCard, type ResolvedAnatomyRecord } from '../motion/body-card.js';
import { CAST_ATTACK_FAMILIES, CAST_ATTACK_NOTE, castAttackAction, castAttackOf } from '../motion/cast-attack.js';
import { actionsFor } from '../motion/family-actions.js';
import { buildTimeline, sampleTimeline, type MotionTimeline } from '../motion/timeline.js';
import { phaseDurations, scaleMs, MASS_CLASS, type MassClassName } from '../motion/timing.js';
import { composeArena } from './arena.js';
import { buildTurnPlan, contextOf, sampleClip, type TurnAttack, type TurnPlanInput } from './choreography.js';
import { createPortraitRig } from './fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from './fixture-rig.js';
import { FITS, REPO_ROOT, alphaBoxOf, loadFit, loadFitDir } from './parts-rig.fixtures.js';
import { BattleStage, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';

const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(bytes: Buffer): { width: number; height: number; data: Uint8Array } } } };
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; scaleSet: [number, number] = [1, 1]; text = '';
  readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: () => {} };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); }
  clear() {} rect() {} fill() {} destroy() { this.destroyed = true; } }
const stageFactory = () => { const nodes: Node[] = []; const mk = () => { const n = new Node(); nodes.push(n); return n; };
  const f: BattleStageFactory = { container: mk, sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() }; return { f, nodes }; };
const portraitRig = (): BattleRigV1 => createPortraitRig({ templateId: 'portrait', recipeHash: 'thumb:wolf', cutout: { width: 132, height: 132 }, alphaBox: { x: 20, y: 30, width: 90, height: 96 },
  factory: { container: (): RigContainerLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() } });
const FRAME = { width: 1024, height: 576 }, TEX: EffectTextureLike = { width: 1672, height: 941 };
const layout = composeArena({ id: 'd31', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const holderOf = (nodes: Node[], rig: BattleRigV1): Node => { const h = nodes.find((n) => n.children.includes(rig.root as object)); if (!h) throw new Error('rig holder not on stage'); return h; };
const px = (p: { x: number; y: number }) => ({ x: p.x * FRAME.width, y: p.y * FRAME.height });
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const drawnJoint = (nodes: Node[], rig: BattleRigV1, joint: string) => { const h = holderOf(nodes, rig), j = rig.jointPosition!(joint)!;
  return { x: h.x + h.scaleSet[0] * (j.x - rig.foot.x * rig.cutout.width), y: h.y + h.scaleSet[1] * (j.y - rig.foot.y * rig.cutout.height) }; };

const DIR = (id: string) => `audits/C186_SPECIALIZED_REFERENCES_20261002/${id}/fit01/`;
const SUBJECTS = [
  { id: '01-earthworm-direct', family: 'annelid', emitter: null, launch: 'body-centre' },
  { id: '02-sponge-direct', family: 'sessile-filter', emitter: 'aperture', launch: 'cast-emitter' },
  { id: '04-banana-slug-visible-mouth', family: 'gastropod', emitter: 'mouth', launch: 'cast-emitter' },
] as const;
/** The C186 film path: the runner's attackFor (a refusal is null) and a melee theme (wild), the case that threw. */
async function d31Turn(id: string, theme = 'wild') {
  const { rig, card } = await loadFitDir(DIR(id), undefined, 'observed');
  const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; try { const r = compileAnatomyAttack(card, 'ground', ordinal); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; } catch { return null; } };
  const name = card.identity.earthName ?? id;
  const ctx: TurnOutcomeContext = { A: { side: 'A', name, mass: card.massClass.multiplier, card, theme, seed: 1 }, B: { side: 'B', name: 'Wolf', mass: 1, card: null, theme: 'tide', seed: 2 },
    arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: 593405465, anchorsForTheme: (t) => (t === theme ? wild() : null), readyMs: 800, commandMs: 300, attackFor };
  const t = turnPlanInputFromTranscriptEvent({ side: 'A', an: name, dn: 'Wolf', dmg: 9, crit: false, hpA: 30, hpB: 12 }, ctx, 0); if (t.kind !== 'turn') throw new Error(t.reason);
  const { f, nodes } = stageFactory(); let now = 0;
  const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: card.massClass.multiplier, right: 1 } });
  return { rig, card, stage, nodes, input: t.input, setNow: (ms: number) => { now = ms; } };
}
/** The attacker's painted box centre as DRAWN, from the keyed alpha (independent of the stage's centresX/bodies). */
function drawnBoxCentre(id: string, nodes: Node[], rig: BattleRigV1) {
  const keyed = PNG.sync.read(readFileSync(new URL(DIR(id) + 'parts/keyed.png', REPO_ROOT))), box = alphaBoxOf(keyed.data, keyed.width, keyed.height), h = holderOf(nodes, rig);
  const cx = (box.x + box.width / 2) * (rig.cutout.width / keyed.width), cy = (box.y + box.height / 2) * (rig.cutout.height / keyed.height);
  return { x: h.x + h.scaleSet[0] * (cx - rig.foot.x * rig.cutout.width), y: h.y + h.scaleSet[1] * (cy - rig.foot.y * rig.cutout.height) };
}
const withMass = (card: BodyCard, name: MassClassName): BodyCard => ({ ...card, massClass: { name, multiplier: MASS_CLASS[name] } });

describe('D31 — limbless / sessile families cast', () => {
  for (const s of SUBJECTS) {
    it(`${s.id}: the C186 turn compiles with a cast (no melee lookup), outcome untouched, effect from ${s.launch}`, async () => {
      const { rig, card, stage, nodes, input, setNow } = await d31Turn(s.id);
      // the refusal the films reproduced still holds — no melee is invented
      expect(() => buildTimeline(card, 'melee', 1)).toThrow(`no admitted ${s.family} melee`);
      expect(input.delivery).toBe('melee'); expect(input.attack).toBeNull();
      const cast = castAttackOf(card)!; expect(cast.family).toBe(s.family); expect(cast.emitter).toBe(s.emitter);
      setNow(0); const plan = stage.play(input);
      expect(plan.delivery).toBe('cast'); expect(plan.castAttack).toEqual(cast);
      const action = plan.clips.attacker.action; if (action.source !== 'timeline') throw new Error('portrait clip');
      expect(action.timeline.actionId).toBe('cast'); expect(action.timeline.notes).toContain(CAST_ATTACK_NOTE);
      // outcome, damage and number are the transcript's
      expect(plan.outcome).toBe('hit'); expect(plan.number.text).toBe('9'); expect(plan.targetFaints).toBe(false);
      // timing: impact after rise + hold + release, each scaled by the attacker's mass (kit §5)
      const m = card.massClass.multiplier;
      expect(plan.beats.impactAt - plan.beats.actionStart).toBeCloseTo(scaleMs(180, m) + scaleMs(120, m) + scaleMs(90, m), 9);
      expect(action.timeline.phases).toEqual(phaseDurations('cast', m));
      // launch: the declared emitter / the painted body centre, as DRAWN at the launch beat
      const fx = plan.effect!; expect(fx.anchoring?.launch, fx.anchoring?.reason).toBe(s.launch); expect(fx.anchoring?.impact).toBe('target-body');
      expect(fx.anchoring?.reason).toMatch(/D31 cast/);
      setNow(plan.beats.actionStart); stage.tick();
      const at = s.emitter ? drawnJoint(nodes, rig, s.emitter) : drawnBoxCentre(s.id, nodes, rig);
      expect(dist(px(fx.anchoring!.launchPoint), at)).toBeLessThan(3);
      const s0 = sampleSchedule(fx.schedule, fx.schedule.tracks[0]!.startMs + 1).tracks[0]!.transform; expect(dist(px(s0), at)).toBeLessThan(3);
      // a cast travels: the travel track slides from the body to the target (melee would hold it at launch)
      const body = { x: stage.centresX().right, y: stage.bodies().right.centreY };
      expect(dist(px(fx.placement.impact.from), px(body))).toBeLessThan(1);
      expect(fx.placement.travel.some((p) => dist(px(p.from), px(p.to)) > 50)).toBe(true);
      expect(rig.refusals()).toBe(0);
      stage.dispose();
    }, 180_000);
  }

  it('an anchored caster (the sponge) casts from its stand: root and base never leave it through the whole turn; worm and slug still travel', async () => {
    for (const s of SUBJECTS) {
      const { rig, stage, nodes, input, setNow } = await d31Turn(s.id);
      setNow(0); const plan = stage.play(input), anchored = s.family === 'sessile-filter';
      expect(plan.castAttack!.anchored).toBe(anchored);
      let maxDisp = 0, maxDrift = 0; const at0 = { root: { x: 0, y: 0 }, base: { x: 0, y: 0 } };
      for (let i = 0; i <= 200; i++) {
        const ms = (plan.beats.end * i) / 200; setNow(ms); stage.tick();
        maxDisp = Math.max(maxDisp, Math.abs(holderOf(nodes, rig).x - layout.stands.left.x * FRAME.width));
        if (anchored) for (const j of ['root', 'base'] as const) { const d = drawnJoint(nodes, rig, j); if (i === 0) at0[j] = d; else maxDrift = Math.max(maxDrift, dist(d, at0[j])); }
      }
      if (anchored) { expect(plan.runUp).toBe(0); expect(maxDisp).toBeLessThan(0.5); expect(maxDrift).toBeLessThan(0.5); expect(plan.castAttack!.reason).toMatch(/casts from its stand/); }
      else { expect(Math.abs(plan.runUp)).toBeGreaterThan(0.02); expect(maxDisp).toBeGreaterThan(20); }
      stage.dispose();
    }
  }, 240_000);

  it('a cast theme takes the same body launch; a forged stand launch is caught by the same check (not vacuous)', async () => {
    const { rig, stage, nodes, input, setNow } = await d31Turn('04-banana-slug-visible-mouth', 'fire');
    expect(input.delivery).toBe('cast');
    setNow(0); const plan = stage.play(input); expect(plan.delivery).toBe('cast'); expect(plan.effect!.anchoring?.launch).toBe('cast-emitter');
    setNow(plan.beats.actionStart); stage.tick(); expect(dist(px(plan.effect!.anchoring!.launchPoint), drawnJoint(nodes, rig, 'mouth'))).toBeLessThan(3);
    const w = await d31Turn('04-banana-slug-visible-mouth');
    w.setNow(0); const forged = w.stage.play({ ...w.input, arena: { ...w.input.arena, effectLaunch: { point: { x: layout.stands.left.x, y: layout.groundLineY }, reason: 'forged at the stand' } } });
    w.setNow(forged.beats.actionStart); w.stage.tick();
    expect(dist(px(forged.effect!.anchoring!.launchPoint), drawnJoint(w.nodes, w.rig, 'mouth'))).toBeGreaterThan(12);
    stage.dispose(); w.stage.dispose();
  }, 240_000);

  it('the pulse on the drawn rig: mobile bodies gather UP, the anchored sponge leans away then toward the target; root and limits hold', async () => {
    for (const s of SUBJECTS) {
      const { rig, card } = await loadFitDir(DIR(s.id), undefined, 'observed');
      const tl = buildTimeline(card, 'cast', 1), clip = { source: 'timeline' as const, timeline: tl };
      const end = (phase: string) => tl.phases.slice(0, tl.phases.findIndex(([n]) => n === phase) + 1).reduce((a, [, ms]) => a + ms, 0);
      const pose = (ms: number) => { rig.applyPose(sampleClip(clip, ms), contextOf(clip, ms)); return Object.fromEntries(card.parts.map((p) => [p.joint, rig.jointPosition!(p.joint)!])); };
      const rest = pose(0), hold = pose(end('hold')), release = pose(end('release')), done = pose(tl.durationMs);
      const meanY = (ps: Record<string, { x: number; y: number }>) => Object.values(ps).reduce((a, p) => a + p.y, 0) / Object.keys(ps).length;
      // joint positions are cut-out fractions: at least 1 % of the cut-out, at most 15 % (a pulse, not a lunge)
      if (s.family === 'sessile-filter') { expect(hold.aperture!.x).toBeLessThan(rest.aperture!.x - 0.01); expect(release.aperture!.x).toBeGreaterThan(rest.aperture!.x + 0.005); expect(rest.aperture!.x - hold.aperture!.x).toBeLessThan(0.15); }
      else { expect(meanY(hold)).toBeLessThan(meanY(rest) - 0.01); expect(meanY(rest) - meanY(hold)).toBeLessThan(0.15); }
      for (const j of Object.keys(rest)) expect(dist(done[j]!, rest[j]!)).toBeLessThan(0.002);
      expect(rig.refusals()).toBe(0);
      // every sample inside the template's limits; rigid joints still; an anchored root never moves; gentle (≤ 20° a joint)
      const spec = SPECIALIZED_TEMPLATES[s.family as keyof typeof SPECIALIZED_TEMPLATES];
      for (let i = 0; i <= 120; i++) { const p = sampleTimeline(tl, (tl.durationMs * i) / 120);
        for (const [j, v] of Object.entries(p.joints)) { const l = tl.limitsRad[j]!; expect(v).toBeGreaterThanOrEqual(l.min); expect(v).toBeLessThanOrEqual(l.max); expect(Math.abs(v)).toBeLessThanOrEqual(20 * Math.PI / 180 + 1e-9); }
        for (const j of spec.rigid) if (j in p.joints) expect(p.joints[j]).toBe(0);
        if (spec.anchored) expect([p.root.dx, p.root.dy]).toEqual([0, 0]); else expect(p.root.dx).toBe(0); }
      expect(tl.clamped).toEqual([]);
    }
  }, 180_000);

  it('timing scales with the mass class (kit §5, bounded 0.6x..2.0x) and the material picks the settle (§6)', async () => {
    const { card } = await loadFitDir(DIR('02-sponge-direct'), undefined, 'observed');
    for (const m of ['tiny', 'small', 'medium', 'large', 'huge', 'titanic'] as const) {
      const tl = buildTimeline(withMass(card, m), 'cast', 1);
      expect(tl.phases).toEqual([['rise', 180 * MASS_CLASS[m]], ['hold', 120 * MASS_CLASS[m]], ['release', 90 * MASS_CLASS[m]], ['settle', 220 * MASS_CLASS[m]]].map(([n, v]) => [n, scaleMs(v as number / MASS_CLASS[m], MASS_CLASS[m])]));
    }
    const pulse = (material: BodyCard['materials']['body']) => castAttackAction({ ...card, materials: { ...card.materials, body: material } }, actionsFor(card.template.id)!.cast!);
    expect(pulse('warty').poses).toHaveLength(5);                                   // rise, hold, release, overshoot, rest
    expect(pulse('translucent').poses).toHaveLength(6);                             // two damped wobble cycles
    expect(pulse('plated').poses).toHaveLength(4);                                  // rigid: sharp stop, no overshoot
    const lean = (material: BodyCard['materials']['body']) => Math.abs(pulse(material).poses[2]!.joints.crown ?? 0);
    expect(lean('warty')).toBeGreaterThan(lean('plated'));                          // plated: no stretch through rest
  });

  it('every other family and action is the authored clip, byte-identical; the D31 routing is what removes the throw', async () => {
    const fixture = (id: string): ResolvedAnatomyRecord => { const t = familyContractForRecord({ template: { id } }), landmarks = Object.fromEntries(t.joints.map((j: string, i: number) => [j, [.15 + (i % 8) * .085, .15 + Math.floor(i / 8) * .085]]));
      return { kind: id, habitat: { realm: 'land', source: 'synthetic' }, identity: { speciesVisualKey: 'synthetic/' + id, seed: 51, ownerId: 'd31', earthName: null }, template: { id, version: 1 }, geometry: { cutoutAssetHash: 'synthetic', width: 1024, height: 1024, groundLineY: .85, depthLayers: [{ id: 'far', order: 0 }, { id: 'near', order: 1 }] }, landmarks, materials: { surface: 'smooth skin' }, clipSetId: t.clipSetId, recipeHash: 'synthetic' } as unknown as ResolvedAnatomyRecord; };
    const cards: BodyCard[] = Object.keys(SPECIALIZED_TEMPLATES).map((id) => compileBodyCard(fixture(id)));
    for (const f of Object.keys(FITS)) cards.push((await loadFit(f as keyof typeof FITS)).card);
    let n = 0;
    for (const card of cards) {
      const d31 = card.template.id in CAST_ATTACK_FAMILIES;
      expect(castAttackOf(card) !== null).toBe(d31);
      for (const [id, a] of Object.entries(actionsFor(card.template.id, card.anatomy)!)) {
        n++; const same = castAttackAction(card, a) === a; expect(same, `${card.template.id}/${id}`).toBe(!(d31 && id === 'cast'));
        if (!same) continue; const tl: MotionTimeline = buildTimeline(card, id, 3); expect(tl.notes).not.toContain(CAST_ATTACK_NOTE);
      }
    }
    expect(n).toBeGreaterThan(150);
    // a real non-D31 attacker keeps its delivery and gains no castAttack field (the plan object is unchanged)
    const civet = (await loadFit('civet')).card, arena = { groundLineY: .78, stands: { left: { x: .25, y: .78 }, right: { x: .75, y: .78 } } };
    const base: TurnPlanInput = { seed: 7, attacker: { side: 'left', mass: 1, card: civet, seed: 1, label: 'a' }, target: { side: 'right', mass: 1, card: null, seed: 2, label: 'b' }, delivery: 'melee', theme: 'wild', outcome: 'hit', damage: 9, effect: null, arena, readyMs: 600, commandMs: 300 };
    const p = buildTurnPlan(base); expect(p.delivery).toBe('melee'); expect('castAttack' in p).toBe(false);
    // negative control: the same worm body under a non-D31 specialized family (larva: also no melee) still throws the C186 error
    const { card: worm } = await loadFitDir(DIR('01-earthworm-direct'), undefined, 'observed');
    expect(castAttackOf({ ...worm, template: { ...worm.template, id: 'larva' } })).toBeNull();
    const larva = compileBodyCard(fixture('larva'));
    expect(() => buildTurnPlan({ ...base, attacker: { ...base.attacker, card: larva } })).toThrow('no admitted larva melee');
    // and a D31 record without its emitter landmark falls back to the body centre, labelled
    const { card: sponge } = await loadFitDir(DIR('02-sponge-direct'), undefined, 'observed');
    const blind = castAttackOf({ ...sponge, parts: sponge.parts.filter((q) => q.joint !== 'aperture') })!;
    expect(blind.emitter).toBeNull(); expect(blind.reason).toMatch(/body centre \(no aperture landmark/);
  }, 180_000);
});
