/* Canonical world identity persistence.

   Legacy v4 stores landings and planet names by leaf seed. Planet seeds are
   not globally unique, so those arrays remain compatibility mirrors only.
   This v5 owner binds every current landing/name to a complete, source-reproved
   CF1 world key. Four fixed shards keep the full 4,000-landed + 5,000-name
   compatibility union representable beneath the extension ceilings; a
   manifest makes a missing/extra shard fail closed instead of looking like an
   empty tail. Exact addresses use a lossless 32-byte tuple and are re-proved on
   every read, rather than spending the carrier budget on repeated key syntax. */
import {
  canonicalizeV5Extensions,
  applyV5ExtensionWrites,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  type V5ExtensionCarrier,
  type V5ExtensionWrite,
  type V5Extensions,
} from './migration-v5.js';
import {
  isCanonicalCF1Address,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
} from '@cf/scene';

export const WORLD_IDENTITY_VERSION = 1 as const;
export const WORLD_IDENTITY_SCHEMA = 'cf-v2-world-identity/v1' as const;
export const WORLD_IDENTITY_MANIFEST_SCHEMA = 'cf-v2-world-identity-manifest/v1' as const;
export const WORLD_IDENTITY_SHARD_SCHEMA = 'cf-v2-world-identity-shard/v1' as const;
export const WORLD_IDENTITY_PREFIX = 'world.identity.' as const;
export const WORLD_IDENTITY_MANIFEST_NAMESPACE = 'world.identity.manifest' as const;
export const WORLD_IDENTITY_SHARD_PREFIX = 'world.identity.shard.' as const;
export const WORLD_IDENTITY_SHARD_COUNT = 4 as const;
export const WORLD_IDENTITY_MAX_RECORDS = 9_000;
export const WORLD_IDENTITY_MAX_NAMED_RECORDS = 5_000;
const WORLD_NAME_MAX_CHARS = 24;
const PACKED_WORLD_ADDRESS_BYTES = 32;
const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

class WorldIdentityCapacityError extends RangeError {}

export interface CanonicalWorldIdentityRecordV1 {
  readonly key: CF1WorldKey;
  readonly address: CanonicalCF1WorldAddress;
  readonly landed: boolean;
  readonly name: string | null;
}

export interface CanonicalWorldIdentityStateV1 {
  readonly schema: typeof WORLD_IDENTITY_SCHEMA;
  readonly records: readonly CanonicalWorldIdentityRecordV1[];
  /** Lossless v4 facts whose leaf seed cannot yet be assigned to one exact
   * world. The first exact product encounter consumes one row atomically
   * into `records`; it never counts as a new landing. */
  readonly unresolved: readonly CanonicalWorldIdentityUnresolvedV4[];
}

export interface CanonicalWorldIdentityUnresolvedV4 {
  readonly seed: number;
  readonly landed: boolean;
  readonly name: string | null;
}

export type WorldIdentityReadOutcome =
  | { readonly kind: 'absent' }
  | { readonly kind: 'loaded'; readonly state: CanonicalWorldIdentityStateV1 }
  | { readonly kind: 'future-version'; readonly version: number }
  | { readonly kind: 'corrupt' };

export type WorldIdentityExtensionWritesV1 = readonly [
  V5ExtensionWrite,
  V5ExtensionWrite,
  V5ExtensionWrite,
  V5ExtensionWrite,
  V5ExtensionWrite,
];

export type WorldIdentityBootstrapPreparation =
  | {
      readonly kind: 'prepared';
      readonly state: CanonicalWorldIdentityStateV1;
      readonly writes: WorldIdentityExtensionWritesV1;
      readonly extensions: V5Extensions;
    }
  | {
      readonly kind: 'already-loaded';
      readonly state: CanonicalWorldIdentityStateV1;
      readonly writes: readonly [];
      readonly extensions: V5Extensions;
    }
  | {
      readonly kind: 'protected';
      readonly reason: 'target-future' | 'target-corrupt' | 'extensions-corrupt' | 'extension-bounds';
      readonly version?: number;
    };

export interface WorldIdentityLegacyMirror {
  readonly landed: readonly number[];
  readonly customNames: readonly (readonly [string, string])[];
  readonly conquered?: readonly (readonly [unknown, unknown])[];
  readonly mined?: readonly (readonly [unknown, unknown])[];
}

