/* Guardian choreography (audits/GUARDIAN_CHOREOGRAPHY_20261001/DESIGN.md): the boss set pieces and the heavy strike, behind the opt-in
 * `?guardianChoreo=1` study flag. Five checks, each with a negative control that proves it bites:
 *   1. beat ORDER and DURATIONS come from the Motion Kit §5 rows scaled by the titanic mass class (and the hitstop cap holds);
 *   2. DETERMINISM: the same inputs give the same program, samples and cues, with no clock or Math.random read;
 *   3. FLAG-OFF BYTE IDENTITY: every turn plan, cue plan, sampled frame and stage frame is byte-for-byte what it was before this
 *      change (fingerprints pinned from the pre-change code, 2026-10-01), and the flag is off by default;
 *   4. OUTCOMES and RNG UNTOUCHED: on a real Guardian settlement, flag on vs off stages the same outcome, damage, faint and rewards,
 *      and the settlement re-plans identically after the program is built;
 *   5. the PHASE beat sits where the engine's own phase change happened. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { ENCOUNTER_GUARDIAN_PHASE_V1, planCombatPartySettlementV1, projectGuardianPrimeEncounterV1, runEncounterV1, type CombatSettlementPlanV1 } from '@cf/domain-combatcore';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { resolveCF1WorldAddress } from '@cf/scene';
import { compileBodyCard } from '../motion/body-card.js';
import { civetRecord } from '../../../../tools/motion-proof/fixtures.js';
import { parseEffectSequenceAnchors } from '../effects/anchors.js';
import { HITSTOP, SHAKE, scaleMs } from '../motion/timing.js';
import { GUARDIAN_CHOREO_DEFAULT, guardianChoreoOn } from '../battle2-gate.js';
import { composeArena } from './arena.js';
import { buildTurnPlan, sampleTurn, type CombatantPlanInput, type TurnPlan, type TurnPlanInput } from './choreography.js';
import { buildTurnCuePlan, type TurnCue } from './cue-plan.js';
import { createPortraitRig } from './fallback.js';
import {
  GUARDIAN_CHOREO_MASS, GUARDIAN_PANEL, buildGuardianCuePlan, buildGuardianEntranceV1, buildGuardianFallV1, buildGuardianPhaseV1, buildGuardianTriumphV1,
  guardianBeatTimings, guardianPhaseRowV1, guardianStrikeV1, planGuardianProgramV1, sampleGuardianSetPiece, type GuardianProgramV1, type GuardianSetPieceV1,
} from './guardian-choreo.js';
import { BATTLE2_SWAP_BEAT_MS_V1, BATTLE2_SWAP_BEAT_REDUCED_MS_V1 } from './swap-beats.js';
import { BattleStage, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type TurnOutcomeContext } from './stage.js';

const sha = (v: unknown): string => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');
const wild = () => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('../../../../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', import.meta.url), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const GUARDIAN: CombatantPlanInput = { side: 'right', mass: 1.6, card: null, seed: 7, label: 'Brown Bear' };
const CHALLENGER: CombatantPlanInput = { side: 'left', mass: 1, card: null, seed: 3, label: 'Civet' };
const common = { guardianSide: 'right' as const, guardian: GUARDIAN, opponent: CHALLENGER, name: 'Brown Bear', seed: 99 };

/* ---------- check 1: order and durations from the mass class ---------- */
type Expect = readonly (readonly [string, number])[];
/** The design table (DESIGN.md §2–§7) as data: each piece's beats in order with their durations at a mass class. */
function expectedBeats(piece: GuardianSetPieceV1, mass: number): Expect {
  const m = Math.max(mass, GUARDIAN_CHOREO_MASS);
  switch (piece.piece) {
    case 'guardian-entrance': return [['reveal', GUARDIAN_PANEL.openMs], ['rise', scaleMs(420, m)], ['settle', scaleMs(180, m)], ['roar', scaleMs(600, m)]];
    case 'guardian-phase': return [['hitstop', HITSTOP.capMs], ['roar', scaleMs(600, m)]];
    case 'guardian-fall': return [['dissolve', scaleMs(520, m)]];          // the last turn's faint already played the collapse
    case 'guardian-triumph': return [['roar', scaleMs(600, m)], ['leave', scaleMs(520, 1)]];
  }
}
/** Violations of the table: order, contiguity (each beat starts where the previous ended, except triumph's two parallel beats), and
 * durations; the hitstop never above the cap; the piece ends when its last beat or its caption does. */
