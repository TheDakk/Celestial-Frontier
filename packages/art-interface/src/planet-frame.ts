import type { GlobeTable } from './planet-globe';
import { quotient } from './planet-noise';
import { nightOf } from './planet-ramp';
import { rootOf } from './space';

/** One wrapped layer of a globe: w by h map values, row-major from the north-west. A value v of 1 or more is drawn in
 *  colours[v - 1] (0xRRGGBB, daylight); 0 is clear. The values listed in `glow` shine by their own light: the night
 *  leaves them as they are (lava, an ember giant's cloud tops). */
export interface GlobeLayer { w: number; h: number; values: Uint8Array; colours: readonly number[]; glow?: readonly number[] }
/** The way from a globe's middle to its star on the screen, right and down, in whole numbers of any length: only the
 *  direction is read. Both 0 is no star to be lit by, and no night. */
export interface GlobeLight { ux: number; uy: number }
/** A globe's picture: side by side colour numbers, row-major, 0 off the disc. */
export interface GlobeFrame { side: number; pixels: Uint32Array }

/** The sixteenths of its own colour a pixel keeps in each step of the night, the rest the night sky's: the land's, as
 *  the map's planets have them, and the cloud layer's, darker and still seen. */
export const LAND_NIGHT: readonly number[] = [10, 5, 3];
export const CLOUD_NIGHT: readonly number[] = [6, 3, 2];
export const NIGHT_SKY = 0x030610;
/** The edge of each step of the night is an arc from pole to pole that bows away from the star, as the edge of a
 *  shadow lies on a ball: it crosses the line from the star 0.28, 0.42 and 0.68 of the radius past the globe's middle.
 *  The arc that crosses at a part p is on the circle about the point (1 - p * p) / (2 * p) radii toward the star;
 *  each entry is twice that, as a whole number over a whole number. */
const ARCS: readonly (readonly [number, number])[] = [[576, 175], [2059, 1050], [336, 425]];

/**
 * The step of the night at each pixel of a globe `side` wide (odd): 0 in daylight, then 1, 2 and 3, the last the full
 * night; 0 off the disc. A pixel is in a step when it lies outside that step's circle: with `far` how far it is past
 * the middle away from the star and `rim` how far inside the disc's edge its square distance is, that is
 * far * 2 * toward * radius > rim. The way to the star is brought to a length rootOf can measure closely first; each
 * part of it is under 2^31 either side of 0.
 */
export function nightSteps(side: number, light: GlobeLight): Uint8Array {
  const steps = new Uint8Array(side * side);
  let [ux, uy] = [light.ux, light.uy];
  if (ux === 0 && uy === 0) return steps;
  // Halved by size and the sign put back, so two lights that mirror each other give nights that do.
  const halved = (part: number): number => (part < 0 ? -quotient(-part, 2) : quotient(part, 2));
  while (Math.max(Math.abs(ux), Math.abs(uy)) > 1 << 14) [ux, uy] = [halved(ux), halved(uy)];
  while (Math.max(Math.abs(ux), Math.abs(uy)) < 1 << 7) [ux, uy] = [ux * 2, uy * 2];
  const length = rootOf(ux * ux + uy * uy);
  const r = (side - 1) >> 1;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const rim = r * r + r - dx * dx - dy * dy;
      if (rim < 0) continue;
      const far = -(dx * ux + dy * uy);
      let step = 0;
      for (const [over, under] of ARCS) if (far * over * side > 2 * length * rim * under) step++;
      steps[(dy + r) * side + dx + r] = step;
    }
  }
  return steps;
}

/** The colour number of each value of a layer in daylight and in each step of the night, asked of `inks` once each. */
function inkOf(layer: GlobeLayer, shares: readonly number[], inks: (rgb: number) => number): (value: number, night: number) => number {
  const count = layer.colours.length;
  const made: (number | undefined)[] = [];
  const glows = new Set(layer.glow ?? []);
  return (value, night) => {
    const day = value > count ? undefined : layer.colours[value - 1];
    if (day === undefined) throw new Error(`a map value of ${value} has no colour: its layer has ${count}`);
    const known = made[night * (count + 1) + value];
    if (known !== undefined) return known;
    const ink = inks(night === 0 || glows.has(value) ? day : nightOf(day, shares[night - 1] ?? 0, NIGHT_SKY));
    made[night * (count + 1) + value] = ink;
    return ink;
  };
}

/**
 * A globe's picture at one moment of its turn. Each pixel of the disc is one map pixel: the one in its table's row,
 * `step` columns east of its table's column, wrapped, so a step on, every pixel reads one column on. A cloud layer,
 * when there is one, is read the same way by its own `cloudStep` and covers the surface wherever it is not clear.
 * The night is laid over both in three solid steps, the land keeping LAND_NIGHT's shares and the clouds CLOUD_NIGHT's;
 * a glowing value is left as it is. `inks` gives the colour number a 0xRRGGBB colour is drawn with: a number above
 * the sheet's own, the same for the same colour. A disc pixel clear in both layers is 0.
 */
export function globeFrame(surface: GlobeLayer, clouds: GlobeLayer | undefined, table: GlobeTable, step: number, cloudStep: number, light: GlobeLight, inks: (rgb: number) => number): GlobeFrame {
  const { side, mapW, mapH } = table;
  for (const layer of [surface, clouds]) {
    if (layer !== undefined && (layer.w !== mapW || layer.h !== mapH)) throw new Error(`a layer ${layer.w} by ${layer.h} does not fit a globe whose map is ${mapW} by ${mapH}`);
  }
  const night = nightSteps(side, light);
  const landInk = inkOf(surface, LAND_NIGHT, inks);
  const cloudInk = clouds === undefined ? undefined : inkOf(clouds, CLOUD_NIGHT, inks);
  const on = ((step % mapW) + mapW) % mapW;
  const cloudOn = ((cloudStep % mapW) + mapW) % mapW;
  const pixels = new Uint32Array(side * side);
  for (let i = 0; i < pixels.length; i++) {
    const row = table.row[i] ?? -1;
    if (row < 0) continue;
    const column = table.col[i] ?? 0;
    if (clouds !== undefined && cloudInk !== undefined) {
      const over = clouds.values[row * mapW + (column + cloudOn >= mapW ? column + cloudOn - mapW : column + cloudOn)] ?? 0;
      if (over !== 0) { pixels[i] = cloudInk(over, night[i] ?? 0); continue; }
    }
    const value = surface.values[row * mapW + (column + on >= mapW ? column + on - mapW : column + on)] ?? 0;
    if (value !== 0) pixels[i] = landInk(value, night[i] ?? 0);
  }
  return { side, pixels };
}
