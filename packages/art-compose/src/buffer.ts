import { PIXEL_ACCENT, PIXEL_CHARS, PIXEL_IRIS, PIXEL_TRANSPARENT, TIER_SIZE, type PartFrame, type SizeTier } from '@cf/art-format';

// Copied once into plain locals: the per-pixel loops below then read no module binding (a large cost under the test runner).
const TRANSPARENT = PIXEL_TRANSPARENT;
const GLYPHS = PIXEL_CHARS;
const ACCENT = PIXEL_ACCENT;
const IRIS_SHIFT = PIXEL_IRIS - PIXEL_ACCENT;

/** A pixel value as an iris part shows it: the accent values 5-8 become the iris values 17-20; any other value is kept. */
export function accentAsIris(value: number): number {
  return value >= ACCENT && value < ACCENT + 4 ? value + IRIS_SHIFT : value;
}

export interface PixelBuffer {
  w: number;
  h: number;
  pixels: Uint8Array;
}

/** Any picture of whole numbers, w by h, row-major: a creature's pixel values, or a map's colour numbers. */
export interface Picture {
  readonly w: number;
  readonly h: number;
  readonly pixels: ArrayLike<number>;
}

/** A transparent (all zero) canvas of the tier's size. Pixels are row-major: pixels[y * w + x]. */
export function createBuffer(tier: SizeTier): PixelBuffer {
  const [w, h] = TIER_SIZE[tier];
  return { w, h, pixels: new Uint8Array(w * h) };
}

/**
 * Copies a frame onto the target so the frame's anchor pixel lands on (x, y).
 * With mirror the frame is flipped left-to-right about the anchor column.
 * With iris, source values 5-8 (the accent ramp) are written as 17-20 (the iris ramp); every other value is copied as is.
 * Source pixels of 0 never overwrite; destinations outside the canvas are dropped (never wrapped).
 */
export function blit(target: PixelBuffer, frame: PartFrame, x: number, y: number, mirror = false, iris = false): void {
  const [ax, ay] = frame.anchor;
  for (let fy = 0; fy < frame.h; fy++) {
    const ty = y + fy - ay;
    if (ty < 0 || ty >= target.h) continue;
    for (let fx = 0; fx < frame.w; fx++) {
      let value = frame.pixels[fy * frame.w + fx] ?? 0;
      if (value === TRANSPARENT) continue;
      if (iris) value = accentAsIris(value);
      const tx = mirror ? x - (fx - ax) : x + fx - ax;
      if (tx < 0 || tx >= target.w) continue;
      target.pixels[ty * target.w + tx] = value;
    }
  }
}

/**
 * hashBuffer definition, permanent for renderer version 1:
 * FNV-1a, 32-bit, over this exact byte sequence: the width as 4 bytes big-endian,
 * the height as 4 bytes big-endian, then every pixel byte in order.
 * Offset basis 0x811c9dc5, prime 0x01000193, multiplied with Math.imul,
 * result unsigned (>>> 0) as exactly 8 lowercase hex characters, zero-padded.
 * A pixel above 255 (a colour number of a map picture; never below 0 nor above 0xFFFFFF) is taken whole in the one
 * step a byte takes: hash = Math.imul(hash ^ pixel, prime). So a picture whose pixels all fit a byte hashes as its
 * bytes, whatever holds them.
 */
export function hashBuffer(buffer: Picture): string {
  let hash = 0x811c9dc5;
  const feed = (byte: number): void => {
    hash = Math.imul(hash ^ byte, 0x01000193);
  };
  for (const n of [buffer.w, buffer.h]) {
    feed((n >>> 24) & 0xff);
    feed((n >>> 16) & 0xff);
    feed((n >>> 8) & 0xff);
    feed(n & 0xff);
  }
  for (let i = 0; i < buffer.pixels.length; i++) feed(buffer.pixels[i] ?? 0);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** The text pixel form, one line per row, no trailing newline; values above 28 are '?'. */
export function toAscii(buffer: Picture): string {
  const lines: string[] = [];
  for (let y = 0; y < buffer.h; y++) {
    let line = '';
    for (let x = 0; x < buffer.w; x++) line += GLYPHS[buffer.pixels[y * buffer.w + x] ?? 0] ?? '?';
    lines.push(line);
  }
  return lines.join('\n');
}
