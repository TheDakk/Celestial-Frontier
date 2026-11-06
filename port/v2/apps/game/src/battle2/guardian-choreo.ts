/** @module battle2/guardian-choreo [domain] — boss choreography for a Guardian or Titan fight on the painted stage (design and every
 * number's source: audits/GUARDIAN_CHOREOGRAPHY_20261001/DESIGN.md). Opt-in (`?guardianChoreo=1`, battle2-gate.ts), default OFF.
 *
 * PRESENTATION ONLY. Everything here is read from the settled fight (the transcript rows, the turn inputs already built from them, the
 * defender's kind); nothing feeds back into combat, rewards or the encounter's RNG, and nothing here draws randomness or reads a clock:
 * the only seeds are the idle clips' periods, exactly as in a turn plan. Four set pieces play BETWEEN turns on the stage —
 *   entrance (arena reveal → the frame-filling guardian rises into its stand → it rears and roars under its name card),
 *   phase    (at the existing ½-HP phase change: hitstop at the cap, flash, roar, shake, the same rear-up pose, a caption),
 *   fall     (the guardian collapses if the last strike did not already fell it, then dissolves),
 *   triumph  (the guardian roars; the fallen fighter leaves for Recovery — §20: defeat is Recovery, never loss),
 * and one per-turn overlay: a guardian's HIT is a heavy strike (titanic hitstop/shake, the hitstop cap on a critical or once phased).
 * Every duration is a Motion Kit §5 row scaled by the titanic mass class through `scaleMs` (so the 0.6×–2.0× bounds hold), a §7 panel
 * timing, or the §20 relay-beat hold — never a free number. */
import { encounterHasGuardianPhaseV1, ENCOUNTER_GUARDIAN_PHASE_V1, runEncounterV1, type CombatSettlementPlanV1 } from '@cf/domain-combatcore';
import { assertCueId } from '../soundkit/cues.js';
import type { MixOptions } from '../soundkit/mix.js';
import { EASE_FN } from '../motion/timeline.js';
import { ACTION_PHASES, FLASH, HITSTOP, MASS_CLASS, SHAKE, SMEAR_FRAME_MS, hitstopMs, scaleMs } from '../motion/timing.js';
import { addPose, contextOf, makeClip, sampleClip, shakeOffset, type CombatantPlanInput, type GuardianStrikeV1, type Side, type TurnClip, type TurnPlanInput } from './choreography.js';
import { admitCues, type CueSource, type TurnCue, type TurnCuePlan } from './cue-plan.js';
import type { RigPose, RigPoseContext } from './fixture-rig.js';
import { BATTLE2_SWAP_BEAT_MS_V1, BATTLE2_SWAP_BEAT_REDUCED_MS_V1 } from './swap-beats.js';

/** The guardian's mass class for every boss timing: titanic (MOTION_KIT §5 / timing.ts MASS_CLASS). A guardian whose card is lighter is
 * floored to it; a heavier input is still held to 2.0× base by `scaleMs`. */
export const GUARDIAN_CHOREO_MASS = MASS_CLASS.titanic;
/** MOTION_KIT §7 PANELS: open ease-out 220, close ease-in 160 — the name card and captions are panels. */
export const GUARDIAN_PANEL = Object.freeze({ openMs: 220, closeMs: 160 });
const base = (family: string, phase?: string): number => (ACTION_PHASES[family] ?? []).filter(([n]) => phase === undefined || n === phase).reduce((s, [, ms]) => s + ms, 0);

/** Every boss beat duration at a mass class (DESIGN.md §2 table). */
export function guardianBeatTimings(mass: number): Readonly<{ revealMs: number; riseMs: number; settleMs: number; roarMs: number; collapseMs: number; phaseHitstopMs: number; strikeHitstopMs: number; shakeAmplitudePx: number }> {
  if (!(mass > 0) || !Number.isFinite(mass)) throw new TypeError('guardian choreography: mass class must be positive');
  const m = Math.max(mass, GUARDIAN_CHOREO_MASS);
  return Object.freeze({
    revealMs: GUARDIAN_PANEL.openMs,                 // §7 panel open
    riseMs: scaleMs(base('approach'), m),            // §5 approach 420 (distance-independent) × mass
    settleMs: scaleMs(base('hit', 'settle'), m),     // §5 hit settle 180 × mass
    roarMs: scaleMs(base('victory'), m),             // §5 victory 600 × mass (rear, toss, settle — the rig's measured tallest pose)
    collapseMs: scaleMs(base('faint'), m),           // §5 faint 520 × mass
    phaseHitstopMs: HITSTOP.capMs,                   // §5 hitstop cap 140: the phase change is the fight's heaviest beat
    strikeHitstopMs: hitstopMs(m),                   // §5 70 × attacker mass, capped 140
    shakeAmplitudePx: SHAKE.amplitudePx * m,         // §5 6 px at mass 1.00 (the turn's own rule, choreography.ts)
  });
}

