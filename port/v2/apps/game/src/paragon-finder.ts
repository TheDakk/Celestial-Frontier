/* Arc 9 Fifty-Paragon deterministic finder foundation.

   These are the legacy v1.8.9 anchors, lifted without a wall clock or a new
   persistence owner. Catalogue progress comes only from exact Compendium
   records. Finder results are rebound through Scene's production CF1 resolver;
   diagnostic fixtures and structural clones therefore cannot become travel or
   discovery authority. The existing Discover Life transaction is the sole
   catalogue writer. */
import { canonicalJson } from '@cf/domain-acquisition';
import {
  ARC9_PARAGON_COUNT_V1,
  ARC9_PARAGON_MILESTONE_COUNT_V1,
  ARC9_PARAGON_MILESTONE_NAME_V1,
  ARC9_PARAGON_MILESTONE_STARDUST_V1,
  paragonGenomeV1,
  paragonSeedV1,
} from '@cf/domain-acquisition/paragon-internal';
import {
  classifyRealm,
  describeSpecies,
  sapienceTier,
  type Genome,
} from '@cf/domain-genome';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { GCELL, GR } from '@cf/domain-worldconfig';
import {
  galaxiesInCell,
  galaxyProfile,
  starsInCell,
  systemFor,
  type Gal,
} from '@cf/domain-worldgen';
import type { CodexEntry } from '@cf/persistence';
import { ringGrade } from '@cf/domain-strays';
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';

export {
  ARC9_PARAGON_COUNT_V1,
  ARC9_PARAGON_MILESTONE_COUNT_V1,
  ARC9_PARAGON_MILESTONE_NAME_V1,
  ARC9_PARAGON_MILESTONE_STARDUST_V1,
  paragonGenomeV1,
  paragonSeedV1,
};

const PARAGON_SEED_ANCHOR = 0x9A7A60;

function exactIndex(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 0
    || (value as number) >= ARC9_PARAGON_COUNT_V1) {
    throw new RangeError('Paragon index must identify one of the Fifty');
  }
  return value as number;
}

const PARAGON_INDEX_BY_CODEX_ID = new Map<string, number>(
  Array.from({ length: ARC9_PARAGON_COUNT_V1 }, (_, index) => (
    [`s${paragonGenomeV1(index).seed}`, index] as const
  )),
);

export function paragonCodexIdV1(indexValue: number): string {
  return `s${paragonSeedV1(indexValue)}`;
}

export function paragonIndexForCodexIdV1(value: unknown): number | null {
  return typeof value === 'string' ? PARAGON_INDEX_BY_CODEX_ID.get(value) ?? null : null;
}

function exactPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Reflect.ownKeys(value).every((key) => {
    if (typeof key !== 'string') return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return !!descriptor && 'value' in descriptor && descriptor.enumerable === true;
  });
}

export function isExactParagonGenomeV1(value: unknown, indexValue: number): boolean {
  if (!exactPlainRecord(value)) return false;
  try {
    return canonicalJson(value) === canonicalJson(paragonGenomeV1(indexValue));
  } catch {
    return false;
  }
}

export interface Arc9ParagonCatalogueSlotV1 {
  readonly index: number;
  readonly number: number;
  readonly seed: number;
  readonly codexId: string;
  readonly expectedName: string;
  readonly color: string;
  readonly found: boolean;
  readonly ownedName: string | null;
}

export interface Arc9ParagonCatalogueV1 {
  readonly schema: 'cf-v2-arc9-paragon-catalogue/v1';
  readonly found: number;
  readonly total: typeof ARC9_PARAGON_COUNT_V1;
  readonly milestone: Readonly<{
    readonly id: 'para10';
    readonly name: typeof ARC9_PARAGON_MILESTONE_NAME_V1;
    readonly required: typeof ARC9_PARAGON_MILESTONE_COUNT_V1;
    readonly stardust: typeof ARC9_PARAGON_MILESTONE_STARDUST_V1;
    readonly complete: boolean;
  }>;
  readonly slots: readonly Arc9ParagonCatalogueSlotV1[];
}

