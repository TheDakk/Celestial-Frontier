/* Arc 0 durable landing transaction.

   A landing is one deterministic F4 product: the proven surface route,
   canonical world identity, legacy mirror, Charter progress, and field
   samples either cross one receipt-bearing CAS together or remain wholly
   unpublished. This module owns no singleton, clock, RNG draw, retry, DOM, or
   optimistic live-state mutation. */
import { sha256Hex } from '@cf/domain-acquisition';
import {
  DESCENT_OUTCOME_DOMAINS_V1,
  projectDescentApproachV1,
  resolveDescentAttemptV1,
  type DescentAttemptOutcomeV1,
  type DescentApproachPolicyV1,
} from './descent-policy.js';
import {
  descentWaveOffCountV1,
  isCanonicalEarthWorldAddress,
  isWorldOpportunitySnapshot,
  type DescentWaveOffStateV1,
  type FieldSampleLandingAuthority,
  type FieldSampleSuppressionReason,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import {
  PORTABLE_V5_MAX_BYTES,
  applyV5ExtensionWrites,
  arc2LootLegacyMirrorMatches,
  encodeArc2LootCarrier,
  encodeWorldIdentityExtensionWrites,
  loadDescentWaveOffAuthorityV1,
  prepareDescentWaveOffMutationV1,
  prepareF4AuthorityUpdate,
  readArc2EngineeringLoadout,
  readArc2Loot,
  readF4Authority,
  readWorldIdentity,
  recordCanonicalWorldLanding,
  worldIdentityRecord,
  type CanonicalWorldIdentityStateV1,
  type Arc2LootStateV1,
  type F4MultiOutcomePreDrawInput,
  type F4OutcomeDerivation,
  type F4DeterministicProductPlan,
  type PreparedV5SaveWrite,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
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
  projectStaticBiomeWeatherV1,
  type StaticBiomeWeatherV1,
} from './biome-vista-surface.js';
import {
  prepareArc9EventAchievementJoinV1,
  projectArc9ProgressionStateV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
  F4RuntimePreDrawMultiOutcomeCommitOutcome,
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

export type Arc0DescentWeatherV1 = StaticBiomeWeatherV1;

export type Arc0LandingTransactionOutcome =
  | F4RuntimeActionCommitOutcome
  | F4RuntimePreDrawMultiOutcomeCommitOutcome<Arc0LandingRefusalDetail>;
export type Arc0LandingCommittedTransaction = Extract<
  Arc0LandingTransactionOutcome,
  { readonly kind: 'committed' }
>;

export interface Arc0LandingActionInput {
  readonly runtime: Pick<
    F4RuntimeAuthority,
    'commitAction' | 'commitOutcomesPreDraw' | 'extensions'
  >;
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
  readonly savedView: Readonly<Record<string, unknown>> | null;
  /** Null only for a wave-off, which never evaluates or mutates field samples. */
  readonly sample: Arc0LandingSampleFact | null;
  readonly charter: Arc0LandingCharterFact;
  readonly starterCharters: Arc0LandingStarterCharterFact;
  /** Present only for the complete canonical Earth address. */
  readonly achievement: Arc0LandingAchievementFact | null;
  /** Exact policy and selected result bound to this one F4 receipt. */
  readonly descentWeather: Arc0DescentWeatherV1;
  readonly descent: DescentAttemptOutcomeV1;
  /** Full codec-canonical product successor, independent of F4's returned copy. */
  readonly stateSuccessorSeal: string;
  /** Full world-identity successor, including unrelated registered rows. */
  readonly worldIdentitySuccessorSeal: string;
  /** Exact canonical-address progress carrier after this selected result. */
  readonly waveOffStateSuccessorSeal: string;
  /** Lossy v4 compatibility mirror after this selected result. */
  readonly waveOffLegacySuccessorSeal: string;
  /** Exact Arc 2 carrier expected after every successful landing product. */
  readonly arc2LootSuccessorSeal: string | null;
  /** Every save field except the two wave-off-owned fields. Null on landing. */
  readonly waveOffProtectedStateSeal: string | null;
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
  | `engineering:${string}`
  | `descent-wave-off:${string}`
  | 'descent:route-selection-changed'
  | 'descent:outcome-impossible'
  | 'descent:complete-save-unrepresentable'
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
  | 'descent-plan-mismatch'
  | 'descent-state-mismatch'
  | 'wave-off-state-mismatch'
  | 'arc2-loot-state-mismatch'
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
    transaction: Arc0LandingCommittedTransaction;
    witness: Arc0LandingWitness;
    verification: Extract<Arc0LandingPostcommitVerification, { readonly kind: 'verified' }>;
    worldIdentityWrites: readonly V5ExtensionWrite[];
    arc2LootState: Arc2LootStateV1 | null;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-landing-evidence-missing' | `postcommit:${Arc0LandingPostcommitMismatch}`;
    result: 'landed' | 'wave-off' | 'unknown';
    transaction: Arc0LandingCommittedTransaction;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: Arc0LandingRefusalDetail;
    transaction: Exclude<Arc0LandingTransactionOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commitAction: F4RuntimeAuthority['commitAction'];
  readonly commitOutcomesPreDraw: F4RuntimeAuthority['commitOutcomesPreDraw'];
  readonly extensions: V5Extensions;
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
  readonly arc2LootState: Arc2LootStateV1 | null;
}

interface Arc0DescentContext {
  readonly identityState: CanonicalWorldIdentityStateV1;
  readonly landing: FieldSampleLandingAuthority;
  readonly waveOffs: DescentWaveOffStateV1;
  readonly policy: DescentApproachPolicyV1;
  readonly weather: Arc0DescentWeatherV1;
}

interface StagedArc0Landing {
  readonly state: SaveStateV2;
  readonly identityState: CanonicalWorldIdentityStateV1;
  readonly worldIdentityWrites: readonly V5ExtensionWrite[];
  readonly extensionWrites: readonly V5ExtensionWrite[];
  readonly arc2LootState: Arc2LootStateV1 | null;
  readonly facts: Omit<
    Arc0LandingWitnessFacts,
    'stateSuccessorSeal' | 'waveOffProtectedStateSeal'
  >;
}

interface PreparedArc0Landing {
  readonly witness: Arc0LandingWitness;
  readonly derivation: F4OutcomeDerivation;
  readonly prepared: PreparedV5SaveWrite;
  readonly worldIdentityWrites: readonly V5ExtensionWrite[];
  readonly arc2LootState: Arc2LootStateV1 | null;
}

const WITNESSES = new WeakSet<object>();
/* The receipt carries a bounded seal; this registered sidecar retains the
   exact derived Arc 2 successor so postcommit verification compares the
   canonical carrier itself, not merely its legacy mirror or digest. */
const ARC2_LOOT_EXPECTATIONS = new WeakMap<object, Arc2LootStateV1 | null>();

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

function successorSeal(
  kind: 'state' | 'world-identity' | 'charter-progress' | 'wave-offs' | 'wave-off-legacy'
    | 'arc2-loot'
    | 'wave-off-protected-state',
  value: unknown,
): string {
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
    const commitAction = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    const commitOutcomesPreDraw = Object.getOwnPropertyDescriptor(runtime, 'commitOutcomesPreDraw');
    const extensionDescriptor = Object.getOwnPropertyDescriptor(runtime, 'extensions');
    if (!commitAction || !('value' in commitAction) || typeof commitAction.value !== 'function'
      || !commitOutcomesPreDraw || !('value' in commitOutcomesPreDraw)
      || typeof commitOutcomesPreDraw.value !== 'function' || !extensionDescriptor) return null;
    const extensions = 'value' in extensionDescriptor
      ? extensionDescriptor.value
      : typeof extensionDescriptor.get === 'function'
        ? extensionDescriptor.get.call(runtime)
        : null;
    if (!extensions || typeof extensions !== 'object' || Array.isArray(extensions)) return null;
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
      commitAction: commitAction.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      commitOutcomesPreDraw: commitOutcomesPreDraw.value.bind(runtime) as F4RuntimeAuthority['commitOutcomesPreDraw'],
      extensions: clonePlainData(
        extensions,
        new Set<object>(),
        { nodes: 0 },
        0,
      ) as V5Extensions,
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

/** The Landing transaction and biome vista share the existing v2 static-weather
 * selection exactly. This projection is seed deterministic and consumes no
 * SessionRNG draw; non-null weather is the descent storm fact. */
export function projectArc0DescentWeatherV1(
  address: CanonicalCF1WorldAddress,
  opportunity: WorldOpportunitySnapshot,
): Arc0DescentWeatherV1 {
  if (!isCanonicalCF1Address(address) || !('planet' in address)
    || !isWorldOpportunitySnapshot(opportunity)
    || opportunity.key !== address.key || opportunity.address.key !== address.key) {
    throw new TypeError('Arc 0 descent weather requires one registered world snapshot');
  }
  return projectStaticBiomeWeatherV1(
    opportunity.source.planetType,
    opportunity.source.climateBand,
    address.planet.seed,
  );
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

class Arc0LandingRefusalError extends Error {
  readonly detail: Arc0LandingRefusalDetail;

  constructor(detail: Arc0LandingRefusalDetail) {
    super(detail);
    this.name = 'Arc0LandingRefusalError';
    this.detail = detail;
  }
}

function refuseDerivation(detail: Arc0LandingRefusalDetail): never {
  throw new Arc0LandingRefusalError(detail);
}

function refusalDetail(error: unknown): Arc0LandingRefusalDetail {
  return error instanceof Arc0LandingRefusalError
    ? error.detail
    : `transaction:${error instanceof Error ? error.message : String(error)}`;
}

function descentContext(
  input: CapturedInput,
  draft: SaveStateV2,
  extensions: V5Extensions,
  expectedRoute: 'safe' | 'ordinary',
): Arc0DescentContext {
  const identityRead = readWorldIdentity(extensions);
  if (identityRead.kind !== 'loaded') {
    refuseDerivation(identityRead.kind === 'future-version'
      ? 'world-identity:future-version' : `world-identity:${identityRead.kind}`);
  }
  const loadout = readArc2EngineeringLoadout(extensions);
  if (loadout.kind !== 'loaded') {
    refuseDerivation(`engineering:${loadout.kind}`);
  }
  const waveOffs = loadDescentWaveOffAuthorityV1({
    extensions,
    legacyWaveOffs: draft.waveOffs,
  });
  if (waveOffs.kind !== 'loaded') {
    refuseDerivation(`descent-wave-off:${waveOffs.reason}`);
  }
  const landing = checkedLandingAuthority(identityRead.state, input.address);
  const weather = projectArc0DescentWeatherV1(input.address, input.opportunity);
  const policy = projectDescentApproachV1({
    address: input.address,
    opportunity: input.opportunity,
    capabilities: loadout.capabilities,
    waveOffs: waveOffs.state,
    stormActive: weather !== null,
    trainingActive: input.training,
    /* Only a complete canonical landed row is a safe revisit. Seed-only
       compatibility evidence still needs the ordinary exact-world approach. */
    alreadyLanded: landing === 'repeat',
  });
  if ((policy.safeReason === null ? 'ordinary' : 'safe') !== expectedRoute) {
    refuseDerivation('descent:route-selection-changed');
  }
  return Object.freeze({
    identityState: identityRead.state,
    landing,
    waveOffs: waveOffs.state,
    policy,
    weather,
  });
}

function waveOffProtectedStateProjection(state: SaveStateV2): Readonly<Record<string, unknown>> {
  const projection = clonePlainData(
    state,
    new Set<object>(),
    { nodes: 0 },
    0,
  ) as Record<string, unknown>;
  delete projection.hp;
  delete projection.waveOffs;
  return projection;
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

function unchangedStarterCharterFact(): Arc0LandingStarterCharterFact {
  return Object.freeze({
    changed: false,
    progressIds: Object.freeze([]),
    completions: Object.freeze([]),
    priorUnlockedIds: Object.freeze([]),
    nextUnlockedIds: Object.freeze([]),
    addedAchievementIds: Object.freeze([]),
    priorBestRankIndex: 0,
    nextBestRankIndex: 0,
  });
}

function legacyWaveOffRows(value: readonly (readonly [number, number])[]): Array<[number, number]> {
  return value.map(([seed, count]) => [seed, count]);
}

function stageSuccessfulLanding(
  input: CapturedInput,
  draft: SaveStateV2,
  extensions: V5Extensions,
  receiptOrdinal: number,
  context: Arc0DescentContext,
  descent: Extract<DescentAttemptOutcomeV1, { readonly kind: 'landed' }>,
): StagedArc0Landing {
  const beforeState = context.identityState;
  const authority = context.landing;
  const landingKnownBefore = authority !== 'first';
  const canonicalEarth = isCanonicalEarthWorldAddress(input.address);
  const parentLoot = readArc2Loot(extensions);
  if (parentLoot.kind !== 'loaded' || parentLoot.state.kind !== 'inventory') {
    refuseDerivation(`engineering:${parentLoot.kind === 'loaded'
      ? parentLoot.state.kind : parentLoot.kind}`);
  }
  if (!arc2LootLegacyMirrorMatches(parentLoot.state, draft)) {
    refuseDerivation('engineering:legacy-mirror-divergent');
  }
  /* Every Training landing is a route-only sandbox product, including its
     Earth lesson. It cannot claim identity, progress, rewards, achievements,
     or live wave-off progress. */
  const permanentLanding = !input.training;
  let identityState = beforeState;
  let claimedLegacyIdentity = false;
  let worldIdentityWrites: readonly V5ExtensionWrite[] = Object.freeze([]);
  if (permanentLanding) {
    const landing = recordCanonicalWorldLanding(beforeState, input.address, extensions);
    if (landing.capacityProtected) refuseDerivation('world-identity:capacity');
    if (landing.firstLanding !== (authority === 'first')) {
      refuseDerivation('world-identity:projection-mismatch');
    }
    identityState = landing.state;
    claimedLegacyIdentity = landing.claimedLegacy;
    try { worldIdentityWrites = encodeWorldIdentityExtensionWrites(identityState); }
    catch { refuseDerivation('world-identity:capacity'); }
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
    catch { refuseDerivation('legacy-landed:invalid'); }
    if (!landed.includes(input.address.planet.seed)) {
      landed.push(input.address.planet.seed);
      landed = landed.slice(-LEGACY_LANDED_OUTPUT_MAX);
    }
    let charter: ReturnType<typeof checkedCharter>;
    try { charter = checkedCharter(draft); }
    catch { refuseDerivation('charter:invalid'); }
    ascChBefore = charter.ascCh;
    progressBefore = { ...charter.progress };
    progress = { ...charter.progress };
    stage = ascStageOf(charter.items, charter.ascCh);
    banked = authority === 'first' && bankLandfall(charter.ascCh, progress, input.address);
    const reconciliation = reconcileV2Chapters(charter.ascCh, progress, stage);
    if (reconciliation === null) refuseDerivation('charter:invalid');
    ascChAfter = reconciliation.nextChapter;
  }

  const sample = deriveArc0FieldSamples({
    source: { cargo: draft.cargo, essence: draft.essence, stats: draft.stats },
    address: input.address,
    opportunity: input.opportunity,
    landing: authority,
    training: input.training,
  });
  if (sample.kind === 'refused') refuseDerivation(`field-sample:${sample.detail}`);

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

  const starterCharters = permanentLanding
    ? stageStarterCharterEventV1({
      draft,
      extensions,
      event: { kind: 'landfall', address: input.address },
      receiptOrdinal,
    })
    : Object.freeze({
      kind: 'current' as const,
      facts: Object.freeze({
        ...unchangedStarterCharterFact(),
        extensionWrites: Object.freeze([]) as readonly V5ExtensionWrite[],
      }),
    });
  if (starterCharters.kind === 'refused') {
    refuseDerivation(`starter-charter:${starterCharters.reason}`);
  }

  let arc2LootState: Arc2LootStateV1 = parentLoot.state;
  let starterSuccessorExtensions = extensions;
  if (starterCharters.facts.completions.some(({ gearId }) => gearId !== null)) {
    try {
      starterSuccessorExtensions = applyV5ExtensionWrites(
        extensions,
        starterCharters.facts.extensionWrites,
      ).extensions;
    } catch {
      refuseDerivation('starter-charter:starter-gear-extension-unrepresentable');
    }
    const successorLoot = readArc2Loot(starterSuccessorExtensions);
    if (successorLoot.kind !== 'loaded' || successorLoot.state.kind !== 'inventory'
      || !arc2LootLegacyMirrorMatches(successorLoot.state, draft)) {
      refuseDerivation('starter-charter:starter-gear-successor-divergent');
    }
    arc2LootState = successorLoot.state;
  }

  let achievement: Arc0LandingAchievementFact | null = null;
  if (canonicalEarth && permanentLanding) {
    const join = prepareArc9EventAchievementJoinV1(draft, 'home');
    if (join.kind !== 'prepared') refuseDerivation(`achievement:${join.reason}`);
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

  let waveOffState = context.waveOffs;
  let waveOffWrites: readonly V5ExtensionWrite[] = Object.freeze([]);
  if (descent.persistenceOutcome === 'success') {
    const waveOff = prepareDescentWaveOffMutationV1({
      extensions,
      legacyWaveOffs: draft.waveOffs,
      address: input.address,
      outcome: 'success',
    });
    if (waveOff.kind !== 'prepared') {
      refuseDerivation(`descent-wave-off:${waveOff.reason}`);
    }
    if (waveOff.countBefore !== descent.waveOffCountBefore
      || waveOff.countAfter !== descent.waveOffCountAfter) {
      refuseDerivation('descent:outcome-impossible');
    }
    waveOffState = waveOff.state;
    waveOffWrites = waveOff.writes;
    draft.waveOffs = legacyWaveOffRows(waveOff.legacyWaveOffs);
  }

  const starterFact: Arc0LandingStarterCharterFact = Object.freeze({
    changed: starterCharters.facts.changed,
    progressIds: Object.freeze([...starterCharters.facts.progressIds]),
    completions: Object.freeze([...starterCharters.facts.completions]),
    priorUnlockedIds: Object.freeze([...starterCharters.facts.priorUnlockedIds]),
    nextUnlockedIds: Object.freeze([...starterCharters.facts.nextUnlockedIds]),
    addedAchievementIds: Object.freeze([...starterCharters.facts.addedAchievementIds]),
    priorBestRankIndex: starterCharters.facts.priorBestRankIndex,
    nextBestRankIndex: starterCharters.facts.nextBestRankIndex,
  });
  const extensionWrites = Object.freeze([
    ...worldIdentityWrites,
    ...waveOffWrites,
    ...starterCharters.facts.extensionWrites,
  ]);
  return Object.freeze({
    state: draft,
    identityState,
    worldIdentityWrites,
    extensionWrites,
    arc2LootState,
    facts: Object.freeze({
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
      starterCharters: starterFact,
      achievement,
      descentWeather: context.weather,
      descent,
      worldIdentitySuccessorSeal: successorSeal('world-identity', identityState),
      waveOffStateSuccessorSeal: successorSeal('wave-offs', waveOffState),
      waveOffLegacySuccessorSeal: successorSeal('wave-off-legacy', draft.waveOffs),
      arc2LootSuccessorSeal: arc2LootState === null
        ? null : successorSeal('arc2-loot', encodeArc2LootCarrier(arc2LootState)),
      receiptOrdinal,
    }),
  });
}

function stageWaveOff(
  input: CapturedInput,
  draft: SaveStateV2,
  extensions: V5Extensions,
  receiptOrdinal: number,
  context: Arc0DescentContext,
  descent: Extract<DescentAttemptOutcomeV1, { readonly kind: 'wave-off' }>,
): StagedArc0Landing {
  const waveOff = prepareDescentWaveOffMutationV1({
    extensions,
    legacyWaveOffs: draft.waveOffs,
    address: input.address,
    outcome: 'failure',
  });
  if (waveOff.kind !== 'prepared') {
    refuseDerivation(`descent-wave-off:${waveOff.reason}`);
  }
  if (waveOff.countBefore !== descent.waveOffCountBefore
    || waveOff.countAfter !== descent.waveOffCountAfter
    || descent.hpAfter < 1 || descent.hpAfter > descent.hpBefore) {
    refuseDerivation('descent:outcome-impossible');
  }
  draft.hp = descent.hpAfter;
  draft.waveOffs = legacyWaveOffRows(waveOff.legacyWaveOffs);
  const extensionWrites = Object.freeze([...waveOff.writes]);
  return Object.freeze({
    state: draft,
    identityState: context.identityState,
    worldIdentityWrites: Object.freeze([]),
    extensionWrites,
    arc2LootState: null,
    facts: Object.freeze({
      schema: ARC0_LANDING_WITNESS_SCHEMA,
      worldKey: input.address.key,
      planetSeed: input.address.planet.seed,
      planetOrdinal: input.address.planet.ordinal,
      landing: context.landing,
      permanentLanding: false,
      training: false,
      landingKnownBefore: context.landing !== 'first',
      identityLandedAfter: worldIdentityRecord(context.identityState, input.address)?.landed === true,
      claimedLegacyIdentity: false,
      legacyMirrorContainsSeedAfter: draft.landed.includes(input.address.planet.seed),
      savedView: clonePlainData(
        draft.savedView,
        new Set<object>(),
        { nodes: 0 },
        0,
      ) as Readonly<Record<string, unknown>>,
      sample: null,
      charter: Object.freeze({
        banked: false,
        ascChBefore: null,
        ascChAfter: null,
        stage: null,
        progressSeal: null,
        delta: Object.freeze({}),
      }),
      starterCharters: unchangedStarterCharterFact(),
      achievement: null,
      descentWeather: context.weather,
      descent,
      worldIdentitySuccessorSeal: successorSeal('world-identity', context.identityState),
      waveOffStateSuccessorSeal: successorSeal('wave-offs', waveOff.state),
      waveOffLegacySuccessorSeal: successorSeal('wave-off-legacy', draft.waveOffs),
      arc2LootSuccessorSeal: null,
      receiptOrdinal,
    }),
  });
}

function finalizeStagedLanding(
  staged: StagedArc0Landing,
  canonicalState: SaveStateV2,
  waveOffProtectedStateSeal: string | null,
): Readonly<{
  witness: Arc0LandingWitness;
  derivation: F4OutcomeDerivation;
  worldIdentityWrites: readonly V5ExtensionWrite[];
  arc2LootState: Arc2LootStateV1 | null;
}> {
  const witness = createWitness(Object.freeze({
    ...staged.facts,
    stateSuccessorSeal: successorSeal('state', canonicalState),
    waveOffProtectedStateSeal,
  }));
  ARC2_LOOT_EXPECTATIONS.set(witness, staged.arc2LootState);
  return Object.freeze({
    witness,
    derivation: Object.freeze({
      state: canonicalState,
      extensionWrites: staged.extensionWrites,
      witness: witness.encoded,
    }),
    worldIdentityWrites: staged.worldIdentityWrites,
    arc2LootState: staged.arc2LootState,
  });
}

function requireArc2LootFixedPoint(
  staged: StagedArc0Landing,
  canonicalState: SaveStateV2,
  productExtensions: V5Extensions,
): void {
  if (staged.arc2LootState === null) return;
  const loaded = readArc2Loot(productExtensions);
  if (loaded.kind !== 'loaded' || loaded.state.kind !== 'inventory'
    || !sameJson(
      encodeArc2LootCarrier(loaded.state),
      encodeArc2LootCarrier(staged.arc2LootState),
    )
    || !arc2LootLegacyMirrorMatches(loaded.state, canonicalState)) {
    refuseDerivation('engineering:arc2-successor-divergent');
  }
}

function preparedCandidate(
  staged: StagedArc0Landing,
  preDraw: F4MultiOutcomePreDrawInput,
): PreparedArc0Landing {
  let productExtensions: V5Extensions;
  let authorityExtensions: V5Extensions;
  try {
    productExtensions = applyV5ExtensionWrites(
      preDraw.extensions,
      staged.extensionWrites,
    ).extensions;
    authorityExtensions = prepareF4AuthorityUpdate(
      productExtensions,
      { activePlayMs: preDraw.activePlayMs },
      preDraw.nextSessionRng,
    ).extensions;
  } catch (error) {
    refuseDerivation(`transaction:${error instanceof Error ? error.message : String(error)}`);
  }
  let first: PreparedV5SaveWrite;
  let prepared: PreparedV5SaveWrite;
  try {
    first = preDraw.codec.prepare({ state: staged.state, extensions: authorityExtensions });
    prepared = preDraw.codec.prepare({
      state: first.canonicalState,
      extensions: authorityExtensions,
    });
  } catch {
    refuseDerivation('descent:complete-save-unrepresentable');
  }
  if (!sameJson(first.canonicalState, prepared.canonicalState)) {
    refuseDerivation('descent:complete-save-unrepresentable');
  }
  requireArc2LootFixedPoint(staged, prepared.canonicalState, productExtensions);
  let protectedSeal: string | null = null;
  if (staged.facts.descent.kind === 'wave-off') {
    let sourcePrepared: PreparedV5SaveWrite;
    try {
      const sourceAuthority = prepareF4AuthorityUpdate(
        preDraw.extensions,
        { activePlayMs: preDraw.activePlayMs },
        preDraw.nextSessionRng,
      );
      sourcePrepared = preDraw.codec.prepare({
        state: preDraw.draft,
        extensions: sourceAuthority.extensions,
      });
    } catch {
      refuseDerivation('descent:complete-save-unrepresentable');
    }
    const sourceProjection = waveOffProtectedStateProjection(sourcePrepared.canonicalState);
    const candidateProjection = waveOffProtectedStateProjection(prepared.canonicalState);
    if (!sameJson(sourceProjection, candidateProjection)) {
      refuseDerivation('descent:outcome-impossible');
    }
    protectedSeal = successorSeal('wave-off-protected-state', candidateProjection);
  }
  const finalized = finalizeStagedLanding(staged, prepared.canonicalState, protectedSeal);
  return Object.freeze({
    ...finalized,
    prepared,
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
  transaction: Arc0LandingTransactionOutcome;
  address: CanonicalCF1WorldAddress;
  witness: Arc0LandingWitness;
}>): Arc0LandingPostcommitVerification {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return mismatch('input-invalid');
    if (input.transaction.kind !== 'committed') return mismatch('transaction-not-committed');
    if (!WITNESSES.has(input.witness) || !ARC2_LOOT_EXPECTATIONS.has(input.witness)) {
      return mismatch('witness-unregistered');
    }
    if (!isCanonicalCF1Address(input.address) || !('planet' in input.address)
      || input.witness.facts.worldKey !== input.address.key) return mismatch('world-mismatch');
    const { transaction, witness } = input;
    const facts = witness.facts;
    if (transaction.plan.receiptOrdinal !== facts.receiptOrdinal
      || transaction.receipt.ordinal !== facts.receiptOrdinal
      || transaction.receipt.kind !== ARC0_LANDING_RECEIPT_KIND
      || transaction.receipt.witness !== witness.encoded) return mismatch('receipt-mismatch');
    if (facts.descent.drawsConsumed === 0) {
      if (!('operation' in transaction.plan)
        || transaction.plan.operation !== operationForArc0Landing(input.address)
        || !sameNoRngPlan(transaction.plan)) return mismatch('descent-plan-mismatch');
    } else {
      if (!('draws' in transaction.plan)
        || !sameJson(
          transaction.plan.draws.map(({ domain }) => domain),
          DESCENT_OUTCOME_DOMAINS_V1,
        )) return mismatch('descent-plan-mismatch');
      const resolved = resolveDescentAttemptV1(
        facts.descent.policy,
        transaction.plan.draws,
        facts.descent.hpBefore,
      );
      if (!sameJson(resolved, facts.descent)) return mismatch('descent-plan-mismatch');
    }
    if (!sameJson(transaction.authority.sessionRng, transaction.plan.nextSessionRng)) {
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
    if (facts.descent.policy.address.key !== input.address.key
      || facts.descent.policy.key !== input.address.key
      || facts.descent.policy.stormActive !== (facts.descentWeather !== null)) {
      return mismatch('descent-plan-mismatch');
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
    const waveOffAuthority = loadDescentWaveOffAuthorityV1({
      extensions: transaction.saved.extensions,
      legacyWaveOffs: transaction.state.waveOffs,
    });
    if (waveOffAuthority.kind !== 'loaded'
      || successorSeal('wave-offs', waveOffAuthority.state)
        !== facts.waveOffStateSuccessorSeal
      || successorSeal('wave-off-legacy', transaction.state.waveOffs)
        !== facts.waveOffLegacySuccessorSeal
      || descentWaveOffCountV1(waveOffAuthority.state, input.address)
        !== facts.descent.waveOffCountAfter) {
      return mismatch('wave-off-state-mismatch');
    }
    const expectedArc2Loot = ARC2_LOOT_EXPECTATIONS.get(witness) ?? null;
    if ((facts.arc2LootSuccessorSeal === null) !== (expectedArc2Loot === null)) {
      return mismatch('arc2-loot-state-mismatch');
    }
    if (expectedArc2Loot !== null) {
      const loot = readArc2Loot(transaction.saved.extensions);
      if (loot.kind !== 'loaded' || loot.state.kind !== 'inventory'
        || !sameJson(
          encodeArc2LootCarrier(loot.state),
          encodeArc2LootCarrier(expectedArc2Loot),
        )
        || successorSeal('arc2-loot', encodeArc2LootCarrier(loot.state))
          !== facts.arc2LootSuccessorSeal
        || !arc2LootLegacyMirrorMatches(loot.state, transaction.state)) {
        return mismatch('arc2-loot-state-mismatch');
      }
    }
    if (facts.descent.kind === 'wave-off') {
      if (facts.sample !== null || facts.achievement !== null
        || facts.permanentLanding || facts.training
        || facts.descent.hpAfter !== transaction.state.hp
        || facts.descent.hpAfter < 1
        || facts.waveOffProtectedStateSeal === null
        || successorSeal(
          'wave-off-protected-state',
          waveOffProtectedStateProjection(transaction.state),
        ) !== facts.waveOffProtectedStateSeal) {
        return mismatch('descent-state-mismatch');
      }
      return Object.freeze({ kind: 'verified', worldIdentity, facts });
    }
    if (facts.waveOffProtectedStateSeal !== null || facts.sample === null) {
      return mismatch('descent-state-mismatch');
    }
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
    const canonicalEarth = isCanonicalEarthWorldAddress(input.address) && !facts.training;
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
  transaction: Exclude<Arc0LandingTransactionOutcome, { readonly kind: 'committed' }> | null,
  convergence: 'none' | 'read-only-reload' = 'none',
): Arc0LandingActionOutcome {
  return Object.freeze({ kind: 'refused', durability: 'none', convergence, detail, transaction });
}

function transactionDetail(
  outcome: Exclude<Arc0LandingTransactionOutcome, { readonly kind: 'committed' }>,
): Arc0LandingRefusalDetail {
  if (outcome.kind === 'pre-draw-refused') return outcome.reason;
  if (outcome.kind === 'rejected') return `transaction:rejected:${outcome.stage}:${outcome.message}`;
  if (outcome.kind === 'storage-error') return `transaction:${outcome.message}`;
  if (outcome.kind === 'protected') return `transaction:protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `transaction:lost:${outcome.reason}`;
  return `transaction:${outcome.kind}`;
}

function requiresReload(
  outcome: Exclude<Arc0LandingTransactionOutcome, { readonly kind: 'committed' }>,
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
interface Arc0PreDrawProof {
  readonly context: Arc0DescentContext;
  readonly candidates: readonly PreparedArc0Landing[];
}

function routeForCapturedLanding(input: CapturedInput): 'safe' | 'ordinary' {
  if (input.training || isCanonicalEarthWorldAddress(input.address)) return 'safe';
  const identity = readWorldIdentity(input.extensions);
  return identity.kind === 'loaded'
    && worldIdentityRecord(identity.state, input.address)?.landed === true
    ? 'safe' : 'ordinary';
}

function selectedLanding(
  candidate: Pick<
    PreparedArc0Landing,
    'witness' | 'worldIdentityWrites' | 'derivation' | 'arc2LootState'
  >,
): SelectedLanding {
  return Object.freeze({
    witness: candidate.witness,
    worldIdentityWrites: candidate.worldIdentityWrites,
    extensionWrites: candidate.derivation.extensionWrites ?? Object.freeze([]),
    arc2LootState: candidate.arc2LootState,
  });
}

/** Commit one descent exactly once. Safe Training/Earth/revisit products use
 * the deterministic receipt owner and evaluate no random domain. Every
 * ordinary first approach certifies all possible landing/damage successors
 * before the fixed success + damage domains are materialized. */
export async function commitArc0LandingAction(
  inputValue: Arc0LandingActionInput,
): Promise<Arc0LandingActionOutcome> {
  const input = capturedInput(inputValue);
  if (input === null) return refused('input:invalid-or-unregistered', null);

  const operation = operationForArc0Landing(input.address);
  const route = routeForCapturedLanding(input);
  let selected: SelectedLanding | null = null;
  let deriveRefusal: Arc0LandingRefusalDetail | null = null;
  let transaction: Arc0LandingTransactionOutcome;
  try {
    if (route === 'safe') {
      transaction = await input.commitAction({
        state: input.state,
        operation,
        receiptKind: ARC0_LANDING_RECEIPT_KIND,
        codecNow: input.codecNow,
        derive: ({ draft, extensions, receiptOrdinal, canonicalizeState }) => {
          try {
            const context = descentContext(input, draft, extensions, 'safe');
            const descent = resolveDescentAttemptV1(context.policy, Object.freeze([]), draft.hp);
            if (descent.kind !== 'landed') refuseDerivation('descent:outcome-impossible');
            const staged = stageSuccessfulLanding(
              input,
              draft,
              extensions,
              receiptOrdinal,
              context,
              descent,
            );
            const canonicalState = canonicalizeState(staged.state);
            const productExtensions = applyV5ExtensionWrites(
              extensions,
              staged.extensionWrites,
            ).extensions;
            requireArc2LootFixedPoint(staged, canonicalState, productExtensions);
            const finalized = finalizeStagedLanding(staged, canonicalState, null);
            selected = selectedLanding(finalized);
            return finalized.derivation;
          } catch (error) {
            deriveRefusal = refusalDetail(error);
            throw error;
          }
        },
      });
    } else {
      transaction = await input.commitOutcomesPreDraw<Arc0PreDrawProof, Arc0LandingRefusalDetail>({
        state: input.state,
        domains: DESCENT_OUTCOME_DOMAINS_V1,
        receiptKind: ARC0_LANDING_RECEIPT_KIND,
        codecNow: input.codecNow,
        preDraw: (preDraw, owner) => {
          try {
            if (!sameJson(preDraw.domains, DESCENT_OUTCOME_DOMAINS_V1)) {
              refuseDerivation('descent:route-selection-changed');
            }
            const context = descentContext(input, preDraw.draft, preDraw.extensions, 'ordinary');
            const candidates: PreparedArc0Landing[] = [];
            const stageCandidate = (descent: DescentAttemptOutcomeV1): void => {
              const draft = clonePlainData(
                preDraw.draft,
                new Set<object>(),
                { nodes: 0 },
                0,
              ) as SaveStateV2;
              const staged = descent.kind === 'landed'
                ? stageSuccessfulLanding(
                  input, draft, preDraw.extensions, preDraw.receiptOrdinal, context, descent,
                )
                : stageWaveOff(
                  input, draft, preDraw.extensions, preDraw.receiptOrdinal, context, descent,
                );
              candidates.push(preparedCandidate(staged, preDraw));
            };

            stageCandidate(resolveDescentAttemptV1(context.policy, Object.freeze([
              Object.freeze({ domain: DESCENT_OUTCOME_DOMAINS_V1[0], value: 0 }),
              Object.freeze({ domain: DESCENT_OUTCOME_DOMAINS_V1[1], value: 0 }),
            ]), preDraw.draft.hp));
            if (context.policy.successPercent < 100) {
              const width = context.policy.damageMax - context.policy.damageMin + 1;
              for (let rawDamage = context.policy.damageMin;
                rawDamage <= context.policy.damageMax; rawDamage++) {
                stageCandidate(resolveDescentAttemptV1(context.policy, Object.freeze([
                  Object.freeze({
                    domain: DESCENT_OUTCOME_DOMAINS_V1[0],
                    value: context.policy.successPercent / 100,
                  }),
                  Object.freeze({
                    domain: DESCENT_OUTCOME_DOMAINS_V1[1],
                    value: (rawDamage - context.policy.damageMin + 0.25) / width,
                  }),
                ]), preDraw.draft.hp));
              }
            }
            const proof: Arc0PreDrawProof = Object.freeze({
              context,
              candidates: Object.freeze(candidates),
            });
            return owner.ready(proof, (draw, settlementOwner) => {
              if (draw.proof !== proof
                || draw.codec !== preDraw.codec
                || draw.receiptOrdinal !== preDraw.receiptOrdinal
                || !sameJson(draw.currentAuthority, preDraw.currentAuthority)
                || !sameJson(draw.nextSessionRng, preDraw.nextSessionRng)
                || !sameJson(draw.draft, preDraw.draft)
                || !sameJson(draw.extensions, preDraw.extensions)) {
                deriveRefusal = 'descent:route-selection-changed';
                throw new Arc0LandingRefusalError(deriveRefusal);
              }
              const descent = resolveDescentAttemptV1(
                context.policy,
                draw.draws,
                preDraw.draft.hp,
              );
              const candidate = proof.candidates.find((row) => (
                sameJson(row.witness.facts.descent, descent)
              ));
              if (candidate === undefined) {
                deriveRefusal = 'descent:outcome-impossible';
                throw new Arc0LandingRefusalError(deriveRefusal);
              }
              const authorization = settlementOwner.authorize(
                candidate.derivation,
                candidate.prepared,
              );
              selected = selectedLanding(candidate);
              return authorization;
            });
          } catch (error) {
            deriveRefusal = refusalDetail(error);
            return Object.freeze({ kind: 'refused' as const, reason: deriveRefusal });
          }
        },
      });
    }
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
      result: 'unknown',
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
      result: committedSelection.witness.facts.descent.kind,
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
    arc2LootState: committedSelection.arc2LootState,
  });
}
