import type { Catalogue, Part, Scaffold } from '@cf/art-format';
import type { Recipe } from '@cf/art-recipe';

export interface CheckedCreature {
  scaffold: string;
  /** The genome sampled, or `{ species: <key> }` for a named species. */
  genome: Record<string, unknown>;
  pose: string;
  /** Set when the creature was composed with a forced variant: that variant's part id. */
  variant?: string;
  /** Set when the finding came from the shift sweep. */
  shift?: { head: readonly [number, number]; tail: readonly [number, number] };
}
export interface DetachedCreature extends CheckedCreature {
  shift: { head: readonly [number, number]; tail: readonly [number, number] };
  /** Slots drawn outside the body's 4-connected region (farWings, farLimbs, tail, torso, bodyFeature, back, nearWings, nearLimbs, head, headFeature, eyes, glow). */
  off: string[];
}
export interface HiddenPart extends CheckedCreature {
  shift: { head: readonly [number, number]; tail: readonly [number, number] };
  /** The requested part that shows too little, compared with the same recipe minus that part. */
  partId: string;
  /** Pixels that change when the part is removed (counted up to `needed`). */
  visible: number;
  /** HIDDEN_MIN, or the part's own drawn pixel count when that is smaller. */
  needed: number;
}
export interface PackSummary {
  parts: number;
  byFamily: Record<string, number>;
  bySlot: Record<string, number>;
  byTier: Record<string, number>;
  scaffolds: number;
  fallbacks: number;
  /** Named species (catalogue `species` lines). */
  species: number;
  colours: number;
  ramps: number;
}
/** A head and torso pairing whose neck join breaks the one-shade-step rule in at least one pose, head shift and leg count. A warning: never changes `ok`. */
export interface NeckJoin {
  head: string;
  torso: string;
  /** Distinct head pixels, in the head frame's own coordinates (frame, x, y), more than one shade step from a torso pixel beside them in some case. */
  pixels: number;
  /** Cases (pose, head shift, leg count) with at least one such pixel. */
  cases: number;
  /** The first breaching pair, each pixel in its own part's frame coordinates: `head <frame> x,y value v beside torso <frame> x,y value v`. */
  example: string;
}
export interface PackReport {
  ok: boolean;
  parseError: string | null;
  summary: PackSummary | null;
  sampled: string;
  /** The generated scaffolds (by id, in catalogue order) the `sample` option left out, so `sampled` does not hold for them; null when every scaffold was sampled (and on a parse failure). formatReport adds `(partial: N scaffolds not sampled)` to its first line. */
  partial: string[] | null;
  /** Creature poses composed (SAMPLED says which); a shift is drawn as a label picture and not counted. */
  composed: number;
  /** Forced variants composed, in every pose: one patterned creature per variant of a part type with more than one, plus one more per extra leg count the scaffold names (legs= entries, torso leg-count attach points) and, for a head or torso variant, per extra eye count it names (eyes= entries, eye-count attach points), in each state the scaffold is sampled in. */
  variants: number;
  /**
   * Distinct gaps met while composing, each with how many creature poses met it. `error` is false for information
   * (gapIsInfo): `variant:`, `marks:`, `skin:` (a translucent creature's torso frame with no `translucent` layer), `role:`, and `missing:` of a part in slot back, headFeature, farWings, nearWings or
   * bodyFeature, or of a flipper (`flipper`, `flipper-<torso type>`) in slot farLimbs or nearLimbs; every other gap is an error, a missing `t0` or `pit` included.
   * A `marks:` gap with count 0 (printed x0) was met by no sampled creature: it is read from the catalogue, for a frame
   * some pose can show at some leg count with no layer serving some pattern.
   */
  gaps: { gap: string; count: number; error: boolean }[];
  edge: CheckedCreature[];
  detached: DetachedCreature[];
  /** Requested parts that show too few pixels in a composed pose and shift. */
  hidden: HiddenPart[];
  structure: string[];
  unreachable: string[];
  /** Distinct compose errors (a missing fallback) and sampling failures (shapedFor), each naming the scaffold that needed it. */
  failures: string[];
  /** Neck join warnings, one per head and torso pairing that breaks the rule. */
  neck: NeckJoin[];
  /** Information about the pack that is not a fault, each printed as an `info:` line (a palette with no iris ramps). */
  info: string[];
  /** What the generator asks of the pack (see PackCoverage); null on a parse failure. Never changes `ok`. */
  coverage: PackCoverage | null;
}
/** The counts of one family and tier, or of the whole walk: every creature asked for is in exactly one of the four. */
export interface CoverageCounts {
  asked: number;
  /** Creatures whose scaffold and every part the pack holds, and whose rest pose composes with no pose or skin gap. */
  full: number;
  /** Creatures whose scaffold `<family>/<torso>/<tier>` the pack lacks; their parts are not looked at. */
  noScaffold: number;
  /** Creatures whose scaffold is there and at least one part is not. */
  missingPart: number;
  /** Creatures whose scaffold and parts are there, and whose rest pose meets a `pose:` or a `skin:` gap. */
  composeGap: number;
}
/**
 * The generated fauna creatures of seeds `first` to `last` (makeGenome at heat 1) and the Guardians of the worlds of
 * those seeds (guardianFor, where it gives one), each built with no lineage and composed at rest, counted by whether
 * the pack can draw them with no fallback. `scaffolds`, `parts` and `gaps` name each missing scaffold, part (by the
 * last id tried) and pose or skin gap once with the creatures that met it, most met first. Titans, bred creatures and
 * every pose but rest are outside the walk.
 */
