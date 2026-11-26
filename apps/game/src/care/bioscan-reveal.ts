/* What a completed biosphere scan writes: the world in the surveyed set, the deed, the civilization's
   achievements and a Paragon's page.

   LEGACY celestial-frontier.html, v1.8.9, `autoScanWorld` 14888-14922:
   - a world new to the surveyed set joins it, `stats.surveys` becomes the set's size and the `bioscan` deed is
     said; a world already in the set does none of the three (14889-14894);
   - a card whose badge is Civilized or Advanced unlocks `civ`, Advanced `spacefar` as well (14895-14896);
   - at a Paragon's home world the Paragon is catalogued unless the Compendium holds it already, and only a
     Paragon catalogued here is counted in `stats.paragons` (14904-14917). */

export type RevealUnlock = 'civ' | 'spacefar';
export interface BiosphereReveal {
  /** The world joined the surveyed set with this scan: the `bioscan` deed is said. */
  readonly firstScan: boolean;
  /** The surveyed set afterwards: planet seeds. */
  readonly surveyed: readonly number[];
  /** `stats.surveys` afterwards. */
  readonly surveys: number;
  readonly unlocks: readonly RevealUnlock[];
  /** The Paragon to catalogue, or null. */
  readonly paragon: number | null;
  /** `stats.paragons` afterwards. */
  readonly paragons: number;
}
/** What the scan of this world writes. `surveyed` is the set before; `paragon` is the Paragon whose home this
    world is and whether the Compendium holds it, null on any other world. */
export function revealBiosphere(input: Readonly<{
  planetSeed: number; surveyed: readonly number[]; surveys: number; badge: string | null;
  paragon: Readonly<{ index: number; held: boolean }> | null; paragons: number;
}>): BiosphereReveal {
  const firstScan = !input.surveyed.includes(input.planetSeed);
  const surveyed = firstScan ? [...input.surveyed, input.planetSeed] : [...input.surveyed];
  const unlocks: RevealUnlock[] = [];
  if (input.badge === 'Civilized' || input.badge === 'Advanced') unlocks.push('civ');
  if (input.badge === 'Advanced') unlocks.push('spacefar');
  const found = input.paragon !== null && !input.paragon.held;
  return Object.freeze({
    firstScan, surveyed: Object.freeze(surveyed), surveys: firstScan ? surveyed.length : input.surveys, unlocks: Object.freeze(unlocks),
    paragon: found ? input.paragon!.index : null, paragons: input.paragons + (found ? 1 : 0),
  });
}
