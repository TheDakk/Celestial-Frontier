/** @module battle2/cue-plan [domain] — sound cues synced to the turn beats (Sound Kit §4 vocabulary,
 * §5 admission). buildTurnCuePlan is a pure function of a TurnPlan: every cue sits on a beat the
 * choreography already owns (ready, command, approach, action, launch, travel, impact, reaction,
 * return), so sound and motion can never drift apart. Admission runs per beat through the kit's
 * planCues, so an over-concurrency cue is dropped with a reason, never delayed into a wrong beat.
 * TurnCuePlayer fires cues from an injected clock, once each, and drops a cue that arrives more than
 * CUE_LATE_DROP_MS late (a hidden tab must not replay a whole turn's sounds in one burst). */
import { DAMAGE_NUMBER } from '../motion/timing.js';
import { assertCueId } from '../soundkit/cues.js';
import { planCues, type MixOptions } from '../soundkit/mix.js';
import type { Side, TurnPlan } from './choreography.js';

export type CueSource = Side | 'battle';
export interface TurnCue {
  readonly cueId: string; readonly atMs: number; readonly source: CueSource;
  /** The choreography beat the cue rides (for logs and tests). */
  readonly beat: string;
  /** damage-tick only: the damage amount (pitch by amount, kit §4). */
  readonly amount?: number;
  /** hitstop-thump only: the side that takes the hit — the sink layers that body's material tail (kit §2: "a transient, a body thud
   *  scaled by mass, and a material tail"). */
  readonly target?: 'left' | 'right';
}
export interface DroppedCue extends TurnCue { readonly reason: string; }
export interface TurnCuePlan {
  readonly kind: 'turn-cue-plan'; readonly theme: string; readonly reducedMotion: boolean;
  readonly cues: readonly TurnCue[]; readonly dropped: readonly DroppedCue[]; readonly endMs: number;
}
export const CUE_LATE_DROP_MS = 90;
/** Kit §5: at one beat, cues are admitted by slot priority; equal times are one beat (rounded to 1/1000 ms). */
const beatKey = (ms: number): number => Math.round(ms * 1000) / 1000;

