/* Arc 6 captured-Guardian companion overlay.

   Guardian acquisition history is immutable and deliberately separate from
   Arc 4/5 ownership provenance. This registered overlay owns only combat-
   mutable XP, injury, and permanent-loss state for those exact carrier rows.
   An absent overlay means every captured Guardian/Titan is still live in its
   acquisition-state form; no row may create a creature without that source. */
import {
  COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
  isCombatSettlementPlanV1,
  type CombatSettlementPlanV1,
} from '@cf/domain-combatcore';
import {
  MAX_OWNERSHIP_REVISION,
  canonicalGenomeIdentityV1,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type DiscoveryRecordId,
} from './model.js';
import {
  createCreatureInstanceV2,
  createCreatureTombstoneV2,
  createF4ReceiptEvidenceV2,
  type CreatureTombstoneV2,
  type F4ReceiptEvidenceV2,
} from './model-v2.js';
import {
  guardianAcquisitionStateDigestV1,
  isGuardianAcquisitionStateV1,
  type GuardianAcquisitionEntryV1,
  type GuardianAcquisitionStateV1,
} from './guardian-acquisition.js';
import {
  canonicalJson,
  canonicalizeData,
  sha256Hex,
  type CanonicalJson,
} from './canonical.js';

export const GUARDIAN_COMPANION_STATE_SCHEMA_V1 =
  'cf-v2-guardian-companion-state/v1' as const;
export const GUARDIAN_COMPANION_STATE_VERSION_V1 = 1 as const;

export interface GuardianCompanionLiveRowV1 {
  readonly kind: 'live';
  readonly sourceRecordId: DiscoveryRecordId;
  readonly creature: CreatureInstanceV1;
  readonly lastReceipt: F4ReceiptEvidenceV2;
}

export interface GuardianCompanionTombstoneRowV1 {
  readonly kind: 'tombstone';
  readonly sourceRecordId: DiscoveryRecordId;
  readonly tombstone: CreatureTombstoneV2;
}

export type GuardianCompanionRowV1 =
  | GuardianCompanionLiveRowV1
  | GuardianCompanionTombstoneRowV1;

export interface GuardianCompanionStateV1 {
  readonly schema: typeof GUARDIAN_COMPANION_STATE_SCHEMA_V1;
  readonly version: typeof GUARDIAN_COMPANION_STATE_VERSION_V1;
  readonly revision: number;
  readonly rows: readonly GuardianCompanionRowV1[];
}

export interface GuardianCompanionStateMirrorV1 {
  readonly schema: typeof GUARDIAN_COMPANION_STATE_SCHEMA_V1;
  readonly version: typeof GUARDIAN_COMPANION_STATE_VERSION_V1;
  readonly revision: number;
  readonly rows: readonly GuardianCompanionRowV1[];
}

export type GuardianCompanionProjectionV1 =
  | Readonly<{
    readonly kind: 'projected';
    readonly sourceRevision: number;
    readonly sourceDigest: string;
    readonly overlayRevision: number;
    readonly overlayDigest: string;
    readonly digest: string;
    readonly creatures: readonly CreatureInstanceV1[];
    readonly tombstones: readonly CreatureTombstoneV2[];
  }>
  | Readonly<{
    readonly kind: 'protected';
    readonly reason:
      | 'source-unregistered'
      | 'overlay-unregistered'
      | 'source-row-missing'
      | 'source-row-mismatch'
      | 'source-row-duplicated';
  }>;

export interface GuardianCompanionCombatSettlementV1 {
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly sourceDigest: string;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly creatureBefore: CreatureInstanceV1;
  readonly creatureAfter: CreatureInstanceV1 | null;
  readonly creatureTombstone: CreatureTombstoneV2 | null;
  readonly successor: GuardianCompanionStateV1;
  readonly successorDigest: string;
}

export type GuardianCompanionCombatPreparationV1 =
  | Readonly<{ readonly kind: 'not-applicable'; readonly reason: 'player-or-Arc5-champion' }>
  | Readonly<{
    readonly kind: 'prepared';
    readonly settlement: GuardianCompanionCombatSettlementV1;
  }>
  | Readonly<{
    readonly kind: 'refused';
    readonly reason:
      | 'plan-unregistered'
      | 'source-unregistered'
      | 'overlay-unregistered'
      | 'overlay-protected'
      | 'overlay-revision-exhausted'
      | 'champion-not-live'
      | 'champion-source-mismatch'
      | 'champion-lineage-mismatch'
      | 'champion-xp-unrepresentable'
      | 'settlement-shape-mismatch';
  }>;

