/* Arc 0 durable landing transaction.

   A landing is one deterministic F4 product: the proven surface route,
   canonical world identity, legacy mirror, Charter progress, and field
   samples either cross one receipt-bearing CAS together or remain wholly
   unpublished. This module owns no singleton, clock, RNG draw, retry, DOM, or
   optimistic live-state mutation. */
import { sha256Hex } from '@cf/domain-acquisition';
import {
  isCanonicalEarthWorldAddress,
  isWorldOpportunitySnapshot,
  type FieldSampleLandingAuthority,
  type FieldSampleSuppressionReason,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import {
  PORTABLE_V5_MAX_BYTES,
  encodeWorldIdentityExtensionWrites,
  readF4Authority,
  readWorldIdentity,
  recordCanonicalWorldLanding,
  worldIdentityRecord,
  type CanonicalWorldIdentityStateV1,
  type F4DeterministicProductPlan,
  type SaveStateV2,
  type V5ExtensionWrite,
  type WorldIdentityReadOutcome,
} from '@cf/persistence';
import {
  ascStageOf,
  bankLandfall,
  canonicalCF1WorldAddressFromNav,
  isCanonicalCF1Address,
  navToView,
  reconcileV2Chapters,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
  type SurfaceNav,
} from '@cf/scene';
import {
  deriveArc0FieldSamples,
  type Arc0FieldSampleDerivation,
} from './arc0-field-samples.js';
import {
  prepareArc9EventAchievementJoinV1,
  projectArc9ProgressionStateV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';
import {
  stageStarterCharterEventV1,
  type StarterCharterCompletionV1,
} from './starter-charters.js';

export const ARC0_LANDING_RECEIPT_KIND = 'arc0-land' as const;
export const ARC0_LANDING_WITNESS_SCHEMA = 'cf-v2-arc0-landing-witness/v1' as const;
const ARC0_LANDING_OPERATION_PREFIX = 'arc0.land:';
const INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'surface', 'address', 'opportunity', 'training', 'codecNow',
] as const);
const MAX_CLONE_NODES = 1_500_000;
const LEGACY_LANDED_INPUT_MAX = 60_000;
const LEGACY_LANDED_OUTPUT_MAX = 4_000;
const LEGACY_ITEMS_MAX = 300;
const LEGACY_ITEM_QUANTITY_MAX = 999;
const LEGACY_CHARTER_PROGRESS_MAX = 999;
const LEGACY_CHARTER_PROGRESS_ROWS_MAX = 128;
const WITNESS_MAX_CHARS = 4_096;
/* The compact v4 projection may occupy 1 MiB, while its canonical expanded
   SaveState owns derived Compendium fields and descriptive keys. Use the
   supported 2 MiB portable-v5 envelope as the bounded canonical seal budget. */
const SUCCESSOR_SEAL_MAX_CHARS = PORTABLE_V5_MAX_BYTES;

export interface Arc0LandingActionInput {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly surface: SurfaceNav;
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly training: boolean;
  readonly codecNow: number;
}

export interface Arc0LandingMaterialFact {
  readonly id: string;
  readonly quantity: 1;
  readonly quantityAfter: number;
}

export type Arc0LandingSampleFact =
  | Readonly<{
    kind: 'reward';
    materials: readonly Arc0LandingMaterialFact[];
    stardust: number;
    essenceAfter: number;
    essenceEarnedAfter: number;
    landingsAfter: number;
  }>
  | Readonly<{
    kind: 'suppressed';
    reason: FieldSampleSuppressionReason;
  }>;

export interface Arc0LandingCharterFact {
  readonly banked: boolean;
  readonly ascChBefore: number | null;
  readonly ascChAfter: number | null;
  readonly stage: number | null;
  readonly progressSeal: string | null;
  readonly delta: Readonly<Record<string, number>>;
}

export interface Arc0LandingAchievementFact {
  readonly id: 'home';
  readonly owner: 'landing:earth';
  readonly alreadyUnlocked: boolean;
  readonly added: boolean;
  readonly priorUnlockedCount: number;
  readonly unlockedCountAfter: number;
}

export interface Arc0LandingStarterCharterFact {
  readonly changed: boolean;
  readonly progressIds: readonly string[];
  readonly completions: readonly StarterCharterCompletionV1[];
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly addedAchievementIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
}

