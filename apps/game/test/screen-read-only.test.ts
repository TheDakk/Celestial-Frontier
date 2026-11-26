// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { REGISTRY, bootSave } from '../src/save/index';
import { NOW, SOL_ROUTE, dump } from './save-support';
import { bootPage, pretendLayout, settled } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();

const READ_ONLY = 'Read-only expeditionInspection remains available, but this action cannot change the expedition until save authority is restored.';
const settingsOf = (state: { sndOn: boolean; tipsOn: boolean; chartsOn: boolean; motionMode: number; fsMode: string; toneMode: string; fontMode: string; sfxVol: number }) =>
  [state.sndOn, state.tipsOn, state.chartsOn, state.motionMode, state.fsMode, state.toneMode, state.fontMode, state.sfxVol];

describe('a page without the save', () => {
  it('refuses each setting with the read-only words, says it stores nothing, and stores again once the save is its own', async () => {
    const first = await bootPage();
    const page = await bootPage({ backend: first.backend });
    expect(page.runtime.diagnostics().leaseOwned).toBe(false);
    page.openSettings();
    const status = (): string => page.panel().querySelector('[data-set="status"]')!.textContent!;
    expect(status()).toContain('Protected: nothing is written');
    expect(status()).not.toContain('Stored on this device');

    const before = settingsOf(page.live);
    const rows = await dump(page.backend);
    const look = document.documentElement.style.fontSize;
    const presses: Array<() => void> = [
      () => page.control('sound').click(),
      () => page.control('tips').click(),
      () => page.control('charts').click(),
      () => page.control('motion', '1').click(),
      () => page.control('size', 'fs-xl').click(),
      () => page.control('tone', 'tone-max').click(),
      () => page.control('font', 'font-mono').click(),
      () => {
        const volume = page.panel().querySelector<HTMLInputElement>('[data-set="volume"]')!;
        volume.value = '35';
        volume.dispatchEvent(new Event('input', { bubbles: true }));
      },
    ];
    for (const press of presses) {
      page.chrome.toast.replaceChildren();
      press();
      expect(page.chrome.toast.textContent).toBe(READ_ONLY);
      expect(settingsOf(page.live)).toEqual(before);
    }
    await settled();
    expect(page.control('sound').getAttribute('aria-pressed')).toBe('true');
    expect([page.control('charts').getAttribute('aria-pressed'), page.control('charts').textContent]).toEqual(['false', 'Off']);
    expect(page.control('size', 'fs-xl').getAttribute('aria-pressed')).toBe('false');
    expect(page.panel().querySelector<HTMLInputElement>('[data-set="volume"]')!.value).toBe(String(Math.round(page.live.sfxVol * 100)));
    expect(document.documentElement.style.fontSize).toBe(look);

    // The listening modes are the device's own, not the expedition's: they still change.
    page.control('mono').click();
    expect(page.control('mono').getAttribute('aria-pressed')).toBe('true');

    // Reset is refused in the same words and nothing reloads.
    page.control('reset').click();
    page.chrome.toast.replaceChildren();
    page.control('reset-yes').click();
    await settled();
    expect([page.chrome.toast.textContent, page.reloads]).toEqual([READ_ONLY, 0]);
    const untouched = await dump(page.backend);
    expect({ ...untouched, meta: null }).toEqual({ ...rows, meta: null });

    // The first page gives the save up; on its next heartbeat this page holds it, says so, and stores a change.
    await first.runtime.release();
    page.timers[0]!.run();
    await settled();
    expect(page.runtime.diagnostics().leaseOwned).toBe(true);
    expect(status()).toContain('Stored on this device');
    page.control('sound').click();
    await page.loop.flush();
    expect(page.live.sndOn).toBe(false);
    expect((await bootSave({ backend: page.backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE })).state.sndOn).toBe(false);
  });

  it('a page that must reload says so in Status and refuses a setting', async () => {
    const page = await bootPage();
    page.openSettings();
    await page.backend.apply([{ store: 'meta', key: 'f3:revision', value: '99' }]);
    page.timers[0]!.run();
    await settled();
    expect(page.loop.status).toBe('reload-required');
    expect(page.panel().querySelector('[data-set="status"]')!.textContent).toContain('Reload needed');
    page.chrome.toast.replaceChildren();
    page.control('tips').click();
    expect([page.chrome.toast.textContent, page.live.tipsOn]).toEqual([READ_ONLY, true]);
  });
});
