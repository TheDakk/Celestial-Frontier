import { describe, expect, it } from 'vitest';
import * as lootRoot from '@cf/domain-loot';
import {
  GEAR_INVENTORY_SCHEMA,
  decodeGearInventory,
  isEngineeringCapabilitySnapshot,
  makeGearSourceActionId,
  migrateLegacyGear,
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
    itemCounts: [['rig3', 1], ['headlamp', 1], ['cg-corona', 1]],
    equipped: { tool: 'rig3', helmet: 'headlamp', suit: 'cg-corona' },
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
      richStrikeChanceBonus: 0.06,
      autoExtractor: true,
      jumpDrive: true,
      coronaScoop: true,
      stellarSkimBonus: 1,
      stellarSkimGuard: true,
    });
    expect(capabilities.systemIds).toEqual(['jumpdrive', 'autoext', 'cscoop']);
    expect(capabilities.equippedInstanceIds).toHaveLength(3);
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
});