export interface Arc0LandingWitnessFacts {
  readonly schema: typeof ARC0_LANDING_WITNESS_SCHEMA;
  readonly worldKey: CF1WorldKey;
  readonly planetSeed: number;
  readonly planetOrdinal: number;
  readonly landing: FieldSampleLandingAuthority;
  readonly permanentLanding: boolean;
  readonly training: boolean;
  readonly landingKnownBefore: boolean;
  readonly identityLandedAfter: boolean;
  readonly claimedLegacyIdentity: boolean;
  /** Null means the route-only Training product never inspected this carrier. */
  readonly legacyMirrorContainsSeedAfter: boolean | null;
  readonly savedView: Readonly<Record<string, unknown>>;
  readonly sample: Arc0LandingSampleFact;
  readonly charter: Arc0LandingCharterFact;
  readonly starterCharters: Arc0LandingStarterCharterFact;
  /** Present only for the complete canonical Earth address. */
  readonly achievement: Arc0LandingAchievementFact | null;
  /** Full codec-canonical product successor, independent of F4's returned copy. */
  readonly stateSuccessorSeal: string;
  /** Full world-identity successor, including unrelated registered rows. */
  readonly worldIdentitySuccessorSeal: string;
  readonly receiptOrdinal: number;
}

export interface Arc0LandingWitness {
  readonly facts: Arc0LandingWitnessFacts;
  readonly encoded: string;
}

export type Arc0LandingRefusalDetail =
  | 'input:invalid-or-unregistered'
  | 'world-identity:absent'
  | 'world-identity:corrupt'
  | 'world-identity:future-version'
  | 'world-identity:capacity'
  | 'world-identity:projection-mismatch'
  | 'legacy-landed:invalid'
  | 'charter:invalid'
  | `starter-charter:${string}`
  | `achievement:${Arc9ProgressionProjectionProtectionReasonV1}`
  | `field-sample:${Extract<Arc0FieldSampleDerivation, { kind: 'refused' }>['detail']}`
  | `transaction:${string}`;

export type Arc0LandingPostcommitMismatch =
  | 'input-invalid'
  | 'transaction-not-committed'
  | 'witness-unregistered'
  | 'world-mismatch'
  | 'receipt-mismatch'
  | 'session-rng-mismatch'
  | 'state-fixed-point-mismatch'
  | 'state-successor-mismatch'
  | 'saved-view-mismatch'
  | 'world-identity-not-loaded'
  | 'world-identity-mismatch'
  | 'legacy-mirror-mismatch'
  | 'sample-state-mismatch'
  | 'charter-state-mismatch'
  | 'achievement-state-mismatch';

export type Arc0LandingPostcommitVerification =
  | Readonly<{
    kind: 'verified';
    worldIdentity: Extract<WorldIdentityReadOutcome, { readonly kind: 'loaded' }>;
    facts: Arc0LandingWitnessFacts;
  }>
  | Readonly<{ kind: 'mismatch'; detail: Arc0LandingPostcommitMismatch }>;

export type Arc0LandingActionOutcome =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    witness: Arc0LandingWitness;
    verification: Extract<Arc0LandingPostcommitVerification, { readonly kind: 'verified' }>;
    worldIdentityWrites: readonly V5ExtensionWrite[];
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-landing-evidence-missing' | `postcommit:${Arc0LandingPostcommitMismatch}`;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: Arc0LandingRefusalDetail;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly surface: SurfaceNav;
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly training: boolean;
  readonly codecNow: number;
  readonly savedView: Readonly<Record<string, unknown>>;
}

interface SelectedLanding {
  readonly witness: Arc0LandingWitness;
  readonly worldIdentityWrites: readonly V5ExtensionWrite[];
  readonly extensionWrites: readonly V5ExtensionWrite[];
}

const WITNESSES = new WeakSet<object>();

interface CloneBudget { nodes: number; }

