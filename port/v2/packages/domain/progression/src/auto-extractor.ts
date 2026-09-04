/* D-CURSOR — pure Auto-Extractor active-play cursors.

   Legacy mining keyed accrual by a planet seed and a device-wall timestamp.
   This replacement retains the shipped cadence/cap and the same-world
   collection boundary, but its only clock input is the persisted F4
   activePlayMs authority. Persistence/CAS and mining yields remain outside
   this module. */
import {
  RECURRING_ACCRUAL_CURSOR_SCHEMA,
  initializeRecurringAccrual,
  settleRecurringAccrual,
} from './readiness.js';

export const AUTO_EXTRACTOR_CURSOR_SCHEMA = 'cf-v2-auto-extractor-cursors/v1' as const;
export const AUTO_EXTRACTOR_CADENCE_MS = 600_000;
export const AUTO_EXTRACTOR_MAX_LOADS = 30;
/** Exact legacy `minedw` ingress cap. */
export const MAX_AUTO_EXTRACTOR_WORLDS = 60_000;
export const MAX_AUTO_EXTRACTOR_CURSOR_JSON_BYTES = 8 * 1024 * 1024;

const UINT32_MAX = 0xFFFF_FFFF;

export interface AutoExtractorWorldCursor {
  /** Exact legacy `pseed` identity. A later full-address migration belongs
   * to the owning product arc, not this compatibility closure. */
  readonly planetSeed: number;
  readonly collectedThroughActivePlayMs: number;
}

export interface AutoExtractorCursorState {
  readonly schema: typeof AUTO_EXTRACTOR_CURSOR_SCHEMA;
  /** Strictly ascending canonical planet-seed order. */
  readonly worlds: readonly AutoExtractorWorldCursor[];
}

/** The second tuple field is retained only as migration evidence. Its value
 * is deliberately never interpreted: wall time cannot authorize a grant. */
export type LegacyAutoExtractorAnchor = readonly [
  planetSeed: unknown,
  legacyWallClockAnchorMs: unknown,
];

export type AutoExtractorCursorLoad =
  | Readonly<{ kind: 'loaded'; state: AutoExtractorCursorState }>
  | Readonly<{ kind: 'migrated'; state: AutoExtractorCursorState }>;

