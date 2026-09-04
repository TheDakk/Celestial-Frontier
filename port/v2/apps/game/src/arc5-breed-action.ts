/* Arc 5 app-owned companion Breed + Recovery transaction.

   One F4 pre-draw owner first resolves exact parent eligibility, builds both
   ownership successors, proves both complete saves fit, and only then
   materializes the one `care.breed` value. The selected exact-five ownership
   replacement and any XP-first overflow replacement join the child XP,
   active-play snapshot, SessionRNG advance, receipt and save in one F3 CAS.
   Nothing is published before postcommit fixed-point proof. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  sha256Hex,
  type CreatureInstanceId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  ARC5_BREED_RECEIPT_KIND_V1,
  arc5BreedSpeciesPairXpKeyV1,
  earnedStardustBonusV1,
  planArc5BreedScenariosV1,
  preflightArc5BreedV1,
  settleArc5BreedScenariosV1,
  type Arc5BreedPreflightV1,
  type Arc5BreedRefusalReasonV1,
  type Arc5BreedScenarioPlanV1,
  type Arc5BreedScenarioV1,
  type Arc5BreedSettlementV1,
} from '@cf/domain-acquisition/breed-internal';
import { DOMAINS } from '@cf/domain-sessionrng';
import {
  committedArc5OwnershipState,
  applyV5ExtensionWrites,
  isF4MultiOutcomePreDrawSettlementAuthorizerForCodec,
  prepareLegacyXpFirstClaim,
  prepareArc5OwnershipV2Successor,
  prepareF4AuthorityUpdate,
  readF4Authority,
  readLegacyXpFirstsAuthority,
  type Arc5OwnershipMigrationEvidenceV2,
  type Arc5OwnershipV2SuccessorProtectionReason,
  type F4MultiOutcomePreDrawDeriveInput,
  type F4MultiOutcomePreDrawInput,
  type F4MultiOutcomePreDrawSaveCodec,
  type F4MultiOutcomePreDrawSettlementAuthorizer,
  type PreparedArc5OwnershipMigrationSuccessorV2,
  type PreparedV5SaveWrite,
  type LegacyXpFirstsProtectionReason,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import { ascStageOf, bankBredSuccess, reconcileV2Chapters } from '@cf/scene';
import type {
  F4RuntimeAuthority,
  F4RuntimePreDrawMultiOutcomeCommitOutcome,
} from './f4-runtime-authority.js';
import {
  prepareArc9EventAchievementJoinV1,
  type Arc9EventAchievementJoinPreparationV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
} from './arc9-progression-projection.js';

export const ARC5_BREED_DOMAINS_V1 = Object.freeze([DOMAINS.breedOutcome] as const);

export interface Arc5BreedActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitOutcomesPreDraw'>;
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
  readonly codecNow: number;
}

export type Arc5BreedPreDrawRefusalReasonV1 =
  | `preflight:${Arc5BreedRefusalReasonV1}`
  | 'preflight:earned-stardust-invalid'
  | 'capacity:ownership-capacity-exceeded'
  | 'capacity:successor-invalid'
  | `ownership-carrier:${Arc5OwnershipV2SuccessorProtectionReason}`
  | 'capacity:f4-authority-unrepresentable'
  | `capacity:achievement:${Arc9ProgressionProjectionProtectionReasonV1}`
  | `capacity:xp-firsts:${LegacyXpFirstsProtectionReason}`
  | 'capacity:complete-save-unrepresentable';

export type Arc5BreedTransactionOutcomeV1 =
  F4RuntimePreDrawMultiOutcomeCommitOutcome<Arc5BreedPreDrawRefusalReasonV1>;

export type Arc5BreedActionOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<Arc5BreedTransactionOutcomeV1, { readonly kind: 'committed' }>;
    settlement: Arc5BreedSettlementV1;
    charterBredBanked: boolean;
    bredLegendAchievementAdded: boolean;
    childXpAwarded: 0 | 2 | 7;
    speciesPairXpKey: string;
    speciesPairFirstXpAwarded: boolean;
    xpFirstsTotalCount: number;
    ownershipV2: OwnershipStateV2;
    ownershipV2Evidence: Arc5OwnershipMigrationEvidenceV2;
    ownershipWrites: PreparedArc5OwnershipMigrationSuccessorV2['writes'];
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-breed-evidence-missing' | 'committed-breed-fixed-point-mismatch';
    transaction: Extract<Arc5BreedTransactionOutcomeV1, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: string;
    transaction: Exclude<Arc5BreedTransactionOutcomeV1, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedArc5BreedActionInputV1 {
  readonly commit: F4RuntimeAuthority['commitOutcomesPreDraw'];
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
  readonly codecNow: number;
}

interface PreparedBreedScenarioV1 {
  readonly scenario: Arc5BreedScenarioV1;
  readonly ownership: PreparedArc5OwnershipMigrationSuccessorV2;
  readonly extensionWrites: readonly V5ExtensionWrite[];
  readonly complete: PreparedV5SaveWrite;
  readonly charterBredBanked: boolean;
  readonly bredLegendAchievement: Arc9EventAchievementJoinPreparationV1 | null;
  readonly xpFirstsTotalCount: number;
}

interface PreparedBreedXpCandidateV1 {
  readonly state: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly writes: readonly V5ExtensionWrite[];
  readonly speciesPairFirst: boolean;
  readonly totalCount: number;
}

export interface Arc5BreedCapacityCertificateV1 {
  readonly schema: 'cf-v2-arc5-breed-capacity/v1';
  readonly parentDigest: string;
  readonly receiptOrdinal: number;
  readonly activePlayMs: number;
  readonly odds: number;
  readonly speciesPairXpKey: string;
  readonly speciesPairFirst: boolean;
  readonly failureDigest: string;
  readonly successDigest: string;
  readonly failureSaveDigest: string;
  readonly successSaveDigest: string;
}

interface BreedCapacityPayloadV1 {
  readonly preflight: Arc5BreedPreflightV1;
  readonly plan: Arc5BreedScenarioPlanV1;
  readonly codec: F4MultiOutcomePreDrawSaveCodec;
  readonly sourceDraftFingerprint: string;
  readonly sourceExtensionsFingerprint: string;
  readonly currentAuthorityFingerprint: string;
  readonly nextSessionRngFingerprint: string;
  readonly failure: PreparedBreedScenarioV1;
  readonly success: PreparedBreedScenarioV1;
}

const CAPACITY_CERTIFICATES = new WeakMap<object, BreedCapacityPayloadV1>();
const INPUT_FIELDS = Object.freeze([
  'runtime', 'ownershipV2', 'state', 'parentCreatureIds', 'codecNow',
] as const);
const BREED_STATE_CLONE_LIMIT = 1_500_000;

interface BreedCloneBudget { count: number; }

function cloneBreedPlainData(
  value: unknown,
  ancestors: Set<object>,
  budget: BreedCloneBudget,
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('breed state must contain only plain data');
  if (depth > 256 || budget.count >= BREED_STATE_CLONE_LIMIT) {
    throw new RangeError('breed state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('breed state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('breed arrays must use the native prototype');
      const keys = Reflect.ownKeys(value);
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('breed arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('breed arrays cannot contain accessors or holes');
        }
        clone.push(cloneBreedPlainData(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('breed state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('breed state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('breed state cannot contain accessors or hidden fields');
      }
      Object.defineProperty(clone, key, {
        value: cloneBreedPlainData(descriptor.value, ancestors, budget, depth + 1),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}

function capturedCreaturePair(value: unknown): readonly [CreatureInstanceId, CreatureInstanceId] | null {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length !== 2 || Reflect.ownKeys(value).length !== 3) return null;
  const left = Object.getOwnPropertyDescriptor(value, '0');
  const right = Object.getOwnPropertyDescriptor(value, '1');
  if (!left || !right || !('value' in left) || !('value' in right)
    || left.enumerable !== true || right.enumerable !== true
    || typeof left.value !== 'string' || typeof right.value !== 'string'
    || !/^creature-v1:[0-9a-f]{64}$/u.test(left.value)
    || !/^creature-v1:[0-9a-f]{64}$/u.test(right.value)) return null;
  return Object.freeze([
    left.value as CreatureInstanceId,
    right.value as CreatureInstanceId,
  ] as const);
}

function capturedInput(input: Arc5BreedActionInputV1): CapturedArc5BreedActionInputV1 | null {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(input);
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    const expected = [...INPUT_FIELDS].sort();
    if (keys.length !== expected.length
      || names.some((name, index) => name !== expected[index])) return null;
    const values: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of INPUT_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      values[field] = descriptor.value;
    }
    const runtime = values.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitOutcomesPreDraw');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    const parentCreatureIds = capturedCreaturePair(values.parentCreatureIds);
    if (parentCreatureIds === null || !isOwnershipStateV2(values.ownershipV2)
      || values.ownershipV2.mode !== 'current') return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitOutcomesPreDraw'],
      ownershipV2: values.ownershipV2,
      state: cloneBreedPlainData(
        values.state,
        new Set<object>(),
        { count: 0 },
        0,
      ) as SaveStateV2,
      parentCreatureIds,
      codecNow: values.codecNow as number,
    });
  } catch {
    return null;
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function fingerprint(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) throw new TypeError('breed capacity value is not JSON data');
  return json;
}

function stagedBreedCharter(
  base: SaveStateV2,
  scenario: Arc5BreedScenarioV1,
): Readonly<{ state: SaveStateV2; charterBredBanked: boolean }> | null {
  if (scenario.result !== 'success') {
    return Object.freeze({ state: base, charterBredBanked: false });
  }
  const progress = { ...base.ascProg };
  const charterBredBanked = bankBredSuccess(base.ascCh, progress, true);
  const stage = ascStageOf(
    base.items.map(([id, count]) => [id, count]),
    base.ascCh,
  );
  const reconciliation = reconcileV2Chapters(base.ascCh, progress, stage);
  if (reconciliation === null) return null;
  return Object.freeze({
    state: {
      ...base,
      ascCh: reconciliation.nextChapter,
      ascProg: progress,
    },
    charterBredBanked,
  });
}

function prepareScenario(
  parent: OwnershipStateV2,
  scenario: Arc5BreedScenarioV1,
  preDraw: F4MultiOutcomePreDrawInput,
  xpCandidate: PreparedBreedXpCandidateV1,
): PreparedBreedScenarioV1 | Arc5BreedPreDrawRefusalReasonV1 {
  const xpAuthority = readLegacyXpFirstsAuthority(
    xpCandidate.state,
    xpCandidate.extensions,
  );
  const pairPaid = xpAuthority.kind === 'loaded' && (
    xpAuthority.window.includes(scenario.speciesPairXpKey)
    || xpAuthority.archived.includes(scenario.speciesPairXpKey)
    || xpAuthority.window.includes(scenario.preflight.legacySpeciesPairXpKey)
    || xpAuthority.archived.includes(scenario.preflight.legacySpeciesPairXpKey)
  );
  if (scenario.speciesPairFirst !== xpCandidate.speciesPairFirst
    || xpAuthority.kind !== 'loaded'
    || xpAuthority.totalCount !== xpCandidate.totalCount
    || (scenario.result === 'success' && !pairPaid)) {
    return 'capacity:successor-invalid';
  }
  const ownership = prepareArc5OwnershipV2Successor({
    baseExtensions: xpCandidate.extensions,
    parent,
    successor: scenario.successor,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (ownership.kind !== 'prepared') return `ownership-carrier:${ownership.reason}`;
  const extensionWrites = Object.freeze([
    ...xpCandidate.writes,
    ...ownership.writes,
  ]);
  try {
    const applied = applyV5ExtensionWrites(preDraw.extensions, extensionWrites);
    if (!sameJson(applied.extensions, ownership.extensions)) {
      return 'capacity:complete-save-unrepresentable';
    }
  } catch {
    return 'capacity:complete-save-unrepresentable';
  }
  let f4: ReturnType<typeof prepareF4AuthorityUpdate>;
  try {
    f4 = prepareF4AuthorityUpdate(
      ownership.extensions,
      Object.freeze({ activePlayMs: preDraw.activePlayMs }),
      preDraw.nextSessionRng,
    );
  } catch {
    return 'capacity:f4-authority-unrepresentable';
  }
  const charter = stagedBreedCharter(xpCandidate.state, scenario);
  if (charter === null) return 'capacity:successor-invalid';
  let completeState = charter.state;
  let bredLegendAchievement: Arc9EventAchievementJoinPreparationV1 | null = null;
  if (scenario.result === 'success'
    && scenario.preflight.parentTiers[0] >= 5
    && scenario.preflight.parentTiers[1] >= 5) {
    const achievement = prepareArc9EventAchievementJoinV1(charter.state, 'bredlegend');
    if (achievement.kind !== 'prepared') {
      return `capacity:achievement:${achievement.reason}`;
    }
    bredLegendAchievement = achievement;
    if (achievement.added) {
      completeState = {
        ...charter.state,
        unlocked: [...achievement.nextUnlockedIds],
      };
    }
  }
  let complete: PreparedV5SaveWrite;
  try {
    complete = preDraw.codec.prepare({ state: completeState, extensions: f4.extensions });
  } catch {
    return 'capacity:complete-save-unrepresentable';
  }
  if (!sameJson(complete.extensions, f4.extensions)
    || !sameJson(complete.canonicalState, completeState)) {
    return 'capacity:complete-save-unrepresentable';
  }
  return Object.freeze({
    scenario,
    ownership,
    extensionWrites,
    complete,
    charterBredBanked: charter.charterBredBanked,
    bredLegendAchievement,
    xpFirstsTotalCount: xpCandidate.totalCount,
  });
}

function certifyCapacity(
  parent: OwnershipStateV2,
  preflight: Arc5BreedPreflightV1,
  preDraw: F4MultiOutcomePreDrawInput,
): Readonly<{
  kind: 'certified';
  certificate: Arc5BreedCapacityCertificateV1;
}> | Readonly<{
  kind: 'refused';
  reason: Arc5BreedPreDrawRefusalReasonV1;
}> {
  if (!sameJson(preDraw.domains, ARC5_BREED_DOMAINS_V1)
    || preDraw.receiptOrdinal < 0
    || preDraw.activePlayMs !== preflight.activePlayMs
    || preDraw.codec.receiptKind !== ARC5_BREED_RECEIPT_KIND_V1) {
    return Object.freeze({ kind: 'refused', reason: 'capacity:successor-invalid' });
  }
  const speciesPairXpKey = arc5BreedSpeciesPairXpKeyV1(
    preflight.parentSpeciesIds[0],
    preflight.parentSpeciesIds[1],
  );
  const firsts = readLegacyXpFirstsAuthority(preDraw.draft, preDraw.extensions);
  if (firsts.kind !== 'loaded') {
    return Object.freeze({
      kind: 'refused',
      reason: `capacity:xp-firsts:${firsts.reason}`,
    });
  }
  const pairAlreadyPaid = firsts.window.includes(speciesPairXpKey)
    || firsts.archived.includes(speciesPairXpKey)
    || firsts.window.includes(preflight.legacySpeciesPairXpKey)
    || firsts.archived.includes(preflight.legacySpeciesPairXpKey);
  const claim = pairAlreadyPaid ? null : prepareLegacyXpFirstClaim({
    state: preDraw.draft,
    extensions: preDraw.extensions,
    key: speciesPairXpKey,
  });
  if (claim?.kind === 'protected') {
    return Object.freeze({
      kind: 'refused',
      reason: `capacity:xp-firsts:${claim.reason}`,
    });
  }
  const speciesPairFirst = claim !== null && claim.kind === 'prepared';
  const failureXp: PreparedBreedXpCandidateV1 = Object.freeze({
    state: preDraw.draft,
    extensions: preDraw.extensions,
    writes: Object.freeze([]),
    speciesPairFirst: false,
    totalCount: firsts.totalCount,
  });
  const successXp: PreparedBreedXpCandidateV1 = claim !== null && claim.kind === 'prepared'
    ? Object.freeze({
      state: claim.state,
      extensions: claim.extensions,
      writes: claim.writes,
      speciesPairFirst: true,
      totalCount: claim.totalCount,
    })
    : Object.freeze({
      state: preDraw.draft,
      extensions: preDraw.extensions,
      writes: Object.freeze([]),
      speciesPairFirst: false,
      totalCount: firsts.totalCount,
    });
  const planned = planArc5BreedScenariosV1(
    preflight,
    preDraw.receiptOrdinal,
    speciesPairFirst,
  );
  if (planned.kind !== 'planned') {
    return Object.freeze({ kind: 'refused', reason: `capacity:${planned.reason}` });
  }
  if (preflight.parentTiers[0] >= 5 && preflight.parentTiers[1] >= 5) {
    const achievement = prepareArc9EventAchievementJoinV1(preDraw.draft, 'bredlegend');
    if (achievement.kind !== 'prepared') {
      return Object.freeze({
        kind: 'refused',
        reason: `capacity:achievement:${achievement.reason}`,
      });
    }
  }
  const failure = prepareScenario(parent, planned.plan.failure, preDraw, failureXp);
  if (typeof failure === 'string') return Object.freeze({ kind: 'refused', reason: failure });
  const success = prepareScenario(parent, planned.plan.success, preDraw, successXp);
  if (typeof success === 'string') return Object.freeze({ kind: 'refused', reason: success });
  const certificate: Arc5BreedCapacityCertificateV1 = Object.freeze({
    schema: 'cf-v2-arc5-breed-capacity/v1',
    parentDigest: preflight.parentDigest,
    receiptOrdinal: preDraw.receiptOrdinal,
    activePlayMs: preDraw.activePlayMs,
    odds: preflight.odds,
    speciesPairXpKey,
    speciesPairFirst,
    failureDigest: ownershipStateDigestV2(failure.scenario.successor),
    successDigest: ownershipStateDigestV2(success.scenario.successor),
    failureSaveDigest: sha256Hex(fingerprint(failure.complete.canonicalState)),
    successSaveDigest: sha256Hex(fingerprint(success.complete.canonicalState)),
  });
  CAPACITY_CERTIFICATES.set(certificate, Object.freeze({
    preflight,
    plan: planned.plan,
    codec: preDraw.codec,
    sourceDraftFingerprint: fingerprint(preDraw.draft),
    sourceExtensionsFingerprint: fingerprint(preDraw.extensions),
    currentAuthorityFingerprint: fingerprint(preDraw.currentAuthority),
    nextSessionRngFingerprint: fingerprint(preDraw.nextSessionRng),
    failure,
    success,
  }));
  return Object.freeze({ kind: 'certified', certificate });
}

function settleCertified(
  draw: F4MultiOutcomePreDrawDeriveInput<Arc5BreedCapacityCertificateV1>,
  authorizer: F4MultiOutcomePreDrawSettlementAuthorizer,
): Readonly<{
  settlement: Arc5BreedSettlementV1;
  prepared: PreparedBreedScenarioV1;
  authorization: ReturnType<F4MultiOutcomePreDrawSettlementAuthorizer['authorize']>;
}> {
  const payload = draw.proof && typeof draw.proof === 'object'
    ? CAPACITY_CERTIFICATES.get(draw.proof) : undefined;
  if (payload === undefined
    || draw.codec !== payload.codec
    || draw.receiptOrdinal !== payload.plan.receiptOrdinal
    || draw.activePlayMs !== payload.preflight.activePlayMs
    || draw.draws !== draw.plan.draws
    || draw.draws.length !== 1
    || draw.draws[0]?.domain !== DOMAINS.breedOutcome
    || fingerprint(draw.draft) !== payload.sourceDraftFingerprint
    || fingerprint(draw.extensions) !== payload.sourceExtensionsFingerprint
    || fingerprint(draw.currentAuthority) !== payload.currentAuthorityFingerprint
    || fingerprint(draw.nextSessionRng) !== payload.nextSessionRngFingerprint
    || draw.proof.failureSaveDigest
      !== sha256Hex(fingerprint(payload.failure.complete.canonicalState))
    || draw.proof.successSaveDigest
      !== sha256Hex(fingerprint(payload.success.complete.canonicalState))
    || draw.proof.speciesPairXpKey !== payload.plan.success.speciesPairXpKey
    || draw.proof.speciesPairFirst !== payload.plan.success.speciesPairFirst
    || !isF4MultiOutcomePreDrawSettlementAuthorizerForCodec(authorizer, draw.codec)) {
    throw new TypeError('Arc 5 breed capacity certificate no longer matches the F4 draw');
  }
  const settlement = settleArc5BreedScenariosV1(payload.plan, draw.draws[0].value);
  const prepared = settlement.scenario.result === 'success' ? payload.success : payload.failure;
  if (prepared.scenario !== settlement.scenario) {
    throw new TypeError('Arc 5 breed selected scenario was not capacity-certified');
  }
  const derivation = Object.freeze({
    state: prepared.complete.canonicalState,
    extensionWrites: prepared.extensionWrites,
    witness: settlement.scenario.witness,
  });
  const authorization = authorizer.authorize(derivation, prepared.complete);
  return Object.freeze({ settlement, prepared, authorization });
}

function transactionDetail(
  outcome: Exclude<Arc5BreedTransactionOutcomeV1, { readonly kind: 'committed' }>,
): string {
  if (outcome.kind === 'pre-draw-refused') return outcome.reason;
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') {
    return `transaction:${outcome.message}`;
  }
  if (outcome.kind === 'protected') return `transaction:protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `transaction:lost:${outcome.reason}`;
  return `transaction:${outcome.kind}`;
}

function requiresReadOnlyConvergence(
  outcome: Exclude<Arc5BreedTransactionOutcomeV1, { readonly kind: 'committed' }>,
): boolean {
  if (outcome.kind === 'pre-draw-refused') {
    return outcome.reason.startsWith('ownership-carrier:')
      || outcome.reason.startsWith('capacity:xp-firsts:')
      || outcome.reason === 'preflight:ownership-revision-exhausted';
  }
  return outcome.kind === 'stale'
    || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt'
    || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable'
    || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

/** Publish only the Charter, event-achievement, and XP-first compatibility
 * fields owned by a verified Breed transaction. The live outer save retains
 * every unrelated UI-owned object and collection identity while matching the
 * durable legacy projection. */
