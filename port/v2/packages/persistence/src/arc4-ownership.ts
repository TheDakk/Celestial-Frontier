/* Arc 4 ownership persistence owner.

   Truth is split across a fixed replacement inventory: manifest/progress in
   player, catalogue/audit shards in catalog, living-creature shards in
   creatures, and specimen shards in inventory. Every successful write
   replaces all 18 namespaces, including canonical empty shards, so stale tail
   bytes cannot survive a shrink. The v4 mirror remains compatibility-only. */
import {
  MAX_OWNERSHIP_REVISION,
  OWNERSHIP_DATA_BUDGET,
  OWNERSHIP_STATE_SCHEMA,
  OWNERSHIP_STATE_VERSION,
  canonicalJson,
  canonicalizeData,
  createLegacyProtectedOwnershipStateV1,
  isOwnershipStateV1,
  isOwnershipSuccessorV1,
  migrateLegacyOwnershipStateV1,
  ownershipStateDigestV1,
  ownershipStateMirrorV1,
  registerOwnershipStateMirrorV1,
  sha256Hex,
  utf8ByteLength,
  type CanonicalJson,
  type LegacyOwnershipInputV1,
  type LegacyOwnershipSourceEvidenceV1,
  type OwnershipAddressResolver,
  type OwnershipStateMirrorV1,
  type OwnershipStateV1,
} from '@cf/domain-acquisition';
import type { SaveStateV2 } from './import-v2.js';
import {
  V5_MAX_EXTENSION_JSON_BYTES,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5ExtensionWrite,
  type V5Extensions,
  type V5Segment,
} from './migration-v5.js';

export const ARC4_OWNERSHIP_VERSION = 1 as const;
export const ARC4_OWNERSHIP_FIXED_SHARDS = 4 as const;
export const ARC4_OWNERSHIP_PREFIX = 'arc4.ownership.' as const;
export const ARC4_OWNERSHIP_MANIFEST_NAMESPACE = 'arc4.ownership.manifest' as const;
export const ARC4_OWNERSHIP_PROGRESS_NAMESPACE = 'arc4.ownership.progress' as const;
export const ARC4_OWNERSHIP_MANIFEST_SCHEMA = 'cf-v2-ownership-manifest/v1' as const;
export const ARC4_OWNERSHIP_PROGRESS_SCHEMA = 'cf-v2-ownership-progress/v1' as const;
export const ARC4_OWNERSHIP_SHARD_SCHEMA = 'cf-v2-ownership-shard/v1' as const;

const SEGMENT_ORDER: Readonly<Record<V5Segment, number>> = Object.freeze({
  player: 0, creatures: 1, catalog: 2, inventory: 3, settings: 4,
});

type ShardKind = 'catalogSpecies' | 'discoveries' | 'creatures' | 'specimenLots';

const SHARD_GROUPS: readonly Readonly<{
  kind: ShardKind;
  segment: V5Segment;
  prefix: string;
}>[] = Object.freeze([
  Object.freeze({ kind: 'catalogSpecies', segment: 'catalog', prefix: 'arc4.ownership.catalog' }),
  Object.freeze({ kind: 'discoveries', segment: 'catalog', prefix: 'arc4.ownership.discoveries' }),
  Object.freeze({ kind: 'creatures', segment: 'creatures', prefix: 'arc4.ownership.creatures' }),
  Object.freeze({ kind: 'specimenLots', segment: 'inventory', prefix: 'arc4.ownership.specimens' }),
]);

export interface Arc4OwnershipExtensionTargetV1 {
  readonly segment: V5Segment;
  readonly namespace: string;
}

function targets(): readonly Arc4OwnershipExtensionTargetV1[] {
  const result: Arc4OwnershipExtensionTargetV1[] = [
    Object.freeze({ segment: 'player', namespace: ARC4_OWNERSHIP_MANIFEST_NAMESPACE }),
    Object.freeze({ segment: 'player', namespace: ARC4_OWNERSHIP_PROGRESS_NAMESPACE }),
  ];
  for (const group of SHARD_GROUPS) {
    for (let index = 0; index < ARC4_OWNERSHIP_FIXED_SHARDS; index++) {
      result.push(Object.freeze({ segment: group.segment, namespace: `${group.prefix}.${index}` }));
    }
  }
  result.sort((left, right) => SEGMENT_ORDER[left.segment] - SEGMENT_ORDER[right.segment]
    || (left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0));
  return Object.freeze(result);
}

export const ARC4_OWNERSHIP_EXTENSION_TARGETS = targets();
const TARGET_IDENTITIES = new Set(ARC4_OWNERSHIP_EXTENSION_TARGETS.map(
  ({ segment, namespace }) => `${segment}\u0000${namespace}`,
));

export interface Arc4OwnershipExtensionWriteV1 extends V5ExtensionWrite {}

export interface EncodedArc4OwnershipV1 {
  readonly state: OwnershipStateV1;
  readonly writes: readonly Arc4OwnershipExtensionWriteV1[];
  readonly extensions: V5Extensions;
}

export type Arc4OwnershipReadOutcome =
  | { readonly kind: 'absent' }
  | { readonly kind: 'loaded'; readonly state: OwnershipStateV1 }
  | { readonly kind: 'future-version'; readonly version: number }
  | { readonly kind: 'corrupt' };

export type Arc4OwnershipProtectionReason =
  | 'target-absent'
  | 'target-future'
  | 'target-corrupt'
  | 'state-unreadable'
  | 'revision-conflict'
  | 'revision-exhausted'
  | 'legacy-corrupt'
  | 'extensions-corrupt'
  | 'extension-bounds';

export interface PreparedArc4OwnershipWriteV1 {
  readonly kind: 'prepared';
  readonly state: OwnershipStateV1;
  readonly writes: readonly Arc4OwnershipExtensionWriteV1[];
  readonly extensions: V5Extensions;
  readonly migration?: 'migrated' | 'legacy-protected';
  /** Exact canonical source authority for a legacy migration preparation. */
  readonly migrationSourceEvidence?: LegacyOwnershipSourceEvidenceV1;
}

export type Arc4OwnershipWritePreparation =
  | PreparedArc4OwnershipWriteV1
  | {
      readonly kind: 'protected';
      readonly reason: Arc4OwnershipProtectionReason;
      readonly version?: number;
      readonly expectedRevision?: number;
      readonly actualRevision?: number;
    };

