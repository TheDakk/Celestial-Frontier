import { hashInt } from '@cf/domain-rand';
import { describe, expect, it } from 'vitest';
import {
  resolveLegacyConquestImbuePlan,
  resolveLegacyExceptionalCraftImbuePlan,
  rollLegacyAffix,
  type LegacyWornBase,
} from '@cf/domain-loot';

const allNineWorn: readonly LegacyWornBase[] = [
  { slot: 'tool', baseId: 'rig1' },
  { slot: 'boots', baseId: 'magboots' },
  { slot: 'helmet', baseId: 'headlamp' },
  { slot: 'legs', baseId: 'fieldlegs' },
  { slot: 'module', baseId: 'struts' },
  { slot: 'ears', baseId: 'earpiece' },
  { slot: 'gloves', baseId: 'gripgloves' },
  { slot: 'suit', baseId: 'fieldsuit' },
  { slot: 'necklace', baseId: 'meteor' },
];

describe('@cf/domain-loot — pure legacy earned-affix evidence', () => {
  it('replays the exact conquest gate and canonical worn-slot selection without mutating gear', () => {
    expect(resolveLegacyConquestImbuePlan({
      planetSeed: 0,
      worldTier: 1,
      equipped: allNineWorn,
    })).toEqual({
      authority: 'legacy-v1.8.9-earned-affix-plan',
      status: 'not-planned',
      source: 'conquest',
      reason: 'conquest-gate-missed',
    });

    const planned = resolveLegacyConquestImbuePlan({
      planetSeed: 1,
      worldTier: 1,
      equipped: [...allNineWorn].reverse(),
    });
    expect(planned).toEqual({
      authority: 'legacy-v1.8.9-earned-affix-plan',
      status: 'planned',
      source: 'conquest',
      affix: { key: 'yield', value: 0.19 },
      affixSeed: 1,
      slot: 'legs',
      baseId: 'fieldlegs',
      legacyApplication: 'replace-slot-bound-affix',
    });
    expect(planned).not.toHaveProperty('instance');
    expect(planned.status === 'planned' ? planned.affix : null).not.toHaveProperty('role');
    expect(resolveLegacyConquestImbuePlan({ planetSeed: 1, worldTier: 1, equipped: [] }))
      .toMatchObject({ status: 'not-planned', reason: 'no-equipped-gear' });
  });

  it('requires every direct material unit, an empty matching slot, and no live affix', () => {
    const completedCraftCount = 7;
    const affixSeed = hashInt(0xF07E, completedCraftCount, 0) >>> 0;
    const planned = resolveLegacyExceptionalCraftImbuePlan({
      baseId: 'meteor',
      completedCraftCount,
      exceptionalMaterialStock: { Ni: 2, C: 1 },
      matchingSlotWasEmpty: true,
      liveSlotAffixPresentAfterAutoEquip: false,
    });
    expect(planned).toEqual({
      authority: 'legacy-v1.8.9-earned-affix-plan',
      status: 'planned',
      source: 'exceptional-craft',
      affix: rollLegacyAffix(affixSeed, 1),
      affixSeed,
      slot: 'necklace',
      baseId: 'meteor',
      legacyApplication: 'set-empty-slot-bound-affix',
    });
    expect(planned).not.toHaveProperty('instance');

    expect(resolveLegacyExceptionalCraftImbuePlan({
      baseId: 'rig1', completedCraftCount, exceptionalMaterialStock: {},
      matchingSlotWasEmpty: true, liveSlotAffixPresentAfterAutoEquip: false,
    })).toMatchObject({ status: 'not-planned', reason: 'direct-material-cost-absent' });
    expect(resolveLegacyExceptionalCraftImbuePlan({
      baseId: 'meteor', completedCraftCount, exceptionalMaterialStock: { Ni: 2 },
      matchingSlotWasEmpty: true, liveSlotAffixPresentAfterAutoEquip: false,
    })).toMatchObject({ status: 'not-planned', reason: 'direct-materials-not-all-exceptional' });
    expect(resolveLegacyExceptionalCraftImbuePlan({
      baseId: 'meteor', completedCraftCount, exceptionalMaterialStock: { Ni: 2, C: 1 },
      matchingSlotWasEmpty: false, liveSlotAffixPresentAfterAutoEquip: false,
    })).toMatchObject({ status: 'not-planned', reason: 'matching-slot-was-occupied' });
    expect(resolveLegacyExceptionalCraftImbuePlan({
      baseId: 'meteor', completedCraftCount, exceptionalMaterialStock: { Ni: 2, C: 1 },
      matchingSlotWasEmpty: true, liveSlotAffixPresentAfterAutoEquip: true,
    })).toMatchObject({ status: 'not-planned', reason: 'live-slot-affix-would-be-clobbered' });
  });
});
