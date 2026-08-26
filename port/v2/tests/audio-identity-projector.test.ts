import { beforeAll, describe, expect, it, vi } from 'vitest';
import { serializeAudioSignature } from '@cf/audio';
import {
  canonicalGenomeIdentityV1,
  createBiosphereProgressV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createLegacyProtectedOwnershipStateV1,
  createWorldDiscoveryRecordV1,
  encodeOwnershipStateV2,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  ownershipSourceStateV1,
  sha256Hex,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type CreatureLineageV1,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { crossGenome } from '@cf/domain-genetics';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  BREED_ACTION_KIND_V2,
  createBredAcquisitionRecordV2,
  createBredCreatureInstanceV2,
  createCreatureTombstoneV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
} from '../packages/domain/acquisition/src/model-v2.js';
import {
  projectOwnedCreatureAudioIdentity,
  type OwnedCreatureAudioIdentityProjection,
} from '../apps/game/src/audio-identity-projector.js';

// Hoisted by Vitest: any present or future SessionRNG dependency in the
// projector's complete import graph makes this test module fail at import.
vi.mock('@cf/domain-sessionrng', () => {
  throw new Error('audio identity projector imported SessionRNG');
});

const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });

beforeAll(() => installCaptureHooks());

type MutableCreatureFields = Pick<CreatureInstanceV1,
  'nickname' | 'xp' | 'hurt' | 'fed' | 'brood' | 'assignment' | 'bond'>;

const QUIET_MUTABLE_FIELDS: MutableCreatureFields = Object.freeze({
  nickname: null,
  xp: null,
  hurt: null,
  fed: null,
  brood: null,
  assignment: null,
  bond: null,
});

interface OwnedFixture {
  readonly state: OwnershipStateV2;
  readonly creatureId: CreatureInstanceId;
}

function earthAddress(): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress({
    galaxy: HOME_GALAXY,
    star: SOL,
    planet: { seed: 133 },
  });
  if (!resolved.ok) throw new Error(`Earth fixture was unproven: ${resolved.reason}`);
  return resolved.address;
}

function projected(fixture: OwnedFixture): Extract<
  OwnedCreatureAudioIdentityProjection,
  { readonly kind: 'projected' }
> {
  const result = projectOwnedCreatureAudioIdentity(fixture.state, fixture.creatureId);
  if (result.kind !== 'projected') {
    throw new Error(`audio identity fixture was unavailable: ${result.reason}`);
  }
  return result;
}

function legacyFixture(
  genome: unknown,
  lineage: CreatureLineageV1 = { kind: 'none', generation: 0 },
  mutable: MutableCreatureFields = QUIET_MUTABLE_FIELDS,
  label = 'audio-legacy',
): OwnedFixture {
  const identity = canonicalGenomeIdentityV1(genome);
  const discovery = createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', label) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: label,
    legacySourceIndex: 0,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  });
  const species = createCatalogSpeciesV1({
    identity,
    alias: null,
    firstObservationId: discovery.recordId,
  });
  const creatureId = ownershipContentId('creature', label) as CreatureInstanceId;
  const creature = createCreatureInstanceV1({
    creatureId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    origin: 'legacy',
    acquisitionRecordId: discovery.recordId,
    lineage,
    ...mutable,
  });
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [species],
    discoveries: [discovery],
    creatures: [creature],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  return Object.freeze({ state: migrateOwnershipStateV1ToV2(source), creatureId });
}

