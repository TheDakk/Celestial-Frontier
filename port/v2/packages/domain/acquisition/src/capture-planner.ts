/* Pure v1.8.9 Tame / Scavenge / Sample continuity planner.

   This closes deterministic selection, finite-yield spend, probability, and
   truthful OwnershipSuccessorV1 construction. It intentionally does not
   expose a writer: seed-only legacy catalogue eligibility is temporary exact
   continuity, while repeat/reacquisition policy and encoded extension-byte
   capacity still require an explicit Arc 4 decision and transaction join. */
import { describeSpecies, type Genome } from '@cf/domain-genome';
import { clamp } from '@cf/domain-rand';
import { ringGrade } from '@cf/domain-strays';
import {
  MAX_OWNERSHIP_REVISION,
  MAX_OWNERSHIP_ROWS,
  createBiosphereProgressV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createOwnershipSuccessorV1,
  createSpecimenLotV1,
  createWorldDiscoveryRecordV1,
  isOwnershipSuccessorV1,
  ownershipContentId,
  ownershipStateDigestV1,
  type AcquisitionVerbV1,
  type BiosphereProgressV1,
  type BiosphereSuccessV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateContentsV1,
  type OwnershipStateV1,
  type SpecimenLotId,
} from './model.js';
import { canonicalJson, sha256Hex } from './canonical.js';
import {
  isAcquisitionSnapshotV1,
  isCaptureDrawBundleV1,
  type AcquisitionCandidateV1,
  type AcquisitionSnapshotV1,
  type CaptureDrawBundleV1,
  type CaptureRingV1,
  type CaptureTierV1,
} from './snapshot.js';

export const TAME_ODDS_V1 = Object.freeze([
  0.60, 0.45, 0.36, 0.27, 0.19,
  0.13, 0.09, 0.06, 0.04, 0.025,
  0.015, 0.010, 0.006, 0.004, 0.0025,
] as const);

/** Machine-readable stop sign for the later transaction integration. The
 * pure v1 planner does not silently decide any of these policies. */
export const CAPTURE_PLANNER_POLICY_BLOCKERS_V1 = Object.freeze({
  legacyEligibility: 'temporary-v1.8.9-not-catalogued-by-seed',
  reacquisition: 'unresolved',
  encodedExtensionByteCapacity: 'unresolved',
  breedingProvenance: 'unsupported-by-ownership-v1',
  guardianProvenance: 'unsupported-by-ownership-v1',
  writerExposed: false,
} as const);

export interface CaptureChanceInputV1 {
  readonly verb: AcquisitionVerbV1;
  readonly tier: CaptureTierV1;
  readonly ring: CaptureRingV1;
  readonly contactCapturePoints: number;
}

export function captureChanceV1(input: CaptureChanceInputV1): number {
  if (input.verb !== 'tame' && input.verb !== 'scavenge' && input.verb !== 'sample') {
    throw new TypeError('capture verb is invalid');
  }
  if (!Number.isInteger(input.tier) || input.tier < 0 || input.tier > 14) {
    throw new RangeError('capture tier must be an integer from 0 through 14');
  }
  if (!Number.isInteger(input.ring) || input.ring < 0 || input.ring > 5) {
    throw new RangeError('capture ring must be an integer from 0 through 5');
  }
  if (!Number.isSafeInteger(input.contactCapturePoints) || input.contactCapturePoints < 0) {
    throw new RangeError('capture contact points must be a whole non-negative number');
  }
  let base: number = TAME_ODDS_V1[input.tier];
  if (input.verb === 'scavenge') base = Math.min(0.95, base * 1.6);
  else if (input.verb === 'sample') base = Math.min(0.90, base * 1.5);
  base *= Math.pow(0.9, input.ring);
  const gear = Math.min(0.25, input.contactCapturePoints * 0.015);
  return clamp(base + gear, 0.02, 0.95);
}

