/* app-chrome.ts — DOM ownership for the exploration chrome.
   Main supplies only projected game state and the viewport-dependent camera
   callback; this owner fills, measures, observes, and diagnoses its static DOM. */

export type AppChromeObjectiveView =
  | Readonly<{
    kind: 'progress';
    text: string;
    have: number;
    need: number;
  }>
  | Readonly<{
    kind: 'boundary';
    name: string;
  }>;

export interface AppChromeStatusView {
  readonly explorerName: string;
  readonly essence: number;
  readonly landedWorlds: number;
  readonly hp: number;
  readonly hpMax: number;
  readonly primeCount: number;
  readonly rank?: Readonly<{
    readonly name: string;
    readonly nameplateHue: string;
    readonly nameplateIridescent: boolean;
  }> | null;
  readonly objective: AppChromeObjectiveView | null;
}

export interface AppChromeDiagnostics {
  readonly trail: string;
  readonly context: string;
  readonly objective: string;
  readonly topbarH: string;
}

export interface AppChromeAnchorPoint {
  readonly x: number;
  readonly y: number;
}

export interface AppChromeResizeObserver {
  observe(target: Element): void;
  disconnect(): void;
}

export interface AppChromeMutationObserver {
  observe(target: Node, options?: MutationObserverInit): void;
  disconnect(): void;
}

export interface AppChromeControllerOptions {
  readonly document?: Document;
  readonly getComputedStyle?: (element: Element) => CSSStyleDeclaration;
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'>;
  readonly createResizeObserver?: (listener: () => void) => AppChromeResizeObserver;
  readonly createMutationObserver?: (listener: () => void) => AppChromeMutationObserver;
  readonly addResizeListener?: (listener: () => void) => void;
  readonly removeResizeListener?: (listener: () => void) => void;
  readonly onViewportResize?: () => void;
}

export interface AppChromeController {
  readonly renderStatus: (view: AppChromeStatusView) => void;
  /** Geometry-only port for rank ceremony presentation. The chrome owner
   * retains the player-chip element; callers never receive or query its DOM. */
  readonly rankCeremonyAnchor: () => AppChromeAnchorPoint | null;
  /** Static Prime status control resolved by the chrome DOM owner. Main may
   * register it with the one-panel/action layer without duplicating lookup. */
  readonly primeCodexOpener: () => HTMLElement;
  readonly setTrail: (segments: readonly string[]) => void;
  readonly setContext: (text: string) => void;
  readonly setHint: (text: string) => void;
  readonly syncTopbarH: () => void;
  readonly syncDockH: () => void;
  readonly syncContextH: () => void;
  readonly syncHintH: () => void;
  readonly syncSurfaceChromeBottom: () => void;
  readonly diagnostics: () => AppChromeDiagnostics;
  readonly dispose: () => void;
}

const PORTRAIT_PHONE_QUERY = '(max-width: 900px) and (orientation: portrait)';
const HINT_KEYWORD = /\b(tap|drag|zoom|press|Enter|Land|Leave|right-click|Escape|wheel|pinch)\b/gi;

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[<>&"']/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

function requiredById(document: Document, id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!(element instanceof document.defaultView!.HTMLElement)) {
    throw new Error(`missing app chrome element #${id}`);
  }
  return element;
}

function requiredElement(document: Document, selector: string): HTMLElement {
  const element = document.querySelector(selector);
  if (!(element instanceof document.defaultView!.HTMLElement)) {
    throw new Error(`missing app chrome element ${selector}`);
  }
  return element;
}

