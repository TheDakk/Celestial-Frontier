/* Canonical CF1 world-address resolution.
   A CF1 share payload is public, rounded address data; it is not evidence
   that its claimed galaxy, star, or planet actually exists together. This
   pure seam re-derives the whole hierarchy from the ported deterministic
   generators before any future world-bound writer can own a receipt.

   The strict raw ingress wired today is external CF1 *planet-share* Search.
   Persisted saved views and Atlas rows (which can be repaired/coerced before
   later navigation), galaxy/star-only routes, generated descents, and all
   ownership/receipt writers remain separate boundaries. Callers must use the
   successful source-derived address, never the input.
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
const PARENT_CELL_RADIUS = 1;

export type CF1StarLayer = 'coarse' | 'fine';

/** The only public fields a future CF1 ingress may hand to the resolver.
    Unlike legacy `Where`, these semantic names make every required identity
    explicit; presentation fields such as galaxy size/tilt are re-derived. */
export interface CF1WorldAddressCandidate {
  galaxy: { seed: number; x: number; y: number };
  star: { seed: number; x: number; y: number };
  planet: { seed: number };
}

export interface CF1CanonicalCell {
  x: number;
  y: number;
}

/**
 * The resolved address contains only generator-proven values. `ordinal` is
 * zero-based because it is the exact index in `systemFor(star).planets`.
 */
export interface CanonicalCF1WorldAddress {
  format: 'CF1';
  galaxy: {
    seed: number;
    x: number;
    y: number;
    /** Source-derived renderer metadata; never copied from the CF1 payload. */
    size: number;
    sp: number;
    tilt: number;
    rot: number;
    home: boolean;
    quasar: boolean;
    dwarf: boolean;
    parentCell: CF1CanonicalCell;
  };
  star: {
    seed: number;
    x: number;
    y: number;
    layer: CF1StarLayer;
    parentCell: CF1CanonicalCell;
  };
  planet: {
    seed: number;
    ordinal: number;
  };
  /** Stable CF1-local identity, safe only after this resolver returned it. */
  key: string;
}

export type CF1WorldAddressFailure =
  | 'malformed-address'
  | 'source-error'
  | 'galaxy-not-found'
  | 'galaxy-ambiguous'
  | 'star-not-found'
  | 'star-ambiguous'
  | 'planet-not-found'
  | 'planet-ambiguous';

export type ResolveCF1WorldAddressResult =
  | { ok: true; address: CanonicalCF1WorldAddress }
  | { ok: false; reason: CF1WorldAddressFailure };

/**
 * Injectable generator seam for focused controls. Production callers leave
 * this unset and receive the exact lifted CF1 generators. A test double must
 * still supply source data that passes the same hierarchy proof.
 */
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

