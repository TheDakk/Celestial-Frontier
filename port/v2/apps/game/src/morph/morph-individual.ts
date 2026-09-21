// The morph system, step 4: ONE place that turns (accepted archetype, genome) into what the loaders need — the
// palette remap over the atlas (M2) and the joint scales (M1). The wiring and the native film entry both call it; an
// identity genome yields nothing, so the archetype loads exactly as before (byte-identical path).
import type { CreaturePartsBindingV1 } from '../creature-rig.js';
import type { BodyCard } from '../motion/body-card.js';
import { morphParamsV1, type MorphGenome, type MorphParamsV1 } from './morph-params.js';
import { paletteRoleOfGroup, remapAtlasPaletteV1, type PaletteFrame } from './morph-palette.js';
import { jointScalesV1 } from './morph-skeleton.js';
export interface MorphIndividualV1 {
  readonly params: MorphParamsV1;
  readonly jointScale?: Readonly<Record<string, number>>;
  readonly atlasPixels?: (rgba: Uint8Array, width: number, height: number) => Uint8Array;
  readonly frames: readonly PaletteFrame[];
}
export function paletteFramesV1(binding: Pick<CreaturePartsBindingV1, 'parts'>, card: Pick<BodyCard, 'parts'>): readonly PaletteFrame[] {
  const groupOf = new Map(card.parts.map((p) => [p.joint, p.group] as const));
  return Object.freeze(binding.parts.filter((p) => p.kind === 'part').map((p) => Object.freeze({ x: p.frame.x, y: p.frame.y, width: p.frame.width, height: p.frame.height, role: paletteRoleOfGroup(groupOf.get(p.joint)) })));
}
export function individualFromGenomeV1(input: { readonly record: { readonly recipeHash: string; readonly genome?: MorphGenome | null }; readonly binding: Pick<CreaturePartsBindingV1, 'parts'>; readonly card: Pick<BodyCard, 'parts'>; readonly genome: MorphGenome | null | undefined }): MorphIndividualV1 {
  const params = morphParamsV1(input.genome, input.record.recipeHash, input.record.genome ?? null), frames = paletteFramesV1(input.binding, input.card);
  if (params.identity) return Object.freeze({ params, frames });
  const scales = jointScalesV1(input.card, params), palette = params.base.hue !== null || params.base.chroma !== 1 || params.accent.hue !== null || params.accent.chroma !== 1;
  return Object.freeze({ params, frames, ...(Object.keys(scales).length ? { jointScale: scales } : {}), ...(palette ? { atlasPixels: (rgba: Uint8Array, w: number, h: number) => remapAtlasPaletteV1(rgba, w, h, frames, params) } : {}) });
}
