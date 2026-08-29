/* Arc 0 durable Star Atlas transaction.

   One proven world route, any pending legacy identity claim, and one exact
   composite Atlas row cross one F4 receipt-bearing CAS together. Exact
   repeats are observed from the detached F4 parent and deliberately consume
   no receipt. This module owns no live singleton, DOM, clock, RNG draw,
   retry, or optimistic publication. */
import { sha256Hex } from '@cf/domain-acquisition';
import { cleanName } from '@cf/domain-strays';
import {
  PORTABLE_V5_MAX_BYTES,
  claimCanonicalWorldIdentity,
  encodeWorldIdentityExtensionWrites,
  readF4Authority,
  readWorldIdentity,
  worldIdentityName,
  worldIdentityRecord,
  type F4DeterministicProductPlan,
  type SaveStateV2,
  type V5ExtensionWrite,
  type WorldIdentityReadOutcome,
} from '@cf/persistence';
import {
  canonicalCF1WorldAddressFromNav,
  canonicalCF1WorldAtlasId,
  isCanonicalCF1Address,
  navToView,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
  type SurfaceNav,
} from '@cf/scene';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC0_ATLAS_RECEIPT_KIND = 'arc0-atlas' as const;
export const ARC0_ATLAS_WITNESS_SCHEMA = 'cf-v2-arc0-atlas-witness/v1' as const;
const ARC0_ATLAS_OPERATION_PREFIX = 'arc0.atlas:';
const INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'surface', 'address', 'title', 'sub', 'displayTimestamp', 'codecNow',
] as const);
const MAX_CLONE_NODES = 1_500_000;
/* The portable envelope is 2 MiB, but its sanitized in-memory objects use
   expanded field names. Keep sealing finite without imposing the envelope's
   smaller wire-size bound on a valid fixed-point SaveStateV2. */
const MAX_DETACHED_CHARACTERS = PORTABLE_V5_MAX_BYTES * 8;
const SUCCESSOR_SEAL_MAX_CHARS = PORTABLE_V5_MAX_BYTES * 8;
const ATLAS_DURABLE_ROWS_MAX = 120;
const ATLAS_ID_MAX_CHARS = 192;
const ATLAS_TITLE_MAX_CHARS = 60;
const ATLAS_SUB_MAX_CHARS = 120;
const ATLAS_TIMESTAMP_MAX = 4_102_444_800_000;
const WITNESS_MAX_CHARS = 4_096;

export interface Arc0AtlasActionInput {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly surface: SurfaceNav;
  readonly address: CanonicalCF1WorldAddress;
  readonly title: string;
  readonly sub: string;
  readonly displayTimestamp: number;
  readonly codecNow: number;
}

export interface Arc0AtlasRowFact {
  readonly status: 'added' | 'existing';
  readonly id: string;
  readonly title: string;
  readonly sub: string;
  readonly where: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
  readonly countBefore: number;
  readonly countAfter: number;
  readonly evictedId: string | null;
  readonly homeIdAfter: string | null;
}

export interface Arc0AtlasWitnessFacts {
  readonly schema: typeof ARC0_ATLAS_WITNESS_SCHEMA;
  readonly worldKey: CF1WorldKey;
  readonly planetSeed: number;
  readonly planetOrdinal: number;
  readonly identityClaimedLegacy: boolean;
  readonly identityRecordAfter: boolean;
  readonly unresolvedSeedAfter: boolean;
  readonly atlas: Arc0AtlasRowFact;
  readonly stateSuccessorSeal: string;
  readonly worldIdentitySuccessorSeal: string;
  readonly receiptOrdinal: number;
}

export interface Arc0AtlasWitness {
  readonly facts: Arc0AtlasWitnessFacts;
  readonly encoded: string;
}

export interface Arc0AtlasAlreadyDurableObservation {
  readonly scope: 'exact-detached-f4-parent';
  readonly worldKey: CF1WorldKey;
  readonly atlasId: string;
  readonly where: Readonly<Record<string, unknown>>;
  readonly identityRecordPresent: boolean;
}

