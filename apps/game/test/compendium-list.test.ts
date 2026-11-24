// @vitest-environment jsdom
// The bounded, focus-safe list of the Compendium. The first two tests are SOURCE tests/compendium-ui.test.ts:71-279.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompendiumVirtualList, type CompendiumWindowSnapshot } from '../src/compendium';

afterEach(() => { document.body.replaceChildren(); });

const plainButton = (): { element: HTMLButtonElement } => {
  const element = document.createElement('button');
  element.type = 'button';
  return { element };
};
const scrollerOf = (height: number): HTMLDivElement => {
  const scroller = document.createElement('div');
  document.body.append(scroller);
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: height });
  return scroller;
};
const rowsOf = (count: number) => Array.from({ length: count }, (_, index) => ({ logicalId: `row:${index}`, sourceIndex: index, value: index }));

describe('the Compendium list', () => {
  it('bounds 1,500 logical rows, exposes spacer/position semantics, and pins focused native buttons', () => {
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
    scroller.dispatchEvent(new Event('scroll'));
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

  it('rerenders on viewport expansion/contraction and keeps description ids instance-safe', () => {
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

  it('the position description is out of sight but still read', () => {
    const scroller = scrollerOf(220);
    const list = new CompendiumVirtualList({ scroller, rows: rowsOf(3), createResizeObserver: () => null, mountRow: plainButton });
    const first = scroller.querySelector<HTMLButtonElement>('[data-cid="row:0"]')!;
    const description = document.getElementById(first.getAttribute('aria-describedby')!)!;
    expect(description.textContent).toBe('Item 1 of 3');
    expect([description.style.position, description.style.width, description.style.overflow]).toEqual(['absolute', '1px', 'hidden']);
    expect(description.hasAttribute('aria-hidden')).toBe(false);
    list.dispose();
  });

  it('focuses the first row on request, tells its owner of each window, and re-reads the viewport when asked', () => {
    const scroller = scrollerOf(116);
    let height = 116;
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, get: () => height });
    const windows: CompendiumWindowSnapshot[] = [];
    const list = new CompendiumVirtualList({ scroller, rows: rowsOf(100), createResizeObserver: () => null, mountRow: plainButton, onWindowChange: (snapshot) => { windows.push(snapshot); } });
    expect(windows.at(-1)).toEqual(list.snapshot());
    const before = list.snapshot().end;
    height = 464; // the panel was hidden and is now shown
    list.refreshWindow();
    expect(list.snapshot().end).toBeGreaterThan(before);
    expect(windows.at(-1)!.end).toBe(list.snapshot().end);
    expect(list.focusFirst()).toBe(true);
    expect(document.activeElement).toBe(scroller.querySelector('[data-cid="row:0"]'));
    expect(list.snapshot().focusedLogicalId).toBe('row:0');
    list.dispose();
    const empty = new CompendiumVirtualList({ scroller: scrollerOf(116), rows: [], createResizeObserver: () => null, mountRow: plainButton });
    expect(empty.focusFirst()).toBe(false);
    expect(empty.snapshot()).toMatchObject({ start: 0, end: 0, mountedRowCount: 0 });
    empty.dispose();
  });

  it('refuses two rows of one id, and a row that is not a native button', () => {
    const twice = [{ logicalId: 'same', sourceIndex: 0, value: 0 }, { logicalId: 'same', sourceIndex: 1, value: 1 }];
    expect(() => new CompendiumVirtualList({ scroller: scrollerOf(116), rows: twice, createResizeObserver: () => null, mountRow: plainButton }))
      .toThrow('duplicate Compendium logical row id: same');
    const disposed = vi.fn();
    expect(() => new CompendiumVirtualList({ scroller: scrollerOf(116), rows: rowsOf(1), createResizeObserver: () => null,
      mountRow: () => ({ element: document.createElement('div') as unknown as HTMLButtonElement, dispose: disposed }) }))
      .toThrow('Compendium virtual rows must be native type=button controls');
    expect(disposed).toHaveBeenCalledOnce();
  });
});
