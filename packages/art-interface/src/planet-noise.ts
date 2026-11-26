import { hashInt } from '@cf/domain-rand';
import { rootOf } from './space';

/** floor(a / b) by shift and subtract, for 0 <= a < 2^31 and 1 <= b. */
export function quotient(a: number, b: number): number {
  let rest = a;
  let q = 0;
  for (let bit = 30; bit >= 0; bit--) {
    if (rest >>> bit < b) continue;
    rest -= b << bit;
    q |= 1 << bit;
  }
  return q;
}

/** The pixels of the painter's disc of radius r (1 or more) and each one's place on a ball of radius 65536.
 *  side is 2r + 1; index (dy + r) * side + (dx + r). on is 1 on the disc. x, y, z are dx, dy, dz times
 *  quotient(65536, r), where dz = rootOf(r*r + r - dx*dx - dy*dy); all 0 off the disc. */
export interface GlobePoints { r: number; side: number; on: Uint8Array; x: Int32Array; y: Int32Array; z: Int32Array }

export function globePoints(r: number): GlobePoints {
  const side = 2 * r + 1;
  const step = quotient(65536, r);
  const on = new Uint8Array(side * side);
  const x = new Int32Array(side * side);
  const y = new Int32Array(side * side);
  const z = new Int32Array(side * side);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const depth = r * r + r - dx * dx - dy * dy;
      if (depth < 0) continue;
      const i = (dy + r) * side + (dx + r);
      on[i] = 1;
      x[i] = dx * step;
      y[i] = dy * step;
      z[i] = rootOf(depth) * step;
    }
  }
  return { r, side, on, x, y, z };
}

/** The value, 0 to 65535, at the lattice point (X, Y, Z) of one octave's field. The field is hashInt(seed, 0x51ed,
 *  octave), the octave in hashInt's last place: hashInt reads its seed and its x as one number (seed ^ x), so with
 *  the octave added to the seed or put in x, the field of seed + 1 is the field of seed with its lattice columns
 *  swapped in pairs, and one seed's second octave is the next seed's first. */
const latticeValue = (seed: number, X: number, Y: number, Z: number): number => hashInt(hashInt(seed, X, Y), Z, 0x9e37) & 0xffff;

/** How far, 0 to 255, a coordinate lies across its lattice cell, eased so the field has no crease at a cell's edge. */
const eased = (coordinate: number): number => {
  const f = (coordinate & 0xffff) >> 8;
  return (f * f * (768 - 2 * f)) >> 16;
};

/** The value t 256ths of the way from a to b. */
const mixed = (a: number, b: number, t: number): number => a + (((b - a) * t) >> 8);

/** Smooth seeded noise at a place in space, a whole number from 0 up. x, y, z count 65536ths of a lattice cell and
 *  may be negative. Each octave doubles the detail and halves its weight, so the highest value it can reach is
 *  65535 less its 2^octaves-th part (32767 with one octave, 61439 with four), and values gather about the middle: a
 *  threshold is set on stills, not taken as a share of 65536. Whole numbers only. The caller keeps each coordinate
 *  times 2^(octaves - 1) under 2^31 either side of 0, and takes the seed of a second field of the same planet as
 *  hashInt(seed, 0, k), never seed + k and never with k in hashInt's middle place. */
export function noise3(seed: number, x: number, y: number, z: number, octaves: number): number {
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const field = hashInt(seed, 0x51ed, o);
    const [px, py, pz] = [x << o, y << o, z << o];
    const [X, Y, Z] = [px >> 16, py >> 16, pz >> 16];
    const [tx, ty, tz] = [eased(px), eased(py), eased(pz)];
    const along = (dy: number, dz: number): number => mixed(latticeValue(field, X, Y + dy, Z + dz), latticeValue(field, X + 1, Y + dy, Z + dz), tx);
    const value = mixed(mixed(along(0, 0), along(1, 0), ty), mixed(along(0, 1), along(1, 1), ty), tz);
    total += value >> (o + 1);
  }
  return total;
}
