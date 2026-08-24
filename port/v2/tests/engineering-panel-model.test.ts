import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  createLegacyEngineeringSeedResolver,
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
}> = {}): EngineeringStateV2 {
  const worlds = options.worlds ?? [];
  const stars = options.stars ?? [];
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: 4,
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
      .toMatchObject({ effectSupport: 'unavailable', status: 'unavailable' });
    expect(model.fabricationGroups.flatMap(({ recipes }) => recipes).find(({ baseId }) => baseId === 'rig1')?.effectSupport)
      .toBe('live');
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.fabricationGroups[0]?.recipes)).toBe(true);
  });

  it('prioritizes unavailable research consumers while exposing exact owned costs', () => {
    const mars = world(MARS);
    const model = projectEngineeringPanelReadModel({
      ship: ship([]), nav: surface(mars), engineering: state({ research: ['drive2'] }),
      loadout: loadout(), economy: { ...economy, cargo: [], stardust: 0 }, activePlayMs: 0,
    });
    expect(model.research.find(({ id }) => id === 'drive2')).toMatchObject({
      status: 'owned', reason: 'Already researched.',
    });
    expect(model.research.find(({ id }) => id === 'drive3')).toMatchObject({
      status: 'unavailable', reason: 'Gameplay effect is not connected.',
    });
    expect(model.research.find(({ id }) => id === 'scan1')?.costs.materials)
      .toEqual([
        { id: 'Fe', label: 'Iron', required: 6, owned: 0 },
        { id: 'Si', label: 'Silicon', required: 4, owned: 0 },
      ]);
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
});
