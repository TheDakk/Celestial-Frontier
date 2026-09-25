/* Friendly duel persistence (v1.8.9 parity; §20 order item 2).

   One duel = one deterministic F4 receipt (`friendly-duel`). The derive applies v1.8.9's ledger at the COMMITTED active-play clock:
   `stats.duels` +1 always; a counted win pays `stats.duelwins` +1 and +8 XP; a counted loss/draw pays 2 (3 if taken to the wire)
   participation XP. Each credit has its own 30 s ACTIVE-PLAY window (v1's wall-clock throttle, moved off the device clock), persisted in
   `player/combat.friendly-duels` so a reload cannot reopen it. XP lands on the Arc 5 companion (one ownership successor) and its v4
   Compendium mirror row. Nobody is wounded and nothing is removed. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  canonicalizeData,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  sha256Hex,
  type CanonicalJsonObject,
  type CreatureInstanceV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { friendlyDuelCompanionMatchesV1, prepareFriendlyDuelOwnershipV1 } from '@cf/domain-acquisition/friendly-duel-internal';
import { projectCompanionAvailabilityV1 } from '@cf/domain-acquisition/companion-availability';
import { combatOpenEncounterMemberIdsV1 } from './combat-open-encounter.js';
import { friendlyDuelCreditV1, type FriendlyDuelPlanV1 } from '@cf/domain-combatcore';
import { prepareArc5OwnershipV2Successor, readArc5OwnershipMigration } from './arc5-ownership-migration.js';
import type { SaveStateV2 } from './import-v2.js';
import {
  V5_SEGMENTS,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  type V5ExtensionWrite,
  type V5Extensions,
} from './migration-v5.js';
import type { F4OutcomeDerivation } from './outcome-transaction.js';

export const FRIENDLY_DUEL_OPERATION_V1 = 'friendly-duel' as const;
export const FRIENDLY_DUEL_LEDGER_SCHEMA_V1 = 'cf-v2-friendly-duel-ledger/v1' as const;
export const FRIENDLY_DUEL_LEDGER_NAMESPACE_V1 = 'combat.friendly-duels' as const;
const VERSION = 1 as const;

export interface FriendlyDuelLedgerV1 {
  readonly lastWinCreditAt: number | null;
  readonly lastParticipationAt: number | null;
}
export type FriendlyDuelLedgerReadV1 =
  | Readonly<{ kind: 'loaded'; ledger: FriendlyDuelLedgerV1 }>
  | Readonly<{ kind: 'protected'; reason: 'wrong-segment' | 'corrupt' | 'future-version' }>;

const clock = (value: unknown): value is number | null => value === null || (Number.isSafeInteger(value) && (value as number) >= 0);

export function readFriendlyDuelLedgerV1(extensionsValue: unknown): FriendlyDuelLedgerReadV1 {
  let extensions: V5Extensions;
  try { extensions = canonicalizeV5Extensions(extensionsValue); } catch { return Object.freeze({ kind: 'protected', reason: 'corrupt' }); }
  if (V5_SEGMENTS.some((segment) => segment !== 'player' && extensions[segment]?.[FRIENDLY_DUEL_LEDGER_NAMESPACE_V1] !== undefined)) {
    return Object.freeze({ kind: 'protected', reason: 'wrong-segment' });
  }
  const carrier = extensions.player?.[FRIENDLY_DUEL_LEDGER_NAMESPACE_V1];
  if (carrier === undefined) return Object.freeze({ kind: 'loaded', ledger: Object.freeze({ lastWinCreditAt: null, lastParticipationAt: null }) });
  if (carrier.version > VERSION) return Object.freeze({ kind: 'protected', reason: 'future-version' });
  try {
    const value = canonicalizeData(JSON.parse(carrier.json)) as CanonicalJsonObject;
    const keys = Object.keys(value).sort().join(',');
    if (carrier.version !== VERSION || keys !== 'lastParticipationAt,lastWinCreditAt,schema' || value.schema !== FRIENDLY_DUEL_LEDGER_SCHEMA_V1
      || !clock(value.lastWinCreditAt) || !clock(value.lastParticipationAt) || JSON.stringify(value) !== carrier.json) {
      return Object.freeze({ kind: 'protected', reason: 'corrupt' });
    }
    return Object.freeze({ kind: 'loaded', ledger: Object.freeze({ lastWinCreditAt: value.lastWinCreditAt as number | null,
      lastParticipationAt: value.lastParticipationAt as number | null }) });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'corrupt' });
  }
}

function ledgerWrite(ledger: FriendlyDuelLedgerV1): V5ExtensionWrite {
  return Object.freeze({ segment: 'player', namespace: FRIENDLY_DUEL_LEDGER_NAMESPACE_V1, carrier: Object.freeze({
    version: VERSION, json: canonicalJson({ schema: FRIENDLY_DUEL_LEDGER_SCHEMA_V1, ...ledger }) }) });
}

function legacyCodexId(ownership: OwnershipStateV2, creature: CreatureInstanceV1): string {
  const acquisition = ownership.acquisitions.find((row) => row.recordId === creature.acquisitionRecordId);
  if (acquisition?.acquisition === 'legacy' && acquisition.provenance.kind === 'legacy') return acquisition.provenance.legacyCodexId;
  return `s${creature.genome.seed}`;
}

/** The credit this duel WOULD earn at `activePlayMs` (the card's preview); the derive recomputes it at the committed clock. */
export function projectFriendlyDuelCreditV1(extensions: unknown, plan: FriendlyDuelPlanV1, activePlayMs: number) {
  const read = readFriendlyDuelLedgerV1(extensions);
  if (read.kind !== 'loaded') return null;
  return friendlyDuelCreditV1({ winner: plan.winner, close: plan.close, activePlayMs, ...read.ledger });
}