function timingViolations(piece: GuardianSetPieceV1, mass: number): string[] {
  const out: string[] = [], want = expectedBeats(piece, mass);
  if (piece.beats.map((b) => b.beat).join() !== want.map(([b]) => b).join()) out.push(`order ${piece.beats.map((b) => b.beat).join()} ≠ ${want.map(([b]) => b).join()}`);
  for (const [i, b] of piece.beats.entries()) {
    const w = want[i]; if (w && Math.abs(b.end - b.start - w[1]) > 1e-9) out.push(`${b.beat} lasts ${b.end - b.start} ≠ ${w[1]}`);
    if (piece.piece !== 'guardian-triumph' && i > 0 && Math.abs(b.start - piece.beats[i - 1]!.end) > 1e-9) out.push(`${b.beat} does not follow ${piece.beats[i - 1]!.beat}`);
  }
  if (piece.hitstop && piece.hitstop.end - piece.hitstop.start > HITSTOP.capMs) out.push('hitstop above the cap');
  const c = piece.caption, end = Math.max(c.startMs + c.inMs + c.holdMs + c.outMs, ...piece.beats.map((b) => b.end));
  if (Math.abs(piece.durationMs - end) > 1e-9) out.push(`duration ${piece.durationMs} ≠ ${end}`);
  return out;
}

describe('guardian choreography — check 1: beat order and durations from the mass class', () => {
  it('the titanic table: every number is a Motion Kit §5 row × 1.60 (scaleMs bounds), a §7 panel timing or the §20 relay hold', () => {
    expect(GUARDIAN_CHOREO_MASS).toBe(1.6);
    expect(guardianBeatTimings(1.6)).toEqual({ revealMs: 220, riseMs: 672, settleMs: 288, roarMs: 960, collapseMs: 832, phaseHitstopMs: 140, strikeHitstopMs: 112, shakeAmplitudePx: 9.600000000000001 });
    expect(guardianBeatTimings(0.85), 'a lighter guardian card is floored to titanic').toEqual(guardianBeatTimings(1.6));
    const heavy = guardianBeatTimings(2.6);
    expect(heavy.riseMs, 'above 2.0× base the §5 bound holds').toBe(840); expect(heavy.strikeHitstopMs, 'the hitstop cap holds').toBe(HITSTOP.capMs);
    expect(() => guardianBeatTimings(0)).toThrow(/positive/);
  });

  it('entrance, phase, fall and triumph follow the table in order, captions hold the relay-beat cadence, and the cues sit on the beats', () => {
    const entrance = buildGuardianEntranceV1({ ...common, kind: 'guardian', riseFromDy: 0.5 }), phase = buildGuardianPhaseV1(common);
    const fall = buildGuardianFallV1({ ...common, faintPlayed: true }), triumph = buildGuardianTriumphV1(common);
    for (const p of [entrance, phase, fall, triumph]) expect(timingViolations(p, 1.6), p.piece).toEqual([]);
    expect(entrance.caption).toMatchObject({ text: 'Guardian · Brown Bear', startMs: 220 + 672 + 288, inMs: 220, holdMs: BATTLE2_SWAP_BEAT_MS_V1, outMs: 160 });
    expect(entrance.durationMs).toBe(220 + 672 + 288 + 220 + BATTLE2_SWAP_BEAT_MS_V1 + 160);
    const cueAt = (p: GuardianSetPieceV1) => buildGuardianCuePlan(p).cues.map((c: TurnCue) => `${c.cueId}@${c.atMs}`);
    expect(cueAt(entrance)).toEqual(['battle:battle-start@0', 'creature:land-thud@892', 'battle:shake-rumble@892', 'creature:call@1180']);
    expect(cueAt(phase)).toEqual(['battle:hitstop-thump@0', 'battle:flash-sting@0', 'creature:call@140', 'battle:shake-rumble@140']);
    expect(buildGuardianCuePlan(phase).cues[0]).toMatchObject({ target: 'right' });
    expect(cueAt(triumph)).toEqual(['battle:defeat-sting@0', 'creature:call@0', `battle:battle-end@${Math.max(960, 520)}`]);
    for (const p of [entrance, phase, fall, triumph]) expect(buildGuardianCuePlan(p).dropped, `${p.piece}: every cue admitted (kit §5)`).toEqual([]);
    // a fall the last turn did NOT already collapse plays the faint first
    expect(buildGuardianFallV1({ ...common, faintPlayed: false }).beats.map((b) => [b.beat, b.end - b.start])).toEqual([['collapse', 832], ['dissolve', 832]]);
    // reduced motion: captions only, at the reduced relay hold; sound stays (the turn's reduced rule)
    const reduced = buildGuardianEntranceV1({ ...common, kind: 'titan', riseFromDy: 0.5, reducedMotion: true });
    expect(reduced.caption).toMatchObject({ text: 'Titan · Brown Bear', startMs: 0, holdMs: BATTLE2_SWAP_BEAT_REDUCED_MS_V1 });
    expect(reduced.rise).toBeNull(); expect(reduced.shake).toBeNull(); expect(cueAt(reduced)).toEqual(['battle:battle-start@0', 'creature:call@0']);
  });

  it('the samples follow the beats: hidden below the frame, a back-out arrival, the landing shake at 6 px × mass, the flash on the hitstop', () => {
    const p = buildGuardianEntranceV1({ ...common, kind: 'guardian', riseFromDy: 0.5 });
    expect(sampleGuardianSetPiece(p, 0)).toMatchObject({ beat: 'reveal', stageAlpha: 0, guardian: { dy: 0.5 } });
    const mid = sampleGuardianSetPiece(p, 220 + 600); expect(mid.beat).toBe('rise'); expect(mid.guardian.dy).toBeLessThan(0); // the overshoot above the stand
    const land = sampleGuardianSetPiece(p, 892 + 10); expect(land.guardian.dy).toBe(0); expect(land.beat).toBe('settle');
    expect(Math.hypot(land.camera.shake.x, land.camera.shake.y)).toBeGreaterThan(0);
    expect(sampleGuardianSetPiece(p, 892).camera.shake.y).toBeCloseTo(SHAKE.amplitudePx * 1.6 * 0.5, 9);
    expect(sampleGuardianSetPiece(p, 1180 + 300).guardian.context.actionId, 'the rear-up roar overlays the idle').not.toBe('idle');
    const end = sampleGuardianSetPiece(p, p.durationMs); expect(end).toMatchObject({ done: true, beat: 'done', stageAlpha: 1, caption: { visible: false } });
    const ph = buildGuardianPhaseV1(common);
    expect(sampleGuardianSetPiece(ph, 0).camera.flash).toBe(1);
    // both idle clocks freeze through the hitstop: the guardian's pose at 10 ms and 130 ms is the same
    expect(sampleGuardianSetPiece(ph, 130).guardian.pose).toEqual(sampleGuardianSetPiece(ph, 10).guardian.pose);
    expect(sampleGuardianSetPiece(ph, 200).guardian.pose).not.toEqual(sampleGuardianSetPiece(ph, 10).guardian.pose);
  });

  it('negative controls: a piece timed at mass 1.00, a reordered piece and a hitstop past the cap are all caught', () => {
    const ok = buildGuardianEntranceV1({ ...common, kind: 'guardian', riseFromDy: 0.5 });
    const atMedium: GuardianSetPieceV1 = { ...ok, beats: [['reveal', 0, 220], ['rise', 220, 640], ['settle', 640, 820], ['roar', 820, 1420]].map(([beat, start, end]) => ({ beat: beat as string, start: start as number, end: end as number })) };
    expect(timingViolations(atMedium, 1.6).length).toBeGreaterThan(0);
    const reordered: GuardianSetPieceV1 = { ...ok, beats: [ok.beats[1]!, ok.beats[0]!, ...ok.beats.slice(2)] };
    expect(timingViolations(reordered, 1.6)).toEqual(expect.arrayContaining([expect.stringMatching(/^order/)]));
    const ph = buildGuardianPhaseV1(common);
    expect(timingViolations({ ...ph, hitstop: { start: 0, end: 141 } }, 1.6)).toContain('hitstop above the cap');
  });
});