export type Arc4OwnershipLegacyMigrationPreparation =
  | PreparedArc4OwnershipWriteV1
  | { readonly kind: 'already-loaded'; readonly state: OwnershipStateV1 }
  | Exclude<Arc4OwnershipWritePreparation, PreparedArc4OwnershipWriteV1>;

export type Arc4OwnershipMigrationOutcome =
  | {
      readonly kind: 'migrated';
      readonly state: OwnershipStateV1;
      readonly sourceEvidence: LegacyOwnershipSourceEvidenceV1;
    }
  | {
      readonly kind: 'legacy-protected';
      readonly state: OwnershipStateV1;
      readonly sourceEvidence: LegacyOwnershipSourceEvidenceV1;
      readonly reason: 'carrier-bounds';
    }
  | { readonly kind: 'refused'; readonly reason: 'legacy-corrupt' };

type LegacyOwnershipFields = Pick<
  SaveStateV2,
  'EPOCH_BASE' | 'codex' | 'customNames' | 'bioX' | 'scoutId'
>;

type LegacyOwnershipMirrorFields = Pick<
  SaveStateV2,
  'codex' | 'customNames' | 'bioX' | 'scoutId'
>;

export interface ProjectedLegacyOwnershipMirrorV1 {
  readonly kind: 'projected';
  readonly codex: readonly Readonly<{
    readonly legacyCodexId: string;
    readonly g: Readonly<Record<string, CanonicalJson>>;
    readonly f: string;
    readonly w: CanonicalJson | null;
  }>[];
  readonly customNames: readonly (readonly [string, string])[];
  readonly bioX: readonly (readonly [number, readonly [number, number]])[];
  readonly scoutId: string | null;
}

export interface ProtectedLegacyOwnershipMirrorV1 {
  readonly kind: 'legacy-protected';
  readonly sourceEvidence: LegacyOwnershipSourceEvidenceV1;
}

export interface UnrepresentableLegacyOwnershipMirrorV1 {
  readonly kind: 'unrepresentable';
  readonly reason: 'codex-seed-collision' | 'biosphere-seed-collision';
  readonly leafSeed: number;
  readonly canonicalOwners: readonly string[];
}

export type LegacyOwnershipMirrorV1 =
  | ProjectedLegacyOwnershipMirrorV1
  | ProtectedLegacyOwnershipMirrorV1
  | UnrepresentableLegacyOwnershipMirrorV1;

class Arc4CarrierError extends Error {
  readonly code: 'bounds' | 'corrupt' | 'future';
  readonly version: number | null;

  constructor(code: Arc4CarrierError['code'], message: string, version: number | null = null) {
    super(message);
    this.name = 'Arc4CarrierError';
    this.code = code;
    this.version = version;
  }
}

function object(value: CanonicalJson, label: string): Readonly<Record<string, CanonicalJson>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Arc4CarrierError('corrupt', `${label} must be an object`);
  }
  return value as Readonly<Record<string, CanonicalJson>>;
}

function exactKeys(value: Readonly<Record<string, CanonicalJson>>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Arc4CarrierError('corrupt', `${label} has unknown or missing fields`);
  }
}

function integer(value: CanonicalJson, label: string, maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Arc4CarrierError('corrupt', `${label} is invalid`);
  }
  return value;
}

function digest(value: CanonicalJson, label: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/u.test(value)) {
    throw new Arc4CarrierError('corrupt', `${label} is invalid`);
  }
  return value;
}

function parsedCanonicalJson(raw: string, label: string): Readonly<Record<string, CanonicalJson>> {
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; } catch {
    throw new Arc4CarrierError('corrupt', `${label} JSON is invalid`);
  }
  let canonical: CanonicalJson;
  try { canonical = canonicalizeData(parsed); } catch {
    throw new Arc4CarrierError('corrupt', `${label} data is invalid`);
  }
  if (canonicalJson(canonical) !== raw) {
    throw new Arc4CarrierError('corrupt', `${label} is not a canonical fixed point`);
  }
  return object(canonical, label);
}

function strictExtensions(value: unknown): V5Extensions {
  try {
    /* This rejects ordinary hostile reflection shapes before the shared v5
       validator observes values. A transparent Proxy can emulate plain data;
       write authority still comes only from registered state/successors. */
    return canonicalizeV5Extensions(canonicalizeData(value, Object.freeze({
      ...OWNERSHIP_DATA_BUDGET,
      maxStringLength: V5_MAX_EXTENSION_JSON_BYTES,
      maxCharacters: 1_200_000,
    })));
  } catch {
    throw new Arc4CarrierError('corrupt', 'v5 extensions are structurally invalid');
  }
}

function carrierJson(value: unknown): string {
  const json = canonicalJson(value);
  if (json.length > V5_MAX_EXTENSION_JSON_BYTES
    || utf8ByteLength(json) > V5_MAX_EXTENSION_JSON_BYTES) {
    throw new Arc4CarrierError('bounds', 'Arc 4 ownership carrier exceeds its byte bound');
  }
  return json;
}

function makeCarrier(value: unknown): V5ExtensionCarrier {
  return Object.freeze({ version: ARC4_OWNERSHIP_VERSION, json: carrierJson(value) });
}

interface EncodedShard {
  readonly write: Arc4OwnershipExtensionWriteV1;
  readonly digest: string;
  readonly start: number;
  readonly end: number;
}

function shardValue(
  kind: ShardKind,
  revision: number,
  index: number,
  start: number,
  end: number,
  total: number,
  rows: readonly unknown[],
): Readonly<Record<string, unknown>> {
  const slice = rows.slice(start, end);
  return Object.freeze({
    schema: ARC4_OWNERSHIP_SHARD_SCHEMA,
    version: ARC4_OWNERSHIP_VERSION,
    kind,
    revision,
    index,
    count: ARC4_OWNERSHIP_FIXED_SHARDS,
    start,
    end,
    total,
    digest: sha256Hex(canonicalJson(slice)),
    rows: slice,
  });
}

