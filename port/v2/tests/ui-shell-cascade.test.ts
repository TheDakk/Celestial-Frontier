/* K19/K21: the shell sheets are judged by jsdom's real cascade (specificity +
   sheet order), never by reading declarations back. A media projector rewrites
   each @media prelude to `screen` (matches the chosen viewport) or `print`
   (does not) because jsdom evaluates only those two; the projector is itself
   negative-controlled below before any product assertion trusts it. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { UI_PRESENTATION_CSS } from '../apps/game/src/ui-presentation-tokens.js';
import { UI_SHELL_CSS } from '../apps/game/src/ui-shell-style.js';
import { NOTIFICATION_HISTORY_CSS } from '../apps/game/src/notification-history.js';
import { UI_SHEET_CSS } from '../apps/game/src/ui-sheet-style.js';

interface TestDom { window: Window & { close(): void; getComputedStyle: typeof getComputedStyle } }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom };
const INDEX_HTML = readFileSync(new URL('../apps/game/index.html', import.meta.url), 'utf8');
const INDEX_CSS = [...INDEX_HTML.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gu)].map((m) => m[1]!).join('\n');

interface Viewport { readonly width: number; readonly height: number; readonly pointer: 'fine' | 'coarse' }
const DESKTOP: Viewport = { width: 1280, height: 800, pointer: 'fine' };
const PHONE_PORTRAIT: Viewport = { width: 390, height: 844, pointer: 'coarse' };
const PHONE_LANDSCAPE: Viewport = { width: 844, height: 390, pointer: 'coarse' };

function feature(text: string, viewport: Viewport): boolean {
  const [name, raw = ''] = text.split(':').map((part) => part.trim());
  const px = Number.parseFloat(raw);
  switch (name) {
    case 'min-width': return viewport.width >= px;
    case 'max-width': return viewport.width <= px;
    case 'orientation': return raw === (viewport.width > viewport.height ? 'landscape' : 'portrait');
    case 'pointer': return raw === viewport.pointer;
    case 'prefers-reduced-motion': case 'forced-colors': return false;
    default: throw new Error(`unprojected media feature: ${text}`);
  }
}
function matchesPrelude(prelude: string, viewport: Viewport): boolean {
  return prelude.split(',').some((query) => query.split(/\band\b/u)
    .every((clause) => feature(clause.trim().replace(/^\(|\)$/gu, ''), viewport)));
}
/** Rewrites every top-level @media block for one viewport. */
export function projectSheet(css: string, viewport: Viewport): string {
  let out = ''; let index = 0;
  for (;;) {
    const at = css.indexOf('@media', index);
    if (at < 0) { out += css.slice(index); return out; }
    const open = css.indexOf('{', at);
    const prelude = css.slice(at + 6, open).trim();
    out += css.slice(index, at) + `@media ${matchesPrelude(prelude, viewport) ? 'screen' : 'print'}`;
    index = open;
  }
}

const MARKUP = `<div id="topbar"><button id="dockinventory"></button><input id="searchbox"><div id="hpbar"></div>
<span id="trail">trail</span><button id="objchip" class="glass" type="button" aria-controls="chpanel">Survey a world</button></div>
<div id="dock"></div><div id="toast"></div>
${['setpanel', 'recpanel', 'shipyardpanel', 'inventorypanel', 'combatpanel', 'notificationpanel', 'guidepanel', 'chpanel', 'codexpanel']
    .map((id) => `<aside id="${id}" class="glass panel"></aside>`).join('')}`;
const doms: TestDom[] = [];
afterEach(() => { for (const dom of doms.splice(0)) dom.window.close(); });

function mount(viewport: Viewport, sheets: Readonly<{ shell?: string; history?: string; sheet?: string; extra?: string }> = {}, bodyClass = '') {
  const generated = UI_PRESENTATION_CSS + (sheets.shell ?? UI_SHELL_CSS) + (sheets.history ?? NOTIFICATION_HISTORY_CSS)
    + (sheets.sheet ?? UI_SHEET_CSS) + (sheets.extra ?? '');
  // index.html's inline sheets precede the generated element exactly as main.ts appends it to <head>.
  const dom = new JSDOM(`<!doctype html><html><head><style>${projectSheet(INDEX_CSS, viewport)}</style>
    <style id="cf-ui-presentation">${projectSheet(generated, viewport)}</style></head><body class="${bodyClass}">${MARKUP}</body></html>`,
  { url: 'https://example.test/' });
  doms.push(dom);
  const style = (id: string, property: string): string => {
    const element = dom.window.document.getElementById(id);
    if (!element) throw new Error(`missing #${id}`);
    return dom.window.getComputedStyle(element).getPropertyValue(property).trim();
  };
  return { dom, style };
}

