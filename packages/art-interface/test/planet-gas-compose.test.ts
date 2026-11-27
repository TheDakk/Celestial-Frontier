import { describe, expect, it } from 'vitest';
import { CLOUD_NIGHT, LAND_NIGHT, NIGHT_SKY, gasBrush, gasMap, gasPlan, globeFrame, globePoints, globeTable, loneRises, loneRuns, nightOf, parsePlanetKit, thinPixels, type GasPlan, type GlobeLayer } from '../src/index';
import { gasTablesText, testGasKitText } from './planet-kit-support';
import { flicker } from './planet-support';

const TEXT = testGasKitText();
const KIT = parsePlanetKit(TEXT);
/** A plan by hand: a north cap over the top half and a south cap over the rest, still air and clear skies. */
const plain = (): GasPlan => ({
  seed: 0, family: 'ember', profile: 'quiet', swatches: gasPlan(1, KIT).swatches, winds: [], events: [],
  ribbons: [
    { name: 'north', kind: 'cap', variant: 1, top: 0, depth: 16, phase: 0, mirror: false },
    { name: 'south', kind: 'cap', variant: 1, top: 16, depth: 16, phase: 0, mirror: false },
  ],
});
const SIZES = [[384, 128], [192, 64]] as const;
const layerOf = (plan: GasPlan, width: number): GlobeLayer => ({ ...gasMap(plan, KIT, width), colours: plan.swatches });