/** A Guardian's heavy strike (DESIGN.md §4): titanic hitstop and shake; the cap on a critical or once the phase change has happened. */
export function guardianStrikeV1(o: Readonly<{ attackerMass: number; critical: boolean; phaseActive: boolean }>): GuardianStrikeV1 {
  const t = guardianBeatTimings(o.attackerMass), shakeMass = Math.max(o.attackerMass, GUARDIAN_CHOREO_MASS);
  return Object.freeze({ hitstopMs: o.critical || o.phaseActive ? HITSTOP.capMs : t.strikeHitstopMs, shakeMass });
}

export type GuardianSetPieceKind = 'guardian-entrance' | 'guardian-phase' | 'guardian-fall' | 'guardian-triumph';
export interface GuardianBeatV1 { readonly beat: string; readonly start: number; readonly end: number; }
export interface GuardianSetPieceV1 {
  readonly kind: 'guardian-set-piece'; readonly piece: GuardianSetPieceKind; readonly guardianSide: Side; readonly mass: number; readonly reducedMotion: boolean;
  /** Ordered, non-overlapping-by-construction beats on the set piece's own clock (ms 0 = the piece starts); zero-length beats are dropped. */
  readonly beats: readonly GuardianBeatV1[]; readonly durationMs: number;
  readonly caption: Readonly<{ text: string; inMs: number; holdMs: number; outMs: number; startMs: number }>;
  /** Raw cues (closed Sound Kit §4 vocabulary) on the beats; `buildGuardianCuePlan` admits them per beat (kit §5). */
  readonly cues: readonly TurnCue[];
  /** Stage reveal (root alpha 0 → 1) end; 0 = shown at once. */
  readonly revealEnd: number;
  /** Rise: the guardian starts `fromDy` (frame heights) below its stand and arrives with a back-out overshoot. */
  readonly rise: Readonly<{ start: number; end: number; fromDy: number }> | null;
  readonly hitstop: Readonly<{ start: number; end: number }> | null;
  readonly flashAt: number | null;
  readonly shake: Readonly<{ at: number; amplitudePx: number }> | null;
  /** The guardian's action: `once` = an overlay on its idle (`victory` = the rear-up roar) that settles back to idle; `fall` = the faint,
   * played from `start` with the idle fading out under it (the turn's own faint rule) and then held; `held` = the faint's final pose
   * throughout (the last turn already played it). */
  readonly guardianAction: Readonly<{ clip: TurnClip; start: number; mode: 'once' | 'fall' | 'held' }> | null;
  /** The opponent's held final faint pose (triumph only). */
  readonly opponentFaint: TurnClip | null;
  /** A side that dissolves (alpha 1 → 0, sine-in-out) over [start, end]. */
  readonly dissolve: Readonly<{ side: Side; start: number; end: number }> | null;
  readonly clips: Readonly<{ guardianIdle: TurnClip; opponentIdle: TurnClip }>;
}
export interface GuardianSetPieceSampleV1 {
  readonly ms: number; readonly beat: string; readonly done: boolean; readonly stageAlpha: number;
  readonly guardian: Readonly<{ pose: RigPose; context: RigPoseContext; dy: number; alpha: number }>;
  readonly opponent: Readonly<{ pose: RigPose; context: RigPoseContext; alpha: number }>;
  readonly camera: Readonly<{ shake: Readonly<{ x: number; y: number }>; flash: number }>;
  readonly caption: Readonly<{ text: string; alpha: number; visible: boolean }>;
}
export interface GuardianPieceInputV1 {
  readonly guardianSide: Side; readonly guardian: CombatantPlanInput; readonly opponent: CombatantPlanInput; readonly name: string; readonly seed: number;
  readonly reducedMotion?: boolean;
}

