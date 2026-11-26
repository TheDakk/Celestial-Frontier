// Naming a Field Scout, and the lesson a new species teaches it.
// LEGACY celestial-frontier.html v1.8.9: the Scout button 15150 and its press 15197-15204; `discoverSpecies` 14942;
// `awardXP` 18224-18234.
import { describe, expect, it } from 'vitest';
import { carePage, earthId, heldPage } from './care-support';
import { capturePage, captureSession } from './capture-support';
import { dump } from './save-support';

describe('the Field Scout', () => {
  it('a press names a beast of the Compendium the scout; a press on the scout stands it down', async () => {
    const page = await carePage({ held: [heldPage(11), heldPage(12)] });
    const named = await page.scout(earthId(11));
    expect(named).toMatchObject({ kind: 'committed', facts: { scoutBefore: null, scoutAfter: earthId(11), named: true } });
    expect(page.durable().scoutId).toBe(earthId(11));
    expect(page.live.scoutId).toBe(earthId(11));
    expect(page.carrierAgrees()).toBe(true);
    const other = await page.scout(earthId(12));
    expect(other).toMatchObject({ kind: 'committed', facts: { scoutBefore: earthId(11), scoutAfter: earthId(12), named: true } });
    const stood = await page.scout(earthId(12));
    expect(stood).toMatchObject({ kind: 'committed', facts: { scoutBefore: earthId(12), scoutAfter: null, named: false } });
    expect(page.durable().scoutId).toBeNull();
    expect(page.carrierAgrees()).toBe(true);
    expect(await page.receipts()).toHaveLength(3);
    expect(page.outcomes.committed.map(({ kind }) => kind)).toEqual(['scout', 'scout', 'scout']);
  });

  it('a plant and a species the Compendium does not hold cannot be named: nothing is written', async () => {
    const page = await carePage({ held: [heldPage(11), heldPage(0)] });
    const before = await dump(page.backend);
    expect(await page.scout(earthId(0))).toMatchObject({ kind: 'refused', detail: 'not-a-beast' });
    expect(await page.scout(earthId(13))).toMatchObject({ kind: 'refused', detail: 'not-in-compendium' });
    expect(await dump(page.backend)).toEqual(before);
  });

  it('naming a scout moves the accepted Charter; standing one down moves none', async () => {
    const page = await carePage({ held: [heldPage(11)], change: (state) => { state.chacc = ['st-scout']; } });
    const named = await page.scout(earthId(11));
    expect(named).toMatchObject({ kind: 'committed', facts: { charters: { progressIds: ['st-scout'], completedIds: ['st-scout'] } } });
    expect(page.durable().chDone).toContain('st-scout');

    const standing = await carePage({ held: [heldPage(11)], scout: earthId(11), change: (state) => { state.chacc = ['st-scout']; } });
    const down = await standing.scout(earthId(11));
    expect(down).toMatchObject({ kind: 'committed', facts: { scoutAfter: null, charters: { progressIds: [], completedIds: [] } } });
    expect(standing.durable().chDone).toEqual([]);
  });
});

describe('the scout\'s lesson at a capture', () => {
  const hit = captureSession((success) => success < 0.01);
  const miss = captureSession((success) => success > 0.99);

  it('a newly catalogued species teaches the standing scout 2', async () => {
    const page = await capturePage({ sessionSeed: hit, change: (state) => { state.codex = [heldPage(11, { xp: 4 })]; state.scoutId = earthId(11); } });
    const outcome = await page.press('tame');
    expect(outcome).toMatchObject({ kind: 'committed', facts: { hit: true, scoutXp: 6 } });
    expect(page.durable().codex.find(([id]) => id === earthId(11))?.[1].g.xp).toBe(6);
    expect(page.durable().codex).toHaveLength(2);
  });

  it('a scout with no experience yet holds 2 after its first lesson', async () => {
    const page = await capturePage({ sessionSeed: hit, change: (state) => { state.codex = [heldPage(11)]; state.scoutId = earthId(11); } });
    await page.press('scavenge');
    expect(page.durable().codex.find(([id]) => id === earthId(11))?.[1].g.xp).toBe(2);
  });

  it('a miss teaches nothing, and with no scout standing nobody learns', async () => {
    const missed = await capturePage({ sessionSeed: miss, change: (state) => { state.codex = [heldPage(11, { xp: 4 })]; state.scoutId = earthId(11); } });
    expect(await missed.press('tame')).toMatchObject({ kind: 'committed', facts: { hit: false, scoutXp: null } });
    expect(missed.durable().codex.find(([id]) => id === earthId(11))?.[1].g.xp).toBe(4);
    const alone = await capturePage({ sessionSeed: hit, change: (state) => { state.codex = [heldPage(11, { xp: 4 })]; } });
    expect(await alone.press('tame')).toMatchObject({ kind: 'committed', facts: { hit: true, scoutXp: null } });
    expect(alone.durable().codex.find(([id]) => id === earthId(11))?.[1].g.xp).toBe(4);
  });

  it('experience stops at 486, where the last level is reached', async () => {
    const page = await capturePage({ sessionSeed: hit, change: (state) => { state.codex = [heldPage(11, { xp: 485 })]; state.scoutId = earthId(11); } });
    await page.press('tame');
    expect(page.durable().codex.find(([id]) => id === earthId(11))?.[1].g.xp).toBe(486);
  });
});