interface WorldIdentityManifestV1 {
  readonly schema: typeof WORLD_IDENTITY_MANIFEST_SCHEMA;
  readonly version: typeof WORLD_IDENTITY_VERSION;
  readonly rowCount: number;
  readonly shardCounts: readonly [number, number, number, number];
}

type EncodedWorldNameV1 = string | readonly [codec: 'u', utf16le: string] | null;

type WorldIdentityRowV1 =
  | readonly [kind: 'w', address: string, landed: 0 | 1, name: EncodedWorldNameV1]
  | readonly [kind: 'v4', seed: number, landed: 0 | 1, name: EncodedWorldNameV1];

interface WorldIdentityShardV1 {
  readonly schema: typeof WORLD_IDENTITY_SHARD_SCHEMA;
  readonly version: typeof WORLD_IDENTITY_VERSION;
  readonly index: number;
  readonly rows: readonly WorldIdentityRowV1[];
}

const STATES = new WeakSet<object>();
const EMPTY_WRITES = Object.freeze([]) as readonly [];
const OWNED_NAMESPACES = Object.freeze([
  WORLD_IDENTITY_MANIFEST_NAMESPACE,
  ...Array.from(
    { length: WORLD_IDENTITY_SHARD_COUNT },
    (_, index) => `${WORLD_IDENTITY_SHARD_PREFIX}${index}`,
  ),
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isExactUint32(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
    && value >= 0 && value <= 0xFFFF_FFFF;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function parsedRecord(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function checkedName(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length < 1 || value.length > WORLD_NAME_MAX_CHARS
    || value !== value.trim() || /[<>&"']/.test(value)) {
    throw new RangeError('canonical world name is not a clean 1–24 character value');
  }
  return value;
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]!;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    result += BASE64URL_ALPHABET[first >>> 2]!;
    result += BASE64URL_ALPHABET[((first & 3) << 4) | ((second ?? 0) >>> 4)]!;
    if (second !== undefined) {
      result += BASE64URL_ALPHABET[((second & 15) << 2) | ((third ?? 0) >>> 6)]!;
    }
    if (third !== undefined) result += BASE64URL_ALPHABET[third & 63]!;
  }
  return result;
}

function decodeBase64Url(value: unknown): Uint8Array | null {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]*$/.test(value) || value.length % 4 === 1) {
    return null;
  }
  const bytes: number[] = [];
  let accumulator = 0;
  let bits = 0;
  for (const character of value) {
    const digit = BASE64URL_ALPHABET.indexOf(character);
    if (digit < 0) return null;
    accumulator = accumulator * 64 + digit;
    bits += 6;
    while (bits >= 8) {
      bits -= 8;
      bytes.push(Math.floor(accumulator / (2 ** bits)) & 255);
      accumulator %= 2 ** bits;
    }
  }
  if (bits > 0 && accumulator !== 0) return null;
  const decoded = Uint8Array.from(bytes);
  return encodeBase64Url(decoded) === value ? decoded : null;
}

function utf16Bytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length * 2);
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    bytes[index * 2] = code & 255;
    bytes[index * 2 + 1] = code >>> 8;
  }
  return bytes;
}

function encodedName(value: string | null): EncodedWorldNameV1 {
  const name = checkedName(value);
  if (name === null) return null;
  const packed = Object.freeze(['u', encodeBase64Url(utf16Bytes(name))] as const);
  return utf8ByteLength(JSON.stringify(packed)) < utf8ByteLength(JSON.stringify(name))
    ? packed : name;
}

function decodedName(value: unknown): string | null {
  if (value === null || typeof value === 'string') return checkedName(value);
  if (!Array.isArray(value) || value.length !== 2 || value[0] !== 'u') {
    throw new TypeError('canonical world name codec is invalid');
  }
  const bytes = decodeBase64Url(value[1]);
  if (bytes === null || bytes.length === 0 || bytes.length % 2 !== 0
    || bytes.length > WORLD_NAME_MAX_CHARS * 2) {
    throw new TypeError('canonical world UTF-16 name codec is invalid');
  }
  let name = '';
  for (let index = 0; index < bytes.length; index += 2) {
    name += String.fromCharCode(bytes[index]! | (bytes[index + 1]! << 8));
  }
  const checked = checkedName(name);
  if (JSON.stringify(encodedName(checked)) !== JSON.stringify(value)) {
    throw new TypeError('canonical world name codec is not at its fixed point');
  }
  return checked;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  if (!isExactUint32(value)) throw new RangeError('packed world address field is not uint32');
  bytes[offset] = Math.floor(value / 0x1_000_000) & 255;
  bytes[offset + 1] = Math.floor(value / 0x1_0000) & 255;
  bytes[offset + 2] = Math.floor(value / 0x100) & 255;
  bytes[offset + 3] = value & 255;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! * 0x1_000_000
    + bytes[offset + 1]! * 0x1_0000
    + bytes[offset + 2]! * 0x100
    + bytes[offset + 3]!;
}

