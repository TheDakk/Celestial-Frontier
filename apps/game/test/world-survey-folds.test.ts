// Ported from SOURCE tests/d18-survey-folds-outcome.test.ts (module SOURCE apps/game/src/survey-card-folds.ts).
// The folded survey card is an option; the default stays the flat card. The card comes back as data: the
// screen builds the elements.
import { describe, expect, it } from 'vitest';
import { devicePreferences } from '../src/platform/preferences';
import {
  SURVEY_FOLD_BITS, SURVEY_FOLD_PREFERENCE, readSurveyFoldPreference, surveyRows, writeSurveyFoldPreference,
  type SurveyCardItem, type SurveyRow,
} from '../src/world';

// SOURCE tests/d18-survey-folds-outcome.test.ts:44
const ROWS: SurveyRow[] = [['Type', 'Terrestrial'], ['Made of', 'Silicate rock'], ['Atmosphere', 'Thin nitrogen'], ['Climate', 'Temperate, wet — seasonal'], ['Water', 'Liquid oceans'],
  ['Gravity', '0.9 g'], ['Magnetism', 'Weak'], ['Life', 'Abundant', 'bio'], ['Civilization', 'Tribal', 'civ'], ['Tech era', 'Bronze', 'civ'], ['Population', '2.1M', 'civ'], ['⟁ Signal', 'Faint']];
const row = (key: string): SurveyRow => ROWS.find(([k]) => k === key)!;
const flat = (rows: readonly SurveyRow[]): SurveyCardItem[] => rows.map((r) => ({ kind: 'row', row: r }));

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m };
}
const refusing = { getItem(): string | null { throw new Error('blocked'); }, setItem(): void { throw new Error('quota'); } };

describe('the folded survey card (an option, flat by default)', () => {
  it('with the folds off the card is the flat rows in order, whatever cardExpand holds; with them on it differs', () => {
    for (const cardExpand of [0, 1, 2, 3, 31]) expect(surveyRows(ROWS, { folds: false, cardExpand })).toEqual(flat(ROWS));
    expect(surveyRows(ROWS, { folds: true, cardExpand: 0 })).not.toEqual(flat(ROWS));
  });

  it('the environment rows fall in the fold of bit 1 and the census rows in the fold of bit 2, each where its first row stood', () => {
    expect(SURVEY_FOLD_BITS).toEqual({ environment: 1, census: 2 }); // SOURCE apps/game/src/survey-card-folds.ts:12
    expect(surveyRows(ROWS, { folds: true, cardExpand: 0 })).toEqual([
      { kind: 'row', row: row('Type') },
      // the digest is the climate's first clause and the gravity line (SOURCE survey-card-folds.ts:39,43)
      { kind: 'fold', bit: 1, title: 'Environment', digest: 'Temperate · 0.9 g', cls: '', headRow: false, open: false,
        rows: ['Made of', 'Atmosphere', 'Climate', 'Water', 'Gravity', 'Magnetism'].map(row) },
      { kind: 'row', row: row('Life') },
      // the census fold is headed by the real Civilization row (SOURCE survey-card-folds.ts:44)
      { kind: 'fold', bit: 2, title: 'Civilization', digest: 'Tribal', cls: 'civ', headRow: true, open: false,
        rows: ['Tech era', 'Population'].map(row) },
      { kind: 'row', row: row('⟁ Signal') },
    ]);
  });

  it('every row survives the fold: nothing is dropped, only grouped', () => {
    const seen: string[] = [];
    for (const item of surveyRows(ROWS, { folds: true, cardExpand: 0 })) {
      if (item.kind === 'row') { seen.push(item.row[0]); continue; }
      if (item.headRow) seen.push(item.title);
      for (const r of item.rows) seen.push(r[0]);
    }
    expect(seen).toEqual(ROWS.map(([k]) => k));
  });

  it('cardExpand bit 1 opens the environment fold and bit 2 the census fold, and no other bit opens either', () => {
    const open = (cardExpand: number) => surveyRows(ROWS, { folds: true, cardExpand })
      .flatMap((item) => (item.kind === 'fold' ? [[item.bit, item.open]] : []));
    expect(open(0)).toEqual([[1, false], [2, false]]);
    expect(open(1)).toEqual([[1, true], [2, false]]);
    expect(open(2)).toEqual([[1, false], [2, true]]);
    expect(open(3)).toEqual([[1, true], [2, true]]);
    expect(open(28)).toEqual([[1, false], [2, false]]);
    expect(open(31)).toEqual([[1, true], [2, true]]);
  });

  it('one environment row alone stays a flat row, and a civilization without census detail stays a flat row', () => {
    const rows: SurveyRow[] = [['Type', 'Gas giant'], ['Gravity', '2.4 g'], ['Civilization', 'None', 'civ']];
    expect(surveyRows(rows, { folds: true, cardExpand: 3 })).toEqual(flat(rows));
    // census detail without a Civilization row has no head to fold under
    const headless: SurveyRow[] = [['Type', 'Rock'], ['Tech era', 'Bronze', 'civ']];
    expect(surveyRows(headless, { folds: true, cardExpand: 3 })).toEqual(flat(headless));
  });

  it('the digest leaves out whichever of climate and gravity is absent', () => {
    const digest = (rows: SurveyRow[]) => surveyRows(rows, { folds: true, cardExpand: 0 })
      .flatMap((item) => (item.kind === 'fold' ? [item.digest] : []));
    expect(digest([['Water', 'Ice'], ['Gravity', '1.2 g']])).toEqual(['1.2 g']);
    expect(digest([['Water', 'Ice'], ['Climate', 'Frozen — polar night']])).toEqual(['Frozen']);
    expect(digest([['Water', 'Ice'], ['Weather', 'Calm']])).toEqual(['']);
  });
});

describe('the survey fold preference of this device', () => {
  it('no stored preference, an unreadable device and any value but "on" all read as off', () => {
    expect(readSurveyFoldPreference(devicePreferences(memoryStorage()))).toBe(false);
    expect(readSurveyFoldPreference(devicePreferences(null))).toBe(false);
    expect(readSurveyFoldPreference(devicePreferences(refusing))).toBe(false);
    for (const value of ['off', 'ON', 'true', '1', '']) {
      const storage = memoryStorage();
      devicePreferences(storage).write(SURVEY_FOLD_PREFERENCE, value);
      expect(readSurveyFoldPreference(devicePreferences(storage))).toBe(false);
    }
  });

  it('a written choice is kept as "on" or "off" and a fresh read of the same device returns it', () => {
    const storage = memoryStorage();
    expect(writeSurveyFoldPreference(devicePreferences(storage), true)).toBe(true);
    // SOURCE apps/game/src/survey-card-folds.ts:8 names the key cf-v2-survey-folds/v1; here the platform adds the prefix
    expect([...storage.m]).toEqual([['cf-v2-pixel/survey-folds/v1', 'on']]);
    expect(readSurveyFoldPreference(devicePreferences(storage))).toBe(true);
    expect(writeSurveyFoldPreference(devicePreferences(storage), false)).toBe(true);
    expect([...storage.m]).toEqual([['cf-v2-pixel/survey-folds/v1', 'off']]);
    expect(readSurveyFoldPreference(devicePreferences(storage))).toBe(false);
  });

  it('a device that refuses the write reports the choice as not kept, and never throws', () => {
    expect(writeSurveyFoldPreference(devicePreferences(refusing), true)).toBe(false);
    expect(writeSurveyFoldPreference(devicePreferences(null), true)).toBe(false);
  });
});
