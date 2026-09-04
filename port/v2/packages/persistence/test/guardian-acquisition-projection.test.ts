import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import {
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatSettlementPlanV1,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import {
  canonicalGenomeIdentityV1,
  canonicalJson,
  createBiosphereProgressV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createEmptyOwnershipStateV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createOwnershipSuccessorV1,
  createSpecimenLotV1,
  createWorldDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type OwnershipStateV2,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import {
  GUARDIAN_ACQUISITION_STATE_VERSION_V1,
  createEmptyGuardianAcquisitionStateV1,
  prepareGuardianAcquisitionV1,
  type GuardianAcquisitionEntryV1,
  type GuardianAcquisitionStateV1,
} from '@cf/domain-acquisition/guardian-acquisition-internal';
import {
  GUARDIAN_COMPANION_STATE_SCHEMA_V1,
  GUARDIAN_COMPANION_STATE_VERSION_V1,
  decodeGuardianCompanionStateV1,
  type GuardianCompanionStateV1,
} from '@cf/domain-acquisition/guardian-companion-internal';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  GUARDIAN_ACQUISITION_NAMESPACE_V1,
  GUARDIAN_COMPANION_NAMESPACE_V1,
  applyV5ExtensionWrites,
  arc4GuardianLegacyOwnershipMirrorMatchesV1,
  guardianAcquisitionCarrierWriteV1,
  guardianCompanionCarrierWriteV1,
  guardianLegacyCompanionSliceMatchesV1,
  projectArc4GuardianLegacyOwnershipMirrorV1,
  projectLegacyOwnershipMirror,
  stageGuardianLegacyCompanionSliceV1,
  type CodexEntry,
  type ProjectedLegacyOwnershipMirrorV1,
  type SaveStateV2,
  type V5Extensions,
} from '../src/index.js';

beforeAll(() => installCaptureHooks());

const CAPTURE_WORLDS = Object.freeze({
  guardian: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }),
    planet: Object.freeze({ seed: 2456455053 }),
  }),
  titan: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 }),
    planet: Object.freeze({ seed: 2481585519 }),
  }),
} as const);

type LegacyMirrorFields = Pick<SaveStateV2, 'codex' | 'customNames' | 'bioX' | 'scoutId'>;

