import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  classifyRealm,
  describeSpecies,
  sapienceTier,
  type Genome,
} from '@cf/domain-genome';
import type { CodexEntry } from '@cf/persistence';
import { getCanonicalCF1AddressKey, isCanonicalCF1Address } from '@cf/scene';
import {
  ARC9_PARAGON_COUNT_V1,
  ARC9_PARAGON_MILESTONE_COUNT_V1,
  ARC9_PARAGON_MILESTONE_NAME_V1,
  ARC9_PARAGON_MILESTONE_STARDUST_V1,
  bindArc9ParagonCurrentWorldV1,
  findArc9ParagonAtCurrentWorldV1,
  isExactParagonGenomeV1,
  paragonCodexIdV1,
  paragonGenomeV1,
  paragonIndexForCodexIdV1,
  paragonSeedV1,
  paragonWhereV1,
  projectArc9ParagonCatalogueV1,
  projectArc9ParagonFinderV1,
  projectArc9ParagonLegacyCodexEntryV1,
} from '../apps/game/src/paragon-finder.js';

beforeAll(() => installCaptureHooks());

function entry(index: number): CodexEntry {
  const genome = { ...paragonGenomeV1(index) } as unknown as Genome;
  const description = describeSpecies(genome);
  const id = paragonCodexIdV1(index);
  return {
    id,
    name: description.name,
    kind: description.kind,
    tier: description.grade.tier,
    realm: classifyRealm(genome),
    sapient: sapienceTier(genome),
    from: `Paragon site #${index + 1}`,
    hybrid: false,
    g: genome as unknown as Record<string, unknown>,
    where: null,
  };
}

