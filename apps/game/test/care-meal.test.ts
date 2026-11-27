// The explorer's meal is one committed receipt of one draw: the flora eaten and gone from the Compendium, the
// health mended or the poison taken, the stat fed; or nothing at all.
// LEGACY celestial-frontier.html v1.8.9: `healExplorer` 19340-19369, the press 19142-19159.
import { describe, expect, it } from 'vitest';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { mealNotice } from '../src/care';
import { carePage, earthId, farPlant, heldPage } from './care-support';
import { dump } from './save-support';

const committed = async <O extends { kind: string }>(outcome: Promise<O>): Promise<Extract<O, { kind: 'committed' }>> => {
  const settled = await outcome;
  if (settled.kind !== 'committed') throw new Error(`the action was ${settled.kind}: ${JSON.stringify(settled).slice(0, 300)}`);
  return settled as Extract<O, { kind: 'committed' }>;
};
/** A session seed whose first meal value answers `wanted`. */
function mealSession(wanted: (value: number) => boolean): number {
  for (let seed = 1; seed < 4000; seed++) if (wanted(createSessionRNG(seed).at('care.heal', 0))) return seed;
  throw new Error('no session seed gives that meal value');
}
const GOOD = mealSession((value) => value >= 0.6);
const TOXIC = mealSession((value) => value < 0.05);
// The Persimmon (row 0 of Earth's roster) is of tier 0 and nourishes Insight: an 8% poison, 14 health.
const PERSIMMON = earthId(0);

describe('a meal that nourishes', () => {
  it('heals, feeds the stat the flora nourishes, and the flora leaves the Compendium, in one receipt of one draw', async () => {
    const page = await carePage({ sessionSeed: GOOD, held: [heldPage(0), heldPage(2)], change: (state) => { state.hp = 40; } });
    const { state, facts } = await committed(page.meal(PERSIMMON));
    expect(facts).toMatchObject({ ok: true, pois: 0.08, heal: 14, dmg: 0, stat: 'ins', gain: 1, hpBefore: 40, hpAfter: 54, hpMaxAfter: 100, brink: false, rolled: true, name: 'Persimmon', tier: 0 });
    expect(state.hp).toBe(54);
    expect(state.pstats).toEqual({ vit: 50, fer: 50, res: 50, agi: 50, ins: 51 });
    expect(state.codex.map(([id]) => id)).toEqual([earthId(2)]);
    expect(page.live.codex.map(([id]) => id)).toEqual([earthId(2)]);
    expect(page.ownership().specimenLots).toHaveLength(1);
    expect(page.carrierAgrees()).toBe(true);
    expect(state.unlocked).toContain('fieldmedic');
    expect(state.unlocked).not.toContain('gambler');
    expect(facts.achievementIds).toContain('fieldmedic');
    expect(facts.achievementIds).not.toContain('gambler');
    expect(await page.receipts()).toHaveLength(1);
    expect(page.outcomes.committed).toEqual([{ kind: 'meal', receiptOrdinal: 0 }]);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({ 'care.heal': 1 });
    expect(mealNotice(facts)).toEqual({ icon: 'heal', title: '+14 HP · +1 Insight', message: ['The Persimmon nourished you — now at 54/100 HP.'] });
    const stored = (await page.stored()).state;
    expect([stored.hp, stored.HP_MAX, stored.pstats.ins, stored.codex.map(([id]) => id)]).toEqual([54, 100, 51, [earthId(2)]]);
  });

  it('may be eaten at full health, for the stat it feeds', async () => {
    const page = await carePage({ sessionSeed: GOOD, held: [heldPage(0)] });
    const { state, facts } = await committed(page.meal(PERSIMMON));
    expect(facts).toMatchObject({ ok: true, hpBefore: 100, hpAfter: 100 });
    expect(state.pstats.ins).toBe(51);
    expect(state.codex).toEqual([]);
  });

  it('a rarer flora heals more, feeds more, and above 40% risk earns Cruel Bargain', async () => {
    // Seed 7 at full rarity: tier 5, Insight. Poison 0.08 + 5 x 0.07 = 0.43; healing round(12 + 45 + 12.9) = 70.
    const page = await carePage({ sessionSeed: GOOD, held: [farPlant(7)], change: (state) => { state.hp = 10; } });
    const { state, facts } = await committed(page.meal('s7'));
    expect(facts).toMatchObject({ ok: true, heal: 70, gain: 6, hpAfter: 80, tier: 5 });
    expect(facts.pois).toBeCloseTo(0.43, 12);
    expect(state.pstats.ins).toBe(56);
    expect(facts.achievementIds).toEqual(expect.arrayContaining(['fieldmedic', 'gambler']));
  });

  it('a flora of Vitality raises the health\'s ceiling, and the health gained comes with it (LEGACY 19243)', async () => {
    // Seed 5 at full rarity: tier 4, Vitality. Healing round(12 + 36 + 10.8) = 59; Vitality 50 + 5; ceiling 110.
    const page = await carePage({ sessionSeed: GOOD, held: [farPlant(5)], change: (state) => { state.hp = 40; } });
    const { state, facts } = await committed(page.meal('s5'));
    expect(facts).toMatchObject({ ok: true, heal: 59, stat: 'vit', gain: 5, hpAfter: 109, hpMaxAfter: 110 });
    expect([state.hp, state.HP_MAX, state.pstats.vit]).toEqual([109, 110, 55]);
    const stored = (await page.stored()).state;
    expect([stored.hp, stored.HP_MAX, stored.pstats.vit]).toEqual([109, 110, 55]);
  });

  it('the Xenobotany Lab adds a point of growth, and worn meal gear its share of healing', async () => {
    const lab = await carePage({ sessionSeed: GOOD, held: [heldPage(0)], change: (state) => { state.hp = 40; state.techOwned = ['lab1']; } });
    expect((await committed(lab.meal(PERSIMMON))).facts).toMatchObject({ gain: 2, heal: 14 });
    expect(lab.durable().pstats.ins).toBe(52);
    // Surgeon's Gloves: +35% healing. round(14 x 1.35) = 19.
    const gloves = await carePage({ sessionSeed: GOOD, held: [heldPage(0)], change: (state) => { state.hp = 40; state.items = [['surgeon', 1]]; state.equip = { gloves: 'surgeon' }; } });
    expect((await committed(gloves.meal(PERSIMMON))).facts).toMatchObject({ heal: 19, hpAfter: 59, gain: 1 });
  });
});

