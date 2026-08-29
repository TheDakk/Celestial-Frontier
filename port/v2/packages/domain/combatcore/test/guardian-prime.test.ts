import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { guardianFor, makeGenome, type Genome } from '@cf/domain-genome';
import {
  isCanonicalCF1Address,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  PRIME_SIGNATURE_IDS_V1,
  PRIME_SIGNATURES_V1,
  battleStats,
  isGuardianPrimeEncounterV1,
  projectGuardianPrimeEncounterV1,
  projectOrdinaryGuardianV1,
  projectPrimeResonanceV1,
  projectTitanPlacementFactsV1,
  type GuardianPrimeEncounterInputV1,
  type GuardianPrimeFaunaV1,
  type PrimeSignatureIdV1,
} from '@cf/domain-combatcore';

beforeAll(() => installCaptureHooks());

const WORLD_CANDIDATES = Object.freeze({
  multi: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 1704147477, x: -816.5224888999946, y: -572.5457991384901 }),
    planet: Object.freeze({ seed: 3351403606 }),
  }),
  flame: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 }),
    planet: Object.freeze({ seed: 2481585519 }),
  }),
  oceanMind: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 }),
    planet: Object.freeze({ seed: 1855784554 }),
  }),
  lifeGuardian: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }),
    planet: Object.freeze({ seed: 2456455053 }),
  }),
  void: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 1870336732, x: -835.7104268185794, y: -279.0773200504482 }),
    planet: Object.freeze({ seed: 3933259603 }),
  }),
  prism: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 }),
    planet: Object.freeze({ seed: 1231903096 }),
  }),
  voidAndStone: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 661055791, x: -793.3914718329906, y: -280.49798475019634 }),
    planet: Object.freeze({ seed: 454398131 }),
  }),
  collisionA: Object.freeze({
    galaxy: Object.freeze({ seed: 1594395733, x: -5501.81, y: -11753.64 }),
    star: Object.freeze({ seed: 4077594722, x: -271.54, y: -67.36 }),
    planet: Object.freeze({ seed: 488332735 }),
  }),
  collisionB: Object.freeze({
    galaxy: Object.freeze({ seed: 1336287406, x: -2657.91, y: -11817.01 }),
    star: Object.freeze({ seed: 1391422746, x: -646.79, y: 119.97 }),
    planet: Object.freeze({ seed: 488332735 }),
  }),
} as const);

type WorldFixture = keyof typeof WORLD_CANDIDATES;
const WORLD_ADDRESSES = new Map<WorldFixture, CanonicalCF1WorldAddress>();

function world(fixture: WorldFixture): CanonicalCF1WorldAddress {
  const cached = WORLD_ADDRESSES.get(fixture);
  if (cached !== undefined) return cached;
  const resolved = resolveCF1WorldAddress(WORLD_CANDIDATES[fixture]);
  if (!resolved.ok) throw new Error(`world fixture ${fixture} did not resolve: ${resolved.reason}`);
  WORLD_ADDRESSES.set(fixture, resolved.address);
  return resolved.address;
}

function fauna(speciesId: string, seed: number, heat = 0.5): GuardianPrimeFaunaV1 {
  return Object.freeze({ speciesId, genome: makeGenome(seed, 'fauna', heat) });
}

function input(options: Readonly<{
  world: WorldFixture | CanonicalCF1WorldAddress;
  worldType: string;
  regionIndex: number;
  faunaRoster?: readonly GuardianPrimeFaunaV1[];
  claimedSignatureIds?: readonly PrimeSignatureIdV1[];
  conquered?: boolean;
}>): GuardianPrimeEncounterInputV1 {
  return Object.freeze({
    world: typeof options.world === 'string' ? world(options.world) : options.world,
    descriptor: Object.freeze({ worldType: options.worldType }),
    regionIndex: options.regionIndex,
    faunaRoster: Object.freeze([...(options.faunaRoster ?? [])]),
    claimedSignatureIds: Object.freeze([...(options.claimedSignatureIds ?? [])]),
    conquered: options.conquered ?? false,
  });
}

