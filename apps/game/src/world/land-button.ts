/* The Land button of the survey card, as the legacy game has it (LEGACY celestial-frontier.html):
   - the word and the tip: 14094; the notice when the world is not in the system in view: 14333-14334;
   - the press lands at once, with no survey step, prompt or warning before it: 14330-14336 and `flyDown` 13664-13679;
   - a world never landed on rolls its descent first: `descentSafe` 13435-13437, used at 13669 (the roll and its
     wave-off belong to the descent rules, not here). */

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
