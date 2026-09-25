/* D16 parity — the tooltip system and its switch (v1 `@section tooltips`, save `tips`, absent ⇒ on; INVENTORY row #117).
 * The real TooltipOwnerV1 runs in JSDOM with a manual clock; the exact shipped Main construction line and `fillSettings` run
 * type-stripped. Outcomes: the bubble shows the hint after the hover delay / a long-press (native titles on touch), the click
 * that ends a long-press is swallowed (inspecting never acts), a drag cancels, Training and the switch silence it, and the
 * switch persists durably. Negative control: the Main wiring ignoring the switch. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryBackend, createRevisionedRepository, importSaveV2, initializeFreshV5, readSaveV5, type ContentRegistry } from '@cf/persistence';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { TOOLTIP_HOVER_MS, TOOLTIP_PRESS_MS, TooltipOwnerV1 } from '../apps/game/src/tooltips.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis & { close(): void } } };

function section(start: string, end: string): string {
  if (MAIN.split(start).length !== 2) throw new Error(`anchor must be unique: ${start}`);
  const left = MAIN.indexOf(start), right = MAIN.indexOf(end, left + start.length);
  return MAIN.slice(left, right);
}
const CONSTRUCTION = (): string => section('const tooltipOwner = new TooltipOwnerV1({', '\n\n/** Prime Codex travel');

function harness(touch: boolean, state: { tipsOn: boolean; training?: boolean }, source = CONSTRUCTION()) {
  const dom = new JSDOM(`<!doctype html><html><body><button id="hint" data-tip="Opens your ship">Ship</button>
    <button id="native" title="Salvage exact item">♺</button><button id="plain">x</button></body></html>`);
  const w = dom.window;
  const timers = new Map<number, () => void>(); let seq = 0;
  const clock = { set: (fn: () => void) => { timers.set(++seq, fn); return seq; }, clear: (id: number) => { timers.delete(id); } };
  const flush = () => { const all = [...timers.values()]; timers.clear(); all.forEach((fn) => fn()); };
  class Owner extends TooltipOwnerV1 {
    constructor(o: ConstructorParameters<typeof TooltipOwnerV1>[0]) { super({ ...o, setTimeout: clock.set, clearTimeout: clock.clear }); }
  }
  const out = transformSync('main-d16-tips.ts', source);
  const owner = new Function('env', `with (env) { ${out.code}; return tooltipOwner; }`)({
    document: w.document, TOUCH_DPR: touch, TooltipOwnerV1: Owner, save: state, trainingActive: () => state.training === true,
  }) as TooltipOwnerV1;
  const $ = (id: string) => w.document.getElementById(id)!;
  const pointer = (type: string, el: Element, x = 10, y = 10) => el.dispatchEvent(Object.assign(new w.Event(type, { bubbles: true, cancelable: true }), { clientX: x, clientY: y }));
  return { w, owner, $, flush, pointer, bubble: () => w.document.getElementById('tipbubble')! };
}

describe('D16 tooltips', () => {
  it('desktop: hovering a [data-tip] shows the hint after the delay; leaving hides it; a native title is left to the browser', () => {
    expect(TOOLTIP_HOVER_MS).toBe(650);
    const h = harness(false, { tipsOn: true });
    h.$('hint').dispatchEvent(new h.w.MouseEvent('mouseover', { bubbles: true }));
    expect(h.bubble().hidden).toBe(true);
    h.flush();
    expect(h.bubble().hidden).toBe(false);
    expect(h.bubble().textContent).toBe('Opens your ship');
    h.$('hint').dispatchEvent(new h.w.MouseEvent('mouseout', { bubbles: true, relatedTarget: h.$('plain') }));
    expect(h.bubble().hidden).toBe(true);
    h.$('native').dispatchEvent(new h.w.MouseEvent('mouseover', { bubbles: true }));
    h.flush();
    expect(h.bubble().hidden).toBe(true);
  });

  it('touch: a long-press reads a native title, and the click that ends it is swallowed; a drag cancels; a tap acts', () => {
    expect(TOOLTIP_PRESS_MS).toBe(600);
    const h = harness(true, { tipsOn: true });
    const clicked = vi.fn();
    h.$('native').addEventListener('click', clicked);
    h.pointer('pointerdown', h.$('native'));
    h.flush();
    expect(h.bubble().textContent).toBe('Salvage exact item');
    h.pointer('pointerup', h.$('native'));
    h.$('native').click();
    expect(clicked).not.toHaveBeenCalled();
    h.pointer('pointerdown', h.$('plain')); // a press elsewhere hides it
    expect(h.bubble().hidden).toBe(true);
    h.pointer('pointerdown', h.$('native'));
    h.pointer('pointermove', h.$('native'), 40, 10);
    h.flush();
    expect(h.bubble().hidden).toBe(true);
    h.$('native').click();
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('the switch off and Field Training silence it', () => {
    const off = harness(false, { tipsOn: false });
    off.$('hint').dispatchEvent(new off.w.MouseEvent('mouseover', { bubbles: true }));
    off.flush();
    expect(off.bubble().hidden).toBe(true);
    const drill = harness(false, { tipsOn: true, training: true });
    drill.$('hint').dispatchEvent(new drill.w.FocusEvent('focusin', { bubbles: true }));
    expect(drill.bubble().hidden).toBe(true);
  });

  it('negative control: Main wiring that ignores the switch shows hints with tips off', () => {
    const needle = '  enabled: () => save?.tipsOn !== false,';
    expect(CONSTRUCTION().split(needle)).toHaveLength(2);
    const h = harness(false, { tipsOn: false }, CONSTRUCTION().replace(needle, '  enabled: () => true,'));
    h.$('hint').dispatchEvent(new h.w.MouseEvent('mouseover', { bubbles: true }));
    h.flush();
    expect(h.bubble().hidden).toBe(false);
  });

  it('the Settings switch persists `tips` durably (absent ⇒ on)', async () => {
    const imported = importSaveV2('{}', REGISTRY, NOW);
    if (!imported.ok) throw new Error(imported.reason);
    const save = imported.state;
    expect(save.tipsOn).toBe(true);
    const backend = createMemoryBackend();
    const init = await initializeFreshV5(backend, { state: save, extensions: {} }, REGISTRY, NOW);
    if (init.kind !== 'initialized') throw new Error(init.kind);
    const runtime = createF4RuntimeAuthority({ backend, repository: createRevisionedRepository(backend), registry: REGISTRY, initialRevision: init.revision,
      initialExtensions: {}, restoredAuthority: null, freshSessionSeed: 1, ownerId: 'd16-tips', token: 'd16-tips', leaseTtlMs: 10_000, now: () => 100, visible: true, answerable: true });
    await runtime.heartbeat();
    const dom = new JSDOM('<!doctype html><html><body><aside id="setpanel"></aside></body></html>');
    const doc = dom.window.document;
    const hide = vi.fn();
    const known: Record<string, unknown> = {
      document: doc, save, tooltipOwner: { hide }, fillPanel: (id: string, html: string) => { doc.getElementById(`${id}panel`)!.innerHTML = html; },
      persistView: async () => (await runtime.commit(save, NOW)).kind === 'committed', pwaUpdateControl: null,
      audioAccessibility: { mono: false, reducedIntensity: false }, Date: { now: () => NOW },
    };
    const env = new Proxy(known, {
      has: (t, k) => k in t || !(k in globalThis),
      get: (t, k) => (k in t ? t[k as string] : k === Symbol.unscopables ? undefined : vi.fn(() => ({ kind: 'unavailable' }))),
    });
    const out = transformSync('main-d16-settings.ts', section('function fillSettings(): void {', '\n/* ---- GUIDE + RELEASE HISTORY'));
    new Function('env', `with (env) { ${out.code}; fillSettings(); }`)(env);
    (doc.getElementById('settips') as HTMLButtonElement).click();
    for (let i = 0; i < 30; i++) await new Promise((r) => setTimeout(r, 0));
    expect(hide).toHaveBeenCalledTimes(1);
    const back = await readSaveV5(backend, REGISTRY, NOW);
    expect(back.kind === 'loaded' && back.state.tipsOn).toBe(false);
    dom.window.close();
  });
});