function encodedCoordinate(value: number): number {
  const scaled = Math.round(value * 100);
  if (!Number.isSafeInteger(scaled) || Math.abs(value - scaled / 100) > 1e-9
    || scaled < -0x8000_0000 || scaled > 0x7fff_ffff) {
    throw new RangeError('canonical world coordinate is not lossless at two decimals');
  }
  return scaled < 0 ? scaled + 0x1_0000_0000 : scaled;
}

function decodedCoordinate(value: number): number {
  return (value > 0x7fff_ffff ? value - 0x1_0000_0000 : value) / 100;
}

function packedAddress(value: CanonicalCF1WorldAddress): string {
  const address = checkedAddress(value);
  const fields = [
    address.galaxy.seed,
    encodedCoordinate(address.galaxy.x),
    encodedCoordinate(address.galaxy.y),
    address.star.seed,
    encodedCoordinate(address.star.x),
    encodedCoordinate(address.star.y),
    address.planet.seed,
    address.planet.ordinal,
  ];
  const bytes = new Uint8Array(PACKED_WORLD_ADDRESS_BYTES);
  fields.forEach((field, index) => writeUint32(bytes, index * 4, field));
  return encodeBase64Url(bytes);
}

function unpackedAddress(value: unknown): CanonicalCF1WorldAddress {
  const bytes = decodeBase64Url(value);
  if (bytes === null || bytes.length !== PACKED_WORLD_ADDRESS_BYTES) {
    throw new TypeError('packed canonical world address is invalid');
  }
  const resolved = resolveCF1WorldAddress({
    galaxy: {
      seed: readUint32(bytes, 0),
      x: decodedCoordinate(readUint32(bytes, 4)),
      y: decodedCoordinate(readUint32(bytes, 8)),
    },
    star: {
      seed: readUint32(bytes, 12),
      x: decodedCoordinate(readUint32(bytes, 16)),
      y: decodedCoordinate(readUint32(bytes, 20)),
    },
    planet: { seed: readUint32(bytes, 24) },
  });
  if (!resolved.ok || resolved.address.planet.ordinal !== readUint32(bytes, 28)
    || packedAddress(resolved.address) !== value) {
    throw new TypeError('packed canonical world address failed source reproof');
  }
  return resolved.address;
}

function checkedAddress(value: unknown): CanonicalCF1WorldAddress {
  if (!isCanonicalCF1Address(value) || !('planet' in value)) {
    throw new TypeError('canonical world identity requires a registered CF1 world address');
  }
  return value;
}

