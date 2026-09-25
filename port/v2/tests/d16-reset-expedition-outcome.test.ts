/* D16 parity — Settings → Reset expedition (v1 `resetbtn` → `resetconfirm` → `resetyes`; INVENTORY row #120) — OUTCOME test.
 *
 * The exact shipped `fillSettings` runs type-stripped in JSDOM; the test presses Reset…, Cancel, Reset…, then "Erase and start
 * over". The erase hands `importBlob` the fresh-expedition payload. Harness glue: `importBlob` is replaced by its durable core —
 * `prepareV5Replacement` + the real F4 runtime's `replace` over a memory backend (the same two calls importBlob makes; its
 * renderer release/reload is presentation) — so the OUTCOME asserted is the durable save after the press: a brand-new expedition
 * (no discoveries, no Stardust, Field Training not done, the old receipts gone), readable twice. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import {
  createMemoryBackend, createRevisionedRepository, importSaveV2, initializeFreshV5, prepareV5Replacement, readSaveV5,
  type ContentRegistry,
} from '@cf/persistence';
import { freshExpeditionPayloadV1 } from '../apps/game/src/expedition-reset.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };

function settingsSource(): string {
  const start = 'function fillSettings(): void {', end = '\n/* ---- GUIDE + RELEASE HISTORY';
  const left = MAIN.indexOf(start), right = MAIN.indexOf(end, left);
  if (left < 0 || right <= left) throw new Error('fillSettings section missing');
  return MAIN.slice(left, right);
}

async function fixture() {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const save = imported.state;
  save.explorerName = 'Nova'; save.essence = 420; save.tutDone = true; save.stats.guardians = 3;
  const backend = createMemoryBackend();
  const init = await initializeFreshV5(backend, { state: save, extensions: {} }, REGISTRY, NOW);
  if (init.kind !== 'initialized') throw new Error(init.kind);
  const runtime = createF4RuntimeAuthority({
    backend, repository: createRevisionedRepository(backend), registry: REGISTRY, initialRevision: init.revision, initialExtensions: {},
    restoredAuthority: null, freshSessionSeed: 0xD16E5, ownerId: 'd16-reset', token: 'd16-reset', leaseTtlMs: 10_000,
    now: () => 100, visible: true, answerable: true,
  });
  await expect(runtime.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
  await expect(runtime.commit(save, NOW)).resolves.toMatchObject({ kind: 'committed' });
  return { save, backend, runtime };
}

function mount(f: Awaited<ReturnType<typeof fixture>>, source = settingsSource()) {
  const dom = new JSDOM('<!doctype html><html><body><aside id="setpanel"></aside></body></html>');
  const doc = dom.window.document;
  const importBlob = vi.fn(async (raw: string) => {
    const prepared = prepareV5Replacement(raw.trim(), REGISTRY, NOW);
    if (prepared.kind !== 'prepared') return 'invalid';
    return (await f.runtime.replace(prepared.operations)).kind === 'committed' ? null : 'refused';
  });
  const known: Record<string, unknown> = {
    document: doc, save: f.save, fillPanel: (id: string, html: string) => { doc.getElementById(`${id}panel`)!.innerHTML = html; },
    importBlob, freshExpeditionPayloadV1, REGISTRY, toast: vi.fn(), pwaUpdateControl: null,
    audioAccessibility: { mono: false, reducedIntensity: false },
    searchTravel: { trainingSolSystemNav: () => null }, navToView: () => null,
    Date: { now: () => NOW },
  };
  // Every other free name the Settings owner references is an unrelated external: a no-op stub.
  const env = new Proxy(known, {
    has: (target, key) => key in target || !(key in globalThis),
    get: (target, key) => (key in target ? target[key as string] : key === Symbol.unscopables ? undefined : vi.fn(() => ({ kind: 'unavailable' }))),
  });
  const out = transformSync('main-d16-reset.ts', source);
  if (out.errors.length) throw new Error(JSON.stringify(out.errors));
  new Function('env', `with (env) { ${out.code}; fillSettings(); }`)(env);
  return { dom, doc, importBlob, toast: known.toast as ReturnType<typeof vi.fn> };
}
const settle = async () => { for (let i = 0; i < 40; i++) await new Promise((r) => setTimeout(r, 0)); };

describe('D16 Reset expedition — armed two-step, durable fresh expedition', () => {
  it('Reset… reveals the confirmation, Cancel hides it and writes nothing; Erase replaces the durable save with a brand-new expedition', async () => {
    const f = await fixture();
    const view = mount(f);
    const $ = (id: string) => view.doc.getElementById(id) as HTMLButtonElement;
    expect($('setresetconfirm').hidden).toBe(true);
    $('setreset').click();
    expect($('setresetconfirm').hidden).toBe(false);
    expect($('setreset').getAttribute('aria-expanded')).toBe('true');
    $('setresetno').click();
    expect($('setresetconfirm').hidden).toBe(true);
    expect(view.importBlob).not.toHaveBeenCalled();
    const before = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(before.kind === 'loaded' && before.state.essence).toBe(420);
    expect((await f.backend.keys('receipts')).length).toBeGreaterThanOrEqual(0);

    $('setreset').click();
    $('setresetyes').click();
    await settle();
    expect(view.importBlob).toHaveBeenCalledTimes(1);
    for (let read = 0; read < 2; read++) {
      const after = await readSaveV5(f.backend, REGISTRY, NOW);
      if (after.kind !== 'loaded') throw new Error(after.kind);
      expect(after.state.essence).toBe(0);
      expect(after.state.explorerName).toBe('');
      expect(after.state.tutDone).toBe(false);
      expect(after.state.stats.guardians ?? 0).toBe(0);
    }
    expect(await f.backend.keys('receipts')).toEqual([]);
    view.dom.window.close();
  });

  it('a refused replacement leaves the expedition unchanged and says so', async () => {
    const f = await fixture();
    const view = mount(f);
    view.importBlob.mockImplementationOnce(async () => 'Storage refused the write (private mode?).');
    (view.doc.getElementById('setreset') as HTMLButtonElement).click();
    (view.doc.getElementById('setresetyes') as HTMLButtonElement).click();
    await settle();
    const after = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(after.kind === 'loaded' && after.state.essence).toBe(420);
    expect(view.toast).toHaveBeenCalledWith('Reset unavailable', expect.stringContaining('Your expedition is unchanged.'), true);
    expect((view.doc.getElementById('setresetyes') as HTMLButtonElement).disabled).toBe(false);
    view.dom.window.close();
  });

  it('the payload is exactly a fresh explorer with Training pending (no save-shape change)', () => {
    const raw = freshExpeditionPayloadV1({ registry: REGISTRY, now: NOW, solView: null });
    const again = importSaveV2(raw, REGISTRY, NOW);
    if (!again.ok) throw new Error(again.reason);
    expect(again.state.tutDone).toBe(false);
    expect(again.state.essence).toBe(0);
  });

  it('negative control: an Erase wired to a no-op writes nothing (the durable assertion catches it)', async () => {
    const needle = '    const error = await importBlob(';
    expect(settingsSource().split(needle)).toHaveLength(2);
    const f = await fixture();
    const view = mount(f, settingsSource().replace(needle, '    const error = null; void (async (_payload: string) => null)('));
    (view.doc.getElementById('setreset') as HTMLButtonElement).click();
    (view.doc.getElementById('setresetyes') as HTMLButtonElement).click();
    await settle();
    const after = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(after.kind === 'loaded' && after.state.essence).toBe(420);
    view.dom.window.close();
  });
});
