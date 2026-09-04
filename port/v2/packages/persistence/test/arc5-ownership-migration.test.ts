import { beforeAll, describe, expect, it } from 'vitest';
import * as acquisitionRoot from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  canonicalJson,
  createBiosphereProgressV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createEmptyOwnershipStateV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createOwnershipSuccessorV1,
  createWorldDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  sha256Hex,
  utf8ByteLength,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  BREED_ACTION_KIND_V2,
  createBredAcquisitionRecordV2,
  createBredCreatureInstanceV2,
  createCreatureInstanceV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  type OwnershipStateContentsV2,
} from '../../domain/acquisition/src/model-v2.js';
import {
  ARC4_OWNERSHIP_PREFIX,
  ARC5_OWNERSHIP_DELTA_PREFIX,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_FIXED_SHARDS,
  ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
  ARC5_OWNERSHIP_MIGRATION_SCHEMA,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  committedArc5OwnershipState,
  encodeArc4Ownership,
  prepareArc4OwnershipWrite,
  prepareArc5OwnershipMigration,
  prepareArc5OwnershipMigrationSuccessor,
  prepareArc5OwnershipV2Successor,
  readArc4Ownership,
  readArc5OwnershipMigration,
  type PreparedArc5OwnershipMigrationV2,
  type V5ExtensionCarrier,
  type V5Extensions,
  type V5Segment,
} from '../src/index.js';

const LEGACY_SCHEMA = 'cf-v2-ownership-v1-to-v2/v1';

beforeAll(() => installCaptureHooks());

interface Fixture {
  readonly source: OwnershipStateV1;
  readonly leftId: CreatureInstanceId;
  readonly rightId: CreatureInstanceId;
}

function fixture(): Fixture {
  const identities = [11, 22].map((seed, index) => (
    canonicalGenomeIdentityV1({ seed, kingdom: 'fauna', form: index + 1 })
  ));
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `persistence-delta-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `persistence-delta-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  }));
  const catalogSpecies = identities.map((identity, index) => createCatalogSpeciesV1({
    identity,
    alias: null,
    firstObservationId: discoveries[index]!.recordId,
  }));
  const ids = ['left', 'right'].map((label) => (
    ownershipContentId('creature', `persistence-delta-${label}`) as CreatureInstanceId
  ));
  const creatures = identities.map((identity, index) => createCreatureInstanceV1({
    creatureId: ids[index]!,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: null,
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: null,
    hurt: null,
    fed: 80,
    brood: null,
    assignment: null,
    bond: null,
  }));
  return Object.freeze({
    source: createInitialOwnershipStateV1({
      catalogSpecies,
      discoveries,
      creatures,
      specimenLots: [],
      biosphereProgress: [],
      legacyBioX: [],
      scoutCreatureId: ids[0]!,
    }),
    leftId: ids[0]!,
    rightId: ids[1]!,
  });
}

function baseExtensions(): V5Extensions {
  return canonicalizeV5Extensions({
    player: {
      'f4.authority': { version: 1, json: '{"keep":"f4-player"}' },
      'other.player': { version: 7, json: '{"keep":"player"}' },
    },
    creatures: { 'other.creatures': { version: 2, json: '{"keep":"creatures"}' } },
    catalog: { 'other.catalog': { version: 3, json: '{"keep":"catalog"}' } },
    inventory: { 'other.inventory': { version: 4, json: '{"keep":"inventory"}' } },
    settings: { 'other.settings': { version: 5, json: '{"keep":"settings"}' } },
  });
}

function withArc4(base: V5Extensions, state: OwnershipStateV1): V5Extensions {
  return applyV5ExtensionWrites(base, encodeArc4Ownership(state).writes).extensions;
}

function cloneExtensions(
  extensions: V5Extensions,
): Partial<Record<V5Segment, Record<string, V5ExtensionCarrier>>> {
  const copy: Partial<Record<V5Segment, Record<string, V5ExtensionCarrier>>> = {};
  for (const [segment, namespaces] of Object.entries(extensions) as Array<[
    V5Segment,
    Readonly<Record<string, V5ExtensionCarrier>>,
  ]>) copy[segment] = { ...namespaces };
  return copy;
}

function replace(
  extensions: V5Extensions,
  segment: V5Segment,
  namespace: string,
  carrier: V5ExtensionCarrier,
): V5Extensions {
  const copy = cloneExtensions(extensions);
  copy[segment] = { ...(copy[segment] ?? {}), [namespace]: carrier };
  return canonicalizeV5Extensions(copy);
}

function remove(
  extensions: V5Extensions,
  segment: V5Segment,
  namespace: string,
): V5Extensions {
  const copy = cloneExtensions(extensions);
  const kept = Object.fromEntries(
    Object.entries(copy[segment] ?? {}).filter(([name]) => name !== namespace),
  );
  if (Object.keys(kept).length === 0) delete copy[segment];
  else copy[segment] = kept;
  return canonicalizeV5Extensions(copy);
}

function withoutPrefix(extensions: V5Extensions, prefix: string): V5Extensions {
  const copy = cloneExtensions(extensions);
  for (const segment of Object.keys(copy) as V5Segment[]) {
    const kept = Object.fromEntries(
      Object.entries(copy[segment] ?? {}).filter(([namespace]) => !namespace.startsWith(prefix)),
    );
    if (Object.keys(kept).length === 0) delete copy[segment];
    else copy[segment] = kept;
  }
  return canonicalizeV5Extensions(copy);
}