function createState(
  values: readonly Readonly<{
    address: CanonicalCF1WorldAddress;
    landed: boolean;
    name: string | null;
  }>[],
  unresolvedValues: readonly Readonly<{
    seed: number;
    landed: boolean;
    name: string | null;
  }>[] = [],
): CanonicalWorldIdentityStateV1 {
  if (!Array.isArray(values) || !Array.isArray(unresolvedValues)
    || values.length + unresolvedValues.length > WORLD_IDENTITY_MAX_RECORDS) {
    throw new WorldIdentityCapacityError(`canonical world identity exceeds ${WORLD_IDENTITY_MAX_RECORDS} records`);
  }
  const namedCount = values.filter((value) => value.name !== null).length
    + unresolvedValues.filter((value) => value.name !== null).length;
  if (namedCount > WORLD_IDENTITY_MAX_NAMED_RECORDS) {
    throw new WorldIdentityCapacityError(`canonical world identity exceeds ${WORLD_IDENTITY_MAX_NAMED_RECORDS} names`);
  }
  const records = values.map((value): CanonicalWorldIdentityRecordV1 => {
    const address = checkedAddress(value.address);
    if (typeof value.landed !== 'boolean') throw new TypeError('canonical world landed flag must be boolean');
    return Object.freeze({
      key: address.key,
      address,
      landed: value.landed,
      name: checkedName(value.name),
    });
  }).sort((left, right) => (
    left.key < right.key ? -1 : left.key > right.key ? 1 : 0
  ));
  for (let index = 1; index < records.length; index++) {
    if (records[index - 1]!.key === records[index]!.key) {
      throw new RangeError(`duplicate canonical world identity ${records[index]!.key}`);
    }
  }
  const unresolved = unresolvedValues.map((value): CanonicalWorldIdentityUnresolvedV4 => {
    if (!isExactUint32(value.seed) || typeof value.landed !== 'boolean') {
      throw new TypeError('unresolved v4 world identity requires a uint32 seed and boolean landing');
    }
    const name = checkedName(value.name);
    if (!value.landed && name === null) {
      throw new RangeError('empty unresolved v4 world identity is not a fact');
    }
    return Object.freeze({ seed: value.seed, landed: value.landed, name });
  }).sort((left, right) => left.seed - right.seed);
  for (let index = 1; index < unresolved.length; index++) {
    if (unresolved[index - 1]!.seed === unresolved[index]!.seed) {
      throw new RangeError(`duplicate unresolved v4 world seed ${unresolved[index]!.seed}`);
    }
  }
  const exactSeeds = new Set(records.map((record) => record.address.planet.seed));
  if (unresolved.some((entry) => exactSeeds.has(entry.seed))) {
    throw new RangeError('exact and unresolved world identities overlap by leaf seed');
  }
  const state = Object.freeze({
    schema: WORLD_IDENTITY_SCHEMA,
    records: Object.freeze(records),
    unresolved: Object.freeze(unresolved),
  });
  STATES.add(state);
  return state;
}

function checkedState(value: unknown): CanonicalWorldIdentityStateV1 {
  if (!isRecord(value) || !STATES.has(value)) {
    throw new TypeError('canonical world identity state was not minted by its codec');
  }
  return value as unknown as CanonicalWorldIdentityStateV1;
}

export function createEmptyWorldIdentityState(): CanonicalWorldIdentityStateV1 {
  return createState([], []);
}

export function worldIdentityRecord(
  stateValue: CanonicalWorldIdentityStateV1,
  addressOrKey: CanonicalCF1WorldAddress | string,
): CanonicalWorldIdentityRecordV1 | null {
  const state = checkedState(stateValue);
  const key = typeof addressOrKey === 'string' ? addressOrKey : checkedAddress(addressOrKey).key;
  return state.records.find((record) => record.key === key) ?? null;
}

export function worldIdentityName(
  state: CanonicalWorldIdentityStateV1,
  address: CanonicalCF1WorldAddress,
): string | null {
  return worldIdentityRecord(state, address)?.name ?? null;
}

export function hasCanonicalWorldLanded(
  state: CanonicalWorldIdentityStateV1,
  address: CanonicalCF1WorldAddress,
): boolean {
  return worldIdentityRecord(state, address)?.landed === true;
}

export function canonicalWorldLandingCount(stateValue: CanonicalWorldIdentityStateV1): number {
  const state = checkedState(stateValue);
  return state.records.filter((record) => record.landed).length
    + state.unresolved.filter((record) => record.landed).length;
}

function publishableMutation(
  create: () => CanonicalWorldIdentityStateV1,
  baseExtensions: V5Extensions,
): CanonicalWorldIdentityStateV1 | null {
  const base = canonicalizeV5Extensions(baseExtensions);
  try {
    const state = create();
    const writes = encodeWorldIdentityExtensionWrites(state);
    applyV5ExtensionWrites(base, writes);
    return state;
  } catch (error) {
    if (error instanceof WorldIdentityCapacityError) return null;
    /* Generated writes have already crossed their isolated codec validator.
       Against a canonical base, the remaining apply failures are shared
       namespace/aggregate capacity refusals. */
    if (error instanceof Error && /(?:namespace count|JSON total) exceeds/.test(error.message)) {
      return null;
    }
    throw error;
  }
}

