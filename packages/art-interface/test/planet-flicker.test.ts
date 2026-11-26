import { describe, expect, it } from 'vitest';
import { loneRuns, type GlobeLayer } from '../src/index';
import { flicker } from './planet-support';

const counter = (seed: number) => () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 8;
/** A wrapped map in which no value stands alone in its row: every run along a row, the one across the seam too, is 2
 *  to 7 pixels long. Values run from `least` (0 is clear) to `most`. This is the rule a finished map keeps (mendMap
 *  sees to it); here the map is made by a seed, so the test needs no kit. */
function runMap(w: number, h: number, seed: number, least: number, most: number): Uint8Array {
  const next = counter(seed);
  const values = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const first = least + (next() % (most - least + 1));
    let value = first;
    let x = 0;
    while (x < w) {
      const left = w - x;
      // The last run is another value than the first, across the seam; no run leaves a single pixel over.
      let length = 2 + (next() % 6);
      if (left - length < 2) length = left;
      for (let k = 0; k < length; k++) values[y * w + x + k] = value;
      x += length;
      let other = least + (next() % (most - least + 1));
      while (other === value || (w - x <= 7 && other === first)) other = least + (next() % (most - least + 1));
      value = other;
    }
  }
  return values;
}
const colours = Array.from({ length: 16 }, (_, i) => 0x101010 * (i % 15) + 0x030201 * (i + 1));

const SIZES = [[65, 192, 64], [129, 384, 128]] as const;
const LEANS = [0, 14, 23, -67, 90] as const;

describe('a turning globe does not flicker', () => {
  it('the test\'s maps keep the rule: no run of one pixel in any row, the seam included', () => {
    for (const [, mapW, mapH] of SIZES) {
      expect(loneRuns(runMap(mapW, mapH, 41, 1, 16), mapW, mapH)).toBe(0);
      expect(loneRuns(runMap(mapW, mapH, 43, 0, 3), mapW, mapH)).toBe(0);
    }
  });
  for (const [width, mapW, mapH] of SIZES) {
    for (const tilt of LEANS) {
      it(`${width} wide, leaning ${tilt}: over a full turn of ${mapW} steps no pixel is one colour, another, then the first again`, () => {
        const surface: GlobeLayer = { w: mapW, h: mapH, values: runMap(mapW, mapH, 41, 1, 16), colours };
        const found = flicker(width, mapW, mapH, tilt, surface, undefined);
        expect(found.flickers).toBe(0);
        // The globe did turn: a pixel changes about every third step.
        expect(found.changes).toBeGreaterThan(width * width * mapW >> 3);
      });
      it(`${width} wide, leaning ${tilt}: nor under a cloud layer that rides with the surface`, () => {
        const surface: GlobeLayer = { w: mapW, h: mapH, values: runMap(mapW, mapH, 41, 1, 16), colours };
        const clouds: GlobeLayer = { w: mapW, h: mapH, values: runMap(mapW, mapH, 43, 0, 3), colours: [0xffffff, 0xe8e8f0, 0xc8c8d8] };
        expect(flicker(width, mapW, mapH, tilt, surface, clouds).flickers).toBe(0);
      });
      it(`${width} wide, leaning ${tilt}: nor under clouds that drift against the surface, fast or slow, the globe turning either way`, () => {
        const surface: GlobeLayer = { w: mapW, h: mapH, values: runMap(mapW, mapH, 41, 1, 16), colours };
        const clouds: GlobeLayer = { w: mapW, h: mapH, values: runMap(mapW, mapH, 43, 0, 3), colours: [0xffffff, 0xe8e8f0, 0xc8c8d8] };
        const riding = flicker(width, mapW, mapH, tilt, surface, clouds);
        for (const [lag, back] of [[8, false], [3, false], [2, false], [1, false], [8, true], [3, true]] as const) {
          const found = flicker(width, mapW, mapH, tilt, surface, clouds, lag, back);
          expect(found.flickers).toBe(0);
          // The clouds did drift: the turn is not the one the riding clouds make.
          expect(found.changes).not.toBe(riding.changes);
        }
      });
      it(`${width} wide, leaning ${tilt}: a stripe one column wide in the map does flicker, at every pixel it passes`, () => {
        const values = runMap(mapW, mapH, 41, 1, 16);
        // The stripe is put straight into the map: a kit's reader would refuse it.
        for (let y = 0; y < mapH; y++) {
          const west = values[y * mapW + 9]!;
          values[y * mapW + 11] = west;
          values[y * mapW + 10] = west === 16 ? 1 : west + 1;
        }
        expect(loneRuns(values, mapW, mapH)).toBeGreaterThanOrEqual(mapH);
        const found = flicker(width, mapW, mapH, tilt, { w: mapW, h: mapH, values, colours }, undefined);
        expect(found.flickers).toBeGreaterThan(width * width >> 1);
      });
    }
  }
});
