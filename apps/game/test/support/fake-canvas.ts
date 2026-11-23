import { vi } from 'vitest';

// jsdom has no canvas. These stand in for the 2D context so a test can read what was painted.
const painted = new WeakMap<HTMLCanvasElement, Array<number | null>>();

/** Replaces getContext('2d') with a recorder for the rest of the test file. */
export function recordCanvasPainting(): void {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, kind: string) {
    if (kind !== '2d') return null;
    const canvas = this;
    return {
      createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
      putImageData(image: { width: number; height: number; data: Uint8ClampedArray }, x: number, y: number): void {
        if (x !== 0 || y !== 0 || image.width !== canvas.width || image.height !== canvas.height) throw new Error('painted off the canvas');
        const out: Array<number | null> = [];
        for (let i = 0; i < image.data.length; i += 4) {
          const [r, g, b, a] = [image.data[i]!, image.data[i + 1]!, image.data[i + 2]!, image.data[i + 3]!];
          if (a !== 0 && a !== 255) throw new Error('a half-transparent pixel');
          out.push(a === 0 ? null : (r << 16) | (g << 8) | b);
        }
        painted.set(canvas, out);
      },
    } as unknown as CanvasRenderingContext2D;
  } as HTMLCanvasElement['getContext']);
}

/** The colour (0xRRGGBB) painted on each pixel of the canvas, row by row; null where it is transparent. */
export function paintedBy(canvas: HTMLCanvasElement): Array<number | null> {
  const found = painted.get(canvas);
  if (found === undefined) throw new Error('nothing was painted on this canvas');
  return found;
}
