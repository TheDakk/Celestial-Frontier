/** U2 measured sheet lanes. Presentation only; no game or persistence ownership.
 * Rectangles are viewport CSS pixels. Hidden chrome owns no lane. */
export function createSheetLayoutController(document: Document = window.document): {
  sync(): void; dispose(): void;
} {
  const view = document.defaultView!;
  const root = document.documentElement;
  const lower = ['hintpill', 'ctxbar', 'dock'].map(id => document.getElementById(id)!);
  const toast = document.getElementById('toast')!;
  const planetside = document.getElementById('planetside');
  const survey = document.getElementById('survey');
  const hint = document.getElementById('hintpill')!;
  const guidance = [hint, document.getElementById('ctxbar')!];
  const topbar = document.getElementById('topbar')!;
  const upperChrome = [...new Set([topbar, ...topbar.children,
    ...['searchbox', 'objchip', 'sceneactions', 'trail'].flatMap(id => {
      const el = document.getElementById(id); return el ? [el] : [];
    })])] as HTMLElement[];
  const sheets = [...document.querySelectorAll<HTMLElement>('#survey,.panel,#planetside')];
  const sharedSheets = sheets.filter(sheet => sheet !== survey && sheet.matches('.panel'));
  const scrollPaddingValues = new WeakMap<HTMLElement, string>();
  const observedHeaders = new Set<HTMLElement>();
  let disposed = false;
  let frame = 0;
  const set = (name: string, value: number): void => {
    const next = `${Math.max(0, value).toFixed(2)}px`;
    if (root.style.getPropertyValue(name) !== next) root.style.setProperty(name, next);
  };
  const visibleRect = (el: HTMLElement): DOMRect | null => {
    const style = view.getComputedStyle(el), rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && rect.width > 0 && rect.height > 0 ? rect : null;
  };
  const sheetMetrics = (sheet: HTMLElement): { minimum: number; scrollTop: number } => {
    const header = sheet.querySelector<HTMLElement>('.survey-head,.sheet-header');
    const style = view.getComputedStyle(sheet), headerStyle = header ? view.getComputedStyle(header) : null;
    const pixels = (value: string | undefined): number => parseFloat(value ?? '') || 0;
    const headerHeight = Math.max(44, header ? visibleRect(header)?.height ?? 0 : 0)
      + pixels(headerStyle?.marginTop) + pixels(headerStyle?.marginBottom);
    const topEdge = pixels(style.paddingTop) + pixels(style.borderTopWidth);
    return { minimum: headerHeight + topEdge + pixels(style.paddingBottom) + pixels(style.borderBottomWidth) + 44,
      scrollTop: headerHeight + topEdge };
  };
  const sync = (): void => {
    if (disposed) return;
    const height = view.innerHeight;
    const safeBottom = parseFloat(view.getComputedStyle(root).getPropertyValue('--safe-bottom')) || 0;
    // Restore both native lanes first. AppChrome may still hold a clipped 1px
    // hint receipt, so project the natural offsetHeight only while measuring the
    // caption, then restore that owner's exact property/value/priority.
    for (const el of guidance) el.classList.remove('sheet-guidance-yield');
    const hintValue = root.style.getPropertyValue('--hint-h');
    const hintPriority = root.style.getPropertyPriority('--hint-h');
    const hadHintValue = Array.from({ length: root.style.length }, (_, index) => root.style.item(index)).includes('--hint-h');
    const naturalHintValue = `${hint.offsetHeight}px`;
    const projectHint = hintValue !== naturalHintValue || hintPriority !== '';
    let naturalLower: Array<DOMRect | null>;
    try {
      if (projectHint) root.style.setProperty('--hint-h', naturalHintValue);
      naturalLower = lower.map(visibleRect);
    } finally {
      if (projectHint) {
        if (hadHintValue) root.style.setProperty('--hint-h', hintValue, hintPriority);
        else root.style.removeProperty('--hint-h');
      }
    }
    const measureLowerTop = (yielded: boolean): number => Math.min(height - safeBottom - 12,
      ...naturalLower.map((rect, index) => yielded && guidance.includes(lower[index]!) ? height : rect?.top ?? height));
    let lowerTop = measureLowerTop(false);
    set('--cf-lower-top', lowerTop);
    set('--cf-toast-bottom', height - lowerTop + 8);
    const headers = sheets.flatMap(sheet => [...sheet.querySelectorAll<HTMLElement>('.survey-head,.sheet-header')]);
    for (const header of observedHeaders) if (!headers.includes(header)) { resize.unobserve(header); observedHeaders.delete(header); }
    for (const header of headers) if (!observedHeaders.has(header)) { resize.observe(header); observedHeaders.add(header); }
    for (const sheet of sharedSheets) {
      const next = `${Math.max(0, sheetMetrics(sheet).scrollTop).toFixed(2)}px`;
      scrollPaddingValues.set(sheet, next);
      if (sheet.style.getPropertyValue('--cf-sheet-scroll-top') !== next || sheet.style.getPropertyPriority('--cf-sheet-scroll-top') !== '') {
        sheet.style.setProperty('--cf-sheet-scroll-top', next);
      }
    }
    const surveyRect = survey ? visibleRect(survey) : null, sideRect = planetside ? visibleRect(planetside) : null;
    const surveyMetrics = survey ? sheetMetrics(survey) : { minimum: 88, scrollTop: 44 };
    const surveyStart = surveyRect?.top ?? ((visibleRect(document.getElementById('topbar')!)?.bottom ?? 0) + 8);
    set('--cf-survey-min-height', surveyMetrics.minimum);
    set('--cf-survey-start', surveyStart);
    set('--cf-survey-scroll-top', surveyMetrics.scrollTop);
    // The accepted topbar wrapper is pointer-transparent. Its empty bottom
    // padding is not a control; measure its painted child surfaces instead.
    // A wrapper that can itself intercept input still contributes its full box.
    const sideStart = Math.max(0, ...upperChrome.map(el => {
      const style = view.getComputedStyle(el);
      if ((el === topbar && style.pointerEvents === 'none') || Number(style.opacity || '1') <= 0) return 0;
      return visibleRect(el)?.bottom ?? 0;
    })) + 8;
    set('--cf-planetside-start', sideStart);
    const portrait = view.innerWidth <= 900 && height >= view.innerWidth;
    const stacked = portrait && document.body.classList.contains('surface-mode') && document.body.classList.contains('card-open')
      && surveyRect !== null && sideRect !== null
      && Math.min(surveyRect.right, sideRect.right) > Math.max(surveyRect.left, sideRect.left);
    // Measure the full message every time so compact geometry cannot keep itself
    // selected after space returns. Only this presentation class belongs here.
    if (toast.classList.contains('toast-compact')) toast.classList.remove('toast-compact');
    const toastVisible = toast.style.opacity === '1' || Number(view.getComputedStyle(toast).opacity) > 0;
    const fullToast = toastVisible ? visibleRect(toast) : null;
    const needsRoom = (laneTop: number, notice: DOMRect | null, noticeOnly = false): boolean => sheets.some(sheet => {
      const rect = visibleRect(sheet);
      if (!rect || sheet.getAttribute('aria-hidden') === 'true') return false;
      const crossed = notice !== null && Math.min(rect.right, notice.right) > Math.max(rect.left, notice.left);
      if (noticeOnly && !crossed) return false;
      // Portrait CSS reserves the global painted toast even across disjoint columns.
      const availableFloor = laneTop - 8 - (notice ? notice.height + 8 : 0);
      // A bottom-anchored strip must never use its previous floor-dependent top.
      if (sheet === planetside) return availableFloor - sideStart < 72;
      return availableFloor - rect.top < sheetMetrics(sheet).minimum + (stacked && sheet === survey ? 72 + 8 : 0);
    });
    const compact = portrait && fullToast !== null
      && !!toast.querySelector('[data-sel="toast-title"]') && !!toast.querySelector('[data-sel="toast-message"]')
      && needsRoom(lowerTop, fullToast, true);
    if (compact) toast.classList.add('toast-compact');
    // Reserve the actual painted presentation through the fade. Inline target
    // catches the first entry frame; computed opacity catches exit frames.
    let toastRect = toastVisible ? visibleRect(toast) : null;
    let toastHeight = toastRect?.height ?? 0;
    let floor = lowerTop - 8 - (toastHeight > 0 ? toastHeight + 8 : 0);
    if (portrait && needsRoom(lowerTop, toastRect) && measureLowerTop(true) > lowerTop) {
      for (const el of guidance) el.classList.add('sheet-guidance-yield');
      lowerTop = measureLowerTop(true);
      set('--cf-lower-top', lowerTop);
      set('--cf-toast-bottom', height - lowerTop + 8);
      toastRect = toastVisible ? visibleRect(toast) : null;
      toastHeight = toastRect?.height ?? 0;
      floor = lowerTop - 8 - (toastHeight > 0 ? toastHeight + 8 : 0);
    }
    set('--cf-sheet-floor', floor);
    // Landscape Planetside can occupy the other column from a painted toast.
    // Keep global reservation intact; this floor only exempts disjoint columns.
    const toastCrossesSide = sideRect !== null && toastRect !== null
      && Math.min(sideRect.right, toastRect.right) > Math.max(sideRect.left, toastRect.left);
    set('--cf-planetside-floor', lowerTop - 8 - (toastCrossesSide ? toastHeight + 8 : 0));
    set('--cf-sheet-bottom', height - floor);
    set('--cf-toast-height', toastHeight);
    // A short strip can translate without resizing; Survey derives its edge
    // from this final height and floor instead of Main's older position receipt.
    set('--cf-planetside-height', planetside ? visibleRect(planetside)?.height ?? 0 : 0);
  };
  const schedule = (): void => {
    if (!disposed && !frame) frame = view.requestAnimationFrame(() => { frame = 0; sync(); });
  };
  const resize = new view.ResizeObserver(schedule);
  for (const el of new Set([...lower, toast, ...upperChrome])) resize.observe(el);
  for (const sheet of sheets) resize.observe(sheet);
  const comparisonStyle = document.createElement('div').style;
  const withoutOwnedScrollPadding = (value: string | null): string => {
    comparisonStyle.cssText = value ?? '';
    comparisonStyle.removeProperty('--cf-sheet-scroll-top');
    return comparisonStyle.cssText;
  };
  const mutation = new view.MutationObserver(records => {
    if (records.some(record => {
      const sheet = record.target as HTMLElement;
      if (record.type !== 'attributes' || record.attributeName !== 'style' || !sharedSheets.includes(sheet)) return true;
      // Ignore only our own unchanged-value publication. Real style changes
      // (including a corrupted owned value) must still schedule measurement.
      return sheet.style.getPropertyValue('--cf-sheet-scroll-top') !== scrollPaddingValues.get(sheet)
        || sheet.style.getPropertyPriority('--cf-sheet-scroll-top') !== ''
        || withoutOwnedScrollPadding(record.oldValue) !== withoutOwnedScrollPadding(sheet.getAttribute('style'));
    })) schedule();
  });
  mutation.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // A clipped lane can refill without resizing. Do not observe our own class;
  // text/style changes and preference changes still restore natural measurement.
  for (const el of guidance) mutation.observe(el, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true, characterData: true });
  for (const el of upperChrome.filter(el => el === topbar || !topbar.contains(el))) {
    mutation.observe(el, { attributes: true, attributeFilter: ['style', 'class'], childList: true, subtree: true, characterData: true });
  }
  mutation.observe(toast, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true, characterData: true });
  for (const sheet of sheets) mutation.observe(sheet, { attributes: true, attributeOldValue: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
    childList: true, subtree: true, characterData: true });
  toast.addEventListener('transitionend', schedule);
  view.addEventListener('resize', schedule, { passive: true });
  sync();
  return { sync, dispose() {
    disposed = true;
    if (frame) view.cancelAnimationFrame(frame);
    resize.disconnect(); mutation.disconnect();
    toast.removeEventListener('transitionend', schedule);
    view.removeEventListener('resize', schedule);
  } };
}
