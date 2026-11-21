import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { systemFor } from '@cf/domain-worldgen';
import { installCaptureHooks, planetDescriptorAtEcologyEpoch } from '@cf/domain-descriptors';

/* planetDescriptorAtEcologyEpoch sets the COSMIC_EPOCH global only around the verbatim call. These
   tests check the answers against fixtures/current/descriptors.json (recorded from the current game
   with the global set) and check that the global is always put back as it was. */
const KEY = 'COSMIC_EPOCH';
type Raw = Record<string, unknown>;
interface Row { input: { kind: string; star?: number; planet?: number; epoch?: number }; output: unknown }

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/descriptors.json', import.meta.url), 'utf8'),
) as { cases: Row[] };
const recorded = (planet: number, epoch: number): unknown =>
  fixture.cases.find(({ input }) => input.kind === 'planet' && input.planet === planet && input.epoch === epoch)!.output;
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');

const WORLDS = { earth: { star: 424242, planet: 133 }, kaum: { star: 2737406570, planet: 1757105165 } };
function card(world: keyof typeof WORLDS, epoch: number): unknown {
  const { star, planet } = WORLDS[world];
  const sys = systemFor(star) as unknown as { planets: Array<Raw & { P: Raw }> };
  const pl = sys.planets.find((entry) => entry.P.seed === planet)!;
  return plain(planetDescriptorAtEcologyEpoch(pl.P, sys as unknown as Raw, pl, epoch));
}

beforeAll(() => installCaptureHooks());
afterEach(() => { Reflect.deleteProperty(globalThis, KEY); });

describe('@cf/domain-descriptors — planet card at an explicit ecology epoch', () => {
  it('two different epochs give the two different recorded answers, on Earth and on Kaum', () => {
    for (const world of ['earth', 'kaum'] as const) {
      const { planet } = WORLDS[world];
      expect(recorded(planet, 0), world).not.toEqual(recorded(planet, 12));
      expect(card(world, 0), world).toEqual(recorded(planet, 0));
      expect(card(world, 12), world).toEqual(recorded(planet, 12));
    }
  });

  it('the argument wins over an ambient global, which is left as it was', () => {
    (globalThis as Raw)[KEY] = 12;
    expect(card('earth', 0)).toEqual(recorded(133, 0));
    expect((globalThis as Raw)[KEY]).toBe(12);
    Reflect.deleteProperty(globalThis, KEY);
    expect(card('kaum', 12)).toEqual(recorded(1757105165, 12));
    expect(KEY in globalThis).toBe(false);
  });

  it('puts the global back when the wrapped call throws, after the call saw the epoch', () => {
    let seen: unknown = 'not read';
    const throwing = { get seed(): number { seen = (globalThis as Raw)[KEY]; throw new Error('planet read failed'); } };

    expect(() => planetDescriptorAtEcologyEpoch(throwing, null, null, 7)).toThrow('planet read failed');
    expect(seen).toBe(7);
    expect(KEY in globalThis).toBe(false);

    const before = { configurable: true, enumerable: true, writable: true, value: 3 };
    Object.defineProperty(globalThis, KEY, before);
    expect(() => planetDescriptorAtEcologyEpoch(throwing, null, null, 9)).toThrow('planet read failed');
    expect(seen).toBe(9);
    expect(Object.getOwnPropertyDescriptor(globalThis, KEY)).toEqual(before);
  });

  it('rejects an epoch outside 0..10000 or not an integer, before touching the global', () => {
    let touched = 0;
    Object.defineProperty(globalThis, KEY, {
      configurable: true,
      get: () => { touched++; return 0; },
      set: () => { touched++; },
    });
    const { P } = (systemFor(424242) as unknown as { planets: Array<{ P: Raw }> }).planets[0]!;
    for (const bad of [-1, 10_001, 1.5, Number.NaN, '3']) {
      expect(() => planetDescriptorAtEcologyEpoch(P, null, null, bad as never), String(bad))
        .toThrow('ecology epoch must be an integer from 0 through 10000');
    }
    expect(touched).toBe(0);
  });
});
