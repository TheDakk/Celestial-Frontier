// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { F3_ACTIVE_PLAY_LEASE_KEY, V5_SCHEMA_KEY, createMemoryBackend, type StorageBackend } from '@cf/persistence';
import { HEARTBEAT_MS, REGISTRY, bootSave } from '../src/save/index';
import { NOTICE_WORDS, heldNoticeFor } from '../src/screens';
import { SOL as SOL_STAR } from './nav-support';
import { NOW, SOL_ROUTE, dump, seedCurrentSave } from './save-support';
import { bootPage, pretendLayout, setVisibility, settled } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();

const notice = (): HTMLElement | null => document.querySelector<HTMLElement>('.notices .notice');

async function futureSave(): Promise<StorageBackend> {
  const backend = createMemoryBackend();
  await seedCurrentSave(backend, 'Vega');
  const row = JSON.parse((await backend.get('meta', V5_SCHEMA_KEY)) as string) as Record<string, unknown>;
  await backend.apply([{ store: 'meta', key: V5_SCHEMA_KEY, value: JSON.stringify({ ...row, schema: 6 }) }]);
  return backend;
}
/** A store whose reads fail until `mend()` is called. */
function failing(inner: StorageBackend): { backend: StorageBackend; mend(): void } {
  let broken = true;
  const guard = <A extends unknown[], R>(call: (...args: A) => Promise<R>) => (...args: A): Promise<R> =>
    (broken ? Promise.reject(new Error('storage is unavailable')) : call(...args));
  return {
    backend: { ...inner, get: guard(inner.get.bind(inner)), keys: guard(inner.keys.bind(inner)) } as StorageBackend,
    mend() { broken = false; },
  };
}