function consumeCloneBudget(budget: CloneBudget, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0
    || budget.nodes > MAX_CLONE_NODES - amount) {
    throw new RangeError('Arc 0 landing input exceeds the detachment bound');
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
  if (typeof value !== 'object') throw new TypeError('Arc 0 landing state must be plain data');
  if (depth > 256 || ancestors.has(value)) {
    throw new TypeError('Arc 0 landing state is cyclic or too deep');
  }
  consumeCloneBudget(budget, 1);
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('Arc 0 landing arrays must be native');
      const keys = Reflect.ownKeys(value);
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (!lengthDescriptor || !('value' in lengthDescriptor)
        || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('Arc 0 landing array shape is invalid');
      }
      const length = lengthDescriptor.value as number;
      consumeCloneBudget(budget, length);
      const clone = new Array<unknown>(length);
      for (let index = 0; index < length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined) continue;
        if (!('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Arc 0 landing arrays cannot contain accessors');
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
      throw new TypeError('Arc 0 landing objects must use a plain prototype');
    }
    const keys = Reflect.ownKeys(value);
    consumeCloneBudget(budget, keys.length);
    const clone: Record<string, unknown> = prototype === null ? Object.create(null) : {};
    for (const key of keys) {
      if (typeof key !== 'string') throw new TypeError('Arc 0 landing state cannot contain symbols');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Arc 0 landing state cannot contain accessors or hidden fields');
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

interface SealBudget { chars: number; }

function sealFragment(value: string, budget: SealBudget): string {
  if (budget.chars > SUCCESSOR_SEAL_MAX_CHARS - value.length) {
    throw new RangeError('Arc 0 landing successor exceeds its seal bound');
  }
  budget.chars += value.length;
  return value;
}

/** JSON-compatible canonical serialization with sorted object keys. It is
 * independent of property insertion order, never invokes toJSON/accessors,
 * and stops before hashing an attacker-sized successor. */
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
    if (!Number.isFinite(value)) throw new TypeError('Arc 0 landing successor has a non-finite number');
    return sealFragment(JSON.stringify(value), budget);
  }
  if (typeof value === 'string') {
    if (value.length > SUCCESSOR_SEAL_MAX_CHARS - budget.chars) {
      throw new RangeError('Arc 0 landing successor exceeds its seal bound');
    }
    return sealFragment(JSON.stringify(value), budget);
  }
  if (typeof value !== 'object' || depth > 256 || ancestors.has(value)) {
    throw new TypeError('Arc 0 landing successor is not bounded plain data');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && prototype !== Array.prototype) {
    throw new TypeError('Arc 0 landing successor is not plain data');
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('Arc 0 landing successor array is invalid');
      if (value.length > MAX_CLONE_NODES) {
        throw new RangeError('Arc 0 landing successor array exceeds its seal bound');
      }
      const keys = Reflect.ownKeys(value);
      if (keys.length !== value.length + 1
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('Arc 0 landing successor array shape is invalid');
      }
      const parts = [sealFragment('[', budget)];
      for (let index = 0; index < value.length; index++) {
        if (index > 0) parts.push(sealFragment(',', budget));
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor !== undefined && (!('value' in descriptor) || descriptor.enumerable !== true)) {
          throw new TypeError('Arc 0 landing successor contains an array accessor');
        }
        const item = descriptor === undefined
          ? undefined
          : canonicalSealJson(descriptor.value, ancestors, budget, depth + 1);
        parts.push(item ?? sealFragment('null', budget));
      }
      parts.push(sealFragment(']', budget));
      return parts.join('');
    }
    const parts = [sealFragment('{', budget)];
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_CLONE_NODES || keys.some((key) => typeof key !== 'string')) {
      throw new TypeError('Arc 0 landing successor contains a symbol');
    }
    let emitted = 0;
    for (const key of (keys as string[]).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Arc 0 landing successor contains an accessor or hidden field');
      }
      if (descriptor.value === undefined) continue;
      if (emitted++ > 0) parts.push(sealFragment(',', budget));
      parts.push(sealFragment(JSON.stringify(key), budget));
      parts.push(sealFragment(':', budget));
      const item = canonicalSealJson(descriptor.value, ancestors, budget, depth + 1);
      if (item === undefined) throw new TypeError('Arc 0 landing successor value is invalid');
      parts.push(item);
    }
    parts.push(sealFragment('}', budget));
    return parts.join('');
  } finally {
    ancestors.delete(value);
  }
}

