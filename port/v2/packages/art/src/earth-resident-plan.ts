/* Pure fixed Earth recipe data and descriptor guard. This graph owns no
 * painter, canvas allocation, worker or browser import and can enter main. */
export interface EarthResidentPlacementV1 {
  readonly name: string;
  readonly kingdom: 'fauna' | 'flora';
  /** Named art-family annotation, independent of the preserved random genome
   * fields. Sources: this batch's BIOME_MAPPING.md. Never a world reroll. */
  readonly family: 'mammal' | 'amphibian' | 'tree' | 'shrub';
  readonly genome: Readonly<Record<string, unknown>>;
  readonly x: number;
  readonly groundY: number;
  /** Width of visible resident ink in normalized scene coordinates. This is
   * an explicit depth/size composition, not universal metre units. */
  readonly width: number;
  readonly flip: boolean;
}
export interface EarthResidentLayerPlanV1 {
  readonly schema: 'cf.art.earth-resident-layer.v1';
  readonly sceneId: 'painted-earth-riverbank-v1';
  readonly width: 960;
  readonly height: 430;
  readonly worldKey: string;
  readonly environmentFingerprint: string;
  readonly fullRosterFingerprint: string;
  readonly residents: readonly EarthResidentPlacementV1[];
}

/** Six complete original source genomes, with far-to-near contact anchors.
 * Captured from the full canonical Earth epoch-0 roster in
 * audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json. */
export const EARTH_RESIDENT_LAYER_PLAN_JSON_V1 = "{\"schema\":\"cf.art.earth-resident-layer.v1\",\"sceneId\":\"painted-earth-riverbank-v1\",\"width\":960,\"height\":430,\"worldKey\":\"CF1|g:999@90,-60|s:424242@560,170|p:133#2\",\"environmentFingerprint\":\"cwe1:148:50c1b7d6\",\"fullRosterFingerprint\":\"cwr1:19:6305:58e079f2\",\"residents\":[{\"name\":\"Civet\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":3212817920,\"kingdom\":\"fauna\",\"color\":14,\"form\":12,\"body\":13,\"loco\":6,\"trait\":14,\"size\":4,\"diet\":5,\"head\":5,\"limbs\":3,\"skin\":8,\"tail\":1,\"pattern\":0,\"eyes\":5,\"behavior\":9,\"habitat\":5,\"detail\":4,\"accent\":3,\"temper\":1,\"sense\":7,\"repro\":7,\"life\":5,\"metab\":4,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Civet\",\"_cradle\":1},\"x\":0.72,\"groundY\":0.77,\"width\":0.15,\"flip\":false,\"family\":\"mammal\"},{\"name\":\"Persimmon\",\"kingdom\":\"flora\",\"genome\":{\"seed\":2058951517,\"kingdom\":\"flora\",\"color\":2,\"form\":17,\"body\":4,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":2,\"head\":7,\"limbs\":1,\"skin\":7,\"tail\":1,\"pattern\":6,\"eyes\":1,\"behavior\":10,\"habitat\":5,\"detail\":9,\"accent\":2,\"temper\":4,\"sense\":3,\"repro\":5,\"life\":4,\"metab\":5,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Persimmon\",\"_cradle\":1},\"x\":0.13,\"groundY\":0.78,\"width\":0.21,\"flip\":false,\"family\":\"tree\"},{\"name\":\"Platypus\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":4049771185,\"kingdom\":\"fauna\",\"color\":13,\"form\":14,\"body\":12,\"loco\":1,\"trait\":15,\"size\":2,\"diet\":4,\"head\":0,\"limbs\":0,\"skin\":6,\"tail\":4,\"pattern\":7,\"eyes\":0,\"behavior\":3,\"habitat\":9,\"detail\":8,\"accent\":16,\"temper\":7,\"sense\":4,\"repro\":6,\"life\":3,\"metab\":0,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Platypus\",\"_cradle\":1},\"x\":0.43,\"groundY\":0.86,\"width\":0.2,\"flip\":true,\"family\":\"mammal\"},{\"name\":\"Frog\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":1193089256,\"kingdom\":\"fauna\",\"color\":0,\"form\":12,\"body\":10,\"loco\":11,\"trait\":19,\"size\":0,\"diet\":5,\"head\":9,\"limbs\":4,\"skin\":3,\"tail\":1,\"pattern\":4,\"eyes\":1,\"behavior\":0,\"habitat\":17,\"detail\":7,\"accent\":4,\"temper\":8,\"sense\":5,\"repro\":5,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Frog\",\"_cradle\":1},\"x\":0.25,\"groundY\":0.87,\"width\":0.07,\"flip\":false,\"family\":\"amphibian\"},{\"name\":\"Devil's Club\",\"kingdom\":\"flora\",\"genome\":{\"seed\":1714376717,\"kingdom\":\"flora\",\"color\":14,\"form\":12,\"body\":2,\"loco\":0,\"trait\":11,\"size\":1,\"diet\":4,\"head\":8,\"limbs\":5,\"skin\":6,\"tail\":1,\"pattern\":7,\"eyes\":2,\"behavior\":3,\"habitat\":6,\"detail\":9,\"accent\":15,\"temper\":5,\"sense\":5,\"repro\":6,\"life\":5,\"metab\":1,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Devil's Club\",\"_cradle\":1},\"x\":0.87,\"groundY\":0.88,\"width\":0.16,\"flip\":false,\"family\":\"shrub\"},{\"name\":\"Cranberry\",\"kingdom\":\"flora\",\"genome\":{\"seed\":1741924755,\"kingdom\":\"flora\",\"color\":4,\"form\":4,\"body\":9,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":1,\"head\":9,\"limbs\":3,\"skin\":0,\"tail\":5,\"pattern\":0,\"eyes\":5,\"behavior\":7,\"habitat\":0,\"detail\":4,\"accent\":10,\"temper\":7,\"sense\":9,\"repro\":2,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Cranberry\",\"_cradle\":1},\"x\":0.34,\"groundY\":0.9,\"width\":0.11,\"flip\":false,\"family\":\"shrub\"}]}";

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
export const EARTH_RESIDENT_LAYER_PLAN_V1: EarthResidentLayerPlanV1 =
  deepFreeze(JSON.parse(EARTH_RESIDENT_LAYER_PLAN_JSON_V1) as EarthResidentLayerPlanV1);