interface ParsedCandidate {
  galaxy: PublicPoint;
  star: PublicPoint;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Exact means no coercion, wrapping, truncation, or legacy defaulting. */
export function isExactUint32(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 0
    && value <= UINT32_MAX;
}

/** Mirrors legacy CF1 `_r2` before serializing public coordinates.
    `-0` is canonicalized to `0` so the stable key cannot split one location. */
export function normalizeCF1Coordinate(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
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

/** The share format's presentation tuple is untrusted. These fields are
    instead read from the generated galaxy because navigation carries its
    size through the ascent camera and re-share path. */
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

function readCandidate(value: unknown): ParsedCandidate | null {
  if (!isRecord(value)) return null;
  const galaxy = readPoint(value.galaxy);
  const star = readPoint(value.star);
  if (!isRecord(value.planet) || !isExactUint32(value.planet.seed) || !galaxy || !star) return null;
  return { galaxy, star, planetSeed: value.planet.seed };
}

function samePoint(left: PublicPoint, right: PublicPoint): boolean {
  return left.seed === right.seed && left.x === right.x && left.y === right.y;
}

/**
 * A rounded public coordinate can sit on a generator-cell edge. Probe the
 * immediate neighborhood and demand exactly one provenance match rather than
 * trusting `floor(rounded / cellSize)` as a parent assertion. The CF1 galaxy
 * generator's merger/satellite offsets are also strictly below one UCELL.
 */
function nearbyCells(x: number, y: number, cellSize: number): CF1CanonicalCell[] {
  const centerX = Math.floor(x / cellSize);
  const centerY = Math.floor(y / cellSize);
  const seen = new Set<string>();
  const cells: CF1CanonicalCell[] = [];
  for (let dx = -PARENT_CELL_RADIUS; dx <= PARENT_CELL_RADIUS; dx++) {
    for (let dy = -PARENT_CELL_RADIUS; dy <= PARENT_CELL_RADIUS; dy++) {
      const cellX = centerX + dx;
      const cellY = centerY + dy;
      if (!Number.isFinite(cellX) || !Number.isFinite(cellY)) continue;
      const key = cellX + ',' + cellY;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({ x: cellX, y: cellY });
    }
  }
  return cells;
}

function failure(reason: CF1WorldAddressFailure): ResolveCF1WorldAddressResult {
  return { ok: false, reason };
}

function sourcesFrom(overrides?: CF1WorldAddressSourceOverrides): CF1WorldAddressSources {
  return {
    galaxiesInCell: overrides?.galaxiesInCell ?? DEFAULT_SOURCES.galaxiesInCell,
    galaxyProfile: overrides?.galaxyProfile ?? DEFAULT_SOURCES.galaxyProfile,
    starsInCell: overrides?.starsInCell ?? DEFAULT_SOURCES.starsInCell,
    fineStarsInCell: overrides?.fineStarsInCell ?? DEFAULT_SOURCES.fineStarsInCell,
    systemFor: overrides?.systemFor ?? DEFAULT_SOURCES.systemFor,
  };
}

function resolveGalaxy(
  wanted: PublicPoint,
  sources: CF1WorldAddressSources,
): { ok: true; value: ResolvedGalaxy } | { ok: false; reason: CF1WorldAddressFailure } {
  const matches: ResolvedGalaxy[] = [];
  for (const parentCell of nearbyCells(wanted.x, wanted.y, UCELL)) {
    let generated: readonly unknown[];
    try {
      generated = sources.galaxiesInCell(parentCell.x, parentCell.y);
    } catch {
      return { ok: false, reason: 'source-error' };
    }
    if (!Array.isArray(generated)) return { ok: false, reason: 'source-error' };
    for (const generatedGalaxy of generated) {
      const point = readPoint(generatedGalaxy);
      if (!point || !samePoint(point, wanted)) continue;
      const source = readGeneratedGalaxy(generatedGalaxy);
      if (!source) return { ok: false, reason: 'source-error' };
      matches.push({ ...source, parentCell });
    }
  }
  if (matches.length === 0) return { ok: false, reason: 'galaxy-not-found' };
  if (matches.length !== 1) return { ok: false, reason: 'galaxy-ambiguous' };
  return { ok: true, value: matches[0]! };
}

function resolveStar(
  wanted: PublicPoint,
  galaxy: ResolvedGalaxy,
  sources: CF1WorldAddressSources,
): { ok: true; value: ResolvedStar } | { ok: false; reason: CF1WorldAddressFailure } {
  let profile: Record<string, unknown>;
  try {
    profile = sources.galaxyProfile(galaxy.seed);
  } catch {
    return { ok: false, reason: 'source-error' };
  }
  if (!isRecord(profile)) return { ok: false, reason: 'source-error' };

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
          if (!isRecord(cell) || !Array.isArray(cell.stars)) return { ok: false, reason: 'source-error' };
          generated = cell.stars;
        } else {
          generated = sources.fineStarsInCell(galaxy.seed, profile, parentCell.x, parentCell.y);
          if (!Array.isArray(generated)) return { ok: false, reason: 'source-error' };
        }
      } catch {
        return { ok: false, reason: 'source-error' };
      }
      for (const generatedStar of generated) {
        const source = readPoint(generatedStar);
        if (source && samePoint(source, wanted)) matches.push({ ...source, layer, parentCell });
      }
    }
  }
  if (matches.length === 0) return { ok: false, reason: 'star-not-found' };
  if (matches.length !== 1) return { ok: false, reason: 'star-ambiguous' };
  return { ok: true, value: matches[0]! };
}

