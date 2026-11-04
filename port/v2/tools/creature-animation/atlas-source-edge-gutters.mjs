/** Offline atlas padding only. Replicate exact nearest inner RGBA texels;
 * source, inner frames, options and every non-gutter byte remain unchanged. */
import assert from 'node:assert/strict';

export function exactAtlasGutters(rgba, width, height, frames, options) {
  assert(Buffer.isBuffer(rgba), 'decoded RGBA Buffer required');
  assert(Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0);
  assert.equal(rgba.length, width * height * 4, 'RGBA dimensions');
  assert.equal(options.extrude, 1); assert.equal(options.scale, 1);
  assert.equal(options.allowRotation, false); assert.equal(options.allowTrim, false);
  const inner = new Set(), ring = new Map(), rectangles = [];
  assert(Object.keys(frames).length > 0, 'empty atlas');
  for (const [name, p] of Object.entries(frames)) {
    assert.equal(p.rotated, false); assert.equal(p.trimmed, false);
    const f = p.frame;
    assert.deepEqual(p.sourceSize, {w: f.w, h: f.h});
    assert.deepEqual(p.spriteSourceSize, {x: 0, y: 0, w: f.w, h: f.h});
    for (const v of [f.x, f.y, f.w, f.h]) assert(Number.isSafeInteger(v));
    assert(f.w > 0 && f.h > 0 && f.x >= 1 && f.y >= 1 && f.x + f.w < width && f.y + f.h < height, 'ring bounds');
    rectangles.push({name, ...f});
    for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) {
      const i = y * width + x;
      assert(!inner.has(i), 'overlapping frames'); inner.add(i);
    }
  }
  for (const f of rectangles) for (let y = -1; y <= f.h; y++) for (let x = -1; x <= f.w; x++) {
    if (x >= 0 && x < f.w && y >= 0 && y < f.h) continue;
    const dst = (f.y + y) * width + f.x + x;
    const src = (f.y + Math.max(0, Math.min(f.h - 1, y))) * width + f.x + Math.max(0, Math.min(f.w - 1, x));
    assert(!inner.has(dst), 'ring overlaps frame'); assert(!ring.has(dst), 'rings overlap');
    ring.set(dst, src);
  }
  const corrected = Buffer.from(rgba);
  let changedTexels = 0;
  for (const [dst, src] of ring) {
    if (!rgba.subarray(dst * 4, dst * 4 + 4).equals(rgba.subarray(src * 4, src * 4 + 4))) changedTexels++;
    rgba.copy(corrected, dst * 4, src * 4, src * 4 + 4);
  }
  // Source Buffer stays immutable; all non-ring bytes are copied verbatim.
  for (let i = 0; i < width * height; i++) if (!ring.has(i))
    assert(rgba.subarray(i * 4, i * 4 + 4).equals(corrected.subarray(i * 4, i * 4 + 4)), 'non-ring change');
  return {rgba: corrected, ringTexels: ring.size, changedTexels};
}
