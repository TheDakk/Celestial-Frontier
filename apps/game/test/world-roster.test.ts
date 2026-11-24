import { describe, expect, it } from 'vitest';
import { systemScene } from '@cf/scene';
import rosters from '../../../fixtures/current/rosters.json' with { type: 'json' };
import {
  CANONICAL_BIOSPHERE_KEYS,
  canonicalWorldRoster,
  isCanonicalWorldRoster,
  worldRosterView,
} from '../src/world';
import {
  AMBIENT_EPOCH_KEY,
  FOREIGN_GALAXY,
  FOREIGN_STAR,
  HOME_GALAXY,
  SOL,
  addressOf,
  independentFullRosterFingerprint,
  legacyEarthRosterOracle,
} from './world-roster-support';

// The roster is the legacy game's (LEGACY: celestial-frontier.html of the live branch, 4862-4935 and 5097-5131).
// The source-injection half is world-roster-sources.test.ts.
describe('the full world roster', () => {
  it('pins the complete canonical biosphere key vocabulary', () => {
    expect(CANONICAL_BIOSPHERE_KEYS).toEqual([
      'earth', 'none', 'complex', 'flora', 'aquatic',
      'sparse', 'microbial', 'subsurface', 'aerial', 'xfauna',
    ]);
    expect(new Set(CANONICAL_BIOSPHERE_KEYS).size).toBe(CANONICAL_BIOSPHERE_KEYS.length);
    expect(Object.isFrozen(CANONICAL_BIOSPHERE_KEYS)).toBe(true);
  });

  it('a roster view is every row and their count: no row is ever held out of sight', () => {
    // LEGACY celestial-frontier.html:5120-5131 (one survey row per species) and 13735 (a portrait for every species):
    // the legacy game has no eight-row strip.
    const source = Array.from({ length: 13 }, (_, index) => ({ id: `species-${index}` }));
    const view = worldRosterView(source);
    expect(Object.keys(view).sort()).toEqual(['all', 'total']);
    expect(view.all.map((row) => row.id)).toEqual(source.map((row) => row.id));
    expect(view.total).toBe(13);
  });

  it('does not let caller mutation rewrite the canonical roster snapshot', () => {
    const source = [{ id: 'a' }, { id: 'b' }];
    const view = worldRosterView(source);
    source.push({ id: 'c' });
    expect(view.all.map((row) => row.id)).toEqual(['a', 'b']);
    expect(Object.isFrozen(view.all)).toBe(true);
  });

  it('keeps short/empty rosters exact and rejects non-arrays', () => {
    expect(worldRosterView([])).toEqual({ all: [], total: 0 });
    expect(worldRosterView([{ id: 1 }]).all).toEqual([{ id: 1 }]);
    expect(() => worldRosterView(null as never)).toThrow('world roster must be an array');
  });

  it('builds the real Earth roster with detached, deeply frozen names', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const result = canonicalWorldRoster(earth, 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.roster.address).toBe(earth);
    expect(result.roster.worldKey).toBe('CF1|g:999@90,-60|s:424242@560,170|p:133#2');
    expect(result.roster.biosphereKey).toBe('earth');
    expect(result.roster.ecologyEpoch).toBe(0);
    expect(result.roster.view.total).toBeGreaterThan(8);
    expect(result.roster.view.all.every((row) => typeof row._earthName === 'string')).toBe(true);
    expect(result.roster.view.all.every((row) => row._cradle === 1)).toBe(true);
    expect(result.roster.view.all.some((row) => row._rare === 1)).toBe(false);
    expect(result.roster.view.all.map((row) => row._earthName)).toEqual([
      'Persimmon', 'Devil\'s Club', 'Cranberry', 'Rambutan', 'Wild Guava',
      'Barrel Cactus Fruit', 'Mildew', 'Giant Puffball', 'Red-Tide Algae',
      'Halophile', 'Euglena', 'Platypus', 'Civet', 'Brittle Star', 'Frog',
      'Pheasant', 'Oryx', 'Sea Urchin', 'Prawn',
    ]);
    expect(result.roster.fullRosterFingerprint).toBe('cwr1:19:6305:58e079f2');
    expect(result.roster.fullRosterFingerprint).toBe(independentFullRosterFingerprint(
      result.roster.worldKey,
      result.roster.ecologyEpoch,
      result.roster.view.all,
    ));
    expect(isCanonicalWorldRoster(result.roster)).toBe(true);
    expect(isCanonicalWorldRoster({ ...result.roster })).toBe(false);
    expect(Object.isFrozen(result.roster)).toBe(true);
    expect(Object.isFrozen(result.roster.view.all[0])).toBe(true);
    const nested = Object.values(result.roster.view.all[0]!).find((value) => value && typeof value === 'object');
    if (nested) expect(Object.isFrozen(nested)).toBe(true);
  });

  it('matches the independent legacy Earth oracle at epoch 0 and positive epochs', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    // @ts-expect-error The production owner requires an explicit epoch.
    const omitted = canonicalWorldRoster(earth);
    expect(omitted).toEqual({
      ok: false,
      reason: 'invalid-epoch',
      message: 'ecology epoch must be an integer from 0 through 10000',
    });

    for (const ecologyEpoch of [0, 1, 3, 7, 10_000]) {
      const result = canonicalWorldRoster(earth, ecologyEpoch);
      expect(result.ok, `epoch ${ecologyEpoch}`).toBe(true);
      if (!result.ok) continue;
      expect(result.roster.ecologyEpoch).toBe(ecologyEpoch);
      expect(result.roster.view.all, `epoch ${ecologyEpoch}`).toEqual(
        legacyEarthRosterOracle(ecologyEpoch),
      );
      expect(result.roster.view.all.every((row) => row._cradle === 1)).toBe(true);
    }
  });

  it('pins exact Earth vagrant count, order, seed, kingdom, and flags', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const starterCount = legacyEarthRosterOracle(0).length;
    const expected = new Map<number, Readonly<{
      fingerprint: string;
      vagrants: ReadonlyArray<Readonly<{ seed: number; kingdom: string; name: string }>>;
    }>>([
      [1, {
        fingerprint: 'cwr1:20:6649:4475e0c7',
        vagrants: [{ seed: 1_469_879_140, kingdom: 'fauna', name: 'Harpy Eagle' }],
      }],
      [3, {
        fingerprint: 'cwr1:21:6991:474178d9',
        vagrants: [
          { seed: 3_987_089_485, kingdom: 'fauna', name: 'Polychaete Worm' },
          { seed: 102_922_185, kingdom: 'fauna', name: 'Sea Snail' },
        ],
      }],
      [7, {
        fingerprint: 'cwr1:21:6984:6c39657c',
        vagrants: [
          { seed: 3_720_706_363, kingdom: 'fauna', name: 'Stonefly' },
          { seed: 411_549_083, kingdom: 'flora', name: 'Alpine Sorrel' },
        ],
      }],
      [10_000, {
        fingerprint: 'cwr1:20:6648:215ecee2',
        vagrants: [{ seed: 1_967_467_694, kingdom: 'flora', name: 'Wild Chive' }],
      }],
    ]);

    for (const [ecologyEpoch, expectation] of expected) {
      const result = canonicalWorldRoster(earth, ecologyEpoch);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const vagrants = result.roster.view.all.slice(starterCount);
      expect(vagrants).toHaveLength(expectation.vagrants.length);
      expect(vagrants.map((row) => ({
        seed: row.seed,
        kingdom: row.kingdom,
        name: row._earthName,
      }))).toEqual(
        expectation.vagrants,
      );
      expect(result.roster.fullRosterFingerprint).toBe(expectation.fingerprint);
      expect(vagrants.every((row) => row._cradle === 1 && row._rare === 1)).toBe(true);
    }
  });

  it('accepts a real proven barren world as canonical none with an empty roster', () => {
    const barren = systemScene(SOL.seed).planets.find((planet) => planet.seed !== 133);
    expect(barren).toBeDefined();
    const address = addressOf(HOME_GALAXY, SOL, barren!.seed);
    const result = canonicalWorldRoster(address, 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.roster.biosphereKey).toBe('none');
    expect(result.roster.ecologyEpoch).toBe(0);
    expect(result.roster.view).toEqual({ all: [], total: 0 });
    const later = canonicalWorldRoster(address, 9);
    expect(later.ok).toBe(true);
    if (later.ok) {
      expect(later.roster.view).toEqual(result.roster.view);
      expect(later.roster.ecologyEpoch).toBe(9);
      expect(later.roster.fullRosterFingerprint).not.toBe(result.roster.fullRosterFingerprint);
    }
  });

  it('uses the canonical ecology source for a real procedural system', () => {
    const scene = systemScene(FOREIGN_STAR.seed);
    const results = scene.planets.map((planet) => canonicalWorldRoster(
      addressOf(FOREIGN_GALAXY, FOREIGN_STAR, planet.seed),
      0,
    ));
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.some((result) => result.ok && result.roster.biosphereKey !== 'earth')).toBe(true);
    for (const result of results) if (result.ok) {
      expect(result.roster.view.total === 0).toBe(result.roster.biosphereKey === 'none');
    }
  });

  it('does not read or write a reflected ambient epoch while building the production roster', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const previous = Reflect.getOwnPropertyDescriptor(globalThis, AMBIENT_EPOCH_KEY);
    let reads = 0;
    let writes = 0;
    if (!Reflect.defineProperty(globalThis, AMBIENT_EPOCH_KEY, {
      configurable: true,
      enumerable: false,
      get: () => { reads++; throw new Error('ambient epoch read'); },
      set: () => { writes++; throw new Error('ambient epoch write'); },
    })) throw new Error('could not install roster ambient-epoch tripwire');
    try {
      const result = canonicalWorldRoster(earth, 7);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.roster.ecologyEpoch).toBe(7);
      expect(reads).toBe(0);
      expect(writes).toBe(0);
    } finally {
      if (previous) Reflect.defineProperty(globalThis, AMBIENT_EPOCH_KEY, previous);
      else Reflect.deleteProperty(globalThis, AMBIENT_EPOCH_KEY);
    }
  });
});

