import { describe, expect, it } from 'vitest';
import { CLOUD_NIGHT, LAND_NIGHT, NIGHT_SKY, globeFrame, globeTable, madeRamp, nightOf, nightSteps, type GlobeLayer } from '../src/index';

/** The gas kit's four ramps at one hue: sixteen colours, a map value v drawn in the v-th. */
const coloursAt = (hue: number): number[] => [
  [0xd5ae82, 0xbc8458, 0xa96742, 0x854536], [0xfff1d9, 0xf8d9a4, 0xe8b76f, 0xd69963],
  [0xd68041, 0xad532f, 0x803e32, 0x573943], [0xb6a5a3, 0xa58b88, 0x867481, 0x62596e],
].flatMap((swatches) => madeRamp({ hue: 32, swatches: swatches as [number, number, number, number] }, hue));
const counter = (seed: number) => () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 8;
/** A map of seeded values from 1 to `most`, or with `clear` from 0. */
function seededMap(w: number, h: number, seed: number, most: number, clear = false): Uint8Array {
  const next = counter(seed);
  return Uint8Array.from({ length: w * h }, () => (clear ? next() % (most + 1) : 1 + (next() % most)));
}
/** A map with every column moved `by` to the east, wrapped. */
function rolled(layer: GlobeLayer, by: number): GlobeLayer {
  const values = new Uint8Array(layer.values.length);
  for (let y = 0; y < layer.h; y++) for (let x = 0; x < layer.w; x++) values[y * layer.w + ((x + by + layer.w) % layer.w)] = layer.values[y * layer.w + x]!;
  return { ...layer, values };
}
/** Hands out numbers from 1000 up, one a colour, and gives a number's colour back. */
function inkwell(): { inks: (rgb: number) => number; rgb: (ink: number) => number } {
  const made: number[] = [];
  return { inks: (rgb) => (made.includes(rgb) ? made.indexOf(rgb) : made.push(rgb) - 1) + 1000, rgb: (ink) => made[ink - 1000] ?? -1 };
}
const BIG = globeTable(129, 384, 128, 0);
const SMALL = globeTable(65, 192, 64, 14);
const NO_LIGHT = { ux: 0, uy: 0 };
const FROM_LEFT = { ux: -1, uy: 0 };
const at = (side: number, dx: number, dy: number): number => (dy + ((side - 1) >> 1)) * side + dx + ((side - 1) >> 1);

describe('a globe\'s frame in daylight', () => {
  it('each pixel of the disc is the one map pixel its table names, in that pixel\'s own colour, and nothing is drawn off the disc', () => {
    for (const [table, step] of [[BIG, 0], [BIG, 97], [SMALL, 191], [SMALL, -5]] as const) {
      const colours = coloursAt(205);
      const surface: GlobeLayer = { w: table.mapW, h: table.mapH, values: seededMap(table.mapW, table.mapH, 3, 16), colours };
      const well = inkwell();
      const frame = globeFrame(surface, undefined, table, step, 0, NO_LIGHT, well.inks);
      expect([frame.side, frame.pixels.length]).toEqual([table.side, table.side * table.side]);
      for (let i = 0; i < frame.pixels.length; i++) {
        if (table.row[i]! < 0) { expect(frame.pixels[i]).toBe(0); continue; }
        const column = (((table.col[i]! + step) % table.mapW) + table.mapW) % table.mapW;
        expect(well.rgb(frame.pixels[i]!)).toBe(colours[surface.values[table.row[i]! * table.mapW + column]! - 1]);
      }
    }
  });
  it('a step on, every pixel reads the map exactly one column on', () => {
    const surface: GlobeLayer = { w: 384, h: 128, values: seededMap(384, 128, 5, 16), colours: coloursAt(32) };
    for (const step of [0, 200, 383]) {
      const well = inkwell();
      const next = globeFrame(surface, undefined, BIG, step + 1, 0, FROM_LEFT, well.inks);
      expect(next.pixels).toEqual(globeFrame(rolled(surface, -1), undefined, BIG, step, 0, FROM_LEFT, well.inks).pixels);
      expect(next.pixels).not.toEqual(globeFrame(surface, undefined, BIG, step, 0, FROM_LEFT, well.inks).pixels);
    }
    // One column marked: it is seen at exactly the pixels whose column is the mark's less the step.
    const marked = new Uint8Array(384 * 128).fill(1);
    for (let y = 0; y < 128; y++) marked[y * 384 + 100] = 2;
    const well = inkwell();
    const frame = globeFrame({ w: 384, h: 128, values: marked, colours: [0x111111, 0xeeeeee] }, undefined, BIG, 70, 0, NO_LIGHT, well.inks);
    let seen = 0;
    for (let i = 0; i < frame.pixels.length; i++) {
      if (BIG.row[i]! < 0) continue;
      expect(well.rgb(frame.pixels[i]!) === 0xeeeeee).toBe(BIG.col[i] === 30);
      if (BIG.col[i] === 30) seen++;
    }
    expect(seen).toBeGreaterThan(60);
  });
  it('a full turn of steps comes back to the same frame', () => {
    const surface: GlobeLayer = { w: 192, h: 64, values: seededMap(192, 64, 9, 16), colours: coloursAt(300) };
    const well = inkwell();
    expect(globeFrame(surface, undefined, SMALL, 192 + 17, 0, FROM_LEFT, well.inks).pixels).toEqual(globeFrame(surface, undefined, SMALL, 17, 0, FROM_LEFT, well.inks).pixels);
  });
});

