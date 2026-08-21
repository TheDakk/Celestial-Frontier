/* compendium.ts — bounded, focus-safe variable-height list ownership.
   Rows are absolutely positioned over one scroll extent: unmounted rows keep
   their measured space, while a focused row can remain connected outside the
   ordinary window without forcing every row between it and the viewport to
   mount. */

export interface CompendiumVirtualRow<T> {
  readonly logicalId: string;
  readonly sourceIndex: number;
  readonly value: T;
}

export interface CompendiumMountedRow {
  readonly element: HTMLButtonElement;
  dispose?(): void;
}

export interface CompendiumWindowSnapshot {
  readonly start: number;
  readonly end: number;
  readonly overscan: number;
  readonly beforePx: number;
  readonly afterPx: number;
  readonly mountedRowCount: number;
  readonly mountedLogicalIds: readonly string[];
  readonly focusedLogicalId: string | null;
  readonly pinnedLogicalIds: readonly string[];
}

export interface CompendiumReturnState {
  readonly scrollTop: number;
  readonly focusedLogicalId: string | null;
  readonly anchorLogicalId: string | null;
  readonly anchorOffsetPx: number;
  readonly anchorHeightPx: number;
}

interface ResizeObserverLike {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

export interface CompendiumVirtualListOptions<T> {
  readonly scroller: HTMLElement;
  readonly rows: readonly CompendiumVirtualRow<T>[];
  readonly mountRow: (
    row: CompendiumVirtualRow<T>,
    logicalPosition: number,
    logicalSize: number,
  ) => CompendiumMountedRow;
  readonly estimatedRowHeight?: number;
  readonly minimumRowHeight?: number;
  readonly overscanRatio?: number;
  readonly fallbackViewportHeight?: number;
  readonly createResizeObserver?: (listener: (entries: readonly ResizeObserverEntry[]) => void) => ResizeObserverLike | null;
  readonly onWindowChange?: (snapshot: CompendiumWindowSnapshot) => void;
}

type LiveRow<T> = {
  readonly row: CompendiumVirtualRow<T>;
  readonly mounted: CompendiumMountedRow;
  readonly positionDescription: HTMLSpanElement;
};

let nextVirtualListInstance = 0;

function allocatePositionDescriptionPrefix(): string {
  let prefix = '';
  do {
    prefix = `compendium-row-position-${++nextVirtualListInstance}`;
  } while (document.querySelector(`[id^="${prefix}-"]`));
  return prefix;
}

const defaultResizeObserver = (
  listener: (entries: readonly ResizeObserverEntry[]) => void,
): ResizeObserverLike | null => typeof ResizeObserver === 'undefined'
  ? null
  : new ResizeObserver((entries) => listener(entries));

function finiteHeight(value: number, floor: number): number | null {
  return Number.isFinite(value) && value > 0 ? Math.max(floor, value) : null;
}

export class CompendiumVirtualList<T> {
  private readonly scroller: HTMLElement;
  private readonly rows: readonly CompendiumVirtualRow<T>[];
  private readonly mountRow: CompendiumVirtualListOptions<T>['mountRow'];
  private readonly estimatedHeight: number;
  private readonly minimumHeight: number;
  private readonly overscanRatio: number;
  private readonly fallbackViewportHeight: number;
  private readonly onWindowChange: ((snapshot: CompendiumWindowSnapshot) => void) | undefined;
  private readonly heights = new Map<string, number>();
  private readonly rowIndex = new Map<string, number>();
  private readonly mounted = new Map<string, LiveRow<T>>();
  private readonly extent: HTMLDivElement;
  private readonly beforeSpacer: HTMLDivElement;
  private readonly afterSpacer: HTMLDivElement;
  private readonly observer: ResizeObserverLike | null;
  private readonly positionDescriptionPrefix: string;
  private offsets: number[] = [];
  private focusedId: string | null = null;
  private start0 = 0;
  private end0 = 0;
  private overscan0 = 0;
  private disposed = false;