describe('a toxic meal', () => {
  it('costs health, feeds nothing, unlocks nothing; the flora is eaten all the same', async () => {
    const page = await carePage({ sessionSeed: TOXIC, held: [heldPage(0)], change: (state) => { state.hp = 40; } });
    const { state, facts } = await committed(page.meal(PERSIMMON));
    // ceil(14 x 0.6) = 9.
    expect(facts).toMatchObject({ ok: false, dmg: 9, gain: 0, hpAfter: 31, brink: false, rolled: true });
    expect(state.hp).toBe(31);
    expect(state.pstats.ins).toBe(50);
    expect(state.codex).toEqual([]);
    expect(state.unlocked).not.toContain('fieldmedic');
    expect(facts.achievementIds).not.toContain('fieldmedic');
    expect(mealNotice(facts)).toEqual({ icon: 'skull', title: 'Poisoned −9 HP', message: ['The Persimmon was toxic (8% risk). You’re at 31/100 HP.'] });
  });

  it('never kills: it stops at the last point of health', async () => {
    const page = await carePage({ sessionSeed: TOXIC, held: [heldPage(0), heldPage(1)], change: (state) => { state.hp = 5; } });
    const first = await committed(page.meal(PERSIMMON));
    expect(first.facts).toMatchObject({ ok: false, dmg: 4, hpAfter: 1, brink: true });
    expect(first.state.hp).toBe(1);
    expect(mealNotice(first.facts).message).toEqual(['The Persimmon was toxic (8% risk). You’re at 1/100 HP — at the brink. Medicine gutted you, but it never kills.']);
  });

  it('the gear\'s share does not sharpen the poison (LEGACY 19344-19347)', async () => {
    const page = await carePage({ sessionSeed: TOXIC, held: [heldPage(0)], change: (state) => { state.hp = 40; state.items = [['surgeon', 1]]; state.equip = { gloves: 'surgeon' }; } });
    expect((await committed(page.meal(PERSIMMON))).facts).toMatchObject({ ok: false, dmg: 9, heal: 19 });
  });
});

describe('a meal of training', () => {
  it('is never toxic and reads no random value, whatever the session holds (LEGACY 19146)', async () => {
    // Seed 7: a 43% poison. The session's first meal value is below it; training does not read it.
    const page = await carePage({ sessionSeed: TOXIC, held: [farPlant(7)], change: (state) => { state.tutDone = false; state.hp = 10; } });
    const { state, facts } = await committed(page.meal('s7'));
    expect(facts).toMatchObject({ ok: true, rolled: false, heal: 70, hpAfter: 80 });
    expect(state.unlocked).toEqual(expect.arrayContaining(['fieldmedic', 'gambler']));
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
    expect(await page.receipts()).toHaveLength(1);
    // After training the same flora is rolled for.
    const after = await carePage({ sessionSeed: TOXIC, held: [farPlant(7)], change: (state) => { state.hp = 80; } });
    expect((await committed(after.meal('s7'))).facts).toMatchObject({ ok: false, rolled: true, dmg: 42, hpAfter: 38 });
    expect(after.runtime.diagnostics().sessionDraws).toEqual({ 'care.heal': 1 });
  });
});

describe('what cannot be eaten', () => {
  it('a beast, a fungus and a flora the Compendium does not hold: refused, nothing written, no value read', async () => {
    const page = await carePage({ sessionSeed: GOOD, held: [heldPage(11), heldPage(6)] });
    const before = await dump(page.backend);
    expect(await page.meal(earthId(11))).toMatchObject({ kind: 'refused', detail: 'food:not-flora' });
    expect(await page.meal(earthId(6))).toMatchObject({ kind: 'refused', detail: 'food:not-flora' });
    expect(await page.meal(PERSIMMON)).toMatchObject({ kind: 'refused', detail: 'food:not-in-compendium' });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
  });
});
