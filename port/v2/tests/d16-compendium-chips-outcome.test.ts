import { LivingSpeciesPreviewControllerV1 } from '../apps/game/src/living-species-preview.js';
/* D16 parity — the Compendium's kingdom + rarity filter chips and category shelves (v1 `_codexTabs`, `codexKing`, `codexRare`,
 * `_SHELF_OF`, `_cdxOpen`) — INVENTORY rows #36/#37.
 *
 * The exact shipped Main sections run type-stripped over JSDOM with the REAL CompendiumVirtualList: the Compendium state, the
 * filter/row/shelf functions through `fillCodex`, and the #codexpanel click listener. The test presses the real chip and shelf
 * buttons and asserts what the player then sees (which species rows are mounted, the heading), plus v1's rules: the rarity floor
 * compares the DISPLAY tier, a chip filter lays every shelf open, nothing opens itself, and a shelf remembers its fold. Mutation
 * controls break the wiring (never the assertion). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompendiumVirtualList } from '../apps/game/src/compendium.js';
import * as shelves from '../apps/game/src/compendium-shelves.js';
import { projectDisplayRarity } from '../apps/game/src/rarity-presentation.js';
import { readTrackedV1Source } from '../test-support/tracked-v1-source.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string, o?: object) => { window: Window & { close(): void } } };

function section(source: string, start: string, end: string): string {
  if (source.split(start).length !== 2) throw new Error(`anchor must be unique: ${start}`);
  const left = source.indexOf(start), right = source.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`section missing: ${start}`);
  return source.slice(left, right);
}
const SECTIONS = (source = MAIN): string => [
  section(source, 'const EMPTY_CODEX_WINDOW', '\nconst compendiumFeedController = new CompendiumFeedController'),
  section(source, 'function activeCodexSource()', '\n/* the Compendium DETAIL CARD'),
  section(source, '/* codex list rows open the detail card', '\n/* ---- THE SEARCH BAR'),
].join('\n');

type Entry = { id: string; name: string; kind: string; tier: number | null; realm: string; sapient: number; from: string; hybrid: boolean; g: Record<string, unknown>; where: null };
const entry = (id: string, name: string, kind: string, realm: string, tier: number | null, hybrid = false): [string, Entry] =>
  [id, { id, name, kind, tier, realm, sapient: 0, from: 'Earth', hybrid, g: { seed: 1 }, where: null }];
const CODEX: [string, Entry][] = [
  entry('a', 'Civet', 'Fauna', 'Land Fauna', 1),
  entry('b', 'Salmon', 'Fauna', 'Aquatic Fauna', 5),
  entry('c', 'Fern', 'Flora', 'Flora', 0),
  entry('d', 'Morel', 'Fungi', 'Fungi', 3),
  entry('e', 'Newt', 'Fauna', 'Amphibious Life', 12, true),
  entry('f', 'Diatom', 'Microbe', 'Microbial Life', null),
];

function mount(source = MAIN) {
  const dom = new JSDOM('<!doctype html><html><body><aside id="codexpanel"></aside></body></html>', { pretendToBeVisual: true });
  const win = dom.window as unknown as Window & typeof globalThis;
  const doc = win.document;
  // the real CompendiumVirtualList reads the page globals (document, HTMLElement, requestAnimationFrame)
  vi.stubGlobal('document', doc); for (const k of ['HTMLElement', 'HTMLButtonElement', 'HTMLDivElement', 'HTMLSpanElement'] as const) vi.stubGlobal(k, (win as unknown as Record<string, unknown>)[k]); vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0)); vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  const stub = () => ({ detach() {}, setState() {} });
  const detail: number[] = [];
  const env: Record<string, unknown> = {
    document: doc, window: win, CSS: { escape: (v: string) => v.replace(/"/g, '\\"') }, queueMicrotask: (fn: () => void) => Promise.resolve().then(fn),
    save: { codex: CODEX },
    esc: (v: unknown) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`),
    fillPanel: (id: string, html: string) => { if (id === 'codex') doc.getElementById('codexpanel')!.innerHTML = html; },
    openPanelId: () => 'codex', projectDisplayRarity, CompendiumVirtualList,
    LivingSpeciesPreviewControllerV1, motionOK: () => true,
    releaseCompendiumAudition() {}, releaseCompendiumFeedExpression() {}, cancelCodexDetailArt() {},
    compendiumAuditionController: stub(), compendiumFeedController: stub(), compendiumExplorerMealController: stub(), compendiumBreedController: stub(),
    compendiumRenameController: stub(), compendiumScoutController: stub(), compendiumCreatureProgressionSurface: { detach() {} },
    bindSpeciesThumb: () => ({ release() {} }), speciesArtLoader: null,
    fillCodexDetail: (i: number) => { detail.push(i); },
    ...shelves,
  };
  const out = transformSync('main-d16-compendium.ts', SECTIONS(source));
  if (out.errors.length) throw new Error(JSON.stringify(out.errors));
  const api = new Function('env', `with (env) { ${out.code}; return { fillCodex, get view() { return codexView; } }; }`)(env) as { fillCodex: (f?: string) => void; view: shelves.CodexListViewV1 };
  api.fillCodex('');
  const panel = doc.getElementById('codexpanel')!;
  const press = (selector: string) => { const el = panel.querySelector<HTMLElement>(selector); if (!el) throw new Error(`no control ${selector}`); el.click(); };
  const shown = () => [...panel.querySelectorAll<HTMLElement>('[data-sel="codex-entry"] b')].map((b) => b.textContent);
  const shelfNames = () => [...panel.querySelectorAll<HTMLElement>('[data-sel="codex-shelf"]')].map((s) => `${s.dataset.cg}${s.getAttribute('aria-expanded') === 'true' ? '+' : ''}`);
  return { dom, panel, api, press, shown, shelfNames, detail };
}

describe('D16 — Compendium filter chips and shelves (v1 #36/#37)', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it('v1 parity sources: the two chip ladders and the shelf map are v1.8.9 exactly', () => {
    const v1 = readTrackedV1Source().script;
    expect(v1).toContain("const K=[['all','All'],['Fauna','🐾 Fauna'],['Flora','🌿 Flora'],['Fungi','🍄 Fungi'],['Microbe','🦠 Microbes']];");
    expect(v1).toContain("const R=[[0,'All'],[3,'Rare+'],[5,'Legendary+'],[6,'Mythic+']];");
    expect(shelves.CODEX_KINGDOM_CHIPS_V1.map(([k, l]) => `${k}:${l}`)).toEqual(['all:All', 'Fauna:🐾 Fauna', 'Flora:🌿 Flora', 'Fungi:🍄 Fungi', 'Microbe:🦠 Microbes']);
    expect(shelves.CODEX_RARITY_CHIPS_V1.map(([r, l]) => `${r}:${l}`)).toEqual(['0:All', '3:Rare+', '5:Legendary+', '6:Mythic+']);
    for (const [realm, shelf] of Object.entries(shelves.CODEX_SHELF_OF_V1)) expect(v1).toContain(`'${realm}':'${shelf}'`);
  });

  it('the default list is flat and unfiltered; the kingdom chip filters and says so; "All" restores', async () => {
    const m = mount(); await Promise.resolve();
    expect(m.shown().sort()).toEqual(['Civet', 'Diatom', 'Fern', 'Morel', 'Newt', 'Salmon']);
    expect(m.panel.querySelector('[data-sel="codex-shelf"]')).toBeNull();
    expect(m.panel.querySelector('[data-sel="codex-shown"]')).toBeNull();
    m.press('[data-ck="Fauna"]'); await Promise.resolve();
    expect(m.shown().sort()).toEqual(['Civet', 'Newt', 'Salmon']);
    expect(m.panel.querySelector('[data-sel="codex-count"]')!.textContent).toBe('3');
    expect(m.panel.querySelector('[data-sel="codex-shown"]')!.textContent).toBe('shown · 6 in all');
    expect(m.panel.querySelector('[data-ck="Fauna"]')!.getAttribute('aria-pressed')).toBe('true');
    m.press('[data-ck="all"]'); await Promise.resolve();
    expect(m.shown()).toHaveLength(6);
    m.dom.window.close();
  });

  it('the rarity floor compares the DISPLAY tier (raw 12 reads Transcendent and passes Mythic+); an unrated species never passes a floor; an empty floor explains itself', async () => {
    const m = mount(); await Promise.resolve();
    m.press('[data-cr="5"]'); await Promise.resolve();
    expect(m.shown().sort()).toEqual(['Newt', 'Salmon']);
    m.press('[data-cr="6"]'); await Promise.resolve();
    expect(m.shown()).toEqual(['Newt']);
    m.press('[data-ck="Flora"]'); await Promise.resolve();
    expect(m.shown()).toEqual([]);
    expect(m.panel.querySelector('.empty')!.textContent).toMatch(/^No flora at .+ or above yet — the rarest finds live farthest out\.$/u);
    m.dom.window.close();
  });

  it('shelves: opt-in; nothing opens itself; a pressed shelf opens and stays open; a chip filter lays every shelf open', async () => {
    const m = mount(); await Promise.resolve();
    m.press('[data-cshelves="on"]'); await Promise.resolve();
    expect(m.shown()).toEqual([]); // v1: nothing opens itself
    expect(m.shelfNames()).toEqual(['Microbial Life', 'Flora', 'Fungi', 'Land Fauna', 'Aquatic Fauna', 'Amphibious Fauna']);
    m.press('[data-cg="Land Fauna"]'); await Promise.resolve();
    expect(m.shown()).toEqual(['Civet']);
    expect(m.shelfNames()).toContain('Land Fauna+');
    m.press('[data-ck="Fauna"]'); await Promise.resolve();
    expect(m.shown().sort()).toEqual(['Civet', 'Newt', 'Salmon']); // a kingdom filter lays its shelves open
    m.press('[data-ck="all"]'); await Promise.resolve();
    expect(m.shown()).toEqual(['Civet']); // the remembered fold is back
    m.press('[data-cg="Land Fauna"]'); await Promise.resolve();
    expect(m.shown()).toEqual([]);
    m.press('[data-cshelves="off"]'); await Promise.resolve();
    expect(m.shown()).toHaveLength(6);
    m.dom.window.close();
  });

  it('a species row still opens its detail card with shelves and filters on', async () => {
    const m = mount(); await Promise.resolve();
    m.press('[data-cshelves="on"]'); await Promise.resolve();
    m.press('[data-cg="Aquatic Fauna"]'); await Promise.resolve();
    m.press('[data-sel="codex-entry"]');
    expect(m.detail).toEqual([1]); // Salmon's source index
    m.dom.window.close();
  });

  it('MUTATION CONTROLS: an unwired chip, a filter that ignores the kingdom, and a shelf press that never folds each fail', async () => {
    const unwired = MAIN.replace("    if (next) { codexView = next; fillCodex(codexFilter); }", '    if (next) { fillCodex(codexFilter); }');
    expect(unwired).not.toBe(MAIN);
    { const m = mount(unwired); await Promise.resolve(); m.press('[data-ck="Fauna"]'); await Promise.resolve(); expect(m.shown()).toHaveLength(6); m.dom.window.close(); }
    const ignoresChips = MAIN.replace('    .filter(({ value }) => codexEntryMatchesV1(value, view)));', '    .filter(() => true));');
    expect(ignoresChips).not.toBe(MAIN);
    { const m = mount(ignoresChips); await Promise.resolve(); m.press('[data-ck="Fauna"]'); await Promise.resolve(); expect(m.shown()).toHaveLength(6); m.dom.window.close(); }
    const neverFolds = MAIN.replace('    if (codexOpenShelves.has(name)) codexOpenShelves.delete(name); else codexOpenShelves.add(name);', '');
    expect(neverFolds).not.toBe(MAIN);
    { const m = mount(neverFolds); await Promise.resolve(); m.press('[data-cshelves="on"]'); await Promise.resolve(); m.press('[data-cg="Land Fauna"]'); await Promise.resolve(); expect(m.shown()).toEqual([]); m.dom.window.close(); }
  });
});