function successorSeal(kind: 'state' | 'world-identity' | 'charter-progress', value: unknown): string {
  const canonical = canonicalSealJson(value, new Set<object>(), { chars: 0 }, 0);
  if (canonical === undefined) throw new TypeError('Arc 0 landing successor is absent');
  return sha256Hex(`arc0-landing:${kind}:v1\u0000${canonical}`);
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

function capturedInput(value: Arc0LandingActionInput): CapturedInput | null {
  try {
    const fields = exactInputFields(value);
    if (fields === null) return null;
    const runtime = fields.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    if (!isCanonicalCF1Address(fields.address) || !('planet' in fields.address)) return null;
    if (!isWorldOpportunitySnapshot(fields.opportunity)) return null;
    const surfaceAddress = canonicalCF1WorldAddressFromNav(fields.surface);
    if (!surfaceAddress.ok
      || surfaceAddress.address.key !== fields.address.key
      || fields.opportunity.key !== fields.address.key) return null;
    if (typeof fields.training !== 'boolean'
      || !Number.isSafeInteger(fields.codecNow) || (fields.codecNow as number) < 0) return null;
    const state = clonePlainData(
      fields.state,
      new Set<object>(),
      { nodes: 0 },
      0,
    );
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    const savedView = navToView(fields.surface as SurfaceNav);
    if (savedView === null) return null;
    const detachedView = clonePlainData(savedView, new Set<object>(), { nodes: 0 }, 0);
    deepFreeze(detachedView);
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: state as SaveStateV2,
      surface: fields.surface as SurfaceNav,
      address: fields.address,
      opportunity: fields.opportunity,
      training: fields.training,
      codecNow: fields.codecNow as number,
      savedView: detachedView as Readonly<Record<string, unknown>>,
    });
  } catch {
    return null;
  }
}

export function operationForArc0Landing(addressValue: CanonicalCF1WorldAddress): string {
  if (!isCanonicalCF1Address(addressValue) || !('planet' in addressValue)) {
    throw new TypeError('Arc 0 landing operation requires a registered canonical world address');
  }
  return `${ARC0_LANDING_OPERATION_PREFIX}${sha256Hex(addressValue.key)}`;
}

function checkedLandingAuthority(
  state: CanonicalWorldIdentityStateV1,
  address: CanonicalCF1WorldAddress,
): FieldSampleLandingAuthority {
  if (worldIdentityRecord(state, address)?.landed === true) return 'repeat';
  return state.unresolved.some((row) => row.seed === address.planet.seed && row.landed)
    ? 'unresolved-already-landed' : 'first';
}

function checkedLegacyLanded(value: unknown): number[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > LEGACY_LANDED_INPUT_MAX
    || Reflect.ownKeys(value).length !== value.length + 1) {
    throw new TypeError('legacy landed mirror is invalid');
  }
  const seen = new Set<number>();
  const rows: number[] = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
      || !Number.isInteger(descriptor.value) || descriptor.value < 0
      || descriptor.value > 0xFFFF_FFFF || seen.has(descriptor.value)) {
      throw new TypeError('legacy landed mirror is invalid');
    }
    seen.add(descriptor.value);
    rows.push(descriptor.value);
  }
  return rows;
}

function checkedItems(value: unknown): Array<[string, number]> {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > LEGACY_ITEMS_MAX || Reflect.ownKeys(value).length !== value.length + 1) {
    throw new TypeError('legacy items are invalid');
  }
  const rows: Array<[string, number]> = [];
  const ids = new Set<string>();
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    const row = descriptor && 'value' in descriptor ? descriptor.value : null;
    if (!descriptor || descriptor.enumerable !== true || !Array.isArray(row)
      || row.length !== 2 || Reflect.ownKeys(row).length !== 3) {
      throw new TypeError('legacy items are invalid');
    }
    const id = Object.getOwnPropertyDescriptor(row, '0');
    const count = Object.getOwnPropertyDescriptor(row, '1');
    if (!id || !('value' in id) || id.enumerable !== true
      || typeof id.value !== 'string' || id.value.length < 1 || id.value.length > 128
      || ids.has(id.value) || !count || !('value' in count) || count.enumerable !== true
      || !Number.isSafeInteger(count.value) || count.value < 0
      || count.value > LEGACY_ITEM_QUANTITY_MAX) {
      throw new TypeError('legacy items are invalid');
    }
    ids.add(id.value);
    rows.push([id.value, count.value]);
  }
  return rows;
}

