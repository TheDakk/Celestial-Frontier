/** @module battle2/choreography [domain] — the pure turn state machine of MOTION_KIT §7 ARENA:
 * ready → command → approach → action → hitstop → impact presentation → reaction → return → idle.
 * buildTurnPlan turns one turn's inputs into absolute milliseconds for every beat; sampleTurn is a
 * function of (plan, ms). Idle runs additively under every one-shot clip (both combatants idle
 * throughout) with its clock frozen through hitstop, so every phase boundary is continuous.
 * No clock, no randomness: seeds only reach the idle period through the motion timing table. */
import type { BodyCard } from '../motion/body-card.js';
import { buildTimeline, EASE_FN, sampleTimeline, type MotionTimeline } from '../motion/timeline.js';
import { ACTION_PHASES, DAMAGE_NUMBER, FLASH, SHAKE, SMEAR_FRAME_MS, TIMING_BAR, hitstopMs, scaleMs } from '../motion/timing.js';
import { placeEffectSequence, type EffectSequenceAnchors, type NormalizedPoint, type SequencePlacement } from '../effects/anchors.js';
import { buildEffectSchedule, sampleSchedule, type EffectDelivery, type EffectSample, type EffectSchedule } from '../effects/sequencer.js';
import { portraitClip, samplePortraitClip, type PortraitAction, type PortraitClip } from './fallback.js';
import type { RigPose, RigPoseContext } from './fixture-rig.js';
import { RUN_UP_FRACTION } from './arena.js';

export const APPROACH_CAP_MS = 500, RETURN_CAP_MS = 500, IDLE_TAIL_MS = 600, CURSOR_BLINK_MS = 250;
/** A2: the approach walks at most this long in whole gait cycles (≈ 2 crab cycles); the lunge covers the rest. */
export const APPROACH_CADENCE_CAP_MS = 900;
export const NUMBER_RISE = 0.07, NUMBER_LIFT = 0.30, DODGE_LEAD_MS = 120, CONTACT_GAP = 0.02, RUN_UP_MIN_FRACTION = 0.15;
export type Side = 'left' | 'right';
export type TurnOutcome = 'hit' | 'dodge' | 'miss';
export type TurnPhase = 'ready' | 'command' | 'approach' | 'action' | 'hitstop' | 'impact' | 'return' | 'idle' | 'done';
export interface CombatantPlanInput { readonly side: Side; readonly mass: number; readonly card: BodyCard | null; readonly seed: number; readonly label: string;
  /** Decision A2 (Nick, 2026-09-22): when present the approach WALKS whole gait cycles up to `APPROACH_CADENCE_CAP_MS`
   * with feet planted in the arena (the stage passes `stageDisplacement` per tick), and the attack's own lunge covers
   * the remaining run-up by impact. `bodyLength` in stand units (fraction of frame width), `stanceReach` in body
   * lengths per stance (the rig's measured accommodatable recede). Absent → the legacy eased 420 ms run-up. */
  readonly cadence?: Readonly<{ bodyLength: number; stanceReach: number }>; }
export interface TurnCadence { readonly cycles: number; readonly gaitMs: number; readonly perCycle: number; readonly walked: number; readonly bodyLength: number; }
export interface TurnArena {
  readonly groundLineY: number; readonly stands: Readonly<{ left: NormalizedPoint; right: NormalizedPoint }>;
  /** Half the standing width of each combatant at stage scale, as a fraction of frame width; the run-up stops at contact. Absent → RUN_UP_FRACTION. */
  readonly halfWidths?: Readonly<{ left: number; right: number }>;
  /** Each combatant's painted box at rest (frame-height fractions: centre and top). The stage fills it (like halfWidths). A target that does not
   * stand on the ground line (a flyer, a swimmer) takes the impact and the damage number at its BODY, not on the dry ground line (review
   * 2026-09-24: a Fruit Bat's hit burst landed on the ground under it). Absent, or a grounded target → the ground line as before. */
  readonly bodies?: Readonly<{ left: Readonly<{ centreY: number; topY: number }>; right: Readonly<{ centreY: number; topY: number }> }>;
}
/** An anatomy attack selected for the turn (E1 §1.2): its motion replaces the delivery clip and its contact instant is the
 * impact beat. Built by `compileAnatomyAttack` in the wiring; the plan never selects verbs. */
