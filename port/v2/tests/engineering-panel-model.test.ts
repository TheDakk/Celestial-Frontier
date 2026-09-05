import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  createLegacyEngineeringSeedResolver,
  decodeEngineeringState,
  encodeEngineeringState,
  migrateLegacyEngineeringState,
  type EngineeringStateV2,
} from '@cf/domain-opportunity';
import {
  prepareArc2LootLegacyMigration,
  readArc2EngineeringLoadout,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  shipVisualStateOf,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
  type SystemNav,
  type SurfaceNav,
} from '@cf/scene';
import { projectEngineeringPanelReadModel } from '../apps/game/src/engineering-panel-model.js';

const SOL = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
};
const MARS = { ...SOL, planet: { seed: 134 } };
const EARTH = { ...SOL, planet: { seed: 133 } };
const REMNANT_STAR = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 3363971653, x: -386.2348864697851, y: 453.95830733468756 },
};

beforeAll(() => installCaptureHooks());

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(candidate);
  if (!result.ok) throw new Error(result.reason);
  return result.address;
}

function star(candidate: unknown): CanonicalCF1StarAddress {
  const result = resolveCF1StarAddress(candidate);
  if (!result.ok) throw new Error(result.reason);
  return result.address;
}

function surface(address: CanonicalCF1WorldAddress): SurfaceNav {
  const result = navFromCanonicalCF1Address(address);
  if (!result.ok || result.state.mode !== 'surface') throw new Error('surface fixture failed');
  return result.state;
}

function system(address: CanonicalCF1StarAddress): SystemNav {
  const result = navFromCanonicalCF1Address(address);
  if (!result.ok || result.state.mode !== 'system') throw new Error('system fixture failed');
  return result.state;
}

function state(options: Readonly<{
  worlds?: readonly Readonly<{ address: CanonicalCF1WorldAddress; count: number }>[];
  stars?: readonly Readonly<{ address: CanonicalCF1StarAddress; count: number }>[];
  research?: readonly string[];
  revision?: number;
}> = {}): EngineeringStateV2 {
  const worlds = options.worlds ?? [];
  const stars = options.stars ?? [];
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: options.revision ?? 4,
    worlds: worlds.map(({ address, count }) => ({ seed: address.planet.seed, extractionsTaken: count })),
    stars: stars.map(({ address, count }) => ({ seed: address.star.seed, extractionsTaken: count })),
    research: [...(options.research ?? [])],
  }, createLegacyEngineeringSeedResolver({
    worlds: worlds.map(({ address }) => address),
    stars: stars.map(({ address }) => address),
  }));
}

function loadout(items: readonly (readonly [string, number])[] = []) {
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: {
      items: items.map(([id, count]) => [id, count]),
      equip: items.some(([id]) => id === 'rig3') ? { tool: 'rig3', helmet: 'headlamp' } : {},
      equipAff: {},
    },
    capacity: 24,
  });
  if (prepared.kind !== 'prepared') throw new Error(`loot fixture was ${prepared.kind}`);
  const read = readArc2EngineeringLoadout(prepared.extensions);
  if (read.kind !== 'loaded') throw new Error(`loadout fixture was ${read.kind}`);
  return read.loadout;
}

function loadoutAtRevision(
  revision: number,
  items: readonly (readonly [string, number])[] = [],
) {
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: items.map(([id, count]) => [id, count]), equip: {}, equipAff: {} },
    capacity: 24,
  });
  if (prepared.kind !== 'prepared') throw new Error(`loot fixture was ${prepared.kind}`);
  const carrier = prepared.extensions.inventory?.['arc2.loot'];
  if (!carrier) throw new Error('loot carrier fixture was absent');
  const value = JSON.parse(carrier.json) as { inventory: { revision: number } };
  value.inventory.revision = revision;
  const read = readArc2EngineeringLoadout({
    ...prepared.extensions,
    inventory: {
      ...prepared.extensions.inventory,
      'arc2.loot': Object.freeze({ version: carrier.version, json: JSON.stringify(value) }),
    },
  });
  if (read.kind !== 'loaded') throw new Error(`exhausted loadout fixture was ${read.kind}`);
  return read.loadout;
}

function stateWithAutoExtractorCursor(
  address: CanonicalCF1WorldAddress,
  collectedThroughActivePlayMs: number,
): EngineeringStateV2 {
  const value = JSON.parse(encodeEngineeringState(state({
    worlds: [{ address, count: 2 }],
  }))) as {
    worlds: Array<{ autoExtractorCursor: unknown }>;
  };
  value.worlds[0]!.autoExtractorCursor = {
    schema: 'cf-v2-recurring-accrual-cursor/v1',
    collectedThroughActivePlayMs,
  };
  return decodeEngineeringState(JSON.stringify(value), SCENE_ENGINEERING_ADDRESS_RESOLVER);
}