export type Arc0AtlasRefusalDetail =
  | 'input:invalid-or-unregistered'
  | 'world-identity:absent'
  | 'world-identity:corrupt'
  | 'world-identity:future-version'
  | 'world-identity:capacity'
  | 'atlas:source-invalid'
  | 'atlas:collision'
  | 'atlas:capacity'
  | `transaction:${string}`;

export type Arc0AtlasPostcommitMismatch =
  | 'input-invalid'
  | 'transaction-not-committed'
  | 'witness-unregistered'
  | 'world-mismatch'
  | 'receipt-mismatch'
  | 'session-rng-mismatch'
  | 'state-fixed-point-mismatch'
  | 'state-successor-mismatch'
  | 'world-identity-not-loaded'
  | 'world-identity-mismatch'
  | 'atlas-state-mismatch';

export type Arc0AtlasPostcommitVerification =
  | Readonly<{
    kind: 'verified';
    worldIdentity: Extract<WorldIdentityReadOutcome, { readonly kind: 'loaded' }>;
    facts: Arc0AtlasWitnessFacts;
  }>
  | Readonly<{ kind: 'mismatch'; detail: Arc0AtlasPostcommitMismatch }>;

export type Arc0AtlasActionOutcome =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    witness: Arc0AtlasWitness;
    verification: Extract<Arc0AtlasPostcommitVerification, { readonly kind: 'verified' }>;
    worldIdentityWrites: readonly V5ExtensionWrite[];
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-atlas-evidence-missing' | `postcommit:${Arc0AtlasPostcommitMismatch}`;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'already-durable';
    durability: 'observed-detached-f4-parent';
    convergence: 'none';
    observation: Arc0AtlasAlreadyDurableObservation;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'rejected' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: Arc0AtlasRefusalDetail;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly address: CanonicalCF1WorldAddress;
  readonly title: string;
  readonly sub: string;
  readonly displayTimestamp: number;
  readonly codecNow: number;
  readonly where: Readonly<Record<string, unknown>>;
}

interface CheckedAtlas {
  readonly rows: Array<[string, Record<string, unknown>]>;
  readonly byId: ReadonlyMap<string, Record<string, unknown>>;
}

interface SelectedAtlas {
  readonly witness: Arc0AtlasWitness;
  readonly worldIdentityWrites: readonly V5ExtensionWrite[];
}

interface CloneBudget { nodes: number; characters: number; }
interface SealBudget { chars: number; }

const WITNESSES = new WeakSet<object>();

function consumeCloneBudget(budget: CloneBudget, nodes: number, characters = 0): void {
  if (!Number.isSafeInteger(nodes) || nodes < 0 || !Number.isSafeInteger(characters)
    || characters < 0 || budget.nodes > MAX_CLONE_NODES - nodes
    || budget.characters > MAX_DETACHED_CHARACTERS - characters) {
    throw new RangeError('Arc 0 Atlas input exceeds its detachment bound');
  }
  budget.nodes += nodes;
  budget.characters += characters;
}

function defineData(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function clonePlainData(
  value: unknown,
  ancestors: Set<object>,
  budget: CloneBudget,
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'boolean'
    || typeof value === 'number') return value;
  if (typeof value === 'string') {
    consumeCloneBudget(budget, 0, value.length);
    return value;
  }
  if (typeof value !== 'object' || depth > 256 || ancestors.has(value)) {
    throw new TypeError('Arc 0 Atlas input is cyclic or not plain data');
  }
  consumeCloneBudget(budget, 1);
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('Arc 0 Atlas arrays must be native');
      const keys = Reflect.ownKeys(value);
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (!lengthDescriptor || !('value' in lengthDescriptor)
        || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('Arc 0 Atlas array shape is invalid');
      }
      const length = lengthDescriptor.value as number;
      consumeCloneBudget(budget, length);
      const clone = new Array<unknown>(length);
      for (let index = 0; index < length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined) continue;
        if (!('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Arc 0 Atlas arrays cannot contain accessors');
        }
        defineData(clone, String(index), clonePlainData(
          descriptor.value, ancestors, budget, depth + 1,
        ));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Arc 0 Atlas objects must use a plain prototype');
    }
    const keys = Reflect.ownKeys(value);
    consumeCloneBudget(budget, keys.length, keys.reduce(
      (total, key) => total + (typeof key === 'string' ? key.length : 0), 0,
    ));
    const clone: Record<string, unknown> = prototype === null ? Object.create(null) : {};
    for (const key of keys) {
      if (typeof key !== 'string') throw new TypeError('Arc 0 Atlas input cannot contain symbols');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Arc 0 Atlas input cannot contain accessors or hidden fields');
      }
      defineData(clone, key, clonePlainData(descriptor.value, ancestors, budget, depth + 1));
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}

