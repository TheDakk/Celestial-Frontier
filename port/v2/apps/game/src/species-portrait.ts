/** @module species-portrait [app] — one portrait image per genome from the species art loader's thumb lease,
 * shared by the battle2 study (whole-portrait fallback) and the world-life resident layer. The lease is
 * released as soon as the pixels are copied into a canvas, so the loader's cache policy stays its own. */
import type { SpeciesArtLoader } from './species-art-loader.js';

export interface PortraitImage { readonly width: number; readonly height: number; readonly source: unknown; pixels(): Uint8ClampedArray; }
export type PortraitProvider = (genome: Readonly<Record<string, unknown>>) => Promise<PortraitImage>;

export function loaderPortrait(loader: SpeciesArtLoader | null): PortraitProvider {
  return async (genome) => {
    if (!loader) throw new Error('portrait unavailable: no species art loader');
    const lease = loader.leaseThumb(genome as Record<string, unknown>);
    try {
      const asset = lease.current ?? await new Promise<{ url: string }>((resolve, reject) => {
        const off = lease.subscribe((thumb, error) => { if (thumb) { off(); resolve(thumb); } else if (error) { off(); reject(error instanceof Error ? error : new Error(String(error))); } });
      });
      const image = new Image(); image.decoding = 'async'; image.src = asset.url; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d')!.drawImage(image, 0, 0);
      return { width: canvas.width, height: canvas.height, source: canvas, pixels: () => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data };
    } finally { lease.release(); }
  };
}

/** Alpha bounds of a portrait (pixels with alpha above 8); the whole image when nothing is opaque. */
export function portraitAlphaBox(rgba: Uint8ClampedArray, width: number, height: number): { x: number; y: number; width: number; height: number } {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if ((rgba[(y * width + x) * 4 + 3] ?? 0) > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? { x: 0, y: 0, width, height } : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
