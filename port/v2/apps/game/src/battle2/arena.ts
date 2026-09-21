/** @module battle2/arena [domain] — arena composition (MOTION_KIT §7 ARENA). Pure, clock-free.
 * Three plates (far/mid/near) parallax at .10/.50/1.20 of the run-up displacement; stands at
 * x = 1/3 and 2/3 on the shared ground line; combatants at 1/3..1/2 of frame height by mass.
 * Arena selection follows the home-versus-visitor rule with a seeded pick (mulberry32) among
 * the candidates a world offers; nothing here reads a clock or Math.random. */
import { mulberry32 } from '@cf/domain-rand';
import { MASS_CLASS } from '../motion/timing.js';

export const PARALLAX_RATES = Object.freeze({ far: 0.10, mid: 0.50, near: 1.20 });
export type PlateId = keyof typeof PARALLAX_RATES;
export const PLATE_ORDER: readonly PlateId[] = Object.freeze(['far', 'mid', 'near']);
export const STAND_X = Object.freeze({ left: 1 / 3, right: 2 / 3 });
/** D2 G6 eye finding (bear-vs-crab-01): a guardian at 0.9 of the frame height is ~0.75 of its width side-on, so on the
 * equal stands its fore paws already overlap the opponent before the lunge. In a guardian battle the guardian's stand
 * moves out and the opponent's to the far third; one pair of constants for Nick's eye. */
export const GUARDIAN_STANDS = Object.freeze({ guardian: 0.30, opponent: 0.82 });
export interface ComposeArenaOptions { readonly guardianSide?: 'left' | 'right'; }
/** The attacker closes this fraction of the stand distance on its run-up (kit: "approach, distance-independent"). */
export const RUN_UP_FRACTION = 0.55;
export const COMBATANT_HEIGHT_FRACTION = Object.freeze({ min: 1 / 3, max: 1 / 2 });

export interface ArenaTextureLike { readonly width: number; readonly height: number; }
export interface ArenaRecipeInput {
  readonly id: string;
  readonly groundLineNormalized: number;
  readonly plates: Readonly<Record<PlateId, ArenaTextureLike>>;
}
export interface FrameSize { readonly width: number; readonly height: number; }
export interface Point { readonly x: number; readonly y: number; }
export interface PlateLayout { readonly id: PlateId; readonly rate: number; readonly scale: number; readonly x: number; readonly y: number; readonly width: number; readonly height: number; }
export interface ArenaLayout {
  readonly id: string;
  readonly frame: FrameSize;
  readonly groundLineY: number;
  readonly groundLinePx: number;
  readonly stands: Readonly<{ left: Point; right: Point }>;
  readonly standDistance: number;
  readonly runUp: number;
  readonly runUpPx: number;
  readonly plates: readonly PlateLayout[];
}
export type ParallaxOffset = Readonly<Record<PlateId, number>>;

const finite01 = (v: number): boolean => Number.isFinite(v) && v > 0 && v < 1;

/** Frame-space layout: plates cover the frame plus the overscan their parallax rate needs, ground lines aligned. */
export function composeArena(recipe: ArenaRecipeInput, frame: FrameSize, options: ComposeArenaOptions = {}): ArenaLayout {
  if (!recipe || typeof recipe.id !== 'string' || !recipe.id) throw new TypeError('arena: recipe id required');
  if (!finite01(recipe.groundLineNormalized)) throw new TypeError('arena: groundLineNormalized must be inside (0,1)');
  if (!(frame.width > 0) || !(frame.height > 0)) throw new TypeError('arena: frame must be positive');
  const g = recipe.groundLineNormalized, groundLinePx = g * frame.height;
  const gs = options.guardianSide;
  const sx = gs === 'left' ? { left: GUARDIAN_STANDS.guardian, right: GUARDIAN_STANDS.opponent } : gs === 'right' ? { left: 1 - GUARDIAN_STANDS.opponent, right: 1 - GUARDIAN_STANDS.guardian } : STAND_X;
  const stands = Object.freeze({ left: Object.freeze({ x: sx.left, y: g }), right: Object.freeze({ x: sx.right, y: g }) });
  const standDistance = sx.right - sx.left, runUp = standDistance * RUN_UP_FRACTION, runUpPx = runUp * frame.width;
  const plates = PLATE_ORDER.map((id): PlateLayout => {
    const tex = recipe.plates[id];
    if (!tex || !(tex.width > 0) || !(tex.height > 0)) throw new TypeError(`arena: plate "${id}" has no size`);
    const rate = PARALLAX_RATES[id], neededWidth = frame.width + 2 * rate * runUpPx;
    const scale = Math.max(neededWidth / tex.width, frame.height / tex.height);
    const width = tex.width * scale, height = tex.height * scale;
    return Object.freeze({ id, rate, scale, x: (frame.width - width) / 2, y: groundLinePx - g * height, width, height });
  });
  return Object.freeze({ id: recipe.id, frame: Object.freeze({ ...frame }), groundLineY: g, groundLinePx, stands, standDistance, runUp, runUpPx, plates: Object.freeze(plates) });
}