function encodedShard(
  group: typeof SHARD_GROUPS[number],
  revision: number,
  index: number,
  start: number,
  end: number,
  rows: readonly unknown[],
): EncodedShard {
  const value = shardValue(group.kind, revision, index, start, end, rows.length, rows);
  const carrier = makeCarrier(value);
  return Object.freeze({
    write: Object.freeze({
      segment: group.segment,
      namespace: `${group.prefix}.${index}`,
      carrier,
    }),
    digest: value.digest as string,
    start,
    end,
  });
}

function encodeShardGroup(
  group: typeof SHARD_GROUPS[number],
  revision: number,
  rows: readonly unknown[],
): readonly EncodedShard[] {
  const result: EncodedShard[] = [];
  let start = 0;
  for (let index = 0; index < ARC4_OWNERSHIP_FIXED_SHARDS; index++) {
    let end = rows.length;
    if (index < ARC4_OWNERSHIP_FIXED_SHARDS - 1 && start < rows.length) {
      let low = start;
      let high = rows.length;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        try {
          encodedShard(group, revision, index, start, middle, rows);
          low = middle;
        } catch (error) {
          if (!(error instanceof Arc4CarrierError) || error.code !== 'bounds') throw error;
          high = middle - 1;
        }
      }
      end = low;
      if (end === start) {
        throw new Arc4CarrierError('bounds', `Arc 4 ${group.kind} row exceeds one shard`);
      }
    }
    const shard = encodedShard(group, revision, index, start, end, rows);
    result.push(shard);
    start = end;
  }
  if (start !== rows.length) {
    throw new Arc4CarrierError('bounds', `Arc 4 ${group.kind} exceeds fixed shard inventory`);
  }
  return Object.freeze(result);
}

function sortedWrites(writes: readonly Arc4OwnershipExtensionWriteV1[]): readonly Arc4OwnershipExtensionWriteV1[] {
  return Object.freeze([...writes].sort((left, right) => (
    SEGMENT_ORDER[left.segment] - SEGMENT_ORDER[right.segment]
    || (left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0)
  )));
}

function extensionsFromWrites(writes: readonly Arc4OwnershipExtensionWriteV1[]): V5Extensions {
  const raw: Partial<Record<V5Segment, Record<string, V5ExtensionCarrier>>> = {};
  for (const write of writes) {
    (raw[write.segment] ??= {})[write.namespace] = write.carrier;
  }
  try { return canonicalizeV5Extensions(raw); } catch {
    throw new Arc4CarrierError('bounds', 'Arc 4 ownership aggregate exceeds v5 extension bounds');
  }
}

/** Encode one registered state into the complete fixed namespace inventory. */
export function encodeArc4Ownership(state: OwnershipStateV1): EncodedArc4OwnershipV1 {
  if (!isOwnershipStateV1(state)) throw new TypeError('Arc 4 ownership state must be registered');
  const mirror = ownershipStateMirrorV1(state);
  const groups = new Map<ShardKind, readonly EncodedShard[]>();
  for (const group of SHARD_GROUPS) {
    groups.set(group.kind, encodeShardGroup(
      group,
      state.revision,
      mirror[group.kind] as readonly unknown[],
    ));
  }
  const progressPayload = Object.freeze({
    biosphereProgress: mirror.biosphereProgress,
    legacyBioX: mirror.legacyBioX,
    scoutCreatureId: mirror.scoutCreatureId,
  });
  const progressDigest = sha256Hex(canonicalJson(progressPayload));
  const progressWrite: Arc4OwnershipExtensionWriteV1 = Object.freeze({
    segment: 'player',
    namespace: ARC4_OWNERSHIP_PROGRESS_NAMESPACE,
    carrier: makeCarrier(Object.freeze({
      schema: ARC4_OWNERSHIP_PROGRESS_SCHEMA,
      version: ARC4_OWNERSHIP_VERSION,
      revision: state.revision,
      digest: progressDigest,
      payload: progressPayload,
    })),
  });
  const shardDigests = Object.freeze(Object.fromEntries(SHARD_GROUPS.map((group) => [
    group.kind,
    Object.freeze(groups.get(group.kind)!.map((shard) => shard.digest)),
  ])) as Readonly<Record<ShardKind, readonly string[]>>);
  const manifestWrite: Arc4OwnershipExtensionWriteV1 = Object.freeze({
    segment: 'player',
    namespace: ARC4_OWNERSHIP_MANIFEST_NAMESPACE,
    carrier: makeCarrier(Object.freeze({
      schema: ARC4_OWNERSHIP_MANIFEST_SCHEMA,
      version: ARC4_OWNERSHIP_VERSION,
      revision: state.revision,
      mode: state.mode,
      fixedShardCount: ARC4_OWNERSHIP_FIXED_SHARDS,
      rowCounts: Object.freeze({
        catalogSpecies: mirror.catalogSpecies.length,
        discoveries: mirror.discoveries.length,
        creatures: mirror.creatures.length,
        specimenLots: mirror.specimenLots.length,
        biosphereProgress: mirror.biosphereProgress.length,
        legacyBioX: mirror.legacyBioX.length,
      }),
      shardDigests,
      progressDigest,
      stateDigest: ownershipStateDigestV1(state),
      legacyProtection: mirror.legacyProtection,
    })),
  });
  const writes = sortedWrites([
    manifestWrite,
    progressWrite,
    ...SHARD_GROUPS.flatMap((group) => groups.get(group.kind)!.map((shard) => shard.write)),
  ]);
  if (writes.length !== ARC4_OWNERSHIP_EXTENSION_TARGETS.length
    || writes.some((write, index) => write.segment !== ARC4_OWNERSHIP_EXTENSION_TARGETS[index]!.segment
      || write.namespace !== ARC4_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace)) {
    throw new Error('Arc 4 ownership fixed replacement inventory changed');
  }
  return Object.freeze({ state, writes, extensions: extensionsFromWrites(writes) });
}

interface DecodedManifest {
  readonly revision: number;
  readonly mode: OwnershipStateV1['mode'];
  readonly rowCounts: Readonly<Record<ShardKind | 'biosphereProgress' | 'legacyBioX', number>>;
  readonly shardDigests: Readonly<Record<ShardKind, readonly string[]>>;
  readonly progressDigest: string;
  readonly stateDigest: string;
  readonly legacyProtection: CanonicalJson;
}