export function captureHitV1(successDraw: number, chance: number): boolean {
  if (!Number.isFinite(successDraw) || successDraw < 0 || successDraw >= 1) {
    throw new RangeError('capture success draw must be in [0, 1)');
  }
  if (!Number.isFinite(chance) || chance < 0 || chance > 1) {
    throw new RangeError('capture chance must be in [0, 1]');
  }
  return successDraw < chance;
}

export type CapturePreflightRefusalReasonV1 =
  | 'snapshot-unregistered'
  | 'revision-exhausted'
  | 'legacy-biosphere-unresolved'
  | 'future-cycle-progress'
  | 'empty'
  | 'depleted'
  | 'model-row-capacity';

export interface CapturePreflightRefusalV1 {
  readonly kind: 'refused';
  readonly reason: CapturePreflightRefusalReasonV1;
}

export interface CapturePreflightReadyV1 {
  readonly kind: 'ready';
  readonly snapshot: AcquisitionSnapshotV1;
  readonly verb: AcquisitionVerbV1;
  readonly pool: readonly AcquisitionCandidateV1[];
  readonly biosphereYield: number;
  readonly used: number;
  readonly remainingBefore: number;
  readonly successful: readonly BiosphereSuccessV1[];
  readonly priorProgress: BiosphereProgressV1 | null;
  readonly requiredHitHeadroom: number;
}

export type CapturePreflightOutcomeV1 = CapturePreflightRefusalV1 | CapturePreflightReadyV1;

const PREFLIGHTS = new WeakSet<object>();
const CAPTURE_PLANS = new WeakSet<object>();

function refusal(reason: CapturePreflightRefusalReasonV1): CapturePreflightRefusalV1 {
  return Object.freeze({ kind: 'refused', reason });
}

function matchingKingdom(candidate: AcquisitionCandidateV1, verb: AcquisitionVerbV1): boolean {
  if (verb === 'tame') return candidate.identity.kingdom === 'fauna';
  if (verb === 'sample') return candidate.identity.kingdom === 'microbe';
  return candidate.identity.kingdom === 'flora' || candidate.identity.kingdom === 'fungi';
}

function captureTierFromSnapshotCandidateV1(
  candidate: AcquisitionCandidateV1,
  snapshot: AcquisitionSnapshotV1,
): CaptureTierV1 {
  const genome = candidate.identity.genome as unknown as Genome;
  const address = snapshot.address;
  const where = Object.freeze({
    type: 'planet',
    gal: Object.freeze({
      seed: address.galaxy.seed,
      x: address.galaxy.x,
      y: address.galaxy.y,
      size: address.galaxy.size,
      sp: address.galaxy.sp,
      tilt: address.galaxy.tilt,
      rot: address.galaxy.rot,
      home: address.galaxy.home,
    }),
    star: Object.freeze({
      seed: address.star.seed,
      x: address.star.x,
      y: address.star.y,
    }),
    pseed: address.planet.seed,
  });
  const graded = ringGrade(
    genome,
    describeSpecies(genome).grade as unknown as Record<string, unknown>,
    where,
  );
  const tier = graded && typeof graded.tier === 'number' ? graded.tier : 0;
  if (!Number.isInteger(tier) || tier < 0 || tier > 14) {
    throw new RangeError('capture rarity tier must be an integer from 0 through 14');
  }
  return tier as CaptureTierV1;
}

function globalOwnershipRows(state: OwnershipStateV1): number {
  let rows = state.catalogSpecies.length + state.discoveries.length + state.creatures.length
    + state.specimenLots.length + state.biosphereProgress.length;
  for (const progress of state.biosphereProgress) rows += progress.successful.length;
  for (const creature of state.creatures) {
    if (creature.bond !== null) {
      rows += creature.bond.memories.length + creature.bond.mementoIds.length;
    }
  }
  return rows;
}

/** Refuse every known state/policy/capacity condition before F4 is asked for
 * either capture draw. `empty` deliberately precedes `depleted`, matching
 * v1.8.9's player-visible and no-spend order. */