function detached<T>(value: T): T {
  return clonePlainData(
    value,
    new Set<object>(),
    { nodes: 0, characters: 0 },
    0,
  ) as T;
}

function deepFreeze(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor) deepFreeze(descriptor.value, seen);
  }
  Object.freeze(value);
}

function exactInputFields(value: unknown): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  const expected = [...INPUT_FIELDS].sort();
  if (keys.length !== expected.length
    || names.some((name, index) => name !== expected[index])) return null;
  const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const field of INPUT_FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
    fields[field] = descriptor.value;
  }
  return Object.freeze(fields);
}

function persistentSurfaceView(surface: SurfaceNav): Readonly<Record<string, unknown>> {
  const raw = navToView(surface);
  if (raw === null || raw.type !== 'planet' || !raw.gal || typeof raw.gal !== 'object'
    || !raw.star || typeof raw.star !== 'object') {
    throw new TypeError('Arc 0 Atlas requires a canonical surface view');
  }
  const galaxy = raw.gal as Record<string, unknown>;
  const star = raw.star as Record<string, unknown>;
  const gal: Record<string, unknown> = {
    x: galaxy.x,
    y: galaxy.y,
    seed: galaxy.seed,
    size: galaxy.size,
    sp: galaxy.sp,
    tilt: galaxy.tilt,
    rot: galaxy.rot,
  };
  for (const flag of ['home', 'quasar', 'dwarf'] as const) {
    if (galaxy[flag] === true) gal[flag] = true;
  }
  const where = {
    gal,
    pseed: raw.pseed,
    star: { x: star.x, y: star.y, seed: star.seed },
    type: 'planet',
  };
  deepFreeze(where);
  return where;
}

function capturedInput(value: Arc0AtlasActionInput): CapturedInput | null {
  try {
    const fields = exactInputFields(value);
    if (fields === null) return null;
    const runtime = fields.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    if (!isCanonicalCF1Address(fields.address) || !('planet' in fields.address)) return null;
    const surfaceAddress = canonicalCF1WorldAddressFromNav(fields.surface);
    if (!surfaceAddress.ok || surfaceAddress.address.key !== fields.address.key) return null;
    if (typeof fields.title !== 'string' || fields.title.length < 1
      || cleanName(fields.title, ATLAS_TITLE_MAX_CHARS) !== fields.title
      || typeof fields.sub !== 'string'
      || cleanName(fields.sub, ATLAS_SUB_MAX_CHARS) !== fields.sub
      || !Number.isSafeInteger(fields.displayTimestamp)
      || (fields.displayTimestamp as number) < 0
      || (fields.displayTimestamp as number) > ATLAS_TIMESTAMP_MAX
      || !Number.isSafeInteger(fields.codecNow) || (fields.codecNow as number) < 0) return null;
    const state = detached(fields.state as SaveStateV2);
    const where = persistentSurfaceView(fields.surface as SurfaceNav);
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state,
      address: fields.address,
      title: fields.title,
      sub: fields.sub,
      displayTimestamp: fields.displayTimestamp as number,
      codecNow: fields.codecNow as number,
      where,
    });
  } catch {
    return null;
  }
}

