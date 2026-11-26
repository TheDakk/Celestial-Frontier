// A landing is one committed receipt: the world marked stood on, the first-landing samples, the Charters and the
// Ascent it moves, its achievements, the journal line with the region it touched down in, and the descent.
// LEGACY celestial-frontier.html, v1.8.9: `flyDown` 13664-13679, `_performLanding` 13465-13498, `noteLanding`
// 13192-13206, `grantFieldSamples` 13681-13695, `openLandingVista` 13505-13566, `descentSafe` 13435-13437.
import { describe, expect, it } from 'vitest';
import { biomeForLanding, landingSalt, landingSceneRoute } from '@cf/domain-landing';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { LANDING_RECEIPT_KIND_V1 } from '../src/landing';
import { stageStarterCharterEventV1 } from '../src/guidance';
import { settleLandingV1 } from '../src/landing';
import { SOL, landingPage, solWorld, worldFacts } from './landing-support';
import { NOW } from './save-support';

const committed = <O extends { readonly kind: string }>(outcome: O): Extract<O, { readonly kind: 'committed' }> => {
  if (outcome.kind !== 'committed') throw new Error(`landing was ${outcome.kind}: ${JSON.stringify(outcome).slice(0, 300)}`);
  return outcome as Extract<O, { readonly kind: 'committed' }>;
};

describe('a landing is one committed receipt', () => {
  it('landing on Earth is guaranteed, pays no field samples and unlocks home', async () => {
    const page = await landingPage();
    const earth = solWorld(SOL.earth);
    const before = { revision: page.runtime.revision, ordinal: page.runtime.diagnostics().sessionOrdinal, state: page.durable() };
    const outcome = committed(await page.land(earth, 'Earth'));
    // No roll: home never waves an explorer off (13436).
    expect(outcome.facts.descent).toMatchObject({ kind: 'landed', safeReason: 'earth', draws: 0, successPercent: 100, damage: 0 });
    expect(page.runtime.diagnostics()).toMatchObject({ sessionOrdinal: before.ordinal + 1, sessionDraws: {} });
    // One revision, one receipt.
    expect(page.runtime.revision).toBe(before.revision + 1);
    expect(outcome.transaction.receipt).toMatchObject({ kind: LANDING_RECEIPT_KIND_V1, ordinal: before.ordinal });
    expect(await page.repository.readReceipt(before.ordinal)).toEqual(outcome.transaction.receipt);
    expect(await page.receipts()).toHaveLength(1);
    const state = (await page.stored()).state;
    expect(state).toEqual(outcome.state);
    // Stood on, for good (13198, 13474), and Homecoming is unlocked (13473).
    expect(state.landed).toEqual([SOL.earth]);
    expect(state.surfSeen).toContain(SOL.earth);
    expect(state.unlocked).toContain('home');
    expect(page.identityLanded(earth)).toBe(true);
    // No field samples on Earth (13201): nothing paid, no landing counted.
    expect(outcome.facts.landed?.sample).toBeNull();
    expect(state.essence).toBe(before.state.essence);
    expect(state.cargo).toEqual(before.state.cargo);
    expect(state.stats.landings).toBe(before.state.stats.landings);
    expect(state.hp).toBe(before.state.hp);
    // The page sees it and hears of it.
    expect(page.live.landed).toEqual([SOL.earth]);
    expect(page.outcomes.committed).toEqual([{ kind: 'landing', receiptOrdinal: before.ordinal }]);
    expect(page.arrived).toEqual([{ address: earth, regionKey: outcome.facts.landed!.region.key, route: outcome.facts.landed!.region.route, firstLanding: true }]);
  });

  it('a first landing on Mars pays 3 + 2 × its tier and a second pays nothing', async () => {
    const page = await landingPage();
    const mars = solWorld(SOL.mars);
    const world = projectWorldOpportunity(mars);
    const before = page.durable();
    const first = committed((await page.landUntilDown(mars)).at(-1)!);
    const stardust = 3 + 2 * world.effectiveTier;
    expect(first.facts.landing).toBe('first');
    expect(first.facts.landed?.sample).toEqual({ stardust, materials: world.deposits.slice(0, 2) });
    expect(first.state.essence).toBe(before.essence + stardust);
    expect(first.state.stats.essenceEarned).toBe((before.stats.essenceEarned ?? 0) + stardust);
    expect(first.state.stats.landings).toBe((before.stats.landings ?? 0) + 1);
    const cargo = new Map(first.state.cargo);
    const had = new Map(before.cargo);
    for (const id of new Set(world.deposits.slice(0, 2))) {
      expect(cargo.get(id)).toBe((had.get(id) ?? 0) + world.deposits.slice(0, 2).filter((deposit) => deposit === id).length);
    }
    expect(first.state.landed).toEqual([SOL.mars]);
    expect(page.identityLanded(mars)).toBe(true);

    const draws = page.runtime.diagnostics().sessionDraws;
    const second = committed(await page.land(mars));
    // A world already stood on is never rolled for again (13436) and pays nothing twice (13194).
    expect(second.facts).toMatchObject({ landing: 'repeat', descent: { kind: 'landed', safeReason: 'revisit', draws: 0 } });
    expect(second.facts.landed).toMatchObject({ sample: null, deed: false });
    expect(page.runtime.diagnostics().sessionDraws).toEqual(draws);
    expect(second.state.essence).toBe(first.state.essence);
    expect(second.state.cargo).toEqual(first.state.cargo);
    expect(second.state.stats).toEqual(first.state.stats);
    expect(second.state.landed).toEqual([SOL.mars]);
    expect(page.arrived.map(({ firstLanding }) => firstLanding)).toEqual([true, false]);
  });

  it('the region in the receipt equals biomeForLanding for the same epoch, landings and session count', async () => {
    const page = await landingPage({ change: (state) => { state.stats.landings = 4; } });
    const earth = solWorld(SOL.earth);
    page.views.next();
    page.views.next(); // two views already composed this session
    const outcome = committed(await page.land(earth, 'Earth'));
    const salt = landingSalt(page.durable().EPOCH_BASE, 4, 3);
    const { planet, band } = worldFacts(earth);
    const expected = biomeForLanding(planet, band, salt);
    expect(outcome.facts.landed?.region).toEqual({ key: expected!.k, route: landingSceneRoute(planet.type, expected!.k), salt });
    expect(page.views.count).toBe(3);
    // The journal keeps the landing: the world, its name, the region, the time (13562-13566).
    expect(outcome.state.journal.at(-1)).toEqual({ s: SOL.earth, n: 'Earth', w: expected!.k, t: NOW });
  });

  it('the landings counted in the salt are those before this landing\'s own samples', async () => {
    const page = await landingPage({ change: (state) => { state.stats.landings = 4; } });
    const first = committed((await page.landUntilDown(solWorld(SOL.mars))).at(-1)!);
    expect(first.state.stats.landings).toBe(5);
    expect(first.facts.landed?.region.salt).toBe(landingSalt(page.durable().EPOCH_BASE, 4, 1));
  });

  it('the journal holds the last 24 landings, a name cut to 28 characters', async () => {
    const page = await landingPage({ change: (state) => { state.journal = Array.from({ length: 24 }, (_, i) => ({ s: i, n: `World ${i}`, w: 'temperate', t: 1 })); } });
    const outcome = committed(await page.land(solWorld(SOL.earth), 'A world whose name runs well past the journal\'s line'));
    expect(outcome.state.journal).toHaveLength(24);
    expect(outcome.state.journal[0]).toMatchObject({ s: 1 });
    expect(outcome.state.journal.at(-1)).toMatchObject({ s: SOL.earth, n: 'A world whose name runs well' });
  });
});

