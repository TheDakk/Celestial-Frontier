/* Environment-neutral one-job protocol for the lazy biome-vista worker. */
import type {
  AbyssBiomeVistaOptionsV1,
  BiomeVistaSceneV1,
  GasBiomeVistaOptionsV1,
  GenericBiomeVistaOptionsV1,
  ReefBiomeVistaOptionsV1,
} from '@cf/art/biome-vista';
import {
  BIOME_VISUAL_KEYS_V1,
  type BiomeVisualKeyV1,
} from '@cf/art/biome-visual-profile';
import {
  BIOME_PROFILE_AUTHORITY_V1,
  type BiomeProfileDigestV1,
} from '@cf/domain-biome-profile';

export const BIOME_VISTA_WORKER_REQUEST_SCHEMA = 'cf-v2-biome-vista-worker-request/v1' as const;
export const BIOME_VISTA_WORKER_RESPONSE_SCHEMA = 'cf-v2-biome-vista-worker-response/v1' as const;

export type BiomeVistaRenderRequestV1 = Readonly<{
  worldKey: string;
  environmentFingerprint: string;
  profileSchema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
  profileDigest: BiomeProfileDigestV1;
  biomeKey: BiomeVisualKeyV1;
}> & (
  | { readonly scene: 'generic'; readonly options: GenericBiomeVistaOptionsV1 }
  | { readonly scene: 'gas'; readonly options: GasBiomeVistaOptionsV1 }
  | { readonly scene: 'abyss'; readonly options: AbyssBiomeVistaOptionsV1 }
  | { readonly scene: 'reef'; readonly options: ReefBiomeVistaOptionsV1 }
);

export interface BiomeVistaWorkerRenderMessageV1 {
  readonly schema: typeof BIOME_VISTA_WORKER_REQUEST_SCHEMA;
  readonly type: 'render';
  readonly documentToken: string;
  readonly generation: number;
  readonly request: BiomeVistaRenderRequestV1;
}

export interface BiomeVistaWorkerResultV1 {
  readonly schema: typeof BIOME_VISTA_WORKER_RESPONSE_SCHEMA;
  readonly type: 'result';
  readonly documentToken: string;
  readonly generation: number;
  readonly worldKey: string;
  readonly environmentFingerprint: string;
  readonly profileSchema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
  readonly profileDigest: BiomeProfileDigestV1;
  readonly biomeKey: BiomeVisualKeyV1;
  readonly scene: BiomeVistaSceneV1;
  readonly width: 960;
  readonly height: 430;
  readonly bitmap: ImageBitmap;
}

export interface BiomeVistaWorkerErrorV1 {
  readonly schema: typeof BIOME_VISTA_WORKER_RESPONSE_SCHEMA;
  readonly type: 'error';
  readonly documentToken: string;
  readonly generation: number;
  readonly worldKey: string;
  readonly environmentFingerprint: string;
  readonly profileSchema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
  readonly profileDigest: BiomeProfileDigestV1;
  readonly message: string;
}

export type BiomeVistaWorkerResponseV1 = BiomeVistaWorkerResultV1 | BiomeVistaWorkerErrorV1;

const plainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const PLAIN_OBJECT_PROTOTYPE = Object.getPrototypeOf({});

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const actual = Reflect.ownKeys(value);
  if (actual.some((key) => typeof key !== 'string')) return false;
  const names = (actual as string[]).sort();
  const expected = [...keys].sort();
  return names.length === expected.length
    && names.every((key, index) => key === expected[index])
    && names.every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return !!descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable === true;
    });
};

const boundedToken = (value: unknown, maximum: number): value is string =>
  typeof value === 'string' && value.length >= 1 && value.length <= maximum;

const generation = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 1;

const scene = (value: unknown): value is BiomeVistaSceneV1 =>
  value === 'generic' || value === 'gas' || value === 'abyss' || value === 'reef';

const biomeKey = (value: unknown): value is BiomeVisualKeyV1 =>
  typeof value === 'string' && BIOME_VISUAL_KEYS_V1.includes(value as BiomeVisualKeyV1);