function decodeManifest(carrier: V5ExtensionCarrier): DecodedManifest {
  const row = parsedCanonicalJson(carrier.json, 'Arc 4 ownership manifest');
  exactKeys(row, [
    'schema', 'version', 'revision', 'mode', 'fixedShardCount', 'rowCounts', 'shardDigests',
    'progressDigest', 'stateDigest', 'legacyProtection',
  ], 'Arc 4 ownership manifest');
  if (row.schema !== ARC4_OWNERSHIP_MANIFEST_SCHEMA) throw new Arc4CarrierError('corrupt', 'manifest schema is invalid');
  const version = integer(row.version!, 'manifest version');
  if (version > ARC4_OWNERSHIP_VERSION) throw new Arc4CarrierError('future', 'manifest is future', version);
  if (version !== ARC4_OWNERSHIP_VERSION
    || row.fixedShardCount !== ARC4_OWNERSHIP_FIXED_SHARDS
    || (row.mode !== 'current' && row.mode !== 'legacy-protected')) {
    throw new Arc4CarrierError('corrupt', 'manifest identity is invalid');
  }
  const counts = object(row.rowCounts!, 'manifest row counts');
  exactKeys(counts, [
    'catalogSpecies', 'discoveries', 'creatures', 'specimenLots', 'biosphereProgress', 'legacyBioX',
  ], 'manifest row counts');
  const rowCounts = Object.freeze({
    catalogSpecies: integer(counts.catalogSpecies!, 'catalogue row count', 20_000),
    discoveries: integer(counts.discoveries!, 'discovery row count', 20_000),
    creatures: integer(counts.creatures!, 'creature row count', 20_000),
    specimenLots: integer(counts.specimenLots!, 'specimen row count', 20_000),
    biosphereProgress: integer(counts.biosphereProgress!, 'biosphere row count', 20_000),
    legacyBioX: integer(counts.legacyBioX!, 'legacy bioX row count', 60_000),
  });
  const rawDigests = object(row.shardDigests!, 'manifest shard digests');
  exactKeys(rawDigests, SHARD_GROUPS.map((group) => group.kind), 'manifest shard digests');
  const shardDigests = {} as Record<ShardKind, readonly string[]>;
  for (const group of SHARD_GROUPS) {
    const values = rawDigests[group.kind];
    if (!Array.isArray(values) || values.length !== ARC4_OWNERSHIP_FIXED_SHARDS) {
      throw new Arc4CarrierError('corrupt', 'manifest shard digest count is invalid');
    }
    shardDigests[group.kind] = Object.freeze(values.map((value) => digest(value, 'manifest shard digest')));
  }
  return Object.freeze({
    revision: integer(row.revision!, 'manifest revision'),
    mode: row.mode,
    rowCounts,
    shardDigests: Object.freeze(shardDigests),
    progressDigest: digest(row.progressDigest!, 'manifest progress digest'),
    stateDigest: digest(row.stateDigest!, 'manifest state digest'),
    legacyProtection: row.legacyProtection!,
  });
}

function decodeShardGroup(
  extensions: V5Extensions,
  group: typeof SHARD_GROUPS[number],
  manifest: DecodedManifest,
): readonly CanonicalJson[] {
  const rows: CanonicalJson[] = [];
  let expectedStart = 0;
  for (let index = 0; index < ARC4_OWNERSHIP_FIXED_SHARDS; index++) {
    const carrier = extensions[group.segment]?.[`${group.prefix}.${index}`]!;
    const shard = parsedCanonicalJson(carrier.json, `Arc 4 ${group.kind} shard ${index}`);
    exactKeys(shard, [
      'schema', 'version', 'kind', 'revision', 'index', 'count', 'start', 'end', 'total', 'digest', 'rows',
    ], `Arc 4 ${group.kind} shard ${index}`);
    const version = integer(shard.version!, 'shard version');
    if (version > ARC4_OWNERSHIP_VERSION) throw new Arc4CarrierError('future', 'shard is future', version);
    if (shard.schema !== ARC4_OWNERSHIP_SHARD_SCHEMA || version !== ARC4_OWNERSHIP_VERSION
      || shard.kind !== group.kind || shard.revision !== manifest.revision
      || shard.index !== index || shard.count !== ARC4_OWNERSHIP_FIXED_SHARDS
      || shard.total !== manifest.rowCounts[group.kind]) {
      throw new Arc4CarrierError('corrupt', 'shard descriptor is invalid');
    }
    const start = integer(shard.start!, 'shard start', manifest.rowCounts[group.kind]);
    const end = integer(shard.end!, 'shard end', manifest.rowCounts[group.kind]);
    if (start !== expectedStart || end < start || !Array.isArray(shard.rows)
      || shard.rows.length !== end - start) throw new Arc4CarrierError('corrupt', 'shard range is invalid');
    const actualDigest = sha256Hex(canonicalJson(shard.rows));
    if (digest(shard.digest!, 'shard digest') !== actualDigest
      || actualDigest !== manifest.shardDigests[group.kind][index]) {
      throw new Arc4CarrierError('corrupt', 'shard digest is invalid');
    }
    rows.push(...shard.rows);
    expectedStart = end;
  }
  if (expectedStart !== manifest.rowCounts[group.kind]) {
    throw new Arc4CarrierError('corrupt', 'shard inventory is incomplete');
  }
  return Object.freeze(rows);
}

