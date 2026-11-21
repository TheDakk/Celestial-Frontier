import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { hdGenesFor } from '@cf/domain-strays';

/* fixtures/current/strays.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the strays recorder). Each row holds the genome given to hdGenesFor
   beside the answer. The rows carry an Earth name or an Earth breed blend: the two branches that
   call the art lookup `_earthArt`, a free global no running context defines. The recorder
   supplied no value for it, and this file supplies none either. */
interface Row { genome: Record<string, unknown>; hdGenes: Record<string, unknown> }
interface StraysFixture {
  freeGlobals: Record<string, string>;
  earthRoster: Row[];
  earthNamed: Row[];
  blends: Row[];
  edges: Row[];
}
type Section = Exclude<keyof StraysFixture, 'freeGlobals'>;
const SECTIONS: Section[] = ['earthRoster', 'earthNamed', 'blends', 'edges'];
const EARTH_KEYS = ['_earthName', '_earthBlend', '_earthBlendKingdom', '_anchorVal'];

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/strays.json', import.meta.url), 'utf8'),
) as StraysFixture;

/** The fixture is JSON, which cannot hold undefined: compare both sides through the same round trip. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');
const answer = (rows: Row[]): unknown => plain(rows.map(({ genome }) => ({ genome, hdGenes: hdGenesFor(structuredClone(genome)) })));
const actual = Object.fromEntries(SECTIONS.map((s) => [s, answer(fixture[s])])) as Record<Section, unknown>;

/** Rows whose recorded answer is not the procedural answer for the same genome without its Earth
    fields, plus `_earthName` when the genome has a truthy one. That is the current game's
    behaviour, because the art lookup never returns a recipe. */
function earthOverlayMismatches(f: StraysFixture): string[] {
  const out: string[] = [];
  for (const s of SECTIONS) {
    f[s].forEach(({ genome, hdGenes }, i) => {
      const procedural = structuredClone(genome);
      for (const key of EARTH_KEYS) delete procedural[key];
      const expected: Record<string, unknown> = { ...hdGenesFor(procedural) };
      if (genome._earthName) expected._earthName = genome._earthName;
      if (JSON.stringify(plain(expected)) !== JSON.stringify(hdGenes)) out.push(`${s} ${i}`);
    });
  }
  return out;
}

describe('@cf/domain-strays — hdGenesFor on Earth genomes, pinned against the current game', () => {
  it('has the recorded rows, and states that no _earthArt was supplied', () => {
    expect(SECTIONS.map((s) => fixture[s].length)).toEqual([19, 40, 40, 6]);
    expect(fixture.earthRoster.every((row) => typeof row.genome._earthName === 'string' && row.genome._cradle === 1)).toBe(true);
    expect(fixture.blends.filter((row) => '_anchorVal' in row.genome)).toHaveLength(20);
    expect(Object.keys(fixture.freeGlobals)).toEqual(['_earthArt']);
    expect(fixture.freeGlobals._earthArt).toMatch(/^not supplied/);
    expect('_earthArt' in globalThis).toBe(false);
  });
  it("Earth's epoch-0 roster, named by the current game's name pass, gives the recorded genes", () => {
    expect(actual.earthRoster).toEqual(fixture.earthRoster);
  });
  it('Earth-named genomes of every kingdom give the recorded genes', () => {
    expect(actual.earthNamed).toEqual(fixture.earthNamed);
  });
  it('Earth breed blends, with and without an anchor, give the recorded genes', () => {
    expect(actual.blends).toEqual(fixture.blends);
  });
  it('a name beside a blend, an empty name, generation 0 and a null anchor give the recorded genes', () => {
    expect(actual.edges).toEqual(fixture.edges);
  });
  it('every recorded answer is the procedural answer, plus the Earth name when there is one', () => {
    expect(earthOverlayMismatches(fixture)).toEqual([]);
  });
  it('notices one changed recorded value in each section (negative control)', () => {
    const changes: Array<[Section, (f: StraysFixture) => void]> = [
      ['earthRoster', (f) => { f.earthRoster[0]!.hdGenes.bulk = (f.earthRoster[0]!.hdGenes.bulk as number) + 0.01; }],
      ['earthNamed', (f) => { f.earthNamed[0]!.hdGenes._earthName = 'Changed'; }],
      ['blends', (f) => { f.blends[0]!.hdGenes._anchor = 0.85; }],
      ['edges', (f) => { delete f.edges[0]!.hdGenes._earthName; }],
    ];
    for (const [section, change] of changes) {
      const mutated = structuredClone(fixture);
      change(mutated);
      expect(actual[section], section).toEqual(fixture[section]);
      expect(actual[section], section).not.toEqual(mutated[section]);
    }
    const overlay = structuredClone(fixture);
    overlay.blends[1]!.hdGenes._earthBlend = overlay.blends[1]!.genome._earthBlend;
    overlay.earthNamed[2]!.hdGenes.airb = !overlay.earthNamed[2]!.hdGenes.airb;
    expect(earthOverlayMismatches(overlay)).toEqual(['earthNamed 2', 'blends 1']);
  });
});
