/* §20 Command: the OPEN-ENCOUNTER record (Nick 2026-09-25, port/DECISIONS.md §20; design audits/COMBAT_S2_PARTY_20260925/DESIGN.md §4).

   A Command fight pauses at its Breaks for the player's Hold / Swap / Withdraw. The fight stays a PURE function of (sealed plan,
   decisions), so what must survive a reload is exactly those two things:
   - OPEN: the sealed plan (battle id, encounter digest, every fighter's exact settlement champion + stance) is committed in its own
     deterministic F4 receipt. It writes nothing else (no Recovery, no XP, no counters).
   - DECIDE: each Break answer appends one decision through the same F4/F3 CAS, and ALSO compare-and-sets on the decision count, so a
     second tab or a replayed press can never append twice or out of order.
   - SETTLE: the ordinary combat settlement (`combat-settlement.ts`) CONSUMES the record in its one receipt: its plan must carry exactly
     the sealed party, the sealed battle id and the appended decisions (plus at most the final answer), and the record closes in the same
     CAS. While a record is open no other fight may settle, and its members are blocked from other companion commands
     (`combatOpenEncounterMemberIdsV1`), so closing the tab cannot escape: Withdraw is always offered instead.

   The carrier never disappears once written (V5 extension writes replace, never delete): a closed record is `open: null`. */
import {
  canonicalJson,
  canonicalizeData,
  sha256Hex,
  type CanonicalJsonObject,
} from '@cf/domain-acquisition';
import {
  runEncounterV1,
  type CombatPartyMemberInputV1,
  type CombatSettlementChampionV1,
  type CombatSettlementPlanV1,
  type EncounterDecisionV1,
  type EncounterFighterV1,
  type EncounterResultV1,
  type EncounterStanceV1,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import type { SaveStateV2 } from './import-v2.js';
import {
  V5_SEGMENTS,
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5ExtensionWrite,
  type V5Extensions,
} from './migration-v5.js';
import type { F4OutcomeDerivation } from './outcome-transaction.js';

export const COMBAT_OPEN_ENCOUNTER_SCHEMA_V1 = 'cf-v2-combat-open-encounter/v1' as const;
export const COMBAT_OPEN_ENCOUNTER_VERSION_V1 = 1 as const;
export const COMBAT_OPEN_ENCOUNTER_SEGMENT_V1 = 'player' as const;
export const COMBAT_OPEN_ENCOUNTER_NAMESPACE_V1 = 'combat.open-encounter' as const;
/** F4 operation + receipt kind of the sealing receipt. */
export const COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1 = 'combat-open-encounter' as const;
/** F4 operation + receipt kind of one appended Break decision. */
export const COMBAT_OPEN_ENCOUNTER_DECIDE_OPERATION_V1 = 'combat-encounter-decision' as const;
const DECISIONS = Object.freeze(['hold', 'swap', 'withdraw'] as const);
const STANCES = Object.freeze(['balanced', 'press', 'guard', 'evade'] as const);
const DIGEST = /^[0-9a-f]{64}$/u;

export interface CombatOpenEncounterMemberV1 {
  readonly champion: CombatSettlementChampionV1;
  readonly stance: EncounterStanceV1;
}

/** The sealed Command fight: everything `runEncounterV1` reads, and the settlement's battle identity. */
export interface CombatOpenEncounterRecordV1 {
  readonly battleId: string;
  readonly encounterDigest: string;
  readonly worldKey: string;
  readonly defenderName: string;
  readonly defenderGenome: CanonicalJsonObject;
  readonly party: readonly CombatOpenEncounterMemberV1[];
  readonly openedAtReceiptOrdinal: number;
  readonly sealDigest: string;
  readonly decisions: readonly EncounterDecisionV1[];
}

export interface CombatOpenEncounterCarrierV1 {
  readonly schema: typeof COMBAT_OPEN_ENCOUNTER_SCHEMA_V1;
  readonly version: typeof COMBAT_OPEN_ENCOUNTER_VERSION_V1;
  readonly open: CombatOpenEncounterRecordV1 | null;
}

export type CombatOpenEncounterReadOutcomeV1 =
  | Readonly<{ kind: 'loaded'; record: CombatOpenEncounterRecordV1 | null }>
  | Readonly<{ kind: 'protected'; reason: 'wrong-segment' | 'corrupt' | 'future-version'; version?: number }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort(), wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function text(value: unknown, maximum = 4_096): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum && !/[\u0000-\u001f\u007f]/u.test(value);
}

