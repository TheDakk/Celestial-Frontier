import { beforeAll, describe, expect, it } from 'vitest';

import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  isFieldSampleProjection,
  projectFieldSamples,
  projectWorldOpportunity,
} from '@cf/domain-opportunity';
import {
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import { systemFor } from '@cf/domain-worldgen';
import {
  ARC0_FIELD_SAMPLE_CARGO_MAX,
  ARC0_FIELD_SAMPLE_CARGO_ROWS_MAX,
  ARC0_FIELD_SAMPLE_COUNTER_MAX,
  deriveArc0FieldSamples,
  type Arc0FieldSampleState,
} from '../apps/game/src/arc0-field-samples.js';

const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL_STAR = Object.freeze({ seed: 424242, x: 560, y: 170 });

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(candidate);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`world fixture did not resolve: ${result.reason}`);
  return result.address;
}

let EARTH: CanonicalCF1WorldAddress;
let FOREIGN_133: CanonicalCF1WorldAddress;

beforeAll(() => {
  installCaptureHooks();
  EARTH = world({
    galaxy: HOME_GALAXY,
    star: SOL_STAR,
    planet: { seed: 133 },
  });
  FOREIGN_133 = world({
    galaxy: {
      seed: 3_959_248_028,
      x: -6_974_362.37248769,
      y: 4_279_128.574915975,
    },
    star: {
      seed: 1_420_541_153,
      x: 100.5842142929323,
      y: -1_171.697432242334,
    },
    planet: { seed: 133 },
  });
});

const emptyState = (): Arc0FieldSampleState => ({
  cargo: [],
  essence: 0,
  stats: {
    essenceEarned: 0,
    landings: 0,
  },
});

const firstLanding = (address: CanonicalCF1WorldAddress) => {
  const opportunity = projectWorldOpportunity(address);
  return projectFieldSamples({
    address,
    opportunity,
    landing: 'first',
    training: false,
  });
};

describe('Arc 0 field-sample domain projection', () => {
  it('matches the exact seven-world Sol Stardust payout total', () => {
    const solPlanets = systemFor(SOL_STAR.seed).planets
      .filter((planet) => planet.P.seed !== 133)
      .map((planet) => world({
        galaxy: HOME_GALAXY,
        star: SOL_STAR,
        planet: { seed: planet.P.seed },
      }));

    const payouts = solPlanets.map((address) => {
      const result = firstLanding(address);
      expect(result.kind).toBe('grant');
      if (result.kind !== 'grant') throw new Error('expected a Sol grant');
      expect(result.reward.materials).toHaveLength(2);
      expect(result.reward.materials[0]?.quantity).toBe(1);
      expect(result.reward.materials[1]?.quantity).toBe(1);
      expect(result.reward.stardust).toBe(3 + result.witness.effectiveTier * 2);
      return result.reward.stardust;
    });

    expect(payouts).toHaveLength(7);
    expect(payouts).toEqual([9, 5, 3, 5, 3, 3, 3]);
    expect(payouts.reduce((total, value) => total + value, 0)).toBe(31);
  });

  it('excludes exact canonical Earth but rewards a foreign seed-133 collision', () => {
    const earth = firstLanding(EARTH);
    expect(earth).toMatchObject({
      kind: 'suppressed',
      reason: 'canonical-earth',
      witness: { stardust: 0 },
    });

    const collision = firstLanding(FOREIGN_133);
    expect(collision.kind).toBe('grant');
    if (collision.kind !== 'grant') throw new Error('expected collision grant');
    expect(collision.witness.planetSeed).toBe(133);
    expect(collision.witness.canonicalEarth).toBe(false);
  });

  it('uses the ring-capped effective tier and its deterministic deposits', () => {
    const address = world({
      galaxy: HOME_GALAXY,
      star: {
        seed: 81_728_606,
        x: 300.785200227052,
        y: 148.4581243400462,
      },
      planet: { seed: 4_260_876_100 },
    });
    const opportunity = projectWorldOpportunity(address);
    const result = firstLanding(address);

    expect(opportunity.rawTier).toBeGreaterThan(5);
    expect(opportunity.effectiveTier).toBe(5);
    expect(opportunity.deposits).toEqual(['Al', 'Cu', 'Mg']);
    expect(opportunity.deposits).not.toContain('Ag');
    expect(result.kind).toBe('grant');
    if (result.kind !== 'grant') throw new Error('expected capped grant');
    expect(result.witness.effectiveTier).toBe(5);
    expect(result.reward.stardust).toBe(13);
    expect(result.reward.materials.map(({ id }) => id)).toEqual(
      opportunity.deposits.slice(0, 2),
    );
  });

  it('suppresses Training, repeat, and unresolved-already-landed outcomes', () => {
    const opportunity = projectWorldOpportunity(FOREIGN_133);

    expect(projectFieldSamples({
      address: FOREIGN_133,
      opportunity,
      landing: 'first',
      training: true,
    })).toMatchObject({ kind: 'suppressed', reason: 'training', witness: { stardust: 0 } });
    expect(projectFieldSamples({
      address: FOREIGN_133,
      opportunity,
      landing: 'repeat',
      training: false,
    })).toMatchObject({ kind: 'suppressed', reason: 'repeat' });
    expect(projectFieldSamples({
      address: FOREIGN_133,
      opportunity,
      landing: 'unresolved-already-landed',
      training: false,
    })).toMatchObject({
      kind: 'suppressed',
      reason: 'unresolved-already-landed',
    });
  });

  it('requires registered, mutually-bound address and opportunity authority', () => {
    const opportunity = projectWorldOpportunity(FOREIGN_133);
    const clonedAddress = structuredClone(FOREIGN_133);
    const clonedOpportunity = structuredClone(opportunity);
    const otherAddress = world({
      galaxy: HOME_GALAXY,
      star: SOL_STAR,
      planet: { seed: 131 },
    });

    expect(() => projectFieldSamples({
      address: clonedAddress,
      opportunity,
      landing: 'first',
      training: false,
    })).toThrow(/registered canonical world address/);
    expect(() => projectFieldSamples({
      address: FOREIGN_133,
      opportunity: clonedOpportunity,
      landing: 'first',
      training: false,
    })).toThrow(/registered world opportunity/);
    expect(() => projectFieldSamples({
      address: otherAddress,
      opportunity,
      landing: 'first',
      training: false,
    })).toThrow(/same canonical world/);
  });

  it('returns immutable registered facts that reject clone authority', () => {
    const result = firstLanding(FOREIGN_133);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.witness)).toBe(true);
    expect(Object.isFrozen(result.witness.depositIds)).toBe(true);
    expect(isFieldSampleProjection(result)).toBe(true);
    expect(isFieldSampleProjection(structuredClone(result))).toBe(false);

    if (result.kind !== 'grant') throw new Error('expected collision grant');
    expect(Object.isFrozen(result.reward)).toBe(true);
    expect(Object.isFrozen(result.reward.materials)).toBe(true);
    expect(Object.isFrozen(result.reward.materials[0])).toBe(true);
    expect(() => {
      (result.reward.materials[0] as { id: string }).id = 'caller-mutated';
    }).toThrow();
  });
});