interface StateRegistration {
  readonly mirror: GuardianCompanionStateMirrorV1;
  readonly encoded: string;
  readonly digest: string;
}

const STATES = new WeakMap<object, StateRegistration>();
const ROWS = new WeakSet<object>();
const MAX_ROWS = 1_500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length
    || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function checkedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0
    || (value as number) > MAX_OWNERSHIP_REVISION) {
    throw new RangeError('Guardian companion revision is invalid');
  }
  return value as number;
}

function checkedSourceRecordId(value: unknown): DiscoveryRecordId {
  if (typeof value !== 'string' || !/^discovery-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('Guardian companion source record id is invalid');
  }
  return value as DiscoveryRecordId;
}

function rowCreatureId(row: GuardianCompanionRowV1): CreatureInstanceId {
  return row.kind === 'live' ? row.creature.creatureId : row.tombstone.creatureId;
}

function checkedReceipt(value: unknown): F4ReceiptEvidenceV2 {
  const receipt = createF4ReceiptEvidenceV2(value as F4ReceiptEvidenceV2);
  if (receipt.actionKind !== COMBAT_SETTLEMENT_RECEIPT_KIND_V1) {
    throw new TypeError('Guardian companion receipt kind is invalid');
  }
  return receipt;
}

function liveRow(input: Readonly<{
  sourceRecordId: DiscoveryRecordId;
  creature: CreatureInstanceV1;
  lastReceipt: F4ReceiptEvidenceV2;
}>): GuardianCompanionLiveRowV1 {
  const creature = createCreatureInstanceV2(input.creature);
  const sourceRecordId = checkedSourceRecordId(input.sourceRecordId);
  const lastReceipt = checkedReceipt(input.lastReceipt);
  if (creature.origin !== 'guardian'
    || creature.acquisitionRecordId !== sourceRecordId) {
    throw new TypeError('Guardian companion live row is not source-bound');
  }
  const row = Object.freeze({
    kind: 'live' as const, sourceRecordId, creature, lastReceipt,
  });
  ROWS.add(row);
  return row;
}

function tombstoneRow(input: Readonly<{
  sourceRecordId: DiscoveryRecordId;
  tombstone: CreatureTombstoneV2;
}>): GuardianCompanionTombstoneRowV1 {
  const sourceRecordId = checkedSourceRecordId(input.sourceRecordId);
  const disposition = checkedReceipt(input.tombstone.disposition);
  const tombstone = createCreatureTombstoneV2(input.tombstone.snapshot, disposition);
  if (tombstone.snapshot.origin !== 'guardian'
    || tombstone.snapshot.acquisitionRecordId !== sourceRecordId) {
    throw new TypeError('Guardian companion tombstone is not source-bound');
  }
  const row = Object.freeze({ kind: 'tombstone' as const, sourceRecordId, tombstone });
  ROWS.add(row);
  return row;
}

function registerState(input: Readonly<{
  revision: number;
  rows: readonly GuardianCompanionRowV1[];
}>): GuardianCompanionStateV1 {
  const revision = checkedRevision(input.revision);
  if (!Array.isArray(input.rows) || input.rows.length > MAX_ROWS
    || input.rows.some((row) => !row || typeof row !== 'object' || !ROWS.has(row))) {
    throw new TypeError('Guardian companion rows are invalid');
  }
  if (revision < input.rows.length) {
    throw new TypeError('Guardian companion revision cannot precede its current rows');
  }
  const rows = Object.freeze([...input.rows].sort((left, right) => (
    rowCreatureId(left).localeCompare(rowCreatureId(right))
  )));
  const creatureIds = new Set<string>();
  const sourceIds = new Set<string>();
  const receiptOrdinals = new Set<number>();
  let priorCreatureId = '';
  for (const row of rows) {
    const creatureId = rowCreatureId(row);
    const receipt = row.kind === 'live' ? row.lastReceipt : row.tombstone.disposition;
    if (creatureId <= priorCreatureId || creatureIds.has(creatureId)
      || sourceIds.has(row.sourceRecordId) || receiptOrdinals.has(receipt.ordinal)) {
      throw new TypeError('Guardian companion rows repeat or reorder authority');
    }
    priorCreatureId = creatureId;
    creatureIds.add(creatureId);
    sourceIds.add(row.sourceRecordId);
    receiptOrdinals.add(receipt.ordinal);
  }
  const state = Object.freeze({
    schema: GUARDIAN_COMPANION_STATE_SCHEMA_V1,
    version: GUARDIAN_COMPANION_STATE_VERSION_V1,
    revision,
    rows,
  });
  const mirror = Object.freeze({ ...state, rows }) as GuardianCompanionStateMirrorV1;
  const encoded = canonicalJson(mirror);
  STATES.set(state, Object.freeze({ mirror, encoded, digest: sha256Hex(encoded) }));
  return state;
}