/** The exact settlement-champion field set (mirrors combatcore's `checkedChampion`), so the seal of an app champion and of the
 *  champion a registered plan carries are the same bytes. Anything else refuses. */
function sealedChampion(champion: CombatSettlementChampionV1): CombatSettlementChampionV1 {
  if (!isRecord(champion)) throw new TypeError('open-encounter champion is required');
  if (champion.kind === 'owned-fauna') {
    const genome = canonicalizeData(champion.genome) as CanonicalJsonObject;
    if (!isRecord(genome) || !Number.isSafeInteger(genome.seed) || genome.kingdom !== 'fauna') {
      throw new TypeError('open-encounter companion genome is invalid');
    }
    if (!text(champion.creatureId, 192) || !text(champion.name, 96) || typeof champion.legacyBredLineage !== 'boolean') {
      throw new TypeError('open-encounter companion is invalid');
    }
    return { kind: 'owned-fauna', creatureId: champion.creatureId, name: champion.name, genome: genome as never, legacyBredLineage: champion.legacyBredLineage };
  }
  if (champion.kind === 'player') {
    if (!text(champion.explorerId, 192) || !text(champion.name, 96) || !Number.isSafeInteger(champion.genomeSeed)
      || !Number.isSafeInteger(champion.currentHp) || champion.currentHp < 1 || !isRecord(champion.stats)) {
      throw new TypeError('open-encounter explorer is invalid');
    }
    return { kind: 'player', explorerId: champion.explorerId, name: champion.name, genomeSeed: champion.genomeSeed,
      stats: canonicalizeData(champion.stats) as never, currentHp: champion.currentHp };
  }
  throw new TypeError('open-encounter champion kind is invalid');
}

function memberId(champion: CombatSettlementChampionV1): string {
  return champion.kind === 'player' ? `player:${champion.explorerId}` : champion.creatureId;
}

/** The seal: battle identity + encounter + defender + the exact party in relay order. */
export function combatOpenEncounterSealDigestV1(input: Readonly<{
  battleId: string;
  encounterDigest: string;
  defenderGenome: unknown;
  party: readonly CombatPartyMemberInputV1[];
}>): string {
  return sha256Hex(canonicalJson({
    schema: COMBAT_OPEN_ENCOUNTER_SCHEMA_V1,
    battleId: input.battleId,
    encounterDigest: input.encounterDigest,
    defenderGenome: canonicalizeData(input.defenderGenome),
    party: input.party.map((member) => ({ champion: sealedChampion(member.champion), stance: member.stance })),
  }));
}

function engineFighter(member: CombatOpenEncounterMemberV1): EncounterFighterV1 {
  const c = member.champion;
  return c.kind === 'player'
    ? { name: c.name, genome: { seed: c.genomeSeed }, stats: c.stats as never, stance: member.stance }
    : { name: c.name, genome: c.genome as never, stance: member.stance };
}

/** Re-simulate the open fight from its seal and the decisions so far (a reload lands on the same pending Break). */
export function simulateCombatOpenEncounterV1(
  record: CombatOpenEncounterRecordV1,
  decisions: readonly EncounterDecisionV1[] = record.decisions,
): EncounterResultV1 {
  return runEncounterV1({
    mode: 'command',
    defender: { name: record.defenderName, genome: record.defenderGenome as never },
    party: record.party.map(engineFighter),
  }, decisions);
}

