/** @module i18n [app] — A6 localization scaffolding (ledger A6: "strings extracted, one locale proven").
 *
 * PATTERN (source-string catalogs, gettext-style): each UI surface owns ONE catalog of its exact English source strings — visible text and
 * the `title` / `aria-label` / `placeholder` attributes its markup renders. A locale maps a source string to its translation. After the
 * surface renders its (unchanged, English) markup, `localizeElementV1` walks it once and swaps every catalogued string for the active
 * locale's. English is the identity, so the default game is byte-identical by construction: nothing is walked or rewritten unless a
 * non-English locale is active. A string the locale lacks FALLS BACK to English and reports a warning (dev only); a string the catalog
 * lacks is left as rendered and reported the same way, so an unextracted string can never be silently mistranslated.
 *
 * Extending to another surface: (1) collect its rendered strings (the Settings test shows how: render the exact shipped code in JSDOM for
 * every state and walk text + the three attributes); (2) add a `<SURFACE>_CATALOG_V1` here with those strings; (3) register the localizer
 * for its panel (`setPanelLocalizerV1` in panels.ts) or call `localizeElementV1` after the surface renders; (4) copy the Settings tests —
 * catalog completeness in both directions, byte-identical English, a structurally identical pseudo-locale render with every control still
 * working. Player data (names, counts, numbers) is never catalogued; mark an element whose text is data with `data-l10n-skip`.
 *
 * Locales today: `en` (identity) and `qps-ploc`, a PSEUDO-locale (accented and ~40 % expanded, bracketed) that proves a surface survives
 * longer text and that every string passes through the catalog. The active locale comes only from `?locale=` (a device/dev choice; never
 * the save, never gameplay). */

export type LocaleIdV1 = 'en' | 'qps-ploc';
export const SUPPORTED_LOCALES_V1: readonly LocaleIdV1[] = Object.freeze(['en', 'qps-ploc'] as const);
export function localeFromSearchV1(search: string): LocaleIdV1 {
  const v = new URLSearchParams(search).get('locale');
  return (SUPPORTED_LOCALES_V1 as readonly string[]).includes(v ?? '') ? (v as LocaleIdV1) : 'en';
}

export interface StringCatalogV1 {
  readonly surface: string;
  /** The exact English source strings this surface renders (text and the localized attributes). */
  readonly strings: readonly string[];
  /** Translations per non-English locale, keyed by the English source string. */
  readonly locales: Readonly<Partial<Record<Exclude<LocaleIdV1, 'en'>, Readonly<Record<string, string>>>>>;
}

const ACCENTS: Readonly<Record<string, string>> = Object.freeze({ a: 'á', e: 'é', i: 'î', o: 'ö', u: 'ü', c: 'ç', n: 'ñ', s: 'š', y: 'ý', A: 'Å', E: 'É', I: 'Î', O: 'Ö', U: 'Ü', C: 'Ç', N: 'Ñ', S: 'Š', Y: 'Ý' });
/** The pseudo-locale: every letter accented, ~40 % longer, bracketed — so a missed string or a clipped control is obvious on sight. */
export function pseudoLocalizeV1(source: string): string {
  const accented = [...source].map((ch) => ACCENTS[ch] ?? ch).join('');
  const pad = '~'.repeat(Math.max(1, Math.round(source.length * 0.4)));
  return `[${accented} ${pad}]`;
}
function catalog(surface: string, strings: readonly string[]): StringCatalogV1 {
  if (new Set(strings).size !== strings.length) throw new Error(`i18n: duplicate source string in ${surface}`);
  return Object.freeze({ surface, strings: Object.freeze([...strings]), locales: Object.freeze({ 'qps-ploc': Object.freeze(Object.fromEntries(strings.map((s) => [s, pseudoLocalizeV1(s)]))) }) });
}

/** SETTINGS (main.ts `fillSettings`): every string its own template renders, in render order. The explorer-name and nameplate rows are
 * rendered by their own owners (arc9-explorer-name / arc9-nameplate) and are the next surfaces to extract. */
export const SETTINGS_CATALOG_V1: StringCatalogV1 = catalog('settings', [
  'Settings',
  'Sound', 'On', 'Off', 'Volume', 'Sound volume',
  'Creature voices',
  'Pop-up notifications', 'Off keeps every message in the 🔔 tray without popping it up (creature sounds still show their card).',
  'Tooltips', 'Short hints: hover on a computer, press and hold on a phone.',
  'Confirm salvage', 'Confirm before salvaging', 'Ask before breaking gear down into parts.',
  'Battle sounds', 'Hits, dodges and effects in battles (creature voices have their own switch).',
  'Folded survey card', 'Fold the environment and census rows of the survey card behind remembered toggles',
  'Mono audio', 'Both ears hear every sound (one earbud, one speaker). Saved on this device.',
  'Reduced intensity', 'Quieter, gentler sound with no sudden loud peaks. Saved on this device.',
  'Text size', 'A', 'A+', 'A++',
  'Text tone', 'Soft', 'Bright', 'Max',
  'Font', 'Rounded', 'System', 'Mono',
  'Star charts', 'Visual effects', 'Screen shake',
  'Motion', 'Auto', 'Full', 'Reduced',
  'Panel tint',
  'Field Training', 'Restart',
  'Reset expedition', 'Reset…', 'Confirm expedition reset',
  'Erase this whole expedition — discoveries, companions, Charters and Stardust — and start over? This cannot be undone.',
  'Erase and start over', 'Cancel',
]);

/** One string: English is the identity; a missing translation falls back to English and warns. */
export function translateV1(cat: StringCatalogV1, locale: LocaleIdV1, source: string, warn?: (message: string) => void): string {
  if (locale === 'en') return source;
  const t = cat.locales[locale]?.[source];
  if (t === undefined) { warn?.(`i18n[${cat.surface}/${locale}]: ${cat.strings.includes(source) ? 'no translation' : 'not in the catalog'} for ${JSON.stringify(source)} — English kept`); return source; }
  return t;
}

export const LOCALIZED_ATTRIBUTES_V1 = Object.freeze(['title', 'aria-label', 'placeholder'] as const);
/** Localizes a rendered surface in place (text nodes + the three attributes; `data-l10n-skip` subtrees untouched). English: a no-op. */
export function localizeElementV1(root: Element, cat: StringCatalogV1, locale: LocaleIdV1, warn?: (message: string) => void): Readonly<{ translated: number; missing: readonly string[] }> {
  if (locale === 'en') return Object.freeze({ translated: 0, missing: Object.freeze([]) });
  const missing: string[] = []; let translated = 0;
  const note = (m: string) => { missing.push(m); warn?.(m); };
  const doc = root.ownerDocument, walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const skipped = (n: Node) => !!(n.parentElement?.closest('[data-l10n-skip]'));
  const texts: Text[] = []; for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n as Text);
  for (const node of texts) {
    if (skipped(node)) continue;
    const raw = node.nodeValue ?? '', core = raw.trim(); if (!core) continue;
    const out = translateV1(cat, locale, core, note); if (out !== core) { node.nodeValue = raw.replace(core, out); translated++; }
  }
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el.closest('[data-l10n-skip]')) continue;
    for (const a of LOCALIZED_ATTRIBUTES_V1) { const v = el.getAttribute(a); if (!v) continue; const out = translateV1(cat, locale, v, note); if (out !== v) { el.setAttribute(a, out); translated++; } }
  }
  return Object.freeze({ translated, missing: Object.freeze(missing) });
}