export function createAppChromeController(
  options: AppChromeControllerOptions = {},
): AppChromeController {
  const chromeDocument = options.document ?? document;
  const chromeWindow = chromeDocument.defaultView;
  if (!chromeWindow) throw new Error('app chrome requires a document with a window');

  const computedStyle = options.getComputedStyle
    ?? ((element: Element) => chromeWindow.getComputedStyle(element));
  const media = options.matchMedia
    ?? ((query: string) => chromeWindow.matchMedia(query));
  const makeResizeObserver = options.createResizeObserver
    ?? ((listener: () => void): AppChromeResizeObserver => new chromeWindow.ResizeObserver(listener));
  const makeMutationObserver = options.createMutationObserver
    ?? ((listener: () => void): AppChromeMutationObserver => new chromeWindow.MutationObserver(listener));
  const addResizeListener = options.addResizeListener
    ?? ((listener: () => void) => { chromeWindow.addEventListener('resize', listener); });
  const removeResizeListener = options.removeResizeListener
    ?? ((listener: () => void) => { chromeWindow.removeEventListener('resize', listener); });

  const trail = requiredById(chromeDocument, 'trail');
  const playerChip = requiredById(chromeDocument, 'playerchip');
  const primeChip = requiredById(chromeDocument, 'primechip');
  const hpBar = requiredById(chromeDocument, 'hpbar');
  const hpFill = requiredElement(chromeDocument, '#hpbar .fill');
  const hpText = requiredElement(chromeDocument, '#hpbar .txt');
  const objectiveChip = requiredById(chromeDocument, 'objchip');
  const context = requiredById(chromeDocument, 'ctxbar');
  const hint = requiredById(chromeDocument, 'hintpill');
  const topbar = requiredById(chromeDocument, 'topbar');
  const dock = requiredById(chromeDocument, 'dock');
  const searchbox = requiredById(chromeDocument, 'searchbox');
  const sceneActions = chromeDocument.getElementById('sceneactions');
  const surfaceTopChrome = [topbar, searchbox, objectiveChip, ...(sceneActions ? [sceneActions] : [])];
  const rootStyle = chromeDocument.documentElement.style;
  let lastSurfaceTrailBottom = 0;
  let contextText = '';
  let hintText = '';
  let disposed = false;

  const renderedBottom = (element: HTMLElement): number | null => {
    const style = computedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
      && rect.width > 0 && rect.height > 0 ? rect.bottom : null;
  };

  const syncSurfaceChromeBottom = (): void => {
    /* Portrait Planetside is bottom-anchored above measured lower chrome. Its
       upper bound must be measured too. If fewer than 72 useful pixels
       remain, the noninteractive trail yields; retaining its last visible
       edge prevents that choice oscillating. */
    const trailBottom = renderedBottom(trail);
    if (trailBottom !== null) lastSurfaceTrailBottom = trailBottom;
    let fixedBottom = 0;
    for (const element of surfaceTopChrome) {
      const bottom = renderedBottom(element);
      if (bottom !== null) fixedBottom = Math.max(fixedBottom, bottom);
    }
    const withTrailBottom = Math.max(fixedBottom, lastSurfaceTrailBottom);
    const side = chromeDocument.getElementById('planetside');
    const sideRect = side?.getBoundingClientRect();
    const sideStyle = side ? computedStyle(side) : null;
    const sideVisible = !!sideRect && !!sideStyle && sideStyle.display !== 'none'
      && sideStyle.visibility !== 'hidden' && sideRect.width > 0 && sideRect.height > 0;
    const portraitPhone = media(PORTRAIT_PHONE_QUERY).matches;
    const overlaysYieldChrome = chromeDocument.body.classList.contains('card-open')
      || chromeDocument.body.classList.contains('panel-open');
    const yieldTrail = chromeDocument.body.classList.contains('surface-mode') && portraitPhone
      && !overlaysYieldChrome && sideVisible && sideRect!.bottom - withTrailBottom - 6 < 72;
    chromeDocument.body.classList.toggle('surface-trail-yield', yieldTrail);
    const visibleBottom = Math.max(
      fixedBottom,
      trailBottom ?? (portraitPhone ? lastSurfaceTrailBottom : 0),
    );
    rootStyle.setProperty(
      '--surface-chrome-bottom',
      (yieldTrail ? fixedBottom : visibleBottom).toFixed(2) + 'px',
    );
  };

  const syncTopbarH = (): void => {
    /* the game's height-sync law: MEASURED, never guessed */
    rootStyle.setProperty('--topbar-h', topbar.offsetHeight + 'px');
    rootStyle.setProperty('--row1-h', Math.max(40, searchbox.getBoundingClientRect().bottom) + 'px');
  };
  const syncDockH = (): void => {
    rootStyle.setProperty('--dock-h', dock.offsetHeight + 'px');
    syncSurfaceChromeBottom();
  };
  const syncContextH = (): void => {
    rootStyle.setProperty('--ctx-h', context.offsetHeight + 'px');
    syncSurfaceChromeBottom();
  };
  const syncHintH = (): void => {
    rootStyle.setProperty('--hint-h', hint.offsetHeight + 'px');
  };

  const rankCeremonyAnchor = (): AppChromeAnchorPoint | null => {
    if (disposed) return null;
    const rect = playerChip.getBoundingClientRect();
    if (![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
      || rect.width <= 0 || rect.height <= 0) return null;
    return Object.freeze({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const renderStatus = (view: AppChromeStatusView): void => {
    const rank = view.rank ?? null;
    const rankHue = rank && /^#[0-9a-f]{6}$/iu.test(rank.nameplateHue)
      ? rank.nameplateHue : null;
    playerChip.classList.toggle('rank-iridescent', rank?.nameplateIridescent === true);
    playerChip.style.borderColor = rank?.nameplateIridescent === true
      ? '#c7d8ff' : rankHue ?? '';
    if (rank === null) {
      playerChip.removeAttribute('data-rank-name');
      playerChip.removeAttribute('title');
    } else {
      playerChip.dataset.rankName = rank.name;
      playerChip.title = `Explorer rank: ${rank.name}`;
    }
    playerChip.textContent = view.explorerName || 'Explorer';
    hpFill.style.width = Math.max(0, Math.min(100, (view.hp / Math.max(1, view.hpMax)) * 100)) + '%';
    hpText.textContent = `${view.hp}/${view.hpMax}`;
    const meterMax = Math.max(1, view.hpMax);
    hpBar.setAttribute('role', 'meter');
    hpBar.setAttribute('aria-label', 'Explorer health');
    hpBar.setAttribute('aria-valuemin', '0');
    hpBar.setAttribute('aria-valuemax', String(meterMax));
    hpBar.setAttribute('aria-valuenow', String(Math.max(0, Math.min(meterMax, view.hp))));
    hpBar.setAttribute('aria-valuetext', `${view.hp}/${view.hpMax} HP`);
    primeChip.innerHTML = '<span class="ico" aria-hidden="true">✦</span> '
      + '<span class="lbl">Prime<span class="prime-full-label"> Codex</span></span> '
      + `<span class="prime-count">${escapeHtml(view.primeCount)}/9</span>`;
    primeChip.setAttribute('aria-label', `Open Prime Codex, ${view.primeCount} of 9 signatures`);
    objectiveChip.innerHTML = view.objective?.kind === 'progress'
      ? `⬆ ${escapeHtml(view.objective.text)} · <span class="prog" data-sel="objprog">${view.objective.have} / ${view.objective.need}</span>`
      : view.objective?.kind === 'boundary'
        ? `⬆ ${escapeHtml(view.objective.name)} is recorded — the next Charter action is not available in this development slice`
        : '';
    syncTopbarH();
  };

  const setContext = (text: string): void => {
    if (text === contextText) return;
    contextText = text;
    context.textContent = text;
  };
  const setHint = (text: string): void => {
    if (text === hintText) return;
    hintText = text;
    /* Callers supply the same trusted static chrome strings as before. */
    hint.innerHTML = text.replace(HINT_KEYWORD, '<b class="kw">$1</b>');
  };
  const setTrail = (segments: readonly string[]): void => {
    trail.innerHTML = segments.map((segment, index) => (
      `<span class="seg${index === segments.length - 1 ? ' cur' : ''}">${escapeHtml(segment)}</span>`
    )).join('<span class="sep">›</span>');
  };

  const resizeObservers: AppChromeResizeObserver[] = [];
  const observeResize = (element: Element, listener: () => void): void => {
    const observer = makeResizeObserver(listener);
    observer.observe(element);
    resizeObservers.push(observer);
  };
  observeResize(topbar, syncTopbarH);
  observeResize(dock, syncDockH);
  observeResize(context, syncContextH);
  observeResize(hint, syncHintH);
  for (const element of surfaceTopChrome) observeResize(element, syncSurfaceChromeBottom);
  const bodyClassObserver = makeMutationObserver(syncSurfaceChromeBottom);
  bodyClassObserver.observe(chromeDocument.body, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const onResize = (): void => {
    syncTopbarH();
    syncDockH();
    syncContextH();
    syncHintH();
    syncSurfaceChromeBottom();
    options.onViewportResize?.();
  };
  addResizeListener(onResize);

  const diagnostics = (): AppChromeDiagnostics => Object.freeze({
    trail: trail.textContent || '',
    context: context.textContent || '',
    objective: objectiveChip.textContent || '',
    topbarH: computedStyle(chromeDocument.documentElement).getPropertyValue('--topbar-h'),
  });

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    removeResizeListener(onResize);
    for (const observer of resizeObservers) observer.disconnect();
    bodyClassObserver.disconnect();
  };

  return Object.freeze({
    renderStatus,
    rankCeremonyAnchor,
    primeCodexOpener: () => primeChip,
    setTrail,
    setContext,
    setHint,
    syncTopbarH,
    syncDockH,
    syncContextH,
    syncHintH,
    syncSurfaceChromeBottom,
    diagnostics,
    dispose,
  });
}
