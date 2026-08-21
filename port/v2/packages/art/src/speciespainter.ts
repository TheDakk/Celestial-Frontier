/* Producer-agnostic species painter. This graph owns deterministic drawing
   only: the caller supplies canvas allocation and performs any encoding. */
import {
  hdPortraitFaunaCanvas,
  hdPortraitFloraCanvas,
  hdPortraitFungiCanvas,
  hdPortraitMicrobeCanvas,
} from './hdportrait.worker.verbatim.js';
import {
  lineageRenderKingdom,
  resolveOverrideCanvas,
} from './speciesoverrides.js';
import {
  createSpeciesCanvas,
  type ArtCanvas,
} from './speciescanvas.js';

export const SPECIES_PORTRAIT_SIZE = 440 as const;
export const SPECIES_THUMB_SIZE = 132 as const;

function renderVerbatimPortrait(genome: Record<string, unknown>): ArtCanvas {
  const kingdom = lineageRenderKingdom(genome);
  return kingdom === 'fauna' ? hdPortraitFaunaCanvas(genome)
    : kingdom === 'flora' ? hdPortraitFloraCanvas(genome)
      : kingdom === 'fungi' ? hdPortraitFungiCanvas(genome)
        : hdPortraitMicrobeCanvas(genome);
}

export function renderSpeciesPortraitCanvas(genome: Record<string, unknown>): ArtCanvas {
  const canvas = resolveOverrideCanvas(genome) ?? renderVerbatimPortrait(genome);
  if (canvas.width !== SPECIES_PORTRAIT_SIZE || canvas.height !== SPECIES_PORTRAIT_SIZE) {
    throw new Error(
      `species portrait canvas must be ${SPECIES_PORTRAIT_SIZE}x${SPECIES_PORTRAIT_SIZE}`,
    );
  }
  return canvas;
}

export function renderSpeciesThumbCanvas(genome: Record<string, unknown>): ArtCanvas {
  const portrait = renderSpeciesPortraitCanvas(genome);
  const canvas = createSpeciesCanvas(SPECIES_THUMB_SIZE, SPECIES_THUMB_SIZE);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas context unavailable for species thumbnail');
  context.drawImage(portrait, 0, 0, SPECIES_THUMB_SIZE, SPECIES_THUMB_SIZE);
  return canvas;
}