export interface TurnAttack { readonly verb: string; readonly timeline: MotionTimeline; readonly contactMs: number; readonly contactJoint: string; }
export interface TurnPlanInput {
  readonly seed: number;
  readonly attacker: CombatantPlanInput; readonly target: CombatantPlanInput;
  readonly delivery: EffectDelivery; readonly theme: string;
  readonly outcome: TurnOutcome; readonly damage: number; readonly critical?: boolean; readonly targetFaints?: boolean;
  readonly effect: EffectSequenceAnchors | null;
  readonly arena: TurnArena;
  /** Game-owned turn time the timing bar fills over, then the command window (cursor + confirm). */
  readonly readyMs: number; readonly commandMs: number; readonly idleTailMs?: number;
  readonly reducedMotion?: boolean;
  /** Present only for a rigged attacker; ignored (with the family delivery clip used) for a portrait. */
  readonly attack?: TurnAttack | null;
}
export type TurnClip = Readonly<{ source: 'timeline'; timeline: MotionTimeline }> | Readonly<{ source: 'portrait'; clip: PortraitClip }>;
export interface TurnBeats {
  readonly readyEnd: number; readonly commandEnd: number; readonly actionStart: number; readonly impactAt: number; readonly hitstopEnd: number;
  readonly flashEnd: number; readonly shakeEnd: number; readonly numbersEnd: number; readonly reactionStart: number; readonly reactionEnd: number;
  readonly actionEnd: number; readonly returnEnd: number; readonly idleStart: number; readonly end: number;
}
export interface TurnPlan {
  readonly kind: 'turn-plan'; readonly seed: number;
  readonly attacker: Readonly<{ side: Side; facing: 1 | -1; mass: number; label: string; rigged: boolean }>;
  readonly target: Readonly<{ side: Side; facing: 1 | -1; mass: number; label: string; rigged: boolean }>;
  readonly delivery: EffectDelivery; readonly theme: string; readonly outcome: TurnOutcome; readonly targetFaints: boolean;
  readonly beats: TurnBeats; readonly phases: readonly Readonly<{ phase: TurnPhase; start: number; end: number }>[];
  /** A2 cadence of the approach, or null for the legacy eased run-up. */
  readonly cadence: TurnCadence | null;
  readonly hitstopMs: number; readonly runUp: number; readonly arena: TurnArena;
  readonly clips: Readonly<{ attacker: Readonly<{ idle: TurnClip; approach: TurnClip; action: TurnClip; after: TurnClip }>; target: Readonly<{ idle: TurnClip; reaction: TurnClip | null }> }>;
  readonly effect: Readonly<{ anchors: EffectSequenceAnchors; schedule: EffectSchedule; placement: SequencePlacement; startMs: number }> | null;
  readonly number: Readonly<{ text: string; x: number; y: number }>;
  readonly reducedMotion: boolean;
  /** The anatomy attack the action clip came from, or null (delivery clip). */
  readonly attack: TurnAttack | null;
}
export interface CombatantSample { readonly pose: RigPose; readonly displacementX: number; readonly facing: 1 | -1; readonly context: RigPoseContext; }
export interface NumberSample { readonly text: string; readonly x: number; readonly y: number; readonly scale: number; readonly alpha: number; readonly visible: boolean; }
export interface StageSample {
  readonly ms: number; readonly phase: TurnPhase; readonly timingBar: number;
  readonly cursor: Readonly<{ visible: boolean; on: boolean; side: Side }>;
  readonly attacker: CombatantSample; readonly target: CombatantSample;
  readonly effect: EffectSample | null;
  readonly camera: Readonly<{ shake: Readonly<{ x: number; y: number }>; flash: number }>;
  readonly numbers: readonly NumberSample[];
  /** Attacker run-up displacement, normalized arena x (signed); the stage multiplies by frame width for parallax. */
  readonly runUpX: number;
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const facingOf = (side: Side): 1 | -1 => (side === 'left' ? 1 : -1);
const clipMs = (c: TurnClip): number => (c.source === 'timeline' ? c.timeline.durationMs : c.clip.durationMs);
const clipId = (c: TurnClip): string => (c.source === 'timeline' ? c.timeline.actionId : c.clip.actionId);
/** Stationary clips plant every foot (quadruped compatibility solver); gaits, lunges and the victory rear-up free them
 * (E1.5 finding: the quadruped victory clip's root loading exceeds the 8 % planted compression bound — it is a lift, not a stance). */
export const plantedFor = (actionId: string): boolean => /^(idle|alert|hit|faint|tame|feed|cast|sway|disturb|harvest|grow)$/.test(actionId);
const contextOf = (c: TurnClip, elapsedMs: number, weight = 1): RigPoseContext => { const actionId = clipId(c); return Object.freeze({ actionId, elapsedMs: Math.max(0, elapsedMs), durationMs: clipMs(c), weight, planted: plantedFor(actionId), travel: 'stage' as const }); };
function makeClip(c: CombatantPlanInput, action: PortraitAction, seed: number): TurnClip {
  if (c.card) return { source: 'timeline', timeline: buildTimeline(c.card, action, seed) };
  return { source: 'portrait', clip: portraitClip(action, c.mass, seed) };
}
export function sampleClip(c: TurnClip, ms: number): RigPose {
  if (c.source === 'portrait') return samplePortraitClip(c.clip, ms);
  const p = sampleTimeline(c.timeline, ms), out: Record<string, { rotation: number; dx?: number; dy?: number }> = {};
  for (const [j, r] of Object.entries(p.joints)) if (j !== 'root') out[j] = { rotation: r };
  out.root = { rotation: p.root.rotation, dx: p.root.dx, dy: p.root.dy };
  return out;
}
/** Additive layering: rotations and root offsets sum. */
export function addPose(a: RigPose, b: RigPose): RigPose {
  const out: Record<string, { rotation: number; dx?: number; dy?: number }> = {};
  for (const src of [a, b]) for (const [j, v] of Object.entries(src)) {
    const cur = out[j] ?? { rotation: 0 };
    out[j] = { rotation: cur.rotation + v.rotation, dx: (cur.dx ?? 0) + (v.dx ?? 0), dy: (cur.dy ?? 0) + (v.dy ?? 0) };
  }
  return out;
}
const impactOffset = (delivery: EffectDelivery, mass: number): number => {
  const upto = delivery === 'melee' ? ['anticipation', 'strike'] : ['rise', 'hold', 'release'];
  return (ACTION_PHASES[delivery] ?? []).filter(([n]) => upto.includes(n)).reduce((s, [, base]) => s + scaleMs(base, mass), 0);
};

export function buildTurnPlan(input: TurnPlanInput): TurnPlan {
  const { attacker: A, target: T } = input;
  if (A.side === T.side) throw new TypeError('turn plan: attacker and target must stand on different sides');
  if (!(A.mass > 0) || !(T.mass > 0) || !Number.isFinite(A.mass) || !Number.isFinite(T.mass)) throw new TypeError('turn plan: mass classes must be positive');
  if (!(input.readyMs >= 0) || !(input.commandMs >= 0)) throw new TypeError('turn plan: readyMs and commandMs must be non-negative');
  if (!['hit', 'dodge', 'miss'].includes(input.outcome)) throw new TypeError(`turn plan: unknown outcome ${String(input.outcome)}`);
  // A rigged combatant's mass is the card's (A1 timelines scale by it); `mass` is only read for portraits.
  const massA = A.card ? A.card.massClass.multiplier : A.mass, massT = T.card ? T.card.massClass.multiplier : T.mass;
  const facing = facingOf(A.side), standA = input.arena.stands[A.side], standT = input.arena.stands[T.side];
  const standDistance = Math.abs(standT.x - standA.x), hw = input.arena.halfWidths;
  const runUpLength = hw ? Math.min(RUN_UP_FRACTION * standDistance, Math.max(RUN_UP_MIN_FRACTION * standDistance, standDistance - hw[A.side] - hw[T.side] - CONTACT_GAP)) : RUN_UP_FRACTION * standDistance;
  const runUp = runUpLength * facing;
  const hit = input.outcome === 'hit', targetFaints = hit && input.targetFaints === true;
  const seedA = (input.seed ^ A.seed) >>> 0, seedT = (input.seed ^ T.seed ^ 0x9e3779b9) >>> 0;
  const attack = input.attack && A.card ? input.attack : null;
  if (attack) {
    if (!(attack.contactMs > 0) || !Number.isFinite(attack.contactMs) || attack.contactMs > attack.timeline.durationMs) throw new TypeError('turn plan: attack contact must lie inside its timeline');
    if (attack.timeline.recipeHash !== A.card!.recipeHash) throw new TypeError('turn plan: attack timeline was built for another body');
    if (!attack.contactJoint || !(attack.contactJoint in A.card!.bounds.limitsDeg)) throw new TypeError(`turn plan: attack contact joint ${attack.contactJoint} is not on the attacker`);
  }
  const clips = {
    attacker: { idle: makeClip(A, 'idle', seedA), approach: makeClip(A, 'approach', seedA), action: attack ? { source: 'timeline' as const, timeline: attack.timeline } : makeClip(A, input.delivery, seedA), after: makeClip(A, targetFaints ? 'victory' : 'idle', seedA) },
    target: { idle: makeClip(T, 'idle', seedT), reaction: hit ? makeClip(T, targetFaints ? 'faint' : 'hit', seedT) : input.outcome === 'dodge' ? makeClip(T, 'dodge', seedT) : null },
  };
  const readyEnd = input.readyMs, commandEnd = readyEnd + input.commandMs;
  // where the hit lands: the ground line for a grounded target (unchanged), the target's painted body for a flyer or swimmer
  // effects aim at a fighter's BODY when it does not stand on the ground line: its stand is a FOOT anchor, which for a swimmer can sit
  // below the frame (the Salmon's is at y 1.001 on a lake; the matchup picker's browser run refused Tree Frog vs Salmon on it)
  const bodyPoint = (side: Side, stand: NormalizedPoint): NormalizedPoint => { const b = input.arena.bodies?.[side]; return b && Math.abs(stand.y - input.arena.groundLineY) >= 1e-9 ? { x: stand.x, y: Math.min(0.98, Math.max(0.02, b.centreY)) } : stand; };
  const targetBody = input.arena.bodies?.[T.side], grounded = !targetBody || Math.abs(standT.y - input.arena.groundLineY) < 1e-9;
  const impactY = grounded ? input.arena.groundLineY : Math.min(0.98, Math.max(0.02, targetBody.centreY));
  const numberY = grounded ? input.arena.groundLineY - NUMBER_LIFT : Math.max(0.04, targetBody.topY - 0.04);
  // A2 cadence: whole gait cycles (unmodified gait duration) up to the cap; feet planted; the lunge does the rest
  let cadence: TurnCadence | null = null;
  if (A.cadence) {
    const { bodyLength, stanceReach } = A.cadence;
    if (!(bodyLength > 0) || !(stanceReach > 0) || !Number.isFinite(bodyLength) || !Number.isFinite(stanceReach)) throw new TypeError('turn plan: cadence bodyLength and stanceReach must be positive');
    const gaitMs = clipMs(clips.attacker.approach), perCycle = 2 * stanceReach;
    const needed = Math.max(1, Math.ceil(runUpLength / bodyLength / perCycle)), cycles = Math.max(1, Math.min(needed, Math.floor(APPROACH_CADENCE_CAP_MS / gaitMs)));
    // `perCycle` is the ACTUAL signed body lengths the stage travels per cycle (≤ the reach capacity 2 × stanceReach):
    // the solver's recede must equal the stage's travel, not the capacity, or a short run-up over-cancels
    const walkedLength = Math.min(runUpLength, cycles * perCycle * bodyLength);
    cadence = Object.freeze({ cycles, gaitMs, perCycle: (walkedLength / (cycles * bodyLength)) * facing, walked: walkedLength * facing, bodyLength });
  }
  const actionStart = commandEnd + (cadence ? cadence.cycles * cadence.gaitMs : Math.min(APPROACH_CAP_MS, scaleMs(420, massA)));
  const stop = hit ? hitstopMs(massA) : 0;
  let effect: TurnPlan['effect'] = null, impactLocal = attack ? attack.contactMs : impactOffset(input.delivery, massA);
  if (input.effect) {
    const raw = placeEffectSequence(input.effect, { attacker: { x: standA.x + runUp, y: bodyPoint(A.side, standA).y }, target: bodyPoint(T.side, standT) }, { groundLineY: impactY });
    // Melee themes hold the sweep across both stands (revealed by alpha in sampleTurn); cast themes slide origin→contact.
    const placement: SequencePlacement = input.delivery === 'melee' ? { ...raw, travel: raw.travel.map((p) => ({ ...p, from: raw.launch.from, to: raw.launch.from })) } : raw;
    const schedule = buildEffectSchedule(input.effect, { delivery: input.delivery, attackerMassClass: massA, ...(attack ? { impactAtMs: attack.contactMs } : {}) }, placement);
    if (Math.abs(schedule.impactAt - impactLocal) > 1e-6) throw new Error(`turn plan: effect impact ${schedule.impactAt} disagrees with motion strike ${impactLocal}`);
    impactLocal = schedule.impactAt; effect = { anchors: input.effect, schedule, placement, startMs: actionStart };
  }
  const impactAt = actionStart + impactLocal, hitstopEnd = impactAt + stop;
  const flashEnd = hit ? impactAt + FLASH.whiteFrames * SMEAR_FRAME_MS + FLASH.fadeMs : impactAt;
  const shakeEnd = hit ? impactAt + SHAKE.ms : impactAt, numbersEnd = impactAt + DAMAGE_NUMBER.popMs + DAMAGE_NUMBER.riseMs;
  const reactionStart = clips.target.reaction ? (hit ? hitstopEnd : Math.max(actionStart, impactAt - scaleMs(DODGE_LEAD_MS, massT))) : impactAt;
  const reactionEnd = clips.target.reaction ? reactionStart + clipMs(clips.target.reaction) : reactionStart;
  const actionEnd = actionStart + clipMs(clips.attacker.action) + stop;
  const returnEnd = actionEnd + Math.min(RETURN_CAP_MS, scaleMs(380, massA));
  const effectEnd = effect ? effect.startMs + effect.schedule.durationMs : 0;
  const idleStart = Math.max(returnEnd, reactionEnd, flashEnd, shakeEnd, numbersEnd, effectEnd);
  const end = idleStart + (input.idleTailMs ?? IDLE_TAIL_MS);
  const beats: TurnBeats = { readyEnd, commandEnd, actionStart, impactAt, hitstopEnd, flashEnd, shakeEnd, numbersEnd, reactionStart, reactionEnd, actionEnd, returnEnd, idleStart, end };
  const bounds: readonly (readonly [TurnPhase, number, number])[] = [['ready', 0, readyEnd], ['command', readyEnd, commandEnd], ['approach', commandEnd, actionStart], ['action', actionStart, impactAt],
    ['hitstop', impactAt, hitstopEnd], ['impact', hitstopEnd, actionEnd], ['return', actionEnd, returnEnd], ['idle', returnEnd, end]];
  const phases = bounds.filter(([, s, e]) => e > s).map(([phase, start, end]) => Object.freeze({ phase, start, end }));
  const text = hit ? `${Math.round(input.damage)}${input.critical ? '!' : ''}` : input.outcome === 'dodge' ? 'DODGE' : 'MISS';
  return Object.freeze({
    kind: 'turn-plan', seed: input.seed,
    attacker: { side: A.side, facing, mass: massA, label: A.label, rigged: A.card !== null }, target: { side: T.side, facing: facingOf(T.side), mass: massT, label: T.label, rigged: T.card !== null },
    delivery: input.delivery, theme: input.theme, outcome: input.outcome, targetFaints, beats, phases: Object.freeze(phases), hitstopMs: stop, runUp, cadence, arena: input.arena, clips, effect,
    number: { text, x: standT.x, y: numberY }, reducedMotion: input.reducedMotion === true, attack,
  });
}

export function phaseAt(plan: TurnPlan, ms: number): TurnPhase {
  if (ms >= plan.beats.end) return 'done';
  return plan.phases.find((p) => ms >= p.start && ms < p.end)?.phase ?? plan.phases[0]?.phase ?? 'ready';
}
/** Hitstop freezes every idle clock for both combatants. */
const idleClock = (b: TurnBeats, ms: number): number => (ms < b.impactAt ? ms : ms < b.hitstopEnd ? b.impactAt : ms - (b.hitstopEnd - b.impactAt));

export function sampleTurn(plan: TurnPlan, ms: number): StageSample {
  if (!Number.isFinite(ms)) throw new TypeError('sampleTurn: ms must be finite');
  const b = plan.beats, phase = phaseAt(plan, ms), c = plan.clips;
  const u = input01(ms, 0, b.readyEnd);
  const timingBar = b.readyEnd === 0 ? 1 : u < 1 - TIMING_BAR.readyEaseFraction ? u : 1 - TIMING_BAR.readyEaseFraction + TIMING_BAR.readyEaseFraction * EASE_FN['ease-out']((u - (1 - TIMING_BAR.readyEaseFraction)) / TIMING_BAR.readyEaseFraction);
  const cursor = Object.freeze({ visible: phase === 'command', on: Math.floor(Math.max(0, ms - b.readyEnd) / CURSOR_BLINK_MS) % 2 === 0, side: plan.target.side });
  const numberBase = { text: plan.number.text, x: plan.number.x, y: plan.number.y };
  if (plan.reducedMotion) {
    const rest = (idle: TurnClip): CombatantSample => ({ pose: sampleClip(idle, 0), displacementX: 0, facing: 1, context: contextOf(idle, 0) });
    const shown = ms >= b.impactAt && ms < b.numbersEnd;
    return Object.freeze({ ms, phase, timingBar, cursor, attacker: { ...rest(c.attacker.idle), facing: plan.attacker.facing }, target: { ...rest(c.target.idle), facing: plan.target.facing },
      effect: null, camera: { shake: { x: 0, y: 0 }, flash: 0 }, numbers: [Object.freeze({ ...numberBase, scale: 1, alpha: shown ? 1 : 0, visible: shown })], runUpX: 0 });
  }
  const ic = idleClock(b, ms);
  // Attacker: idle underneath; approach / action (hitstop-frozen) / return / after on top.
  let aPose = sampleClip(c.attacker.idle, ic), disp = 0, aCtx = contextOf(c.attacker.idle, ic);
  // The gait clip is time-scaled to the capped approach/return windows so it completes exactly on the boundary.
  if (ms >= b.commandEnd && ms < b.actionStart) {
    if (plan.cadence) {
      // A2: whole gait cycles at the unmodified gait; the stage's travel is linear in time (Codex's cadence contract) and
      // `stageDisplacement` is the signed body lengths since the current half-cycle's planting boundary
      const cd = plan.cadence, since = ms - b.commandEnd, k = since / (cd.cycles * cd.gaitMs), within = (since / cd.gaitMs) % 1, half = within >= 0.5 ? 1 : 0;
      const at = within * cd.gaitMs; aPose = addPose(aPose, sampleClip(c.attacker.approach, at)); disp = cd.walked * k;
      // FORWARD body lengths (the solver recedes in body space, where forward is +x for either facing; the holder flips
      // the rig) — the film of 2026-09-22 found a right-side attacker refusing 7× on a world-signed value
      aCtx = Object.freeze({ ...contextOf(c.attacker.approach, at), stageDisplacement: Math.abs(cd.perCycle) * (within - half * 0.5) });
    } else { const k = input01(ms, b.commandEnd, b.actionStart), at = k * clipMs(c.attacker.approach); aPose = addPose(aPose, sampleClip(c.attacker.approach, at)); disp = plan.runUp * EASE_FN['ease-out'](k); aCtx = contextOf(c.attacker.approach, at); }
  }
  else if (ms >= b.actionStart && ms < b.actionEnd) {
    aPose = addPose(aPose, sampleClip(c.attacker.action, ic - b.actionStart)); aCtx = contextOf(c.attacker.action, ic - b.actionStart);
    // A2: the lunge covers the run-up the walk did not, arriving exactly at impact (eased), then holds
    disp = plan.cadence ? plan.cadence.walked + (plan.runUp - plan.cadence.walked) * EASE_FN['ease-out'](input01(ic, b.actionStart, b.impactAt)) : plan.runUp;
  }
  else if (ms >= b.actionEnd && ms < b.returnEnd) { const k = input01(ms, b.actionEnd, b.returnEnd), at = k * clipMs(c.attacker.approach); aPose = addPose(aPose, sampleClip(c.attacker.approach, at)); disp = plan.runUp * (1 - EASE_FN['sine-in-out'](k)); aCtx = contextOf(c.attacker.approach, at); }
  else if (ms >= b.returnEnd && plan.targetFaints) { aPose = addPose(aPose, sampleClip(c.attacker.after, ms - b.returnEnd)); aCtx = contextOf(c.attacker.after, ms - b.returnEnd); } // victory; otherwise `after` is the idle already underneath
  // Target: idle underneath (frozen through hitstop); reaction on top; faint holds its final pose.
  let tPose = sampleClip(c.target.idle, ic), tCtx = contextOf(c.target.idle, ic);
  if (c.target.reaction && ms >= b.reactionStart) { tPose = addPose(tPose, sampleClip(c.target.reaction, ms - b.reactionStart)); tCtx = contextOf(c.target.reaction, ms - b.reactionStart); }
  // Impact presentation (hit only): flash two frames then 120 fade; shake 6 px × mass decaying over 180; number pop/rise/fade.
  const hit = plan.outcome === 'hit', since = ms - b.impactAt;
  const white = FLASH.whiteFrames * SMEAR_FRAME_MS;
  const flash = hit && since >= 0 && ms < b.flashEnd ? (since < white ? 1 : 1 - (since - white) / FLASH.fadeMs) : 0;
  let shake = { x: 0, y: 0 };
  if (hit && since >= 0 && ms < b.shakeEnd) { const decay = (1 - since / SHAKE.ms) ** 2, amp = SHAKE.amplitudePx * plan.attacker.mass * decay; shake = { x: amp * Math.sin((since / 40) * Math.PI * 2), y: amp * 0.5 * Math.cos((since / 27) * Math.PI * 2) }; }
  const numbers: NumberSample[] = [];
  if (since >= 0 && ms < b.numbersEnd) {
    const pop = since < DAMAGE_NUMBER.popMs ? EASE_FN['back-out'](since / DAMAGE_NUMBER.popMs) : 1, rise = EASE_FN['ease-out'](clamp01(since / DAMAGE_NUMBER.riseMs));
    const fadeStart = DAMAGE_NUMBER.riseMs - DAMAGE_NUMBER.fadeMs, alpha = since < fadeStart ? 1 : 1 - (since - fadeStart) / DAMAGE_NUMBER.fadeMs;
    numbers.push(Object.freeze({ ...numberBase, y: plan.number.y - NUMBER_RISE * rise, scale: pop, alpha: clamp01(alpha), visible: true }));
  }
  let effect: EffectSample | null = null;
  if (plan.effect) {
    const raw = sampleSchedule(plan.effect.schedule, ms - plan.effect.startMs);
    effect = plan.delivery !== 'melee' ? raw : Object.freeze({ ...raw, tracks: Object.freeze(raw.tracks.map((t, i) => {
      if (t.phase !== 'travel') return t;
      const tr = plan.effect!.schedule.tracks[i]!, reveal = clamp01((ms - plan.effect!.startMs - tr.startMs) / ((tr.endMs - tr.startMs) * 0.5));
      return Object.freeze({ ...t, transform: Object.freeze({ ...t.transform, alpha: t.transform.alpha * reveal }) });
    })) });
  }
  return Object.freeze({ ms, phase, timingBar, cursor, attacker: { pose: aPose, displacementX: disp, facing: plan.attacker.facing, context: aCtx }, target: { pose: tPose, displacementX: 0, facing: plan.target.facing, context: tCtx },
    effect, camera: { shake, flash: clamp01(flash) }, numbers: Object.freeze(numbers), runUpX: disp });
}
const input01 = (ms: number, s: number, e: number): number => (e <= s ? 1 : clamp01((ms - s) / (e - s)));