function encounter(kind: 'guardian' | 'titan'): GuardianPrimeEncounterV1 {
  const resolved = resolveCF1WorldAddress(CAPTURE_WORLDS[kind]);
  if (!resolved.ok) throw new Error(`${kind} projection world failed: ${resolved.reason}`);
  const projected = projectGuardianPrimeEncounterV1({
    world: resolved.address,
    descriptor: { worldType: kind === 'titan' ? 'lava' : 'airless' },
    regionIndex: 0,
    faunaRoster: kind === 'titan'
      ? []
      : [{ speciesId: 'guardian-projection-native', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: kind === 'titan'
      ? []
      : ['stone', 'flame', 'sky', 'star', 'ocean', 'mind', 'life', 'void', 'prism'],
    conquered: false,
  });
  if (projected === null || projected.defender.kind !== kind) {
    throw new Error(`${kind} projection encounter drifted`);
  }
  return projected;
}

function plan(kind: 'guardian' | 'titan', ordinal: number): CombatSettlementPlanV1 {
  const target = encounter(kind);
  const championGenome = makeGenome(42, 'fauna', 0.5);
  championGenome.fed = 200;
  championGenome.brood = 200;
  championGenome.xp = 486;
  const champion = {
    kind: 'owned-fauna' as const,
    creatureId: `guardian-projection-champion-${kind}`,
    name: 'Projection champion',
    genome: championGenome,
    legacyBredLineage: true,
  };
  const transcript = runDuel(
    { name: champion.name, genome: champion.genome },
    { name: target.defender.name, genome: target.defender.battleGenome as Genome },
  );
  if (transcript.winner !== 'A') throw new Error(`${kind} projection champion no longer wins`);
  const planned = planCombatSettlementV1({
    battleId: `guardian-projection-${kind}-${ordinal}`,
    receiptOrdinal: ordinal,
    encounter: target,
    champion,
    transcript,
    outcome: 'champion-win',
    worldTier: kind === 'titan' ? 5 : 4,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: kind === 'titan'
        ? []
        : ['stone', 'flame', 'sky', 'star', 'ocean', 'mind', 'life', 'void', 'prism'],
      lossXp: { kind: 'known-target', awardedTarget: 0 },
    },
  });
  if (planned.status !== 'planned') throw new Error(`projection capture refused ${planned.reason}`);
  return planned;
}

function emptyOwnershipV2(): OwnershipStateV2 {
  return migrateOwnershipStateV1ToV2(createEmptyOwnershipStateV1());
}

function capturedCarrier(): Readonly<{
  state: GuardianAcquisitionStateV1;
  guardian: GuardianAcquisitionEntryV1;
  titan: GuardianAcquisitionEntryV1;
  extensions: V5Extensions;
}> {
  const ownership = emptyOwnershipV2();
  const first = prepareGuardianAcquisitionV1({
    parent: createEmptyGuardianAcquisitionStateV1(),
    ownership,
    plan: plan('guardian', 41),
  });
  if (first.kind !== 'prepared') throw new Error(`Guardian fixture failed: ${first.kind}`);
  const second = prepareGuardianAcquisitionV1({
    parent: first.successor,
    ownership,
    plan: plan('titan', 43),
  });
  if (second.kind !== 'prepared') throw new Error(`Titan fixture failed: ${second.kind}`);
  const state = second.successor;
  return Object.freeze({
    state,
    guardian: first.entry,
    titan: second.entry,
    extensions: applyV5ExtensionWrites({}, [guardianAcquisitionCarrierWriteV1(state)]).extensions,
  });
}

function legacyEntry(
  legacyCodexId: string,
  g: Readonly<Record<string, unknown>>,
  from: string,
  where: unknown,
): CodexEntry {
  return {
    id: legacyCodexId,
    name: legacyCodexId,
    kind: String(g.kingdom ?? 'Unknown'),
    tier: null,
    realm: 'Unknown',
    sapient: 0,
    from,
    hybrid: Array.isArray(g.parents),
    g: structuredClone(g),
    where: where === null ? null : structuredClone(where) as Record<string, unknown>,
  };
}

function legacyFromMirror(mirror: ProjectedLegacyOwnershipMirrorV1): LegacyMirrorFields {
  return {
    codex: mirror.codex.map((row) => [
      row.legacyCodexId,
      legacyEntry(row.legacyCodexId, row.g, row.f, row.w),
    ]),
    customNames: mirror.customNames.map(([key, value]) => [key, value]),
    bioX: mirror.bioX.map(([seed, progress]) => [seed, [...progress]]),
    scoutId: mirror.scoutId,
  };
}

function companionOverlay(
  rows: readonly Record<string, unknown>[],
  revision = rows.length,
): GuardianCompanionStateV1 {
  const sorted = [...rows].sort((left, right) => {
    const leftCreature = left.kind === 'live'
      ? (left.creature as { creatureId: string }).creatureId
      : (left.tombstone as { creatureId: string }).creatureId;
    const rightCreature = right.kind === 'live'
      ? (right.creature as { creatureId: string }).creatureId
      : (right.tombstone as { creatureId: string }).creatureId;
    return leftCreature.localeCompare(rightCreature);
  });
  return decodeGuardianCompanionStateV1(canonicalJson({
    schema: GUARDIAN_COMPANION_STATE_SCHEMA_V1,
    version: GUARDIAN_COMPANION_STATE_VERSION_V1,
    revision,
    rows: sorted,
  }));
}

function combatReceipt(ordinal: number, fill: string): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ordinal,
    actionKind: 'combat-settlement',
    witnessDigest: fill.repeat(64),
  });
}

function extensionsWithCompanions(
  captured: ReturnType<typeof capturedCarrier>,
  overlay: GuardianCompanionStateV1,
): V5Extensions {
  return applyV5ExtensionWrites({}, [
    guardianAcquisitionCarrierWriteV1(captured.state),
    guardianCompanionCarrierWriteV1(overlay),
  ]).extensions;
}