function sameImmutableSource(
  source: GuardianAcquisitionEntryV1,
  candidate: CreatureInstanceV1,
): boolean {
  const creature = source.creature;
  return candidate.creatureId === creature.creatureId
    && candidate.speciesId === creature.speciesId
    && candidate.genomeIdentity === creature.genomeIdentity
    && canonicalJson(candidate.genome) === canonicalJson(creature.genome)
    && candidate.origin === 'guardian'
    && candidate.acquisitionRecordId === source.acquisition.recordId
    && canonicalJson(candidate.lineage) === canonicalJson(creature.lineage)
    && candidate.nickname === creature.nickname
    && candidate.fed === creature.fed
    && candidate.brood === creature.brood
    && candidate.assignment === creature.assignment
    && candidate.bond === creature.bond;
}

function protectedProjection(
  reason: Extract<GuardianCompanionProjectionV1, { kind: 'protected' }>['reason'],
): GuardianCompanionProjectionV1 {
  return Object.freeze({ kind: 'protected', reason });
}

export function createEmptyGuardianCompanionStateV1(): GuardianCompanionStateV1 {
  return registerState({ revision: 0, rows: [] });
}

export function isGuardianCompanionStateV1(value: unknown): value is GuardianCompanionStateV1 {
  return typeof value === 'object' && value !== null && STATES.has(value);
}

export function guardianCompanionStateMirrorV1(
  state: GuardianCompanionStateV1,
): GuardianCompanionStateMirrorV1 {
  const registration = state && typeof state === 'object' ? STATES.get(state) : undefined;
  if (!registration) throw new TypeError('Guardian companion state is unregistered');
  return registration.mirror;
}

export function encodeGuardianCompanionStateV1(state: GuardianCompanionStateV1): string {
  const registration = state && typeof state === 'object' ? STATES.get(state) : undefined;
  if (!registration) throw new TypeError('Guardian companion state is unregistered');
  return registration.encoded;
}

export function guardianCompanionStateDigestV1(state: GuardianCompanionStateV1): string {
  const registration = state && typeof state === 'object' ? STATES.get(state) : undefined;
  if (!registration) throw new TypeError('Guardian companion state is unregistered');
  return registration.digest;
}

function decodeRow(value: unknown): GuardianCompanionRowV1 {
  if (!isRecord(value)) throw new TypeError('Guardian companion row must be an object');
  if (value.kind === 'live') {
    exactKeys(value, ['kind', 'sourceRecordId', 'creature', 'lastReceipt'], 'Guardian companion live row');
    if (!isRecord(value.creature) || !isRecord(value.lastReceipt)) {
      throw new TypeError('Guardian companion live row is malformed');
    }
    return liveRow({
      sourceRecordId: checkedSourceRecordId(value.sourceRecordId),
      creature: value.creature as unknown as CreatureInstanceV1,
      lastReceipt: value.lastReceipt as unknown as F4ReceiptEvidenceV2,
    });
  }
  if (value.kind === 'tombstone') {
    exactKeys(value, ['kind', 'sourceRecordId', 'tombstone'], 'Guardian companion tombstone row');
    if (!isRecord(value.tombstone)
      || !isRecord(value.tombstone.snapshot)
      || !isRecord(value.tombstone.disposition)) {
      throw new TypeError('Guardian companion tombstone row is malformed');
    }
    exactKeys(
      value.tombstone,
      ['kind', 'creatureId', 'snapshot', 'disposition'],
      'Guardian companion tombstone',
    );
    if (value.tombstone.kind !== 'creature') {
      throw new TypeError('Guardian companion tombstone kind is invalid');
    }
    const disposition = checkedReceipt(value.tombstone.disposition);
    const tombstone = createCreatureTombstoneV2(
      value.tombstone.snapshot as unknown as CreatureInstanceV1,
      disposition,
    );
    if (tombstone.creatureId !== value.tombstone.creatureId) {
      throw new TypeError('Guardian companion tombstone identity is invalid');
    }
    return tombstoneRow({
      sourceRecordId: checkedSourceRecordId(value.sourceRecordId),
      tombstone,
    });
  }
  throw new TypeError('Guardian companion row kind is invalid');
}

