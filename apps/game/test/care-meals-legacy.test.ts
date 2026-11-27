// The tastes, a flora's flavour, the explorer's meal and the order of Mend against the legacy game's own answers,
// and the companion's meal against Dakk's decision D13 (2026-09-25).
// fixtures/v1/recorded/care-meals.json was recorded from the legacy game (tools/record-v1-fixtures.mjs,
// `care-meals`): `faunaTastes` 18879-18884, `floraStat` 19240, `STAT_META` 19231-19237, `healExplorer`
// 19340-19369, the press of a plant in the heal picker 19142-19159 and the choice of "Mend — safest meals"
// 19042-19048.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FED_MAX, FLAVOURS, FLAVOUR_NAMES, explorerMeal, feedMeal, flavourOf, mealNotice, mendOrder, tasteOf,
  type ExplorerMealFactsV1, type Flavour,
} from '../src/care';

type Notes = Array<[string, unknown]>;
interface MealInput { tier: number | null; roll: number; hp: number; stat?: Flavour; lab?: boolean; gear?: number; pstats?: Record<string, number>; scout?: boolean }
interface Held { hp: number; hpMax: number; pstats: Record<Flavour, number>; codex: string[]; notes: Notes }
type Case =
  | { group: 'tastes'; input: { seed: number }; output: { likes: Flavour[]; dislikes: Flavour[] } }
  | { group: 'flavour'; input: { seed: number | null }; output: Flavour }
  | { group: 'stat-names'; input: object; output: Record<Flavour, string> }
  | { group: 'meal'; input: MealInput; output: Held & { result: { ok: boolean; pois: number; heal: number; dmg?: number; stat: Flavour; gain?: number; brink?: boolean } } }
  | { group: 'meal-press'; input: { tier: number; hp: number; values?: number[]; tutDone?: boolean; rig?: { heal: number }; stat?: Flavour; lab?: boolean; gear?: number }; output: Held & { said: string; title: string; unread: number } }
  | { group: 'mend-order'; input: { beast: number; flora: Array<[number, number]> }; output: string[] };
const fixture = JSON.parse(readFileSync(new URL('../../../fixtures/v1/recorded/care-meals.json', import.meta.url), 'utf8')) as { cases: Case[] };
const group = <G extends Case['group']>(name: G) => fixture.cases.filter((c) => c.group === name) as Array<Extract<Case, { group: G }>>;
const said = (notes: Notes, kind: string): unknown[] => notes.filter(([k]) => k === kind).map(([, value]) => value);
const STATS = { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 };

describe('tastes and flavours against the legacy game', () => {
  it('the fixture holds every group it was recorded with', () => {
    expect(Object.fromEntries([...new Set(fixture.cases.map((c) => c.group))].map((name) => [name, group(name).length]))).toEqual({
      tastes: 300, flavour: 301, 'stat-names': 1, meal: 496, 'meal-press': 53, 'mend-order': 48,
    });
  });

  it('a beast loves two flavours and dislikes one, as the legacy game seeded them, for all 300 recorded beasts', () => {
    const seen = { loved: 0, neutral: 0, disliked: 0 };
    for (const { input, output } of group('tastes')) {
      for (const flavour of FLAVOURS) {
        const want = output.likes.includes(flavour) ? 'loved' : output.dislikes.includes(flavour) ? 'disliked' : 'neutral';
        expect(tasteOf({ seed: input.seed }, flavour), `${input.seed} ${flavour}`).toBe(want);
        seen[want]++;
      }
    }
    expect(seen).toEqual({ loved: 600, neutral: 600, disliked: 300 });
  });

  it('a flora nourishes the stat the legacy game gave it, for all 301 recorded plants', () => {
    for (const { input, output } of group('flavour')) expect(flavourOf(input.seed === null ? {} : { seed: input.seed }), String(input.seed)).toBe(output);
    expect(new Set(group('flavour').map(({ output }) => output))).toEqual(new Set(FLAVOURS));
  });

  it('the flavours are named as the legacy card named them', () => {
    expect(FLAVOUR_NAMES).toEqual(group('stat-names')[0]!.output);
    expect(FLAVOUR_NAMES.ins).toBe('Insight');
  });
});

