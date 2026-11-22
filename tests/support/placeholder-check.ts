/* The checker on the placeholder pack, shared by the tests/check-pack-placeholder*.test.ts files. The whole pack's
   sampling is split into scaffold groups, each run in its own file, so the files run side by side; together they sample
   every scaffold once (tests/check-pack-placeholder.test.ts holds the groups to that). */
import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import { checkPack, formatReport, type PackReport } from '../../tools/check-pack.mjs';

export const PLACEHOLDER_TEXT = readFileSync(new URL('../../packages/art-testparts/src/quadruped.txt', import.meta.url), 'utf8');

/** The text with one exact piece replaced; fails the test if the piece is not there exactly once. */
export function planted(from: string, to: string, base: string): string {
  expect(base.split(from)).toHaveLength(2);
  return base.replace(from, to);
}
export const errorsOf = (report: PackReport): string[] => formatReport(report).split('\n').filter((l) => l.startsWith('error:'));
/** The pack text with only the named scaffolds kept; every part and fallback stays. */
export const onlyScaffolds = (text: string, keep: readonly string[]): string =>
  text.split('\n\n').filter((block) => { const m = /^scaffold (\S+)/.exec(block.trimStart()); return m === null || keep.includes(m[1]!); }).join('\n\n');

/**
 * The recipes the placeholder pack samples for one scaffold, by SAMPLED (each composed in the scaffold's 7 poses; a shift
 * is drawn as a label picture, never composed). `first` is the first state: H head kinds x T tail options x L leg counts,
 * plus each head at its E eye counts but eight (drawn already), then per head 7 patterns, 1 translucent and 7 back skins
 * at each of B leg counts, and the shift sweep at each of K leg counts (each head alone, then max(H, R) head and tail
 * pairs, R the tail kinds with a part). A `later` state: max(H, T) head and tail pairs x L leg counts, then for the first
 * head only 7 patterns, 1 translucent and 7 back skins x B, and the same shift sweep.
 */
export const recipes = (s: { H: number; T: number; R: number; L: number; E: number; B: number; K: number }, later = false): number => later
  ? Math.max(s.H, s.T) * s.L + 7 + 1 + 7 * s.B + (s.H + (s.R > 0 ? Math.max(s.H, s.R) : 0)) * s.K
  : s.H * s.T * s.L + s.H * s.E + s.H * (7 + 1 + 7 * s.B) + (s.H + (s.R > 0 ? Math.max(s.H, s.R) : 0)) * s.K;
/**
 * A four-legged body: 10 heads, tails t0 to t6, 6 leg counts, 5 eye counts beside eight; on land, then airborne (sails).
 * The sturdy scaffold also draws 2 and 8 legs differently (legs= entries, near0_2), so B = 2 (8 and 2 legs) and K = 3
 * (no legs, 2, 8). A winged body airborne folds to 2 legs or none (L = 2), and in water has none (L = 1).
 */
const FOUR = { H: 10, T: 7, R: 7, L: 6, E: 5, B: 1, K: 1 };
export const STURDY = recipes({ ...FOUR, B: 2, K: 3 }) + recipes({ ...FOUR, B: 2, K: 3 }, true);
export const PLAIN_FOUR = recipes(FOUR) + recipes(FOUR, true);
export const WINGED = recipes(FOUR) + recipes({ ...FOUR, L: 2 }, true) + recipes({ ...FOUR, L: 1 }, true);
/** A fish and a lobster: 10 heads, no tail or t2 t3 t5 t6, no legs, eye counts; a crab draws no gene eyes (E = 1: eyes gene 0, a key of its own). */
export const FISH = recipes({ H: 10, T: 5, R: 4, L: 1, E: 5, B: 1, K: 1 });
export const CRAB = recipes({ H: 10, T: 5, R: 4, L: 1, E: 1, B: 1, K: 1 });
/** An insect: 10 heads, no tail, six legs always. A tentacled body: no head part, its own tails. The rest: no head, tail or legs. */
export const INSECT = recipes({ H: 10, T: 1, R: 0, L: 1, E: 5, B: 1, K: 1 });
export const TENTACLED = recipes({ H: 1, T: 5, R: 4, L: 1, E: 1, B: 1, K: 1 });
export const BARE = recipes({ H: 1, T: 1, R: 0, L: 1, E: 1, B: 1, K: 1 });

