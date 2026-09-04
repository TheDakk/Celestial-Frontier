import { applyCanvasVisualTreatmentV1 } from './canvas-treatment.js';
import {
  BIOME_VISUAL_KEYS_V1, BIOME_VISUAL_PROFILES_V1,
  type BiomeVisualKeyV1, type BiomeVisualProfileV1,
} from './biome-visual-profile.js';
import { IDENTITY_VISUAL_TREATMENT_GRADE_V1, VISUAL_TREATMENT_AXES_V1, type VisualTreatmentV1 } from './visual-treatment.js';
import type { ArtCanvas } from './speciescanvas.js';
import {
  renderPreservedGenericVistaV1, renderPreservedGasDeckVistaV1,
  renderPreservedAbyssVistaV1, renderPreservedReefVistaV1,
} from './biomevista-full.worker.verbatim.js';

export const BIOME_VISTA_SCENES_V1 = Object.freeze(['generic', 'gas', 'abyss', 'reef'] as const);
export type BiomeVistaSceneV1 = typeof BIOME_VISTA_SCENES_V1[number];

const REQUIRED_OPTION_FIELDS = Object.freeze({
  generic: ['seed', 'era', 'pal', 'biome', 'wx', 'moons', 'aurora', 'nightize', 'duskize', 'flora', 'water', 'genes', 'floraGenes', 'ring', 'stc', 'herd', 'aqua', 'air', 'wb', 'evt', 'titan', 'salt'],
  gas: ['seed', 'hue', 'spot', 'ring', 'moons', 'tod', 'aurora', 'air', 'wb', 'airGenes', 'aerFlora', 'evt', 'titan'],
  abyss: ['seed', 'aqua', 'genes'],
  reef: ['seed', 'genes'],
} as const);
const OPTIONAL_OPTION_FIELDS = Object.freeze({
  generic: [], gas: ['spotHue'], abyss: [], reef: [],
} as const);

const GENERIC_ERAS_V1 = Object.freeze(['none', 'iron', 'town', 'space'] as const);
const GENERIC_PALETTES_V1 = Object.freeze([
  'day', 'night', 'rain', 'dust', 'sand', 'ice', 'grey', 'haze', 'ember', 'snow', 'twilight',
] as const);
const PLAIN_OBJECT_PROTOTYPE = Object.getPrototypeOf({});

type VistaGenomeV1 = Readonly<Record<string, unknown>>;
export interface GenericBiomeVistaOptionsV1 {
  readonly seed: number; readonly era: 'none' | 'iron' | 'town' | 'space';
  readonly pal: 'day' | 'night' | 'rain' | 'dust' | 'sand' | 'ice' | 'grey' | 'haze' | 'ember' | 'snow' | 'twilight';
  readonly biome: 'land' | 'island'; readonly wx: string | null; readonly moons: number;
  readonly aurora: boolean; readonly nightize: boolean; readonly duskize: boolean; readonly flora: boolean;
  readonly water: 'liquid' | 'frozen' | 'none'; readonly genes: readonly VistaGenomeV1[] | null;
  readonly floraGenes: readonly VistaGenomeV1[] | null; readonly ring: boolean;
  readonly stc: string | null; readonly herd: number; readonly aqua: number; readonly air: number;
  readonly wb: BiomeVisualKeyV1; readonly evt: string | null; readonly titan: boolean; readonly salt: number;
}
export interface GasBiomeVistaOptionsV1 {
  readonly seed: number; readonly hue: number; readonly spot: boolean; readonly spotHue?: number;
  readonly ring: boolean; readonly moons: number; readonly tod: 'day' | 'night' | 'twilight'; readonly aurora: boolean;
  readonly air: number; readonly wb: BiomeVisualKeyV1; readonly airGenes: readonly VistaGenomeV1[] | null;
  readonly aerFlora: readonly VistaGenomeV1[] | null; readonly evt: string | null; readonly titan: boolean;
}
export interface AbyssBiomeVistaOptionsV1 { readonly seed: number; readonly aqua: number; readonly genes: readonly VistaGenomeV1[]; }
export interface ReefBiomeVistaOptionsV1 { readonly seed: number; readonly genes: readonly VistaGenomeV1[]; }

