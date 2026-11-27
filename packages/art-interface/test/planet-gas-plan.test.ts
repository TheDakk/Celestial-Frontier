import { describe, expect, it } from 'vitest';
import { gasPlan, kitTable, parsePlanetKit, type GasPlan, type PlanetKit } from '../src/index';
import { gasTablesText, recordedPlans, testGasKitText } from './planet-kit-support';

const TEST = parsePlanetKit(testGasKitText());
const REAL = parsePlanetKit(gasTablesText());
const stack = (plan: GasPlan): string => plan.ribbons.map((r) => `${r.name}${r.variant}:${r.depth}:${r.phase}:${r.mirror ? 'm' : ''}`).join(' ');

/** The kit's sequence of draws, worked a second way (in whole numbers of any size) to stand apart from the code's. */
function reference(seed: number): (limit: number) => number {
  let state = BigInt(seed >>> 0);
  const M = 0xffffffffn;
  return (limit) => {
    state = (state + 0x9e3779b9n) & M;
    let z = state;
    z = ((z ^ (z >> 16n)) * 0x21f0aaadn) & M;
    z = ((z ^ (z >> 15n)) * 0x735a2d97n) & M;
    return Number(((z ^ (z >> 15n)) * BigInt(limit)) >> 32n);
  };
}
/** A fraction of whole numbers of any size, its lower part above 0: nothing is rounded until the last step. */
type Fraction = readonly [bigint, bigint];
const F = (n: number | bigint, d: number | bigint = 1): Fraction => [BigInt(n), BigInt(d)];
const add = (a: Fraction, b: Fraction): Fraction => [a[0] * b[1] + b[0] * a[1], a[1] * b[1]];
const sub = (a: Fraction, b: Fraction): Fraction => [a[0] * b[1] - b[0] * a[1], a[1] * b[1]];
const mul = (a: Fraction, b: Fraction): Fraction => [a[0] * b[0], a[1] * b[1]];
const div = (a: Fraction, b: Fraction): Fraction => (b[0] < 0n ? [-a[0] * b[1], -a[1] * b[0]] : [a[0] * b[1], a[1] * b[0]]);
const less = (a: Fraction, b: Fraction): boolean => a[0] * b[1] < b[0] * a[1];
const same = (a: Fraction, b: Fraction): boolean => a[0] * b[1] === b[0] * a[1];
const floored = (a: Fraction): bigint => (a[0] >= 0n ? a[0] / a[1] : -((-a[0] + a[1] - 1n) / a[1]));
/** The part of a fraction past its whole part: a hue brought into one turn. */
const turned = (a: Fraction): Fraction => sub(a, F(floored(a)));
/** A fraction to the nearest whole number, a half to the even one. */
const even = (a: Fraction): number => {
  const whole = floored(a);
  const twice = 2n * (a[0] - whole * a[1]);
  return Number(twice > a[1] || (twice === a[1] && (whole & 1n) === 1n) ? whole + 1n : whole);
};
const most = (...all: Fraction[]): Fraction => all.reduce((a, b) => (less(a, b) ? b : a));
const least = (...all: Fraction[]): Fraction => all.reduce((a, b) => (less(b, a) ? b : a));

/** The kit's colour rule as the kit states it, step for step, in exact fractions: mix, to hue, lightness and
 *  saturation (as its language's own library does it), tint, and back, each channel to the nearest byte. */