type Row = Record<string, unknown>;
const recorded = rosters as unknown as Record<'earth' | 'kaum' | 'osum', Row[][]>;
// fixtures/current/rosters.json holds each world's roster at these ecology epochs, in this order
// (tools/record-fixtures.mjs: the rosters recorder). Earth's recorded rows are its starters only: the
// fixture's genomes carry no name, no cradle mark and no visitors.
const RECORDED_EPOCHS = [0, 1, 2, 3, 6, 12];
// Earth's 19 starters by name, in roster order (tests/cross/earth-roster.test.ts pins the same names).
const STARTER_NAMES = [
  'Persimmon', "Devil's Club", 'Cranberry', 'Rambutan', 'Wild Guava', 'Barrel Cactus Fruit', 'Mildew',
  'Giant Puffball', 'Red-Tide Algae', 'Halophile', 'Euglena', 'Platypus', 'Civet', 'Brittle Star', 'Frog',
  'Pheasant', 'Oryx', 'Sea Urchin', 'Prawn',
];
const recordedEarth = (): Row[] =>
  recorded.earth[0]!.map((genome, index) => ({ ...genome, _earthName: STARTER_NAMES[index], _cradle: 1 }));
// Kaum and Osum: two home-galaxy worlds, addressed as tools/record-fixtures.mjs addresses them.
const NEIGHBOURS = {
  kaum: { star: { seed: 2737406570, x: 160.5956227169372, y: -89.13221201486886 }, planet: 1757105165 },
  osum: { star: { seed: 1074947061, x: 114.26536275492981, y: 446.9253231128678 }, planet: 51464061 },
} as const;

