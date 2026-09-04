/* Arc 0 durable canonical-world naming transaction.

   One source-proven surface name joins the complete canonical world identity
   and the v4 `customNames` compatibility mirror inside one receipt-bearing F4
   CAS. The action owns no singleton, clock, random draw, retry, DOM, or
   optimistic live-state publication. */
import { sha256Hex } from '@cf/domain-acquisition';
import { cleanName } from '@cf/domain-naming';
import {
  PORTABLE_V5_MAX_BYTES,
  encodeWorldIdentityExtensionWrites,
  readF4Authority,
  readWorldIdentity,
  setCanonicalWorldName,
  worldIdentityName,
  type F4DeterministicProductPlan,
  type SaveStateV2,
  type V5ExtensionWrite,
  type WorldIdentityReadOutcome,
} from '@cf/persistence';
import {
  canonicalCF1WorldAddressFromNav,
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
  type SurfaceNav,
} from '@cf/scene';
import {
  prepareArc9EventAchievementJoinV1,
  projectArc9ProgressionStateV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC0_WORLD_NAME_RECEIPT_KIND = 'arc0-world-name' as const;
export const ARC0_WORLD_NAME_WITNESS_SCHEMA =
  'cf-v2-arc0-world-name-witness/v1' as const;
const ARC0_WORLD_NAME_OPERATION_PREFIX = 'arc0.world-name:';
const INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'surface', 'address', 'name', 'codecNow',
] as const);
const MAX_CLONE_NODES = 1_500_000;
const LEGACY_CUSTOM_NAMES_MAX = 5_000;
const WORLD_NAME_MAX_CHARS = 24;
const WITNESS_MAX_CHARS = 4_096;
/* Compact v4 is bounded to 1 MiB, but its expanded canonical SaveState may
   be larger. Seal against the supported portable-v5 envelope, as the landing
   owner does, so a legal veteran save is not refused merely for expanding. */
const SUCCESSOR_SEAL_MAX_CHARS = PORTABLE_V5_MAX_BYTES;

export interface Arc0WorldNameActionInput {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly surface: SurfaceNav;
  readonly address: CanonicalCF1WorldAddress;
  readonly name: string;
  readonly codecNow: number;
}

export interface Arc0WorldNameAchievementFact {
  readonly id: 'namer';
  readonly owner: 'naming:first-discovery-name';
  readonly alreadyUnlocked: boolean;
  readonly added: boolean;
  readonly priorUnlockedCount: number;
  readonly unlockedCountAfter: number;
}

export interface Arc0WorldNameWitnessFacts {
  readonly schema: typeof ARC0_WORLD_NAME_WITNESS_SCHEMA;
  readonly worldKey: CF1WorldKey;
  readonly planetSeed: number;
  readonly planetOrdinal: number;
  readonly name: string;
  readonly canonicalNameBefore: string | null;
  readonly canonicalChanged: boolean;
  readonly claimedLegacyIdentity: boolean;
  readonly legacyKey: string;
  readonly legacyNameBefore: string | null;
  readonly legacyNameAfter: string;
  readonly legacyMirrorChanged: boolean;
  readonly achievement: Arc0WorldNameAchievementFact;
  /** Full codec-canonical product successor, independent of F4's returned copy. */
  readonly stateSuccessorSeal: string;
  /** Full identity successor, including every unrelated registered row. */
  readonly worldIdentitySuccessorSeal: string;
  readonly receiptOrdinal: number;
}

export interface Arc0WorldNameWitness {
  readonly facts: Arc0WorldNameWitnessFacts;
  readonly encoded: string;
}

export type Arc0WorldNameRefusalDetail =
  | 'input:invalid-or-unregistered'
  | 'world-identity:absent'
  | 'world-identity:corrupt'
  | 'world-identity:future-version'
  | 'world-identity:capacity'
  | 'world-identity:projection-mismatch'
  | 'legacy-custom-names:invalid'
  | 'legacy-custom-names:capacity'
  | 'legacy-custom-names:collision'
  | `achievement:${Arc9ProgressionProjectionProtectionReasonV1}`
  | `transaction:${string}`;

export type Arc0WorldNamePostcommitMismatch =
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
  | 'legacy-mirror-mismatch'
  | 'achievement-state-mismatch';