describe('the night on a globe', () => {
  it('is three solid arcs: every step is there, and a pixel farther from the star is never in a lighter one', () => {
    for (const [side, light, away] of [[129, { ux: -1, uy: 0 }, [1, 0]], [65, { ux: 0, uy: 5 }, [0, -1]], [129, { ux: 300, uy: 300 }, [-1, -1]], [65, { ux: -7, uy: 7 }, [1, -1]]] as const) {
      const steps = nightSteps(side, light);
      const r = (side - 1) >> 1;
      const counts = [0, 0, 0, 0];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + r) { expect(steps[at(side, dx, dy)]).toBe(0); continue; }
          const here = steps[at(side, dx, dy)]!;
          expect(here).toBeLessThanOrEqual(3);
          counts[here] = (counts[here] ?? 0) + 1;
          const [fx, fy] = [dx + away[0], dy + away[1]];
          if (fx * fx + fy * fy <= r * r + r) expect(steps[at(side, fx, fy)]!).toBeGreaterThanOrEqual(here);
        }
      }
      for (const count of counts) expect(count).toBeGreaterThan(side * 2);
      expect(counts[0]!).toBeGreaterThan(counts[1]! + counts[2]! + counts[3]!);
    }
  });
  it('each arc crosses the line from the star 0.28, 0.42 and 0.68 of the radius past the middle, and runs from pole to pole', () => {
    const steps = nightSteps(129, FROM_LEFT);
    const firstAt = (dy: number, step: number): number => { for (let dx = -64; dx <= 64; dx++) if (steps[at(129, dx, dy)]! >= step) return dx; return 99; };
    // 0.28, 0.42 and 0.68 of 64.5 pixels are 18.06, 27.09 and 43.86.
    expect([firstAt(0, 1), firstAt(0, 2), firstAt(0, 3)]).toEqual([19, 28, 44]);
    for (const dy of [-64, 64]) expect([steps[at(129, 0, dy)], steps[at(129, 1, dy)]! >= 1]).toEqual([0, true]);
    for (let dy = -64; dy <= 64; dy++) for (let dx = -64; dx <= 64; dx++) expect(steps[at(129, dx, dy)]).toBe(steps[at(129, dx, -dy)]);
  });
  it('depends on the way to the star and not on how far it is, and with no way to it there is no night', () => {
    expect(nightSteps(129, { ux: -3, uy: 0 })).toEqual(nightSteps(129, { ux: -3000, uy: 0 }));
    expect(nightSteps(65, { ux: 2, uy: -2 })).toEqual(nightSteps(65, { ux: 90000, uy: -90000 }));
    expect(nightSteps(65, { ux: 1, uy: 2 })).not.toEqual(nightSteps(65, { ux: 2, uy: 1 }));
    // Two far lights that mirror each other give nights that mirror each other.
    const [one, other] = [nightSteps(129, { ux: 16385, uy: 1 }), nightSteps(129, { ux: -16385, uy: -1 })];
    for (let dy = -64; dy <= 64; dy++) for (let dx = -64; dx <= 64; dx++) expect(one[at(129, dx, dy)]).toBe(other[at(129, -dx, -dy)]);
    expect(new Set(nightSteps(65, NO_LIGHT))).toEqual(new Set([0]));
  });
  it('a frame\'s colours are the made ramps\' and their three night steps, and no other shade', () => {
    const colours = coloursAt(141);
    const surface: GlobeLayer = { w: 384, h: 128, values: seededMap(384, 128, 21, 16), colours };
    const well = inkwell();
    const frame = globeFrame(surface, undefined, BIG, 11, 0, { ux: -5, uy: -3 }, well.inks);
    const steps = nightSteps(129, { ux: -5, uy: -3 });
    const seen = new Set<number>();
    for (let i = 0; i < frame.pixels.length; i++) {
      if (BIG.row[i]! < 0) continue;
      const day = colours[surface.values[BIG.row[i]! * 384 + ((BIG.col[i]! + 11) % 384)]! - 1]!;
      expect(well.rgb(frame.pixels[i]!)).toBe(steps[i] === 0 ? day : nightOf(day, LAND_NIGHT[steps[i]! - 1]!, NIGHT_SKY));
      seen.add(well.rgb(frame.pixels[i]!));
    }
    const allowed = new Set(colours.flatMap((colour) => [colour, ...LAND_NIGHT.map((share) => nightOf(colour, share, NIGHT_SKY))]));
    for (const colour of seen) expect(allowed.has(colour)).toBe(true);
    expect(seen.size).toBe(64);
    expect(LAND_NIGHT).toEqual([10, 5, 3]);
  });
  it('a cloud in full night keeps two sixteenths of its colour where the land keeps three', () => {
    const cloud = 0xfff1d9;
    const land = 0x4a7a3a;
    const surface: GlobeLayer = { w: 384, h: 128, values: new Uint8Array(384 * 128).fill(1), colours: [land] };
    const clouds: GlobeLayer = { w: 384, h: 128, values: new Uint8Array(384 * 128).fill(1), colours: [cloud] };
    const well = inkwell();
    const covered = globeFrame(surface, clouds, BIG, 0, 0, FROM_LEFT, well.inks);
    const bare = globeFrame(surface, undefined, BIG, 0, 0, FROM_LEFT, well.inks);
    expect(CLOUD_NIGHT).toEqual([6, 3, 2]);
    expect(well.rgb(covered.pixels[at(129, 60, 0)]!)).toBe(nightOf(cloud, 2, NIGHT_SKY));
    expect(well.rgb(bare.pixels[at(129, 60, 0)]!)).toBe(nightOf(land, 3, NIGHT_SKY));
    expect([19, 28, 44].map((dx) => well.rgb(covered.pixels[at(129, dx, 0)]!))).toEqual([6, 3, 2].map((share) => nightOf(cloud, share, NIGHT_SKY)));
    expect(well.rgb(covered.pixels[at(129, -60, 0)]!)).toBe(cloud);
  });
  it('a glowing value is not darkened by the night, in any step, on the surface or in the clouds, and the values beside it are', () => {
    const [rock, lava] = [0x5a4a44, 0xff7a1a];
    const values = new Uint8Array(384 * 128);
    for (let i = 0; i < values.length; i++) values[i] = 1 + (((i % 384) >> 1) & 1);
    const steps = nightSteps(129, FROM_LEFT);
    const well = inkwell();
    const glowing: GlobeLayer = { w: 384, h: 128, values, colours: [rock, lava], glow: [2] };
    const plain: GlobeLayer = { w: 384, h: 128, values: new Uint8Array(384 * 128).fill(1), colours: [0x224466] };
    for (const [frame, shares] of [[globeFrame(glowing, undefined, BIG, 0, 0, FROM_LEFT, well.inks), LAND_NIGHT], [globeFrame(plain, glowing, BIG, 0, 0, FROM_LEFT, well.inks), CLOUD_NIGHT]] as const) {
      const lit = [0, 0, 0, 0];
      for (let i = 0; i < frame.pixels.length; i++) {
        if (BIG.row[i]! < 0) continue;
        const value = values[BIG.row[i]! * 384 + BIG.col[i]!]!;
        if (value === 2) { expect(well.rgb(frame.pixels[i]!)).toBe(lava); lit[steps[i]!] = (lit[steps[i]!] ?? 0) + 1; }
        else expect(well.rgb(frame.pixels[i]!)).toBe(steps[i] === 0 ? rock : nightOf(rock, shares[steps[i]! - 1]!, NIGHT_SKY));
      }
      for (const count of lit) expect(count).toBeGreaterThan(100);
    }
  });
});