describe('Arc 6 Guardian / Prime Codex legacy definitions', () => {
  it('pins all nine ordered ids, elements, tiers, region bands, worlds, and Titan names', () => {
    expect(PRIME_SIGNATURE_IDS_V1).toEqual([
      'stone', 'flame', 'sky', 'star', 'ocean', 'mind', 'life', 'void', 'prism',
    ]);
    expect(PRIME_SIGNATURES_V1.map((row) => ({
      id: row.id,
      element: row.element,
      signature: row.signatureName,
      verb: row.verb,
      tier: row.tier,
      minimumRegionIndex: row.minimumRegionIndex,
      worlds: row.eligibleWorldTypes,
      guardian: row.guardianName,
    }))).toEqual([
      { id: 'stone', element: 'Earth', signature: 'Earth Signature', verb: 'Conquer', tier: 1, minimumRegionIndex: 0, worlds: ['rocky'], guardian: 'Terrakoth, the Mountain’s Fist' },
      { id: 'flame', element: 'Fire', signature: 'Fire Signature', verb: 'Conquer', tier: 1, minimumRegionIndex: 0, worlds: ['lava'], guardian: 'Pyraxis, the Ember Tyrant' },
      { id: 'sky', element: 'Air', signature: 'Air Signature', verb: 'Conquer', tier: 1, minimumRegionIndex: 0, worlds: ['gas'], guardian: 'Sylphrend, the Gale Sovereign' },
      { id: 'star', element: 'Stellar', signature: 'Stellar Signature', verb: 'Conquer', tier: 1, minimumRegionIndex: 0, worlds: ['desert'], guardian: 'Zephyrmaw, the Stellar Squall' },
      { id: 'ocean', element: 'Water', signature: 'Water Signature', verb: 'Conquer', tier: 1, minimumRegionIndex: 0, worlds: ['ocean'], guardian: 'Abyssleth, the Tide Devout' },
      { id: 'mind', element: 'Electric', signature: 'Electric Signature', verb: 'Conquer', tier: 2, minimumRegionIndex: 1, worlds: ['ice'], guardian: 'Voltmaw, the Living Current' },
      { id: 'life', element: 'Poison', signature: 'Poison Signature', verb: 'Conquer', tier: 2, minimumRegionIndex: 1, worlds: ['venus'], guardian: 'Venomroyne, the Blight Mother' },
      { id: 'void', element: 'Void', signature: 'Void Signature', verb: 'Conquer', tier: 3, minimumRegionIndex: 2, worlds: [], guardian: 'Nullreth, the Devourer' },
      { id: 'prism', element: 'Prism', signature: 'Prism Signature', verb: 'Conquer', tier: 3, minimumRegionIndex: 2, worlds: ['terran'], guardian: 'Iridax, the Spectral Paragon' },
    ]);
    expect(Object.isFrozen(PRIME_SIGNATURE_IDS_V1)).toBe(true);
    expect(Object.isFrozen(PRIME_SIGNATURES_V1)).toBe(true);
    expect(Object.isFrozen(PRIME_SIGNATURES_V1[0]!.eligibleWorldTypes)).toBe(true);
  });

  it('pins all nine deterministic world mappings with fixed legacy seeds', () => {
    const fixtures = [
      ['stone', 'multi', 'rocky', 0, 'Terrakoth, the Mountain’s Fist', 3071781101],
      ['flame', 'flame', 'lava', 0, 'Pyraxis, the Ember Tyrant', 3201506615],
      ['sky', 'multi', 'gas', 0, 'Sylphrend, the Gale Sovereign', 3071781101],
      ['star', 'multi', 'desert', 0, 'Zephyrmaw, the Stellar Squall', 3071781101],
      ['ocean', 'oceanMind', 'ocean', 0, 'Abyssleth, the Tide Devout', 3358924494],
      ['mind', 'oceanMind', 'ice', 1, 'Voltmaw, the Living Current', 3358924494],
      ['life', 'lifeGuardian', 'venus', 1, 'Venomroyne, the Blight Mother', 2655388432],
      ['void', 'void', 'airless', 2, 'Nullreth, the Devourer', 3386171257],
      ['prism', 'prism', 'terran', 2, 'Iridax, the Spectral Paragon', 2068897778],
    ] as const;
    for (const [signatureId, worldFixture, worldType, regionIndex, guardianName, genomeSeed] of fixtures) {
      const encounter = projectGuardianPrimeEncounterV1(input({ world: worldFixture, worldType, regionIndex }));
      expect(encounter?.defender.kind, signatureId).toBe('titan');
      expect(encounter?.defender.signatureId, signatureId).toBe(signatureId);
      expect(encounter?.defender.name, signatureId).toBe(guardianName);
      expect(encounter?.defender.tier, signatureId).toBe(14);
      expect(encounter?.defender.battleGenome.seed, signatureId).toBe(genomeSeed);
      expect(encounter?.defender.battleGenome._titan, signatureId).toBe(signatureId);
    }
  });
});

