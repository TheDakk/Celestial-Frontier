import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  SpeciesArtModule,
  SpeciesThumbBinding,
  Thumb132,
  ThumbLease,
} from '../apps/game/src/species-art-loader.js';

interface TestWindow extends Window {
  close(): void;
  Element: typeof Element;
  HTMLElement: typeof HTMLElement;
  HTMLButtonElement: typeof HTMLButtonElement;
  HTMLImageElement: typeof HTMLImageElement;
  FocusEvent: typeof FocusEvent;
  Event: typeof Event;
}
interface TestDom { window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const GLOBAL_KEYS = [
  'window', 'document', 'Element', 'HTMLElement', 'HTMLButtonElement',
  'HTMLImageElement', 'FocusEvent', 'Event', 'getComputedStyle',
] as const;
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();
let dom: TestDom;

function setGlobal(key: string, value: unknown): void {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}

function installDom(): void {
  for (const key of GLOBAL_KEYS) originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.test/' });
  setGlobal('window', dom.window);
  setGlobal('document', dom.window.document);
  setGlobal('Element', dom.window.Element);
  setGlobal('HTMLElement', dom.window.HTMLElement);
  setGlobal('HTMLButtonElement', dom.window.HTMLButtonElement);
  setGlobal('HTMLImageElement', dom.window.HTMLImageElement);
  setGlobal('FocusEvent', dom.window.FocusEvent);
  setGlobal('Event', dom.window.Event);
  setGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window));
  Object.defineProperty(dom.window.HTMLElement.prototype, 'getClientRects', {
    configurable: true,
    value: () => [{ left: 0, top: 0, right: 100, bottom: 44, width: 100, height: 44 }],
  });
}

function restoreDom(): void {
  dom.window.close();
  for (const key of GLOBAL_KEYS) {
    const original = originalGlobals.get(key);
    if (original) Object.defineProperty(globalThis, key, original);
    else Reflect.deleteProperty(globalThis, key);
  }
  originalGlobals.clear();
}

async function turns(count = 2): Promise<void> {
  for (let index = 0; index < count; index++) await Promise.resolve();
}

beforeEach(() => {
  vi.resetModules();
  installDom();
});

afterEach(() => restoreDom());

