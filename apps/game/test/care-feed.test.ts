// A companion's meal is one committed receipt: the flora eaten and gone from the Compendium, the beast fed and
// mended by Dakk's decision D13, its firsts remembered, the meal counted; or nothing at all.
// LEGACY celestial-frontier.html v1.8.9 for what stands around the meal: `feedPair` 18913-18915, the press
// 19183-19211, "Mend — safest meals" 19029-19063. D13: BREEDING_AND_SHARING.md, "v2 companion care and bond".
import { describe, expect, it } from 'vitest';
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER, preflightCaptureV1 } from '@cf/domain-acquisition';
import { arc4OwnershipLegacyMirrorMatches, readArc4Ownership } from '@cf/persistence';
import { captureSnapshotV1 } from '../src/capture';
import { feedNotice, flavourOf, mendNotice, settleFeedV1, tasteOf } from '../src/care';
import { carePage, earthId, farPlant, heldPage } from './care-support';
import { EARTH, capturePage, captureSession, rosterFor } from './capture-support';
import { NOW, dump } from './save-support';

const committed = async <O extends { kind: string }>(outcome: Promise<O>): Promise<Extract<O, { kind: 'committed' }>> => {
  const settled = await outcome;
  if (settled.kind !== 'committed') throw new Error(`the action was ${settled.kind}: ${JSON.stringify(settled).slice(0, 300)}`);
  return settled as Extract<O, { kind: 'committed' }>;
};
// Earth's roster: the Platypus (row 11) loves Vitality and Insight and dislikes Ferocity. Of Earth's plants the
// Persimmon (0), Devil's Club (1) and Barrel Cactus Fruit (5) nourish Insight, the Cranberry (2) Resilience, the
// Rambutan (3) Ferocity and the Wild Guava (4) Agility.
const PLATYPUS = earthId(11);
const [PERSIMMON, CLUB, CRANBERRY, RAMBUTAN, GUAVA, CACTUS] = [0, 1, 2, 3, 4, 5].map(earthId) as [string, string, string, string, string, string];

describe('a meal a beast loves', () => {
  it('feeds it 2, mends 0.25 of its hurt, and the flora leaves the Compendium, in one receipt with no random value', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.6 }), heldPage(0), heldPage(2)] });
    const { state, facts } = await committed(page.feed(PLATYPUS, PERSIMMON));
    expect(facts.meals).toEqual([{
      floraId: PERSIMMON, floraName: 'Persimmon', taste: 'loved', flavour: 'ins', tier: 0, fedAfter: 2, fedGain: 2, hurtBefore: 0.6, hurtAfter: 0.35, mended: true,
      condition: 'Injured', xpGain: 3, xpAfter: 3, newMemoryIds: ['meal:first', 'taste:ins'],
    }]);
    expect(facts).toMatchObject({ speciesId: PLATYPUS, name: 'Platypus', halt: null, feeds: 1 });
    // The beast.
    expect(page.creature(PLATYPUS)).toMatchObject({ fed: 2, hurt: 0.35, xp: 3 });
    // The flora is eaten: it is gone from the Compendium, the live one and the stored one, and from the carrier.
    expect(state.codex.map(([id]) => id)).toEqual([PLATYPUS, CRANBERRY]);
    expect(page.live.codex.map(([id]) => id)).toEqual([PLATYPUS, CRANBERRY]);
    expect((await page.stored()).state.codex.map(([id]) => id)).toEqual([PLATYPUS, CRANBERRY]);
    expect(page.ownership().specimenLots).toHaveLength(1);
    expect(page.ownership().catalogSpecies).toHaveLength(2);
    expect(page.carrierAgrees()).toBe(true);
    // The meal is counted (LEGACY 19184).
    expect(state.stats.feeds).toBe(1);
    expect(state.stats.feedfails ?? 0).toBe(0);
    expect(await page.receipts()).toHaveLength(1);
    expect(page.outcomes.committed).toEqual([{ kind: 'feed', receiptOrdinal: 0 }]);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
    expect(feedNotice(facts.name, facts.meals[0]!)).toEqual({
      icon: 'meal', title: 'Platypus', message: ['It loves Insight-rich flora — +2 bloodline. Its wounds mend — now Injured (35% hurt).'],
    });
  });

  it('a flora of tier 4 or more feeds it 3', async () => {
    const [id, plant] = farPlant(7);
    const page = await carePage({ held: [heldPage(11), [id, plant], farPlant(5)] });
    expect(page.durable().codex.find(([held]) => held === id)?.[1].tier).toBe(5);
    const { facts } = await committed(page.feed(PLATYPUS, id));
    expect(facts.meals[0]).toMatchObject({ taste: 'loved', flavour: 'ins', tier: 5, fedAfter: 3, fedGain: 3 });
    expect(page.creature(PLATYPUS)).toMatchObject({ fed: 3 });
    // Tier 4 is the edge.
    const edge = await committed(page.feed(PLATYPUS, 's5'));
    expect(edge.facts.meals[0]).toMatchObject({ taste: 'loved', flavour: 'vit', tier: 4, fedAfter: 6, fedGain: 3 });
  });

  it('a beast made whole holds no hurt at all', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.2 }), heldPage(0)] });
    const { facts } = await committed(page.feed(PLATYPUS, PERSIMMON));
    expect(facts.meals[0]).toMatchObject({ hurtBefore: 0.2, hurtAfter: 0, mended: true, condition: 'Healthy' });
    expect(page.creature(PLATYPUS)).not.toHaveProperty('hurt');
    expect(feedNotice(facts.name, facts.meals[0]!).message).toEqual(['It loves Insight-rich flora — +2 bloodline. Its wounds mend — now Healthy.']);
  });
});

