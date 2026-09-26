/* A6 localization scaffolding — Settings, the first extracted surface (i18n.ts). The EXACT shipped `fillSettings` is rendered in JSDOM for
 * its states (the D18/A5 harness pattern) and checked:
 * 1. the catalog is COMPLETE in both directions (every rendered string is catalogued; every catalogued string is rendered) — control: a
 *    catalog missing one string is caught;
 * 2. English is BYTE-IDENTICAL: localizing to `en` changes nothing, and Main registers a localizer only for a non-English `?locale=`;
 * 3. the pseudo-locale (accented, ~40 % longer) translates every string, leaves the markup STRUCTURALLY identical (same elements, ids,
 *    data-sel, pressed states, classes), and the controls still work (a press on the localized Folded survey card switch lands);
 * 4. a missing translation or an uncatalogued string falls back to English with a warning.
 * JSDOM cannot lay out text: pixel fit of the longer strings is for the real-browser uilayout run with `?locale=qps-ploc` (README). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { LOCALIZED_ATTRIBUTES_V1, localeFromSearchV1, localizeElementV1, pseudoLocalizeV1, SETTINGS_CATALOG_V1, translateV1, type StringCatalogV1 } from '../apps/game/src/i18n.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const PANELS = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'panels.ts'), 'utf8');
const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (h: string) => { window: Window & typeof globalThis & { close(): void } } };
function section(start: string, end: string): string {
  if (MAIN.split(start).length !== 2) throw new Error(`anchor must be unique: ${start}`);
  const l = MAIN.indexOf(start), r = MAIN.indexOf(end, l + start.length); if (r <= l) throw new Error(`section missing: ${start}`); return MAIN.slice(l, r);
}
const SETTINGS = (): string => section('function fillSettings(): void {', '\n/* ---- GUIDE + RELEASE HISTORY');
const STATES = [false, true];
/** Renders the exact shipped Settings for one on/off state; returns the live DOM (caller closes it). */
function renderSettings(on: boolean, extra: Record<string, unknown> = {}) {
  const dom = new JSDOM('<!doctype html><html><body><aside id="setpanel"></aside></body></html>'), doc = dom.window.document;
  const save = { sndOn: on, sfxVol: 0.5, voiceOn: on, notifOn: on, tipsOn: on, salvageConfirm: on, combatSfxOn: on, fsMode: '', toneMode: '', fontMode: '', chartsOn: on, fxOn: on, shakeOn: on, motionMode: -1, glassTint: 0.9 };
  const known: Record<string, unknown> = { document: doc, save, surveyFoldsOn: on, audioAccessibility: { mono: on, reducedIntensity: on },
    fillPanel: (id: string, html: string) => { doc.getElementById(`${id}panel`)!.innerHTML = html; },
    // the explorer-name and nameplate rows are their own owners' (the next surfaces to extract); empty here
    renderArc9ExplorerNameSettingV1: () => '', renderArc9NameplateSettingV1: () => '', projectArc9NameplateSettingsV1: () => ({}), projectArc9ExplorerNameSettingsV1: () => ({}),
    writeSurveyFoldPrefV1: () => true, deviceAudioAccessibilityStorage: () => null, persistView: async () => true, pwaUpdateControl: null, Date: { now: () => 1 }, ...extra };
  known.refillAndFocus = () => {};
  const env = new Proxy(known, { has: (t, k) => k in t || !(k in globalThis), get: (t, k) => (k in t ? t[k as string] : k === Symbol.unscopables ? undefined : vi.fn(() => ({ kind: 'unavailable' }))) });
  const out = transformSync('main-l10n-settings.ts', SETTINGS()); if (out.errors.length) throw new Error(JSON.stringify(out.errors));
  new Function('env', `with (env) { ${out.code}; fillSettings(); }`)(env);
  return { dom, doc, root: doc.getElementById('setpanel')!, known };
}
function renderedStrings(root: Element): Set<string> {
  const out = new Set<string>(), w = root.ownerDocument.createTreeWalker(root, 4);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const t = (n.nodeValue ?? '').trim(); if (t) out.add(t); }
  for (const el of root.querySelectorAll('*')) for (const a of LOCALIZED_ATTRIBUTES_V1) { const v = el.getAttribute(a); if (v) out.add(v); }
  return out;
}
const structure = (root: Element): string[] => [...root.querySelectorAll('*')].map((el) => [el.tagName, el.id, el.getAttribute('data-sel'), el.getAttribute('aria-pressed'), el.getAttribute('class'), el.hasAttribute('hidden')].join('|'));
function completeness(cat: StringCatalogV1): { uncatalogued: string[]; unrendered: string[] } {
  const seen = new Set<string>(); for (const on of STATES) { const r = renderSettings(on); for (const s of renderedStrings(r.root)) seen.add(s); r.dom.window.close(); }
  return { uncatalogued: [...seen].filter((s) => !cat.strings.includes(s)), unrendered: cat.strings.filter((s) => !seen.has(s)) };
}