/** Derive one friendly duel for the generic F4 deterministic owner (exactly state / writes / witness). Throws on any refusal. */
export function deriveFriendlyDuelV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  receiptOrdinal: number;
  activePlayMs: number;
  plan: FriendlyDuelPlanV1;
  ownershipV2: OwnershipStateV2;
}>): F4OutcomeDerivation {
  const { draft, plan } = input;
  const read = readFriendlyDuelLedgerV1(input.extensions);
  if (read.kind !== 'loaded') throw new Error(`friendly duel ledger is ${read.reason}`);
  if (!isOwnershipStateV2(input.ownershipV2)) throw new Error('friendly duel needs registered ownership');
  const durable = readArc5OwnershipMigration(input.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (durable.kind !== 'loaded' || ownershipStateDigestV2(durable.state) !== ownershipStateDigestV2(input.ownershipV2)) {
    throw new Error('friendly duel ownership is stale or protected');
  }
  /* a duel is combat: a companion in an unfinished Recovery, on a mission, or held by an open Command fight cannot duel */
  const row = input.ownershipV2.creatures.find((c) => c.creatureId === plan.mine.creatureId);
  if (row === undefined || row.genome.exhibit === true) throw new Error('friendly duel companion is not owned');
  if (projectCompanionAvailabilityV1(row, input.activePlayMs).blocks.combat) throw new Error('friendly duel companion is on assignment');
  const held = combatOpenEncounterMemberIdsV1(input.extensions);
  if (held === null || held.includes(row.creatureId)) throw new Error('friendly duel companion is held by an open Command fight');
  const credit = friendlyDuelCreditV1({ winner: plan.winner, close: plan.close, activePlayMs: input.activePlayMs, ...read.ledger });
  let working = input.extensions;
  if (credit.xp > 0) {
    const prepared = prepareFriendlyDuelOwnershipV1(input.ownershipV2, { creatureId: plan.mine.creatureId, genome: plan.mine.genome, xpDelta: credit.xp });
    if (prepared.kind !== 'prepared') throw new Error(`friendly duel companion refused ${prepared.reason}`);
    const successor = prepareArc5OwnershipV2Successor({ baseExtensions: working, parent: input.ownershipV2, successor: prepared.successor,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
    if (successor.kind !== 'prepared') throw new Error(`friendly duel Arc 5 carrier refused ${successor.reason}`);
    working = successor.extensions;
    const id = legacyCodexId(input.ownershipV2, prepared.creatureBefore);
    draft.codex = draft.codex.map(([rowId, entry]) => (rowId === id ? [rowId, { ...entry, g: { ...entry.g, xp: prepared.creatureAfter.xp ?? 0 } }] : [rowId, entry]));
  } else if (!friendlyDuelCompanionMatchesV1(row, plan.mine.genome)) {
    // a cooldown bout still proves the fight used the companion's exact stored genome
    throw new Error('friendly duel companion refused companion-source-mismatch');
  }
  const stats = draft.stats as Record<string, number>;
  stats.duels = (stats.duels ?? 0) + 1;
  if (credit.duelWin) stats.duelwins = (stats.duelwins ?? 0) + 1;
  const ledger: FriendlyDuelLedgerV1 = Object.freeze({
    lastWinCreditAt: credit.kind === 'win' ? input.activePlayMs : read.ledger.lastWinCreditAt,
    lastParticipationAt: credit.kind === 'participation' ? input.activePlayMs : read.ledger.lastParticipationAt,
  });
  working = applyV5ExtensionWrites(working, [ledgerWrite(ledger)]).extensions;
  const writes: V5ExtensionWrite[] = [];
  for (const segment of V5_SEGMENTS) {
    const before = input.extensions[segment] ?? {}, after = working[segment] ?? {};
    for (const namespace of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const carrier = after[namespace];
      const prior = before[namespace];
      if (carrier !== undefined && (prior === undefined || canonicalJson(carrier) !== canonicalJson(prior))) writes.push(Object.freeze({ segment, namespace, carrier }));
    }
  }
  return Object.freeze({
    state: draft,
    extensionWrites: Object.freeze(writes),
    witness: canonicalJson({ schema: 'cf-v2-friendly-duel-witness/v1', receiptOrdinal: input.receiptOrdinal,
      companionDigest: sha256Hex(plan.mine.creatureId), codeDigest: sha256Hex(plan.code), winner: plan.winner, credit: credit.kind, xp: credit.xp }),
  });
}
