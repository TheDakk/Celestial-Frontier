import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  describePickWithState,
  type DescriptorNavigationState,
  type DescriptorPick,
} from '@cf/domain-descriptors';

/* The rules of the card router, checked over the picks of fixtures/current/descriptors-misc.json
   (recorded from the current game). recorded-misc.test.ts pins every recorded card byte for byte;
   this file states what each part of a card must be, so a broken rule is named when it fails. */
interface Input { pick: DescriptorPick; nav: DescriptorNavigationState; names?: Record<string, string | null>; epoch?: number }
interface Row { input: Input; output: Card | null; lookups: string[] }
interface Card {
  title: string; sub: string; logId: string;
  where: { type: string; gal: { seed: number } | null; star?: { seed: number }; pseed?: number } | null;
  _nameKey?: string | null; _origTitle?: string;
}
type Raw = Record<string, unknown>;
const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/descriptors-misc.json', import.meta.url), 'utf8'),
) as { sections: Record<string, Row[]> };
const rows = (...sections: string[]): Row[] => sections.flatMap((s) => fixture.sections[s]!);
const CARD_ROWS = rows('quasar', 'radio', 'comet', 'deco', 'dwarf', 'snova', 'protostar', 'routing');
/** The card rows plus the custom-name rows, which add a galaxy-bound card with no current galaxy. */
const WHERE_ROWS = [...CARD_ROWS, ...rows('customNames')];
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');
const KEY = 'COSMIC_EPOCH';

/** A lookup that records the keys it is asked for. */
function lookupFrom(names: Record<string, string | null> = {}): { asked: string[]; lookup: (key: string) => string | null | undefined } {
  const asked: string[] = [];
  return { asked, lookup: (key) => { asked.push(key); return names[key]; } };
}
const card = (input: Input, epoch = input.epoch ?? 0): Card | null =>
  plain(describePickWithState(structuredClone(input.pick), structuredClone(input.nav), lookupFrom(input.names).lookup, epoch)) as Card | null;

afterEach(() => { Reflect.deleteProperty(globalThis, KEY); });

/** Where each kind's card points: the picked galaxy, the current galaxy, the current star or the picked planet. */
const WHERE: Record<string, string | null> = {
  galaxy: 'picked galaxy', quasar: 'picked galaxy', radio: 'picked galaxy',
  deco: 'current galaxy', snova: 'current galaxy', protostar: 'current galaxy', cmb: 'home galaxy',
  star: 'picked star', starsys: 'current star', comet: 'current star', belt: 'current star', dwarf: 'current star',
  kuiper: 'current star', oort: 'current star', visitor: 'current star',
  planet: 'picked planet', moon: "moon's planet", worm: null,
};
/** The logId prefix of each kind's card: which composer answered. A quasar card with no galaxy is logged as 'q'. */
const LOG_ID: Record<string, RegExp> = {
  galaxy: /^g\d/, quasar: /^q(\d|$)/, radio: /^r\d/, deco: /^d[a-z0-9]+_/, snova: /^sn\d/, protostar: /^ps\d/, cmb: /^cmb$/,
  star: /^s\d/, starsys: /^s\d/, comet: /^c\d/, belt: /^b\d/, dwarf: /^dw\d/, kuiper: /^k\d/, oort: /^o\d/, visitor: /^v\d/,
  planet: /^p\d/, moon: /^m\d/, worm: /^wh$/,
};

type Where = { type: string; gal: number | null; star?: number | undefined; pseed?: number | undefined } | null;
function expectedWhere(input: Input): Where {
  const data = input.pick.data as Raw;
  const galOf = (g: unknown): number | null => (g ? (g as { seed: number }).seed : null);
  const navStar = input.nav.star?.seed;
  switch (WHERE[input.pick.kind]) {
    case 'picked galaxy': return { type: 'galaxy', gal: galOf(data) };
    case 'current galaxy': return { type: 'galaxy', gal: galOf(input.nav.gal) };
    case 'home galaxy': return { type: 'galaxy', gal: 999 };
    case 'picked star': return { type: 'star', gal: galOf(input.nav.gal), star: (data as { seed: number }).seed };
    case 'current star': return { type: 'star', gal: galOf(input.nav.gal), star: navStar };
    case 'picked planet': return { type: 'planet', gal: galOf(input.nav.gal), star: navStar, pseed: (data.P as { seed: number }).seed };
    case "moon's planet": return { type: 'planet', gal: galOf(input.nav.gal), star: navStar, pseed: ((data.pl as Raw).P as { seed: number }).seed };
    default: return null;
  }
}
const whereOf = (c: Card): Where => c.where && {
  type: c.where.type, gal: c.where.gal?.seed ?? null,
  ...(c.where.star ? { star: c.where.star.seed } : {}), ...(c.where.pseed !== undefined ? { pseed: c.where.pseed } : {}),
};

