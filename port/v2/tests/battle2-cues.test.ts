/* B1: sound cues synced to the turn beats. The cue plan is a pure function of the turn plan; every cue
 * sits on a choreography beat; admission per beat follows the kit mix (impact slot holds one voice);
 * the player fires each cue once from the injected clock, never before its beat, never twice, and
 * drops a cue that arrives too late. Negative controls: an unknown theme refuses, a backwards clock
 * cannot re-fire, a stage without a sink fires nothing, a disposed player is silent. */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { composeArena } from '../apps/game/src/battle2/arena.js';
import { buildTurnPlan, type TurnPlanInput } from '../apps/game/src/battle2/choreography.js';
import { CUE_LATE_DROP_MS, TurnCuePlayer, buildTurnCuePlan, type TurnCue } from '../apps/game/src/battle2/cue-plan.js';
import { createPortraitRig, type BattleRigV1, type RigContainerLike, type RigSpriteLike } from '../apps/game/src/battle2/index.js';
import { BattleStage, type BattleStageFactory } from '../apps/game/src/battle2/stage.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../apps/game/src/effects/anchors.js';
import { proceduralAnchorsFor } from '../apps/game/src/effects/theme-library.js';
import { DAMAGE_NUMBER } from '../apps/game/src/motion/timing.js';

const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', import.meta.url), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const ARENA = { groundLineY: 0.78, stands: { left: { x: 1 / 3, y: 0.78 }, right: { x: 2 / 3, y: 0.78 } } };
const input = (over: Partial<TurnPlanInput> = {}): TurnPlanInput => ({
  seed: 11, attacker: { side: 'left', mass: 1, card: null, seed: 1, label: 'Civet' }, target: { side: 'right', mass: 0.85, card: null, seed: 2, label: 'Platypus' },
  delivery: 'melee', theme: 'wild', outcome: 'hit', damage: 12, effect: wild(), arena: ARENA, readyMs: 900, commandMs: 400, ...over,
});
const at = (cues: readonly TurnCue[], id: string): TurnCue | undefined => cues.find((c) => c.cueId === id);