function decodeProgress(
  carrier: V5ExtensionCarrier,
  manifest: DecodedManifest,
): Readonly<{
  biosphereProgress: readonly CanonicalJson[];
  legacyBioX: readonly CanonicalJson[];
  scoutCreatureId: CanonicalJson;
}> {
  const progress = parsedCanonicalJson(carrier.json, 'Arc 4 ownership progress');
  exactKeys(progress, ['schema', 'version', 'revision', 'digest', 'payload'], 'Arc 4 ownership progress');
  const version = integer(progress.version!, 'progress version');
  if (version > ARC4_OWNERSHIP_VERSION) throw new Arc4CarrierError('future', 'progress is future', version);
  if (progress.schema !== ARC4_OWNERSHIP_PROGRESS_SCHEMA || version !== ARC4_OWNERSHIP_VERSION
    || progress.revision !== manifest.revision) throw new Arc4CarrierError('corrupt', 'progress descriptor is invalid');
  const payload = object(progress.payload!, 'Arc 4 progress payload');
  exactKeys(payload, ['biosphereProgress', 'legacyBioX', 'scoutCreatureId'], 'Arc 4 progress payload');
  if (!Array.isArray(payload.biosphereProgress) || !Array.isArray(payload.legacyBioX)
    || payload.biosphereProgress.length !== manifest.rowCounts.biosphereProgress
    || payload.legacyBioX.length !== manifest.rowCounts.legacyBioX) {
    throw new Arc4CarrierError('corrupt', 'progress row counts are invalid');
  }
  const actualDigest = sha256Hex(canonicalJson(payload));
  if (digest(progress.digest!, 'progress digest') !== actualDigest
    || actualDigest !== manifest.progressDigest) throw new Arc4CarrierError('corrupt', 'progress digest is invalid');
  return Object.freeze({
    biosphereProgress: Object.freeze(payload.biosphereProgress),
    legacyBioX: Object.freeze(payload.legacyBioX),
    scoutCreatureId: payload.scoutCreatureId!,
  });
}

function ownedNamespaceStatus(extensions: V5Extensions): 'absent' | 'complete' {
  let ownedCount = 0;
  for (const [segment, namespaces] of Object.entries(extensions) as Array<[
    V5Segment,
    Readonly<Record<string, V5ExtensionCarrier>>,
  ]>) {
    for (const namespace of Object.keys(namespaces)) {
      if (!namespace.startsWith(ARC4_OWNERSHIP_PREFIX)) continue;
      ownedCount++;
      if (!TARGET_IDENTITIES.has(`${segment}\u0000${namespace}`)) {
        throw new Arc4CarrierError('corrupt', `unknown Arc 4 ownership namespace ${namespace}`);
      }
    }
  }
  if (ownedCount === 0) return 'absent';
  if (ownedCount !== ARC4_OWNERSHIP_EXTENSION_TARGETS.length
    || ARC4_OWNERSHIP_EXTENSION_TARGETS.some(({ segment, namespace }) => (
      extensions[segment]?.[namespace] === undefined
    ))) throw new Arc4CarrierError('corrupt', 'Arc 4 ownership shard inventory is incomplete');
  return 'complete';
}

function checkOuterVersions(extensions: V5Extensions): void {
  for (const { segment, namespace } of ARC4_OWNERSHIP_EXTENSION_TARGETS) {
    const version = extensions[segment]![namespace]!.version;
    if (version > ARC4_OWNERSHIP_VERSION) {
      throw new Arc4CarrierError('future', 'Arc 4 ownership carrier is future', version);
    }
    if (version !== ARC4_OWNERSHIP_VERSION) throw new Arc4CarrierError('corrupt', 'Arc 4 carrier version is invalid');
  }
}

/** Decode a complete current fixed point. Missing/future classification is
    owned by `readArc4Ownership`; this function throws on either. */
export function decodeArc4Ownership(
  value: V5Extensions,
  resolver: OwnershipAddressResolver,
): OwnershipStateV1 {
  const extensions = strictExtensions(value);
  if (ownedNamespaceStatus(extensions) !== 'complete') {
    throw new Arc4CarrierError('corrupt', 'Arc 4 ownership carrier is absent');
  }
  checkOuterVersions(extensions);
  const manifest = decodeManifest(extensions.player![ARC4_OWNERSHIP_MANIFEST_NAMESPACE]!);
  const decodedGroups = new Map<ShardKind, readonly CanonicalJson[]>();
  for (const group of SHARD_GROUPS) decodedGroups.set(group.kind, decodeShardGroup(extensions, group, manifest));
  const progress = decodeProgress(extensions.player![ARC4_OWNERSHIP_PROGRESS_NAMESPACE]!, manifest);
  const mirror: OwnershipStateMirrorV1 = {
    schema: OWNERSHIP_STATE_SCHEMA,
    version: OWNERSHIP_STATE_VERSION,
    revision: manifest.revision,
    mode: manifest.mode,
    catalogSpecies: decodedGroups.get('catalogSpecies')! as unknown as OwnershipStateMirrorV1['catalogSpecies'],
    discoveries: decodedGroups.get('discoveries')! as unknown as OwnershipStateMirrorV1['discoveries'],
    creatures: decodedGroups.get('creatures')! as unknown as OwnershipStateMirrorV1['creatures'],
    specimenLots: decodedGroups.get('specimenLots')! as unknown as OwnershipStateMirrorV1['specimenLots'],
    biosphereProgress: progress.biosphereProgress as unknown as OwnershipStateMirrorV1['biosphereProgress'],
    legacyBioX: progress.legacyBioX as unknown as OwnershipStateMirrorV1['legacyBioX'],
    scoutCreatureId: progress.scoutCreatureId as OwnershipStateMirrorV1['scoutCreatureId'],
    legacyProtection: manifest.legacyProtection as OwnershipStateMirrorV1['legacyProtection'],
  };
  let state: OwnershipStateV1;
  try { state = registerOwnershipStateMirrorV1(mirror, resolver); } catch {
    throw new Arc4CarrierError('corrupt', 'Arc 4 ownership state is invalid');
  }
  if (ownershipStateDigestV1(state) !== manifest.stateDigest) {
    throw new Arc4CarrierError('corrupt', 'Arc 4 ownership state digest is invalid');
  }
  const fixed = encodeArc4Ownership(state);
  for (const write of fixed.writes) {
    const current = extensions[write.segment]![write.namespace]!;
    if (current.version !== write.carrier.version || current.json !== write.carrier.json) {
      throw new Arc4CarrierError('corrupt', 'Arc 4 ownership carrier is not its fixed point');
    }
  }
  return state;
}

export function readArc4Ownership(
  value: V5Extensions,
  resolver: OwnershipAddressResolver,
): Arc4OwnershipReadOutcome {
  let extensions: V5Extensions;
  try { extensions = strictExtensions(value); } catch { return Object.freeze({ kind: 'corrupt' }); }
  try {
    if (ownedNamespaceStatus(extensions) === 'absent') return Object.freeze({ kind: 'absent' });
    checkOuterVersions(extensions);
    const state = decodeArc4Ownership(extensions, resolver);
    return Object.freeze({ kind: 'loaded', state });
  } catch (error) {
    if (error instanceof Arc4CarrierError && error.code === 'future' && error.version !== null) {
      return Object.freeze({ kind: 'future-version', version: error.version });
    }
    return Object.freeze({ kind: 'corrupt' });
  }
}

