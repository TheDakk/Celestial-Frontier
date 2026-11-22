/** Floor first, then true modulo so negatives wrap upward. Anything that is not a finite number gives 0. */
export function wrap(value: unknown, length: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return ((Math.floor(value) % length) + length) % length;
}

/**
 * The length of each game table a gene indexes, which is what the resolver wraps that gene by. They must equal
 * the lengths of the tables in @cf/domain-speciestraits (a test holds them together); part of renderer version 1.
 */
export const GENE_LENGTHS = Object.freeze({
  body: 16, loco: 18, head: 10, tail: 7, pattern: 8, skin: 9, limbs: 6, eyes: 6, size: 6, color: 17, accent: 17,
  floraForm: 18, fungiForm: 9, microbeForm: 12, extremophileLoco: 9, aquaticFloraForm: 6, aerialFloraForm: 3,
  habitat: 19, extremophileHabitat: 9, trait: 25,
});

/**
 * Whether a marker the game reads as truthy (`g.x`, `g.aq`, `g.af`) is set. The same, except that a non-finite
 * number counts as unset, because a save writes it as null: the answer survives a save round trip.
 */
export function marked(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  return Boolean(value);
}

/** The head gene value the game's head table (FA_HEAD) names 'eyeless and smooth': that head has no eyes, whatever the eyes gene. */
export const EYELESS_HEAD = 2;

/**
 * The Guardian band of `apex` the game keeps: 12 (Empyrean) to the top grade tier (TIER_MAX =
 * GRADE_TIERS.length - 1 = 14 in @cf/domain-speciestraits; a test holds `top` to it). Part of renderer version 1.
 */
export const GUARDIAN_APEX = Object.freeze({ lowest: 12, top: 14 });

/**
 * Whether the genome is a Guardian or a Titan, drawn at the 'guardian' tier. The game marks both with `apex`
 * (guardianFor sets it to the Guardian's tier, 12-14; a Titan's battle genome gets 14). On loading a save
 * (`_sanitizeSavedGenome`) and on importing a share code (`normGenome`) the game keeps `apex` only when
 * `apex != null` and `(+apex)|0` lies in 12..TIER_MAX, and deletes it otherwise. This is exactly that rule, so a
 * creature is drawn at the same size before and after a save or a share. Part of renderer version 1.
 */
export function isGuardianScale(genome: Readonly<Record<string, unknown>>): boolean {
  const apex = genome['apex'];
  // A symbol cannot become a number (the game would throw); it is never kept.
  if (apex === null || apex === undefined || typeof apex === 'symbol') return false;
  const a = Number(apex) | 0;
  return a >= GUARDIAN_APEX.lowest && a <= GUARDIAN_APEX.top;
}