export function publishArc5BreedSaveFieldsV1(
  target: SaveStateV2,
  committed: SaveStateV2,
): void {
  target.ascCh = committed.ascCh;
  target.ascProg = { ...committed.ascProg };
  target.unlocked = committed.unlocked.slice();
  target.xpFirsts = committed.xpFirsts.slice();
  if (Object.prototype.hasOwnProperty.call(committed, 'xpFirstsBinding')) {
    target.xpFirstsBinding = committed.xpFirstsBinding === null
      || committed.xpFirstsBinding === undefined
      ? null
      : Object.freeze({ ...committed.xpFirstsBinding });
  } else {
    delete target.xpFirstsBinding;
  }
}

/** Commit one companion-breeding attempt. Product/capacity refusal consumes
 * no draw, ordinal, receipt, revision, or Recovery time. Once the owner exposes
 * one draw, the transaction attempts exactly one CAS and never rerolls. */
export async function commitArc5BreedActionV1(
  input: Arc5BreedActionInputV1,
): Promise<Arc5BreedActionOutcomeV1> {
  const captured = capturedInput(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: 'none',
      detail: 'input:invalid-or-unregistered',
      transaction: null,
    });
  }
  let selected: Readonly<{
    settlement: Arc5BreedSettlementV1;
    prepared: PreparedBreedScenarioV1;
  }> | null = null;
  let transaction: Arc5BreedTransactionOutcomeV1;
  try {
    transaction = await captured.commit<
      Arc5BreedCapacityCertificateV1,
      Arc5BreedPreDrawRefusalReasonV1
    >({
      state: captured.state,
      domains: ARC5_BREED_DOMAINS_V1,
      receiptKind: ARC5_BREED_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      preDraw: (preDraw, owner) => {
        let earnedStardustBonus: number;
        try {
          earnedStardustBonus = earnedStardustBonusV1(
            preDraw.draft.stats.essenceEarned,
          );
        } catch {
          return Object.freeze({
            kind: 'refused' as const,
            reason: 'preflight:earned-stardust-invalid' as const,
          });
        }
        const preflight = preflightArc5BreedV1(captured.ownershipV2, {
          parentCreatureIds: captured.parentCreatureIds,
          activePlayMs: preDraw.activePlayMs,
          earnedStardustBonus,
        });
        if (preflight.kind !== 'ready') {
          return Object.freeze({
            kind: 'refused' as const,
            reason: `preflight:${preflight.reason}` as const,
          });
        }
        const certified = certifyCapacity(
          captured.ownershipV2,
          preflight.preflight,
          preDraw,
        );
        if (certified.kind !== 'certified') {
          return Object.freeze({ kind: 'refused' as const, reason: certified.reason });
        }
        return owner.ready(certified.certificate, (draw, settlementOwner) => {
          const settled = settleCertified(draw, settlementOwner);
          selected = Object.freeze({
            settlement: settled.settlement,
            prepared: settled.prepared,
          });
          return settled.authorization;
        });
      },
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: `transaction:${error instanceof Error ? error.message : String(error)}`,
      transaction: null,
    });
  }
  if (transaction.kind !== 'committed') {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: requiresReadOnlyConvergence(transaction)
        ? 'read-only-reload' : 'none',
      detail: transactionDetail(transaction),
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    settlement: Arc5BreedSettlementV1;
    prepared: PreparedBreedScenarioV1;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-breed-evidence-missing',
      transaction,
    });
  }
  const settlement = committedSelection.settlement;
  const scenario = settlement.scenario;
  const expectedAchievement = committedSelection.prepared.bredLegendAchievement;
  const committedAchievement = expectedAchievement === null
    ? null
    : prepareArc9EventAchievementJoinV1(transaction.state, 'bredlegend');
  const committed = committedArc5OwnershipState(
    committedSelection.prepared.ownership,
    transaction.saved.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const f4 = readF4Authority(transaction.saved.extensions);
  const committedFirsts = readLegacyXpFirstsAuthority(
    transaction.state,
    transaction.saved.extensions,
  );
  const draw = transaction.plan.draws[0];
  if (committed === null
    || transaction.plan.draws.length !== 1
    || draw?.domain !== DOMAINS.breedOutcome
    || draw.value !== settlement.outcomeDraw
    || transaction.plan.receiptOrdinal !== scenario.receiptEvidence.ordinal
    || transaction.receipt.ordinal !== scenario.receiptEvidence.ordinal
    || transaction.receipt.kind !== ARC5_BREED_RECEIPT_KIND_V1
    || transaction.receipt.witness !== scenario.witness
    || scenario.receiptEvidence.witnessDigest !== sha256Hex(scenario.witness)
    || transaction.authority.activePlayMs !== scenario.preflight.activePlayMs
    || !sameJson(transaction.authority.sessionRng, transaction.plan.nextSessionRng)
    || f4.kind !== 'loaded'
    || !sameJson(f4.authority, transaction.authority)
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state, committedSelection.prepared.complete.canonicalState)
    || committedFirsts.kind !== 'loaded'
    || (committedFirsts.kind === 'loaded'
      && committedFirsts.totalCount !== committedSelection.prepared.xpFirstsTotalCount)
    || scenario.speciesPairXpKey !== arc5BreedSpeciesPairXpKeyV1(
      scenario.preflight.parentSpeciesIds[0],
      scenario.preflight.parentSpeciesIds[1],
    )
    || (scenario.result === 'success'
      && (scenario.child === null
        || scenario.child.xp !== scenario.childXpAwarded
        || (scenario.speciesPairFirst ? scenario.childXpAwarded !== 7 : scenario.childXpAwarded !== 2)
        || committedFirsts.kind !== 'loaded'
        || (!committedFirsts.window.includes(scenario.speciesPairXpKey)
          && !committedFirsts.archived.includes(scenario.speciesPairXpKey)
          && !committedFirsts.window.includes(scenario.preflight.legacySpeciesPairXpKey)
          && !committedFirsts.archived.includes(scenario.preflight.legacySpeciesPairXpKey))))
    || (scenario.result === 'failure'
      && (scenario.childXpAwarded !== 0 || scenario.speciesPairFirst))
    || (committedSelection.prepared.charterBredBanked && scenario.result !== 'success')
    || (expectedAchievement !== null
      && (committedAchievement?.kind !== 'prepared'
        || committedAchievement.added !== false
        || !sameJson(
          committedAchievement.nextUnlockedIds,
          expectedAchievement.nextUnlockedIds,
        )))
    || ownershipStateDigestV2(committed.state)
      !== ownershipStateDigestV2(scenario.successor)) {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-breed-fixed-point-mismatch',
      transaction,
    });
  }
  return Object.freeze({
    kind: 'committed',
    durability: 'committed',
    convergence: 'none',
    transaction,
    settlement,
    charterBredBanked: committedSelection.prepared.charterBredBanked,
    bredLegendAchievementAdded: expectedAchievement?.added ?? false,
    childXpAwarded: scenario.childXpAwarded,
    speciesPairXpKey: scenario.speciesPairXpKey,
    speciesPairFirstXpAwarded: scenario.speciesPairFirst,
    xpFirstsTotalCount: committedSelection.prepared.xpFirstsTotalCount,
    ownershipV2: committed.state,
    ownershipV2Evidence: committed.evidence,
    ownershipWrites: committedSelection.prepared.ownership.writes,
  });
}
