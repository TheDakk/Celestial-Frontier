import { describe, expect, it } from 'vitest';
import {
  createGearInstance,
  createGearInventory,
  equipGear,
  grantGear,
  makeGearSourceActionId,
  migrateLegacyGear,
  type GearInventory,
} from '@cf/domain-loot';
import {
  planArc2InventoryAction,
  projectArc2LegacyAction,
  type Arc2LegacyInventoryProjection,
} from '../apps/game/src/inventory-actions.js';

const source = makeGearSourceActionId({
  kind: 'discovery', ownerId: 'inventory-action-test', actionKey: 'exact-action',
});

function generated(ordinal: number, baseId: string) {
  return createGearInstance(source, ordinal, {
    baseId,
    generationSeed: 0xabc0 + ordinal,
    itemLevel: 1,
    quality: 0,
    rarityTier: 1,
    naturalAffixes: [],
    craftedModifier: null,
    drawback: null,
    upgrade: 0,
    sockets: [],
  });
}

function committed(value: { readonly status: string; readonly state?: GearInventory }): GearInventory {
  if (value.status !== 'committed' || !value.state) throw new Error(`expected committed, got ${value.status}`);
  return value.state;
}

function projection(): Arc2LegacyInventoryProjection {
  return {
    items: [['rl-star', 2], ['rig1', 1]],
    equip: {},
    equipAff: {},
    cargo: [['Au', 999_999], ['Pt', 2]],
  };
}

describe('Arc 2 Inventory app projection', () => {
  it('equips and unequips the exact migrated instance with its legacy affix', () => {
    const migrated = migrateLegacyGear({
      sourceActionId: makeGearSourceActionId({
        kind: 'legacy-migration', ownerId: 'save-v2-user', actionKey: 'items-v1',
        receiptId: 'migration:v4-v5',
      }),
      itemCounts: [['rig1', 1]],
      equipped: { tool: 'rig1' },
      equippedAffixes: { tool: { k: 'yield', v: 0.05, forId: 'rig1' } },
    }).instances[0]!;
    let inventory = committed(grantGear(createGearInventory(4), 0, migrated));
    const equip = planArc2InventoryAction(inventory, 'equip', migrated.instanceId);
    expect(equip.kind).toBe('ready');
    if (equip.kind !== 'ready') return;
    const draft = projection();
    projectArc2LegacyAction(draft, 'equip', equip);
    expect(draft.equip).toEqual({ tool: 'rig1' });
    expect(draft.equipAff).toEqual({ tool: { k: 'yield', v: 0.05, forId: 'rig1' } });

    inventory = equip.state;
    const unequip = planArc2InventoryAction(inventory, 'unequip', migrated.instanceId);
    expect(unequip.kind).toBe('ready');
    if (unequip.kind !== 'ready') return;
    projectArc2LegacyAction(draft, 'unequip', unequip);
    expect(draft.equip).toEqual({});
    expect(draft.equipAff).toEqual({});
  });

  it('projects exact legacy salvage counts at the material cap without touching another item', () => {
    const item = generated(1, 'rl-star');
    const inventory = committed(grantGear(createGearInventory(4), 0, item));
    const plan = planArc2InventoryAction(inventory, 'salvage', item.instanceId);
    expect(plan.kind).toBe('ready');
    if (plan.kind !== 'ready') return;
    expect(plan.salvageYield).toEqual({
      policy: 'legacy-v1.8.9-direct-material-half',
      baseId: 'rl-star',
      materials: [{ materialId: 'Au', quantity: 2 }, { materialId: 'Pt', quantity: 1 }],
    });
    const draft = projection();
    draft.cargo[0]![1] = 999_998;
    expect(projectArc2LegacyAction(draft, 'salvage', plan)).toEqual({ kind: 'projected' });
    expect(draft.items).toEqual([['rl-star', 1], ['rig1', 1]]);
    expect(draft.cargo).toEqual([['Au', 1_000_000], ['Pt', 3]]);
  });

  it('refuses salvage atomically instead of saturating and discarding over-cap material', () => {
    const item = generated(5, 'rl-star');
    const inventory = committed(grantGear(createGearInventory(4), 0, item));
    const plan = planArc2InventoryAction(inventory, 'salvage', item.instanceId);
    expect(plan.kind).toBe('ready');
    if (plan.kind !== 'ready') return;
    const draft = projection();
    const before = structuredClone(draft);
    expect(projectArc2LegacyAction(draft, 'salvage', plan)).toEqual({
      kind: 'refused', detail: 'cargo-capacity',
    });
    expect(draft).toEqual(before);

    const invalid = projection();
    invalid.cargo.push(['Au', 1]);
    const invalidBefore = structuredClone(invalid);
    expect(projectArc2LegacyAction(invalid, 'salvage', plan)).toEqual({
      kind: 'refused', detail: 'cargo-invalid',
    });
    expect(invalid).toEqual(invalidBefore);
  });

  it('claims one exact pending reward without inventing a legacy compatibility edit', () => {
    const held = generated(2, 'fieldsuit');
    const pending = generated(3, 'rig1');
    let inventory = committed(grantGear(createGearInventory(1), 0, held));
    inventory = committed(grantGear(inventory, inventory.revision, pending));
    inventory = committed({
      ...(() => {
        const unequipped = equipGear(inventory, inventory.revision, held.instanceId);
        if (unequipped.status !== 'committed') throw new Error('expected held equip');
        return unequipped;
      })(),
    });
    expect(planArc2InventoryAction(inventory, 'pending-claim', pending.instanceId)).toEqual({
      kind: 'refused', detail: 'capacity',
    });
    const afterRemoval = planArc2InventoryAction(inventory, 'salvage', held.instanceId);
    expect(afterRemoval).toEqual({ kind: 'refused', detail: 'protected' });

    /* A separate truthful free-capacity carrier proves the claim projection
       itself is extension-only and cannot rewrite legacy item/cargo fields. */
    let roomy = committed(grantGear(createGearInventory(2), 0, held));
    roomy = committed(grantGear(roomy, roomy.revision, pending));
    const encoded = structuredClone(roomy) as GearInventory;
    const pendingCarrier: GearInventory = Object.freeze({
      ...encoded,
      entries: Object.freeze(encoded.entries.filter((entry) => entry.instance.instanceId !== pending.instanceId)),
      pendingRewards: Object.freeze([{ instance: pending, reason: 'capacity' as const }]),
    });
    const claim = planArc2InventoryAction(pendingCarrier, 'pending-claim', pending.instanceId);
    expect(claim.kind).toBe('ready');
    if (claim.kind !== 'ready') return;
    const draft = projection();
    const before = structuredClone(draft);
    projectArc2LegacyAction(draft, 'pending-claim', claim);
    expect(draft).toEqual(before);
  });

  it('refuses missing and already-equipped requests before any receipt is consumed', () => {
    const item = generated(4, 'fieldsuit');
    let inventory = committed(grantGear(createGearInventory(2), 0, item));
    expect(planArc2InventoryAction(inventory, 'equip', 'missing')).toEqual({ kind: 'refused', detail: 'missing' });
    inventory = committed(equipGear(inventory, inventory.revision, item.instanceId));
    expect(planArc2InventoryAction(inventory, 'equip', item.instanceId)).toEqual({
      kind: 'unchanged', detail: 'already-equipped',
    });
  });
});