export type Arc9ParagonCatalogueProjectionV1 =
  | Readonly<{ kind: 'projected'; catalogue: Arc9ParagonCatalogueV1 }>
  | Readonly<{
    kind: 'protected';
    reason: 'codex-id-duplicate' | 'paragon-genome-mismatch';
  }>;

/** Project only the established fifty exact identities. A matching seed with
 * forged genome data protects the whole projection rather than creating a
 * claimable legend from a fixture. */
export function projectArc9ParagonCatalogueV1(
  entries: readonly CodexEntry[],
): Arc9ParagonCatalogueProjectionV1 {
  const byId = new Map<string, CodexEntry>();
  for (const entry of entries) {
    if (byId.has(entry.id)) {
      return Object.freeze({ kind: 'protected', reason: 'codex-id-duplicate' });
    }
    byId.set(entry.id, entry);
  }
  const slots: Arc9ParagonCatalogueSlotV1[] = [];
  for (let index = 0; index < ARC9_PARAGON_COUNT_V1; index++) {
    const genome = paragonGenomeV1(index);
    const codexId = paragonCodexIdV1(index);
    const owned = byId.get(codexId) ?? null;
    if (owned !== null && !isExactParagonGenomeV1(owned.g, index)) {
      return Object.freeze({ kind: 'protected', reason: 'paragon-genome-mismatch' });
    }
    const description = describeSpecies(genome as Genome);
    slots.push(Object.freeze({
      index,
      number: index + 1,
      seed: genome.seed,
      codexId,
      expectedName: description.name,
      color: description.grade.hex,
      found: owned !== null,
      ownedName: owned?.name ?? null,
    }));
  }
  const found = slots.filter((slot) => slot.found).length;
  return Object.freeze({
    kind: 'projected',
    catalogue: Object.freeze({
      schema: 'cf-v2-arc9-paragon-catalogue/v1',
      found,
      total: ARC9_PARAGON_COUNT_V1,
      milestone: Object.freeze({
        id: 'para10',
        name: ARC9_PARAGON_MILESTONE_NAME_V1,
        required: ARC9_PARAGON_MILESTONE_COUNT_V1,
        stardust: ARC9_PARAGON_MILESTONE_STARDUST_V1,
        complete: found >= ARC9_PARAGON_MILESTONE_COUNT_V1,
      }),
      slots: Object.freeze(slots),
    }),
  });
}

export interface Arc9ParagonLegacyWhereV1 {
  readonly type: 'planet';
  readonly gal: Readonly<{
    readonly x: number;
    readonly y: number;
    readonly size: number;
    readonly sp: number;
    readonly tilt: number;
    readonly rot: number;
    readonly seed: number;
    readonly home: boolean;
    readonly quasar: boolean;
    readonly dwarf: boolean;
  }>;
  readonly star: Readonly<{ readonly x: number; readonly y: number; readonly seed: number }>;
  readonly pseed: number;
}

function slimLegacyGalaxy(galaxy: Gal): Arc9ParagonLegacyWhereV1['gal'] {
  return Object.freeze({
    x: galaxy.x,
    y: galaxy.y,
    size: galaxy.size,
    sp: galaxy.sp,
    tilt: galaxy.tilt,
    rot: galaxy.rot,
    seed: galaxy.seed,
    home: galaxy.home || false,
    quasar: galaxy.quasar || false,
    dwarf: galaxy.dwarf || false,
  });
}

