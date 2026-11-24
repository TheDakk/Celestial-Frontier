/* The survey card's rows and folds, as the legacy game lays them out
   (celestial-frontier.html of the live branch, 13813-13896 and 13994).

   The card always folds: there is no switch. Whether each fold is open is kept
   in the save's `cardExpand`, bits 1 and 2, and both start closed. This owns
   the surveyed card only; the telescope's glance card, the hidden grade and the
   biome line are the card builder's (legacy 13822-13862). */

/** The environment rows, and the census detail rows; the census is headed by the `Civilization` row. */
const ENVIRONMENT_KEYS: ReadonlySet<string> = new Set(['Made of', 'Atmosphere', 'Climate', 'Water', 'Gravity', 'Magnetism', 'Weather', 'Seasons']);
const CENSUS_KEYS: ReadonlySet<string> = new Set(['Tech era', 'Local year', 'Population']);
export const SURVEY_FOLD_BITS = Object.freeze({ environment: 1, census: 2 } as const);

/** A row of the survey card: its key, its value, an optional class and an optional tag (`sp:` marks a species). */
export type SurveyRow = readonly [string, string, string?, string?];

export interface SurveyFold {
  readonly kind: 'fold';
  /** The bit of the save's `cardExpand` that remembers whether this fold is open. */
  readonly bit: 1 | 2;
  readonly title: string;
  readonly digest: string;
  readonly cls: string;
  /** True when the header is itself a real row of the card (the census's `Civilization` row). */
  readonly headRow: boolean;
  readonly open: boolean;
  readonly rows: readonly SurveyRow[];
}
/** The environment read from orbit: the fold's header line and the word to land, nothing to open. */
export interface SurveySummary {
  readonly kind: 'summary';
  readonly title: string;
  readonly digest: string;
  readonly hint: string;
}
export type SurveyCardItem = { readonly kind: 'row'; readonly row: SurveyRow } | SurveyFold | SurveySummary;

export interface SurveyCard {
  /** The plain rows in their order, then the environment. */
  readonly rows: readonly SurveyCardItem[];
  /** The civilization and the signal: they read below the life roster. */
  readonly below: readonly SurveyCardItem[];
}

/** The surveyed card. `grounded`: the explorer stands on the world. `known`: its people have been met (home, a
 *  conquered world, or a successful first contact). */
export function surveyRows(rows: readonly SurveyRow[], options: Readonly<{ grounded: boolean; known: boolean; cardExpand: number }>): SurveyCard {
  const environment: SurveyRow[] = [];
  const census: SurveyRow[] = [];
  let censusHead: SurveyRow | null = null;
  let signal: SurveyRow | null = null;
  const out: SurveyCardItem[] = [];
  for (const row of rows) {
    const [k] = row;
    if (row[3]?.startsWith('sp:')) continue;
    if (ENVIRONMENT_KEYS.has(k)) environment.push(row);
    else if (CENSUS_KEYS.has(k)) census.push(row);
    else if (k === 'Civilization') censusHead = row;
    else if (k === '⟁ Signal') signal = row;
    else out.push({ kind: 'row', row });
  }
  const fold = (bit: 1 | 2, title: string, digest: string, body: readonly SurveyRow[], cls: string, headRow: boolean): SurveyFold =>
    ({ kind: 'fold', bit, title, digest, cls, headRow, open: (options.cardExpand & bit) !== 0, rows: body });
  if (environment.length > 0) {
    const climate = (environment.find(([k]) => k === 'Climate')?.[1] ?? '').split(/[,—]/)[0]!.trim();
    const gravity = environment.find(([k]) => k === 'Gravity')?.[1] ?? '';
    const digest = [climate, gravity].filter(Boolean).join(' · ');
    out.push(options.grounded
      ? fold(SURVEY_FOLD_BITS.environment, 'Environment', digest, environment, '', false)
      : { kind: 'summary', title: 'Environment', digest, hint: '— land for the full survey' });
  }
  const below: SurveyCardItem[] = [];
  if (censusHead !== null) {
    if (!options.known && !/^None/.test(censusHead[1])) {
      below.push({ kind: 'row', row: [censusHead[0], 'Signals from an organized world — land to make contact', 'civ'] });
    } else if (census.length > 0) {
      below.push(fold(SURVEY_FOLD_BITS.census, censusHead[0], censusHead[1], census, censusHead[2] ?? '', true));
    } else below.push({ kind: 'row', row: censusHead });
  }
  if (signal !== null) below.push({ kind: 'row', row: signal });
  return { rows: out, below };
}
