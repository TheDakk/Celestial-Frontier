/** C156 (Codex's actual-film review, audits/C132_EFFECTS_20261001/native-review-01): the painted effects sat on the stand/ground line (y ≈ 449
 * of 576) while the Civet's jaw — the bite's contact joint — was at y ≈ 315 at impact. OUTCOME tests on the real Civet fit, the real stage
 * (fake Pixi factory), the real choreography and effect schedule: the effect launches at the posed contact joint at the launch beat, lands on
 * the target's body, keeps its timing, falls back with a reason when no joint can be read, and the checks fail on a wrong anchor. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { sampleSchedule } from '../effects/sequencer.js';
import { composeArena } from './arena.js';
import { buildTurnPlan, type TurnAttack, type TurnPlan, type TurnPlanInput } from './choreography.js';
import { createPortraitRig } from './fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from './fixture-rig.js';
import { REPO_ROOT, loadFit } from './parts-rig.fixtures.js';
import { BattleStage, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';

class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; scaleSet: [number, number] = [1, 1]; text = '';
  readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: () => {} };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); }
  clear() {} rect() {} fill() {} destroy() { this.destroyed = true; } }
const stageFactory = () => { const nodes: Node[] = []; const mk = () => { const n = new Node(); nodes.push(n); return n; };
  const f: BattleStageFactory = { container: mk, sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() }; return { f, nodes }; };
const portraitRig = (): BattleRigV1 => createPortraitRig({ templateId: 'portrait', recipeHash: 'thumb:wolf', cutout: { width: 132, height: 132 }, alphaBox: { x: 20, y: 30, width: 90, height: 96 },
  factory: { container: (): RigContainerLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() } });
const FRAME = { width: 1024, height: 576 }, TEX: EffectTextureLike = { width: 1672, height: 941 };
const layout = composeArena({ id: 'c156', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const holderOf = (nodes: Node[], rig: BattleRigV1): Node => { const h = nodes.find((n) => n.children.includes(rig.root as object)); if (!h) throw new Error('rig holder not on stage'); return h; };
const px = (p: { x: number; y: number }) => ({ x: p.x * FRAME.width, y: p.y * FRAME.height });
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

async function civetBite() {
  const { rig, card } = await loadFit('civet');
  const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; const r = compileAnatomyAttack(card, 'ground', ordinal, 'bite'); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; };
  const ctx: TurnOutcomeContext = { A: { side: 'A', name: 'Civet', mass: card.massClass.multiplier, card, theme: 'wild', seed: 1 }, B: { side: 'B', name: 'Wolf', mass: 1, card: null, theme: 'tide', seed: 2 },
    arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: 593405465, anchorsForTheme: (t) => (t === 'wild' ? wild() : null), readyMs: 800, commandMs: 300, attackFor };
  const t = turnPlanInputFromTranscriptEvent({ side: 'A', an: 'Civet', dn: 'Wolf', dmg: 9, crit: false, hpA: 30, hpB: 12 }, ctx, 0); if (t.kind !== 'turn') throw new Error(t.reason);
  const { f, nodes } = stageFactory(); let now = 0;
  const target = portraitRig();
  const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: target }, masses: { left: card.massClass.multiplier, right: 1 } });
  return { rig, card, stage, nodes, input: t.input, setNow: (ms: number) => { now = ms; } };
}
/** The jaw in frame pixels as the stage DRAWS it: the rig's holder (placed by the stage) and the posed joint. */
const drawnJoint = (nodes: Node[], rig: BattleRigV1, joint: string) => { const h = holderOf(nodes, rig), j = rig.jointPosition!(joint)!;
  return { x: h.x + h.scaleSet[0] * (j.x - rig.foot.x * rig.cutout.width), y: h.y + h.scaleSet[1] * (j.y - rig.foot.y * rig.cutout.height) }; };

