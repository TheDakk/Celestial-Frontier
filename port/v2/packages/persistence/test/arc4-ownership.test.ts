import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  MAX_OWNERSHIP_REVISION,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createBiosphereProgressV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyBioXEvidenceV1,
  createOwnershipSuccessorV1,
  createSpecimenLotV1,
  createWorldDiscoveryRecordV1,
  decodeOwnershipStateV1,
  encodeOwnershipStateV1,
  ownershipContentId,
  utf8ByteLength,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC4_OWNERSHIP_FIXED_SHARDS,
  ARC4_OWNERSHIP_MANIFEST_NAMESPACE,
  ARC4_OWNERSHIP_PREFIX,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  canonicalizeV5Extensions,
  encodeArc4Ownership,
  migrateLegacyOwnership,
  prepareArc4OwnershipLegacyMigration,
  prepareArc4OwnershipWrite,
  projectLegacyOwnershipMirror,
  readArc4Ownership,
  type CodexEntry,
  type SaveStateV2,
  type V5ExtensionCarrier,
  type V5Extensions,
  type V5Segment,
} from '../src/index.js';

type Legacy = Pick<SaveStateV2, 'EPOCH_BASE' | 'codex' | 'customNames' | 'bioX' | 'scoutId'>;

beforeAll(() => installCaptureHooks());

function entry(
  id: string,
  g: Record<string, unknown>,
  from = 'Earth',
  where: Record<string, unknown> | null = null,
): CodexEntry {
  return {
    id, name: id, kind: String(g.kingdom ?? 'Unknown'), tier: null,
    realm: 'Unknown', sapient: 0, from, hybrid: Array.isArray(g.parents), g, where,
  };
}

function legacyFixture(): Legacy {
  return {
    EPOCH_BASE: 10,
    codex: [
      ['s1', entry('s1', {
        seed: 1, kingdom: 'fauna', form: 1, gen: 2, parents: [5, 6],
        xp: 42, hurt: 0.2, fed: 11, brood: 12,
      }, 'Earth', { type: 'planet', pseed: 133 })],
      ['s2', entry('s2', { seed: 2, kingdom: 'flora', form: 1 }, 'Mars')],
      ['s3', entry('s3', { seed: 3, kingdom: 'fungi', form: 1 }, 'Io')],
      ['s4', entry('s4', { seed: 4, kingdom: 'microbe', form: 1 }, 'Europa')],
      ['s5', entry('s5', { seed: 5, kingdom: 'fauna', form: 2 }, 'Titan')],
    ],
    customNames: [['cs1', 'Catalogue One'], ['cs5', 'Catalogue Five']],
    bioX: [[133, [2, 9]], [144, [3, 10]], [155, [4, 11]]],
    scoutId: 's1',
  };
}

function baseExtensions(): V5Extensions {
  return canonicalizeV5Extensions({
    player: {
      'f4.authority': { version: 1, json: '{"keep":"player"}' },
      'future.player': { version: 88, json: '{"opaque":true}' },
    },
    inventory: { 'other.inventory': { version: 2, json: '{"keep":"inventory"}' } },
    settings: { 'arc9.settings': { version: 4, json: '{"keep":"settings"}' } },
  });
}

function cloneExtensions(extensions: V5Extensions): Partial<Record<V5Segment, Record<string, V5ExtensionCarrier>>> {
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

function remove(extensions: V5Extensions, segment: V5Segment, namespace: string): V5Extensions {
  const copy = cloneExtensions(extensions);
  const filtered = Object.fromEntries(Object.entries(copy[segment] ?? {}).filter(([name]) => name !== namespace));
  if (Object.keys(filtered).length === 0) delete copy[segment];
  else copy[segment] = filtered;
  return canonicalizeV5Extensions(copy);
}

function loaded(extensions: V5Extensions): OwnershipStateV1 {
  const read = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (read.kind !== 'loaded') throw new Error(`expected loaded Arc 4 state, received ${read.kind}`);
  return read.state;
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
    settings[`test.arc4-pad-${index}`] = {
      version: 99,
      json: objectJsonOfLength(each + (index < remainder ? 1 : 0)),
    };
  }
  return canonicalizeV5Extensions({ settings });
}

