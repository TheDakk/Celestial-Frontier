import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MAX_OWNERSHIP_REVISION,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createLegacyProtectedOwnershipStateV1,
  createSpecimenLotV1,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type SpecimenLotId,
} from '../src/model.js';
import {
  BREED_ACTION_KIND_V2,
  LAST_USABLE_F4_RECEIPT_ORDINAL_V2,
  createBredAcquisitionRecordV2,
  createBredCreatureInstanceV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  migrateOwnershipStateV1ToV2,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  ownershipStateMirrorV2,
  registerOwnershipStateMirrorV2,
  type OwnershipStateContentsV2,
  type OwnershipStateV2,
} from '../src/model-v2.js';
import { sha256Hex } from '../src/canonical.js';
import { COMPANION_FEED_POLICY_V2 } from '../src/companion-care.js';
import { preflightArc5RestV1, settleArc5RestV1 } from '../src/rest.js';
import { projectCompanionAvailabilityV1 } from '../src/companion-availability.js';
/** Feed policy v2 (D13): the taste decides the gain (loved +2, +3 at flora tier ≥ 4; neutral +1; disliked 0). */
const policyGain = (t: { preference: 'loved' | 'neutral' | 'disliked'; floraTier: number }): number => { const r = COMPANION_FEED_POLICY_V2[t.preference]; return t.floraTier >= r.rareTier ? r.fedRare : r.fed; };
import {
  ARC5_FEED_ACTION_KIND_V1,
  preflightArc5FeedV1,
  settleArc5FeedV1,
} from '../src/feed.js';

interface Fixture {
  readonly state: OwnershipStateV2;
  readonly leftId: CreatureInstanceId;
  readonly twinId: CreatureInstanceId;
  readonly rightId: CreatureInstanceId;
  readonly floraLotId: SpecimenLotId;
  readonly fungiLotId: SpecimenLotId;
}

function fixture(input: Readonly<{
  fed?: number | null;
  quantity?: number;
  assignment?: { readonly kind: 'mission'; readonly missionId: string }
    | { readonly kind: 'recovery'; readonly readyAtActivePlayMs: number } | null;
}> = {}): Fixture {
  const leftIdentity = canonicalGenomeIdentityV1({ seed: 11, kingdom: 'fauna', form: 3 });
  const rightIdentity = canonicalGenomeIdentityV1({ seed: 22, kingdom: 'fauna', form: 7 });
  const floraIdentity = canonicalGenomeIdentityV1({ seed: 29, kingdom: 'flora', form: 1 });
  const fungiIdentity = canonicalGenomeIdentityV1({ seed: 31, kingdom: 'fungi', form: 2 });
  const identities = [leftIdentity, leftIdentity, rightIdentity, floraIdentity, fungiIdentity];
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `feed-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `feed-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index !== 1,
  }));
  const catalogue = [leftIdentity, rightIdentity, floraIdentity, fungiIdentity].map((identity, index) => (
    createCatalogSpeciesV1({
      identity,
      alias: null,
      firstObservationId: discoveries[[0, 2, 3, 4][index]!]!.recordId,
    })
  ));
  const leftId = ownershipContentId('creature', 'feed-left') as CreatureInstanceId;
  const twinId = ownershipContentId('creature', 'feed-twin') as CreatureInstanceId;
  const rightId = ownershipContentId('creature', 'feed-right') as CreatureInstanceId;
  const creature = (
    creatureId: CreatureInstanceId,
    identity: typeof leftIdentity,
    discoveryIndex: number,
    fed: number | null,
    assignment: { readonly kind: 'mission'; readonly missionId: string }
      | { readonly kind: 'recovery'; readonly readyAtActivePlayMs: number } | null = null,
  ) => createCreatureInstanceV1({
    creatureId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: null,
    origin: 'legacy',
    acquisitionRecordId: discoveries[discoveryIndex]!.recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: null,
    hurt: 0.4,
    fed,
    brood: null,
    assignment,
    bond: null,
  });
  const floraLotId = ownershipContentId('specimen', 'feed-flora') as SpecimenLotId;
  const fungiLotId = ownershipContentId('specimen', 'feed-fungi') as SpecimenLotId;
  const source = createInitialOwnershipStateV1({
    catalogSpecies: catalogue,
    discoveries,
    creatures: [
      creature(
        leftId,
        leftIdentity,
        0,
        input.fed === undefined ? 19 : input.fed,
        input.assignment ?? null,
      ),
      creature(twinId, leftIdentity, 1, 91),
      creature(rightId, rightIdentity, 2, 30),
    ],
    specimenLots: [
      createSpecimenLotV1({
        lotId: floraLotId,
        speciesId: floraIdentity.speciesId,
        kind: 'flora',
        quantity: input.quantity ?? 2,
        origin: 'legacy',
        acquisitionRecordId: discoveries[3]!.recordId,
      }),
      createSpecimenLotV1({
        lotId: fungiLotId,
        speciesId: fungiIdentity.speciesId,
        kind: 'fungi',
        quantity: 4,
        origin: 'legacy',
        acquisitionRecordId: discoveries[4]!.recordId,
      }),
    ],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: leftId,
  });
  return Object.freeze({
    state: migrateOwnershipStateV1ToV2(source),
    leftId,
    twinId,
    rightId,
    floraLotId,
    fungiLotId,
  });
}

