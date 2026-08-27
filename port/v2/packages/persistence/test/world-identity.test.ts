import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { galaxyProfile, starsInCell, systemFor } from '@cf/domain-worldgen';
import { GCELL, GR, HOME_GAL_SEED, HOME_POS } from '@cf/domain-worldconfig';
import { encodeWhere } from '@cf/domain-strays';
import {
  canonicalCF1WorldAtlasId,
  canonicalCF1WorldAddressFromNav,
  isCanonicalCF1Address,
  navFromCanonicalCF1Address,
  navToView,
  parseStrictCF1Code,
  resolveCF1WorldAddress,
  resolveCF1WorldAtlasId,
  resolveViewToNav,
  universeGalaxies,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  WORLD_IDENTITY_MANIFEST_NAMESPACE,
  WORLD_IDENTITY_MAX_RECORDS,
  WORLD_IDENTITY_SHARD_PREFIX,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  applyV5ExtensionWrites,
  canonicalWorldLandingCount,
  claimCanonicalWorldIdentity,
  createEmptyWorldIdentityState,
  createMemoryBackend,
  encodeWorldIdentityExtensionWrites,
  exportSaveV2,
  hasCanonicalWorldLanded,
  importSaveV2,
  initializeFreshV5,
  prepareWorldIdentityBootstrap,
  readRevisionedSaveV5WithRecovery,
  readWorldIdentity,
  recordCanonicalWorldLanding,
  setCanonicalWorldName,
  worldIdentityName,
  type ContentRegistry,
  type V5ExtensionCarrier,
  type V5Extensions,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(
  fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8'),
) as ContentRegistry;
const OWNER_SOURCE = fs.readFileSync(path.join(here, '..', 'src', 'world-identity.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const COLLISION_SEED = 488_332_735;
const COLLIDING_CANDIDATES = Object.freeze([
  Object.freeze({
    galaxy: Object.freeze({ seed: 1_594_395_733, x: -5_501.81, y: -11_753.64 }),
    star: Object.freeze({ seed: 4_077_594_722, x: -271.54, y: -67.36 }),
    planet: Object.freeze({ seed: COLLISION_SEED }),
  }),
  Object.freeze({
    galaxy: Object.freeze({ seed: 1_336_287_406, x: -2_657.91, y: -11_817.01 }),
    star: Object.freeze({ seed: 1_391_422_746, x: -646.79, y: 119.97 }),
    planet: Object.freeze({ seed: COLLISION_SEED }),
  }),
] as const);
let sourceWorldFixture: readonly CanonicalCF1WorldAddress[] | null = null;

beforeAll(() => installCaptureHooks());

function world(index: 0 | 1): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress(COLLIDING_CANDIDATES[index]);
  if (!resolved.ok) throw new Error(`collision world ${index} did not resolve: ${resolved.reason}`);
  return resolved.address;
}

function sourceProvenCapacityWorlds(): readonly CanonicalCF1WorldAddress[] {
  if (sourceWorldFixture !== null) return sourceWorldFixture;
  const generated = universeGalaxies(HOME_POS.x, HOME_POS.y, 2);
  const home = generated.find((galaxy) => galaxy.seed === HOME_GAL_SEED
    && galaxy.x === HOME_POS.x && galaxy.y === HOME_POS.y);
  if (home === undefined) throw new Error('capacity fixture lost the home galaxy');
  const galaxies = [home, ...generated.filter((galaxy) => galaxy !== home)];
  const cellRadius = Math.ceil(GR / GCELL) + 1;
  const worlds: CanonicalCF1WorldAddress[] = [];
  const keys = new Set<string>();
  const leafSeeds = new Set<number>();
  galaxyScan: for (const galaxy of galaxies) {
    const profile = galaxyProfile(galaxy.seed);
    for (let cellX = -cellRadius; cellX <= cellRadius; cellX++) {
      for (let cellY = -cellRadius; cellY <= cellRadius; cellY++) {
        for (const star of starsInCell(galaxy.seed, profile, cellX, cellY).stars) {
          for (const sourcePlanet of systemFor(star.seed).planets) {
            const planetSeed = sourcePlanet.P.seed;
            if (typeof planetSeed !== 'number' || !Number.isInteger(planetSeed)
              || planetSeed < 0 || planetSeed > 0xffff_ffff) {
              throw new Error('capacity fixture found a malformed source planet seed');
            }
            if (leafSeeds.has(planetSeed)) continue;
            const resolved = resolveCF1WorldAddress({
              galaxy: { seed: galaxy.seed, x: galaxy.x, y: galaxy.y },
              star: { seed: star.seed, x: star.x, y: star.y },
              planet: { seed: planetSeed },
            });
            if (!resolved.ok) throw new Error(`capacity fixture failed: ${resolved.reason}`);
            if (!isCanonicalCF1Address(resolved.address)) {
              throw new Error('capacity fixture address lost provenance');
            }
            if (keys.has(resolved.address.key)) {
              throw new Error(`duplicate capacity fixture key ${resolved.address.key}`);
            }
            keys.add(resolved.address.key);
            leafSeeds.add(resolved.address.planet.seed);
            worlds.push(resolved.address);
            if (worlds.length === WORLD_IDENTITY_MAX_RECORDS) break galaxyScan;
          }
        }
      }
    }
  }
  if (worlds.length !== WORLD_IDENTITY_MAX_RECORDS) {
    throw new Error(`capacity fixture yielded only ${worlds.length} worlds`);
  }
  sourceWorldFixture = Object.freeze(worlds);
  return sourceWorldFixture;
}

function surface(address: CanonicalCF1WorldAddress) {
  const resolved = navFromCanonicalCF1Address(address);
  if (!resolved.ok || resolved.state.mode !== 'surface') {
    throw new Error('collision world did not produce a surface route');
  }
  return resolved.state;
}

function replaceCarrier(
  extensions: V5Extensions,
  namespace: string,
  replace: (carrier: V5ExtensionCarrier) => V5ExtensionCarrier | undefined,
): V5Extensions {
  const catalog = { ...(extensions.catalog ?? {}) };
  const current = catalog[namespace];
  if (current === undefined) throw new Error(`missing fixture carrier ${namespace}`);
  const replacement = replace(current);
  if (replacement === undefined) delete catalog[namespace];
  else catalog[namespace] = replacement;
  return { ...extensions, catalog };
}

function exactJsonBytes(size: number): string {
  if (!Number.isSafeInteger(size) || size < 8 || size > V5_MAX_EXTENSION_JSON_BYTES) {
    throw new RangeError(`invalid exact JSON fixture size ${size}`);
  }
  const json = `{"p":"${'x'.repeat(size - 8)}"}`;
  if (new TextEncoder().encode(json).byteLength !== size) {
    throw new Error('exact JSON fixture did not reach its requested byte count');
  }
  return json;
}

function extensionsAtCandidateCapacity(
  current: ReturnType<typeof createEmptyWorldIdentityState>,
  candidate: ReturnType<typeof createEmptyWorldIdentityState>,
  offset: number,
): V5Extensions {
  const candidateBytes = encodeWorldIdentityExtensionWrites(candidate).reduce(
    (total, write) => total + new TextEncoder().encode(write.carrier.json).byteLength,
    0,
  );
  const fillerBytes = V5_MAX_EXTENSION_TOTAL_BYTES - candidateBytes + offset;
  const namespaceCount = Math.ceil(fillerBytes / 250_000);
  const baseSize = Math.floor(fillerBytes / namespaceCount);
  const remainder = fillerBytes % namespaceCount;
  const player: Record<string, V5ExtensionCarrier> = {};
  for (let index = 0; index < namespaceCount; index++) {
    const size = baseSize + (index < remainder ? 1 : 0);
    player[`world-identity.fill.${index}`] = { version: 1, json: exactJsonBytes(size) };
  }
  return applyV5ExtensionWrites(
    { player },
    encodeWorldIdentityExtensionWrites(current),
  ).extensions;
}

describe('@cf/persistence — canonical world identity', () => {
  it('orders persisted keys by explicit code units without host ICU authority', () => {
    expect(OWNER_SOURCE).toContain('left.key < right.key ? -1 : left.key > right.key ? 1 : 0');
    expect(OWNER_SOURCE).not.toContain('.localeCompare(');
  });

  it('keeps colliding name/landing history independent and rejects seed-only or corrupt authority', () => {
    const first = world(0);
    const second = world(1);
    expect(first.planet).toEqual({ seed: COLLISION_SEED, ordinal: 2 });
    expect(second.planet).toEqual({ seed: COLLISION_SEED, ordinal: 1 });
    expect(first.key).not.toBe(second.key);

    let state = createEmptyWorldIdentityState();
    state = setCanonicalWorldName(state, first, 'Amber Reach').state;
    expect(worldIdentityName(state, first)).toBe('Amber Reach');
    expect(worldIdentityName(state, second)).toBeNull();

    const firstLanding = recordCanonicalWorldLanding(state, first);
    state = firstLanding.state;
    expect(firstLanding.firstLanding).toBe(true);
    expect(hasCanonicalWorldLanded(state, first)).toBe(true);
    expect(hasCanonicalWorldLanded(state, second)).toBe(false);
    expect(recordCanonicalWorldLanding(state, first)).toMatchObject({ firstLanding: false });

    state = setCanonicalWorldName(state, second, 'Violet Haven').state;
    const secondLanding = recordCanonicalWorldLanding(state, second);
    state = secondLanding.state;
    expect(secondLanding.firstLanding).toBe(true);
    expect(canonicalWorldLandingCount(state)).toBe(2);
    expect(worldIdentityName(state, first)).toBe('Amber Reach');
    expect(worldIdentityName(state, second)).toBe('Violet Haven');

    const extensions = applyV5ExtensionWrites(
      {},
      encodeWorldIdentityExtensionWrites(state),
    ).extensions;
    const reloaded = readWorldIdentity(extensions);
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind !== 'loaded') return;
    expect(canonicalWorldLandingCount(reloaded.state)).toBe(2);
    expect(worldIdentityName(reloaded.state, first)).toBe('Amber Reach');
    expect(worldIdentityName(reloaded.state, second)).toBe('Violet Haven');

    /* Negative-before migration control: a leaf mirror may seed one uniquely
       proven address, but the same mirror cannot choose between two known
       collision worlds. Its aggregate/reward authority remains unresolved
       without masquerading as either world's exact presentation. */
    const legacy = {
      landed: [COLLISION_SEED],
      customNames: [[`p${COLLISION_SEED}`, 'Leaf Alias']] as const,
    };
    const unique = prepareWorldIdentityBootstrap({ extensions: {}, legacy, addresses: [first] });
    expect(unique.kind).toBe('prepared');
    if (unique.kind !== 'prepared') return;
    expect(hasCanonicalWorldLanded(unique.state, first)).toBe(true);
    expect(worldIdentityName(unique.state, first)).toBe('Leaf Alias');

    const ambiguous = prepareWorldIdentityBootstrap({
      extensions: {}, legacy, addresses: [first, second],
    });
    expect(ambiguous.kind).toBe('prepared');
    if (ambiguous.kind !== 'prepared') return;
    expect(canonicalWorldLandingCount(ambiguous.state)).toBe(1);
    expect(ambiguous.state.records).toHaveLength(0);
    expect(ambiguous.state.unresolved).toEqual([{
      seed: COLLISION_SEED, landed: true, name: 'Leaf Alias',
    }]);
    expect(worldIdentityName(ambiguous.state, first)).toBeNull();
    expect(worldIdentityName(ambiguous.state, second)).toBeNull();
    expect(hasCanonicalWorldLanded(ambiguous.state, first)).toBe(false);
    expect(hasCanonicalWorldLanded(ambiguous.state, second)).toBe(false);
    const consumed = recordCanonicalWorldLanding(ambiguous.state, first);
    expect(consumed).toMatchObject({ firstLanding: false, claimedLegacy: true });
    expect(canonicalWorldLandingCount(consumed.state)).toBe(1);
    expect(worldIdentityName(consumed.state, first)).toBe('Leaf Alias');
    expect(worldIdentityName(consumed.state, second)).toBeNull();
    const genuinelyNewCollision = recordCanonicalWorldLanding(consumed.state, second);
    expect(genuinelyNewCollision).toMatchObject({ firstLanding: true, claimedLegacy: false });
    expect(canonicalWorldLandingCount(genuinelyNewCollision.state)).toBe(2);

    const missingShard = replaceCarrier(
      extensions,
      `${WORLD_IDENTITY_SHARD_PREFIX}3`,
      () => undefined,
    );
    expect(readWorldIdentity(missingShard)).toEqual({ kind: 'corrupt' });

    const alteredKey = replaceCarrier(
      extensions,
      `${WORLD_IDENTITY_SHARD_PREFIX}0`,
      (carrier) => {
        const shard = JSON.parse(carrier.json) as { rows: Array<[string, string, number, unknown]> };
        const packed = shard.rows[0]?.[1];
        if (!packed) throw new Error('missing packed-address corruption control');
        shard.rows[0]![1] = `${packed[0] === 'A' ? 'B' : 'A'}${packed.slice(1)}`;
        return { ...carrier, json: JSON.stringify(shard) };
      },
    );
    expect(readWorldIdentity(alteredKey)).toEqual({ kind: 'corrupt' });

    const futureManifest = replaceCarrier(
      extensions,
      WORLD_IDENTITY_MANIFEST_NAMESPACE,
      (carrier) => ({ ...carrier, version: 2 }),
    );
    expect(readWorldIdentity(futureManifest)).toEqual({ kind: 'future-version', version: 2 });
  });

  it('preserves all unresolved veteran counts and consumes one without a duplicate reward', () => {
    const first = world(0);
    const second = world(1);
    const landed = [COLLISION_SEED, ...Array.from({ length: 499 }, (_, index) => index + 1)];
    const prepared = prepareWorldIdentityBootstrap({
      extensions: {},
      legacy: {
        landed,
        customNames: [[`p${COLLISION_SEED}`, 'Veteran Collision']],
      },
      addresses: [first, second],
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(canonicalWorldLandingCount(prepared.state)).toBe(500);
    expect(prepared.state.unresolved).toHaveLength(500);

    const revisit = recordCanonicalWorldLanding(prepared.state, second);
    expect(revisit.firstLanding).toBe(false);
    expect(revisit.claimedLegacy).toBe(true);
    expect(canonicalWorldLandingCount(revisit.state)).toBe(500);
    expect(revisit.state.unresolved).toHaveLength(499);
    expect(worldIdentityName(revisit.state, second)).toBe('Veteran Collision');

    const reloaded = readWorldIdentity(applyV5ExtensionWrites(
      {},
      encodeWorldIdentityExtensionWrites(revisit.state),
    ).extensions);
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind === 'loaded') {
      expect(canonicalWorldLandingCount(reloaded.state)).toBe(500);
      expect(recordCanonicalWorldLanding(reloaded.state, second).firstLanding).toBe(false);
    }
  });

  it('fits the maximum unresolved legacy union through the real shared extension bounds', () => {
    const legacyLandingCount = 4_000;
    const legacyNameCount = 5_000;
    expect(legacyLandingCount + legacyNameCount).toBe(WORLD_IDENTITY_MAX_RECORDS);
    const escapedWorstCaseName = '\u0001'.repeat(24);
    const existingJson = JSON.stringify({ padding: 'x'.repeat(64_000) });
    const existing: V5Extensions = {
      player: {
        'world-identity.capacity-control': { version: 1, json: existingJson },
      },
    };
    const prepared = prepareWorldIdentityBootstrap({
      extensions: existing,
      legacy: {
        landed: Array.from({ length: legacyLandingCount }, (_, index) => index),
        customNames: Array.from(
          { length: legacyNameCount },
          (_, index) => [`p${100_000 + index}`, escapedWorstCaseName] as const,
        ),
      },
      addresses: [],
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;

    expect(prepared.state.records).toHaveLength(0);
    expect(prepared.state.unresolved).toHaveLength(WORLD_IDENTITY_MAX_RECORDS);
    const ownerBytes = prepared.writes.reduce(
      (total, write) => total + new TextEncoder().encode(write.carrier.json).byteLength,
      0,
    );
    for (const write of prepared.writes) {
      expect(new TextEncoder().encode(write.carrier.json).byteLength)
        .toBeLessThanOrEqual(V5_MAX_EXTENSION_JSON_BYTES);
    }
    expect(ownerBytes + new TextEncoder().encode(existingJson).byteLength)
      .toBeLessThanOrEqual(V5_MAX_EXTENSION_TOTAL_BYTES);
    expect(() => applyV5ExtensionWrites(existing, prepared.writes)).not.toThrow();

    const over = prepareWorldIdentityBootstrap({
      extensions: {},
      legacy: {
        landed: Array.from({ length: legacyLandingCount }, (_, index) => index),
        customNames: Array.from(
          { length: legacyNameCount + 1 },
          (_, index) => [`p${100_000 + index}`, escapedWorstCaseName] as const,
        ),
      },
      addresses: [],
    });
    expect(over).toEqual({ kind: 'protected', reason: 'extension-bounds' });
  });

  it('normalizes an accepted >9k imported landing set through the exact v4 export mirror', () => {
    const prepared = prepareWorldIdentityBootstrap({
      extensions: {},
      legacy: {
        landed: Array.from({ length: 12_000 }, (_, index) => index),
        customNames: [],
        conquered: [['12000', {}], [5, {}]],
        mined: [['12001', {}]],
      },
      addresses: [],
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;

    /* Set insertion order plus slice(-4000), verbatim with exportSaveV2:
       re-adding conquered seed 5 does not move it to the tail. */
    expect(prepared.state.records).toHaveLength(0);
    expect(prepared.state.unresolved).toHaveLength(4_000);
    expect(prepared.state.unresolved[0]?.seed).toBe(8_002);
    expect(prepared.state.unresolved.at(-1)?.seed).toBe(12_001);
    expect(prepared.state.unresolved.some((entry) => entry.seed === 12_000)).toBe(true);
    expect(prepared.state.unresolved.some((entry) => entry.seed === 5)).toBe(false);
    expect(canonicalWorldLandingCount(prepared.state)).toBe(4_000);
    expect(readWorldIdentity(prepared.extensions).kind).toBe('loaded');
  });

  it('byte-balances an adversarial 9,000 exact-row carrier through real shared bounds', () => {
    const exact = [...sourceProvenCapacityWorlds()].sort((left, right) => (
      left.key < right.key ? -1 : left.key > right.key ? 1 : 0
    ));
    const compactWorstCaseName = '\u0001'.repeat(24);
    /* Negative-before control for the retired row-index modulo sharder: put
       names in modulo classes 0/1 and the first 500 rows of class 2. The old
       algorithm exceeds the per-carrier limit despite fitting in aggregate. */
    let classTwoNames = 0;
    const named = exact.filter((_, index) => {
      if (index % 4 === 0 || index % 4 === 1) return true;
      if (index % 4 === 2 && classTwoNames < 500) {
        classTwoNames += 1;
        return true;
      }
      return false;
    });
    const namedSeeds = new Set(named.map((address) => address.planet.seed));
    const landed = exact.filter((address) => !namedSeeds.has(address.planet.seed));
    expect(named).toHaveLength(5_000);
    expect(landed).toHaveLength(4_000);
    const packedName = ['u', 'A'.repeat(64)] as const;
    const namedRowBytes = JSON.stringify(['w', 'A'.repeat(43), 0, packedName]).length;
    const landedRowBytes = JSON.stringify(['w', 'A'.repeat(43), 1, null]).length;
    const oldModuloBytes = Array.from({ length: 4 }, (_, shardIndex) => {
      const rowBytes = exact.reduce((total, _address, index) => {
        if (index % 4 !== shardIndex) return total;
        return total + (namedSeeds.has(exact[index]!.planet.seed) ? namedRowBytes : landedRowBytes);
      }, 0);
      const rowCount = exact.filter((_, index) => index % 4 === shardIndex).length;
      const wrapperBytes = JSON.stringify({
        schema: 'cf-v2-world-identity-shard/v1', version: 1, index: shardIndex, rows: [],
      }).length;
      return wrapperBytes + rowBytes + Math.max(0, rowCount - 1);
    });
    expect(Math.max(...oldModuloBytes)).toBeGreaterThan(V5_MAX_EXTENSION_JSON_BYTES);

    const existingJson = JSON.stringify({ padding: 'x'.repeat(64_000) });
    const existing: V5Extensions = {
      player: {
        'world-identity.capacity-control': { version: 1, json: existingJson },
      },
    };
    const prepared = prepareWorldIdentityBootstrap({
      extensions: existing,
      legacy: {
        landed: landed.map((address) => address.planet.seed),
        customNames: named.map((address) => [
          `p${address.planet.seed}`, compactWorstCaseName,
        ] as const),
      },
      addresses: exact,
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;

    expect(prepared.state.records).toHaveLength(WORLD_IDENTITY_MAX_RECORDS);
    expect(prepared.state.unresolved).toHaveLength(0);
    expect(prepared.state.records.filter((record) => record.name !== null)).toHaveLength(5_000);
    expect(prepared.state.records.filter((record) => record.landed)).toHaveLength(4_000);
    const ownerBytes = prepared.writes.reduce(
      (total, write) => total + new TextEncoder().encode(write.carrier.json).byteLength,
      0,
    );
    for (const write of prepared.writes) {
      expect(new TextEncoder().encode(write.carrier.json).byteLength)
        .toBeLessThanOrEqual(V5_MAX_EXTENSION_JSON_BYTES);
    }
    const shardBytes = prepared.writes.slice(1).map(
      (write) => new TextEncoder().encode(write.carrier.json).byteLength,
    );
    expect(Math.max(...shardBytes) - Math.min(...shardBytes)).toBeLessThanOrEqual(namedRowBytes);
    expect(ownerBytes + new TextEncoder().encode(existingJson).byteLength)
      .toBeLessThanOrEqual(V5_MAX_EXTENSION_TOTAL_BYTES);
    expect(() => applyV5ExtensionWrites(existing, prepared.writes)).not.toThrow();
    const reloaded = readWorldIdentity(prepared.extensions);
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind === 'loaded') {
      expect(reloaded.state.records.map((record) => record.key))
        .toEqual(prepared.state.records.map((record) => record.key));
      expect(reloaded.state.unresolved).toEqual(prepared.state.unresolved);
    }
  });

  it('preflights shared capacity before name, landing, or unresolved Atlas claim mutation', () => {
    const earthResult = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424_242, x: 560, y: 170 },
      planet: { seed: 133 },
    });
    expect(earthResult.ok).toBe(true);
    if (!earthResult.ok) return;
    const earth = earthResult.address;
    const empty = createEmptyWorldIdentityState();
    const landingCandidate = recordCanonicalWorldLanding(empty, earth).state;

    const landingJustFits = extensionsAtCandidateCapacity(empty, landingCandidate, 0);
    const landed = recordCanonicalWorldLanding(empty, earth, landingJustFits);
    expect(landed).toMatchObject({
      firstLanding: true, claimedLegacy: false, capacityProtected: false,
    });
    expect(() => applyV5ExtensionWrites(
      landingJustFits,
      encodeWorldIdentityExtensionWrites(landed.state),
    )).not.toThrow();

    const landingTooLarge = extensionsAtCandidateCapacity(empty, landingCandidate, 1);
    const rejectedLanding = recordCanonicalWorldLanding(empty, earth, landingTooLarge);
    expect(rejectedLanding).toMatchObject({
      firstLanding: false, claimedLegacy: false, capacityProtected: true,
    });
    expect(rejectedLanding.state).toBe(empty);
    expect(canonicalWorldLandingCount(rejectedLanding.state)).toBe(0);

    const nameCandidate = setCanonicalWorldName(landed.state, earth, 'Capacity Earth').state;
    const nameJustFits = extensionsAtCandidateCapacity(landed.state, nameCandidate, 0);
    const named = setCanonicalWorldName(landed.state, earth, 'Capacity Earth', nameJustFits);
    expect(named).toMatchObject({ applied: true, capacityProtected: false });
    expect(worldIdentityName(named.state, earth)).toBe('Capacity Earth');

    const nameTooLarge = extensionsAtCandidateCapacity(landed.state, nameCandidate, 1);
    const rejectedName = setCanonicalWorldName(
      landed.state,
      earth,
      'Capacity Earth',
      nameTooLarge,
    );
    expect(rejectedName).toMatchObject({ applied: false, capacityProtected: true });
    expect(rejectedName.state).toBe(landed.state);
    expect(worldIdentityName(rejectedName.state, earth)).toBeNull();

    const unresolvedPreparation = prepareWorldIdentityBootstrap({
      extensions: {},
      legacy: { landed: [133], customNames: [['p133', 'Legacy Earth']] },
      addresses: [],
    });
    expect(unresolvedPreparation.kind).toBe('prepared');
    if (unresolvedPreparation.kind !== 'prepared') return;
    const claimCandidate = claimCanonicalWorldIdentity(
      unresolvedPreparation.state,
      earth,
    ).state;
    const claimJustFits = extensionsAtCandidateCapacity(
      unresolvedPreparation.state,
      claimCandidate,
      0,
    );
    const claimed = claimCanonicalWorldIdentity(
      unresolvedPreparation.state,
      earth,
      claimJustFits,
    );
    expect(claimed).toMatchObject({ claimedLegacy: true, capacityProtected: false });
    expect(claimed.state.records).toHaveLength(1);
    expect(claimed.state.unresolved).toHaveLength(0);
    const claimTooLarge = extensionsAtCandidateCapacity(
      unresolvedPreparation.state,
      claimCandidate,
      1,
    );
    const rejectedClaim = claimCanonicalWorldIdentity(
      unresolvedPreparation.state,
      earth,
      claimTooLarge,
    );
    expect(rejectedClaim).toMatchObject({
      claimedLegacy: false, capacityProtected: true,
    });
    expect(rejectedClaim.state).toBe(unresolvedPreparation.state);
    expect(rejectedClaim.state.records).toHaveLength(0);
    expect(rejectedClaim.state.unresolved).toHaveLength(1);
  });

  it('retains an unrelated exact record while atomically claiming one unresolved collision', () => {
    const first = world(0);
    const second = world(1);
    const earthResult = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424_242, x: 560, y: 170 },
      planet: { seed: 133 },
    });
    expect(earthResult.ok).toBe(true);
    if (!earthResult.ok) return;

    const prepared = prepareWorldIdentityBootstrap({
      extensions: {},
      legacy: {
        landed: [COLLISION_SEED],
        customNames: [[`p${COLLISION_SEED}`, 'Legacy Collision']],
      },
      addresses: [first, second],
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;

    const unrelated = recordCanonicalWorldLanding(prepared.state, earthResult.address);
    expect(unrelated).toMatchObject({ firstLanding: true, claimedLegacy: false });
    expect(canonicalWorldLandingCount(unrelated.state)).toBe(2);
    expect(unrelated.state.records.map((record) => record.key)).toEqual([earthResult.address.key]);

    const claimed = recordCanonicalWorldLanding(unrelated.state, first);
    expect(claimed).toMatchObject({ firstLanding: false, claimedLegacy: true });
    expect(canonicalWorldLandingCount(claimed.state)).toBe(2);
    expect(new Set(claimed.state.records.map((record) => record.key))).toEqual(
      new Set([earthResult.address.key, first.key]),
    );
    expect(claimed.state.records).toHaveLength(2);
    expect(worldIdentityName(claimed.state, first)).toBe('Legacy Collision');
    expect(worldIdentityName(claimed.state, second)).toBeNull();
    expect(hasCanonicalWorldLanded(claimed.state, first)).toBe(true);
    expect(hasCanonicalWorldLanded(claimed.state, second)).toBe(false);
  });

  it('survives add/save/reload and joins Atlas travel/share names by full address', async () => {
    const first = world(0);
    const second = world(1);
    const addresses = [first, second] as const;
    const ids = addresses.map(canonicalCF1WorldAtlasId);
    expect(new Set(ids).size).toBe(2);

    const raw = JSON.stringify({
      v: 4,
      epoch: 0,
      land: [COLLISION_SEED],
      names: [[`p${COLLISION_SEED}`, 'Compatibility Only']],
      home: ids[0],
      log: addresses.map((address, index) => ({
        id: ids[index],
        title: index === 0 ? 'Amber Reach' : 'Violet Haven',
        sub: 'collision regression world',
        where: navToView(surface(address)),
        t: NOW + index,
        thumb: `data:image/png;base64,collision-${index}`,
      })),
    });
    const imported = importSaveV2(raw, REGISTRY, NOW + 10);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.state.logMap.map(([id]) => id)).toEqual(ids);
    expect(imported.state.homeId).toBe(ids[0]);

    let identity = createEmptyWorldIdentityState();
    identity = setCanonicalWorldName(identity, first, 'Amber Reach').state;
    identity = recordCanonicalWorldLanding(identity, first).state;
    identity = setCanonicalWorldName(identity, second, 'Violet Haven').state;
    identity = recordCanonicalWorldLanding(identity, second).state;
    const extensions = applyV5ExtensionWrites(
      {},
      encodeWorldIdentityExtensionWrites(identity),
    ).extensions;

    const backend = createMemoryBackend();
    await expect(initializeFreshV5(
      backend,
      { state: imported.state, extensions },
      REGISTRY,
      NOW + 10,
    )).resolves.toMatchObject({ kind: 'initialized', revision: 1 });
    const loaded = await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW + 20);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.state.logMap.map(([id]) => id).sort()).toEqual([...ids].sort());
    const loadedIdentity = readWorldIdentity(loaded.extensions);
    expect(loadedIdentity.kind).toBe('loaded');
    if (loadedIdentity.kind !== 'loaded') return;

    for (const [id, entry] of loaded.state.logMap) {
      const index = ids.indexOf(id);
      expect(index).toBeGreaterThanOrEqual(0);
      if (index < 0) continue;
      const rawWhere = loaded.ingress.atlasWhere.get(entry);
      const route = resolveViewToNav(rawWhere);
      expect(route.ok).toBe(true);
      if (!route.ok || route.state.mode !== 'surface') continue;
      const idAddress = resolveCF1WorldAtlasId(id);
      expect(idAddress.ok).toBe(true);
      if (!idAddress.ok) continue;
      const routeAddress = canonicalCF1WorldAddressFromNav(route.state);
      expect(routeAddress.ok).toBe(true);
      if (!routeAddress.ok) continue;
      expect(idAddress.address.key).toBe(addresses[index]!.key);
      expect(routeAddress.address.key).toBe(addresses[index]!.key);
      expect(idAddress.address.key).toBe(routeAddress.address.key);

      const name = worldIdentityName(loadedIdentity.state, idAddress.address);
      const share = encodeWhere(navToView(route.state)! as never, name ?? undefined);
      const parsed = parseStrictCF1Code(share);
      expect(parsed).toMatchObject({
        kind: 'valid',
        tier: 'planet',
        name: index === 0 ? 'Amber Reach' : 'Violet Haven',
        candidate: { planet: { seed: COLLISION_SEED } },
      });
      if (parsed.kind !== 'valid' || parsed.tier !== 'planet') continue;
      const sharedWorld = resolveCF1WorldAddress(parsed.candidate);
      expect(sharedWorld.ok).toBe(true);
      if (sharedWorld.ok) expect(sharedWorld.address.key).toBe(addresses[index]!.key);
    }

    /* Negative controls: the legacy leaf id collapses the two adds, and a
       composite id paired with the other world's route is detectably not an
       exact Atlas join. */
    const collapsed = importSaveV2(JSON.stringify({
      v: 4,
      epoch: 0,
      log: addresses.map((address, index) => ({
        id: `p${COLLISION_SEED}`,
        title: String(index),
        where: navToView(surface(address)),
        t: index,
      })),
    }), REGISTRY, NOW);
    expect(collapsed.ok).toBe(true);
    if (collapsed.ok) expect(collapsed.state.logMap).toHaveLength(1);

    const wrongRoute = resolveViewToNav(navToView(surface(second)));
    const wrongId = resolveCF1WorldAtlasId(ids[0]);
    expect(wrongRoute.ok && wrongRoute.state.mode === 'surface' && wrongId.ok
      && wrongId.address.key === second.key).toBe(false);

    /* The legacy codec is still a compatibility carrier after the v5 save:
       exact Atlas ids survive it, but current names/landings reload above
       from the v5 shards rather than these lossy leaf mirrors. */
    const unrelatedThumb = 'data:image/png;base64,unrelated-waypoint';
    const compatibilityRaw = JSON.parse(exportSaveV2({
      ...loaded.state,
      logMap: [
        ...loaded.state.logMap,
        ['waypoint', {
          id: 'waypoint', title: 'Unrelated waypoint', sub: '', where: null,
          thumb: unrelatedThumb, t: NOW - 1,
        }],
      ],
    }, NOW + 30)) as { log: Array<Record<string, unknown>> };
    expect(compatibilityRaw.log.filter((entry) => ids.includes(String(entry.id)))
      .every((entry) => entry.thumb === null)).toBe(true);
    expect(compatibilityRaw.log.find((entry) => entry.id === 'waypoint')?.thumb)
      .toBe(unrelatedThumb);

    const legacyRoundTrip = importSaveV2(exportSaveV2(loaded.state, NOW + 30), REGISTRY, NOW + 40);
    expect(legacyRoundTrip.ok).toBe(true);
    if (legacyRoundTrip.ok) {
      expect(legacyRoundTrip.state.logMap.map(([id]) => id).sort()).toEqual([...ids].sort());
      expect(legacyRoundTrip.state.logMap.every(([, entry]) => entry.thumb === null)).toBe(true);
    }
  });
});
