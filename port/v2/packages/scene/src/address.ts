/* Canonical CF1 hierarchy resolution.
   Public coordinates, saved views, Atlas rows, and generated-node lookalikes
   are candidates, never provenance. Production resolvers re-derive each
   level from the lifted deterministic generators and mint module-private,
   runtime-checkable Proven* values. A spread/JSON clone keeps the same fields
   but deliberately loses provenance and must be resolved again.

   Generator overrides are confined to the explicitly diagnostic seam at the
   bottom of this file. Diagnostic results are frozen data, but they are never
   entered into the private provenance registries and cannot become trusted
   parents for production navigation.
*/
import {
  FCELL,
  fineStarsInCell,
  galaxiesInCell,
  galaxyProfile,
  starsInCell,
  systemFor,
} from '@cf/domain-worldgen';
import { GCELL, UCELL } from '@cf/domain-worldconfig';

const UINT32_MAX = 0xffff_ffff;
const CF1_COORDINATE_SCALE = 100;
const CF1_COORDINATE_LIMIT = 1e7;
const PARENT_CELL_RADIUS = 1;

declare const CF1_GALAXY_KEY_BRAND: unique symbol;
declare const CF1_STAR_KEY_BRAND: unique symbol;
declare const CF1_WORLD_KEY_BRAND: unique symbol;
declare const PROVEN_GALAXY_BRAND: unique symbol;
declare const PROVEN_STAR_BRAND: unique symbol;
declare const PROVEN_PLANET_BRAND: unique symbol;

export type CF1GalaxyKey = string & { readonly [CF1_GALAXY_KEY_BRAND]: 'CF1GalaxyKey' };
export type CF1StarKey = string & { readonly [CF1_STAR_KEY_BRAND]: 'CF1StarKey' };
export type CF1WorldKey = string & { readonly [CF1_WORLD_KEY_BRAND]: 'CF1WorldKey' };
export type CF1CanonicalKey = CF1GalaxyKey | CF1StarKey | CF1WorldKey;
export type CF1StarLayer = 'coarse' | 'fine';

export interface CF1GalaxyCandidate {
  readonly seed: number;
  readonly x: number;
  readonly y: number;
}

export interface CF1StarCandidate {
  readonly seed: number;
  readonly x: number;
  readonly y: number;
}

/** A world candidate names the planet leaf; its proven star is the parent. */
export interface CF1WorldCandidate {
  readonly seed: number;
}

export interface CF1GalaxyAddressCandidate {
  readonly galaxy: CF1GalaxyCandidate;
}

export interface CF1StarAddressCandidate extends CF1GalaxyAddressCandidate {
  readonly star: CF1StarCandidate;
}

/** Existing public shape retained for the live planet-Search consumer. */
export interface CF1WorldAddressCandidate extends CF1StarAddressCandidate {
  readonly planet: CF1WorldCandidate;
}

export interface CF1CanonicalCell {
  readonly x: number;
  readonly y: number;
}

export interface CanonicalCF1GalaxyData {
  readonly seed: number;
  readonly x: number;
  readonly y: number;
  /** Source-derived renderer metadata; never copied from a candidate. */
  readonly size: number;
  readonly sp: number;
  readonly tilt: number;
  readonly rot: number;
  readonly home: boolean;
  readonly quasar: boolean;
  readonly dwarf: boolean;
  readonly parentCell: CF1CanonicalCell;
}

export interface CanonicalCF1StarData {
  readonly seed: number;
  readonly x: number;
  readonly y: number;
  readonly layer: CF1StarLayer;
  readonly parentCell: CF1CanonicalCell;
}

export interface CanonicalCF1PlanetData {
  readonly seed: number;
  /** Exact zero-based index in `systemFor(star).planets`, before any display sort. */
  readonly ordinal: number;
}

/** Nominal types plus private WeakSet membership make provenance non-forgeable
    at runtime. The brand properties are type-only and never become public
    object fields. */