function initialArc4Species(genome: unknown): OwnershipStateV1 {
  const identity = canonicalGenomeIdentityV1(genome);
  const legacyCodexId = `s${identity.genome.seed}`;
  const recordId = ownershipContentId(
    'discovery',
    `guardian-composite-arc4:${canonicalJson(identity.genome)}`,
  ) as DiscoveryRecordId;
  const discovery = createLegacyDiscoveryRecordV1({
    recordId,
    speciesId: identity.speciesId,
    legacyCodexId,
    legacySourceIndex: 0,
    from: 'Arc 4 legacy source',
    legacyLocation: null,
    firstForSpecies: true,
  });
  const catalog = createCatalogSpeciesV1({
    identity,
    alias: null,
    firstObservationId: recordId,
  });
  if (identity.kingdom === 'fauna') {
    const generation = Number.isSafeInteger(identity.genome.gen)
      ? identity.genome.gen as number
      : 0;
    const creature = createCreatureInstanceV1({
      creatureId: ownershipContentId(
        'creature',
        `guardian-composite-arc4:${identity.speciesId}`,
      ) as CreatureInstanceId,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: null,
      origin: 'legacy',
      acquisitionRecordId: recordId,
      lineage: { kind: 'none', generation },
      xp: null,
      hurt: null,
      fed: null,
      brood: null,
      assignment: null,
      bond: null,
    });
    return createInitialOwnershipStateV1({
      catalogSpecies: [catalog], discoveries: [discovery], creatures: [creature],
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    });
  }
  const specimen = createSpecimenLotV1({
    lotId: ownershipContentId(
      'specimen',
      `guardian-composite-arc4:${identity.speciesId}`,
    ) as SpecimenLotId,
    speciesId: identity.speciesId,
    kind: identity.kingdom,
    quantity: 1,
    origin: 'legacy',
    acquisitionRecordId: recordId,
  });
  return createInitialOwnershipStateV1({
    catalogSpecies: [catalog], discoveries: [discovery], creatures: [],
    specimenLots: [specimen], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  });
}

function appendArc4WorldFlora(parent: OwnershipStateV1): OwnershipStateV1 {
  const resolved = resolveCF1WorldAddress({
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 424242, x: 560, y: 170 },
    planet: { seed: 133 },
  });
  if (!resolved.ok) throw new Error(`Arc 4 successor world failed: ${resolved.reason}`);
  const identity = canonicalGenomeIdentityV1({ seed: 101, kingdom: 'flora', form: 3 });
  const recordId = ownershipContentId('discovery', 'guardian-composite-later-Arc4') as DiscoveryRecordId;
  const discovery = createWorldDiscoveryRecordV1({
    recordId,
    speciesId: identity.speciesId,
    verb: 'scavenge',
    worldAddress: resolved.address,
    cycle: 4,
    sourceOrdinal: 12,
    firstForSpecies: true,
  });
  const catalog = createCatalogSpeciesV1({
    identity,
    alias: 'Greenwake',
    firstObservationId: recordId,
  });
  const specimen = createSpecimenLotV1({
    lotId: ownershipContentId('specimen', 'guardian-composite-later-Arc4') as SpecimenLotId,
    speciesId: identity.speciesId,
    kind: 'flora',
    quantity: 1,
    origin: 'wild',
    acquisitionRecordId: recordId,
  });
  const progress = createBiosphereProgressV1({
    worldAddress: resolved.address,
    cycle: 4,
    used: 1,
    successful: [{ speciesId: identity.speciesId, source: 'scavenge' }],
  });
  return createOwnershipSuccessorV1(parent, {
    catalogSpecies: [...parent.catalogSpecies, catalog],
    discoveries: [...parent.discoveries, discovery],
    creatures: parent.creatures,
    specimenLots: [...parent.specimenLots, specimen],
    biosphereProgress: [...parent.biosphereProgress, progress],
    legacyBioX: parent.legacyBioX,
    scoutCreatureId: parent.scoutCreatureId,
  });
}

