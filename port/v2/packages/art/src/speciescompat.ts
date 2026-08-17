/* Window-only compatibility boundary for synchronous audit and legacy URL
   callers. Worker code imports `species-painter` and never reaches this
   module, so allocation and encoding stay out of the portable graph. */
import {
  installSpeciesCanvasFactory,
  type ArtCanvas,
} from './speciescanvas.js';
import {
  resolveOverrideCanvas,
  resolveProceduralCanvas,
} from './speciesoverrides.js';

installSpeciesCanvasFactory((width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas as unknown as ArtCanvas;
});

function encodePortableCanvas(canvas: ArtCanvas): string {
  return (canvas as unknown as HTMLCanvasElement).toDataURL();
}

export function resolveOverride(genome: Record<string, unknown>): string | null {
  const canvas = resolveOverrideCanvas(genome);
  return canvas ? encodePortableCanvas(canvas) : null;
}

export function resolveProcedural(genome: Record<string, unknown>): string | null {
  const canvas = resolveProceduralCanvas(genome);
  return canvas ? encodePortableCanvas(canvas) : null;
}