export interface ProvenGalaxy extends CanonicalCF1GalaxyData {
  readonly [PROVEN_GALAXY_BRAND]: true;
}

export interface ProvenStar extends CanonicalCF1StarData {
  readonly [PROVEN_STAR_BRAND]: true;
}

export interface ProvenPlanet extends CanonicalCF1PlanetData {
  readonly [PROVEN_PLANET_BRAND]: true;
}

export interface CanonicalCF1GalaxyAddress {
  readonly format: 'CF1';
  readonly galaxy: ProvenGalaxy;
  readonly key: CF1GalaxyKey;
}

export interface CanonicalCF1StarAddress {
  readonly format: 'CF1';
  readonly galaxy: ProvenGalaxy;
  readonly star: ProvenStar;
  readonly key: CF1StarKey;
}

/** Existing world-address property layout is retained; only its values become
    readonly, deeply frozen, provenance-carrying nodes and a branded key. */
export interface CanonicalCF1WorldAddress {
  readonly format: 'CF1';
  readonly galaxy: ProvenGalaxy;
  readonly star: ProvenStar;
  readonly planet: ProvenPlanet;
  readonly key: CF1WorldKey;
}

/** Narrow structurally with `planet in address`, then `star in address`. */
export type CanonicalCF1Address =
  | CanonicalCF1GalaxyAddress
  | CanonicalCF1StarAddress
  | CanonicalCF1WorldAddress;

export type CF1AddressFailure =
  | 'malformed-address'
  | 'unproven-parent'
  | 'source-error'
  | 'galaxy-not-found'
  | 'galaxy-ambiguous'
  | 'star-not-found'
  | 'star-ambiguous'
  | 'planet-not-found'
  | 'planet-ambiguous';

/** Backward-compatible failure type name for the existing world consumer. */
export type CF1WorldAddressFailure = CF1AddressFailure;

type CF1FailureResult = { readonly ok: false; readonly reason: CF1AddressFailure };

export type ResolveCF1GalaxyResult =
  | { readonly ok: true; readonly galaxy: ProvenGalaxy }
  | CF1FailureResult;
export type ResolveCF1StarResult =
  | { readonly ok: true; readonly star: ProvenStar }
  | CF1FailureResult;
export type ResolveCF1WorldResult =
  | { readonly ok: true; readonly planet: ProvenPlanet }
  | CF1FailureResult;
export type ResolveCF1GalaxyAddressResult =
  | { readonly ok: true; readonly address: CanonicalCF1GalaxyAddress }
  | CF1FailureResult;
export type ResolveCF1StarAddressResult =
  | { readonly ok: true; readonly address: CanonicalCF1StarAddress }
  | CF1FailureResult;
export type ResolveCF1WorldAddressResult =
  | { readonly ok: true; readonly address: CanonicalCF1WorldAddress }
  | CF1FailureResult;

/** Generator seam for focused diagnostic controls only. Production resolver
    signatures do not accept this type, so an override cannot mint Proven*. */
export interface CF1WorldAddressSources {
  galaxiesInCell(cellX: number, cellY: number): readonly unknown[];
  galaxyProfile(seed: number): Record<string, unknown>;
  starsInCell(
    galaxySeed: number,
    profile: Record<string, unknown>,
    cellX: number,
    cellY: number,
  ): { stars: readonly unknown[] };
  fineStarsInCell(
    galaxySeed: number,
    profile: Record<string, unknown>,
    cellX: number,
    cellY: number,
  ): readonly unknown[];
  systemFor(starSeed: number): { planets: readonly unknown[] };
}

export type CF1WorldAddressSourceOverrides = Partial<CF1WorldAddressSources>;

/** Untrusted diagnostic output deliberately cannot satisfy Proven* types. */
export interface DiagnosticCanonicalCF1WorldAddress {
  readonly format: 'CF1';
  readonly galaxy: CanonicalCF1GalaxyData;
  readonly star: CanonicalCF1StarData;
  readonly planet: CanonicalCF1PlanetData;
  readonly key: string;
}

