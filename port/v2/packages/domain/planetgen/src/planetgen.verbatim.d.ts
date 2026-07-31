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
export function surfaceColor(P: PlanetParams, x: number, y: number, n?: unknown): unknown;
