import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { systemFor } from '@cf/domain-worldgen';
import { moonDescriptor } from '@cf/domain-descriptors';

/* fixtures/current/descriptors-moons.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the descriptors-moons recorder), with the hooks installed the way the
   game installs them: every moon card of every Sol planet, the table moons (SOL_MOONS) and the
   procedural ones. This file makes the same calls; the hooks are imported, not installed. */
interface Row { input: { star: number; planet: number; moon: number }; output: unknown }
interface MoonsFixture { freeGlobals: Record<string, string>; moons: Row[] }

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/descriptors-moons.json', import.meta.url), 'utf8'),
) as MoonsFixture;

/** The fixture is JSON, which cannot hold undefined: compare both sides through the same round trip. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');

const record = (rows: Row[]): Row[] => rows.map(({ input }) => {
  const c = structuredClone(input);
  const pl = (systemFor(c.star).planets as unknown as Array<{ P: { seed: number } }>).find((entry) => entry.P.seed === c.planet)!;
  return { input, output: plain(moonDescriptor(pl as never, c.moon as never)) };
});
const actual = record(fixture.moons);

describe('@cf/domain-descriptors — every Sol moon card pinned against the current game', () => {
  it('has a row for every moon of every Sol planet', () => {
    const counts: Record<number, number> = {};
    for (const { input } of fixture.moons) counts[input.planet] = (counts[input.planet] ?? 0) + 1;
    expect(counts).toEqual({ 133: 1, 134: 2, 135: 8, 136: 7, 137: 4, 138: 4 });
    expect(fixture.moons.filter(({ input }) => input.planet === 134).map(({ output }) => (output as { title: string }).title)).toEqual(['Phobos', 'Deimos']);
  });
  it('every Sol moon gives the recorded card', () => {
    expect(actual).toEqual(fixture.moons);
  });
  it('notices one changed recorded value (negative control)', () => {
    const mutated = structuredClone(fixture.moons);
    (mutated[11]!.output as { rows: string[][] }).rows[1]![1] = 'Changed';
    expect(actual).toEqual(fixture.moons);
    expect(actual).not.toEqual(mutated);
  });
});
