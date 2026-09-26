/* D18 — the folded survey card is an OPTION (Nick 2026-09-25); the default stays the flat card — OUTCOME test.
 *
 * 1. Default: with no stored preference the card markup is BYTE-IDENTICAL to the flat card Main rendered before D18 (the card
 *    uilayout and Codex's Slice/Glass instruments measure). Control: with the folds on the markup differs, so the equality discriminates.
 * 2. The Settings switch (exact shipped `fillSettings`, JSDOM): pressing #setfold stores the device preference; a "reboot" (a fresh
 *    read of the same storage) comes back ON. Mutation control: without the write the reboot reads OFF.
 * 3. The fold toggle (exact shipped `toggleSurveyFold`): pressing the Environment header opens it and the save's `cardExpand` bit 1
 *    is committed (durable read-back twice from a real memory backend). Mutation control: without the checkpoint it reads back 0. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryBackend, createRevisionedRepository, importSaveV2, initializeFreshV5, readSaveV5, type ContentRegistry } from '@cf/persistence';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { readSurveyFoldPrefV1, SURVEY_FOLD_PREFS_KEY, surveyRowsHtmlV1, writeSurveyFoldPrefV1, type SurveyRowV1 } from '../apps/game/src/survey-card-folds.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };

function section(start: string, end: string): string {
  if (MAIN.split(start).length !== 2) throw new Error(`anchor must be unique: ${start}`);
  const left = MAIN.indexOf(start), right = MAIN.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`section missing: ${start}`);
  return MAIN.slice(left, right);
}
const SETTINGS = (): string => section('function fillSettings(): void {', '\n/* ---- GUIDE + RELEASE HISTORY');
// the exact fold block inside Main's card click listener (inlined so no other card test needs a new name)
const TOGGLE = (): string => section("  const foldHead = (e.target as HTMLElement).closest<HTMLElement>('[data-gtoggle]');", "  if (!act) return;\n");
function proxied(known: Record<string, unknown>) {
  return new Proxy(known, {
    has: (target, key) => key in target || !(key in globalThis),
    get: (target, key) => (key in target ? target[key as string] : key === Symbol.unscopables ? undefined : vi.fn(() => ({ kind: 'unavailable' }))),
  });
}
const esc = (v: string) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// Main's own flat row renderer (the exact template literal showSurvey passes)
const rowHtml = ([k, v, cls]: SurveyRowV1) => `<div data-row="${esc(k)}" data-cls="${esc(cls || '')}" class="survey-row"><span>${esc(k)}</span><br>${esc(v)}</div>`;
const ROWS: SurveyRowV1[] = [['Type', 'Terrestrial'], ['Made of', 'Silicate rock'], ['Atmosphere', 'Thin nitrogen'], ['Climate', 'Temperate, wet — seasonal'], ['Water', 'Liquid oceans'],
  ['Gravity', '0.9 g'], ['Magnetism', 'Weak'], ['Life', 'Abundant', 'bio'], ['Civilization', 'Tribal', 'civ'], ['Tech era', 'Bronze', 'civ'], ['Population', '2.1M', 'civ'], ['⟁ Signal', 'Faint']];
function memoryStorage() { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; }

async function durableSave() {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const save = imported.state, backend = createMemoryBackend();
  const init = await initializeFreshV5(backend, { state: save, extensions: {} }, REGISTRY, NOW);
  if (init.kind !== 'initialized') throw new Error(init.kind);
  const runtime = createF4RuntimeAuthority({ backend, repository: createRevisionedRepository(backend), registry: REGISTRY, initialRevision: init.revision,
    initialExtensions: {}, restoredAuthority: null, freshSessionSeed: 1, ownerId: 'd18', token: 'd18', leaseTtlMs: 10_000, now: () => 100, visible: true, answerable: true });
  await runtime.heartbeat();
  return { save, backend, persistView: async () => (await runtime.commit(save, NOW)).kind === 'committed' };
}
const settle = async () => { for (let i = 0; i < 30; i++) await new Promise((r) => setTimeout(r, 0)); };

describe('D18 folded survey card (option, default flat)', () => {
  it('DEFAULT: no stored preference ⇒ OFF, and the card rows are byte-identical to the pre-D18 flat card; control: ON differs', () => {
    expect(readSurveyFoldPrefV1(memoryStorage())).toBe(false);
    expect(readSurveyFoldPrefV1(null)).toBe(false);
    expect(readSurveyFoldPrefV1({ getItem: () => { throw new Error('blocked'); }, setItem: () => {} })).toBe(false);
    // Main's initializer reads the device preference, and showSurvey renders through the one helper with it
    expect(MAIN.split('let surveyFoldsOn = readSurveyFoldPrefV1(deviceAudioAccessibilityStorage());')).toHaveLength(2);
    expect(MAIN.split("const card = document.createElement('aside');\nif (surveyFoldsOn) card.dataset.surveyFolds = 'on';")).toHaveLength(2);
    // showSurvey folds ONLY when the card carries the preference; otherwise it keeps its original flat expression
    expect(MAIN.split("(card.dataset.surveyFolds === 'on'   /* D18")).toHaveLength(2);
    expect(MAIN.split('? surveyRowsHtmlV1(rows, { folds: true, cardExpand: save.cardExpand }, surveyRowHtml, esc)')).toHaveLength(2);
    const flat = ROWS.map(rowHtml).join('');
    for (const cardExpand of [0, 1, 2, 3, 31]) expect(surveyRowsHtmlV1(ROWS, { folds: false, cardExpand }, rowHtml, esc)).toBe(flat);
    const folded = surveyRowsHtmlV1(ROWS, { folds: true, cardExpand: 0 }, rowHtml, esc);
    expect(folded).not.toBe(flat);
    expect(folded).toContain('data-gtoggle="1"'); expect(folded).toContain('data-gtoggle="2"');
    expect(folded).toContain('Temperate · 0.9 g'); // v1's digest: the climate's first clause + gravity
    // every row survives the fold (nothing is dropped, only grouped)
    for (const [k] of ROWS) expect(folded).toContain(`data-row="${esc(k)}"`);
  });

  it('the Settings switch stores the device preference and a reboot reads it back ON; mutation control: without the write it reads OFF', () => {
    const run = (source: string) => {
      const storage = memoryStorage(), dom = new JSDOM('<!doctype html><html><body><aside id="setpanel"></aside></body></html>'), doc = dom.window.document;
      const cardEl = doc.createElement('aside');
      const known: Record<string, unknown> = { document: doc, card: cardEl, save: {}, surveyFoldsOn: false, writeSurveyFoldPrefV1, deviceAudioAccessibilityStorage: () => storage,
        fillPanel: (id: string, html: string) => { doc.getElementById(`${id}panel`)!.innerHTML = html; }, persistView: async () => true, pwaUpdateControl: null,
        audioAccessibility: { mono: false, reducedIntensity: false }, Date: { now: () => NOW } };
      known.refillAndFocus = () => {};
      const out = transformSync('main-d18-settings.ts', source);
      if (out.errors.length) throw new Error(JSON.stringify(out.errors));
      new Function('env', `with (env) { ${out.code}; fillSettings(); }`)(proxied(known));
      const button = doc.getElementById('setfold') as HTMLButtonElement;
      expect(button.getAttribute('aria-pressed')).toBe('false');
      button.click();
      const cardFlag = cardEl.dataset.surveyFolds;
      dom.window.close();
      return { storage, live: known.surveyFoldsOn, cardFlag };
    };
    const real = run(SETTINGS());
    expect(real.live).toBe(true);
    expect(readSurveyFoldPrefV1(real.storage)).toBe(true); // the reboot read
    expect(real.storage.m.get(SURVEY_FOLD_PREFS_KEY)).toBe('on');
    expect(real.cardFlag).toBe('on'); // the next survey card follows the switch
    const needle = 'writeSurveyFoldPrefV1(deviceAudioAccessibilityStorage(), surveyFoldsOn);';
    expect(SETTINGS().split(needle)).toHaveLength(2);
    const mutant = run(SETTINGS().replace(needle, ''));
    expect(mutant.live).toBe(true);
    expect(readSurveyFoldPrefV1(mutant.storage)).toBe(false);
  });

  it('pressing the Environment fold opens it and commits cardExpand bit 1 (durable read-back twice); mutation control: no checkpoint ⇒ 0', async () => {
    const run = async (source: string) => {
      const f = await durableSave(), dom = new JSDOM('<!doctype html><html><body><div id="card"></div></body></html>'), doc = dom.window.document;
      doc.getElementById('card')!.innerHTML = surveyRowsHtmlV1(ROWS, { folds: true, cardExpand: f.save.cardExpand }, rowHtml, esc);
      const out = transformSync('main-d18-toggle.ts', source);
      if (out.errors.length) throw new Error(JSON.stringify(out.errors));
      const handler = new Function('env', `with (env) { return (e) => { ${out.code}; return 'not-a-fold'; }; }`)(proxied({ save: f.save, persistView: f.persistView })) as (e: { target: EventTarget }) => unknown;
      const toggle = (t: EventTarget) => handler({ target: t }) !== 'not-a-fold';
      const head = doc.querySelector<HTMLElement>('[data-gtoggle="1"]')!;
      expect(head.closest('.grp')!.classList.contains('open')).toBe(false);
      expect(toggle(head.querySelector('span')!)).toBe(true); // a press on the header's label
      await settle();
      expect(head.closest('.grp')!.classList.contains('open')).toBe(true);
      expect(head.getAttribute('aria-expanded')).toBe('true');
      const reads: number[] = [];
      for (let i = 0; i < 2; i++) { const back = await readSaveV5(f.backend, REGISTRY, NOW); reads.push(back.kind === 'loaded' ? back.state.cardExpand : -1); }
      expect(toggle(doc.querySelector('[data-row="Life"]')!)).toBe(false); // an ordinary row is not a fold
      dom.window.close();
      return reads;
    };
    expect(await run(TOGGLE())).toEqual([1, 1]);
    const needle = '      void persistView();\n';
    expect(TOGGLE().split(needle)).toHaveLength(2);
    expect(await run(TOGGLE().replace(needle, ''))).toEqual([0, 0]);
  });

  it('the device preference writer is guarded (a throwing storage is refused, never thrown)', () => {
    expect(writeSurveyFoldPrefV1({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, true)).toBe(false);
    expect(writeSurveyFoldPrefV1(null, true)).toBe(false);
  });
});
