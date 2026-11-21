import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { describePickWithState, installCaptureHooks, type DescriptorNavigationState, type DescriptorPick } from '@cf/domain-descriptors';

/* fixtures/current/descriptors-misc.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the descriptors-misc recorder), through describePickWithState with the
   hooks installed the way the game installs them. Each row holds the pick, the navigation state, the
   custom names the lookup answers from and, for a planet pick, the epoch the recorder set as the
   COSMIC_EPOCH global. This file makes the same calls in the same order and records the same lookups,
   passing the epoch as an argument instead: the recorded epoch for a planet pick, and for every other
   pick an epoch the recorder never set (OTHER_EPOCH), since no other card reads it. */
interface Input {
  pick: DescriptorPick;
  nav: DescriptorNavigationState;
  names?: Record<string, string | null>;
  epoch?: number;
}
interface Row { input: Input; output: unknown; lookups: string[] }
const SECTIONS = ['quasar', 'radio', 'comet', 'deco', 'dwarf', 'snova', 'protostar', 'routing', 'customNames', 'nullCards'] as const;
type Section = typeof SECTIONS[number];
interface MiscFixture { freeGlobals: Record<string, string>; sections: Record<Section, Row[]> }

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/descriptors-misc.json', import.meta.url), 'utf8'),
) as MiscFixture;

/** The fixture is JSON, which cannot hold undefined: compare both sides through the same round trip. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');
const OTHER_EPOCH = 7;

function run(input: Input): Omit<Row, 'input'> {
  const lookups: string[] = [];
  const lookup = (key: string): string | null | undefined => { lookups.push(key); return input.names?.[key]; };
  const card = describePickWithState(input.pick, input.nav, lookup, input.epoch ?? OTHER_EPOCH);
  return { output: plain(card ?? null), lookups };
}

let actual = {} as Record<Section, Row[]>;
beforeAll(() => {
  installCaptureHooks();
  for (const s of Object.keys(fixture.sections) as Section[]) {
    actual[s] = fixture.sections[s].map(({ input }) => ({ input, ...run(structuredClone(input)) }));
  }
});

const kinds = (rows: Row[]): string[] => [...new Set(rows.map(({ input }) => input.pick.kind))];

describe('@cf/domain-descriptors — describePickWithState pinned against the current game', () => {
  it('has the recorded sections, every pick kind the router routes, and no ambient epoch or st', () => {
    expect(Object.keys(fixture.sections)).toEqual(SECTIONS);
    expect(SECTIONS.map((s) => fixture.sections[s].length)).toEqual([8, 5, 6, 17, 7, 11, 10, 15, 10, 15]);
    expect(kinds(fixture.sections.routing)).toEqual(['galaxy', 'star', 'starsys', 'planet', 'moon', 'belt', 'worm', 'kuiper', 'oort', 'visitor', 'cmb']);
    expect(fixture.sections.nullCards.every(({ output }) => output === null)).toBe(true);
    expect(Object.keys(fixture.freeGlobals)).toEqual(['installCaptureHooks', 'COSMIC_EPOCH', 'st', 'customNames']);
    expect(SECTIONS.flatMap((s) => fixture.sections[s]).filter(({ input }) => input.epoch !== undefined)
      .every(({ input }) => input.pick.kind === 'planet' && input.epoch !== OTHER_EPOCH)).toBe(true);
    expect('COSMIC_EPOCH' in globalThis).toBe(false);
    expect('st' in globalThis).toBe(false);
  });
  it('quasar: a pick with no galaxy is pinned (no thumb, logId q, no name key, no lookup)', () => {
    const noGalaxy = fixture.sections.quasar.filter(({ input }) => input.pick.data === null);
    expect(noGalaxy.length).toBe(2);
    expect(noGalaxy.some(({ input }) => input.names !== undefined)).toBe(true);
    for (const row of noGalaxy) {
      expect(row.output).toMatchObject({ title: 'Quasar', thumb: null, logId: 'q', where: { type: 'galaxy', gal: null }, _nameKey: null });
      expect(row.lookups).toEqual([]);
    }
  });
  for (const s of SECTIONS) {
    it(`${s}: the recorded cards and lookups`, () => {
      expect(actual[s]).toEqual(fixture.sections[s]);
    });
  }
  it('notices one changed recorded value in each section (negative control)', () => {
    type Card = { title: string; sub: string; rows: string[][]; where: { type: string } | null; _nameKey?: string | null };
    const card = (row: Row): Card => row.output as Card;
    const changes: Record<Section, (rows: Row[]) => void> = {
      quasar: (rows) => { card(rows[0]!).title = 'Quasar'; },
      radio: (rows) => { card(rows[1]!).rows[0]![1] = 'Changed'; },
      comet: (rows) => { card(rows[2]!).sub = 'Long-period comet?'; },
      deco: (rows) => { card(rows[3]!).where = { type: 'star' }; },
      dwarf: (rows) => { card(rows[0]!)._nameKey = 's1'; },
      snova: (rows) => { card(rows[9]!).rows[1]![1] = 'At its heart, a remnant'; },
      protostar: (rows) => { rows[0]!.lookups = []; },
      routing: (rows) => { card(rows[5]!).rows.pop(); },
      customNames: (rows) => { card(rows[4]!).title = 'named'; },
      nullCards: (rows) => { rows[0]!.output = {}; },
    };
    for (const s of SECTIONS) {
      const mutated = structuredClone(fixture.sections[s]);
      changes[s](mutated);
      expect(actual[s], s).toEqual(fixture.sections[s]);
      expect(actual[s], s).not.toEqual(mutated);
    }
  });
});
