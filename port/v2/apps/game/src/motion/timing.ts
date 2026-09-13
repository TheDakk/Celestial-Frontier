/* Motion Kit §5 timing table. Base milliseconds at mass class 1.00; every
 * duration is multiplied by the mass class and held to 0.6x..2.0x of base.
 * All curves are time-based, never frame-counted. No clock is read here: the
 * idle period is seeded through @cf/domain-rand's mulberry32. */
import { mulberry32 } from '@cf/domain-rand';

export type MassClassName = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'titanic';
export const MASS_CLASS: Readonly<Record<MassClassName, number>> = Object.freeze({ tiny: 0.70, small: 0.85, medium: 1.00, large: 1.20, huge: 1.40, titanic: 1.60 });
/** FA_SIZE index 0..5 → kit mass class. */
export const MASS_BY_SIZE_INDEX: readonly MassClassName[] = Object.freeze(['tiny', 'small', 'medium', 'large', 'huge', 'titanic']);
export const SCALE_MIN = 0.6, SCALE_MAX = 2.0;
export const SMEAR_FRAME_MS = 1000 / 60;
export const FRAME_RATE = Object.freeze({ desktop: 60, phone: 30 });

export type Phase = readonly [name: string, baseMs: number];
/** Ordered phases per action (kit §5). `feed` and `tame` are A1 defaults, not kit rows. */
export const ACTION_PHASES: Readonly<Record<string, readonly Phase[]>> = Object.freeze({
  idle: [['period', 3000]],           // replaced by the seeded period
  alert: [['lift', 220]],
  approach: [['stride', 420]],
  melee: [['anticipation', 140], ['strike', 90], ['smear', SMEAR_FRAME_MS], ['recovery', 260]],
  cast: [['rise', 180], ['hold', 120], ['release', 90], ['settle', 220]],
  hit: [['recoil', 110], ['stagger', 160], ['settle', 180]],
  dodge: [['out', 120], ['back', 160]],
  faint: [['fall', 520]],
  victory: [['rear', 210], ['toss', 150], ['settle', 240]],
  return: [['walk', 380]],
  tame: [['approach', 260], ['lower', 200], ['settle', 180]],
  feed: [['down', 160], ['chew', 120], ['chew2', 120], ['up', 180]],
  // A11 plant verbs (kit §4 names; durations are A11 defaults, not kit rows). `sway` loops on the seeded idle period.
  sway: [['period', 3000]],
  disturb: [['recoil', 120], ['settle', 260]],
  harvest: [['shake', 180], ['detach', 90], ['settle', 220]],
  grow: [['rise', 320], ['overshoot', 120], ['settle', 160]],
});
export const HITSTOP = Object.freeze({ baseMs: 70, capMs: 140 });
export const FLASH = Object.freeze({ whiteFrames: 2, fadeMs: 120 });
export const SHAKE = Object.freeze({ amplitudePx: 6, ms: 180 });
export const DAMAGE_NUMBER = Object.freeze({ popMs: 90, popEase: 'back-out', riseMs: 420, fadeMs: 160 });
export const TIMING_BAR = Object.freeze({ readyEaseFraction: 0.10, ease: 'ease-out' });
export const IDLE_PERIOD = Object.freeze({ minMs: 2600, maxMs: 3400 });

/** Mass-scaled duration, bounded to 60%..200% of base. */
export function scaleMs(baseMs: number, mass: number): number {
  return Math.min(Math.max(baseMs * mass, baseMs * SCALE_MIN), baseMs * SCALE_MAX);
}
/** Scaled by the ATTACKER's mass, capped at 140 (applies to both combatants). */
export const hitstopMs = (attackerMass: number): number => Math.min(HITSTOP.baseMs * attackerMass, HITSTOP.capMs);
/** Seeded, mass-scaled idle period; guaranteed non-integer so two creatures never sync. */
export function idlePeriodMs(seed: number, mass: number): number {
  const r = mulberry32(seed | 0)();
  let ms = scaleMs(IDLE_PERIOD.minMs + r * (IDLE_PERIOD.maxMs - IDLE_PERIOD.minMs), mass);
  if (Number.isInteger(ms)) ms += 0.37;
  return ms;
}
export function phaseDurations(actionFamily: string, mass: number): readonly (readonly [string, number])[] {
  const phases = ACTION_PHASES[actionFamily];
  if (!phases) throw new Error('timing: no phases for ' + actionFamily);
  return phases.map(([name, base]) => [name, scaleMs(base, mass)] as const);
}
/** Normalized time at `fraction` through `phase` of an action family (mass-invariant). */
export function tAt(actionFamily: string, phase: string, fraction = 1): number {
  const phases = ACTION_PHASES[actionFamily];
  if (!phases) throw new Error('timing: no phases for ' + actionFamily);
  const total = phases.reduce((s, [, ms]) => s + ms, 0);
  let acc = 0;
  for (const [name, ms] of phases) { if (name === phase) return (acc + ms * fraction) / total; acc += ms; }
  throw new Error(`timing: ${actionFamily} has no phase ${phase}`);
}
