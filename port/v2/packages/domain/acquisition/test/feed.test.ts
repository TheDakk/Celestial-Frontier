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
import {
  ARC5_FEED_ACTION_KIND_V1,
  ARC5_FEED_INCREMENT_V1,
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
  assignment?: { readonly kind: 'mission'; readonly missionId: string } | null;
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
    assignment: { readonly kind: 'mission'; readonly missionId: string } | null = null,
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
    const settlement = settleArc5FeedV1(ready(f), 9);

    expect(settlement.successor.revision).toBe(f.state.revision + 1);
    expect(ownershipSourceStateV1(settlement.successor)).toBe(parentSource);
    expect(settlement.creatureBefore).toBe(before);
    expect(settlement.creatureAfter).toMatchObject({
      creatureId: f.leftId,
      fed: 20,
      hurt: before.hurt,
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
    expect(left.preflight.fedAfter - left.preflight.fedBefore).toBe(ARC5_FEED_INCREMENT_V1);
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
    expect(fed.creatureAfter.fed).toBe(16);
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
});
