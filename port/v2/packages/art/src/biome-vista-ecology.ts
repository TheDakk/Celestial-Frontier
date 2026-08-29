import {
  BIOME_VISUAL_KEYS_V1,
  BIOME_VISUAL_PROFILES_V1,
  type BiomeVisualKeyV1,
  type BiomeVisualProfileV1,
} from './biome-visual-profile.js';
import {
  IDENTITY_VISUAL_TREATMENT_GRADE_V1,
  VISUAL_TREATMENT_AXES_V1,
  type VisualTreatmentV1,
} from './visual-treatment.js';
import {
  applyPreservedBiomeVistaEcologyV1,
  type PreservedBiomeVistaRandomFactoryV1,
} from './biomevista.worker.verbatim.js';

export const BIOME_VISTA_ECOLOGY_PALETTES_V1 = Object.freeze([
  'day', 'night', 'rain', 'dust', 'sand', 'ice', 'grey', 'haze', 'ember', 'snow', 'twilight',
] as const);
export type BiomeVistaEcologyPaletteV1 = typeof BIOME_VISTA_ECOLOGY_PALETTES_V1[number];

export interface BiomeVistaEcologyInputV1 {
  readonly context: Record<string, unknown>;
  readonly width: number;
  readonly height: number;
  readonly horizon: number;
  readonly seed: number;
  readonly biomeKey: BiomeVisualKeyV1;
  readonly profile: BiomeVisualProfileV1;
  readonly treatment: VisualTreatmentV1;
  readonly palette: BiomeVistaEcologyPaletteV1;
  readonly nightize: boolean;
  readonly randomFactory: PreservedBiomeVistaRandomFactoryV1;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`biome vista ecology: ${label} must be finite`);
  }
  return value;
}

/** Calls only the preserved weather/hazard atmosphere overlay. The complete
 * vista still belongs to hdVista and is deliberately outside this seam. */
export function applyBiomeVistaEcologyV1(input: BiomeVistaEcologyInputV1): void {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('biome vista ecology: input must be an object');
  }
  if (input.context === null || typeof input.context !== 'object') {
    throw new TypeError('biome vista ecology: context must be an object');
  }
  const width = finite(input.width, 'width');
  const height = finite(input.height, 'height');
  const horizon = finite(input.horizon, 'horizon');
  if (width <= 0 || height <= 0 || horizon < 0 || horizon > height) {
    throw new RangeError('biome vista ecology: dimensions or horizon are out of range');
  }
  if (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 0xffff_ffff) {
    throw new RangeError('biome vista ecology: seed must be a uint32');
  }
  if (!BIOME_VISUAL_KEYS_V1.includes(input.biomeKey)) {
    throw new TypeError('biome vista ecology: unknown biome key');
  }
  if (input.profile !== BIOME_VISUAL_PROFILES_V1[input.biomeKey]) {
    throw new TypeError('biome vista ecology: profile is not the canonical biome authority entry');
  }
  if (input.treatment?.schema !== 'cf.art.visual-treatment.v1'
    || input.treatment.identity.scope !== 'biome'
    || input.treatment.identity.key !== input.biomeKey
    || VISUAL_TREATMENT_AXES_V1.some((axis) => (
      input.treatment.grade[axis] !== IDENTITY_VISUAL_TREATMENT_GRADE_V1[axis]
    ))) {
    throw new TypeError('biome vista ecology: only the matching identity treatment is supported');
  }
  if (!BIOME_VISTA_ECOLOGY_PALETTES_V1.includes(input.palette)) {
    throw new TypeError('biome vista ecology: unknown palette');
  }
  if (typeof input.nightize !== 'boolean' || typeof input.randomFactory !== 'function') {
    throw new TypeError('biome vista ecology: invalid nightize or random factory');
  }

  applyPreservedBiomeVistaEcologyV1(
    input.context,
    width,
    height,
    horizon,
    { wb: input.biomeKey, pal: input.palette, nightize: input.nightize },
    input.seed,
    { [input.biomeKey]: input.profile },
    input.randomFactory,
  );
}