const clipDuration = (c: TurnClip): number => (c.source === 'timeline' ? c.timeline.durationMs : c.clip.durationMs);
const scalePose = (pose: RigPose, gain: number): RigPose => Object.fromEntries(Object.entries(pose).map(([j, v]) => [j, { rotation: v.rotation * gain, dx: (v.dx ?? 0) * gain, dy: (v.dy ?? 0) * gain }]));
const massOf = (c: CombatantPlanInput): number => (c.card ? c.card.massClass.multiplier : c.mass);
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const seeds = (p: GuardianPieceInputV1) => ({ g: (p.seed ^ p.guardian.seed) >>> 0, o: (p.seed ^ p.opponent.seed ^ 0x9e3779b9) >>> 0 });
function piece(p: GuardianPieceInputV1, kind: GuardianSetPieceKind, parts: Omit<GuardianSetPieceV1, 'kind' | 'piece' | 'guardianSide' | 'mass' | 'reducedMotion' | 'clips' | 'beats' | 'durationMs' | 'cues'>,
  beats: readonly (readonly [string, number, number])[], cues: readonly (readonly [string, number, CueSource, string])[]): GuardianSetPieceV1 {
  if (p.guardian.side !== p.guardianSide || p.opponent.side === p.guardianSide) throw new TypeError('guardian set piece: the guardian stands on guardianSide and the opponent on the other side');
  const s = seeds(p), c = parts.caption, captionEnd = c.startMs + c.inMs + c.holdMs + c.outMs;
  const kept = beats.filter(([, a, b]) => b > a).map(([beat, start, end]) => Object.freeze({ beat, start, end }));
  const durationMs = Math.max(captionEnd, ...kept.map((b) => b.end));
  const raw = cues.map(([cueId, atMs, source, beat]) => {
    assertCueId(cueId);
    if (!Number.isFinite(atMs) || atMs < 0) throw new RangeError(`guardian cue ${cueId} at ${atMs}: beats must be finite and non-negative`);
    return Object.freeze({ cueId, atMs, source, beat, ...(cueId === 'battle:hitstop-thump' ? { target: p.guardianSide } : {}) });
  });
  return Object.freeze({ kind: 'guardian-set-piece', piece: kind, guardianSide: p.guardianSide, mass: Math.max(massOf(p.guardian), GUARDIAN_CHOREO_MASS), reducedMotion: p.reducedMotion === true,
    beats: Object.freeze(kept), durationMs, cues: Object.freeze(raw), ...parts,
    clips: Object.freeze({ guardianIdle: makeClip(p.guardian, 'idle', s.g), opponentIdle: makeClip(p.opponent, 'idle', s.o) }) });
}
const caption = (text: string, startMs: number, reduced: boolean) => Object.freeze({ text, startMs, inMs: GUARDIAN_PANEL.openMs, outMs: GUARDIAN_PANEL.closeMs,
  holdMs: reduced ? BATTLE2_SWAP_BEAT_REDUCED_MS_V1 : BATTLE2_SWAP_BEAT_MS_V1 });   // the §20 relay-beat hold: one caption cadence on the stage

/** Entrance (DESIGN.md §3): reveal → rise → settle → roar under the name card. `riseFromDy` = how far below its stand the guardian starts,
 * in frame heights (the stage passes 1 − its painted top, so it starts wholly below the frame). */