function ownData(value: object, key: string): unknown {
  const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !('value' in descriptor) || descriptor.get !== undefined || descriptor.set !== undefined) {
    throw new TypeError(`legacy ownership ${key} must be an own data field`);
  }
  return descriptor.value;
}

function legacyInput(source: LegacyOwnershipFields): LegacyOwnershipInputV1 {
  if (!source || typeof source !== 'object' || Array.isArray(source)
    || (Object.getPrototypeOf(source) !== Object.prototype && Object.getPrototypeOf(source) !== null)
    || Reflect.ownKeys(source).some((key) => typeof key === 'symbol')) {
    throw new TypeError('legacy ownership source must be plain data');
  }
  const legacyEpoch = ownData(source, 'EPOCH_BASE');
  const rawCodex = canonicalizeData(ownData(source, 'codex'));
  const rawNames = canonicalizeData(ownData(source, 'customNames'));
  const rawBioX = canonicalizeData(ownData(source, 'bioX'));
  const scout = canonicalizeData(ownData(source, 'scoutId'));
  if (!Array.isArray(rawCodex) || rawCodex.length > 1_500
    || !Array.isArray(rawNames) || rawNames.length > 5_000
    || !Array.isArray(rawBioX) || rawBioX.length > 60_000
    || (scout !== null && typeof scout !== 'string')) throw new TypeError('legacy ownership collections are invalid');
  const names = new Map<string, string>();
  rawNames.forEach((candidate) => {
    if (!Array.isArray(candidate) || candidate.length !== 2
      || typeof candidate[0] !== 'string' || typeof candidate[1] !== 'string') {
      throw new TypeError('legacy ownership name row is invalid');
    }
    names.set(candidate[0], candidate[1]);
  });
  const codexRows = rawCodex.map((candidate, index) => {
    if (!Array.isArray(candidate) || candidate.length !== 2 || typeof candidate[0] !== 'string') {
      throw new TypeError(`legacy ownership codex pair ${index} is invalid`);
    }
    const id = candidate[0];
    const entry = object(candidate[1], `legacy ownership codex entry ${index}`);
    if (entry.id !== id || !entry.g || typeof entry.from !== 'string') {
      throw new TypeError(`legacy ownership codex entry ${index} is invalid`);
    }
    const alias = names.get(`c${id}`) ?? null;
    return Object.freeze({
      legacyCodexId: id,
      genome: entry.g,
      from: entry.from,
      legacyLocation: entry.where ?? null,
      catalogAlias: alias,
      faunaNickname: alias,
    });
  });
  const bioXRows = rawBioX.map((candidate, index) => {
    if (!Array.isArray(candidate) || candidate.length !== 2 || typeof candidate[0] !== 'number'
      || !Array.isArray(candidate[1]) || candidate[1].length !== 2
      || typeof candidate[1][0] !== 'number' || typeof candidate[1][1] !== 'number') {
      throw new TypeError(`legacy ownership bioX pair ${index} is invalid`);
    }
    return Object.freeze({
      legacyPlanetSeed: candidate[0], used: candidate[1][0], epochStamp: candidate[1][1],
    });
  });
  return Object.freeze({
    legacyEpoch: legacyEpoch as number,
    codexRows: Object.freeze(codexRows),
    bioXRows: Object.freeze(bioXRows),
    scoutCodexId: scout,
  });
}

/** Convert one sanitized v1.8.9 mirror without rewards/events. If its full
    exact state cannot fit, return a registered inspection-only marker tied to
    compact exact-source evidence; never return a migrated prefix. */
export function migrateLegacyOwnership(source: LegacyOwnershipFields): Arc4OwnershipMigrationOutcome {
  let migrated: ReturnType<typeof migrateLegacyOwnershipStateV1>;
  try { migrated = migrateLegacyOwnershipStateV1(legacyInput(source)); } catch {
    return Object.freeze({ kind: 'refused', reason: 'legacy-corrupt' });
  }
  try {
    encodeArc4Ownership(migrated.state);
    return Object.freeze({
      kind: 'migrated', state: migrated.state, sourceEvidence: migrated.sourceEvidence,
    });
  } catch (error) {
    if (!(error instanceof Arc4CarrierError) || error.code !== 'bounds') {
      return Object.freeze({ kind: 'refused', reason: 'legacy-corrupt' });
    }
    const state = createLegacyProtectedOwnershipStateV1(migrated.sourceEvidence);
    encodeArc4Ownership(state);
    return Object.freeze({
      kind: 'legacy-protected', state, sourceEvidence: migrated.sourceEvidence, reason: 'carrier-bounds',
    });
  }
}

function canonicalBase(value: V5Extensions): V5Extensions | null {
  try { return strictExtensions(value); } catch { return null; }
}

function prepared(
  base: V5Extensions,
  state: OwnershipStateV1,
  migration?: PreparedArc4OwnershipWriteV1['migration'],
  migrationSourceEvidence?: LegacyOwnershipSourceEvidenceV1,
): Arc4OwnershipWritePreparation {
  let encoded: EncodedArc4OwnershipV1;
  try { encoded = encodeArc4Ownership(state); } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof Arc4CarrierError && error.code === 'bounds'
        ? 'extension-bounds' : 'state-unreadable',
    });
  }
  try {
    const applied = applyV5ExtensionWrites(base, encoded.writes);
    if (applied.writes.length !== ARC4_OWNERSHIP_EXTENSION_TARGETS.length) {
      throw new Error('Arc 4 write inventory changed');
    }
    return Object.freeze({
      kind: 'prepared', state, writes: encoded.writes, extensions: applied.extensions,
      ...(migration === undefined ? {} : { migration }),
      ...(migrationSourceEvidence === undefined ? {} : { migrationSourceEvidence }),
    });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'extension-bounds' });
  }
}