  constructor(options: CompendiumVirtualListOptions<T>) {
    this.scroller = options.scroller;
    this.rows = options.rows;
    this.mountRow = options.mountRow;
    this.estimatedHeight = Math.max(44, options.estimatedRowHeight ?? 58);
    this.minimumHeight = Math.max(44, options.minimumRowHeight ?? 44);
    this.overscanRatio = Math.max(0, options.overscanRatio ?? 0.5);
    this.fallbackViewportHeight = Math.max(44, options.fallbackViewportHeight ?? 480);
    this.onWindowChange = options.onWindowChange;
    this.positionDescriptionPrefix = allocatePositionDescriptionPrefix();
    for (let index = 0; index < this.rows.length; index++) {
      const id = this.rows[index]!.logicalId;
      if (this.rowIndex.has(id)) throw new Error(`duplicate Compendium logical row id: ${id}`);
      this.rowIndex.set(id, index);
    }

    this.extent = document.createElement('div');
    this.extent.className = 'compendium-virtual-extent';
    this.extent.setAttribute('data-sel', 'codex-virtual-extent');
    this.beforeSpacer = document.createElement('div');
    this.beforeSpacer.className = 'compendium-spacer';
    this.beforeSpacer.setAttribute('data-sel', 'codex-before-spacer');
    this.beforeSpacer.setAttribute('aria-hidden', 'true');
    this.afterSpacer = document.createElement('div');
    this.afterSpacer.className = 'compendium-spacer';
    this.afterSpacer.setAttribute('data-sel', 'codex-after-spacer');
    this.afterSpacer.setAttribute('aria-hidden', 'true');
    this.extent.append(this.beforeSpacer, this.afterSpacer);
    this.scroller.replaceChildren(this.extent);
    this.scroller.addEventListener('scroll', this.onScroll, { passive: true });
    this.scroller.addEventListener('focusin', this.onFocusIn);
    this.scroller.addEventListener('focusout', this.onFocusOut);
    this.observer = (options.createResizeObserver ?? defaultResizeObserver)((entries) => this.onResize(entries));
    this.recomputeOffsets();
    this.render();
    this.observer?.observe(this.scroller);
  }

  snapshot(): CompendiumWindowSnapshot {
    const mountedLogicalIds = [...this.mounted.values()]
      .sort((a, b) => this.rowIndex.get(a.row.logicalId)! - this.rowIndex.get(b.row.logicalId)!)
      .map(({ row }) => row.logicalId);
    const focusedLogicalId = this.focusedRowInDocument();
    return Object.freeze({
      start: this.start0,
      end: this.end0,
      overscan: this.overscan0,
      beforePx: this.offsets[this.start0] ?? 0,
      afterPx: Math.max(0, (this.offsets[this.rows.length] ?? 0) - (this.offsets[this.end0] ?? 0)),
      mountedRowCount: mountedLogicalIds.length,
      mountedLogicalIds: Object.freeze(mountedLogicalIds),
      focusedLogicalId,
      pinnedLogicalIds: Object.freeze(this.focusedId ? [this.focusedId] : []),
    });
  }

  captureState(): CompendiumReturnState {
    const scrollTop = this.scroller.scrollTop;
    const anchorIndex = this.rows.length ? this.indexAt(scrollTop) : 0;
    const anchorLogicalId = this.rows[anchorIndex]?.logicalId ?? null;
    return Object.freeze({
      scrollTop,
      focusedLogicalId: this.focusedRowInDocument(),
      anchorLogicalId,
      anchorOffsetPx: anchorLogicalId === null
        ? 0 : scrollTop - (this.offsets[anchorIndex] ?? 0),
      anchorHeightPx: anchorLogicalId === null
        ? 0 : (this.offsets[anchorIndex + 1] ?? 0) - (this.offsets[anchorIndex] ?? 0),
    });
  }

  restoreState(state: CompendiumReturnState): void {
    if (this.disposed) return;
    const anchorIndex = state.anchorLogicalId === null
      ? undefined : this.rowIndex.get(state.anchorLogicalId);
    /* Preserve enough of a tall wrapped anchor to keep a deep intra-row
       offset inside that same logical row until ResizeObserver supplies the
       fresh layout. Without this seed, offset 80px in a 100px phone row
       would cross the default 58px estimate and restore to the next row. */
    if (anchorIndex !== undefined && Number.isFinite(state.anchorHeightPx)
      && state.anchorHeightPx >= this.minimumHeight) {
      this.heights.set(state.anchorLogicalId!, state.anchorHeightPx);
      this.recomputeOffsets();
    }
    const restoredTop = anchorIndex === undefined
      ? state.scrollTop
      : (this.offsets[anchorIndex] ?? 0) + state.anchorOffsetPx;
    this.scroller.scrollTop = Math.max(0, restoredTop);
    this.focusedId = state.focusedLogicalId && this.rowIndex.has(state.focusedLogicalId)
      ? state.focusedLogicalId : null;
    this.render();
    if (this.focusedId) {
      this.mounted.get(this.focusedId)?.mounted.element.focus({ preventScroll: true });
    }
  }