describe('a meal a beast neither loves nor dislikes, and one it dislikes', () => {
  it('a neutral meal feeds it 1 and mends 0.10', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.6, fed: 10 }), heldPage(2)] });
    const { facts } = await committed(page.feed(PLATYPUS, CRANBERRY));
    expect(facts.meals[0]).toMatchObject({ taste: 'neutral', flavour: 'res', tier: 1, fedAfter: 11, fedGain: 1, hurtBefore: 0.6, hurtAfter: 0.5, mended: true });
    expect(page.creature(PLATYPUS)).toMatchObject({ fed: 11, hurt: 0.5 });
    expect(feedNotice(facts.name, facts.meals[0]!).message).toEqual(['It is indifferent to Resilience-rich flora — +1 bloodline. Its wounds mend — now Injured (50% hurt).']);
  });

  it('a disliked meal does nothing and harms nothing; the flora is still eaten and the meal still counted', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.9, fed: 10 }), heldPage(3)] });
    const { state, facts } = await committed(page.feed(PLATYPUS, RAMBUTAN));
    expect(facts.meals[0]).toMatchObject({ taste: 'disliked', flavour: 'fer', tier: 2, fedAfter: 10, fedGain: 0, hurtBefore: 0.9, hurtAfter: 0.9, mended: false });
    // The legacy roll would have poisoned this beast, at 0.9 hurt, to death one time in four (18921-18931). It lives.
    expect(page.creature(PLATYPUS)).toMatchObject({ fed: 10, hurt: 0.9 });
    expect(state.codex.map(([id]) => id)).toEqual([PLATYPUS]);
    expect(state.stats.feeds).toBe(1);
    expect(state.stats.feedfails ?? 0).toBe(0);
    expect(feedNotice(facts.name, facts.meals[0]!).message).toEqual(['It dislikes Ferocity-rich flora — no change.']);
  });

  it('fed stops at 200: the meal is eaten, mends, and adds only what is left', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.5, fed: 199 }), heldPage(0), heldPage(1)] });
    expect((await committed(page.feed(PLATYPUS, PERSIMMON))).facts.meals[0]).toMatchObject({ fedAfter: 200, fedGain: 1, hurtAfter: 0.25 });
    const full = await committed(page.feed(PLATYPUS, CLUB));
    expect(full.facts.meals[0]).toMatchObject({ fedAfter: 200, fedGain: 0, hurtAfter: 0, mended: true });
    expect(full.state.codex.map(([id]) => id)).toEqual([PLATYPUS]);
    expect(page.creature(PLATYPUS)).toMatchObject({ fed: 200 });
  });
});