export function operationForArc0Atlas(addressValue: CanonicalCF1WorldAddress): string {
  if (!isCanonicalCF1Address(addressValue) || !('planet' in addressValue)) {
    throw new TypeError('Arc 0 Atlas operation requires a registered canonical world address');
  }
  return `${ARC0_ATLAS_OPERATION_PREFIX}${sha256Hex(addressValue.key)}`;
}

function sealFragment(value: string, budget: SealBudget): string {
  if (budget.chars > SUCCESSOR_SEAL_MAX_CHARS - value.length) {
    throw new RangeError('Arc 0 Atlas successor exceeds its seal bound');
  }
  budget.chars += value.length;
  return value;
}

function canonicalSealJson(
  value: unknown,
  ancestors: Set<object>,
  budget: SealBudget,
  depth: number,
): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return sealFragment('null', budget);
  if (typeof value === 'boolean') return sealFragment(value ? 'true' : 'false', budget);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Arc 0 Atlas successor number is invalid');
    return sealFragment(JSON.stringify(value), budget);
  }
  if (typeof value === 'string') {
    if (value.length > SUCCESSOR_SEAL_MAX_CHARS - budget.chars) {
      throw new RangeError('Arc 0 Atlas successor exceeds its seal bound');
    }
    return sealFragment(JSON.stringify(value), budget);
  }
  if (typeof value !== 'object' || depth > 256 || ancestors.has(value)) {
    throw new TypeError('Arc 0 Atlas successor is not bounded plain data');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && prototype !== Array.prototype) {
    throw new TypeError('Arc 0 Atlas successor is not plain data');
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype || value.length > MAX_CLONE_NODES) {
        throw new RangeError('Arc 0 Atlas successor array is invalid');
      }
      const keys = Reflect.ownKeys(value);
      if (keys.length !== value.length + 1
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('Arc 0 Atlas successor array shape is invalid');
      }
      const parts = [sealFragment('[', budget)];
      for (let index = 0; index < value.length; index++) {
        if (index > 0) parts.push(sealFragment(',', budget));
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Arc 0 Atlas successor array is sparse or accessor-backed');
        }
        const item = canonicalSealJson(descriptor.value, ancestors, budget, depth + 1);
        parts.push(item ?? sealFragment('null', budget));
      }
      parts.push(sealFragment(']', budget));
      return parts.join('');
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_CLONE_NODES || keys.some((key) => typeof key !== 'string')) {
      throw new TypeError('Arc 0 Atlas successor object shape is invalid');
    }
    const parts = [sealFragment('{', budget)];
    let emitted = 0;
    for (const key of (keys as string[]).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Arc 0 Atlas successor contains an accessor or hidden field');
      }
      if (descriptor.value === undefined) continue;
      if (emitted++ > 0) parts.push(sealFragment(',', budget));
      parts.push(sealFragment(JSON.stringify(key), budget));
      parts.push(sealFragment(':', budget));
      const item = canonicalSealJson(descriptor.value, ancestors, budget, depth + 1);
      if (item === undefined) throw new TypeError('Arc 0 Atlas successor value is invalid');
      parts.push(item);
    }
    parts.push(sealFragment('}', budget));
    return parts.join('');
  } finally {
    ancestors.delete(value);
  }
}

function successorSeal(kind: 'state' | 'world-identity', value: unknown): string {
  const canonical = canonicalSealJson(value, new Set<object>(), { chars: 0 }, 0);
  if (canonical === undefined) throw new TypeError('Arc 0 Atlas successor is absent');
  return sha256Hex(`arc0-atlas:${kind}:v1\u0000${canonical}`);
}