describe('a gas giant\'s map composed from its plan and its kit', () => {
  it('every pixel holds an ink from 1 to 16, at both sizes, and the same seed gives the same bytes', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const plan = gasPlan(seed, KIT);
      for (const [w, h] of SIZES) {
        const map = gasMap(plan, KIT, w);
        expect([map.w, map.h, map.values.length]).toEqual([w, h, w * h]);
        expect(Math.min(...map.values)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...map.values)).toBeLessThanOrEqual(16);
        expect(gasMap(gasPlan(seed, KIT), parsePlanetKit(TEXT), w).values).toEqual(map.values);
      }
    }
    expect(gasMap(gasPlan(3, KIT), KIT, 384).values).not.toEqual(gasMap(gasPlan(4, KIT), KIT, 384).values);
    expect(() => gasMap(plain(), KIT, 96)).toThrow(/a gas map is 384 or 192 wide, not 96/);
  });
  it('every pixel comes from a kit drawing: a kit drawn in one ink gives maps of that ink', () => {
    const marked = parsePlanetKit(TEXT.split('\n').map((line) => (/^[.1-9a-g]+$/.test(line) ? line.replace(/[1-9a-g]/g, 'b') : line)).join('\n'));
    for (const seed of [1, 2, 3, 14]) {
      for (const [w] of SIZES) expect([...new Set(gasMap({ ...gasPlan(seed, marked), family: 'ember', events: [] }, marked, w).values)]).toEqual([11]);
    }
  });
  it('refuses a plan whose ribbons leave a row unpainted, and a ribbon that is not a whole wrap', () => {
    const short = plain();
    short.ribbons[0]!.top = 6;
    expect(() => gasBrush(short, KIT, 384)).toThrow(/leave part of the map unpainted in tier 384/);
    const narrow = parsePlanetKit(TEXT.replace('table ribbon/north caps/north 32', 'table ribbon/north storm/pearls 32'));
    expect(() => gasBrush(plain(), narrow, 384)).toThrow(/the ribbon storm\/pearls is 48 wide in tier 384: a ribbon is a whole wrap/);
  });
  it('a ribbon starts at its plan\'s phase and wraps, is mirrored whole, and is painted over the margin of the one before', () => {
    for (const [width] of SIZES) {
      const still = gasBrush(plain(), KIT, width);
      const { w, h } = still;
      // The south cap's ragged top is painted above its own first row, over the north cap; elsewhere the north shows.
      const above = still.values.slice(0, (h >> 1) * w);
      expect(above.some((ink) => ink === 16 || ink === 15)).toBe(true);
      expect(still.values.slice((h >> 1) * w).every((ink) => ink === 16 || ink === 15)).toBe(true);
      expect(above.slice(0, (h >> 2) * w).every((ink) => ink === 13 || ink === 14)).toBe(true);
      const turned = plain();
      for (const ribbon of turned.ribbons) ribbon.phase = 40;
      const moved = gasBrush(turned, KIT, width);
      const by = (40 * w) / 384;
      expect(moved.values).not.toEqual(still.values);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) expect(moved.values[y * w + ((x + by) % w)]).toBe(still.values[y * w + x]);
      const flipped = plain();
      for (const ribbon of flipped.ribbons) ribbon.mirror = true;
      const mirror = gasBrush(flipped, KIT, width);
      // A mirrored drawing is read from its last column back (in the 192 tier the test kit's column pairs are alike).
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) expect(mirror.values[y * w + x]).toBe(still.values[y * w + w - 1 - x]);
    }
  });
  it('a wind moves each column\'s rows up and down by its height at most, only within its reach, and a whole wave round the globe', () => {
    for (const [width] of SIZES) {
      const still = gasBrush(plain(), KIT, width);
      const windy = plain();
      windy.winds.push({ centre: 64, radius: 25, frequency: 2, amplitude: 8, phase: 0 });
      const blown = gasBrush(windy, KIT, width);
      const { w, h } = still;
      const scale = 128 / h;
      let changed = 0;
      for (let y = 0; y < h; y++) {
        const inReach = Math.abs((y + 0.5) * scale - 64) < 25;
        for (let x = 0; x < w; x++) {
          const ink = blown.values[y * w + x]!;
          if (ink !== still.values[y * w + x]) changed++;
          if (!inReach) expect(ink).toBe(still.values[y * w + x]);
        }
      }
      expect(changed).toBeGreaterThan(w);
      // At the wind's middle the rows are moved by the wave's own height: where it crosses nothing (phase 0, x = 0) the
      // row is its own; a quarter wave on (two waves round: an eighth of the way), 8 rows of the 128 down.
      const mid = h >> 1;
      const column = (x: number): number[] => Array.from({ length: h }, (_, y) => still.values[y * w + x]!);
      expect(blown.values[mid * w]).toBe(column(0)[mid]);
      const eighth = w >> 3;
      const down = 8 / scale;
      // The middle row sits half a row from the wind's centre, so it is moved by a little under the full height.
      expect([column(eighth)[mid + down], column(eighth)[mid + down - 1]]).toContain(blown.values[mid * w + eighth]);
      expect(blown.values[mid * w + 3 * eighth]).toBe(column(3 * eighth)[mid - down] ?? -1);
    }
  });
  it('a row the winds move by exactly half a row goes to the even row, as the kit rounds, at both sizes', () => {
    // Narrow map: a wind centred on row 66 of the 128 is at full strength on brush row 16; with a height of 4 its
    // push there is half a brush row where its wave stands at a half, a twelfth of a wave from its start.
    let met = 0;
    for (let phase = 0; phase < 384; phase += 4) {
      const windy = plain();
      windy.winds.push({ centre: 66, radius: 20, frequency: 1, amplitude: 4, phase });
      const [still, blown] = [gasBrush(plain(), KIT, 192), gasBrush(windy, KIT, 192)];
      const x = (8 - phase / 4 + 96) % 96;
      if (still.values[16 * 96 + x] === still.values[17 * 96 + x]) continue;
      met++;
      expect(blown.values[16 * 96 + x]).toBe(still.values[16 * 96 + x]);
    }
    expect(met).toBeGreaterThan(3);
    // Wide map: a wind of reach 1 about row c pushes rows c - 1 and c, and no other, by half its height; with a
    // height of 1, at the top of its wave, by half a row. Row c - 1 and a half is read at the even row of c - 1 and
    // c; row c and a half at the even row of c and c + 1.
    met = 0;
    for (const centre of [40, 41, 62, 63, 90, 91, 100, 101]) {
      for (let phase = 0; phase < 384; phase += 16) {
        const windy = plain();
        windy.winds.push({ centre, radius: 1, frequency: 1, amplitude: 1, phase });
        const [still, blown] = [gasBrush(plain(), KIT, 384), gasBrush(windy, KIT, 384)];
        // The wave is at its top a quarter of a turn on from its start.
        const x = (96 - phase + 384) % 384;
        const column = (y: number): number => still.values[y * 384 + x]!;
        const even = (y: number): number => (y % 2 === 0 ? y : y + 1);
        expect(blown.values[(centre - 1) * 384 + x]).toBe(column(even(centre - 1)));
        expect(blown.values[centre * 384 + x]).toBe(column(even(centre)));
        if (column(centre) !== column(centre + 1) || column(centre - 1) !== column(centre)) met++;
        for (const y of [centre - 2, centre + 1]) expect(blown.values[y * 384 + x]).toBe(column(y));
      }
    }
    expect(met).toBeGreaterThan(3);
  });
  it('a ribbon of the narrow map is shifted by whole brush cells: its phase is rounded down to a cell', () => {
    const still = gasBrush(plain(), KIT, 192);
    for (const phase of [40, 41, 42, 43]) {
      const turned = plain();
      for (const ribbon of turned.ribbons) ribbon.phase = phase;
      const moved = gasBrush(turned, KIT, 192);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 96; x++) expect(moved.values[y * 96 + ((x + 10) % 96)]).toBe(still.values[y * 96 + x]);
    }
  });
  it('refuses a hand-made plan it cannot paint, in one line: a wind with no reach, a ribbon with no depth, a size that is no whole number', () => {
    const broken = (change: (plan: GasPlan) => void): (() => unknown) => () => { const plan = plain(); change(plan); return gasMap(plan, KIT, 384); };
    expect(broken((plan) => plan.winds.push({ centre: 64, radius: 0, frequency: 1, amplitude: 4, phase: 0 }))).toThrow(/a wind of a gas plan has radius 0, .*a radius is 1 or more/);
    expect(broken((plan) => plan.winds.push({ centre: 64, radius: 12, frequency: 1, amplitude: 5000, phase: 0 }))).toThrow(/whole numbers up to 4096/);
    expect(broken((plan) => { plan.ribbons[1]!.depth = 0; })).toThrow(/the ribbon south of a gas plan has a depth of 0 cells.*a depth is 1 or more/);
    expect(broken((plan) => { plan.ribbons[0]!.depth = 15.5; })).toThrow(/the ribbon north of a gas plan has a depth of 15.5 cells/);
    expect(broken((plan) => plan.events.push({ kind: 'pearls', longitude: 10, latitude: 64, width: 0, height: 100, mirror: false }))).toThrow(/the pearls of a gas plan is 0 by 100 hundredths/);
    expect(broken(() => undefined)).not.toThrow();
  });
  it('a hood is laid along the whole north edge, and other weather at its place, scaled, wrapped over the seam, with its inks swapped', () => {
    for (const [width] of SIZES) {
      const hooded = plain();
      hooded.events.push({ kind: 'polar-hood', longitude: 100, latitude: 90, width: 100, height: 100, mirror: false });
      const map = gasBrush(hooded, KIT, width);
      const { w, h } = map;
      expect(map.values.slice(0, w).every((ink) => ink === 14 || ink === 15)).toBe(true);
      const still = gasBrush(plain(), KIT, width);
      expect(map.values.slice((h >> 1) * w)).toEqual(still.values.slice((h >> 1) * w));

      // Pearls are drawn in inks 7 and 8, and 8 is swapped for 9: at longitude 2 the stamp lies over the seam.
      const stormy = plain();
      stormy.events.push({ kind: 'pearls', longitude: 2, latitude: 96, width: 100, height: 100, mirror: false });
      const storm = gasBrush(stormy, KIT, width);
      const at: number[] = [];
      storm.values.forEach((ink, i) => { if (ink !== still.values[i]) at.push(i); });
      expect(at.length).toBeGreaterThan(12);
      for (const i of at) expect([7, 9]).toContain(storm.values[i]);
      const [xs, ys] = [at.map((i) => i % w), at.map((i) => Math.floor(i / w))];
      expect(Math.min(...xs)).toBeLessThan(w >> 3);
      expect(Math.max(...xs)).toBeGreaterThan(w - (w >> 3));
      const middle = (96 * h) / 128;
      expect(Math.min(...ys)).toBeGreaterThan(middle - (h >> 3));
      expect(Math.max(...ys)).toBeLessThan(middle + (h >> 3));
      // Half again as wide and twice as tall, it covers about three times the pixels.
      const big = plain();
      big.events.push({ kind: 'pearls', longitude: 200, latitude: 96, width: 150, height: 200, mirror: false });
      const grown = gasBrush(big, KIT, width).values.reduce((sum, ink, i) => sum + (ink === still.values[i] ? 0 : 1), 0);
      expect(grown).toBeGreaterThan(at.length * 2);
      expect(grown).toBeLessThan(at.length * 4);
    }
  });
  it('an event\'s height is scaled by its height and its width by its width', () => {
    for (const [width] of SIZES) {
      const still = gasBrush(plain(), KIT, width);
      const span = (across: number, down: number): [number, number] => {
        const plan = plain();
        plan.events.push({ kind: 'pearls', longitude: 200, latitude: 96, width: across, height: down, mirror: false });
        const map = gasBrush(plan, KIT, width);
        const [xs, ys] = [new Set<number>(), new Set<number>()];
        map.values.forEach((ink, i) => { if (ink !== still.values[i]) { xs.add(i % map.w); ys.add(Math.floor(i / map.w)); } });
        return [xs.size, ys.size];
      };
      const [w1, h1] = span(100, 100);
      const [w2, h2] = span(100, 200);
      const [w3, h3] = span(200, 100);
      expect([w2, h3]).toEqual([w1, h1]);
      expect(h2).toBe(2 * h1);
      expect(w3).toBeGreaterThanOrEqual(2 * w1 - 2);
    }
  });
  it('a mirrored stamp is its drawing read from its last column back', () => {
    for (const [width] of SIZES) {
      // The banner is drawn with its west half in ink 8 and its east half in ink 6.
      const laid = (mirror: boolean): { w: number; values: Uint8Array } => {
        const plan = plain();
        plan.events.push({ kind: 'banner-front', longitude: 200, latitude: 96, width: 100, height: 100, mirror });
        return gasBrush(plan, KIT, width);
      };
      const [straight, flipped] = [laid(false), laid(true)];
      // The ink of the stamp's westmost and of its eastmost pixel.
      const ends = (map: { w: number; values: Uint8Array }): [number, number] => {
        const at = [...map.values].map((ink, i) => (ink === 8 || ink === 6 ? i : -1)).filter((i) => i >= 0);
        const [west, east] = [at.reduce((a, b) => (b % map.w < a % map.w ? b : a)), at.reduce((a, b) => (b % map.w > a % map.w ? b : a))];
        return [map.values[west]!, map.values[east]!];
      };
      expect(ends(straight)).toEqual([8, 6]);
      expect(ends(flipped)).toEqual([6, 8]);
      expect([...flipped.values].filter((ink) => ink === 8).length).toBe([...straight.values].filter((ink) => ink === 8).length);
    }
  });
  it('the hood is painted first, whatever its place in the plan: other weather at the pole lies over it', () => {
    for (const [width] of SIZES) {
      const hoodOnly = plain();
      hoodOnly.events.push({ kind: 'polar-hood', longitude: 0, latitude: 0, width: 100, height: 100, mirror: false });
      const plan = plain();
      plan.events.push({ kind: 'pearls', longitude: 200, latitude: 6, width: 100, height: 100, mirror: false }, { kind: 'polar-hood', longitude: 0, latitude: 0, width: 100, height: 100, mirror: false });
      const [under, over] = [gasBrush(hoodOnly, KIT, width), gasBrush(plan, KIT, width)];
      // The pearls' inks (7, and 8 swapped to 9) show in the hood's own rows (the hood is drawn in 14 and 15).
      const top = [...over.values.slice(0, 2 * over.w)];
      expect([...under.values.slice(0, 2 * under.w)].every((ink) => ink === 14 || ink === 15)).toBe(true);
      expect(top.some((ink) => ink === 7 || ink === 9)).toBe(true);
    }
  });
  it('an event is anchored on the first of the rows the winds have carried nearest its latitude', () => {
    // A wind of reach 1 and height 1 about row 80 pushes rows 79 and 80 by exactly half a row at the top of its
    // wave: they stand at 79 and a half and 80 and a half, as near to row 80 as each other. The first, 79, is taken.
    const windy = plain();
    windy.winds.push({ centre: 80, radius: 1, frequency: 1, amplitude: 1, phase: 0 });
    const before = gasBrush(windy, KIT, 384);
    windy.events.push({ kind: 'pearls', longitude: 96, latitude: 80, width: 100, height: 100, mirror: false });
    const after = gasBrush(windy, KIT, 384);
    const rows = [...after.values].map((ink, i) => (ink === before.values[i] ? -1 : Math.floor(i / 384))).filter((y) => y >= 0);
    // The pearls' drawing is 12 rows tall and every row of it holds ink: it is laid from 6 rows above its anchor.
    expect([Math.min(...rows), Math.max(...rows)]).toEqual([79 - 6, 79 + 5]);
    // In still air the anchor is the event's own row.
    const still = plain();
    still.events.push({ kind: 'pearls', longitude: 96, latitude: 80, width: 100, height: 100, mirror: false });
    const [bare, calm] = [gasBrush(plain(), KIT, 384), gasBrush(still, KIT, 384)];
    const calmRows = [...calm.values].map((ink, i) => (ink === bare.values[i] ? -1 : Math.floor(i / 384))).filter((y) => y >= 0);
    expect([Math.min(...calmRows), Math.max(...calmRows)]).toEqual([80 - 6, 80 + 5]);
  });
  it('an event rides the winds: it is laid where they have carried its band, not where the band would lie in still air', () => {
    const windy = plain();
    windy.winds.push({ centre: 96, radius: 31, frequency: 1, amplitude: 11, phase: 0 });
    const before = gasBrush(windy, KIT, 384);
    // A quarter of the way round the wave is at its height: the band's rows are read 11 rows on, so its middle lies 11 rows north.
    windy.events.push({ kind: 'pearls', longitude: 96, latitude: 96, width: 100, height: 100, mirror: false });
    const after = gasBrush(windy, KIT, 384);
    const rows = [...after.values].map((ink, i) => (ink === before.values[i] ? -1 : Math.floor(i / 384))).filter((y) => y >= 0);
    const centre = (Math.min(...rows) + Math.max(...rows)) / 2;
    expect(Math.abs(centre - (96 - 11))).toBeLessThanOrEqual(2);
  });
  it('on a night world the kit\'s night swaps are made: the ribbons\' and each event\'s own, with the event\'s day swaps', () => {
    const day = plain();
    day.ribbons[0] = { name: 'silk', kind: 'light', variant: 1, top: 0, depth: 16, phase: 0, mirror: false };
    const lit = gasBrush(day, KIT, 384).values;
    const dark = gasBrush({ ...day, family: 'night' }, KIT, 384).values;
    // Silk is drawn in inks 5 and 6: at night its 5 is 13, and its 6 stays.
    expect(lit.includes(5)).toBe(true);
    expect(dark.includes(5)).toBe(false);
    for (let i = 0; i < lit.length; i++) expect(dark[i]).toBe(lit[i] === 5 ? 13 : lit[i]);
    // The squall is drawn in inks 7 and 6 and has a night swap of 6 for 5: by day its 6 shows, at night 5 in its place.
    // The fan is drawn in 8 and 7, swapped to 11 and 2 by day and by night alike.
    for (const [width] of SIZES) {
      const stormy = plain();
      stormy.events.push({ kind: 'squall-line', longitude: 100, latitude: 100, width: 100, height: 100, mirror: false }, { kind: 'cloud-fan', longitude: 280, latitude: 100, width: 100, height: 100, mirror: false });
      const inks = (family: string): number[] => {
        const [calm, storm] = [gasBrush({ ...plain(), family }, KIT, width).values, gasBrush({ ...stormy, family }, KIT, width).values];
        return [...new Set([...storm].filter((ink, i) => ink !== calm[i]))].sort((a, b) => a - b);
      };
      expect(inks('ember')).toEqual([2, 6, 7, 11]);
      expect(inks('night')).toEqual([2, 5, 7, 11]);
    }
  });
});