/** Nick's one painted-composition experiment, 2026-09-12. Relative height is
 * a composition choice, never a mutation of canonical genomes or vector layout. */
export const EARTH_PAINTED_COMPOSITION_V1 = deepFreeze({
  id: 'cf.art.earth-painted-contact.v1',
  residents: [
    { name: 'Civet', height: 0.30 },
    { name: 'Persimmon', height: 0.42 },
    { name: 'Platypus', height: 0.30 * 0.60 },
    { name: 'Frog', width: 0.12, x: 0.23 },
    { name: "Devil's Club", width: 0.16 },
    { name: 'Cranberry', width: 0.11 },
  ],
  foreground: { source: 'same-plate-lower-band', crop: { x: 435, y: 400, width: 64, height: 64 },
    placements: [{ name: 'Civet', centreAcrossBody: 0.74 }, { name: 'Platypus', centreAcrossBody: 0.40 }],
    width: 0.09, height: 0.045, groundOffset: 3 },
});

/** One authorized edge/runners experiment; the accepted game baseline stays V1. */
export const EARTH_PAINTED_EDGE_RUNNERS_V1 = deepFreeze({
  ...EARTH_PAINTED_COMPOSITION_V1, id: 'cf.art.earth-painted-edge-runners.v1',
  interiorErosionPixels: 8,
  residents: EARTH_PAINTED_COMPOSITION_V1.residents.map(row => row.name === 'Cranberry'
    ? { ...row, runners: [
      { x: 0.32, groundY: 0.91, width: 0.09, heightScale: 0.50, flip: false },
      { x: 0.43, groundY: 0.93, width: 0.08, heightScale: 0.50, flip: true },
    ] } : row),
});

/** Approved post-finisher weather experiment: one wider, connected berry mat. */
export const EARTH_PAINTED_WEATHER_MAT_V1 = deepFreeze({
  ...EARTH_PAINTED_COMPOSITION_V1, id: 'cf.art.earth-painted-weather-mat.v1',
  residents: EARTH_PAINTED_COMPOSITION_V1.residents.map(row => row.name === 'Cranberry'
    ? { ...row, width: 0.16, mat: [
      { x: 0.315, groundY: 0.90, width: 0.11, heightScale: 0.75, flip: false },
      { x: 0.365, groundY: 0.90, width: 0.11, heightScale: 0.75, flip: true },
    ] } : row),
});

interface SnapshotBudget { remaining: number; }
/** Snapshot descriptors before accessing values, then serialize only detached
 * null-prototype objects/arrays. Getters, toJSON hooks, sparse arrays, cycles,
 * symbols and unsupported prototypes cannot enter the admitted data graph. */
export function snapshotEarthLayerDataV1(
  value: unknown,
  budget: SnapshotBudget = { remaining: 8192 },
  depth = 0,
): unknown {
  if (--budget.remaining < 0 || depth > 12) throw new TypeError('Earth layer data budget');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string' && value.length <= 4096) return value;
  if (typeof value === 'number' && Number.isFinite(value) && !Object.is(value, -0)) return value;
  if (typeof value !== 'object' || value === null) throw new TypeError('Earth layer plain data');
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype && prototype !== null
    : prototype !== Object.prototype && prototype !== null) throw new TypeError('Earth layer prototype');
  const keys = Reflect.ownKeys(value);
  if (keys.length > 128 || keys.some(key => typeof key !== 'string')) throw new TypeError('Earth layer data keys');
  const snapshot: Record<string, unknown> | unknown[] = array ? Object.setPrototypeOf([], null) : Object.create(null);
  let length = 0;
  if (array) {
    const descriptor = Object.getOwnPropertyDescriptor(value, 'length');
    if (!descriptor || !Object.hasOwn(descriptor, 'value')
      || !Number.isSafeInteger(descriptor.value) || descriptor.value < 0 || descriptor.value > 127
      || keys.length !== descriptor.value + 1) throw new TypeError('Earth layer dense array');
    length = descriptor.value as number;
  }
  for (const key of keys as string[]) {
    if (array && key === 'length') continue;
    if (array && (!/^(?:0|[1-9]\d*)$/u.test(key) || Number(key) >= length)) throw new TypeError('Earth layer array key');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
      throw new TypeError('Earth layer descriptor');
    }
    Object.defineProperty(snapshot, key, {
      value: snapshotEarthLayerDataV1(descriptor.value, budget, depth + 1),
      enumerable: true, configurable: true, writable: true,
    });
  }
  return snapshot;
}

