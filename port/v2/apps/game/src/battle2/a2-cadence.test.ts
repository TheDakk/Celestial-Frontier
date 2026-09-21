// A2 (Nick, 2026-09-22): the approach WALKS whole gait cycles with feet planted in the arena, and the attack's
// lunge covers the remaining run-up by impact. Outcome tests on the real stage with Codex's crab rig as attacker,
// on the E1 harness (same factory, same transcript-derived plan inputs).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { compileBodyCard } from '../motion/body-card.js';
import { composeArena } from './arena.js';
import { APPROACH_CADENCE_CAP_MS, type TurnAttack, type TurnPlanInput } from './choreography.js';
import { createPortraitRig } from './fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from './fixture-rig.js';
import { REPO_ROOT, loadFit } from './parts-rig.fixtures.js';
import { BattleStage, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; scaleSet: [number, number] = [1, 1]; anchorSet: [number, number] = [0, 0]; text = ''; ops: string[] = [];
  readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: (x: number, y: number) => { this.anchorSet = [x, y]; } };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); }
  clear() { this.ops.push('clear'); } rect(x: number, y: number, w: number, h: number) { this.ops.push(`rect ${[x, y, w, h].map((v) => Math.round(v)).join(',')}`); } fill() { this.ops.push('fill'); }
  destroy() { this.destroyed = true; } }
const stageFactory = () => { const nodes: Node[] = []; const mk = () => { const n = new Node(); nodes.push(n); return n; };
  const f: BattleStageFactory = { container: mk, sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() }; return { f, nodes }; };