describe('what a first landing moves', () => {
  it('an accepted planetfall Charter is completed and paid in the landing\'s own receipt', async () => {
    const page = await landingPage({ change: (state) => { state.chacc = ['st-land']; } });
    const mars = solWorld(SOL.mars);
    const before = page.durable();
    const presses = await page.landUntilDown(mars);
    const outcome = committed(presses.at(-1)!);
    const sample = outcome.facts.landed!.sample!;
    expect(outcome.facts.landed?.charters).toEqual({ progressIds: ['st-land'], completedIds: ['st-land'] });
    expect(outcome.state).toMatchObject({ chDone: ['st-land'], chacc: [] });
    expect(outcome.state.essence).toBe(before.essence + sample.stardust + 10);
    expect(outcome.state.stats.charters).toBe(1);
    // Every press, wave-offs included, is one receipt; the Charter took none of its own.
    expect(await page.receipts()).toHaveLength(presses.length);
  });

  it('a landing on a world already stood on counts for no Charter', async () => {
    // LEGACY 13193-13199: the landfall deed is said only when the world joins the landed set.
    const page = await landingPage();
    const mars = solWorld(SOL.mars);
    await page.landUntilDown(mars);
    const staged: string[] = [];
    const outcome = committed(await settleLandingV1({
      ...page.deps,
      charters: (input) => { staged.push(input.event.kind); return stageStarterCharterEventV1(input); },
    }, { address: mars, worldName: 'Mars', codecNow: NOW }));
    expect(outcome.facts.landed).toMatchObject({ deed: false, charters: { progressIds: [], completedIds: [] } });
    expect(staged).toEqual([]);
  });

  it('two first landings in Sol fill the first chapter\'s planetfall goal, and a third adds nothing to it', async () => {
    const page = await landingPage();
    const first = committed((await page.landUntilDown(solWorld(SOL.mars))).at(-1)!);
    expect(first.facts.landed?.ascent).toMatchObject({ banked: true });
    expect(first.state.ascProg['c1-land']).toBe(1);
    const second = committed((await page.landUntilDown(solWorld(SOL.mercury))).at(-1)!);
    expect(second.state.ascProg['c1-land']).toBe(2);
    const third = committed(await page.land(solWorld(SOL.earth)));
    expect(third.state.ascProg['c1-land']).toBe(2);
    expect(third.facts.landed?.ascent.banked).toBe(false);
  });

  it('the fifth world stood on unlocks Groundfall', async () => {
    // LEGACY 13474 and the achievement's own test, 16369.
    const page = await landingPage({ change: (state) => { state.surfSeen = [1, 2, 3, 4]; } });
    const outcome = committed(await page.land(solWorld(SOL.earth)));
    expect(outcome.state.surfSeen).toEqual([1, 2, 3, 4, SOL.earth]);
    expect(outcome.state.unlocked).toEqual(expect.arrayContaining(['home', 'surface5']));
    expect(outcome.facts.landed?.achievementIds).toEqual(expect.arrayContaining(['home', 'surface5']));
  });

  it('a world the save knows only by its seed as landed is not rolled for, paid or counted again', async () => {
    // LEGACY 13436 and 13194 read the landed set by seed.
    const page = await landingPage({ change: (state) => { state.landed = [SOL.mars]; state.chacc = ['st-land']; } });
    const mars = solWorld(SOL.mars);
    const before = page.durable();
    const outcome = committed(await page.land(mars));
    expect(outcome.facts).toMatchObject({ landing: 'unresolved-already-landed', descent: { kind: 'landed', safeReason: 'revisit', draws: 0 } });
    expect(outcome.facts.landed).toMatchObject({ sample: null, deed: false });
    expect(outcome.state.essence).toBe(before.essence);
    expect(outcome.state.chacc).toEqual(['st-land']);
    expect(outcome.state.landed).toEqual([SOL.mars]);
    expect(page.identityLanded(mars)).toBe(true);
  });
});

