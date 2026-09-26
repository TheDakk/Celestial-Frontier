/* The folded survey card (D18, Nick 2026-09-25: "an OPTION; the default stays unfolded"). v1.8.9 folded the verbose environment block
   and the civilization census behind remembered toggles (main.js ~11356: ENV_K / CIV_K, `data-gtoggle` 1 and 2, the `cardExpand`
   bitmask). v2 keeps the flat card as the default — the card that uilayout and Codex's Slice/Glass instruments measure — and offers
   the folds behind a Settings switch. The switch describes how this DEVICE reads cards, so it lives in guarded device storage (like
   Mono audio), never in the save; the open/closed memory of each fold reuses the save's existing `cardExpand` bits 1 and 2, exactly
   as v1 did. With the switch off, `surveyRowsHtmlV1` returns the unchanged flat markup, byte for byte. */

export const SURVEY_FOLD_PREFS_KEY = 'cf-v2-survey-folds/v1';
/** v1's environment rows (ENV_K) and census detail rows (CIV_K); the census head is the `Civilization` row. */
export const SURVEY_FOLD_ENV_KEYS: ReadonlySet<string> = new Set(['Made of', 'Atmosphere', 'Climate', 'Water', 'Gravity', 'Magnetism', 'Weather', 'Seasons']);
export const SURVEY_FOLD_CIV_KEYS: ReadonlySet<string> = new Set(['Tech era', 'Local year', 'Population']);
export const SURVEY_FOLD_BITS = Object.freeze({ environment: 1, census: 2 });

export interface SurveyFoldStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }

/** Only the exact string `"on"` enables the folds; absent, unreadable or anything else is the default flat card. */
export function readSurveyFoldPrefV1(storage: SurveyFoldStorage | null | undefined): boolean {
  try { return storage?.getItem(SURVEY_FOLD_PREFS_KEY) === 'on'; } catch { return false; }
}
/** Returns whether the device kept the choice (this session follows it either way). */
export function writeSurveyFoldPrefV1(storage: SurveyFoldStorage | null | undefined, on: boolean): boolean {
  try { if (!storage) return false; storage.setItem(SURVEY_FOLD_PREFS_KEY, on ? 'on' : 'off'); return true; } catch { return false; }
}

export type SurveyRowV1 = readonly [string, string, string?];

/** The survey card's row markup. `folds: false` is the unchanged flat card. With folds, the environment rows become one
 * `Environment` fold (its header keeps the world's character: the climate's first clause and the gravity line, as v1) placed where
 * its first row stood, and a civilization with census detail becomes one fold headed by its `Civilization` row. */
export function surveyRowsHtmlV1(rows: readonly SurveyRowV1[], options: Readonly<{ folds: boolean; cardExpand: number }>, rowHtml: (row: SurveyRowV1) => string, esc: (text: string) => string): string {
  if (!options.folds) return rows.map(rowHtml).join('');
  const env = rows.filter(([k]) => SURVEY_FOLD_ENV_KEYS.has(k)), civDet = rows.filter(([k]) => SURVEY_FOLD_CIV_KEYS.has(k)), civHead = rows.find(([k]) => k === 'Civilization');
  // a header that IS a real row (the census's `Civilization`) keeps that row's `data-row` identity; the Environment header is new
  const fold = (bit: number, title: string, digest: string, body: readonly SurveyRowV1[], cls: string, headRow: boolean): string => {
    const open = (options.cardExpand & bit) !== 0;
    return `<div class="grp${open ? ' open' : ''}" data-grp="${bit}"><div${headRow ? ` data-row="${esc(title)}"` : ''} class="survey-row ghead" data-gtoggle="${bit}" data-cls="${esc(cls)}" role="button" tabindex="0" aria-expanded="${open}">`
      + `<span>${esc(title)}</span><br>${esc(digest)}<span class="chev" aria-hidden="true"></span></div><div class="gbody">${body.map(rowHtml).join('')}</div></div>`;
  };
  const climate = (env.find(([k]) => k === 'Climate')?.[1] ?? '').split(/[,—]/)[0]!.trim(), gravity = env.find(([k]) => k === 'Gravity')?.[1] ?? '';
  let out = '', envDone = false, civDone = false;
  for (const row of rows) {
    const [k] = row;
    if (SURVEY_FOLD_ENV_KEYS.has(k) && env.length > 1) { if (!envDone) { out += fold(SURVEY_FOLD_BITS.environment, 'Environment', [climate, gravity].filter(Boolean).join(' · '), env, '', false); envDone = true; } continue; }
    if (civHead && civDet.length && (k === 'Civilization' || SURVEY_FOLD_CIV_KEYS.has(k))) { if (!civDone) { out += fold(SURVEY_FOLD_BITS.census, civHead[0], civHead[1], civDet, civHead[2] ?? '', true); civDone = true; } continue; }
    out += rowHtml(row);
  }
  return out;
}
