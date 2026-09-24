// D2 G6 (Nick, 2026-09-21: Brown Bear, guardian tier): a guardian rig FILLS the battle screen — the stage scales it
// by `frameFill` (an option of `combatantScale`, not a species branch) when the record carries a `guardian` block.
// Outcome tests on the real stage with Codex's signed bear comparison fit (producer 1ff30009) as attacker and as
// target, on the E1 harness; a crab on the same stage is byte-identical to the mass-class rule.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { GUARDIAN_STANDS, STAND_X, combatantScale, composeArena, type ComposeArenaOptions } from './arena.js';
import type { TurnAttack, TurnPlanInput } from './choreography.js';
import { createPortraitRig } from './fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from './fixture-rig.js';
import { REPO_ROOT, loadFit, loadFitDir } from './parts-rig.fixtures.js';
import type { PartsRig } from './parts-rig.js';
import { BattleStage, COMBATANT_TOP_MARGIN, GUARDIAN_FRAME_FILL, combatantPresentation, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; scaleSet: [number, number] = [1, 1]; anchorSet: [number, number] = [0, 0]; text = ''; ops: string[] = [];
  readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: (x: number, y: number) => { this.anchorSet = [x, y]; } };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); }
  clear() { this.ops.push('clear'); } rect(x: number, y: number, w: number, h: number) { this.ops.push(`rect ${[x, y, w, h].map((v) => Math.round(v)).join(',')}`); } fill() { this.ops.push('fill'); }
  destroy() { this.destroyed = true; } }
const stageFactory = () => { const nodes: Node[] = []; const mk = () => { const n = new Node(); nodes.push(n); return n; };
  const f: BattleStageFactory = { container: mk, sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() }; return { f, nodes }; };
const rigFactory = { container: (): RigContainerLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() };
const portraitRig = (): BattleRigV1 => createPortraitRig({ templateId: 'portrait', recipeHash: 'thumb:platypus', cutout: { width: 132, height: 132 }, alphaBox: { x: 20, y: 30, width: 90, height: 96 }, factory: rigFactory });
const TEX: EffectTextureLike = { width: 1672, height: 941 };
const VIEWPORTS = [{ width: 1024, height: 576 }, { width: 1920, height: 1080 }] as const;
const layoutFor = (frame: { width: number; height: number }, options: ComposeArenaOptions = {}) => composeArena({ id: 'g6', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, frame, options);
const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const BEAR = 'audits/VISION_D2_GUARDIAN_20260921/fit-01/';
const holderOf = (nodes: Node[], rig: BattleRigV1): Node => { const h = nodes.find((n) => n.children.includes(rig.root as object)); if (!h) throw new Error('rig holder not on stage'); return h; };
/** Drawn standing (rest) height of a rig on the stage, in frame px: holder scale × cut-out bounds height × cut-out height. */
const drawnHeight = (holder: Node, rig: BattleRigV1): number => Math.abs(holder.scaleSet[1]) * rig.bounds.height * rig.cutout.height;
/** Landmark extents of a posed rig in frame px (the parts rig's public path): top y, left x, right x. */
const landmarkBox = (holder: Node, rig: PartsRig, joints: readonly string[]) => { let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
  for (const j of joints) { const p = rig.jointPosition(j); if (!p) continue; const x = holder.x + holder.scaleSet[0] * (p.x - rig.foot.x) * rig.cutout.width, y = holder.y + holder.scaleSet[1] * (p.y - rig.foot.y) * rig.cutout.height; if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x; }
  return { top, left, right, bottom }; };
const JOINTS = (record: { landmarks: Record<string, unknown> }) => Object.keys(record.landmarks);
type Ctx = TurnOutcomeContext;
const playTurn = (stage: BattleStage, ctx: Ctx, row: Record<string, unknown>) => { const t = turnPlanInputFromTranscriptEvent(row, ctx, 0); if (t.kind !== 'turn') throw new Error(t.reason); const plan = stage.play(t.input as TurnPlanInput); return plan; };
const attackOf = (card: Parameters<typeof compileAnatomyAttack>[0]): TurnAttack => { const r = compileAnatomyAttack(card, 'ground', 0); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.contactJoint } as TurnAttack; };
const ctxFor = (layout: ReturnType<typeof layoutFor>, attacker: 'A' | 'B', name: string, mass: number, card: Parameters<typeof compileAnatomyAttack>[0]): Ctx => ({
  A: attacker === 'A' ? { side: 'A', name, mass, card, theme: 'wild', seed: 1 } : { side: 'A', name: 'Platypus', mass: 0.85, card: null, theme: 'wild', seed: 2 },
  B: attacker === 'B' ? { side: 'B', name, mass, card, theme: 'tide', seed: 1 } : { side: 'B', name: 'Platypus', mass: 0.85, card: null, theme: 'tide', seed: 2 },
  arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: 593405465, anchorsForTheme: (t) => (t === 'wild' ? wild() : null), readyMs: 800, commandMs: 300,
  attackFor: (s) => (s === attacker ? attackOf(card) : null),
});
const runFull = (stage: BattleStage, plan: ReturnType<BattleStage['play']>, tick: (ms: number) => void) => { for (let ms = 0; ms <= plan.beats.end + 1; ms += 1000 / 60) { tick(ms); stage.tick(); } };