/** Prepare an exact +1 replacement for a current registered parent. */
export function prepareArc4OwnershipWrite(input: Readonly<{
  extensions: V5Extensions;
  state: OwnershipStateV1;
  resolver: OwnershipAddressResolver;
}>): Arc4OwnershipWritePreparation {
  const base = canonicalBase(input.extensions);
  if (base === null) return Object.freeze({ kind: 'protected', reason: 'extensions-corrupt' });
  const read = readArc4Ownership(base, input.resolver);
  if (read.kind === 'absent') return Object.freeze({ kind: 'protected', reason: 'target-absent' });
  if (read.kind === 'future-version') {
    return Object.freeze({ kind: 'protected', reason: 'target-future', version: read.version });
  }
  if (read.kind === 'corrupt') return Object.freeze({ kind: 'protected', reason: 'target-corrupt' });
  if (!isOwnershipStateV1(input.state)) {
    return Object.freeze({ kind: 'protected', reason: 'state-unreadable' });
  }
  if (read.state.revision === MAX_OWNERSHIP_REVISION) {
    return Object.freeze({
      kind: 'protected', reason: 'revision-exhausted', actualRevision: read.state.revision,
    });
  }
  const expectedRevision = read.state.revision + 1;
  if (input.state.revision !== expectedRevision || !isOwnershipSuccessorV1(input.state, read.state)) {
    return Object.freeze({
      kind: 'protected', reason: 'revision-conflict', expectedRevision,
      actualRevision: input.state.revision,
    });
  }
  return prepared(base, input.state);
}

/** Bootstrap only an absent target. Existing current bytes are returned;
    future/corrupt bytes and invalid legacy input remain untouched. */
export function prepareArc4OwnershipLegacyMigration(input: Readonly<{
  extensions: V5Extensions;
  legacy: LegacyOwnershipFields;
  resolver: OwnershipAddressResolver;
}>): Arc4OwnershipLegacyMigrationPreparation {
  const base = canonicalBase(input.extensions);
  if (base === null) return Object.freeze({ kind: 'protected', reason: 'extensions-corrupt' });
  const read = readArc4Ownership(base, input.resolver);
  if (read.kind === 'future-version') {
    return Object.freeze({ kind: 'protected', reason: 'target-future', version: read.version });
  }
  if (read.kind === 'corrupt') return Object.freeze({ kind: 'protected', reason: 'target-corrupt' });
  if (read.kind === 'loaded') return Object.freeze({ kind: 'already-loaded', state: read.state });
  const migration = migrateLegacyOwnership(input.legacy);
  if (migration.kind === 'refused') {
    return Object.freeze({ kind: 'protected', reason: 'legacy-corrupt' });
  }
  return prepared(base, migration.state, migration.kind, migration.sourceEvidence);
}

function legacyWorldWhere(
  address: OwnershipStateV1['biosphereProgress'][number]['worldAddress'],
): CanonicalJson {
  return canonicalizeData({
    type: 'planet',
    gal: {
      x: address.galaxy.x, y: address.galaxy.y, size: address.galaxy.size,
      sp: address.galaxy.sp, tilt: address.galaxy.tilt, rot: address.galaxy.rot,
      seed: address.galaxy.seed, home: address.galaxy.home,
      quasar: address.galaxy.quasar, dwarf: address.galaxy.dwarf,
    },
    star: { x: address.star.x, y: address.star.y, seed: address.star.seed },
    pseed: address.planet.seed,
  });
}

function unrepresentableMirror(
  reason: UnrepresentableLegacyOwnershipMirrorV1['reason'],
  leafSeed: number,
  owners: readonly string[],
): UnrepresentableLegacyOwnershipMirrorV1 {
  return Object.freeze({
    kind: 'unrepresentable', reason, leafSeed,
    canonicalOwners: Object.freeze([...owners].sort()),
  });
}

/** Project the complete v4 compatibility facts retained by the authoritative
    state. New world discoveries and canonical Biosphere progress participate;
    otherwise the still-unported Compendium/capture readers would remain stale
    after a durable Arc 4 action. Catalogue alias owns v1's single custom-name
    slot; a distinct fauna nickname remains safely in the carrier. A v4 leaf-
    seed collision is explicit refusal because one old key cannot represent two
    full-address/species owners without erasing one. */