function replaceRecord(
  stateValue: CanonicalWorldIdentityStateV1,
  addressValue: CanonicalCF1WorldAddress,
  update: Readonly<{ landed?: boolean; name?: string | null }>,
  baseExtensions: V5Extensions,
): CanonicalWorldIdentityStateV1 | null {
  const state = checkedState(stateValue);
  const address = checkedAddress(addressValue);
  const current = worldIdentityRecord(state, address);
  const landed = update.landed ?? current?.landed ?? false;
  const name = Object.prototype.hasOwnProperty.call(update, 'name')
    ? checkedName(update.name) : current?.name ?? null;
  if (current !== null && current.landed === landed && current.name === name) return state;
  const retained = state.records.filter((record) => record.key !== address.key);
  return publishableMutation(() => createState(
    [...retained, { address, landed, name }],
    state.unresolved,
  ), baseExtensions);
}

/** Bind one ambiguous v4 seed fact to the exact source-proven world first
 * encountered by a current product action. Moving the fact keeps aggregate
 * counts stable and makes a legacy landing explicitly non-new. */
export function claimCanonicalWorldIdentity(
  stateValue: CanonicalWorldIdentityStateV1,
  addressValue: CanonicalCF1WorldAddress,
  baseExtensions: V5Extensions = {},
): Readonly<{
  state: CanonicalWorldIdentityStateV1;
  claimedLegacy: boolean;
  capacityProtected: boolean;
}> {
  const state = checkedState(stateValue);
  const address = checkedAddress(addressValue);
  const unresolved = state.unresolved.find((entry) => entry.seed === address.planet.seed);
  if (unresolved === undefined) {
    return Object.freeze({ state, claimedLegacy: false, capacityProtected: false });
  }
  const exact = worldIdentityRecord(state, address);
  const retainedRecords = state.records.filter((record) => record.key !== address.key);
  const retainedUnresolved = state.unresolved.filter((entry) => entry.seed !== unresolved.seed);
  const claimedState = publishableMutation(() => createState([
    ...retainedRecords,
    {
      address,
      landed: exact?.landed === true || unresolved.landed,
      name: exact?.name ?? unresolved.name,
    },
  ], retainedUnresolved), baseExtensions);
  if (claimedState === null) {
    return Object.freeze({ state, claimedLegacy: false, capacityProtected: true });
  }
  return Object.freeze({
    state: claimedState,
    claimedLegacy: true,
    capacityProtected: false,
  });
}

export function recordCanonicalWorldLanding(
  state: CanonicalWorldIdentityStateV1,
  address: CanonicalCF1WorldAddress,
  baseExtensions: V5Extensions = {},
): Readonly<{
  state: CanonicalWorldIdentityStateV1;
  firstLanding: boolean;
  claimedLegacy: boolean;
  capacityProtected: boolean;
}> {
  const claimed = claimCanonicalWorldIdentity(state, address, baseExtensions);
  if (claimed.capacityProtected) {
    return Object.freeze({
      state,
      firstLanding: false,
      claimedLegacy: false,
      capacityProtected: true,
    });
  }
  const firstLanding = !worldIdentityRecord(claimed.state, address)?.landed;
  const nextState = firstLanding
    ? replaceRecord(claimed.state, address, { landed: true }, baseExtensions) : claimed.state;
  if (nextState === null) {
    return Object.freeze({
      state,
      firstLanding: false,
      claimedLegacy: false,
      capacityProtected: true,
    });
  }
  return Object.freeze({
    state: nextState,
    firstLanding,
    claimedLegacy: claimed.claimedLegacy,
    capacityProtected: false,
  });
}

export function setCanonicalWorldName(
  state: CanonicalWorldIdentityStateV1,
  address: CanonicalCF1WorldAddress,
  name: string,
  baseExtensions: V5Extensions = {},
): Readonly<{
  state: CanonicalWorldIdentityStateV1;
  applied: boolean;
  claimedLegacy: boolean;
  capacityProtected: boolean;
}> {
  const checked = checkedName(name);
  if (checked === null) throw new RangeError('canonical world name cannot be empty');
  const claimed = claimCanonicalWorldIdentity(state, address, baseExtensions);
  if (claimed.capacityProtected) {
    return Object.freeze({
      state,
      applied: false,
      claimedLegacy: false,
      capacityProtected: true,
    });
  }
  const nextState = replaceRecord(claimed.state, address, { name: checked }, baseExtensions);
  if (nextState === null) {
    return Object.freeze({
      state,
      applied: false,
      claimedLegacy: false,
      capacityProtected: true,
    });
  }
  return Object.freeze({
    state: nextState,
    applied: true,
    claimedLegacy: claimed.claimedLegacy,
    capacityProtected: false,
  });
}