export function buildGuardianEntranceV1(p: GuardianPieceInputV1 & { readonly kind?: string | null; readonly riseFromDy: number }): GuardianSetPieceV1 {
  if (!(p.riseFromDy >= 0) || !Number.isFinite(p.riseFromDy)) throw new TypeError('guardian entrance: riseFromDy must be a finite non-negative frame fraction');
  const reduced = p.reducedMotion === true, t = guardianBeatTimings(massOf(p.guardian)), s = seeds(p);
  const title = `${p.kind === 'titan' ? 'Titan' : 'Guardian'} · ${p.name}`;
  if (reduced) return piece(p, 'guardian-entrance', { caption: caption(title, 0, true), revealEnd: 0, rise: null, hitstop: null, flashAt: null, shake: null, guardianAction: null, opponentFaint: null, dissolve: null },
    [['card', 0, 0]], [['battle:battle-start', 0, 'battle', 'reveal'], ['creature:call', 0, p.guardianSide, 'roar']]);
  const reveal = t.revealMs, riseEnd = reveal + t.riseMs, settleEnd = riseEnd + t.settleMs, roarEnd = settleEnd + t.roarMs;
  return piece(p, 'guardian-entrance', {
    caption: caption(title, settleEnd, false), revealEnd: reveal, rise: Object.freeze({ start: reveal, end: riseEnd, fromDy: p.riseFromDy }), hitstop: null, flashAt: null,
    shake: Object.freeze({ at: riseEnd, amplitudePx: t.shakeAmplitudePx }), guardianAction: Object.freeze({ clip: makeClip(p.guardian, 'victory', s.g), start: settleEnd, mode: 'once' as const }), opponentFaint: null, dissolve: null,
  }, [['reveal', 0, reveal], ['rise', reveal, riseEnd], ['settle', riseEnd, settleEnd], ['roar', settleEnd, roarEnd]],
  [['battle:battle-start', 0, 'battle', 'reveal'], ['creature:land-thud', riseEnd, p.guardianSide, 'rise'], ['battle:shake-rumble', riseEnd, 'battle', 'rise'], ['creature:call', settleEnd, p.guardianSide, 'roar']]);
}

/** Phase change (DESIGN.md §5), played right after the turn that took the guardian to ½ HP: hitstop at the cap with the flash and the
 * thump, then the roar, the shake and the rear-up pose under a caption. */
export function buildGuardianPhaseV1(p: GuardianPieceInputV1): GuardianSetPieceV1 {
  const reduced = p.reducedMotion === true, t = guardianBeatTimings(massOf(p.guardian)), s = seeds(p);
  const text = `⚡ ${p.name} changes — its second phase`;
  if (reduced) return piece(p, 'guardian-phase', { caption: caption(text, 0, true), revealEnd: 0, rise: null, hitstop: null, flashAt: null, shake: null, guardianAction: null, opponentFaint: null, dissolve: null },
    [], [['battle:hitstop-thump', 0, 'battle', 'hitstop'], ['creature:call', 0, p.guardianSide, 'roar']]);
  const stop = t.phaseHitstopMs, roarEnd = stop + t.roarMs;
  return piece(p, 'guardian-phase', {
    caption: caption(text, stop, false), revealEnd: 0, rise: null, hitstop: Object.freeze({ start: 0, end: stop }), flashAt: 0,
    shake: Object.freeze({ at: stop, amplitudePx: t.shakeAmplitudePx }), guardianAction: Object.freeze({ clip: makeClip(p.guardian, 'victory', s.g), start: stop, mode: 'once' as const }), opponentFaint: null, dissolve: null,
  }, [['hitstop', 0, stop], ['roar', stop, roarEnd]],
  [['battle:hitstop-thump', 0, 'battle', 'hitstop'], ['battle:flash-sting', 0, 'battle', 'hitstop'], ['creature:call', stop, p.guardianSide, 'roar'], ['battle:shake-rumble', stop, 'battle', 'roar']]);
}

/** The guardian falls (DESIGN.md §7): collapse (unless the last turn's faint already played) → dissolve under the caption. */
export function buildGuardianFallV1(p: GuardianPieceInputV1 & { readonly faintPlayed: boolean }): GuardianSetPieceV1 {
  const reduced = p.reducedMotion === true, t = guardianBeatTimings(massOf(p.guardian)), s = seeds(p);
  const collapse = reduced || p.faintPlayed ? 0 : t.collapseMs, dissolveEnd = collapse + t.collapseMs;
  return piece(p, 'guardian-fall', {
    caption: caption(`★ ${p.name} is defeated`, collapse, reduced), revealEnd: 0, rise: null, hitstop: null, flashAt: null, shake: null,
    guardianAction: Object.freeze({ clip: makeClip(p.guardian, 'faint', s.g), start: 0, mode: p.faintPlayed ? 'held' as const : 'fall' as const }), opponentFaint: null,
    dissolve: Object.freeze({ side: p.guardianSide, start: collapse, end: dissolveEnd }),
  }, [['collapse', 0, collapse], ['dissolve', collapse, dissolveEnd]], [['battle:battle-end', dissolveEnd, 'battle', 'dissolve']]);
}

