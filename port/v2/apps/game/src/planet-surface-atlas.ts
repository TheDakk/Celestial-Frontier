import { surfaceColor, type PlanetParams } from '@cf/domain-planetgen';
import { makeNoise } from '@cf/domain-rand';

export const PLANET_TURN_ATLAS_WIDTH = 768;
export const PLANET_TURN_ATLAS_HEIGHT = 384;
/** Finite-turn coverage only: this owner does not claim a periodic 360-degree map. */
export const PLANET_TURN_ATLAS_U_EXTENT = Math.PI * 0.7 + 0.35;

export interface EarthSurfaceAtlasV1 {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8ClampedArray;
  readonly sourceSeed: 133;
  readonly uExtent: number;
}

/** The current planet and card-fact sources are flat, plain data records. Reject
 * accessors, exotic prototypes and non-finite values before creating pixel storage.
 * Copy all admitted fields; never give the canonical painter a memoized source. */
function detachedRecord(input: unknown, label: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError(`planet surface atlas: invalid ${label} record`);
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`planet surface atlas: invalid ${label} prototype`);
  }
  const keys = Reflect.ownKeys(input);
  if (keys.length > 64) throw new TypeError(`planet surface atlas: oversized ${label} record`);
  const copy: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    if (typeof key !== 'string') throw new TypeError(`planet surface atlas: invalid ${label} key`);
    const property = Object.getOwnPropertyDescriptor(input, key);
    if (!property || !Object.hasOwn(property, 'value') || !property.enumerable) {
      throw new TypeError(`planet surface atlas: invalid ${label}.${key} property`);
    }
    const value: unknown = property.value;
    if (typeof value === 'number' ? !Number.isFinite(value)
      : value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'boolean') {
      throw new TypeError(`planet surface atlas: invalid ${label}.${key} value`);
    }
    copy[key] = value;
  }
  return copy;
}

/** Build canonical, unlit terrain at texel centers. Call away from answerable boot;
 * ownership, scheduling, light/cloud layers and disposal belong to the caller. */
export function createEarthSurfaceAtlasV1(
  planet: Record<string, unknown>,
  facts: Record<string, unknown> | null,
): EarthSurfaceAtlasV1 {
  const source = detachedRecord(planet, 'planet');
  if (source.seed !== 133 || source.type !== 'terran') {
    throw new TypeError('planet surface atlas: source must be Earth seed 133, type terran');
  }
  for (const key of ['landHue', 'iceAmt'] as const) {
    if (typeof source[key] !== 'number' || !Number.isFinite(source[key])) {
      throw new TypeError(`planet surface atlas: missing finite planet.${key}`);
    }
  }
  const surfaceFacts = facts === null ? undefined : detachedRecord(facts, 'facts');
  if (surfaceFacts && (
    !['temperate', 'hot', 'cold', 'frozen'].includes(String(surfaceFacts.band))
    || (surfaceFacts.lush !== undefined && typeof surfaceFacts.lush !== 'boolean')
    || (surfaceFacts.civLights !== undefined && typeof surfaceFacts.civLights !== 'number')
  )) throw new TypeError('planet surface atlas: invalid surface facts');

  const width = PLANET_TURN_ATLAS_WIDTH;
  const height = PLANET_TURN_ATLAS_HEIGHT;
  const uExtent = PLANET_TURN_ATLAS_U_EXTENT;
  const pixels = new Uint8ClampedArray(width * height * 4);
  const noise = makeNoise(133);
  for (let y = 0; y < height; y++) {
    const latitude = ((y + 0.5) / height) * 2 - 1;
    for (let x = 0; x < width; x++) {
      const u = (((x + 0.5) / width) * 2 - 1) * uExtent;
      const rgb = surfaceColor(source as PlanetParams, u, latitude, noise, surfaceFacts);
      const offset = (y * width + x) * 4;
      pixels[offset] = rgb[0];
      pixels[offset + 1] = rgb[1];
      pixels[offset + 2] = rgb[2];
      pixels[offset + 3] = 255;
    }
  }
  return { width, height, pixels, sourceSeed: 133, uExtent };
}
