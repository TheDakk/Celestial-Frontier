import { PIXEL_CHARS, PIXEL_TRANSPARENT, TIER_SIZE, type PartFrame, type SizeTier } from '@cf/art-format';

export interface PixelBuffer {
  w: number;
  h: number;
  pixels: Uint8Array;
}

/** A transparent (all zero) canvas of the tier's size. Pixels are row-major: pixels[y * w + x]. */
export function createBuffer(tier: SizeTier): PixelBuffer {
  const [w, h] = TIER_SIZE[tier];
  return { w, h, pixels: new Uint8Array(w * h) };
}

/**
 * Copies a frame onto the target so the frame's anchor pixel lands on (x, y).
 * With mirror the frame is flipped left-to-right about the anchor column.
 * Source pixels of 0 never overwrite; destinations outside the canvas are dropped (never wrapped).
 */
export function blit(target: PixelBuffer, frame: PartFrame, x: number, y: number, mirror = false): void {
  const [ax, ay] = frame.anchor;
  for (let fy = 0; fy < frame.h; fy++) {
    const ty = y + fy - ay;
    if (ty < 0 || ty >= target.h) continue;
    for (let fx = 0; fx < frame.w; fx++) {
      const value = frame.pixels[fy * frame.w + fx] ?? 0;
      if (value === PIXEL_TRANSPARENT) continue;
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
 */
export function hashBuffer(buffer: PixelBuffer): string {
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

/** The text pixel form, one line per row, no trailing newline; values above 16 are '?'. */
export function toAscii(buffer: PixelBuffer): string {
  const lines: string[] = [];
  for (let y = 0; y < buffer.h; y++) {
    let line = '';
    for (let x = 0; x < buffer.w; x++) line += PIXEL_CHARS[buffer.pixels[y * buffer.w + x] ?? 0] ?? '?';
    lines.push(line);
  }
  return lines.join('\n');
}
