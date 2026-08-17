/* Portable species-painter canvas ownership. The painter graph uses the
   OffscreenCanvas structural contract in both realms. Window compatibility
   installs one real HTMLCanvasElement factory behind its sole audited cast;
   the worker installs the native OffscreenCanvas constructor before importing
   any painter module. No DOM global belongs in this file. */

export type ArtCanvas = OffscreenCanvas;
export type ArtContext2D = OffscreenCanvasRenderingContext2D;
export type SpeciesCanvasFactory = (width: number, height: number) => ArtCanvas;

let canvasFactory: SpeciesCanvasFactory | null = null;
let allocationCount = 0;

/** Install exactly one realm owner before the first canvas allocation. */
export function installSpeciesCanvasFactory(factory: SpeciesCanvasFactory): void {
  if (typeof factory !== 'function') throw new TypeError('species canvas factory must be callable');
  if (allocationCount !== 0) throw new Error('species canvas factory cannot change after allocation');
  if (canvasFactory !== null) throw new Error('species canvas factory is already installed');
  canvasFactory = factory;
}

export function createSpeciesCanvas(width: number, height: number): ArtCanvas {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
    throw new RangeError('species canvas dimensions must be positive integers');
  }
  if (!canvasFactory) throw new Error('species canvas factory is not installed for this realm');
  const canvas = canvasFactory(width, height);
  if (!canvas || typeof canvas.getContext !== 'function') {
    throw new Error('species canvas factory returned an invalid canvas');
  }
  canvas.width = width;
  canvas.height = height;
  allocationCount++;
  return canvas;
}
