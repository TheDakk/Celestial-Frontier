// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { HEARTBEAT_MS, REGISTRY, bootSave } from '../src/save/index';
import { SOL as SOL_STAR } from './nav-support';
import { NOW, SOL_ROUTE } from './save-support';
import { bootPage, pretendLayout, setVisibility, settled } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();

describe('the booted page', () => {
  it('holds the save after the boot heartbeat, beats on the heartbeat time, and keeps a new game in Sol across a reload', async () => {
    const page = await bootPage();
    expect(page.booted.kind).toBe('fresh');
    expect(page.runtime.diagnostics()).toMatchObject({ leaseOwned: true, answerable: true });
    expect(page.timers.map((timer) => timer.ms)).toEqual([HEARTBEAT_MS]);
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

  it('Escape closes the open panel and the focus goes back to the dock', async () => {
    const page = await bootPage();
    page.openSettings();
    expect(page.panels.openId()).toBe('settings');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(page.panels.openId()).toBeNull();
    expect(document.activeElement).toBe(document.querySelector('.dock [data-screen="settings"]'));
  });

  it('the page carries its title as a heading, its size class and its input mode', async () => {
    const page = await bootPage({ width: 1280, height: 720 });
    expect(document.querySelector('#app > h1')!.textContent).toBe('Celestial Frontier');
    const root = document.documentElement;
    expect([root.dataset.sizeClass, root.dataset.input, root.style.getPropertyValue('--target-min'), root.style.fontSize]).toEqual(['wide', 'mouse', '32px', '13px']);
    expect(page.chrome.toast.getAttribute('role')).toBe('status');
  });
});