describe('A6 localization — Settings', () => {
  it('the catalog is COMPLETE in both directions over the rendered states; control: a catalog missing one string is caught', () => {
    expect(completeness(SETTINGS_CATALOG_V1)).toEqual({ uncatalogued: [], unrendered: [] });
    const short: StringCatalogV1 = { ...SETTINGS_CATALOG_V1, strings: SETTINGS_CATALOG_V1.strings.filter((s) => s !== 'Tooltips') };
    expect(completeness(short).uncatalogued).toEqual(['Tooltips']);
  });

  it('English is BYTE-IDENTICAL: localizing to en changes nothing; Main registers a localizer only for a non-English locale; fillPanel is unchanged without one', () => {
    for (const on of STATES) { const r = renderSettings(on), before = r.root.innerHTML;
      expect(localizeElementV1(r.root, SETTINGS_CATALOG_V1, 'en')).toEqual({ translated: 0, missing: [] }); expect(r.root.innerHTML).toBe(before); r.dom.window.close(); }
    expect(localeFromSearchV1('')).toBe('en'); expect(localeFromSearchV1('?locale=fr')).toBe('en'); expect(localeFromSearchV1('?battle2=1&locale=qps-ploc')).toBe('qps-ploc');
    expect(MAIN.split("  if (uiLocale !== 'en') setPanelLocalizerV1('set', (el) => { localizeElementV1(el, SETTINGS_CATALOG_V1, uiLocale,")).toHaveLength(2);
    expect(MAIN.split('setPanelLocalizerV1(')).toHaveLength(2); // the one registration, behind the locale check
    // panels.fillPanel runs a localizer only when one is registered (none by default): the markup it writes is the markup it was given
    expect(PANELS.split('  def.el.innerHTML = html;\n  PANEL_LOCALIZERS.get(id)?.(def.el);\n')).toHaveLength(2);
    expect(SETTINGS().includes('localize')).toBe(false); // fillSettings itself is untouched (its English template is the source)
  });

  it('the pseudo-locale translates EVERY string, keeps the markup structurally identical, and the controls still work', () => {
    for (const on of STATES) {
      const en = renderSettings(on), shape = structure(en.root); en.dom.window.close();
      const r = renderSettings(on), warns: string[] = [], result = localizeElementV1(r.root, SETTINGS_CATALOG_V1, 'qps-ploc', (m) => warns.push(m));
      expect(result.missing).toEqual([]); expect(warns).toEqual([]); expect(result.translated).toBeGreaterThan(30);
      const after = renderedStrings(r.root);
      for (const s of SETTINGS_CATALOG_V1.strings) expect(after.has(s), `English left behind: ${s}`).toBe(false);
      expect(after.has(pseudoLocalizeV1('Folded survey card'))).toBe(true);
      expect(structure(r.root)).toEqual(shape); // same elements, ids, data-sel, pressed states, classes, hidden flags
      // a localized control still does its job (Main's handlers bind by id after the render)
      const fold = r.doc.getElementById('setfold') as HTMLButtonElement; expect(fold.getAttribute('aria-label')).toBe(pseudoLocalizeV1('Folded survey card'));
      fold.click(); expect(r.known.surveyFoldsOn).toBe(!on);
      r.dom.window.close();
    }
  });

  it('a missing translation or an uncatalogued string falls back to English with a warning', () => {
    const warns: string[] = [];
    const thin: StringCatalogV1 = { surface: 'settings', strings: ['Sound', 'Tooltips'], locales: { 'qps-ploc': { Sound: '[Šöüñð ~~]' } } };
    expect(translateV1(thin, 'qps-ploc', 'Sound', (m) => warns.push(m))).toBe('[Šöüñð ~~]');
    expect(translateV1(thin, 'qps-ploc', 'Tooltips', (m) => warns.push(m))).toBe('Tooltips');
    expect(translateV1(thin, 'qps-ploc', 'Brand new row', (m) => warns.push(m))).toBe('Brand new row');
    expect(warns).toEqual([
      'i18n[settings/qps-ploc]: no translation for "Tooltips" — English kept',
      'i18n[settings/qps-ploc]: not in the catalog for "Brand new row" — English kept',
    ]);
    // on a real render: a player-data subtree marked data-l10n-skip is never touched
    const r = renderSettings(false); const data = r.doc.createElement('span'); data.dataset.l10nSkip = ''; data.textContent = 'Sound'; r.root.append(data);
    localizeElementV1(r.root, SETTINGS_CATALOG_V1, 'qps-ploc'); expect(data.textContent).toBe('Sound'); r.dom.window.close();
  });
});