describe('Compendium variable-height window', () => {
  it('bounds 1,500 logical rows, exposes spacer/position semantics, and pins focused native buttons', async () => {
    const { CompendiumVirtualList } = await import('../apps/game/src/compendium.js');
    const scroller = document.createElement('div');
    scroller.setAttribute('role', 'group');
    scroller.setAttribute('aria-label', 'Compendium species');
    document.body.append(scroller);
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 220 });
    const rows = Array.from({ length: 1500 }, (_, index) => ({
      logicalId: `set:fixture/species:${index}`,
      sourceIndex: index,
      value: { height: 44 + (index % 4) * 11 },
    }));
    let live = 0;
    const list = new CompendiumVirtualList({
      scroller,
      rows,
      createResizeObserver: () => null,
      mountRow: (row) => {
        live++;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = row.logicalId;
        Object.defineProperty(button, 'getBoundingClientRect', {
          configurable: true,
          value: () => ({
            x: 0, y: 0, left: 0, top: 0, right: 300, bottom: row.value.height,
            width: 300, height: row.value.height, toJSON: () => ({}),
          }),
        });
        return { element: button, dispose: () => { live--; } };
      },
    });
    list.refreshMeasurements();

    const row0 = scroller.querySelector<HTMLElement>('[data-cid="set:fixture/species:0"]')!;
    const row1 = scroller.querySelector<HTMLElement>('[data-cid="set:fixture/species:1"]')!;
    const row2 = scroller.querySelector<HTMLElement>('[data-cid="set:fixture/species:2"]')!;
    expect([row0.style.top, row1.style.top, row2.style.top]).toEqual(['0px', '44px', '99px']);

    /* A height correction above the current logical anchor must move the
       physical scrollTop by the same delta. A no-op measurement path would
       otherwise keep the mount-count assertions green while rows overlap. */
    scroller.scrollTop = 120; // row 2, 21px below its measured 99px offset
    rows[0]!.value.height = 88;
    list.refreshMeasurements();
    expect(row1.style.top).toBe('88px');
    expect(row2.style.top).toBe('143px');
    expect(scroller.scrollTop).toBe(164);
    const returnState = list.captureState();
    expect(returnState).toMatchObject({
      scrollTop: 164,
      anchorLogicalId: 'set:fixture/species:2',
      anchorOffsetPx: 21,
      anchorHeightPx: 66,
    });
    scroller.scrollTop = 80;
    const tallAnchorReturnState = list.captureState();
    expect(tallAnchorReturnState).toMatchObject({
      anchorLogicalId: 'set:fixture/species:0',
      anchorOffsetPx: 80,
      anchorHeightPx: 88,
    });

    expect(list.snapshot().mountedRowCount).toBeLessThan(16);
    expect(scroller.querySelector('[data-sel="codex-before-spacer"]')).not.toBeNull();
    expect(scroller.querySelector('[data-sel="codex-after-spacer"]')).not.toBeNull();
    const first = scroller.querySelector<HTMLButtonElement>('[data-cid="set:fixture/species:0"]')!;
    expect(first).toBeInstanceOf(HTMLButtonElement);
    const positionId = first.getAttribute('aria-describedby');
    const semanticOutcome = (): boolean => scroller.getAttribute('role') === 'group'
      && scroller.getAttribute('aria-label') === 'Compendium species'
      && first.getAttribute('role') === null
      && !first.hasAttribute('aria-setsize')
      && !first.hasAttribute('aria-posinset')
      && positionId !== null
      && document.getElementById(positionId)?.textContent === 'Item 1 of 1500';
    expect(semanticOutcome()).toBe(true);

    /* Negative control: the former attributes are unsupported by the native
       button role. Reintroducing that false semantic contract must fail. */
    first.setAttribute('aria-setsize', '1500');
    first.setAttribute('aria-posinset', '1');
    expect(semanticOutcome()).toBe(false);
    first.removeAttribute('aria-setsize');
    first.removeAttribute('aria-posinset');
    expect(semanticOutcome()).toBe(true);

    first.focus();
    scroller.scrollTop = 24_000;
    scroller.dispatchEvent(new dom.window.Event('scroll'));
    const moved = list.snapshot();
    expect(moved.start).toBeGreaterThan(300);
    expect(moved.mountedRowCount).toBeLessThan(18);
    expect(moved.mountedLogicalIds).toContain('set:fixture/species:0');
    expect(moved.pinnedLogicalIds).toEqual(['set:fixture/species:0']);
    expect(document.activeElement).toBe(first);
    expect(Number.parseFloat((scroller.querySelector<HTMLElement>('[data-sel="codex-before-spacer"]')!).style.height)).toBeGreaterThan(0);
    expect(Number.parseFloat((scroller.querySelector<HTMLElement>('[data-sel="codex-after-spacer"]')!).style.height)).toBeGreaterThan(0);

    /* A newly constructed list has only estimated heights. Restoring by raw
       scrollTop would therefore drift to another logical row; the saved
       logical anchor + intra-row offset must survive that reset. */
    const restoredScroller = document.createElement('div');
    document.body.append(restoredScroller);
    Object.defineProperty(restoredScroller, 'clientHeight', { configurable: true, value: 220 });
    const restoredList = new CompendiumVirtualList({
      scroller: restoredScroller,
      rows,
      createResizeObserver: () => null,
      mountRow: () => {
        const button = document.createElement('button');
        button.type = 'button';
        return { element: button };
      },
    });
    restoredList.restoreState(tallAnchorReturnState);
    expect(restoredList.captureState()).toMatchObject({
      anchorLogicalId: tallAnchorReturnState.anchorLogicalId,
      anchorOffsetPx: tallAnchorReturnState.anchorOffsetPx,
      anchorHeightPx: tallAnchorReturnState.anchorHeightPx,
    });
    restoredList.dispose();

    list.dispose();
    expect(live).toBe(0);
  });

  it('rerenders on viewport expansion/contraction and keeps description ids instance-safe', async () => {
    const { CompendiumVirtualList } = await import('../apps/game/src/compendium.js');
    const scroller = document.createElement('div');
    scroller.setAttribute('role', 'group');
    scroller.setAttribute('aria-label', 'Compendium species');
    document.body.append(scroller);
    let viewportHeight = 116;
    Object.defineProperty(scroller, 'clientHeight', {
      configurable: true,
      get: () => viewportHeight,
    });
    const rows = Array.from({ length: 100 }, (_, index) => ({
      logicalId: `viewport:${index}`,
      sourceIndex: index,
      value: index,
    }));
    let resizeListener: ((entries: readonly ResizeObserverEntry[]) => void) | null = null;
    const observed: Element[] = [];
    const observe = vi.fn((target: Element) => { observed.push(target); });
    const unobserve = vi.fn((_target: Element) => {});
    const disconnect = vi.fn(() => {});
    const list = new CompendiumVirtualList({
      scroller,
      rows,
      createResizeObserver: (listener) => {
        resizeListener = listener;
        return { observe, unobserve, disconnect };
      },
      mountRow: (row) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(row.value);
        return { element: button };
      },
    });
    const emitViewportResize = (): void => {
      if (!resizeListener) throw new Error('viewport ResizeObserver listener was not installed');
      resizeListener([{ target: scroller } as unknown as ResizeObserverEntry]);
    };
    expect(observed).toContain(scroller);
    const initial = list.snapshot();

    viewportHeight = 464;
    expect(list.snapshot().end).toBe(initial.end); // no resize signal, no false-green rerender
    emitViewportResize();
    const expanded = list.snapshot();
    expect(expanded.end).toBeGreaterThan(initial.end);
    expect(expanded.mountedRowCount).toBeGreaterThan(initial.mountedRowCount);

    viewportHeight = 58;
    expect(list.snapshot().end).toBe(expanded.end); // contraction also requires the owner signal
    emitViewportResize();
    const contracted = list.snapshot();
    expect(contracted.end).toBeLessThan(expanded.end);
    expect(contracted.mountedRowCount).toBeLessThan(expanded.mountedRowCount);

    const secondScroller = document.createElement('div');
    document.body.append(secondScroller);
    Object.defineProperty(secondScroller, 'clientHeight', { configurable: true, value: 58 });
    const secondList = new CompendiumVirtualList({
      scroller: secondScroller,
      rows: rows.slice(0, 1),
      createResizeObserver: () => null,
      mountRow: () => {
        const button = document.createElement('button');
        button.type = 'button';
        return { element: button };
      },
    });
    const firstDescription = scroller.querySelector<HTMLButtonElement>('[data-cid="viewport:0"]')
      ?.getAttribute('aria-describedby');
    const secondDescription = secondScroller.querySelector<HTMLButtonElement>('[data-cid="viewport:0"]')
      ?.getAttribute('aria-describedby');
    expect(firstDescription).toBeTruthy();
    expect(secondDescription).toBeTruthy();
    expect(secondDescription).not.toBe(firstDescription);

    secondList.dispose();
    list.dispose();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('negative control: an unwindowed 1,500-row mount exceeds the sealed bound', () => {
    const unwindowed = document.createElement('div');
    for (let index = 0; index < 1500; index++) unwindowed.append(document.createElement('button'));
    expect(unwindowed.querySelectorAll('button').length).toBeGreaterThan(18);
  });
});

