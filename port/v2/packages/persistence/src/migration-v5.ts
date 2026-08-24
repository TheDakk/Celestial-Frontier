/* F3 v4 -> v5 compatibility migration.

   v4 remains the compatibility codec: importSaveV2 owns sanitization and
   exportSaveV2 owns the canonical legacy writer. v5 changes persistence
   topology, not product meaning. The canonical v4 envelope is partitioned
   into owner-named records and can always be reassembled through that same
   supported codec.

   Migration is one compare-and-apply transaction. It checks the exact v4
   primary and the absence of a v5 schema marker, then writes the split rows,
   the exact pre-migration bytes, the journal, and the schema marker together.
   It never deletes or overwrites the v4 primary. */
import { exportSaveV2 } from './export-v2.js';
import {
  importSaveV2,
  isLegacySliceEnvelope,
  isPlausibleSaveEnvelope,
  type ContentRegistry,
  type ImportRouteIngressV2,
  type SaveStateV2,
} from './import-v2.js';
import {
  V4_BACKUP_KEY,
  type StorageBackend,
  type StorageOperation,
  type StoreName,
} from './repository.js';
import { F3_REVISION_KEY, createRevisionedRepository } from './revisioned.js';

export const V5_SCHEMA_VERSION = 5;
export const V5_CODEC = 'legacy-v4-split-v1';
export const V4_PRIMARY_KEY = 'save';
export const V5_SCHEMA_KEY = 'v5:schema';
export const V5_SNAPSHOT_KEY = 'v5:pre-migration-v4';
export const V5_JOURNAL_KEY = 'v5:migration';
export const PORTABLE_V5_FORMAT = 'celestial-frontier-portable-v5';
export const PORTABLE_V5_VERSION = 1;
export const PORTABLE_V5_MAX_BYTES = 2_097_152;
export const PORTABLE_V5_MAX_LEGACY_BYTES = 1_048_576;
export const PORTABLE_V5_MAX_CLOCK_MS = 4_000_000_000_000;
export const V5_MAX_EXTENSION_JSON_BYTES = 262_144;
export const V5_MAX_EXTENSION_TOTAL_BYTES = 1_048_576;
export const V5_MAX_EXTENSION_NAMESPACES_PER_SEGMENT = 64;
export const V5_MAX_EXTENSION_NAMESPACES = 128;

export const V5_SEGMENTS = ['player', 'creatures', 'catalog', 'inventory', 'settings'] as const;
export type V5Segment = typeof V5_SEGMENTS[number];

/** Opaque, explicitly versioned v5-only data. The persistence layer carries
 * exact JSON bytes; the namespace owner (for example F4 clock/RNG authority)
 * owns their product schema. Keeping this outside `data` prevents v5-only
 * authority from leaking into or being erased by the v4 compatibility codec. */
export interface V5ExtensionCarrier {
  readonly version: number;
  readonly json: string;
}
export interface V5ExtensionWrite {
  readonly segment: V5Segment;
  readonly namespace: string;
  readonly carrier: V5ExtensionCarrier;
}
export type V5Extensions = Readonly<Partial<Record<
  V5Segment,
  Readonly<Record<string, V5ExtensionCarrier>>
>>>;

export interface AppliedV5ExtensionWrites {
  readonly writes: readonly V5ExtensionWrite[];
  readonly extensions: V5Extensions;
}

const SEGMENT_STORE: Readonly<Record<V5Segment, StoreName>> = Object.freeze({
  player: 'player',
  creatures: 'creatures',
  catalog: 'catalog',
  inventory: 'inventory',
  settings: 'settings',
});

const SETTINGS_FIELDS = [
  'fs', 'tone', 'font', 'snd', 'fx', 'chart', 'shake', 'sv', 'notif', 'tips',
  'vol', 'gt', 'rm', 'cx', 'vce', 'cbx',
] as const;
const INVENTORY_FIELDS = [
  'setsc', 'cargo', 'cgx', 'jrn', 'pin', 'ctb', 'minedw', 'mx', 'skx', 'bx',
  'tech', 'items', 'eq', 'ea', 'xpf',
] as const;
const CATALOG_FIELDS = [
  'land', 'scout', 'wvo', 'cont', 'seen', 'surveyed', 'gals', 'surf', 'sysv',
  'starK', 'ptypes', 'evts', 'evann', 'log', 'home', 'prime', 'codex',
] as const;
const PLAYER_FIELDS = [
  'v', 'epoch', 'view', 'hp', 'pstats', 'landings', 'chs', 'chw', 'chp',
  'chacc', 'charters', 'notifs', 'me', 'essence', 'conq', 'breeds',
  'breedwins', 'feeds', 'feedfails', 'harvests', 'essenceEarned', 'guardians',
  'paragons', 'nh', 'br', 'at', 'mines', 'crafts', 'minedout', 'skims',
  'cosmics', 'asc', 'ascp', 'names', 'shares', 'jumps', 'anomalies', 'anomKey',
  'events', 'duels', 'duelwins', 'ever', 'ach', 'frontier', 'ending', 'guide',
  'tut', 'rn', 'tsnap',
] as const;

const FIELD_OWNER = (() => {
  const owners = new Map<string, V5Segment>();
  const add = (segment: V5Segment, fields: readonly string[]): void => {
    for (const field of fields) {
      if (owners.has(field)) throw new Error(`duplicate v4 field owner: ${field}`);
      owners.set(field, segment);
    }
  };
  add('player', PLAYER_FIELDS);
  add('catalog', CATALOG_FIELDS);
  add('inventory', INVENTORY_FIELDS);
  add('settings', SETTINGS_FIELDS);
  return owners;
})();

interface V5SchemaRow {
  readonly schema: 5;
  readonly codec: typeof V5_CODEC;
  readonly sourceSchema: 4;
  readonly segments: readonly V5Segment[];
}