function fractionSwatches(kit: PlanetKit, seed: number): { family: string; swatches: number[] } {
  const families = [...kitTable(kit, 'families')];
  const key = seed >>> 0;
  const shuffle = reference(Math.floor(key / families.length) ^ 0x57696e64);
  for (let i = families.length - 1; i > 0; i--) { const j = shuffle(i + 1); [families[i], families[j]] = [families[j]!, families[i]!]; }
  const family = families[key % families.length]!;
  const blend = F(reference(key ^ 0xa1b2c3d4)(101), 100);
  const d = reference(key);
  const spread = Number(kitTable(kit, 'spreads')[kitTable(kit, 'families').indexOf(family)]);
  const tint = d(2 * spread + 1) - spread;
  const accent = d(81) - 40;
  const chroma = F(76 + d(57), 100);
  const exposure = F(d(11) - 5, 100);
  const [ONE, HALF, SIXTH, TWO_THIRDS] = [F(1), F(1, 2), F(1, 6), F(2, 3)];
  const v = (m1: Fraction, m2: Fraction, at: Fraction): Fraction => {
    const hue = turned(at);
    if (less(hue, SIXTH)) return add(m1, mul(mul(sub(m2, m1), hue), F(6)));
    if (less(hue, HALF)) return m2;
    if (less(hue, TWO_THIRDS)) return add(m1, mul(mul(sub(m2, m1), sub(TWO_THIRDS, hue)), F(6)));
    return m1;
  };
  const swatches: number[] = [];
  const [skies, mineral] = [kitTable(kit, `skies/${family}`), kitTable(kit, `mineral/${family}`)];
  for (let i = 0; i < 16; i++) {
    const angle = [F(0), F(-accent, 4), F(accent), F(accent, 2)][i >> 2]!;
    const [r, g, b] = [0, 2, 4].map((at) => { const [p, q] = [parseInt(skies[i]!.slice(at, at + 2), 16), parseInt(mineral[i]!.slice(at, at + 2), 16)]; return div(add(F(p), mul(F(q - p), blend)), F(255)); }) as [Fraction, Fraction, Fraction];
    const [maxc, minc] = [most(r, g, b), least(r, g, b)];
    const [sumc, rangec] = [add(maxc, minc), sub(maxc, minc)];
    const l = div(sumc, F(2));
    let [h, s] = [F(0), F(0)];
    if (!same(minc, maxc)) {
      s = less(HALF, l) ? div(rangec, sub(sub(F(2), maxc), minc)) : div(rangec, sumc);
      const [rc, gc, bc] = [div(sub(maxc, r), rangec), div(sub(maxc, g), rangec), div(sub(maxc, b), rangec)];
      h = same(r, maxc) ? sub(bc, gc) : same(g, maxc) ? sub(add(F(2), rc), bc) : sub(add(F(4), gc), rc);
      h = turned(div(h, F(6)));
    }
    const hue = turned(add(h, div(add(F(tint), angle), F(360))));
    const light = least(F(985, 1000), most(F(6, 100), add(l, exposure)));
    const sat = least(F(9, 10), mul(s, chroma));
    let rgb = [light, light, light];
    if (sat[0] !== 0n) {
      const m2 = less(HALF, light) ? sub(add(light, sat), mul(light, sat)) : mul(light, add(ONE, sat));
      const m1 = sub(mul(F(2), light), m2);
      rgb = [v(m1, m2, add(hue, F(1, 3))), v(m1, m2, hue), v(m1, m2, sub(hue, F(1, 3)))];
    }
    swatches.push((even(mul(F(255), rgb[0]!)) << 16) | (even(mul(F(255), rgb[1]!)) << 8) | even(mul(F(255), rgb[2]!)));
  }
  return { family, swatches };
}