describe('the explorer\'s meal against the legacy game', () => {
  const facts = (input: { tier: number | null; stat?: Flavour; hp: number; pstats?: Record<string, number>; gear?: number; lab?: boolean }, roll: number) => {
    const pstats = { ...STATS, ...(input.pstats ?? {}) };
    return explorerMeal({
      tier: input.tier ?? 0, flavour: input.stat ?? 'fer', roll, hp: input.hp, hpMax: Math.max(20, Math.round(pstats.vit * 2)), pstats,
      healBonus: input.gear ?? 0, lab: input.lab === true,
    });
  };

  it('all 496 recorded meals: the poison, the healing, the stat fed, the health and what is unlocked', () => {
    const seen = { poisoned: 0, healed: 0, brink: 0, gambler: 0, capped: 0, grew: 0 };
    for (const { input, output } of group('meal')) {
      const label = JSON.stringify(input);
      const got = facts(input, input.roll);
      const { result } = output;
      expect([got.ok, got.pois, got.heal, got.stat], label).toEqual([result.ok, result.pois, result.heal, result.stat]);
      expect([got.hpAfter, got.hpMaxAfter, got.pstatsAfter], label).toEqual([output.hp, output.hpMax, output.pstats]);
      expect(got.unlocks, label).toEqual(said(output.notes, 'unlock'));
      if (result.ok) {
        expect(got.gain, label).toBe(result.gain);
        seen.healed++;
        if (got.unlocks.includes('gambler')) seen.gambler++;
        if (got.pstatsAfter[got.stat]! - (input.pstats?.[got.stat] ?? 50) < got.gain) seen.capped++;
        if (got.hpMaxAfter > Math.max(20, Math.round((input.pstats?.vit ?? 50) * 2))) seen.grew++;
      } else {
        expect([got.dmg, got.brink], label).toEqual([result.dmg, result.brink]);
        seen.poisoned++;
        if (got.brink) seen.brink++;
      }
      // The plant is always eaten (19341).
      expect(output.codex, label).toEqual(['s424242']);
    }
    // The fixture holds each answer both ways.
    expect(seen.poisoned).toBeGreaterThan(100);
    expect(seen.healed).toBeGreaterThan(100);
    expect(seen.brink).toBeGreaterThan(10);
    expect(seen.gambler).toBeGreaterThan(10);
    expect(seen.capped).toBeGreaterThan(3);
    expect(seen.grew).toBeGreaterThan(5);
  });

  it('what a meal says is what the legacy game said, for all 53 recorded presses; training never loses the roll', () => {
    const PICTURE = /^[\p{Extended_Pictographic}️]+ /u;
    const words = (text: string) => text.replace(/<[^>]+>/g, '');
    let training = 0;
    for (const { input, output } of group('meal-press')) {
      const label = JSON.stringify(input);
      const rigged = input.tutDone === false || input.rig !== undefined;
      // In training, and in the heal lesson, the legacy game put 0.95 in the roll's place and read no value (19146).
      const got = facts(input, rigged ? 0.95 : input.values![0]!);
      if (rigged) { training++; expect(got.ok, label).toBe(true); }
      expect(output.unread, label).toBe(0);
      const name = /The (Plant \d+) /.exec(output.said)![1]!;
      const notice = mealNotice({ ...got, name } as unknown as ExplorerMealFactsV1);
      expect([notice.icon !== null, `${notice.title}. ${notice.message.join('')}`], label).toEqual([PICTURE.test(output.said), words(output.said).replace(PICTURE, '')]);
      expect(said(output.notes, 'event'), label).toEqual([['healed', { ok: got.ok }]]);
      expect([got.hpAfter, got.hpMaxAfter], label).toEqual([output.hp, output.hpMax]);
    }
    expect(training).toBe(3);
  });
});

describe('the order of Mend against the legacy game', () => {
  it('serves the flora a beast loves first, the lowest grade first, never one it dislikes, for all 48 recorded larders', () => {
    let skipped = 0;
    for (const { input, output } of group('mend-order')) {
      const plants = input.flora.map(([seed, tier]) => ({ id: `s${seed}`, genome: { seed }, tier }));
      expect(mendOrder({ seed: input.beast }, plants).map(({ id }) => id), JSON.stringify(input.beast)).toEqual(output);
      skipped += plants.length - output.length;
    }
    expect(skipped).toBeGreaterThan(20);
  });
});