export function decodeGuardianCompanionStateV1(encoded: string): GuardianCompanionStateV1 {
  if (typeof encoded !== 'string' || encoded.length < 1 || encoded.length > 262_144) {
    throw new RangeError('Guardian companion carrier bytes are invalid');
  }
  const value = canonicalizeData(JSON.parse(encoded)) as CanonicalJson;
  if (!isRecord(value)) throw new TypeError('Guardian companion carrier must be an object');
  exactKeys(value, ['schema', 'version', 'revision', 'rows'], 'Guardian companion carrier');
  if (value.schema !== GUARDIAN_COMPANION_STATE_SCHEMA_V1
    || value.version !== GUARDIAN_COMPANION_STATE_VERSION_V1
    || !Array.isArray(value.rows)) {
    throw new TypeError('Guardian companion carrier schema is invalid');
  }
  const state = registerState({
    revision: checkedRevision(value.revision),
    rows: value.rows.map(decodeRow),
  });
  if (encodeGuardianCompanionStateV1(state) !== encoded) {
    throw new TypeError('Guardian companion carrier is not canonical');
  }
  return state;
}

/** Project live/tombstoned captured Guardians only after every overlay row is
 * rebound to its immutable acquisition entry. Arbitrary overlay rows never
 * become creatures. */
export function projectGuardianCompanionsV1(input: Readonly<{
  source: GuardianAcquisitionStateV1;
  overlay: GuardianCompanionStateV1;
}>): GuardianCompanionProjectionV1 {
  if (!isGuardianAcquisitionStateV1(input?.source)) {
    return protectedProjection('source-unregistered');
  }
  if (!isGuardianCompanionStateV1(input?.overlay)) {
    return protectedProjection('overlay-unregistered');
  }
  const sourceByCreature = new Map(
    input.source.entries.map((entry) => [entry.creature.creatureId, entry] as const),
  );
  if (sourceByCreature.size !== input.source.entries.length) {
    return protectedProjection('source-row-duplicated');
  }
  const overlayByCreature = new Map(input.overlay.rows.map((row) => [rowCreatureId(row), row] as const));
  const creatures: CreatureInstanceV1[] = [];
  const tombstones: CreatureTombstoneV2[] = [];
  for (const row of input.overlay.rows) {
    const source = sourceByCreature.get(rowCreatureId(row));
    if (source === undefined) return protectedProjection('source-row-missing');
    const candidate = row.kind === 'live' ? row.creature : row.tombstone.snapshot;
    if (row.sourceRecordId !== source.acquisition.recordId
      || !sameImmutableSource(source, candidate)) {
      return protectedProjection('source-row-mismatch');
    }
  }
  for (const entry of input.source.entries) {
    const overlay = overlayByCreature.get(entry.creature.creatureId);
    if (overlay?.kind === 'tombstone') tombstones.push(overlay.tombstone);
    else creatures.push(overlay?.kind === 'live' ? overlay.creature : entry.creature);
  }
  const sourceDigest = guardianAcquisitionStateDigestV1(input.source);
  const overlayDigest = guardianCompanionStateDigestV1(input.overlay);
  return Object.freeze({
    kind: 'projected' as const,
    sourceRevision: input.source.revision,
    sourceDigest,
    overlayRevision: input.overlay.revision,
    overlayDigest,
    digest: sha256Hex(canonicalJson({
      schema: 'cf-v2-guardian-companion-projection/v1', sourceDigest, overlayDigest,
    })),
    creatures: Object.freeze(creatures),
    tombstones: Object.freeze(tombstones),
  });
}

function sameChampionSource(creature: CreatureInstanceV1, plan: CombatSettlementPlanV1): boolean {
  if (plan.champion.kind !== 'owned-fauna') return false;
  try {
    const identity = canonicalGenomeIdentityV1(plan.champion.genome);
    return creature.creatureId === plan.champion.creatureId
      && creature.speciesId === identity.speciesId
      && creature.genomeIdentity === identity.genomeIdentity
      && canonicalJson(creature.genome) === canonicalJson(identity.genome)
      && (creature.xp ?? 0) === Number(plan.champion.genome.xp ?? 0)
      && (creature.hurt ?? 0) === Number(plan.champion.genome.hurt ?? 0);
  } catch {
    return false;
  }
}

function combatXpDelta(plan: CombatSettlementPlanV1): number | null {
  if (plan.champion.kind !== 'owned-fauna') return 0;
  if (plan.xp.status === 'award') return plan.xp.amount;
  if (plan.xp.status === 'loss-target') return plan.xp.totalDelta;
  if (plan.xp.status === 'protected-unsupported') return 0;
  return null;
}

function refused(
  reason: Extract<GuardianCompanionCombatPreparationV1, { kind: 'refused' }>['reason'],
): GuardianCompanionCombatPreparationV1 {
  return Object.freeze({ kind: 'refused', reason });
}