function checkedAtlas(state: SaveStateV2): CheckedAtlas {
  const source = state.logMap;
  if (!Array.isArray(source) || Object.getPrototypeOf(source) !== Array.prototype
    || source.length > ATLAS_DURABLE_ROWS_MAX
    || Reflect.ownKeys(source).length !== source.length + 1) {
    throw new TypeError('Atlas source is invalid');
  }
  const rows: Array<[string, Record<string, unknown>]> = [];
  const byId = new Map<string, Record<string, unknown>>();
  for (let index = 0; index < source.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(source, String(index));
    const pair = descriptor && 'value' in descriptor ? descriptor.value : null;
    if (!descriptor || descriptor.enumerable !== true || !Array.isArray(pair)
      || Object.getPrototypeOf(pair) !== Array.prototype || pair.length !== 2
      || Reflect.ownKeys(pair).length !== 3) throw new TypeError('Atlas source is invalid');
    const idDescriptor = Object.getOwnPropertyDescriptor(pair, '0');
    const entryDescriptor = Object.getOwnPropertyDescriptor(pair, '1');
    const id = idDescriptor && 'value' in idDescriptor ? idDescriptor.value : null;
    const entry = entryDescriptor && 'value' in entryDescriptor ? entryDescriptor.value : null;
    if (!idDescriptor || idDescriptor.enumerable !== true || typeof id !== 'string'
      || id.length < 1 || id.length > ATLAS_ID_MAX_CHARS
      || cleanName(id, ATLAS_ID_MAX_CHARS) !== id || byId.has(id)
      || !entryDescriptor || entryDescriptor.enumerable !== true || !entry
      || typeof entry !== 'object' || Array.isArray(entry)
      || (Object.getPrototypeOf(entry) !== Object.prototype
        && Object.getPrototypeOf(entry) !== null)) throw new TypeError('Atlas source is invalid');
    const entryId = Object.getOwnPropertyDescriptor(entry, 'id');
    const timestamp = Object.getOwnPropertyDescriptor(entry, 't');
    const title = Object.getOwnPropertyDescriptor(entry, 'title');
    const sub = Object.getOwnPropertyDescriptor(entry, 'sub');
    if (!entryId || !('value' in entryId) || entryId.enumerable !== true
      || entryId.value !== id || !timestamp || !('value' in timestamp)
      || timestamp.enumerable !== true || !Number.isSafeInteger(timestamp.value)
      || timestamp.value < 0 || timestamp.value > ATLAS_TIMESTAMP_MAX
      || !title || !('value' in title) || title.enumerable !== true
      || typeof title.value !== 'string' || title.value.length < 1
      || cleanName(title.value, ATLAS_TITLE_MAX_CHARS) !== title.value
      || !sub || !('value' in sub) || sub.enumerable !== true
      || typeof sub.value !== 'string'
      || cleanName(sub.value, ATLAS_SUB_MAX_CHARS) !== sub.value) {
      throw new TypeError('Atlas source is invalid');
    }
    rows.push([id, entry as Record<string, unknown>]);
    byId.set(id, entry as Record<string, unknown>);
  }
  if (state.homeId !== null
    && (typeof state.homeId !== 'string' || !byId.has(state.homeId))) {
    throw new TypeError('Atlas home source is invalid');
  }
  return Object.freeze({ rows, byId });
}

function exactAtlasRoute(entry: Readonly<Record<string, unknown>>, where: unknown): boolean {
  return sameJson(entry.where, where);
}

function canonicalNewEntry(input: CapturedInput, id: string, title: string): Record<string, unknown> {
  return {
    id,
    title,
    sub: input.sub,
    thumb: null,
    sq: false,
    badge: '',
    where: detached(input.where),
    fav: false,
    t: input.displayTimestamp,
  };
}