const economy = Object.freeze({
  cargo: Object.freeze([
    Object.freeze(['Fe', 20] as const), Object.freeze(['Si', 20] as const),
    Object.freeze(['Al', 20] as const), Object.freeze(['W', 20] as const),
  ]),
  exceptionalCargo: Object.freeze([]),
  stardust: 500,
  signatureIds: Object.freeze(['stone']),
  hp: 20,
});

function ship(items: readonly (readonly [string, number])[]) {
  return shipVisualStateOf({ items: items.map(([id, count]) => [id, count]), ascCh: 0, liverySeed: 0x5111 });
}

describe('Engineering panel production read model', () => {
  it('projects a registered lifeless surface, all six research rows, and the exact 62-recipe catalogue', () => {
    const mars = world(MARS);
    const owned = [['jumpdrive', 1], ['autoext', 1], ['rig3', 1], ['headlamp', 1]] as const;
    const model = projectEngineeringPanelReadModel({
      ship: ship(owned), nav: surface(mars), engineering: state({ worlds: [{ address: mars, count: 2 }] }),
      loadout: loadout(owned), economy, activePlayMs: 100_000,
    });

    expect(model.mining.status).toBe('ready');
    expect(model.mining.locationLabel).toBe('World 134');
    expect(model.mining.pullsRemaining).toBeGreaterThan(0);
    expect(model.mining.deposits.length).toBeGreaterThan(0);
    expect(model.mining.deposits.every(({ id, label }) => id.length > 0 && label.length > 0)).toBe(true);
    expect(model.mining.autoExtractorDue).toBe(0);
    expect(model.research.map(({ id }) => id)).toEqual(['scan1', 'hull1', 'lab1', 'drive1', 'drive2', 'drive3']);
    expect(model.fabricationGroups.map(({ id }) => id)).toEqual(['part', 'comp', 'sys', 'gear', 'relic']);
    expect(model.fabricationGroups.flatMap(({ recipes }) => recipes)).toHaveLength(62);
    expect(model.fabricationGroups.flatMap(({ recipes }) => recipes).find(({ baseId }) => baseId === 'autoext')?.status)
      .toBe('owned');
    expect(model.fabricationGroups.flatMap(({ recipes }) => recipes).find(({ baseId }) => baseId === 'fieldsuit'))
      .toMatchObject({
        effectSupport: 'live', status: 'unavailable',
        effectDetail: 'Live effects: bioscan protection. Unavailable effects: landing safety.',
      });
    expect(model.fabricationGroups.flatMap(({ recipes }) => recipes).find(({ baseId }) => baseId === 'rig1')?.effectSupport)
      .toBe('live');
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.fabricationGroups[0]?.recipes)).toBe(true);
  });

  it('offers connected contact gear only when its ordinary fabrication gates pass', () => {
    const mars = world(MARS);
    const parts = [['wire', 1], ['chip', 1]] as const;
    const eligible = projectEngineeringPanelReadModel({
      ship: ship(parts), nav: surface(mars), engineering: state(),
      loadout: loadout(parts), economy, activePlayMs: 0,
    }).fabricationGroups.flatMap(({ recipes }) => recipes);
    expect(eligible.find(({ baseId }) => baseId === 'earpiece')).toMatchObject({
      status: 'available', reason: null, effectSupport: 'live',
      effectDetail: 'Live effects: capture chance.',
    });
    expect(eligible.find(({ baseId }) => baseId === 'diplobeacon')).toMatchObject({
      status: 'unavailable', effectSupport: 'live',
    });
    expect(eligible.find(({ baseId }) => baseId === 'fieldsuit')).toMatchObject({
      status: 'unavailable', effectSupport: 'live',
      effectDetail: 'Live effects: bioscan protection. Unavailable effects: landing safety.',
    });
    expect(eligible.find(({ baseId }) => baseId === 'fieldsuit')?.reason)
      .toContain('Missing 2 Carbon Weave.');
    expect(eligible.find(({ baseId }) => baseId === 'surgeon')).toMatchObject({
      status: 'unavailable', effectSupport: 'live',
      effectDetail: 'Live effects: flora healing.',
    });
    expect(eligible.find(({ baseId }) => baseId === 'compass')).toMatchObject({
      status: 'unavailable', effectSupport: 'live',
      effectDetail: 'Live effects: travel speed.',
    });

    const missingParts = projectEngineeringPanelReadModel({
      ship: ship([]), nav: surface(mars), engineering: state(),
      loadout: loadout(), economy, activePlayMs: 0,
    }).fabricationGroups.flatMap(({ recipes }) => recipes)
      .find(({ baseId }) => baseId === 'earpiece');
    expect(missingParts).toMatchObject({ status: 'unavailable', effectSupport: 'live' });
    expect(missingParts?.reason).toContain('Missing 1 Aluminium Wire.');
    expect(missingParts?.reason).toContain('Missing 1 Silicon Chip.');
  });

  it('exposes a fully exceptional connected slotted recipe through the real panel model', () => {
    const mars = world(MARS);
    const exceptionalEconomy = Object.freeze({
      ...economy,
      cargo: Object.freeze([
        Object.freeze(['Ni', 2] as const), Object.freeze(['C', 1] as const),
      ]),
      exceptionalCargo: Object.freeze([
        Object.freeze(['Ni', 2] as const), Object.freeze(['C', 1] as const),
      ]),
    });
    const recipes = projectEngineeringPanelReadModel({
      ship: ship([]), nav: surface(mars), engineering: state(),
      loadout: loadout(), economy: exceptionalEconomy, activePlayMs: 0,
    }).fabricationGroups.flatMap(({ recipes: rows }) => rows);
    expect(recipes.find(({ baseId }) => baseId === 'meteor')).toMatchObject({
      status: 'available', reason: null, effectSupport: 'live',
    });
  });

  it('projects positive Auto-Extractor work only from the persisted active-play cursor', () => {
    const mars = world(MARS);
    const model = projectEngineeringPanelReadModel({
      ship: ship([['autoext', 1]]),
      nav: surface(mars),
      engineering: stateWithAutoExtractorCursor(mars, 0),
      loadout: loadout([['autoext', 1]]),
      economy,
      activePlayMs: 1_800_000,
    });
    expect(model.mining).toMatchObject({ status: 'ready', autoExtractorDue: 3 });
    const noElapsed = projectEngineeringPanelReadModel({
      ship: ship([['autoext', 1]]),
      nav: surface(mars),
      engineering: stateWithAutoExtractorCursor(mars, 1_800_000),
      loadout: loadout([['autoext', 1]]),
      economy,
      activePlayMs: 1_800_000,
    });
    expect(noElapsed.mining.autoExtractorDue).toBe(0);
  });

  it('exposes complete research consumers while preserving exact owned costs and prerequisites', () => {
    const mars = world(MARS);
    const model = projectEngineeringPanelReadModel({
      ship: ship([]), nav: surface(mars), engineering: state({ research: ['drive2'] }),
      loadout: loadout(), economy: { ...economy, cargo: [], stardust: 0 }, activePlayMs: 0,
    });
    expect(model.research.find(({ id }) => id === 'drive2')).toMatchObject({
      status: 'owned', reason: 'Already researched.',
    });
    expect(model.research.find(({ id }) => id === 'drive3')).toMatchObject({
      status: 'unavailable',
    });
    expect(model.research.find(({ id }) => id === 'drive3')?.reason).toContain('Missing 1 Prismatium.');
    expect(model.research.find(({ id }) => id === 'scan1')?.costs.materials)
      .toEqual([
        { id: 'Fe', label: 'Iron', required: 6, owned: 0 },
        { id: 'Si', label: 'Silicon', required: 4, owned: 0 },
      ]);
    expect(model.research.find(({ id }) => id === 'drive3')?.costs.prerequisite)
      .toMatchObject({ id: 'drive2', label: 'Antimatter Drive', owned: true });
  });

  it('keeps Deep Scanners behind exact positive Jump Drive loadout authority', () => {
    const mars = world(MARS);
    const projection = (
      registeredLoadout: ReturnType<typeof loadout>,
      visibleShipItems: readonly (readonly [string, number])[],
    ) => projectEngineeringPanelReadModel({
      ship: ship(visibleShipItems),
      nav: surface(mars),
      engineering: state(),
      loadout: registeredLoadout,
      economy,
      activePlayMs: 0,
    }).research.find(({ id }) => id === 'scan1');

    const absent = projection(loadout(), [['jumpdrive', 1]]);
    expect(absent).toMatchObject({
      status: 'unavailable',
      reason: 'Build the Jump Drive first.',
      costs: {
        materials: [
          { id: 'Fe', required: 6, owned: 20 },
          { id: 'Si', required: 4, owned: 20 },
        ],
        stardust: { required: 20, owned: 500 },
        prerequisite: null,
      },
    });

    const zeroCount = projection(loadout([['jumpdrive', 0]]), [['jumpdrive', 1]]);
    expect(zeroCount).toMatchObject({
      status: 'unavailable', reason: 'Build the Jump Drive first.',
    });

    const owned = projection(loadout([['jumpdrive', 1]]), []);
    expect(owned).toMatchObject({ status: 'available', reason: null });

    const veteran = projectEngineeringPanelReadModel({
      ship: ship([]), nav: surface(mars), engineering: state({ research: ['scan1'] }),
      loadout: loadout(), economy, activePlayMs: 0,
    }).research.find(({ id }) => id === 'scan1');
    expect(veteran).toMatchObject({ status: 'owned', reason: 'Already researched.' });
  });

  it('separates protected Earth from a ready registered remnant corona with exact HP risk', () => {
    const earth = world(EARTH);
    const remnant = star(REMNANT_STAR);
    const systems = [['jumpdrive', 1]] as const;
    const earthModel = projectEngineeringPanelReadModel({
      ship: ship(systems), nav: surface(earth), engineering: state(),
      loadout: loadout(systems), economy, activePlayMs: 0,
    });
    expect(earthModel.mining).toMatchObject({ status: 'unavailable', detail: 'Earth is protected from extraction.' });

    const skim = projectEngineeringPanelReadModel({
      ship: ship(systems), nav: system(remnant), engineering: state({ stars: [{ address: remnant, count: 1 }] }),
      loadout: loadout(systems), economy, activePlayMs: 0,
    }).skimming;
    expect(skim).toMatchObject({ status: 'ready', material: 'Coronium', nextDamage: 3 });
    expect(skim.passesRemaining).toBeGreaterThan(0);
  });

  it('rejects a structural loadout clone and contains no ambient entropy, clock, DOM, or locale dependency', () => {
    const mars = world(MARS);
    const source = loadout([['jumpdrive', 1]]);
    expect(() => projectEngineeringPanelReadModel({
      ship: ship([['jumpdrive', 1]]), nav: surface(mars), engineering: state(),
      loadout: structuredClone(source), economy, activePlayMs: 0,
    })).toThrow(/registered Arc 2 loadout/);

    const here = path.dirname(fileURLToPath(import.meta.url));
    const text = fs.readFileSync(path.join(here, '../apps/game/src/engineering-panel-model.ts'), 'utf8');
    expect(text).not.toMatch(/Math\.random|Date\.now|performance\.|localeCompare|\bdocument\b|\bwindow\b|globalThis/);
  });

  it('fails every writable row closed at the exact Arc 3 and Arc 2 revision ceilings', () => {
    const mars = world(MARS);
    const engineeringExhausted = projectEngineeringPanelReadModel({
      ship: ship([['jumpdrive', 1]]), nav: surface(mars),
      engineering: state({ revision: Number.MAX_SAFE_INTEGER }),
      loadout: loadout([['jumpdrive', 1]]), economy, activePlayMs: 0,
    });
    expect(engineeringExhausted.mining).toMatchObject({
      status: 'unavailable', detail: 'Engineering record revision is exhausted.',
    });
    expect(engineeringExhausted.research.find(({ id }) => id === 'scan1')).toMatchObject({
      status: 'unavailable', reason: 'Engineering record revision is exhausted.',
    });
    expect(engineeringExhausted.fabricationGroups.flatMap(({ recipes }) => recipes)
      .find(({ baseId }) => baseId === 'plate')).toMatchObject({
      status: 'unavailable', reason: 'Engineering record revision is exhausted.',
    });

    const inventoryExhausted = projectEngineeringPanelReadModel({
      ship: ship([]), nav: surface(mars), engineering: state(),
      loadout: loadoutAtRevision(0xffff_ffff), economy, activePlayMs: 0,
    });
    expect(inventoryExhausted.mining.status).toBe('ready');
    expect(inventoryExhausted.research.find(({ id }) => id === 'scan1')).toMatchObject({
      status: 'unavailable', reason: 'Build the Jump Drive first.',
    });
    expect(inventoryExhausted.fabricationGroups.flatMap(({ recipes }) => recipes)
      .find(({ baseId }) => baseId === 'plate')).toMatchObject({
      status: 'unavailable', reason: 'Inventory record revision is exhausted.',
    });

    const oneRevisionLeft = projectEngineeringPanelReadModel({
      ship: ship([]), nav: surface(mars), engineering: state(),
      loadout: loadoutAtRevision(0xffff_fffe), economy, activePlayMs: 0,
    });
    expect(oneRevisionLeft.fabricationGroups.flatMap(({ recipes }) => recipes)
      .find(({ baseId }) => baseId === 'plate')?.status).toBe('available');
    expect(oneRevisionLeft.fabricationGroups.flatMap(({ recipes }) => recipes)
      .find(({ baseId }) => baseId === 'rig1')).toMatchObject({
      status: 'unavailable', reason: 'Inventory record revision is exhausted.',
    });
  });
});
