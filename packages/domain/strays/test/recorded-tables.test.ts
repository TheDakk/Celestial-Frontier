import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ASC_RING_R,
  BIOME_SETS,
  REGIONS,
  RING_SPECTRUM,
  biomeFor,
  decodeWhere,
  encodeWhere,
  gradeCapAt,
  regionAt,
  ringGrade,
  type Where,
} from '@cf/domain-strays';

/* fixtures/current/strays-tables.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the strays-tables recorder): the exported tables in full, and each
   function that reads them over fixed inputs, every input recorded beside its answer. This file
   makes the same calls on clones of the recorded inputs. */
interface TablesFixture {
  freeGlobals: Record<string, string>;
  tables: Record<string, unknown>;
  regionAt: Array<{ x: number; y: number; region: number }>;
  gradeCapAt: Array<{ where: unknown; cap: number }>;
  ringGrade: Array<{ genome: Record<string, unknown>; grade: Record<string, unknown> | null; where: unknown; graded: unknown }>;
  biomeFor: { seeds: number[]; rows: Array<{ type: string; band: string; keys: Array<string | null> }> };
  encode: Array<{ w: Where; name?: string; code: string; decoded: unknown }>;
  decode: Array<{ code: string; decoded: unknown }>;
}
type Section = Exclude<keyof TablesFixture, 'freeGlobals'>;

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/strays-tables.json', import.meta.url), 'utf8'),
) as TablesFixture;

/** The fixture is JSON, which cannot hold undefined: compare both sides through the same round trip. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');
const clone = <T>(value: T): T => structuredClone(value);

function record(f: TablesFixture): Record<Section, unknown> {
  return {
    tables: plain({ BIOME_SETS, REGIONS, RING_SPECTRUM, ASC_RING_R }),
    regionAt: f.regionAt.map(({ x, y }) => ({ x, y, region: regionAt(x, y) })),
    gradeCapAt: f.gradeCapAt.map(({ where }) => ({ where, cap: gradeCapAt(clone(where)) })),
    ringGrade: f.ringGrade.map(({ genome, grade, where }) => ({ genome, grade, where, graded: plain(ringGrade(clone(genome), clone(grade), clone(where))) })),
    biomeFor: {
      seeds: f.biomeFor.seeds,
      rows: f.biomeFor.rows.map(({ type, band }) => ({
        type, band, keys: f.biomeFor.seeds.map((seed) => (biomeFor({ seed, type }, band)?.k as string | undefined) ?? null),
      })),
    },
    encode: f.encode.map(({ w, name }) => {
      const code = encodeWhere(clone(w), name);
      return { w, ...(name === undefined ? {} : { name }), code, decoded: plain(decodeWhere(code)) };
    }),
    decode: f.decode.map(({ code }) => ({ code, decoded: plain(decodeWhere(code)) })),
  };
}

const actual = record(fixture);

describe('@cf/domain-strays — tables, regions, grade caps, biomes and where codes pinned against the current game', () => {
  it('has the recorded inputs, reaching every region, every cap and every where flag', () => {
    expect(Object.keys(fixture.freeGlobals)).toEqual(['none']);
    expect([fixture.regionAt.length, fixture.gradeCapAt.length, fixture.ringGrade.length, fixture.biomeFor.rows.length, fixture.encode.length, fixture.decode.length])
      .toEqual([3367, 259, 240, 45, 24, 68]);
    expect(new Set(fixture.regionAt.map((row) => row.region))).toEqual(new Set([0, 1, 2, 3, 4, 5]));
    expect(new Set(fixture.gradeCapAt.map((row) => row.cap))).toEqual(new Set([5, 8, 9, 10, 11, 14]));
    expect(new Set(fixture.encode.map(({ w }) => [w.gal!.home, w.gal!.quasar, w.gal!.dwarf].join()))).toHaveProperty('size', 8);
  });
  it('BIOME_SETS, REGIONS, RING_SPECTRUM and ASC_RING_R are as in the current game', () => {
    expect(actual.tables).toEqual(fixture.tables);
  });
  it('regionAt gives the recorded region along six rays and over a grid out to 21 cells', () => {
    expect(actual.regionAt).toEqual(fixture.regionAt);
  });
  it('gradeCapAt gives the recorded cap at home, near Sol, across the regions and for unreadable places', () => {
    expect(actual.gradeCapAt).toEqual(fixture.gradeCapAt);
  });
  it('ringGrade gives the recorded grade for every tier at every cap, crowned and cradle genomes included', () => {
    expect(actual.ringGrade).toEqual(fixture.ringGrade);
  });
  it('biomeFor gives the recorded biome for every world type and band', () => {
    expect(actual.biomeFor).toEqual(fixture.biomeFor);
  });
  it('encodeWhere gives the recorded code and decodeWhere reads it back as recorded', () => {
    expect(actual.encode).toEqual(fixture.encode);
  });
  it('decodeWhere clamps, refuses and cleans hand-built codes as recorded', () => {
    expect(actual.decode).toEqual(fixture.decode);
  });
  it('notices one changed recorded value in each section (negative control)', () => {
    const changes: Array<[Section, (f: TablesFixture) => void]> = [
      ['tables', (f) => { ((f.tables.REGIONS as Array<{ r: number }>)[1]!).r += 1; }],
      ['regionAt', (f) => { f.regionAt[100]!.region += 1; }],
      ['gradeCapAt', (f) => { f.gradeCapAt[10]!.cap -= 1; }],
      ['ringGrade', (f) => { (f.ringGrade[3]!.graded as { tier: number }).tier += 1; }],
      ['biomeFor', (f) => { f.biomeFor.rows[0]!.keys[5] = 'Changed'; }],
      ['encode', (f) => { f.encode[0]!.code += 'A'; }],
      ['decode', (f) => { (f.decode[20]!.decoded as { where: { gal: { rot: number } } }).where.gal.rot = -6; }],
    ];
    for (const [section, change] of changes) {
      const mutated = clone(fixture);
      change(mutated);
      expect(actual[section], section).toEqual(fixture[section]);
      expect(actual[section], section).not.toEqual(mutated[section]);
    }
  });
});