const environmentFingerprint = (value: unknown): value is string =>
  typeof value === 'string' && /^cwe1:\d+:[0-9a-f]{8}$/u.test(value);

const GENERIC_OPTION_FIELDS = Object.freeze([
  'seed', 'era', 'pal', 'biome', 'wx', 'moons', 'aurora', 'nightize', 'duskize',
  'flora', 'water', 'genes', 'floraGenes', 'ring', 'stc', 'herd', 'aqua', 'air',
  'wb', 'evt', 'titan', 'salt',
] as const);
const GAS_REQUIRED_OPTION_FIELDS = Object.freeze([
  'seed', 'hue', 'spot', 'ring', 'moons', 'tod', 'aurora', 'air', 'wb',
  'airGenes', 'aerFlora', 'evt', 'titan',
] as const);
const ABYSS_OPTION_FIELDS = Object.freeze(['seed', 'aqua', 'genes'] as const);
const REEF_OPTION_FIELDS = Object.freeze(['seed', 'genes'] as const);
const GENERIC_ERAS = Object.freeze(['none', 'iron', 'town', 'space'] as const);
const GENERIC_PALETTES = Object.freeze([
  'day', 'night', 'rain', 'dust', 'sand', 'ice', 'grey', 'haze', 'ember', 'snow', 'twilight',
] as const);

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const uint32 = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 0xffff_ffff;

const nullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

interface DataBudget { nodes: number; }

function finitePlainData(
  value: unknown,
  ancestors = new Set<object>(),
  budget: DataBudget = { nodes: 0 },
  depth = 0,
): boolean {
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 4_096;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || depth > 32 || ancestors.has(value)) return false;
  budget.nodes++;
  if (budget.nodes > 32_768) return false;
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > 512) return false;
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true
          || !finitePlainData(descriptor.value, ancestors, budget, depth + 1)) return false;
      }
      return Reflect.ownKeys(value).every((key) => key === 'length'
        || (typeof key === 'string' && /^(?:0|[1-9]\d*)$/u.test(key) && Number(key) < value.length));
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== PLAIN_OBJECT_PROTOTYPE && prototype !== null) return false;
    const keys = Reflect.ownKeys(value);
    if (keys.length > 512 || keys.some((key) => typeof key !== 'string')) return false;
    for (const key of keys as string[]) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true
        || !finitePlainData(descriptor.value, ancestors, budget, depth + 1)) return false;
    }
    return true;
  } finally {
    ancestors.delete(value);
  }
}

const genomeList = (value: unknown, nullable: boolean): boolean => {
  if (nullable && value === null) return true;
  return Array.isArray(value)
    && value.every((row) => plainObject(row) && finitePlainData(row));
};

function exactGasKeys(options: Record<string, unknown>): boolean {
  const fields = Object.hasOwn(options, 'spotHue')
    ? [...GAS_REQUIRED_OPTION_FIELDS, 'spotHue']
    : GAS_REQUIRED_OPTION_FIELDS;
  return exactKeys(options, fields);
}

