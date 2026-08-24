/* D-ST — the lifted describePick remains the v1.8.9 parity oracle, while
   describePickWithState is the production-shaped router: nav and custom-name
   authority are explicit inputs rather than app globals. */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  describePick,
  describePickWithState,
  installCaptureHooks,
  type DescriptorNavigationState,
  type DescriptorPick,
} from '@cf/domain-descriptors';
import { galaxyProfile, starsInCell, systemFor } from '@cf/domain-worldgen';
import { canon } from './parity.js';

type Raw = Record<string, unknown>;

const globals = globalThis as Raw;
const GAL: Raw = {
  seed: 999, x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, home: true,
};
const STAR = { seed: 424242, x: 560, y: 170 };
const NAV = { gal: GAL, star: STAR } satisfies DescriptorNavigationState;
const NO_NAME = (): undefined => undefined;
const priorSt = Object.getOwnPropertyDescriptor(globalThis, 'st');
const priorCustomNames = Object.getOwnPropertyDescriptor(globalThis, 'customNames');

function restoreGlobal(key: string, prior: PropertyDescriptor | undefined): void {
  if (prior) Object.defineProperty(globalThis, key, prior);
  else delete globals[key];
}

function realDeco(): Raw {
  const prof = galaxyProfile(999);
  for (let cx = -12; cx <= 12; cx++) for (let cy = -12; cy <= 12; cy++) {
    const cell = starsInCell(999, prof, cx, cy);
    const found = cell.deco.find((row) => ['h2', 'neb', 'mol', 'plan', 'rem'].includes(row.k));
    if (found) return found;
  }
  throw new Error('no deco found in the scanned home-galaxy window');
}

function routeCases(): Array<{ kind: string; pick: DescriptorPick }> {
  const sys = systemFor(424242);
  const earth = sys.planets.find((planet) => planet.P.seed === 133);
  if (!earth) throw new Error('Sol fixture has no Earth');
  return [
    { kind: 'galaxy', pick: { kind: 'galaxy', data: GAL } },
    { kind: 'quasar', pick: { kind: 'quasar', data: { ...GAL, quasar: true } } },
    { kind: 'star', pick: { kind: 'star', data: STAR } },
    { kind: 'starsys', pick: { kind: 'starsys', data: { seed: STAR.seed } } },
    { kind: 'planet', pick: { kind: 'planet', data: { P: earth.P, sys, pl: earth } } },
    { kind: 'moon', pick: { kind: 'moon', data: { pl: earth, m: 0 } } },
    { kind: 'comet', pick: { kind: 'comet', data: { ci: 2, cm: { period: 17, ecc: 0.88 } } } },
    { kind: 'belt', pick: { kind: 'belt', data: { sys } } },
    { kind: 'deco', pick: { kind: 'deco', data: realDeco() } },
    { kind: 'worm', pick: { kind: 'worm', data: {} } },
    { kind: 'dwarf', pick: { kind: 'dwarf', data: { dw: { name: 'Eris analogue', seed: 31337 } } } },
    { kind: 'kuiper', pick: { kind: 'kuiper', data: { sys } } },
    { kind: 'oort', pick: { kind: 'oort', data: {} } },
    { kind: 'visitor', pick: { kind: 'visitor', data: {} } },
    { kind: 'radio', pick: { kind: 'radio', data: { ...GAL, radio: true } } },
    {
      kind: 'snova',
      pick: { kind: 'snova', data: { seed: 777, remnant: 'NS', births: [{ seed: 778 }] } },
    },
    { kind: 'protostar', pick: { kind: 'protostar', data: { seed: 778 } } },
    { kind: 'cmb', pick: { kind: 'cmb', data: {} } },
  ];
}

beforeAll(() => {
  installCaptureHooks();
  globals.st = NAV;
  globals.customNames = new Map<string, string>();
});

afterAll(() => {
  restoreGlobal('st', priorSt);
  restoreGlobal('customNames', priorCustomNames);
});

describe('D-ST — explicit descriptor state seam', () => {
  it('★ a REAL deco object routes through explicit nav state', () => {
    const card = describePickWithState({ kind: 'deco', data: realDeco() }, NAV, NO_NAME);
    expect(card).toBeTruthy();
    expect(card!.title.length).toBeGreaterThan(0);
    expect((card!.where as { type: string }).type).toBe('galaxy');
  });

  it.each(routeCases())('$kind card is canonical-byte equal to the lifted router', ({ pick }) => {
    const customNames = new Map<string, string>([
      ['g999', 'The Cradle'], ['s424242', 'Homefire'], ['p133', 'Blue Home'],
    ]);
    globals.st = NAV;
    globals.customNames = customNames;
    const expected = describePick(pick as unknown as Raw);
    const actual = describePickWithState(pick, NAV, (key) => customNames.get(key));
    expect(canon(actual)).toBe(canon(expected));
  });

  it('NEGATIVE CONTROL — every star-dependent route fails closed without a current star', () => {
    const noStar = { gal: GAL, star: null } satisfies DescriptorNavigationState;
    for (const kind of ['starsys', 'planet', 'moon', 'comet', 'belt', 'dwarf', 'kuiper', 'oort', 'visitor']) {
      expect(describePickWithState({ kind, data: {} }, noStar, NO_NAME), kind).toBeNull();
    }
  });

  it('NEGATIVE CONTROL — a planet or moon route without its picked planet fails closed', () => {
    expect(describePickWithState({ kind: 'planet', data: {} }, NAV, NO_NAME)).toBeNull();
    expect(describePickWithState({ kind: 'moon', data: { m: 0 } }, NAV, NO_NAME)).toBeNull();
  });

  it('NEGATIVE CONTROL — poisoned globals cannot replace explicit state or custom-name authority', () => {
    globals.st = {
      gal: { ...GAL, seed: 31337 },
      star: { seed: 31337, x: -9, y: -8 },
    };
    globals.customNames = new Map([['s424242', 'WRONG GLOBAL NAME']]);

    const mutableGal = { ...GAL };
    const mutableStar = { ...STAR };
    const nav = { gal: mutableGal, star: mutableStar } satisfies DescriptorNavigationState;
    const names = new Map([['s424242', 'Explicit Homefire'], ['s7', 'Second State']]);
    const first = describePickWithState(
      { kind: 'starsys', data: { seed: 424242 } }, nav, (key) => names.get(key),
    )!;

    mutableGal.seed = 123;
    mutableStar.seed = 7;
    mutableStar.x = 8;
    mutableStar.y = 9;
    names.set('s424242', 'Changed Too Late');
    const second = describePickWithState(
      { kind: 'starsys', data: { seed: 7 } }, nav, (key) => names.get(key),
    )!;

    expect(first.title).toBe('Explicit Homefire');
    expect(first.sub).toMatch(/named by you/);
    expect((first.where as { gal: { seed: number }; star: { seed: number } }).gal.seed).toBe(999);
    expect((first.where as { star: { seed: number } }).star.seed).toBe(424242);
    expect(second.title).toBe('Second State');
    expect((second.where as { gal: { seed: number }; star: { seed: number } }).gal.seed).toBe(123);
    expect((second.where as { star: { seed: number } }).star.seed).toBe(7);
  });
});