interface V5SegmentRow {
  readonly schema: 5;
  readonly segment: V5Segment;
  readonly data: Readonly<Record<string, unknown>>;
  readonly extensions?: Readonly<Record<string, V5ExtensionCarrier>>;
}

interface V5SnapshotRowV4 {
  readonly schema: 5;
  readonly sourceSchema: 4;
  readonly raw: string;
}
interface V5SnapshotRowPortable {
  readonly schema: 5;
  readonly sourceSchema: 5;
  readonly raw: string;
}
type V5SnapshotRow = V5SnapshotRowV4 | V5SnapshotRowPortable;

interface PortableV5EnvelopeV1 {
  readonly format: typeof PORTABLE_V5_FORMAT;
  readonly version: typeof PORTABLE_V5_VERSION;
  readonly legacyV4: string;
  readonly extensions: V5Extensions;
}

export type V4SaveClassification =
  | { readonly kind: 'supported'; readonly state: SaveStateV2; readonly ingress: ImportRouteIngressV2; readonly normalizedRaw: string }
  | { readonly kind: 'future-version' }
  | { readonly kind: 'corrupt' };

export interface PreparedV5Migration {
  readonly normalizedV4Raw: string;
  readonly operations: readonly StorageOperation[];
}

export interface V5WritableState {
  readonly state: SaveStateV2;
  /** Required even when empty: callers must deliberately pass through the
   * extensions returned by readSaveV5 instead of silently dropping v5-only
   * authority while refreshing the compatibility mirror. */
  readonly extensions: V5Extensions;
}

export interface PreparedV5SaveWrite {
  readonly canonicalState: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly legacyV4Raw: string;
  /** Suitable directly as `RevisionedMutation.writes`. These operations do
   * not touch schema, migration journal/snapshot, revision, or receipts. */
  readonly operations: readonly StorageOperation[];
}

export type PortableV5SaveClassification =
  | {
    readonly kind: 'supported';
    readonly state: SaveStateV2;
    readonly ingress: ImportRouteIngressV2;
    readonly legacyV4Raw: string;
    readonly extensions: V5Extensions;
    readonly canonicalRaw: string;
  }
  | { readonly kind: 'future-version' }
  | { readonly kind: 'corrupt' };

export type V5ReplacementPreparation =
  | {
    readonly kind: 'prepared';
    readonly state: SaveStateV2;
    readonly ingress: ImportRouteIngressV2;
    readonly exactRaw: string;
    readonly legacyV4Raw: string;
    readonly extensions: V5Extensions;
    readonly source: 'legacy-v4' | 'portable-v5';
    readonly operations: readonly StorageOperation[];
  }
  | { readonly kind: 'future-version' }
  | { readonly kind: 'corrupt' };

export type FreshV5BootstrapOutcome =
  | { readonly kind: 'initialized'; readonly revision: 1; readonly legacyV4Raw: string }
  | { readonly kind: 'not-fresh' }
  | { readonly kind: 'storage-error'; readonly message: string };

export type V5ReadOutcome =
  | { readonly kind: 'not-migrated' }
  | { readonly kind: 'loaded'; readonly state: SaveStateV2; readonly ingress: ImportRouteIngressV2; readonly extensions: V5Extensions; readonly legacyV4Raw: string }
  /* Historical outcome name retained for app compatibility. A trusted
     portable-v5 replacement snapshot also uses this read-only recovery shape
     and carries its validated extensions instead of dropping them. */
  | { readonly kind: 'recovered-v4'; readonly state: SaveStateV2; readonly ingress: ImportRouteIngressV2; readonly extensions: V5Extensions; readonly raw: string; readonly normalizedV4Raw: string }
  | { readonly kind: 'future-version'; readonly scope: 'schema' | V5Segment | 'snapshot' | 'envelope' }
  | { readonly kind: 'corrupt'; readonly scope: 'schema' | V5Segment | 'snapshot' | 'envelope' }
  | { readonly kind: 'storage-error'; readonly message: string };

/** A v5 read accepted together with the exact F3 revision that bracketed its
 * complete multi-row snapshot. A changed revision is neither corruption nor
 * a newer accepted parent; callers must protect/reload instead of pairing the
 * old product state with a newer CAS revision. */
export type RevisionedV5ReadOutcome =
  | (Extract<V5ReadOutcome, { readonly kind: 'loaded' }> & { readonly revision: number })
  | Exclude<V5ReadOutcome, { readonly kind: 'loaded' }>
  | { readonly kind: 'changed' };