describe('a gas giant\'s plan', () => {
  it('is the same for the same seed, differs between seeds, and reads its seed as 32 bits', () => {
    expect(gasPlan(22, TEST)).toEqual(gasPlan(22, TEST));
    expect(gasPlan(22, TEST)).not.toEqual(gasPlan(23, TEST));
    expect(gasPlan(22 + 4294967296, TEST)).toEqual(gasPlan(22, TEST));
    expect(gasPlan(-1, TEST)).toEqual(gasPlan(4294967295, TEST));
    expect(() => gasPlan(1, parsePlanetKit('kit 1 terran'))).toThrow(/from a gas kit, not a terran kit/);
    expect(() => gasPlan(1, parsePlanetKit('kit 1 gas\ntable families a b'))).toThrow(/no table "bright"/);
  });
  it('fills the 32 latitude cells exactly: a cap at each pole, light and deep bands in turn between, each two cells or more', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const { ribbons, profile } = gasPlan(seed, TEST);
      expect(ribbons[0]).toMatchObject({ name: 'north', kind: 'cap', top: 0 });
      expect(ribbons[ribbons.length - 1]).toMatchObject({ name: 'south', kind: 'cap' });
      let top = 0;
      for (const ribbon of ribbons) {
        expect(ribbon.top).toBe(top);
        expect(ribbon.depth).toBeGreaterThanOrEqual(2);
        top += ribbon.depth;
      }
      expect(top).toBe(32);
      const inner = ribbons.slice(1, -1);
      for (let i = 1; i < inner.length; i++) expect(inner[i]!.kind).not.toBe(inner[i - 1]!.kind);
      for (const ribbon of inner) {
        expect(ribbon.kind === 'cap').toBe(false);
        expect(ribbon.depth).toBeLessThanOrEqual(profile === 'broad' ? 12 : 10);
        expect([1, 2]).toContain(ribbon.variant);
        expect(ribbon.phase).toBeGreaterThanOrEqual(0);
        expect(ribbon.phase).toBeLessThan(384);
      }
    }
  });
  it('names every band from its kit\'s lists: a light band of six cells or more is the wide zone unless it is ice, a deep one of five or more the wide belt on a world that is not wild', () => {
    const [bright, belt, active] = [kitTable(TEST, 'bright'), kitTable(TEST, 'belt'), kitTable(TEST, 'active')];
    const met = new Set<string>();
    for (let seed = 0; seed < 2000; seed++) {
      const plan = gasPlan(seed, TEST);
      for (const ribbon of plan.ribbons.slice(1, -1)) {
        met.add(ribbon.name);
        if (ribbon.kind === 'light') {
          expect([...bright, 'silk']).toContain(ribbon.name);
          if (ribbon.depth >= 6) expect(['silk', 'ice']).toContain(ribbon.name);
          else expect(ribbon.name).not.toBe('silk');
        } else {
          expect([...belt, ...active, 'underflow']).toContain(ribbon.name);
          if (ribbon.depth >= 5 && plan.profile !== 'wild') expect(ribbon.name).toBe('underflow');
        }
      }
    }
    expect([...met].sort()).toEqual([...new Set([...bright, ...belt, ...active, 'silk', 'underflow'])].sort());
  });
  it('gives every colour family once in each aligned block of as many seeds as the kit has families', () => {
    for (const [kit, size] of [[TEST, 3], [REAL, 6]] as const) {
      for (const first of [0, size * 77, size * 357913941, 4294967296 - size * (size === 3 ? 1 : 3) - (4294967296 % size)]) {
        const met = Array.from({ length: size }, (_, i) => gasPlan(first + i, kit).family);
        expect([...met].sort()).toEqual([...kitTable(kit, 'families')].sort());
      }
    }
  });
  it('100 consecutive seeds give at least 90 different stacks', () => {
    const stacks = new Set(Array.from({ length: 100 }, (_, i) => stack(gasPlan(i + 1, TEST))));
    expect(stacks.size).toBeGreaterThanOrEqual(90);
    // The same count with every band's shift and mirror left out: the variety is in the bands, not only where they start.
    const bare = new Set(Array.from({ length: 100 }, (_, i) => gasPlan(i + 1, TEST).ribbons.map((r) => `${r.name}:${r.depth}`).join(' ')));
    expect(bare.size).toBeGreaterThanOrEqual(90);
  });
  it('bends one or two deep belts with a wind, and on a wild world every deep belt and the whole globe', () => {
    const profiles = new Map<string, number>();
    for (let seed = 0; seed < 2000; seed++) {
      const plan = gasPlan(seed, TEST);
      profiles.set(plan.profile, (profiles.get(plan.profile) ?? 0) + 1);
      const deep = plan.ribbons.filter((ribbon) => ribbon.kind === 'deep');
      if (plan.profile === 'wild') {
        expect(plan.winds.length).toBe(deep.length + 1);
        expect(plan.winds[plan.winds.length - 1]).toMatchObject({ centre: 64, radius: 96 });
      } else {
        expect(plan.winds.length).toBeGreaterThanOrEqual(1);
        expect(plan.winds.length).toBeLessThanOrEqual(Math.min(2, deep.length));
      }
      const belts = plan.profile === 'wild' ? plan.winds.slice(0, -1) : plan.winds;
      for (const wind of belts) expect(deep.some((ribbon) => wind.centre === 4 * ribbon.top + 2 * ribbon.depth && wind.radius === 15 + 2 * ribbon.depth)).toBe(true);
      for (const wind of plan.winds) {
        expect(wind.frequency).toBeGreaterThanOrEqual(1);
        expect(wind.amplitude).toBeGreaterThanOrEqual(3);
        expect(wind.amplitude).toBeLessThanOrEqual(11);
      }
    }
    // Nine equal draws: four quiet, two fine, two broad, one wild.
    expect(profiles.get('quiet')! / 2000).toBeGreaterThan(0.38);
    expect(profiles.get('wild')! / 2000).toBeGreaterThan(0.08);
    expect(profiles.get('wild')! / 2000).toBeLessThan(0.15);
  });
  it('lays one to five kinds of weather, no kind twice, each on a band of its own sort, and never a great spot', () => {
    const deepHosts = new Set(kitTable(TEST, 'deep-hosts'));
    const kinds = [...kitTable(TEST, 'weather'), ...kitTable(TEST, 'rare')];
    for (let seed = 0; seed < 2000; seed++) {
      const plan = gasPlan(seed, TEST);
      expect(plan.events.length).toBeGreaterThanOrEqual(1);
      expect(plan.events.length).toBeLessThanOrEqual(5);
      expect(new Set(plan.events.map((event) => event.kind)).size).toBe(plan.events.length);
      for (const event of plan.events) {
        expect(kinds).toContain(event.kind);
        expect(event.kind).not.toContain('spot');
        const hosts = plan.ribbons.filter((ribbon) => ribbon.kind === (deepHosts.has(event.kind) ? 'deep' : 'light'));
        expect(hosts.some((ribbon) => event.latitude === 4 * ribbon.top + 2 * ribbon.depth)).toBe(true);
        expect(event.longitude).toBeGreaterThanOrEqual(0);
        expect(event.longitude).toBeLessThan(384);
        expect(event.width).toBeGreaterThanOrEqual(94);
        expect(event.height).toBeGreaterThanOrEqual(100);
      }
      // After a hood, which is seen through the whole turn, the others share the turn evenly among themselves.
      if (plan.events[0]!.kind === 'polar-hood' && plan.events.length > 2) {
        const [a, b] = [plan.events[1]!.longitude, plan.events[2]!.longitude];
        expect((b - a + 384) % 384).toBe(Math.floor(384 / (plan.events.length - 1)));
      }
    }
  });
  it('opens with a rare kind on one seed in twenty, each of the two once in every aligned block of forty seeds', () => {
    const rare = kitTable(TEST, 'rare');
    for (const first of [0, 40, 4000, 400000, 2147483680, 3000000000, 4294967240]) {
      const met = Array.from({ length: 40 }, (_, i) => gasPlan(first + i, TEST)).flatMap((plan) => plan.events.filter((event) => rare.includes(event.kind)).map((event) => `${event.kind} ${plan.events.indexOf(event)}`));
      expect(met.sort()).toEqual(rare.map((kind) => `${kind} 0`).sort());
    }
  });
  it('colours each world by the kit\'s rule: sixteen swatches of the seed\'s family, each equal to the rule worked step for step in exact fractions', () => {
    for (const kit of [TEST, REAL]) {
      const met = new Set<string>();
      for (let seed = 0; seed < 2500; seed++) {
        const plan = gasPlan(seed, kit);
        const want = fractionSwatches(kit, seed);
        expect(plan.family).toBe(want.family);
        expect(plan.swatches).toEqual(want.swatches);
        met.add(plan.swatches.join());
      }
      expect(met.size).toBeGreaterThan(2480);
    }
  });
  it('a channel that falls exactly half way between two bytes goes to the even one, as the kit\'s rule says', () => {
    // The three swatches among seeds 0 to 2,999 of the kit's tables where a half meets an odd byte below or above:
    // 146 and a half, 124 and a half, 119 and a half. (The kit's own arithmetic, in binary fractions, gives 147, 125, 119.)
    const channel = (seed: number, ink: number, shift: number): number => (gasPlan(seed, REAL).swatches[ink - 1]! >> shift) & 255;
    expect(gasPlan(295, REAL).swatches[2]!.toString(16)).toBe('4392ae');
    expect(gasPlan(1774, REAL).swatches[15]!.toString(16)).toBe('75597c');
    expect(gasPlan(2419, REAL).swatches[15]!.toString(16)).toBe('585f78');
    expect([channel(295, 3, 8), channel(1774, 16, 0), channel(2419, 16, 0)]).toEqual([146, 124, 120]);
  });
  it('is the artist\'s own plan, seed for seed: the kit\'s generator recorded on 31 seeds, among them a wild world, six hoods and four rare openings, three of those past 2^31', () => {
    const plans = recordedPlans();
    const source = (name: string, variant: number, small: boolean): string => {
      const own = REAL.tables.get(`ribbon/${name}`);
      const [study, piece] = (own !== undefined ? own[small ? 2 : 0]! : `discovery/${name}-${variant}`).split('/');
      return `${study}/wrap${small ? 192 : 384}/${piece}.txt${small ? `/${own !== undefined ? own[3] : 64}` : ''}`;
    };
    expect(Object.keys(plans).length).toBe(31);
    const rare = Object.entries(plans).filter(([, plan]) => ['breaking-comb', 'banner-front'].includes((plan['storms'] as { name: string }[])[0]!.name)).map(([seed]) => Number(seed));
    expect(rare.filter((seed) => seed > 2147483648).length).toBe(3);
    expect(rare.length).toBe(4);
    for (const [seed, want] of Object.entries(plans)) {
      const plan = gasPlan(Number(seed), REAL);
      const mine = {
        family: plan.family, profile: plan.profile,
        ramps: plan.swatches.map((rgb) => rgb.toString(16).padStart(6, '0')),
        winds: plan.winds.map((wind) => ({ center: wind.centre, radius: wind.radius, freq: wind.frequency, amp: wind.amplitude, phase: wind.phase })),
        ribbons: plan.ribbons.map((r) => ({ source: source(r.name, r.variant, false), nominal: Number(REAL.tables.get(`ribbon/${r.name}`)?.[1] ?? 32), top: r.top, depth: r.depth, shift: r.phase, mirror: r.mirror })),
        small: plan.ribbons.map((r) => source(r.name, r.variant, true)),
        storms: plan.events.map((e) => ({ name: e.kind, x: e.longitude, y: e.latitude, sx: e.width, sy: e.height, mirror: e.mirror, source: `${kitTable(REAL, `event/${e.kind}`)[0]!.replace('/', '/wrap384/')}.txt` })),
      };
      expect(mine).toEqual(want);
    }
  });
});
