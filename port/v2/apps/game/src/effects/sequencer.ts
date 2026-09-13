/* Effects sequencer — a pure schedule from Motion Kit §5 numbers and a placement.
 * buildEffectSchedule is arithmetic on its inputs; sampleSchedule is a function of (schedule, ms).
 * Melee: launch fills the anticipation at the attacker, the strike is the travel window.
 * Cast: launch rises and holds, the release is the travel window.
 * Neither reads a clock. Impact is aligned to the hitstop frame; hitstop is 70 ms scaled by the
 * ATTACKER's mass class and capped at 140 (Motion Kit §5). */
import type { EffectPhaseName, EffectSequenceAnchors, NormalizedPoint, PhasePlacement, SequencePlacement } from './anchors.js';

export const EFFECT_SCHEDULE_SCHEMA = 'cf.effect-schedule/v1' as const;
export type EffectDelivery = 'melee' | 'cast';
export interface EffectTiming { readonly delivery: EffectDelivery; readonly attackerMassClass: number; }

/** Motion Kit §5, base milliseconds at mass class 1.00. */
export const MOTION_KIT_TIMING = Object.freeze({
  melee: Object.freeze({ anticipation: 140, strike: 90, recovery: 260 }),
  cast: Object.freeze({ rise: 180, hold: 120, release: 90, settle: 220 }),
  hitstop: 70, hitstopCap: 140, flashFade: 120,
  /** "Never below 60 percent of base on tiny bodies; never above 200 percent." */
  massMin: 0.6, massMax: 2.0,
});

export interface PhaseTrack {
  readonly phase: EffectPhaseName;
  readonly index: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly fadeInMs: number;
  readonly fadeOutMs: number;
  readonly scaleFrom: number;
  readonly scaleTo: number;
  readonly anchor: NormalizedPoint;
  readonly from: NormalizedPoint;
  readonly to: NormalizedPoint;
}

export interface EffectSchedule {
  readonly schema: typeof EFFECT_SCHEDULE_SCHEMA;
  readonly sequenceId: string;
  readonly delivery: EffectDelivery;
  readonly massClass: number;
  readonly launchAt: number;
  readonly travelStart: number;
  readonly travelEnd: number;
  readonly impactAt: number;
  readonly hitstopAt: number;
  readonly hitstopMs: number;
  readonly impactEnd: number;
  readonly durationMs: number;
  readonly scale: number;
  readonly flipX: boolean;
  readonly tracks: readonly PhaseTrack[];
}

export interface EffectTransform {
  readonly x: number; readonly y: number; readonly scale: number; readonly rotation: number; readonly alpha: number; readonly flipX: boolean;
}
export interface TrackSample { readonly phase: EffectPhaseName; readonly index: number; readonly visible: boolean; readonly transform: EffectTransform; }
export interface EffectSample {
  readonly ms: number;
  readonly phase: 'before' | EffectPhaseName | 'after';
  readonly emitterPhase: EffectPhaseName | 'none';
  readonly transform: EffectTransform;
  readonly tracks: readonly TrackSample[];
}

export function clampMassClass(massClass: number): number {
  if (!Number.isFinite(massClass) || massClass <= 0) throw new TypeError('attackerMassClass: expected a positive finite number');
  return Math.min(MOTION_KIT_TIMING.massMax, Math.max(MOTION_KIT_TIMING.massMin, massClass));
}

export function hitstopFor(massClass: number): number {
  return Math.min(MOTION_KIT_TIMING.hitstopCap, MOTION_KIT_TIMING.hitstop * clampMassClass(massClass));
}

const track = (p: PhasePlacement, startMs: number, endMs: number, fadeInMs: number, fadeOutMs: number, scaleFrom: number, scaleTo: number): PhaseTrack =>
  Object.freeze({ phase: p.phase, index: p.index, startMs, endMs, fadeInMs, fadeOutMs, scaleFrom, scaleTo, anchor: p.anchor, from: p.from, to: p.to });

