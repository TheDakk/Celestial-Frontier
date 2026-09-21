/** E1.4 — outcome tests (the law: assert the OUTCOME, not the code path). Real Codex rigs (crab-fits-03,
 * candidate-10 Civet), the real stage over a fake Pixi factory, the real choreography, cue plan, effect
 * schedule and anatomy-attack compiler. Beside the app for the pixi.js/@webgpu typing reason noted in
 * parts-rig.test.ts. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import type { ArenaWorld } from '../battle-habitat.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { compileBodyCard, type ResolvedAnatomyRecord } from '../motion/body-card.js';
import { syntheticGenome, syntheticRecord } from '../../../../tools/motion-proof/fixtures.js';
import { composeArena } from './arena.js';
import { type TurnAttack, type TurnPlanInput } from './choreography.js';
import { createPortraitRig } from './fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from './fixture-rig.js';
import { defaultArenaWorld, selectHabitatArena, DEFAULT_ARENA_WORLD_KEY } from './habitat-arena.js';
import { buildTurnCuePlan } from './cue-plan.js';
import { FITS, REPO_ROOT, loadFit, type FitName } from './parts-rig.fixtures.js';
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

describe('E1 outcome 1 — the attack pays: anatomy contact, effect impact, ability cue, damage number and the contact joint all land together', () => {
  it('Civet bite: impactAt − actionStart = contactMs = effect impactAt = ability cue; the number shows the transcript damage; the jaw arrives at the target', async () => {
    const { rig, card } = await loadFit('civet');
    const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; const r = compileAnatomyAttack(card, 'ground', ordinal, 'bite'); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; };
    const ctx = contextFor('Civet', card.massClass.multiplier, card, attackFor);
    const input = turnOf(ctx, { side: 'A', an: 'Civet', dn: 'Platypus', dmg: 9, crit: false, hpA: 30, hpB: 12 });
    const attack = input.attack; if (!attack) throw new Error('no anatomy attack selected');
    expect(attack.verb).toBe('bite'); expect(attack.contactJoint).toBe('jaw'); expect(attack.timeline.actionId).toBe('melee:bite');
    const { f, nodes } = stageFactory(); let now = 0;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: card.massClass.multiplier, right: 0.85 } });
    const plan = stage.play(input);
    expect(plan.attack).toBe(attack);
    expect(plan.beats.impactAt - plan.beats.actionStart).toBeCloseTo(attack.contactMs, 9);
    expect(plan.effect).not.toBeNull(); expect(plan.effect!.schedule.impactAt).toBeCloseTo(attack.contactMs, 9); expect(plan.effect!.startMs).toBe(plan.beats.actionStart);
    // The ability impact cue is PLACED on the anatomy contact instant; the kit §5 per-beat mix may still drop it for concurrency, which is admission, not placement.
    const cues = buildTurnCuePlan(plan), placed = [...cues.cues, ...cues.dropped], impactCue = placed.find((c) => c.cueId === 'ability:wild:impact');
    expect(impactCue?.atMs).toBeCloseTo(plan.beats.impactAt, 9); expect(placed.find((c) => c.cueId === 'battle:hitstop-thump')?.atMs).toBeCloseTo(plan.beats.impactAt, 9);
    expect(cues.cues.some((c) => c.beat === 'impact' && c.atMs === impactCue!.atMs)).toBe(true); // at least one impact-beat cue is admitted on that instant
    expect(plan.number.text).toBe('9'); expect(input.damage).toBe(9);
    const holder = holderOf(nodes, rig);
    // Display units are normalized cut-out units (cutout = 1×1): world x = holder x + holder scale × (joint − foot), exactly as the stage places the root.
    const jawWorldX = (): number => { const j = rig.jointPosition(attack.contactJoint); if (!j) throw new Error('no jaw'); return holder.x + holder.scaleSet[0] * (j.x - rig.foot.x * rig.cutout.width); };
    now = 0; stage.tick(); const x0 = jawWorldX();
    now = plan.beats.impactAt; const frame = stage.tick(); const x1 = jawWorldX();
    expect(frame?.sample.phase).toBe('hitstop');
    const standA = layout.stands.left.x * FRAME.width, standT = layout.stands.right.x * FRAME.width;
    expect(x1 - x0).toBeGreaterThan(0.9 * Math.abs(plan.runUp) * FRAME.width); // the jaw travelled the run-up toward the target
    expect(x1).toBeGreaterThan(standA); expect(x1).toBeLessThan(standT); // and stopped short of the target's stand: contact, not overlap
    // Contract, not a guess: the run-up ends at standDistance − halfWidths − gap, so the jaw sits past the run-up end and inside the attacker's own half-width of it.
    const hw = stage.halfWidths(), runUpEnd = standA + Math.abs(plan.runUp) * FRAME.width;
    expect(x1).toBeGreaterThan(runUpEnd - 1); expect(x1).toBeLessThan(runUpEnd + hw.left * FRAME.width + 1);
    expect(rig.refusals()).toBe(0);
    stage.dispose();
  }, 120_000);

  it('Crab pinch is an admitted anatomy attack (R3 landed 2026-09-21: brachyuran row + crustacean profile split; pin flipped from it.fails)', async () => {
    const { card } = await loadFit('crab');
    expect(compileAnatomyAttack(card, 'ground', 0).attack.verb).toBe('pinch');
  }, 60_000);
});

describe('E1 outcome 2 — no refusal in play', () => {
  const playTurns = (stage: BattleStage, plans: TurnPlanInput[], setNow: (ms: number) => void): number => {
    let ticks = 0;
    for (const input of plans) { const plan = stage.play(input); for (let ms = 0; ms <= plan.beats.end; ms += 1000 / 30) { setNow(ms); const frame = stage.tick(); if (!frame) throw new Error('no frame'); ticks++; } }
    return ticks;
  };
  it('the Civet attacks (anatomy bite) and is attacked, dodges and faints across seeded turns at 30 Hz: zero rig refusals, no exception reaches tick', async () => {
    const { rig, card } = await loadFit('civet');
    const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; const r = compileAnatomyAttack(card, 'ground', ordinal); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; };
    const { f } = stageFactory(); let now = 0;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: card.massClass.multiplier, right: 0.85 } });
    // Rows cover: Civet attacks; Civet is hit; Civet's target dodges; Civet WINS (victory rear-up — E1.5 found it refused when treated as a planted stance); Civet faints.
    const rows = [{ side: 'A', an: 'Civet', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }, { side: 'B', an: 'Platypus', dn: 'Civet', dmg: 4, crit: true, hpA: 26, hpB: 20 }, { an: 'Civet', dn: 'Platypus', dodge: true }, { side: 'A', an: 'Civet', dn: 'Platypus', dmg: 20, crit: true, hpA: 26, hpB: 0 }, { side: 'B', an: 'Platypus', dn: 'Civet', dmg: 40, crit: false, hpA: 0, hpB: 20 }];
    const plans = rows.map((row, i) => turnOf(contextFor('Civet', card.massClass.multiplier, card, attackFor, { seed: (0xA11 + i * 7919) >>> 0 }), row, i));
    expect(plans[0]!.attack?.verb).toBeDefined(); expect(plans.filter((p) => p.attack).length).toBeGreaterThanOrEqual(1);
    const ticks = playTurns(stage, plans, (ms) => { now = ms; });
    expect(ticks).toBeGreaterThan(300); expect(rig.refusals(), rig.lastRefusal() ?? '').toBe(0);
    stage.dispose();
  }, 600_000);
  it('each of the five crabs is attacked, dodges and faints as the rigged TARGET across seeded turns at 30 Hz: zero rig refusals', async () => {
    const report: Record<string, { ticks: number; refusals: number; last: string | null }> = {};
    for (const name of (Object.keys(FITS) as FitName[]).filter((n) => n !== 'civet')) {
      const { rig, card } = await loadFit(name);
      const { f } = stageFactory(); let now = 0;
      const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: portraitRig(), right: rig }, masses: { left: 0.85, right: card.massClass.multiplier } });
      const rows = [{ side: 'A', an: 'Platypus', dn: name, dmg: 7, crit: false, hpA: 30, hpB: 20 }, { an: name, dn: 'Platypus', dodge: true }, { side: 'A', an: 'Platypus', dn: name, dmg: 9, crit: true, hpA: 30, hpB: 11 }, { side: 'A', an: 'Platypus', dn: name, dmg: 20, crit: false, hpA: 30, hpB: 0 }];
      const plans = rows.map((row, i) => turnOf(contextTarget(name, card.massClass.multiplier, card, { seed: (0xA11 + i * 7919) >>> 0 }), row, i));
      const ticks = playTurns(stage, plans, (ms) => { now = ms; });
      report[name] = { ticks, refusals: rig.refusals(), last: rig.lastRefusal() };
      stage.dispose();
    }
    for (const [name, r] of Object.entries(report)) { expect(r.ticks, name).toBeGreaterThan(300); expect(r.refusals, `${name}: ${r.last ?? ''}`).toBe(0); }
  }, 600_000);
  it('a crab ATTACKS through the stage (R3 landed 2026-09-21: pinch reachable by the resolvers; pin flipped from it.fails)', async () => {
    const { rig, card } = await loadFit('crab');
    const { f } = stageFactory(); let now = 0;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: card.massClass.multiplier, right: 0.85 } });
    const plan = stage.play(turnOf(contextFor('Crab', card.massClass.multiplier, card), { side: 'A', an: 'Crab', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }));
    expect(plan.clips.attacker.action.source).toBe('timeline');
    stage.dispose();
  }, 120_000);
});

describe('E1 outcome 4 — habitat refusal is visible, never a clipped sprite', () => {
  const painted = { height: 0.2, footBelowCentre: 0.05 } as const;
  it('an aquatic-only body on the dry default arena is UNSUPPORTED with the reason and both habitats named', () => {
    const fish = syntheticRecord('fish') as ResolvedAnatomyRecord & { template: { id: string }; identity: { earthName: string | null } };
    const r = selectHabitatArena({ contextId: 'ctx', seed: 1, round: 0, kind: 'wild', worlds: null, groundLineY: layout.groundLineY,
      left: { record: fish, genome: syntheticGenome('fish') as Record<string, unknown>, label: 'Fish', painted }, right: { record: null, genome: null, label: 'Player', painted } });
    expect(r.status).toBe('UNSUPPORTED'); if (r.status !== 'UNSUPPORTED') return;
    expect(r.worldKey).toBe(DEFAULT_ARENA_WORLD_KEY); expect(r.reason).toMatch(/cannot support both organisms/); expect(r.reason).toContain('left Fish: aquatic (water)'); expect(r.reason).toContain('right Player: land (ground)');
    expect(r.label).toContain('no world context');
  });
  it('a crab and a portrait on the default arena are READY on the ground line; a fish on a watery world gets the water band, inside it, surface-ranged against a ground opponent', async () => {
    const { record } = await loadFit('crab');
    const ready = selectHabitatArena({ contextId: 'ctx', seed: 1, round: 0, kind: 'wild', worlds: null, groundLineY: layout.groundLineY,
      left: { record, genome: null, label: 'Crab', painted }, right: { record: null, genome: null, label: 'Player', painted } });
    expect(ready.status).toBe('READY'); if (ready.status !== 'READY') return;
    expect(ready.source).toBe('default'); expect(ready.stands.left.medium).toBe('ground'); expect(ready.stands.right.medium).toBe('ground');
    expect(ready.stands.left.y).toBe(layout.groundLineY); expect(ready.stands.right.y).toBe(layout.groundLineY); expect(ready.interaction).toBe('same-medium');
    const lake: ArenaWorld = { ...defaultArenaWorld(layout.groundLineY), key: 'lake', liquid: 'water', surfaceWater: true, cardHash: 'lake-1' };
    const fish = syntheticRecord('fish') as ResolvedAnatomyRecord & { template: { id: string }; identity: { earthName: string | null } };
    const water = selectHabitatArena({ contextId: 'ctx', seed: 1, round: 0, kind: 'wild', worlds: { home: lake, visitor: lake }, groundLineY: layout.groundLineY,
      left: { record: fish, genome: syntheticGenome('fish') as Record<string, unknown>, label: 'Fish', painted }, right: { record: null, genome: null, label: 'Player', painted } });
    expect(water.status).toBe('READY'); if (water.status !== 'READY') return;
    expect(water.source).toBe('worlds'); expect(water.stands.left.medium).toBe('water'); expect(water.stands.right.medium).toBe('ground'); expect(water.interaction).toBe('surface-ranged');
    const band = water.stands.left.band, centre = water.stands.left.y - painted.footBelowCentre;
    expect(centre - painted.height / 2).toBeGreaterThanOrEqual(band.minY - 1e-9); expect(centre + painted.height / 2).toBeLessThanOrEqual(band.maxY + 1e-9); // the whole painted box sits in its band
    expect(() => selectHabitatArena({ contextId: 'ctx', seed: 1, round: 0, kind: 'wild', worlds: { home: lake, visitor: lake }, groundLineY: layout.groundLineY,
      left: { record: fish, genome: syntheticGenome('fish') as Record<string, unknown>, label: 'Fish', painted: { height: 0.5, footBelowCentre: 0 } }, right: { record: null, genome: null, label: 'Player', painted } })).toThrow(/cannot fit its medium/); // too tall for the band: refused, never clipped
  }, 60_000);
});

describe('E1 outcome 5 — reduced motion', () => {
  it('same transcript with reducedMotion: the number shows, no shake/flash/effect, the parts rig takes one rest pose per turn and is never updated per tick', async () => {
    const { rig, card } = await loadFit('vent-crab');
    const { f } = stageFactory(); let now = 0;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: portraitRig(), right: rig }, masses: { left: 0.85, right: card.massClass.multiplier }, reducedMotion: true });
    const applied0 = rig.applied();
    const plan = stage.play(turnOf(contextTarget('Vent Crab', card.massClass.multiplier, card), { side: 'A', an: 'Platypus', dn: 'Vent Crab', dmg: 9, crit: false, hpA: 30, hpB: 12 }));
    expect(plan.reducedMotion).toBe(true); // the plan keeps its effect schedule (beats stay identical); the stage plays no effect and every sample carries none
    const appliedAtPlay = rig.applied(); expect(appliedAtPlay).toBe(applied0 + 1);
    let shown = false;
    for (let ms = 0; ms <= plan.beats.end; ms += 1000 / 60) { now = ms; const frame = stage.tick(); if (!frame) throw new Error('no frame'); const s = frame.sample; expect(s.camera.flash).toBe(0); expect(s.camera.shake).toEqual({ x: 0, y: 0 }); expect(s.effect).toBeNull(); expect(s.attacker.displacementX).toBe(0); if (s.numbers[0]?.visible) shown = true; }
    expect(shown).toBe(true); expect(rig.applied()).toBe(appliedAtPlay); expect(rig.refusals()).toBe(0);
    stage.dispose();
  }, 120_000);
});