export function preflightCaptureV1(
  snapshotValue: unknown,
  verb: AcquisitionVerbV1,
): CapturePreflightOutcomeV1 {
  if (!isAcquisitionSnapshotV1(snapshotValue)) return refusal('snapshot-unregistered');
  if (verb !== 'tame' && verb !== 'scavenge' && verb !== 'sample') {
    throw new TypeError('capture verb is invalid');
  }
  const snapshot = snapshotValue;
  const state = snapshot.ownership;
  if (state.revision === MAX_OWNERSHIP_REVISION) return refusal('revision-exhausted');
  if (state.legacyBioX.some((row) => row.legacyPlanetSeed === snapshot.planetSeed)) {
    return refusal('legacy-biosphere-unresolved');
  }
  const priorProgress = state.biosphereProgress.find((row) => row.worldKey === snapshot.worldKey) ?? null;
  if (priorProgress !== null && priorProgress.cycle > snapshot.cycle) {
    return refusal('future-cycle-progress');
  }
  /* Temporary v1.8.9 continuity: eligibility is the old `s${seed}`
     Compendium key, not an invented reacquisition rule. */
  const cataloguedLegacyIds = new Set(state.catalogSpecies.map((row) => `s${row.genome.seed}`));
  const pool = Object.freeze(snapshot.candidates.filter((candidate) => (
    matchingKingdom(candidate, verb) && !cataloguedLegacyIds.has(candidate.legacyCatalogueId)
  )));
  if (pool.length === 0) return refusal('empty');
  const sameCycle = priorProgress !== null && priorProgress.cycle === snapshot.cycle;
  const used = sameCycle ? priorProgress.used : 0;
  const successful = Object.freeze(sameCycle ? [...priorProgress.successful] : []);
  const remainingBefore = Math.max(0, snapshot.biosphereYield - used);
  if (remainingBefore === 0) return refusal('depleted');
  const requiredHitHeadroom = priorProgress === null ? 5 : 4;
  if (globalOwnershipRows(state) > MAX_OWNERSHIP_ROWS - requiredHitHeadroom) {
    return refusal('model-row-capacity');
  }
  const ready: CapturePreflightReadyV1 = Object.freeze({
    kind: 'ready', snapshot, verb, pool,
    biosphereYield: snapshot.biosphereYield,
    used,
    remainingBefore,
    successful,
    priorProgress,
    requiredHitHeadroom,
  });
  PREFLIGHTS.add(ready);
  return ready;
}

export function isCapturePreflightReadyV1(value: unknown): value is CapturePreflightReadyV1 {
  return typeof value === 'object'
    && value !== null
    && PREFLIGHTS.has(value)
    && (value as CapturePreflightReadyV1).kind === 'ready';
}

export interface CaptureAttemptPlanV1 {
  readonly schema: 'cf-v2-capture-attempt-plan/v1';
  readonly snapshotFingerprint: string;
  readonly verb: AcquisitionVerbV1;
  readonly candidate: AcquisitionCandidateV1;
  readonly tier: CaptureTierV1;
  readonly chance: number;
  readonly candidateDraw: number;
  readonly successDraw: number;
  readonly hit: boolean;
  readonly spent: 1;
  readonly remainingAfter: number;
  readonly receiptOrdinal: number;
  readonly discoveryRecordId: DiscoveryRecordId | null;
  readonly ownedRowId: string | null;
  readonly successor: OwnershipStateV1;
  readonly witness: string;
}

export type CapturePlanRefusalReasonV1 =
  | 'preflight-unregistered'
  | 'draw-bundle-unregistered'
  | 'snapshot-authority-mismatch'
  | 'f4-authority-mismatch';

export type CapturePlanOutcomeV1 =
  | Readonly<{ kind: 'refused'; reason: CapturePlanRefusalReasonV1 }>
  | Readonly<{ kind: 'planned'; plan: CaptureAttemptPlanV1 }>;

function generationOf(candidate: AcquisitionCandidateV1): number {
  const generation = (candidate.identity.genome as unknown as Genome).gen;
  if (!Number.isSafeInteger(generation) || (generation as number) < 0
    || (generation as number) > 1_000_000_000) {
    throw new TypeError('wild capture genome generation is invalid');
  }
  return generation as number;
}