/** The guardian wins the leg (DESIGN.md §7): it roars while the fallen fighter leaves for Recovery (§20: defeat is Recovery, never loss). */
export function buildGuardianTriumphV1(p: GuardianPieceInputV1): GuardianSetPieceV1 {
  const reduced = p.reducedMotion === true, t = guardianBeatTimings(massOf(p.guardian)), s = seeds(p);
  const leave = scaleMs(base('faint'), massOf(p.opponent)), roarEnd = reduced ? 0 : t.roarMs;
  return piece(p, 'guardian-triumph', {
    caption: caption(`↻ ${p.opponent.label} falls back to Recovery`, 0, reduced), revealEnd: 0, rise: null, hitstop: null, flashAt: null, shake: null,
    guardianAction: reduced ? null : Object.freeze({ clip: makeClip(p.guardian, 'victory', s.g), start: 0, mode: 'once' as const }), opponentFaint: makeClip(p.opponent, 'faint', s.o),
    dissolve: Object.freeze({ side: p.guardianSide === 'left' ? 'right' : 'left', start: 0, end: leave }),
  }, [['roar', 0, roarEnd], ['leave', 0, leave]],
  [['battle:defeat-sting', 0, 'battle', 'roar'], ['creature:call', 0, p.guardianSide, 'roar'], ['battle:battle-end', Math.max(leave, roarEnd), 'battle', 'leave']]);
}

/** The set piece's cues through the kit's per-beat admission (the same rule as a turn's); shaped as a TurnCuePlan so TurnCuePlayer plays it. */
export function buildGuardianCuePlan(p: GuardianSetPieceV1, options: MixOptions = {}): TurnCuePlan {
  if (!p || p.kind !== 'guardian-set-piece') throw new TypeError('buildGuardianCuePlan: expected a guardian set piece');
  const { cues, dropped } = admitCues(p.cues, options);
  return Object.freeze({ kind: 'turn-cue-plan', theme: p.piece, reducedMotion: p.reducedMotion, cues: Object.freeze(cues), dropped: Object.freeze(dropped), endMs: p.durationMs });
}

/** Pure sampler: a function of (piece, ms) only. Both combatants idle throughout (§7), their clocks frozen through a hitstop. */
export function sampleGuardianSetPiece(p: GuardianSetPieceV1, ms: number): GuardianSetPieceSampleV1 {
  if (!Number.isFinite(ms)) throw new TypeError('sampleGuardianSetPiece: ms must be finite');
  const done = ms >= p.durationMs, beat = done ? 'done' : p.beats.find((b) => ms >= b.start && ms < b.end)?.beat ?? 'card';
  const c = p.caption, k = ms - c.startMs, hold = c.inMs + c.holdMs;
  const capAlpha = k < 0 ? 0 : k < c.inMs ? EASE_FN['ease-out'](k / c.inMs) : k < hold ? 1 : k < hold + c.outMs ? 1 - EASE_FN['ease-in']((k - hold) / c.outMs) : 0;
  const captionS = Object.freeze({ text: c.text, alpha: capAlpha, visible: capAlpha > 0 });
  const dissolveAlpha = (side: Side): number => { const d = p.dissolve; return !d || d.side !== side || ms < d.start ? 1 : d.end <= d.start ? 0 : 1 - EASE_FN['sine-in-out'](clamp01((ms - d.start) / (d.end - d.start))); };
  const oSide: Side = p.guardianSide === 'left' ? 'right' : 'left';
  if (p.reducedMotion) {
    const rest = (idle: TurnClip) => ({ pose: sampleClip(idle, 0), context: contextOf(idle, 0) });
    return Object.freeze({ ms, beat, done, stageAlpha: 1, guardian: { ...rest(p.clips.guardianIdle), dy: 0, alpha: dissolveAlpha(p.guardianSide) }, opponent: { ...rest(p.clips.opponentIdle), alpha: dissolveAlpha(oSide) },
      camera: { shake: { x: 0, y: 0 }, flash: 0 }, caption: captionS });
  }
  const hs = p.hitstop, ic = !hs || ms < hs.start ? ms : ms < hs.end ? hs.start : ms - (hs.end - hs.start);
  let gPose = sampleClip(p.clips.guardianIdle, ic), gCtx = contextOf(p.clips.guardianIdle, ic);
  const ga = p.guardianAction;
  if (ga && (ga.mode === 'held' || ic >= ga.start)) {
    const dur = clipDuration(ga.clip), at = ga.mode === 'held' ? dur : Math.min(dur, ic - ga.start);
    if (ga.mode === 'once') { if (at < dur) { gPose = addPose(gPose, sampleClip(ga.clip, at)); gCtx = contextOf(ga.clip, at); } }
    else { const gain = 1 - EASE_FN['sine-in-out'](clamp01(at / dur)); gPose = addPose(scalePose(gPose, gain), sampleClip(ga.clip, at)); gCtx = contextOf(ga.clip, at); }
  }
  let oPose = sampleClip(p.clips.opponentIdle, ic), oCtx = contextOf(p.clips.opponentIdle, ic);
  if (p.opponentFaint) { const dur = clipDuration(p.opponentFaint); oPose = sampleClip(p.opponentFaint, dur); oCtx = contextOf(p.opponentFaint, dur); }
  const r = p.rise, dy = !r || ms >= r.end ? 0 : ms < r.start ? r.fromDy : r.fromDy * (1 - EASE_FN['back-out']((ms - r.start) / (r.end - r.start)));
  const white = FLASH.whiteFrames * SMEAR_FRAME_MS, since = p.flashAt === null ? -1 : ms - p.flashAt;
  const flash = since >= 0 && since < white + FLASH.fadeMs ? (since < white ? 1 : 1 - (since - white) / FLASH.fadeMs) : 0;
  const sh = p.shake, shakeSince = sh ? ms - sh.at : -1;
  const shake = sh && shakeSince >= 0 && shakeSince < SHAKE.ms ? shakeOffset(shakeSince, sh.amplitudePx) : { x: 0, y: 0 };
  return Object.freeze({ ms, beat, done, stageAlpha: p.revealEnd > 0 && ms < p.revealEnd ? EASE_FN['ease-out'](clamp01(ms / p.revealEnd)) : 1,
    guardian: { pose: gPose, context: gCtx, dy, alpha: dissolveAlpha(p.guardianSide) }, opponent: { pose: oPose, context: oCtx, alpha: dissolveAlpha(oSide) },
    camera: { shake, flash: clamp01(flash) }, caption: captionS });
}