function wildFixtures(genomes: readonly Genome[], label = 'audio-wild'): Readonly<{
  readonly state: OwnershipStateV2;
  readonly creatureIds: readonly CreatureInstanceId[];
}> {
  const address = earthAddress();
  const discoveries = genomes.map((genome, index) => {
    const identity = canonicalGenomeIdentityV1(genome);
    return createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', `${label}-${index}`) as DiscoveryRecordId,
      speciesId: identity.speciesId,
      verb: 'tame',
      worldAddress: address,
      cycle: 0,
      sourceOrdinal: index,
      firstForSpecies: true,
    });
  });
  const identities = genomes.map((genome) => canonicalGenomeIdentityV1(genome));
  const species = identities.map((identity, index) => createCatalogSpeciesV1({
    identity,
    alias: null,
    firstObservationId: discoveries[index]!.recordId,
  }));
  const creatureIds = genomes.map((_, index) => (
    ownershipContentId('creature', `${label}-${index}`) as CreatureInstanceId
  ));
  const creatures = identities.map((identity, index) => createCreatureInstanceV1({
    creatureId: creatureIds[index]!,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: null,
    origin: 'wild',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: null,
    hurt: null,
    fed: null,
    brood: null,
    assignment: null,
    bond: null,
  }));
  const progress = createBiosphereProgressV1({
    worldAddress: address,
    cycle: 0,
    used: genomes.length,
    successful: identities.map((identity) => ({ speciesId: identity.speciesId, source: 'tame' })),
  });
  const source = createInitialOwnershipStateV1({
    catalogSpecies: species,
    discoveries,
    creatures,
    specimenLots: [],
    biosphereProgress: [progress],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  return Object.freeze({
    state: migrateOwnershipStateV1ToV2(source),
    creatureIds: Object.freeze(creatureIds),
  });
}

function wildFixture(genome: Genome, label = 'audio-wild'): OwnedFixture {
  const fixture = wildFixtures([genome], label);
  return Object.freeze({ state: fixture.state, creatureId: fixture.creatureIds[0]! });
}

function v2Contents(state: OwnershipStateV2) {
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

function bredFixture(
  childGenomePatch: Readonly<Record<string, unknown>> = {},
  omitRequiredBody = false,
): Readonly<OwnedFixture & {
  readonly parentSeeds: readonly [number, number];
}> {
  const left = Object.assign(makeGenome(0x1111, 'fauna', 0.3), { _earthName: 'Wolf' });
  const right = makeGenome(0x2222, 'fauna', 1.7);
  const parents = wildFixtures([left, right], 'audio-breed-parent');
  const leftId = parents.creatureIds[0]!, rightId = parents.creatureIds[1]!;
  const childGenomeDraft = {
    ...crossGenome(left, right), ...childGenomePatch,
  } as Partial<Genome>;
  if (omitRequiredBody) delete childGenomeDraft.body;
  const childGenome = childGenomeDraft as Genome;
  const identity = canonicalGenomeIdentityV1(childGenome);
  const receipt = createF4ReceiptEvidenceV2({
    ordinal: 19,
    actionKind: BREED_ACTION_KIND_V2,
    witnessDigest: sha256Hex('audio-breed'),
  });
  const parentSeeds = Object.freeze([left.seed, right.seed] as const);
  const acquisition = createBredAcquisitionRecordV2({
    speciesId: identity.speciesId,
    parentCreatureIds: [leftId, rightId],
    parentSeeds,
    receipt,
  });
  const child = createBredCreatureInstanceV2({
    acquisition,
    genome: childGenome,
    generation: childGenome.gen,
    nickname: 'Nova',
    xp: 7,
    hurt: 0,
    fed: 11,
    brood: 0,
    assignment: null,
    bond: null,
  });
  const state = createOwnershipSuccessorV2(parents.state, {
    ...v2Contents(parents.state),
    bredAcquisitions: [acquisition],
    creatures: [...parents.state.creatures, child],
  });
  return Object.freeze({ state, creatureId: child.creatureId, parentSeeds });
}

function withGenomeField(
  base: Genome,
  field: string,
  value: unknown,
): Record<string, unknown> {
  return { ...base, [field]: value };
}

describe('Arc 7 app-owned creature audio identity projector', () => {
  it('projects one exact registered wild creature through the immutable resolver pipeline', () => {
    const fixture = wildFixture(
      Object.assign(makeGenome(0xC0FFEE, 'fauna', 0.5), { _earthName: 'Tardigrade' }),
    );
    const before = encodeOwnershipStateV2(fixture.state);
    const first = projected(fixture);
    const second = projected(fixture);

    expect(second).toEqual(first);
    expect(first.creatureId).toBe(fixture.creatureId);
    expect(first.signature.owner).toEqual({
      route: 'catalogue', kingdom: 'fauna', name: 'Tardigrade',
    });
    expect(first.signature.phenotype.heatBand).toBe(1);
    expect(first.profile.identityKey).toBe(serializeAudioSignature(first.signature));
    expect(first.callPlan.identityKey).toBe(first.profile.identityKey);
    expect(encodeOwnershipStateV2(fixture.state)).toBe(before);

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.signature)).toBe(true);
    expect(Object.isFrozen(first.signature.owner)).toBe(true);
    expect(Object.isFrozen(first.signature.phenotype)).toBe(true);
    expect(Object.isFrozen(first.signature.lineage)).toBe(true);
    expect(Object.isFrozen(first.profile)).toBe(true);
    expect(Object.isFrozen(first.profile.register)).toBe(true);
    expect(Object.isFrozen(first.callPlan)).toBe(true);
    expect(Object.isFrozen(first.callPlan.phrases)).toBe(true);
    expect(first.callPlan.phrases.every((phrase) => Object.isFrozen(phrase)
      && Object.isFrozen(phrase.intervalsSemitones)
      && Object.isFrozen(phrase.durationsMs))).toBe(true);
  });

  it('takes legacy and bred ordered parents only from registered ownership evidence', () => {
    const genome = {
      ...makeGenome(0xABCD, 'fauna', 0.7),
      parents: [999, 888],
      _earthBlend: 'Green Algae',
      _earthBlendKingdom: 'flora',
      _anchorVal: 0.73004,
    };
    const forward = projected(legacyFixture(
      genome,
      { kind: 'legacy-parent-seeds', generation: 4, parentSeeds: [11, 22] },
      QUIET_MUTABLE_FIELDS,
      'audio-legacy-forward',
    ));
    const reverse = projected(legacyFixture(
      genome,
      { kind: 'legacy-parent-seeds', generation: 4, parentSeeds: [22, 11] },
      QUIET_MUTABLE_FIELDS,
      'audio-legacy-reverse',
    ));

    expect(forward.signature.owner).toEqual({
      route: 'lineage', kingdom: 'flora', name: 'Green Algae',
    });
    expect(forward.signature.phenotype.kingdom).toBe('fauna');
    expect(forward.signature.lineage).toEqual({
      parentSeeds: [11, 22], anchorBasisPoints: 7_300,
    });
    expect(forward.signature.lineage.parentSeeds).not.toEqual(genome.parents);
    expect(reverse.signature.lineage.parentSeeds).toEqual([22, 11]);
    expect(reverse.profile.identityKey).not.toBe(forward.profile.identityKey);
    expect(reverse.callPlan).not.toEqual(forward.callPlan);

    const bred = bredFixture();
    const bredProjection = projected(bred);
    expect(bredProjection.signature.lineage.parentSeeds).toEqual(bred.parentSeeds);
    expect(bredProjection.signature.phenotype).toMatchObject({
      temper: 0, sense: 0, metab: 0,
    });
    expect(Object.isFrozen(bredProjection.signature.lineage.parentSeeds)).toBe(true);
  });

  it('normalizes honest fractional heat and the selected gene/anchor bounds without save repair', () => {
    const vectors = [
      [0, 0],
      [0.49, 0],
      [0.5, 1],
      [1.49, 1],
      [1.5, 2],
      [2, 2],
    ] as const;
    for (let index = 0; index < vectors.length; index++) {
      const [heat, expected] = vectors[index]!;
      const fixture = legacyFixture(
        makeGenome(0x7000 + index, 'fauna', heat),
        { kind: 'none', generation: 0 },
        QUIET_MUTABLE_FIELDS,
        `audio-heat-${index}`,
      );
      const before = encodeOwnershipStateV2(fixture.state);
      expect(projected(fixture).signature.phenotype.heatBand).toBe(expected);
      expect(encodeOwnershipStateV2(fixture.state)).toBe(before);
    }

    const maxGene = withGenomeField(makeGenome(0x7100, 'fauna', 1), 'color', 0xFFFF);
    expect(projected(legacyFixture(maxGene, undefined, undefined, 'audio-max-gene'))
      .signature.phenotype.color).toBe(0xFFFF);
    const anchor = projected(legacyFixture({
      ...makeGenome(0x7101, 'fauna', 1),
      _earthBlend: 'Apple',
      _earthBlendKingdom: 'flora',
      _anchorVal: 1,
    }, undefined, undefined, 'audio-max-anchor'));
    expect(anchor.signature.lineage.anchorBasisPoints).toBe(10_000);
  });

  it('projects away mutable fields without ambient entropy or SessionRNG dependency', async () => {
    const genome = Object.assign(makeGenome(0x5151, 'fauna', 1.2), { _earthName: 'Wolf' });
    const expected = projected(legacyFixture(
      genome, undefined, QUIET_MUTABLE_FIELDS, 'audio-mutable',
    ));
    const mutations: ReadonlyArray<Partial<MutableCreatureFields>> = [
      { nickname: 'Echo' },
      { xp: 486 },
      { hurt: 1 },
      { fed: 200 },
      { brood: 200 },
      { assignment: { kind: 'mission', missionId: 'm-audio-control' } },
      { bond: {
        level: 4,
        memories: [{
          id: 'memory-audio-control',
          kind: 'arrival',
          worldKey: null,
          atActivePlayMs: 44,
        }],
        preferredRole: 'scout',
        worldsSurvived: 2,
        guardianVictories: 1,
        mementoIds: ['memento-audio-control'],
      } },
    ];
    for (const mutation of mutations) {
      const mutable = { ...QUIET_MUTABLE_FIELDS, ...mutation } as MutableCreatureFields;
      expect(projected(legacyFixture(
        genome, undefined, mutable, 'audio-mutable',
      ))).toEqual(expected);
    }

    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('audio identity consumed Math.random');
    });
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('audio identity consumed Date.now');
    });
    try {
      expect(projected(legacyFixture(
        genome, undefined, QUIET_MUTABLE_FIELDS, 'audio-no-rng',
      )).kind).toBe('projected');
    } finally {
      random.mockRestore();
      now.mockRestore();
    }
    await expect(import('@cf/domain-sessionrng')).rejects.toMatchObject({
      cause: expect.objectContaining({
        message: 'audio identity projector imported SessionRNG',
      }),
    });
  });

  it('fails closed for unregistered/protected/fake IDs and exact tombstones', () => {
    const live = wildFixture(makeGenome(0xDEAD, 'fauna', 1), 'audio-live');
    expect(projectOwnedCreatureAudioIdentity(
      { ...live.state } as OwnershipStateV2,
      live.creatureId,
    )).toEqual({ kind: 'unavailable', reason: 'ownership-unregistered' });
    expect(projectOwnedCreatureAudioIdentity(
      structuredClone(live.state) as OwnershipStateV2,
      live.creatureId,
    )).toEqual({ kind: 'unavailable', reason: 'ownership-unregistered' });
    const fakeCreatureId = 'creature-v1:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as CreatureInstanceId;
    expect(projectOwnedCreatureAudioIdentity(
      live.state,
      fakeCreatureId,
    )).toEqual({ kind: 'unavailable', reason: 'creature-not-live' });

    const protectedSource = createLegacyProtectedOwnershipStateV1({
      schema: 'cf-v1.8.9-ownership-source/v1',
      digest: sha256Hex('audio-protected'),
      jsonBytes: 2,
      codexRows: 0,
      uniqueSpecies: 0,
      bioXRows: 0,
      scoutCodexId: null,
    });
    const protectedState = migrateOwnershipStateV1ToV2(protectedSource);
    expect(projectOwnedCreatureAudioIdentity(protectedState, live.creatureId))
      .toEqual({ kind: 'unavailable', reason: 'ownership-protected' });

    const liveRow = live.state.creatures.find((row) => row.creatureId === live.creatureId)!;
    const disposition = createF4ReceiptEvidenceV2({
      ordinal: 21,
      actionKind: 'creature-release',
      witnessDigest: sha256Hex('audio-tombstone'),
    });
    const tombstone = createCreatureTombstoneV2(liveRow, disposition);
    const tombstoned = createOwnershipSuccessorV2(live.state, {
      ...v2Contents(live.state),
      creatures: [],
      creatureTombstones: [tombstone],
      scoutCreatureId: null,
    });
    expect(projectOwnedCreatureAudioIdentity(tombstoned, live.creatureId))
      .toEqual({ kind: 'unavailable', reason: 'creature-not-live' });
  });

  it('rejects malformed selected phenotype rather than clamping or wrapping identity', () => {
    const base = makeGenome(0xBADA55, 'fauna', 1);
    const malformed: ReadonlyArray<readonly [string, unknown]> = [
      ['color', -1],
      ['accent', 0x1_0000],
      ['form', 1.5],
      ['body', '1'],
      ['lumin', 1],
      ['heat', -0.01],
      ['heat', 2.01],
    ];
    for (let index = 0; index < malformed.length; index++) {
      const [field, value] = malformed[index]!;
      const fixture = legacyFixture(
        withGenomeField(base, field, value),
        undefined,
        undefined,
        `audio-malformed-${index}`,
      );
      expect(projectOwnedCreatureAudioIdentity(fixture.state, fixture.creatureId), field)
        .toEqual({ kind: 'unavailable', reason: 'phenotype-invalid' });
    }
    const missing = { ...base } as Partial<Genome>;
    delete missing.color;
    const fixture = legacyFixture(missing, undefined, undefined, 'audio-missing-gene');
    expect(projectOwnedCreatureAudioIdentity(fixture.state, fixture.creatureId))
      .toEqual({ kind: 'unavailable', reason: 'phenotype-invalid' });

    for (const field of ['temper', 'sense', 'metab'] as const) {
      const missingLegacyGene = { ...base } as Partial<Genome>;
      delete missingLegacyGene[field];
      const missingLegacy = legacyFixture(
        missingLegacyGene, undefined, undefined, `audio-missing-legacy-${field}`,
      );
      expect(projectOwnedCreatureAudioIdentity(
        missingLegacy.state, missingLegacy.creatureId,
      ), field).toEqual({ kind: 'unavailable', reason: 'phenotype-invalid' });
    }

    const malformedBred = bredFixture({ temper: 0x1_0000 });
    expect(projectOwnedCreatureAudioIdentity(malformedBred.state, malformedBred.creatureId))
      .toEqual({ kind: 'unavailable', reason: 'phenotype-invalid' });
    const missingBredBody = bredFixture({}, true);
    expect(projectOwnedCreatureAudioIdentity(missingBredBody.state, missingBredBody.creatureId))
      .toEqual({ kind: 'unavailable', reason: 'phenotype-invalid' });
  });

  it('rejects owner conflicts, incomplete lineage markers, and cross-kingdom substitution', () => {
    const base = makeGenome(0x0A11CE, 'fauna', 1);
    const invalidGenomes: readonly Record<string, unknown>[] = [
      { ...base, _earthName: 'Wolf', _earthBlend: 'Wolf', _earthBlendKingdom: 'fauna', _anchorVal: 0.8 },
      { ...base, _earthBlend: 'Wolf', _anchorVal: 0.8 },
      { ...base, _earthBlend: 'Wolf', _earthBlendKingdom: 'fauna' },
      { ...base, _earthBlendKingdom: 'fauna', _anchorVal: 0.8 },
      { ...base, _earthBlend: 'Wolf', _earthBlendKingdom: 'fauna', _anchorVal: -0.01 },
      { ...base, _earthBlend: 'Wolf', _earthBlendKingdom: 'fauna', _anchorVal: 1.01 },
      { ...base, _earthName: 'Apple' },
      { ...base, _earthBlend: 'Apple', _earthBlendKingdom: 'fauna', _anchorVal: 0.8 },
      { ...base, _earthName: ' Wolf' },
    ];
    for (let index = 0; index < invalidGenomes.length; index++) {
      const fixture = legacyFixture(
        invalidGenomes[index], undefined, undefined, `audio-owner-invalid-${index}`,
      );
      expect(projectOwnedCreatureAudioIdentity(fixture.state, fixture.creatureId), String(index))
        .toEqual({ kind: 'unavailable', reason: 'owner-invalid' });
    }

    const exactNonFaunaOwner = projected(legacyFixture({
      ...base,
      _earthBlend: 'Apple',
      _earthBlendKingdom: 'flora',
      _anchorVal: 0.8,
    }, undefined, undefined, 'audio-owner-flora'));
    expect(exactNonFaunaOwner.signature.owner).toEqual({
      route: 'lineage', kingdom: 'flora', name: 'Apple',
    });
    expect(exactNonFaunaOwner.signature.owner.kingdom).not.toBe('fauna');
    expect(exactNonFaunaOwner.signature.phenotype.kingdom).toBe('fauna');
  });

  it('keeps procedural identity explicit and does not need ecology or presentation authority', () => {
    const fixture = legacyFixture(
      makeGenome(0xF00D, 'fauna', 1), undefined, undefined, 'audio-procedural',
    );
    const result = projected(fixture);
    expect(result.signature.owner).toEqual({
      route: 'procedural', kingdom: 'fauna', name: null,
    });
    expect(result.signature.lineage).toEqual({
      parentSeeds: null, anchorBasisPoints: null,
    });
  });

});
