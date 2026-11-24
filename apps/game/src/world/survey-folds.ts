import type { DevicePreferences } from '../platform/preferences';

/* The folded survey card is an option; the default stays the flat card. The switch describes how this device
   reads cards, so it is a device preference and never part of the save. Whether each fold is open is kept in
   the save's `cardExpand` bits 1 and 2. */

/** The device preference that holds the switch: `on` or `off`. */
export const SURVEY_FOLD_PREFERENCE = 'survey-folds/v1';
/** The environment rows, and the census detail rows; the census is headed by the `Civilization` row. */
const ENVIRONMENT_KEYS: ReadonlySet<string> = new Set(['Made of', 'Atmosphere', 'Climate', 'Water', 'Gravity', 'Magnetism', 'Weather', 'Seasons']);
const CENSUS_KEYS: ReadonlySet<string> = new Set(['Tech era', 'Local year', 'Population']);
export const SURVEY_FOLD_BITS = Object.freeze({ environment: 1, census: 2 } as const);

/** Only the exact value `on` turns the folds on; absent, unreadable or anything else is the flat card. */
export function readSurveyFoldPreference(preferences: DevicePreferences): boolean {
  return preferences.read(SURVEY_FOLD_PREFERENCE) === 'on';
}
/** Whether the device kept the choice (this session follows it either way). */
export function writeSurveyFoldPreference(preferences: DevicePreferences, on: boolean): boolean {
  return preferences.write(SURVEY_FOLD_PREFERENCE, on ? 'on' : 'off');
}

/** A row of the survey card: its key, its value and an optional class. */
export type SurveyRow = readonly [string, string, string?];

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
export type SurveyCardItem = { readonly kind: 'row'; readonly row: SurveyRow } | SurveyFold;

/** The survey card's rows, in the order they are shown. `folds: false` is the flat card. With folds, the
 *  environment rows become one `Environment` fold (its header keeps the world's character: the climate's first
 *  clause and the gravity line) placed where its first row stood, and a civilization with census detail
 *  becomes one fold headed by its `Civilization` row. */
export function surveyRows(rows: readonly SurveyRow[], options: Readonly<{ folds: boolean; cardExpand: number }>): readonly SurveyCardItem[] {
  if (!options.folds) return rows.map((row) => ({ kind: 'row', row }));
  const environment = rows.filter(([k]) => ENVIRONMENT_KEYS.has(k));
  const census = rows.filter(([k]) => CENSUS_KEYS.has(k));
  const censusHead = rows.find(([k]) => k === 'Civilization');
  const fold = (bit: 1 | 2, title: string, digest: string, body: readonly SurveyRow[], cls: string, headRow: boolean): SurveyFold =>
    ({ kind: 'fold', bit, title, digest, cls, headRow, open: (options.cardExpand & bit) !== 0, rows: body });
  const climate = (environment.find(([k]) => k === 'Climate')?.[1] ?? '').split(/[,—]/)[0]!.trim();
  const gravity = environment.find(([k]) => k === 'Gravity')?.[1] ?? '';
  const out: SurveyCardItem[] = [];
  let environmentDone = false;
  let censusDone = false;
  for (const row of rows) {
    const [k] = row;
    if (ENVIRONMENT_KEYS.has(k) && environment.length > 1) {
      if (!environmentDone) out.push(fold(SURVEY_FOLD_BITS.environment, 'Environment', [climate, gravity].filter(Boolean).join(' · '), environment, '', false));
      environmentDone = true;
      continue;
    }
    if (censusHead && census.length > 0 && (k === 'Civilization' || CENSUS_KEYS.has(k))) {
      if (!censusDone) out.push(fold(SURVEY_FOLD_BITS.census, censusHead[0], censusHead[1], census, censusHead[2] ?? '', true));
      censusDone = true;
      continue;
    }
    out.push({ kind: 'row', row });
  }
  return out;
}
