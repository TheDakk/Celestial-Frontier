import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  createAppChromeController,
  type AppChromeController,
  type AppChromeMutationObserver,
  type AppChromeResizeObserver,
} from '../apps/game/src/app-chrome.js';

interface TestWindow extends Window {
  close: () => void;
  HTMLElement: typeof HTMLElement;
  MutationObserver: typeof MutationObserver;
}
interface TestDom { window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};

const openDoms: TestDom[] = [];
afterEach(() => {
  for (const dom of openDoms.splice(0)) dom.window.close();
});

type ElementStyle = Readonly<{
  display: string;
  visibility: string;
  opacity: string;
}>;
type ObserverRecord<T> = {
  readonly listener: () => void;
  readonly observed: Array<T>;
  readonly disconnect: Mock<() => void>;
};

function chromeMarkup(): string {
  return `<!doctype html><html><body>
    <div id="topbar">
      <div id="trail"></div>
      <div id="playerchip"></div>
      <button id="primechip" type="button"></button>
      <div id="hpbar"><span class="fill"></span><span class="txt"></span></div>
      <div id="objchip"></div>
    </div>
    <input id="searchbox">
    <div id="ctxbar"></div>
    <div id="hintpill"></div>
    <div id="dock"></div>
    <div id="planetside"></div>
  </body></html>`;
}

