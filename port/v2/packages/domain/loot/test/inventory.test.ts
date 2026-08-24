import { describe, expect, it } from 'vitest';
import {
  claimPendingGear,
  createGearInstance,
  createGearInventory,
  decodeGearInventory,
  encodeGearInventory,
  equipGear,
  grantGear,
  makeGearSourceActionId,
  previewGearSalvage,
  salvageGear,
  setGearProtection,
  unequipGear,
} from '@cf/domain-loot';

const source = makeGearSourceActionId({
  kind: 'expedition', ownerId: 'dispatch-7', actionKey: 'return', missionId: 'mission:7',
});
const gearFromBase = (
  ordinal: number,
  baseId: string,
  axes: Readonly<{ itemLevel?: number; quality?: number; rarityTier?: number }> = {},
) => createGearInstance(source, ordinal, {
  baseId,
  generationSeed: 0x1000 + ordinal,
  itemLevel: axes.itemLevel ?? 1,
  quality: axes.quality ?? 0,
  rarityTier: axes.rarityTier ?? 1,
  naturalAffixes: [],
  craftedModifier: null,
  drawback: null,
  upgrade: 0,
  sockets: [],
});
const gear = (ordinal: number) => gearFromBase(ordinal, ordinal % 2 === 0 ? 'fieldsuit' : 'rig1');

function committedState(result: { readonly status: string; readonly state?: unknown }) {
  if (result.status !== 'committed' || !result.state) throw new Error(`expected committed, got ${result.status}`);
  return result.state as ReturnType<typeof createGearInventory>;
}