function contents(state: OwnershipStateV2): OwnershipStateContentsV2 {
  return {
    source: ownershipSourceStateV1(state),
    bredAcquisitions: state.bredAcquisitions,
    creatures: state.creatures,
    creatureTombstones: state.creatureTombstones,
    specimenLots: state.specimenLots,
    specimenTombstones: state.specimenTombstones,
    scoutCreatureId: state.scoutCreatureId,
  };
}

function ready(f: Fixture, creatureId = f.leftId) {
  const outcome = preflightArc5FeedV1(f.state, {
    creatureId,
    foodLotId: f.floraLotId,
  });
  if (outcome.kind !== 'ready') throw new Error(`feed fixture refused: ${outcome.reason}`);
  return outcome.preflight;
}

describe('@cf/domain-acquisition — Arc 5 feed authority', () => {
  it('updates one exact twin nonlethally, consumes one flora, and preserves the exact V1 source', () => {
    const f = fixture();
    const parentSource = ownershipSourceStateV1(f.state);
    const before = f.state.creatures.find((row) => row.creatureId === f.leftId)!;
    const twinBefore = f.state.creatures.find((row) => row.creatureId === f.twinId)!;
    const pre = ready(f), settlement = settleArc5FeedV1(pre, 9);

    expect(settlement.successor.revision).toBe(f.state.revision + 1);
    expect(ownershipSourceStateV1(settlement.successor)).toBe(parentSource);
    expect(settlement.creatureBefore).toBe(before);
    expect(settlement.creatureAfter).toMatchObject({
      creatureId: f.leftId,
      fed: 19 + policyGain(pre.taste),
      assignment: null,
    });
    expect(settlement.successor.creatures.find((row) => row.creatureId === f.twinId))
      .toBe(twinBefore);
    expect(settlement.successor.creatures).toHaveLength(f.state.creatures.length);
    expect(settlement.foodBefore.quantity).toBe(2);
    expect(settlement.foodAfter?.quantity).toBe(1);
    expect(settlement.foodTombstone).toBeNull();
    expect(settlement.receiptEvidence).toEqual({
      ordinal: 9,
      actionKind: ARC5_FEED_ACTION_KIND_V1,
      witnessDigest: sha256Hex(settlement.witness),
    });
    expect(Object.isFrozen(settlement)).toBe(true);
    expect(Object.isFrozen(settlement.preflight)).toBe(true);
    expect(Object.isFrozen(settlement.successor)).toBe(true);
    expect(Object.isFrozen(settlement.successor.creatures)).toBe(true);
  });

  it('tombstones the exact last specimen when the meal exhausts its lot', () => {
    const f = fixture({ quantity: 1 });
    const settlement = settleArc5FeedV1(ready(f), 12);
    expect(settlement.foodAfter).toBeNull();
    expect(settlement.successor.specimenLots.some((row) => row.lotId === f.floraLotId)).toBe(false);
    expect(settlement.foodTombstone).toMatchObject({
      kind: 'specimen-lot',
      lotId: f.floraLotId,
      snapshot: settlement.foodBefore,
      disposition: settlement.receiptEvidence,
    });
    expect(settlement.successor.specimenTombstones).toContain(settlement.foodTombstone);
  });

  it('is deterministic for equivalent plans and advances no random or temporal authority', () => {
    const first = fixture();
    const second = fixture();
    const left = settleArc5FeedV1(ready(first), 31);
    const right = settleArc5FeedV1(ready(second), 31);
    expect(left.witness).toBe(right.witness);
    expect(left.receiptEvidence).toEqual(right.receiptEvidence);
    expect(ownershipStateDigestV2(left.successor)).toBe(ownershipStateDigestV2(right.successor));
    expect(left.preflight.fedAfter - left.preflight.fedBefore).toBe(policyGain(left.preflight.taste));
  });

  it('preserves one-time bred-child inheritance while later feeding targets only that child', () => {
    const f = fixture({ fed: 80 });
    const receipt = createF4ReceiptEvidenceV2({
      ordinal: 40,
      actionKind: BREED_ACTION_KIND_V2,
      witnessDigest: sha256Hex('feed-child-breed'),
    });
    const childGenome = { seed: 77, kingdom: 'fauna', form: 9, gen: 1, parents: [11, 22] };
    const childIdentity = canonicalGenomeIdentityV1(childGenome);
    const acquisition = createBredAcquisitionRecordV2({
      speciesId: childIdentity.speciesId,
      parentCreatureIds: [f.leftId, f.rightId],
      parentSeeds: [11, 22],
      receipt,
    });
    const child = createBredCreatureInstanceV2({
      acquisition,
      genome: childGenome,
      generation: 1,
      nickname: null,
      xp: null,
      hurt: null,
      fed: 199,
      brood: null,
      assignment: null,
      bond: null,
    });
    const bred = createOwnershipSuccessorV2(f.state, {
      ...contents(f.state),
      bredAcquisitions: [acquisition],
      creatures: [...f.state.creatures, child],
    });
    const inherited = bred.creatures.find((row) => row.creatureId === child.creatureId)!;
    expect(inherited.fed).toBe(15);
    const food = bred.specimenLots.find((row) => row.lotId === f.floraLotId)!;
    const preflight = preflightArc5FeedV1(bred, {
      creatureId: inherited.creatureId,
      foodLotId: food.lotId,
    });
    if (preflight.kind !== 'ready') throw new Error(preflight.reason);
    const fed = settleArc5FeedV1(preflight.preflight, 41);
    expect(fed.creatureAfter.fed).toBe(15 + policyGain(preflight.preflight.taste));
    expect(fed.successor.creatures.find((row) => row.creatureId === f.leftId)?.fed).toBe(80);
    expect(fed.successor.creatures.find((row) => row.creatureId === f.rightId)?.fed).toBe(30);
  });

  it('refuses cap, assignment, missing identities, non-flora, protection, and revision exhaustion', () => {
    const capped = fixture({ fed: 200 });
    expect(preflightArc5FeedV1(capped.state, {
      creatureId: capped.leftId, foodLotId: capped.floraLotId,
    })).toEqual({ kind: 'refused', reason: 'creature-fed-cap' });
    const assigned = fixture({ assignment: { kind: 'mission', missionId: 'away-1' } });
    expect(preflightArc5FeedV1(assigned.state, {
      creatureId: assigned.leftId, foodLotId: assigned.floraLotId,
    })).toEqual({ kind: 'refused', reason: 'creature-assigned' });
    // Recovery locks breed/combat/dispatch only: a recovering (or recovered) parent eats and keeps its Recovery
    for (const readyAtActivePlayMs of [0, 480_000]) {
      const recovering = fixture({ assignment: { kind: 'recovery', readyAtActivePlayMs } });
      const meal = preflightArc5FeedV1(recovering.state, {
        creatureId: recovering.leftId, foodLotId: recovering.floraLotId,
      });
      if (meal.kind !== 'ready') throw new Error(`recovery refused a meal: ${meal.reason}`);
      expect(settleArc5FeedV1(meal.preflight, 41).creatureAfter.assignment)
        .toEqual({ kind: 'recovery', readyAtActivePlayMs });
    }
    const ordinary = fixture();
    expect(preflightArc5FeedV1(ordinary.state, {
      creatureId: ownershipContentId('creature', 'absent') as CreatureInstanceId,
      foodLotId: ordinary.floraLotId,
    })).toEqual({ kind: 'refused', reason: 'creature-not-found' });
    expect(preflightArc5FeedV1(ordinary.state, {
      creatureId: ordinary.leftId,
      foodLotId: ownershipContentId('specimen', 'absent') as SpecimenLotId,
    })).toEqual({ kind: 'refused', reason: 'food-not-found' });
    expect(preflightArc5FeedV1(ordinary.state, {
      creatureId: ordinary.leftId, foodLotId: ordinary.fungiLotId,
    })).toEqual({ kind: 'refused', reason: 'food-not-flora' });

    const protectedV1 = createLegacyProtectedOwnershipStateV1({
      schema: 'cf-v1.8.9-ownership-source/v1',
      digest: sha256Hex('protected-feed-source'),
      jsonBytes: 10,
      codexRows: 1,
      uniqueSpecies: 1,
      bioXRows: 0,
      scoutCodexId: null,
    });
    const protectedV2 = migrateOwnershipStateV1ToV2(protectedV1);
    expect(preflightArc5FeedV1(protectedV2, {
      creatureId: ordinary.leftId, foodLotId: ordinary.floraLotId,
    })).toEqual({ kind: 'refused', reason: 'ownership-protected' });

    const exhausted = registerOwnershipStateMirrorV2({
      ...ownershipStateMirrorV2(ordinary.state),
      revision: MAX_OWNERSHIP_REVISION,
    }, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(preflightArc5FeedV1(exhausted, {
      creatureId: ordinary.leftId, foodLotId: ordinary.floraLotId,
    })).toEqual({ kind: 'refused', reason: 'ownership-revision-exhausted' });
  });

  it('rejects forged/accessor inputs and forged or exhausted settlement authority', () => {
    const f = fixture();
    let touched = false;
    const hostile: Record<string, unknown> = { foodLotId: f.floraLotId };
    Object.defineProperty(hostile, 'creatureId', {
      enumerable: true,
      get() { touched = true; return f.leftId; },
    });
    expect(preflightArc5FeedV1(
      f.state,
      hostile as unknown as { creatureId: CreatureInstanceId; foodLotId: SpecimenLotId },
    )).toEqual({ kind: 'refused', reason: 'input-invalid' });
    expect(touched).toBe(false);
    expect(() => settleArc5FeedV1({ ...ready(f) }, 1)).toThrow(/owner-minted/u);
    expect(() => settleArc5FeedV1(ready(f), LAST_USABLE_F4_RECEIPT_ORDINAL_V2 + 1))
      .toThrow(/exhausted/u);
  });

  it('contains no ambient entropy, clock, or mutable-global dependency', () => {
    const source = readFileSync(new URL('../src/feed.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.|performance\.|globalThis|window\.|document\./u);
  });

  it('D13 Feed policy v2: a meal mends by taste, pays first-time XP once and stamps its bond memories with the committed active-play time; a repeat pays nothing', () => {
    const f = fixture();
    const before = f.state.creatures.find((row) => row.creatureId === f.leftId)!;
    const pre = ready(f), first = settleArc5FeedV1(pre, 9, 42_000);
    const mend = COMPANION_FEED_POLICY_V2[pre.taste.preference].mend;
    expect(first.creatureAfter.hurt).toBeCloseTo(Math.max(0, (before.hurt ?? 0) - mend), 6);
    expect(first.creatureAfter.xp).toBe((before.xp ?? 0) + 3); // +1 first meal, +2 first taste of this flavour
    expect(first.creatureAfter.bond?.memories.map((m) => [m.id, m.atActivePlayMs])).toEqual([['meal:first', 42_000], [`taste:${pre.taste.flavour}`, 42_000]]);
    expect(first.witness).toContain('"activePlayMs":42000');
    // the same flavour again: no XP, no new memory, bond unchanged
    const again = preflightArc5FeedV1(first.successor, { creatureId: f.leftId, foodLotId: f.floraLotId });
    if (again.kind !== 'ready') throw new Error(again.reason);
    const second = settleArc5FeedV1(again.preflight, 10, 99_000);
    expect(second.creatureAfter.xp).toBe(first.creatureAfter.xp);
    expect(second.creatureAfter.bond).toEqual(first.creatureAfter.bond);
    // control: a companion AWAY on a mission is still refused
    const away = fixture({ assignment: { kind: 'mission', missionId: 'm-1' } });
    expect(preflightArc5FeedV1(away.state, { creatureId: away.leftId, foodLotId: away.floraLotId })).toEqual({ kind: 'refused', reason: 'creature-assigned' });
  });
});

describe('D13 Rest — heals on the active-play clock (sealed heal, locked until the exact boundary)', () => {
  it('a wounded companion rests 2 active minutes per 0.1 hurt: healed now, locked until readyAt, the first recovery from Injured is a memory', () => {
    const f = fixture();
    const pre = preflightArc5RestV1(f.state, { creatureId: f.leftId }, 1_000);
    if (pre.kind !== 'ready') throw new Error(pre.reason);
    expect(pre.preflight.durationActivePlayMs).toBe(8 * 60_000); // hurt 0.4 → 4 tenths → 8 minutes
    const rest = settleArc5RestV1(pre.preflight, 3, 1_000);
    expect(rest.readyAtActivePlayMs).toBe(481_000);
    expect(rest.creatureAfter).toMatchObject({ hurt: 0, assignment: { kind: 'mission', missionId: 'rest:481000' } });
    expect(rest.creatureAfter.bond?.memories.map((m) => [m.id, m.atActivePlayMs])).toEqual([['recovered:injured', 1_000]]);
    const row = rest.successor.creatures.find((c) => c.creatureId === f.leftId)!;
    expect(projectCompanionAvailabilityV1(row, 480_999)).toMatchObject({ rested: false, restRemainingActivePlayMs: 1, blocks: { breed: true, combat: true, dispatch: true } });
    expect(projectCompanionAvailabilityV1(row, 481_000)).toMatchObject({ rested: true, assignment: null, blocks: { breed: false, combat: false, dispatch: false } });
    // Feed obeys the same boundary: refused one ms early, eaten at the boundary; without a clock the stored lock holds
    const food = { creatureId: f.leftId, foodLotId: f.floraLotId };
    expect(preflightArc5FeedV1(rest.successor, food, 480_999)).toEqual({ kind: 'refused', reason: 'creature-assigned' });
    expect(preflightArc5FeedV1(rest.successor, food, 481_000).kind).toBe('ready');
    expect(preflightArc5FeedV1(rest.successor, food)).toEqual({ kind: 'refused', reason: 'creature-assigned' });
    // resting again while resting is refused; once rested and healthy there is nothing to rest
    expect(preflightArc5RestV1(rest.successor, { creatureId: f.leftId }, 2_000)).toEqual({ kind: 'refused', reason: 'creature-assigned' });
    expect(preflightArc5RestV1(rest.successor, { creatureId: f.leftId }, 481_000)).toEqual({ kind: 'refused', reason: 'creature-healthy' });
  });
  it('control: an ordinary mission never expires through the projector, and a malformed rest id is an ordinary mission', () => {
    for (const missionId of ['m-1', 'rest:', 'rest:1e3', 'rest:-5']) {
      expect(projectCompanionAvailabilityV1({ assignment: { kind: 'mission', missionId } }, 9_000_000)).toMatchObject({ rested: false, blocks: { breed: true } });
    }
  });
});
