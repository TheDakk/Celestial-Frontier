import { describe, expect, it, vi } from 'vitest';
import {
  makeGearSourceActionId,
  resolveLegacyConquestImbuePlan,
  rollExceptionalCraftModifier,
  rollLegacyAffix,
} from '@cf/domain-loot';

/* Every loot roll is drawn from a seed its caller injects (a receipt identity, a
   planet seed). Handed no seed, each refuses; none falls back to Math.random. */
describe('@cf/domain-loot — rolls need an injected seed', () => {
  it('refuses a missing seed and never calls Math.random', () => {
    const random = vi.spyOn(Math, 'random');
    try {
      const craftSource = makeGearSourceActionId({
        kind: 'craft', ownerId: 'legacy-v1.8.9-items', actionKey: 'recipe:rig1', receiptId: 'receipt:33',
      });
      const affix = rollLegacyAffix as (seed: unknown, tier: number) => unknown;
      expect(() => affix(undefined, 1)).toThrow('legacy affix seed');
      const craft = rollExceptionalCraftModifier as (baseId: string, source: string, seed: unknown) => unknown;
      expect(() => craft('rig1', craftSource, undefined)).toThrow('exceptional craft generationSeed');
      const conquest = resolveLegacyConquestImbuePlan as (input: unknown) => unknown;
      expect(() => conquest({ worldTier: 1, equipped: [{ slot: 'tool', baseId: 'rig1' }] }))
        .toThrow('legacy conquest planetSeed');

      rollLegacyAffix(1, 1);
      rollExceptionalCraftModifier('rig1', craftSource, 0x1234_5678);
      resolveLegacyConquestImbuePlan({ planetSeed: 1, worldTier: 1, equipped: [{ slot: 'tool', baseId: 'rig1' }] });
      expect(random).not.toHaveBeenCalled();
    } finally {
      random.mockRestore();
    }
  });
});
