/* D16 parity — the Pop-up notifications switch (v1 `notifopt`, save `notif`, absent ⇒ on; INVENTORY row #117) — OUTCOME test.
 *
 * Two exact shipped Main owners run type-stripped in JSDOM:
 * 1. `fillSettings`: the switch press flips `save.notifOn` and checkpoints it (read back from a real memory backend).
 * 2. The toast owner (`toastDetailText` … `toast`, `bindTameToastCounterpart`): with pop-ups OFF a toast is still recorded in
 *    the tray and still ANNOUNCED (live-region text), but not painted; a creature's voice that binds the toast as its visible
 *    counterpart REVEALS it, so the audio cue still fires (the bind returns a receipt) — the handoff's "toasts carry
 *    audio-counterpart duties" law. Negative controls remove the gate and the reveal. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryBackend, createRevisionedRepository, importSaveV2, initializeFreshV5, readSaveV5, type ContentRegistry } from '@cf/persistence';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void; Node: typeof Node; HTMLElement: typeof HTMLElement } } };

function section(start: string, end: string): string {
  if (MAIN.split(start).length !== 2) throw new Error(`anchor must be unique: ${start}`);
  const left = MAIN.indexOf(start), right = MAIN.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`section missing: ${start}`);
  return MAIN.slice(left, right);
}
const TOAST = (): string => [
  section('function toastDetailText(): string | null {', '\nfunction compendiumFeedStatusCounterpartIsCurrent('),
  section('function invalidateTameToastCounterpart(): void {', '\nfunction invalidateCompendiumFeedStatusCounterpart('),
  section('function showToast(title: string, msg: string, assertive: boolean): void {', '\n/* Chapter reconciliation'),
  section('function bindTameToastCounterpart(', '\nfunction bindCompendiumFeedStatusCounterpart('),
].join('\n');
const SETTINGS = (): string => section('function fillSettings(): void {', '\n/* ---- GUIDE + RELEASE HISTORY');

/** A `with` env whose unknown free names are inert stubs (only for unrelated Settings rows). */
function proxied(known: Record<string, unknown>) {
  return new Proxy(known, {
    has: (target, key) => key in target || !(key in globalThis),
    get: (target, key) => (key in target ? target[key as string] : key === Symbol.unscopables ? undefined : vi.fn(() => ({ kind: 'unavailable' }))),
  });
}