describe('a cloud layer over a globe', () => {
  it('covers the surface where it is set, shows it where it is clear, and turns by its own step', () => {
    const surface: GlobeLayer = { w: 192, h: 64, values: seededMap(192, 64, 31, 4), colours: [0x103050, 0x205070, 0x307090, 0x4090b0] };
    const clouds: GlobeLayer = { w: 192, h: 64, values: seededMap(192, 64, 37, 2, true), colours: [0xffffff, 0xdddddd] };
    const well = inkwell();
    for (const [step, cloudStep] of [[0, 0], [40, 0], [40, 77], [3, -9]] as const) {
      const frame = globeFrame(surface, clouds, SMALL, step, cloudStep, NO_LIGHT, well.inks);
      let [covered, bare] = [0, 0];
      for (let i = 0; i < frame.pixels.length; i++) {
        if (SMALL.row[i]! < 0) continue;
        const cloud = clouds.values[SMALL.row[i]! * 192 + ((SMALL.col[i]! + cloudStep + 192) % 192)]!;
        const land = surface.values[SMALL.row[i]! * 192 + ((SMALL.col[i]! + step) % 192)]!;
        expect(well.rgb(frame.pixels[i]!)).toBe(cloud === 0 ? surface.colours[land - 1] : clouds.colours[cloud - 1]);
        if (cloud === 0) bare++; else covered++;
      }
      expect(Math.min(covered, bare)).toBeGreaterThan(500);
    }
  });
  it('a layer that is not the size of the table\'s map is refused, and so is a value with no colour', () => {
    const surface: GlobeLayer = { w: 192, h: 64, values: new Uint8Array(192 * 64).fill(1), colours: [0x808080] };
    expect(() => globeFrame(surface, undefined, BIG, 0, 0, NO_LIGHT, (rgb) => rgb)).toThrow('a layer 192 by 64 does not fit a globe whose map is 384 by 128');
    expect(() => globeFrame({ ...surface, w: 384, h: 128, values: new Uint8Array(384 * 128).fill(1) }, surface, BIG, 0, 0, NO_LIGHT, (rgb) => rgb)).toThrow('a layer 192 by 64 does not fit a globe whose map is 384 by 128');
    expect(() => globeFrame({ ...surface, values: new Uint8Array(192 * 64).fill(2) }, undefined, SMALL, 0, 0, NO_LIGHT, (rgb) => rgb)).toThrow('a map value of 2 has no colour: its layer has 1');
    // Any value past the layer's colours, met in daylight low on a globe whose every other value, in every step of
    // the night, is drawn before it.
    for (const stray of [3, 4, 5, 6, 7, 8, 9, 255]) {
      const values = new Uint8Array(192 * 64).fill(1);
      for (let i = 0; i < 40 * 192; i++) values[i] = 1 + (i & 1);
      for (let y = 40; y < 64; y++) values[y * 192 + 2] = stray;
      expect(() => globeFrame({ ...surface, values, colours: [0x808080, 0x404040] }, undefined, SMALL, 0, 0, { ux: 1, uy: 0 }, (rgb) => rgb)).toThrow(`a map value of ${stray} has no colour: its layer has 2`);
    }
  });
});