describe('what a meal teaches, and what the beast remembers of it', () => {
  it('the first meal pays 1 and each flavour newly tasted pays 2, once: the memories are kept on the beast', async () => {
    const page = await carePage({ activePlayMs: 540_000, held: [heldPage(11, { xp: 4 }), heldPage(0), heldPage(1), heldPage(2), heldPage(3)] });
    const first = await committed(page.feed(PLATYPUS, PERSIMMON));
    // Each memory is stamped with the active play its receipt committed.
    const stamp = page.runtime.activePlayMs();
    expect(stamp).toBeGreaterThanOrEqual(540_000);
    expect(page.ownership().creatures[0]!.bond!.memories.map(({ atActivePlayMs }) => atActivePlayMs)).toEqual([stamp, stamp]);
    expect(first.facts.meals[0]).toMatchObject({ xpGain: 3, xpAfter: 7, newMemoryIds: ['meal:first', 'taste:ins'] });
    expect(first.facts.bond).toEqual({ levelBefore: 0, levelAfter: 0, memories: 2 });
    // The same flavour again: nothing new.
    const same = await committed(page.feed(PLATYPUS, CLUB));
    expect(same.facts.meals[0]).toMatchObject({ xpGain: 0, xpAfter: 7, newMemoryIds: [] });
    // A flavour it is indifferent to, and one it dislikes, are tasted all the same.
    const third = await committed(page.feed(PLATYPUS, CRANBERRY));
    expect(third.facts.meals[0]).toMatchObject({ xpGain: 2, xpAfter: 9, newMemoryIds: ['taste:res'] });
    // The third memory makes the bond Familiar.
    expect(third.facts.bond).toEqual({ levelBefore: 0, levelAfter: 1, memories: 3 });
    const fourth = await committed(page.feed(PLATYPUS, RAMBUTAN));
    expect(fourth.facts.meals[0]).toMatchObject({ xpGain: 2, xpAfter: 11, newMemoryIds: ['taste:fer'] });
    expect(page.creature(PLATYPUS)).toMatchObject({ xp: 11 });
    const beast = page.ownership().creatures[0]!;
    expect(beast.bond).toMatchObject({ level: 1 });
    expect(beast.bond!.memories.map(({ id, kind }) => [id, kind])).toEqual([['meal:first', 'meal'], ['taste:ins', 'taste'], ['taste:res', 'taste'], ['taste:fer', 'taste']]);
    expect(page.carrierAgrees()).toBe(true);
    // What was stored reads back with its memories.
    const stored = (await page.stored()).state.codex.find(([id]) => id === PLATYPUS)![1].g as { bond?: { level: number; memories: unknown[] } };
    expect(stored.bond).toMatchObject({ level: 1 });
    expect(stored.bond!.memories).toHaveLength(4);
  });

  it('the fifth meal earns Zookeeper (LEGACY 16434)', async () => {
    const page = await carePage({ held: [heldPage(11), heldPage(0)], change: (state) => { state.stats.feeds = 4; } });
    const { state, facts } = await committed(page.feed(PLATYPUS, PERSIMMON));
    expect(facts.feeds).toBe(5);
    expect(facts.achievementIds).toContain('feed5');
    expect(state.unlocked).toContain('feed5');
  });
});

describe('what cannot be fed, or eaten', () => {
  it('a beast or a flora the Compendium does not hold, a plant fed, a beast eaten, a fungus eaten: refused, nothing written', async () => {
    const page = await carePage({ held: [heldPage(11), heldPage(12), heldPage(0), heldPage(6)] });
    const before = await dump(page.backend);
    expect(await page.feed(earthId(13), PERSIMMON)).toMatchObject({ kind: 'refused', detail: 'not-in-compendium' });
    expect(await page.feed(PERSIMMON, PERSIMMON)).toMatchObject({ kind: 'refused', detail: 'not-a-beast' });
    expect(await page.feed(PLATYPUS, CRANBERRY)).toMatchObject({ kind: 'refused', detail: 'food:not-in-compendium' });
    expect(await page.feed(PLATYPUS, earthId(12))).toMatchObject({ kind: 'refused', detail: 'food:not-flora' });
    // The legacy picker lists flora only (19027): a fungus is no meal.
    expect(await page.feed(PLATYPUS, earthId(6))).toMatchObject({ kind: 'refused', detail: 'food:not-flora' });
    expect(await dump(page.backend)).toEqual(before);
    expect(await page.receipts()).toEqual([]);
  });

  it('a flora eaten once cannot be eaten again', async () => {
    const page = await carePage({ held: [heldPage(11), heldPage(0)] });
    await committed(page.feed(PLATYPUS, PERSIMMON));
    const before = await dump(page.backend);
    expect(await page.feed(PLATYPUS, PERSIMMON)).toMatchObject({ kind: 'refused', detail: 'food:not-in-compendium' });
    expect(await dump(page.backend)).toEqual(before);
  });
});