export function buildTurnCuePlan(plan: TurnPlan, options: MixOptions = {}): TurnCuePlan {
  if (!plan || plan.kind !== 'turn-plan') throw new TypeError('buildTurnCuePlan: expected a turn plan');
  const b = plan.beats, A = plan.attacker.side, T = plan.target.side, hit = plan.outcome === 'hit', reduced = plan.reducedMotion;
  const raw: TurnCue[] = [];
  const cue = (cueId: string, atMs: number, source: CueSource, beat: string, amount?: number): void => {
    assertCueId(cueId);
    if (!Number.isFinite(atMs) || atMs < 0) throw new RangeError(`cue ${cueId} at ${atMs}: beats must be finite and non-negative`);
    raw.push(Object.freeze({ cueId, atMs, source, beat, ...(amount !== undefined ? { amount } : {}) }));
  };
  cue('battle:turn-ready', 0, 'battle', 'ready');
  if (b.commandEnd > b.readyEnd) { cue('battle:cursor', b.readyEnd, 'battle', 'command'); cue('battle:confirm', b.commandEnd, 'battle', 'command'); }
  if (!reduced && plan.runUp !== 0 && b.actionStart > b.commandEnd) cue('battle:approach-start', b.commandEnd, 'battle', 'approach');
  cue('creature:attack-vocal', b.actionStart, A, 'action');
  if (plan.effect) {
    const s = plan.effect.schedule, t0 = plan.effect.startMs;
    cue(`ability:${plan.theme}:launch`, t0 + s.launchAt, A, 'launch');
    cue(`ability:${plan.theme}:travel`, t0 + s.travelStart, A, 'travel');
    cue(`ability:${plan.theme}:impact`, t0 + s.impactAt, A, 'impact');
  }
  if (hit) {
    cue('battle:hitstop-thump', b.impactAt, 'battle', 'impact'); { const i = raw.length - 1; if (T === 'left' || T === 'right') raw[i] = Object.freeze({ ...raw[i]!, target: T }); }
    if (!reduced) { cue('battle:flash-sting', b.impactAt, 'battle', 'impact'); cue('battle:shake-rumble', b.impactAt, 'battle', 'impact'); }
    cue('battle:damage-tick', b.impactAt + DAMAGE_NUMBER.popMs, 'battle', 'number', Number(plan.number.text.replace('!', '')) || 0);
    if (plan.targetFaints) { cue('creature:faint', b.reactionStart, T, 'reaction'); cue('battle:faint-fall', b.reactionStart + (b.reactionEnd - b.reactionStart) * 0.8, 'battle', 'reaction'); cue('creature:victory', b.returnEnd, A, 'return'); cue('battle:victory-sting', b.returnEnd, 'battle', 'return'); }
    else cue('creature:hurt', b.reactionStart, T, 'reaction');
  } else if (plan.outcome === 'dodge') cue('battle:dodge-swish', b.reactionStart, 'battle', 'reaction');
  else cue('battle:miss-whiff', b.impactAt, 'battle', 'impact');
  // Stable order: by beat time, then insertion; admission per beat.
  const ordered = raw.map((c, i) => ({ c, i })).sort((l, r) => l.c.atMs - r.c.atMs || l.i - r.i).map((x) => x.c);
  const cues: TurnCue[] = [], dropped: DroppedCue[] = [];
  for (let i = 0; i < ordered.length;) {
    let j = i; while (j < ordered.length && beatKey(ordered[j]!.atMs) === beatKey(ordered[i]!.atMs)) j++;
    const beat = ordered.slice(i, j), mix = planCues(beat.map((c) => c.cueId), options);
    const admitted = new Map(mix.admitted.map((a) => [a.cueId, true])), reasons = new Map(mix.dropped.map((d) => [d.cueId, d.reason]));
    for (const c of beat) { if (admitted.has(c.cueId)) cues.push(c); else dropped.push(Object.freeze({ ...c, reason: reasons.get(c.cueId) ?? 'not admitted' })); }
    i = j;
  }
  return Object.freeze({ kind: 'turn-cue-plan', theme: plan.theme, reducedMotion: reduced, cues: Object.freeze(cues), dropped: Object.freeze(dropped), endMs: b.end });
}

export interface CueSink { play(cue: TurnCue, lateMs: number): void; }
export interface CuePlayerFrame { readonly fired: number; readonly droppedLate: number; readonly done: boolean; }

/** Fires the plan's cues from an injected turn-relative clock (ms since the turn started). */
export class TurnCuePlayer {
  readonly plan: TurnCuePlan;
  readonly fired: TurnCue[] = [];
  readonly droppedLate: DroppedCue[] = [];
  readonly #sink: CueSink; readonly #clock: () => number;
  #next = 0; #disposed = false; #lastMs = -Infinity;
  constructor(plan: TurnCuePlan, sink: CueSink, clock: () => number) { this.plan = plan; this.#sink = sink; this.#clock = clock; }
  /** Idempotent per clock value; a clock that runs backwards never re-fires (cues fire once, in order). */
  tick(): CuePlayerFrame {
    if (this.#disposed) return Object.freeze({ fired: this.fired.length, droppedLate: this.droppedLate.length, done: true });
    const now = this.#clock();
    if (!Number.isFinite(now)) throw new TypeError('TurnCuePlayer: clock must be finite');
    if (now > this.#lastMs) {
      this.#lastMs = now;
      while (this.#next < this.plan.cues.length && this.plan.cues[this.#next]!.atMs <= now) {
        const c = this.plan.cues[this.#next]!, late = now - c.atMs;
        if (late > CUE_LATE_DROP_MS) this.droppedLate.push(Object.freeze({ ...c, reason: `late by ${Math.round(late)} ms (limit ${CUE_LATE_DROP_MS})` }));
        else { this.fired.push(c); this.#sink.play(c, late); }
        this.#next++;
      }
    }
    return Object.freeze({ fired: this.fired.length, droppedLate: this.droppedLate.length, done: this.#next >= this.plan.cues.length });
  }
  dispose(): void { this.#disposed = true; }
}
