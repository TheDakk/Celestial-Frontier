// The stall counter and the suggestion of the best action available now. No fixture: every expectation is taken
// from the legacy game and cites its line.
import { describe, expect, it } from 'vitest';
import { PROGRESS_EVENTS, STALL_PRESSES, nextBest, stallCounter, type GuidanceCharter, type GuidanceView } from '../src/guidance';

const charter = (id: string): GuidanceCharter => ({ id, title: `Title ${id}`, description: '', count: 1, progress: 0, pays: 10, weekly: false });
/** A trained explorer for whom no suggestion's condition holds but the last. */
const view = (over: Partial<GuidanceView> = {}): GuidanceView => ({
  trained: true, chapter: null, accepted: [], available: [], week: 0, signatures: 0,
  craftable: null, atlasEntries: 0, flora: 0, fauna: 0, ...over,
});

describe('the stall counter', () => {
  it('ten presses with no progress stall, nine do not, a progress event resets', () => {
    // LEGACY main.js:22515 (a press counts), main.js:22598 (ten is a stall), main.js:22901 (progress clears it)
    expect(STALL_PRESSES).toBe(10);
    const counter = stallCounter();
    expect(counter.stalled(true)).toBe(false);
    for (let i = 0; i < 9; i++) counter.press();
    expect(counter.stalled(true)).toBe(false);
    counter.press();
    expect(counter.stalled(true)).toBe(true);
    counter.press();
    expect(counter.stalled(true)).toBe(true);
    counter.progress();
    expect(counter.stalled(true)).toBe(false);
    for (let i = 0; i < 9; i++) counter.press();
    expect(counter.stalled(true)).toBe(false);
  });
  it('with no objective the suggestion shows at once', () => {
    // LEGACY main.js:22564
    const counter = stallCounter();
    expect(counter.stalled(false)).toBe(true);
    counter.progress();
    expect(counter.stalled(false)).toBe(true);
  });
  it('two counters do not share their presses', () => {
    const a = stallCounter(), b = stallCounter();
    for (let i = 0; i < 10; i++) a.press();
    expect([a.stalled(true), b.stalled(true)]).toEqual([true, false]);
  });
  it('the events that count as progress are the legacy game\'s', () => {
    // LEGACY main.js:22867-22868
    expect([...PROGRESS_EVENTS]).toEqual(['survey', 'landfall', 'fed', 'bred', 'crafted', 'atlas-add', 'conquest',
      'specimen', 'searched', 'healed', 'mined', 'skimmed', 'tray', 'duel-done', 'chaccept', 'ascent-chapter']);
  });
});

describe('the best action available now', () => {
  // Each view satisfies its own condition and those of every later suggestion it can, so the order is what is tested.
  const all = { available: [charter('st-land')], craftable: 'Iron Plate', atlasEntries: 2, flora: 0, fauna: 0 };

  it('1: accept a charter that waits, while fewer than three are accepted', () => {
    // LEGACY main.js:22877-22878
    expect(nextBest(view(all))).toEqual({ text: 'Accept a charter — Title st-land', opens: 'charters' });
    const two = [charter('a'), charter('b')];
    expect(nextBest(view({ ...all, accepted: two }))).toMatchObject({ opens: 'charters' });
    expect(nextBest(view({ ...all, accepted: [...two, charter('c')] }))).toMatchObject({ opens: 'engineering' });
  });
  it('2: craft what can be afforded', () => {
    // LEGACY main.js:22880-22883
    expect(nextBest(view({ ...all, available: [] }))).toEqual({ text: 'Craft Iron Plate at the Shipyard', opens: 'engineering' });
  });
  it('3: with an Atlas entry and no flora, land and scavenge', () => {
    // LEGACY main.js:22888-22889
    expect(nextBest(view({ atlasEntries: 1, flora: 0, fauna: 0 }))).toEqual({ text: 'Land on a living world and Scavenge for flora', opens: 'atlas' });
  });
  it('3: with an Atlas entry, flora and fewer than two fauna, land and discover life', () => {
    // LEGACY main.js:22890
    expect(nextBest(view({ atlasEntries: 1, flora: 1, fauna: 1 }))).toEqual({ text: 'Land on a living world and Discover Life', opens: 'atlas' });
  });
  it('4: with an Atlas entry and the catalogue begun, travel from the Atlas', () => {
    // LEGACY main.js:22893
    expect(nextBest(view({ atlasEntries: 1, flora: 1, fauna: 2 }))).toEqual({ text: 'Travel from your Star Atlas', opens: 'atlas' });
  });
  it('5: with an empty Atlas, survey and land, whatever the catalogue holds', () => {
    // LEGACY main.js:22888-22897: the catalogue gaps are not suggested with nothing in the Atlas
    expect(nextBest(view())).toEqual({ text: 'Survey a world and press Land', opens: 'map' });
    expect(nextBest(view({ flora: 3, fauna: 5 }))).toEqual({ text: 'Survey a world and press Land', opens: 'map' });
  });
  it('nothing is suggested in training', () => {
    // LEGACY main.js:22873
    expect(nextBest(view({ ...all, trained: false }))).toBeNull();
  });
});