describe('the two-pixel rule on composed gas maps', () => {
  it('before the mend the wide map has pixels in no like square, runs one pixel wide and one pixel tall; after it none, at either size', () => {
    const sum = { thin: 0, wide: 0, tall: 0, mended: 0 };
    for (let seed = 1; seed <= 24; seed++) {
      const plan = gasPlan(seed, KIT);
      const brush = gasBrush(plan, KIT, 384);
      sum.thin += thinPixels(brush.values, 384, 128, true);
      sum.wide += loneRuns(brush.values, 384, 128);
      sum.tall += loneRises(brush.values, 384, 128);
      for (const [w, h] of SIZES) {
        const map = gasMap(plan, KIT, w);
        if (w === 384) sum.mended += map.mended;
        expect(thinPixels(map.values, w, h, true)).toBe(0);
        expect(loneRuns(map.values, w, h)).toBe(0);
        expect(loneRises(map.values, w, h)).toBe(0);
      }
    }
    console.log(`test kit, seeds 1 to 24, 384 wide, before the mend: ${sum.thin} pixels in no like square, ${sum.wide} one-pixel runs in rows, ${sum.tall} in columns; the mend rewrote ${sum.mended}; after: 0, 0, 0`);
    expect(sum.thin).toBeGreaterThan(1000);
    expect(sum.wide).toBeGreaterThan(100);
    expect(sum.tall).toBeGreaterThan(1000);
  });
});