describe('ordinary Apex Guardian parity', () => {
  it('pins the first eight guarded worlds independently of the broad parity loop', () => {
    const fixtures = [
      [37, 12, 'Kryuuloid the Deep Warden', 3265232116],
      [49, 12, 'Moremneus the Undying', 1987152923],
      [50, 12, 'Pyrixilan the Hollow Saint', 1844711348],
      [91, 12, 'Ephiskine the Crownless', 771803831],
      [100, 13, 'Ephemneus the Deep Warden', 2383357570],
      [109, 12, 'Thriskoid the Star-Eater', 1583255730],
      [167, 14, 'Nyxora the Stormcrowned', 3889050687],
      [214, 14, 'Quoraithine the Skyrender', 1816116707],
    ] as const;
    expect(fixtures.map(([seed]) => {
      const projected = projectOrdinaryGuardianV1(seed)!;
      return [seed, projected.tier, projected.name, projected.genome.seed];
    })).toEqual(fixtures);
  });

  it('matches lifted guardianFor over a broad fixed 10,000-world sample', () => {
    const counts = { total: 0, tier12: 0, tier13: 0, tier14: 0 };
    for (let seed = 1; seed <= 10_000; seed++) {
      const legacy = guardianFor(seed);
      const projected = projectOrdinaryGuardianV1(seed);
      if (legacy === null) {
        expect(projected, `world ${seed}`).toBeNull();
        continue;
      }
      counts.total++;
      counts[`tier${legacy.tier}` as 'tier12' | 'tier13' | 'tier14']++;
      expect(projected, `world ${seed}`).toMatchObject({
        kind: 'guardian',
        sourceId: `guardian:${seed}`,
        worldSeed: seed,
        name: legacy.name,
        tier: legacy.tier,
        genome: legacy.genome,
      });
    }
    expect(counts).toEqual({ total: 228, tier12: 146, tier13: 67, tier14: 15 });
  });
});