/** Plate x-offsets for a run-up displacement (px, signed): each plate shifts by its rate. */
export function parallaxOffset(displacementPx: number): ParallaxOffset {
  if (!Number.isFinite(displacementPx)) throw new TypeError('parallax: displacement must be finite');
  return Object.freeze({ far: -displacementPx * PARALLAX_RATES.far, mid: -displacementPx * PARALLAX_RATES.mid, near: -displacementPx * PARALLAX_RATES.near });
}

export interface CombatantScale { readonly scale: number; readonly heightFraction: number; readonly heightPx: number; }
/** Options of the scale, not a species branch: `frameFill` (0.5–1) replaces the mass-class fraction with a
 * frame-fill target — the kit's GUARDIAN RULE ("fills the battle screen", D2 §4) for apex guardians. Absent, the
 * result is byte-identical to the mass-class rule. */
export interface CombatantScaleOptions { readonly frameFill?: number;
  /** With `frameFill`: the height the fill sizes, in cut-out units (the rig's tallest pose, `BattleRigV1.tallestHeight`);
   * absent, the rest bounds height. Ignored without `frameFill`. */
  readonly tallestHeight?: number; }
/** Scale a rig so its standing height is 1/3 (tiny) .. 1/2 (titanic) of the frame height, or `frameFill` of it. */
export function combatantScale(bounds: Readonly<{ height: number }>, cutoutHeightPx: number, mass: number, frameHeight: number, options: CombatantScaleOptions = {}): CombatantScale {
  if (!(bounds.height > 0) || bounds.height > 1) throw new TypeError('combatant scale: bounds.height must be in (0,1]');
  if (!(cutoutHeightPx > 0) || !(frameHeight > 0) || !Number.isFinite(mass) || mass <= 0) throw new TypeError('combatant scale: sizes and mass must be positive');
  if (options.frameFill !== undefined && !(options.frameFill >= COMBATANT_HEIGHT_FRACTION.max && options.frameFill <= 1)) throw new TypeError('combatant scale: frameFill must be in [1/2, 1]');
  const u = Math.min(1, Math.max(0, (mass - MASS_CLASS.tiny) / (MASS_CLASS.titanic - MASS_CLASS.tiny)));
  const heightFraction = options.frameFill ?? (COMBATANT_HEIGHT_FRACTION.min + (COMBATANT_HEIGHT_FRACTION.max - COMBATANT_HEIGHT_FRACTION.min) * u);
  const heightPx = heightFraction * frameHeight;
  if (options.frameFill === undefined || options.tallestHeight === undefined) return Object.freeze({ scale: heightPx / (bounds.height * cutoutHeightPx), heightFraction, heightPx });
  // the fill sizes the TALLEST pose (D2 G6 eye finding): the rest height is the fill's share scaled by rest/tallest
  if (!(options.tallestHeight >= bounds.height)) throw new TypeError('combatant scale: tallestHeight must be at least bounds.height');
  const scale = heightPx / (options.tallestHeight * cutoutHeightPx);
  return Object.freeze({ scale, heightFraction, heightPx: scale * bounds.height * cutoutHeightPx });
}

/* ---------- seeded arena selection (stub: recipe ids only) ---------- */
export type ArenaSelectionContext =
  | Readonly<{ kind: 'wild'; seed: number; wildWorldArenas: readonly string[] }>
  | Readonly<{ kind: 'guardian'; seed: number; lairArenas: readonly string[] }>
  | Readonly<{ kind: 'duel'; seed: number; hostArenas: readonly string[]; visitorArenas: readonly string[]; duelIndex: number }>;
export interface ArenaSelection { readonly recipeId: string; readonly owner: 'wild-world' | 'lair' | 'host' | 'visitor'; readonly reason: string; }

const pick = (seed: number, list: readonly string[], what: string): string => {
  if (!Array.isArray(list) || list.length === 0 || !list.every((s) => typeof s === 'string' && s)) throw new TypeError(`arena selection: ${what} must list at least one recipe id`);
  if (!Number.isInteger(seed)) throw new TypeError('arena selection: seed must be an integer');
  return list[Math.floor(mulberry32(seed >>> 0)() * list.length)] as string;
};
/** Home-versus-visitor rule: wild → the wild creature's world; guardian → its lair; duel → the host first, then alternate. */
export function selectArena(context: ArenaSelectionContext): ArenaSelection {
  switch (context.kind) {
    case 'wild': return Object.freeze({ recipeId: pick(context.seed, context.wildWorldArenas, 'wildWorldArenas'), owner: 'wild-world', reason: 'wild encounter is fought on the wild creature\'s world' });
    case 'guardian': return Object.freeze({ recipeId: pick(context.seed, context.lairArenas, 'lairArenas'), owner: 'lair', reason: 'guardian is fought in its lair' });
    case 'duel': {
      if (!Number.isInteger(context.duelIndex) || context.duelIndex < 0) throw new TypeError('arena selection: duelIndex must be a non-negative integer');
      const host = context.duelIndex % 2 === 0;
      return Object.freeze({ recipeId: pick(context.seed + context.duelIndex, host ? context.hostArenas : context.visitorArenas, host ? 'hostArenas' : 'visitorArenas'),
        owner: host ? 'host' : 'visitor', reason: `duel ${context.duelIndex}: ${host ? 'host' : 'visitor'} arena (host first, then alternating)` });
    }
    default: throw new TypeError('arena selection: unknown encounter kind');
  }
}
