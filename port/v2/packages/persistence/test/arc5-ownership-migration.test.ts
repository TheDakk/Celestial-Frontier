import { describe, expect, it } from 'vitest';
import * as acquisitionRoot from '@cf/domain-acquisition';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  createEmptyOwnershipStateV1,
  createLegacyProtectedOwnershipStateV1,
  createOwnershipSuccessorV1,
  decodeOwnershipStateV2,
  encodeOwnershipStateV2,
  isOwnershipStateV2,
  migrateOwnershipStateV1ToV2,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  ownershipStateMirrorV2,
  registerOwnershipStateMirrorV2,
  utf8ByteLength,
  type OwnershipStateV1,
} from '@cf/domain-acquisition';
import {
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC4_OWNERSHIP_MANIFEST_NAMESPACE,
  ARC4_OWNERSHIP_PREFIX,
  ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
  ARC5_OWNERSHIP_MIGRATION_PREFIX,
  ARC5_OWNERSHIP_MIGRATION_SCHEMA,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  encodeArc4Ownership,
  prepareArc4OwnershipWrite,
  prepareArc5OwnershipMigration,
  readArc4Ownership,
  readArc5OwnershipMigration,
  type PreparedArc5OwnershipMigrationV1,
  type V5ExtensionCarrier,
  type V5Extensions,
  type V5Segment,
} from '../src/index.js';

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