describe('species thumbnail lease binding', () => {
  it('keeps the side-effectful species module idle until a real owner requests it', async () => {
    const { SpeciesArtLoader } = await import('../apps/game/src/species-art-loader.js');
    const importer = vi.fn<() => Promise<SpeciesArtModule>>(() => new Promise(() => {}));
    const loader = new SpeciesArtLoader(importer, () => true);
    expect(importer).not.toHaveBeenCalled();
    expect(loader.diagnostics()).toEqual({ state: 'idle', importStarts: 0 });
    expect(loader.artDiagnostics()).toBeNull();
    loader.request('real-mounted-row', () => {});
    expect(importer).toHaveBeenCalledOnce();
    expect(loader.diagnostics()).toEqual({ state: 'loading', importStarts: 1 });
  });

  it('drops stale completion, never mounts a 440 asset, and releases/unsubscribes once', async () => {
    const { SpeciesArtLoader, bindSpeciesThumb } = await import('../apps/game/src/species-art-loader.js');
    let resolveArt!: (art: SpeciesArtModule) => void;
    const pending = new Promise<SpeciesArtModule>((resolve) => { resolveArt = resolve; });
    let listener: ((asset: Thumb132 | null, error?: unknown) => void) | null = null;
    const unsubscribe = vi.fn();
    const release = vi.fn();
    const lease: ThumbLease = {
      key: 'visual:complete-genome' as ThumbLease['key'],
      current: null,
      subscribe(next) { listener = next; return unsubscribe; },
      release,
    };
    const art: SpeciesArtModule = {
      speciesPortrait: () => 'data:image/png;440',
      speciesThumb: () => 'compatibility-only',
      leaseThumb: () => lease,
    };
    const loader = new SpeciesArtLoader(() => pending, () => true);
    const image = document.createElement('img');
    document.body.append(image);
    let current = true;
    const stale = vi.fn();
    const binding = bindSpeciesThumb(loader, {
      owner: 'row:g1:visual', image, genome: { seed: 7, parents: [2, 9] },
      isCurrent: () => current, onStale: stale,
    });
    expect(image.alt).toBe('');
    expect(image.hasAttribute('src')).toBe(false);
    expect(loader.diagnostics()).toEqual({ state: 'loading', importStarts: 1 });
    resolveArt(art);
    await turns(3);
    expect(listener).not.toBeNull();

    current = false;
    listener!({
      key: lease.key, url: 'data:image/png;base64,thumb', width: 132, height: 132,
      encodedBytes: 24, decodedPixels: 132 * 132,
    });
    expect(image.hasAttribute('src')).toBe(false);
    expect(stale).toHaveBeenCalledOnce();
    binding.release();
    binding.release();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();

    const warmImage = document.createElement('img');
    document.body.append(warmImage);
    const badLease: ThumbLease = {
      key: lease.key,
      current: {
        key: lease.key, url: 'data:image/png;base64,full', width: 440, height: 440,
        encodedBytes: 99, decodedPixels: 440 * 440,
      } as unknown as Thumb132,
      subscribe: () => () => {}, release: vi.fn(),
    };
    art.leaseThumb = () => badLease;
    const badBinding = bindSpeciesThumb(loader, {
      owner: 'row:g2:visual', image: warmImage, genome: { seed: 8 }, isCurrent: () => true,
    });
    expect(warmImage.hasAttribute('src')).toBe(false);
    badBinding.release();

    const { SpeciesThumbLeaseGroup } = await import('../apps/game/src/species-art-loader.js');
    const ownedImage = document.createElement('img');
    document.body.append(ownedImage);
    const ownedLease: ThumbLease = {
      key: 'visual:planetside-owned' as ThumbLease['key'],
      current: {
        key: 'visual:planetside-owned' as ThumbLease['key'],
        url: 'data:image/png;base64,owned132', width: 132, height: 132,
        encodedBytes: 31, decodedPixels: 132 * 132,
      },
      subscribe: () => () => {}, release: vi.fn(),
    };
    art.leaseThumb = () => ownedLease;
    const group = new SpeciesThumbLeaseGroup(8);
    group.add(bindSpeciesThumb(loader, {
      owner: 'planetside:g1:0', image: ownedImage, genome: { seed: 11 }, isCurrent: () => true,
    }));
    expect(ownedImage.getAttribute('src')).toBe('data:image/png;base64,owned132');
    expect(ownedImage.dataset.visualKey).toBe('visual:planetside-owned');
    group.clear();   // the same operation Planetside uses on hide/refill/world change
    expect(ownedLease.release).toHaveBeenCalledOnce();
    expect(ownedImage.hasAttribute('src')).toBe(false);
    expect(ownedImage.dataset.visualKey).toBeUndefined();
    expect(ownedImage.dataset.thumbState).toBe('released');

    const reusedImage = document.createElement('img');
    document.body.append(reusedImage);
    let key = 'visual:old';
    art.leaseThumb = () => {
      const leaseKey = key as ThumbLease['key'];
      return {
        key: leaseKey,
        current: {
          key: leaseKey, url: `data:image/png;base64,${key}`, width: 132, height: 132,
          encodedBytes: 12, decodedPixels: 132 * 132,
        },
        subscribe: () => () => {}, release: vi.fn(),
      };
    };
    const oldBinding = bindSpeciesThumb(loader, {
      owner: 'row:old', image: reusedImage, genome: { seed: 12 }, isCurrent: () => true,
    });
    key = 'visual:new';
    const newBinding = bindSpeciesThumb(loader, {
      owner: 'row:new', image: reusedImage, genome: { seed: 13 }, isCurrent: () => true,
    });
    oldBinding.release();
    expect(reusedImage.getAttribute('src')).toBe('data:image/png;base64,visual:new');
    expect(reusedImage.dataset.visualKey).toBe('visual:new');
    newBinding.release();
    expect(reusedImage.hasAttribute('src')).toBe(false);
  });

  it('Planetside lease group releases on refill/hide and enforces the eight-chip bound', async () => {
    const { SpeciesThumbLeaseGroup } = await import('../apps/game/src/species-art-loader.js');
    const group = new SpeciesThumbLeaseGroup(8);
    const releases = Array.from({ length: 9 }, () => vi.fn());
    const binding = (index: number): SpeciesThumbBinding => ({
      visualKey: () => `visual:${index}`,
      release: releases[index]!,
    });
    for (let index = 0; index < 8; index++) group.add(binding(index));
    expect(group.size).toBe(8);
    expect(() => group.add(binding(8))).toThrow(/8-item bound/);
    expect(releases[8]).toHaveBeenCalledOnce();
    group.clear();
    for (let index = 0; index < 8; index++) expect(releases[index]).toHaveBeenCalledOnce();
    group.clear();
    for (let index = 0; index < 8; index++) expect(releases[index]).toHaveBeenCalledOnce();

    group.add(binding(0));
    group.clear();
    expect(releases[0]).toHaveBeenCalledTimes(2);   // the next refill released its new owner
  });
});