describe('a landing during training', () => {
  it('on Earth: home is stood on for good, with no Charter, Ascent or sample', async () => {
    // LEGACY 13197: training landings do not count, except home.
    const page = await landingPage({ change: (state) => { state.tutDone = false; } });
    const earth = solWorld(SOL.earth);
    const before = page.durable();
    const outcome = committed(await page.land(earth, 'Earth'));
    expect(outcome.facts).toMatchObject({ training: true, descent: { kind: 'landed', safeReason: 'training', draws: 0 } });
    expect(outcome.facts.landed).toMatchObject({ permanent: true, deed: false, sample: null, ascent: { banked: false } });
    expect(outcome.state.landed).toEqual([SOL.earth]);
    expect(outcome.state.surfSeen).toContain(SOL.earth);
    expect(outcome.state.unlocked).toContain('home');
    expect(outcome.state.ascProg).toEqual(before.ascProg);
    expect(outcome.state.essence).toBe(before.essence);
    expect(page.identityLanded(earth)).toBe(true);
  });

  it('on any other world: no roll, and nothing follows the explorer out but the journal\'s line', async () => {
    const page = await landingPage({ change: (state) => { state.tutDone = false; } });
    const venus = solWorld(SOL.venus);
    const before = page.durable();
    const outcome = committed(await page.land(venus, 'Venus'));
    expect(outcome.facts).toMatchObject({ training: true, descent: { kind: 'landed', safeReason: 'training', draws: 0 } });
    expect(outcome.facts.landed).toMatchObject({ permanent: false, deed: false, sample: null });
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
    expect({ ...outcome.state, journal: before.journal }).toEqual(before);
    expect(outcome.state.journal.at(-1)).toMatchObject({ s: SOL.venus, n: 'Venus' });
    expect(page.identityLanded(venus)).toBe(false);
    expect(page.waveOffs(venus)).toBe(0);
    expect(page.arrived).toMatchObject([{ firstLanding: false }]);
  });
});