function resolvePlanet(
  wantedSeed: number,
  star: ResolvedStar,
  sources: CF1WorldAddressSources,
): { ok: true; value: ResolvedPlanet } | { ok: false; reason: CF1WorldAddressFailure } {
  let system: { planets: readonly unknown[] };
  try {
    system = sources.systemFor(star.seed);
  } catch {
    return { ok: false, reason: 'source-error' };
  }
  if (!isRecord(system) || !Array.isArray(system.planets)) return { ok: false, reason: 'source-error' };

  const matches: ResolvedPlanet[] = [];
  for (let ordinal = 0; ordinal < system.planets.length; ordinal++) {
    const entry = system.planets[ordinal];
    if (!isRecord(entry) || !isRecord(entry.P) || !isExactUint32(entry.P.seed)) continue;
    if (entry.P.seed === wantedSeed) matches.push({ seed: entry.P.seed, ordinal });
  }
  if (matches.length === 0) return { ok: false, reason: 'planet-not-found' };
  if (matches.length !== 1) return { ok: false, reason: 'planet-ambiguous' };
  return { ok: true, value: matches[0]! };
}

function keyNumber(value: number): string {
  return value === 0 ? '0' : String(value);
}

function canonicalKey(
  galaxy: ResolvedGalaxy,
  star: ResolvedStar,
  planet: ResolvedPlanet,
): string {
  return 'CF1'
    + '|g:' + galaxy.seed + '@' + keyNumber(galaxy.x) + ',' + keyNumber(galaxy.y)
    + '|s:' + star.seed + '@' + keyNumber(star.x) + ',' + keyNumber(star.y)
    + '|p:' + planet.seed + '#' + planet.ordinal;
}

/**
 * Resolve a public candidate against the actual CF1 generators. A failure
 * carries no partial parent data: callers must treat it as unusable and leave
 * navigation, saves, and future ownership receipts untouched.
 */
export function resolveCF1WorldAddress(
  candidate: unknown,
  overrides?: CF1WorldAddressSourceOverrides,
): ResolveCF1WorldAddressResult {
  const wanted = readCandidate(candidate);
  if (!wanted) return failure('malformed-address');
  const sources = sourcesFrom(overrides);

  const galaxy = resolveGalaxy(wanted.galaxy, sources);
  if (!galaxy.ok) return failure(galaxy.reason);
  const star = resolveStar(wanted.star, galaxy.value, sources);
  if (!star.ok) return failure(star.reason);
  const planet = resolvePlanet(wanted.planetSeed, star.value, sources);
  if (!planet.ok) return failure(planet.reason);

  const address: CanonicalCF1WorldAddress = {
    format: 'CF1',
    galaxy: {
      seed: galaxy.value.seed,
      x: galaxy.value.x,
      y: galaxy.value.y,
      size: galaxy.value.size,
      sp: galaxy.value.sp,
      tilt: galaxy.value.tilt,
      rot: galaxy.value.rot,
      home: galaxy.value.home,
      quasar: galaxy.value.quasar,
      dwarf: galaxy.value.dwarf,
      parentCell: galaxy.value.parentCell,
    },
    star: {
      seed: star.value.seed,
      x: star.value.x,
      y: star.value.y,
      layer: star.value.layer,
      parentCell: star.value.parentCell,
    },
    planet: planet.value,
    key: canonicalKey(galaxy.value, star.value, planet.value),
  };
  return { ok: true, address };
}
