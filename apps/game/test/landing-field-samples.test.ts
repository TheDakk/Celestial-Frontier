// First-landing field samples in the hold. LEGACY celestial-frontier.html, v1.8.9: `grantFieldSamples` 13681-13695,
// `noteLanding` 13192-13206; the hold's ceilings are the save's own (16710).
import { describe, expect, it } from 'vitest';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { FIELD_SAMPLE_CARGO_MAX, FIELD_SAMPLE_STARDUST_MAX, deriveFieldSamples } from '../src/landing';
import { SOL, solWorld } from './landing-support';

const mars = solWorld(SOL.mars);
const world = projectWorldOpportunity(mars);
const [first, second] = world.deposits as readonly [string, string];
const source = () => ({ cargo: [[first, 4]] as Array<[string, number]>, essence: 7, stats: { essenceEarned: 20, landings: 2, surveys: 9 } });
const derive = (over: Partial<Parameters<typeof deriveFieldSamples>[0]> = {}) =>
  deriveFieldSamples({ source: source(), address: mars, opportunity: world, landing: 'first', training: false, ...over });

describe('first-landing field samples', () => {
  it('one of each of the first two deposits, 3 + 2 × the tier in Stardust, and one landing counted', () => {
    const stardust = 3 + 2 * world.effectiveTier;
    const before = source();
    const derived = derive({ source: before });
    expect(derived.kind).toBe('ready');
    if (derived.kind !== 'ready') return;
    expect(derived.reward).toEqual({ stardust, materials: [{ id: first, quantity: 1 }, { id: second, quantity: 1 }] });
    const cargo = new Map(derived.fields.cargo);
    expect(cargo.get(first)).toBe(4 + (first === second ? 2 : 1));
    expect(cargo.get(second)).toBe(first === second ? 6 : 1);
    expect(derived.fields.essence).toBe(7 + stardust);
    expect(derived.fields.stats).toEqual({ essenceEarned: 20 + stardust, landings: 3, surveys: 9 });
    // The caller's own fields are not touched.
    expect(before).toEqual(source());
  });

  it('none on Earth, in training, on a world landed on before, or on one the save knows as landed by its seed', () => {
    const earth = solWorld(SOL.earth);
    expect(derive({ address: earth, opportunity: projectWorldOpportunity(earth) })).toEqual({ kind: 'unchanged', reason: 'canonical-earth' });
    expect(derive({ training: true })).toEqual({ kind: 'unchanged', reason: 'training' });
    expect(derive({ landing: 'repeat' })).toEqual({ kind: 'unchanged', reason: 'repeat' });
    expect(derive({ landing: 'unresolved-already-landed' })).toEqual({ kind: 'unchanged', reason: 'unresolved-already-landed' });
  });

  it('a full hold and a full purse are held at the save\'s ceilings, and the landing is still counted', () => {
    const derived = derive({ source: { cargo: [[first, FIELD_SAMPLE_CARGO_MAX]], essence: FIELD_SAMPLE_STARDUST_MAX, stats: {} } });
    expect(derived.kind).toBe('ready');
    if (derived.kind !== 'ready') return;
    expect(new Map(derived.fields.cargo).get(first)).toBe(FIELD_SAMPLE_CARGO_MAX);
    expect(derived.fields.essence).toBe(FIELD_SAMPLE_STARDUST_MAX);
    expect(derived.fields.stats).toEqual({ essenceEarned: 3 + 2 * world.effectiveTier, landings: 1 });
  });

  it('facts of another world are refused', () => {
    expect(() => derive({ opportunity: projectWorldOpportunity(solWorld(SOL.venus)) })).toThrow();
  });
});