function addAtlasRow(
  draft: SaveStateV2,
  checked: CheckedAtlas,
  id: string,
  entry: Record<string, unknown>,
): Readonly<{ evictedId: string | null }> {
  const candidates = [
    ...checked.rows.map((row, index) => ({ row, index, added: false })),
    { row: [id, entry] as [string, Record<string, unknown>], index: checked.rows.length, added: true },
  ];
  candidates.sort((left, right) => {
    const time = (right.row[1].t as number) - (left.row[1].t as number);
    return time === 0 ? left.index - right.index : time;
  });
  const retained = candidates.slice(0, ATLAS_DURABLE_ROWS_MAX);
  if (!retained.some(({ added }) => added)) throw new RangeError('Atlas row cannot survive its durable cap');
  const evicted = candidates.slice(ATLAS_DURABLE_ROWS_MAX);
  draft.logMap = retained.map(({ row }) => row);
  const ids = new Set(draft.logMap.map(([rowId]) => rowId));
  if (draft.homeId !== null && !ids.has(draft.homeId)) draft.homeId = null;
  return Object.freeze({ evictedId: evicted[0]?.row[0] ?? null });
}

function rowString(entry: Readonly<Record<string, unknown>>, key: 'title' | 'sub'): string {
  const value = entry[key];
  if (typeof value !== 'string') throw new TypeError('Atlas row display field is invalid');
  return value;
}

function rowTimestamp(entry: Readonly<Record<string, unknown>>): number {
  if (!Number.isSafeInteger(entry.t)) throw new TypeError('Atlas row timestamp is invalid');
  return entry.t as number;
}

function createWitness(factsValue: Arc0AtlasWitnessFacts): Arc0AtlasWitness {
  deepFreeze(factsValue);
  const encoded = JSON.stringify(factsValue);
  if (encoded.length < 1 || encoded.length > WITNESS_MAX_CHARS
    || /[\u0000-\u001f\u007f]/u.test(encoded)) {
    throw new RangeError('Arc 0 Atlas witness exceeds its receipt bound');
  }
  const witness = Object.freeze({ facts: factsValue, encoded });
  WITNESSES.add(witness);
  return witness;
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function sameNoRngPlan(plan: F4DeterministicProductPlan): boolean {
  return plan.currentAuthority.sessionRng.seed === plan.nextSessionRng.seed
    && plan.nextSessionRng.ordinal === plan.currentAuthority.sessionRng.ordinal + 1
    && sameJson(plan.currentAuthority.sessionRng.draws, plan.nextSessionRng.draws);
}

function mismatch(detail: Arc0AtlasPostcommitMismatch): Arc0AtlasPostcommitVerification {
  return Object.freeze({ kind: 'mismatch', detail });
}

export function verifyArc0AtlasPostcommit(input: Readonly<{
  transaction: F4RuntimeActionCommitOutcome;
  address: CanonicalCF1WorldAddress;
  witness: Arc0AtlasWitness;
}>): Arc0AtlasPostcommitVerification {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return mismatch('input-invalid');
    if (input.transaction.kind !== 'committed') return mismatch('transaction-not-committed');
    if (!WITNESSES.has(input.witness)) return mismatch('witness-unregistered');
    if (!isCanonicalCF1Address(input.address) || !('planet' in input.address)
      || input.witness.facts.worldKey !== input.address.key) return mismatch('world-mismatch');
    const { transaction, witness } = input;
    const facts = witness.facts;
    if (transaction.plan.operation !== operationForArc0Atlas(input.address)
      || transaction.plan.receiptOrdinal !== facts.receiptOrdinal
      || transaction.receipt.ordinal !== facts.receiptOrdinal
      || transaction.receipt.kind !== ARC0_ATLAS_RECEIPT_KIND
      || transaction.receipt.witness !== witness.encoded) return mismatch('receipt-mismatch');
    if (!sameNoRngPlan(transaction.plan)
      || !sameJson(transaction.authority.sessionRng, transaction.plan.nextSessionRng)) {
      return mismatch('session-rng-mismatch');
    }
    const savedAuthority = readF4Authority(transaction.saved.extensions);
    if (savedAuthority.kind !== 'loaded'
      || !sameJson(savedAuthority.authority.sessionRng, transaction.authority.sessionRng)) {
      return mismatch('session-rng-mismatch');
    }
    if (!sameJson(transaction.state, transaction.saved.canonicalState)) {
      return mismatch('state-fixed-point-mismatch');
    }
    if (successorSeal('state', transaction.state) !== facts.stateSuccessorSeal) {
      return mismatch('state-successor-mismatch');
    }
    const worldIdentity = readWorldIdentity(transaction.saved.extensions);
    if (worldIdentity.kind !== 'loaded') return mismatch('world-identity-not-loaded');
    if (successorSeal('world-identity', worldIdentity.state)
      !== facts.worldIdentitySuccessorSeal
      || worldIdentity.state.unresolved.some((row) => row.seed === facts.planetSeed)
        !== facts.unresolvedSeedAfter
      || (worldIdentityRecord(worldIdentity.state, input.address) !== null)
        !== facts.identityRecordAfter) return mismatch('world-identity-mismatch');
    let atlas: CheckedAtlas;
    try { atlas = checkedAtlas(transaction.state); }
    catch { return mismatch('atlas-state-mismatch'); }
    const row = atlas.byId.get(facts.atlas.id);
    if (!row || atlas.rows.length !== facts.atlas.countAfter
      || transaction.state.homeId !== facts.atlas.homeIdAfter
      || !exactAtlasRoute(row, facts.atlas.where)
      || rowString(row, 'title') !== facts.atlas.title
      || rowString(row, 'sub') !== facts.atlas.sub
      || rowTimestamp(row) !== facts.atlas.timestamp
      || (facts.atlas.evictedId !== null && atlas.byId.has(facts.atlas.evictedId))) {
      return mismatch('atlas-state-mismatch');
    }
    return Object.freeze({ kind: 'verified', worldIdentity, facts });
  } catch {
    return mismatch('input-invalid');
  }
}

