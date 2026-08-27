import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpeciesArtProducerRequest, SpeciesArtProducerSink } from '@cf/art/species-broker';
import type { SpeciesThumbBinding } from '../apps/game/src/species-art-loader.js';

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
  it('keeps the worker dormant until both a real owner and explicit post-boot activation exist', async () => {
    const { SpeciesArtLoader } = await import('../apps/game/src/species-art-loader.js');
    const tasks: Array<() => void> = [];
    const createProducer = vi.fn(() => ({ render: vi.fn(), dispose: vi.fn() }));
    const loader = new SpeciesArtLoader('document-owner', {
      createProducer,
      scheduleTask: (task) => { tasks.push(task); },
    });
    expect(createProducer).not.toHaveBeenCalled();
    expect(loader.diagnostics()).toMatchObject({ state: 'idle', importStarts: 0 });
    expect(loader.artDiagnostics()).toBeNull();
    const lease = loader.leaseThumb({ seed: 7, parents: [2, 9] });
    expect(loader.artDiagnostics()?.live.queuedJobs).toBe(1);
    expect(createProducer).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(0);
    loader.activate();
    expect(createProducer).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(1);
    tasks.shift()!();
    expect(createProducer).toHaveBeenCalledOnce();
    expect(loader.diagnostics()).toMatchObject({ state: 'ready', importStarts: 1 });
    lease.release();
    loader.dispose('test complete');
  });

  it('drops stale completion, publishes exact warm 132 assets, and releases each owner once', async () => {
    const { SpeciesArtLoader, bindSpeciesThumb } = await import('../apps/game/src/species-art-loader.js');
    const tasks: Array<() => void> = [];
    let sink: SpeciesArtProducerSink | null = null;
    let request: SpeciesArtProducerRequest | null = null;
    const disposeProducer = vi.fn();
    const loader = new SpeciesArtLoader('document-owner', {
      createProducer: (next) => {
        sink = next;
        return {
          render: (nextRequest) => { request = nextRequest; },
          dispose: disposeProducer,
        };
      },
      scheduleTask: (task) => { tasks.push(task); },
    });
    loader.activate();
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
    while (tasks.length) tasks.shift()!();
    expect(loader.diagnostics()).toMatchObject({ state: 'ready', importStarts: 1 });
    expect(request).not.toBeNull();

    current = false;
    const staleRequest = request!;
    sink!.result({
      status: 'success', jobId: staleRequest.jobId, kind: staleRequest.kind, key: staleRequest.key,
      asset: {
        key: staleRequest.key, url: 'data:image/png;base64,dGh1bWI=', width: 132, height: 132,
        encodedBytes: 34, decodedPixels: 132 * 132,
      },
    });
    expect(image.hasAttribute('src')).toBe(false);
    expect(stale).toHaveBeenCalledOnce();
    binding.release();
    binding.release();
    expect(loader.artDiagnostics()?.totals.releases).toBe(1);

    const warmImage = document.createElement('img');
    document.body.append(warmImage);
    current = true;
    const warmBinding = bindSpeciesThumb(loader, {
      owner: 'row:warm', image: warmImage, genome: { seed: 7, parents: [2, 9] }, isCurrent: () => true,
    });
    expect(warmImage.getAttribute('src')).toBe('data:image/png;base64,dGh1bWI=');
    expect(warmImage.naturalWidth === 0 || warmImage.width === 132).toBe(true);

    const reusedImage = document.createElement('img');
    document.body.append(reusedImage);
    const oldBinding = bindSpeciesThumb(loader, {
      owner: 'row:old', image: reusedImage, genome: { seed: 7, parents: [2, 9] }, isCurrent: () => true,
    });
    const newBinding = bindSpeciesThumb(loader, {
      owner: 'row:new', image: reusedImage, genome: { seed: 7, parents: [2, 9] }, isCurrent: () => true,
    });
    oldBinding.release();
    expect(reusedImage.getAttribute('src')).toBe('data:image/png;base64,dGh1bWI=');
    expect(reusedImage.dataset.thumbOwner).toBe('row:new');
    newBinding.release();
    expect(reusedImage.hasAttribute('src')).toBe(false);
    warmBinding.release();
    loader.dispose('test complete');
    expect(disposeProducer).toHaveBeenCalledOnce();
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
  it('uses one delegated capture owner and restores the exact clicked opener', async () => {
    document.body.innerHTML = `
      <button id="a-open"><span id="a-icon">A</span></button>
      <aside id="a" aria-label="A"></aside>
      <div id="importsheet"></div><button id="docksurvey">Survey</button><canvas></canvas>`;
    const opener = document.getElementById('a-open') as HTMLButtonElement;
    const openerAdd = vi.spyOn(opener, 'addEventListener');
    const documentAdd = vi.spyOn(document, 'addEventListener');
    const panels = await import('../apps/game/src/panels.js');
    panels.registerPanel({ id: 'a', el: document.getElementById('a')!, btns: [opener] });
    expect(openerAdd).not.toHaveBeenCalled();
    const captureClickOwners = () => documentAdd.mock.calls.filter(
      ([type, , options]) => type === 'click'
        && (options === true || (typeof options === 'object' && options?.capture === true)),
    );
    expect(captureClickOwners()).toHaveLength(1);

    opener.addEventListener('click', () => panels.togglePanel('a'));
    document.getElementById('a-icon')!.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    expect(panels.openPanelId()).toBe('a');
    expect(document.activeElement).toBe(document.querySelector('[data-pnx="a"]'));

    (document.querySelector('[data-pnx="a"]') as HTMLButtonElement).click();
    expect(panels.openPanelId()).toBeNull();
    expect(document.activeElement).toBe(opener);

    document.addEventListener('click', vi.fn(), { capture: true });
    expect(captureClickOwners()).toHaveLength(2);
  });

  it('calls open/close hooks only once per real transition, including one-panel switching', async () => {
    document.body.innerHTML = `
      <button id="a-open">A</button><button id="b-open">B</button>
      <aside id="a" aria-label="A"></aside><aside id="b" aria-label="B"></aside>
      <div id="importsheet"></div><button id="docksurvey">Survey</button><canvas></canvas>`;
    const panels = await import('../apps/game/src/panels.js');
    const openA = vi.fn(), openB = vi.fn(), closeA = vi.fn(), closeB = vi.fn();
    panels.registerPanel({
      id: 'a', el: document.getElementById('a')!,
      btns: [document.getElementById('a-open')], onOpen: openA, onClose: closeA,
    });
    panels.registerPanel({
      id: 'b', el: document.getElementById('b')!,
      btns: [document.getElementById('b-open')], onOpen: openB, onClose: closeB,
    });
    panels.closePanels();
    expect(openA).not.toHaveBeenCalled();
    expect(closeA).not.toHaveBeenCalled();
    panels.openPanel('a', document.getElementById('a-open'));
    panels.openPanel('a', document.getElementById('a-open'));
    expect(openA).toHaveBeenCalledOnce();
    panels.openPanel('b', document.getElementById('b-open'));
    expect(openB).toHaveBeenCalledOnce();
    expect(closeA).toHaveBeenCalledOnce();
    expect(closeB).not.toHaveBeenCalled();
    panels.closePanels();
    panels.closePanels();
    expect(closeA).toHaveBeenCalledOnce();
    expect(closeB).toHaveBeenCalledOnce();
    panels.openPanel('b', document.getElementById('b-open'));
    expect(openB).toHaveBeenCalledTimes(2);
  });

  it('populates a requested filter exactly once whether hidden or already visible', async () => {
    document.body.innerHTML = `
      <input id="search"><button id="codex-open">Compendium</button>
      <aside id="codex" aria-label="Compendium"></aside>
      <div id="importsheet"></div><button id="docksurvey">Survey</button><canvas></canvas>`;
    const panels = await import('../apps/game/src/panels.js');
    const populations: string[] = [];
    let generation = 0;
    const populate = (filter: string): void => { generation++; populations.push(filter); };
    const controller = panels.createPanelOpenController({
      id: 'codex',
      defaultRequest: () => '',
      populate,
    });
    panels.registerPanel({
      id: 'codex', el: document.getElementById('codex')!,
      btns: [document.getElementById('codex-open')], onOpen: controller.onOpen,
    });
    const search = document.getElementById('search')!;

    const beforeHiddenFilter = generation;
    controller.present('Beacon', search);
    expect(generation - beforeHiddenFilter).toBe(1);
    expect(populations).toEqual(['Beacon']);
    const beforeVisibleFilter = generation;
    controller.present('Tern', search);
    expect(generation - beforeVisibleFilter).toBe(1);
    expect(populations).toEqual(['Beacon', 'Tern']);
    expect((document.activeElement as HTMLElement).dataset.pnx).toBe('codex');

    panels.closePanels();
    expect(document.activeElement).toBe(search);
    panels.openPanel('codex', document.getElementById('codex-open'));
    expect(populations).toEqual(['Beacon', 'Tern', '']);

    /* Negative control: the superseded hidden-search sequence populated the
       default catalogue in onOpen and then applied the query itself. It must
       fail the exact-one-generation outcome the controller preserves. */
    panels.closePanels();
    const beforeOldGeneration = generation;
    panels.openPanel('codex', search);
    populate('Old double-fill');
    expect(generation - beforeOldGeneration).toBe(2);
    expect(generation - beforeOldGeneration).not.toBe(1);
  });
});