describe('Titan eligibility, resonance, and priority', () => {
  it('separates seeded presence, world eligibility, region eligibility, and claim state', () => {
    const tooNear = projectTitanPlacementFactsV1({
      planetSeed: 3, worldType: 'ice', regionIndex: 0, claimedSignatureIds: [],
    });
    const mindNear = tooNear.find((row) => row.signatureId === 'mind')!;
    expect(mindNear).toEqual({
      signatureId: 'mind', minimumRegionIndex: 1,
      worldTypeEligible: true, regionEligible: false,
      seededPresent: true, claimed: false, present: false, selected: false,
    });

    const eligible = projectTitanPlacementFactsV1({
      planetSeed: 3, worldType: 'ice', regionIndex: 1, claimedSignatureIds: [],
    });
    expect(eligible.find((row) => row.signatureId === 'mind')).toMatchObject({ present: true, selected: true });

    const claimed = projectTitanPlacementFactsV1({
      planetSeed: 3, worldType: 'ice', regionIndex: 1, claimedSignatureIds: ['mind'],
    });
    expect(claimed.find((row) => row.signatureId === 'mind')).toMatchObject({
      seededPresent: true, claimed: true, present: false, selected: false,
    });
  });

  it('preserves Void-before-world-nature priority, then reveals nature when Void is claimed', () => {
    const both = projectGuardianPrimeEncounterV1(input({ world: 'voidAndStone', worldType: 'rocky', regionIndex: 2 }));
    expect(both?.defender).toMatchObject({ kind: 'titan', signatureId: 'void', name: 'Nullreth, the Devourer' });

    const voidClaimed = projectGuardianPrimeEncounterV1(input({
      world: 'voidAndStone', worldType: 'rocky', regionIndex: 2, claimedSignatureIds: ['void'],
    }));
    expect(voidClaimed?.defender).toMatchObject({ kind: 'titan', signatureId: 'stone', name: 'Terrakoth, the Mountain’s Fist' });
    expect(voidClaimed?.identity).toMatchObject({
      claimedSignatureIds: ['void'], conquered: false,
    });
  });

  it('projects the exact four legacy resonance bands without UI copy', () => {
    expect(projectPrimeResonanceV1({ signatureId: 'void', ascentStage: 2, reachableRegionIndex: 2 })).toMatchObject({ reachable: false, state: 'beyond-charter' });
    expect(projectPrimeResonanceV1({ signatureId: 'void', ascentStage: 3, reachableRegionIndex: 2 })).toMatchObject({ reachable: true, state: 'strong' });
    expect(projectPrimeResonanceV1({ signatureId: 'void', ascentStage: 3, reachableRegionIndex: 1 })).toMatchObject({ reachable: false, state: 'faint' });
    expect(projectPrimeResonanceV1({ signatureId: 'void', ascentStage: 3, reachableRegionIndex: 0 })).toMatchObject({ reachable: false, state: 'whisper' });
  });

  it('selects Titan, then ordinary Guardian, then strongest fauna in exact priority order', () => {
    const roster = [fauna('weak', 1), fauna('strong', 991)];
    const titan = projectGuardianPrimeEncounterV1(input({
      world: 'multi', worldType: 'rocky', regionIndex: 0, faunaRoster: roster,
    }));
    expect(titan?.defender).toMatchObject({ kind: 'titan', signatureId: 'stone' });

    const guardian = projectGuardianPrimeEncounterV1(input({
      world: 'lifeGuardian', worldType: 'airless', regionIndex: 0,
      faunaRoster: roster,
    }));
    expect(guardian?.defender).toMatchObject({
      kind: 'guardian', sourceId: 'guardian:2456455053', name: 'Velemnoid the Skyrender',
    });

    const wild = projectGuardianPrimeEncounterV1(input({
      world: 'collisionA', worldType: 'airless', regionIndex: 0, faunaRoster: roster,
    }));
    const expected = roster.reduce((best, row) => (
      battleStats(row.genome).total > battleStats(best.genome).total ? row : best
    ));
    expect(wild?.defender).toMatchObject({ kind: 'fauna', sourceId: expected.speciesId });

    const sameGenome = makeGenome(77, 'fauna', 0.2);
    const tie = projectGuardianPrimeEncounterV1(input({
      world: 'collisionA', worldType: 'airless', regionIndex: 0,
      faunaRoster: [
        { speciesId: 'first-tie', genome: sameGenome },
        { speciesId: 'second-tie', genome: { ...sameGenome } },
      ],
    }));
    expect(tie?.defender).toMatchObject({ kind: 'fauna', sourceId: 'first-tie' });
  });
});