describe('@cf/domain-loot — exact-instance Inventory', () => {
  it('moves full-capacity rewards to explicit pending state and later claims the exact object', () => {
    const first = gear(0);
    const second = gear(1);
    const initial = createGearInventory(1);
    const granted = grantGear(initial, 0, first);
    expect(granted.status).toBe('committed');
    if (granted.status !== 'committed') return;
    expect(granted.location).toBe('inventory');
    const overflow = grantGear(granted.state, 1, second);
    expect(overflow.status).toBe('committed');
    if (overflow.status !== 'committed') return;
    expect(overflow.location).toBe('pending');
    expect(overflow.state.entries.map((entry) => entry.instance.instanceId)).toEqual([first.instanceId]);
    expect(overflow.state.pendingRewards.map((reward) => reward.instance.instanceId)).toEqual([second.instanceId]);
    expect(grantGear(overflow.state, 2, second)).toEqual({ status: 'duplicate', instanceId: second.instanceId });
    expect(claimPendingGear(overflow.state, 2, second.instanceId)).toEqual({ status: 'capacity', instanceId: second.instanceId });

    const salvaged = salvageGear(overflow.state, 2, first.instanceId);
    expect(salvaged).toMatchObject({
      status: 'committed',
      yield: {
        policy: 'legacy-v1.8.9-direct-material-half',
        baseId: 'fieldsuit',
        materials: [],
      },
    });
    const afterSalvage = committedState(salvaged);
    const claimed = claimPendingGear(afterSalvage, 3, second.instanceId);
    const finalState = committedState(claimed);
    expect(finalState.entries.map((entry) => entry.instance.instanceId)).toEqual([second.instanceId]);
    expect(finalState.pendingRewards).toEqual([]);
    expect(finalState.revision).toBe(4);
  });

  it('equips, unequips, and salvages by exact instanceId with stale and missing rejection', () => {
    const one = gear(3);
    const two = gear(4);
    let state = committedState(grantGear(createGearInventory(4), 0, one));
    state = committedState(grantGear(state, 1, two));
    expect(equipGear(state, 1, one.instanceId)).toEqual({ status: 'stale', expectedRevision: 1, actualRevision: 2 });
    expect(equipGear(state, 2, 'gear1|loot1|field|missing|action|0')).toEqual({
      status: 'missing', instanceId: 'gear1|loot1|field|missing|action|0',
    });
    const equipped = equipGear(state, 2, one.instanceId);
    state = committedState(equipped);
    expect(state.equipped).toEqual([{ slot: one.slot, instanceId: one.instanceId }]);
    expect(salvageGear(state, 3, one.instanceId)).toEqual({ status: 'protected', instanceId: one.instanceId, reason: 'equipped' });
    state = committedState(unequipGear(state, 3, one.instanceId));
    const removed = salvageGear(state, 4, one.instanceId);
    state = committedState(removed);
    expect(state.entries.some((entry) => entry.instance.instanceId === one.instanceId)).toBe(false);
    expect(state.entries.some((entry) => entry.instance.instanceId === two.instanceId)).toBe(true);
    expect(salvageGear(state, 5, one.instanceId)).toEqual({ status: 'missing', instanceId: one.instanceId });
  });

  it('requires inspectable favorite/lock removal before destructive salvage', () => {
    const item = gear(8);
    let state = committedState(grantGear(createGearInventory(2), 0, item));
    state = committedState(setGearProtection(state, 1, item.instanceId, { favorite: true, locked: false }));
    expect(salvageGear(state, 2, item.instanceId)).toEqual({ status: 'protected', instanceId: item.instanceId, reason: 'favorite' });
    state = committedState(setGearProtection(state, 2, item.instanceId, { favorite: false, locked: true }));
    expect(salvageGear(state, 3, item.instanceId)).toEqual({ status: 'protected', instanceId: item.instanceId, reason: 'locked' });
  });

  it('returns only the exact v1.8.9 direct-material salvage output', () => {
    expect(previewGearSalvage(gearFromBase(20, 'rl-star'))).toEqual({
      policy: 'legacy-v1.8.9-direct-material-half',
      baseId: 'rl-star',
      materials: [
        { materialId: 'Au', quantity: 2 },
        { materialId: 'Pt', quantity: 1 },
      ],
    });
    expect(previewGearSalvage(gearFromBase(21, 'meteor'))).toEqual({
      policy: 'legacy-v1.8.9-direct-material-half',
      baseId: 'meteor',
      materials: [{ materialId: 'Ni', quantity: 1 }],
    });
    expect(previewGearSalvage(gearFromBase(22, 'compass'))).toEqual({
      policy: 'legacy-v1.8.9-direct-material-half',
      baseId: 'compass',
      materials: [{ materialId: 'Ag', quantity: 1 }],
    });
    expect(previewGearSalvage(gearFromBase(23, 'voidhelm'))).toEqual({
      policy: 'legacy-v1.8.9-direct-material-half',
      baseId: 'voidhelm',
      materials: [],
    });
    expect(previewGearSalvage(gearFromBase(24, 'fieldsuit'))).toEqual({
      policy: 'legacy-v1.8.9-direct-material-half',
      baseId: 'fieldsuit',
      materials: [],
    });
    const highAxes = previewGearSalvage(gearFromBase(25, 'meteor', {
      itemLevel: 4_000,
      quality: 4_000,
      rarityTier: 9,
    }));
    expect(highAxes.materials).toEqual([{ materialId: 'Ni', quantity: 1 }]);
    expect(highAxes).not.toHaveProperty('scrap');
    expect(highAxes).not.toHaveProperty('stardust');
    expect(Object.isFrozen(highAxes.materials)).toBe(true);

    const exact = gearFromBase(26, 'rl-star');
    const held = committedState(grantGear(createGearInventory(1), 0, exact));
    const salvaged = salvageGear(held, 1, exact.instanceId);
    expect(salvaged).toMatchObject({
      status: 'committed',
      yield: {
        policy: 'legacy-v1.8.9-direct-material-half',
        baseId: 'rl-star',
        materials: [
          { materialId: 'Au', quantity: 2 },
          { materialId: 'Pt', quantity: 1 },
        ],
      },
    });
    expect(committedState(salvaged).entries).toEqual([]);
  });

  it('keeps duplicate-base instances distinct across replace, stale salvage, and pending guards', () => {
    const first = gearFromBase(30, 'rig1');
    const second = gearFromBase(31, 'rig1');
    const overflow = gearFromBase(32, 'fieldsuit');
    let state = committedState(grantGear(createGearInventory(2), 0, first));
    state = committedState(grantGear(state, 1, second));
    const equippedFirst = equipGear(state, 2, first.instanceId);
    state = committedState(equippedFirst);
    const equippedSecond = equipGear(state, 3, second.instanceId);
    expect(equippedSecond).toMatchObject({ status: 'committed', replacedInstanceId: first.instanceId });
    state = committedState(equippedSecond);
    expect(state.equipped).toEqual([{ slot: 'tool', instanceId: second.instanceId }]);
    expect(state.entries.map((entry) => entry.instance.instanceId)).toEqual([first.instanceId, second.instanceId]);

    const pending = grantGear(state, 4, overflow);
    expect(pending).toMatchObject({ status: 'committed', location: 'pending' });
    state = committedState(pending);
    expect(equipGear(state, 5, overflow.instanceId)).toEqual({ status: 'pending-reward', instanceId: overflow.instanceId });
    expect(setGearProtection(state, 5, overflow.instanceId, { favorite: true, locked: true })).toEqual({
      status: 'pending-reward', instanceId: overflow.instanceId,
    });
    expect(salvageGear(state, 5, overflow.instanceId)).toEqual({ status: 'pending-reward', instanceId: overflow.instanceId });

    expect(salvageGear(state, 4, first.instanceId)).toEqual({
      status: 'stale', expectedRevision: 4, actualRevision: 5,
    });
    expect(state.entries.map((entry) => entry.instance.instanceId)).toEqual([first.instanceId, second.instanceId]);
  });

  it('round-trips one strict immutable inventory fixed point and rejects duplicate/future rows', () => {
    expect(() => createGearInventory(undefined as never)).toThrow('capacity');
    let state = committedState(grantGear(createGearInventory(2), 0, gear(11)));
    state = committedState(grantGear(state, 1, gear(12)));
    const encoded = encodeGearInventory(state);
    const decoded = decodeGearInventory(encoded);
    expect(encodeGearInventory(decoded)).toBe(encoded);
    expect(Object.isFrozen(decoded)).toBe(true);
    expect(Object.isFrozen(decoded.entries)).toBe(true);

    const duplicate = JSON.parse(encoded) as { entries: unknown[] };
    duplicate.entries[1] = duplicate.entries[0];
    expect(() => decodeGearInventory(JSON.stringify(duplicate))).toThrow('duplicate instanceId');
    const future = JSON.parse(encoded) as { schema: number };
    future.schema = 2;
    expect(() => decodeGearInventory(JSON.stringify(future))).toThrow('unsupported');
    const extra = JSON.parse(encoded) as Record<string, unknown>;
    extra.legacyItems = {};
    expect(() => decodeGearInventory(JSON.stringify(extra))).toThrow('unknown or missing');

    const wrongSlot = JSON.parse(encoded) as {
      equipped: Array<{ slot: string; instanceId: string }>;
      entries: Array<{ instance: { instanceId: string } }>;
    };
    wrongSlot.equipped = [{ slot: 'helmet', instanceId: wrongSlot.entries[0]!.instance.instanceId }];
    expect(() => decodeGearInventory(JSON.stringify(wrongSlot))).toThrow('slot does not match');

    const duplicateAcrossPending = JSON.parse(encoded) as {
      pendingRewards: unknown[];
      entries: unknown[];
    };
    duplicateAcrossPending.pendingRewards = [{
      instance: (duplicateAcrossPending.entries[0] as { instance: unknown }).instance,
      reason: 'capacity',
    }];
    expect(() => decodeGearInventory(JSON.stringify(duplicateAcrossPending))).toThrow('duplicate instanceId');
  });
});