function encodedRows(
  stateValue: CanonicalWorldIdentityStateV1,
): readonly (readonly WorldIdentityRowV1[])[] {
  const state = checkedState(stateValue);
  const shards: WorldIdentityRowV1[][] = Array.from(
    { length: WORLD_IDENTITY_SHARD_COUNT },
    () => [],
  );
  const rows: WorldIdentityRowV1[] = [
    ...state.records.map((record): WorldIdentityRowV1 => Object.freeze([
      'w',
      packedAddress(record.address),
      record.landed ? 1 : 0,
      encodedName(record.name),
    ])),
    ...state.unresolved.map((record): WorldIdentityRowV1 => Object.freeze([
      'v4',
      record.seed,
      record.landed ? 1 : 0,
      encodedName(record.name),
    ])),
  ];
  const shardBytes = Array.from({ length: WORLD_IDENTITY_SHARD_COUNT }, () => 0);
  for (const row of rows) {
    /* Greedy byte load, with the lowest shard index as the explicit tie-break,
       keeps arbitrary name placement beneath the per-carrier ceiling. Row
       count round-robin was not sufficient: valid sorted keys could place
       nearly every worst-case name into the same two modulo classes. */
    let selected = 0;
    for (let index = 1; index < WORLD_IDENTITY_SHARD_COUNT; index++) {
      if (shardBytes[index]! < shardBytes[selected]!) selected = index;
    }
    const rowBytes = utf8ByteLength(JSON.stringify(row))
      + (shards[selected]!.length === 0 ? 0 : 1);
    shards[selected]!.push(row);
    shardBytes[selected] = shardBytes[selected]! + rowBytes;
  }
  return Object.freeze(shards.map((rows) => Object.freeze(rows)));
}

export function encodeWorldIdentityExtensionWrites(
  stateValue: CanonicalWorldIdentityStateV1,
): WorldIdentityExtensionWritesV1 {
  const state = checkedState(stateValue);
  const shards = encodedRows(state);
  const manifest: WorldIdentityManifestV1 = {
    schema: WORLD_IDENTITY_MANIFEST_SCHEMA,
    version: WORLD_IDENTITY_VERSION,
    rowCount: state.records.length + state.unresolved.length,
    shardCounts: Object.freeze(shards.map((rows) => rows.length)) as unknown as readonly [number, number, number, number],
  };
  const carrier = (json: string): V5ExtensionCarrier => Object.freeze({
    version: WORLD_IDENTITY_VERSION,
    json,
  });
  const writes = Object.freeze([
    Object.freeze({
      segment: 'catalog' as const,
      namespace: WORLD_IDENTITY_MANIFEST_NAMESPACE,
      carrier: carrier(JSON.stringify(manifest)),
    }),
    ...shards.map((rows, index) => Object.freeze({
      segment: 'catalog' as const,
      namespace: `${WORLD_IDENTITY_SHARD_PREFIX}${index}`,
      carrier: carrier(JSON.stringify({
        schema: WORLD_IDENTITY_SHARD_SCHEMA,
        version: WORLD_IDENTITY_VERSION,
        index,
        rows,
      } satisfies WorldIdentityShardV1)),
    })),
  ]) as unknown as WorldIdentityExtensionWritesV1;
  /* Capacity is part of this owner's codec contract, not deferred to a later
     repository call. Thus every state accepted for publication has already
     crossed the real per-namespace and aggregate extension validator. */
  const sizes = writes.map((write) => utf8ByteLength(write.carrier.json));
  if (sizes.some((size) => size > V5_MAX_EXTENSION_JSON_BYTES)
    || sizes.reduce((total, size) => total + size, 0) > V5_MAX_EXTENSION_TOTAL_BYTES) {
    throw new WorldIdentityCapacityError('canonical world identity exceeds v5 extension byte bounds');
  }
  applyV5ExtensionWrites({}, writes);
  return writes;
}