/* D13, as written in BREEDING_AND_SHARING.md ("v2 companion care and bond — D13 stage 1"), sentence by sentence. */
describe('a companion\'s meal, by Dakk\'s decision D13', () => {
  const fresh = { fed: 0, hurt: 0.5, xp: 0, memories: [] as string[], paidFirsts: [] as string[] };

  it('"Loved +2 fed (+3 for flora tier ≥ 4) and mends 0.25 hurt"', () => {
    expect(feedMeal({ ...fresh, taste: 'loved', tier: 0, flavour: 'ins' })).toMatchObject({ fedAfter: 2, fedGain: 2, hurtAfter: 0.25, mended: true });
    expect(feedMeal({ ...fresh, taste: 'loved', tier: 3, flavour: 'ins' })).toMatchObject({ fedAfter: 2, hurtAfter: 0.25 });
    expect(feedMeal({ ...fresh, taste: 'loved', tier: 4, flavour: 'ins' })).toMatchObject({ fedAfter: 3, fedGain: 3, hurtAfter: 0.25 });
    expect(feedMeal({ ...fresh, taste: 'loved', tier: 9, flavour: 'ins' })).toMatchObject({ fedAfter: 3, hurtAfter: 0.25 });
  });

  it('"Neutral +1 and 0.10"', () => {
    expect(feedMeal({ ...fresh, taste: 'neutral', tier: 0, flavour: 'res' })).toMatchObject({ fedAfter: 1, fedGain: 1, hurtAfter: 0.4, mended: true });
    expect(feedMeal({ ...fresh, taste: 'neutral', tier: 9, flavour: 'res' })).toMatchObject({ fedAfter: 1, hurtAfter: 0.4 });
  });

  it('"Disliked 0 and harmless (the flora is still eaten)": no roll, no poison, no wound', () => {
    for (const tier of [0, 4, 14]) {
      expect(feedMeal({ ...fresh, fed: 7, taste: 'disliked', tier, flavour: 'fer' })).toMatchObject({ fedAfter: 7, fedGain: 0, hurtAfter: 0.5, mended: false });
    }
  });

  it('a mend never takes the hurt below nothing, and a whole beast stays whole', () => {
    expect(feedMeal({ ...fresh, hurt: 0.1, taste: 'loved', tier: 0, flavour: 'ins' })).toMatchObject({ hurtAfter: 0, mended: true });
    expect(feedMeal({ ...fresh, hurt: 0, taste: 'loved', tier: 0, flavour: 'ins' })).toMatchObject({ hurtAfter: 0, mended: false });
    // 0.3 less 0.25 is 0.05, not the 0.04999 a float would leave: still Bruised.
    expect(feedMeal({ ...fresh, hurt: 0.3, taste: 'loved', tier: 0, flavour: 'ins' }).hurtAfter).toBe(0.05);
  });

  it('"The 200 fed cap is unchanged": the meal is still eaten and still mends at the cap', () => {
    expect(FED_MAX).toBe(200);
    expect(feedMeal({ ...fresh, fed: 199, taste: 'loved', tier: 4, flavour: 'ins' })).toMatchObject({ fedAfter: 200, fedGain: 1, hurtAfter: 0.25 });
    expect(feedMeal({ ...fresh, fed: 200, taste: 'loved', tier: 0, flavour: 'ins' })).toMatchObject({ fedAfter: 200, fedGain: 0, hurtAfter: 0.25 });
  });

  it('"+1 for the first meal, +2 per newly tasted flavour (≤ 11 per companion for life)", keyed on bond memories', () => {
    const first = feedMeal({ ...fresh, taste: 'disliked', tier: 0, flavour: 'fer' });
    expect(first).toMatchObject({ xpGain: 3, xpAfter: 3, newMemories: [{ id: 'meal:first', kind: 'meal' }, { id: 'taste:fer', kind: 'taste' }] });
    const again = feedMeal({ ...fresh, xp: 3, memories: ['meal:first', 'taste:fer'], taste: 'disliked', tier: 0, flavour: 'fer' });
    expect(again).toMatchObject({ xpGain: 0, xpAfter: 3, newMemories: [] });
    const other = feedMeal({ ...fresh, xp: 3, memories: ['meal:first', 'taste:fer'], taste: 'loved', tier: 0, flavour: 'ins' });
    expect(other).toMatchObject({ xpGain: 2, xpAfter: 5, newMemories: [{ id: 'taste:ins', kind: 'taste' }] });
    // Every flavour once, and no more for life.
    let xp = 0; const memories: string[] = []; const paid: string[] = [];
    for (let meal = 0; meal < 3; meal++) for (const flavour of FLAVOURS) {
      const got = feedMeal({ fed: 0, hurt: 0, xp, memories, paidFirsts: paid, taste: 'neutral', tier: 0, flavour });
      xp = got.xpAfter; memories.push(...got.newMemories.map(({ id }) => id)); paid.push(...got.firstsPaid);
    }
    expect(xp).toBe(11);
    expect(memories).toHaveLength(6);
    // Each first paid is named as the legacy ledger named it (18968-18969).
    expect(paid).toEqual(['welcome', 'taste:vit', 'taste:fer', 'taste:res', 'taste:agi', 'taste:ins']);
    // Experience stops at the ninth level's 486, as the save keeps it (LEGACY 16618).
    expect(feedMeal({ ...fresh, xp: 485, taste: 'loved', tier: 0, flavour: 'ins' })).toMatchObject({ xpAfter: 486, xpGain: 3 });
  });

  // LEGACY `awardXP` 18224-18233: each award is added on its own, and one that raises the level says so with its
  // reason; a level is floor(sqrt(xp / 6)), nine at most (`levelOf` 17567). The reasons are 18968-18969.
  it('each paid first is its own award: the one that raises the level is named with the legacy reason', () => {
    // 4 + 1 is 5, still level 0; + 2 is 7: level 1, for the taste.
    expect(feedMeal({ ...fresh, xp: 4, taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([{ level: 1, why: 'a taste discovered' }]);
    // 5 + 1 is 6: level 1, for the first meal; + 2 is 8, the same level.
    expect(feedMeal({ ...fresh, xp: 5, taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([{ level: 1, why: 'a welcome meal' }]);
    // Under the level's edge nothing is said: 0 + 3 is 3, and 8 + 3 is 11.
    expect(feedMeal({ ...fresh, xp: 0, taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([]);
    expect(feedMeal({ ...fresh, xp: 8, taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([]);
    // A meal that pays nothing raises nothing, at the very edge too.
    expect(feedMeal({ ...fresh, xp: 23, memories: ['meal:first', 'taste:ins'], taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([]);
    expect(feedMeal({ ...fresh, xp: 23, paidFirsts: ['welcome', 'taste:ins'], taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([]);
    // 53 + 1 is 54: level 3.
    expect(feedMeal({ ...fresh, xp: 53, taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([{ level: 3, why: 'a welcome meal' }]);
    // At the last level there is no level above.
    expect(feedMeal({ ...fresh, xp: 485, taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([{ level: 9, why: 'a welcome meal' }]);
    expect(feedMeal({ ...fresh, xp: 486, taste: 'loved', tier: 0, flavour: 'ins' }).levelUps).toEqual([]);
  });

  // Dakk, 2026-11-27: the experience of a first is earned once a species, by the legacy game's ledger (`xpFirsts`,
  // `awardXPOnce` 18200-18208). The memories stay the companion's own; only the experience asks the ledger too.
  it('a first the species\' ledger already holds is remembered by a new companion and pays it nothing', () => {
    const tamedAgain = feedMeal({ ...fresh, paidFirsts: ['welcome', 'taste:fer'], taste: 'disliked', tier: 0, flavour: 'fer' });
    expect(tamedAgain).toMatchObject({ xpGain: 0, xpAfter: 0, firstsPaid: [], newMemories: [{ id: 'meal:first', kind: 'meal' }, { id: 'taste:fer', kind: 'taste' }] });
    // A flavour no beast of the species has tasted still pays its 2; the first meal is not paid again.
    const newTaste = feedMeal({ ...fresh, paidFirsts: ['welcome', 'taste:fer'], taste: 'loved', tier: 0, flavour: 'ins' });
    expect(newTaste).toMatchObject({ xpGain: 2, xpAfter: 2, firstsPaid: ['taste:ins'], newMemories: [{ id: 'meal:first' }, { id: 'taste:ins' }] });
    // A first the companion already remembers is not paid, whatever the ledger says.
    expect(feedMeal({ ...fresh, memories: ['meal:first', 'taste:ins'], taste: 'loved', tier: 0, flavour: 'ins' })).toMatchObject({ xpGain: 0, firstsPaid: [], newMemories: [] });
  });
});