export type Arc0WorldNamePostcommitVerification =
  | Readonly<{
    kind: 'verified';
    worldIdentity: Extract<WorldIdentityReadOutcome, { readonly kind: 'loaded' }>;
    facts: Arc0WorldNameWitnessFacts;
  }>
  | Readonly<{ kind: 'mismatch'; detail: Arc0WorldNamePostcommitMismatch }>;

export type Arc0WorldNameActionOutcome =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    witness: Arc0WorldNameWitness;
    verification: Extract<Arc0WorldNamePostcommitVerification, { readonly kind: 'verified' }>;
    worldIdentityWrites: readonly V5ExtensionWrite[];
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-world-name-evidence-missing'
      | `postcommit:${Arc0WorldNamePostcommitMismatch}`;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: Arc0WorldNameRefusalDetail;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly surface: SurfaceNav;
  readonly address: CanonicalCF1WorldAddress;
  readonly name: string;
  readonly codecNow: number;
}

interface SelectedWorldName {
  readonly witness: Arc0WorldNameWitness;
  readonly worldIdentityWrites: readonly V5ExtensionWrite[];
}

interface CloneBudget { nodes: number; }
interface SealBudget { chars: number; }

const WITNESSES = new WeakSet<object>();

function consumeCloneBudget(budget: CloneBudget, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0
    || budget.nodes > MAX_CLONE_NODES - amount) {
    throw new RangeError('Arc 0 world-name input exceeds the detachment bound');
  }
  budget.nodes += amount;
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
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('Arc 0 world-name state must be plain data');
  if (depth > 256 || ancestors.has(value)) {
    throw new TypeError('Arc 0 world-name state is cyclic or too deep');
  }
  consumeCloneBudget(budget, 1);
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('Arc 0 world-name arrays must be native');
      const keys = Reflect.ownKeys(value);
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (!lengthDescriptor || !('value' in lengthDescriptor)
        || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('Arc 0 world-name array shape is invalid');
      }
      const length = lengthDescriptor.value as number;
      consumeCloneBudget(budget, length);
      const clone = new Array<unknown>(length);
      for (let index = 0; index < length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Arc 0 world-name arrays cannot contain holes or accessors');
        }
        defineData(
          clone,
          String(index),
          clonePlainData(descriptor.value, ancestors, budget, depth + 1),
        );
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Arc 0 world-name objects must use a plain prototype');
    }
    const keys = Reflect.ownKeys(value);
    consumeCloneBudget(budget, keys.length);
    const clone: Record<string, unknown> = prototype === null ? Object.create(null) : {};
    for (const key of keys) {
      if (typeof key !== 'string') throw new TypeError('Arc 0 world-name state cannot contain symbols');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Arc 0 world-name state cannot contain accessors or hidden fields');
      }
      defineData(
        clone,
        key,
        clonePlainData(descriptor.value, ancestors, budget, depth + 1),
      );
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
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

function sealFragment(value: string, budget: SealBudget): string {
  if (budget.chars > SUCCESSOR_SEAL_MAX_CHARS - value.length) {
    throw new RangeError('Arc 0 world-name successor exceeds its seal bound');
  }
  budget.chars += value.length;
  return value;
}