function loadedArc4(extensions: V5Extensions): OwnershipStateV1 {
  const result = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (result.kind !== 'loaded') throw new Error(`expected Arc 4 fixture, received ${result.kind}`);
  return result.state;
}

function prepared(extensions: V5Extensions): PreparedArc5OwnershipMigrationV2 {
  const result = prepareArc5OwnershipMigration({
    extensions,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (result.kind !== 'prepared') throw new Error(`Arc 5 fixture failed: ${result.kind}`);
  return result;
}

function contents(
  state: OwnershipStateV2,
  overrides: Partial<OwnershipStateContentsV2> = {},
): OwnershipStateContentsV2 {
  return {
    source: ownershipSourceStateV1(state),
    bredAcquisitions: state.bredAcquisitions,
    creatures: state.creatures,
    creatureTombstones: state.creatureTombstones,
    specimenLots: state.specimenLots,
    specimenTombstones: state.specimenTombstones,
    scoutCreatureId: state.scoutCreatureId,
    ...overrides,
  };
}

function mutableSuccessor(parent: OwnershipStateV2, nickname = 'Nova'): OwnershipStateV2 {
  const left = parent.creatures[0]!;
  const changed = createCreatureInstanceV2({ ...left, nickname, xp: (left.xp ?? 0) + 1 });
  return createOwnershipSuccessorV2(parent, contents(parent, {
    creatures: [changed, ...parent.creatures.slice(1)],
  }));
}

function bulkBredSuccessor(parent: OwnershipStateV2, count: number): OwnershipStateV2 {
  const acquisitions = [];
  const children = [];
  const parentIds = [parent.creatures[0]!.creatureId, parent.creatures[1]!.creatureId] as const;
  for (let index = 0; index < count; index++) {
    const receipt = createF4ReceiptEvidenceV2({
      ordinal: index + 1,
      actionKind: BREED_ACTION_KIND_V2,
      witnessDigest: sha256Hex(`persistence-breed-${index}`),
    });
    const genome = {
      seed: 10_000 + index,
      kingdom: 'fauna',
      form: 9,
      gen: 1,
      parents: [11, 22],
    };
    const identity = canonicalGenomeIdentityV1(genome);
    const acquisition = createBredAcquisitionRecordV2({
      speciesId: identity.speciesId,
      parentCreatureIds: parentIds,
      parentSeeds: [11, 22],
      receipt,
    });
    acquisitions.push(acquisition);
    children.push(createBredCreatureInstanceV2({
      acquisition,
      genome,
      generation: 1,
      nickname: `Child ${index}`,
      xp: 0,
      hurt: 0,
      fed: 50,
      brood: 0,
      assignment: null,
      bond: null,
    }));
  }
  return createOwnershipSuccessorV2(parent, contents(parent, {
    bredAcquisitions: acquisitions,
    creatures: [...parent.creatures, ...children],
  }));
}

function withLegacyCertificate(arc4: V5Extensions): V5Extensions {
  const source = loadedArc4(arc4);
  const target = migrateOwnershipStateV1ToV2(source);
  return applyV5ExtensionWrites(arc4, [{
    segment: 'player',
    namespace: ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
    carrier: {
      version: 1,
      json: canonicalJson({
        schema: LEGACY_SCHEMA,
        version: 1,
        sourceSchema: source.schema,
        sourceVersion: source.version,
        sourceRevision: source.revision,
        sourceMode: source.mode,
        sourceDigest: ownershipStateDigestV1(source),
        targetSchema: target.schema,
        targetVersion: target.version,
        targetRevision: target.revision,
        targetMode: target.mode,
        targetDigest: ownershipStateDigestV2(target),
      }),
    },
  }]).extensions;
}

function extensionBytes(extensions: V5Extensions): number {
  let total = 0;
  for (const namespaces of Object.values(extensions)) {
    for (const carrier of Object.values(namespaces)) total += utf8ByteLength(carrier.json);
  }
  return total;
}

function objectJsonOfLength(length: number): string {
  const shell = JSON.stringify({ p: '' }).length;
  const raw = JSON.stringify({ p: 'x'.repeat(length - shell) });
  if (raw.length !== length) throw new Error('padding JSON length changed');
  return raw;
}

function paddingExtensions(bytes: number): V5Extensions {
  const count = Math.ceil(bytes / V5_MAX_EXTENSION_JSON_BYTES);
  const each = Math.floor(bytes / count);
  const remainder = bytes % count;
  const settings: Record<string, V5ExtensionCarrier> = {};
  for (let index = 0; index < count; index++) {
    settings[`arc5-padding.${index}`] = {
      version: 1,
      json: objectJsonOfLength(each + (index < remainder ? 1 : 0)),
    };
  }
  return canonicalizeV5Extensions({ settings });
}

function mutateCarrierJson(
  extensions: V5Extensions,
  segment: V5Segment,
  namespace: string,
  mutate: (value: Record<string, unknown>) => void,
): V5Extensions {
  const carrier = extensions[segment]?.[namespace];
  if (carrier === undefined) throw new Error(`missing carrier ${segment}/${namespace}`);
  const value = JSON.parse(carrier.json) as Record<string, unknown>;
  mutate(value);
  return replace(extensions, segment, namespace, {
    version: carrier.version,
    json: canonicalJson(value),
  });
}

describe('@cf/persistence — Arc 5 compact ownership delta', () => {
  it('keeps all Arc 5 mutation constructors and delta codecs off the public acquisition root', () => {
    for (const internal of [
      'BREED_ACTION_KIND_V2',
      'createF4ReceiptEvidenceV2',
      'createBredAcquisitionRecordV2',
      'createBredCreatureInstanceV2',
      'createCreatureInstanceV2',
      'createOwnershipSuccessorV2',
      'createOwnershipSourceProjectionSuccessorV2',
      'deriveOwnershipDeltaV2',
      'deriveOwnershipDeltaSuccessorV2',
      'applyOwnershipDeltaV2',
      'decodeOwnershipDeltaV2',
      'encodeOwnershipDeltaV2',
      'ownershipDeltaMirrorV2',
      'ownershipDeltaDigestV2',
      'OWNERSHIP_DELTA_SCHEMA_V2',
    ]) expect(internal in acquisitionRoot, internal).toBe(false);
  });

  it('creates the exact five-target zero-delta v2 fixed point from absent authority', () => {
    const callerSource = createEmptyOwnershipStateV1();
    const arc4 = withArc4(baseExtensions(), callerSource);
    const result = prepared(arc4);
    expect(result.writes).toHaveLength(5);
    expect(result.writes.map(({ segment, namespace }) => ({ segment, namespace })))
      .toEqual(ARC5_OWNERSHIP_EXTENSION_TARGETS);
    expect(result.evidence).toMatchObject({
      representationVersion: 2,
      sourceDigest: ownershipStateDigestV1(callerSource),
      targetDigest: ownershipStateDigestV2(result.state),
      deltaRowCount: 0,
      shardCount: 4,
    });
    expect(result.evidence.shardDigests).toHaveLength(4);
    expect(result.state.revision).toBe(callerSource.revision);
    expect(ownershipSourceStateV1(result.state)).not.toBe(callerSource);
    expect(ownershipStateDigestV1(ownershipSourceStateV1(result.state)))
      .toBe(ownershipStateDigestV1(callerSource));
    for (const [index, target] of ARC5_OWNERSHIP_EXTENSION_TARGETS.entries()) {
      const write = result.writes[index]!;
      expect(write).toMatchObject({ ...target, carrier: { version: 2 } });
      expect(utf8ByteLength(write.carrier.json)).toBeLessThanOrEqual(V5_MAX_EXTENSION_JSON_BYTES);
      if (index === 0) continue;
      expect(JSON.parse(write.carrier.json)).toEqual({
        count: 4,
        digest: sha256Hex('[]'),
        end: 0,
        index: index - 1,
        rows: [],
        schema: 'cf-v2-ownership-delta-shard/v1',
        start: 0,
        total: 0,
        version: 2,
      });
    }
    for (const [segment, namespaces] of Object.entries(arc4) as Array<[
      V5Segment,
      Readonly<Record<string, V5ExtensionCarrier>>,
    ]>) {
      for (const [namespace, carrier] of Object.entries(namespaces)) {
        expect(result.extensions[segment]?.[namespace], `${segment}/${namespace}`).toEqual(carrier);
      }
    }
    expect(extensionBytes(result.extensions)).toBeLessThanOrEqual(V5_MAX_EXTENSION_TOTAL_BYTES);

    const read = readArc5OwnershipMigration(
      result.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(read.kind).toBe('loaded');
    if (read.kind !== 'loaded') return;
    expect(read.evidence).toEqual(result.evidence);
    expect(ownershipStateDigestV2(read.state)).toBe(ownershipStateDigestV2(result.state));
    const fixed = prepareArc5OwnershipMigration({
      extensions: result.extensions,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(fixed).toMatchObject({ kind: 'already-loaded', writes: [], evidence: result.evidence });
    if (fixed.kind === 'already-loaded') expect(fixed.extensions).toEqual(result.extensions);
  });

  it('reads aligned v1 evidence distinctly and upgrades it without revision or receipt authority', () => {
    const arc4 = withArc4(baseExtensions(), fixture().source);
    const legacy = withLegacyCertificate(arc4);
    const before = readArc5OwnershipMigration(legacy, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(before.kind).toBe('loaded');
    if (before.kind !== 'loaded') return;
    expect(before.evidence).toEqual({
      representationVersion: 1,
      sourceDigest: ownershipStateDigestV1(ownershipSourceStateV1(before.state)),
      targetDigest: ownershipStateDigestV2(before.state),
    });
    expect('deltaDigest' in before.evidence).toBe(false);

    const upgrade = prepared(legacy);
    expect(upgrade.representationUpgrade).toBe('legacy-v1');
    expect(upgrade.writes).toHaveLength(5);
    expect(upgrade.state.revision).toBe(before.state.revision);
    expect(ownershipStateDigestV2(upgrade.state)).toBe(ownershipStateDigestV2(before.state));
    expect(upgrade.evidence).toMatchObject({ representationVersion: 2, deltaRowCount: 0 });
    const manifest = JSON.parse(upgrade.writes[0].carrier.json) as Record<string, unknown>;
    expect(manifest).not.toHaveProperty('receipt');
    expect(manifest).not.toHaveProperty('ordinal');
    expect(Object.keys(manifest)).toEqual([
      'deltaDigest', 'deltaRowCount', 'deltaSchema', 'deltaVersion', 'fixedShardCount',
      'schema', 'shardDigests', 'sourceDigest', 'sourceMode', 'sourceRevision',
      'sourceSchema', 'sourceVersion', 'targetDigest', 'targetMode', 'targetRevision',
      'targetSchema', 'targetVersion', 'version',
    ]);
    expect(manifest).toMatchObject({
      schema: ARC5_OWNERSHIP_MIGRATION_SCHEMA,
      version: ARC5_OWNERSHIP_MIGRATION_VERSION,
      sourceRevision: before.state.revision,
      targetRevision: before.state.revision,
    });
    const read = readArc5OwnershipMigration(
      upgrade.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(read.kind === 'loaded' ? read.evidence.representationVersion : null).toBe(2);

    const partialV2 = mutateCarrierJson(
      legacy,
      'player',
      ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
      (certificate) => { certificate.version = 2; },
    );
    expect(readArc5OwnershipMigration(
      partialV2,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });
    const futureLegacy = mutateCarrierJson(
      legacy,
      'player',
      ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
      (certificate) => { certificate.version = 3; },
    );
    expect(readArc5OwnershipMigration(
      futureLegacy,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'future-version', version: 3 });
  });

  it('advances an exact Arc 4 source successor with five replacements and O(1) empty shards', () => {
    const initial = prepared(withArc4(baseExtensions(), fixture().source));
    const initialShards = initial.writes.slice(1).map((write) => write.carrier.json);
    const parent = loadedArc4(initial.extensions);
    const extraIdentity = canonicalGenomeIdentityV1({ seed: 33, kingdom: 'fauna', form: 3 });
    const resolved = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
      planet: { seed: 133 },
    });
    if (!resolved.ok) throw new Error(`home address failed: ${resolved.reason}`);
    const extraDiscovery = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'arc5-source-growth') as DiscoveryRecordId,
      speciesId: extraIdentity.speciesId,
      verb: 'tame',
      worldAddress: resolved.address,
      cycle: 1,
      sourceOrdinal: 0,
      firstForSpecies: true,
    });
    const extraCatalog = createCatalogSpeciesV1({
      identity: extraIdentity,
      alias: null,
      firstObservationId: extraDiscovery.recordId,
    });
    const extra = createCreatureInstanceV1({
      creatureId: ownershipContentId('creature', 'arc5-source-growth') as CreatureInstanceId,
      speciesId: extraIdentity.speciesId,
      genomeIdentity: extraIdentity.genomeIdentity,
      genome: extraIdentity.genome,
      nickname: 'Source-grown',
      origin: 'wild',
      acquisitionRecordId: extraDiscovery.recordId,
      lineage: { kind: 'none', generation: 0 },
      xp: null,
      hurt: null,
      fed: 80,
      brood: null,
      assignment: null,
      bond: null,
    });
    const extraProgress = createBiosphereProgressV1({
      worldAddress: resolved.address,
      cycle: 1,
      used: 1,
      successful: [{ speciesId: extraIdentity.speciesId, source: 'tame' }],
    });
    const successor = createOwnershipSuccessorV1(parent, {
      catalogSpecies: [...parent.catalogSpecies, extraCatalog],
      discoveries: [...parent.discoveries, extraDiscovery],
      creatures: [...parent.creatures, extra],
      specimenLots: parent.specimenLots,
      biosphereProgress: [...parent.biosphereProgress, extraProgress],
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    });
    const staged = prepareArc4OwnershipWrite({
      extensions: initial.extensions,
      state: successor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (staged.kind !== 'prepared') throw new Error(`Arc 4 stage failed: ${staged.kind}`);
    const advanced = prepareArc5OwnershipMigrationSuccessor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successorExtensions: staged.extensions,
      successor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(advanced.kind).toBe('prepared');
    if (advanced.kind !== 'prepared') return;
    expect(advanced.writes).toHaveLength(5);
    expect(advanced.evidence.deltaRowCount).toBe(0);
    expect(advanced.state.revision).toBe(initial.state.revision + 1);
    expect(advanced.writes.slice(1).map((write) => write.carrier.json)).toEqual(initialShards);
    expect(advanced.writes[0].carrier.json).not.toBe(initial.writes[0].carrier.json);
    expect(advanced.extensions.settings).toEqual(staged.extensions.settings);
    expect(advanced.extensions.inventory).toEqual(staged.extensions.inventory);
    const read = readArc5OwnershipMigration(
      advanced.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(read.kind === 'loaded' ? read.evidence : null).toEqual(advanced.evidence);
  });

  it('persists one exact registered V2-only +1, reconstructs it, and rejects nonchildren', () => {
    const initial = prepared(withArc4(baseExtensions(), fixture().source));
    const target = mutableSuccessor(initial.state);
    const first = prepareArc5OwnershipV2Successor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successor: target,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(first.kind).toBe('prepared');
    if (first.kind !== 'prepared') return;
    expect(first.writes).toHaveLength(5);
    expect(first.evidence).toMatchObject({ representationVersion: 2, deltaRowCount: 1 });
    expect(first.state.revision).toBe(initial.state.revision + 1);
    expect(ownershipStateDigestV1(ownershipSourceStateV1(first.state)))
      .toBe(ownershipStateDigestV1(ownershipSourceStateV1(initial.state)));
    const rowShard = JSON.parse(first.writes[1].carrier.json) as {
      rows: Array<Record<string, unknown>>;
    };
    expect(rowShard.rows).toEqual([expect.objectContaining({
      kind: 'source-creature-live',
      creatureId: initial.state.creatures[0]!.creatureId,
      nickname: 'Nova',
      xp: 1,
    })]);
    expect(rowShard.rows[0]).not.toHaveProperty('genome');
    expect(rowShard.rows[0]).not.toHaveProperty('speciesId');
    for (const write of first.writes.slice(2)) {
      expect((JSON.parse(write.carrier.json) as { rows: unknown[] }).rows).toEqual([]);
    }
    const read = readArc5OwnershipMigration(first.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(read.kind).toBe('loaded');
    if (read.kind === 'loaded') {
      expect(ownershipStateDigestV2(read.state)).toBe(ownershipStateDigestV2(target));
      expect(read.evidence).toEqual(first.evidence);
    }
    const repeat = prepareArc5OwnershipV2Successor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successor: target,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(repeat.kind === 'prepared' ? repeat.writes : null).toEqual(first.writes);

    expect(prepareArc5OwnershipV2Successor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successor: initial.state,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toMatchObject({ kind: 'protected', reason: 'successor-conflict' });
    const otherParent = migrateOwnershipStateV1ToV2(fixture().source);
    const otherTarget = mutableSuccessor(otherParent, 'Other');
    expect(prepareArc5OwnershipV2Successor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successor: otherTarget,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toMatchObject({ kind: 'protected', reason: 'successor-conflict' });
  });

  it('packs a large delta into deterministic consecutive byte-fit shards within both limits', () => {
    const initial = prepared(withArc4({}, fixture().source));
    const target = bulkBredSuccessor(initial.state, 350);
    const result = prepareArc5OwnershipV2Successor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successor: target,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(result.kind).toBe('prepared');
    if (result.kind !== 'prepared') return;
    expect(result.evidence.deltaRowCount).toBe(700);
    const shards = result.writes.slice(1).map((write) => (
      JSON.parse(write.carrier.json) as {
        start: number;
        end: number;
        total: number;
        digest: string;
        rows: unknown[];
      }
    ));
    expect(shards.filter((shard) => shard.rows.length > 0).length).toBeGreaterThan(1);
    let start = 0;
    for (const [index, shard] of shards.entries()) {
      expect(shard.start, `start ${index}`).toBe(start);
      expect(shard.end - shard.start, `length ${index}`).toBe(shard.rows.length);
      expect(shard.total, `total ${index}`).toBe(700);
      expect(result.writes[index + 1]!.carrier.json.length).toBeLessThanOrEqual(
        V5_MAX_EXTENSION_JSON_BYTES,
      );
      expect(utf8ByteLength(result.writes[index + 1]!.carrier.json)).toBeLessThanOrEqual(
        V5_MAX_EXTENSION_JSON_BYTES,
      );
      start = shard.end;
      if (index >= ARC5_OWNERSHIP_FIXED_SHARDS - 1 || shard.end >= shard.total) continue;
      const nextRow = shards[index + 1]!.rows[0]!;
      const overflowingRows = [...shard.rows, nextRow];
      const overflowing = canonicalJson({
        count: 4,
        digest: sha256Hex(canonicalJson(overflowingRows)),
        end: shard.end + 1,
        index,
        rows: overflowingRows,
        schema: 'cf-v2-ownership-delta-shard/v1',
        start: shard.start,
        total: shard.total,
        version: 2,
      });
      expect(utf8ByteLength(overflowing), `greedy boundary ${index}`)
        .toBeGreaterThan(V5_MAX_EXTENSION_JSON_BYTES);
    }
    expect(start).toBe(700);
    expect(extensionBytes(result.extensions)).toBeLessThanOrEqual(V5_MAX_EXTENSION_TOTAL_BYTES);
    const repeat = prepareArc5OwnershipV2Successor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successor: target,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(repeat.kind === 'prepared' ? repeat.writes : null).toEqual(result.writes);
  }, 30_000);

  it('replaces every empty tail when an Arc 4 successor absorbs a former delta row', () => {
    const initial = prepared(withArc4(baseExtensions(), fixture().source));
    const v2Target = mutableSuccessor(initial.state);
    const v2 = prepareArc5OwnershipV2Successor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successor: v2Target,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (v2.kind !== 'prepared') throw new Error(`V2 stage failed: ${v2.kind}`);
    expect(v2.evidence.deltaRowCount).toBe(1);
    expect((JSON.parse(v2.writes[1].carrier.json) as { rows: unknown[] }).rows).toHaveLength(1);

    const sourceParent = loadedArc4(v2.extensions);
    const left = sourceParent.creatures[0]!;
    const changed = createCreatureInstanceV1({ ...left, nickname: 'Nova', xp: 1 });
    const sourceSuccessor = createOwnershipSuccessorV1(sourceParent, {
      catalogSpecies: sourceParent.catalogSpecies,
      discoveries: sourceParent.discoveries,
      creatures: [changed, ...sourceParent.creatures.slice(1)],
      specimenLots: sourceParent.specimenLots,
      biosphereProgress: sourceParent.biosphereProgress,
      legacyBioX: sourceParent.legacyBioX,
      scoutCreatureId: sourceParent.scoutCreatureId,
    });
    const staged = prepareArc4OwnershipWrite({
      extensions: v2.extensions,
      state: sourceSuccessor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (staged.kind !== 'prepared') throw new Error(`Arc 4 stage failed: ${staged.kind}`);
    const absorbed = prepareArc5OwnershipMigrationSuccessor({
      baseExtensions: v2.extensions,
      parent: v2.state,
      successorExtensions: staged.extensions,
      successor: sourceSuccessor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(absorbed.kind).toBe('prepared');
    if (absorbed.kind !== 'prepared') return;
    expect(absorbed.writes).toHaveLength(5);
    expect(absorbed.evidence.deltaRowCount).toBe(0);
    expect(absorbed.writes.slice(1).map((write) => write.carrier.json))
      .toEqual(initial.writes.slice(1).map((write) => write.carrier.json));
    expect(absorbed.extensions.creatures?.[`${ARC5_OWNERSHIP_DELTA_PREFIX}0`])
      .not.toEqual(v2.extensions.creatures?.[`${ARC5_OWNERSHIP_DELTA_PREFIX}0`]);
  });

  it('verifies exact prepared postcommit bytes and refuses legacy, partial, swapped, or forged proof', () => {
    const arc4 = withArc4(baseExtensions(), fixture().source);
    const result = prepared(arc4);
    const committed = committedArc5OwnershipState(
      result,
      result.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(committed?.evidence).toEqual(result.evidence);
    expect(committed && ownershipStateDigestV2(committed.state))
      .toBe(ownershipStateDigestV2(result.state));

    const target = ARC5_OWNERSHIP_EXTENSION_TARGETS[1];
    const changed = mutateCarrierJson(
      result.extensions,
      target.segment,
      target.namespace,
      (shard) => { shard.digest = '0'.repeat(64); },
    );
    expect(committedArc5OwnershipState(
      result,
      changed,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toBeNull();
    expect(committedArc5OwnershipState(
      result,
      withLegacyCertificate(arc4),
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toBeNull();
    expect(committedArc5OwnershipState({
      ...result,
      writes: [result.writes[0], result.writes[2], result.writes[1], ...result.writes.slice(3)],
    }, result.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toBeNull();
    expect(committedArc5OwnershipState({
      ...result,
      evidence: { ...result.evidence, targetDigest: 'f'.repeat(64) },
    }, result.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toBeNull();
  });

  it('fails closed on every partial, extra, misplaced, future, and source-drifted inventory', () => {
    const result = prepared(withArc4(baseExtensions(), fixture().source));
    for (const target of ARC5_OWNERSHIP_EXTENSION_TARGETS) {
      const partial = remove(result.extensions, target.segment, target.namespace);
      expect(prepareArc5OwnershipMigration({
        extensions: partial,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), `partial ${target.namespace}`).toEqual({ kind: 'protected', reason: 'target-corrupt' });
      expect(readArc5OwnershipMigration(
        partial,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      ), `partial read ${target.namespace}`).toEqual({ kind: 'corrupt' });
    }

    const extra = replace(result.extensions, 'creatures', `${ARC5_OWNERSHIP_DELTA_PREFIX}4`, {
      version: 2,
      json: '{}',
    });
    expect(prepareArc5OwnershipMigration({
      extensions: extra,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    const shard = result.extensions.creatures![`${ARC5_OWNERSHIP_DELTA_PREFIX}0`]!;
    const misplaced = replace(
      remove(result.extensions, 'creatures', `${ARC5_OWNERSHIP_DELTA_PREFIX}0`),
      'catalog',
      `${ARC5_OWNERSHIP_DELTA_PREFIX}0`,
      shard,
    );
    expect(readArc5OwnershipMigration(
      misplaced,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });
    const legacyPlusShard = applyV5ExtensionWrites(
      withLegacyCertificate(withArc4(baseExtensions(), fixture().source)),
      [result.writes[1]],
    ).extensions;
    expect(readArc5OwnershipMigration(
      legacyPlusShard,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });

    for (const target of ARC5_OWNERSHIP_EXTENSION_TARGETS) {
      const carrier = result.extensions[target.segment]![target.namespace]!;
      const future = replace(result.extensions, target.segment, target.namespace, {
        ...carrier,
        version: 3,
      });
      expect(readArc5OwnershipMigration(
        future,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      ), `future ${target.namespace}`).toEqual({ kind: 'future-version', version: 3 });
      expect(prepareArc5OwnershipMigration({
        extensions: future,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), `future prepare ${target.namespace}`).toEqual({
        kind: 'protected', reason: 'target-future', version: 3,
      });
    }

    const parent = loadedArc4(result.extensions);
    const next = createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries,
      creatures: parent.creatures,
      specimenLots: parent.specimenLots,
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    });
    const advanced = prepareArc4OwnershipWrite({
      extensions: result.extensions,
      state: next,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (advanced.kind !== 'prepared') throw new Error(`Arc 4 advance failed: ${advanced.kind}`);
    expect(prepareArc5OwnershipMigration({
      extensions: advanced.extensions,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'source-drift' });
    expect(readArc5OwnershipMigration(
      advanced.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });
  });

  it('rejects noncanonical bytes and independently mutated manifest/shard fields', () => {
    const result = prepared(withArc4(baseExtensions(), fixture().source));
    const manifestCases: Array<readonly [string, (row: Record<string, unknown>) => void, string]> = [
      ['schema', (row) => { row.schema = 'wrong'; }, 'target-corrupt'],
      ['source digest', (row) => { row.sourceDigest = '0'.repeat(64); }, 'source-drift'],
      ['source revision', (row) => { row.sourceRevision = 7; }, 'source-drift'],
      ['target digest', (row) => { row.targetDigest = '1'.repeat(64); }, 'target-corrupt'],
      ['target revision', (row) => { row.targetRevision = 7; }, 'target-corrupt'],
      ['delta digest', (row) => { row.deltaDigest = '2'.repeat(64); }, 'target-corrupt'],
      ['delta row count', (row) => { row.deltaRowCount = 1; }, 'target-corrupt'],
      ['fixed shards', (row) => { row.fixedShardCount = 3; }, 'target-corrupt'],
      ['shard digest', (row) => {
        const digests = [...row.shardDigests as string[]];
        digests[0] = '3'.repeat(64);
        row.shardDigests = digests;
      }, 'target-corrupt'],
      ['extra', (row) => { row.extra = true; }, 'target-corrupt'],
      ['missing', (row) => { delete row.deltaDigest; }, 'target-corrupt'],
    ];
    for (const [label, mutate, reason] of manifestCases) {
      const changed = mutateCarrierJson(
        result.extensions,
        'player',
        ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
        mutate,
      );
      expect(prepareArc5OwnershipMigration({
        extensions: changed,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), label).toEqual({ kind: 'protected', reason });
      expect(readArc5OwnershipMigration(
        changed,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      ), `${label} read`).toEqual({ kind: 'corrupt' });
    }

    const shardCases: Array<readonly [string, (row: Record<string, unknown>) => void]> = [
      ['schema', (row) => { row.schema = 'wrong'; }],
      ['index', (row) => { row.index = 1; }],
      ['count', (row) => { row.count = 3; }],
      ['start', (row) => { row.start = 1; }],
      ['end', (row) => { row.end = 1; }],
      ['total', (row) => { row.total = 1; }],
      ['digest', (row) => { row.digest = '4'.repeat(64); }],
      ['rows', (row) => { row.rows = [{}]; }],
      ['extra', (row) => { row.extra = true; }],
      ['missing', (row) => { delete row.rows; }],
    ];
    for (const [label, mutate] of shardCases) {
      const changed = mutateCarrierJson(
        result.extensions,
        'creatures',
        `${ARC5_OWNERSHIP_DELTA_PREFIX}0`,
        mutate,
      );
      expect(prepareArc5OwnershipMigration({
        extensions: changed,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), label).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    }

    const manifestCarrier = result.extensions.player![ARC5_OWNERSHIP_MIGRATION_NAMESPACE]!;
    const pretty = replace(result.extensions, 'player', ARC5_OWNERSHIP_MIGRATION_NAMESPACE, {
      version: manifestCarrier.version,
      json: JSON.stringify(JSON.parse(manifestCarrier.json), null, 2),
    });
    expect(prepareArc5OwnershipMigration({
      extensions: pretty,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    const innerFuture = mutateCarrierJson(
      result.extensions,
      'player',
      ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
      (row) => { row.version = 3; },
    );
    expect(prepareArc5OwnershipMigration({
      extensions: innerFuture,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-future', version: 3 });
  });

  it('refuses unaligned source-successor inputs before any five-target replacement', () => {
    const arc4Only = withArc4(baseExtensions(), fixture().source);
    const initial = prepared(arc4Only);
    const parent = loadedArc4(initial.extensions);
    const successor = createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries,
      creatures: parent.creatures,
      specimenLots: parent.specimenLots,
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    });
    const staged = prepareArc4OwnershipWrite({
      extensions: initial.extensions,
      state: successor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (staged.kind !== 'prepared') throw new Error(`Arc 4 stage failed: ${staged.kind}`);
    const call = (baseExtensions: unknown, successorExtensions: unknown, state: unknown = successor) => (
      prepareArc5OwnershipMigrationSuccessor({
        baseExtensions,
        parent: initial.state,
        successorExtensions,
        successor: state as OwnershipStateV1,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      })
    );
    expect(call(arc4Only, staged.extensions)).toEqual({ kind: 'protected', reason: 'base-absent' });
    expect(call(withLegacyCertificate(arc4Only), staged.extensions)).toEqual({
      kind: 'protected', reason: 'base-corrupt',
    });
    expect(call(staged.extensions, staged.extensions)).toEqual({
      kind: 'protected', reason: 'base-source-drift',
    });
    expect(call(initial.extensions, withoutPrefix(staged.extensions, ARC4_OWNERSHIP_PREFIX)))
      .toEqual({ kind: 'protected', reason: 'successor-absent' });
    expect(call(initial.extensions, initial.extensions)).toMatchObject({
      kind: 'protected', reason: 'successor-conflict',
    });
    expect(call(initial.extensions, staged.extensions, { ...successor })).toMatchObject({
      kind: 'protected', reason: 'successor-conflict',
    });
    const unrelatedDrift = replace(staged.extensions, 'settings', 'other.settings', {
      version: 5,
      json: '{"changed":true}',
    });
    expect(call(initial.extensions, unrelatedDrift)).toMatchObject({
      kind: 'protected', reason: 'successor-conflict',
    });
  });

  it('fails closed on per-segment, global namespace, and aggregate-byte exhaustion', () => {
    const player: Record<string, V5ExtensionCarrier> = {};
    for (let index = 0; index < 62; index++) {
      player[`padding.${String(index).padStart(2, '0')}`] = { version: 1, json: '{}' };
    }
    const playerFull = withArc4(canonicalizeV5Extensions({ player }), createEmptyOwnershipStateV1());
    expect(Object.keys(playerFull.player ?? {})).toHaveLength(64);
    expect(prepareArc5OwnershipMigration({
      extensions: playerFull,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });

    const namespaceMaps: Partial<Record<V5Segment, Record<string, V5ExtensionCarrier>>> = {};
    const counts: Readonly<Record<V5Segment, number>> = {
      player: 20, creatures: 20, catalog: 20, inventory: 20, settings: 30,
    };
    for (const [segment, count] of Object.entries(counts) as Array<[V5Segment, number]>) {
      const namespaces: Record<string, V5ExtensionCarrier> = {};
      for (let index = 0; index < count; index++) {
        namespaces[`bound.${segment}.${index}`] = { version: 1, json: '{}' };
      }
      namespaceMaps[segment] = namespaces;
    }
    const globalFull = withArc4(
      canonicalizeV5Extensions(namespaceMaps),
      createEmptyOwnershipStateV1(),
    );
    expect(Object.values(globalFull).reduce(
      (total, namespaces) => total + Object.keys(namespaces).length,
      0,
    )).toBe(128);
    expect(prepareArc5OwnershipMigration({
      extensions: globalFull,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });

    const emptyArc4 = withArc4({}, createEmptyOwnershipStateV1());
    const small = prepared(emptyArc4);
    const arc5Bytes = small.writes.reduce(
      (total, write) => total + utf8ByteLength(write.carrier.json),
      0,
    );
    const paddingBytes = V5_MAX_EXTENSION_TOTAL_BYTES
      - extensionBytes(emptyArc4) - arc5Bytes + 1;
    const byteFull = withArc4(paddingExtensions(paddingBytes), createEmptyOwnershipStateV1());
    expect(extensionBytes(byteFull)).toBe(
      V5_MAX_EXTENSION_TOTAL_BYTES - arc5Bytes + 1,
    );
    expect(prepareArc5OwnershipMigration({
      extensions: byteFull,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });
  });

  it('classifies a valid exact child beyond four-shard capacity as extension-bounds', () => {
    const initial = prepared(withArc4({}, fixture().source));
    const oversized = bulkBredSuccessor(initial.state, 1_000);
    expect(prepareArc5OwnershipV2Successor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successor: oversized,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });
  }, 30_000);

  it('classifies Arc4-source successor aggregate exhaustion as extension-bounds', () => {
    const initial = prepared(withArc4({}, fixture().source));
    const sourceParent = loadedArc4(initial.extensions);
    const first = sourceParent.creatures[0]!;
    const changed = createCreatureInstanceV1({ ...first, nickname: 'Arc 4 source growth' });
    const sourceSuccessor = createOwnershipSuccessorV1(sourceParent, {
      catalogSpecies: sourceParent.catalogSpecies,
      discoveries: sourceParent.discoveries,
      creatures: [changed, ...sourceParent.creatures.slice(1)],
      specimenLots: sourceParent.specimenLots,
      biosphereProgress: sourceParent.biosphereProgress,
      legacyBioX: sourceParent.legacyBioX,
      scoutCreatureId: sourceParent.scoutCreatureId,
    });
    const unpaddedArc4 = prepareArc4OwnershipWrite({
      extensions: initial.extensions,
      state: sourceSuccessor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (unpaddedArc4.kind !== 'prepared') throw new Error('source fixture did not stage');
    const unpaddedArc5 = prepareArc5OwnershipMigrationSuccessor({
      baseExtensions: initial.extensions,
      parent: initial.state,
      successorExtensions: unpaddedArc4.extensions,
      successor: sourceSuccessor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (unpaddedArc5.kind !== 'prepared') throw new Error('source fixture did not encode');
    expect(extensionBytes(unpaddedArc5.extensions))
      .toBeGreaterThan(extensionBytes(unpaddedArc4.extensions));

    const paddingBytes = V5_MAX_EXTENSION_TOTAL_BYTES - extensionBytes(unpaddedArc4.extensions);
    const padding = paddingExtensions(paddingBytes);
    const initialCopy = cloneExtensions(initial.extensions);
    const paddedInitial = canonicalizeV5Extensions({
      ...initialCopy,
      settings: { ...(initialCopy.settings ?? {}), ...(padding.settings ?? {}) },
    });
    const paddedArc4 = prepareArc4OwnershipWrite({
      extensions: paddedInitial,
      state: sourceSuccessor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(paddedArc4.kind).toBe('prepared');
    if (paddedArc4.kind !== 'prepared') return;
    expect(extensionBytes(paddedArc4.extensions)).toBe(V5_MAX_EXTENSION_TOTAL_BYTES);
    expect(prepareArc5OwnershipMigrationSuccessor({
      baseExtensions: paddedInitial,
      parent: initial.state,
      successorExtensions: paddedArc4.extensions,
      successor: sourceSuccessor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });
  });

  it('rejects hostile extension and input reflection shapes without observing getters', () => {
    const arc4 = withArc4(baseExtensions(), createEmptyOwnershipStateV1());
    let reads = 0;
    const accessor = Object.defineProperty({}, 'player', {
      enumerable: true,
      get: () => { reads++; return {}; },
    });
    expect(prepareArc5OwnershipMigration({
      extensions: accessor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    expect(readArc5OwnershipMigration(
      accessor,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });
    expect(reads).toBe(0);

    const cycle: Record<string, unknown> = {};
    cycle.player = cycle;
    const inherited = Object.create({ player: {} }) as unknown;
    const hidden = Object.defineProperty({}, 'player', { enumerable: false, value: {} });
    const throwing = new Proxy({}, { ownKeys: () => { throw new Error('trap'); } });
    for (const [label, extensions] of [
      ['array', []],
      ['cycle', cycle],
      ['inherited', inherited],
      ['hidden', hidden],
      ['symbol', { [Symbol('extension')]: true }],
      ['proxy', throwing],
    ] as const) {
      expect(prepareArc5OwnershipMigration({
        extensions,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), label).toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    }

    let inputReads = 0;
    const inputAccessor = Object.defineProperty(
      { resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER },
      'extensions',
      { enumerable: true, get: () => { inputReads++; return arc4; } },
    );
    for (const [label, input] of [
      ['accessor', inputAccessor],
      ['missing', { extensions: arc4 }],
      ['extra', { extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER, extra: true }],
      ['array', Object.assign([], {
        extensions: arc4,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      })],
    ] as const) {
      expect(prepareArc5OwnershipMigration(input as never), label)
        .toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    }
    expect(inputReads).toBe(0);
    const nullPrototype = Object.assign(Object.create(null) as Record<string, unknown>, {
      extensions: arc4,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(prepareArc5OwnershipMigration(nullPrototype as never).kind).toBe('prepared');
  });
});
