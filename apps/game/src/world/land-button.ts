/* The Land button of the survey card. The press lands at once: no survey step, prompt or warning stands before it.
   A world never landed on rolls its descent first (the roll and its wave-off belong to the descent rules, not here). */

export const LAND_BUTTON = Object.freeze({
  label: 'Land',
  tip: 'Drop out of orbit and stand on this world — ground surveys open a world’s secrets.',
  /** Shown instead when the world is not in the current system view (a card left locked in mid-travel). */
  awayTitle: 'Landing',
  awayText: 'Dive toward this world and confirm the descent — planetfall turns your orbital survey into a ground survey.',
});

export interface LandButtonPress {
  /** The world is a planet of the system now in view. */
  readonly inView: boolean;
  readonly tutDone: boolean;
  readonly earth: boolean;
  /** The world has been landed on before. */
  readonly landed: boolean;
  /** A descent roll for this world has already succeeded and is unspent. */
  readonly cleared: boolean;
}
export type LandButtonStep = 'land' | 'roll-descent' | 'notice';

/** What one press of Land does. `roll-descent`: roll the descent; a success lands, a failure is a wave-off. */
export function landButtonStep(press: LandButtonPress): LandButtonStep {
  if (!press.inView) return 'notice';
  return !press.tutDone || press.earth || press.landed || press.cleared ? 'land' : 'roll-descent';
}