const K19_DELETED_SHELL_BLOCK = '@media(min-width:901px){#setpanel,#recpanel,#shipyardpanel,#inventorypanel,#combatpanel,#toast{right:calc(var(--safe-right) + 16px);bottom:calc(var(--safe-bottom) + var(--dock-h) + 24px)}}';
const K19_DELETED_HISTORY_DECLARATIONS = 'top:calc(var(--topbar-h) + 8px);max-height:calc(100dvh - var(--topbar-h) - 128px - var(--safe-bottom));';
const K21_OLD_HIDE_RULE = 'body:is(.card-open,.panel-open) :is(#trail,#objchip){display:none}';
const ANCHORS = ['setpanel', 'recpanel', 'shipyardpanel', 'inventorypanel', 'combatpanel', 'toast', 'notificationpanel'] as const;
const PROPERTIES = ['top', 'right', 'bottom', 'max-height'] as const;
function anchorTable(viewport: Viewport, sheets?: Parameters<typeof mount>[1], bodyClass?: string): Record<string, string> {
  const m = mount(viewport, sheets, bodyClass);
  return Object.fromEntries(ANCHORS.flatMap((id) => PROPERTIES.map((property) => [`${id}.${property}`, m.style(id, property)])));
}

describe('shell sheet cascade owners (K19) and the Charters opener (K21)', () => {
  it('projector control: desktop and phone blocks apply only under their own viewport', () => {
    expect(mount(DESKTOP).style('dock', 'display')).toBe('flex');
    expect(mount(PHONE_PORTRAIT).style('dock', 'display')).toBe('grid');
    expect(mount(PHONE_LANDSCAPE).style('dock', 'display')).toBe('grid');
    expect(() => projectSheet('@media(color-gamut:p3){a{b:c}}', DESKTOP)).toThrow('unprojected media feature');
    expect(projectSheet('@media(min-width:901px) and (orientation:landscape){}', DESKTOP)).toBe('@media screen{}');
    expect(projectSheet('@media(max-width:700px),(max-width:900px) and (orientation:landscape){}', PHONE_LANDSCAPE)).toBe('@media screen{}');
    expect(projectSheet('@media(max-width:700px),(max-width:900px) and (orientation:landscape){}', DESKTOP)).toBe('@media print{}');
  });

  it('later equal-specificity sheet rules own the desktop panel anchors; mutating them moves the computed value', () => {
    const baseline = anchorTable(DESKTOP);
    expect(baseline['recpanel.bottom']).toBe('var(--cf-sheet-bottom)');
    expect(baseline['recpanel.right']).toBe('calc(var(--safe-right) + 16px)');
    expect(baseline['setpanel.bottom']).toBe('auto');
    expect(baseline['shipyardpanel.bottom']).toBe('auto');
    expect(baseline['toast.bottom']).toBe('var(--cf-toast-bottom)');
    expect(baseline['toast.right']).toBe('calc(var(--safe-right) + 16px)');
    expect(baseline['notificationpanel.top']).toBe('auto');
    expect(baseline['notificationpanel.max-height']).toBe('max(44px,calc(var(--cf-sheet-floor) - var(--safe-top) - 12px))');
    const mutatedSheet = UI_SHEET_CSS
      .replace('bottom:var(--cf-sheet-bottom);max-height:max(44px,calc(var(--cf-sheet-floor) - var(--safe-top) - 12px))}',
        'bottom:123px;max-height:456px}')
      .replace('#setpanel{left:auto;right:calc(var(--safe-right) + 16px);top:', '#setpanel{left:auto;right:calc(var(--safe-right) + 16px);bottom:789px;top:');
    expect(mutatedSheet).not.toBe(UI_SHEET_CSS);
    const mutated = anchorTable(DESKTOP, { sheet: mutatedSheet });
    expect(mutated['recpanel.bottom']).toBe('123px');
    expect(mutated['inventorypanel.bottom']).toBe('123px');
    expect(mutated['combatpanel.bottom']).toBe('123px');
    expect(mutated['notificationpanel.max-height']).toBe('456px');
    expect(mutated['setpanel.bottom']).toBe('auto'); // top/bottom:auto is declared after the injected bottom
    const toastOwner = UI_SHELL_CSS.replace('#toast{right:calc(var(--safe-right) + 16px)}', '#toast{right:42px}');
    expect(toastOwner).not.toBe(UI_SHELL_CSS);
    expect(anchorTable(DESKTOP, { shell: toastOwner })['toast.right']).toBe('42px');
    const sheetTop = UI_SHEET_CSS.replace('top:var(--cf-sheet-start);bottom:auto;min-height:0', 'top:321px;bottom:auto;min-height:0');
    expect(sheetTop).not.toBe(UI_SHEET_CSS);
    expect(anchorTable(PHONE_PORTRAIT, { sheet: sheetTop })['notificationpanel.top']).toBe('321px');
  });

  it('control: restoring the deleted declarations changes no computed anchor on any breakpoint', () => {
    expect(UI_SHELL_CSS).not.toContain('#setpanel,#recpanel,#shipyardpanel');
    expect(NOTIFICATION_HISTORY_CSS).not.toContain('top:calc(var(--topbar-h) + 8px)');
    const restoredShell = UI_SHELL_CSS.replace('@media(min-width:901px){\n  #toast{right:calc(var(--safe-right) + 16px)}\n}',
      K19_DELETED_SHELL_BLOCK);
    expect(restoredShell).not.toBe(UI_SHELL_CSS);
    const restoredHistory = NOTIFICATION_HISTORY_CSS.replace('#notificationpanel{left:auto;', `#notificationpanel{left:auto;${K19_DELETED_HISTORY_DECLARATIONS}`);
    expect(restoredHistory).not.toBe(NOTIFICATION_HISTORY_CSS);
    for (const viewport of [DESKTOP, PHONE_PORTRAIT, PHONE_LANDSCAPE]) {
      for (const bodyClass of ['', 'panel-open']) {
        expect(anchorTable(viewport, { shell: restoredShell, history: restoredHistory }, bodyClass))
          .toEqual(anchorTable(viewport, undefined, bodyClass));
      }
    }
    // The same harness sees a live declaration: a rule appended later does move the anchor.
    expect(anchorTable(DESKTOP, { extra: '#recpanel{bottom:1px}' })['recpanel.bottom']).toBe('1px');
  });

  it('keeps the only Charters opener visible while a card or a panel is open (K21)', () => {
    const opener = /<button id="objchip"[^>]*>/u.exec(INDEX_HTML)?.[0];
    expect(opener).toContain('type="button"');
    expect(opener).toContain('aria-controls="chpanel"');
    expect(opener).not.toMatch(/\b(hidden|disabled|tabindex="-1")/u);
    for (const viewport of [DESKTOP, PHONE_PORTRAIT, PHONE_LANDSCAPE]) {
      for (const bodyClass of ['card-open', 'panel-open', 'card-open panel-open']) {
        const m = mount(viewport, undefined, bodyClass);
        expect(m.style('objchip', 'display'), `${viewport.width}x${viewport.height} ${bodyClass}`).toBe('block');
        expect(m.style('trail', 'display')).toBe('none');
      }
    }
    const landscape = mount(PHONE_LANDSCAPE, undefined, 'panel-open');
    expect(landscape.style('objchip', 'grid-row')).toBe('3');
    expect(landscape.style('topbar', 'grid-template-rows')).toBe('auto auto auto');
    // Negative control: the pre-fix rule hides the opener under the same harness.
    const hidden = mount(DESKTOP, { extra: K21_OLD_HIDE_RULE }, 'card-open');
    expect(hidden.style('objchip', 'display')).toBe('none');
    expect(mount(DESKTOP, undefined, '').style('objchip', 'display')).toBe('block');
  });
});