/* ---------- the program: which set pieces a settled fight plays, and where ---------- */
export interface GuardianProgramInputV1 {
  /** The settled defender: only a Guardian or Titan (the kinds with the §20 phase change) gets a program. */
  readonly defender: Readonly<{ name: string; kind?: string | null | undefined }>;
  readonly guardianSide: Side; readonly guardian: CombatantPlanInput; readonly opponent: CombatantPlanInput;
  /** The decisive leg's transcript rows, its defender max HP (absent → no phase beat, with a reason) and its defender HP at the leg's start. */
  readonly log: readonly Readonly<Record<string, unknown>>[]; readonly maxB: number | null; readonly startHpB?: number | null;
  /** The staged turn inputs and, per turn, the transcript row it was built from. */
  readonly turns: readonly TurnPlanInput[]; readonly turnRows: readonly number[];
  readonly riseFromDy: number; readonly seed: number; readonly reducedMotion?: boolean;
}
export interface GuardianProgramV1 {
  readonly kind: 'guardian-program';
  readonly entrance: GuardianSetPieceV1;
  /** `afterTurn` = the staged turn the phase set piece follows; −1 = before the first turn (the phase changed in an earlier leg). */
  readonly phase: Readonly<{ afterTurn: number; rowIndex: number | null; piece: GuardianSetPieceV1 }> | null;
  readonly phaseReason: string;
  /** The same turn inputs, a guardian HIT carrying its heavy strike; every other turn is the identical object. */
  readonly turns: readonly TurnPlanInput[];
  readonly finale: GuardianSetPieceV1 | null;
}
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The transcript row at which the guardian's phase change shows: the first row that takes its HP from above ½ to at or below ½ with both
 * fighters still standing (the engine's own condition, encounter.ts; the same crossing the Chronicle's guardian-phase cue listens for). */
export function guardianPhaseRowV1(log: readonly Readonly<Record<string, unknown>>[], maxB: number, startHpB: number): number | null {
  const half = maxB * ENCOUNTER_GUARDIAN_PHASE_V1.atFraction;
  let prev = startHpB;
  for (const [i, row] of log.entries()) {
    const hpB = num(row.hpB); if (hpB === null) continue;
    if (prev > half && hpB <= half && hpB > 0 && (num(row.hpA) ?? 1) > 0) return i;
    prev = hpB;
  }
  return null;
}