function ownedInventory(extensions: V5Extensions): {
  readonly kind: 'absent' | 'present' | 'corrupt' | 'future';
  readonly carriers?: readonly V5ExtensionCarrier[];
  readonly version?: number;
} {
  const catalog = extensions.catalog ?? {};
  const ownedPresent = Object.keys(catalog).filter((namespace) => namespace.startsWith(WORLD_IDENTITY_PREFIX));
  if (ownedPresent.length === 0) return { kind: 'absent' };
  if (ownedPresent.length !== OWNED_NAMESPACES.length
    || OWNED_NAMESPACES.some((namespace) => !Object.prototype.hasOwnProperty.call(catalog, namespace))) {
    return { kind: 'corrupt' };
  }
  const carriers = OWNED_NAMESPACES.map((namespace) => catalog[namespace]!);
  const future = carriers.find((candidate) => candidate.version > WORLD_IDENTITY_VERSION);
  if (future) return { kind: 'future', version: future.version };
  if (carriers.some((candidate) => candidate.version !== WORLD_IDENTITY_VERSION)) return { kind: 'corrupt' };
  return { kind: 'present', carriers };
}

export function readWorldIdentity(extensionsValue: V5Extensions): WorldIdentityReadOutcome {
  let extensions: V5Extensions;
  try { extensions = canonicalizeV5Extensions(extensionsValue); }
  catch { return Object.freeze({ kind: 'corrupt' }); }
  const inventory = ownedInventory(extensions);
  if (inventory.kind === 'absent') return Object.freeze({ kind: 'absent' });
  if (inventory.kind === 'future') {
    return Object.freeze({ kind: 'future-version', version: inventory.version! });
  }
  if (inventory.kind !== 'present' || inventory.carriers === undefined) {
    return Object.freeze({ kind: 'corrupt' });
  }
  try {
    const manifest = parsedRecord(inventory.carriers[0]!.json);
    if (manifest === null
      || !exactKeys(manifest, ['schema', 'version', 'rowCount', 'shardCounts'])
      || manifest.schema !== WORLD_IDENTITY_MANIFEST_SCHEMA
      || manifest.version !== WORLD_IDENTITY_VERSION
      || !Number.isSafeInteger(manifest.rowCount)
      || (manifest.rowCount as number) < 0
      || (manifest.rowCount as number) > WORLD_IDENTITY_MAX_RECORDS
      || !Array.isArray(manifest.shardCounts)
      || manifest.shardCounts.length !== WORLD_IDENTITY_SHARD_COUNT
      || manifest.shardCounts.some((count) => !Number.isSafeInteger(count) || count < 0)) {
      return Object.freeze({ kind: 'corrupt' });
    }
    const records: Array<{
      address: CanonicalCF1WorldAddress;
      landed: boolean;
      name: string | null;
    }> = [];
    const unresolved: Array<{
      seed: number;
      landed: boolean;
      name: string | null;
    }> = [];
    for (let index = 0; index < WORLD_IDENTITY_SHARD_COUNT; index++) {
      const shard = parsedRecord(inventory.carriers[index + 1]!.json);
      if (shard === null
        || !exactKeys(shard, ['schema', 'version', 'index', 'rows'])
        || shard.schema !== WORLD_IDENTITY_SHARD_SCHEMA
        || shard.version !== WORLD_IDENTITY_VERSION
        || shard.index !== index
        || !Array.isArray(shard.rows)
        || shard.rows.length !== manifest.shardCounts[index]) {
        return Object.freeze({ kind: 'corrupt' });
      }
      for (const rawRow of shard.rows) {
        if (!Array.isArray(rawRow) || rawRow.length !== 4
          || (rawRow[0] !== 'w' && rawRow[0] !== 'v4')
          || (rawRow[2] !== 0 && rawRow[2] !== 1)) {
          return Object.freeze({ kind: 'corrupt' });
        }
        if (rawRow[0] === 'w') {
          records.push({
            address: unpackedAddress(rawRow[1]),
            landed: rawRow[2] === 1,
            name: decodedName(rawRow[3]),
          });
        } else {
          if (!isExactUint32(rawRow[1])) return Object.freeze({ kind: 'corrupt' });
          unresolved.push({
            seed: rawRow[1],
            landed: rawRow[2] === 1,
            name: decodedName(rawRow[3]),
          });
        }
      }
    }
    if (records.length + unresolved.length !== manifest.rowCount) {
      return Object.freeze({ kind: 'corrupt' });
    }
    const state = createState(records, unresolved);
    const encoded = encodeWorldIdentityExtensionWrites(state);
    if (encoded.some((write, index) => write.carrier.json !== inventory.carriers![index]!.json)) {
      return Object.freeze({ kind: 'corrupt' });
    }
    return Object.freeze({ kind: 'loaded', state });
  } catch {
    return Object.freeze({ kind: 'corrupt' });
  }
}