describe('@cf/persistence — strict sharded Arc 4 ownership', () => {
  it('migrates exactly, writes all fixed shards, reads a fixed point, and preserves unrelated namespaces', () => {
    const base = baseExtensions();
    const prepared = prepareArc4OwnershipLegacyMigration({
      extensions: base, legacy: legacyFixture(), resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.migration).toBe('migrated');
    expect(prepared.writes).toHaveLength(2 + 4 * ARC4_OWNERSHIP_FIXED_SHARDS);
    expect(prepared.writes.map(({ segment, namespace }) => ({ segment, namespace }))).toEqual(
      ARC4_OWNERSHIP_EXTENSION_TARGETS,
    );
    expect(prepared.extensions.settings).toEqual(base.settings);
    expect(prepared.extensions.player?.['future.player']).toEqual(base.player?.['future.player']);
    expect(prepared.extensions.inventory?.['other.inventory']).toEqual(base.inventory?.['other.inventory']);
    for (const write of prepared.writes) {
      expect(utf8ByteLength(write.carrier.json)).toBeLessThanOrEqual(V5_MAX_EXTENSION_JSON_BYTES);
      expect(JSON.stringify(JSON.parse(write.carrier.json))).not.toBe('');
    }
    const state = loaded(prepared.extensions);
    expect(state).toMatchObject({ revision: 0, mode: 'current' });
    expect(state.catalogSpecies).toHaveLength(5);
    expect(state.creatures).toHaveLength(2);
    expect(state.specimenLots).toHaveLength(3);
    expect(state.scoutCreatureId).not.toBeNull();
    const fixed = encodeArc4Ownership(state);
    expect(fixed.writes.map((write) => write.carrier)).toEqual(prepared.writes.map((write) => write.carrier));
  });

  it('projects the exact legacy ownership mirror while keeping alias and fauna nickname independent', () => {
    const migrated = migrateLegacyOwnership(legacyFixture());
    expect(migrated.kind).toBe('migrated');
    if (migrated.kind !== 'migrated') return;
    const creature = migrated.state.creatures.find((row) => row.nickname === 'Catalogue One')!;
    const renamedCreature = createCreatureInstanceV1({ ...creature, nickname: 'Milo' });
    const changed = createOwnershipSuccessorV1(migrated.state, {
      catalogSpecies: migrated.state.catalogSpecies,
      discoveries: migrated.state.discoveries,
      creatures: migrated.state.creatures.map((row) => (
        row.creatureId === creature.creatureId ? renamedCreature : row
      )),
      specimenLots: migrated.state.specimenLots,
      biosphereProgress: migrated.state.biosphereProgress,
      legacyBioX: migrated.state.legacyBioX,
      scoutCreatureId: migrated.state.scoutCreatureId,
    });
    const mirror = projectLegacyOwnershipMirror(changed);
    expect(mirror.kind).toBe('projected');
    if (mirror.kind !== 'projected') return;
    expect(mirror.codex).toHaveLength(5);
    expect(mirror.customNames).toContainEqual(['cs1', 'Catalogue One']);
    expect(changed.creatures.find((row) => row.creatureId === creature.creatureId)?.nickname).toBe('Milo');
    expect(mirror.scoutId).toBe('s1');
    expect(mirror.bioX).toEqual(legacyFixture().bioX);
    expect(mirror.codex.find((row) => row.legacyCodexId === 's1')).toMatchObject({
      f: 'Earth', w: { type: 'planet', pseed: 133 },
      g: { gen: 2, xp: 42, hurt: 0.2, fed: 11, brood: 12, parents: [5, 6] },
    });
    expect(Object.isFrozen(mirror.codex)).toBe(true);
    expect(() => (mirror.codex as Array<unknown>).push('mutate')).toThrow();
    expect(migrated.state.catalogSpecies[0]).toBeDefined();
  });

  it('projects new world catalogue and Biosphere authority and refuses leaf-seed collisions', () => {
    const resolved = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
      planet: { seed: 133 },
    });
    if (!resolved.ok) throw new Error(`home address failed: ${resolved.reason}`);
    const identity = canonicalGenomeIdentityV1({ seed: 101, kingdom: 'flora', form: 3 });
    const discovery = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'world-projection') as DiscoveryRecordId,
      speciesId: identity.speciesId,
      verb: 'scavenge',
      worldAddress: resolved.address,
      cycle: 4,
      sourceOrdinal: 12,
      firstForSpecies: true,
    });
    const species = createCatalogSpeciesV1({
      identity, alias: 'Greenwake', firstObservationId: discovery.recordId,
    });
    const specimen = createSpecimenLotV1({
      lotId: ownershipContentId('specimen', 'world-projection') as SpecimenLotId,
      speciesId: identity.speciesId,
      kind: 'flora',
      quantity: 1,
      origin: 'wild',
      acquisitionRecordId: discovery.recordId,
    });
    const progress = createBiosphereProgressV1({
      worldAddress: resolved.address,
      cycle: 4,
      used: 1,
      successful: [{ speciesId: identity.speciesId, source: 'scavenge' }],
    });
    const state = createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [discovery], creatures: [],
      specimenLots: [specimen], biosphereProgress: [progress], legacyBioX: [], scoutCreatureId: null,
    });
    const mirror = projectLegacyOwnershipMirror(state);
    expect(mirror.kind).toBe('projected');
    if (mirror.kind !== 'projected') throw new Error('world projection became unavailable');
    expect(mirror.codex).toEqual([expect.objectContaining({
      legacyCodexId: 's101',
      f: 'Canonical world 133',
      w: expect.objectContaining({ type: 'planet', pseed: 133 }),
    })]);
    expect(mirror.customNames).toEqual([['cs101', 'Greenwake']]);
    expect(mirror.bioX).toEqual([[133, [1, 4]]]);

    const collisionState = createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [discovery], creatures: [],
      specimenLots: [specimen], biosphereProgress: [progress],
      legacyBioX: [createLegacyBioXEvidenceV1({
        legacyPlanetSeed: 133, used: 2, epochStamp: 3,
        relation: 'old', canonicalWorldKey: null,
      })],
      scoutCreatureId: null,
    });
    expect(projectLegacyOwnershipMirror(collisionState)).toMatchObject({
      kind: 'unrepresentable', reason: 'biosphere-seed-collision', leafSeed: 133,
    });

    const collidingIdentity = canonicalGenomeIdentityV1({ seed: 101, kingdom: 'flora', form: 4 });
    const collidingDiscovery = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'codex-seed-collision') as DiscoveryRecordId,
      speciesId: collidingIdentity.speciesId,
      verb: 'scavenge',
      worldAddress: resolved.address,
      cycle: 4,
      sourceOrdinal: 13,
      firstForSpecies: true,
    });
    const collidingSpecies = createCatalogSpeciesV1({
      identity: collidingIdentity, alias: null, firstObservationId: collidingDiscovery.recordId,
    });
    const collidingSpecimen = createSpecimenLotV1({
      lotId: ownershipContentId('specimen', 'codex-seed-collision') as SpecimenLotId,
      speciesId: collidingIdentity.speciesId,
      kind: 'flora', quantity: 1, origin: 'wild',
      acquisitionRecordId: collidingDiscovery.recordId,
    });
    const codexCollision = createInitialOwnershipStateV1({
      catalogSpecies: [species, collidingSpecies],
      discoveries: [discovery, collidingDiscovery],
      creatures: [], specimenLots: [specimen, collidingSpecimen],
      biosphereProgress: [createBiosphereProgressV1({
        worldAddress: resolved.address, cycle: 4, used: 2,
        successful: [
          { speciesId: identity.speciesId, source: 'scavenge' },
          { speciesId: collidingIdentity.speciesId, source: 'scavenge' },
        ],
      })],
      legacyBioX: [], scoutCreatureId: null,
    });
    expect(projectLegacyOwnershipMirror(codexCollision)).toMatchObject({
      kind: 'unrepresentable', reason: 'codex-seed-collision', leafSeed: 101,
    });
  });

  it('refuses a legacy field scout that is missing or not living fauna', () => {
    const nonFauna = { ...legacyFixture(), scoutId: 's2' };
    expect(migrateLegacyOwnership(nonFauna)).toEqual({ kind: 'refused', reason: 'legacy-corrupt' });
    expect(migrateLegacyOwnership({ ...legacyFixture(), scoutId: 'missing' })).toEqual({
      kind: 'refused', reason: 'legacy-corrupt',
    });
    expect(prepareArc4OwnershipLegacyMigration({
      extensions: baseExtensions(),
      legacy: nonFauna,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'legacy-corrupt' });
  });

  it('rejects future, missing, unknown, corrupt, duplicate, and out-of-range shard bytes', () => {
    const prepared = prepareArc4OwnershipLegacyMigration({
      extensions: {}, legacy: legacyFixture(), resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (prepared.kind !== 'prepared') throw new Error(`fixture failed: ${prepared.kind}`);
    const manifest = prepared.extensions.player![ARC4_OWNERSHIP_MANIFEST_NAMESPACE]!;
    expect(readArc4Ownership(replace(prepared.extensions, 'player', ARC4_OWNERSHIP_MANIFEST_NAMESPACE, {
      ...manifest, version: 2,
    }), SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'future-version', version: 2 });
    const last = ARC4_OWNERSHIP_EXTENSION_TARGETS.at(-1)!;
    expect(readArc4Ownership(remove(prepared.extensions, last.segment, last.namespace), SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
    expect(readArc4Ownership(replace(prepared.extensions, 'catalog', `${ARC4_OWNERSHIP_PREFIX}extra`, {
      version: 1, json: '{}',
    }), SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });

    const target = prepared.writes.find((write) => write.namespace === 'arc4.ownership.catalog.0')!;
    const shard = JSON.parse(target.carrier.json) as Record<string, unknown>;
    const rows = shard.rows as unknown[];
    const duplicate = { ...shard, rows: [...rows, rows[0]] };
    expect(readArc4Ownership(replace(prepared.extensions, target.segment, target.namespace, {
      version: 1, json: JSON.stringify(duplicate, Object.keys(duplicate).sort()),
    }), SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
    const badRange = { ...shard, start: 1 };
    expect(readArc4Ownership(replace(prepared.extensions, target.segment, target.namespace, {
      version: 1, json: JSON.stringify(badRange, Object.keys(badRange).sort()),
    }), SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
  });

  it('enforces registered +1 authority, rejects same/skip/clone writes, and replaces every fixed shard', () => {
    const bootstrap = prepareArc4OwnershipLegacyMigration({
      extensions: {}, legacy: legacyFixture(), resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (bootstrap.kind !== 'prepared') throw new Error(`fixture failed: ${bootstrap.kind}`);
    const parent = loaded(bootstrap.extensions);
    const keptCreature = parent.creatures[0]!;
    const removedCreature = parent.creatures.find((row) => row !== keptCreature)!;
    expect(() => createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries,
      creatures: [keptCreature],
      specimenLots: parent.specimenLots,
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId === keptCreature.creatureId ? keptCreature.creatureId : null,
    })).toThrow(/required owned row|future tombstone schema/u);
    const next = createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries,
      creatures: parent.creatures,
      specimenLots: parent.specimenLots,
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    });
    const deletionMirror = projectLegacyOwnershipMirror(next);
    expect(deletionMirror.kind).toBe('projected');
    if (deletionMirror.kind !== 'projected') throw new Error('legacy deletion mirror became unavailable');
    expect(deletionMirror.codex.some((row) => (
      row.legacyCodexId === `s${parent.catalogSpecies.find(
        (species) => species.speciesId === removedCreature.speciesId,
      )!.genome.seed}`
    ))).toBe(true);
    const prepared = prepareArc4OwnershipWrite({
      extensions: bootstrap.extensions, state: next, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.writes).toHaveLength(ARC4_OWNERSHIP_EXTENSION_TARGETS.length);
    expect(loaded(prepared.extensions).creatures).toHaveLength(2);
    expect(prepared.writes.filter((write) => write.namespace.startsWith('arc4.ownership.creatures.')))
      .toHaveLength(ARC4_OWNERSHIP_FIXED_SHARDS);
    expect(prepared.writes.filter((write) => write.namespace.startsWith('arc4.ownership.creatures.'))
      .map((write) => write.carrier.json).join('\n')).toContain(removedCreature.creatureId);

    expect(prepareArc4OwnershipWrite({
      extensions: bootstrap.extensions, state: parent, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toMatchObject({ kind: 'protected', reason: 'revision-conflict', expectedRevision: 1, actualRevision: 0 });
    const skipped = createOwnershipSuccessorV1(next, {
      catalogSpecies: next.catalogSpecies, discoveries: next.discoveries, creatures: next.creatures,
      specimenLots: next.specimenLots, biosphereProgress: next.biosphereProgress,
      legacyBioX: next.legacyBioX, scoutCreatureId: next.scoutCreatureId,
    });
    expect(prepareArc4OwnershipWrite({
      extensions: bootstrap.extensions, state: skipped, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toMatchObject({ kind: 'protected', reason: 'revision-conflict', expectedRevision: 1, actualRevision: 2 });
    expect(prepareArc4OwnershipWrite({
      extensions: bootstrap.extensions, state: { ...next }, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toMatchObject({ kind: 'protected', reason: 'state-unreadable' });
  });

  it('protects terminal revision exhaustion', () => {
    const migrated = migrateLegacyOwnership(legacyFixture());
    if (migrated.kind !== 'migrated') throw new Error(`fixture failed: ${migrated.kind}`);
    const parsed = JSON.parse(encodeOwnershipStateV1(migrated.state)) as Record<string, unknown>;
    parsed.revision = MAX_OWNERSHIP_REVISION;
    const terminal = decodeOwnershipStateV1(JSON.stringify(parsed), SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    const extensions = encodeArc4Ownership(terminal).extensions;
    expect(prepareArc4OwnershipWrite({
      extensions, state: terminal, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toMatchObject({
      kind: 'protected', reason: 'revision-exhausted', actualRevision: MAX_OWNERSHIP_REVISION,
    });
  });

  it('fails closed on descriptor/prototype/symbol/cycle/accessor/proxy extension boundaries', () => {
    let reads = 0;
    const accessor = Object.defineProperty({}, 'player', {
      enumerable: true,
      get: () => { reads++; return {}; },
    });
    expect(readArc4Ownership(accessor as V5Extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
    expect(reads).toBe(0);
    expect(readArc4Ownership({ [Symbol('x')]: 1 } as V5Extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
    expect(readArc4Ownership(Object.create({ player: {} }) as V5Extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
    const hidden = Object.defineProperty({}, 'player', { enumerable: false, value: {} });
    expect(readArc4Ownership(hidden as V5Extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
    const cycle: Record<string, unknown> = {};
    cycle.player = cycle;
    expect(readArc4Ownership(cycle as V5Extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
    const proxy = new Proxy({}, { ownKeys: () => { throw new Error('trap'); } });
    expect(readArc4Ownership(proxy as V5Extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
  });

  it('refuses aggregate-bound writes without changing unrelated namespaces', () => {
    const migrated = migrateLegacyOwnership(legacyFixture());
    if (migrated.kind !== 'migrated') throw new Error(`fixture failed: ${migrated.kind}`);
    const ownedBytes = encodeArc4Ownership(migrated.state).writes.reduce(
      (sum, write) => sum + utf8ByteLength(write.carrier.json), 0,
    );
    const base = paddingExtensions(V5_MAX_EXTENSION_TOTAL_BYTES - ownedBytes + 1);
    const prepared = prepareArc4OwnershipLegacyMigration({
      extensions: base, legacy: legacyFixture(), resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(prepared).toEqual({ kind: 'protected', reason: 'extension-bounds' });
    expect(base.settings).toBeDefined();
  });

  it('handles all 1,500 sanitized rows wholly or returns explicit non-partial protection evidence', () => {
    const codex: Array<[string, CodexEntry]> = [];
    for (let index = 0; index < 1_500; index++) {
      const id = `s${index + 1000}`;
      const kingdom = (['fauna', 'flora', 'fungi', 'microbe'] as const)[index % 4]!;
      codex.push([id, entry(id, { seed: index + 1000, kingdom, form: index % 7 }, `World ${index}`)]);
    }
    const legacy: Legacy = { EPOCH_BASE: 1, codex, customNames: [], bioX: [], scoutId: null };
    const migration = migrateLegacyOwnership(legacy);
    expect(migration.kind).not.toBe('refused');
    if (migration.kind === 'refused') throw new Error('valid 1,500-row fixture was refused');
    if (migration.kind === 'legacy-protected') {
      expect(migration.state.mode).toBe('legacy-protected');
      expect(migration.sourceEvidence.codexRows).toBe(1_500);
      expect(projectLegacyOwnershipMirror(migration.state)).toEqual({
        kind: 'legacy-protected', sourceEvidence: migration.sourceEvidence,
      });
    } else {
      expect(migration.state.discoveries).toHaveLength(1_500);
      const roundTrip = loaded(encodeArc4Ownership(migration.state).extensions);
      expect(roundTrip.discoveries).toHaveLength(1_500);
    }
  }, 20_000);

  it('returns legacy-protected rather than truncating an otherwise valid oversized expansion', () => {
    const codex: Array<[string, CodexEntry]> = [];
    const padding = 'x'.repeat(1_800);
    for (let index = 0; index < 700; index++) {
      const id = `s${index + 5000}`;
      codex.push([id, entry(id, { seed: index + 5000, kingdom: 'flora', form: index, note: padding })]);
    }
    const migration = migrateLegacyOwnership({
      EPOCH_BASE: 1, codex, customNames: [], bioX: [], scoutId: null,
    });
    expect(migration.kind).toBe('legacy-protected');
    if (migration.kind !== 'legacy-protected') return;
    expect(migration.state).toMatchObject({ mode: 'legacy-protected', catalogSpecies: [], discoveries: [] });
    expect(migration.sourceEvidence).toMatchObject({ codexRows: 700, uniqueSpecies: 700 });
    expect(encodeArc4Ownership(migration.state).writes).toHaveLength(ARC4_OWNERSHIP_EXTENSION_TARGETS.length);
  }, 20_000);
});