function validRecord(value: unknown): value is CombatOpenEncounterRecordV1 {
  if (!isRecord(value) || !exactKeys(value, ['battleId', 'decisions', 'defenderGenome', 'defenderName', 'encounterDigest',
    'openedAtReceiptOrdinal', 'party', 'sealDigest', 'worldKey'])) return false;
  if (!text(value.battleId, 192) || !text(value.defenderName, 96) || !text(value.worldKey, 2_048)
    || typeof value.encounterDigest !== 'string' || !DIGEST.test(value.encounterDigest)
    || typeof value.sealDigest !== 'string' || !DIGEST.test(value.sealDigest)
    || !Number.isSafeInteger(value.openedAtReceiptOrdinal) || (value.openedAtReceiptOrdinal as number) < 0
    || !isRecord(value.defenderGenome) || !Number.isSafeInteger(value.defenderGenome.seed)
    || !Array.isArray(value.party) || value.party.length < 1 || value.party.length > 3
    || !Array.isArray(value.decisions) || value.decisions.length > 16
    || !value.decisions.every((d) => (DECISIONS as readonly unknown[]).includes(d))) return false;
  try {
    const members = value.party as unknown[];
    for (const member of members) {
      if (!isRecord(member) || !exactKeys(member, ['champion', 'stance'])
        || !(STANCES as readonly unknown[]).includes(member.stance)) return false;
      if (canonicalJson(sealedChampion(member.champion as CombatSettlementChampionV1)) !== canonicalJson(member.champion)) return false;
    }
    const ids = (value.party as CombatOpenEncounterMemberV1[]).map((m) => memberId(m.champion));
    if (new Set(ids).size !== ids.length) return false;
    const record = value as unknown as CombatOpenEncounterRecordV1;
    if (combatOpenEncounterSealDigestV1({ battleId: record.battleId, encounterDigest: record.encounterDigest,
      defenderGenome: record.defenderGenome, party: record.party }) !== record.sealDigest) return false;
    // the appended decisions must all be answers the sealed fight actually offered (a forged row cannot pass)
    const simulated = simulateCombatOpenEncounterV1(record);
    return simulated.decisionsUsed === record.decisions.length;
  } catch {
    return false;
  }
}

function decodeCarrier(carrier: V5ExtensionCarrier): CombatOpenEncounterCarrierV1 | null {
  try {
    const canonical = canonicalizeData(JSON.parse(carrier.json)) as CanonicalJsonObject;
    if (!isRecord(canonical) || !exactKeys(canonical, ['schema', 'version', 'open'])
      || canonical.schema !== COMBAT_OPEN_ENCOUNTER_SCHEMA_V1 || canonical.version !== COMBAT_OPEN_ENCOUNTER_VERSION_V1
      || (canonical.open !== null && !validRecord(canonical.open))
      || JSON.stringify(canonical) !== carrier.json) return null;
    return canonical as unknown as CombatOpenEncounterCarrierV1;
  } catch {
    return null;
  }
}

/** Read the open Command fight. Absence = none open; a carrier in another segment, corrupt or from the future is PROTECTED (never
 *  downgraded to "none", which would let a tab escape an open fight). */
export function readCombatOpenEncounterV1(extensionsValue: unknown): CombatOpenEncounterReadOutcomeV1 {
  let extensions: V5Extensions;
  try { extensions = canonicalizeV5Extensions(extensionsValue); }
  catch { return Object.freeze({ kind: 'protected', reason: 'corrupt' }); }
  if (V5_SEGMENTS.some((segment) => segment !== COMBAT_OPEN_ENCOUNTER_SEGMENT_V1
    && extensions[segment]?.[COMBAT_OPEN_ENCOUNTER_NAMESPACE_V1] !== undefined)) {
    return Object.freeze({ kind: 'protected', reason: 'wrong-segment' });
  }
  const carrier = extensions.player?.[COMBAT_OPEN_ENCOUNTER_NAMESPACE_V1];
  if (carrier === undefined) return Object.freeze({ kind: 'loaded', record: null });
  if (carrier.version > COMBAT_OPEN_ENCOUNTER_VERSION_V1) {
    return Object.freeze({ kind: 'protected', reason: 'future-version', version: carrier.version });
  }
  const decoded = carrier.version === COMBAT_OPEN_ENCOUNTER_VERSION_V1 ? decodeCarrier(carrier) : null;
  return decoded === null
    ? Object.freeze({ kind: 'protected', reason: 'corrupt' })
    : Object.freeze({ kind: 'loaded', record: decoded.open });
}