  focusFirst(): boolean {
    const first = this.rows[0];
    if (!first) return false;
    this.focusedId = first.logicalId;
    this.render();
    const element = this.mounted.get(first.logicalId)?.mounted.element;
    element?.focus();
    return document.activeElement === element;
  }

  /** Re-evaluate after an owning panel changes from display:none to visible. */
  refreshWindow(): void {
    this.render();
  }

  /** Test/DOM fallback when ResizeObserver is unavailable. */
  refreshMeasurements(): void {
    if (this.disposed) return;
    const changes: Array<[string, number]> = [];
    for (const [id, live] of this.mounted) {
      const height = finiteHeight(live.mounted.element.getBoundingClientRect().height, this.minimumHeight);
      if (height !== null && this.heights.get(id) !== height) changes.push([id, height]);
    }
    this.applyMeasurements(changes);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scroller.removeEventListener('scroll', this.onScroll);
    this.scroller.removeEventListener('focusin', this.onFocusIn);
    this.scroller.removeEventListener('focusout', this.onFocusOut);
    this.observer?.disconnect();
    for (const live of this.mounted.values()) live.mounted.dispose?.();
    this.mounted.clear();
    this.extent.remove();
  }

  private readonly onScroll = (): void => this.render();

  private readonly onFocusIn = (event: FocusEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-cid]') : null;
    const id = target?.dataset.cid ?? null;
    if (id && this.rowIndex.has(id)) {
      this.focusedId = id;
      this.render();
    }
  };

  private readonly onFocusOut = (): void => {
    queueMicrotask(() => {
      if (this.disposed || this.scroller.contains(document.activeElement)) return;
      this.focusedId = null;
      this.render();
    });
  };

  private focusedRowInDocument(): string | null {
    const active = document.activeElement instanceof Element
      ? document.activeElement.closest<HTMLElement>('[data-cid]') : null;
    const id = active?.dataset.cid ?? null;
    return id && this.rowIndex.has(id) ? id : null;
  }

  private onResize(entries: readonly ResizeObserverEntry[]): void {
    const changes: Array<[string, number]> = [];
    let viewportChanged = false;
    for (const entry of entries) {
      const target = entry.target as HTMLElement;
      if (target === this.scroller) {
        viewportChanged = true;
        continue;
      }
      const id = target.dataset.cid;
      if (!id || !this.rowIndex.has(id)) continue;
      /* contentRect omits padding and borders. The row occupies its border
         box in the absolute layout, especially at larger text tiers. */
      const height = finiteHeight(target.getBoundingClientRect().height, this.minimumHeight)
        ?? finiteHeight(entry.contentRect.height, this.minimumHeight);
      if (height !== null && this.heights.get(id) !== height) changes.push([id, height]);
    }
    const measurementsChanged = this.applyMeasurements(changes);
    if (viewportChanged && !measurementsChanged && !this.disposed) this.render();
  }

  private applyMeasurements(changes: readonly (readonly [string, number])[]): boolean {
    if (this.disposed || !changes.length) return false;
    const anchorIndex = this.indexAt(this.scroller.scrollTop);
    const anchorOffset = this.scroller.scrollTop - (this.offsets[anchorIndex] ?? 0);
    let changed = false;
    for (const [id, height] of changes) {
      if (this.heights.get(id) === height) continue;
      this.heights.set(id, height);
      changed = true;
    }
    if (!changed) return false;
    this.recomputeOffsets();
    this.scroller.scrollTop = Math.max(0, (this.offsets[anchorIndex] ?? 0) + anchorOffset);
    this.render();
    return true;
  }