/** The fixed legacy paragonWhere walk: dailyWhere's search without a clock. */
export function paragonWhereV1(indexValue: number): Arc9ParagonLegacyWhereV1 | null {
  const index = exactIndex(indexValue);
  const random = mulberry32(hashInt(PARAGON_SEED_ANCHOR, index | 0, 64) >>> 0);
  let galaxy: Gal | null = null;
  for (let attempt = 0; attempt < 400 && galaxy === null; attempt++) {
    const cellX = Math.floor((random() * 2 - 1) * 2200);
    const cellY = Math.floor((random() * 2 - 1) * 2200);
    for (const candidate of galaxiesInCell(cellX, cellY)) {
      if (!candidate.quasar && !candidate.dwarf && !candidate.radio && candidate.size > 30) {
        galaxy = candidate;
        break;
      }
    }
  }
  if (galaxy === null) return null;
  const profile = galaxyProfile(galaxy.seed);
  const cellMaximum = Math.floor(GR / GCELL);
  for (let attempt = 0; attempt < 700; attempt++) {
    const cellX = Math.floor((random() * 2 - 1) * cellMaximum * 0.6);
    const cellY = Math.floor((random() * 2 - 1) * cellMaximum * 0.6);
    for (const star of starsInCell(galaxy.seed, profile, cellX, cellY).stars) {
      const system = systemFor(star.seed);
      const planet = (system.planets || []).find((candidate) =>
        candidate.P.type === 'terran' || candidate.P.type === 'ocean');
      if (planet) {
        return Object.freeze({
          type: 'planet',
          gal: slimLegacyGalaxy(galaxy),
          star: Object.freeze({ x: star.x, y: star.y, seed: star.seed }),
          pseed: planet.P.seed as number,
        });
      }
    }
  }
  return null;
}

export type Arc9ParagonFinderProjectionV1 =
  | Readonly<{
    kind: 'located';
    index: number;
    seed: number;
    codexId: string;
    where: Arc9ParagonLegacyWhereV1;
    address: CanonicalCF1WorldAddress;
  }>
  | Readonly<{ kind: 'unmapped'; index: number }>
  | Readonly<{ kind: 'protected'; reason: string }>;

const LOCATED_PARAGONS = new WeakSet<object>();

/* There are exactly fifty immutable universe anchors. Cache only successful
 * registered projections (or a deterministic unmapped result) by validated
 * index, so later Bioscans do not repeat all fifty seeded universe walks.
 * The first lookup remains lazy. Protected results are never cached. */
const PARAGON_FINDER_CACHE = new Map<number, Exclude<
  Arc9ParagonFinderProjectionV1,
  Readonly<{ kind: 'protected'; reason: string }>
>>();