describe('the booted page', () => {
  it('holds the save after the boot heartbeat, beats on the heartbeat time, and keeps a new game in Sol across a reload', async () => {
    const page = await bootPage();
    expect(page.booted.kind).toBe('fresh');
    expect(page.runtime.diagnostics()).toMatchObject({ leaseOwned: true, answerable: true });
    expect(page.timers.map((timer) => timer.ms)).toEqual([HEARTBEAT_MS]);
    expect(notice()).toBeNull();
    expect(page.nav.nav).toMatchObject({ mode: 'system', star: { seed: SOL_STAR.seed } });

    // A beat when a checkpoint is due stores one.
    const revision = page.runtime.revision;
    page.time.advance(31_000);
    page.timers[0]!.run();
    await settled();
    expect(page.runtime.revision).toBe(revision + 1);

    const again = await bootPage({ backend: page.backend });
    expect(again.booted.kind).toBe('current');
    expect(again.nav.nav).toMatchObject({ mode: 'system', star: { seed: SOL_STAR.seed } });
    expect(again.live.savedView).toEqual(page.nav.solRoute());
  });

  it('a hidden page stores a checkpoint and gives the save up; shown again it takes it back; hidden, the heartbeat does nothing', async () => {
    const page = await bootPage();
    page.live.fsMode = 'fs-lg';
    const revision = page.runtime.revision;
    setVisibility('hidden');
    await settled();
    expect(page.runtime.revision).toBe(revision + 1);
    expect(page.runtime.diagnostics().leaseOwned).toBe(false);
    expect((await bootSave({ backend: page.backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE })).state.fsMode).toBe('fs-lg');
    page.timers[0]!.run();
    await settled();
    expect(page.runtime.diagnostics().leaseOwned).toBe(false);
    setVisibility('visible');
    await settled();
    expect(page.runtime.diagnostics()).toMatchObject({ leaseOwned: true, answerable: true });
  });

  it('a page that can no longer prove the save is its own reloads, once', async () => {
    const page = await bootPage();
    const other = await bootPage({ backend: page.backend });
    expect(other.runtime.diagnostics().leaseOwned).toBe(false);
    // The first page stores a checkpoint as it hides and gives the save up. The second then takes the save and
    // finds a revision it does not know.
    await page.loop.hide();
    expect(other.reloads).toBe(0);
    other.timers[0]!.run();
    await settled();
    expect([other.reloads, other.loop.status]).toEqual([1, 'reload-required']);
    expect(other.chrome.toast.textContent).toContain('Reload required');
    other.env.bus.emit('save:reload-required', { reason: 'again' });
    expect([other.reloads, page.reloads]).toEqual([1, 0]);
  });

  it('a future-version boot shows the newer-version notice and no control can start a write', async () => {
    const backend = await futureSave();
    const before = await dump(backend);
    const page = await bootPage({ backend });
    expect(page.booted.kind).toBe('future-protected');
    expect(notice()!.dataset.notice).toBe('newer');
    expect(notice()!.textContent).toBe(`${NOTICE_WORDS.newer.title}${NOTICE_WORDS.newer.text}`);
    expect(notice()!.querySelector('.icon')).not.toBeNull();
    expect(notice()!.querySelector('button')).toBeNull();

    page.openSettings();
    expect(['backup', 'restore', 'reset', 'reset-yes', 'restore-yes'].map((key) => page.control(key).disabled)).toEqual([true, true, true, true, true]);
    page.chooser.answer = '{"anything":1}';
    // Every control is pressed, disabled or not; the panel is drawn again after each, so each is looked up afresh.
    const keys = [...page.panel().querySelectorAll<HTMLElement>('[data-set]')].map((el) => [el.dataset.set!, el.dataset.value] as const);
    for (const [key, value] of keys) {
      const control = page.panel().querySelector<HTMLElement>(value === undefined ? `[data-set="${key}"]` : `[data-set="${key}"][data-value="${value}"]`);
      control?.click();
      control?.dispatchEvent(new Event('input', { bubbles: true }));
      await settled();
    }
    expect(page.live.sndOn).toBe(false);
    page.time.advance(60_000);
    page.timers[0]!.run();
    setVisibility('hidden');
    await settled();
    setVisibility('visible');
    await settled();
    expect(await dump(backend)).toEqual(before);
    expect([page.files, page.reloads, page.panel().textContent!.includes('Not available while the save is protected.')]).toEqual([[], 0, true]);
  });

  it('storage that cannot be read shows Try again; trying again reloads once it reads, and says so while it does not', async () => {
    const store = failing(createMemoryBackend());
    const page = await bootPage({ backend: store.backend });
    expect(page.booted).toMatchObject({ kind: 'transient-protected', hold: 'transient-read' });
    expect(notice()!.dataset.notice).toBe('unavailable');
    const again = (): HTMLButtonElement => notice()!.querySelector<HTMLButtonElement>('[data-notice-action="retry"]')!;
    expect(again().textContent).toBe('Try again');
    again().click();
    await settled();
    expect(page.reloads).toBe(0);
    expect(page.chrome.toast.textContent).toContain('Storage is still unavailable.');
    store.mend();
    again().click();
    await settled();
    expect(page.reloads).toBe(1);
  });

  it('a lease that cannot be taken at boot settles in a hold with Try again and asks for no reload, boot after boot', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    // A lease row this build cannot decode: the boot read succeeds and every lease read throws.
    await backend.apply([{ store: 'meta', key: F3_ACTIVE_PLAY_LEASE_KEY, value: 'not a lease this build reads' }]);
    const before = await dump(backend);
    const again = (): HTMLButtonElement => notice()!.querySelector<HTMLButtonElement>('[data-notice-action="retry"]')!;

    let page = await bootPage({ backend });
    for (let boot = 0; boot < 2; boot++) {
      expect(page.booted.kind).toBe('current');
      expect([page.reloads, page.loop.status, page.gate.hold]).toEqual([0, 'held', 'transient-read']);
      expect(notice()!.dataset.notice).toBe('unavailable');
      expect(again().textContent).toBe('Try again');
      // Later heartbeats touch nothing and ask for nothing.
      page.time.advance(60_000);
      page.timers[0]!.run();
      await settled();
      expect(page.reloads).toBe(0);
      // Backup stays in reach, and nothing else may start a write.
      page.openSettings();
      expect(['backup', 'restore', 'reset'].map((key) => page.control(key).disabled)).toEqual([false, true, true]);
      expect(page.panel().textContent).toContain('Protected: nothing is written');
      if (boot === 1) break;
      // The player's own Try again reloads once, since the store reads; the next page settles the same way.
      again().click();
      await settled();
      expect(page.reloads).toBe(1);
      page = await bootPage({ backend });
    }
    expect(await dump(backend)).toEqual(before);
  });

  it('names each hold in words: newer, damaged, unavailable, or a reload', () => {
    expect(heldNoticeFor('current', false, null)).toBeNull();
    expect(heldNoticeFor('future-protected', 'protected-payload', null)).toBe('newer');
    expect(heldNoticeFor('corrupt-protected', 'protected-payload', null)).toBe('damaged');
    expect(heldNoticeFor('recovered-protected', 'protected-payload', null)).toBe('damaged');
    expect(heldNoticeFor('revision-exhausted-protected', 'protected-payload', null)).toBe('damaged');
    expect(heldNoticeFor('transient-protected', 'transient-read', null)).toBe('unavailable');
    expect(heldNoticeFor('transient-protected', 'protected-payload', 'this expedition was written by a newer build')).toBe('newer');
    expect(heldNoticeFor('transient-protected', 'protected-payload', 'the stored expedition did not prove writable')).toBe('damaged');
    expect(heldNoticeFor('current', 'protected-payload', 'replacement authority stale; reload required')).toBe('reload');
  });

  it('Escape closes the open panel and the focus goes back to the dock', async () => {
    const page = await bootPage();
    page.openSettings();
    expect(page.panels.openId()).toBe('settings');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(page.panels.openId()).toBeNull();
    expect(document.activeElement).toBe(document.querySelector('.dock [data-screen="settings"]'));
  });

  it('sound is readied by the first gesture the browser counts, not by a press, a wheel or Escape', async () => {
    const page = await bootPage();
    const unlock = vi.spyOn(page.sound, 'unlock').mockImplementation(() => undefined);
    const stage = document.querySelector('.stage')!;
    for (const type of ['pointerdown', 'wheel', 'pointermove']) stage.dispatchEvent(new Event(type, { bubbles: true }));
    for (const key of ['Escape', 'Shift']) stage.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    expect(unlock).not.toHaveBeenCalled();
    stage.dispatchEvent(new Event('pointerup', { bubbles: true }));
    expect(unlock).toHaveBeenCalledTimes(1);
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    stage.dispatchEvent(new Event('click', { bubbles: true }));
    expect(unlock).toHaveBeenCalledTimes(3);
  });

  it('the page carries its title as a heading, its size class and its input mode', async () => {
    const page = await bootPage({ width: 1280, height: 720 });
    expect(document.querySelector('#app > h1')!.textContent).toBe('Celestial Frontier');
    const root = document.documentElement;
    expect([root.dataset.sizeClass, root.dataset.input, root.style.getPropertyValue('--target-min'), root.style.fontSize]).toEqual(['wide', 'mouse', '32px', '13px']);
    expect(page.chrome.toast.getAttribute('role')).toBe('status');
  });
});