interface BiomeVistaAuthorityInputV1 {
  readonly biomeKey: BiomeVisualKeyV1;
  readonly profile: BiomeVisualProfileV1;
  readonly treatment: VisualTreatmentV1;
}
export type BiomeVistaInputV1 = BiomeVistaAuthorityInputV1 & (
  | { readonly scene: 'generic'; readonly options: GenericBiomeVistaOptionsV1 }
  | { readonly scene: 'gas'; readonly options: GasBiomeVistaOptionsV1 }
  | { readonly scene: 'abyss'; readonly options: AbyssBiomeVistaOptionsV1 }
  | { readonly scene: 'reef'; readonly options: ReefBiomeVistaOptionsV1 }
);

function finiteTree(value: unknown, path: string, ancestors = new Set<object>(), depth = 0): void {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError(`biome vista: non-finite ${path}`);
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return;
  if (typeof value !== 'object') throw new TypeError(`biome vista: invalid ${path}`);
  if (depth > 32 || ancestors.has(value)) throw new TypeError(`biome vista: invalid ${path}`);
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) {
        if (!Object.hasOwn(value, index)) throw new TypeError(`biome vista: invalid ${path}[${index}]`);
        finiteTree(value[index], `${path}[${index}]`, ancestors, depth + 1);
      }
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== PLAIN_OBJECT_PROTOTYPE && prototype !== null) throw new TypeError(`biome vista: invalid ${path}`);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError(`biome vista: invalid ${path}`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
        throw new TypeError(`biome vista: invalid ${path}.${key}`);
      }
      finiteTree(descriptor.value, `${path}.${key}`, ancestors, depth + 1);
    }
  } finally {
    ancestors.delete(value);
  }
}

function exactOptionKeys(scene: BiomeVistaSceneV1, options: Record<string, unknown>): void {
  const required = REQUIRED_OPTION_FIELDS[scene] as readonly string[];
  const optional = OPTIONAL_OPTION_FIELDS[scene] as readonly string[];
  const actual = Reflect.ownKeys(options);
  for (const key of required) {
    if (!actual.includes(key)) throw new TypeError(`biome vista: missing ${scene} option ${key}`);
  }
  for (const key of actual) {
    if (typeof key !== 'string' || (!required.includes(key) && !optional.includes(key))) {
      throw new TypeError(`biome vista: unexpected ${scene} option ${String(key)}`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(options, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
      throw new TypeError(`biome vista: invalid ${scene} option ${key}`);
    }
  }
}

function nullableString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function genomeList(value: unknown, nullable: boolean): boolean {
  if (nullable && value === null) return true;
  return Array.isArray(value) && value.every((row) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) return false;
    const prototype = Object.getPrototypeOf(row);
    return prototype === PLAIN_OBJECT_PROTOTYPE || prototype === null;
  });
}