describe('panel visible-to-hidden lifecycle', () => {
  it('calls onClose only once per real transition, including one-panel switching', async () => {
    document.body.innerHTML = `
      <button id="a-open">A</button><button id="b-open">B</button>
      <aside id="a" aria-label="A"></aside><aside id="b" aria-label="B"></aside>
      <div id="importsheet"></div><button id="docksurvey">Survey</button><canvas></canvas>`;
    const panels = await import('../apps/game/src/panels.js');
    const closeA = vi.fn(), closeB = vi.fn();
    panels.registerPanel({
      id: 'a', el: document.getElementById('a')!,
      btns: [document.getElementById('a-open')], onClose: closeA,
    });
    panels.registerPanel({
      id: 'b', el: document.getElementById('b')!,
      btns: [document.getElementById('b-open')], onClose: closeB,
    });
    panels.closePanels();
    expect(closeA).not.toHaveBeenCalled();
    panels.openPanel('a', document.getElementById('a-open'));
    panels.openPanel('b', document.getElementById('b-open'));
    expect(closeA).toHaveBeenCalledOnce();
    expect(closeB).not.toHaveBeenCalled();
    panels.closePanels();
    panels.closePanels();
    expect(closeA).toHaveBeenCalledOnce();
    expect(closeB).toHaveBeenCalledOnce();
  });
});