function rect(bottom: number, width = 100, height = 20): DOMRect {
  return {
    x: 0,
    y: bottom - height,
    top: bottom - height,
    right: width,
    bottom,
    left: 0,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

function createHarness() {
  const dom = new JSDOM(chromeMarkup(), { url: 'https://example.test/' });
  openDoms.push(dom);
  const document = dom.window.document;
  const bottoms = new Map<string, number>([
    ['topbar', 52],
    ['playerchip', 44],
    ['searchbox', 70],
    ['objchip', 80],
    ['trail', 110],
    ['planetside', 300],
  ]);
  const widths = new Map<string, number>();
  const heights = new Map<string, number>([
    ['topbar', 52],
    ['dock', 44],
    ['ctxbar', 31],
    ['hintpill', 27],
  ]);
  const styles = new Map<string, ElementStyle>();
  const element = (id: string): HTMLElement => document.getElementById(id)!;
  for (const id of ['topbar', 'playerchip', 'searchbox', 'objchip', 'trail', 'planetside']) {
    const target = element(id);
    target.getBoundingClientRect = () => rect(
      bottoms.get(id) ?? 0,
      widths.get(id) ?? 100,
      20,
    );
  }
  for (const id of ['topbar', 'dock', 'ctxbar', 'hintpill']) {
    Object.defineProperty(element(id), 'offsetHeight', {
      configurable: true,
      get: () => heights.get(id) ?? 0,
    });
  }

  let portrait = true;
  const computedStyle = (target: Element): CSSStyleDeclaration => {
    const id = target instanceof dom.window.HTMLElement ? target.id : '';
    const view = styles.get(id) ?? { display: 'block', visibility: 'visible', opacity: '1' };
    return {
      display: view.display,
      visibility: view.visibility,
      opacity: view.opacity,
      getPropertyValue: (name: string) => document.documentElement.style.getPropertyValue(name),
    } as CSSStyleDeclaration;
  };

  const resizeObservers: Array<ObserverRecord<Element>> = [];
  const mutationObservers: Array<ObserverRecord<Node> & { options: MutationObserverInit[] }> = [];
  const createResizeObserver = (listener: () => void): AppChromeResizeObserver => {
    const record: ObserverRecord<Element> = {
      listener,
      observed: [],
      disconnect: vi.fn<() => void>(),
    };
    resizeObservers.push(record);
    return {
      observe: (target) => { record.observed.push(target); },
      disconnect: () => { record.disconnect(); },
    };
  };
  const createMutationObserver = (listener: () => void): AppChromeMutationObserver => {
    const record: ObserverRecord<Node> & { options: MutationObserverInit[] } = {
      listener,
      observed: [],
      options: [],
      disconnect: vi.fn<() => void>(),
    };
    mutationObservers.push(record);
    return {
      observe: (target, options) => {
        record.observed.push(target);
        record.options.push(options ?? {});
      },
      disconnect: () => { record.disconnect(); },
    };
  };
  let resizeListener: (() => void) | null = null;
  const addResizeListener = vi.fn((listener: () => void) => { resizeListener = listener; });
  const removeResizeListener = vi.fn<(listener: () => void) => void>();
  const viewportResize = vi.fn();
  const controller = createAppChromeController({
    document,
    getComputedStyle: computedStyle,
    matchMedia: () => ({ matches: portrait }),
    createResizeObserver,
    createMutationObserver,
    addResizeListener,
    removeResizeListener,
    onViewportResize: viewportResize,
  });
  return {
    dom,
    document,
    controller,
    element,
    bottoms,
    widths,
    heights,
    styles,
    resizeObservers,
    mutationObservers,
    addResizeListener,
    removeResizeListener,
    viewportResize,
    resize: () => {
      if (!resizeListener) throw new Error('resize listener was not installed');
      resizeListener();
    },
    resizeListener: () => resizeListener,
    setPortrait: (value: boolean) => { portrait = value; },
  };
}

function renderProgress(controller: AppChromeController): void {
  controller.renderStatus({
    explorerName: 'Nova',
    essence: 13,
    landedWorlds: 4,
    hp: 75,
    hpMax: 100,
    primeCount: 3,
    objective: { kind: 'progress', text: 'Survey worlds', have: 2, need: 5 },
  });
}

describe('application chrome DOM owner', () => {
  it('renders every status branch, clamps health, escapes projected names, and remeasures', () => {
    const h = createHarness();
    renderProgress(h.controller);
    expect(h.element('playerchip').innerHTML).toBe(
      '⚙ Nova <span class="dim">— ✦ 13<span class="player-worlds"> · 4 worlds</span></span>',
    );
    expect(h.document.querySelector<HTMLElement>('#hpbar .fill')!.style.width).toBe('75%');
    expect(h.document.querySelector('#hpbar .txt')!.textContent).toBe('75/100 HP');
    expect(h.element('primechip').textContent).toBe('✦ Prime Codex 3/9');
    expect(h.element('primechip').querySelector('.ico')?.getAttribute('aria-hidden')).toBe('true');
    expect(h.element('primechip').querySelector('.lbl')?.textContent).toBe('Prime Codex');
    expect(h.element('primechip').querySelector('.prime-count')?.textContent).toBe('3/9');
    expect(h.element('primechip').getAttribute('aria-label')).toBe('Open Prime Codex, 3 of 9 signatures');
    expect(h.controller.primeCodexOpener()).toBe(h.element('primechip'));
    expect(h.element('objchip').innerHTML).toBe(
      '⬆ Survey worlds · <span class="prog" data-sel="objprog">2 / 5</span>',
    );
    expect(h.controller.rankCeremonyAnchor()).toEqual({ x: 50, y: 34 });
    h.widths.set('playerchip', 0);
    expect(h.controller.rankCeremonyAnchor()).toBeNull();
    h.widths.set('playerchip', 100);
    expect(h.document.documentElement.style.getPropertyValue('--topbar-h')).toBe('52px');
    expect(h.document.documentElement.style.getPropertyValue('--row1-h')).toBe('70px');

    h.heights.set('topbar', 68);
    h.controller.renderStatus({
      explorerName: '<img src=x onerror=1>&"\'',
      essence: 0,
      landedWorlds: 0,
      hp: 150,
      hpMax: 100,
      primeCount: 9,
      rank: {
        name: '<b>Eternal Frontier</b>',
        nameplateHue: 'irid',
        nameplateIridescent: true,
      },
      objective: { kind: 'boundary', name: '<b>First Light</b> & beyond' },
    });
    expect(h.element('playerchip').querySelector('img')).toBeNull();
    expect(h.element('playerchip').textContent).toContain('<img src=x onerror=1>&"\'');
    expect(h.element('playerchip').querySelector('b')).toBeNull();
    expect(h.element('playerchip').textContent).toContain('<b>Eternal Frontier</b>');
    expect(h.element('playerchip').classList.contains('rank-iridescent')).toBe(true);
    expect(h.element('playerchip').style.borderColor).toBe('rgb(199, 216, 255)');
    expect(h.element('playerchip').dataset.rankName).toBe('<b>Eternal Frontier</b>');
    expect(h.element('playerchip').title).toBe('Explorer rank: <b>Eternal Frontier</b>');
    expect(h.element('objchip').querySelector('b')).toBeNull();
    expect(h.element('objchip').textContent).toBe(
      '⬆ <b>First Light</b> & beyond is recorded — the next Charter action is not available in this development slice',
    );
    expect(h.document.querySelector<HTMLElement>('#hpbar .fill')!.style.width).toBe('100%');
    expect(h.document.documentElement.style.getPropertyValue('--topbar-h')).toBe('68px');

    h.controller.renderStatus({
      explorerName: '',
      essence: 1,
      landedWorlds: 1,
      hp: -5,
      hpMax: 0,
      primeCount: 0,
      rank: { name: 'Scout', nameplateHue: '#7fe6a0', nameplateIridescent: false },
      objective: null,
    });
    expect(h.element('playerchip').textContent).toContain('Explorer');
    expect(h.element('playerchip').classList.contains('rank-iridescent')).toBe(false);
    expect(h.element('playerchip').style.borderColor).toBe('rgb(127, 230, 160)');
    expect(h.element('playerchip').textContent).toContain('Scout');
    expect(h.document.querySelector<HTMLElement>('#hpbar .fill')!.style.width).toBe('0%');
    expect(h.element('objchip').innerHTML).toBe('');
  });

  it('owns escaped trails, trusted hint emphasis, deduplicated text, and live diagnostics', async () => {
    const h = createHarness();
    const contextMutations = vi.fn();
    const hintMutations = vi.fn();
    const contextObserver = new h.dom.window.MutationObserver(contextMutations);
    const hintObserver = new h.dom.window.MutationObserver(hintMutations);
    contextObserver.observe(h.element('ctxbar'), { childList: true });
    hintObserver.observe(h.element('hintpill'), { childList: true });

    h.controller.setTrail(['<em>Cosmos</em>', 'Earth & "Moon"']);
    expect(h.element('trail').querySelector('em')).toBeNull();
    expect(h.element('trail').querySelectorAll('.seg')).toHaveLength(2);
    expect(h.element('trail').querySelectorAll('.sep')).toHaveLength(1);
    expect(h.element('trail').querySelector('.seg.cur')?.textContent).toBe('Earth & "Moon"');
    h.controller.setContext('<img src=x onerror=1> a contextual line & more');
    h.controller.setHint('tap, drag, or press Enter; then Leave with Escape');
    await Promise.resolve();
    expect(contextMutations).toHaveBeenCalledOnce();
    expect(hintMutations).toHaveBeenCalledOnce();
    expect(h.element('ctxbar').querySelector('img')).toBeNull();
    expect(h.element('ctxbar').textContent).toBe('<img src=x onerror=1> a contextual line & more');
    expect(h.element('hintpill').querySelectorAll('b.kw')).toHaveLength(6);

    h.controller.setContext('<img src=x onerror=1> a contextual line & more');
    h.controller.setHint('tap, drag, or press Enter; then Leave with Escape');
    await Promise.resolve();
    expect(contextMutations).toHaveBeenCalledOnce();
    expect(hintMutations).toHaveBeenCalledOnce();

    renderProgress(h.controller);
    expect(h.controller.diagnostics()).toEqual({
      trail: '<em>Cosmos</em>›Earth & "Moon"',
      context: '<img src=x onerror=1> a contextual line & more',
      objective: '⬆ Survey worlds · 2 / 5',
      topbarH: '52px',
    });
    contextObserver.disconnect();
    hintObserver.disconnect();
  });

  it('publishes measured chrome heights and preserves portrait trail yield/restoration geometry', () => {
    const h = createHarness();
    h.document.body.classList.add('surface-mode');
    h.controller.syncTopbarH();
    h.controller.syncDockH();
    h.controller.syncContextH();
    h.controller.syncHintH();
    expect(h.document.documentElement.style.getPropertyValue('--topbar-h')).toBe('52px');
    expect(h.document.documentElement.style.getPropertyValue('--dock-h')).toBe('44px');
    expect(h.document.documentElement.style.getPropertyValue('--ctx-h')).toBe('31px');
    expect(h.document.documentElement.style.getPropertyValue('--hint-h')).toBe('27px');
    expect(h.document.documentElement.style.getPropertyValue('--row1-h')).toBe('70px');
    h.bottoms.set('searchbox', 31);
    h.controller.syncTopbarH();
    expect(h.document.documentElement.style.getPropertyValue('--row1-h')).toBe('40px');
    h.bottoms.set('searchbox', 88);
    h.controller.syncTopbarH();
    expect(h.document.documentElement.style.getPropertyValue('--row1-h')).toBe('88px');
    h.bottoms.set('searchbox', 70);
    h.controller.syncTopbarH();

    h.bottoms.set('planetside', 300);
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.body.classList.contains('surface-trail-yield')).toBe(false);
    expect(h.document.documentElement.style.getPropertyValue('--surface-chrome-bottom')).toBe('110.00px');

    h.bottoms.set('planetside', 160);
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.body.classList.contains('surface-trail-yield')).toBe(true);
    expect(h.document.documentElement.style.getPropertyValue('--surface-chrome-bottom')).toBe('80.00px');

    h.styles.set('trail', { display: 'none', visibility: 'visible', opacity: '1' });
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.body.classList.contains('surface-trail-yield')).toBe(true);
    expect(h.document.documentElement.style.getPropertyValue('--surface-chrome-bottom')).toBe('80.00px');

    h.document.body.classList.add('card-open');
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.body.classList.contains('surface-trail-yield')).toBe(false);
    expect(h.document.documentElement.style.getPropertyValue('--surface-chrome-bottom')).toBe('110.00px');

    h.document.body.classList.remove('card-open');
    h.bottoms.set('planetside', 260);
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.body.classList.contains('surface-trail-yield')).toBe(false);
    expect(h.document.documentElement.style.getPropertyValue('--surface-chrome-bottom')).toBe('110.00px');

    /* The portrait cutoff is exact: 72 useful pixels stays visible, while
       71 yields the noninteractive trail. This kills an apparently harmless
       one-pixel threshold drift that the broad examples cannot distinguish. */
    h.bottoms.set('planetside', 188);
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.body.classList.contains('surface-trail-yield')).toBe(false);
    h.bottoms.set('planetside', 187);
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.body.classList.contains('surface-trail-yield')).toBe(true);
    h.bottoms.set('planetside', 260);

    h.setPortrait(false);
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.documentElement.style.getPropertyValue('--surface-chrome-bottom')).toBe('80.00px');

    h.setPortrait(true);
    h.styles.set('objchip', { display: 'block', visibility: 'hidden', opacity: '1' });
    h.styles.set('searchbox', { display: 'block', visibility: 'visible', opacity: '0' });
    h.widths.set('topbar', 0);
    h.controller.syncSurfaceChromeBottom();
    expect(h.document.documentElement.style.getPropertyValue('--surface-chrome-bottom')).toBe('110.00px');
  });

  it('owns exact observer targets, resize ordering, and one idempotent teardown', () => {
    const h = createHarness();
    expect(h.resizeObservers).toHaveLength(7);
    expect(h.resizeObservers.map(({ observed }) => (
      (observed[0] as HTMLElement | undefined)?.id
    ))).toEqual(['topbar', 'dock', 'ctxbar', 'hintpill', 'topbar', 'searchbox', 'objchip']);
    expect(h.resizeObservers.every(({ observed }) => observed.length === 1)).toBe(true);
    expect(h.mutationObservers).toHaveLength(1);
    expect(h.mutationObservers[0]!.observed).toEqual([h.document.body]);
    expect(h.mutationObservers[0]!.options).toEqual([{
      attributes: true,
      attributeFilter: ['class'],
    }]);
    expect(h.addResizeListener).toHaveBeenCalledOnce();

    h.heights.set('topbar', 73);
    h.resizeObservers[0]!.listener();
    expect(h.document.documentElement.style.getPropertyValue('--topbar-h')).toBe('73px');
    h.bottoms.set('trail', 119);
    h.mutationObservers[0]!.listener();
    expect(h.document.documentElement.style.getPropertyValue('--surface-chrome-bottom')).toBe('119.00px');

    const order: string[] = [];
    const setProperty = h.document.documentElement.style.setProperty.bind(
      h.document.documentElement.style,
    );
    const propertySpy = vi.spyOn(h.document.documentElement.style, 'setProperty')
      .mockImplementation((name, value, priority) => {
        order.push(name);
        setProperty(name, value, priority);
      });
    h.viewportResize.mockImplementation(() => { order.push('viewport'); });
    h.resize();
    expect(order).toEqual([
      '--topbar-h', '--row1-h',
      '--dock-h', '--surface-chrome-bottom',
      '--ctx-h', '--surface-chrome-bottom',
      '--hint-h',
      '--surface-chrome-bottom',
      'viewport',
    ]);
    propertySpy.mockRestore();

    const installedListener = h.resizeListener();
    h.controller.dispose();
    h.controller.dispose();
    expect(h.controller.rankCeremonyAnchor()).toBeNull();
    expect(h.removeResizeListener).toHaveBeenCalledOnce();
    expect(h.removeResizeListener).toHaveBeenCalledWith(installedListener);
    for (const observer of h.resizeObservers) expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(h.mutationObservers[0]!.disconnect).toHaveBeenCalledOnce();
  });

  it('fails before installing lifecycle effects when required chrome DOM is absent', () => {
    const dom = new JSDOM(chromeMarkup(), { url: 'https://example.test/' });
    openDoms.push(dom);
    dom.window.document.getElementById('objchip')!.remove();
    const resizeFactory = vi.fn();
    const mutationFactory = vi.fn();
    const addResizeListener = vi.fn();
    expect(() => createAppChromeController({
      document: dom.window.document,
      getComputedStyle: (element) => dom.window.getComputedStyle(element),
      matchMedia: () => ({ matches: false }),
      createResizeObserver: resizeFactory,
      createMutationObserver: mutationFactory,
      addResizeListener,
      removeResizeListener: vi.fn(),
    })).toThrow('missing app chrome element #objchip');
    expect(resizeFactory).not.toHaveBeenCalled();
    expect(mutationFactory).not.toHaveBeenCalled();
    expect(addResizeListener).not.toHaveBeenCalled();
  });
});