/** Rebind the deterministic walk through the production address authority. */
export function projectArc9ParagonFinderV1(indexValue: number): Arc9ParagonFinderProjectionV1 {
  let index: number;
  try { index = exactIndex(indexValue); } catch {
    return Object.freeze({ kind: 'protected', reason: 'paragon-index' });
  }
  const cached = PARAGON_FINDER_CACHE.get(index);
  if (cached !== undefined) return cached;
  try {
    const where = paragonWhereV1(index);
    if (where === null) {
      const unmapped = Object.freeze({ kind: 'unmapped' as const, index });
      PARAGON_FINDER_CACHE.set(index, unmapped);
      return unmapped;
    }
    const resolved = resolveCF1WorldAddress({
      galaxy: { seed: where.gal.seed, x: where.gal.x, y: where.gal.y },
      star: where.star,
      planet: { seed: where.pseed },
    });
    if (!resolved.ok) {
      return Object.freeze({ kind: 'protected', reason: `source:${resolved.reason}` });
    }
    const located = Object.freeze({
      kind: 'located',
      index,
      seed: paragonSeedV1(index),
      codexId: paragonCodexIdV1(index),
      where,
      address: resolved.address,
    });
    LOCATED_PARAGONS.add(located);
    PARAGON_FINDER_CACHE.set(index, located);
    return located;
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: `source:${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

export type Arc9ParagonWorldBindingV1 =
  | Extract<Arc9ParagonFinderProjectionV1, { readonly kind: 'located' }>
  | Extract<Arc9ParagonFinderProjectionV1, { readonly kind: 'unmapped' }>
  | Readonly<{
    kind: 'protected';
    reason: 'unregistered-current-world' | 'paragon-location-mismatch' | string;
  }>;

/** Bind one finder index to the caller's currently proven world. A fixture,
 * JSON/spread clone, or another registered world is never accepted. */
export function bindArc9ParagonCurrentWorldV1(
  indexValue: number,
  currentWorld: unknown,
): Arc9ParagonWorldBindingV1 {
  if (!isCanonicalCF1Address(currentWorld) || !('planet' in currentWorld)) {
    return Object.freeze({ kind: 'protected', reason: 'unregistered-current-world' });
  }
  const expected = projectArc9ParagonFinderV1(indexValue);
  if (expected.kind !== 'located') return expected;
  return getCanonicalCF1AddressKey(currentWorld) === getCanonicalCF1AddressKey(expected.address)
    ? expected
    : Object.freeze({ kind: 'protected', reason: 'paragon-location-mismatch' });
}

export type Arc9ParagonCurrentWorldProjectionV1 =
  | Extract<Arc9ParagonFinderProjectionV1, { readonly kind: 'located' }>
  | Readonly<{ kind: 'none' }>
  | Readonly<{ kind: 'protected'; reason: string }>;

/** Find the one fixed Paragon whose complete registered CF1 address equals
 * the current world. Sharing only a planet seed is deliberately insufficient. */
export function findArc9ParagonAtCurrentWorldV1(
  currentWorld: unknown,
): Arc9ParagonCurrentWorldProjectionV1 {
  if (!isCanonicalCF1Address(currentWorld) || !('planet' in currentWorld)) {
    return Object.freeze({ kind: 'protected', reason: 'unregistered-current-world' });
  }
  const currentKey = getCanonicalCF1AddressKey(currentWorld);
  let match: Extract<Arc9ParagonFinderProjectionV1, { readonly kind: 'located' }> | null = null;
  for (let index = 0; index < ARC9_PARAGON_COUNT_V1; index++) {
    const candidate = projectArc9ParagonFinderV1(index);
    if (candidate.kind === 'protected') return candidate;
    if (candidate.kind !== 'located'
      || getCanonicalCF1AddressKey(candidate.address) !== currentKey) continue;
    if (match !== null) {
      return Object.freeze({ kind: 'protected', reason: 'paragon-location-duplicate' });
    }
    match = candidate;
  }
  return match ?? Object.freeze({ kind: 'none' });
}

/** Exact legacy `_storeSpecies` projection used by the one Bioscan writer.
 * Only a finder-minted location can request the compatibility row. */
export function projectArc9ParagonLegacyCodexEntryV1(
  located: Extract<Arc9ParagonFinderProjectionV1, { readonly kind: 'located' }>,
): CodexEntry {
  if (!located || typeof located !== 'object' || !LOCATED_PARAGONS.has(located)) {
    throw new TypeError('Paragon Codex projection requires a finder-minted location');
  }
  const genome = paragonGenomeV1(located.index);
  if (located.seed !== genome.seed || located.codexId !== `s${genome.seed}`
    || getCanonicalCF1AddressKey(located.address) !== located.address.key) {
    throw new TypeError('Paragon finder identity changed before Codex projection');
  }
  const where = {
    type: 'planet' as const,
    gal: {
      x: located.address.galaxy.x,
      y: located.address.galaxy.y,
      size: located.address.galaxy.size,
      sp: located.address.galaxy.sp,
      tilt: located.address.galaxy.tilt,
      rot: located.address.galaxy.rot,
      seed: located.address.galaxy.seed,
      home: located.address.galaxy.home,
      quasar: located.address.galaxy.quasar,
      dwarf: located.address.galaxy.dwarf,
    },
    star: {
      x: located.address.star.x,
      y: located.address.star.y,
      seed: located.address.star.seed,
    },
    pseed: located.address.planet.seed,
  };
  const descriptor = describeSpecies(genome as Genome);
  const grade = ringGrade(genome as never, descriptor.grade as never, where);
  const tier = grade && typeof (grade as { tier?: unknown }).tier === 'number'
    ? (grade as { tier: number }).tier
    : null;
  return {
    id: located.codexId,
    name: descriptor.name,
    kind: descriptor.kind,
    tier,
    realm: classifyRealm(genome as Genome),
    sapient: sapienceTier(genome as Genome),
    from: `Paragon site #${located.index + 1}`,
    hybrid: false,
    g: { ...genome } as Record<string, unknown>,
    where,
  };
}
