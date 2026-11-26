import { globeFrame, globeTable, type GlobeLayer } from '../src/index';

/** Over a full turn and two steps more, the night fixed: how many times a pixel shows one colour, then another, then
 *  the first again on three steps running; and how many times a pixel changed at all. */
export function flicker(width: number, mapW: number, mapH: number, tilt: number, surface: GlobeLayer, clouds: GlobeLayer | undefined, lag = 0, back = false): { flickers: number; changes: number } {
  const table = globeTable(width, mapW, mapH, tilt);
  const inks = (rgb: number): number => rgb + 1000;
  const light = { ux: -3, uy: -2 };
  // With no lag the clouds ride with the surface; with one they fall a column behind it every `lag` steps. A globe
  // turning backwards counts its steps down.
  const frameAt = (step: number): Uint32Array => globeFrame(surface, clouds, table, back ? 1000 - step : step, lag, light, inks).pixels;
  let [before, here] = [frameAt(0), frameAt(1)];
  let [flickers, changes] = [0, 0];
  for (let step = 2; step < mapW + 2; step++) {
    const after = frameAt(step);
    for (let i = 0; i < after.length; i++) {
      if (after[i] !== here[i]) changes++;
      if (after[i] === before[i] && here[i] !== before[i]) flickers++;
    }
    [before, here] = [here, after];
  }
  return { flickers, changes };
}