/* ---------- the heavy strike ---------- */
const ARENA = { groundLineY: 0.78, stands: { left: { x: 0.3, y: 0.95 }, right: { x: 0.82, y: 0.78 } } };
const turnInput = (over: Partial<TurnPlanInput> = {}): TurnPlanInput => ({ seed: 11, attacker: { side: 'right', mass: 0.85, card: null, seed: 1, label: 'Bear' }, target: { side: 'left', mass: 1, card: null, seed: 2, label: 'Civet' },
  delivery: 'melee', theme: 'wild', outcome: 'hit', damage: 12, effect: null, arena: ARENA, readyMs: 900, commandMs: 400, ...over });

describe('guardian choreography — the heavy strike (titanic hitstop/shake; the cap on a critical or once phased)', () => {
  it('a guardian hit takes titanic timing, every case within the hitstop cap, and the plan carries it only when given', () => {
    expect(guardianStrikeV1({ attackerMass: 0.85, critical: false, phaseActive: false })).toEqual({ hitstopMs: 112, shakeMass: 1.6 });
    expect(guardianStrikeV1({ attackerMass: 0.85, critical: true, phaseActive: false }).hitstopMs).toBe(HITSTOP.capMs);
    expect(guardianStrikeV1({ attackerMass: 0.85, critical: false, phaseActive: true }).hitstopMs).toBe(HITSTOP.capMs);
    for (const m of [0.7, 1, 1.4, 1.6, 2, 3]) for (const critical of [false, true]) for (const phaseActive of [false, true]) expect(guardianStrikeV1({ attackerMass: m, critical, phaseActive }).hitstopMs).toBeLessThanOrEqual(HITSTOP.capMs);
    const plain = buildTurnPlan(turnInput()), heavy = buildTurnPlan(turnInput({ guardianStrike: guardianStrikeV1({ attackerMass: 0.85, critical: false, phaseActive: true }) }));
    expect(plain.hitstopMs).toBeCloseTo(70 * 0.85, 9); expect('guardianStrike' in plain).toBe(false);
    expect(heavy.hitstopMs).toBe(140); expect(heavy.beats.hitstopEnd - heavy.beats.impactAt).toBe(140);
    expect(sampleTurn(heavy, heavy.beats.impactAt).camera.shake.y).toBeCloseTo(SHAKE.amplitudePx * 1.6 * 0.5, 9);
    expect(sampleTurn(plain, plain.beats.impactAt).camera.shake.y).toBeCloseTo(SHAKE.amplitudePx * 0.85 * 0.5, 9);
    // presentation only: the outcome fields are the same
    for (const k of ['outcome', 'targetFaints', 'number'] as const) expect(heavy[k]).toEqual(plain[k]);
  });
  it('negative controls: a forged strike past the cap, or with no shake mass, is refused by the plan', () => {
    expect(() => buildTurnPlan(turnInput({ guardianStrike: { hitstopMs: 141, shakeMass: 1.6 } }))).toThrow(/guardian strike/);
    expect(() => buildTurnPlan(turnInput({ guardianStrike: { hitstopMs: 100, shakeMass: 0 } }))).toThrow(/guardian strike/);
  });
});

