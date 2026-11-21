/* Hand-written types for the auto-lifted PlanetGen body. The .js is verbatim
   v1.8.9 and must not be edited; THIS file is where the typing lives. */
export interface PlanetParams {
  type: string; seed: number; sizeMul?: number; ring?: boolean; moons?: number;
  hue?: number; seaHue?: number; landHue?: number; iceAmt?: number;
  spot?: boolean; spotHue?: number;
  [k: string]: unknown;   /* archetype-specific dials — typed loosely on purpose;
                             the golden corpus, not the type system, pins them */
}
export function planetParams(seed: number): PlanetParams;
export type SurfaceNoise = (x: number, y: number, octaves: number) => number;
export type SurfaceRGB = [number, number, number];
export function surfaceColor(
  P: PlanetParams,
  x: number,
  y: number,
  fbm: SurfaceNoise,
  facts?: Record<string, unknown>,
): SurfaceRGB;
