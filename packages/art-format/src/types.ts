export type SizeTier = 'small' | 'medium' | 'large' | 'guardian';
export const TIER_SIZE = { small: [48, 32], medium: [96, 64], large: [144, 96], guardian: [240, 160] } as const;
// Size gene (wrapped to 0..5) to tier: 0,1 small · 2,3 medium · 4,5 large. 'guardian' only when the caller asks for it.
export type SlotName = 'farLimbs' | 'tail' | 'torso' | 'back' | 'nearLimbs' | 'head' | 'headFeature' | 'eyes' | 'glow';
export const DRAW_ORDER: readonly SlotName[] = ['farLimbs', 'tail', 'torso', 'back', 'nearLimbs', 'head', 'headFeature', 'eyes', 'glow'];
export const VARIANTS = { torso: 3, head: 3, tail: 2, limb: 2 } as const;
export const LIMB_COUNTS = [2, 4, 6, 8, 3, 0] as const; // FA_LIMBS, by gene value
export const EYE_COUNTS = [2, 4, 6, 8, 1, 0] as const; // FA_EYES, by gene value

export interface PartFrame { w: number; h: number; pixels: Uint8Array; anchor: readonly [number, number]; attach: Readonly<Record<string, readonly [number, number]>>; }
export interface Part { id: string; family: string; slot: SlotName; tier: SizeTier; kind: string; variant: number; frames: Readonly<Record<string, PartFrame>>; }
export interface PoseEntry { slot: SlotName; index: number; frame: string; dx: number; dy: number; }
export interface Pose { id: string; entries: readonly PoseEntry[]; contact?: readonly [number, number]; }
export interface Scaffold { id: string; family: string; tier: SizeTier; origin: readonly [number, number]; poses: Readonly<Record<string, Pose>>; }
export interface Palette { colours: readonly number[]; ramps: Readonly<Record<string, readonly [number, number, number, number]>>; outline: number; eye: number; eyeHighlight: number; glow: number; }
/** `fallbacks` maps `<family>/<tier>` to the id of the part drawn alone when a creature of that family and tier has nothing else to draw. */
export interface Catalogue { parts: ReadonlyMap<string, Part>; scaffolds: ReadonlyMap<string, Scaffold>; palette: Palette; fallbacks: ReadonlyMap<string, string>; }

/** The key of `Catalogue.fallbacks` for a family and tier. */
export function fallbackKey(family: string, tier: SizeTier): string {
  return `${family}/${tier}`;
}

export function partId(family: string, slot: SlotName, kind: string, tier: SizeTier, variant: number): string {
  return `${family}/${slot}/${kind}/${tier}/v${variant}`;
}

export function tierForSize(sizeGene: number): Exclude<SizeTier, 'guardian'> {
  const g = Number.isFinite(sizeGene) ? Math.floor(sizeGene) : 0; // NaN and the infinities count as gene 0
  const wrapped = ((g % 6) + 6) % 6;
  if (wrapped < 2) return 'small';
  if (wrapped < 4) return 'medium';
  return 'large';
}