function validRenderOptions(
  requestScene: BiomeVistaSceneV1,
  requestBiomeKey: BiomeVisualKeyV1,
  options: Record<string, unknown>,
): boolean {
  if (!uint32(options.seed)) return false;
  if (requestScene === 'generic') {
    return exactKeys(options, GENERIC_OPTION_FIELDS)
      && GENERIC_ERAS.includes(options.era as typeof GENERIC_ERAS[number])
      && GENERIC_PALETTES.includes(options.pal as typeof GENERIC_PALETTES[number])
      && (options.biome === 'land' || options.biome === 'island')
      && nullableString(options.wx) && finite(options.moons)
      && typeof options.aurora === 'boolean'
      && typeof options.nightize === 'boolean' && typeof options.duskize === 'boolean'
      && typeof options.flora === 'boolean'
      && (options.water === 'liquid' || options.water === 'frozen' || options.water === 'none')
      && genomeList(options.genes, true) && genomeList(options.floraGenes, true)
      && typeof options.ring === 'boolean' && nullableString(options.stc)
      && finite(options.herd) && finite(options.aqua) && finite(options.air)
      && options.wb === requestBiomeKey && nullableString(options.evt)
      && typeof options.titan === 'boolean' && finite(options.salt)
      && finitePlainData(options);
  }
  if (requestScene === 'gas') {
    return exactGasKeys(options)
      && finite(options.hue) && typeof options.spot === 'boolean'
      && (!Object.hasOwn(options, 'spotHue') || finite(options.spotHue))
      && typeof options.ring === 'boolean' && finite(options.moons)
      && (options.tod === 'day' || options.tod === 'night' || options.tod === 'twilight')
      && typeof options.aurora === 'boolean' && finite(options.air)
      && options.wb === requestBiomeKey
      && genomeList(options.airGenes, true) && genomeList(options.aerFlora, true)
      && nullableString(options.evt) && typeof options.titan === 'boolean'
      && finitePlainData(options);
  }
  if (requestScene === 'abyss') {
    return exactKeys(options, ABYSS_OPTION_FIELDS)
      && finite(options.aqua) && genomeList(options.genes, false)
      && finitePlainData(options);
  }
  return exactKeys(options, REEF_OPTION_FIELDS)
    && genomeList(options.genes, false) && finitePlainData(options);
}

const bitmap = (value: unknown): value is ImageBitmap => {
  if (!plainObject(value)) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.width === 960 && candidate.height === 430
    && typeof candidate.close === 'function';
};

export function validBiomeVistaWorkerRenderMessageV1(
  value: unknown,
): value is BiomeVistaWorkerRenderMessageV1 {
  try {
    if (!plainObject(value)
      || value.schema !== BIOME_VISTA_WORKER_REQUEST_SCHEMA
      || value.type !== 'render'
      || !exactKeys(value, ['schema', 'type', 'documentToken', 'generation', 'request'])
      || !boundedToken(value.documentToken, 160)
      || !generation(value.generation)
      || !plainObject(value.request)) return false;
    const request = value.request;
    return exactKeys(request, [
      'worldKey', 'environmentFingerprint', 'profileSchema', 'profileDigest',
      'biomeKey', 'scene', 'options',
    ])
      && boundedToken(request.worldKey, 512)
      && environmentFingerprint(request.environmentFingerprint)
      && request.profileSchema === BIOME_PROFILE_AUTHORITY_V1.schema
      && request.profileDigest === BIOME_PROFILE_AUTHORITY_V1.digest
      && biomeKey(request.biomeKey)
      && scene(request.scene)
      && plainObject(request.options)
      && validRenderOptions(request.scene, request.biomeKey, request.options);
  } catch {
    return false;
  }
}

export function validBiomeVistaWorkerResponseV1(
  value: unknown,
): value is BiomeVistaWorkerResponseV1 {
  if (!plainObject(value)
    || value.schema !== BIOME_VISTA_WORKER_RESPONSE_SCHEMA
    || !boundedToken(value.documentToken, 160)
    || !generation(value.generation)
    || !boundedToken(value.worldKey, 512)
    || !environmentFingerprint(value.environmentFingerprint)
    || value.profileSchema !== BIOME_PROFILE_AUTHORITY_V1.schema
    || value.profileDigest !== BIOME_PROFILE_AUTHORITY_V1.digest) return false;
  if (value.type === 'error') {
    return exactKeys(value, [
      'schema', 'type', 'documentToken', 'generation', 'worldKey',
      'environmentFingerprint', 'profileSchema', 'profileDigest', 'message',
    ])
      && boundedToken(value.message, 512);
  }
  return value.type === 'result'
    && exactKeys(value, [
      'schema', 'type', 'documentToken', 'generation', 'worldKey',
      'environmentFingerprint', 'profileSchema', 'profileDigest',
      'biomeKey', 'scene', 'width', 'height', 'bitmap',
    ])
    && biomeKey(value.biomeKey)
    && scene(value.scene)
    && value.width === 960 && value.height === 430
    && bitmap(value.bitmap);
}