function checkedCharter(draft: SaveStateV2): Readonly<{
  ascCh: number;
  progress: Record<string, number>;
  items: Array<[string, number]>;
}> {
  if (!Number.isInteger(draft.ascCh) || draft.ascCh < 0 || draft.ascCh > 3
    || !draft.ascProg || typeof draft.ascProg !== 'object' || Array.isArray(draft.ascProg)
    || Object.getPrototypeOf(draft.ascProg) !== Object.prototype) {
    throw new TypeError('legacy Charter state is invalid');
  }
  const keys = Reflect.ownKeys(draft.ascProg);
  if (keys.length > LEGACY_CHARTER_PROGRESS_ROWS_MAX) {
    throw new TypeError('legacy Charter state is invalid');
  }
  const progress: Record<string, number> = {};
  for (const key of keys) {
    if (typeof key !== 'string' || key.length < 1 || key.length >= 24) {
      throw new TypeError('legacy Charter state is invalid');
    }
    const descriptor = Object.getOwnPropertyDescriptor(draft.ascProg, key);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
      || !Number.isSafeInteger(descriptor.value) || descriptor.value < 0
      || descriptor.value > LEGACY_CHARTER_PROGRESS_MAX) {
      throw new TypeError('legacy Charter state is invalid');
    }
    progress[key] = descriptor.value;
  }
  return Object.freeze({ ascCh: draft.ascCh, progress, items: checkedItems(draft.items) });
}

function sortedRecord(value: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
  ));
}

function progressDelta(
  before: Readonly<Record<string, number>>,
  after: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const delta: Record<string, number> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const change = (after[key] ?? 0) - (before[key] ?? 0);
    if (change !== 0) delta[key] = change;
  }
  return sortedRecord(delta);
}

function counter(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
}

function sampleFact(
  sample: Exclude<Arc0FieldSampleDerivation, { readonly kind: 'refused' }>,
  state: SaveStateV2,
): Arc0LandingSampleFact {
  if (sample.kind === 'unchanged') {
    return Object.freeze({ kind: 'suppressed', reason: sample.reason });
  }
  const after = {
    essenceAfter: state.essence,
    essenceEarnedAfter: counter(state.stats.essenceEarned),
    landingsAfter: counter(state.stats.landings),
  };
  const cargo = new Map(state.cargo);
  return Object.freeze({
    kind: 'reward',
    materials: Object.freeze(sample.reward.materials.map(({ id, quantity }) => Object.freeze({
      id,
      quantity,
      quantityAfter: cargo.get(id) ?? -1,
    }))),
    stardust: sample.reward.stardust,
    ...after,
  });
}