const rigFactory = { container: (): RigContainerLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() };
const portraitRig = (): BattleRigV1 => createPortraitRig({ templateId: 'portrait', recipeHash: 'thumb:platypus', cutout: { width: 132, height: 132 }, alphaBox: { x: 20, y: 30, width: 90, height: 96 }, factory: rigFactory });
const FRAME = { width: 1024, height: 576 };
const TEX: EffectTextureLike = { width: 1672, height: 941 };
const layout = composeArena({ id: 'e1', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const contextFor = (name: string, mass: number, card: ReturnType<typeof compileBodyCard> | null, attackFor?: TurnOutcomeContext['attackFor'], over: Partial<TurnOutcomeContext> = {}): TurnOutcomeContext => ({
  A: { side: 'A', name, mass, card, theme: 'wild', seed: 1 }, B: { side: 'B', name: 'Platypus', mass: 0.85, card: null, theme: 'tide', seed: 2 },
  arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: 593405465, anchorsForTheme: (t) => (t === 'wild' ? wild() : null), readyMs: 800, commandMs: 300,
  ...(attackFor ? { attackFor } : {}), ...over,
});
const contextTarget = (name: string, mass: number, card: ReturnType<typeof compileBodyCard>, over: Partial<TurnOutcomeContext> = {}): TurnOutcomeContext => ({
  A: { side: 'A', name: 'Platypus', mass: 0.85, card: null, theme: 'wild', seed: 2 }, B: { side: 'B', name, mass, card, theme: 'tide', seed: 1 },
  arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: 593405465, anchorsForTheme: (t) => (t === 'wild' ? wild() : null), readyMs: 800, commandMs: 300, ...over,
});
const holderOf = (nodes: Node[], rig: BattleRigV1): Node => { const h = nodes.find((n) => n.children.includes(rig.root as object)); if (!h) throw new Error('rig holder not on stage'); return h; };
const turnOf = (ctx: TurnOutcomeContext, row: Record<string, unknown>, ordinal = 0): TurnPlanInput => { const t = turnPlanInputFromTranscriptEvent(row, ctx, ordinal); if (t.kind !== 'turn') throw new Error(t.reason); return t.input; };

describe('A2 cadence — walk whole cycles planted, lunge the rest', () => {
  const CASES = [['crab', 'leg0NearFoot'], ['coconut-crab', 'leg0NearFoot'], ['freshwater-crab', 'leg0NearFoot'], ['mud-crab', 'leg0NearFoot'], ['vent-crab', 'leg0NearFoot'], ['civet', 'hindNearPaw']] as const;
  for (const [fit, footJoint] of CASES) for (const side of ['left', 'right'] as const) it(`${fit} attacker from the ${side}: whole gait cycles ≤ the cap, stance feet fixed in the arena per stance window, zero refusals, run-up reached by impact`, async () => {
    const { rig, card } = await loadFit(fit);
    expect(rig.stanceReach).toBeDefined(); expect(rig.stanceReach!).toBeGreaterThan(0.01); // measured, positive: mud 0.040 and vent 0.032 body lengths per stance are real (far legs folded)
    const attackFor: TurnOutcomeContext['attackFor'] = (side, ordinal) => { if (side !== 'A') return null; const r = compileAnatomyAttack(card, 'ground', ordinal); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.contactJoint } as TurnAttack; };
    const { f, nodes } = stageFactory(); let now = 0;
    const rigs = side === 'left' ? { left: rig, right: portraitRig() } : { left: portraitRig(), right: rig };
    const masses = side === 'left' ? { left: card.massClass.multiplier, right: 0.85 } : { left: 0.85, right: card.massClass.multiplier };
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs, masses });
    const ctx = side === 'left' ? contextFor('X', card.massClass.multiplier, card, attackFor) : contextTarget('X', card.massClass.multiplier, card, { attackFor: (s, o) => (s === 'B' ? attackFor('A', o) : null) });
    const input = turnOf(ctx, side === 'left' ? { side: 'A', an: 'X', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 } : { side: 'B', an: 'X', dn: 'Platypus', dmg: 7, crit: false, hpA: 20, hpB: 30 });
    const plan = stage.play(input);
    expect(plan.cadence).not.toBeNull();
    const cd = plan.cadence!, b = plan.beats;
    expect(b.actionStart - b.commandEnd).toBeCloseTo(cd.cycles * cd.gaitMs, 9);
    expect(cd.cycles * cd.gaitMs).toBeLessThanOrEqual(APPROACH_CADENCE_CAP_MS);
    expect(Math.abs(cd.perCycle)).toBeLessThanOrEqual(2 * rig.stanceReach! + 1e-12); expect(Math.abs(cd.perCycle) * cd.cycles * cd.bodyLength).toBeCloseTo(Math.abs(cd.walked), 12);
    const holder = holderOf(nodes, rig);
    const windows: number[][] = []; let cur: number[] | null = null;
    for (let ms = b.commandEnd; ms < b.actionStart; ms += cd.gaitMs / 40) {
      now = ms; stage.tick();
      const within = ((ms - b.commandEnd) / cd.gaitMs) % 1, stance = within >= 0.5; // leg0Near (crab) and hindNear (quadruped) are contract group 1: stance in the second half-cycle
      const foot = rig.jointPosition(footJoint)!, world = holder.x + holder.scaleSet[0] * foot.x; // holder px + SIGNED scale (a right-facing rig is mirrored) × display units (cutout 1×1)
      if (stance) { if (!cur) { cur = []; windows.push(cur); } cur.push(world); } else cur = null;
      if (process.env.A2_DEBUG && Math.round((ms - b.commandEnd) / (cd.gaitMs / 40)) % 5 === 0) console.log(JSON.stringify({ ms: +ms.toFixed(0), within: +within.toFixed(3), stance, holderX: +holder.x.toFixed(2), footX: +foot.x.toFixed(4), world: +world.toFixed(2), refusals: rig.refusals(), disp: +((stage as any).lastSample?.attacker?.context?.stageDisplacement ?? NaN).toFixed(4) }));
    }
    expect(windows.length).toBe(cd.cycles);
    for (const w of windows) { expect(w.length).toBeGreaterThanOrEqual(10); expect(Math.max(...w) - Math.min(...w), `stance window of ${w.length}`).toBeLessThan(0.5); }
    const standX = layout.stands[side].x * FRAME.width;
    now = b.commandEnd + cd.cycles * cd.gaitMs - 1e-6; stage.tick(); expect(Math.abs((holder.x - standX) / FRAME.width - cd.walked)).toBeLessThan(Math.abs(cd.walked) * 0.05 + 1e-9);
    now = b.impactAt; stage.tick(); expect(Math.abs((holder.x - standX) / FRAME.width - plan.runUp)).toBeLessThan(1e-9);
    expect(rig.refusals()).toBe(0);
    rig.dispose();
  }, 60_000);
});
