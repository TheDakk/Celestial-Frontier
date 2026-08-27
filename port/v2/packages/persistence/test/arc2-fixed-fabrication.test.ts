import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FIXED_RECIPE_AUTHORITY,
  GEAR_INVENTORY_SCHEMA,
  MAX_PENDING_GEAR_REWARDS,
  createGearInstance,
  createGearInventory,
  decodeGearInventory,
  equipGear,
  getFixedCraftGenerationPlan,
  grantGear,
  makeGearSourceActionId,
  parseGearSourceActionId,
  type GearInstance,
  type GearInventory,
} from '@cf/domain-loot';
import {
  createEngineeringState,
  planFixedFabrication,
  type EngineeringActionPlan,
  type FixedFabricationAssets,
  type FixedFabricationResult,
} from '@cf/domain-opportunity';
import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal';
import {
  ARC2_LOOT_NAMESPACE,
  ARC2_FIXED_FABRICATION_SETTLEMENT_SCHEMA,
  canonicalizeV5Extensions,
  encodeArc2LootCarrier,
  prepareArc2FixedFabrication,
  readArc2AcquisitionCapabilities,
  readArc2EngineeringLoadout,
  type Arc2FixedFabricationSource,
} from '@cf/persistence';

const UINT32_MAX = 0xffff_ffff;

function expectDeepFrozen(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    expectDeepFrozen(child, seen);
  }
}

function fabricationPlan(
  baseId: string,
  assets: FixedFabricationAssets,
  receiptOrdinal = 33,
): EngineeringActionPlan<FixedFabricationResult> {
  const result = planFixedFabrication({
    state: createEngineeringState(),
    baseId,
    assets,
    activePlay: { activePlayMs: 0 },
    receiptOrdinal,
  });
  expect(result.status).toBe('planned');
  if (result.status !== 'planned') throw new Error(`fixture ${baseId} was refused: ${result.reason}`);
  return result;
}

function fabricationSource(
  stackableCounts: Readonly<Record<string, number>> = {},
  inventory: GearInventory = createGearInventory(8),
): Arc2FixedFabricationSource {
  const state = Object.freeze({
    kind: 'inventory',
    inventory,
    stackableCounts: Object.freeze(Object.entries(stackableCounts).map(([baseId, count]) => (
      Object.freeze({ baseId, count })
    ))),
  } as const);
  const extensions = canonicalizeV5Extensions({
    inventory: { [ARC2_LOOT_NAMESPACE]: encodeArc2LootCarrier(state) },
  });
  const read = readArc2EngineeringLoadout(extensions);
  expect(read.kind).toBe('loaded');
  if (read.kind !== 'loaded') throw new Error(`fabrication source was ${read.kind}`);
  return read.loadout;
}

function fixtureGear(baseId: string, receipt: string, ordinal = 0): GearInstance {
  const sourceActionId = makeGearSourceActionId({
    kind: 'craft',
    ownerId: 'arc2-fixed-fabrication-test',
    actionKey: `fixture:${baseId}`,
    receiptId: receipt,
  });
  return createGearInstance(sourceActionId, ordinal, getFixedCraftGenerationPlan(baseId, ordinal + 101));
}

function committedGrant(inventory: GearInventory, instance: GearInstance): GearInventory {
  const result = grantGear(inventory, inventory.revision, instance);
  expect(result.status).toBe('committed');
  if (result.status !== 'committed') throw new Error(`fixture grant failed: ${result.status}`);
  return result.state;
}

const platePlan = () => fabricationPlan('plate', {
  materials: { Fe: 4 },
  exceptionalMaterials: {},
  itemCounts: { plate: 998 },
  stardust: 0,
  signatureIds: [],
}, 7);

const meteorPlan = () => fabricationPlan('meteor', {
  materials: { C: 1, Ni: 2 },
  exceptionalMaterials: { Ni: 1 },
  itemCounts: {},
  stardust: 0,
  signatureIds: [],
}, 33);

