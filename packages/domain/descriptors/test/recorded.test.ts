import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { galaxiesInCell, systemFor } from '@cf/domain-worldgen';
import {
  beltDescriptor,
  galaxyDescriptor,
  galaxyStats,
  installCaptureHooks,
  moonDescriptor,
  planetDescriptorAtEcologyEpoch,
  starDescriptor,
} from '@cf/domain-descriptors';

/* fixtures/current/descriptors.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the descriptors recorder), with the hooks installed the way the game
   installs them and COSMIC_EPOCH set as a global around each planet card. This file makes the same
   calls in the same order (the generators memoise, and the planet-thumb hook caches a gas giant's
   palette on the shared planet), passing the epoch as an argument instead of a global. */
type Input =
  | { kind: 'galaxy'; cx: number; cy: number; index: number }
  | { kind: 'star'; seed: number }
  | { kind: 'planet'; star: number; planet: number; epoch: number }
  | { kind: 'moon'; star: number; planet: number; moon: number }
  | { kind: 'belt'; star: number }
  | { kind: 'system'; star: number };
interface Row { input: Input; output: unknown }
interface DescriptorsFixture { freeGlobals: Record<string, string>; cases: Row[] }
type Raw = Record<string, unknown>;

const SOL = 424242;
const KAUM_OSUM_STARS = [2737406570, 1074947061];
const FREE_GLOBALS = ['_cardFactsSet', '_earthNamePass', 'GAL_KIND', 'planetThumb', 'starThumb', 'galaxyThumb',
  'moonThumb', 'cometThumb', 'beltThumb', 'GAL_SPRITES', 'COSMIC_EPOCH', 'st', 'customNames'];

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/descriptors.json', import.meta.url), 'utf8'),
) as DescriptorsFixture;

/** The fixture is JSON, which cannot hold undefined: compare both sides through the same round trip. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');

const planetOf = (star: number, planet: number): Raw => {
  const found = (systemFor(star).planets as unknown as Array<{ P: { seed: number } }>).find((entry) => entry.P.seed === planet);
  if (!found) throw new Error(`planet ${planet} not found in system ${star}`);
  return found as unknown as Raw;
};

function run(input: Input): unknown {
  switch (input.kind) {
    case 'galaxy': {
      const g = galaxiesInCell(input.cx, input.cy)[input.index] as unknown as Raw;
      return { stats: galaxyStats(g), card: galaxyDescriptor(g) };
    }
    case 'star': return starDescriptor(input.seed);
    case 'planet': {
      const pl = planetOf(input.star, input.planet);
      return planetDescriptorAtEcologyEpoch(pl.P as Raw, systemFor(input.star) as unknown as Raw, pl, input.epoch);
    }
    case 'moon': return moonDescriptor(planetOf(input.star, input.planet), input.moon as never);
    case 'belt': return beltDescriptor(systemFor(input.star) as unknown as Raw, input.star);
    case 'system': return systemFor(input.star);
  }
}

type Section = 'contract' | 'kaumOsum' | 'galaxies' | 'solSystem';
function sectionOf({ input }: Row): Section {
  if (input.kind === 'system') return 'solSystem';
  if (input.kind === 'galaxy') return input.cx === 0 && input.cy === -1 ? 'contract' : 'galaxies';
  const star = input.kind === 'star' ? input.seed : input.star;
  if (star === SOL) return 'contract';
  if (KAUM_OSUM_STARS.includes(star)) return 'kaumOsum';
  throw new Error(`unplaced case ${JSON.stringify(input)}`);
}
const SECTIONS: Section[] = ['contract', 'kaumOsum', 'galaxies', 'solSystem'];
const section = (rows: Row[], s: Section): Row[] => rows.filter((row) => sectionOf(row) === s);

let actual: Row[] = [];
beforeAll(() => {
  installCaptureHooks();
  actual = fixture.cases.map(({ input }) => ({ input, output: plain(run(structuredClone(input))) }));
});

const recordedPlanet = (planet: number, epoch: number): unknown =>
  fixture.cases.find(({ input }) => input.kind === 'planet' && input.planet === planet && input.epoch === epoch)!.output;

describe('@cf/domain-descriptors — survey cards pinned against the current game', () => {
  it('has the recorded cases, and states every free global the files read', () => {
    const counts: Record<string, number> = {};
    for (const { input } of fixture.cases) counts[input.kind] = (counts[input.kind] ?? 0) + 1;
    expect(counts).toEqual({ galaxy: 255, star: 3, planet: 25, moon: 5, belt: 3, system: 1 });
    expect(SECTIONS.map((s) => section(fixture.cases, s).length)).toEqual([25, 12, 254, 1]);
    expect(Object.keys(fixture.freeGlobals)).toEqual(FREE_GLOBALS);
  });
  it('leaves no epoch and no sprite pool on the global object', () => {
    expect(actual).toHaveLength(fixture.cases.length);
    expect('COSMIC_EPOCH' in globalThis).toBe(false);
    expect('GAL_SPRITES' in globalThis).toBe(false);
  });
  it('the contract worlds give the recorded cards: home galaxy, Sol, every Sol planet, Earth at seven epochs', () => {
    expect(section(actual, 'contract')).toEqual(section(fixture.cases, 'contract'));
  });
  it('Kaum and Osum give the recorded cards at epochs 0 and 12, with their stars, moons and belts', () => {
    expect(section(actual, 'kaumOsum')).toEqual(section(fixture.cases, 'kaumOsum'));
  });
  it('every galaxy in cells -8..8 gives the recorded stats and card, kind label included', () => {
    expect(section(actual, 'galaxies')).toEqual(section(fixture.cases, 'galaxies'));
  });
  it("Sol's system, after its planets were described, carries the recorded gas-giant palettes", () => {
    expect(section(actual, 'solSystem')).toEqual(section(fixture.cases, 'solSystem'));
    const planets = (section(actual, 'solSystem')[0]!.output as { planets: Array<{ P: Raw }> }).planets;
    expect(planets.filter((p) => p.P._pal !== undefined).map((p) => p.P.type)).toEqual(['gas', 'gas', 'gas']);
  });
  it('epochs 0 and 12 give different recorded answers on Earth, Kaum and Osum', () => {
    for (const planet of [133, 1757105165, 51464061]) {
      expect(recordedPlanet(planet, 0), String(planet)).not.toEqual(recordedPlanet(planet, 12));
    }
  });
  it('notices one changed recorded value in each section (negative control)', () => {
    const changes: Array<[Section, (rows: Row[]) => void]> = [
      ['contract', (rows) => { (rows.find((r) => r.input.kind === 'planet' && r.input.planet === 133 && r.input.epoch === 12)!.output as { species: unknown[] }).species.pop(); }],
      ['kaumOsum', (rows) => { ((rows.find((r) => r.input.kind === 'planet')!.output as { rows: string[][] }).rows[0]!)[1] = 'Changed'; }],
      ['galaxies', (rows) => { (rows[0]!.output as { card: { sub: string } }).card.sub = 'Spiral galaxy?'; }],
      ['solSystem', (rows) => { delete ((rows[0]!.output as { planets: Array<{ P: Raw }> }).planets[4]!.P)._pal; }],
    ];
    for (const [s, change] of changes) {
      const mutated = structuredClone(section(fixture.cases, s));
      change(mutated);
      expect(section(actual, s), s).toEqual(section(fixture.cases, s));
      expect(section(actual, s), s).not.toEqual(mutated);
    }
  });
});