/** Prepare one Guardian champion mutation from the exact registered combat
 * plan. Arc 5 champions return not-applicable and remain owned by their
 * existing settlement bridge. */
export function prepareGuardianCompanionCombatV1(input: Readonly<{
  source: GuardianAcquisitionStateV1;
  parent: GuardianCompanionStateV1;
  plan: CombatSettlementPlanV1;
}>): GuardianCompanionCombatPreparationV1 {
  if (!isCombatSettlementPlanV1(input?.plan)) return refused('plan-unregistered');
  if (!isGuardianAcquisitionStateV1(input?.source)) return refused('source-unregistered');
  if (!isGuardianCompanionStateV1(input?.parent)) return refused('overlay-unregistered');
  const champion = input.plan.champion;
  if (champion.kind === 'player'
    || !input.source.entries.some((entry) => (
      entry.creature.creatureId === champion.creatureId
    ))) {
    return Object.freeze({ kind: 'not-applicable', reason: 'player-or-Arc5-champion' });
  }
  const projection = projectGuardianCompanionsV1({ source: input.source, overlay: input.parent });
  if (projection.kind !== 'projected') return refused('overlay-protected');
  if (input.parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('overlay-revision-exhausted');
  }
  const creature = projection.creatures.find((row) => (
    row.creatureId === champion.creatureId
  ));
  if (creature === undefined) return refused('champion-not-live');
  if (!sameChampionSource(creature, input.plan)) return refused('champion-source-mismatch');
  if (champion.legacyBredLineage) return refused('champion-lineage-mismatch');
  const xpDelta = combatXpDelta(input.plan);
  if (xpDelta === null) return refused('settlement-shape-mismatch');
  const xpAfter = (creature.xp ?? 0) + xpDelta;
  if (!Number.isSafeInteger(xpAfter) || xpAfter < 0 || xpAfter > 486) {
    return refused('champion-xp-unrepresentable');
  }
  let hurtAfter = creature.hurt;
  let remove = false;
  if (input.plan.injury.status === 'set-hurt') {
    if (input.plan.injury.creatureId !== creature.creatureId
      || input.plan.injury.hurtBefore !== (creature.hurt ?? 0)) {
      return refused('settlement-shape-mismatch');
    }
    hurtAfter = input.plan.injury.hurtAfter;
  } else if (input.plan.injury.status === 'remove-creature') {
    if (input.plan.injury.creatureId !== creature.creatureId) {
      return refused('settlement-shape-mismatch');
    }
    remove = true;
  } else if (input.plan.injury.status !== 'none') {
    return refused('settlement-shape-mismatch');
  }
  if ((input.plan.xp.status === 'award' || input.plan.xp.status === 'loss-target'
      || input.plan.xp.status === 'protected-unsupported')
    && input.plan.xp.creatureId !== creature.creatureId) {
    return refused('settlement-shape-mismatch');
  }
  const source = input.source.entries.find((entry) => (
    entry.creature.creatureId === creature.creatureId
  ))!;
  try {
    const receiptEvidence = createF4ReceiptEvidenceV2({
      ordinal: input.plan.receiptOrdinal,
      actionKind: COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
      witnessDigest: sha256Hex(input.plan.witness),
    });
    const creatureAfter = remove ? null : createCreatureInstanceV2({
      ...creature,
      xp: xpAfter,
      hurt: hurtAfter,
    });
    const creatureTombstone = remove
      ? createCreatureTombstoneV2(creature, receiptEvidence)
      : null;
    const replacement = creatureAfter === null
      ? tombstoneRow({ sourceRecordId: source.acquisition.recordId, tombstone: creatureTombstone! })
      : liveRow({
        sourceRecordId: source.acquisition.recordId,
        creature: creatureAfter,
        lastReceipt: receiptEvidence,
      });
    const successor = registerState({
      revision: input.parent.revision + 1,
      rows: [
        ...input.parent.rows.filter((row) => rowCreatureId(row) !== creature.creatureId),
        replacement,
      ],
    });
    const settlement = Object.freeze({
      parentRevision: input.parent.revision,
      parentDigest: guardianCompanionStateDigestV1(input.parent),
      sourceDigest: guardianAcquisitionStateDigestV1(input.source),
      receiptEvidence,
      creatureBefore: creature,
      creatureAfter,
      creatureTombstone,
      successor,
      successorDigest: guardianCompanionStateDigestV1(successor),
    });
    return Object.freeze({ kind: 'prepared', settlement });
  } catch {
    return refused('settlement-shape-mismatch');
  }
}