function refused(
  detail: Arc0AtlasRefusalDetail,
  transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null,
  convergence: 'none' | 'read-only-reload' = 'none',
): Arc0AtlasActionOutcome {
  return Object.freeze({ kind: 'refused', durability: 'none', convergence, detail, transaction });
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): Arc0AtlasRefusalDetail {
  if (outcome.kind === 'rejected') return `transaction:rejected:${outcome.stage}:${outcome.message}`;
  if (outcome.kind === 'storage-error') return `transaction:${outcome.message}`;
  if (outcome.kind === 'protected') return `transaction:protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `transaction:lost:${outcome.reason}`;
  return `transaction:${outcome.kind}`;
}

function requiresReload(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): boolean {
  return outcome.kind === 'stale'
    || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt'
    || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable'
    || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

/** Commit one exact Atlas product once against F4's detached parent. */
export async function commitArc0AtlasAction(
  inputValue: Arc0AtlasActionInput,
): Promise<Arc0AtlasActionOutcome> {
  const input = capturedInput(inputValue);
  if (input === null) return refused('input:invalid-or-unregistered', null);

  const operation = operationForArc0Atlas(input.address);
  const atlasId = canonicalCF1WorldAtlasId(input.address);
  let selected: SelectedAtlas | null = null;
  let already: Arc0AtlasAlreadyDurableObservation | null = null;
  let deriveRefusal: Arc0AtlasRefusalDetail | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await input.commit({
      state: input.state,
      operation,
      receiptKind: ARC0_ATLAS_RECEIPT_KIND,
      codecNow: input.codecNow,
      derive: ({ draft, extensions, receiptOrdinal }) => {
        const identityRead = readWorldIdentity(extensions);
        if (identityRead.kind !== 'loaded') {
          deriveRefusal = identityRead.kind === 'future-version'
            ? 'world-identity:future-version' : `world-identity:${identityRead.kind}`;
          throw new Error(deriveRefusal);
        }
        const claim = claimCanonicalWorldIdentity(identityRead.state, input.address, extensions);
        if (claim.capacityProtected) {
          deriveRefusal = 'world-identity:capacity';
          throw new Error(deriveRefusal);
        }
        const identityState = claim.state;
        let atlas: CheckedAtlas;
        try { atlas = checkedAtlas(draft); }
        catch {
          deriveRefusal = 'atlas:source-invalid';
          throw new Error(deriveRefusal);
        }
        const existing = atlas.byId.get(atlasId) ?? null;
        if (existing !== null && !exactAtlasRoute(existing, input.where)) {
          deriveRefusal = 'atlas:collision';
          throw new Error(deriveRefusal);
        }
        if (existing !== null && !claim.claimedLegacy) {
          already = Object.freeze({
            scope: 'exact-detached-f4-parent',
            worldKey: input.address.key,
            atlasId,
            where: input.where,
            identityRecordPresent: worldIdentityRecord(identityState, input.address) !== null,
          });
          throw new Error('Arc 0 Atlas row is already durable in the detached F4 parent');
        }

        let row = existing;
        let status: Arc0AtlasRowFact['status'] = 'existing';
        let evictedId: string | null = null;
        if (row === null) {
          status = 'added';
          const title = worldIdentityName(identityState, input.address) ?? input.title;
          row = canonicalNewEntry(input, atlasId, title);
          try { ({ evictedId } = addAtlasRow(draft, atlas, atlasId, row)); }
          catch {
            deriveRefusal = 'atlas:capacity';
            throw new Error(deriveRefusal);
          }
        }

        let worldIdentityWrites: readonly V5ExtensionWrite[];
        try { worldIdentityWrites = encodeWorldIdentityExtensionWrites(identityState); }
        catch {
          deriveRefusal = 'world-identity:capacity';
          throw new Error(deriveRefusal);
        }
        const facts: Arc0AtlasWitnessFacts = {
          schema: ARC0_ATLAS_WITNESS_SCHEMA,
          worldKey: input.address.key,
          planetSeed: input.address.planet.seed,
          planetOrdinal: input.address.planet.ordinal,
          identityClaimedLegacy: claim.claimedLegacy,
          identityRecordAfter: worldIdentityRecord(identityState, input.address) !== null,
          unresolvedSeedAfter: identityState.unresolved.some(
            (record) => record.seed === input.address.planet.seed,
          ),
          atlas: Object.freeze({
            status,
            id: atlasId,
            title: rowString(row, 'title'),
            sub: rowString(row, 'sub'),
            where: input.where,
            timestamp: rowTimestamp(row),
            countBefore: atlas.rows.length,
            countAfter: draft.logMap.length,
            evictedId,
            homeIdAfter: draft.homeId,
          }),
          stateSuccessorSeal: successorSeal('state', draft),
          worldIdentitySuccessorSeal: successorSeal('world-identity', identityState),
          receiptOrdinal,
        };
        const witness = createWitness(facts);
        selected = Object.freeze({ witness, worldIdentityWrites });
        return Object.freeze({
          state: draft,
          extensionWrites: worldIdentityWrites,
          witness: witness.encoded,
        });
      },
    });
  } catch (error) {
    return refused(
      `transaction:${error instanceof Error ? error.message : String(error)}`,
      null,
      'read-only-reload',
    );
  }

  if (already !== null && transaction.kind === 'rejected' && transaction.stage === 'derive') {
    return Object.freeze({
      kind: 'already-durable',
      durability: 'observed-detached-f4-parent',
      convergence: 'none',
      observation: already,
      transaction,
    });
  }
  if (transaction.kind !== 'committed') {
    return refused(
      deriveRefusal ?? transactionDetail(transaction),
      transaction,
      requiresReload(transaction) ? 'read-only-reload' : 'none',
    );
  }
  const committedSelection = selected as SelectedAtlas | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-atlas-evidence-missing',
      transaction,
    });
  }
  const verification = verifyArc0AtlasPostcommit({
    transaction,
    address: input.address,
    witness: committedSelection.witness,
  });
  if (verification.kind !== 'verified') {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: `postcommit:${verification.detail}`,
      transaction,
    });
  }
  return Object.freeze({
    kind: 'committed',
    durability: 'committed',
    convergence: 'none',
    transaction,
    witness: committedSelection.witness,
    verification,
    worldIdentityWrites: committedSelection.worldIdentityWrites,
  });
}