export function planGuardianProgramV1(input: GuardianProgramInputV1): GuardianProgramV1 | null {
  if (!encounterHasGuardianPhaseV1(input.defender.kind)) return null;
  if (input.turns.length !== input.turnRows.length) throw new TypeError('guardian program: one transcript row per staged turn');
  const common = { guardianSide: input.guardianSide, guardian: input.guardian, opponent: input.opponent, name: input.defender.name, seed: input.seed, reducedMotion: input.reducedMotion === true };
  const entrance = buildGuardianEntranceV1({ ...common, kind: input.defender.kind ?? null, riseFromDy: input.riseFromDy });
  let phase: GuardianProgramV1['phase'] = null, phaseReason: string, phaseRow: number | null = null, phasedFromStart = false;
  if (input.maxB === null || !(input.maxB > 0)) phaseReason = 'no defender max HP on the transcript: the phase beat is not placed';
  else {
    const start = input.startHpB ?? input.maxB, half = input.maxB * ENCOUNTER_GUARDIAN_PHASE_V1.atFraction;
    if (start <= half) { phasedFromStart = true; phase = Object.freeze({ afterTurn: -1, rowIndex: null, piece: buildGuardianPhaseV1(common) }); phaseReason = 'the phase changed in an earlier leg: shown before the decisive leg'; }
    else {
      phaseRow = guardianPhaseRowV1(input.log, input.maxB, start);
      if (phaseRow === null) phaseReason = 'the guardian never reached half health with both standing';
      else {
        let afterTurn = -1; for (const [k, row] of input.turnRows.entries()) if (row <= phaseRow) afterTurn = k;
        phase = Object.freeze({ afterTurn, rowIndex: phaseRow, piece: buildGuardianPhaseV1(common) }); phaseReason = `row ${phaseRow} took the guardian to half health`;
      }
    }
  }
  const turns = Object.freeze(input.turns.map((turn, k) => {
    if (turn.attacker.side !== input.guardianSide || turn.outcome !== 'hit') return turn;
    const phaseActive = phasedFromStart || (phaseRow !== null && input.turnRows[k]! > phaseRow);
    return Object.freeze({ ...turn, guardianStrike: guardianStrikeV1({ attackerMass: massOf(turn.attacker), critical: turn.critical === true, phaseActive }) });
  }));
  let lastA: number | null = null, lastB: number | null = null;
  for (const row of input.log) { const a = num(row.hpA), b = num(row.hpB); if (a !== null) lastA = a; if (b !== null) lastB = b; }
  const last = input.turns[input.turns.length - 1];
  const finale = lastB !== null && lastB <= 0 ? buildGuardianFallV1({ ...common, faintPlayed: last !== undefined && last.targetFaints === true && last.target.side === input.guardianSide })
    : lastA !== null && lastA <= 0 ? buildGuardianTriumphV1(common) : null;
  return Object.freeze({ kind: 'guardian-program', entrance, phase, phaseReason, turns, finale });
}

/** The decisive leg's defender HP at its start in a §20 party fight (the earlier legs wore it down), re-derived from the settled plan's
 * party + decisions by the pure engine — the same run as the relay beats (swap-beats.ts) and the Chronicle prelude. Null = no party. */
export function guardianDecisiveStartHpV1(
  party: CombatSettlementPlanV1['party'] | undefined,
  defender: Readonly<{ name: string; battleGenome: Readonly<Record<string, unknown>>; kind?: string | undefined }>,
): Readonly<{ startHpB: number; maxB: number }> | null {
  if (party === undefined || party.members.length < 2) return null;
  const result = runEncounterV1({
    mode: party.mode,
    defender: { name: defender.name, genome: defender.battleGenome as never, phase: encounterHasGuardianPhaseV1(defender.kind) },
    party: party.members.map((member) => (member.champion.kind === 'player'
      ? { name: member.champion.name, genome: { seed: member.champion.genomeSeed }, stats: member.champion.stats as never, stance: member.stance }
      : { name: member.champion.name, genome: member.champion.genome as never, stance: member.stance })),
  }, party.decisions);
  if (result.status !== 'finished') throw new TypeError('guardian program: the registered party settlement does not resolve');
  const decisive = result.legs[result.legs.length - 1]!;
  return Object.freeze({ startHpB: decisive.hpBStart, maxB: decisive.maxB });
}