function replaceProgress(
  state: OwnershipStateV1,
  prior: BiosphereProgressV1 | null,
  current: BiosphereProgressV1,
): readonly BiosphereProgressV1[] {
  if (prior === null) return [...state.biosphereProgress, current];
  return state.biosphereProgress.map((row) => row === prior ? current : row);
}

function successorContents(
  state: OwnershipStateV1,
  progress: BiosphereProgressV1,
  priorProgress: BiosphereProgressV1 | null,
  additions: Readonly<{
    catalogue?: OwnershipStateV1['catalogSpecies'][number];
    discovery?: OwnershipStateV1['discoveries'][number];
    creature?: OwnershipStateV1['creatures'][number];
    specimen?: OwnershipStateV1['specimenLots'][number];
  }>,
): OwnershipStateContentsV1 {
  return {
    catalogSpecies: additions.catalogue
      ? [...state.catalogSpecies, additions.catalogue] : state.catalogSpecies,
    discoveries: additions.discovery
      ? [...state.discoveries, additions.discovery] : state.discoveries,
    creatures: additions.creature
      ? [...state.creatures, additions.creature] : state.creatures,
    specimenLots: additions.specimen
      ? [...state.specimenLots, additions.specimen] : state.specimenLots,
    biosphereProgress: replaceProgress(state, priorProgress, progress),
    legacyBioX: state.legacyBioX,
    scoutCreatureId: state.scoutCreatureId,
  };
}