/** Canonical JSON with sorted object keys. It never invokes accessors or
 * toJSON and stops before hashing an attacker-sized successor. */
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
    if (!Number.isFinite(value)) throw new TypeError('Arc 0 world-name successor has a non-finite number');
    return sealFragment(JSON.stringify(value), budget);
  }
  if (typeof value === 'string') {
    if (value.length > SUCCESSOR_SEAL_MAX_CHARS - budget.chars) {
      throw new RangeError('Arc 0 world-name successor exceeds its seal bound');
    }
    return sealFragment(JSON.stringify(value), budget);
  }
  if (typeof value !== 'object' || depth > 256 || ancestors.has(value)) {
    throw new TypeError('Arc 0 world-name successor is not bounded plain data');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && prototype !== Array.prototype) {
    throw new TypeError('Arc 0 world-name successor is not plain data');
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('Arc 0 world-name successor array is invalid');
      if (value.length > MAX_CLONE_NODES) {
        throw new RangeError('Arc 0 world-name successor array exceeds its seal bound');
      }
      const keys = Reflect.ownKeys(value);
      if (keys.length !== value.length + 1
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('Arc 0 world-name successor array shape is invalid');
      }
      const parts = [sealFragment('[', budget)];
      for (let index = 0; index < value.length; index++) {
        if (index > 0) parts.push(sealFragment(',', budget));
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Arc 0 world-name successor contains an array hole or accessor');
        }
        const item = canonicalSealJson(descriptor.value, ancestors, budget, depth + 1);
        parts.push(item ?? sealFragment('null', budget));
      }
      parts.push(sealFragment(']', budget));
      return parts.join('');
    }
    const parts = [sealFragment('{', budget)];
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_CLONE_NODES || keys.some((key) => typeof key !== 'string')) {
      throw new TypeError('Arc 0 world-name successor contains a symbol');
    }
    let emitted = 0;
    for (const key of (keys as string[]).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Arc 0 world-name successor contains an accessor or hidden field');
      }
      if (descriptor.value === undefined) continue;
      if (emitted++ > 0) parts.push(sealFragment(',', budget));
      parts.push(sealFragment(JSON.stringify(key), budget));
      parts.push(sealFragment(':', budget));
      const item = canonicalSealJson(descriptor.value, ancestors, budget, depth + 1);
      if (item === undefined) throw new TypeError('Arc 0 world-name successor value is invalid');
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
  if (canonical === undefined) throw new TypeError('Arc 0 world-name successor is absent');
  return sha256Hex(`arc0-world-name:${kind}:v1\u0000${canonical}`);
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

function canonicalName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const checked = cleanName(value, WORLD_NAME_MAX_CHARS);
  if (checked.length < 1 || checked.length > WORLD_NAME_MAX_CHARS
    || /[\u0000-\u001f\u007f]/u.test(checked)) return null;
  return checked;
}

function capturedInput(value: Arc0WorldNameActionInput): CapturedInput | null {
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
    const name = canonicalName(fields.name);
    if (name === null || !Number.isSafeInteger(fields.codecNow)
      || (fields.codecNow as number) < 0) return null;
    const state = clonePlainData(fields.state, new Set<object>(), { nodes: 0 }, 0);
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: state as SaveStateV2,
      surface: fields.surface as SurfaceNav,
      address: fields.address,
      name,
      codecNow: fields.codecNow as number,
    });
  } catch {
    return null;
  }
}

export function operationForArc0WorldName(addressValue: CanonicalCF1WorldAddress): string {
  if (!isCanonicalCF1Address(addressValue) || !('planet' in addressValue)) {
    throw new TypeError('Arc 0 world-name operation requires a registered canonical world address');
  }
  return `${ARC0_WORLD_NAME_OPERATION_PREFIX}${sha256Hex(addressValue.key)}`;
}

type CheckedLegacyCustomNames =
  | Readonly<{
    kind: 'ready';
    rows: Array<[string, string]>;
    targetIndex: number;
    targetName: string | null;
  }>
  | Readonly<{ kind: 'refused'; detail: 'invalid' | 'capacity' | 'collision' }>;

function checkedLegacyCustomNames(value: unknown, targetKey: string): CheckedLegacyCustomNames {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || Reflect.ownKeys(value).length !== value.length + 1) {
    return Object.freeze({ kind: 'refused', detail: 'invalid' });
  }
  if (value.length > LEGACY_CUSTOM_NAMES_MAX) {
    return Object.freeze({ kind: 'refused', detail: 'capacity' });
  }
  const rows: Array<[string, string]> = [];
  const keys = new Set<string>();
  let targetIndex = -1;
  let targetName: string | null = null;
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    const row = descriptor && 'value' in descriptor ? descriptor.value : null;
    if (!descriptor || descriptor.enumerable !== true || !Array.isArray(row)
      || Object.getPrototypeOf(row) !== Array.prototype || row.length !== 2
      || Reflect.ownKeys(row).length !== 3) {
      return Object.freeze({ kind: 'refused', detail: 'invalid' });
    }
    const keyDescriptor = Object.getOwnPropertyDescriptor(row, '0');
    const nameDescriptor = Object.getOwnPropertyDescriptor(row, '1');
    if (!keyDescriptor || !('value' in keyDescriptor) || keyDescriptor.enumerable !== true
      || typeof keyDescriptor.value !== 'string'
      || !nameDescriptor || !('value' in nameDescriptor) || nameDescriptor.enumerable !== true
      || typeof nameDescriptor.value !== 'string'
      || cleanName(nameDescriptor.value, WORLD_NAME_MAX_CHARS) !== nameDescriptor.value
      || nameDescriptor.value.length < 1 || nameDescriptor.value.length > WORLD_NAME_MAX_CHARS) {
      return Object.freeze({ kind: 'refused', detail: 'invalid' });
    }
    const key = keyDescriptor.value;
    if (keys.has(key)) return Object.freeze({ kind: 'refused', detail: 'collision' });
    keys.add(key);
    rows.push([key, nameDescriptor.value]);
    if (key === targetKey) {
      targetIndex = index;
      targetName = nameDescriptor.value;
    }
  }
  return Object.freeze({ kind: 'ready', rows, targetIndex, targetName });
}