export type ResolveCF1WorldAddressDiagnosticResult =
  | { readonly ok: true; readonly address: DiagnosticCanonicalCF1WorldAddress }
  | CF1FailureResult;

const DEFAULT_SOURCES: CF1WorldAddressSources = {
  galaxiesInCell,
  galaxyProfile,
  starsInCell,
  fineStarsInCell: (galaxySeed, profile, cellX, cellY) =>
    fineStarsInCell(galaxySeed, profile, cellX, cellY) as readonly unknown[],
  systemFor,
};

interface PublicPoint {
  seed: number;
  x: number;
  y: number;
}

interface ParsedStarAddressCandidate {
  galaxy: PublicPoint;
  star: PublicPoint;
}

interface ParsedWorldAddressCandidate extends ParsedStarAddressCandidate {
  planetSeed: number;
}

interface CanonicalGalaxyPresentation {
  size: number;
  sp: number;
  tilt: number;
  rot: number;
  home: boolean;
  quasar: boolean;
  dwarf: boolean;
}

interface ResolvedGalaxy extends PublicPoint, CanonicalGalaxyPresentation {
  parentCell: CF1CanonicalCell;
}

interface ResolvedStar extends PublicPoint {
  layer: CF1StarLayer;
  parentCell: CF1CanonicalCell;
}

interface ResolvedPlanet {
  seed: number;
  ordinal: number;
}

const PROVEN_GALAXIES = new WeakSet<object>();
const PROVEN_STARS = new WeakSet<object>();
const PROVEN_PLANETS = new WeakSet<object>();
const CANONICAL_ADDRESSES = new WeakSet<object>();
const GALAXY_KEYS = new WeakMap<object, CF1GalaxyKey>();
const STAR_KEYS = new WeakMap<object, CF1StarKey>();
const PLANET_KEYS = new WeakMap<object, CF1WorldKey>();
const STAR_PARENT_KEYS = new WeakMap<object, CF1GalaxyKey>();
const PLANET_PARENT_KEYS = new WeakMap<object, CF1StarKey>();
const ADDRESS_KEYS = new WeakMap<object, CF1CanonicalKey>();

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value);
}

export function isProvenGalaxy(value: unknown): value is ProvenGalaxy {
  return isObject(value) && PROVEN_GALAXIES.has(value);
}

export function isProvenStar(value: unknown): value is ProvenStar {
  return isObject(value) && PROVEN_STARS.has(value);
}

export function isProvenPlanet(value: unknown): value is ProvenPlanet {
  return isObject(value) && PROVEN_PLANETS.has(value);
}

export function getProvenGalaxyKey(value: unknown): CF1GalaxyKey | null {
  return isObject(value) ? GALAXY_KEYS.get(value) ?? null : null;
}

export function getProvenStarKey(value: unknown): CF1StarKey | null {
  return isObject(value) ? STAR_KEYS.get(value) ?? null : null;
}

export function getProvenPlanetKey(value: unknown): CF1WorldKey | null {
  return isObject(value) ? PLANET_KEYS.get(value) ?? null : null;
}

export function getCanonicalCF1AddressKey(value: unknown): CF1CanonicalKey | null {
  return isObject(value) ? ADDRESS_KEYS.get(value) ?? null : null;
}

/** Parent equality is canonical-key equality, not object identity: a fresh,
    independent proof of the same parent is valid, while a structural clone
    has no private key and is rejected. */
export function isProvenStarFor(star: unknown, galaxy: unknown): star is ProvenStar {
  if (!isProvenStar(star) || !isProvenGalaxy(galaxy)) return false;
  const parent = STAR_PARENT_KEYS.get(star);
  const galaxyKey = getProvenGalaxyKey(galaxy);
  return parent !== undefined && galaxyKey !== null && parent === galaxyKey;
}