export interface AutoExtractorSettlement {
  readonly planetSeed: number;
  readonly loads: number;
  readonly matured: number;
  readonly discarded: number;
  readonly capped: boolean;
  readonly state: AutoExtractorCursorState;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

function assertPlainRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be a plain object`);
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function checkedPlanetSeed(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > UINT32_MAX
    || Object.is(value, -0)) {
    throw new RangeError('Auto-Extractor planetSeed must be a canonical uint32');
  }
  return value as number;
}

function checkedActivePlayMs(value: unknown): number {
  if (Object.is(value, -0)) {
    throw new RangeError('Auto-Extractor active-play milliseconds must be canonical');
  }
  return initializeRecurringAccrual(value as number).collectedThroughActivePlayMs;
}

function frozenState(worlds: readonly AutoExtractorWorldCursor[]): AutoExtractorCursorState {
  return Object.freeze({
    schema: AUTO_EXTRACTOR_CURSOR_SCHEMA,
    worlds: Object.freeze(worlds.map((world) => Object.freeze({
      planetSeed: world.planetSeed,
      collectedThroughActivePlayMs: world.collectedThroughActivePlayMs,
    }))),
  });
}

function checkedState(value: unknown): AutoExtractorCursorState {
  assertPlainRecord(value, 'Auto-Extractor cursor state');
  assertExactKeys(value, ['schema', 'worlds'], 'Auto-Extractor cursor state');
  if (value.schema !== AUTO_EXTRACTOR_CURSOR_SCHEMA) {
    throw new RangeError('unsupported Auto-Extractor cursor schema');
  }
  if (!Array.isArray(value.worlds)) throw new TypeError('Auto-Extractor worlds must be an array');
  if (value.worlds.length > MAX_AUTO_EXTRACTOR_WORLDS) {
    throw new RangeError('Auto-Extractor worlds exceed the compatibility cap');
  }

  const worlds: AutoExtractorWorldCursor[] = [];
  let previousSeed = -1;
  for (let index = 0; index < value.worlds.length; index++) {
    const candidate = value.worlds[index];
    assertPlainRecord(candidate, `Auto-Extractor world ${index}`);
    assertExactKeys(
      candidate,
      ['planetSeed', 'collectedThroughActivePlayMs'],
      `Auto-Extractor world ${index}`,
    );
    const planetSeed = checkedPlanetSeed(candidate.planetSeed);
    if (planetSeed === previousSeed) throw new RangeError('duplicate Auto-Extractor planetSeed');
    if (planetSeed < previousSeed) throw new RangeError('Auto-Extractor worlds are not in canonical seed order');
    previousSeed = planetSeed;
    worlds.push({
      planetSeed,
      collectedThroughActivePlayMs: checkedActivePlayMs(candidate.collectedThroughActivePlayMs),
    });
  }
  return frozenState(worlds);
}

function assertCurrentAuthority(state: AutoExtractorCursorState, activePlayMs: number): void {
  for (const world of state.worlds) {
    if (world.collectedThroughActivePlayMs > activePlayMs) {
      throw new RangeError('Auto-Extractor cursor is ahead of the current active-play authority');
    }
  }
}

/** Migrate absent v1 cursor data from the legacy mined-world identities.
 * Every legacy wall-clock value maps to the same injected active-play
 * snapshot, so old/forward/backward device timestamps grant exactly zero. */
export function migrateLegacyAutoExtractorCursors(
  legacyAnchors: readonly LegacyAutoExtractorAnchor[] | null | undefined,
  activePlayMs: number,
): AutoExtractorCursorState {
  const current = checkedActivePlayMs(activePlayMs);
  if (legacyAnchors == null) return frozenState([]);
  if (!Array.isArray(legacyAnchors)) throw new TypeError('legacy Auto-Extractor anchors must be an array');
  if (legacyAnchors.length > MAX_AUTO_EXTRACTOR_WORLDS) {
    throw new RangeError('legacy Auto-Extractor anchors exceed the compatibility cap');
  }
  const seeds: number[] = [];
  const seen = new Set<number>();
  for (let index = 0; index < legacyAnchors.length; index++) {
    const anchor = legacyAnchors[index];
    if (!Array.isArray(anchor) || anchor.length !== 2) {
      throw new TypeError(`legacy Auto-Extractor anchor ${index} must be an exact pair`);
    }
    const planetSeed = checkedPlanetSeed(anchor[0]);
    if (seen.has(planetSeed)) throw new RangeError('duplicate legacy Auto-Extractor planetSeed');
    seen.add(planetSeed);
    seeds.push(planetSeed);
    void anchor[1];
  }
  seeds.sort((left, right) => left - right);
  return frozenState(seeds.map((planetSeed) => ({
    planetSeed,
    collectedThroughActivePlayMs: current,
  })));
}

/** Current v1 bytes always win. An absent field migrates exactly once from
 * legacy anchors; corrupt/future current bytes never fall back to old data. */
export function loadAutoExtractorCursors(
  encoded: string | null | undefined,
  legacyAnchors: readonly LegacyAutoExtractorAnchor[] | null | undefined,
  activePlayMs: number,
): AutoExtractorCursorLoad {
  const current = checkedActivePlayMs(activePlayMs);
  if (encoded == null) {
    return Object.freeze({
      kind: 'migrated',
      state: migrateLegacyAutoExtractorCursors(legacyAnchors, current),
    });
  }
  const state = decodeAutoExtractorCursors(encoded);
  assertCurrentAuthority(state, current);
  return Object.freeze({ kind: 'loaded', state });
}

/** Register a newly mined world at the current authority with no backlog. */
export function initializeAutoExtractorWorld(
  stateValue: AutoExtractorCursorState,
  planetSeedValue: number,
  activePlayMs: number,
): AutoExtractorCursorState {
  const state = checkedState(stateValue);
  const planetSeed = checkedPlanetSeed(planetSeedValue);
  const current = checkedActivePlayMs(activePlayMs);
  assertCurrentAuthority(state, current);
  if (state.worlds.some((world) => world.planetSeed === planetSeed)) return state;
  if (state.worlds.length >= MAX_AUTO_EXTRACTOR_WORLDS) {
    throw new RangeError('Auto-Extractor worlds reached the compatibility cap');
  }
  return frozenState([
    ...state.worlds,
    { planetSeed, collectedThroughActivePlayMs: current },
  ].sort((left, right) => left.planetSeed - right.planetSeed));
}

/** Exact legacy build edge: the rig did not own time before it existed.
 * Call only on the unowned -> owned transition; every already-mined world
 * is reanchored at that injected active-play snapshot with no reward. */
export function activateAutoExtractor(
  stateValue: AutoExtractorCursorState,
  activePlayMs: number,
): AutoExtractorCursorState {
  const state = checkedState(stateValue);
  const current = checkedActivePlayMs(activePlayMs);
  assertCurrentAuthority(state, current);
  return frozenState(state.worlds.map((world) => ({
    planetSeed: world.planetSeed,
    collectedThroughActivePlayMs: current,
  })));
}

/** Collect only the target world's mature loads. The recurring readiness
 * primitive consumes every completed interval even when the 30-load reward
 * cap applies, preventing a second capped claim at the same snapshot. */
export function settleAutoExtractorAtWorld(
  stateValue: AutoExtractorCursorState,
  planetSeedValue: number,
  activePlayMs: number,
): AutoExtractorSettlement {
  const state = checkedState(stateValue);
  const planetSeed = checkedPlanetSeed(planetSeedValue);
  const current = checkedActivePlayMs(activePlayMs);
  assertCurrentAuthority(state, current);
  const index = state.worlds.findIndex((world) => world.planetSeed === planetSeed);
  if (index < 0) throw new RangeError('Auto-Extractor planetSeed is not tracked');
  const prior = state.worlds[index]!;
  const settlement = settleRecurringAccrual(
    Object.freeze({
      schema: RECURRING_ACCRUAL_CURSOR_SCHEMA,
      collectedThroughActivePlayMs: prior.collectedThroughActivePlayMs,
    }),
    current,
    { cadenceMs: AUTO_EXTRACTOR_CADENCE_MS, maxBatch: AUTO_EXTRACTOR_MAX_LOADS },
  );
  const worlds = [...state.worlds];
  worlds[index] = {
    planetSeed,
    collectedThroughActivePlayMs: settlement.next.collectedThroughActivePlayMs,
  };
  return Object.freeze({
    planetSeed,
    loads: settlement.due,
    matured: settlement.matured,
    discarded: settlement.discarded,
    capped: settlement.capped,
    state: frozenState(worlds),
  });
}

export function encodeAutoExtractorCursors(state: AutoExtractorCursorState): string {
  return JSON.stringify(checkedState(state));
}

export function decodeAutoExtractorCursors(encoded: string): AutoExtractorCursorState {
  if (typeof encoded !== 'string' || encoded.length === 0
    || encoded.length > MAX_AUTO_EXTRACTOR_CURSOR_JSON_BYTES) {
    throw new RangeError('Auto-Extractor cursor JSON is empty or exceeds its compatibility bound');
  }
  let raw: unknown;
  try { raw = JSON.parse(encoded); }
  catch { throw new TypeError('Auto-Extractor cursor JSON is malformed'); }
  const state = checkedState(raw);
  if (JSON.stringify(state) !== encoded) {
    throw new RangeError('Auto-Extractor cursor JSON is not canonical');
  }
  return state;
}
