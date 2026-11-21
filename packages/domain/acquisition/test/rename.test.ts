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
  ARC5_COMPANION_NAME_MAX_V1,
  preflightArc5RenameV1,
  settleArc5RenameV1,
} from '../src/rename.js';

function fixture(exhibit = false): Readonly<{
  state: OwnershipStateV2;
  leftId: CreatureInstanceId;
  rightId: CreatureInstanceId;
}> {
  const identity = canonicalGenomeIdentityV1({
    ...makeGenome(919, 'fauna', 0.55),
    ...(exhibit ? { exhibit: true } : {}),
  });
  const discoveries = [0, 1].map((index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `rename-twins-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `rename-twins-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const leftId = ownershipContentId('creature', 'rename-left') as CreatureInstanceId;
  const rightId = ownershipContentId('creature', 'rename-right') as CreatureInstanceId;
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
    xp: 12,
    hurt: creatureId === leftId ? 0.8 : 0,
    fed: 7,
    brood: 3,
    assignment: creatureId === leftId
      ? { kind: 'recovery', readyAtActivePlayMs: 99_000 }
      : { kind: 'mission', missionId: 'rename-mission' },
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
    scoutCreatureId: leftId,
  });
  return Object.freeze({ state: migrateOwnershipStateV1ToV2(source), leftId, rightId });
}

describe('@cf/domain-acquisition — Arc 5 companion rename authority', () => {
  it('reuses shipped normalization and changes only one exact assigned twin', () => {
    const value = fixture();
    const preflight = preflightArc5RenameV1(value.state, {
      creatureId: value.leftId,
      rawName: `  <Nova>&\"' ${'x'.repeat(40)}  `,
    });
    if (preflight.kind !== 'ready') throw new Error(`rename refused: ${preflight.reason}`);
    expect(preflight.preflight.nicknameAfter).toBe('Nova xxxxxxxxxxxxxxxxxxx');
    expect(preflight.preflight.nicknameAfter).toHaveLength(ARC5_COMPANION_NAME_MAX_V1);

    const settled = settleArc5RenameV1(preflight.preflight, 8);
    const left = settled.successor.creatures.find((row) => row.creatureId === value.leftId)!;
    const right = settled.successor.creatures.find((row) => row.creatureId === value.rightId)!;
    expect(left.nickname).toBe('Nova xxxxxxxxxxxxxxxxxxx');
    expect(left.assignment).toEqual({ kind: 'recovery', readyAtActivePlayMs: 99_000 });
    expect(left.hurt).toBe(0.8);
    expect(right.nickname).toBe('Beta');
    expect(right.assignment).toEqual({ kind: 'mission', missionId: 'rename-mission' });
    expect(settled.successor.catalogSpecies[0]?.alias).toBe('Shared species alias');
    expect(left.speciesId).toBe(right.speciesId);
    expect(left.genomeIdentity).toBe(right.genomeIdentity);
    expect(left.lineage).toEqual(settled.creatureBefore.lineage);
    expect(settled.receiptEvidence).toMatchObject({
      ordinal: 8,
      actionKind: 'companion-rename',
    });
    expect(settled.successor.revision).toBe(value.state.revision + 1);
    expect(ownershipStateDigestV2(settled.successor)).not.toBe(ownershipStateDigestV2(value.state));
  });

  it('is replayable and binds receipt, exact parent, exact creature, and normalized name', () => {
    const left = fixture();
    const right = fixture();
    const first = preflightArc5RenameV1(left.state, {
      creatureId: left.rightId, rawName: 'Comet',
    });
    const replay = preflightArc5RenameV1(right.state, {
      creatureId: right.rightId, rawName: 'Comet',
    });
    if (first.kind !== 'ready' || replay.kind !== 'ready') throw new Error('rename replay refused');
    const a = settleArc5RenameV1(first.preflight, 23);
    const b = settleArc5RenameV1(replay.preflight, 23);
    expect(a.witness).toBe(b.witness);
    expect(a.receiptEvidence).toEqual(b.receiptEvidence);
    expect(ownershipStateDigestV2(a.successor)).toBe(ownershipStateDigestV2(b.successor));
    expect(settleArc5RenameV1(first.preflight, 24).witness).not.toBe(a.witness);
    expect(() => settleArc5RenameV1({ ...first.preflight }, 23)).toThrow(/owner-minted/u);
  });

  it('refuses empty, unchanged, absent, exhibition, and hostile inputs before settlement', () => {
    const value = fixture();
    expect(preflightArc5RenameV1(value.state, {
      creatureId: value.leftId, rawName: '<>&\"\'   ',
    })).toEqual({ kind: 'refused', reason: 'name-invalid' });
    expect(preflightArc5RenameV1(value.state, {
      creatureId: value.leftId, rawName: '  Alpha  ',
    })).toEqual({ kind: 'refused', reason: 'name-unchanged' });
    expect(preflightArc5RenameV1(value.state, {
      creatureId: ownershipContentId('creature', 'rename-absent') as CreatureInstanceId,
      rawName: 'Nova',
    })).toEqual({ kind: 'refused', reason: 'creature-not-found' });
    const exhibit = fixture(true);
    expect(preflightArc5RenameV1(exhibit.state, {
      creatureId: exhibit.leftId, rawName: 'Arena',
    })).toEqual({ kind: 'refused', reason: 'creature-exhibit' });

    let touched = 0;
    const hostile: Record<string, unknown> = { creatureId: value.leftId };
    Object.defineProperty(hostile, 'rawName', {
      enumerable: true,
      get() { touched++; return 'Wrong'; },
    });
    expect(preflightArc5RenameV1(value.state, hostile as unknown as {
      creatureId: CreatureInstanceId; rawName: string;
    })).toEqual({ kind: 'refused', reason: 'input-invalid' });
    expect(touched).toBe(0);
  });
});