export function combatOpenEncounterWriteV1(record: CombatOpenEncounterRecordV1 | null): V5ExtensionWrite {
  return Object.freeze({
    segment: COMBAT_OPEN_ENCOUNTER_SEGMENT_V1,
    namespace: COMBAT_OPEN_ENCOUNTER_NAMESPACE_V1,
    carrier: Object.freeze({
      version: COMBAT_OPEN_ENCOUNTER_VERSION_V1,
      json: canonicalJson({ schema: COMBAT_OPEN_ENCOUNTER_SCHEMA_V1, version: COMBAT_OPEN_ENCOUNTER_VERSION_V1, open: record }),
    }),
  });
}

/** Creature ids an open Command fight holds (its owned fighters): no other companion command may use them until it settles. */
export function combatOpenEncounterMemberIdsV1(extensions: unknown): readonly string[] | null {
  const read = readCombatOpenEncounterV1(extensions);
  if (read.kind !== 'loaded') return null;   // protected: callers must refuse, never treat as free
  return Object.freeze(read.record === null ? [] : read.record.party.flatMap((m) => (m.champion.kind === 'owned-fauna' ? [m.champion.creatureId] : [])));
}

export type CombatOpenEncounterRefusalV1 =
  | 'carrier-protected' | 'already-open' | 'not-open' | 'input-invalid' | 'no-break' | 'battle-mismatch'
  | 'decision-count-stale' | 'decision-not-offered' | 'fight-finished';

export class CombatOpenEncounterRefusal extends Error {
  constructor(readonly reason: CombatOpenEncounterRefusalV1) { super(`combat open encounter refused: ${reason}`); }
}

/** Derive the sealing receipt (for the generic F4 deterministic-action owner; the derivation holds exactly state/writes/witness —
 *  read the record back with `readCombatOpenEncounterV1`). Throws `CombatOpenEncounterRefusal` when refused. */
export function deriveCombatOpenEncounterOpenV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  receiptOrdinal: number;
  battleId: string;
  encounter: GuardianPrimeEncounterV1;
  party: readonly CombatPartyMemberInputV1[];
}>): F4OutcomeDerivation {
  const read = readCombatOpenEncounterV1(input.extensions);
  if (read.kind !== 'loaded') throw new CombatOpenEncounterRefusal('carrier-protected');
  if (read.record !== null) throw new CombatOpenEncounterRefusal('already-open');
  let record: CombatOpenEncounterRecordV1;
  try {
    if (!text(input.battleId, 192) || !Array.isArray(input.party) || input.party.length < 1 || input.party.length > 3) throw new Error();
    const party = input.party.map((m) => {
      if (!(STANCES as readonly unknown[]).includes(m.stance)) throw new Error('stance');
      return Object.freeze({ champion: sealedChampion(m.champion), stance: m.stance });
    });
    if (new Set(party.map((m) => memberId(m.champion))).size !== party.length) throw new Error('duplicate');
    const encounterDigest = sha256Hex(input.encounter.witness);
    const defenderGenome = canonicalizeData(input.encounter.defender.battleGenome) as CanonicalJsonObject;
    record = Object.freeze({
      battleId: input.battleId, encounterDigest, worldKey: input.encounter.identity.world.key,
      defenderName: input.encounter.defender.name, defenderGenome, party: Object.freeze(party),
      openedAtReceiptOrdinal: input.receiptOrdinal,
      sealDigest: combatOpenEncounterSealDigestV1({ battleId: input.battleId, encounterDigest, defenderGenome, party }),
      decisions: Object.freeze([]),
    });
  } catch {
    throw new CombatOpenEncounterRefusal('input-invalid');
  }
  let simulated: EncounterResultV1;
  try { simulated = simulateCombatOpenEncounterV1(record); } catch { throw new CombatOpenEncounterRefusal('input-invalid'); }
  // a fight with no Break has nothing to command: it settles directly (mode command, no decisions), with no record
  if (simulated.status !== 'paused') throw new CombatOpenEncounterRefusal('no-break');
  if (!validRecord(canonicalizeData(record))) throw new CombatOpenEncounterRefusal('input-invalid');
  return Object.freeze({
    state: input.draft,
    extensionWrites: Object.freeze([combatOpenEncounterWriteV1(record)]),
    witness: canonicalJson({ schema: COMBAT_OPEN_ENCOUNTER_SCHEMA_V1, op: 'open', battleIdDigest: sha256Hex(record.battleId), sealDigest: record.sealDigest }),
  });
}