export function isProvenPlanetFor(planet: unknown, star: unknown): planet is ProvenPlanet {
  if (!isProvenPlanet(planet) || !isProvenStar(star)) return false;
  const parent = PLANET_PARENT_KEYS.get(planet);
  const starKeyValue = getProvenStarKey(star);
  return parent !== undefined && starKeyValue !== null && parent === starKeyValue;
}

function hasCanonicalAddressComposition(value: unknown): value is CanonicalCF1Address {
  if (!isRecord(value) || value.format !== 'CF1' || !isProvenGalaxy(value.galaxy)) return false;
  const ownKey = value.key;
  if ('planet' in value) {
    return 'star' in value
      && isProvenStarFor(value.star, value.galaxy)
      && isProvenPlanetFor(value.planet, value.star)
      && ownKey === getProvenPlanetKey(value.planet);
  }
  if ('star' in value) {
    return isProvenStarFor(value.star, value.galaxy)
      && ownKey === getProvenStarKey(value.star);
  }
  return ownKey === getProvenGalaxyKey(value.galaxy);
}

export function isCanonicalCF1Address(value: unknown): value is CanonicalCF1Address {
  return isObject(value)
    && CANONICAL_ADDRESSES.has(value)
    && hasCanonicalAddressComposition(value)
    && ADDRESS_KEYS.get(value) === (value as CanonicalCF1Address).key;
}

/** Exact means no coercion, wrapping, truncation, or legacy defaulting. */
export function isExactUint32(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 0
    && value <= UINT32_MAX;
}

/** Mirrors legacy CF1 `_r2` before serializing public coordinates.
    `-0` is canonicalized to `0` so a key cannot split one location. */