describe('the roster of a world, against the recorded rosters', () => {
  it('Earth at epoch 0 is the 19 recorded genomes, named, each marked cradle', () => {
    const result = canonicalWorldRoster(addressOf(HOME_GALAXY, SOL, 133), 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(recorded.earth[0]).toHaveLength(19);
    expect(result.roster.view.all).toEqual(recordedEarth());
  });

  it('Earth at epoch 3 is the 19 plus Polychaete Worm and Sea Snail', () => {
    const result = canonicalWorldRoster(addressOf(HOME_GALAXY, SOL, 133), 3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const all = result.roster.view.all;
    expect(all.slice(0, 19)).toEqual(recordedEarth());
    expect(all.slice(19).map((row) => `${String(row.kingdom)}:${String(row._earthName)}`))
      .toEqual(['fauna:Polychaete Worm', 'fauna:Sea Snail']);
    expect(all.slice(19).every((row) => row._cradle === 1 && row._rare === 1)).toBe(true);
  });

  it('Kaum and Osum at each recorded epoch equal the fixture', () => {
    for (const name of ['kaum', 'osum'] as const) {
      const address = addressOf(HOME_GALAXY, NEIGHBOURS[name].star, NEIGHBOURS[name].planet);
      expect(recorded[name]).toHaveLength(RECORDED_EPOCHS.length);
      RECORDED_EPOCHS.forEach((epoch, index) => {
        const result = canonicalWorldRoster(address, epoch);
        expect(result.ok, `${name} at epoch ${epoch}`).toBe(true);
        if (!result.ok) return;
        expect(recorded[name][index]!.length).toBeGreaterThan(0);
        expect(result.roster.view.all, `${name} at epoch ${epoch}`).toEqual(recorded[name][index]);
      });
    }
  });

  it('the roster is frozen: a write to a row throws', () => {
    const result = canonicalWorldRoster(addressOf(HOME_GALAXY, SOL, 133), 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const row = result.roster.view.all[0] as Row;
    expect(() => { row._earthName = 'Renamed'; }).toThrow(TypeError);
    expect(() => { (result.roster.view.all as Row[]).push({}); }).toThrow(TypeError);
    expect(() => { (result.roster as unknown as Row).ecologyEpoch = 9; }).toThrow(TypeError);
    expect(result.roster.view.all[0]!._earthName).toBe('Persimmon');
  });
});