describe('D2 G6 — a guardian fills the frame; everything else is untouched', () => {
  it('the bear record carries the guardian block through the parts rig (desktop-only, 5 ms CPU tier, 60 px bound)', async () => {
    const { rig, record } = await loadFitDir(BEAR);
    expect(rig.guardian).toMatchObject({ desktopOnly: true, cpuP95GateMs: 5, landmarkComparisonBoundPx: 60, requestedMasterSize: 1536, actualMasterSize: 1254 });
    expect((record as { guardian?: unknown }).guardian).toEqual(rig.guardian);
    expect(rig.contactMode).toBe('family'); expect(rig.stanceReach).toBeGreaterThan(0.01);
    // the tallest-pose probe: the bear rears in its claw attack (measured 1.38 × rest); the crab never rises above rest
    expect(rig.tallestHeight! / rig.bounds.height).toBeGreaterThan(1.3); expect(rig.tallestHeight! / rig.bounds.height).toBeLessThan(1.5);
    expect(rig.refusals?.()).toBe(0); // probe refusals are not the stage's
    const crab = await loadFit('crab'); expect(crab.rig.guardian).toBeUndefined(); expect(crab.rig.tallestHeight).toBe(crab.rig.bounds.height);
  });
  for (const frame of VIEWPORTS) for (const side of ['left', 'right'] as const) it(`bear on the ${side} at ${frame.width}×${frame.height}: its tallest pose fills the frame ABOVE ITS STAND (the one presentation rule), the landmarks never leave the frame through an attack AND a victory, zero refusals`, async () => {
    const { rig, card, record } = await loadFitDir(BEAR);
    const layout = layoutFor(frame, { guardianSide: side }); const { f, nodes } = stageFactory(); let now = 0;
    const rigs = side === 'left' ? { left: rig, right: portraitRig() } : { left: portraitRig(), right: rig };
    const masses = side === 'left' ? { left: card.massClass.multiplier, right: 0.85 } : { left: 0.85, right: card.massClass.multiplier };
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs, masses });
    const ctx = ctxFor(layout, side === 'left' ? 'A' : 'B', 'Bear', card.massClass.multiplier, card);
    const plan = playTurn(stage, ctx, side === 'left' ? { side: 'A', an: 'Bear', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 } : { side: 'B', an: 'Bear', dn: 'Platypus', dmg: 7, crit: false, hpA: 20, hpB: 30 });
    // 2026-09-24 (adversarial review): the fill used to size the tallest pose to 0.96 of the WHOLE frame while the bear stands on the ground
    // line, so its victory rear-up left the top — this test played only the attack. The rule now caps the tallest pose inside the frame above
    // its stand; the victory is played below.
    const holder = holderOf(nodes, rig); const target = combatantPresentation(rig, card.massClass.multiplier, frame, layout.stands[side].y).scale * rig.bounds.height * rig.cutout.height;
    let min = Infinity, max = -Infinity, topMin = Infinity; const joints = JOINTS(record);
    let bottomMax = -Infinity;
    runFull(stage, plan, (ms) => { now = ms; const h = drawnHeight(holder, rig); if (h < min) min = h; if (h > max) max = h; const box = landmarkBox(holder, rig, joints), t = box.top; if (t < topMin) topMin = t; if (box.bottom > bottomMax) bottomMax = box.bottom; });
    expect(bottomMax).toBeLessThanOrEqual(frame.height); // standing in the foreground, the feet stay inside the frame too
    expect(min).toBeGreaterThanOrEqual(target * 0.98); expect(max).toBeLessThanOrEqual(target * 1.02);
    expect(target / frame.height).toBeGreaterThan(0.5); // still by far the biggest thing on the stage (a plain combatant is 1/3–1/2 of the frame at most)
    // Nick 2026-09-24: the guardian stands in the foreground (GUARDIAN_STANDS.groundY), which buys back its size (0.55 on the ground line)
    expect(layout.stands[side].y).toBe(GUARDIAN_STANDS.groundY); expect(layout.stands[side === 'left' ? 'right' : 'left'].y).toBe(0.78);
    expect(target / frame.height).toBeGreaterThan(0.66);
    console.log(JSON.stringify({ bearRestFillOfFrame: +(target / frame.height).toFixed(3), side, frame: `${frame.width}x${frame.height}` }));
    expect(topMin).toBeGreaterThanOrEqual(frame.height * COMBATANT_TOP_MARGIN - frame.height * 0.01); // the rearing head stays inside the frame (1 % for blend samples between the probe's 13)
    expect(drawnHeight(holder, rig)).toBeCloseTo(target, 9);
    // the VICTORY rear-up (the pose that left the frame): the bear wins a second turn
    let vTop = Infinity; now = 0; const win = playTurn(stage, ctx, side === 'left' ? { side: 'A', an: 'Bear', dn: 'Platypus', dmg: 20, crit: true, hpA: 30, hpB: 0 } : { side: 'B', an: 'Bear', dn: 'Platypus', dmg: 20, crit: true, hpA: 0, hpB: 30 });
    runFull(stage, win, (ms) => { now = ms; const t = landmarkBox(holder, rig, joints).top; if (t < vTop) vTop = t; });
    expect(vTop).toBeGreaterThanOrEqual(frame.height * COMBATANT_TOP_MARGIN - frame.height * 0.01);
    expect(rig.refusals?.() ?? 0).toBe(0);
  });
  for (const frame of VIEWPORTS) it(`crab (no guardian block) at ${frame.width}×${frame.height}: holder scale byte-identical to the mass-class rule; the bear beside it takes the one presentation rule`, async () => {
    const crab = await loadFit('crab'), bear = await loadFitDir(BEAR);
    const layout = layoutFor(frame); const { f, nodes } = stageFactory(); let now = 0;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: crab.rig, right: bear.rig }, masses: { left: crab.card.massClass.multiplier, right: bear.card.massClass.multiplier } });
    const ctx = ctxFor(layout, 'A', 'Crab', crab.card.massClass.multiplier, crab.card);
    const plan = playTurn(stage, ctx, { side: 'A', an: 'Crab', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 });
    runFull(stage, plan, (ms) => { now = ms; });
    const hc = holderOf(nodes, crab.rig), hb = holderOf(nodes, bear.rig);
    expect(hc.scaleSet[1]).toBe(combatantScale(crab.rig.bounds, crab.rig.cutout.height, crab.card.massClass.multiplier, frame.height).scale);
    expect(hc.scaleSet[1]).not.toBe(combatantScale(crab.rig.bounds, crab.rig.cutout.height, crab.card.massClass.multiplier, frame.height, { frameFill: GUARDIAN_FRAME_FILL }).scale);
    expect(drawnHeight(hb, bear.rig) / frame.height).toBeCloseTo(combatantPresentation(bear.rig, bear.card.massClass.multiplier, frame, layout.stands.right.y).scale * bear.rig.bounds.height * bear.rig.cutout.height / frame.height, 9);
    expect(drawnHeight(hc, crab.rig) / frame.height).toBeLessThan(0.5 + 1e-9);
    expect(crab.rig.refusals?.() ?? 0).toBe(0); expect(bear.rig.refusals?.() ?? 0).toBe(0);
  });
  it('guardian stands: with the bear on the left the stands move to 0.30 / 0.82 (mirrored on the right) and the bear\'s landmarks clear the crab\'s at rest; without a guardian the stands are the equal thirds', async () => {
    const crab = await loadFit('crab'), bear = await loadFitDir(BEAR); const frame = VIEWPORTS[0];
    expect(layoutFor(frame).stands.left.x).toBe(STAND_X.left); expect(layoutFor(frame).stands.right.x).toBe(STAND_X.right);
    expect(layoutFor(frame, { guardianSide: 'left' }).stands).toMatchObject({ left: { x: GUARDIAN_STANDS.guardian }, right: { x: GUARDIAN_STANDS.opponent } });
    expect(layoutFor(frame, { guardianSide: 'right' }).stands).toMatchObject({ left: { x: 1 - GUARDIAN_STANDS.opponent }, right: { x: 1 - GUARDIAN_STANDS.guardian } });
    for (const side of ['left', 'right'] as const) {
      const layout = layoutFor(frame, { guardianSide: side }); const { f, nodes } = stageFactory(); let now = 0;
      const rigs = side === 'left' ? { left: bear.rig, right: crab.rig } : { left: crab.rig, right: bear.rig };
      const masses = side === 'left' ? { left: bear.card.massClass.multiplier, right: crab.card.massClass.multiplier } : { left: crab.card.massClass.multiplier, right: bear.card.massClass.multiplier };
      const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs, masses });
      const plan = playTurn(stage, ctxFor(layout, side === 'left' ? 'A' : 'B', 'Bear', bear.card.massClass.multiplier, bear.card), side === 'left' ? { side: 'A', an: 'Bear', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 } : { side: 'B', an: 'Bear', dn: 'Platypus', dmg: 7, crit: false, hpA: 20, hpB: 30 });
      now = plan.beats.commandEnd - 1; stage.tick(); // at the stands, before the approach
      const hb = holderOf(nodes, bear.rig), hc = holderOf(nodes, crab.rig), bb = landmarkBox(hb, bear.rig, JOINTS(bear.record)), cb = landmarkBox(hc, crab.rig, JOINTS(crab.record));
      if (side === 'left') expect(bb.right).toBeLessThan(cb.left); else expect(bb.left).toBeGreaterThan(cb.right);
      expect(bb.left).toBeGreaterThanOrEqual(-frame.width * 0.02); expect(bb.right).toBeLessThanOrEqual(frame.width * 1.02); // the guardian stays inside the frame at its stand
      runFull(stage, plan, (ms) => { now = ms; }); expect(bear.rig.refusals?.() ?? 0).toBe(0); expect(crab.rig.refusals?.() ?? 0).toBe(0);
    }
  });
  it('MEASUREMENT (not a gate): the bear under OBSERVED painted supports through the same turn — Codex\'s static sweep refuses 15/20 rows at residual 0.254–0.269 px vs 0.25; the rest-support parts rig is what the stage uses', async () => {
    const { rig, card } = await loadFitDir(BEAR, 'family', 'observed');
    const layout = layoutFor(VIEWPORTS[0]); const { f } = stageFactory(); let now = 0;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: card.massClass.multiplier, right: 0.85 } });
    const plan = playTurn(stage, ctxFor(layout, 'A', 'Bear', card.massClass.multiplier, card), { side: 'A', an: 'Bear', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 });
    let samples = 0; runFull(stage, plan, (ms) => { now = ms; samples++; });
    console.log(JSON.stringify({ bearObservedSupports: { samples, refusals: rig.refusals?.() ?? 0, stanceReach: rig.stanceReach } }));
    expect(samples).toBeGreaterThan(100);
  });
});
