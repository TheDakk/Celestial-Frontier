import { describe, expect, it } from 'vitest';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  encodeOwnershipStateV2,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  ownershipSourceStateV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { makeGenome } from '@cf/domain-genome';
import {
  createCreatureTombstoneV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
} from '../packages/domain/acquisition/src/model-v2.js';
import {
  projectCompendiumCreatureProgressionV1,
  renderCompendiumCreatureProgressionV1,
  COMPENDIUM_CREATURE_PROGRESSION_PAGE_SIZE_V1,
  type CompendiumCreatureProgressionRecordV1,
} from '../apps/game/src/compendium-creature-progression.js';

function fixture(): Readonly<{
  state: OwnershipStateV2;
  record: CompendiumCreatureProgressionRecordV1;
  ids: readonly CreatureInstanceId[];
}> {
  const identity = canonicalGenomeIdentityV1(makeGenome(81_811, 'fauna', 0.44));
  const xps = [24, 54, 216, 486] as const;
  const discoveries = xps.map((_, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `progression-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `progression-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const ids = xps.map((_, index) => (
    ownershipContentId('creature', `progression-${index}`) as CreatureInstanceId
  ));
  const creatures = xps.map((xp, index) => createCreatureInstanceV1({
    creatureId: ids[index]!,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: `Twin ${index + 1}`,
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: identity.genome.gen as number },
    xp,
    hurt: index / 10,
    fed: 0,
    brood: 0,
    assignment: index === 0
      ? { kind: 'mission', missionId: 'survey-patrol' }
      : index === 1 ? { kind: 'recovery', readyAtActivePlayMs: 5_000 }
        : index === 2 ? { kind: 'recovery', readyAtActivePlayMs: 1_000 } : null,
    bond: null,
  }));
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: 'Aurora Twin',
      firstObservationId: discoveries[0]!.recordId,
    })],
    discoveries,
    creatures,
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  return Object.freeze({
    state: migrateOwnershipStateV1ToV2(source),
    record: Object.freeze({ id: 'aurora-twin', name: 'Aurora Twin', g: identity.genome }),
    ids: Object.freeze(ids),
  });
}

function project(value: ReturnType<typeof fixture>, state = value.state) {
  return projectCompendiumCreatureProgressionV1({
    logicalId: value.record.id,
    record: value.record,
    ownership: state,
    protected: false,
    fixture: false,
    observedActivePlayMs: 2_000,
  });
}