export interface PackCoverage extends CoverageCounts {
  first: number;
  last: number;
  /** How many of the creatures asked for are Guardians. */
  guardians: number;
  /** By family, then tier from small up. */
  rows: (CoverageCounts & { family: string; tier: string })[];
  scaffolds: { id: string; count: number }[];
  parts: { id: string; count: number }[];
  gaps: { id: string; count: number }[];
}
export const REQUIRED_POSES: readonly string[];
export const SAMPLED: string;
export const HIDDEN_MIN: number;
/** The attach points a generated torso needs, by family (a family not listed needs the quadruped's). Plus `wing` and `wing1` once the pack holds the torso type's wings. */
export const TORSO_POINTS_BY_FAMILY: Readonly<Record<string, readonly string[]>>;
/** Whether a gap is information rather than an error (see PackReport.gaps). */
export function gapIsInfo(gap: string): boolean;
/** For a picture assembled from the label catalogue (pixel value = slot label); null when it is one 4-connected region. */
export function detachedSlots(buffer: { w: number; h: number; pixels: Uint8Array }): string[] | null;
/** Options of checkPack. `sample`: the generated scaffolds (by id) whose creatures are sampled; every one when absent. Whole-pack checks run either way. `coverage`: the seeds of the coverage walk; COVERAGE_SEEDS when absent. */
export interface CheckOptions { sample?: (scaffoldId: string) => boolean; coverage?: { first: number; last: number } }
/** The seeds the coverage walk covers by default. */
export const COVERAGE_SEEDS: { readonly first: number; readonly last: number };
/** Why a walk does not meet a requirement that every generated creature be drawn in full (a walk that asked for none never meets it); null when it does. */
export function coverageShortfall(coverage: PackCoverage): string | null;
export function checkPack(text: string, options?: CheckOptions): PackReport;
/** How numberedCopy draws a part: by its slot label, not at all, as it is, or each pixel as its frame column or row plus one. */
export type NumberedMode = 'label' | 'blank' | 'real' | 'x' | 'y';
/** A copy of the recipe and catalogue with part k drawn as `mode(k)` says; skin null unless some part is drawn 'real'. */
export function numberedCopy(recipe: Recipe, catalogue: Catalogue, cache: Map<string, Part>, mode: (k: number) => NumberedMode): { recipe: Recipe; catalogue: Catalogue };
/** The canvas position of part k's frame pixel 0,0 in a pose, read from coded pictures. */
export function frameOrigin(recipe: Recipe, k: number, pose: string, catalogue: Catalogue, cache: Map<string, Part>): [number, number];
/** The unfinished picture of a recipe drawn from the label catalogue, with skin null. */
export function labelPicture(recipe: Recipe, pose: string, labels: Catalogue): { w: number; h: number; pixels: Uint8Array };
/** Neck join breaches of each head on a torso (see NeckJoin), with marks and skin left off. */
export function neckJoins(catalogue: Catalogue, scaffold: Scaffold, torsoId: string, headIds: readonly string[], legCounts: readonly number[], recipeFor: (limbs: number) => Recipe, cache: Map<string, Part>, shifts?: readonly { head: readonly [number, number]; tail: readonly [number, number] }[]): NeckJoin[];
/** The states a generated scaffold `<family>/<torso>/<tier>` is sampled in, each with its tier, body and state genes; [] when no genome reaches it (a species scaffold, or an unreachable one). */
export function routeStates(scaffoldId: string): { state: 'land' | 'airborne' | 'aquatic'; genes: Record<string, unknown> }[];
/** The genome with the smallest seed from 1 to 64 for which bodyOf gives this family and torso, every other gene kept; else undefined. */
export function shapedGenome(genome: Record<string, unknown>, family: string, torso: string): Record<string, unknown> | undefined;
/** The genome checkPack samples: shaped (shapedGenome) and drawn at `tier`; else the failure line checkPack reports. */
export function shapedFor(genome: Record<string, unknown>, family: string, torso: string, tier: string): { genome: Record<string, unknown>; failure?: undefined } | { genome?: undefined; failure: string };
/** Every `<family>/<torso>` a fauna genome reaches on the routed path. */
export function generatedTorsos(): Set<string>;
export function formatReport(report: PackReport): string;