describe('Arc 0 field-sample bounded state derivation', () => {
  it('projects an all-or-nothing detached Cargo, Stardust, and stats update', () => {
    const opportunity = projectWorldOpportunity(FOREIGN_133);
    const firstMaterial = opportunity.deposits[0]!;
    const secondMaterial = opportunity.deposits[1]!;
    const source: Arc0FieldSampleState = {
      cargo: [[firstMaterial, 4], ['existing-material', 2]],
      essence: 7,
      stats: {
        essenceEarned: 11,
        landings: 3,
        duels: 9,
      },
    };
    const before = structuredClone(source);
    const result = deriveArc0FieldSamples({
      source,
      address: FOREIGN_133,
      opportunity,
      landing: 'first',
      training: false,
    });

    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') throw new Error('expected ready derivation');
    expect(result.projection.cargo).toEqual([
      [firstMaterial, 5],
      ['existing-material', 2],
      [secondMaterial, 1],
    ]);
    expect(result.projection.essence).toBe(7 + result.reward.stardust);
    expect(result.projection.stats).toEqual({
      essenceEarned: 11 + result.reward.stardust,
      landings: 4,
      duels: 9,
    });
    expect(source).toEqual(before);
  });

  it.each([
    {
      name: 'Cargo quantity',
      source: (): Arc0FieldSampleState => {
        const opportunity = projectWorldOpportunity(FOREIGN_133);
        return {
          ...emptyState(),
          cargo: [[opportunity.deposits[0]!, ARC0_FIELD_SAMPLE_CARGO_MAX]],
        };
      },
      detail: 'cargo-capacity',
    },
    {
      name: 'Cargo row count',
      source: (): Arc0FieldSampleState => ({
        ...emptyState(),
        cargo: Array.from(
          { length: ARC0_FIELD_SAMPLE_CARGO_ROWS_MAX },
          (_, index) => [`existing-${index}`, 1] as const,
        ),
      }),
      detail: 'cargo-capacity',
    },
    {
      name: 'Stardust',
      source: (): Arc0FieldSampleState => ({
        ...emptyState(),
        essence: ARC0_FIELD_SAMPLE_COUNTER_MAX,
      }),
      detail: 'essence-capacity',
    },
    {
      name: 'essenceEarned',
      source: (): Arc0FieldSampleState => ({
        ...emptyState(),
        stats: {
          essenceEarned: ARC0_FIELD_SAMPLE_COUNTER_MAX,
          landings: 0,
        },
      }),
      detail: 'essence-earned-capacity',
    },
    {
      name: 'landings',
      source: (): Arc0FieldSampleState => ({
        ...emptyState(),
        stats: {
          essenceEarned: 0,
          landings: ARC0_FIELD_SAMPLE_COUNTER_MAX,
        },
      }),
      detail: 'landings-capacity',
    },
  ])('refuses $name overflow with zero partial mutation', ({ source, detail }) => {
    const state = source();
    const before = structuredClone(state);
    const result = deriveArc0FieldSamples({
      source: state,
      address: FOREIGN_133,
      opportunity: projectWorldOpportunity(FOREIGN_133),
      landing: 'first',
      training: false,
    });

    expect(result).toMatchObject({ kind: 'refused', detail });
    expect(state).toEqual(before);
  });

  it('does not expose mutable aliases to caller input or output', () => {
    const source = emptyState();
    const result = deriveArc0FieldSamples({
      source,
      address: FOREIGN_133,
      opportunity: projectWorldOpportunity(FOREIGN_133),
      landing: 'first',
      training: false,
    });
    if (result.kind !== 'ready') throw new Error('expected ready derivation');
    const firstQuantity = result.projection.cargo[0]?.[1];

    source.cargo.push(['late-caller-change', 12]);
    source.stats.landings = 9;
    expect(result.projection.cargo[0]?.[1]).toBe(firstQuantity);
    expect(result.projection.stats.landings).toBe(1);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.projection)).toBe(true);
    expect(Object.isFrozen(result.projection.cargo)).toBe(true);
    expect(Object.isFrozen(result.projection.cargo[0])).toBe(true);
    expect(Object.isFrozen(result.projection.stats)).toBe(true);
    expect(() => {
      (result.projection.cargo[0] as [string, number])[1] = 99;
    }).toThrow();
  });
});