/** The creature poses each scaffold of the placeholder composes (its recipes x 7 poses). */
export function composedOf(scaffoldId: string): number {
  const [family, torso] = scaffoldId.split('/') as [string, string];
  const n = family === 'quadruped' ? (torso === 'sturdy' ? STURDY : torso === 'membranous' || torso === 'fourwinged' ? WINGED : PLAIN_FOUR)
    : family === 'fish' ? FISH : family === 'crustacean' ? (torso === 'crab' ? CRAB : FISH)
      : family === 'insect' ? INSECT : family === 'tentacled' ? TENTACLED : BARE;
  return 7 * n;
}

/** The scaffold groups, each sampled in its own test file (about the same time each: a four-legged scaffold costs most). */
export const GROUPS: Readonly<Record<'a' | 'b' | 'c', readonly string[]>> = {
  a: ['quadruped/sturdy/medium', 'quadruped/stilt/medium', 'quadruped/tusked/medium', 'quadruped/horned/medium'],
  b: ['quadruped/squat/medium', 'quadruped/shelled/medium', 'quadruped/crystalline/medium', 'quadruped/membranous/medium', 'quadruped/fourwinged/medium'],
  c: ['quadruped/spindly/medium',
    'fish/fusiform/medium', 'fish/shark/medium', 'fish/flat/medium', 'fish/angler/medium', 'fish/sturgeon/medium',
    'crustacean/crab/medium', 'crustacean/lobster/medium', 'insect/beetle/medium', 'insect/generic/medium', 'insect/mantis/medium',
    'tentacled/octopus/medium', 'tentacled/squid/medium', 'tentacled/cuttlefish/medium', 'serpent/snake/medium', 'serpent/viper/medium',
    'gelatinous/body/medium', 'radial/anemone/medium', 'radial/urchin/medium', 'radial/coral/medium', 'radial/cucumber/medium'],
};

/**
 * The checker on the whole placeholder pack with only `group` sampled, held to what the one full run asserted for those
 * scaffolds: no error of any kind, no edge, detached or hidden part, no compose failure, no neck warning; its composed
 * count is the group's share; and a translucent creature meets a skin: information gap on every sampled torso frame
 * without a translucent layer (all but the sturdy torso, and no radial: it has no skin).
 */
export function checkGroup(group: readonly string[]): PackReport {
  const r = checkPack(PLACEHOLDER_TEXT, { sample: (id) => group.includes(id) });
  expect(r.parseError).toBeNull();
  expect(r.structure).toEqual([]);
  expect(r.unreachable).toEqual([]);
  expect(r.failures).toEqual([]);
  expect(r.edge).toEqual([]);
  expect(r.detached).toEqual([]);
  expect(r.hidden).toEqual([]);
  expect(r.gaps.filter((g) => g.error)).toEqual([]);
  expect(errorsOf(r)).toEqual([]);
  expect(r.ok).toBe(true);
  expect(r.neck).toEqual([]);
  expect(formatReport(r).split('\n').filter((l) => l.startsWith('warning:'))).toEqual([]);
  expect(r.info).toEqual([]);
  expect(r.composed).toBe(group.reduce((n, id) => n + composedOf(id), 0));
  const skinGaps = r.gaps.filter((g) => g.gap.startsWith('skin:'));
  expect(skinGaps.every((g) => !g.error)).toBe(true);
  const torsos = skinGaps.map((g) => g.gap.replace(/^skin:/, '').replace(/\/medium\/v0:rest$/, '')).sort();
  const expected = group.map((id) => { const [family, shape] = id.split('/'); return `${family}/torso/${shape}`; })
    .filter((id) => id !== 'quadruped/torso/sturdy' && !id.startsWith('radial/')).sort();
  expect(torsos).toEqual(expected);
  return r;
}