describe('buildTurnCuePlan', () => {
  it('places every cue on a choreography beat for a hit, in time order, with the theme cues on the effect schedule and the damage tick pitched by amount', () => {
    const plan = buildTurnPlan(input({ critical: true })), b = plan.beats, cp = buildTurnCuePlan(plan);
    expect(cp.kind).toBe('turn-cue-plan'); expect(cp.theme).toBe('wild'); expect(cp.endMs).toBe(b.end);
    for (let i = 1; i < cp.cues.length; i++) expect(cp.cues[i]!.atMs).toBeGreaterThanOrEqual(cp.cues[i - 1]!.atMs);
    expect(at(cp.cues, 'battle:turn-ready')).toMatchObject({ atMs: 0, source: 'battle', beat: 'ready' });
    expect(at(cp.cues, 'battle:cursor')!.atMs).toBe(b.readyEnd); expect(at(cp.cues, 'battle:confirm')!.atMs).toBe(b.commandEnd); expect(at(cp.cues, 'battle:approach-start')!.atMs).toBe(b.commandEnd);
    expect(at(cp.cues, 'creature:attack-vocal')).toMatchObject({ atMs: b.actionStart, source: 'left' });
    const s = plan.effect!.schedule, t0 = plan.effect!.startMs;
    expect(at(cp.cues, 'ability:wild:launch')!.atMs).toBe(t0 + s.launchAt); expect(at(cp.cues, 'ability:wild:travel')!.atMs).toBe(t0 + s.travelStart);
    expect(at(cp.cues, 'ability:wild:impact')!.atMs).toBeCloseTo(b.impactAt, 9); // the impact cue IS the hitstop frame
    expect(at(cp.cues, 'battle:damage-tick')).toMatchObject({ atMs: b.impactAt + DAMAGE_NUMBER.popMs, amount: 12, beat: 'number' });
    expect(at(cp.cues, 'creature:hurt')).toMatchObject({ atMs: b.reactionStart, source: 'right' });
    expect(at(cp.cues, 'battle:flash-sting')!.atMs).toBe(b.impactAt); expect(at(cp.cues, 'battle:shake-rumble')!.atMs).toBe(b.impactAt);
    expect(cp.cues.some((c) => c.cueId === 'creature:faint' || c.cueId === 'battle:victory-sting' || c.cueId === 'battle:miss-whiff' || c.cueId === 'battle:dodge-swish')).toBe(false);
  });
  it('admits per beat through the kit mix: the impact slot holds one voice, so the hitstop thump yields to the ability impact with a reason', () => {
    const cp = buildTurnCuePlan(buildTurnPlan(input()));
    expect(at(cp.cues, 'ability:wild:impact')).toBeDefined(); expect(at(cp.cues, 'battle:hitstop-thump')).toBeUndefined();
    expect(cp.dropped).toEqual([expect.objectContaining({ cueId: 'battle:hitstop-thump', reason: 'concurrency:impact' })]);
    const noEffect = buildTurnCuePlan(buildTurnPlan(input({ effect: null })));
    expect(at(noEffect.cues, 'battle:hitstop-thump')).toBeDefined(); expect(noEffect.cues.some((c) => c.cueId.startsWith('ability:'))).toBe(false); expect(noEffect.dropped).toEqual([]);
  });
  it('faint, dodge, miss and reduced motion change the set; a procedural theme gets its own ability cues; an unknown theme refuses', () => {
    const faint = buildTurnCuePlan(buildTurnPlan(input({ targetFaints: true }))), fb = buildTurnPlan(input({ targetFaints: true })).beats;
    expect(at(faint.cues, 'creature:faint')).toMatchObject({ atMs: fb.reactionStart, source: 'right' }); expect(at(faint.cues, 'creature:hurt')).toBeUndefined();
    expect(at(faint.cues, 'battle:faint-fall')!.atMs).toBeCloseTo(fb.reactionStart + (fb.reactionEnd - fb.reactionStart) * 0.8, 9);
    expect(at(faint.cues, 'creature:victory')).toMatchObject({ atMs: fb.returnEnd, source: 'left' }); expect(at(faint.cues, 'battle:victory-sting')!.atMs).toBe(fb.returnEnd);
    const dodge = buildTurnCuePlan(buildTurnPlan(input({ outcome: 'dodge' }))), db = buildTurnPlan(input({ outcome: 'dodge' })).beats;
    expect(at(dodge.cues, 'battle:dodge-swish')!.atMs).toBe(db.reactionStart); expect(dodge.cues.some((c) => ['battle:hitstop-thump', 'battle:damage-tick', 'creature:hurt', 'battle:flash-sting'].includes(c.cueId))).toBe(false);
    expect(at(dodge.cues, 'ability:wild:impact')).toBeDefined(); // the effect still lands on the floor
    const miss = buildTurnCuePlan(buildTurnPlan(input({ outcome: 'miss' }))); expect(at(miss.cues, 'battle:miss-whiff')!.atMs).toBe(buildTurnPlan(input({ outcome: 'miss' })).beats.impactAt);
    const reduced = buildTurnCuePlan(buildTurnPlan(input({ reducedMotion: true })));
    expect(reduced.reducedMotion).toBe(true); expect(reduced.cues.some((c) => ['battle:flash-sting', 'battle:shake-rumble', 'battle:approach-start'].includes(c.cueId))).toBe(false);
    expect(at(reduced.cues, 'ability:wild:impact')).toBeDefined(); expect(at(reduced.cues, 'battle:damage-tick')).toBeDefined(); // sound is not motion
    const stone = buildTurnCuePlan(buildTurnPlan(input({ theme: 'stone', effect: proceduralAnchorsFor('stone') })));
    expect(stone.cues.filter((c) => c.cueId.startsWith('ability:stone:')).map((c) => c.beat)).toEqual(['launch', 'travel', 'impact']);
    expect(() => buildTurnCuePlan(buildTurnPlan(input({ theme: 'lava' })))).toThrow(/closed vocabulary/); expect(buildTurnCuePlan(buildTurnPlan(input({ theme: 'lava', effect: null }))).cues.some((c) => c.cueId.startsWith('ability:'))).toBe(false);
    expect(() => buildTurnCuePlan({ kind: 'nope' } as unknown as ReturnType<typeof buildTurnPlan>)).toThrow(/expected a turn plan/);
    const phone = buildTurnCuePlan(buildTurnPlan(input()), { phone: true }); expect(phone.cues.map((c) => c.cueId)).toEqual(buildTurnCuePlan(buildTurnPlan(input())).cues.map((c) => c.cueId));
  });
  it('is deterministic and reads no clock', () => {
    const date = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock'); }), perf = vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('clock'); }), rnd = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('random'); });
    const a = buildTurnCuePlan(buildTurnPlan(input())), b = buildTurnCuePlan(buildTurnPlan(input()));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b)); expect(Object.isFrozen(a.cues)).toBe(true);
    date.mockRestore(); perf.mockRestore(); rnd.mockRestore();
  });
});

