/* One source-proven Survey/Bioscan transaction.

   The existing Arc 9 survey ledger always completes. One SessionRNG hazard
   draw may additionally wound the explorer (never below 1 HP) or the exact
   active Field Scout (never beyond Critical 0.85). At one of the fixed Fifty
   Paragon home worlds it can add that exact species to the catalogue, but it
   never captures an individual or spends Biosphere Yield. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  sha256Hex,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  preflightArc5BioscanV1,
  settleArc5BioscanParagonV1,
  settleArc5BioscanV1,
  type Arc5BioscanPreflightV1,
  type Arc5BioscanSettlementV1,
} from '@cf/domain-acquisition/bioscan-internal';
import {
  isEngineeringCapabilitySnapshot,
  type EngineeringCapabilitySnapshot,
} from '@cf/domain-loot';
import { DOMAINS } from '@cf/domain-sessionrng';
import {
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  encodeEngineeringState,
  isEngineeringState,
  isWorldOpportunitySnapshot,
  type EngineeringStateV2,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import {
  committedArc5OwnershipState,
  arc4OwnershipLegacyMirrorMatches,
  arc2LootLegacyMirrorMatches,
  encodeArc2LootCarrier,
  prepareArc4OwnershipWrite,
  prepareArc5CompositeOwnershipMigrationSuccessor,
  prepareArc5OwnershipV2Successor,
  readArc2EngineeringLoadout,
  readArc2Loot,
  readArc3Engineering,
  readArc4Ownership,
  readArc5OwnershipMigration,
  readCombatSettlementAuthorityV1,
  type Arc5OwnershipMigrationEvidenceV2,
  type Arc2LootInventoryV1,
  type CodexEntry,
  type PreparedArc5OwnershipMigrationSuccessorV2,
  type SaveStateV2,
  type V5ExtensionWrite,
} from '@cf/persistence';
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import type { F4RuntimeAuthority, F4RuntimeOutcomeCommitOutcome } from './f4-runtime-authority.js';
import {
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
  type Arc9EventAchievementJoinPreparationV1,
} from './arc9-progression-projection.js';
import {
  prepareArc9SurveySettlementV1,
  type Arc9SurveySettlementReadyV1,
} from './arc9-survey-action.js';
import {
  projectBioscanHazardPolicyV1,
  resolveBioscanHazardV1,
  strongestFaunaPowerForBioscanV1,
  type BioscanHazardPolicyV1,
} from './bioscan-hazard.js';
import { isCanonicalWorldRoster, type CanonicalWorldRoster } from './world-roster.js';
import {
  publishStarterCharterActionFieldsV1,
  stageStarterCharterActionV1,
  type StarterCharterActionFactV1,
  type WeeklyCharterActionFactV1,
} from './starter-charter-action.js';
import {
  findArc9ParagonAtCurrentWorldV1,
  projectArc9ParagonLegacyCodexEntryV1,
} from './paragon-finder.js';

export const BIOSCAN_ACTION_DOMAIN_V1 = DOMAINS.surveyHazard;
export const ARC9_BIOSCAN_RECEIPT_KIND_V1 = 'arc9-bioscan-v1' as const;
export const ARC9_BIOSCAN_WITNESS_SCHEMA_V1 = 'cf-v2-arc9-bioscan-witness/v1' as const;
export const ARC9_BIOSCAN_ACHIEVEMENT_ID_V1 = 'survivor' as const;

export interface BioscanActionProjectionInputV1 {
  readonly ownershipV2: OwnershipStateV2;
  readonly engineering: EngineeringStateV2;
  readonly capabilities: EngineeringCapabilitySnapshot;
  readonly state: SaveStateV2;
  readonly address: CanonicalCF1WorldAddress;
  readonly roster: CanonicalWorldRoster;
  readonly opportunity: WorldOpportunitySnapshot;
  /** Presentation hint only. Commit re-reads the canonical combat ledger. */
  readonly settled: boolean;
}

export type BioscanActionProjectionV1 =
  | Readonly<{
    kind: 'ready';
    hazard: BioscanHazardPolicyV1;
    scout: Arc5BioscanPreflightV1['scoutBefore'];
    survey: Arc9SurveySettlementReadyV1;
  }>
  | Readonly<{ kind: 'unavailable'; detail: string }>;

export interface BioscanActionInputV1 extends BioscanActionProjectionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitOutcome'>;
  readonly codecNow: number;
}

