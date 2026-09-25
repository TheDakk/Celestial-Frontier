/* Friendly duel (v1.8.9 parity, §20 order item 2): the ownership side.

   A friendly duel only ever ADDS class XP to your own companion (+8 for a counted win, 2–3 participation XP for a counted loss/draw).
   Nobody is wounded, nothing is removed, no assignment changes. This narrow bridge proves the duelling companion is the exact current
   Arc 5 creature the pure plan fought with, then mints the one ownership successor persistence commits. */
import { MAX_OWNERSHIP_REVISION, canonicalGenomeIdentityV1, type CreatureInstanceV1 } from './model.js';
import { canonicalJson } from './canonical.js';
import {
  createCreatureInstanceV2,
  createOwnershipSuccessorV2,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  type OwnershipStateV2,
} from './model-v2.js';
import type { Genome } from '@cf/domain-genome';

/** v1's class-XP ceiling (6 × 81, level 9) — the same bound the combat bridge enforces. */
const XP_MAX = 486;

export type FriendlyDuelOwnershipRefusalV1 =
  | 'ownership-invalid' | 'ownership-protected' | 'ownership-revision-exhausted'
  | 'companion-not-found' | 'companion-source-mismatch' | 'companion-exhibit' | 'xp-invalid';

export type FriendlyDuelOwnershipPreparationV1 =
  | Readonly<{ kind: 'prepared'; creatureBefore: CreatureInstanceV1; creatureAfter: CreatureInstanceV1; successor: OwnershipStateV2; successorDigest: string }>
  | Readonly<{ kind: 'refused'; reason: FriendlyDuelOwnershipRefusalV1 }>;

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

/** Does this stored companion row hold exactly the genome (and xp/hurt) the duel was fought with? */
export function friendlyDuelCompanionMatchesV1(row: CreatureInstanceV1, genome: Readonly<Genome>): boolean {
  try {
    const identity = canonicalGenomeIdentityV1(genome as Genome);
    return row.speciesId === identity.speciesId && row.genomeIdentity === identity.genomeIdentity
      && canonicalJson(row.genome) === canonicalJson(identity.genome)
      && (row.xp ?? 0) === num(genome.xp) && (row.hurt ?? 0) === num(genome.hurt);
  } catch {
    return false;
  }
}

export function prepareFriendlyDuelOwnershipV1(
  parent: OwnershipStateV2,
  input: Readonly<{ creatureId: string; genome: Readonly<Genome>; xpDelta: number }>,
): FriendlyDuelOwnershipPreparationV1 {
  const refused = (reason: FriendlyDuelOwnershipRefusalV1): FriendlyDuelOwnershipPreparationV1 => Object.freeze({ kind: 'refused', reason });
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  if (parent.revision === MAX_OWNERSHIP_REVISION) return refused('ownership-revision-exhausted');
  const creature = parent.creatures.find((row) => row.creatureId === input.creatureId);
  if (creature === undefined) return refused('companion-not-found');
  if (creature.genome.exhibit === true) return refused('companion-exhibit');
  if (!friendlyDuelCompanionMatchesV1(creature, input.genome)) return refused('companion-source-mismatch');
  if (!Number.isSafeInteger(input.xpDelta) || input.xpDelta < 1) return refused('xp-invalid');
  const xpAfter = Math.min(XP_MAX, (creature.xp ?? 0) + input.xpDelta);
  try {
    const creatureAfter = createCreatureInstanceV2({ ...creature, xp: xpAfter });
    const successor = createOwnershipSuccessorV2(parent, {
      source: ownershipSourceStateV1(parent),
      bredAcquisitions: parent.bredAcquisitions,
      creatures: parent.creatures.map((row) => (row.creatureId === creature.creatureId ? creatureAfter : row)),
      creatureTombstones: parent.creatureTombstones,
      specimenLots: parent.specimenLots,
      specimenTombstones: parent.specimenTombstones,
      scoutCreatureId: parent.scoutCreatureId,
    });
    return Object.freeze({ kind: 'prepared', creatureBefore: creature, creatureAfter, successor, successorDigest: ownershipStateDigestV2(successor) });
  } catch {
    return refused('xp-invalid');
  }
}
