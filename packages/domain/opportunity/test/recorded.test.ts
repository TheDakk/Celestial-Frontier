import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  createEngineeringState,
  createLegacyEngineeringSeedResolver,
  migrateLegacyEngineeringState,
  planFixedFabrication,
} from '../src/index.js';

/* fixtures/current/opportunity.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the opportunity recorder): fixed fabrication plans, the one planner that
   needs no Arc 2 capability. Its only clock is the injected active-play time; the receipt ordinal
   seeds generated-gear metadata. As the recorder did, this file installs the capture hooks first. */

type Json = Record<string, unknown>;
interface Input { baseId: string; assets: string; state: 'fresh' | 'mined'; activePlayMs: number; receiptOrdinal: number }
interface OpportunityFixture {
  freeGlobals: Record<string, string>;
  injected: Record<string, string>;
  world: { galaxy: { seed: number; x: number; y: number }; star: { seed: number; x: number; y: number }; planet: { seed: number } };
  assets: Record<string, Json>;
  fabrication: { input: Input; output: Json }[];
}

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/opportunity.json', import.meta.url), 'utf8'),
) as OpportunityFixture;

const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');

beforeAll(() => installCaptureHooks());

function stateOf(name: 'fresh' | 'mined') {
  if (name === 'fresh') return createEngineeringState();
  const resolved = resolveCF1WorldAddress(fixture.world);
  if (!resolved.ok) throw new Error(`world did not resolve: ${resolved.reason}`);
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA, revision: 2, worlds: [{ seed: fixture.world.planet.seed, extractionsTaken: 3 }], stars: [], research: [],
  }, createLegacyEngineeringSeedResolver({ worlds: [resolved.address], stars: [] }));
}

const answer = (input: Input) => plain(planFixedFabrication({
  state: stateOf(input.state), baseId: input.baseId, assets: structuredClone(fixture.assets[input.assets]) as never,
  activePlay: { activePlayMs: input.activePlayMs }, receiptOrdinal: input.receiptOrdinal,
}));

const find = (where: Partial<Input>) => fixture.fabrication.find(({ input }) => (Object.keys(where) as (keyof Input)[]).every((k) => input[k] === where[k]))!;

describe('@cf/domain-opportunity — recorded fixed fabrication plans', () => {
  it('every recorded plan: gear, exceptional gear, a stackable part and the Auto-Extractor, on a fresh and a mined state', () => {
    expect(fixture.fabrication).toHaveLength(32);
    expect(fixture.fabrication.every(({ output }) => output.status === 'planned')).toBe(true);
    expect(fixture.fabrication.map(({ input }) => ({ input, output: answer(input) }))).toEqual(fixture.fabrication);
  });
});

/* Review Focus 3: the injected clock alone decides what it decides, and a plan never falls back to a
   device clock or Math.random. */
describe('@cf/domain-opportunity — injected clock and receipt', () => {
  it('the recorded plans differ when only the injected clock or only the receipt ordinal differs', () => {
    const base = { baseId: 'autoext', assets: 'plenty', state: 'mined' as const };
    const early = find({ ...base, activePlayMs: 0, receiptOrdinal: 4 }).output;
    const late = find({ ...base, activePlayMs: 90000, receiptOrdinal: 4 }).output;
    expect(early.witness).not.toBe(late.witness);
    expect(early.nextState).not.toEqual(late.nextState); // the Auto-Extractor re-anchors at the injected clock
    const gear4 = find({ baseId: 'meteor', assets: 'plenty', state: 'fresh', activePlayMs: 0, receiptOrdinal: 4 }).output;
    const gear5 = find({ baseId: 'meteor', assets: 'plenty', state: 'fresh', activePlayMs: 0, receiptOrdinal: 5 }).output;
    expect(gear4.result).not.toEqual(gear5.result); // the receipt seeds the generated gear
    for (const recorded of [early, late, gear4, gear5]) {
      const { input } = fixture.fabrication.find(({ output }) => output === recorded)!;
      expect(answer(input)).toEqual(answer(input));
      expect(answer(input)).toEqual(recorded);
    }
  });

  it('no recorded plan reads the device clock or Math.random', () => {
    const RealDate = globalThis.Date;
    const refuse = (name: string) => () => { throw new Error(`ambient ${name} was read`); };
    const spies = [
      vi.spyOn(Math, 'random').mockImplementation(refuse('Math.random')),
      vi.spyOn(RealDate, 'now').mockImplementation(refuse('Date.now')),
      vi.spyOn(performance, 'now').mockImplementation(refuse('performance.now')),
    ];
    globalThis.Date = new Proxy(RealDate, { construct: refuse('new Date') }) as DateConstructor;
    try {
      expect(fixture.fabrication.map(({ input }) => ({ input, output: answer(input) }))).toEqual(fixture.fabrication);
    } finally {
      globalThis.Date = RealDate;
      for (const spy of spies) spy.mockRestore();
    }
  });

  it('throws when the clock is missing', () => {
    const { input } = fixture.fabrication[0]!;
    const plan = (activePlay: unknown) => planFixedFabrication({
      state: stateOf(input.state), baseId: input.baseId, assets: structuredClone(fixture.assets[input.assets]) as never,
      activePlay: activePlay as never, receiptOrdinal: input.receiptOrdinal,
    });
    expect(() => plan(undefined)).toThrow();
    expect(() => plan({})).toThrow();
    expect(() => plan({ activePlayMs: -1 })).toThrow();
  });
});
