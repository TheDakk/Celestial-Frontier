// Renaming a species of the Compendium.
// LEGACY celestial-frontier.html v1.8.9: `askRenameSpecies` 24591-24602, `commitExplorerName` 24615-24626,
// `cleanName` 15732 (the characters < > & " ' are dropped, the ends trimmed, 24 characters kept).
import { describe, expect, it } from 'vitest';
import { carePage, earthId, heldPage } from './care-support';
import { dump } from './save-support';

describe('renaming a species', () => {
  // The 24 characters kept end in a space here; the save's reader trims it, so it is trimmed before it is stored.
  it('stores the cleaned name on the page and in the names, unlocks namer, and the carrier agrees', async () => {
    const page = await carePage({ held: [heldPage(11), heldPage(12)] });
    const other = page.durable().codex.find(([id]) => id === earthId(12))?.[1].name;
    const outcome = await page.rename(earthId(11), '  <Rex> the "Bold" & very long name indeed  ');
    expect(outcome).toMatchObject({ kind: 'committed', facts: { speciesId: earthId(11), name: 'Rex the Bold  very long' } });
    const state = page.durable();
    expect(state.codex.find(([id]) => id === earthId(11))?.[1].name).toBe('Rex the Bold  very long');
    expect(state.customNames).toEqual([[`c${earthId(11)}`, 'Rex the Bold  very long']]);
    expect(state.unlocked).toContain('namer');
    expect(state.codex.find(([id]) => id === earthId(12))?.[1].name).toBe(other);
    expect(page.live.customNames).toEqual(state.customNames);
    expect(page.carrierAgrees()).toBe(true);
    expect(page.outcomes.committed).toEqual([{ kind: 'rename', receiptOrdinal: 0 }]);
  });

  it('a name of 24 characters is kept whole and one of 25 loses its last', async () => {
    const page = await carePage({ held: [heldPage(11)] });
    await page.rename(earthId(11), 'abcdefghijklmnopqrstuvwx');
    expect(page.durable().customNames[0]?.[1]).toBe('abcdefghijklmnopqrstuvwx');
    await page.rename(earthId(11), 'abcdefghijklmnopqrstuvwxy');
    expect(page.durable().customNames).toEqual([[`c${earthId(11)}`, 'abcdefghijklmnopqrstuvwx']]);
  });

  it('a name with nothing left after cleaning changes nothing and takes no receipt', async () => {
    const page = await carePage({ held: [heldPage(11)] });
    const before = await dump(page.backend);
    expect(await page.rename(earthId(11), ' <>&"\' ')).toEqual({ kind: 'current', reason: 'empty' });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.outcomes.refused).toEqual([]);
  });

  it('a plant can be renamed, and a second name replaces the first', async () => {
    const page = await carePage({ held: [heldPage(0), heldPage(11)] });
    expect(await page.rename(earthId(0), 'Old Oak')).toMatchObject({ kind: 'committed' });
    expect(await page.rename(earthId(0), 'Older Oak')).toMatchObject({ kind: 'committed', facts: { name: 'Older Oak' } });
    expect(page.durable().customNames).toEqual([[`c${earthId(0)}`, 'Older Oak']]);
    expect(page.durable().codex.find(([id]) => id === earthId(0))?.[1].name).toBe('Older Oak');
    expect(await page.rename(earthId(0), 'Older Oak')).toEqual({ kind: 'current', reason: 'unchanged' });
    expect(page.carrierAgrees()).toBe(true);
  });

  it('the names of worlds are kept, and the fifth name of all unlocks names5', async () => {
    const places: Array<[string, string]> = [['p1', 'One'], ['p2', 'Two'], ['p3', 'Three'], ['p4', 'Four']];
    const page = await carePage({ held: [heldPage(11)], change: (state) => { state.customNames = places.map(([key, name]) => [key, name]); } });
    await page.rename(earthId(11), 'Five');
    expect(page.durable().customNames).toEqual([...places, [`c${earthId(11)}`, 'Five']]);
    expect(page.durable().unlocked).toEqual(expect.arrayContaining(['namer', 'names5']));
  });

  it('a species the Compendium does not hold is refused, and nothing is written', async () => {
    const page = await carePage({ held: [heldPage(11)] });
    const before = await dump(page.backend);
    expect(await page.rename(earthId(12), 'Ghost')).toMatchObject({ kind: 'refused', detail: 'not-in-compendium' });
    expect(await dump(page.backend)).toEqual(before);
  });
});