describe('exact-instance Compendium creature progression', () => {
  it('keeps same-species twins distinct and follows the exact L2/L3/L6/L9 curve', () => {
    const value = fixture();
    const result = project(value);
    expect(result.availability).toBe('ready');
    expect(new Set(result.rows.map((row) => row.creatureId))).toEqual(new Set(value.ids));
    const byId = new Map(result.rows.map((row) => [row.creatureId, row]));
    expect(value.ids.map((id) => byId.get(id)!).map((row) => ({
      xp: row.xp,
      level: row.level,
      slots: row.awakenedInnateSlots,
      nextInnate: row.nextInnateLevel,
    }))).toEqual([
      { xp: 24, level: 2, slots: 1, nextInnate: 3 },
      { xp: 54, level: 3, slots: 2, nextInnate: 6 },
      { xp: 216, level: 6, slots: 3, nextInnate: null },
      { xp: 486, level: 9, slots: 3, nextInnate: null },
    ]);
    expect(result.rows.every((row) => row.className.length > 0)).toBe(true);
    expect(result.rows.every((row) => row.classGroup === 'Caster')).toBe(true);
    expect(byId.get(value.ids[0]!)!.innateArts).toEqual([{
      id: 'roulette', label: 'Roulette',
      description: 'swings wild — a gambler’s ceiling',
      slot: 1, effects: { gambit: 0.34 },
    }]);
    expect(byId.get(value.ids[1]!)!.innateArts).toEqual([
      {
        id: 'roulette', label: 'Roulette',
        description: 'swings wild — a gambler’s ceiling',
        slot: 1, effects: { gambit: 0.34 },
      },
      {
        id: 'dot', label: 'Affliction',
        description: 'sears the foe for a share of vitality each round',
        slot: 2, effects: { burn: 0.027 },
      },
    ]);
    expect(byId.get(value.ids[2]!)!.innateArts[2]).toEqual({
      id: 'fury', label: 'Fury', description: 'builds ferocity every round',
      slot: 3, effects: { ramp: 0.0434 },
    });
    expect(byId.get(value.ids[3]!)).toMatchObject({
      nextLevelXp: null,
      levelProgressPercent: 100,
      woundFraction: 0.3,
    });
  });

  it('projects mission and active-play Recovery state without clearing stored assignments', () => {
    const value = fixture();
    const before = encodeOwnershipStateV2(value.state);
    const result = project(value);
    const byId = new Map(result.rows.map((row) => [row.creatureId, row]));
    expect(byId.get(value.ids[0]!)).toMatchObject({ status: 'mission' });
    expect(byId.get(value.ids[1]!)).toMatchObject({ status: 'recovery' });
    expect(byId.get(value.ids[2]!)).toMatchObject({ status: 'recovered' });
    expect(byId.get(value.ids[1]!)!.statusDetail).toContain('3 seconds of active play');
    expect(encodeOwnershipStateV2(value.state)).toBe(before);
    expect(value.state.creatures.find((row) => row.creatureId === value.ids[2])!.assignment).toEqual({
      kind: 'recovery', readyAtActivePlayMs: 1_000,
    });
  });

  it('marks immutable tombstone history as retired rather than an active owned twin', () => {
    const value = fixture();
    const retired = value.state.creatures.find((row) => row.creatureId === value.ids[3])!;
    const tombstone = createCreatureTombstoneV2(retired, createF4ReceiptEvidenceV2({
      ordinal: 71,
      actionKind: 'creature-retire',
      witnessDigest: 'a'.repeat(64),
    }));
    const state = createOwnershipSuccessorV2(value.state, {
      source: ownershipSourceStateV1(value.state),
      bredAcquisitions: value.state.bredAcquisitions,
      creatures: value.state.creatures.filter((row) => row.creatureId !== retired.creatureId),
      creatureTombstones: [tombstone],
      specimenLots: value.state.specimenLots,
      specimenTombstones: value.state.specimenTombstones,
      scoutCreatureId: value.state.scoutCreatureId,
    });
    const result = project(value, state);
    expect(result.rows.find((row) => row.creatureId === retired.creatureId)).toMatchObject({
      historical: true,
      status: 'retired',
      xp: 486,
      level: 9,
    });
    expect(result.rows.filter((row) => !row.historical)).toHaveLength(3);
  });

  it('fails closed for diagnostic, non-fauna, cloned and malformed authority', () => {
    const value = fixture();
    expect(projectCompendiumCreatureProgressionV1({
      logicalId: value.record.id,
      record: value.record,
      ownership: value.state,
      protected: false,
      fixture: true,
      observedActivePlayMs: 0,
    }).availability).toBe('fixture');
    const flora = canonicalGenomeIdentityV1(makeGenome(81_812, 'flora', 0.44));
    expect(projectCompendiumCreatureProgressionV1({
      logicalId: 'flora',
      record: { id: 'flora', name: 'Flora', g: flora.genome },
      ownership: value.state,
      protected: false,
      fixture: false,
      observedActivePlayMs: 0,
    }).availability).toBe('non-fauna');
    const clone = JSON.parse(JSON.stringify(value.state)) as OwnershipStateV2;
    expect(project(value, clone).availability).toBe('protected');
    expect(projectCompendiumCreatureProgressionV1({
      logicalId: '',
      record: value.record,
      ownership: value.state,
      protected: false,
      fixture: false,
      observedActivePlayMs: 0,
    }).availability).toBe('protected');
  });

  it('renders semantic read-only progress without merging twins or trusting names as markup', () => {
    const value = fixture();
    const model = project(value);
    const html = renderCompendiumCreatureProgressionV1(model);
    expect(html).toContain('Companion Progression');
    expect(html.match(/data-creature-progression-id=/gu)).toHaveLength(4);
    expect(html).toContain('L9');
    expect(html).toContain('3 innate arts awake');
    expect(html).toContain('Innate 1 · Roulette');
    expect(html).toContain('swings wild — a gambler’s ceiling');
    expect(html).toContain('gambit=0.34');
    expect(html).toContain('Innate 2 · Affliction');
    expect(html).toContain('burn=0.027');
    expect(html).toContain('Innate 3 · Fury');
    expect(html).toContain('ramp=0.0434');
    expect(html.match(/data-creature-progression-art=/gu)).toHaveLength(9);
    expect(html).toContain('aria-label=');
    const hostile = renderCompendiumCreatureProgressionV1({
      ...model,
      rows: [{
        ...model.rows[0]!,
        label: '<img src=x onerror=alert(1)>',
        innateArts: [{
          id: 'forged"><img',
          label: '<img src=x onerror=label()>',
          description: '<svg onload=description()>',
          slot: 1,
          effects: { '<img': 1 },
        }],
      }],
    });
    expect(hostile).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(hostile).toContain('forged&quot;&gt;&lt;img');
    expect(hostile).toContain('&lt;img src=x onerror=label()&gt;');
    expect(hostile).toContain('&lt;svg onload=description()&gt;');
    expect(hostile).toContain('&lt;img=1');
    expect(hostile).not.toContain('<svg onload=');
    expect(renderCompendiumCreatureProgressionV1({ ...model, availability: 'fixture' })).toBe('');
  });

  it('bounds a large same-species roster to 24 exact rows while keeping every page reachable', () => {
    const identity = canonicalGenomeIdentityV1(makeGenome(91_911, 'fauna', 0.66));
    const discoveries = Array.from({ length: 50 }, (_, index) => createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', `large-progression-${index}`) as DiscoveryRecordId,
      speciesId: identity.speciesId,
      legacyCodexId: `large-progression-${index}`,
      legacySourceIndex: index,
      from: 'Legacy', legacyLocation: null, firstForSpecies: index === 0,
    }));
    const creatures = discoveries.map((discovery, index) => createCreatureInstanceV1({
      creatureId: ownershipContentId('creature', `large-progression-${index}`) as CreatureInstanceId,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: `Roster ${index + 1}`,
      origin: 'legacy', acquisitionRecordId: discovery.recordId,
      lineage: { kind: 'none', generation: identity.genome.gen as number },
      xp: index, hurt: 0, fed: 0, brood: 0, assignment: null, bond: null,
    }));
    const ownership = migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
      catalogSpecies: [createCatalogSpeciesV1({
        identity, alias: 'Large Roster', firstObservationId: discoveries[0]!.recordId,
      })],
      discoveries, creatures, specimenLots: [], biosphereProgress: [], legacyBioX: [],
      scoutCreatureId: null,
    }));
    const input = {
      logicalId: 'large-roster',
      record: { id: 'large-roster', name: 'Large Roster', g: identity.genome },
      ownership, protected: false, fixture: false, observedActivePlayMs: 0,
    } as const;
    const first = projectCompendiumCreatureProgressionV1(input);
    const second = projectCompendiumCreatureProgressionV1({ ...input, pageIndex: 1 });
    const last = projectCompendiumCreatureProgressionV1({ ...input, pageIndex: 99 });
    expect(first).toMatchObject({ totalRows: 50, pageIndex: 0, pageCount: 3 });
    expect(first.rows).toHaveLength(COMPENDIUM_CREATURE_PROGRESSION_PAGE_SIZE_V1);
    expect(second.rows).toHaveLength(COMPENDIUM_CREATURE_PROGRESSION_PAGE_SIZE_V1);
    expect(last).toMatchObject({ totalRows: 50, pageIndex: 2, pageCount: 3 });
    expect(last.rows).toHaveLength(2);
    expect(new Set([
      ...first.rows.map(({ creatureId }) => creatureId),
      ...second.rows.map(({ creatureId }) => creatureId),
      ...last.rows.map(({ creatureId }) => creatureId),
    ]).size).toBe(50);
    const html = renderCompendiumCreatureProgressionV1(first);
    expect(html.match(/data-creature-progression-id=/gu)).toHaveLength(24);
    expect(html).toContain('Page 1 of 3 · 50 exact companions and records');
    expect(html).toContain('data-creature-progression-page="next"');
  });
});