/* ---------- check 2: determinism ---------- */
describe('guardian choreography — check 2: determinism', () => {
  afterEach(() => vi.restoreAllMocks());
  const grid = (p: GuardianSetPieceV1) => { const out = []; for (let ms = -20; ms <= p.durationMs + 40; ms += 29) out.push(sampleGuardianSetPiece(p, ms)); return out; };
  const everything = (seed: number) => {
    const c = { ...common, seed };
    return [buildGuardianEntranceV1({ ...c, kind: 'guardian', riseFromDy: 0.6 }), buildGuardianPhaseV1(c), buildGuardianFallV1({ ...c, faintPlayed: false }), buildGuardianTriumphV1(c)]
      .map((p) => ({ p, cues: buildGuardianCuePlan(p), samples: grid(p) }));
  };
  it('the same inputs give byte-identical pieces, cue plans and samples, with no clock or Math.random read', () => {
    const random = vi.spyOn(Math, 'random'), dateNow = vi.spyOn(Date, 'now'), perfNow = vi.spyOn(performance, 'now');
    const a = sha(everything(99)), b = sha(everything(99));
    const reads = random.mock.calls.length + dateNow.mock.calls.length + perfNow.mock.calls.length;
    vi.restoreAllMocks();
    expect(a).toBe(b); expect(reads).toBe(0);
  });
  it('negative control: the fingerprint is not vacuous — another seed (the idle clips are seeded) gives another one', () => {
    expect(sha(everything(99))).not.toBe(sha(everything(100)));
  });
});

/* ---------- check 3: flag-off byte identity ---------- */
/** Pinned from the PRE-change code (anthropic/mac d0059f822, 2026-10-01): the full turn-plan / cue-plan / sampled-frame matrix and a
 * BattleStage's every node over two turns. The flag-off path must reproduce them exactly. */
const PRE_CHANGE = Object.freeze({ plans: 'f07639868565d60aeed6f1593ff91a360cb8cd0a6896cf34516a5e4e2718a9d4', stage: '84d4207828ce291edb831e0211914235e5794254f95d30feded9a8bc43b9f02d' });
function planMatrix(decorate: (input: TurnPlanInput) => TurnPlanInput = (i) => i): string {
  const card = compileBodyCard(civetRecord() as never), out: string[] = [];
  for (const mass of [0.7, 1, 1.6]) for (const outcome of ['hit', 'dodge', 'miss'] as const) for (const faint of [false, true]) for (const reduced of [false, true]) for (const rig of [false, true]) {
    const input = decorate({ seed: 11, attacker: { side: 'right', mass, card: rig ? card : null, seed: 1, label: 'Bear' }, target: { side: 'left', mass: 0.85, card: null, seed: 2, label: 'Civet' },
      delivery: rig ? 'melee' : 'cast', theme: 'wild', outcome, damage: 12, critical: faint, targetFaints: faint, effect: rig ? wild() : null, arena: ARENA, readyMs: 900, commandMs: 400, reducedMotion: reduced });
    const plan = buildTurnPlan(input), cues = buildTurnCuePlan(plan), samples = [];
    for (let ms = 0; ms <= plan.beats.end + 50; ms += 37) samples.push(sampleTurn(plan, ms));
    out.push(sha({ plan, cues, samples }).slice(0, 16));
  }
  return sha(out.join(','));
}
class N { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; text = ''; sc: number[] = [1, 1]; ops: string[] = []; children: object[] = []; poses = 0;
  readonly scale = { set: (x: number, y: number) => { this.sc = [x, y]; } }; readonly anchor = { set: () => {} };
  addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } clear() { this.ops.push('c'); } rect(...a: number[]) { this.ops.push(a.map((v) => v.toFixed(3)).join()); } fill() { this.ops.push('f'); } destroy() {} }