describe('@cf/persistence — Arc 2 fixed-fabrication settlement adapter', () => {
  it('increments a stackable from 998 to the exact cap and refuses 999 atomically', () => {
    const plan = platePlan();
    const first = prepareArc2FixedFabrication(fabricationSource({ plate: 998 }), plan);
    expect(first).toMatchObject({
      schema: ARC2_FIXED_FABRICATION_SETTLEMENT_SCHEMA,
      status: 'ready',
      outputLocation: 'stackable',
      instanceId: null,
      sourceActionId: null,
      state: { stackableCounts: [{ baseId: 'plate', count: 999 }] },
      mirror: { items: [['plate', 999]], equip: {}, equipAff: {} },
    });
    if (first.status !== 'ready') return;
    expect(first.state.inventory.revision).toBe(1);

    const capped = fabricationSource({ plate: 999 });
    const before = JSON.stringify(capped);
    expect(prepareArc2FixedFabrication(capped, plan)).toEqual({
      schema: ARC2_FIXED_FABRICATION_SETTLEMENT_SCHEMA,
      status: 'refused',
      reason: 'output-count-exhausted',
      baseId: 'plate',
      instanceId: null,
    });
    expect(JSON.stringify(capped)).toBe(before);
  });

  it('consumes exact parts, builds a permanent system once, and never creates a gear slot', () => {
    const plan = fabricationPlan('jumpdrive', {
      materials: {}, exceptionalMaterials: {},
      itemCounts: { coil: 2, navcore: 1, fuelcell: 1 },
      stardust: 30, signatureIds: [],
    }, 8);
    const initial = fabricationSource({ coil: 2, navcore: 1, fuelcell: 1 });
    const settled = prepareArc2FixedFabrication(initial, plan);
    expect(settled).toMatchObject({
      status: 'ready',
      outputLocation: 'system',
      instanceId: null,
      sourceActionId: null,
      state: {
        stackableCounts: [{ baseId: 'jumpdrive', count: 1 }],
        inventory: { entries: [], equipped: [], pendingRewards: [] },
      },
      compatibilityDelta: {
        items: [
          { id: 'coil', delta: -2 },
          { id: 'fuelcell', delta: -1 },
          { id: 'jumpdrive', delta: 1 },
          { id: 'navcore', delta: -1 },
        ],
        essence: -30,
      },
    });
    if (settled.status !== 'ready') return;
    expect(prepareArc2FixedFabrication(
      fabricationSource(
        Object.fromEntries(settled.state.stackableCounts.map(({ baseId, count }) => [baseId, count])),
        settled.state.inventory,
      ),
      plan,
    )).toMatchObject({ status: 'refused', reason: 'already-built' });

    const builtAndRestocked = fabricationSource(
      { coil: 2, navcore: 1, fuelcell: 1, jumpdrive: 1 },
      settled.state.inventory,
    );
    expect(prepareArc2FixedFabrication(builtAndRestocked, plan))
      .toMatchObject({ status: 'refused', reason: 'already-built' });
  });

  it('auto-equips exact gear only into an empty slot and never replaces occupied equipment', () => {
    const plan = meteorPlan();
    const empty = prepareArc2FixedFabrication(fabricationSource(), plan);
    expect(empty).toMatchObject({
      status: 'ready',
      outputLocation: 'equipped',
      state: { inventory: { revision: 2, equipped: [{ slot: 'necklace' }] } },
    });
    if (empty.status !== 'ready' || empty.instanceId === null) return;
    expect(empty.state.inventory.equipped[0]!.instanceId).toBe(empty.instanceId);

    const existing = fixtureGear('compass', 'occupied-necklace');
    let occupiedInventory = committedGrant(createGearInventory(3), existing);
    const equipped = equipGear(occupiedInventory, occupiedInventory.revision, existing.instanceId);
    expect(equipped.status).toBe('committed');
    if (equipped.status !== 'committed') return;
    occupiedInventory = equipped.state;
    const occupied = prepareArc2FixedFabrication(fabricationSource({}, occupiedInventory), plan);
    expect(occupied).toMatchObject({ status: 'ready', outputLocation: 'inventory' });
    if (occupied.status !== 'ready') return;
    expect(occupied.state.inventory.equipped).toEqual([
      { slot: 'necklace', instanceId: existing.instanceId },
    ]);
    expect(occupied.state.inventory.entries.map(({ instance }) => instance.baseId)).toEqual([
      'compass', 'meteor',
    ]);
  });

  it('persists a fabricated contact bonus only when the new gear owns the equipped slot', () => {
    const plan = fabricationPlan('earpiece', {
      materials: {}, exceptionalMaterials: {},
      itemCounts: { wire: 1, chip: 1 },
      stardust: 0, signatureIds: [],
    }, 35);
    const toCapabilities = (state: Parameters<typeof encodeArc2LootCarrier>[0]) => (
      readArc2AcquisitionCapabilities(canonicalizeV5Extensions({
        inventory: { [ARC2_LOOT_NAMESPACE]: encodeArc2LootCarrier(state) },
      }))
    );

    const autoEquipped = prepareArc2FixedFabrication(
      fabricationSource({ wire: 1, chip: 1 }),
      plan,
    );
    expect(autoEquipped).toMatchObject({
      status: 'ready', outputLocation: 'equipped', mirror: { equip: { ears: 'earpiece' } },
    });
    if (autoEquipped.status !== 'ready') return;
    const equippedCapabilities = toCapabilities(autoEquipped.state);
    expect(equippedCapabilities).toMatchObject({
      kind: 'loaded', capabilities: { contactCaptureBonus: 10 },
    });

    const resonator = fixtureGear('resonator', 'occupied-ears');
    let occupiedInventory = committedGrant(createGearInventory(3), resonator);
    const equipped = equipGear(occupiedInventory, occupiedInventory.revision, resonator.instanceId);
    expect(equipped.status).toBe('committed');
    if (equipped.status !== 'committed') return;
    occupiedInventory = equipped.state;
    const heldOnly = prepareArc2FixedFabrication(
      fabricationSource({ wire: 1, chip: 1 }, occupiedInventory),
      plan,
    );
    expect(heldOnly).toMatchObject({
      status: 'ready', outputLocation: 'inventory', mirror: { equip: { ears: 'resonator' } },
    });
    if (heldOnly.status !== 'ready') return;
    const heldCapabilities = toCapabilities(heldOnly.state);
    expect(heldCapabilities).toMatchObject({
      kind: 'loaded', capabilities: { contactCaptureBonus: 0 },
    });
  });

  it('routes a full gear bag to pending without auto-equip', () => {
    const existing = fixtureGear('earpiece', 'full-bag');
    const full = fabricationSource({}, committedGrant(createGearInventory(1), existing));
    const settled = prepareArc2FixedFabrication(full, meteorPlan());
    expect(settled).toMatchObject({
      status: 'ready',
      outputLocation: 'pending',
      state: {
        inventory: {
          entries: [{ instance: { instanceId: existing.instanceId } }],
          equipped: [],
          pendingRewards: [{ reason: 'capacity', instance: { baseId: 'meteor' } }],
        },
      },
    });
    if (settled.status === 'ready') {
      expect(settled.mirror.items).toEqual([
        ['earpiece', 1],
        ['meteor', 1],
      ]);
    }
  });

  it('refuses a 500-reward pending carrier before spend and returns no writable fragment', () => {
    const sourceActionId = makeGearSourceActionId({
      kind: 'craft', ownerId: 'pending-cap-fixture', actionKey: 'meteor', receiptId: 'full',
    });
    const plan = getFixedCraftGenerationPlan('meteor', 202);
    const instances = Array.from({ length: MAX_PENDING_GEAR_REWARDS + 1 }, (_, ordinal) => (
      createGearInstance(sourceActionId, ordinal, plan)
    ));
    const inventory = decodeGearInventory(JSON.stringify({
      schema: GEAR_INVENTORY_SCHEMA,
      revision: instances.length,
      capacity: 1,
      entries: [{ instance: instances[0], favorite: false, locked: false }],
      equipped: [],
      pendingRewards: instances.slice(1).map((instance) => ({ instance, reason: 'capacity' })),
    }));
    /* Deliberately bypass the extension byte ceiling in this one bounded
       domain-cap control. The internal mint import is allowlisted only for
       tests; production callers must use readArc2EngineeringLoadout. */
    const state = registerArc2EngineeringLoadout(inventory, []);
    const before = JSON.stringify(state);
    const refused = prepareArc2FixedFabrication(state, meteorPlan());
    expect(refused).toMatchObject({ status: 'refused', reason: 'pending-capacity' });
    expect(refused).not.toHaveProperty('state');
    expect(refused).not.toHaveProperty('economyDelta');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('binds fixed generation seed and canonical provenance to deterministic receipt replay', () => {
    const plan = meteorPlan();
    const source = fabricationSource();
    const first = prepareArc2FixedFabrication(source, plan);
    const replay = prepareArc2FixedFabrication(source, plan);
    expect(first).toEqual(replay);
    expect(first.status).toBe('ready');
    if (first.status !== 'ready' || first.instanceId === null || first.sourceActionId === null) return;
    expect(parseGearSourceActionId(first.sourceActionId)).toEqual({
      kind: 'craft',
      ownerId: FIXED_RECIPE_AUTHORITY,
      actionKey: 'recipe:meteor',
      receiptId: 'receipt:33',
    });
    expect(first.sourceActionId).toBe(
      'loot1|craft|legacy-v1.8.9-items|recipe%3Ameteor|||receipt%3A33',
    );
    expect(first.instanceId).toBe(
      'gear1|loot1|craft|legacy-v1.8.9-items|recipe%3Ameteor|||receipt%3A33|0',
    );
    const instance = first.state.inventory.entries.find(
      ({ instance: candidate }) => candidate.instanceId === first.instanceId,
    )!.instance;
    expect(instance.generation).toEqual({
      seed: 1_074_851_502,
      ordinal: 0,
    });
    expect(instance.provenance.sourceActionId).toBe(first.sourceActionId);

    const appliedReplay = prepareArc2FixedFabrication(fabricationSource(
      {},
      first.state.inventory,
    ), plan);
    expect(appliedReplay).toMatchObject({
      status: 'refused', reason: 'duplicate-instance', instanceId: first.instanceId,
    });
    expect(appliedReplay).not.toHaveProperty('state');
    expect(appliedReplay).not.toHaveProperty('economyDelta');
  });

  it('accepts only the exact registered plan and rejects receipt/result/directive lookalikes', () => {
    const plan = meteorPlan();
    const exceptionalForgery = {
      ...plan,
      result: {
        ...plan.result,
        arc2: {
          ...plan.result.arc2,
          consume: { ...plan.result.arc2.consume, exceptionalMaterials: [] },
        },
      },
    } as EngineeringActionPlan<FixedFabricationResult>;
    expect(prepareArc2FixedFabrication(fabricationSource(), exceptionalForgery))
      .toMatchObject({ status: 'refused', reason: 'plan-invalid' });

    let quantityGetterCalls = 0;
    const hostileQuantity = { id: 'C' } as Record<string, unknown>;
    Object.defineProperty(hostileQuantity, 'quantity', {
      enumerable: true,
      get: () => { quantityGetterCalls++; return quantityGetterCalls < 3 ? 1 : 999; },
    });
    const accessorForgery = {
      ...plan,
      result: {
        ...plan.result,
        arc2: {
          ...plan.result.arc2,
          consume: {
            ...plan.result.arc2.consume,
            materials: [hostileQuantity, { id: 'Ni', quantity: 2 }],
          },
        },
      },
    } as unknown as EngineeringActionPlan<FixedFabricationResult>;
    expect(prepareArc2FixedFabrication(fabricationSource(), accessorForgery))
      .toMatchObject({ status: 'refused', reason: 'plan-invalid' });
    expect(quantityGetterCalls).toBe(0);

    const receiptForgery = { ...plan, receiptOrdinal: 34 } as EngineeringActionPlan<FixedFabricationResult>;
    expect(prepareArc2FixedFabrication(fabricationSource(), receiptForgery))
      .toMatchObject({ status: 'refused', reason: 'plan-invalid' });

    const autoExtractorPlan = fabricationPlan('autoext', {
      materials: {}, exceptionalMaterials: {},
      itemCounts: { servo: 2, navcore: 1, cell: 1 },
      stardust: 40, signatureIds: [],
    }, 34);
    const autoExtractorForgery = {
      ...autoExtractorPlan,
      result: {
        ...autoExtractorPlan.result,
        arc2: { ...autoExtractorPlan.result.arc2, autoExtractorReanchoredWorlds: 999 },
      },
    } as EngineeringActionPlan<FixedFabricationResult>;
    expect(prepareArc2FixedFabrication(fabricationSource(), autoExtractorForgery))
      .toMatchObject({ status: 'refused', reason: 'plan-invalid' });

    let toJsonCalls = 0;
    const nestedJsonForgery = {
      ...plan,
      result: {
        ...plan.result,
        arc2: {
          ...plan.result.arc2,
          gearAxes: { toJSON: () => { toJsonCalls++; return plan.result.arc2.gearAxes; } },
          gearGenerationPlan: {
            generationSeed: 1_074_851_502,
            toJSON: () => { toJsonCalls++; return plan.result.arc2.gearGenerationPlan; },
          },
        },
      },
    } as unknown as EngineeringActionPlan<FixedFabricationResult>;
    expect(prepareArc2FixedFabrication(fabricationSource(), nestedJsonForgery))
      .toMatchObject({ status: 'refused', reason: 'plan-invalid' });
    expect(toJsonCalls).toBe(0);

    const fullyExceptional = planFixedFabrication({
      state: createEngineeringState(),
      baseId: 'meteor',
      assets: {
        materials: { C: 1, Ni: 2 }, exceptionalMaterials: { C: 1, Ni: 2 },
        itemCounts: {}, stardust: 0, signatureIds: [],
      },
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 33,
    });
    expect(fullyExceptional).toMatchObject({
      status: 'refused', reason: 'exceptional-slotted-policy-unavailable',
    });
  });

  it('requires a persistence-issued source and rejects loose JSON/descriptor lookalikes unobserved', () => {
    const plan = platePlan();
    const registered = fabricationSource({ plate: 998 });
    let toJsonCalls = 0;
    const projectedSource = {
      ...registered,
      toJSON: () => { toJsonCalls++; return registered; },
    };
    expect(prepareArc2FixedFabrication(
      projectedSource as unknown as Arc2FixedFabricationSource,
      plan,
    )).toMatchObject({ status: 'refused', reason: 'source-unregistered' });
    expect(toJsonCalls).toBe(0);
    projectedSource.toJSON();
    expect(toJsonCalls).toBe(1);

    let inventoryGetterCalls = 0;
    const accessorSource: Record<string, unknown> = {
      schema: registered.schema,
      fingerprint: registered.fingerprint,
      stackableCounts: registered.stackableCounts,
    };
    Object.defineProperty(accessorSource, 'inventory', {
      enumerable: true,
      get: () => { inventoryGetterCalls++; return registered.inventory; },
    });
    expect(prepareArc2FixedFabrication(
      accessorSource as unknown as Arc2FixedFabricationSource,
      plan,
    )).toMatchObject({ status: 'refused', reason: 'source-unregistered' });
    expect(inventoryGetterCalls).toBe(0);
    void accessorSource.inventory;
    expect(inventoryGetterCalls).toBe(1);

    const hiddenSource = { ...registered };
    Object.defineProperty(hiddenSource, 'hiddenAuthority', { value: 1, enumerable: false });
    expect(prepareArc2FixedFabrication(hiddenSource, plan))
      .toMatchObject({ status: 'refused', reason: 'source-unregistered' });

    const symbolicSource = { ...registered, [Symbol('hidden-authority')]: true };
    expect(prepareArc2FixedFabrication(symbolicSource, plan))
      .toMatchObject({ status: 'refused', reason: 'source-unregistered' });

    const customStacks: unknown[] = [];
    Object.setPrototypeOf(customStacks, Object.create(Array.prototype));
    expect(Object.getPrototypeOf(customStacks)).not.toBe(Array.prototype);
    expect(prepareArc2FixedFabrication({
      ...registered,
      stackableCounts: customStacks,
    } as unknown as Arc2FixedFabricationSource, plan))
      .toMatchObject({ status: 'refused', reason: 'source-unregistered' });
  });

  it('rejects wrapper, source, plan, and nested Proxies with zero trap invocation', () => {
    const plan = platePlan();
    const source = fabricationSource({ plate: 998 });
    const trapCounts = { wrapper: 0, source: 0, plan: 0, inventory: 0, stacks: 0 };
    const trapping = <T extends object>(target: T, key: keyof typeof trapCounts): T => new Proxy(target, {
      get: (inner, property, receiver) => {
        trapCounts[key]++;
        return Reflect.get(inner, property, receiver);
      },
      getOwnPropertyDescriptor: (inner, property) => {
        trapCounts[key]++;
        return Reflect.getOwnPropertyDescriptor(inner, property);
      },
      getPrototypeOf: (inner) => {
        trapCounts[key]++;
        return Reflect.getPrototypeOf(inner);
      },
      ownKeys: (inner) => {
        trapCounts[key]++;
        return Reflect.ownKeys(inner);
      },
    });
    const trapControl = trapping({}, 'wrapper');
    expect(Reflect.ownKeys(trapControl)).toEqual([]);
    expect(trapCounts.wrapper).toBe(1);
    trapCounts.wrapper = 0;

    expect(prepareArc2FixedFabrication(trapping(source, 'source'), plan))
      .toMatchObject({ status: 'refused', reason: 'source-unregistered' });
    expect(prepareArc2FixedFabrication(source, trapping(plan, 'plan')))
      .toMatchObject({ status: 'refused', reason: 'plan-invalid' });

    const oldWrapper = trapping({ state: source, plan }, 'wrapper');
    expect(prepareArc2FixedFabrication(
      oldWrapper as unknown as Arc2FixedFabricationSource,
      plan,
    )).toMatchObject({ status: 'refused', reason: 'source-unregistered' });

    const nestedInventory = trapping(source.inventory, 'inventory');
    const nestedStacks = trapping(source.stackableCounts, 'stacks');
    expect(prepareArc2FixedFabrication({
      ...source,
      inventory: nestedInventory,
      stackableCounts: nestedStacks,
    } as Arc2FixedFabricationSource, plan))
      .toMatchObject({ status: 'refused', reason: 'source-unregistered' });
    expect(trapCounts).toEqual({ wrapper: 0, source: 0, plan: 0, inventory: 0, stacks: 0 });
  });

  it('rejects cyclic loose source/state graphs without traversing them', () => {
    const plan = platePlan();
    const registered = fabricationSource({ plate: 998 });
    const cyclicSource: Record<string, unknown> = { ...registered };
    cyclicSource.self = cyclicSource;
    expect(cyclicSource.self).toBe(cyclicSource);
    expect(prepareArc2FixedFabrication(
      cyclicSource as unknown as Arc2FixedFabricationSource,
      plan,
    )).toMatchObject({ status: 'refused', reason: 'source-unregistered' });

    const cyclicStacks: unknown[] = [];
    cyclicStacks.push(cyclicStacks);
    expect(cyclicStacks[0]).toBe(cyclicStacks);
    const cyclicNested = {
      ...registered,
      stackableCounts: cyclicStacks,
    } as unknown as Arc2FixedFabricationSource;
    expect(prepareArc2FixedFabrication(cyclicNested, plan))
      .toMatchObject({ status: 'refused', reason: 'source-unregistered' });
  });

  it('returns exact exceptional-first cargo/cgx deltas without inventing external ownership', () => {
    const settled = prepareArc2FixedFabrication(fabricationSource(), meteorPlan());
    expect(settled).toMatchObject({
      status: 'ready',
      economyDelta: {
        materials: [{ id: 'C', delta: -1 }, { id: 'Ni', delta: -2 }],
        exceptionalMaterials: [{ id: 'Ni', delta: -1 }],
        ordinaryMaterials: [{ id: 'C', delta: -1 }, { id: 'Ni', delta: -1 }],
        itemCounts: [{ id: 'meteor', delta: 1 }],
        stardust: 0,
      },
      compatibilityDelta: {
        cargo: [{ id: 'C', delta: -1 }, { id: 'Ni', delta: -2 }],
        cgx: [{ id: 'Ni', delta: -1 }],
        items: [{ id: 'meteor', delta: 1 }],
        essence: 0,
      },
    });
  });

  it('preserves item and Signature gates and never consumes or replaces them', () => {
    const headlamp = fixtureGear('headlamp', 'prerequisite');
    const inventory = committedGrant(createGearInventory(4), headlamp);
    const plan = fabricationPlan('visor', {
      materials: {}, exceptionalMaterials: {},
      itemCounts: { headlamp: 1, lens: 1, chip: 1, weave: 1 },
      stardust: 0, signatureIds: [],
    }, 41);
    const settled = prepareArc2FixedFabrication(
      fabricationSource({ lens: 1, chip: 1, weave: 1 }, inventory),
      plan,
    );
    expect(settled).toMatchObject({
      status: 'ready',
      preservedGates: { prerequisiteId: 'headlamp', signatureId: null },
      mirror: { items: expect.arrayContaining([['headlamp', 1], ['visor', 1]]) },
      compatibilityDelta: {
        items: [{ id: 'chip', delta: -1 }, { id: 'lens', delta: -1 }, { id: 'visor', delta: 1 }, { id: 'weave', delta: -1 }],
      },
    });
    expect(prepareArc2FixedFabrication(
      fabricationSource({ lens: 1, chip: 1, weave: 1 }),
      plan,
    )).toMatchObject({ status: 'refused', reason: 'prerequisite-missing' });

    const relicPlan = fabricationPlan('rl-stone', {
      materials: { Fe: 8, W: 4, Nd: 1 }, exceptionalMaterials: {},
      itemCounts: { hullseg: 1 }, stardust: 0, signatureIds: ['stone'],
    }, 42);
    const relicSettlement = prepareArc2FixedFabrication(
      fabricationSource({ hullseg: 1 }),
      relicPlan,
    );
    expect(relicSettlement).toMatchObject({
      status: 'ready',
      preservedGates: { prerequisiteId: null, signatureId: 'stone' },
      compatibilityDelta: { items: [{ id: 'hullseg', delta: -1 }, { id: 'rl-stone', delta: 1 }] },
    });
  });

  it('re-proves exact Arc 2 part balances before returning any writable fragment', () => {
    const plan = fabricationPlan('jumpdrive', {
      materials: {}, exceptionalMaterials: {},
      itemCounts: { coil: 2, navcore: 1, fuelcell: 1 },
      stardust: 30, signatureIds: [],
    }, 8);
    const state = fabricationSource({ coil: 1, navcore: 1, fuelcell: 1 });
    const before = JSON.stringify(state);
    const result = prepareArc2FixedFabrication(state, plan);
    expect(result).toMatchObject({ status: 'refused', reason: 'parts-insufficient' });
    expect(result).not.toHaveProperty('state');
    expect(result).not.toHaveProperty('economyDelta');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('refuses exhausted revisions, including the two-step empty-slot route, without mutation', () => {
    const cappedInventory = decodeGearInventory(JSON.stringify({
      ...createGearInventory(2), revision: UINT32_MAX,
    }));
    const stackState = fabricationSource({ plate: 998 }, cappedInventory);
    const stackBefore = JSON.stringify(stackState);
    expect(prepareArc2FixedFabrication(stackState, platePlan()))
      .toMatchObject({ status: 'refused', reason: 'revision-exhausted' });
    expect(JSON.stringify(stackState)).toBe(stackBefore);

    const oneRevisionLeft = decodeGearInventory(JSON.stringify({
      ...createGearInventory(2), revision: UINT32_MAX - 1,
    }));
    const gearState = fabricationSource({}, oneRevisionLeft);
    const gearBefore = JSON.stringify(gearState);
    expect(prepareArc2FixedFabrication(gearState, meteorPlan()))
      .toMatchObject({ status: 'refused', reason: 'revision-exhausted' });
    expect(JSON.stringify(gearState)).toBe(gearBefore);
  });

  it('deep-freezes every success/refusal and has no ambient clock, entropy, or browser dependency', () => {
    const plan = meteorPlan();
    const registeredSource = fabricationSource();
    const registeredBefore = JSON.stringify(registeredSource);
    const ready = prepareArc2FixedFabrication(registeredSource, plan);
    const refused = prepareArc2FixedFabrication(
      fabricationSource({ plate: 999 }),
      platePlan(),
    );
    expectDeepFrozen(ready);
    expectDeepFrozen(refused);
    expectDeepFrozen(plan);
    expect(JSON.stringify(registeredSource)).toBe(registeredBefore);
    expectDeepFrozen(registeredSource);

    const source = readFileSync(
      new URL('../src/arc2-fixed-fabrication.ts', import.meta.url),
      'utf8',
    );
    for (const forbidden of [
      'Math.random', 'Date.now', 'performance.now', 'globalThis',
      'window.', 'document.', 'localStorage', 'sessionStorage',
    ]) expect(source).not.toContain(forbidden);
  });
});
