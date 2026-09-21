// D2 G6 (Nick, 2026-09-21: Brown Bear, guardian tier): a guardian rig FILLS the battle screen — the stage scales it
// by `frameFill` (an option of `combatantScale`, not a species branch) when the record carries a `guardian` block.
// Outcome tests on the real stage with Codex's signed bear comparison fit (producer 1ff30009) as attacker and as
// target, on the E1 harness; a crab on the same stage is byte-identical to the mass-class rule.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { combatantScale, composeArena } from './arena.js';
import type { TurnAttack, TurnPlanInput } from './choreography.js';
import { createPortraitRig } from './fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from './fixture-rig.js';
import { REPO_ROOT, loadFit, loadFitDir } from './parts-rig.fixtures.js';
import { BattleStage, GUARDIAN_FRAME_FILL, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';
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
const layoutFor = (frame: { width: number; height: number }) => composeArena({ id: 'g6', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, frame);
const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const BEAR = 'audits/VISION_D2_GUARDIAN_20260921/fit-01/';
const holderOf = (nodes: Node[], rig: BattleRigV1): Node => { const h = nodes.find((n) => n.children.includes(rig.root as object)); if (!h) throw new Error('rig holder not on stage'); return h; };
/** Drawn standing height of a rig on the stage, in frame px: holder scale × cut-out bounds height × cut-out height. */
const drawnHeight = (holder: Node, rig: BattleRigV1): number => Math.abs(holder.scaleSet[1]) * rig.bounds.height * rig.cutout.height;
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
    const crab = await loadFit('crab'); expect(crab.rig.guardian).toBeUndefined();
  });
  for (const frame of VIEWPORTS) for (const side of ['left', 'right'] as const) it(`bear on the ${side} at ${frame.width}×${frame.height}: drawn height within 2 % of ${GUARDIAN_FRAME_FILL} × frame through a whole turn, zero refusals`, async () => {
    const { rig, card } = await loadFitDir(BEAR);
    const layout = layoutFor(frame); const { f, nodes } = stageFactory(); let now = 0;
    const rigs = side === 'left' ? { left: rig, right: portraitRig() } : { left: portraitRig(), right: rig };
    const masses = side === 'left' ? { left: card.massClass.multiplier, right: 0.85 } : { left: 0.85, right: card.massClass.multiplier };
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs, masses });
    const ctx = ctxFor(layout, side === 'left' ? 'A' : 'B', 'Bear', card.massClass.multiplier, card);
    const plan = playTurn(stage, ctx, side === 'left' ? { side: 'A', an: 'Bear', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 } : { side: 'B', an: 'Bear', dn: 'Platypus', dmg: 7, crit: false, hpA: 20, hpB: 30 });
    const holder = holderOf(nodes, rig); const target = GUARDIAN_FRAME_FILL * frame.height;
    let min = Infinity, max = -Infinity;
    runFull(stage, plan, (ms) => { now = ms; const h = drawnHeight(holder, rig); if (h < min) min = h; if (h > max) max = h; });
    expect(min).toBeGreaterThanOrEqual(target * 0.98); expect(max).toBeLessThanOrEqual(target * 1.02);
    expect(drawnHeight(holder, rig)).toBeCloseTo(combatantScale(rig.bounds, rig.cutout.height, card.massClass.multiplier, frame.height, { frameFill: GUARDIAN_FRAME_FILL }).heightPx, 9);
    expect(rig.refusals?.() ?? 0).toBe(0);
  });
  for (const frame of VIEWPORTS) it(`crab (no guardian block) at ${frame.width}×${frame.height}: holder scale byte-identical to the mass-class rule; the bear beside it is ${GUARDIAN_FRAME_FILL} of the frame`, async () => {
    const crab = await loadFit('crab'), bear = await loadFitDir(BEAR);
    const layout = layoutFor(frame); const { f, nodes } = stageFactory(); let now = 0;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: crab.rig, right: bear.rig }, masses: { left: crab.card.massClass.multiplier, right: bear.card.massClass.multiplier } });
    const ctx = ctxFor(layout, 'A', 'Crab', crab.card.massClass.multiplier, crab.card);
    const plan = playTurn(stage, ctx, { side: 'A', an: 'Crab', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 });
    runFull(stage, plan, (ms) => { now = ms; });
    const hc = holderOf(nodes, crab.rig), hb = holderOf(nodes, bear.rig);
    expect(hc.scaleSet[1]).toBe(combatantScale(crab.rig.bounds, crab.rig.cutout.height, crab.card.massClass.multiplier, frame.height).scale);
    expect(hc.scaleSet[1]).not.toBe(combatantScale(crab.rig.bounds, crab.rig.cutout.height, crab.card.massClass.multiplier, frame.height, { frameFill: GUARDIAN_FRAME_FILL }).scale);
    expect(drawnHeight(hb, bear.rig) / frame.height).toBeCloseTo(GUARDIAN_FRAME_FILL, 9);
    expect(drawnHeight(hc, crab.rig) / frame.height).toBeLessThan(0.5 + 1e-9);
    expect(crab.rig.refusals?.() ?? 0).toBe(0); expect(bear.rig.refusals?.() ?? 0).toBe(0);
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