function toastHarness(notifOn: boolean, source = TOAST()) {
  const dom = new JSDOM('<!doctype html><html><body><div id="toast" role="status" aria-atomic="true"></div></body></html>');
  const record = vi.fn();
  const known: Record<string, unknown> = {
    document: dom.window.document, Node: dom.window.Node, HTMLElement: dom.window.HTMLElement, window: dom.window,
    toastEl: dom.window.document.getElementById('toast'), save: { notifOn }, notificationHistory: { record },
    tameToastCounterpart: null, tameGreetingAudioOwner: null, _toastSerial: 0, _toastHide: 0, _toastT: -1e9,
    TOAST_DEDUP_MS: 1800, performance: { now: () => 1e6 }, Date: { now: () => NOW },
    esc: (v: string) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`),
  };
  const out = transformSync('main-d16-toast.ts', source);
  if (out.errors.length) throw new Error(JSON.stringify(out.errors));
  const api = new Function('env', `with (env) { ${out.code}; return { toast, bind: bindTameToastCounterpart }; }`)(proxied(known)) as {
    toast: (t: string, m: string, force?: boolean) => void; bind: (key: string, t: string, d: string) => unknown };
  return { dom, api, record, el: known.toastEl as HTMLElement };
}

describe('D16 pop-up notifications switch', () => {
  it('ON (default): a toast is painted, announced and recorded', () => {
    const h = toastHarness(true);
    h.api.toast('⛏ Deposits Mined', 'Iron ×3', true);
    expect(h.el.style.opacity).toBe('1');
    expect(h.el.textContent).toBe('⛏ Deposits MinedIron ×3');
    expect(h.record).toHaveBeenCalledWith('⛏ Deposits Mined', 'Iron ×3', NOW);
  });

  it('OFF: the toast still lands in the tray and the live region, but is not painted', () => {
    const h = toastHarness(false);
    h.api.toast('⛏ Deposits Mined', 'Iron ×3', true);
    expect(h.record).toHaveBeenCalledWith('⛏ Deposits Mined', 'Iron ×3', NOW);
    expect(h.el.textContent).toBe('⛏ Deposits MinedIron ×3');
    expect(h.el.getAttribute('aria-live')).toBe('assertive');
    expect(h.el.style.opacity).toBe('0');
  });

  it('OFF: a creature voice that needs the toast as its visible counterpart reveals it, so the audio cue still fires', () => {
    const h = toastHarness(false);
    h.api.toast('✨ Tamed', 'A new companion joins you.', true);
    const receipt = h.api.bind('tame:1', '✨ Tamed', 'A new companion joins you.');
    expect(receipt).not.toBeNull();
    expect(h.el.style.opacity).toBe('1');
    expect(h.el.dataset.quiet).toBe('revealed-for-counterpart');
  });

  it('negative control: without the reveal the counterpart is lost (the voice would be silent)', () => {
    const needle = "  if (toastEl.dataset.quiet === 'true' && toastEl.style.opacity === '0') { toastEl.style.opacity = '1'; toastEl.dataset.quiet = 'revealed-for-counterpart'; }\n";
    expect(TOAST().split(needle)).toHaveLength(2);
    const h = toastHarness(false, TOAST().replace(needle, ''));
    h.api.toast('✨ Tamed', 'A new companion joins you.', true);
    expect(h.api.bind('tame:1', '✨ Tamed', 'A new companion joins you.')).toBeNull();
  });

  it('negative control: a toast that ignores the switch paints anyway (the OFF assertion catches it)', () => {
    const needle = "  toastEl.style.opacity = save.notifOn ? '1' : '0';\n  toastEl.dataset.quiet = String(!save.notifOn);\n  clearTimeout(_toastHide);";
    expect(TOAST().split(needle).length).toBeGreaterThan(1); // showToast's gate comes first in the executed source
    const h = toastHarness(false, TOAST().replace(needle, "  toastEl.style.opacity = '1';\n  clearTimeout(_toastHide);"));
    h.api.toast('x', 'y', true);
    expect(h.el.style.opacity).toBe('1');
  });

  it('the Settings switch flips and persists `notif` (durable read-back twice), and reads back ON when absent', async () => {
    const imported = importSaveV2('{}', REGISTRY, NOW);
    if (!imported.ok) throw new Error(imported.reason);
    expect(imported.state.notifOn).toBe(true); // absent ⇒ on
    const save = imported.state;
    const backend = createMemoryBackend();
    const init = await initializeFreshV5(backend, { state: save, extensions: {} }, REGISTRY, NOW);
    if (init.kind !== 'initialized') throw new Error(init.kind);
    const runtime = createF4RuntimeAuthority({ backend, repository: createRevisionedRepository(backend), registry: REGISTRY, initialRevision: init.revision,
      initialExtensions: {}, restoredAuthority: null, freshSessionSeed: 1, ownerId: 'd16-notif', token: 'd16-notif', leaseTtlMs: 10_000, now: () => 100, visible: true, answerable: true });
    await runtime.heartbeat();
    const dom = new JSDOM('<!doctype html><html><body><aside id="setpanel"></aside></body></html>');
    const doc = dom.window.document;
    const known: Record<string, unknown> = {
      document: doc, save, fillPanel: (id: string, html: string) => { doc.getElementById(`${id}panel`)!.innerHTML = html; },
      persistView: async () => (await runtime.commit(save, NOW)).kind === 'committed', pwaUpdateControl: null,
      audioAccessibility: { mono: false, reducedIntensity: false }, Date: { now: () => NOW },
    };
    const out = transformSync('main-d16-settings.ts', SETTINGS());
    new Function('env', `with (env) { ${out.code}; fillSettings(); }`)(proxied(known));
    const button = () => doc.getElementById('setnotif') as HTMLButtonElement;
    expect(button().getAttribute('aria-pressed')).toBe('true');
    button().click();
    for (let i = 0; i < 30; i++) await new Promise((r) => setTimeout(r, 0));
    expect(button().getAttribute('aria-pressed')).toBe('false');
    for (let read = 0; read < 2; read++) {
      const back = await readSaveV5(backend, REGISTRY, NOW);
      expect(back.kind === 'loaded' && back.state.notifOn).toBe(false);
    }
    dom.window.close();
  });
});