function rawReplace(
  extensions: V5Extensions,
  segment: V5Segment,
  namespace: string,
  carrier: V5ExtensionCarrier,
): unknown {
  const copy = cloneExtensions(extensions);
  copy[segment] = { ...(copy[segment] ?? {}), [namespace]: carrier };
  return copy;
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

function expectCarriersPreserved(before: V5Extensions, after: V5Extensions): void {
  for (const [segment, namespaces] of Object.entries(before) as Array<[
    V5Segment,
    Readonly<Record<string, V5ExtensionCarrier>>,
  ]>) {
    for (const [namespace, carrier] of Object.entries(namespaces)) {
      expect(after[segment]?.[namespace], `${segment}/${namespace}`).toEqual(carrier);
    }
  }
}

function loadedArc4(extensions: V5Extensions): OwnershipStateV1 {
  const result = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (result.kind !== 'loaded') throw new Error(`expected Arc 4 fixture, received ${result.kind}`);
  return result.state;
}

function certified(extensions: V5Extensions): PreparedArc5OwnershipMigrationV1 {
  const result = prepareArc5OwnershipMigration({
    extensions, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (result.kind !== 'prepared') throw new Error(`Arc 5 fixture failed: ${result.kind}`);
  return result;
}

function mutateCertificate(
  extensions: V5Extensions,
  mutate: (certificate: Record<string, unknown>) => void,
): V5Extensions {
  const carrier = extensions.player?.[ARC5_OWNERSHIP_MIGRATION_NAMESPACE];
  if (carrier === undefined) throw new Error('Arc 5 fixture has no certificate');
  const certificate = JSON.parse(carrier.json) as Record<string, unknown>;
  mutate(certificate);
  return replace(extensions, 'player', ARC5_OWNERSHIP_MIGRATION_NAMESPACE, {
    version: carrier.version,
    json: canonicalJson(certificate),
  });
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

function extensionBytes(extensions: V5Extensions): number {
  let total = 0;
  for (const namespaces of Object.values(extensions)) {
    for (const carrier of Object.values(namespaces)) total += utf8ByteLength(carrier.json);
  }
  return total;
}

describe('@cf/persistence — Arc 5 ownership migration certificate', () => {
  it('exports only the V2 codec/read surface from the acquisition package root', () => {
    const state = migrateOwnershipStateV1ToV2(createEmptyOwnershipStateV1());
    const raw = encodeOwnershipStateV2(state);
    const decoded = decodeOwnershipStateV2(raw, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    const registered = registerOwnershipStateMirrorV2(
      ownershipStateMirrorV2(decoded), SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(isOwnershipStateV2(registered)).toBe(true);
    expect(ownershipStateDigestV2(registered)).toBe(ownershipStateDigestV2(state));
    for (const internal of [
      'BREED_ACTION_KIND_V2',
      'LAST_USABLE_F4_RECEIPT_ORDINAL_V2',
      'bredAcquisitionIdV2',
      'localCreatureIdV2',
      'createF4ReceiptEvidenceV2',
      'createBredAcquisitionRecordV2',
      'createBredCreatureInstanceV2',
      'createCreatureInstanceV2',
      'createSpecimenLotV2',
      'createCreatureTombstoneV2',
      'createSpecimenTombstoneV2',
      'createOwnershipSuccessorV2',
      'createOwnershipSourceSuccessorV2',
      'isOwnershipSuccessorV2',
    ]) expect(internal in acquisitionRoot, internal).toBe(false);
  });

  it('adds one digest-only certificate from freshly loaded current Arc 4 authority and is a zero-write fixed point', () => {
    const callerSource = createEmptyOwnershipStateV1();
    const arc4 = withArc4(baseExtensions(), callerSource);
    const prepared = prepareArc5OwnershipMigration({
      extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.writes).toHaveLength(1);
    expect(prepared.writes[0]).toMatchObject({
      segment: 'player', namespace: ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
      carrier: { version: ARC5_OWNERSHIP_MIGRATION_VERSION },
    });
    expectCarriersPreserved(arc4, prepared.extensions);
    expect(ownershipSourceStateV1(prepared.state)).not.toBe(callerSource);
    expect(ownershipStateDigestV1(ownershipSourceStateV1(prepared.state)))
      .toBe(ownershipStateDigestV1(callerSource));
    expect(prepared.state).toMatchObject({
      revision: callerSource.revision,
      mode: 'current',
      bredAcquisitions: [], creatureTombstones: [], specimenTombstones: [],
    });

    const raw = prepared.writes[0]!.carrier.json;
    const certificate = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(certificate)).toEqual([
      'schema', 'sourceDigest', 'sourceMode', 'sourceRevision', 'sourceSchema',
      'sourceVersion', 'targetDigest', 'targetMode', 'targetRevision',
      'targetSchema', 'targetVersion', 'version',
    ]);
    expect(certificate).toMatchObject({
      schema: ARC5_OWNERSHIP_MIGRATION_SCHEMA,
      version: ARC5_OWNERSHIP_MIGRATION_VERSION,
      sourceRevision: callerSource.revision,
      sourceMode: 'current',
      sourceDigest: ownershipStateDigestV1(callerSource),
      targetRevision: prepared.state.revision,
      targetMode: 'current',
      targetDigest: ownershipStateDigestV2(prepared.state),
    });
    expect('source' in certificate).toBe(false);
    expect('target' in certificate).toBe(false);

    const read = readArc5OwnershipMigration(
      prepared.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(read.kind).toBe('loaded');
    if (read.kind !== 'loaded') return;
    expect(ownershipStateDigestV2(read.state)).toBe(ownershipStateDigestV2(prepared.state));
    const fixed = prepareArc5OwnershipMigration({
      extensions: prepared.extensions, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(fixed.kind).toBe('already-loaded');
    if (fixed.kind !== 'already-loaded') return;
    expect(fixed.writes).toEqual([]);
    expect(fixed.extensions).toEqual(prepared.extensions);
    expect(fixed.extensions.player?.[ARC5_OWNERSHIP_MIGRATION_NAMESPACE]?.json).toBe(raw);
  });

  it('certifies legacy-protected authority without manufacturing owned rows', () => {
    const protectedSource = createLegacyProtectedOwnershipStateV1({
      schema: 'cf-v1.8.9-ownership-source/v1',
      digest: 'a'.repeat(64),
      jsonBytes: 123,
      codexRows: 9,
      uniqueSpecies: 7,
      bioXRows: 3,
      scoutCodexId: 's11',
    });
    const prepared = prepareArc5OwnershipMigration({
      extensions: withArc4(baseExtensions(), protectedSource),
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.state).toMatchObject({
      mode: 'legacy-protected',
      catalogSpecies: [], acquisitions: [], bredAcquisitions: [], creatures: [],
      creatureTombstones: [], specimenLots: [], specimenTombstones: [],
    });
    const certificate = JSON.parse(prepared.writes[0]!.carrier.json) as Record<string, unknown>;
    expect(certificate.sourceMode).toBe('legacy-protected');
    expect(certificate.targetMode).toBe('legacy-protected');
    expect(readArc5OwnershipMigration(
      prepared.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toMatchObject({ kind: 'loaded', state: { mode: 'legacy-protected' } });
  });

  it('binds every certificate schema, version, mode, revision, and digest field independently', () => {
    const result = certified(withArc4(baseExtensions(), createEmptyOwnershipStateV1()));
    const cases: readonly Readonly<{
      field: string;
      value: unknown;
      reason: 'source-drift' | 'target-corrupt';
      pairRevision?: true;
    }>[] = [
      { field: 'schema', value: 'cf-v2-ownership-v1-to-v2/wrong', reason: 'target-corrupt' },
      { field: 'version', value: 0, reason: 'target-corrupt' },
      { field: 'sourceSchema', value: 'cf-v2-ownership-state/wrong', reason: 'target-corrupt' },
      { field: 'sourceVersion', value: 2, reason: 'target-corrupt' },
      { field: 'sourceRevision', value: 1, reason: 'source-drift', pairRevision: true },
      { field: 'sourceMode', value: 'legacy-protected', reason: 'source-drift' },
      { field: 'sourceDigest', value: 'b'.repeat(64), reason: 'source-drift' },
      { field: 'targetSchema', value: 'cf-v2-ownership-state/wrong', reason: 'target-corrupt' },
      { field: 'targetVersion', value: 3, reason: 'target-corrupt' },
      { field: 'targetRevision', value: 1, reason: 'target-corrupt' },
      { field: 'targetMode', value: 'legacy-protected', reason: 'target-corrupt' },
      { field: 'targetDigest', value: 'c'.repeat(64), reason: 'target-corrupt' },
    ];
    for (const testCase of cases) {
      const tampered = mutateCertificate(result.extensions, (certificate) => {
        certificate[testCase.field] = testCase.value;
        if (testCase.pairRevision) certificate.targetRevision = testCase.value;
      });
      expect(prepareArc5OwnershipMigration({
        extensions: tampered, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), testCase.field).toEqual({ kind: 'protected', reason: testCase.reason });
      expect(readArc5OwnershipMigration(
        tampered, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      ), testCase.field).toEqual({ kind: 'corrupt' });
    }
  });

  it('rejects missing, extra, malformed, noncanonical, and invalid numeric certificate data', () => {
    const result = certified(withArc4(baseExtensions(), createEmptyOwnershipStateV1()));
    const missing = mutateCertificate(result.extensions, (certificate) => {
      delete certificate.targetMode;
    });
    const extra = mutateCertificate(result.extensions, (certificate) => {
      certificate.rows = [];
    });
    for (const [label, extensions] of [['missing', missing], ['extra', extra]] as const) {
      expect(prepareArc5OwnershipMigration({
        extensions, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), label).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    }

    const carrier = result.extensions.player![ARC5_OWNERSHIP_MIGRATION_NAMESPACE]!;
    const pretty = replace(result.extensions, 'player', ARC5_OWNERSHIP_MIGRATION_NAMESPACE, {
      version: carrier.version,
      json: JSON.stringify(JSON.parse(carrier.json), null, 2),
    });
    expect(prepareArc5OwnershipMigration({
      extensions: pretty, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    const malformed = rawReplace(result.extensions, 'player', ARC5_OWNERSHIP_MIGRATION_NAMESPACE, {
      version: carrier.version, json: '{',
    });
    expect(prepareArc5OwnershipMigration({
      extensions: malformed, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    expect(readArc5OwnershipMigration(
      malformed, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });

    for (const field of ['version', 'sourceRevision', 'targetRevision'] as const) {
      for (const value of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
        const invalid = mutateCertificate(result.extensions, (certificate) => {
          certificate[field] = value;
        });
        expect(prepareArc5OwnershipMigration({
          extensions: invalid, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
        }), `${field}=${value}`).toEqual({ kind: 'protected', reason: 'target-corrupt' });
      }
    }
    for (const [field, value] of [
      ['sourceMode', 'unknown'], ['targetMode', 'unknown'],
      ['sourceDigest', 'not-a-digest'], ['targetDigest', 'not-a-digest'],
    ] as const) {
      const invalid = mutateCertificate(result.extensions, (certificate) => {
        certificate[field] = value;
      });
      expect(prepareArc5OwnershipMigration({
        extensions: invalid, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), field).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    }
  });

  it('protects absent, corrupt, and future Arc 4 sources without writing a certificate', () => {
    expect(prepareArc5OwnershipMigration({
      extensions: baseExtensions(), resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'source-absent' });

    const arc4 = withArc4(baseExtensions(), createEmptyOwnershipStateV1());
    const manifest = arc4.player![ARC4_OWNERSHIP_MANIFEST_NAMESPACE]!;
    const corrupt = replace(arc4, 'player', ARC4_OWNERSHIP_MANIFEST_NAMESPACE, {
      version: manifest.version, json: '{}',
    });
    expect(prepareArc5OwnershipMigration({
      extensions: corrupt, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'source-corrupt' });
    const lastTarget = ARC4_OWNERSHIP_EXTENSION_TARGETS.at(-1)!;
    const partial = remove(arc4, lastTarget.segment, lastTarget.namespace);
    expect(prepareArc5OwnershipMigration({
      extensions: partial, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'source-corrupt' });
    const unknown = replace(arc4, 'catalog', `${ARC4_OWNERSHIP_PREFIX}extra`, {
      version: 1, json: '{}',
    });
    expect(prepareArc5OwnershipMigration({
      extensions: unknown, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'source-corrupt' });
    const future = replace(arc4, 'player', ARC4_OWNERSHIP_MANIFEST_NAMESPACE, {
      ...manifest, version: 2,
    });
    expect(prepareArc5OwnershipMigration({
      extensions: future, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'source-future', version: 2 });
    expect(readArc5OwnershipMigration(
      future, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'absent' });
  });

  it('protects corrupt, future, misplaced, and source-drifted certificates', () => {
    const arc4 = withArc4(baseExtensions(), createEmptyOwnershipStateV1());
    const malformed = replace(arc4, 'player', ARC5_OWNERSHIP_MIGRATION_NAMESPACE, {
      version: ARC5_OWNERSHIP_MIGRATION_VERSION, json: '{}',
    });
    expect(prepareArc5OwnershipMigration({
      extensions: malformed, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    expect(readArc5OwnershipMigration(
      malformed, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });

    const future = replace(arc4, 'player', ARC5_OWNERSHIP_MIGRATION_NAMESPACE, {
      version: ARC5_OWNERSHIP_MIGRATION_VERSION + 1, json: '{}',
    });
    expect(prepareArc5OwnershipMigration({
      extensions: future, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-future', version: 2 });
    expect(readArc5OwnershipMigration(
      future, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'future-version', version: 2 });

    const unknown = replace(arc4, 'player', `${ARC5_OWNERSHIP_MIGRATION_PREFIX}extra`, {
      version: 1, json: '{}',
    });
    expect(prepareArc5OwnershipMigration({
      extensions: unknown, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    const misplaced = replace(arc4, 'catalog', ARC5_OWNERSHIP_MIGRATION_NAMESPACE, {
      version: 1, json: '{}',
    });
    expect(prepareArc5OwnershipMigration({
      extensions: misplaced, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-corrupt' });

    const certified = prepareArc5OwnershipMigration({
      extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (certified.kind !== 'prepared') throw new Error(`fixture failed: ${certified.kind}`);
    const parent = loadedArc4(certified.extensions);
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
      extensions: certified.extensions,
      state: next,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (advanced.kind !== 'prepared') throw new Error(`Arc 4 advance failed: ${advanced.kind}`);
    expect(advanced.extensions.player?.[ARC5_OWNERSHIP_MIGRATION_NAMESPACE])
      .toEqual(certified.extensions.player?.[ARC5_OWNERSHIP_MIGRATION_NAMESPACE]);
    expect(prepareArc5OwnershipMigration({
      extensions: advanced.extensions, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'source-drift' });
    expect(readArc5OwnershipMigration(
      advanced.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });
  });

  it('fails closed on per-segment, global, and aggregate-byte exhaustion', () => {
    const player: Record<string, V5ExtensionCarrier> = {
      'f4.authority': { version: 1, json: '{"keep":true}' },
    };
    for (let index = 0; index < 61; index++) {
      player[`padding.${String(index).padStart(2, '0')}`] = { version: 1, json: '{}' };
    }
    const fullPlayer = withArc4(canonicalizeV5Extensions({ player }), createEmptyOwnershipStateV1());
    expect(Object.keys(fullPlayer.player ?? {})).toHaveLength(64);
    expect(prepareArc5OwnershipMigration({
      extensions: fullPlayer, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });
    expect(fullPlayer.player?.[ARC5_OWNERSHIP_MIGRATION_NAMESPACE]).toBeUndefined();

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
      canonicalizeV5Extensions(namespaceMaps), createEmptyOwnershipStateV1(),
    );
    expect(Object.values(globalFull).reduce(
      (total, namespaces) => total + Object.keys(namespaces).length, 0,
    )).toBe(128);
    expect(prepareArc5OwnershipMigration({
      extensions: globalFull, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });

    const emptyArc4 = withArc4({}, createEmptyOwnershipStateV1());
    const smallCertificate = certified(emptyArc4).writes[0]!.carrier.json;
    const paddingBytes = V5_MAX_EXTENSION_TOTAL_BYTES
      - extensionBytes(emptyArc4) - utf8ByteLength(smallCertificate) + 1;
    const byteFull = withArc4(paddingExtensions(paddingBytes), createEmptyOwnershipStateV1());
    expect(extensionBytes(byteFull)).toBe(
      V5_MAX_EXTENSION_TOTAL_BYTES - utf8ByteLength(smallCertificate) + 1,
    );
    expect(prepareArc5OwnershipMigration({
      extensions: byteFull, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });
  });

  it('rejects hostile extension and preparation-input shapes without observing getters', () => {
    const arc4 = withArc4(baseExtensions(), createEmptyOwnershipStateV1());

    let reads = 0;
    const accessor = Object.defineProperty({}, 'player', {
      enumerable: true,
      get: () => { reads++; return {}; },
    });
    expect(prepareArc5OwnershipMigration({
      extensions: accessor, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    expect(readArc5OwnershipMigration(
      accessor, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual({ kind: 'corrupt' });
    expect(reads).toBe(0);

    const inherited = Object.create({ player: {} }) as unknown;
    const hidden = Object.defineProperty({}, 'player', { enumerable: false, value: {} });
    const symbol = { [Symbol('extension')]: 1 };
    const cycle: Record<string, unknown> = {};
    cycle.player = cycle;
    const proxy = new Proxy({}, { ownKeys: () => { throw new Error('trap'); } });
    for (const [label, extensions] of [
      ['array', []], ['prototype', inherited], ['hidden', hidden],
      ['symbol', symbol], ['cycle', cycle], ['proxy', proxy],
    ] as const) {
      expect(prepareArc5OwnershipMigration({
        extensions, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      }), label).toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
      expect(readArc5OwnershipMigration(
        extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      ), label).toEqual({ kind: 'corrupt' });
    }

    let inputGetterReads = 0;
    const extensionAccessor = Object.defineProperty(
      { resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER },
      'extensions',
      { enumerable: true, get: () => { inputGetterReads++; return arc4; } },
    );
    const resolverAccessor = Object.defineProperty(
      { extensions: arc4 },
      'resolver',
      { enumerable: true, get: () => { inputGetterReads++; return SCENE_OWNERSHIP_ADDRESS_RESOLVER; } },
    );
    const extraStateAccessor = Object.defineProperty(
      { extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER },
      'state',
      { enumerable: true, get: () => { inputGetterReads++; return 'forbidden'; } },
    );
    const hiddenInput = Object.defineProperty(
      { resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER },
      'extensions',
      { enumerable: false, value: arc4 },
    );
    const arrayInput = Object.assign([], {
      extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    const inheritedInput = Object.assign(Object.create({ inherited: true }) as Record<string, unknown>, {
      extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    const throwingInput = new Proxy({}, { getPrototypeOf: () => { throw new Error('trap'); } });
    for (const [label, input] of [
      ['extension-accessor', extensionAccessor],
      ['resolver-accessor', resolverAccessor],
      ['extra-state-accessor', extraStateAccessor],
      ['missing', { extensions: arc4 }],
      ['extra', { extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER, extra: true }],
      ['symbol', {
        extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER, [Symbol('input')]: true,
      }],
      ['hidden', hiddenInput], ['array', arrayInput],
      ['prototype', inheritedInput], ['proxy', throwingInput],
    ] as const) {
      expect(prepareArc5OwnershipMigration(input as never), label)
        .toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    }
    expect(inputGetterReads).toBe(0);

    const cyclicInput: Record<string, unknown> = {
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    };
    cyclicInput.extensions = cyclicInput;
    expect(prepareArc5OwnershipMigration(cyclicInput as never))
      .toEqual({ kind: 'protected', reason: 'extensions-corrupt' });

    const nullPrototypeInput = Object.assign(Object.create(null) as Record<string, unknown>, {
      extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    expect(prepareArc5OwnershipMigration(nullPrototypeInput as never).kind).toBe('prepared');

    let propertyReads = 0;
    let extensionDescriptors = 0;
    let resolverDescriptors = 0;
    const stableInput = { extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER };
    const descriptorInput = new Proxy(stableInput, {
      get: (target, property, receiver) => {
        propertyReads++;
        return Reflect.get(target, property, receiver);
      },
      getOwnPropertyDescriptor: (target, property) => {
        if (property === 'extensions') extensionDescriptors++;
        if (property === 'resolver') resolverDescriptors++;
        return Reflect.getOwnPropertyDescriptor(target, property);
      },
    });
    expect(prepareArc5OwnershipMigration(descriptorInput).kind).toBe('prepared');
    expect({ propertyReads, extensionDescriptors, resolverDescriptors }).toEqual({
      propertyReads: 0, extensionDescriptors: 1, resolverDescriptors: 1,
    });

    const certified = prepareArc5OwnershipMigration({
      extensions: arc4,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (certified.kind !== 'prepared') throw new Error(`fixture failed: ${certified.kind}`);
    const sourceMissing = withoutPrefix(certified.extensions, ARC4_OWNERSHIP_PREFIX);
    expect(prepareArc5OwnershipMigration({
      extensions: sourceMissing, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'source-absent' });

    const innerFuture = JSON.parse(certified.writes[0]!.carrier.json) as Record<string, unknown>;
    innerFuture.version = ARC5_OWNERSHIP_MIGRATION_VERSION + 1;
    const innerFutureExtensions = replace(
      certified.extensions,
      'player',
      ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
      { version: 1, json: canonicalJson(innerFuture) },
    );
    expect(prepareArc5OwnershipMigration({
      extensions: innerFutureExtensions, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-future', version: 2 });
  });
});
