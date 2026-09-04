import { describe, expect, it } from 'vitest';
import * as lootRoot from '@cf/domain-loot';
import {
  GEAR_INVENTORY_SCHEMA,
  decodeGearInventory,
  isAcquisitionCapabilitySnapshot,
  isEngineeringCapabilitySnapshot,
  makeGearSourceActionId,
  migrateLegacyGear,
  projectAcquisitionCapabilities,
  projectEngineeringCapabilities,
} from '@cf/domain-loot';
import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal';

const sourceActionId = makeGearSourceActionId({
  kind: 'legacy-migration',
  ownerId: 'engineering-capability-test',
  actionKey: 'items-v1',
  receiptId: 'migration:v4-v5',
});

function equippedInventory() {
  const migrated = migrateLegacyGear({
    sourceActionId,
    itemCounts: [
      ['rig3', 1], ['headlamp', 1], ['cg-corona', 1],
      ['prismpendant', 1], ['cg-void', 1],
    ],
    equipped: {
      tool: 'rig3', helmet: 'headlamp', suit: 'cg-corona',
      necklace: 'prismpendant', legs: 'cg-void',
    },
    equippedAffixes: { tool: { k: 'yield', v: 0.25, forId: 'rig3' } },
  });
  return decodeGearInventory(JSON.stringify({
    schema: GEAR_INVENTORY_SCHEMA,
    revision: 7,
    capacity: 8,
    entries: migrated.instances.map((instance) => ({ instance, favorite: false, locked: false })),
    equipped: migrated.equipped,
    pendingRewards: [],
  }));
}

function contactInventory() {
  const migrated = migrateLegacyGear({
    sourceActionId,
    itemCounts: [['earpiece', 1], ['diplobeacon', 1], ['prismpendant', 1]],
    equipped: { ears: 'earpiece', necklace: 'diplobeacon' },
    equippedAffixes: { ears: { k: 'contact', v: 7, forId: 'earpiece' } },
  });
  return decodeGearInventory(JSON.stringify({
    schema: GEAR_INVENTORY_SCHEMA,
    revision: 11,
    capacity: 6,
    entries: migrated.instances.map((instance) => ({ instance, favorite: false, locked: false })),
    equipped: migrated.equipped,
    pendingRewards: [],
  }));
}