export function normalizeCF1Coordinate(value: unknown): number | null {
  if (typeof value !== 'number'
    || !Number.isFinite(value)
    || Math.abs(value) > CF1_COORDINATE_LIMIT) return null;
  const rounded = Math.round(value * CF1_COORDINATE_SCALE) / CF1_COORDINATE_SCALE;
  if (!Number.isFinite(rounded)) return null;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function readPoint(value: unknown): PublicPoint | null {
  if (!isRecord(value)) return null;
  const x = normalizeCF1Coordinate(value.x);
  const y = normalizeCF1Coordinate(value.y);
  if (!isExactUint32(value.seed) || x === null || y === null) return null;
  return { seed: value.seed, x, y };
}

function readWorld(value: unknown): CF1WorldCandidate | null {
  if (!isRecord(value) || !isExactUint32(value.seed)) return null;
  return { seed: value.seed };
}

/** Presentation fields are read from the generator, never the candidate. */
function readGeneratedGalaxy(value: unknown): (PublicPoint & CanonicalGalaxyPresentation) | null {
  if (!isRecord(value)) return null;
  const point = readPoint(value);
  if (!point) return null;
  if (typeof value.size !== 'number' || !Number.isFinite(value.size) || value.size <= 0 || value.size > 4000) return null;
  if (typeof value.sp !== 'number' || !Number.isInteger(value.sp) || value.sp < 0 || value.sp > 300000) return null;
  if (typeof value.tilt !== 'number' || !Number.isFinite(value.tilt) || value.tilt < -7 || value.tilt > 7) return null;
  if (typeof value.rot !== 'number' || !Number.isFinite(value.rot) || value.rot < -7 || value.rot > 7) return null;
  const flags = ['home', 'quasar', 'dwarf'] as const;
  for (const flag of flags) if (value[flag] !== undefined && typeof value[flag] !== 'boolean') return null;
  return {
    ...point,
    size: value.size,
    sp: value.sp,
    tilt: value.tilt,
    rot: value.rot,
    home: value.home === true,
    quasar: value.quasar === true,
    dwarf: value.dwarf === true,
  };
}

function readGalaxyAddressCandidate(value: unknown): PublicPoint | null {
  return isRecord(value) ? readPoint(value.galaxy) : null;
}

function readStarAddressCandidate(value: unknown): ParsedStarAddressCandidate | null {
  if (!isRecord(value)) return null;
  const galaxy = readPoint(value.galaxy);
  const star = readPoint(value.star);
  return galaxy && star ? { galaxy, star } : null;
}

function readWorldAddressCandidate(value: unknown): ParsedWorldAddressCandidate | null {
  const parents = readStarAddressCandidate(value);
  if (!parents || !isRecord(value) || !isRecord(value.planet) || !isExactUint32(value.planet.seed)) return null;
  return { ...parents, planetSeed: value.planet.seed };
}

function samePoint(left: PublicPoint, right: PublicPoint): boolean {
  return left.seed === right.seed && left.x === right.x && left.y === right.y;
}

/** Rounded coordinates can cross a source-cell edge; probe immediate
    neighbors and demand one provenance match rather than trusting floor(). */
function nearbyCells(x: number, y: number, cellSize: number): CF1CanonicalCell[] {
  const centerX = Math.floor(x / cellSize);
  const centerY = Math.floor(y / cellSize);
  const seen = new Set<string>();
  const cells: CF1CanonicalCell[] = [];
  for (let dx = -PARENT_CELL_RADIUS; dx <= PARENT_CELL_RADIUS; dx++) {
    for (let dy = -PARENT_CELL_RADIUS; dy <= PARENT_CELL_RADIUS; dy++) {
      const cellX = centerX + dx;
      const cellY = centerY + dy;
      const key = cellX + ',' + cellY;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({ x: cellX, y: cellY });
    }
  }
  return cells;
}

function failure(reason: CF1AddressFailure): CF1FailureResult {
  return Object.freeze({ ok: false, reason });
}

function sourcesFrom(overrides: CF1WorldAddressSourceOverrides): CF1WorldAddressSources {
  return {
    galaxiesInCell: overrides.galaxiesInCell ?? DEFAULT_SOURCES.galaxiesInCell,
    galaxyProfile: overrides.galaxyProfile ?? DEFAULT_SOURCES.galaxyProfile,
    starsInCell: overrides.starsInCell ?? DEFAULT_SOURCES.starsInCell,
    fineStarsInCell: overrides.fineStarsInCell ?? DEFAULT_SOURCES.fineStarsInCell,
    systemFor: overrides.systemFor ?? DEFAULT_SOURCES.systemFor,
  };
}

function resolveGalaxyRaw(
  wanted: PublicPoint,
  sources: CF1WorldAddressSources,
): { ok: true; value: ResolvedGalaxy } | CF1FailureResult {
  const matches: ResolvedGalaxy[] = [];
  for (const parentCell of nearbyCells(wanted.x, wanted.y, UCELL)) {
    let generated: readonly unknown[];
    try {
      generated = sources.galaxiesInCell(parentCell.x, parentCell.y);
    } catch {
      return failure('source-error');
    }
    if (!Array.isArray(generated)) return failure('source-error');
    for (const generatedGalaxy of generated) {
      const source = readGeneratedGalaxy(generatedGalaxy);
      if (!source) return failure('source-error');
      if (!samePoint(source, wanted)) continue;
      matches.push({ ...source, parentCell });
    }
  }
  if (matches.length === 0) return failure('galaxy-not-found');
  if (matches.length !== 1) return failure('galaxy-ambiguous');
  return { ok: true, value: matches[0]! };
}

function resolveStarRaw(
  wanted: PublicPoint,
  galaxy: ResolvedGalaxy,
  sources: CF1WorldAddressSources,
): { ok: true; value: ResolvedStar } | CF1FailureResult {
  let profile: Record<string, unknown>;
  try {
    profile = sources.galaxyProfile(galaxy.seed);
  } catch {
    return failure('source-error');
  }
  if (!isRecord(profile)) return failure('source-error');

  const matches: ResolvedStar[] = [];
  const layers: ReadonlyArray<{ layer: CF1StarLayer; cellSize: number }> = [
    { layer: 'coarse', cellSize: GCELL },
    { layer: 'fine', cellSize: FCELL },
  ];
  for (const { layer, cellSize } of layers) {
    for (const parentCell of nearbyCells(wanted.x, wanted.y, cellSize)) {
      let generated: readonly unknown[];
      try {
        if (layer === 'coarse') {
          const cell = sources.starsInCell(galaxy.seed, profile, parentCell.x, parentCell.y);
          if (!isRecord(cell) || !Array.isArray(cell.stars)) return failure('source-error');
          generated = cell.stars;
        } else {
          generated = sources.fineStarsInCell(galaxy.seed, profile, parentCell.x, parentCell.y);
          if (!Array.isArray(generated)) return failure('source-error');
        }
      } catch {
        return failure('source-error');
      }
      for (const generatedStar of generated) {
        const source = readPoint(generatedStar);
        if (!source) return failure('source-error');
        if (samePoint(source, wanted)) matches.push({ ...source, layer, parentCell });
      }
    }
  }
  if (matches.length === 0) return failure('star-not-found');
  if (matches.length !== 1) return failure('star-ambiguous');
  return { ok: true, value: matches[0]! };
}

function resolvePlanetRaw(
  wantedSeed: number,
  star: ResolvedStar,
  sources: CF1WorldAddressSources,
): { ok: true; value: ResolvedPlanet } | CF1FailureResult {
  let system: { planets: readonly unknown[] };
  try {
    system = sources.systemFor(star.seed);
  } catch {
    return failure('source-error');
  }
  if (!isRecord(system) || !Array.isArray(system.planets)) return failure('source-error');

  const matches: ResolvedPlanet[] = [];
  /* Ordinal belongs to source order. Presentation may later sort by orbit. */
  for (let ordinal = 0; ordinal < system.planets.length; ordinal++) {
    const entry = system.planets[ordinal];
    if (!isRecord(entry) || !isRecord(entry.P) || !isExactUint32(entry.P.seed)) {
      return failure('source-error');
    }
    if (entry.P.seed === wantedSeed) matches.push({ seed: entry.P.seed, ordinal });
  }
  if (matches.length === 0) return failure('planet-not-found');
  if (matches.length !== 1) return failure('planet-ambiguous');
  return { ok: true, value: matches[0]! };
}

function keyNumber(value: number): string {
  return value === 0 ? '0' : String(value);
}

function galaxyKey(galaxy: ResolvedGalaxy): CF1GalaxyKey {
  return ('CF1|g:' + galaxy.seed + '@' + keyNumber(galaxy.x) + ',' + keyNumber(galaxy.y)) as CF1GalaxyKey;
}

function starKey(parent: CF1GalaxyKey, star: ResolvedStar): CF1StarKey {
  return (parent + '|s:' + star.seed + '@' + keyNumber(star.x) + ',' + keyNumber(star.y)) as CF1StarKey;
}

function worldKey(parent: CF1StarKey, planet: ResolvedPlanet): CF1WorldKey {
  return (parent + '|p:' + planet.seed + '#' + planet.ordinal) as CF1WorldKey;
}

function freezeCell(cell: CF1CanonicalCell): CF1CanonicalCell {
  return Object.freeze({ x: cell.x, y: cell.y });
}

function freezeGalaxyData(galaxy: ResolvedGalaxy): CanonicalCF1GalaxyData {
  return Object.freeze({
    seed: galaxy.seed,
    x: galaxy.x,
    y: galaxy.y,
    size: galaxy.size,
    sp: galaxy.sp,
    tilt: galaxy.tilt,
    rot: galaxy.rot,
    home: galaxy.home,
    quasar: galaxy.quasar,
    dwarf: galaxy.dwarf,
    parentCell: freezeCell(galaxy.parentCell),
  });
}

function freezeStarData(star: ResolvedStar): CanonicalCF1StarData {
  return Object.freeze({
    seed: star.seed,
    x: star.x,
    y: star.y,
    layer: star.layer,
    parentCell: freezeCell(star.parentCell),
  });
}

function freezePlanetData(planet: ResolvedPlanet): CanonicalCF1PlanetData {
  return Object.freeze({ seed: planet.seed, ordinal: planet.ordinal });
}

function mintGalaxy(galaxy: ResolvedGalaxy): ProvenGalaxy {
  const proven = freezeGalaxyData(galaxy) as unknown as ProvenGalaxy;
  PROVEN_GALAXIES.add(proven);
  GALAXY_KEYS.set(proven, galaxyKey(galaxy));
  return proven;
}

function mintStar(galaxy: ProvenGalaxy, star: ResolvedStar): ProvenStar {
  const parent = getProvenGalaxyKey(galaxy);
  if (!parent) throw new Error('internal CF1 provenance error: missing galaxy key');
  const proven = freezeStarData(star) as unknown as ProvenStar;
  PROVEN_STARS.add(proven);
  STAR_KEYS.set(proven, starKey(parent, star));
  STAR_PARENT_KEYS.set(proven, parent);
  return proven;
}

function mintPlanet(star: ProvenStar, planet: ResolvedPlanet): ProvenPlanet {
  const parent = getProvenStarKey(star);
  if (!parent) throw new Error('internal CF1 provenance error: missing star key');
  const proven = freezePlanetData(planet) as unknown as ProvenPlanet;
  PROVEN_PLANETS.add(proven);
  PLANET_KEYS.set(proven, worldKey(parent, planet));
  PLANET_PARENT_KEYS.set(proven, parent);
  return proven;
}

function registerAddress<T extends CanonicalCF1Address>(address: T): T {
  const frozen = Object.freeze(address);
  if (!hasCanonicalAddressComposition(frozen)) {
    throw new Error('internal CF1 provenance error: invalid address composition');
  }
  CANONICAL_ADDRESSES.add(frozen);
  ADDRESS_KEYS.set(frozen, frozen.key);
  return frozen;
}

function galaxyAddress(galaxy: ProvenGalaxy): CanonicalCF1GalaxyAddress {
  const key = getProvenGalaxyKey(galaxy);
  if (!key) throw new Error('internal CF1 provenance error: missing galaxy key');
  return registerAddress({ format: 'CF1', galaxy, key });
}

function starAddress(galaxy: ProvenGalaxy, star: ProvenStar): CanonicalCF1StarAddress {
  const key = getProvenStarKey(star);
  if (!key) throw new Error('internal CF1 provenance error: missing star key');
  return registerAddress({ format: 'CF1', galaxy, star, key });
}

function worldAddress(
  galaxy: ProvenGalaxy,
  star: ProvenStar,
  planet: ProvenPlanet,
): CanonicalCF1WorldAddress {
  const key = getProvenPlanetKey(planet);
  if (!key) throw new Error('internal CF1 provenance error: missing planet key');
  return registerAddress({ format: 'CF1', galaxy, star, planet, key });
}

/** Resolve one public galaxy candidate against production generators. */
export function resolveCF1Galaxy(candidate: unknown): ResolveCF1GalaxyResult {
  const wanted = readPoint(candidate);
  if (!wanted) return failure('malformed-address');
  const resolved = resolveGalaxyRaw(wanted, DEFAULT_SOURCES);
  return resolved.ok ? { ok: true, galaxy: mintGalaxy(resolved.value) } : resolved;
}

/** Resolve a star only beneath a runtime-proven galaxy. */
export function resolveCF1Star(galaxy: unknown, candidate: unknown): ResolveCF1StarResult {
  if (!isProvenGalaxy(galaxy)) return failure('unproven-parent');
  const wanted = readPoint(candidate);
  if (!wanted) return failure('malformed-address');
  const resolved = resolveStarRaw(wanted, galaxy, DEFAULT_SOURCES);
  return resolved.ok ? { ok: true, star: mintStar(galaxy, resolved.value) } : resolved;
}

/** Resolve a planet/world only beneath a runtime-proven star. */
export function resolveCF1World(star: unknown, candidate: unknown): ResolveCF1WorldResult {
  if (!isProvenStar(star)) return failure('unproven-parent');
  const wanted = readWorld(candidate);
  if (!wanted) return failure('malformed-address');
  const resolved = resolvePlanetRaw(wanted.seed, star, DEFAULT_SOURCES);
  return resolved.ok ? { ok: true, planet: mintPlanet(star, resolved.value) } : resolved;
}

/** Resolve a raw galaxy address and return a production-trusted address. */
export function resolveCF1GalaxyAddress(candidate: unknown): ResolveCF1GalaxyAddressResult {
  const wanted = readGalaxyAddressCandidate(candidate);
  if (!wanted) return failure('malformed-address');
  const galaxy = resolveCF1Galaxy(wanted);
  return galaxy.ok ? { ok: true, address: galaxyAddress(galaxy.galaxy) } : galaxy;
}

/** Resolve a raw galaxy -> star hierarchy and return a trusted address. */
export function resolveCF1StarAddress(candidate: unknown): ResolveCF1StarAddressResult {
  const wanted = readStarAddressCandidate(candidate);
  if (!wanted) return failure('malformed-address');
  const galaxy = resolveCF1Galaxy(wanted.galaxy);
  if (!galaxy.ok) return galaxy;
  const star = resolveCF1Star(galaxy.galaxy, wanted.star);
  return star.ok ? { ok: true, address: starAddress(galaxy.galaxy, star.star) } : star;
}

/** Resolve a raw galaxy -> star -> planet hierarchy. The successful property
    layout is compatible with the existing planet-Search consumer. */
export function resolveCF1WorldAddress(candidate: unknown): ResolveCF1WorldAddressResult {
  const wanted = readWorldAddressCandidate(candidate);
  if (!wanted) return failure('malformed-address');
  const galaxy = resolveCF1Galaxy(wanted.galaxy);
  if (!galaxy.ok) return galaxy;
  const star = resolveCF1Star(galaxy.galaxy, wanted.star);
  if (!star.ok) return star;
  const planet = resolveCF1World(star.star, { seed: wanted.planetSeed });
  return planet.ok
    ? { ok: true, address: worldAddress(galaxy.galaxy, star.star, planet.planet) }
    : planet;
}

/** Test/audit-only source injection. Even a successful result is deliberately
    unbranded and rejected by every production provenance guard. */
export function resolveCF1WorldAddressForDiagnostics(
  candidate: unknown,
  overrides: CF1WorldAddressSourceOverrides,
): ResolveCF1WorldAddressDiagnosticResult {
  const wanted = readWorldAddressCandidate(candidate);
  if (!wanted) return failure('malformed-address');
  const sources = sourcesFrom(overrides);
  const galaxy = resolveGalaxyRaw(wanted.galaxy, sources);
  if (!galaxy.ok) return galaxy;
  const star = resolveStarRaw(wanted.star, galaxy.value, sources);
  if (!star.ok) return star;
  const planet = resolvePlanetRaw(wanted.planetSeed, star.value, sources);
  if (!planet.ok) return planet;

  const galaxyData = freezeGalaxyData(galaxy.value);
  const starData = freezeStarData(star.value);
  const planetData = freezePlanetData(planet.value);
  const gKey = galaxyKey(galaxy.value);
  const sKey = starKey(gKey, star.value);
  return {
    ok: true,
    address: Object.freeze({
      format: 'CF1',
      galaxy: galaxyData,
      star: starData,
      planet: planetData,
      key: worldKey(sKey, planet.value) as string,
    }),
  };
}