function stageRig() {
  const nodes: N[] = []; const mk = () => { const n = new N(); nodes.push(n); return n; };
  const f: BattleStageFactory = { container: mk, sprite: () => mk(), text: (t) => { const n = mk(); n.text = t; return n; }, graphics: () => mk() };
  const TEX = { width: 1672, height: 941 };
  const layout = composeArena({ id: 'b', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, { width: 1024, height: 576 }, { guardianSide: 'right' });
  const rig = () => createPortraitRig({ templateId: 'portrait', recipeHash: 'p', cutout: { width: 132, height: 132 }, alphaBox: { x: 20, y: 30, width: 90, height: 96 }, factory: { container: mk, portraitSprite: mk } as never });
  return { nodes, f, TEX, layout, rigs: { left: rig(), right: rig() } };
}
function stageFrames(decorate: (input: TurnPlanInput) => TurnPlanInput = (i) => i): string {
  const { nodes, f, TEX, layout, rigs } = stageRig(); let now = 0;
  const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs, masses: { left: 1, right: 1.6 } });
  const frames: unknown[] = [];
  for (const outcome of ['hit', 'dodge'] as const) {
    now += 1000; stage.play(decorate({ seed: 3, attacker: { side: 'right', mass: 1.6, card: null, seed: 1, label: 'G' }, target: { side: 'left', mass: 1, card: null, seed: 2, label: 'C' }, delivery: 'melee', theme: 'wild', outcome, damage: 9, critical: true, effect: null, arena: { groundLineY: layout.groundLineY, stands: layout.stands }, readyMs: 900, commandMs: 400 }));
    const t0 = now; for (let ms = 0; ms < 5000; ms += 41) { now = t0 + ms; const fr = stage.tick(); frames.push([fr?.done, nodes.map((n) => [n.x, n.y, n.rotation, n.alpha, n.visible, n.sc, n.text, n.ops.length])]); }
  }
  return sha(JSON.stringify(frames));
}
const heavyEverywhere = (i: TurnPlanInput): TurnPlanInput => (i.outcome === 'hit' ? { ...i, guardianStrike: guardianStrikeV1({ attackerMass: i.attacker.mass, critical: false, phaseActive: true }) } : i);

describe('guardian choreography — check 3: flag off is byte-identical to the stage before this change', () => {
  it('the study flag is opt-in and OFF by default', () => {
    expect(GUARDIAN_CHOREO_DEFAULT).toBe(false);
    expect(guardianChoreoOn('')).toBe(false); expect(guardianChoreoOn('?battle2=1')).toBe(false); expect(guardianChoreoOn('?guardianChoreo=0')).toBe(false);
    expect(guardianChoreoOn('?guardianChoreo=1')).toBe(true); expect(guardianChoreoOn('?guardianChoreo=true')).toBe(false);
  });
  it('every turn plan, cue plan and sampled frame, and every stage node over two turns, match the pre-change fingerprints', () => {
    expect(planMatrix()).toBe(PRE_CHANGE.plans);
    expect(stageFrames()).toBe(PRE_CHANGE.stage);
  });
  it('a non-guardian fight gets no program; in a guardian program every turn the guardian does not HIT is the identical object', () => {
    const turns = [turnInput({ attacker: CHALLENGER, target: GUARDIAN }), turnInput({ outcome: 'dodge' }), turnInput()];
    const base = { guardianSide: 'right' as const, guardian: GUARDIAN, opponent: CHALLENGER, log: [{ hpA: 30, hpB: 30 }, { hpA: 30, hpB: 30 }, { hpA: 25, hpB: 30 }], maxB: 40, turns, turnRows: [0, 1, 2], riseFromDy: 0.5, seed: 1 };
    for (const kind of [undefined, null, 'wild', 'prime']) expect(planGuardianProgramV1({ ...base, defender: { name: 'X', kind } })).toBeNull();
    const program = planGuardianProgramV1({ ...base, defender: { name: 'Brown Bear', kind: 'guardian' } })!;
    expect(program.turns[0]).toBe(turns[0]); expect(program.turns[1]).toBe(turns[1]); expect(program.turns[2]).not.toBe(turns[2]);
    expect(program.turns[2]!.guardianStrike).toEqual({ hitstopMs: 112, shakeMass: 1.6 });
  });
  it('negative control: the same matrices with the heavy strike applied no longer match (the fingerprints see the change)', () => {
    expect(planMatrix(heavyEverywhere)).not.toBe(PRE_CHANGE.plans);
    expect(stageFrames(heavyEverywhere)).not.toBe(PRE_CHANGE.stage);
  });
});

/* ---------- checks 4 and 5 on a real Guardian settlement ---------- */
installCaptureHooks();
const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }, planet: { seed: 2456455053 } });
if (!resolved.ok) throw new Error(resolved.reason);
const OPPORTUNITY = projectWorldOpportunity(resolved.address);
const ENCOUNTER = projectGuardianPrimeEncounterV1({ world: resolved.address, descriptor: { worldType: OPPORTUNITY.source.planetType }, regionIndex: 0,
  faunaRoster: [{ speciesId: 'choreo-native', genome: makeGenome(1, 'fauna', 0.5) }], claimedSignatureIds: [], conquered: false })!;