export type BioscanActionOutcomeV1 =
  | Readonly<{
    kind: 'committed'; durability: 'committed'; convergence: 'none';
    transaction: Extract<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }>;
    settlement: Arc5BioscanSettlementV1;
    hazard: BioscanHazardPolicyV1;
    state: SaveStateV2;
    ownershipV2: OwnershipStateV2;
    ownershipV2Evidence: Arc5OwnershipMigrationEvidenceV2 | null;
    ownershipWrites: readonly V5ExtensionWrite[];
    extensionWrites: readonly V5ExtensionWrite[];
    starterCharter: StarterCharterActionFactV1;
    weeklyCharter: WeeklyCharterActionFactV1 | null;
    arc2LootState: Arc2LootInventoryV1 | null;
    achievementIdsAdded: readonly (typeof ARC9_BIOSCAN_ACHIEVEMENT_ID_V1)[];
    postHazardAggregateAchievementIdsAdded: readonly string[];
    paragon: Readonly<{
      kind: 'none' | 'repeat' | 'added';
      index: number | null;
      codexId: string | null;
    }>;
    survey: Arc9SurveySettlementReadyV1;
    sourceState: SaveStateV2;
    publication: Readonly<{
      hpBefore: number;
      hpAfter: number;
      scanHitsBefore: number;
      scanHitsAfter: number;
    }>;
  }>
  | Readonly<{
    kind: 'committed-convergence'; durability: 'committed'; convergence: 'read-only-reload';
    detail: string;
    transaction: Extract<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused'; durability: 'none'; convergence: 'none' | 'read-only-reload';
    detail: string;
    transaction: Exclude<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface BioscanSelectionV1 {
  readonly settlement: Arc5BioscanSettlementV1;
  readonly survey: Arc9SurveySettlementReadyV1;
  readonly hazard: BioscanHazardPolicyV1;
  readonly prepared: PreparedArc5OwnershipMigrationSuccessorV2 | null;
  readonly expectedOwnership: OwnershipStateV2;
  readonly ownershipWrites: readonly V5ExtensionWrite[];
  readonly paragon: Readonly<{
    kind: 'none' | 'repeat' | 'added';
    index: number | null;
    codexId: string | null;
  }>;
  readonly achievement: Arc9EventAchievementJoinPreparationV1 | null;
  readonly postHazardAggregateAchievementIdsAdded: readonly string[];
  readonly extensionWrites: readonly V5ExtensionWrite[];
  readonly starterCharter: StarterCharterActionFactV1;
  readonly weeklyCharter: WeeklyCharterActionFactV1 | null;
  readonly expectedArc2LootState: Arc2LootInventoryV1 | null;
  readonly expectedState: SaveStateV2;
  readonly sourceState: SaveStateV2;
  readonly witness: string;
  readonly publication: Readonly<{
    hpBefore: number;
    hpAfter: number;
    scanHitsBefore: number;
    scanHitsAfter: number;
  }>;
}

const MAX_CLONE_NODES = 1_500_000;

function clonePlain(value: unknown, ancestors: Set<object>, budget: { count: number }, depth: number): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object' || depth > 256 || budget.count >= MAX_CLONE_NODES
    || ancestors.has(value)) throw new TypeError('bioscan state is not bounded plain data');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype || Reflect.ownKeys(value).length !== value.length + 1) {
        throw new TypeError('bioscan arrays must be exact dense data');
      }
      return value.map((row) => clonePlain(row, ancestors, budget, depth + 1));
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('bioscan state must use plain prototypes');
    }
    const result: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('bioscan state cannot contain symbols');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('bioscan state cannot contain accessors');
      }
      Object.defineProperty(result, key, {
        value: clonePlain(descriptor.value, ancestors, budget, depth + 1),
        enumerable: true, configurable: true, writable: true,
      });
    }
    return result;
  } finally { ancestors.delete(value); }
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function exactTechParity(state: SaveStateV2, engineering: EngineeringStateV2): boolean {
  return Array.isArray(state.techOwned)
    && state.techOwned.length === engineering.research.length
    && state.techOwned.every((id, index) => id === engineering.research[index]);
}

function sameWorld(
  address: CanonicalCF1WorldAddress,
  roster: CanonicalWorldRoster,
  opportunity: WorldOpportunitySnapshot,
): boolean {
  const key = getCanonicalCF1AddressKey(address);
  return key !== null && roster.worldKey === key && opportunity.key === key
    && getCanonicalCF1AddressKey(roster.address) === key
    && getCanonicalCF1AddressKey(opportunity.address) === key;
}

