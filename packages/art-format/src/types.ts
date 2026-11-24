export type SizeTier = 'small' | 'medium' | 'large' | 'guardian';
export const TIER_SIZE = { small: [48, 32], medium: [96, 64], large: [144, 96], guardian: [240, 160] } as const;
export type SlotName = 'farWings' | 'farLimbs' | 'tail' | 'torso' | 'bodyFeature' | 'back' | 'nearWings' | 'nearLimbs' | 'head' | 'headFeature' | 'eyes' | 'glow';
export const DRAW_ORDER: readonly SlotName[] = ['farWings', 'farLimbs', 'tail', 'torso', 'bodyFeature', 'back', 'nearWings', 'nearLimbs', 'head', 'headFeature', 'eyes', 'glow'];
export const VARIANTS = { torso: 3, head: 3, tail: 2, limb: 2 } as const;
export const LIMB_COUNTS = [2, 4, 6, 8, 3, 0] as const; // FA_LIMBS, by gene value
export const EYE_COUNTS = [2, 4, 6, 8, 1, 0] as const; // FA_EYES, by gene value

/** The game's pattern table by gene value. */
export const PATTERN_NAMES = ['plain', 'striped', 'spotted', 'banded', 'mottled', 'iridescent', 'marbled', 'eye-spotted'] as const;
export type PatternName = (typeof PATTERN_NAMES)[number];
/** The game's skin table by gene value (FA_SKIN, first word: 'slick and wet' is slick). */
export const SKIN_NAMES = ['scaled', 'furred', 'chitinous', 'slick', 'plated', 'warty', 'feathered', 'translucent', 'crystalline'] as const;
export type SkinName = (typeof SKIN_NAMES)[number];
/** Layers a frame may carry: two guide layers, a hand-drawn layer for every pattern but plain, then one for every skin. */
export const LAYER_NAMES = ['flow', 'spots', 'striped', 'spotted', 'banded', 'mottled', 'iridescent', 'marbled', 'eye-spotted',
  'scaled', 'furred', 'chitinous', 'slick', 'plated', 'warty', 'feathered', 'translucent', 'crystalline'] as const;
export type LayerName = (typeof LAYER_NAMES)[number];
/** The slots whose parts take marks. */
export const MARK_SLOTS: readonly SlotName[] = ['farWings', 'farLimbs', 'tail', 'torso', 'nearWings', 'nearLimbs', 'head'];

/** `layers`: each grid is exactly w*h; the key is absent when the frame has none. */
export interface PartFrame { w: number; h: number; pixels: Uint8Array; anchor: readonly [number, number]; attach: Readonly<Record<string, readonly [number, number]>>; layers?: Readonly<Partial<Record<LayerName, Uint8Array>>>; }
export interface Part { id: string; family: string; slot: SlotName; tier: SizeTier; kind: string; variant: number; frames: Readonly<Record<string, PartFrame>>; }
/**
 * `legs`: the entry is only for a creature with that leg count. `eyes`: only on an entry of slot `eyes`, which is then
 * only for a creature drawing that eye count (0: its two pits). An entry carries at most one of the two.
 */
export interface PoseEntry { slot: SlotName; index: number; frame: string; dx: number; dy: number; legs?: number; eyes?: number; }
export interface Pose { id: string; entries: readonly PoseEntry[]; contact?: readonly [number, number]; }
export interface Scaffold { id: string; family: string; tier: SizeTier; origin: readonly [number, number]; poses: Readonly<Record<string, Pose>>; }
export interface Palette { colours: readonly number[]; ramps: Readonly<Record<string, readonly [number, number, number, number]>>; outline: number; eye: number; eyeHighlight: number; glow: number; }
/**
 * A named species: one fixed look, drawn from its own parts (kind `key`) on scaffold `<family>/<key>/<tier>`. `legs` is from LIMB_COUNTS, `eyes` from EYE_COUNTS, `iris` an iris ramp number.
 * `head`: false for a body with no head part, whose eyes sit on its torso. `template`: the name of the pose set the
 * species is held to (the family name unless its line says otherwise).
 */
export interface Species { key: string; family: string; tier: SizeTier; legs: number; eyes: number; iris: number; tail: boolean; head: boolean; template: string }
/**
 * `fallbacks` maps `<family>/<tier>` to the id of the part drawn alone when a creature of that family and tier has nothing else to draw.
 * `species` maps each species key to its entry.
 */
export interface Catalogue { parts: ReadonlyMap<string, Part>; scaffolds: ReadonlyMap<string, Scaffold>; palette: Palette; fallbacks: ReadonlyMap<string, string>; species: ReadonlyMap<string, Species>; }

/** The key of `Catalogue.fallbacks` for a family and tier. */
export function fallbackKey(family: string, tier: SizeTier): string {
  return `${family}/${tier}`;
}

export function partId(family: string, slot: SlotName, kind: string, tier: SizeTier, variant: number): string {
  return `${family}/${slot}/${kind}/${tier}/v${variant}`;
}
