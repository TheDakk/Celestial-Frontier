// The survey card's folds follow the legacy game (LEGACY: celestial-frontier.html of the live branch, version 1.8.9,
// 13813-13896 and 13994); each rule cites its line there. The card comes back as data: the screen builds the elements.
import { describe, expect, it } from 'vitest';
import * as world from '../src/world';
import { SURVEY_FOLD_BITS, surveyRows, type SurveyCardItem, type SurveyRow } from '../src/world';

const ROWS: SurveyRow[] = [['Type', 'Terrestrial'], ['Made of', 'Silicate rock'], ['Atmosphere', 'Thin nitrogen'], ['Climate', 'Temperate, wet — seasonal'], ['Water', 'Liquid oceans'],
  ['Gravity', '0.9 g'], ['Magnetism', 'Weak'], ['Life', 'Abundant', 'bio'], ['Civilization', 'Tribal', 'civ'], ['Tech era', 'Bronze', 'civ'], ['Population', '2.1M', 'civ'], ['⟁ Signal', 'Faint']];
const row = (key: string): SurveyRow => ROWS.find(([k]) => k === key)!;
const plain = (key: string): SurveyCardItem => ({ kind: 'row', row: row(key) });
const LANDED = { grounded: true, known: true, cardExpand: 0 } as const;

describe('the survey card folds, as in the legacy game', () => {
  it('the folds are not an option: there is no switch and no device preference for them', () => {
    // LEGACY 13864-13894: the card always folds; nothing in the legacy game turns the folds off.
    expect(Object.keys(world).filter((name) => /preference/i.test(name))).toEqual([]);
  });

  it('on the ground: the plain rows in order, then the Environment fold; the census fold and the signal read below the life roster', () => {
    expect(SURVEY_FOLD_BITS).toEqual({ environment: 1, census: 2 }); // LEGACY 13875, 13889
    expect(surveyRows(ROWS, LANDED)).toEqual({
      rows: [
        plain('Type'), plain('Life'),
        // LEGACY 13864-13879: after the plain rows; the header keeps the climate's first clause and the gravity line
        { kind: 'fold', bit: 1, title: 'Environment', digest: 'Temperate · 0.9 g', cls: '', headRow: false, open: false,
          rows: ['Made of', 'Atmosphere', 'Climate', 'Water', 'Gravity', 'Magnetism'].map(row) },
      ],
      // LEGACY 13888-13896 and 13994: "civilization (+ Signal) reads below the life roster"
      below: [
        { kind: 'fold', bit: 2, title: 'Civilization', digest: 'Tribal', cls: 'civ', headRow: true, open: false, rows: ['Tech era', 'Population'].map(row) },
        plain('⟁ Signal'),
      ],
    });
  });

  it('both folds start closed; bit 1 opens the environment fold and bit 2 the census fold, and no other bit opens either', () => {
    // LEGACY 13119 (cardExpand starts at 0), 13875, 13889.
    const open = (cardExpand: number) => { const card = surveyRows(ROWS, { ...LANDED, cardExpand });
      return [...card.rows, ...card.below].flatMap((item) => (item.kind === 'fold' ? [[item.bit, item.open]] : [])); };
    expect(open(0)).toEqual([[1, false], [2, false]]);
    expect(open(1)).toEqual([[1, true], [2, false]]);
    expect(open(2)).toEqual([[1, false], [2, true]]);
    expect(open(3)).toEqual([[1, true], [2, true]]);
    expect(open(28)).toEqual([[1, false], [2, false]]);
  });

  it('from orbit the environment is one summary line that says to land', () => {
    // LEGACY 13869-13873.
    expect(surveyRows(ROWS, { ...LANDED, grounded: false }).rows).toEqual([
      plain('Type'), plain('Life'),
      { kind: 'summary', title: 'Environment', digest: 'Temperate · 0.9 g', hint: '— land for the full survey' },
    ]);
  });

  it('before contact a civilization is one line that says to land; the census is not shown', () => {
    // LEGACY 13883-13887.
    expect(surveyRows(ROWS, { ...LANDED, known: false }).below).toEqual([
      { kind: 'row', row: ['Civilization', 'Signals from an organized world — land to make contact', 'civ'] },
      plain('⟁ Signal'),
    ]);
  });

  it('one environment row alone still folds; a wilderness stays one line; census rows with no head are not shown', () => {
    // LEGACY 13864 (any environment row folds), 13894 (wilderness), 13882 (no head, no census).
    const giant: SurveyRow[] = [['Type', 'Gas giant'], ['Gravity', '2.4 g'], ['Civilization', 'None', 'civ']];
    expect(surveyRows(giant, { ...LANDED, known: false })).toEqual({
      rows: [{ kind: 'row', row: giant[0] }, { kind: 'fold', bit: 1, title: 'Environment', digest: '2.4 g', cls: '', headRow: false, open: false, rows: [giant[1]] }],
      below: [{ kind: 'row', row: giant[2] }],
    });
    const headless: SurveyRow[] = [['Type', 'Rock'], ['Tech era', 'Bronze', 'civ']];
    expect(surveyRows(headless, LANDED)).toEqual({ rows: [{ kind: 'row', row: headless[0] }], below: [] });
  });

  it('species rows are left to the life roster', () => {
    // LEGACY 13817.
    const earth: SurveyRow[] = [['Type', 'Terrestrial'], ['Fauna', 'Red Fox — a hunter', 'bio', 'sp:7']];
    expect(surveyRows(earth, LANDED)).toEqual({ rows: [{ kind: 'row', row: earth[0] }], below: [] });
  });

  it('the digest leaves out whichever of climate and gravity is absent', () => {
    // LEGACY 13867-13868.
    const digest = (rows: SurveyRow[]) => surveyRows(rows, LANDED).rows.flatMap((item) => (item.kind === 'fold' ? [item.digest] : []));
    expect(digest([['Water', 'Ice'], ['Gravity', '1.2 g']])).toEqual(['1.2 g']);
    expect(digest([['Water', 'Ice'], ['Climate', 'Frozen — polar night']])).toEqual(['Frozen']);
    expect(digest([['Water', 'Ice'], ['Weather', 'Calm']])).toEqual(['']);
  });
});
