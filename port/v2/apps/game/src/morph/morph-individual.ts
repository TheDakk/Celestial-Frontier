// The morph system, step 4: ONE place that turns (accepted archetype, genome) into what the loaders need — the
// palette remap over the atlas (M2) and the joint scales (M1). The wiring and the native film entry both call it; an
// identity genome yields nothing, so the archetype loads exactly as before (byte-identical path).
import type { CreaturePartsBindingV1 } from '../creature-rig-types.js';
import type { BodyCard } from '../motion/body-card.js';
import { archetypeGenomeV1, morphParamsV1, type MorphGenome, type MorphParamsV1 } from './morph-params.js';
import { accentPlanOfCard, emissiveRoleV1, paletteRoleOfPart, remapAtlasPaletteV1, type PaletteFrame } from './morph-palette.js';
import { jointScalesV1 } from './morph-skeleton.js';
import { applyEmissiveAccentV1, applyMarkingV1, emissiveV1, markingNameV1, masterMaskToAtlasV1, type AlphaMask } from './morph-markings.js';
export interface MorphIndividualV1 {
  readonly params: MorphParamsV1;
  /** The painted marking this individual wears (null: plain / no painted mask for the pattern). */
  readonly marking: string | null;
  readonly emissive: boolean;
  readonly jointScale?: Readonly<Record<string, number>>;
  readonly atlasPixels?: (rgba: Uint8Array, width: number, height: number) => Uint8Array;
  readonly frames: readonly PaletteFrame[];
}
export function paletteFramesV1(binding: Pick<CreaturePartsBindingV1, 'parts'>, card: Pick<BodyCard, 'parts' | 'template'>): readonly PaletteFrame[] {
  const groupOf = new Map(card.parts.map((p) => [p.joint, p.group] as const));
  return Object.freeze(binding.parts.filter((p) => p.kind === 'part').map((p) => Object.freeze({ x: p.frame.x, y: p.frame.y, width: p.frame.width, height: p.frame.height, role: paletteRoleOfPart(p, groupOf.get(p.joint), accentPlanOfCard(card)) })));
}
export function individualFromGenomeV1(input: { readonly record: { readonly recipeHash: string; readonly genome?: MorphGenome | null; readonly identity?: { readonly speciesVisualKey?: string }; readonly geometry?: { readonly width: number; readonly height: number } }; readonly binding: Pick<CreaturePartsBindingV1, 'parts' | 'atlasSize'>; readonly card: Pick<BodyCard, 'parts' | 'template'>; /* the template decides the palette roles (required: no silent fallback) */ readonly genome: MorphGenome | null | undefined; /** the individual's painted marking mask in MASTER space, when the archetype has one for its pattern; mapped into the atlas inside the remap where the decoded atlas is at hand */ readonly markingMask?: AlphaMask | null }): MorphIndividualV1 {
  const params = morphParamsV1(input.genome, input.record.recipeHash, archetypeGenomeV1(input.record)), frames = paletteFramesV1(input.binding, input.card);
  const marking = markingNameV1(params), mask = marking && input.markingMask ? input.markingMask : null, emissive = emissiveV1(params);
  if (params.identity && !mask && !emissive) return Object.freeze({ params, frames, marking: null, emissive });
  const scales = jointScalesV1(input.card, params), palette = params.base.hue !== null || params.base.chroma !== 1 || params.accent.hue !== null || params.accent.chroma !== 1;
  const geometry = input.record.geometry; if (mask && !geometry) throw new TypeError('morph: a marking mask needs the record geometry');
  const glow = emissiveRoleV1(frames.map((f) => f.role)); // the accent set, or the base coat when the plan has no accent (primate)
  const accentIndex = (w: number): ((i: number) => boolean) => { const inside = new Uint8Array(w * (input.binding.atlasSize?.height ?? 0) || 0); for (const f of frames) if (f.role === glow) for (let y = f.y; y < f.y + f.height; y++) for (let x = f.x; x < f.x + f.width; x++) inside[y * w + x] = 1; return (i) => inside[i] === 1; };
  const atlasPixels = palette || mask || emissive ? (rgba: Uint8Array, w: number, h: number): Uint8Array => { const out = palette ? remapAtlasPaletteV1(rgba, w, h, frames, params) : new Uint8Array(rgba);
    if (mask) applyMarkingV1(out, w, h, masterMaskToAtlasV1(mask, input.binding, geometry!.width, geometry!.height, rgba), params.accent, emissive); else if (emissive) applyEmissiveAccentV1(out, w, h, accentIndex(w)); return out; } : undefined;
  return Object.freeze({ params, frames, marking: mask ? marking : null, emissive, ...(Object.keys(scales).length ? { jointScale: scales } : {}), ...(atlasPixels ? { atlasPixels } : {}) });
}