  private recomputeOffsets(): void {
    this.offsets = new Array(this.rows.length + 1);
    this.offsets[0] = 0;
    for (let index = 0; index < this.rows.length; index++) {
      const row = this.rows[index]!;
      this.offsets[index + 1] = this.offsets[index]! + (this.heights.get(row.logicalId) ?? this.estimatedHeight);
    }
    this.extent.style.height = `${this.offsets[this.rows.length] ?? 0}px`;
  }

  private indexAt(pixel: number): number {
    if (!this.rows.length) return 0;
    const target = Math.max(0, pixel);
    let low = 0, high = this.rows.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if ((this.offsets[mid + 1] ?? 0) <= target) low = mid + 1;
      else high = mid;
    }
    return Math.min(low, this.rows.length - 1);
  }

  private viewportHeight(): number {
    return this.scroller.clientHeight
      || this.scroller.getBoundingClientRect().height
      || this.fallbackViewportHeight;
  }

  private render(): void {
    if (this.disposed) return;
    const viewport = this.viewportHeight();
    const overscan = viewport * this.overscanRatio;
    const total = this.offsets[this.rows.length] ?? 0;
    const startPixel = Math.max(0, this.scroller.scrollTop - overscan);
    const endPixel = Math.min(total, this.scroller.scrollTop + viewport + overscan);
    const start = this.rows.length ? this.indexAt(startPixel) : 0;
    const end = this.rows.length ? Math.min(this.rows.length, this.indexAt(Math.max(startPixel, endPixel - 0.01)) + 1) : 0;
    this.start0 = start;
    this.end0 = end;
    this.overscan0 = overscan;

    const desired = new Set<string>();
    for (let index = start; index < end; index++) desired.add(this.rows[index]!.logicalId);
    if (this.focusedId && this.rowIndex.has(this.focusedId)) desired.add(this.focusedId);

    for (const [id, live] of [...this.mounted]) {
      if (desired.has(id)) continue;
      this.observer?.unobserve(live.mounted.element);
      live.mounted.dispose?.();
      live.mounted.element.remove();
      live.positionDescription.remove();
      this.mounted.delete(id);
    }

    const desiredRows = [...desired]
      .map((id) => this.rows[this.rowIndex.get(id)!]!)
      .sort((a, b) => this.rowIndex.get(a.logicalId)! - this.rowIndex.get(b.logicalId)!);
    for (const row of desiredRows) {
      if (this.mounted.has(row.logicalId)) continue;
      const index = this.rowIndex.get(row.logicalId)!;
      const mounted = this.mountRow(row, index + 1, this.rows.length);
      const element = mounted.element;
      if (!(element instanceof HTMLButtonElement) || element.type !== 'button') {
        mounted.dispose?.();
        throw new Error('Compendium virtual rows must be native type=button controls');
      }
      element.dataset.cid = row.logicalId;
      const positionDescription = document.createElement('span');
      positionDescription.id = `${this.positionDescriptionPrefix}-${index + 1}`;
      positionDescription.className = 'sr-only';
      positionDescription.textContent = `Item ${index + 1} of ${this.rows.length}`;
      element.setAttribute('aria-describedby', positionDescription.id);
      element.style.position = 'absolute';
      element.style.left = '0';
      element.style.right = '0';
      const next = [...this.mounted.values()]
        .filter((candidate) => this.rowIndex.get(candidate.row.logicalId)! > index)
        .sort((a, b) => this.rowIndex.get(a.row.logicalId)! - this.rowIndex.get(b.row.logicalId)!)[0];
      this.extent.insertBefore(element, next?.mounted.element ?? this.afterSpacer);
      this.extent.insertBefore(positionDescription, next?.mounted.element ?? this.afterSpacer);
      const live: LiveRow<T> = { row, mounted, positionDescription };
      this.mounted.set(row.logicalId, live);
      this.observer?.observe(element);
    }

    for (const [id, live] of this.mounted) {
      const index = this.rowIndex.get(id)!;
      live.mounted.element.style.top = `${this.offsets[index] ?? 0}px`;
    }
    const before = this.offsets[start] ?? 0;
    const afterStart = this.offsets[end] ?? total;
    this.beforeSpacer.style.top = '0px';
    this.beforeSpacer.style.height = `${before}px`;
    this.afterSpacer.style.top = `${afterStart}px`;
    this.afterSpacer.style.height = `${Math.max(0, total - afterStart)}px`;
    this.onWindowChange?.(this.snapshot());
  }
}
