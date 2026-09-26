import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLandfallViewerV1, captureLandfallFocusReturnV1 } from '../apps/game/src/landfall-viewer.js';
import type { AiLandfallOriginalV1 } from '../apps/game/src/ai-landfall-originals.js';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const cleanups: Array<() => void> = [];
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const original = (sha = 'a'.repeat(64)): AiLandfallOriginalV1 => ({ schema: 'cf.ai-landfall-original.v1',
  originalId: 'retained:' + sha, sha256: sha, blob: new Blob(['explicit synthetic image bytes'], { type: 'image/png' }),
  width: 1024, height: 576, input: { recipeKey: 'recipe', worldKey: 'Earth', environmentId: 'environment', ecologyEpoch: 0,
    snapshotDigest: 'snapshot', recipeJson: '{}' } });
function deferred() { let resolve!: () => void; const promise = new Promise<void>(yes => { resolve = yes; }); return { promise, resolve }; }
function harness() {
  const dom = new JSDOM('<!doctype html><body><main id="game"><button id="opener">Inspect</button></main><aside aria-hidden="false" inert=""></aside>', { pretendToBeVisual: true });
  const document = dom.window.document as Document;
  vi.stubGlobal('HTMLElement', dom.window.HTMLElement); vi.stubGlobal('Node', dom.window.Node);
  Object.defineProperty(dom.window.HTMLElement.prototype, 'inert', { configurable: true,
    get(this: HTMLElement) { return this.hasAttribute('inert'); },
    set(this: HTMLElement, value: boolean) { if (value) this.setAttribute('inert', ''); else this.removeAttribute('inert'); } });
  // jsdom has no native top layer or image decoder: these doubles prove owner
  // lifecycle only. Browser geometry/focus/input are separately measured.
  dom.window.HTMLDialogElement.prototype.showModal = function(this: HTMLDialogElement) { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function(this: HTMLDialogElement) { this.open = false; };
  const decode = vi.fn(async function(this: HTMLImageElement) {
    Object.defineProperty(this, 'naturalWidth', { value: 1024, configurable: true });
    Object.defineProperty(this, 'naturalHeight', { value: 576, configurable: true });
  });
  dom.window.HTMLImageElement.prototype.decode = decode;
  let next = 0;
  const create = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:unit-' + (++next));
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const viewer = createLandfallViewerV1(document);
  const opener = document.getElementById('opener')!; opener.focus();
  cleanups.push(() => { viewer.close(); dom.window.close(); });
  return { dom, document, viewer, create, revoke, decode, opener,
    dialog: () => document.querySelector<HTMLDialogElement>('dialog')!,
    button: (action: string) => document.querySelector<HTMLButtonElement>(`[data-landfall-viewer-action="${action}"]`)! };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
function expectLocked(document: Document) {
  const dialog = document.querySelector('dialog');
  for (const node of document.body.children) if (node !== dialog && node instanceof HTMLElement) {
    if (!node.inert || node.getAttribute('aria-hidden') !== 'true') throw new Error('Modal background escaped');
  }
}

describe('retained painting viewer owner; explicit DOM/decoder doubles, no native-layout claim', () => {
  it('opens unchanged retained bytes, supports fit/actual-size and releases its URL with focus restoration', async () => {
    const h = harness(), image = original(); expect(await h.viewer.open(image)).toBe(true);
    expect(h.create).toHaveBeenCalledExactlyOnceWith(image.blob);
    expect(h.dialog().dataset.imageSha256).toBe(image.sha256); expect(h.dialog().dataset.ready).toBe('true');
    expect(h.document.querySelector('canvas')).toBeNull(); expect(h.document.activeElement).toBe(h.button('close'));
    h.button('actual').click(); const img = h.dialog().querySelector('img')!;
    expect(img.style.width).toBe('1024px'); expect(img.style.maxWidth).toBe('none');
    h.button('fit').click(); expect(img.style.maxWidth).toBe('100%');
    h.button('close').click(); expect(h.document.querySelector('dialog')).toBeNull();
    expect(h.revoke).toHaveBeenCalledExactlyOnceWith('blob:unit-1'); expect(h.document.activeElement).toBe(h.opener);
  });

  it('owns late/mutated background roots for the entire lifetime and restores exact prior attributes', async () => {
    const h = harness(); const main = h.document.querySelector('main')!, aside = h.document.querySelector('aside')!;
    const attributes = (node: Element) => node.getAttributeNames().sort().map(name => [name, node.getAttribute(name)]);
    const prior = [attributes(main), attributes(aside)]; await h.viewer.open(original());
    const late = h.document.createElement('section'); late.setAttribute('aria-hidden', 'false'); h.document.body.append(late);
    main.inert = false; aside.removeAttribute('aria-hidden'); await settle(); expectLocked(h.document);
    h.opener.focus(); expect(h.document.activeElement).toBe(h.button('close'));
    late.remove(); h.viewer.close(); await settle();
    expect([attributes(main), attributes(aside)]).toEqual(prior); expect(late.inert).toBe(false); expect(late.getAttribute('aria-hidden')).toBe('false');
    main.inert = false; await settle(); expect(main.hasAttribute('inert')).toBe(false);
  });

  it('rejects a broken one-time-isolation control using the same lifetime outcome assertion', async () => {
    const h = harness(); h.dom.window.MutationObserver = class { observe() {} disconnect() {} };
    await h.viewer.open(original()); const late = h.document.createElement('section'); h.document.body.append(late);
    await settle(); expect(() => expectLocked(h.document)).toThrow('Modal background escaped');
  });

  it('closes synchronously on Escape without forwarding ascent to the game window', async () => {
    const h = harness(); await h.viewer.open(original()); const gameEscape = vi.fn();
    h.dom.window.addEventListener('keydown', gameEscape);
    const event = new h.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    h.button('close').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); expect(gameEscape).not.toHaveBeenCalled(); expect(h.document.querySelector('dialog')).toBeNull();
  });

  it('refuses late decoding after close and cannot resurrect or leak the old image', async () => {
    const h = harness(), held = deferred(); h.decode.mockImplementationOnce(() => held.promise);
    const opening = h.viewer.open(original()); h.viewer.close(); held.resolve();
    expect(await opening).toBe(false); expect(h.document.querySelector('dialog')).toBeNull(); expect(h.revoke).toHaveBeenCalledTimes(1);
  });

  it('keeps a successor when the previous decoder settles and releases each URL exactly once', async () => {
    const h = harness(), held = deferred(); h.decode.mockImplementationOnce(() => held.promise);
    const old = h.viewer.open(original()); expect(await h.viewer.open(original('b'.repeat(64)))).toBe(true);
    held.resolve(); expect(await old).toBe(false); expect(h.dialog().dataset.imageSha256).toBe('b'.repeat(64));
    h.viewer.close(); expect(h.revoke.mock.calls.map(row => row[0])).toEqual(['blob:unit-1', 'blob:unit-2']);
  });

  it('releases transient inspection on pagehide so it does not survive in a restored page', async () => {
    const h = harness(); await h.viewer.open(original());
    h.dom.window.dispatchEvent(new h.dom.window.Event('pagehide'));
    expect(h.document.querySelector('dialog')).toBeNull(); expect(h.revoke).toHaveBeenCalledTimes(1);
    expect(h.document.querySelector('main')!.hasAttribute('inert')).toBe(false);
  });

  it('refuses wrong dimensions and decoder failure with complete cleanup', async () => {
    const h = harness();
    await expect(h.viewer.open({ ...original(), width: 1000 })).rejects.toThrow('dimensions changed');
    h.decode.mockRejectedValueOnce(new Error('Decode failed'));
    await expect(h.viewer.open(original())).rejects.toThrow('Decode failed');
    expect(h.document.querySelector('dialog')).toBeNull(); expect(h.revoke).toHaveBeenCalledTimes(2);
    expect(h.document.querySelector('main')!.hasAttribute('inert')).toBe(false);
  });
  it('captures the inspection intent before a read and restores the same refilled live button', async () => {
    const h = harness(); const panel = h.document.createElement('div'); panel.id = 'notificationpanel';
    panel.innerHTML = '<button data-ai-act="inspect" data-ai-job="bound-job">Inspect</button>'; h.document.body.append(panel);
    panel.querySelector('button')!.focus(); const restore = captureLandfallFocusReturnV1(h.document);
    panel.innerHTML = '<button data-ai-act="inspect" data-ai-job="other-job">Wrong</button><button data-ai-act="inspect" data-ai-job="bound-job">Inspect</button>';
    await h.viewer.open(original(), restore); h.viewer.close();
    expect(h.document.activeElement).toBe(panel.querySelector('[data-ai-job="bound-job"]'));
  });

  it('returns focus to the visible Notifications opener when resize closed its former panel', async () => {
    const h = harness(); const panel = h.document.createElement('div'); panel.id = 'notificationpanel';
    panel.innerHTML = '<button data-ai-act="inspect" data-ai-job="bound-job">Inspect</button>'; h.document.body.append(panel);
    const shelf = h.document.createElement('button'); shelf.id = 'shelfnotifications'; h.document.body.append(shelf);
    panel.querySelector('button')!.focus(); const restore = captureLandfallFocusReturnV1(h.document);
    await h.viewer.open(original(), restore); panel.style.display = 'none'; h.viewer.close();
    expect(h.document.activeElement).toBe(shelf); expect(panel.style.display).toBe('none');
  });

});