const champion = (seed: number) => ({ kind: 'owned-fauna' as const, creatureId: `choreo-${seed}`, name: `Fighter ${seed}`, genome: { ...makeGenome(seed, 'fauna', 0.5), xp: 0, hurt: 0 }, legacyBredLineage: false });
function settle(seed: number): CombatSettlementPlanV1 {
  const planned = planCombatPartySettlementV1({ battleId: `choreo-${seed}`, receiptOrdinal: 0, encounter: ENCOUNTER, worldTier: OPPORTUNITY.effectiveTier, mode: 'auto', decisions: [],
    party: [{ champion: champion(seed), stance: 'balanced' as const }], authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 }, activePlayMs: 1 } });
  if (planned.status !== 'planned') throw new Error(planned.reason);
  return planned;
}
/** The wiring's own adapter path: one staged turn per damage/dodge row, champion left, guardian right (portrait masses). */
function stagedTurns(s: CombatSettlementPlanV1): { turns: TurnPlanInput[]; turnRows: number[] } {
  const ctx: TurnOutcomeContext = { A: { side: 'A', name: s.champion.name, mass: 1, card: null, theme: 'wild', seed: 3 }, B: { side: 'B', name: ENCOUNTER.defender.name, mass: 1.4, card: null, theme: 'stone', seed: 7 },
    arena: ARENA, seed: 5, anchorsForTheme: () => null, readyMs: 900, commandMs: 400 };
  const turns: TurnPlanInput[] = [], turnRows: number[] = [], ord = { A: 0, B: 0 };
  for (const [i, row] of s.transcript.log.entries()) { const side = row.side === 'B' || (row.dodge === true && row.an === ENCOUNTER.defender.name) ? 'B' : 'A'; const t = turnPlanInputFromTranscriptEvent(row, ctx, ord[side]); if (t.kind === 'turn') { turns.push(t.input); turnRows.push(i); ord[side]++; } }
  return { turns, turnRows };
}
const programFor = (s: CombatSettlementPlanV1, staged = stagedTurns(s)): GuardianProgramV1 => planGuardianProgramV1({ defender: { name: ENCOUNTER.defender.name, kind: ENCOUNTER.defender.kind }, guardianSide: 'right',
  guardian: { side: 'right', mass: 1.4, card: null, seed: 7, label: ENCOUNTER.defender.name }, opponent: { side: 'left', mass: 1, card: null, seed: 3, label: s.champion.name },
  log: s.transcript.log, maxB: s.transcript.maxB, startHpB: null, ...staged, riseFromDy: 0.6, seed: 5 })!;
/** The first champion whose solo Auto fight meets the phase change mid-leg with a guardian hit after it. */
const FIXTURE = (() => {
  for (let seed = 5; seed < 4_000; seed += 7) {
    const s = settle(seed), p = programFor(s);
    if (p.phase && p.phase.afterTurn >= 0 && p.turns.some((t, k) => t.guardianStrike?.hitstopMs === HITSTOP.capMs && k > p.phase!.afterTurn)) return { seed, settlement: s, program: p };
  }
  throw new Error('no phase fixture');
})();
type StagedOutcome = Readonly<{ attacker: string; outcome: string; damage: number; faints: boolean; text: string }>;
const outcomesOf = (plans: readonly TurnPlan[]): StagedOutcome[] => plans.map((p) => ({ attacker: p.attacker.side, outcome: p.outcome, damage: Number(p.number.text.replace('!', '')) || 0, faints: p.targetFaints, text: p.number.text }));
const outcomeDiffs = (off: readonly StagedOutcome[], on: readonly StagedOutcome[]): string[] => off.length !== on.length ? [`${off.length} turns ≠ ${on.length}`] : off.flatMap((o, i) => (JSON.stringify(o) === JSON.stringify(on[i]) ? [] : [`turn ${i}: ${JSON.stringify(o)} ≠ ${JSON.stringify(on[i])}`]));

describe('guardian choreography — check 4: combat outcomes, rewards and RNG are untouched (a real Guardian settlement)', () => {
  afterEach(() => vi.restoreAllMocks());
  it('the fixture is a real Guardian fight with the phase change mid-leg', () => {
    expect(ENCOUNTER.defender.kind).toBe('guardian');
    expect(FIXTURE.settlement.transcript.log.length).toBeGreaterThan(2);
  });
  it('flag on vs off stages the same attacker, outcome, damage and faint on every turn; the settlement (rewards included) re-plans identically', () => {
    const before = sha(FIXTURE.settlement), staged = stagedTurns(FIXTURE.settlement);
    const random = vi.spyOn(Math, 'random');
    const program = programFor(FIXTURE.settlement, staged);
    const off = staged.turns.map((t) => buildTurnPlan(t)), on = program.turns.map((t) => buildTurnPlan(t));
    const draws = random.mock.calls.length; vi.restoreAllMocks();
    expect(draws, 'the program never draws randomness').toBe(0);
    expect(outcomeDiffs(outcomesOf(off), outcomesOf(on))).toEqual([]);
    expect(on.some((p, i) => p.hitstopMs !== off[i]!.hitstopMs), 'the presentation did change (the heavy strikes)').toBe(true);
    expect(sha(FIXTURE.settlement), 'the settlement object was not touched').toBe(before);
    expect(sha(settle(FIXTURE.seed)), 'a fresh plan of the same fight (rewards, XP, receipts) is identical').toBe(before);
    // the engine's RNG stream: the same fight resolves to the same legs with or without a program built in between
    const plan = { mode: 'auto' as const, defender: { name: ENCOUNTER.defender.name, genome: ENCOUNTER.defender.battleGenome as never, phase: true }, party: [{ name: `Fighter ${FIXTURE.seed}`, genome: champion(FIXTURE.seed).genome as never, stance: 'balanced' as const }] };
    const r1 = runEncounterV1(plan); programFor(FIXTURE.settlement); const r2 = runEncounterV1(plan);
    expect(sha(r2)).toBe(sha(r1));
  });
  it('negative control: a program that nudged one turn\'s damage, or dropped a turn, is reported', () => {
    const staged = stagedTurns(FIXTURE.settlement), off = outcomesOf(staged.turns.map((t) => buildTurnPlan(t)));
    const nudged = staged.turns.map((t, i) => (i === 0 ? { ...t, damage: t.outcome === 'hit' ? t.damage + 1 : t.damage, outcome: t.outcome === 'hit' ? t.outcome : 'hit' as const } : t));
    expect(outcomeDiffs(off, outcomesOf(nudged.map((t) => buildTurnPlan(t)))).length).toBe(1);
    expect(outcomeDiffs(off, outcomesOf(staged.turns.slice(1).map((t) => buildTurnPlan(t))))).toEqual([`${off.length} turns ≠ ${off.length - 1}`]);
  });
});

