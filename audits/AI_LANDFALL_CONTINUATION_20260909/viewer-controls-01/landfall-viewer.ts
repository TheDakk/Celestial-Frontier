/** Read-only, full-painting inspection of an already verified retained original.
 * No scene navigation, generation, image re-encoding, save writes or export. */
import { AI_LANDFALL_ORIGINAL_MAX_BYTES_V1, type AiLandfallOriginalV1 } from './ai-landfall-originals.js';

export interface LandfallViewerV1 {
  open(original: AiLandfallOriginalV1): Promise<boolean>;
  close(): void;
}

export function createLandfallViewerV1(document: Document = globalThis.document): LandfallViewerV1 {
  let current: { dialog: HTMLDialogElement; image: HTMLImageElement; url: string;
    restore: () => void; opener: HTMLElement | null } | null = null;
  let serial = 0;
  function close(): void {
    serial++;
    const owned = current; current = null;
    if (!owned) return;
    owned.restore();
    owned.image.removeAttribute('src');
    URL.revokeObjectURL(owned.url);
    if (owned.dialog.open) owned.dialog.close();
    owned.dialog.remove();
    if (owned.opener?.isConnected && !owned.opener.closest('[inert]')) owned.opener.focus({ preventScroll: true });
  }
  return Object.freeze({ close, async open(original) {
    close();
    if (!(original.blob instanceof Blob) || !['image/png', 'image/jpeg', 'image/webp'].includes(original.blob.type)
      || original.blob.size < 1 || original.blob.size > AI_LANDFALL_ORIGINAL_MAX_BYTES_V1
      || !Number.isSafeInteger(original.width) || !Number.isSafeInteger(original.height)
      || original.width < 1 || original.height < 1 || original.width > 8192 || original.height > 8192
      || original.width * original.height > 16_777_216
      || !/^[a-f0-9]{64}$/.test(original.sha256)) throw new Error('Invalid retained painting');
    const generation = serial;
    const dialog = document.createElement('dialog'); dialog.id = 'cf-landfall-viewer';
    if (typeof dialog.showModal !== 'function') throw new Error('This browser cannot open the painting viewer');
    dialog.setAttribute('aria-labelledby', 'cf-landfall-viewer-title');
    dialog.setAttribute('aria-describedby', 'cf-landfall-viewer-caption');
    dialog.dataset.originalId = original.originalId; dialog.dataset.imageSha256 = original.sha256;
    dialog.style.cssText = 'position:fixed;inset:0;width:calc(100vw - 16px);height:calc(100dvh - 16px);max-width:1440px;max-height:none;margin:auto;padding:12px;box-sizing:border-box;overflow:hidden;border:1px solid #54616a;border-radius:12px;background:#0c141b;color:#e4e9e8;font:14px system-ui;';
    const style = document.createElement('style');
    style.textContent = '#cf-landfall-viewer::backdrop{background:rgba(3,8,12,.88)}#cf-landfall-viewer button:focus-visible{outline:3px solid #ffe1a3;outline-offset:2px}#cf-landfall-viewer button{min-height:44px;padding:8px 12px;border:1px solid #637785;border-radius:8px;background:#172938;color:#e4e9e8;font:inherit;cursor:pointer}#cf-landfall-viewer button[aria-pressed="true"]{background:#3a4b50;border-color:#e4c887}';
    const body = document.createElement('div'); body.style.cssText = 'height:100%;min-height:0;display:flex;flex-direction:column;gap:8px;';
    const header = document.createElement('header'); header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-shrink:0;';
    const title = document.createElement('h2'); title.id = 'cf-landfall-viewer-title'; title.textContent = 'Landfall painting'; title.style.cssText = 'font-size:16px;line-height:1.2;margin:0;';
    const makeButton = (text: string, action: string): HTMLButtonElement => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
      button.dataset.landfallViewerAction = action; return button;
    };
    const exit = makeButton('Close', 'close'); exit.autofocus = true; exit.onclick = close;
    const toolbar = document.createElement('div'); toolbar.style.cssText = 'display:flex;gap:8px;flex-shrink:0;'; toolbar.setAttribute('aria-label', 'Painting scale');
    const fit = makeButton('Fit painting', 'fit'), actual = makeButton('Actual size', 'actual');
    const viewport = document.createElement('div'); viewport.dataset.landfallViewport = '';
    viewport.style.cssText = 'min-height:0;min-width:0;flex:1;overflow:auto;display:grid;place-items:center;background:#080e12;overscroll-behavior:contain;touch-action:pan-x pan-y pinch-zoom;';
    viewport.tabIndex = 0; viewport.setAttribute('aria-label', 'Painting; use arrow keys to pan at actual size');
    const image = document.createElement('img'); image.alt = 'Retained Earth landfall painting; species accuracy remains under review.';
    image.width = original.width; image.height = original.height; image.hidden = true; image.draggable = false;
    const scale = (zoom: boolean): void => {
      image.style.cssText = zoom ? `display:block;width:${original.width}px;height:${original.height}px;max-width:none;max-height:none;`
        : 'display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;';
      image.style.visibility = image.hidden ? 'hidden' : 'visible';
      viewport.style.placeItems = zoom ? 'start' : 'center'; viewport.scrollLeft = 0; viewport.scrollTop = 0;
      fit.setAttribute('aria-pressed', String(!zoom)); actual.setAttribute('aria-pressed', String(zoom));
    };
    fit.onclick = () => scale(false); actual.onclick = () => scale(true); scale(false);
    const caption = document.createElement('p'); caption.id = 'cf-landfall-viewer-caption'; caption.style.cssText = 'font-size:12px;line-height:1.3;margin:0;flex-shrink:0;';
    caption.textContent = 'Opening retained original…'; caption.setAttribute('role', 'status');
    header.append(title, exit); toolbar.append(fit, actual); viewport.append(image); body.append(header, toolbar, viewport, caption); dialog.append(style, body);
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.append(dialog);
    const background = new Map<HTMLElement, { inert: boolean; attribute: string | null; hidden: string | null }>();
    const isolate = (): void => {
      for (const root of document.body.children) if (root instanceof HTMLElement && root !== dialog) {
        if (!background.has(root)) background.set(root, { inert: root.inert, attribute: root.getAttribute('inert'), hidden: root.getAttribute('aria-hidden') });
        if (!root.inert) root.inert = true;
        if (root.getAttribute('aria-hidden') !== 'true') root.setAttribute('aria-hidden', 'true');
      }
    };
    const focus = (event: FocusEvent): void => { if (event.target instanceof Node && !dialog.contains(event.target)) exit.focus({ preventScroll: true }); };
    const Observer = document.defaultView?.MutationObserver;
    if (!Observer) { dialog.remove(); throw new Error('Painting viewer requires background isolation'); }
    const observer = new Observer(isolate);
    const restore = (): void => {
      observer.disconnect(); document.removeEventListener('focusin', focus, true);
      for (const [root, prior] of background) {
        root.inert = prior.inert;
        if (prior.attribute === null) root.removeAttribute('inert'); else root.setAttribute('inert', prior.attribute);
        if (prior.hidden === null) root.removeAttribute('aria-hidden'); else root.setAttribute('aria-hidden', prior.hidden);
      }
      background.clear();
    };
    let url: string;
    try { url = URL.createObjectURL(original.blob); } catch (error) { dialog.remove(); throw error; }
    current = { dialog, image, url, restore, opener };
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { if (current?.dialog === dialog) close(); });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      else if (event.key === 'Tab') {
        const controls = [exit, fit, actual, viewport]; const index = controls.indexOf(document.activeElement as HTMLButtonElement);
        if ((event.shiftKey && index <= 0) || (!event.shiftKey && index === controls.length - 1)) {
          event.preventDefault(); (event.shiftKey ? viewport : exit).focus();
        }
      }
    });
    try {
      isolate(); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['inert', 'aria-hidden'] });
      document.addEventListener('focusin', focus, true); dialog.showModal(); exit.focus({ preventScroll: true }); image.src = url;
      await image.decode();
      if (serial !== generation || current?.dialog !== dialog) return false;
      if (image.naturalWidth !== original.width || image.naturalHeight !== original.height) throw new Error('Retained painting dimensions changed');
      image.hidden = false; image.style.visibility = 'visible'; dialog.dataset.ready = 'true';
      caption.textContent = `${original.width} × ${original.height} original · Actual size lets you pan for detail. Species accuracy is under review.`;
      return true;
    } catch (error) { const stale = serial !== generation; if (current?.dialog === dialog) close(); if (stale) return false; throw error; }
  } });
}