describe('@cf/domain-descriptors — describePickWithState', () => {
  it('routes every pick kind to its own composer', () => {
    expect(new Set(CARD_ROWS.map(({ input }) => input.pick.kind))).toEqual(new Set(Object.keys(LOG_ID)));
    const wrong = CARD_ROWS.filter(({ input }) => !LOG_ID[input.pick.kind]!.test(card(input)!.logId));
    expect(wrong.map(({ input }) => input.pick.kind)).toEqual([]);
  });

  it("points each card's where at the right galaxy, star or planet", () => {
    const wrong = WHERE_ROWS.filter(({ input }) => JSON.stringify(whereOf(card(input)!)) !== JSON.stringify(expectedWhere(input)));
    expect(wrong.map(({ input }) => input.pick.kind)).toEqual([]);
  });

  it('keys each card by its planet, else its star, else its galaxy, and a card with no where has no key', () => {
    const expectedKey = (w: Where): string | null | undefined =>
      !w ? undefined : w.type === 'planet' ? `p${w.pseed}` : w.type === 'star' ? `s${w.star}` : w.gal === null ? null : `g${w.gal}`;
    const wrong = WHERE_ROWS.filter(({ input }) => card(input)!._nameKey !== expectedKey(expectedWhere(input)));
    expect(wrong.map(({ input }) => input.pick.kind)).toEqual([]);
    expect(WHERE_ROWS.some(({ input }) => card(input)!._nameKey === null)).toBe(true);
  });

  it('a custom name replaces the title, keeps the old one, and marks the sub; null, undefined and no key do not', () => {
    const [galaxy, , , , dwarf, keptByNull, noKey, , , worm] = fixture.sections.customNames!;
    const ask = (row: Row): { c: Card; asked: string[] } => {
      const { asked, lookup } = lookupFrom(row.input.names);
      const c = plain(describePickWithState(structuredClone(row.input.pick), row.input.nav, lookup, 0)) as Card;
      return { c, asked };
    };
    const named = ask(galaxy!);
    const unnamed = card({ ...galaxy!.input, names: {} })!;
    expect(named.asked).toEqual([unnamed._nameKey]);
    expect(named.c).toEqual({ ...unnamed, title: 'Bright Harbour', _origTitle: unnamed.title, sub: `${unnamed.sub} · named by you` });
    expect(ask(dwarf!).c.title).toBe('');
    for (const row of [keptByNull!, noKey!, worm!]) {
      const { c, asked } = ask(row);
      expect(c).toEqual(card({ ...row.input, names: {} }));
      expect(c._origTitle).toBeUndefined();
      expect(asked).toEqual(row === keptByNull ? ['g999'] : []);
    }
  });

  it('gives a null card, and asks no name, for a star-bound pick with no usable current star or a planet pick without its planet', () => {
    expect(fixture.sections.nullCards!).toHaveLength(15);
    for (const { input } of fixture.sections.nullCards!) {
      const { asked, lookup } = lookupFrom({ g999: 'x', s424242: 'x' });
      expect(describePickWithState(structuredClone(input.pick), input.nav, lookup, 0), input.pick.kind).toBeNull();
      expect(asked).toEqual([]);
    }
    const sol = fixture.sections.routing!.find(({ input }) => input.pick.kind === 'starsys')!.input;
    for (const kind of ['starsys', 'comet', 'belt', 'dwarf', 'kuiper', 'oort', 'visitor', 'planet', 'moon']) {
      const row = rows('routing', 'comet', 'dwarf').find(({ input }) => input.pick.kind === kind)!;
      expect(card(row.input), kind).not.toBeNull();
      expect(card({ ...row.input, nav: { ...sol.nav, star: null } }), kind).toBeNull();
    }
  });

  it('two epochs give the two recorded planet cards, and the argument beats an ambient global', () => {
    const planet = (epoch: number): Row => fixture.sections.routing!.find(({ input }) => input.pick.kind === 'planet' && input.epoch === epoch)!;
    const [at0, at12] = [planet(0), planet(12)];
    expect(at0.output).not.toEqual(at12.output);
    (globalThis as Raw)[KEY] = 12;
    expect(card(at0.input, 0)).toEqual(at0.output);
    expect((globalThis as Raw)[KEY]).toBe(12);
    (globalThis as Raw)[KEY] = 0;
    expect(card(at12.input, 12)).toEqual(at12.output);
    expect((globalThis as Raw)[KEY]).toBe(0);
  });

  it('no card but the planet card reads the epoch', () => {
    const others = CARD_ROWS.filter(({ input }) => input.pick.kind !== 'planet');
    const changed = others.filter(({ input }) => JSON.stringify(card(input, 0)) !== JSON.stringify(card(input, 10_000)));
    expect(changed.map(({ input }) => input.pick.kind)).toEqual([]);
  });

  it('rejects an epoch outside 0..10000 or not an integer, for any pick', () => {
    const cmb = fixture.sections.routing!.find(({ input }) => input.pick.kind === 'cmb')!.input;
    for (const bad of [-1, 10_001, 1.5, Number.NaN, '3', undefined]) {
      expect(() => describePickWithState(cmb.pick, cmb.nav, () => undefined, bad as never), String(bad))
        .toThrow('ecology epoch must be an integer from 0 through 10000');
    }
  });
});