describe('C156 — the effect launches at the attacking body part and lands on the defender', () => {
  it('Civet bite on the real stage: launch = the posed jaw at the launch beat, impact = the target body centre, travel between them', async () => {
    const { rig, stage, nodes, input, setNow } = await civetBite();
    expect(input.attack?.contactJoint).toBe('jaw');
    setNow(0); const plan = stage.play(input), fx = plan.effect!;
    expect(fx.anchoring?.launch, fx.anchoring?.reason).toBe('contact-joint'); expect(fx.anchoring?.impact).toBe('target-body');
    // independent read: let the stage pose and place the Civet at the launch beat, then read the jaw as drawn
    setNow(plan.beats.actionStart); stage.tick();
    const jaw = drawnJoint(nodes, rig, 'jaw'), launch = px(fx.anchoring!.launchPoint);
    expect(dist(launch, jaw)).toBeLessThan(3);
    expect(dist(px(fx.placement.launch.from), jaw)).toBeLessThan(3);
    // what the player draws: the launch track at its first visible instant sits on the jaw
    const s0 = sampleSchedule(fx.schedule, fx.schedule.tracks[0]!.startMs + 1).tracks[0]!.transform;
    expect(dist(px(s0), jaw)).toBeLessThan(3);
    // the C156 miss: the jaw is far above the ground line the legacy placement used
    expect(layout.groundLineY * FRAME.height - jaw.y).toBeGreaterThan(40);
    // impact on the defender's body centre (box centre x, body centre y)
    const body = { x: stage.centresX().right, y: stage.bodies().right.centreY }, impact = px(fx.placement.impact.from);
    expect(dist(impact, px(body))).toBeLessThan(1);
    const sI = sampleSchedule(fx.schedule, fx.schedule.impactAt + 1).tracks.at(-1)!.transform; expect(dist(px(sI), px(body))).toBeLessThan(1);
    // the travel's span runs from the launch point toward the impact point (cast slides; melee holds the sweep at launch, revealed by alpha)
    expect(fx.placement.standDistance).toBeCloseTo(Math.hypot(body.x - fx.anchoring!.launchPoint.x, body.y - fx.anchoring!.launchPoint.y), 9);
    expect(rig.refusals()).toBe(0);
    stage.dispose();
  }, 180_000);

  it('timing is unchanged: every beat and every effect track time equals the legacy (unanchored) plan', async () => {
    const { rig, stage, input, setNow } = await civetBite();
    setNow(0); const anchored = stage.play(input);
    // the same turn (the stage's filled arena, the attacker as the stage passed it) WITHOUT the anchored contract
    const { effectLaunch: _drop, ...plainArena } = anchored.arena; void _drop;
    const attacker = anchored.cadence ? { ...input.attacker, cadence: { bodyLength: anchored.cadence.bodyLength, stanceReach: rig.stanceReach! } } : input.attacker;
    const plain = buildTurnPlan({ ...input, attacker, arena: plainArena } as TurnPlanInput);
    expect(plain.effect!.anchoring).toBeUndefined();
    const times = (p: TurnPlan) => p.effect!.schedule.tracks.map((t) => [t.phase, t.startMs, t.endMs]);
    expect(times(anchored)).toEqual(times(plain)); expect(anchored.effect!.schedule.impactAt).toBe(plain.effect!.schedule.impactAt);
    for (const k of ['impactAt', 'hitstopEnd', 'flashEnd', 'numbersEnd', 'reactionStart'] as const) expect(anchored.beats[k] - anchored.beats.actionStart).toBeCloseTo(plain.beats[k] - plain.beats.actionStart, 9);
    // negative control: the legacy placement is the reported miss — its launch is far from the drawn jaw
    expect(Math.abs(plain.effect!.placement.launch.from.y - anchored.effect!.anchoring!.launchPoint.y) * FRAME.height).toBeGreaterThan(40);
    stage.dispose();
  }, 180_000);

  it('deterministic: two stages with the same input anchor identically', async () => {
    const a = await civetBite(), b = await civetBite();
    a.setNow(0); b.setNow(0);
    const pa = a.stage.play(a.input), pb = b.stage.play(b.input);
    expect(pa.effect!.anchoring).toEqual(pb.effect!.anchoring); expect(pa.effect!.placement).toEqual(pb.effect!.placement);
    a.stage.dispose(); b.stage.dispose();
  }, 240_000);

  it('fallbacks are labelled: no anatomy attack, or a rig that reports no joints, keeps the legacy launch point with its reason', async () => {
    const { rig, card, input, setNow } = await civetBite();
    // a rig without joint positions (a fixture/portrait-like wrapper of the same parts rig)
    const { jointPosition: _hidden, ...blind } = rig; void _hidden;
    const { f } = stageFactory();
    const stage = new BattleStage({ factory: f, clock: () => 0, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: blind, right: portraitRig() }, masses: { left: card.massClass.multiplier, right: 1 } });
    setNow(0); const p = stage.play(input);
    expect(p.effect!.anchoring?.launch).toBe('fallback'); expect(p.effect!.anchoring?.reason).toMatch(/reports no joint positions/);
    expect(p.effect!.placement.launch.from.x).toBeCloseTo(layout.stands.left.x + p.runUp, 9); expect(p.effect!.placement.launch.from.y).toBeCloseTo(layout.stands.left.y, 9);
    expect(p.effect!.anchoring?.impact).toBe('target-body');
    // no anatomy attack (a portrait attacker)
    const q = stage.play({ ...input, attack: null });
    expect(q.effect!.anchoring?.launch).toBe('fallback'); expect(q.effect!.anchoring?.reason).toMatch(/no anatomy attack/);
    // a direct caller without the anchored contract keeps the legacy placement and no label
    const direct = buildTurnPlan({ ...input, arena: { groundLineY: layout.groundLineY, stands: layout.stands } });
    expect(direct.effect!.anchoring).toBeUndefined(); expect(direct.effect!.placement.impact.from.y).toBeCloseTo(layout.groundLineY, 9);
    stage.dispose();
  }, 180_000);

  it('negative control: a forged launch point is caught by the same jaw check (the check is not vacuous)', async () => {
    const { rig, stage, nodes, input, setNow } = await civetBite();
    setNow(0); const forged = stage.play({ ...input, arena: { ...input.arena, effectLaunch: { point: { x: layout.stands.left.x, y: layout.groundLineY }, reason: 'forged at the stand' } } });
    setNow(forged.beats.actionStart); stage.tick();
    const jaw = drawnJoint(nodes, rig, 'jaw');
    expect(forged.effect!.anchoring?.launch).toBe('contact-joint'); // the label trusts its input; the OUTCOME check does not
    expect(dist(px(forged.effect!.anchoring!.launchPoint), jaw)).toBeGreaterThan(30);
    stage.dispose();
  }, 180_000);
});