function createWitness(factsValue: Arc0WorldNameWitnessFacts): Arc0WorldNameWitness {
  deepFreeze(factsValue);
  const encoded = JSON.stringify(factsValue);
  if (encoded.length < 1 || encoded.length > WITNESS_MAX_CHARS
    || /[\u0000-\u001f\u007f]/u.test(encoded)) {
    throw new RangeError('Arc 0 world-name witness exceeds its receipt bound');
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

function mismatch(detail: Arc0WorldNamePostcommitMismatch): Arc0WorldNamePostcommitVerification {
  return Object.freeze({ kind: 'mismatch', detail });
}

export function verifyArc0WorldNamePostcommit(input: Readonly<{
  transaction: F4RuntimeActionCommitOutcome;
  address: CanonicalCF1WorldAddress;
  witness: Arc0WorldNameWitness;
}>): Arc0WorldNamePostcommitVerification {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return mismatch('input-invalid');
    if (input.transaction.kind !== 'committed') return mismatch('transaction-not-committed');
    if (!WITNESSES.has(input.witness)) return mismatch('witness-unregistered');
    if (!isCanonicalCF1Address(input.address) || !('planet' in input.address)
      || input.witness.facts.worldKey !== input.address.key) return mismatch('world-mismatch');
    const { transaction, witness } = input;
    const facts = witness.facts;
    if (transaction.plan.operation !== operationForArc0WorldName(input.address)
      || transaction.plan.receiptOrdinal !== facts.receiptOrdinal
      || transaction.receipt.ordinal !== facts.receiptOrdinal
      || transaction.receipt.kind !== ARC0_WORLD_NAME_RECEIPT_KIND
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
      || worldIdentityName(worldIdentity.state, input.address) !== facts.name) {
      return mismatch('world-identity-mismatch');
    }
    const legacy = checkedLegacyCustomNames(transaction.state.customNames, facts.legacyKey);
    if (legacy.kind !== 'ready' || legacy.targetName !== facts.name
      || facts.legacyNameAfter !== facts.name) return mismatch('legacy-mirror-mismatch');
    const achievement = facts.achievement;
    const progression = projectArc9ProgressionStateV1(transaction.state);
    const row = progression.kind === 'projected'
      ? progression.projection.achievements.rows.find(({ id }) => id === achievement.id)
      : undefined;
    if (achievement.id !== 'namer' || achievement.owner !== 'naming:first-discovery-name'
      || achievement.alreadyUnlocked === achievement.added
      || achievement.unlockedCountAfter
        !== achievement.priorUnlockedCount + (achievement.added ? 1 : 0)
      || progression.kind !== 'projected'
      || progression.projection.unlockedIds.length !== achievement.unlockedCountAfter
      || row?.status !== 'unlocked') return mismatch('achievement-state-mismatch');
    return Object.freeze({ kind: 'verified', worldIdentity, facts });
  } catch {
    return mismatch('input-invalid');
  }
}

function refused(
  detail: Arc0WorldNameRefusalDetail,
  transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null,
  convergence: 'none' | 'read-only-reload' = 'none',
): Arc0WorldNameActionOutcome {
  return Object.freeze({ kind: 'refused', durability: 'none', convergence, detail, transaction });
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): Arc0WorldNameRefusalDetail {
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

/** Commit one canonical world name once. Every decision runs only against
 * F4's detached draft/extensions inside its sole repository attempt. */
export async function commitArc0WorldNameAction(
  inputValue: Arc0WorldNameActionInput,
): Promise<Arc0WorldNameActionOutcome> {
  const input = capturedInput(inputValue);
  if (input === null) return refused('input:invalid-or-unregistered', null);

  const operation = operationForArc0WorldName(input.address);
  let selected: SelectedWorldName | null = null;
  let deriveRefusal: Arc0WorldNameRefusalDetail | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await input.commit({
      state: input.state,
      operation,
      receiptKind: ARC0_WORLD_NAME_RECEIPT_KIND,
      codecNow: input.codecNow,
      derive: ({ draft, extensions, receiptOrdinal, canonicalizeState }) => {
        const identityRead = readWorldIdentity(extensions);
        if (identityRead.kind !== 'loaded') {
          deriveRefusal = identityRead.kind === 'future-version'
            ? 'world-identity:future-version' : `world-identity:${identityRead.kind}`;
          throw new Error(deriveRefusal);
        }
        const legacyKey = `p${input.address.planet.seed}`;
        const legacy = checkedLegacyCustomNames(draft.customNames, legacyKey);
        if (legacy.kind !== 'ready') {
          deriveRefusal = `legacy-custom-names:${legacy.detail}`;
          throw new Error(deriveRefusal);
        }
        if (legacy.targetIndex < 0 && legacy.rows.length >= LEGACY_CUSTOM_NAMES_MAX) {
          deriveRefusal = 'legacy-custom-names:capacity';
          throw new Error(deriveRefusal);
        }

        const canonicalNameBefore = worldIdentityName(identityRead.state, input.address);
        const naming = setCanonicalWorldName(
          identityRead.state,
          input.address,
          input.name,
          extensions,
        );
        if (naming.capacityProtected) {
          deriveRefusal = 'world-identity:capacity';
          throw new Error(deriveRefusal);
        }
        if (!naming.applied || worldIdentityName(naming.state, input.address) !== input.name) {
          deriveRefusal = 'world-identity:projection-mismatch';
          throw new Error(deriveRefusal);
        }
        let worldIdentityWrites: readonly V5ExtensionWrite[];
        try {
          worldIdentityWrites = encodeWorldIdentityExtensionWrites(naming.state);
        } catch {
          deriveRefusal = 'world-identity:capacity';
          throw new Error(deriveRefusal);
        }

        const legacyMirrorChanged = legacy.targetName !== input.name;
        if (legacy.targetIndex >= 0) legacy.rows[legacy.targetIndex] = [legacyKey, input.name];
        else legacy.rows.push([legacyKey, input.name]);
        draft.customNames = legacy.rows;

        const join = prepareArc9EventAchievementJoinV1(draft, 'namer');
        if (join.kind !== 'prepared') {
          deriveRefusal = `achievement:${join.reason}`;
          throw new Error(deriveRefusal);
        }
        draft.unlocked = [...join.nextUnlockedIds];

        const facts: Arc0WorldNameWitnessFacts = {
          schema: ARC0_WORLD_NAME_WITNESS_SCHEMA,
          worldKey: input.address.key,
          planetSeed: input.address.planet.seed,
          planetOrdinal: input.address.planet.ordinal,
          name: input.name,
          canonicalNameBefore,
          canonicalChanged: naming.state !== identityRead.state,
          claimedLegacyIdentity: naming.claimedLegacy,
          legacyKey,
          legacyNameBefore: legacy.targetName,
          legacyNameAfter: input.name,
          legacyMirrorChanged,
          achievement: Object.freeze({
            id: 'namer',
            owner: 'naming:first-discovery-name',
            alreadyUnlocked: !join.added,
            added: join.added,
            priorUnlockedCount: join.priorUnlockedCount,
            unlockedCountAfter: join.nextUnlockedIds.length,
          }),
          stateSuccessorSeal: successorSeal('state', canonicalizeState(draft)),
          worldIdentitySuccessorSeal: successorSeal('world-identity', naming.state),
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

  if (transaction.kind !== 'committed') {
    return refused(
      deriveRefusal ?? transactionDetail(transaction),
      transaction,
      requiresReload(transaction) ? 'read-only-reload' : 'none',
    );
  }
  const committedSelection = selected as SelectedWorldName | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-world-name-evidence-missing',
      transaction,
    });
  }
  const verification = verifyArc0WorldNamePostcommit({
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