describe('@cf/domain-loot — registered engineering capabilities', () => {
  it('derives exact worn effects and positive built systems without multiplying system copies', () => {
    const loadout = registerArc2EngineeringLoadout(equippedInventory(), [
      { baseId: 'plate', count: 4 },
      { baseId: 'jumpdrive', count: 1 },
      { baseId: 'autoext', count: 3 },
      { baseId: 'cscoop', count: 9 },
    ]);
    const capabilities = projectEngineeringCapabilities(loadout);

    expect(capabilities).toMatchObject({
      schema: 'cf-v2-engineering-capabilities/v1',
      inventoryRevision: 7,
      miningYieldBonus: 2.25,
      richStrikeChanceBonus: 0.08,
      autoExtractor: true,
      jumpDrive: true,
      coronaScoop: true,
      stellarSkimBonus: 1,
      stellarSkimGuard: true,
      explorerMealHealBonus: 0.2,
      bioscanDamageReduction: 0.7,
      travelSpeedBonus: 1,
    });
    expect(capabilities.systemIds).toEqual(['jumpdrive', 'autoext', 'cscoop']);
    expect(capabilities.equippedInstanceIds).toHaveLength(5);
    expect(capabilities.fingerprint).toMatch(/^ec1:/);
    expect(Object.isFrozen(capabilities)).toBe(true);
    expect(Object.isFrozen(capabilities.equippedInstanceIds)).toBe(true);
    expect(isEngineeringCapabilitySnapshot(capabilities)).toBe(true);
    expect(isEngineeringCapabilitySnapshot({ ...capabilities })).toBe(false);
  });

  it('binds the fingerprint to exact equipped content and rejects malformed system authority', () => {
    const inventory = equippedInventory();
    const withSystems = projectEngineeringCapabilities(registerArc2EngineeringLoadout(
      inventory, [{ baseId: 'jumpdrive', count: 1 }],
    ));
    const withoutSystems = projectEngineeringCapabilities(registerArc2EngineeringLoadout(inventory, []));
    expect(withSystems.fingerprint).not.toBe(withoutSystems.fingerprint);
    expect(() => registerArc2EngineeringLoadout(inventory, [
      { baseId: 'jumpdrive', count: 1 },
      { baseId: 'jumpdrive', count: 1 },
    ])).toThrow(/repeat/);
    expect(() => registerArc2EngineeringLoadout(inventory, [{ baseId: 'rig1', count: 1 }]))
      .toThrow(/not a canonical stackable/);
    expect(() => registerArc2EngineeringLoadout(inventory, [{ baseId: 'jumpdrive', count: 0 }]))
      .toThrow(/integer/);

    const raw = JSON.parse(JSON.stringify(inventory)) as {
      equipped: Array<{ slot: string; instanceId: string }>;
    };
    raw.equipped[0]!.instanceId = 'gear1|forged';
    expect(() => registerArc2EngineeringLoadout(raw as never, []))
      .toThrow(/missing instance/);
  });

  it('does not expose a root self-mint and rejects loose or cloned loadout authority', () => {
    expect('registerArc2EngineeringLoadout' in lootRoot).toBe(false);
    const inventory = equippedInventory();
    const registered = registerArc2EngineeringLoadout(inventory, []);
    const looseProjector = projectEngineeringCapabilities as (...args: unknown[]) => unknown;
    expect(() => looseProjector(inventory, []))
      .toThrow(/registered Arc 2 loadout/);
    expect(() => projectEngineeringCapabilities({ ...registered }))
      .toThrow(/registered Arc 2 loadout/);
  });

  it('derives registered capture contact points only from exact equipped instances', () => {
    const inventory = contactInventory();
    const loadout = registerArc2EngineeringLoadout(inventory, [
      { baseId: 'jumpdrive', count: 1 },
    ]);
    const capability = projectAcquisitionCapabilities(loadout);

    expect(capability).toEqual({
      schema: 'cf-v2-acquisition-capabilities/v1',
      fingerprint: expect.stringMatching(/^ac1:/),
      inventoryRevision: 11,
      equippedInstanceIds: inventory.equipped.map(({ instanceId }) => instanceId),
      contactCaptureBonus: 37,
    });
    expect(Object.isFrozen(capability)).toBe(true);
    expect(Object.isFrozen(capability.equippedInstanceIds)).toBe(true);
    expect(isAcquisitionCapabilitySnapshot(capability)).toBe(true);
    expect(isAcquisitionCapabilitySnapshot({ ...capability })).toBe(false);

    const unequippedPendant = inventory.entries.find(({ instance }) =>
      instance.baseId === 'prismpendant')!.instance.instanceId;
    expect(capability.equippedInstanceIds).not.toContain(unequippedPendant);
  });

  it('binds capture capability to the registered loadout and rejects loose authority', () => {
    const inventory = contactInventory();
    const loadout = registerArc2EngineeringLoadout(inventory, []);
    const capability = projectAcquisitionCapabilities(loadout);
    const raw = JSON.parse(JSON.stringify(inventory)) as {
      equipped: Array<{ slot: string; instanceId: string }>;
    };
    raw.equipped = raw.equipped.filter(({ slot }) => slot !== 'necklace');
    const withoutNecklace = projectAcquisitionCapabilities(registerArc2EngineeringLoadout(
      decodeGearInventory(JSON.stringify(raw)),
      [],
    ));
    expect(withoutNecklace.contactCaptureBonus).toBe(17);
    expect(withoutNecklace.fingerprint).not.toBe(capability.fingerprint);
    expect(() => projectAcquisitionCapabilities({ ...loadout }))
      .toThrow(/registered Arc 2 loadout/);
    expect(() => (projectAcquisitionCapabilities as (...args: unknown[]) => unknown)(inventory))
      .toThrow(/registered Arc 2 loadout/);
  });
});