describe('a composed gas giant on its globe', () => {
  const inks = (rgb: number): number => rgb + 1000;
  it('draws nothing outside the disc, fills the disc, and uses only the world\'s sixteen colours and their night steps', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 14]) {
      const plan = gasPlan(seed, KIT);
      const allowed = new Set<number>();
      for (const rgb of plan.swatches) {
        allowed.add(inks(rgb));
        for (const share of LAND_NIGHT) allowed.add(inks(nightOf(rgb, share, NIGHT_SKY)));
      }
      for (const [side, width, tilt] of [[129, 384, 0], [129, 384, 23], [65, 192, 0], [65, 192, -67], [33, 192, 9]] as const) {
        const layer = layerOf(plan, width);
        const table = globeTable(side, layer.w, layer.h, tilt);
        const disc = globePoints((side - 1) >> 1);
        for (const step of [0, 77, 191]) {
          const frame = globeFrame(layer, undefined, table, step, 0, { ux: -3, uy: -2 }, inks);
          const met = new Set<number>();
          frame.pixels.forEach((pixel, i) => {
            if (disc.on[i] === 1) met.add(pixel);
            else expect(pixel).toBe(0);
          });
          expect(met.has(0)).toBe(false);
          for (const pixel of met) expect(allowed.has(pixel)).toBe(true);
          // Day and each step of the night are all on the disc.
          expect(met.size).toBeGreaterThan(4);
        }
      }
    }
    expect(CLOUD_NIGHT.length).toBe(3);
  });
  for (const [side, width] of [[65, 192], [129, 384]] as const) {
    it(`${side} wide: over a full turn no pixel flickers, upright or leaning, on the composed maps of consecutive seeds`, () => {
      for (const [seed, tilt] of [[1, 0], [2, 14], [3, -67], [4, 90], [14, 23]] as const) {
        const layer = layerOf(gasPlan(seed, KIT), width);
        const found = flicker(side, layer.w, layer.h, tilt, layer, undefined);
        expect(found.flickers).toBe(0);
        expect(found.changes).toBeGreaterThan(side * side);
      }
    });
  }
  it('the same map before its mend does flicker: the flicker test sees a one-pixel run', () => {
    const plan = gasPlan(1, KIT);
    const brush = gasBrush(plan, KIT, 384);
    expect(loneRuns(brush.values, 384, 128)).toBeGreaterThan(0);
    expect(flicker(129, 384, 128, 0, { ...brush, colours: plan.swatches }, undefined).flickers).toBeGreaterThan(0);
  });
});