describe('guardian choreography — check 5: the phase beat sits where the engine changed phase', () => {
  /** Agreement: the engine records a phase Break exactly when the program places a phase beat, and the beat's row is the first that took the
   * guardian to at or below ½ with both standing; heavy strikes at the cap follow it. */
  const agreement = (program: GuardianProgramV1, s: CombatSettlementPlanV1): string[] => {
    const out: string[] = [];
    const r = runEncounterV1({ mode: 'auto', defender: { name: ENCOUNTER.defender.name, genome: ENCOUNTER.defender.battleGenome as never, phase: true }, party: [{ name: s.champion.name, genome: (s.champion as { genome: unknown }).genome as never, stance: 'balanced' }] });
    const enginePhase = r.status === 'finished' && r.breaks.some((b) => b.break.kind === 'phase');
    if (enginePhase !== (program.phase !== null)) out.push(`engine phase ${enginePhase} ≠ program phase ${program.phase !== null}`);
    const row = program.phase?.rowIndex ?? null;
    if (row !== null) {
      const half = s.transcript.maxB * ENCOUNTER_GUARDIAN_PHASE_V1.atFraction, log = s.transcript.log;
      if (!((log[row]!.hpB as number) <= half)) out.push(`row ${row} is above half`);
      for (let i = 0; i < row; i++) if (typeof log[i]!.hpB === 'number' && (log[i]!.hpB as number) <= half) out.push(`row ${i} already crossed`);
    }
    return out;
  };
  it('on the real settlement: the engine\'s phase Break ⇔ the program\'s phase beat, at the first crossing row, after its staged turn', () => {
    const p = FIXTURE.program, staged = stagedTurns(FIXTURE.settlement);
    expect(agreement(p, FIXTURE.settlement)).toEqual([]);
    expect(staged.turnRows[p.phase!.afterTurn]!).toBeLessThanOrEqual(p.phase!.rowIndex!);
    expect(staged.turnRows[p.phase!.afterTurn + 1] ?? Infinity).toBeGreaterThan(p.phase!.rowIndex!);
    // every guardian hit after the phase is at the cap; none before it is
    for (const [k, t] of p.turns.entries()) if (t.guardianStrike && t.critical !== true) expect(t.guardianStrike.hitstopMs === HITSTOP.capMs, `turn ${k}`).toBe(staged.turnRows[k]! > p.phase!.rowIndex!);
  });
  it('the crossing rule on synthetic rows: first crossing with both standing; a killing blow is no phase; a burn tick places it after the previous turn; an earlier leg places it first', () => {
    const log = [{ hpA: 30, hpB: 30 }, { hpA: 30, hpB: 21 }, { tick: true, hpA: 29, hpB: 20 }, { hpA: 20, hpB: 20 }, { hpA: 20, hpB: 10 }];
    expect(guardianPhaseRowV1(log, 40, 40)).toBe(2);
    expect(guardianPhaseRowV1([{ hpA: 30, hpB: 30 }, { hpA: 30, hpB: 0 }], 40, 40), 'the killing blow is not a phase change').toBeNull();
    expect(guardianPhaseRowV1([{ hpA: 0, hpB: 15 }], 40, 40), 'a fallen fighter: no phase').toBeNull();
    const base = { defender: { name: 'Brown Bear', kind: 'guardian' }, guardianSide: 'right' as const, guardian: GUARDIAN, opponent: CHALLENGER, log, maxB: 40, riseFromDy: 0.5, seed: 1,
      turns: [turnInput({ attacker: CHALLENGER, target: GUARDIAN }), turnInput({ attacker: CHALLENGER, target: GUARDIAN }), turnInput(), turnInput({ attacker: CHALLENGER, target: GUARDIAN })], turnRows: [0, 1, 3, 4] };
    const p = planGuardianProgramV1(base)!;
    expect(p.phase).toMatchObject({ afterTurn: 1, rowIndex: 2 });
    expect(p.turns[2]!.guardianStrike!.hitstopMs, 'the guardian\'s first hit after the phase is at the cap').toBe(HITSTOP.capMs);
    expect(planGuardianProgramV1({ ...base, startHpB: 18 })!.phase).toMatchObject({ afterTurn: -1, rowIndex: null });
    expect(planGuardianProgramV1({ ...base, maxB: null })!.phase).toBeNull();
    expect(planGuardianProgramV1({ ...base, maxB: null })!.phaseReason).toMatch(/max HP/);
    // finale: the guardian at 0 falls; the fighter at 0 → triumph; neither → none
    expect(planGuardianProgramV1({ ...base, log: [...log, { hpA: 20, hpB: 0 }] })!.finale?.piece).toBe('guardian-fall');
    expect(planGuardianProgramV1({ ...base, log: [...log, { hpA: 0, hpB: 10 }] })!.finale?.piece).toBe('guardian-triumph');
    expect(planGuardianProgramV1(base)!.finale).toBeNull();
  });
  it('negative control: a program whose phase beat was removed, or moved to a later row, disagrees with the engine', () => {
    const p = FIXTURE.program;
    expect(agreement({ ...p, phase: null }, FIXTURE.settlement).length).toBeGreaterThan(0);
    const row = p.phase!.rowIndex!;
    expect(row, 'the fixture crosses mid-leg, with rows on both sides').toBeGreaterThan(0); expect(row + 1).toBeLessThan(FIXTURE.settlement.transcript.log.length);
    expect(agreement({ ...p, phase: { ...p.phase!, rowIndex: row + 1 } }, FIXTURE.settlement)).toEqual(expect.arrayContaining([expect.stringMatching(/already crossed/)]));
    expect(agreement({ ...p, phase: { ...p.phase!, rowIndex: 0 } }, FIXTURE.settlement)).toEqual(expect.arrayContaining([expect.stringMatching(/above half/)]));
  });
});