describe('encounter identity, suppression, and settlement-safe projections', () => {
  it('keeps canonical minting above combatcore without recreating the scene dependency cycle', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const combatRoot = path.resolve(here, '..');
    const domainRoot = path.resolve(combatRoot, '..');
    const workspacePackages = path.resolve(domainRoot, '..');
    const readPackage = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8')) as {
      dependencies?: Record<string, string>;
      exports?: Record<string, string>;
    };
    const combatPackage = readPackage(path.join(combatRoot, 'package.json'));
    const straysPackage = readPackage(path.join(domainRoot, 'strays', 'package.json'));
    const scenePackage = readPackage(path.join(workspacePackages, 'scene', 'package.json'));
    const identityPackage = readPackage(path.join(domainRoot, 'worldidentity', 'package.json'));
    const source = fs.readFileSync(path.join(combatRoot, 'src', 'guardian-prime.ts'), 'utf8');
    const mintSpecifier = '@cf/domain-worldidentity/' + 'mint-internal';
    const mintConsumers: string[] = [];
    const visit = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === 'node_modules') continue;
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(file);
        else if (/\.(?:ts|js|mjs)$/u.test(entry.name)
          && fs.readFileSync(file, 'utf8').includes(mintSpecifier)) {
          mintConsumers.push(path.relative(workspacePackages, file));
        }
      }
    };
    visit(workspacePackages);

    expect(scenePackage.dependencies).toHaveProperty('@cf/domain-strays');
    expect(straysPackage.dependencies).toHaveProperty('@cf/domain-combatcore');
    expect(combatPackage.dependencies).not.toHaveProperty('@cf/scene');
    expect(combatPackage.dependencies).toHaveProperty('@cf/domain-worldidentity');
    expect(source).not.toContain("from '@cf/scene'");
    expect(source).not.toContain(mintSpecifier);
    expect(mintConsumers).toEqual(['scene/src/address.ts']);
    expect(identityPackage.exports?.['.']).toBe('./src/index.ts');
    expect(identityPackage.exports?.['./mint-internal']).toBe('./src/mint-internal.ts');
  });

  it('is a fixed point for the same canonical input and returns frozen output', () => {
    const source = input({
      world: 'flame', worldType: 'lava', regionIndex: 0,
      faunaRoster: [fauna('one', 40), fauna('two', 41)],
    });
    const first = projectGuardianPrimeEncounterV1(source)!;
    const second = projectGuardianPrimeEncounterV1(source)!;
    expect(second).toEqual(first);
    expect(second.witness).toBe(first.witness);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.identity)).toBe(true);
    expect(Object.isFrozen(first.identity.world)).toBe(true);
    expect(Object.isFrozen(first.defender)).toBe(true);
    expect(Object.isFrozen(first.defender.battleGenome)).toBe(true);
    expect(Object.isFrozen(first.defender.capturableGenome)).toBe(true);
    expect(isGuardianPrimeEncounterV1(first)).toBe(true);
    expect(isGuardianPrimeEncounterV1({ ...first })).toBe(false);
  });

  it('binds the full canonical world so colliding leaf seeds cannot alias', () => {
    const first = projectGuardianPrimeEncounterV1(input({
      world: 'collisionA', worldType: 'airless', regionIndex: 0, faunaRoster: [fauna('same', 9)],
    }))!;
    const second = projectGuardianPrimeEncounterV1(input({
      world: 'collisionB', worldType: 'airless', regionIndex: 0, faunaRoster: [fauna('same', 9)],
    }))!;
    expect(first.identity.world.planet.seed).toBe(second.identity.world.planet.seed);
    expect(first.defender.sourceId).toBe(second.defender.sourceId);
    expect(first.identity.world.key).not.toBe(second.identity.world.key);
    expect(first.witness).not.toBe(second.witness);
  });

  it('rejects a structural address clone even when every visible field is identical', () => {
    const canonical = world('flame');
    const forged = { ...canonical } as unknown as CanonicalCF1WorldAddress;
    expect(isCanonicalCF1Address(canonical)).toBe(true);
    expect(isCanonicalCF1Address(forged)).toBe(false);
    expect(() => projectGuardianPrimeEncounterV1(input({
      world: forged, worldType: 'lava', regionIndex: 0,
    }))).toThrow(/registered canonical CF1 world address/u);
  });

  it('rejects region 6 and huge region values instead of scaling beyond the six legacy bands', () => {
    for (const regionIndex of [6, Number.MAX_SAFE_INTEGER]) {
      expect(() => projectGuardianPrimeEncounterV1(input({
        world: 'flame', worldType: 'lava', regionIndex,
      }))).toThrow(/non-negative safe integer/u);
      expect(() => projectTitanPlacementFactsV1({
        planetSeed: world('flame').planet.seed,
        worldType: 'lava', regionIndex, claimedSignatureIds: [],
      })).toThrow(/non-negative safe integer/u);
      expect(() => projectPrimeResonanceV1({
        signatureId: 'void', ascentStage: 3, reachableRegionIndex: regionIndex,
      })).toThrow(/non-negative safe integer/u);
    }
  });

  it('suppresses claimed Titans and all encounters on conquered worlds', () => {
    expect(projectGuardianPrimeEncounterV1(input({
      world: 'flame', worldType: 'lava', regionIndex: 0, claimedSignatureIds: ['flame'],
    }))).toBeNull();
    expect(projectGuardianPrimeEncounterV1(input({
      world: 'flame', worldType: 'lava', regionIndex: 0, conquered: true,
      faunaRoster: [fauna('would-defend', 70)],
    }))).toBeNull();
  });

  it('strips battlefield-only modifiers from every Guardian/Titan capturable projection', () => {
    const titan = projectGuardianPrimeEncounterV1(input({ world: 'flame', worldType: 'lava', regionIndex: 0 }))!;
    expect(titan.defender.battleGenome).toMatchObject({ _mult: 1.15, _wf: 'lava' });
    expect(titan.defender.capturableGenome).not.toHaveProperty('_mult');
    expect(titan.defender.capturableGenome).not.toHaveProperty('_wf');

    const guardian = projectGuardianPrimeEncounterV1(input({
      world: 'lifeGuardian', worldType: 'airless', regionIndex: 2,
      claimedSignatureIds: ['void'], faunaRoster: [fauna('native', 2)],
    }))!;
    expect(guardian.defender).toMatchObject({ kind: 'guardian' });
    expect(guardian.defender.battleGenome._mult).toBe(1.28);
    expect(guardian.defender.capturableGenome).not.toHaveProperty('_mult');
    expect(guardian.defender.capturableGenome).not.toHaveProperty('_wf');
  });

  it('mutation controls move the selected identity or witness rather than passing vacuously', () => {
    const earth = projectGuardianPrimeEncounterV1(input({ world: 'multi', worldType: 'rocky', regionIndex: 0 }))!;
    const air = projectGuardianPrimeEncounterV1(input({ world: 'multi', worldType: 'gas', regionIndex: 0 }))!;
    expect(earth.defender.signatureId).toBe('stone');
    expect(air.defender.signatureId).toBe('sky');
    expect(air.witness).not.toBe(earth.witness);

    const baseGenome = makeGenome(44, 'fauna', 0.4);
    const changedGenome = { ...baseGenome, fer: 999 } as Genome;
    const base = projectGuardianPrimeEncounterV1(input({
      world: 'collisionA', worldType: 'airless', regionIndex: 0,
      faunaRoster: [{ speciesId: 'mutant', genome: baseGenome }],
    }))!;
    const changed = projectGuardianPrimeEncounterV1(input({
      world: 'collisionA', worldType: 'airless', regionIndex: 0,
      faunaRoster: [{ speciesId: 'mutant', genome: changedGenome }],
    }))!;
    expect(changed.witness).not.toBe(base.witness);
  });

  it('detaches nested genome evidence before freezing the encounter witness', () => {
    const parents = [10, 20];
    const genome = { ...makeGenome(44, 'fauna', 0.4), parents } as Genome;
    const encounter = projectGuardianPrimeEncounterV1(input({
      world: 'collisionA', worldType: 'airless', regionIndex: 0,
      faunaRoster: [{ speciesId: 'nested', genome }],
    }))!;
    const witness = encounter.witness;
    parents[0] = 999;
    expect(encounter.defender.battleGenome.parents).toEqual([10, 20]);
    expect(encounter.witness).toBe(witness);
    expect(Object.isFrozen(encounter.defender.battleGenome.parents)).toBe(true);
  });
});