describe('a gas giant\'s colours read as lit cloud at every hue', () => {
  const luma = (rgb: number): number => 2126 * ((rgb >> 16) & 255) + 7152 * ((rgb >> 8) & 255) + 722 * (rgb & 255);
  it('the body, jet and cap ramps run light to dark to the eye on every seed, so a storm drawn in them is lit from its top; the high cloud ramp on all but a rare chalk world', () => {
    for (const [kit, name] of [[KIT, 'test'], [parsePlanetKit(gasTablesText()), 'real']] as const) {
      const turned = [0, 0, 0, 0];
      const where: string[] = [];
      for (let seed = 0; seed < 3000; seed++) {
        const plan = gasPlan(seed, kit);
        for (let ramp = 0; ramp < 4; ramp++) {
          const steps = plan.swatches.slice(ramp * 4, ramp * 4 + 4).map(luma);
          if (steps.some((step, i) => i > 0 && step >= steps[i - 1]!)) { turned[ramp]!++; where.push(`${seed} ${plan.family}`); }
        }
      }
      console.log(`gas ramps, ${name} tables, seeds 0 to 2999: ramps not running light to dark by the eye's weights: body ${turned[0]}, high cloud ${turned[1]}, jet ${turned[2]}, cap ${turned[3]}${where.length > 0 ? ` (seed and family: ${where.join(', ')})` : ''}`);
      expect([turned[0], turned[2], turned[3]]).toEqual([0, 0, 0]);
      expect(turned[1]).toBeLessThanOrEqual(3);
    }
  });
});