function checkedOptionTypes(
  scene: BiomeVistaSceneV1,
  biomeKey: BiomeVisualKeyV1,
  options: Record<string, unknown>,
): void {
  const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
  const uint32 = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 0xffff_ffff;
  const bool = (value: unknown): value is boolean => typeof value === 'boolean';
  if (!uint32(options.seed)) throw new RangeError('biome vista: seed must be uint32');
  if (scene === 'generic') {
    if (!GENERIC_ERAS_V1.includes(options.era as typeof GENERIC_ERAS_V1[number])
      || !GENERIC_PALETTES_V1.includes(options.pal as typeof GENERIC_PALETTES_V1[number])
      || (options.biome !== 'land' && options.biome !== 'island')
      || !nullableString(options.wx) || !finite(options.moons)
      || !bool(options.aurora) || !bool(options.nightize) || !bool(options.duskize)
      || !bool(options.flora)
      || (options.water !== 'liquid' && options.water !== 'frozen' && options.water !== 'none')
      || !genomeList(options.genes, true) || !genomeList(options.floraGenes, true)
      || !bool(options.ring) || !nullableString(options.stc)
      || !finite(options.herd) || !finite(options.aqua) || !finite(options.air)
      || options.wb !== biomeKey || !nullableString(options.evt)
      || !bool(options.titan) || !finite(options.salt)) {
      throw new TypeError('biome vista: invalid generic options');
    }
    return;
  }
  if (scene === 'gas') {
    if (!finite(options.hue) || !bool(options.spot)
      || (Object.hasOwn(options, 'spotHue') && !finite(options.spotHue))
      || !bool(options.ring) || !finite(options.moons)
      || (options.tod !== 'day' && options.tod !== 'night' && options.tod !== 'twilight')
      || !bool(options.aurora) || !finite(options.air) || options.wb !== biomeKey
      || !genomeList(options.airGenes, true) || !genomeList(options.aerFlora, true)
      || !nullableString(options.evt) || !bool(options.titan)) {
      throw new TypeError('biome vista: invalid gas options');
    }
    return;
  }
  if (scene === 'abyss') {
    if (!finite(options.aqua) || !genomeList(options.genes, false)) {
      throw new TypeError('biome vista: invalid abyss options');
    }
    return;
  }
  if (!genomeList(options.genes, false)) throw new TypeError('biome vista: invalid reef options');
}

function checked(input: BiomeVistaInputV1): BiomeVistaInputV1 {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('biome vista: input must be an object');
  if (!BIOME_VISTA_SCENES_V1.includes(input.scene)) throw new TypeError('biome vista: unknown scene');
  if (!BIOME_VISUAL_KEYS_V1.includes(input.biomeKey)) throw new TypeError('biome vista: unknown biome');
  if (input.profile !== BIOME_VISUAL_PROFILES_V1[input.biomeKey]) throw new TypeError('biome vista: mismatched canonical profile');
  if (input.treatment?.schema !== 'cf.art.visual-treatment.v1'
    || input.treatment.identity.scope !== 'biome' || input.treatment.identity.key !== input.biomeKey
    || VISUAL_TREATMENT_AXES_V1.some((axis) => input.treatment.grade[axis] !== IDENTITY_VISUAL_TREATMENT_GRADE_V1[axis])) {
    throw new TypeError('biome vista: matching identity treatment required');
  }
  if (input.options === null || typeof input.options !== 'object' || Array.isArray(input.options)) throw new TypeError('biome vista: options must be an object');
  const prototype = Object.getPrototypeOf(input.options);
  if (prototype !== PLAIN_OBJECT_PROTOTYPE && prototype !== null) throw new TypeError('biome vista: options must be a plain object');
  const options = input.options as unknown as Record<string, unknown>;
  exactOptionKeys(input.scene, options);
  finiteTree(options, 'options');
  checkedOptionTypes(input.scene, input.biomeKey, options);
  return input;
}

/** Portable preserved compositor. Allocation occurs only after every authority,
 * treatment, option-name and finite-value check has passed. */
export function renderBiomeVistaV1(inputValue: BiomeVistaInputV1): ArtCanvas {
  const input = checked(inputValue);
  let canvas: ArtCanvas;
  if (input.scene === 'generic') canvas = renderPreservedGenericVistaV1(input.options as unknown as Record<string, unknown>, BIOME_VISUAL_PROFILES_V1);
  else if (input.scene === 'gas') canvas = renderPreservedGasDeckVistaV1(input.options as unknown as Record<string, unknown>);
  else if (input.scene === 'abyss') canvas = renderPreservedAbyssVistaV1(input.options as unknown as Record<string, unknown>);
  else canvas = renderPreservedReefVistaV1(input.options as unknown as Record<string, unknown>);
  return applyCanvasVisualTreatmentV1(canvas, input.treatment);
}