/** Bootstrap an absent carrier only from complete addresses already reproved
 * from the saved route/Atlas. Legacy seed rows decide compatibility flags for
 * those known addresses but never become current keys by themselves. */
export function prepareWorldIdentityBootstrap(input: Readonly<{
  extensions: V5Extensions;
  legacy: WorldIdentityLegacyMirror;
  addresses: readonly CanonicalCF1WorldAddress[];
}>): WorldIdentityBootstrapPreparation {
  let base: V5Extensions;
  try { base = canonicalizeV5Extensions(input.extensions); }
  catch { return Object.freeze({ kind: 'protected', reason: 'extensions-corrupt' }); }
  const current = readWorldIdentity(base);
  if (current.kind === 'loaded') {
    return Object.freeze({
      kind: 'already-loaded', state: current.state, writes: EMPTY_WRITES, extensions: base,
    });
  }
  if (current.kind === 'future-version') {
    return Object.freeze({ kind: 'protected', reason: 'target-future', version: current.version });
  }
  if (current.kind === 'corrupt') {
    return Object.freeze({ kind: 'protected', reason: 'target-corrupt' });
  }
  try {
    const unresolved = new Map<number, { seed: number; landed: boolean; name: string | null }>();
    /* Match exportSaveV2's authoritative compatibility mirror exactly. An
       imported v4 envelope may temporarily expose up to 60,000 land rows, but
       its next canonical write unions conquered/mined keys and retains the
       last 4,000 insertions. Bootstrap must not newly lock that accepted save
       or preserve rows its own v4 writer would discard. */
    const legacyLandUnion = new Set<unknown>(input.legacy.landed);
    for (const row of input.legacy.conquered ?? []) legacyLandUnion.add(row[0]);
    for (const row of input.legacy.mined ?? []) legacyLandUnion.add(row[0]);
    const canonicalLegacyLanded = [...legacyLandUnion].slice(-4_000);
    for (const rawSeed of canonicalLegacyLanded) {
      /* exportSaveV2 writes the union as-is, then importSaveV2 applies unary
         numeric coercion to every finite `land` value. Reproduce that exact
         compatibility fixed point before narrowing to a possible CF1 seed. */
      const seed = +(rawSeed as number);
      if (!isExactUint32(seed)) continue;
      unresolved.set(seed, { seed, landed: true, name: null });
    }
    for (const [key, rawName] of input.legacy.customNames) {
      const match = /^p(0|[1-9]\d*)$/.exec(key);
      if (!match) continue;
      const seed = Number(match[1]);
      if (!isExactUint32(seed)) continue;
      const current = unresolved.get(seed);
      unresolved.set(seed, {
        seed,
        landed: current?.landed ?? false,
        name: checkedName(rawName),
      });
    }
    const addresses = new Map<string, CanonicalCF1WorldAddress>();
    for (const rawAddress of input.addresses) {
      const address = checkedAddress(rawAddress);
      addresses.set(address.key, address);
    }
    const seedCardinality = new Map<number, number>();
    for (const address of addresses.values()) {
      seedCardinality.set(
        address.planet.seed,
        (seedCardinality.get(address.planet.seed) ?? 0) + 1,
      );
    }
    const exact: Array<{
      address: CanonicalCF1WorldAddress;
      landed: boolean;
      name: string | null;
    }> = [];
    for (const address of addresses.values()) {
      /* A v4 leaf-seed fact can bootstrap only a uniquely identified proven
         candidate. If known routes collide, retain one unresolved count/name
         until the first exact current-v5 product encounter consumes it. */
      const seedIsUnique = seedCardinality.get(address.planet.seed) === 1;
      const legacy = unresolved.get(address.planet.seed);
      if (seedIsUnique && legacy !== undefined) {
        exact.push({ address, landed: legacy.landed, name: legacy.name });
        unresolved.delete(address.planet.seed);
      }
    }
    const state = createState(exact, [...unresolved.values()]);
    const writes = encodeWorldIdentityExtensionWrites(state);
    const applied = applyV5ExtensionWrites(base, writes);
    return Object.freeze({ kind: 'prepared', state, writes, extensions: applied.extensions });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'extension-bounds' });
  }
}
