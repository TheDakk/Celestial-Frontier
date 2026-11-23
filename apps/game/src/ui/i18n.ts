/* Strings by source text. Each surface owns one catalogue of the exact English strings it shows: its text and
   its `title`, `aria-label` and `placeholder` attributes. A locale maps a source string to its translation.
   After a surface draws its English content, `localizeElement` walks it once and swaps every catalogued string.
   English is the identity: nothing is walked or rewritten unless another locale is active. A string the locale
   lacks stays English and is reported; a string the catalogue lacks is left as drawn and reported the same way.
   Player data (names, counts, times) is never catalogued: mark the element that holds it `data-l10n-skip`.

   Locales: `en`, and `qps-ploc`, a pseudo-locale (accented, about 40 % longer, bracketed) that shows on sight a
   string that missed the catalogue or a control that clips longer text. The locale comes only from `?locale=`:
   a choice of the device, never of the save. */

export type LocaleId = 'en' | 'qps-ploc';
export const SUPPORTED_LOCALES: readonly LocaleId[] = Object.freeze(['en', 'qps-ploc'] as const);
export function localeFromSearch(search: string): LocaleId {
  const v = new URLSearchParams(search).get('locale');
  return (SUPPORTED_LOCALES as readonly string[]).includes(v ?? '') ? (v as LocaleId) : 'en';
}

export interface StringCatalog {
  readonly surface: string;
  /** The exact English source strings this surface shows. */
  readonly strings: readonly string[];
  /** Translations per locale other than English, keyed by the English source string. */
  readonly locales: Readonly<Partial<Record<Exclude<LocaleId, 'en'>, Readonly<Record<string, string>>>>>;
}

const ACCENTS: Readonly<Record<string, string>> = Object.freeze({ a: 'á', e: 'é', i: 'î', o: 'ö', u: 'ü', c: 'ç', n: 'ñ', s: 'š', y: 'ý', A: 'Å', E: 'É', I: 'Î', O: 'Ö', U: 'Ü', C: 'Ç', N: 'Ñ', S: 'Š', Y: 'Ý' });
export function pseudoLocalize(source: string): string {
  const accented = [...source].map((ch) => ACCENTS[ch] ?? ch).join('');
  const pad = '~'.repeat(Math.max(1, Math.round(source.length * 0.4)));
  return `[${accented} ${pad}]`;
}
export function catalog(surface: string, strings: readonly string[]): StringCatalog {
  if (new Set(strings).size !== strings.length) throw new Error(`i18n: duplicate source string in ${surface}`);
  return Object.freeze({ surface, strings: Object.freeze([...strings]), locales: Object.freeze({ 'qps-ploc': Object.freeze(Object.fromEntries(strings.map((s) => [s, pseudoLocalize(s)]))) }) });
}

/** One string: English is the identity; a missing translation stays English and is reported. */
export function translate(cat: StringCatalog, locale: LocaleId, source: string, warn?: (message: string) => void): string {
  if (locale === 'en') return source;
  const translations = cat.locales[locale];
  const t = translations !== undefined && Object.hasOwn(translations, source) ? translations[source] : undefined;
  if (t === undefined) {
    warn?.(`i18n[${cat.surface}/${locale}]: ${cat.strings.includes(source) ? 'no translation' : 'not in the catalog'} for ${JSON.stringify(source)} — English kept`);
    return source;
  }
  return t;
}

export const LOCALIZED_ATTRIBUTES = Object.freeze(['title', 'aria-label', 'placeholder'] as const);
/** Localizes a drawn surface in place: its text and the three attributes, leaving `data-l10n-skip` subtrees
 *  alone. In English it does nothing. */
export function localizeElement(root: Element, cat: StringCatalog, locale: LocaleId, warn?: (message: string) => void): Readonly<{ translated: number; missing: readonly string[] }> {
  if (locale === 'en') return Object.freeze({ translated: 0, missing: Object.freeze([]) });
  const missing: string[] = [];
  let translated = 0;
  const note = (m: string): void => { missing.push(m); warn?.(m); };
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* text nodes */);
  const texts: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n as Text);
  for (const node of texts) {
    if (node.parentElement?.closest('[data-l10n-skip]')) continue;
    const raw = node.nodeValue ?? '';
    const core = raw.trim();
    if (!core) continue;
    const out = translate(cat, locale, core, note);
    if (out !== core) { node.nodeValue = raw.replace(core, out); translated++; }
  }
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el.closest('[data-l10n-skip]')) continue;
    for (const a of LOCALIZED_ATTRIBUTES) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const out = translate(cat, locale, v, note);
      if (out !== v) { el.setAttribute(a, out); translated++; }
    }
  }
  return Object.freeze({ translated, missing: Object.freeze(missing) });
}
