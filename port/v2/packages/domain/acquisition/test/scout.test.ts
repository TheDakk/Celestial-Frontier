import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
} from '../src/model.js';
import {
  migrateOwnershipStateV1ToV2,
  ownershipStateDigestV2,
  type OwnershipStateV2,
} from '../src/model-v2.js';
import {
  preflightArc5ScoutV1,
  settleArc5ScoutV1,
} from '../src/scout.js';

function fixture(exhibit = false): Readonly<{
  state: OwnershipStateV2;
  leftId: CreatureInstanceId;
  rightId: CreatureInstanceId;
}> {
  const identity = canonicalGenomeIdentityV1({
    ...makeGenome(1_205, 'fauna', 0.54),
    ...(exhibit ? { exhibit: true } : {}),
  });
  const discoveries = [0, 1].map((index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `scout-twins-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `scout-twins-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const leftId = ownershipContentId('creature', 'scout-left') as CreatureInstanceId;
  const rightId = ownershipContentId('creature', 'scout-right') as CreatureInstanceId;
  const creature = (
    creatureId: CreatureInstanceId,
    nickname: string,
    acquisitionRecordId: DiscoveryRecordId,
  ) => createCreatureInstanceV1({
    creatureId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname,
    origin: 'legacy',
    acquisitionRecordId,
    lineage: { kind: 'none', generation: identity.genome.gen as number },
    xp: creatureId === leftId ? 17 : 9,
    hurt: creatureId === leftId ? 0.8 : 0,
    fed: 7,
    brood: 3,
    assignment: creatureId === leftId
      ? { kind: 'recovery', readyAtActivePlayMs: 99_000 }
      : { kind: 'mission', missionId: 'scout-mission' },
    bond: null,
  });
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: 'Shared species alias',
      firstObservationId: discoveries[0]!.recordId,
    })],
    discoveries,
    creatures: [
      creature(leftId, 'Alpha', discoveries[0]!.recordId),
      creature(rightId, 'Beta', discoveries[1]!.recordId),
    ],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  return Object.freeze({ state: migrateOwnershipStateV1ToV2(source), leftId, rightId });
}

describe('@cf/domain-acquisition — Arc 5 Field Scout authority', () => {
  it('names one exact assigned or injured twin and changes only the Scout pointer', () => {
    const value = fixture();
    const preflight = preflightArc5ScoutV1(value.state, {
      scoutCreatureId: value.leftId,
    });
    if (preflight.kind !== 'ready') throw new Error(`Field Scout refused: ${preflight.reason}`);
    const settled = settleArc5ScoutV1(preflight.preflight, 8);
    expect(settled.preflight).toMatchObject({
      scoutBefore: null,
      scoutAfter: value.leftId,
    });
    expect(settled.receiptEvidence).toMatchObject({
      ordinal: 8,
      actionKind: 'field-scout',
    });
    expect(settled.successor.scoutCreatureId).toBe(value.leftId);
    expect(settled.successor.creatures).toEqual(value.state.creatures);
    expect(settled.successor.catalogSpecies).toEqual(value.state.catalogSpecies);
    expect(settled.successor.acquisitions).toEqual(value.state.acquisitions);
    expect(settled.successor.specimenLots).toEqual(value.state.specimenLots);
    expect(settled.successor.revision).toBe(value.state.revision + 1);
    expect(ownershipStateDigestV2(settled.successor)).not.toBe(
      ownershipStateDigestV2(value.state),
    );
  });

  it('switches exact same-species twins and then stands the Scout down', () => {
    const value = fixture();
    const first = preflightArc5ScoutV1(value.state, { scoutCreatureId: value.leftId });
    if (first.kind !== 'ready') throw new Error(`first Scout refused: ${first.reason}`);
    const named = settleArc5ScoutV1(first.preflight, 10).successor;
    const second = preflightArc5ScoutV1(named, { scoutCreatureId: value.rightId });
    if (second.kind !== 'ready') throw new Error(`second Scout refused: ${second.reason}`);
    const switched = settleArc5ScoutV1(second.preflight, 11).successor;
    expect(switched.scoutCreatureId).toBe(value.rightId);
    const third = preflightArc5ScoutV1(switched, { scoutCreatureId: null });
    if (third.kind !== 'ready') throw new Error(`stand-down refused: ${third.reason}`);
    const stoodDown = settleArc5ScoutV1(third.preflight, 12).successor;
    expect(stoodDown.scoutCreatureId).toBeNull();
    expect(stoodDown.creatures).toEqual(value.state.creatures);
  });

  it('is replayable and binds receipt, parent, prior Scout, and exact target', () => {
    const left = fixture();
    const right = fixture();
    const first = preflightArc5ScoutV1(left.state, { scoutCreatureId: left.rightId });
    const replay = preflightArc5ScoutV1(right.state, { scoutCreatureId: right.rightId });
    if (first.kind !== 'ready' || replay.kind !== 'ready') throw new Error('Scout replay refused');
    const a = settleArc5ScoutV1(first.preflight, 23);
    const b = settleArc5ScoutV1(replay.preflight, 23);
    expect(a.witness).toBe(b.witness);
    expect(a.receiptEvidence).toEqual(b.receiptEvidence);
    expect(ownershipStateDigestV2(a.successor)).toBe(ownershipStateDigestV2(b.successor));
    expect(settleArc5ScoutV1(first.preflight, 24).witness).not.toBe(a.witness);
    expect(() => settleArc5ScoutV1({ ...first.preflight }, 23)).toThrow(/owner-minted/u);
  });

  it('refuses unchanged, absent, exhibition, and hostile targets before settlement', () => {
    const value = fixture();
    expect(preflightArc5ScoutV1(value.state, { scoutCreatureId: null }))
      .toEqual({ kind: 'refused', reason: 'scout-unchanged' });
    expect(preflightArc5ScoutV1(value.state, {
      scoutCreatureId: ownershipContentId('creature', 'scout-absent') as CreatureInstanceId,
    })).toEqual({ kind: 'refused', reason: 'creature-not-found' });
    const exhibit = fixture(true);
    expect(preflightArc5ScoutV1(exhibit.state, { scoutCreatureId: exhibit.leftId }))
      .toEqual({ kind: 'refused', reason: 'creature-exhibit' });

    let touched = 0;
    const hostile: Record<string, unknown> = {};
    Object.defineProperty(hostile, 'scoutCreatureId', {
      enumerable: true,
      get() { touched++; return value.leftId; },
    });
    expect(preflightArc5ScoutV1(value.state, hostile as unknown as {
      scoutCreatureId: CreatureInstanceId | null;
    })).toEqual({ kind: 'refused', reason: 'input-invalid' });
    expect(touched).toBe(0);
  });
});