describe('TurnCuePlayer', () => {
  afterEach(() => vi.restoreAllMocks());
  it('fires each cue once at or after its beat, in order, reports lateness, drops cues later than the limit, ignores a backwards clock, and is silent after dispose', () => {
    const cp = buildTurnCuePlan(buildTurnPlan(input())), played: [string, number][] = [];
    let now = 0; const p = new TurnCuePlayer(cp, { play: (c, late) => played.push([c.cueId, late]) }, () => now);
    expect(p.tick()).toEqual({ fired: 1, droppedLate: 0, done: false }); expect(played).toEqual([['battle:turn-ready', 0]]);
    now = 899; p.tick(); expect(played).toHaveLength(1); // nothing before its beat
    now = 905; p.tick(); expect(played.at(-1)).toEqual(['battle:cursor', 5]);
    now = 700; p.tick(); expect(played).toHaveLength(2); // backwards clock: no re-fire
    const impact = cp.cues.find((c) => c.cueId === 'ability:wild:impact')!;
    now = impact.atMs + CUE_LATE_DROP_MS + 1; const f = p.tick();
    expect(p.droppedLate.map((d) => d.cueId)).toContain('ability:wild:impact'); expect(f.droppedLate).toBeGreaterThan(0);
    expect(played.map(([id]) => id)).not.toContain('ability:wild:impact'); expect(p.droppedLate[0]!.reason).toMatch(/late by \d+ ms/);
    now = cp.endMs + 1; const end = p.tick(); expect(end.done).toBe(true); expect(end.fired + end.droppedLate).toBe(cp.cues.length);
    const ids = new Set(played.map(([id]) => id)); expect(ids.size).toBe(played.length); // no cue twice
    p.dispose(); now += 1000; expect(p.tick().done).toBe(true); expect(played.length).toBe(end.fired);
    expect(() => new TurnCuePlayer(cp, { play: () => undefined }, () => Number.NaN).tick()).toThrow(/finite/);
  });
  it('rides the stage: play() builds the cue plan, tick() fires on the stage clock, a stage without a sink fires nothing', () => {
    class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; text = ''; children: object[] = []; readonly scale = { set: () => undefined }; readonly anchor = { set: () => undefined }; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } clear() {} rect() {} fill() {} destroy() {} }
    const f: BattleStageFactory = { container: () => new Node(), sprite: () => new Node(), text: (t) => { const n = new Node(); n.text = t; return n; }, graphics: () => new Node() };
    const rigF = { container: (): RigContainerLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() };
    const rig = (): BattleRigV1 => createPortraitRig({ templateId: 'p', recipeHash: 'h', cutout: { width: 100, height: 100 }, alphaBox: { x: 10, y: 10, width: 80, height: 80 }, factory: rigF });
    const layout = composeArena({ id: 'a', groundLineNormalized: 0.78, plates: { far: { width: 1672, height: 941 }, mid: { width: 1672, height: 941 }, near: { width: 1672, height: 941 } } }, { width: 1024, height: 576 });
    const played: TurnCue[] = []; let now = 3000;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: { width: 1, height: 1 }, mid: { width: 1, height: 1 }, near: { width: 1, height: 1 } }, rigs: { left: rig(), right: rig() }, masses: { left: 1, right: 1 }, cues: { sink: { play: (c) => played.push(c) } } });
    expect(stage.cuePlan).toBeNull();
    const plan = stage.play(input({ effect: null }));
    expect(stage.cuePlan!.cues.length).toBeGreaterThan(5); expect(played.map((c) => c.cueId)).toEqual(['battle:turn-ready']); expect(stage.cuesFired()).toBe(1);
    now = 3000 + plan.beats.impactAt + 1; const frame = stage.tick()!; expect(frame.cuesFired).toBeGreaterThan(3); expect(played.map((c) => c.cueId)).toContain('battle:hitstop-thump');
    stage.play(input({ effect: null, outcome: 'miss' })); expect(stage.cuePlan!.cues.some((c) => c.cueId === 'battle:miss-whiff')).toBe(true); // a new turn replaces the player
    stage.dispose(); expect(stage.cuePlan).toBeNull();
    const silent = new BattleStage({ factory: f, clock: () => 0, layout, plates: { far: { width: 1, height: 1 }, mid: { width: 1, height: 1 }, near: { width: 1, height: 1 } }, rigs: { left: rig(), right: rig() }, masses: { left: 1, right: 1 } });
    silent.play(input({ effect: null })); expect(silent.cuePlan).toBeNull(); expect(silent.tick()!.cuesFired).toBe(0); silent.dispose();
  });
});
