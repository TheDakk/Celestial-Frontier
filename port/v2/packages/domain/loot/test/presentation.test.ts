import { describe, expect, it } from 'vitest';
import {
  compareGear,
  createGearInstance,
  createGearInventory,
  equippedBuildTags,
  equipGear,
  filterGearEntries,
  grantGear,
  inspectGear,
  makeGearSourceActionId,
  migrateLegacyGear,
} from '@cf/domain-loot';

const source = makeGearSourceActionId({ kind: 'discovery', ownerId: 'earth-133', actionKey: 'survey-1' });
const gear = (ordinal: number) => createGearInstance(source, ordinal, {
  baseId: ordinal % 2 === 0 ? 'fieldsuit' : 'rig1',
  generationSeed: 0x2000 + ordinal,
  itemLevel: ordinal + 1,
  quality: ordinal,
  rarityTier: ordinal % 2 === 0 ? 1 : 3,
  naturalAffixes: ordinal % 2 === 0 ? [] : [{ affixId: 'strike', tier: 1, value: 0.02, role: 'prefix' }],
  craftedModifier: null,
  drawback: null,
  upgrade: 0,
  sockets: [],
});
const committed = <T extends { readonly status: string; readonly state?: unknown }>(value: T) => {
  if (value.status !== 'committed' || !value.state) throw new Error(`expected committed, got ${value.status}`);
  return value.state as ReturnType<typeof createGearInventory>;
};

describe('@cf/domain-loot — honest inspect, comparison, filters, and build tags', () => {
  it('inspects immutable construction/provenance without inventing a composite score', () => {
    const instance = gear(0);
    const view = inspectGear(instance);
    expect(view).toMatchObject({
      instanceId: instance.instanceId,
      baseId: instance.baseId,
      slot: instance.slot,
      itemLevel: instance.itemLevel,
      quality: instance.quality,
      rarity: instance.rarity,
      provenance: instance.provenance,
    });
    expect(view.effects).toEqual([
      { key: 'scut', value: 0.25, source: 'base', percent: true, label: 'scut' },
      { key: 'land', value: 5, source: 'base', percent: false, label: 'land' },
    ]);
    expect(view).not.toHaveProperty('score');
    expect(Object.isFrozen(view.effects)).toBe(true);
  });

  it('shows every explicit effect delta and reports incompatible slots', () => {
    const before = gear(0);
    const candidate = gear(1);
    const comparison = compareGear(candidate, before);
    expect(comparison.compatibleSlot).toBe(candidate.slot === before.slot);
    expect(comparison.itemLevelDelta).toBe(candidate.itemLevel - before.itemLevel);
    expect(comparison.qualityDelta).toBe(candidate.quality - before.quality);
    expect(inspectGear(candidate).effects).toEqual([
      { key: 'yield', value: 0.5, source: 'base', percent: true, label: 'yield' },
      { key: 'strike', value: 0.02, source: 'prefix', percent: true, label: 'rich-strike chance' },
    ]);
    expect(comparison.effects).toEqual([
      { key: 'land', equipped: 5, candidate: 0, delta: -5 },
      { key: 'scut', equipped: 0.25, candidate: 0, delta: -0.25 },
      { key: 'strike', equipped: 0, candidate: 0.02, delta: 0.02 },
      { key: 'yield', equipped: 0, candidate: 0.5, delta: 0.5 },
    ]);
    const control = structuredClone(comparison) as unknown as {
      effects: Array<{ candidate: number }>;
    };
    if (control.effects[0]) control.effects[0].candidate += 1;
    expect(control).not.toEqual(comparison);
  });

  it('filters exact entries and derives stable tags only from equipped instances', () => {
    const instances = [gear(2), gear(3), gear(4), gear(5)];
    let inventory = createGearInventory(8);
    for (const instance of instances) inventory = committed(grantGear(inventory, inventory.revision, instance));
    inventory = committed(equipGear(inventory, inventory.revision, instances[0]!.instanceId));
    const equipped = filterGearEntries(inventory, { equippedOnly: true });
    expect(equipped.map((entry) => entry.instance.instanceId)).toEqual([instances[0]!.instanceId]);
    expect(equippedBuildTags(inventory)).toEqual([...instances[0]!.tags].sort());

    const tagged = filterGearEntries(inventory, { tags: ['yield'] });
    expect(tagged.map((entry) => entry.instance.instanceId)).toEqual([
      instances[1]!.instanceId, instances[3]!.instanceId,
    ]);
    expect(filterGearEntries(inventory, { query: 'Mining Rig I' }).map((entry) => entry.instance.instanceId))
      .toEqual([instances[1]!.instanceId, instances[3]!.instanceId]);
    const exactFacet = filterGearEntries(inventory, {
      slots: [instances[1]!.slot], rarities: [instances[1]!.rarity],
    });
    expect(exactFacet.length).toBeGreaterThan(0);
    expect(exactFacet.some((entry) => entry.instance.instanceId === instances[1]!.instanceId)).toBe(true);
    expect(exactFacet.every((entry) => entry.instance.slot === instances[1]!.slot
      && entry.instance.rarity === instances[1]!.rarity)).toBe(true);
    expect(() => filterGearEntries(inventory, { slots: ['cargo' as never] })).toThrow('unsupported');
  });

  it('finds a migrated affix by its visible legacy label', () => {
    const migrationSource = makeGearSourceActionId({
      kind: 'legacy-migration', ownerId: 'v4-save', actionKey: 'gear', receiptId: 'migration:v4-v5',
    });
    const migrated = migrateLegacyGear({
      sourceActionId: migrationSource,
      itemCounts: [['fieldsuit', 1]],
      equipped: { suit: 'fieldsuit' },
      equippedAffixes: { suit: { k: 'yield', v: 0.20, forId: 'fieldsuit' } },
    }).instances[0]!;
    const held = committed(grantGear(createGearInventory(1), 0, migrated));
    expect(filterGearEntries(held, { query: 'mining yield' }).map((entry) => entry.instance.instanceId))
      .toEqual([migrated.instanceId]);
    expect(filterGearEntries(held, { query: 'flora healing' })).toEqual([]);
  });
});
