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
    // Start from the real native hint on every pass; our yielded geometry is
    // never an input to the decision to keep it hidden.
    if (hint.classList.contains('sheet-guidance-yield')) hint.classList.remove('sheet-guidance-yield');
    const measureLowerTop = (): number => Math.min(height - safeBottom - 12,
      ...lower.map(el => el === hint && hint.classList.contains('sheet-guidance-yield')
        ? height : visibleRect(el)?.top ?? height));
    let lowerTop = measureLowerTop();
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
    const portrait = view.innerWidth <= 900 && height >= view.innerWidth;
    const stacked = portrait && document.body.classList.contains('surface-mode') && document.body.classList.contains('card-open')
      && surveyRect !== null && sideRect !== null
      && Math.min(surveyRect.right, sideRect.right) > Math.max(surveyRect.left, sideRect.left);
    // Measure the full message every time so compact geometry cannot keep itself
    // selected after space returns. Only this presentation class belongs here.
    if (toast.classList.contains('toast-compact')) toast.classList.remove('toast-compact');
    const toastVisible = toast.style.opacity === '1' || Number(view.getComputedStyle(toast).opacity) > 0;
    const fullToast = toastVisible ? visibleRect(toast) : null;
    const fullFloor = lowerTop - 8 - (fullToast ? fullToast.height + 8 : 0);
    const compact = portrait && fullToast !== null
      && !!toast.querySelector('[data-sel="toast-title"]') && !!toast.querySelector('[data-sel="toast-message"]')
      && sheets.some(sheet => {
        const rect = visibleRect(sheet);
        if (!rect || Math.min(rect.right, fullToast.right) <= Math.max(rect.left, fullToast.left)) return false;
        if (sheet === planetside) {
          // Its bottom-anchored top moves with the last floor; use the native
          // portrait capacity start so that movement cannot sustain compaction.
          const start = (parseFloat(view.getComputedStyle(root).getPropertyValue('--surface-chrome-bottom')) || 0) + 8;
          return fullFloor - start < 72;
        }
        return fullFloor - rect.top < sheetMetrics(sheet).minimum + (stacked && sheet === survey ? 72 + 8 : 0);
      });
    if (compact) toast.classList.add('toast-compact');
    // Reserve the actual painted presentation through the fade. Inline target
    // catches the first entry frame; computed opacity catches exit frames.
    let toastRect = toastVisible ? visibleRect(toast) : null;
    let toastHeight = toastRect?.height ?? 0;
    let floor = lowerTop - 8 - (toastHeight > 0 ? toastHeight + 8 : 0);
    if (stacked && floor - surveyStart < surveyMetrics.minimum + 72 + 8) {
      hint.classList.add('sheet-guidance-yield');
      lowerTop = measureLowerTop();
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
  for (const el of [...lower, toast, document.getElementById('topbar')!]) resize.observe(el);
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