function project(
  ownershipV2: OwnershipStateV2,
  engineering: EngineeringStateV2,
  capabilities: EngineeringCapabilitySnapshot,
  state: SaveStateV2,
  address: CanonicalCF1WorldAddress,
  roster: CanonicalWorldRoster,
  opportunity: WorldOpportunitySnapshot,
  settled: boolean,
): BioscanActionProjectionV1 {
  if (!isOwnershipStateV2(ownershipV2) || !isEngineeringState(engineering)
    || !isEngineeringCapabilitySnapshot(capabilities) || !isCanonicalWorldRoster(roster)
    || !isWorldOpportunitySnapshot(opportunity) || !isCanonicalCF1Address(address)
    || !('planet' in address) || !sameWorld(address, roster, opportunity)
    || !exactTechParity(state, engineering) || typeof settled !== 'boolean') {
    return Object.freeze({ kind: 'unavailable', detail: 'authority-invalid-or-divergent' });
  }
  const survey = prepareArc9SurveySettlementV1(state, address);
  if (survey.kind !== 'ready' || survey.facts.target !== 'world' || !survey.facts.living) {
    return Object.freeze({
      kind: 'unavailable',
      detail: survey.kind === 'current' ? 'already-recorded' : `survey:${survey.kind}`,
    });
  }
  const scout = preflightArc5BioscanV1(ownershipV2);
  if (scout.kind !== 'ready') {
    return Object.freeze({ kind: 'unavailable', detail: `scout:${scout.reason}` });
  }
  try {
    return Object.freeze({
      kind: 'ready', survey, scout: scout.preflight.scoutBefore,
      hazard: projectBioscanHazardPolicyV1({
        address,
        planetType: opportunity.source.planetType,
        strongestFaunaPower: strongestFaunaPowerForBioscanV1(roster),
        settled,
        reinforcedHull: engineering.research.includes('hull1'),
        fieldWoundReduction: capabilities.bioscanDamageReduction,
      }),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'unavailable', detail: `hazard:${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

export function projectBioscanActionV1(input: BioscanActionProjectionInputV1): BioscanActionProjectionV1 {
  try {
    return project(
      input.ownershipV2, input.engineering, input.capabilities, input.state,
      input.address, input.roster, input.opportunity, input.settled,
    );
  } catch { return Object.freeze({ kind: 'unavailable', detail: 'input-invalid' }); }
}

interface Captured extends Omit<BioscanActionInputV1, 'runtime'> {
  readonly commit: F4RuntimeAuthority['commitOutcome'];
}

function capture(input: BioscanActionInputV1): Captured | null {
  try {
    const fields = [
      'runtime', 'ownershipV2', 'engineering', 'capabilities', 'state', 'address',
      'roster', 'opportunity', 'settled', 'codecNow',
    ] as const;
    if (!input || typeof input !== 'object' || Array.isArray(input)
      || (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)) return null;
    const keys = Reflect.ownKeys(input);
    const expected = [...fields].sort();
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    if (keys.length !== expected.length || names.some((name, index) => name !== expected[index])) return null;
    const values: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of fields) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      values[field] = descriptor.value;
    }
    const runtime = values.runtime;
    const commit = runtime && typeof runtime === 'object' && !Array.isArray(runtime)
      ? Object.getOwnPropertyDescriptor(runtime, 'commitOutcome') : undefined;
    if (!commit || !('value' in commit) || typeof commit.value !== 'function'
      || !Number.isSafeInteger(values.codecNow) || (values.codecNow as number) < 0) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitOutcome'],
      ownershipV2: values.ownershipV2 as OwnershipStateV2,
      engineering: values.engineering as EngineeringStateV2,
      capabilities: values.capabilities as EngineeringCapabilitySnapshot,
      state: clonePlain(values.state, new Set<object>(), { count: 0 }, 0) as SaveStateV2,
      address: values.address as CanonicalCF1WorldAddress,
      roster: values.roster as CanonicalWorldRoster,
      opportunity: values.opportunity as WorldOpportunitySnapshot,
      settled: values.settled as boolean,
      codecNow: values.codecNow as number,
    });
  } catch { return null; }
}

function reloadFor(outcome: Exclude<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }>): boolean {
  return outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

function witnessForBioscanV1(input: Readonly<{
  survey: Arc9SurveySettlementReadyV1;
  hazard: BioscanHazardPolicyV1;
  hazardOutcome: ReturnType<typeof resolveBioscanHazardV1>;
  settlement: Arc5BioscanSettlementV1;
  roster: CanonicalWorldRoster;
  engineering: EngineeringStateV2;
  capabilityFingerprint: string;
  receiptOrdinal: number;
  draw: number;
  hpBefore: number;
  hpAfter: number;
  scanHitsBefore: number;
  scanHitsAfter: number;
  ownershipParentDigest: string;
  ownershipSuccessorDigest: string;
  paragon: BioscanSelectionV1['paragon'];
  achievement: Arc9EventAchievementJoinPreparationV1 | null;
  postHazardAggregateAchievementIdsAdded: readonly string[];
  finalBestRankIndex: number;
}>): string {
  return `arc9bv1:${sha256Hex(canonicalJson({
    schema: ARC9_BIOSCAN_WITNESS_SCHEMA_V1,
    operation: input.survey.operation,
    receiptOrdinal: input.receiptOrdinal,
    survey: {
      facts: input.survey.facts,
      source: input.survey.source,
      successor: input.survey.successor,
      addedEventAchievementIds: input.survey.addedEventAchievementIds,
      addedAggregateAchievementIds: input.survey.addedAggregateAchievementIds,
    },
    hazard: input.hazard,
    hazardOutcome: {
      kind: input.hazardOutcome.kind,
      damage: input.hazardOutcome.damage,
    },
    draw: input.draw,
    roster: {
      worldKey: input.roster.worldKey,
      ecologyEpoch: input.roster.ecologyEpoch,
      fullRosterFingerprint: input.roster.fullRosterFingerprint,
    },
    engineering: {
      state: encodeEngineeringState(input.engineering),
      capabilityFingerprint: input.capabilityFingerprint,
    },
    explorer: { hpBefore: input.hpBefore, hpAfter: input.hpAfter },
    closeCalls: { before: input.scanHitsBefore, after: input.scanHitsAfter },
    ownership: {
      parentDigest: input.ownershipParentDigest,
      successorDigest: input.ownershipSuccessorDigest,
    },
    paragon: input.paragon,
    achievement: input.achievement === null ? null : {
      achievementId: input.achievement.achievementId,
      owner: input.achievement.owner,
      added: input.achievement.added,
      priorUnlockedCount: input.achievement.priorUnlockedCount,
      nextUnlockedIds: input.achievement.nextUnlockedIds,
    },
    postHazardProgression: {
      addedAggregateAchievementIds: input.postHazardAggregateAchievementIdsAdded,
      finalBestRankIndex: input.finalBestRankIndex,
    },
    injuryWitness: input.settlement.witness,
  }))}`;
}

export async function commitBioscanActionV1(input: BioscanActionInputV1): Promise<BioscanActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) return Object.freeze({
    kind: 'refused', durability: 'none', convergence: 'none',
    detail: 'input:invalid-or-unregistered', transaction: null,
  });
  const preview = project(
    captured.ownershipV2, captured.engineering, captured.capabilities, captured.state,
    captured.address, captured.roster, captured.opportunity, captured.settled,
  );
  if (preview.kind !== 'ready') return Object.freeze({
    kind: 'refused', durability: 'none', convergence: 'none',
    detail: preview.detail, transaction: null,
  });
  const scoutPreflight = preflightArc5BioscanV1(captured.ownershipV2);
  if (scoutPreflight.kind !== 'ready') return Object.freeze({
    kind: 'refused', durability: 'none', convergence: 'none',
    detail: `scout:${scoutPreflight.reason}`, transaction: null,
  });
  let selected: Readonly<BioscanSelectionV1> | null = null;
  let sourceAuthorityProtection = false;
  let transaction: F4RuntimeOutcomeCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      domain: BIOSCAN_ACTION_DOMAIN_V1,
      receiptKind: ARC9_BIOSCAN_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ value, receiptOrdinal, draft, extensions }) => {
        const loadout = readArc2EngineeringLoadout(extensions);
        const loot = readArc2Loot(extensions);
        const engineering = readArc3Engineering(extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
        const ownership = readArc5OwnershipMigration(
          extensions,
          SCENE_OWNERSHIP_ADDRESS_RESOLVER,
        );
        const combat = readCombatSettlementAuthorityV1(extensions);
        if (loadout.kind !== 'loaded'
          || loot.kind !== 'loaded'
          || loot.state.kind !== 'inventory'
          || !arc2LootLegacyMirrorMatches(loot.state, draft)
          || loadout.capabilities.fingerprint !== captured.capabilities.fingerprint
          || engineering.kind !== 'loaded'
          || encodeEngineeringState(engineering.state) !== encodeEngineeringState(captured.engineering)
          || !exactTechParity(draft, engineering.state)
          || ownership.kind !== 'loaded'
          || ownershipStateDigestV2(ownership.state)
            !== ownershipStateDigestV2(captured.ownershipV2)
          || combat.kind !== 'loaded') {
          sourceAuthorityProtection = true;
          throw new Error('bioscan authorities diverged');
        }
        const survey = prepareArc9SurveySettlementV1(draft, captured.address);
        if (survey.kind !== 'ready' || survey.facts.target !== 'world' || !survey.facts.living) {
          throw new Error('bioscan survey parent changed');
        }
        const settled = combat.authority.conquests.some(({ worldKey }) => worldKey === captured.roster.worldKey);
        const hazard = projectBioscanHazardPolicyV1({
          address: captured.address,
          planetType: captured.opportunity.source.planetType,
          strongestFaunaPower: strongestFaunaPowerForBioscanV1(captured.roster),
          settled,
          reinforcedHull: engineering.state.research.includes('hull1'),
          fieldWoundReduction: loadout.capabilities.bioscanDamageReduction,
        });
        const hazardOutcome = resolveBioscanHazardV1(hazard, value);
        const settlement = settleArc5BioscanV1(
          scoutPreflight.preflight,
          hazardOutcome.kind === 'hostile', hazardOutcome.damage,
          receiptOrdinal, captured.roster.worldKey,
        );
        let prepared: PreparedArc5OwnershipMigrationSuccessorV2 | null = null;
        let expectedOwnership = settlement.successor ?? captured.ownershipV2;
        let ownershipWrites: readonly V5ExtensionWrite[] = Object.freeze([]);
        let paragonEntry: CodexEntry | null = null;
        let paragon: BioscanSelectionV1['paragon'] = Object.freeze({
          kind: 'none', index: null, codexId: null,
        });
        const paragonLocation = findArc9ParagonAtCurrentWorldV1(captured.address);
        if (paragonLocation.kind === 'protected') {
          throw new Error(`Paragon finder ${paragonLocation.reason}`);
        }
        if (paragonLocation.kind === 'located') {
          const sourceParent = ownershipSourceStateV1(ownership.state);
          if (!arc4OwnershipLegacyMirrorMatches(sourceParent, draft)) {
            sourceAuthorityProtection = true;
            throw new Error('Paragon legacy ownership mirror diverged');
          }
          const alreadyCatalogued = draft.codex.some(([id]) => id === paragonLocation.codexId);
          if (!alreadyCatalogued && draft.codex.length >= 1_500) {
            throw new Error('Paragon legacy Codex capacity is exhausted');
          }
          const joined = settleArc5BioscanParagonV1(
            settlement,
            paragonLocation.index,
            captured.address,
          );
          expectedOwnership = joined.successor ?? captured.ownershipV2;
          paragon = Object.freeze({
            kind: joined.kind,
            index: paragonLocation.index,
            codexId: paragonLocation.codexId,
          });
          if (joined.kind === 'added') {
            const arc4 = prepareArc4OwnershipWrite({
              extensions,
              state: joined.sourceSuccessor,
              resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
            });
            if (arc4.kind !== 'prepared') {
              throw new Error(`Paragon Arc 4 ownership ${arc4.reason}`);
            }
            const result = prepareArc5CompositeOwnershipMigrationSuccessor({
              baseExtensions: extensions,
              parent: captured.ownershipV2,
              successorExtensions: arc4.extensions,
              successor: joined.sourceSuccessor,
              successorV2: expectedOwnership,
              resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
            });
            if (result.kind !== 'prepared') {
              throw new Error(`Paragon Arc 5 ownership ${result.reason}`);
            }
            prepared = result;
            ownershipWrites = Object.freeze([...arc4.writes, ...result.writes]);
            paragonEntry = projectArc9ParagonLegacyCodexEntryV1(paragonLocation);
          }
        }
        if (prepared === null && settlement.successor !== null) {
          const result = prepareArc5OwnershipV2Successor({
            baseExtensions: extensions, parent: captured.ownershipV2,
            successor: settlement.successor, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
          });
          if (result.kind !== 'prepared') throw new Error(`bioscan ownership ${result.reason}`);
          prepared = result;
          ownershipWrites = result.writes;
        }
        const hostile = settlement.hostile;
        const nextStats = {
          ...survey.successorState.stats,
          ...(hostile ? { scanhits: (draft.stats.scanhits ?? 0) + 1 } : {}),
          ...(paragonEntry === null ? {} : {
            paragons: (draft.stats.paragons ?? 0) + 1,
            best: Math.max(draft.stats.best ?? 0, paragonEntry.tier ?? 0),
            maxGen: Math.max(
              draft.stats.maxGen ?? 0,
              typeof paragonEntry.g.gen === 'number' ? paragonEntry.g.gen : 0,
            ),
          }),
        };
        if (!Number.isSafeInteger(nextStats.scanhits ?? 0) || (nextStats.scanhits ?? 0) > 1_000_000_000) {
          throw new Error('bioscan close-call counter is exhausted');
        }
        const physiologyState: SaveStateV2 = {
          ...survey.successorState,
          codex: paragonEntry === null
            ? survey.successorState.codex
            : [...survey.successorState.codex, [paragonEntry.id, paragonEntry]],
          hp: settlement.target === 'explorer'
            ? Math.max(1, draft.hp - settlement.damage) : draft.hp,
          stats: nextStats,
        };
        if (paragonEntry !== null
          && (!Number.isSafeInteger(nextStats.paragons ?? -1)
            || (nextStats.paragons ?? -1) > 1_000_000_000)) {
          throw new Error('Paragon discovery counter is exhausted');
        }
        let achievement: Arc9EventAchievementJoinPreparationV1 | null = null;
        let postHazardAggregateAchievementIdsAdded: readonly string[] = Object.freeze([]);
        let nextState = physiologyState;
        if (hostile) {
          const join = prepareArc9EventAchievementJoinV1(
            physiologyState,
            ARC9_BIOSCAN_ACHIEVEMENT_ID_V1,
          );
          if (join.kind !== 'prepared') {
            throw new Error(`bioscan achievement ${join.reason}`);
          }
          achievement = join;
          nextState = { ...physiologyState, unlocked: [...join.nextUnlockedIds] };
        }
        if (hostile || paragon.kind === 'added') {
          const refresh = prepareArc9ProgressionRefreshV1(nextState);
          if (refresh.kind === 'protected') {
            throw new Error(`bioscan progression ${refresh.reason}`);
          }
          if (refresh.kind === 'ready') {
            postHazardAggregateAchievementIdsAdded = refresh.addedAchievementIds;
            nextState = refresh.successorState;
          }
          const fixedPoint = prepareArc9ProgressionRefreshV1(nextState);
          if (fixedPoint.kind !== 'current') {
            throw new Error('bioscan progression fixed point');
          }
        }
        if (paragon.kind === 'added') {
          const sourceSuccessor = ownershipSourceStateV1(expectedOwnership);
          if (!arc4OwnershipLegacyMirrorMatches(sourceSuccessor, nextState)) {
            throw new Error('Paragon legacy ownership projection did not reach its fixed point');
          }
        }
        const publication = Object.freeze({
          hpBefore: draft.hp,
          hpAfter: nextState.hp,
          scanHitsBefore: draft.stats.scanhits ?? 0,
          scanHitsAfter: nextStats.scanhits ?? 0,
        });
        const bioscanWitness = witnessForBioscanV1({
          survey,
          hazard,
          hazardOutcome,
          settlement,
          roster: captured.roster,
          engineering: engineering.state,
          capabilityFingerprint: loadout.capabilities.fingerprint,
          receiptOrdinal,
          draw: value,
          ...publication,
          ownershipParentDigest: ownershipStateDigestV2(captured.ownershipV2),
          ownershipSuccessorDigest: ownershipStateDigestV2(
            expectedOwnership,
          ),
          paragon,
          achievement,
          postHazardAggregateAchievementIdsAdded,
          finalBestRankIndex: nextState.stats.bestRank ?? 0,
        });
        const charterState = clonePlain(
          nextState,
          new Set<object>(),
          { count: 0 },
          0,
        ) as SaveStateV2;
        const starterCharter = stageStarterCharterActionV1({
          draft: charterState,
          extensions,
          predecessorWrites: ownershipWrites,
          predecessorWitness: JSON.stringify({ bioscanWitness }),
          event: { kind: 'bioscan', address: captured.address },
          weekly: {
            codecNow: captured.codecNow,
            events: Object.freeze([
              Object.freeze({
                kind: 'bioscan' as const, opportunity: captured.opportunity, first: true,
              }),
              ...(paragon.kind === 'added' && paragon.codexId !== null
                ? [Object.freeze({
                  kind: 'species' as const, codexId: paragon.codexId, first: true,
                })]
                : []),
            ]),
          },
          receiptOrdinal,
        });
        if (starterCharter.kind === 'refused') {
          throw new Error(`bioscan starter Charter ${starterCharter.reason}`);
        }
        let expectedArc2LootState: Arc2LootInventoryV1 | null = null;
        if (starterCharter.fact.completions.some(({ gearId }) => gearId !== null)) {
          const stagedLoot = readArc2Loot(starterCharter.extensions);
          if (stagedLoot.kind !== 'loaded' || stagedLoot.state.kind !== 'inventory'
            || !arc2LootLegacyMirrorMatches(stagedLoot.state, charterState)) {
            throw new Error('bioscan starter Charter exact gear successor is unavailable');
          }
          expectedArc2LootState = stagedLoot.state;
        }
        selected = Object.freeze({
          settlement, survey, hazard, prepared, expectedOwnership, ownershipWrites, paragon,
          achievement,
          postHazardAggregateAchievementIdsAdded,
          extensionWrites: starterCharter.extensionWrites,
          starterCharter: starterCharter.fact,
          weeklyCharter: starterCharter.weeklyFact,
          expectedArc2LootState,
          witness: starterCharter.witness,
          publication,
          sourceState: clonePlain(
            draft,
            new Set<object>(),
            { count: 0 },
            0,
          ) as SaveStateV2,
          expectedState: clonePlain(
            charterState,
            new Set<object>(),
            { count: 0 },
            0,
          ) as SaveStateV2,
        });
        return Object.freeze({
          state: charterState,
          extensionWrites: starterCharter.extensionWrites,
          witness: starterCharter.witness,
        });
      },
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: `transaction:${error instanceof Error ? error.message : String(error)}`,
      transaction: null,
    });
  }
  if (transaction.kind !== 'committed') return Object.freeze({
    kind: 'refused', durability: 'none',
    convergence: sourceAuthorityProtection || reloadFor(transaction) ? 'read-only-reload' : 'none',
    detail: `transaction:${transaction.kind}`, transaction,
  });
  const chosen = selected as Readonly<BioscanSelectionV1> | null;
  if (chosen === null) return Object.freeze({
    kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
    detail: 'committed-bioscan-evidence-missing', transaction,
  });
  const durableOwnership = readArc5OwnershipMigration(
    transaction.saved.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const durableArc4 = readArc4Ownership(
    transaction.saved.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const committedSuccessor = chosen.prepared === null ? null : committedArc5OwnershipState(
    chosen.prepared,
    transaction.saved.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const committedOwnershipState = chosen.prepared === null
    ? durableOwnership.kind === 'loaded' ? durableOwnership.state : null
    : committedSuccessor?.state ?? null;
  const fixedPoint = prepareArc9SurveySettlementV1(transaction.state, captured.address);
  const progressionFixedPoint = prepareArc9ProgressionRefreshV1(transaction.state);
  const expectedOwnership = chosen.expectedOwnership;
  const expectedSource = ownershipSourceStateV1(expectedOwnership);
  const charterGearChanged = chosen.starterCharter.completions.some(
    ({ gearId }) => gearId !== null,
  );
  const durableLoot = charterGearChanged ? readArc2Loot(transaction.saved.extensions) : null;
  let committedHazard: ReturnType<typeof resolveBioscanHazardV1>;
  try {
    committedHazard = resolveBioscanHazardV1(chosen.hazard, transaction.plan.value);
  } catch {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: 'committed-bioscan-fixed-point-mismatch', transaction,
    });
  }
  const achievementFixedPoint = chosen.achievement === null ? null
    : prepareArc9EventAchievementJoinV1(
      transaction.state,
      ARC9_BIOSCAN_ACHIEVEMENT_ID_V1,
    );
  if (transaction.plan.domain !== BIOSCAN_ACTION_DOMAIN_V1
    || transaction.plan.value < 0 || transaction.plan.value >= 1
    || transaction.plan.receiptOrdinal !== chosen.settlement.receiptEvidence.ordinal
    || transaction.receipt.kind !== ARC9_BIOSCAN_RECEIPT_KIND_V1
    || transaction.receipt.ordinal !== chosen.settlement.receiptEvidence.ordinal
    || transaction.receipt.witness !== chosen.witness
    || !sameJson(transaction.authority.sessionRng, transaction.plan.nextSessionRng)
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state, chosen.expectedState)
    || fixedPoint.kind !== 'current'
    || progressionFixedPoint.kind !== 'current'
    || (committedHazard.kind === 'hostile') !== chosen.settlement.hostile
    || committedHazard.damage !== chosen.settlement.damage
    || transaction.state.hp !== (chosen.settlement.target === 'explorer'
      ? Math.max(1, captured.state.hp - chosen.settlement.damage) : captured.state.hp)
    || (transaction.state.stats.scanhits ?? 0) !== ((captured.state.stats.scanhits ?? 0)
      + (chosen.settlement.hostile ? 1 : 0))
    || (transaction.state.stats.paragons ?? 0) !== ((captured.state.stats.paragons ?? 0)
      + (chosen.paragon.kind === 'added' ? 1 : 0))
    || (chosen.achievement === null
      ? chosen.settlement.hostile
      : achievementFixedPoint?.kind !== 'prepared' || achievementFixedPoint.added)
    || chosen.starterCharter.event.kind !== 'bioscan'
    || chosen.starterCharter.event.worldKey !== captured.address.key
    || (chosen.weeklyCharter !== null
      && (chosen.weeklyCharter.events.length !== (chosen.paragon.kind === 'added' ? 2 : 1)
        || !chosen.weeklyCharter.events.some((event) => event.kind === 'bioscan'
          && event.worldKey === captured.address.key && event.first === true)
        || (chosen.paragon.kind === 'added'
          && !chosen.weeklyCharter.events.some((event) => event.kind === 'species'
            && event.codexId === chosen.paragon.codexId && event.first === true))))
    || (charterGearChanged && (durableLoot?.kind !== 'loaded'
      || durableLoot.state.kind !== 'inventory'
      || chosen.expectedArc2LootState === null
      || !sameJson(
        encodeArc2LootCarrier(durableLoot.state),
        encodeArc2LootCarrier(chosen.expectedArc2LootState),
      )
      || !arc2LootLegacyMirrorMatches(durableLoot.state, transaction.state)))
    || committedOwnershipState === null
    || (chosen.paragon.kind !== 'none' && (durableArc4.kind !== 'loaded'
      || ownershipStateDigestV1(durableArc4.state) !== ownershipStateDigestV1(expectedSource)
      || !arc4OwnershipLegacyMirrorMatches(durableArc4.state, transaction.state)))
    || ownershipStateDigestV2(committedOwnershipState)
      !== ownershipStateDigestV2(expectedOwnership)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: 'committed-bioscan-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    settlement: chosen.settlement, hazard: chosen.hazard, state: transaction.state,
    ownershipV2: committedOwnershipState,
    ownershipV2Evidence: committedSuccessor?.evidence ?? null,
    ownershipWrites: chosen.ownershipWrites,
    extensionWrites: chosen.extensionWrites,
    starterCharter: chosen.starterCharter,
    weeklyCharter: chosen.weeklyCharter,
    arc2LootState: chosen.expectedArc2LootState,
    achievementIdsAdded: chosen.achievement?.added
      ? Object.freeze([ARC9_BIOSCAN_ACHIEVEMENT_ID_V1])
      : Object.freeze([]),
    postHazardAggregateAchievementIdsAdded: chosen.postHazardAggregateAchievementIdsAdded,
    paragon: chosen.paragon,
    survey: chosen.survey, sourceState: chosen.sourceState, publication: chosen.publication,
  });
}

/** Publish only after the caller has independently matched the runtime's
 * retained checkpoint. The mutable app mirror must still be the exact live
 * parent; no optimistic or partial Bioscan result is accepted. */
export function publishBioscanActionV1(
  target: SaveStateV2,
  outcome: Extract<BioscanActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  if (!sameJson(target, outcome.sourceState)
    || !sameJson(outcome.state, outcome.transaction.state)
    || outcome.state.hp !== outcome.publication.hpAfter
    || (outcome.state.stats.scanhits ?? 0) !== outcome.publication.scanHitsAfter) {
    throw new TypeError('Bioscan publication requires its exact live parent and fixed point');
  }
  target.surveyedSet = [...outcome.state.surveyedSet];
  target.ptypesSeen = [...outcome.state.ptypesSeen];
  target.starKindsSeen = [...outcome.state.starKindsSeen];
  target.codex = structuredClone(outcome.state.codex);
  target.hp = outcome.state.hp;
  target.stats = { ...outcome.state.stats };
  target.unlocked = [...outcome.state.unlocked];
  publishStarterCharterActionFieldsV1(target, outcome.state);
  if (!sameJson(target, outcome.state)) {
    throw new TypeError('Bioscan publication did not reproduce its committed fixed point');
  }
}