export function buildEffectSchedule(anchors: EffectSequenceAnchors, timing: EffectTiming, placement: SequencePlacement): EffectSchedule {
  if (placement.sequenceId !== anchors.sequenceId) throw new TypeError('placement does not belong to these anchors');
  if (timing.delivery !== 'melee' && timing.delivery !== 'cast') throw new TypeError(`delivery: unknown ${String(timing.delivery)}`);
  if (placement.travel.length !== anchors.phases.length - 2) throw new TypeError('placement travel frames do not match the anchors');
  const m = clampMassClass(timing.attackerMassClass);
  const hitstopMs = hitstopFor(m);
  let launchAt: number, travelStart: number, travelEnd: number, launchEnd: number, launchGrow: number;
  if (timing.delivery === 'melee') {
    const k = MOTION_KIT_TIMING.melee;
    launchAt = 0; travelStart = k.anticipation * m; travelEnd = travelStart + k.strike * m;
    launchEnd = travelStart + (k.strike * m) / 2; launchGrow = 0.7;
  } else {
    const k = MOTION_KIT_TIMING.cast;
    launchAt = 0; travelStart = (k.rise + k.hold) * m; travelEnd = travelStart + k.release * m;
    launchEnd = travelStart + (k.release * m) / 2; launchGrow = 0.6;
  }
  const impactAt = travelEnd;
  const impactEnd = impactAt + hitstopMs + MOTION_KIT_TIMING.flashFade;
  const tracks: PhaseTrack[] = [track(placement.launch, launchAt, launchEnd, Math.min(30, (launchEnd - launchAt) / 3), (launchEnd - launchAt) * 0.4, launchGrow, 1)];
  const slot = (travelEnd - travelStart) / placement.travel.length;
  placement.travel.forEach((p, k) => tracks.push(track(p, travelStart + slot * k, travelStart + slot * (k + 1), 0, slot * 0.2, 1, 1)));
  tracks.push(track(placement.impact, impactAt, impactEnd, 0, MOTION_KIT_TIMING.flashFade, 0.85, 1));
  return Object.freeze({
    schema: EFFECT_SCHEDULE_SCHEMA, sequenceId: anchors.sequenceId, delivery: timing.delivery, massClass: m,
    launchAt, travelStart, travelEnd, impactAt, hitstopAt: impactAt, hitstopMs, impactEnd, durationMs: impactEnd,
    scale: placement.scale, flipX: placement.flipX, tracks: Object.freeze(tracks),
  });
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

function sampleTrack(schedule: EffectSchedule, t: PhaseTrack, ms: number): TrackSample {
  const span = t.endMs - t.startMs;
  const u = span > 0 ? clamp01((ms - t.startMs) / span) : (ms >= t.startMs ? 1 : 0);
  const visible = ms >= t.startMs && ms < t.endMs;
  const local = ms - t.startMs;
  const fadeIn = t.fadeInMs > 0 ? clamp01(local / t.fadeInMs) : 1;
  const fadeOut = t.fadeOutMs > 0 ? clamp01((t.endMs - ms) / t.fadeOutMs) : 1;
  const alpha = visible ? Math.min(fadeIn, fadeOut) : 0;
  const scaleU = t.phase === 'impact' && schedule.hitstopMs > 0 ? clamp01(local / schedule.hitstopMs) : u;
  const grow = t.scaleFrom + (t.scaleTo - t.scaleFrom) * (1 - (1 - scaleU) * (1 - scaleU));
  return Object.freeze({ phase: t.phase, index: t.index, visible, transform: Object.freeze({
    x: t.from.x + (t.to.x - t.from.x) * u, y: t.from.y + (t.to.y - t.from.y) * u,
    scale: schedule.scale * grow, rotation: 0, alpha, flipX: schedule.flipX }) });
}

/** Sample the schedule at ms. Positions are arena-normalized; scale is a fraction of arena width. */
export function sampleSchedule(schedule: EffectSchedule, ms: number): EffectSample {
  if (!Number.isFinite(ms)) throw new TypeError('sampleSchedule: ms must be finite');
  const tracks = Object.freeze(schedule.tracks.map((t) => sampleTrack(schedule, t, ms)));
  let phase: EffectSample['phase'];
  if (ms < schedule.launchAt) phase = 'before';
  else if (ms >= schedule.impactEnd) phase = 'after';
  else if (ms >= schedule.impactAt) phase = 'impact';
  else if (ms >= schedule.travelStart && ms < schedule.travelEnd) phase = 'travel';
  else phase = 'launch';
  const emitterPhase: EffectSample['emitterPhase'] = phase === 'before' || phase === 'after' ? 'none' : phase;
  const lead = phase === 'before' ? tracks[0]! : phase === 'after' || phase === 'impact' ? tracks[tracks.length - 1]!
    : phase === 'travel' ? (tracks.find((t) => t.phase === 'travel' && t.visible) ?? tracks[1]!) : tracks[0]!;
  const transform = phase === 'before' || phase === 'after' ? Object.freeze({ ...lead.transform, alpha: 0 }) : lead.transform;
  return Object.freeze({ ms, phase, emitterPhase, transform, tracks });
}