describe('Arc 4 + Guardian/Titan composite legacy projection', () => {
  it('retains Guardian and Titan individuals in carrier order and reaches a second fixed point', () => {
    const captured = capturedCarrier();
    const overlay = companionOverlay([{
      kind: 'live',
      sourceRecordId: captured.guardian.acquisition.recordId,
      creature: { ...captured.guardian.creature, xp: 5, hurt: 0.35 },
      lastReceipt: combatReceipt(51, 'a'),
    }]);
    const extensions = extensionsWithCompanions(captured, overlay);
    const arc4 = createEmptyOwnershipStateV1();
    const first = projectArc4GuardianLegacyOwnershipMirrorV1(arc4, extensions);
    expect(first.kind).toBe('projected');
    if (first.kind !== 'projected') return;
    expect(first.codex.map((row) => row.legacyCodexId)).toEqual([
      `s${captured.guardian.catalogSpecies.genome.seed}`,
      `s${captured.titan.catalogSpecies.genome.seed}`,
    ]);
    expect(first.codex.map((row) => row.f)).toEqual([
      'Apex Guardian of a world',
      'Elemental Titan of a world',
    ]);
    expect(first.codex[0]!.g).toMatchObject({ xp: 5, hurt: 0.35 });
    expect(first.codex[0]!.g).not.toHaveProperty('_mult');
    expect(first.codex[0]!.g).not.toHaveProperty('_wf');
    expect(Object.isFrozen(first.codex)).toBe(true);
    expect(Object.isFrozen(first.codex[0])).toBe(true);

    const second = projectArc4GuardianLegacyOwnershipMirrorV1(arc4, extensions);
    expect(second.kind).toBe('projected');
    expect(canonicalJson(second)).toBe(canonicalJson(first));
    const legacy = legacyFromMirror(first);
    expect(arc4GuardianLegacyOwnershipMirrorMatchesV1(arc4, extensions, legacy)).toBe(true);
    expect(guardianLegacyCompanionSliceMatchesV1(extensions, legacy)).toBe(true);

    const omittedTitan: LegacyMirrorFields = {
      ...legacy,
      codex: legacy.codex.slice(0, -1),
    };
    expect(arc4GuardianLegacyOwnershipMirrorMatchesV1(
      arc4,
      extensions,
      omittedTitan,
    )).toBe(false);
    expect(guardianLegacyCompanionSliceMatchesV1(extensions, omittedTitan)).toBe(false);
  });

  it('omits an exact companion tombstone and cannot resurrect it from acquisition history', () => {
    const captured = capturedCarrier();
    const overlay = companionOverlay([
      {
        kind: 'live',
        sourceRecordId: captured.guardian.acquisition.recordId,
        creature: { ...captured.guardian.creature, xp: 8, hurt: 0.2 },
        lastReceipt: combatReceipt(53, 'b'),
      },
      {
        kind: 'tombstone',
        sourceRecordId: captured.titan.acquisition.recordId,
        tombstone: {
          kind: 'creature',
          creatureId: captured.titan.creature.creatureId,
          snapshot: captured.titan.creature,
          disposition: combatReceipt(55, 'c'),
        },
      },
    ]);
    const extensions = extensionsWithCompanions(captured, overlay);
    const arc4 = createEmptyOwnershipStateV1();
    const projected = projectArc4GuardianLegacyOwnershipMirrorV1(arc4, extensions);
    expect(projected.kind).toBe('projected');
    if (projected.kind !== 'projected') return;
    expect(projected.codex.map((row) => row.legacyCodexId)).toEqual([
      `s${captured.guardian.catalogSpecies.genome.seed}`,
    ]);
    expect(projected.codex[0]!.g).toMatchObject({ xp: 8, hurt: 0.2 });
    expect(projected.codex.some((row) => (
      row.legacyCodexId === `s${captured.titan.catalogSpecies.genome.seed}`
    ))).toBe(false);
    const correct = legacyFromMirror(projected);
    expect(arc4GuardianLegacyOwnershipMirrorMatchesV1(arc4, extensions, correct)).toBe(true);
    expect(guardianLegacyCompanionSliceMatchesV1(extensions, correct)).toBe(true);

    const acquisitionOnly = projectArc4GuardianLegacyOwnershipMirrorV1(
      arc4,
      captured.extensions,
    );
    if (acquisitionOnly.kind !== 'projected') throw new Error('acquisition-only fixture protected');
    const resurrected = legacyFromMirror(acquisitionOnly);
    expect(arc4GuardianLegacyOwnershipMirrorMatchesV1(
      arc4,
      extensions,
      resurrected,
    )).toBe(false);
    expect(guardianLegacyCompanionSliceMatchesV1(extensions, resurrected)).toBe(false);
    expect(canonicalJson(projectArc4GuardianLegacyOwnershipMirrorV1(arc4, extensions)))
      .toBe(canonicalJson(projected));
  });

  it('verifies only the Guardian slice after unrelated Arc 5 compatibility rows change', () => {
    const captured = capturedCarrier();
    const overlay = companionOverlay([{
      kind: 'live',
      sourceRecordId: captured.guardian.acquisition.recordId,
      creature: { ...captured.guardian.creature, xp: 13, hurt: 0.4 },
      lastReceipt: combatReceipt(57, 'd'),
    }]);
    const extensions = extensionsWithCompanions(captured, overlay);
    const arc4 = createEmptyOwnershipStateV1();
    const projected = projectArc4GuardianLegacyOwnershipMirrorV1(arc4, extensions);
    if (projected.kind !== 'projected') throw new Error('Guardian slice fixture protected');
    const legacy = legacyFromMirror(projected);
    const unrelatedGenome = makeGenome(1777, 'fauna', 0.5);
    const withArc5Delta: LegacyMirrorFields = {
      ...legacy,
      codex: [
        ...legacy.codex,
        ['s1777', legacyEntry('s1777', unrelatedGenome, 'Arc 5 successor', null)],
      ],
      customNames: [...legacy.customNames, ['cs1777', 'Unrelated Arc 5 nickname']],
    };
    expect(arc4GuardianLegacyOwnershipMirrorMatchesV1(
      arc4,
      extensions,
      withArc5Delta,
    )).toBe(false);
    expect(guardianLegacyCompanionSliceMatchesV1(
      extensions,
      withArc5Delta,
    )).toBe(true);

    const guardianId = `s${captured.guardian.catalogSpecies.genome.seed}`;
    const mutatedGuardian: LegacyMirrorFields = {
      ...withArc5Delta,
      codex: withArc5Delta.codex.map(([id, entry]) => id === guardianId
        ? [id, { ...entry, g: { ...entry.g, xp: 12 } }]
        : [id, entry]),
    };
    expect(guardianLegacyCompanionSliceMatchesV1(
      extensions,
      mutatedGuardian,
    )).toBe(false);
    const duplicatedGuardian: LegacyMirrorFields = {
      ...withArc5Delta,
      codex: [
        ...withArc5Delta.codex,
        withArc5Delta.codex.find(([id]) => id === guardianId)!,
      ],
    };
    expect(guardianLegacyCompanionSliceMatchesV1(
      extensions,
      duplicatedGuardian,
    )).toBe(false);
  });

  it('stages only the Guardian slice and preserves Feed/Breed/Rename/Scout/combat-style Arc 5 deltas', () => {
    const captured = capturedCarrier();
    const overlay = companionOverlay([
      {
        kind: 'live',
        sourceRecordId: captured.guardian.acquisition.recordId,
        creature: { ...captured.guardian.creature, xp: 13, hurt: 0.4 },
        lastReceipt: combatReceipt(59, 'f'),
      },
      {
        kind: 'tombstone',
        sourceRecordId: captured.titan.acquisition.recordId,
        tombstone: {
          kind: 'creature',
          creatureId: captured.titan.creature.creatureId,
          snapshot: captured.titan.creature,
          disposition: combatReceipt(61, '7'),
        },
      },
    ]);
    const extensions = extensionsWithCompanions(captured, overlay);
    const acquisitionOnly = projectArc4GuardianLegacyOwnershipMirrorV1(
      createEmptyOwnershipStateV1(),
      captured.extensions,
    );
    if (acquisitionOnly.kind !== 'projected') throw new Error('stale Guardian fixture protected');
    const staleGuardianSlice = legacyFromMirror(acquisitionOnly);
    const deltaRows: LegacyMirrorFields['codex'] = [
      ['s7101', legacyEntry('s7101', {
        ...makeGenome(7101, 'fauna', 0.5), fed: 9, bond: 4,
      }, 'Arc 5 Feed successor', null)],
      ['s7102', legacyEntry('s7102', {
        ...makeGenome(7102, 'fauna', 0.5), gen: 2, parents: [101, 202], brood: 8,
      }, 'Arc 5 Breed child', null)],
      ['s7103', legacyEntry('s7103', {
        ...makeGenome(7103, 'fauna', 0.5), xp: 7,
      }, 'Arc 5 Rename successor', null)],
      ['s7104', legacyEntry('s7104', {
        ...makeGenome(7104, 'fauna', 0.5), assignment: {
          kind: 'mission', missionId: 'arc5-scout-sentinel',
        },
      }, 'Arc 5 Scout successor', null)],
      ['s7105', legacyEntry('s7105', {
        ...makeGenome(7105, 'fauna', 0.5), xp: 21, hurt: 0.75,
      }, 'Arc 5 Combat successor', null)],
    ];
    const staleGuardian = staleGuardianSlice.codex[0]!;
    const source = {
      codex: [
        ...deltaRows,
        ...staleGuardianSlice.codex,
        [staleGuardian[0], structuredClone(staleGuardian[1])] as [string, CodexEntry],
      ],
      customNames: [
        ['cs7101', 'Fed companion'],
        ['cs7102', 'Bred companion'],
        ['cs7103', 'Renamed companion'],
        ['cs7104', 'Field Scout'],
        ['cs7105', 'Battle-tested companion'],
        ...staleGuardianSlice.customNames,
      ] as Array<[string, string]>,
      bioX: [[7104, [3, 9]]] as Array<[number, [number, number]]>,
      scoutId: 'arc5-scout-creature-id',
      outerSentinel: { exact: ['unrelated', 41] },
    };
    const sourceBefore = canonicalJson(source as unknown as Parameters<typeof canonicalJson>[0]);
    const staged = stageGuardianLegacyCompanionSliceV1({
      source,
      ownership: emptyOwnershipV2(),
      extensions,
    });
    expect(staged.kind).toBe('staged');
    if (staged.kind !== 'staged') return;
    expect(staged.changed).toBe(true);
    expect(canonicalJson(source as unknown as Parameters<typeof canonicalJson>[0]))
      .toBe(sourceBefore);
    expect(staged.candidate).not.toBe(source);
    expect(staged.candidate.codex.slice(0, deltaRows.length)).toEqual(deltaRows);
    expect(staged.candidate.customNames.slice(0, 5)).toEqual(source.customNames.slice(0, 5));
    expect(staged.candidate.bioX).toEqual(source.bioX);
    expect(staged.candidate.bioX).not.toBe(source.bioX);
    expect(staged.candidate.scoutId).toBe('arc5-scout-creature-id');
    expect(staged.candidate.outerSentinel).toEqual(source.outerSentinel);
    const guardianId = `s${captured.guardian.catalogSpecies.genome.seed}`;
    const titanId = `s${captured.titan.catalogSpecies.genome.seed}`;
    expect(staged.candidate.codex.filter(([id]) => id === guardianId)).toHaveLength(1);
    expect(staged.candidate.codex.find(([id]) => id === guardianId)?.[1].g)
      .toMatchObject({ xp: 13, hurt: 0.4 });
    expect(staged.candidate.codex.some(([id]) => id === titanId)).toBe(false);
    expect(guardianLegacyCompanionSliceMatchesV1(extensions, staged.candidate)).toBe(true);

    const fixed = stageGuardianLegacyCompanionSliceV1({
      source: staged.candidate,
      ownership: emptyOwnershipV2(),
      extensions,
    });
    expect(fixed.kind).toBe('staged');
    if (fixed.kind !== 'staged') return;
    expect(fixed.changed).toBe(false);
    expect(canonicalJson(fixed.candidate as unknown as Parameters<typeof canonicalJson>[0]))
      .toBe(canonicalJson(staged.candidate as unknown as Parameters<typeof canonicalJson>[0]));
  });

  it('protects Guardian slice staging from Arc 5 species and legacy-id collisions', () => {
    const captured = capturedCarrier();
    const extensions = extensionsWithCompanions(captured, companionOverlay([]));
    const projected = projectArc4GuardianLegacyOwnershipMirrorV1(
      createEmptyOwnershipStateV1(),
      extensions,
    );
    if (projected.kind !== 'projected') throw new Error('collision source fixture protected');
    const source = legacyFromMirror(projected);
    const sourceBefore = canonicalJson(source as unknown as Parameters<typeof canonicalJson>[0]);
    const ambiguous = stageGuardianLegacyCompanionSliceV1({
      source,
      ownership: migrateOwnershipStateV1ToV2(initialArc4Species(
        captured.guardian.catalogSpecies.genome,
      )),
      extensions,
    });
    expect(ambiguous).toMatchObject({
      kind: 'protected',
      reason: 'ambiguous-species-identity',
      legacyCodexId: `s${captured.guardian.catalogSpecies.genome.seed}`,
    });
    const legacyCollision = stageGuardianLegacyCompanionSliceV1({
      source,
      ownership: migrateOwnershipStateV1ToV2(initialArc4Species({
        seed: captured.guardian.catalogSpecies.genome.seed,
        kingdom: 'flora',
        form: 'arc5-different-species-same-legacy-id',
      })),
      extensions,
    });
    expect(legacyCollision).toMatchObject({
      kind: 'protected',
      reason: 'legacy-id-species-collision',
      legacyCodexId: `s${captured.guardian.catalogSpecies.genome.seed}`,
    });
    expect(canonicalJson(source as unknown as Parameters<typeof canonicalJson>[0]))
      .toBe(sourceBefore);
  });

  it('keeps a later Arc 4 successor first, omits arbitrary extras, and treats absence as Arc 4-only', () => {
    const captured = capturedCarrier();
    const parent = createEmptyOwnershipStateV1();
    const successor = appendArc4WorldFlora(parent);
    const projected = projectArc4GuardianLegacyOwnershipMirrorV1(
      successor,
      captured.extensions,
    );
    expect(projected.kind).toBe('projected');
    if (projected.kind !== 'projected') return;
    expect(projected.codex.map((row) => row.legacyCodexId)).toEqual([
      's101',
      `s${captured.guardian.catalogSpecies.genome.seed}`,
      `s${captured.titan.catalogSpecies.genome.seed}`,
    ]);
    expect(projected.customNames).toContainEqual(['cs101', 'Greenwake']);
    const legacy = legacyFromMirror(projected);
    legacy.codex.push([
      's8675309',
      legacyEntry('s8675309', { seed: 8675309, kingdom: 'flora' }, 'Arbitrary extra', null),
    ]);
    expect(projected.codex.some((row) => row.legacyCodexId === 's8675309')).toBe(false);
    expect(arc4GuardianLegacyOwnershipMirrorMatchesV1(
      successor,
      captured.extensions,
      legacy,
    )).toBe(false);

    const absent = projectArc4GuardianLegacyOwnershipMirrorV1(successor, {});
    const arc4Only = projectLegacyOwnershipMirror(successor);
    expect(absent.kind).toBe('projected');
    expect(canonicalJson(absent)).toBe(canonicalJson(arc4Only));
  });

  it('protects exact legacy-ID collisions and contradictory cross-authority species identity', () => {
    const captured = capturedCarrier();
    const collisionExtensions = extensionsWithCompanions(captured, companionOverlay([{
      kind: 'live',
      sourceRecordId: captured.guardian.acquisition.recordId,
      creature: { ...captured.guardian.creature, xp: 3 },
      lastReceipt: combatReceipt(49, 'e'),
    }]));
    const guardianGenome = captured.guardian.catalogSpecies.genome;
    const collision = initialArc4Species({
      seed: guardianGenome.seed,
      kingdom: 'flora',
      form: 'different-species-same-legacy-id',
    });
    const collisionProjection = projectArc4GuardianLegacyOwnershipMirrorV1(
      collision,
      collisionExtensions,
    );
    expect(collisionProjection).toMatchObject({
      kind: 'protected',
      reason: 'legacy-id-species-collision',
      legacyCodexId: `s${guardianGenome.seed}`,
    });
    if (collisionProjection.kind === 'protected') {
      expect(collisionProjection.speciesIds).toHaveLength(2);
    }

    const ambiguous = initialArc4Species(guardianGenome);
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(
      ambiguous,
      collisionExtensions,
    )).toMatchObject({
      kind: 'protected',
      reason: 'ambiguous-species-identity',
      legacyCodexId: `s${guardianGenome.seed}`,
      speciesIds: [captured.guardian.catalogSpecies.speciesId],
    });
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(
      { ...ambiguous },
      collisionExtensions,
    )).toEqual({ kind: 'protected', reason: 'arc4-unregistered' });
  });

  it('protects malformed, future, wrong-segment, and detached Guardian authorities', () => {
    const arc4 = createEmptyOwnershipStateV1();
    const malformed: V5Extensions = {
      creatures: {
        [GUARDIAN_ACQUISITION_NAMESPACE_V1]: { version: 1, json: '{}' },
      },
    };
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(arc4, malformed)).toEqual({
      kind: 'protected', reason: 'guardian-corrupt',
    });
    const futureVersion = GUARDIAN_ACQUISITION_STATE_VERSION_V1 + 1;
    const future: V5Extensions = {
      creatures: {
        [GUARDIAN_ACQUISITION_NAMESPACE_V1]: { version: futureVersion, json: '{}' },
      },
    };
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(arc4, future)).toEqual({
      kind: 'protected', reason: 'guardian-future-version', version: futureVersion,
    });
    const wrongSegment: V5Extensions = {
      catalog: {
        [GUARDIAN_ACQUISITION_NAMESPACE_V1]: { version: 1, json: '{}' },
      },
    };
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(arc4, wrongSegment)).toEqual({
      kind: 'protected', reason: 'guardian-wrong-segment',
    });

    const captured = capturedCarrier();
    const companionBase = captured.extensions.creatures ?? {};
    const malformedCompanion: V5Extensions = {
      ...captured.extensions,
      creatures: {
        ...companionBase,
        [GUARDIAN_COMPANION_NAMESPACE_V1]: { version: 1, json: '{}' },
      },
    };
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(
      arc4,
      malformedCompanion,
    )).toEqual({ kind: 'protected', reason: 'guardian-companion-corrupt' });
    const futureCompanionVersion = GUARDIAN_COMPANION_STATE_VERSION_V1 + 1;
    const futureCompanion: V5Extensions = {
      ...captured.extensions,
      creatures: {
        ...companionBase,
        [GUARDIAN_COMPANION_NAMESPACE_V1]: {
          version: futureCompanionVersion,
          json: '{}',
        },
      },
    };
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(
      arc4,
      futureCompanion,
    )).toEqual({
      kind: 'protected',
      reason: 'guardian-companion-future-version',
      version: futureCompanionVersion,
    });
    const wrongSegmentCompanion: V5Extensions = {
      ...captured.extensions,
      catalog: {
        [GUARDIAN_COMPANION_NAMESPACE_V1]: { version: 1, json: '{}' },
      },
    };
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(
      arc4,
      wrongSegmentCompanion,
    )).toEqual({ kind: 'protected', reason: 'guardian-companion-wrong-segment' });

    const detachedRecordId = ownershipContentId(
      'discovery',
      'guardian-companion-detached-projection-control',
    ) as DiscoveryRecordId;
    const detachedOverlay = companionOverlay([{
      kind: 'live',
      sourceRecordId: detachedRecordId,
      creature: {
        ...captured.guardian.creature,
        acquisitionRecordId: detachedRecordId,
        xp: 3,
      },
      lastReceipt: combatReceipt(57, 'd'),
    }]);
    expect(projectArc4GuardianLegacyOwnershipMirrorV1(
      arc4,
      extensionsWithCompanions(captured, detachedOverlay),
    )).toEqual({ kind: 'protected', reason: 'guardian-companion-detached' });
  });
});