export function projectLegacyOwnershipMirror(state: OwnershipStateV1): LegacyOwnershipMirrorV1 {
  if (!isOwnershipStateV1(state)) throw new TypeError('Arc 4 ownership state must be registered');
  if (state.mode === 'legacy-protected') {
    return Object.freeze({ kind: 'legacy-protected', sourceEvidence: state.legacyProtection! });
  }
  const discoveries = new Map(state.discoveries.map((row) => [row.recordId, row]));
  const creatures = new Map(state.creatures.map((row) => [row.acquisitionRecordId, row]));
  const projectionRows = state.catalogSpecies.map((species) => {
    const discovery = discoveries.get(species.firstObservationId)!;
    /* The supported v4 reader always recomputes `s${genome.seed}`. Preserve
       that exact key even when a hostile direct migration adapter supplied an
       inconsistent display id. */
    const legacyCodexId = `s${species.genome.seed}`;
    const category = discovery.provenance.kind === 'legacy'
      ? 0 : discovery.provenance.kind === 'world' ? 1 : 2;
    const order = discovery.provenance.kind === 'legacy'
      ? discovery.provenance.legacySourceIndex
      : discovery.provenance.kind === 'world'
        ? discovery.provenance.sourceOrdinal
        : discovery.provenance.receiptOrdinal;
    return { species, discovery, legacyCodexId, category, order };
  }).sort((left, right) => {
    return left.category - right.category || left.order - right.order
      || (left.legacyCodexId < right.legacyCodexId ? -1 : left.legacyCodexId > right.legacyCodexId ? 1 : 0);
  });
  const codexOwners = new Map<string, string>();
  for (const row of projectionRows) {
    const prior = codexOwners.get(row.legacyCodexId);
    if (prior !== undefined && prior !== row.species.speciesId) {
      return unrepresentableMirror(
        'codex-seed-collision',
        Number(row.species.genome.seed),
        [prior, row.species.speciesId],
      );
    }
    codexOwners.set(row.legacyCodexId, row.species.speciesId);
  }

  const biosphereOwners = new Map<number, string>();
  for (const row of state.legacyBioX) {
    biosphereOwners.set(row.legacyPlanetSeed, `legacy:${row.relation}`);
  }
  for (const row of state.biosphereProgress) {
    const seed = row.worldAddress.planet.seed;
    const prior = biosphereOwners.get(seed);
    if (prior !== undefined && prior !== row.worldKey) {
      return unrepresentableMirror('biosphere-seed-collision', seed, [prior, row.worldKey]);
    }
    biosphereOwners.set(seed, row.worldKey);
  }

  const customNames: Array<readonly [string, string]> = [];
  const codex = projectionRows.map(({ species, discovery, legacyCodexId }) => {
    const genome: Record<string, CanonicalJson> = { ...species.genome };
    const creature = creatures.get(discovery.recordId);
    if (creature) {
      genome.gen = creature.lineage.generation;
      if (creature.lineage.kind === 'legacy-parent-seeds') {
        genome.parents = creature.lineage.parentSeeds;
      }
      if (creature.xp !== null) genome.xp = creature.xp;
      if (creature.hurt !== null) genome.hurt = creature.hurt;
      if (creature.fed !== null) genome.fed = creature.fed;
      if (creature.brood !== null) genome.brood = creature.brood;
      if (creature.assignment !== null) genome.assignment = creature.assignment as unknown as CanonicalJson;
      if (creature.bond !== null) genome.bond = creature.bond as unknown as CanonicalJson;
    }
    if (species.alias !== null) customNames.push(Object.freeze([
      `c${legacyCodexId}`,
      species.alias,
    ] as const));
    const source = discovery.provenance;
    const from = source.kind === 'legacy'
      ? source.from
      : source.kind === 'paragon'
        ? `Paragon site #${source.paragonIndex + 1}`
        : `Canonical world ${source.worldAddress.planet.seed}`;
    const where = source.kind === 'legacy'
      ? source.legacyLocation?.display ?? null
      : legacyWorldWhere(source.worldAddress);
    return Object.freeze({
      legacyCodexId,
      g: canonicalizeData(genome) as Readonly<Record<string, CanonicalJson>>,
      f: from,
      w: where,
    });
  });
  let scoutId: string | null = null;
  if (state.scoutCreatureId !== null) {
    const creature = state.creatures.find((row) => row.creatureId === state.scoutCreatureId);
    const speciesProjection = creature && projectionRows.find((row) => row.species.speciesId === creature.speciesId);
    if (speciesProjection) scoutId = speciesProjection.legacyCodexId;
  }
  const bioX = [
    ...state.legacyBioX.map((row) => Object.freeze([
      row.legacyPlanetSeed,
      Object.freeze([row.used, row.epochStamp] as const),
    ] as const)),
    ...state.biosphereProgress.map((row) => Object.freeze([
      row.worldAddress.planet.seed,
      Object.freeze([row.used, row.cycle] as const),
    ] as const)),
  ].sort((left, right) => left[0] - right[0]);
  return Object.freeze({
    kind: 'projected',
    codex: Object.freeze(codex),
    customNames: Object.freeze(customNames),
    bioX: Object.freeze(bioX),
    scoutId,
  });
}

/** Semantic join between Arc 4 authority and the complete v4 compatibility
    surface it owns. Unrelated custom names remain outside Arc 4; every name
    keyed to one projected Compendium row is compared in projected order.
    Hostile, malformed, protected or unrepresentable inputs fail closed. */
export function arc4OwnershipLegacyMirrorMatches(
  state: OwnershipStateV1,
  legacy: LegacyOwnershipMirrorFields,
): boolean {
  try {
    if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) return false;
    const prototype = Object.getPrototypeOf(legacy);
    if (prototype !== Object.prototype && prototype !== null) return false;
    const mirror = projectLegacyOwnershipMirror(state);
    if (mirror.kind !== 'projected') return false;

    const rawCodex = canonicalizeData(ownData(legacy, 'codex'));
    const rawNames = canonicalizeData(ownData(legacy, 'customNames'));
    const rawBioX = canonicalizeData(ownData(legacy, 'bioX'));
    const rawScout = canonicalizeData(ownData(legacy, 'scoutId'));
    if (!Array.isArray(rawCodex) || !Array.isArray(rawNames) || !Array.isArray(rawBioX)
      || (rawScout !== null && typeof rawScout !== 'string')) return false;

    const actualCodex = rawCodex.map((candidate, index) => {
      if (!Array.isArray(candidate) || candidate.length !== 2 || typeof candidate[0] !== 'string') {
        throw new TypeError(`legacy ownership codex pair ${index} is invalid`);
      }
      const entry = object(candidate[1], `legacy ownership codex entry ${index}`);
      if (!Object.prototype.hasOwnProperty.call(entry, 'id')
        || !Object.prototype.hasOwnProperty.call(entry, 'g')
        || !Object.prototype.hasOwnProperty.call(entry, 'from')
        || !Object.prototype.hasOwnProperty.call(entry, 'where')
        || entry.id !== candidate[0]
        || typeof entry.from !== 'string'
        || !entry.g || typeof entry.g !== 'object' || Array.isArray(entry.g)
        || (entry.where !== null && (typeof entry.where !== 'object' || Array.isArray(entry.where)))) {
        throw new TypeError(`legacy ownership codex entry ${index} is invalid`);
      }
      return Object.freeze({
        legacyCodexId: candidate[0],
        g: entry.g,
        f: entry.from,
        w: entry.where,
      });
    });
    const ownedNameKeys = new Set(mirror.codex.map(({ legacyCodexId }) => `c${legacyCodexId}`));
    const actualOwnedNames = rawNames.filter((candidate, index): candidate is CanonicalJson[] => {
      if (!Array.isArray(candidate) || candidate.length !== 2
        || typeof candidate[0] !== 'string' || typeof candidate[1] !== 'string') {
        throw new TypeError(`legacy ownership name row ${index} is invalid`);
      }
      return ownedNameKeys.has(candidate[0]);
    });

    return canonicalJson(actualCodex) === canonicalJson(mirror.codex)
      && canonicalJson(actualOwnedNames) === canonicalJson(mirror.customNames)
      && canonicalJson(rawBioX) === canonicalJson(mirror.bioX)
      && rawScout === mirror.scoutId;
  } catch {
    return false;
  }
}