/* ---------- the stage plays a set piece ---------- */
describe('guardian choreography — the stage plays a set piece between turns and returns to the turn path', () => {
  it('entrance on the real BattleStage: the guardian rises from below into its stand, the root fades in, the cues fire once in order, the frame resets', () => {
    const { nodes, f, TEX, layout, rigs } = stageRig(); let now = 0; const fired: string[] = [];
    let poses = 0; const counted = { left: { ...rigs.left, applyPose: (p: never, c: never) => { poses++; rigs.left.applyPose(p, c); } }, right: { ...rigs.right, applyPose: (p: never, c: never) => { poses++; rigs.right.applyPose(p, c); } } };
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: counted, masses: { left: 1, right: 1.6 }, cues: { sink: { play: (c) => { fired.push(`${c.cueId}@${c.atMs}`); } } } });
    const holder = nodes.find((n) => n.children.includes(rigs.right.root as object))!, root = stage.root as unknown as N;
    const piece = buildGuardianEntranceV1({ ...common, kind: 'guardian', riseFromDy: 0.6 });
    stage.playSetPiece(piece);
    expect(root.alpha).toBe(0); expect(holder.y).toBeCloseTo((layout.stands.right.y + 0.6) * 576, 6);
    for (let t = 0; t <= piece.durationMs + 20; t += 16) { now = t; stage.tickSetPiece(); if (t >= 892 && t < 892 + 16) expect(holder.y).toBeCloseTo(layout.stands.right.y * 576, 6); }
    expect(fired).toEqual(['battle:battle-start@0', 'creature:land-thud@892', 'battle:shake-rumble@892', 'creature:call@1180']);
    expect(root.alpha).toBe(1); expect(root.x).toBe(0); expect(root.y).toBe(0); expect(stage.tickSetPiece(), 'done: no piece left').toBeNull();
    expect(poses).toBeGreaterThan(0);
    // the turn path resumes untouched
    now += 100; const plan = stage.play(turnInput({ arena: { groundLineY: layout.groundLineY, stands: layout.stands } })); expect(plan.kind).toBe('turn-plan');
  });
  it('reduced motion: the set piece never poses a rig per tick and never moves the camera', () => {
    const { f, TEX, layout, rigs } = stageRig(); let now = 0; let poses = 0;
    const counted = { left: { ...rigs.left, applyPose: (p: never, c: never) => { poses++; rigs.left.applyPose(p, c); } }, right: { ...rigs.right, applyPose: (p: never, c: never) => { poses++; rigs.right.applyPose(p, c); } } };
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: counted, masses: { left: 1, right: 1.6 }, reducedMotion: true });
    const atBuild = poses; const piece = buildGuardianPhaseV1({ ...common, reducedMotion: true }); stage.playSetPiece(piece);
    const afterRest = poses; expect(afterRest - atBuild).toBe(2); // the rest pose once, as a reduced-motion turn does
    for (let t = 0; t <= piece.durationMs; t += 50) { now = t; const fr = stage.tickSetPiece(); if (fr) { expect(fr.sample.camera).toEqual({ shake: { x: 0, y: 0 }, flash: 0 }); } }
    expect(poses).toBe(afterRest);
  });
});