/** Derive one appended Break decision. `expectedDecisions` is the count the pressing UI saw (a content CAS on top of the revision CAS). */
export function deriveCombatOpenEncounterDecisionV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  battleId: string;
  expectedDecisions: number;
  decision: EncounterDecisionV1;
}>): F4OutcomeDerivation {
  const read = readCombatOpenEncounterV1(input.extensions);
  if (read.kind !== 'loaded') throw new CombatOpenEncounterRefusal('carrier-protected');
  const open = read.record;
  if (open === null) throw new CombatOpenEncounterRefusal('not-open');
  if (open.battleId !== input.battleId) throw new CombatOpenEncounterRefusal('battle-mismatch');
  if (open.decisions.length !== input.expectedDecisions) throw new CombatOpenEncounterRefusal('decision-count-stale');
  if (simulateCombatOpenEncounterV1(open).status !== 'paused') throw new CombatOpenEncounterRefusal('fight-finished');
  const decisions = Object.freeze([...open.decisions, input.decision]);
  try { if (simulateCombatOpenEncounterV1(open, decisions).decisionsUsed !== decisions.length) throw new Error('unused'); }
  catch { throw new CombatOpenEncounterRefusal('decision-not-offered'); }
  const record: CombatOpenEncounterRecordV1 = Object.freeze({ ...open, decisions });
  return Object.freeze({
    state: input.draft,
    extensionWrites: Object.freeze([combatOpenEncounterWriteV1(record)]),
    witness: canonicalJson({ schema: COMBAT_OPEN_ENCOUNTER_SCHEMA_V1, op: 'decide', battleIdDigest: sha256Hex(open.battleId),
      sealDigest: open.sealDigest, ordinal: decisions.length, decision: input.decision }),
  });
}

/** The settlement's consumption rule. Returns the closing write, or null when no record is involved; throws on any mismatch.
 *  - A record is open: the plan must be the Command party it sealed (same battle id, encounter, party and stances), and its decisions
 *    must be the appended ones, optionally plus ONE final answer; the record closes in the settlement's CAS.
 *  - No record: a Command plan may settle only if it made no decision (a fight that never reached a Break). */
export function consumeCombatOpenEncounterV1(extensions: V5Extensions, plan: CombatSettlementPlanV1): V5ExtensionWrite | null {
  const read = readCombatOpenEncounterV1(extensions);
  if (read.kind !== 'loaded') throw new Error(`combat open encounter is ${read.reason}`);
  const open = read.record, command = plan.party?.mode === 'command';
  if (open === null) {
    if (command && plan.party!.decisions.length > 0) throw new Error('a Command settlement with decisions needs its open-encounter record');
    return null;
  }
  if (!command) throw new Error('an open Command encounter must be answered before another fight settles');
  const seal = combatOpenEncounterSealDigestV1({
    battleId: plan.battleId, encounterDigest: sha256Hex(plan.encounter.witness), defenderGenome: plan.encounter.defender.battleGenome,
    party: plan.party!.members.map((m) => ({ champion: m.champion, stance: m.stance })),
  });
  if (seal !== open.sealDigest) throw new Error('the Command settlement is not the sealed open encounter');
  const decisions = plan.party!.decisions;
  if (decisions.length < open.decisions.length || decisions.length > open.decisions.length + 1
    || open.decisions.some((d, i) => decisions[i] !== d)) {
    throw new Error('the Command settlement decisions are not the appended ones');
  }
  return combatOpenEncounterWriteV1(null);
}