function createWitness(factsValue: Arc0LandingWitnessFacts): Arc0LandingWitness {
  deepFreeze(factsValue);
  const encoded = JSON.stringify(factsValue);
  if (encoded.length < 1 || encoded.length > WITNESS_MAX_CHARS
    || /[\u0000-\u001f\u007f]/u.test(encoded)) {
    throw new RangeError('Arc 0 landing witness exceeds its receipt bound');
  }
  const witness = Object.freeze({ facts: factsValue, encoded });
  WITNESSES.add(witness);
  return witness;
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function mismatch(detail: Arc0LandingPostcommitMismatch): Arc0LandingPostcommitVerification {
  return Object.freeze({ kind: 'mismatch', detail });
}

function sameNoRngPlan(plan: F4DeterministicProductPlan): boolean {
  return plan.currentAuthority.sessionRng.seed === plan.nextSessionRng.seed
    && plan.nextSessionRng.ordinal === plan.currentAuthority.sessionRng.ordinal + 1
    && sameJson(plan.currentAuthority.sessionRng.draws, plan.nextSessionRng.draws);
}

export function verifyArc0LandingPostcommit(input: Readonly<{
  transaction: F4RuntimeActionCommitOutcome;
  address: CanonicalCF1WorldAddress;
  witness: Arc0LandingWitness;
}>): Arc0LandingPostcommitVerification {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return mismatch('input-invalid');
    if (input.transaction.kind !== 'committed') return mismatch('transaction-not-committed');
    if (!WITNESSES.has(input.witness)) return mismatch('witness-unregistered');
    if (!isCanonicalCF1Address(input.address) || !('planet' in input.address)
      || input.witness.facts.worldKey !== input.address.key) return mismatch('world-mismatch');
    const { transaction, witness } = input;
    const facts = witness.facts;
    if (transaction.plan.operation !== operationForArc0Landing(input.address)
      || transaction.plan.receiptOrdinal !== facts.receiptOrdinal
      || transaction.receipt.ordinal !== facts.receiptOrdinal
      || transaction.receipt.kind !== ARC0_LANDING_RECEIPT_KIND
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
    if (!sameJson(transaction.state.savedView, facts.savedView)) {
      return mismatch('saved-view-mismatch');
    }
    const worldIdentity = readWorldIdentity(transaction.saved.extensions);
    if (worldIdentity.kind !== 'loaded') return mismatch('world-identity-not-loaded');
    if (successorSeal('world-identity', worldIdentity.state)
      !== facts.worldIdentitySuccessorSeal) return mismatch('world-identity-mismatch');
    const landed = worldIdentityRecord(worldIdentity.state, input.address)?.landed === true;
    if (landed !== facts.identityLandedAfter) return mismatch('world-identity-mismatch');
    if (facts.legacyMirrorContainsSeedAfter !== null
      && transaction.state.landed.includes(input.address.planet.seed)
        !== facts.legacyMirrorContainsSeedAfter) return mismatch('legacy-mirror-mismatch');
    if (facts.sample.kind === 'reward') {
      const essenceEarned = counter(transaction.state.stats.essenceEarned);
      const landings = counter(transaction.state.stats.landings);
      if (transaction.state.essence !== facts.sample.essenceAfter
        || essenceEarned !== facts.sample.essenceEarnedAfter
        || landings !== facts.sample.landingsAfter) return mismatch('sample-state-mismatch');
      const cargo = new Map(transaction.state.cargo);
      if (facts.sample.materials.some(({ id, quantityAfter }) => cargo.get(id) !== quantityAfter)) {
        return mismatch('sample-state-mismatch');
      }
    }
    if (facts.charter.ascChAfter !== null
      && (transaction.state.ascCh !== facts.charter.ascChAfter
        || facts.charter.progressSeal === null
        || successorSeal('charter-progress', sortedRecord(transaction.state.ascProg))
          !== facts.charter.progressSeal)) {
      return mismatch('charter-state-mismatch');
    }
    const canonicalEarth = isCanonicalEarthWorldAddress(input.address);
    if (canonicalEarth !== (facts.achievement !== null)) {
      return mismatch('achievement-state-mismatch');
    }
    if (facts.achievement !== null) {
      const achievement = facts.achievement;
      const projection = projectArc9ProgressionStateV1(transaction.state);
      const row = projection.kind === 'projected'
        ? projection.projection.achievements.rows.find(({ id }) => id === achievement.id)
        : undefined;
      if (achievement.id !== 'home' || achievement.owner !== 'landing:earth'
        || achievement.alreadyUnlocked === achievement.added
        || achievement.unlockedCountAfter
          !== achievement.priorUnlockedCount + (achievement.added ? 1 : 0)
        || projection.kind !== 'projected'
        || projection.projection.unlockedIds.length !== achievement.unlockedCountAfter
        || row?.status !== 'unlocked') {
        return mismatch('achievement-state-mismatch');
      }
    }
    return Object.freeze({ kind: 'verified', worldIdentity, facts });
  } catch {
    return mismatch('input-invalid');
  }
}

function refused(
  detail: Arc0LandingRefusalDetail,
  transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null,
  convergence: 'none' | 'read-only-reload' = 'none',
): Arc0LandingActionOutcome {
  return Object.freeze({ kind: 'refused', durability: 'none', convergence, detail, transaction });
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): Arc0LandingRefusalDetail {
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

/** Commit one landing once. Every product decision runs only against F4's
 * detached draft/extensions inside its sole repository attempt. */
export async function commitArc0LandingAction(
  inputValue: Arc0LandingActionInput,
): Promise<Arc0LandingActionOutcome> {
  const input = capturedInput(inputValue);
  if (input === null) return refused('input:invalid-or-unregistered', null);

  const operation = operationForArc0Landing(input.address);
  let selected: SelectedLanding | null = null;
  let deriveRefusal: Arc0LandingRefusalDetail | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await input.commit({
      state: input.state,
      operation,
      receiptKind: ARC0_LANDING_RECEIPT_KIND,
      codecNow: input.codecNow,
      derive: ({ draft, extensions, receiptOrdinal, canonicalizeState }) => {
        const identityRead = readWorldIdentity(extensions);
        if (identityRead.kind !== 'loaded') {
          deriveRefusal = identityRead.kind === 'future-version'
            ? 'world-identity:future-version' : `world-identity:${identityRead.kind}`;
          throw new Error(deriveRefusal);
        }
        const beforeState = identityRead.state;
        const authority = checkedLandingAuthority(beforeState, input.address);
        const landingKnownBefore = authority !== 'first';
        const canonicalEarth = isCanonicalEarthWorldAddress(input.address);
        const permanentLanding = !input.training || canonicalEarth;
        let identityState = beforeState;
        let claimedLegacyIdentity = false;
        let worldIdentityWrites: readonly V5ExtensionWrite[] = Object.freeze([]);
        if (permanentLanding) {
          const landing = recordCanonicalWorldLanding(beforeState, input.address, extensions);
          if (landing.capacityProtected) {
            deriveRefusal = 'world-identity:capacity';
            throw new Error(deriveRefusal);
          }
          if (landing.firstLanding !== (authority === 'first')) {
            deriveRefusal = 'world-identity:projection-mismatch';
            throw new Error(deriveRefusal);
          }
          identityState = landing.state;
          claimedLegacyIdentity = landing.claimedLegacy;
          try {
            worldIdentityWrites = encodeWorldIdentityExtensionWrites(identityState);
          } catch {
            deriveRefusal = 'world-identity:capacity';
            throw new Error(deriveRefusal);
          }
        }

        let landed: number[] | null = null;
        let ascChBefore: number | null = null;
        let ascChAfter: number | null = null;
        let stage: number | null = null;
        let banked = false;
        let progressBefore: Readonly<Record<string, number>> = Object.freeze({});
        let progress: Record<string, number> | null = null;
        if (permanentLanding) {
          try { landed = checkedLegacyLanded(draft.landed); }
          catch {
            deriveRefusal = 'legacy-landed:invalid';
            throw new Error(deriveRefusal);
          }
          if (!landed.includes(input.address.planet.seed)) {
            landed.push(input.address.planet.seed);
            landed = landed.slice(-LEGACY_LANDED_OUTPUT_MAX);
          }
          let charter: ReturnType<typeof checkedCharter>;
          try { charter = checkedCharter(draft); }
          catch {
            deriveRefusal = 'charter:invalid';
            throw new Error(deriveRefusal);
          }
          ascChBefore = charter.ascCh;
          progressBefore = { ...charter.progress };
          progress = { ...charter.progress };
          stage = ascStageOf(charter.items, charter.ascCh);
          banked = authority === 'first'
            && bankLandfall(charter.ascCh, progress, input.address);
          const reconciliation = reconcileV2Chapters(charter.ascCh, progress, stage);
          if (reconciliation === null) {
            deriveRefusal = 'charter:invalid';
            throw new Error(deriveRefusal);
          }
          ascChAfter = reconciliation.nextChapter;
        }

        const sample = deriveArc0FieldSamples({
          source: { cargo: draft.cargo, essence: draft.essence, stats: draft.stats },
          address: input.address,
          opportunity: input.opportunity,
          landing: authority,
          training: input.training,
        });
        if (sample.kind === 'refused') {
          deriveRefusal = `field-sample:${sample.detail}`;
          throw new Error(deriveRefusal);
        }

        draft.savedView = clonePlainData(
          input.savedView,
          new Set<object>(),
          { nodes: 0 },
          0,
        ) as Record<string, unknown>;
        if (permanentLanding) {
          draft.landed = landed!;
          draft.ascCh = ascChAfter!;
          draft.ascProg = progress!;
        }
        if (sample.kind === 'ready') {
          draft.cargo = sample.projection.cargo.map(([id, quantity]) => [id, quantity]);
          draft.essence = sample.projection.essence;
          draft.stats = { ...sample.projection.stats };
        }

        const starterCharters = !input.training && permanentLanding
          ? stageStarterCharterEventV1({
            draft,
            extensions,
            event: { kind: 'landfall', address: input.address },
            receiptOrdinal,
          })
          : Object.freeze({
            kind: 'current' as const,
            facts: Object.freeze({
              changed: false,
              progressIds: Object.freeze([]),
              completions: Object.freeze([]),
              extensionWrites: Object.freeze([]),
              priorUnlockedIds: Object.freeze([]),
              nextUnlockedIds: Object.freeze([]),
              addedAchievementIds: Object.freeze([]),
              priorBestRankIndex: 0,
              nextBestRankIndex: 0,
            }),
          });
        if (starterCharters.kind === 'refused') {
          deriveRefusal = `starter-charter:${starterCharters.reason}`;
          throw new Error(deriveRefusal);
        }

        let achievement: Arc0LandingAchievementFact | null = null;
        if (canonicalEarth) {
          const join = prepareArc9EventAchievementJoinV1(draft, 'home');
          if (join.kind !== 'prepared') {
            deriveRefusal = `achievement:${join.reason}`;
            throw new Error(deriveRefusal);
          }
          draft.unlocked = [...join.nextUnlockedIds];
          achievement = Object.freeze({
            id: 'home',
            owner: 'landing:earth',
            alreadyUnlocked: !join.added,
            added: join.added,
            priorUnlockedCount: join.priorUnlockedCount,
            unlockedCountAfter: join.nextUnlockedIds.length,
          });
        }

        const facts: Arc0LandingWitnessFacts = {
          schema: ARC0_LANDING_WITNESS_SCHEMA,
          worldKey: input.address.key,
          planetSeed: input.address.planet.seed,
          planetOrdinal: input.address.planet.ordinal,
          landing: authority,
          permanentLanding,
          training: input.training,
          landingKnownBefore,
          identityLandedAfter: worldIdentityRecord(identityState, input.address)?.landed === true,
          claimedLegacyIdentity,
          legacyMirrorContainsSeedAfter: permanentLanding
            ? draft.landed.includes(input.address.planet.seed) : null,
          savedView: input.savedView,
          sample: sampleFact(sample, draft),
          charter: Object.freeze({
            banked,
            ascChBefore,
            ascChAfter,
            stage,
            progressSeal: permanentLanding
              ? successorSeal('charter-progress', sortedRecord(draft.ascProg)) : null,
            delta: permanentLanding
              ? progressDelta(progressBefore, draft.ascProg) : Object.freeze({}),
          }),
          starterCharters: Object.freeze({
            changed: starterCharters.facts.changed,
            progressIds: Object.freeze([...starterCharters.facts.progressIds]),
            completions: Object.freeze([...starterCharters.facts.completions]),
            priorUnlockedIds: Object.freeze([...starterCharters.facts.priorUnlockedIds]),
            nextUnlockedIds: Object.freeze([...starterCharters.facts.nextUnlockedIds]),
            addedAchievementIds: Object.freeze([...starterCharters.facts.addedAchievementIds]),
            priorBestRankIndex: starterCharters.facts.priorBestRankIndex,
            nextBestRankIndex: starterCharters.facts.nextBestRankIndex,
          }),
          achievement,
          stateSuccessorSeal: successorSeal('state', canonicalizeState(draft)),
          worldIdentitySuccessorSeal: successorSeal('world-identity', identityState),
          receiptOrdinal,
        };
        const witness = createWitness(facts);
        const extensionWrites: readonly V5ExtensionWrite[] = Object.freeze([
          ...worldIdentityWrites,
          ...starterCharters.facts.extensionWrites,
        ]);
        selected = Object.freeze({ witness, worldIdentityWrites, extensionWrites });
        return Object.freeze({
          state: draft,
          extensionWrites,
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
  const committedSelection = selected as SelectedLanding | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-landing-evidence-missing',
      transaction,
    });
  }
  const verification = verifyArc0LandingPostcommit({
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