describe('an eaten flora can be scavenged again', () => {
  it('it is back in the pool of the world it grew on, and comes back under the name the player gave it (LEGACY 14796-14797)', async () => {
    const hit = captureSession((success) => success < 0.01);
    const page = await capturePage({
      sessionSeed: hit,
      // Every flora and fungus of Earth is held: nothing is left to scavenge.
      change: (state) => { state.codex = [heldPage(11), ...[0, 1, 2, 3, 4, 5, 6, 7].map((row) => heldPage(row))]; state.customNames = [[`c${PERSIMMON}`, 'Sweetfruit'], [`c${PLATYPUS}`, 'Flat']]; },
    });
    const pool = () => {
      const composed = captureSnapshotV1({ address: EARTH, epoch: page.durable().EPOCH_BASE, activePlayMs: 0, extensions: page.runtime.extensions, rosterFor });
      if (composed.kind !== 'ready') throw new Error(`snapshot was ${composed.reason}`);
      const ready = preflightCaptureV1(composed.snapshot, 'scavenge');
      return ready.kind === 'ready' ? ready.pool.map((candidate) => candidate.legacyCatalogueId) : [];
    };
    expect(pool()).toEqual([]);
    const fed = await settleFeedV1({ door: page.loop }, { speciesId: PLATYPUS, floraId: PERSIMMON, codecNow: NOW });
    expect(fed).toMatchObject({ kind: 'committed', facts: { meals: [{ floraName: 'Sweetfruit' }] } });
    expect(pool()).toEqual([PERSIMMON]);
    // The name stays among the names while the flora is gone (`removeFromCodex` 18808-18821 leaves it there).
    expect(page.durable().customNames).toContainEqual([`c${PERSIMMON}`, 'Sweetfruit']);
    const caught = await page.press('scavenge');
    expect(caught).toMatchObject({ kind: 'committed', facts: { hit: true, speciesId: PERSIMMON, name: 'Sweetfruit' } });
    expect(page.durable().codex.find(([id]) => id === PERSIMMON)?.[1].name).toBe('Sweetfruit');
    expect((await page.stored()).state.codex.find(([id]) => id === PERSIMMON)?.[1].name).toBe('Sweetfruit');
    expect(page.durable().customNames.filter(([key]) => key === `c${PERSIMMON}`)).toEqual([[`c${PERSIMMON}`, 'Sweetfruit']]);
    // The carrier holds the name too: it and the Compendium say the same.
    const read = readArc4Ownership(page.runtime.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    if (read.kind !== 'loaded') throw new Error(`ownership was ${read.kind}`);
    expect(read.state.catalogSpecies.find((row) => `s${String(row.genome.seed)}` === PERSIMMON)?.alias).toBe('Sweetfruit');
    const { codex, customNames, bioX, scoutId } = page.durable();
    expect(arc4OwnershipLegacyMirrorMatches(read.state, { codex, customNames, bioX, scoutId })).toBe(true);
  });
});

describe('Mend: the safest meals in one press', () => {
  it('serves the flora the beast loves first, the lowest grade first, never one it dislikes, until it is whole', async () => {
    // Hurt 0.45: the Persimmon (loved, tier 0) mends 0.25, the Devil's Club (loved, tier 0) the rest.
    const page = await carePage({ held: [heldPage(11, { hurt: 0.45 }), heldPage(4), heldPage(3), heldPage(2), heldPage(1), heldPage(0), heldPage(5)] });
    const { state, facts } = await committed(page.mend(PLATYPUS));
    expect(facts.meals.map(({ floraId, taste, hurtAfter }) => [floraId, taste, hurtAfter])).toEqual([[CLUB, 'loved', 0.2], [PERSIMMON, 'loved', 0]]);
    expect(facts.halt).toBe('mended');
    expect(page.creature(PLATYPUS)).toMatchObject({ fed: 4, xp: 3 });
    expect(page.creature(PLATYPUS)).not.toHaveProperty('hurt');
    expect(state.codex.map(([id]) => id)).toEqual([PLATYPUS, GUAVA, RAMBUTAN, CRANBERRY, CACTUS]);
    // Each meal is counted (19051), in one receipt.
    expect(state.stats.feeds).toBe(2);
    expect(await page.receipts()).toHaveLength(1);
    expect(page.outcomes.committed).toEqual([{ kind: 'mend', receiptOrdinal: 0 }]);
    expect(page.carrierAgrees()).toBe(true);
    expect(mendNotice(facts)).toEqual({ icon: 'heart', title: '2 safe meals served.', message: ['Now Healthy.'] });
  });

  it('with the loved flora gone it serves the ones the beast is indifferent to, and stops when no safe flora is left', async () => {
    // Hurt 0.9: Persimmon 0.65; then Cranberry (neutral, tier 1) 0.55 and Wild Guava (neutral, tier 2) 0.45; the Rambutan it dislikes is left.
    const page = await carePage({ held: [heldPage(11, { hurt: 0.9 }), heldPage(3), heldPage(4), heldPage(2), heldPage(0)] });
    const { state, facts } = await committed(page.mend(PLATYPUS));
    expect(facts.meals.map(({ floraId, taste, hurtAfter }) => [floraId, taste, hurtAfter])).toEqual([[PERSIMMON, 'loved', 0.65], [CRANBERRY, 'neutral', 0.55], [GUAVA, 'neutral', 0.45]]);
    expect(facts.halt).toBe('out-of-safe-flora');
    expect(state.codex.map(([id]) => id)).toEqual([PLATYPUS, RAMBUTAN]);
    expect(state.stats.feeds).toBe(3);
    expect(mendNotice(facts)).toEqual({ icon: 'heart', title: '3 safe meals served.', message: ['out of safe flora. Now Injured (45% hurt).'] });
  });

  it('a whole beast, a beast with no safe flora, and training: refused, nothing written', async () => {
    const whole = await carePage({ held: [heldPage(11), heldPage(0)] });
    expect(await whole.mend(PLATYPUS)).toMatchObject({ kind: 'refused', detail: 'mend:healthy' });
    const bare = await carePage({ held: [heldPage(11, { hurt: 0.5 }), heldPage(3), heldPage(6)] });
    const before = await dump(bare.backend);
    expect(await bare.mend(PLATYPUS)).toMatchObject({ kind: 'refused', detail: 'mend:no-safe-flora' });
    expect(await dump(bare.backend)).toEqual(before);
    // "Post-training only" (19029-19033).
    const training = await carePage({ held: [heldPage(11, { hurt: 0.5 }), heldPage(0)], change: (state) => { state.tutDone = false; } });
    expect(await training.mend(PLATYPUS)).toMatchObject({ kind: 'refused', detail: 'mend:training' });
    // A single meal is not gated by training.
    expect((await training.feed(PLATYPUS, PERSIMMON)).kind).toBe('committed');
  });

  it('serves ten meals at most in one press', async () => {
    // Twelve flora the beast is indifferent to mend 0.10 each: at 0.95 hurt the tenth makes it whole.
    const neutral: number[] = [];
    for (let seed = 100; neutral.length < 12; seed++) {
      const [, entry] = farPlant(seed);
      if (tasteOf({ seed: Number(earthId(11).slice(1)) }, flavourOf(entry.g)) === 'neutral') neutral.push(seed);
    }
    const page = await carePage({ held: [heldPage(11, { hurt: 0.95 }), ...neutral.map((seed) => farPlant(seed))] });
    const { state, facts } = await committed(page.mend(PLATYPUS));
    expect(facts.meals).toHaveLength(10);
    expect(facts.meals.map(({ hurtAfter }) => hurtAfter)).toEqual([0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15, 0.05, 0]);
    // By D13's numbers the tenth safe meal always makes a beast whole, so the run ends mended.
    expect(facts.halt).toBe('mended');
    expect(state.codex).toHaveLength(3);
    expect(state.stats.feeds).toBe(10);
  });
});