export function planCaptureV1(
  preflightValue: unknown,
  drawsValue: unknown,
): CapturePlanOutcomeV1 {
  if (!isCapturePreflightReadyV1(preflightValue)) {
    return Object.freeze({ kind: 'refused', reason: 'preflight-unregistered' });
  }
  if (!isCaptureDrawBundleV1(drawsValue)) {
    return Object.freeze({ kind: 'refused', reason: 'draw-bundle-unregistered' });
  }
  const preflight = preflightValue;
  const draws = drawsValue as CaptureDrawBundleV1;
  const snapshot = preflight.snapshot;
  if (draws.snapshotFingerprint !== snapshot.fingerprint) {
    return Object.freeze({ kind: 'refused', reason: 'snapshot-authority-mismatch' });
  }
  if (draws.f4AuthorityFingerprint !== snapshot.f4AuthorityFingerprint
    || draws.activePlayMs !== snapshot.activePlayMs) {
    return Object.freeze({ kind: 'refused', reason: 'f4-authority-mismatch' });
  }
  const candidateDraw = draws.draws[0].value;
  const successDraw = draws.draws[1].value;
  const candidateIndex = (candidateDraw * preflight.pool.length) | 0;
  const candidate = preflight.pool[candidateIndex];
  if (!candidate) throw new Error('canonical capture candidate draw left the bounded pool');
  const tier = captureTierFromSnapshotCandidateV1(candidate, snapshot);
  const chance = captureChanceV1({
    verb: preflight.verb,
    tier,
    ring: snapshot.captureRing,
    contactCapturePoints: snapshot.contactCapturePoints,
  });
  const hit = captureHitV1(successDraw, chance);
  const state = snapshot.ownership;
  const parentDigest = ownershipStateDigestV1(state);
  const eventWitness = canonicalJson({
    schema: 'cf-v2-capture-event/v1',
    parentDigest,
    snapshotFingerprint: snapshot.fingerprint,
    f4AuthorityFingerprint: draws.f4AuthorityFingerprint,
    receiptOrdinal: draws.receiptOrdinal,
    worldKey: snapshot.worldKey,
    ecologyEpoch: snapshot.ecologyEpoch,
    fullRosterFingerprint: snapshot.fullRosterFingerprint,
    cycle: snapshot.cycle,
    verb: preflight.verb,
    sourceOrdinal: candidate.sourceOrdinal,
    speciesId: candidate.identity.speciesId,
  });
  let discoveryRecordId: DiscoveryRecordId | null = null;
  let ownedRowId: string | null = null;
  let additions: Parameters<typeof successorContents>[3] = Object.freeze({});
  const successful: BiosphereSuccessV1[] = [...preflight.successful];
  if (hit) {
    discoveryRecordId = ownershipContentId('discovery', eventWitness) as DiscoveryRecordId;
    const discovery = createWorldDiscoveryRecordV1({
      recordId: discoveryRecordId,
      speciesId: candidate.identity.speciesId,
      verb: preflight.verb,
      worldAddress: snapshot.address,
      cycle: snapshot.cycle,
      sourceOrdinal: candidate.sourceOrdinal,
      firstForSpecies: true,
    });
    const catalogue = createCatalogSpeciesV1({
      identity: candidate.identity,
      alias: null,
      firstObservationId: discoveryRecordId,
    });
    successful.push(Object.freeze({
      speciesId: candidate.identity.speciesId,
      source: preflight.verb,
    }));
    if (candidate.identity.kingdom === 'fauna') {
      const creatureId = ownershipContentId(
        'creature',
        `${eventWitness}:creature`,
      ) as CreatureInstanceId;
      ownedRowId = creatureId;
      const creature = createCreatureInstanceV1({
        creatureId,
        speciesId: candidate.identity.speciesId,
        genomeIdentity: candidate.identity.genomeIdentity,
        genome: candidate.identity.genome,
        nickname: null,
        origin: 'wild',
        acquisitionRecordId: discoveryRecordId,
        lineage: Object.freeze({ kind: 'none', generation: generationOf(candidate) }),
        xp: null,
        hurt: null,
        fed: null,
        brood: null,
        assignment: null,
        bond: null,
      });
      additions = Object.freeze({ catalogue, discovery, creature });
    } else {
      const lotId = ownershipContentId(
        'specimen',
        `${eventWitness}:specimen`,
      ) as SpecimenLotId;
      ownedRowId = lotId;
      const specimen = createSpecimenLotV1({
        lotId,
        speciesId: candidate.identity.speciesId,
        kind: candidate.identity.kingdom,
        quantity: 1,
        origin: 'wild',
        acquisitionRecordId: discoveryRecordId,
      });
      additions = Object.freeze({ catalogue, discovery, specimen });
    }
  }
  const progress = createBiosphereProgressV1({
    worldAddress: snapshot.address,
    cycle: snapshot.cycle,
    used: preflight.used + 1,
    successful,
  });
  const successor = createOwnershipSuccessorV1(
    state,
    successorContents(state, progress, preflight.priorProgress, additions),
  );
  if (!isOwnershipSuccessorV1(successor, state)) {
    throw new Error('capture planner failed to register an exact ownership successor');
  }
  const witness = canonicalJson({
    schema: 'cf-v2-capture-plan-witness/v1',
    event: sha256Hex(eventWitness),
    candidateDraw,
    successDraw,
    chance,
    hit,
    spent: 1,
    successorDigest: ownershipStateDigestV1(successor),
  });
  if (witness.length > 4_096) throw new RangeError('capture witness exceeds the F4 receipt bound');
  const plan: CaptureAttemptPlanV1 = Object.freeze({
    schema: 'cf-v2-capture-attempt-plan/v1',
    snapshotFingerprint: snapshot.fingerprint,
    verb: preflight.verb,
    candidate,
    tier,
    chance,
    candidateDraw,
    successDraw,
    hit,
    spent: 1,
    remainingAfter: preflight.remainingBefore - 1,
    receiptOrdinal: draws.receiptOrdinal,
    discoveryRecordId,
    ownedRowId,
    successor,
    witness,
  });
  CAPTURE_PLANS.add(plan);
  return Object.freeze({ kind: 'planned', plan });
}

export function isCaptureAttemptPlanV1(value: unknown): value is CaptureAttemptPlanV1 {
  return typeof value === 'object'
    && value !== null
    && CAPTURE_PLANS.has(value)
    && (value as CaptureAttemptPlanV1).schema === 'cf-v2-capture-attempt-plan/v1';
}