describe('Arc 9 Fifty-Paragon finder foundation', () => {
  it('preserves all fifty legacy seed and genome anchors without mutable outputs', () => {
    expect(ARC9_PARAGON_COUNT_V1).toBe(50);
    expect([
      paragonSeedV1(0), paragonSeedV1(1), paragonSeedV1(9),
      paragonSeedV1(10), paragonSeedV1(49),
    ]).toEqual([1040091444, 2226934226, 4199809401, 2240118993, 219484612]);
    expect(new Set(Array.from({ length: 50 }, (_, index) => paragonSeedV1(index))).size).toBe(50);
    expect(Array.from({ length: 50 }, (_, index) => paragonGenomeV1(index))).toSatisfy(
      (genomes: readonly Readonly<Genome>[]) => genomes.every((genome) =>
        genome.kingdom === 'fauna'
        && (genome.size === 4 || genome.size === 5)
        && genome.lumin === true
        && genome.wild === 1
        && typeof genome.par === 'number' && genome.par >= 8 && genome.par <= 11
        && typeof genome.ep === 'number'),
    );
    expect(paragonGenomeV1(0)).toMatchObject({
      seed: 1040091444, size: 4, lumin: true, wild: 1, par: 8, ep: 12,
    });
    expect(Object.isFrozen(paragonGenomeV1(0))).toBe(true);
    expect(() => paragonSeedV1(-1)).toThrow(RangeError);
    expect(() => paragonGenomeV1(50)).toThrow(RangeError);
  });

  it('projects exact Compendium progress and protects a forged matching identity', () => {
    const exact = Array.from({ length: 10 }, (_, index) => entry(index));
    const projected = projectArc9ParagonCatalogueV1(exact);
    expect(projected.kind).toBe('projected');
    if (projected.kind !== 'projected') return;
    expect(projected.catalogue).toMatchObject({
      found: 10,
      total: 50,
      milestone: {
        id: 'para10',
        name: ARC9_PARAGON_MILESTONE_NAME_V1,
        required: ARC9_PARAGON_MILESTONE_COUNT_V1,
        stardust: ARC9_PARAGON_MILESTONE_STARDUST_V1,
        complete: true,
      },
    });
    expect(projected.catalogue.slots.filter(({ found }) => found)).toHaveLength(10);
    expect(paragonIndexForCodexIdV1(exact[9]!.id)).toBe(9);
    expect(paragonIndexForCodexIdV1('s1')).toBeNull();
    expect(isExactParagonGenomeV1(exact[0]!.g, 0)).toBe(true);

    const forged = { ...exact[0]!, g: { ...exact[0]!.g, par: 11 } };
    expect(isExactParagonGenomeV1(forged.g, 0)).toBe(false);
    expect(projectArc9ParagonCatalogueV1([forged])).toEqual({
      kind: 'protected', reason: 'paragon-genome-mismatch',
    });
    expect(projectArc9ParagonCatalogueV1([exact[0]!, exact[0]!])).toEqual({
      kind: 'protected', reason: 'codex-id-duplicate',
    });
  });

  it('keeps the legacy fixed walk deterministic and binds only registered current authority', () => {
    const where = paragonWhereV1(0);
    expect(where).toEqual({
      type: 'planet',
      gal: {
        x: 385503.1449741684,
        y: -142745.095927082,
        size: 33.523179850541055,
        sp: 0,
        tilt: 0.8027629204094409,
        rot: 5.210976370905073,
        seed: 2833478784,
        home: false,
        quasar: false,
        dwarf: false,
      },
      star: { x: -11.75427312310785, y: 613.6321912351996, seed: 102306174 },
      pseed: 3877631020,
    });
    const located = projectArc9ParagonFinderV1(0);
    expect(located.kind).toBe('located');
    if (located.kind !== 'located') return;
    expect(isCanonicalCF1Address(located.address)).toBe(true);
    expect(getCanonicalCF1AddressKey(located.address)).toBe(located.address.key);
    expect(projectArc9ParagonFinderV1(0)).toMatchObject({
      kind: 'located', where: located.where,
    });
    expect(bindArc9ParagonCurrentWorldV1(0, located.address)).toMatchObject({
      kind: 'located', index: 0, codexId: paragonCodexIdV1(0),
    });
    expect(findArc9ParagonAtCurrentWorldV1(located.address)).toMatchObject({
      kind: 'located', index: 0, codexId: paragonCodexIdV1(0),
    });

    const rawFixture = {
      format: 'CF1',
      galaxy: located.address.galaxy,
      star: located.address.star,
      planet: located.address.planet,
      key: located.address.key,
    };
    expect(bindArc9ParagonCurrentWorldV1(0, rawFixture)).toEqual({
      kind: 'protected', reason: 'unregistered-current-world',
    });
    expect(bindArc9ParagonCurrentWorldV1(0, structuredClone(located.address))).toEqual({
      kind: 'protected', reason: 'unregistered-current-world',
    });
    expect(findArc9ParagonAtCurrentWorldV1(rawFixture)).toEqual({
      kind: 'protected', reason: 'unregistered-current-world',
    });
    expect(findArc9ParagonAtCurrentWorldV1(structuredClone(located.address))).toEqual({
      kind: 'protected', reason: 'unregistered-current-world',
    });
    expect(() => projectArc9ParagonLegacyCodexEntryV1({ ...located }))
      .toThrow('finder-minted location');

    const allLocations = Array.from(
      { length: ARC9_PARAGON_COUNT_V1 },
      (_, index) => projectArc9ParagonFinderV1(index),
    );
    expect(allLocations.every(({ kind }) => kind === 'located')).toBe(true);
    // Retained authorities keep their registered identity across later scans;
    // every exact-address/clone refusal above still applies after cache warmup.
    for (const candidate of allLocations) {
      if (candidate.kind !== 'located') continue;
      expect(projectArc9ParagonFinderV1(candidate.index)).toBe(candidate);
      expect(findArc9ParagonAtCurrentWorldV1(candidate.address)).toBe(candidate);
    }
    expect(new Set(allLocations.map((candidate) => candidate.kind === 'located'
      ? candidate.address.key : candidate.kind)).size).toBe(ARC9_PARAGON_COUNT_V1);
    const elsewhere = allLocations[1]!;
    expect(elsewhere.kind).toBe('located');
    if (elsewhere.kind !== 'located') return;
    expect(bindArc9ParagonCurrentWorldV1(0, elsewhere.address)).toEqual({
      kind: 'protected', reason: 'paragon-location-mismatch',
    });
    expect(projectArc9ParagonFinderV1(50)).toEqual({
      kind: 'protected', reason: 'paragon-index',
    });
  });
});