export type V5MigrationOutcome =
  | { readonly kind: 'fresh' }
  | { readonly kind: 'migrated'; readonly normalizedV4Raw: string }
  | { readonly kind: 'already-current'; readonly legacyV4Raw: string }
  | { readonly kind: 'protected'; readonly reason: 'future-version' | 'corrupt' }
  | { readonly kind: 'stale-source' }
  | { readonly kind: 'storage-error'; readonly message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseRecord(raw: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(raw) as unknown;
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function classifyVersion(value: unknown): 'current' | 'future' | 'corrupt' {
  if (!Number.isSafeInteger(value) || (value as number) < 0) return 'corrupt';
  if ((value as number) > V5_SCHEMA_VERSION) return 'future';
  return value === V5_SCHEMA_VERSION ? 'current' : 'corrupt';
}

const EMPTY_EXTENSIONS: V5Extensions = Object.freeze({});

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

/** Validate, detach, freeze, and deterministically order every opaque
 * extension carrier. This is the one persistence-level validator used by
 * split rows, portable backups, and product transactions. Namespace owners
 * remain responsible for interpreting their JSON payloads. */
export function canonicalizeV5Extensions(value: unknown): V5Extensions {
  if (!isRecord(value)) throw new Error('v5 extensions must be an object');
  const result: Partial<Record<V5Segment, Readonly<Record<string, V5ExtensionCarrier>>>> = {};
  const unknownSegment = Object.keys(value).find(
    (segmentName) => !(V5_SEGMENTS as readonly string[]).includes(segmentName),
  );
  if (unknownSegment !== undefined) {
    throw new Error(`unknown v5 extension segment ${JSON.stringify(unknownSegment)}`);
  }
  let totalNamespaces = 0;
  let totalJsonBytes = 0;
  for (const segmentName of V5_SEGMENTS) {
    const rawNamespaceMap = value[segmentName];
    if (rawNamespaceMap === undefined) continue;
    if (!isRecord(rawNamespaceMap)) throw new Error(`v5 ${segmentName} extensions must be an object`);
    const namespaceNames = Object.keys(rawNamespaceMap).sort();
    if (namespaceNames.length > V5_MAX_EXTENSION_NAMESPACES_PER_SEGMENT) {
      throw new Error(`v5 ${segmentName} extension namespace count exceeds ${V5_MAX_EXTENSION_NAMESPACES_PER_SEGMENT}`);
    }
    totalNamespaces += namespaceNames.length;
    if (totalNamespaces > V5_MAX_EXTENSION_NAMESPACES) {
      throw new Error(`v5 extension namespace count exceeds ${V5_MAX_EXTENSION_NAMESPACES}`);
    }
    const namespaces: Record<string, V5ExtensionCarrier> = {};
    for (const namespace of namespaceNames) {
      const rawCarrier = rawNamespaceMap[namespace];
      if (!/^[a-z][a-z0-9.-]{0,63}$/.test(namespace)) throw new Error(`invalid v5 extension namespace ${JSON.stringify(namespace)}`);
      if (!isRecord(rawCarrier) || !exactKeys(rawCarrier, ['version', 'json'])) {
        throw new Error(`invalid v5 extension carrier ${JSON.stringify(namespace)}`);
      }
      if (!Number.isSafeInteger(rawCarrier.version) || (rawCarrier.version as number) < 1) {
        throw new Error(`invalid v5 extension version ${JSON.stringify(namespace)}`);
      }
      if (typeof rawCarrier.json !== 'string'
        || rawCarrier.json.length > V5_MAX_EXTENSION_JSON_BYTES) {
        throw new Error(`invalid v5 extension JSON ${JSON.stringify(namespace)}`);
      }
      const jsonBytes = utf8ByteLength(rawCarrier.json);
      if (jsonBytes > V5_MAX_EXTENSION_JSON_BYTES || parseRecord(rawCarrier.json) === null) {
        throw new Error(`invalid v5 extension JSON ${JSON.stringify(namespace)}`);
      }
      totalJsonBytes += jsonBytes;
      if (totalJsonBytes > V5_MAX_EXTENSION_TOTAL_BYTES) {
        throw new Error(`v5 extension JSON total exceeds ${V5_MAX_EXTENSION_TOTAL_BYTES} bytes`);
      }
      namespaces[namespace] = Object.freeze({ version: rawCarrier.version as number, json: rawCarrier.json });
    }
    if (Object.keys(namespaces).length > 0) {
      result[segmentName as V5Segment] = Object.freeze(namespaces);
    }
  }
  return Object.keys(result).length === 0 ? EMPTY_EXTENSIONS : Object.freeze(result);
}

/** Validate complete namespace replacements, reject duplicate ownership, and
 * apply them to a detached canonical base. Product-specific protected
 * namespaces remain the caller's policy; this shared layer owns only the v5
 * shape and aggregate bounds. */
export function applyV5ExtensionWrites(
  base: V5Extensions,
  value: unknown,
): AppliedV5ExtensionWrites {
  if (!Array.isArray(value)) throw new TypeError('extensionWrites must be an array');
  if (value.length > V5_MAX_EXTENSION_NAMESPACES) {
    throw new RangeError(`extensionWrites count exceeds ${V5_MAX_EXTENSION_NAMESPACES}`);
  }
  const seen = new Set<string>();
  const writes = Object.freeze(value.map((rawWrite): V5ExtensionWrite => {
    if (!isRecord(rawWrite) || !exactKeys(rawWrite, ['segment', 'namespace', 'carrier'])) {
      throw new TypeError('each extension write must contain exactly segment, namespace, and carrier');
    }
    if (typeof rawWrite.segment !== 'string'
      || !(V5_SEGMENTS as readonly string[]).includes(rawWrite.segment)) {
      throw new RangeError(`unknown v5 extension segment ${JSON.stringify(rawWrite.segment)}`);
    }
    const segment = rawWrite.segment as V5Segment;
    if (typeof rawWrite.namespace !== 'string') {
      throw new RangeError(`invalid v5 extension namespace ${JSON.stringify(rawWrite.namespace)}`);
    }
    const identity = `${segment}\u0000${rawWrite.namespace}`;
    if (seen.has(identity)) {
      throw new Error(`duplicate product extension write for ${segment}/${rawWrite.namespace}`);
    }
    seen.add(identity);
    const isolated = canonicalizeV5Extensions({
      [segment]: { [rawWrite.namespace]: rawWrite.carrier },
    });
    const carrier = isolated[segment]?.[rawWrite.namespace];
    if (carrier === undefined) throw new Error('validated extension carrier was not retained');
    return Object.freeze({ segment, namespace: rawWrite.namespace, carrier });
  }));
  if (writes.length === 0) {
    return Object.freeze({ writes, extensions: canonicalizeV5Extensions(base) });
  }
  const result: Partial<Record<V5Segment, Readonly<Record<string, V5ExtensionCarrier>>>> = {
    ...canonicalizeV5Extensions(base),
  };
  for (const write of writes) {
    result[write.segment] = Object.freeze({
      ...(result[write.segment] ?? {}),
      [write.namespace]: write.carrier,
    });
  }
  return Object.freeze({ writes, extensions: canonicalizeV5Extensions(result) });
}

function canonicalV4FromState(
  state: SaveStateV2,
  registry: ContentRegistry,
  now: number,
): { state: SaveStateV2; raw: string } {
  /* The legacy writer has intentional first-pass normalization (including
     conquest display-stamp floors). Persist its fixed point, not an
     intermediate envelope that would move on the first v5 read. */
  const firstRaw = exportSaveV2(state, now);
  const second = importSaveV2(firstRaw, registry, now);
  if (!second.ok) throw new Error('v4 writer emitted an unreadable compatibility envelope');
  const normalizedRaw = exportSaveV2(second.state, now);
  const third = importSaveV2(normalizedRaw, registry, now);
  if (!third.ok || exportSaveV2(third.state, now) !== normalizedRaw) {
    throw new Error('v4 compatibility codec did not reach its fixed point');
  }
  return { state: third.state, raw: normalizedRaw };
}

function classifyV4Source(
  raw: string,
  registry: ContentRegistry,
  now: number,
  allowLegacySlice: boolean,
): V4SaveClassification {
  const imported = importSaveV2(raw, registry, now);
  if (!imported.ok) return { kind: imported.reason === 'future-version' ? 'future-version' : 'corrupt' };
  const parsed = parseRecord(raw);
  if (parsed === null
    || !(isPlausibleSaveEnvelope(parsed) || (allowLegacySlice && isLegacySliceEnvelope(parsed)))) {
    return { kind: 'corrupt' };
  }
  try {
    const canonical = canonicalV4FromState(imported.state, registry, now);
    return { kind: 'supported', state: imported.state, ingress: imported.ingress, normalizedRaw: canonical.raw };
  } catch {
    return { kind: 'corrupt' };
  }
}

/** Authentic complete-v4 classification, stricter than the deliberately
 * total loader. Deliberately excludes the historical development-slice
 * bridge: trusted replacement/import callers must still prove a whole save. */
export function classifyV4Save(raw: string, registry: ContentRegistry, now: number): V4SaveClassification {
  return classifyV4Source(raw, registry, now, false);
}

/** Stored-source compatibility boundary. In addition to a complete mature
 * v4 envelope it accepts only the exact two-field `cf-v2-slice` shape written
 * by the historical app. The original bytes remain the migration snapshot;
 * all durable v5 rows are produced through the ordinary bounded v4 codec. */
function classifyStoredV4Source(raw: string, registry: ContentRegistry, now: number): V4SaveClassification {
  return classifyV4Source(raw, registry, now, true);
}

function splitV4Envelope(raw: string): Readonly<Record<V5Segment, Readonly<Record<string, unknown>>>> {
  const envelope = parseRecord(raw);
  if (envelope === null) throw new Error('canonical v4 writer emitted a non-object');
  const split: Record<V5Segment, Record<string, unknown>> = {
    player: {}, creatures: {}, catalog: {}, inventory: {}, settings: {},
  };
  for (const [field, value] of Object.entries(envelope)) {
    const owner = FIELD_OWNER.get(field);
    if (owner === undefined) throw new Error(`canonical v4 writer emitted unowned field ${JSON.stringify(field)}`);
    split[owner][field] = value;
  }
  return Object.freeze(Object.fromEntries(
    V5_SEGMENTS.map((segment) => [segment, Object.freeze(split[segment])]),
  ) as unknown as Record<V5Segment, Readonly<Record<string, unknown>>>);
}

function segmentOperations(raw: string, extensions: V5Extensions): StorageOperation[] {
  const split = splitV4Envelope(raw);
  return V5_SEGMENTS.map((segment) => {
    const segmentExtensions = extensions[segment];
    const row: V5SegmentRow = {
      schema: V5_SCHEMA_VERSION,
      segment,
      data: split[segment],
      ...(segmentExtensions === undefined ? {} : { extensions: segmentExtensions }),
    };
    return {
      store: SEGMENT_STORE[segment],
      key: `v5:${segment}`,
      value: JSON.stringify(row),
    };
  });
}

/** Prepare an ordinary post-migration save for the revision/CAS boundary.
 * Every compatibility-owned segment and `meta/save` mirror is refreshed in
 * the caller's one RevisionedRepository transaction. Schema, snapshot,
 * journal, revision and receipt rows are deliberately absent. */
export function prepareV5SaveWrite(
  writable: V5WritableState,
  registry: ContentRegistry,
  now: number,
): PreparedV5SaveWrite {
  const extensions = canonicalizeV5Extensions(writable.extensions);
  const canonical = canonicalV4FromState(writable.state, registry, now);
  const operations = segmentOperations(canonical.raw, extensions);
  operations.push({ store: 'meta', key: V4_PRIMARY_KEY, value: canonical.raw });
  return Object.freeze({
    canonicalState: canonical.state,
    extensions,
    legacyV4Raw: canonical.raw,
    operations: Object.freeze(operations),
  });
}

function withinUtf8Bound(value: string, maxBytes: number): boolean {
  return value.length <= maxBytes && utf8ByteLength(value) <= maxBytes;
}

function encodePortableEnvelope(
  legacyV4: string,
  extensions: V5Extensions,
): string {
  const envelope: PortableV5EnvelopeV1 = {
    format: PORTABLE_V5_FORMAT,
    version: PORTABLE_V5_VERSION,
    legacyV4,
    extensions,
  };
  const raw = JSON.stringify(envelope);
  if (!withinUtf8Bound(raw, PORTABLE_V5_MAX_BYTES)) {
    throw new RangeError(`portable v5 save exceeds ${PORTABLE_V5_MAX_BYTES} bytes`);
  }
  return raw;
}

/** Encode one transportable save that retains both the canonical legacy-v4
 * projection and every validated v5-only namespace. The exact bytes are a
 * fixed point: importing and exporting the result again produces the same
 * string. This is the only API through which a portable carrier may claim
 * v5 extension authority. */
export function exportPortableV5Save(
  writable: V5WritableState,
  registry: ContentRegistry,
  now: number,
): string {
  if (!Number.isSafeInteger(now) || now < 0 || now > PORTABLE_V5_MAX_CLOCK_MS) {
    throw new RangeError(`portable v5 clock must be an integer from 0 to ${PORTABLE_V5_MAX_CLOCK_MS}`);
  }
  const extensions = canonicalizeV5Extensions(writable.extensions);
  const canonical = canonicalV4FromState(writable.state, registry, now);
  if (!withinUtf8Bound(canonical.raw, PORTABLE_V5_MAX_LEGACY_BYTES)) {
    throw new RangeError(`portable v5 legacy projection exceeds ${PORTABLE_V5_MAX_LEGACY_BYTES} bytes`);
  }
  return encodePortableEnvelope(canonical.raw, extensions);
}

/** Strict portable classifier. Current envelopes accept no aliases, unknown
 * fields, whitespace variants, reordered fields, non-fixed legacy bytes, or
 * unchecked extension carriers. A future envelope version remains protected
 * rather than being interpreted as legacy v4. */
export function classifyPortableV5Save(
  exactRaw: string,
  registry: ContentRegistry,
  now: number,
): PortableV5SaveClassification {
  if (!withinUtf8Bound(exactRaw, PORTABLE_V5_MAX_BYTES)) return { kind: 'corrupt' };
  const envelope = parseRecord(exactRaw);
  if (envelope === null || envelope.format !== PORTABLE_V5_FORMAT) return { kind: 'corrupt' };
  if (!Number.isSafeInteger(envelope.version) || (envelope.version as number) < 1) {
    return { kind: 'corrupt' };
  }
  if ((envelope.version as number) > PORTABLE_V5_VERSION) return { kind: 'future-version' };
  if (!exactKeys(envelope, ['format', 'version', 'legacyV4', 'extensions'])
    || envelope.version !== PORTABLE_V5_VERSION
    || typeof envelope.legacyV4 !== 'string'
    || !withinUtf8Bound(envelope.legacyV4, PORTABLE_V5_MAX_LEGACY_BYTES)) {
    return { kind: 'corrupt' };
  }

  const legacyEnvelope = parseRecord(envelope.legacyV4);
  const exportedAt = legacyEnvelope?.at;
  if (typeof exportedAt !== 'number'
    || !Number.isSafeInteger(exportedAt)
    || exportedAt < 0
    || exportedAt > PORTABLE_V5_MAX_CLOCK_MS) {
    return { kind: 'corrupt' };
  }
  /* `at` is part of the legacy-v4 writer's canonical bytes. Validate the
     fixed point against that embedded export clock, never the importer's
     later wall clock; otherwise an authentic backup expires immediately.
     Runtime state still imports against the caller's current clock so the
     legacy anti-edit clamps retain their ordinary behavior. */
  const fixedPoint = classifyV4Save(envelope.legacyV4, registry, exportedAt);
  if (fixedPoint.kind !== 'supported') return fixedPoint;
  if (fixedPoint.normalizedRaw !== envelope.legacyV4) return { kind: 'corrupt' };
  const imported = importSaveV2(envelope.legacyV4, registry, now);
  if (!imported.ok) {
    return { kind: imported.reason === 'future-version' ? 'future-version' : 'corrupt' };
  }
  try {
    const extensions = canonicalizeV5Extensions(envelope.extensions);
    const canonicalRaw = encodePortableEnvelope(fixedPoint.normalizedRaw, extensions);
    if (canonicalRaw !== exactRaw) return { kind: 'corrupt' };
    return Object.freeze({
      kind: 'supported',
      state: imported.state,
      ingress: imported.ingress,
      legacyV4Raw: fixedPoint.normalizedRaw,
      extensions,
      canonicalRaw,
    });
  } catch {
    return { kind: 'corrupt' };
  }
}

/** Prepare one trusted complete-save replacement for RevisionedRepository.
 * Authentic v4 starts with no v5-only extensions. A strict portable-v5
 * envelope retains its validated extension namespaces. In either case the
 * old compatibility backup is deleted in the same CAS as split rows and the
 * replacement snapshot, so no prior expedition can resurrect. */
export function prepareV5Replacement(
  exactRaw: string,
  registry: ContentRegistry,
  now: number,
): V5ReplacementPreparation {
  if (!withinUtf8Bound(exactRaw, PORTABLE_V5_MAX_BYTES)) return { kind: 'corrupt' };
  const parsed = parseRecord(exactRaw);
  const portable = parsed?.format === PORTABLE_V5_FORMAT;
  let state: SaveStateV2;
  let ingress: ImportRouteIngressV2;
  let legacyV4Raw: string;
  let extensions: V5Extensions;
  let source: 'legacy-v4' | 'portable-v5';
  if (portable) {
    const classified = classifyPortableV5Save(exactRaw, registry, now);
    if (classified.kind !== 'supported') return classified;
    ({ state, ingress, legacyV4Raw, extensions } = classified);
    source = 'portable-v5';
  } else {
    const classified = classifyV4Save(exactRaw, registry, now);
    if (classified.kind !== 'supported') return classified;
    state = classified.state;
    ingress = classified.ingress;
    legacyV4Raw = classified.normalizedRaw;
    extensions = EMPTY_EXTENSIONS;
    source = 'legacy-v4';
  }
  const snapshot: V5SnapshotRow = portable
    ? { schema: V5_SCHEMA_VERSION, sourceSchema: 5, raw: exactRaw }
    : { schema: V5_SCHEMA_VERSION, sourceSchema: 4, raw: exactRaw };
  const operations = segmentOperations(legacyV4Raw, extensions);
  operations.push(
    { store: 'meta', key: V4_PRIMARY_KEY, value: portable ? legacyV4Raw : exactRaw },
    { store: 'meta', key: V4_BACKUP_KEY },
    {
      store: 'journal',
      key: V5_SNAPSHOT_KEY,
      value: JSON.stringify(snapshot),
    },
    {
      store: 'journal',
      key: V5_JOURNAL_KEY,
      value: JSON.stringify({
        schema: V5_SCHEMA_VERSION,
        kind: portable ? 'trusted-portable-v5-replacement' : 'trusted-v4-replacement',
        phase: 'complete',
        snapshotKey: V5_SNAPSHOT_KEY,
        codec: V5_CODEC,
      }),
    },
  );
  return Object.freeze({
    kind: 'prepared',
    state,
    ingress,
    exactRaw,
    legacyV4Raw,
    extensions,
    source,
    operations: Object.freeze(operations),
  });
}

/** Establish the first v5 save through one RevisionedRepository transaction.
 * Exact absence fences protect every pre-schema authority row; the repository
 * adds and reserves revision 1 in that same CAS. */
export async function initializeFreshV5(
  backend: StorageBackend,
  writable: V5WritableState,
  registry: ContentRegistry,
  now: number,
): Promise<FreshV5BootstrapOutcome> {
  try {
    const prepared = prepareV5SaveWrite(writable, registry, now);
    const segmentWrites = prepared.operations.filter((operation) => operation.store !== 'meta');
    const fences = [
      { store: 'meta' as const, key: V4_PRIMARY_KEY, value: undefined },
      { store: 'meta' as const, key: V5_SCHEMA_KEY, value: undefined },
      { store: 'journal' as const, key: V5_SNAPSHOT_KEY, value: undefined },
      { store: 'journal' as const, key: V5_JOURNAL_KEY, value: undefined },
      ...V5_SEGMENTS.map((segment) => ({
        store: SEGMENT_STORE[segment], key: `v5:${segment}`, value: undefined,
      })),
    ];
    const schema: V5SchemaRow = {
      schema: V5_SCHEMA_VERSION,
      codec: V5_CODEC,
      sourceSchema: 4,
      segments: V5_SEGMENTS,
    };
    const outcome = await createRevisionedRepository(backend).mutate({
      expectedRevision: 0,
      fences,
      writes: [
        ...segmentWrites,
        { store: 'meta', key: V4_PRIMARY_KEY, value: prepared.legacyV4Raw },
        {
          store: 'journal',
          key: V5_JOURNAL_KEY,
          value: JSON.stringify({
            schema: V5_SCHEMA_VERSION,
            kind: 'fresh-v5-init',
            phase: 'complete',
            snapshotKey: null,
            codec: V5_CODEC,
          }),
        },
        { store: 'meta', key: V5_SCHEMA_KEY, value: JSON.stringify(schema) },
      ],
    });
    return outcome.kind === 'committed'
      ? { kind: 'initialized', revision: 1, legacyV4Raw: prepared.legacyV4Raw }
      : { kind: 'not-fresh' };
  } catch (error) {
    return { kind: 'storage-error', message: error instanceof Error ? error.message : String(error) };
  }
}

export function prepareV4ToV5Migration(
  raw: string,
  registry: ContentRegistry,
  now: number,
): PreparedV5Migration | Exclude<V4SaveClassification, { kind: 'supported' }> {
  const classified = classifyStoredV4Source(raw, registry, now);
  if (classified.kind !== 'supported') return classified;
  const schema: V5SchemaRow = {
    schema: V5_SCHEMA_VERSION,
    codec: V5_CODEC,
    sourceSchema: 4,
    segments: V5_SEGMENTS,
  };
  const snapshot: V5SnapshotRow = { schema: V5_SCHEMA_VERSION, sourceSchema: 4, raw };
  const operations = segmentOperations(classified.normalizedRaw, EMPTY_EXTENSIONS);
  operations.push(
    { store: 'journal', key: V5_SNAPSHOT_KEY, value: JSON.stringify(snapshot) },
    {
      store: 'journal',
      key: V5_JOURNAL_KEY,
      value: JSON.stringify({
        schema: V5_SCHEMA_VERSION,
        kind: 'v4-to-v5',
        phase: 'complete',
        snapshotKey: V5_SNAPSHOT_KEY,
        codec: V5_CODEC,
      }),
    },
    /* A migrated repository starts from an explicit revision rather than
       absence. Deleting a once-used revision can therefore never recreate
       the pre-migration compare-and-apply parent (ABA). */
    { store: 'meta', key: F3_REVISION_KEY, value: '0' },
    /* The schema marker is intentionally last in the operation list. The
       backend contract is atomic, but this also keeps intent obvious in raw
       transaction traces and fault-injection diagnostics. */
    { store: 'meta', key: V5_SCHEMA_KEY, value: JSON.stringify(schema) },
  );
  return { normalizedV4Raw: classified.normalizedRaw, operations: Object.freeze(operations) };
}

function decodeSchema(raw: string): 'current' | 'future' | 'corrupt' {
  const row = parseRecord(raw);
  if (row === null) return 'corrupt';
  const version = classifyVersion(row.schema);
  if (version !== 'current') return version;
  if (!exactKeys(row, ['schema', 'codec', 'sourceSchema', 'segments'])
    || row.codec !== V5_CODEC || row.sourceSchema !== 4
    || !Array.isArray(row.segments)
    || row.segments.length !== V5_SEGMENTS.length
    || !row.segments.every((segment, index) => segment === V5_SEGMENTS[index])) return 'corrupt';
  return 'current';
}

function decodeSegment(raw: string, expected: V5Segment):
  | { kind: 'current'; data: Record<string, unknown>; extensions?: Readonly<Record<string, V5ExtensionCarrier>> }
  | { kind: 'future' }
  | { kind: 'corrupt' } {
  const row = parseRecord(raw);
  if (row === null) return { kind: 'corrupt' };
  const version = classifyVersion(row.schema);
  if (version !== 'current') return { kind: version };
  const hasExtensions = Object.prototype.hasOwnProperty.call(row, 'extensions');
  if (!(exactKeys(row, ['schema', 'segment', 'data'])
      || exactKeys(row, ['schema', 'segment', 'data', 'extensions']))
    || row.segment !== expected || !isRecord(row.data)) {
    return { kind: 'corrupt' };
  }
  for (const field of Object.keys(row.data)) {
    if (FIELD_OWNER.get(field) !== expected) return { kind: 'corrupt' };
  }
  if (!hasExtensions) return { kind: 'current', data: row.data };
  try {
    const checked = canonicalizeV5Extensions({ [expected]: row.extensions });
    return { kind: 'current', data: row.data, ...(checked[expected] === undefined ? {} : { extensions: checked[expected] }) };
  } catch {
    return { kind: 'corrupt' };
  }
}

function rebaseIngress(
  sourceState: SaveStateV2,
  sourceIngress: ImportRouteIngressV2,
  targetState: SaveStateV2,
): ImportRouteIngressV2 {
  const sourceEntries = new Map(sourceState.logMap);
  const atlasWhere = new WeakMap<Record<string, unknown>, unknown>();
  let size = 0;
  for (const [id, targetEntry] of targetState.logMap) {
    const sourceEntry = sourceEntries.get(id);
    if (sourceEntry === undefined || !sourceIngress.atlasWhere.has(sourceEntry)) continue;
    atlasWhere.set(targetEntry, sourceIngress.atlasWhere.get(sourceEntry));
    size++;
  }
  return Object.freeze({
    savedView: sourceIngress.savedView,
    trainingSnapshot: sourceIngress.trainingSnapshot,
    atlasWhere: Object.freeze({
      size,
      has: (entry: Record<string, unknown>): boolean => atlasWhere.has(entry),
      get: (entry: Record<string, unknown>): unknown => atlasWhere.get(entry),
    }),
  });
}

/** Read split v5 rows, reassemble their v4-compatible envelope, and pass it
 * through the supported v4 reader/writer. Unknown future rows are protected;
 * malformed current rows are never silently hardened into defaults. */
export async function readSaveV5(
  backend: StorageBackend,
  registry: ContentRegistry,
  now: number,
): Promise<V5ReadOutcome> {
  try {
    const schemaRaw = await backend.get('meta', V5_SCHEMA_KEY);
    if (schemaRaw === undefined) return { kind: 'not-migrated' };
    const schema = decodeSchema(schemaRaw);
    if (schema === 'future') return { kind: 'future-version', scope: 'schema' };
    if (schema === 'corrupt') return { kind: 'corrupt', scope: 'schema' };

    const envelope: Record<string, unknown> = {};
    const extensions: Partial<Record<V5Segment, Readonly<Record<string, V5ExtensionCarrier>>>> = {};
    for (const segment of V5_SEGMENTS) {
      const raw = await backend.get(SEGMENT_STORE[segment], `v5:${segment}`);
      if (raw === undefined) return { kind: 'corrupt', scope: segment };
      const decoded = decodeSegment(raw, segment);
      if (decoded.kind === 'future') return { kind: 'future-version', scope: segment };
      if (decoded.kind === 'corrupt') return { kind: 'corrupt', scope: segment };
      if (decoded.extensions !== undefined) extensions[segment] = decoded.extensions;
      for (const [field, value] of Object.entries(decoded.data)) {
        if (Object.prototype.hasOwnProperty.call(envelope, field)) return { kind: 'corrupt', scope: 'envelope' };
        envelope[field] = value;
      }
    }

    if (!isPlausibleSaveEnvelope(envelope)) return { kind: 'corrupt', scope: 'envelope' };
    const imported = importSaveV2(JSON.stringify(envelope), registry, now);
    if (!imported.ok) {
      return imported.reason === 'future-version'
        ? { kind: 'future-version', scope: 'schema' }
        : { kind: 'corrupt', scope: 'envelope' };
    }
    const canonical = canonicalV4FromState(imported.state, registry, now);
    const mirrorRaw = await backend.get('meta', V4_PRIMARY_KEY);
    if (mirrorRaw === undefined) return { kind: 'corrupt', scope: 'envelope' };
    const mirror = importSaveV2(mirrorRaw, registry, now);
    if (!mirror.ok) {
      return mirror.reason === 'future-version'
        ? { kind: 'future-version', scope: 'envelope' }
        : { kind: 'corrupt', scope: 'envelope' };
    }
    if (canonicalV4FromState(mirror.state, registry, now).raw !== canonical.raw) {
      return { kind: 'corrupt', scope: 'envelope' };
    }
    let checkedExtensions: V5Extensions;
    try {
      checkedExtensions = canonicalizeV5Extensions(extensions);
    } catch {
      return { kind: 'corrupt', scope: 'envelope' };
    }
    return {
      kind: 'loaded',
      state: canonical.state,
      ingress: rebaseIngress(mirror.state, mirror.ingress, canonical.state),
      extensions: checkedExtensions,
      legacyV4Raw: canonical.raw,
    };
  } catch (error) {
    return { kind: 'storage-error', message: error instanceof Error ? error.message : String(error) };
  }
}

function decodeSnapshot(raw: string):
  | { kind: 'current'; sourceSchema: 4 | 5; raw: string }
  | { kind: 'future' }
  | { kind: 'corrupt' } {
  const row = parseRecord(raw);
  if (row === null) return { kind: 'corrupt' };
  const version = classifyVersion(row.schema);
  if (version !== 'current') return { kind: version };
  if (!exactKeys(row, ['schema', 'sourceSchema', 'raw'])
    || (row.sourceSchema !== 4 && row.sourceSchema !== 5)
    || typeof row.raw !== 'string') {
    return { kind: 'corrupt' };
  }
  return { kind: 'current', sourceSchema: row.sourceSchema, raw: row.raw };
}

/** Recovery is read-only. Only a corrupt current v5 topology may consult the
 * pre-migration snapshot; a future schema/row never yields to older bytes. */
export async function readSaveV5WithRecovery(
  backend: StorageBackend,
  registry: ContentRegistry,
  now: number,
): Promise<V5ReadOutcome> {
  const primary = await readSaveV5(backend, registry, now);
  if (primary.kind !== 'corrupt') return primary;
  try {
    const snapshotRaw = await backend.get('journal', V5_SNAPSHOT_KEY);
    if (snapshotRaw === undefined) return primary;
    const snapshot = decodeSnapshot(snapshotRaw);
    if (snapshot.kind === 'future') return { kind: 'future-version', scope: 'snapshot' };
    if (snapshot.kind === 'corrupt') return { kind: 'corrupt', scope: 'snapshot' };
    if (snapshot.sourceSchema === 5) {
      const classified = classifyPortableV5Save(snapshot.raw, registry, now);
      if (classified.kind === 'future-version') return { kind: 'future-version', scope: 'snapshot' };
      if (classified.kind === 'corrupt') return { kind: 'corrupt', scope: 'snapshot' };
      return {
        kind: 'recovered-v4',
        state: classified.state,
        ingress: classified.ingress,
        extensions: classified.extensions,
        raw: snapshot.raw,
        normalizedV4Raw: classified.legacyV4Raw,
      };
    }
    const classified = classifyStoredV4Source(snapshot.raw, registry, now);
    if (classified.kind === 'future-version') return { kind: 'future-version', scope: 'snapshot' };
    if (classified.kind === 'corrupt') return { kind: 'corrupt', scope: 'snapshot' };
    return {
      kind: 'recovered-v4',
      state: classified.state,
      ingress: classified.ingress,
      extensions: EMPTY_EXTENSIONS,
      raw: snapshot.raw,
      normalizedV4Raw: classified.normalizedRaw,
    };
  } catch (error) {
    return { kind: 'storage-error', message: error instanceof Error ? error.message : String(error) };
  }
}

/** Bracket the complete v5/recovery read with the revision authority. This
 * is intentionally one bounded attempt: a concurrent commit reports
 * `changed`; it never silently rereads and accepts a different expedition. */
export async function readRevisionedSaveV5WithRecovery(
  backend: StorageBackend,
  registry: ContentRegistry,
  now: number,
): Promise<RevisionedV5ReadOutcome> {
  try {
    const repository = createRevisionedRepository(backend);
    const before = await repository.revisionSnapshot();
    const current = await readSaveV5WithRecovery(backend, registry, now);
    const after = await repository.revisionSnapshot();
    if (before.raw !== after.raw || before.revision !== after.revision) return { kind: 'changed' };
    if (current.kind === 'loaded' && before.raw === undefined) {
      return { kind: 'storage-error', message: 'current v5 revision authority is absent' };
    }
    return current.kind === 'loaded'
      ? Object.freeze({ ...current, revision: before.revision })
      : current;
  } catch (error) {
    return { kind: 'storage-error', message: error instanceof Error ? error.message : String(error) };
  }
}

/** One exact stored-source migration. The v4 primary remains byte-identical
 * on success, stale races, validation refusal, and backend failure. */
export async function migrateStoredV4ToV5(
  backend: StorageBackend,
  registry: ContentRegistry,
  now: number,
): Promise<V5MigrationOutcome> {
  try {
    const schemaRaw = await backend.get('meta', V5_SCHEMA_KEY);
    if (schemaRaw !== undefined) {
      const current = await readSaveV5(backend, registry, now);
      if (current.kind === 'loaded') return { kind: 'already-current', legacyV4Raw: current.legacyV4Raw };
      if (current.kind === 'future-version') return { kind: 'protected', reason: 'future-version' };
      if (current.kind === 'storage-error') return current;
      return { kind: 'protected', reason: 'corrupt' };
    }

    const sourceRaw = await backend.get('meta', V4_PRIMARY_KEY);
    if (sourceRaw === undefined) return { kind: 'fresh' };
    const revisionRaw = await backend.get('meta', F3_REVISION_KEY);
    if (revisionRaw !== undefined) return { kind: 'protected', reason: 'corrupt' };
    const prepared = prepareV4ToV5Migration(sourceRaw, registry, now);
    if ('kind' in prepared) {
      return { kind: 'protected', reason: prepared.kind === 'future-version' ? 'future-version' : 'corrupt' };
    }
    const committed = await backend.compareAndApply([
      { store: 'meta', key: V4_PRIMARY_KEY, value: sourceRaw },
      { store: 'meta', key: V5_SCHEMA_KEY, value: undefined },
      { store: 'meta', key: F3_REVISION_KEY, value: undefined },
    ], prepared.operations);
    if (committed) return { kind: 'migrated', normalizedV4Raw: prepared.normalizedV4Raw };

    const raced = await readSaveV5(backend, registry, now);
    if (raced.kind === 'loaded') return { kind: 'already-current', legacyV4Raw: raced.legacyV4Raw };
    return { kind: 'stale-source' };
  } catch (error) {
    return { kind: 'storage-error', message: error instanceof Error ? error.message : String(error) };
  }
}
