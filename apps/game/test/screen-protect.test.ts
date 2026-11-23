// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createMemoryBackend } from '@cf/persistence';
import type { GameEvents } from '../src/events';
import { backupFileName, readLastBackupAt } from '../src/protect/index';
import { REGISTRY, bootSave } from '../src/save/index';
import { localDateTime } from '../src/screens';
import { NOW, SOL_ROUTE, dump, seedCurrentSave } from './save-support';
import { bootPage, pretendLayout, settled } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();

const reboot = (backend: Parameters<typeof dump>[0]) => bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });
const text = (page: Awaited<ReturnType<typeof bootPage>>, key: string): string => page.panel().querySelector(`[data-set="${key}"]`)!.textContent!;

describe('save protection in Settings', () => {
  it('Back up now hands over a file that restores, stores the time, and shows it in local date and time', async () => {
    const page = await bootPage();
    page.live.fsMode = 'fs-lg';
    await page.loop.request('settings');
    const backups: GameEvents['protect:backup'][] = [];
    page.env.bus.on('protect:backup', (event) => backups.push(event));
    page.openSettings();
    expect(text(page, 'last-backup')).toBe('Never');

    page.time.advance(90_000);
    const at = NOW + page.time.now();
    // A change the page has not stored yet: the file holds it all the same.
    page.live.toneMode = 'tone-max';
    page.control('backup').click();
    await settled();
    expect(page.files.map((file) => file.name)).toEqual([backupFileName(at)]);
    expect(backups).toEqual([{ at }]);
    expect(text(page, 'last-backup')).toBe(localDateTime(at));
    expect(text(page, 'protect-note')).toBe('Backup file made.');
    expect(readLastBackupAt((await reboot(page.backend)).extensions)).toBe(at);

    // The file restores on an empty device to the expedition as it was stored.
    const other = await bootPage();
    other.openSettings();
    other.chooser.answer = page.files[0]!.text;
    other.control('restore').click();
    await settled();
    expect(document.getElementById('setrestoreconfirm')!.hidden).toBe(false);
    other.control('restore-yes').click();
    await settled();
    expect(other.reloads).toBe(1);
    const restored = (await reboot(other.backend)).state;
    expect([restored.fsMode, restored.toneMode]).toEqual(['fs-lg', 'tone-max']);
  });

  it('the local date and time are written year first, to the minute', () => {
    const noon = new Date(2026, 10, 3, 9, 5).getTime();
    expect(localDateTime(noon)).toBe('2026-11-03 09:05');
  });

  it('a file that is not a backup is refused in words and nothing is stored; Cancel puts a good file down', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    const page = await bootPage({ backend });
    page.openSettings();
    page.control('backup').click();
    await settled();
    const before = await dump(backend);

    page.chooser.answer = '{"not":"a backup"}';
    page.control('restore').click();
    await settled();
    expect(text(page, 'protect-note')).toBe('That file is damaged or is not a backup of this game. Nothing was changed.');
    expect(document.getElementById('setrestoreconfirm')!.hidden).toBe(true);

    page.chooser.answer = page.files[0]!.text;
    page.control('restore').click();
    await settled();
    page.control('restore-no').click();
    await settled();
    expect(document.getElementById('setrestoreconfirm')!.hidden).toBe(true);
    page.control('restore-yes').click();
    await settled();
    expect([await dump(backend), page.reloads]).toEqual([before, 0]);
  });

  it('a chooser that never answers leaves Restore ready: the next press chooses again', async () => {
    const page = await bootPage();
    page.openSettings();
    page.control('backup').click();
    await settled();
    page.chooser.answer = 'never';
    page.control('restore').click();
    await settled();
    expect(page.control('restore').disabled).toBe(false);
    expect(page.control('backup').disabled).toBe(false);
    page.chooser.answer = page.files[0]!.text;
    page.control('restore').click();
    await settled();
    expect(document.getElementById('setrestoreconfirm')!.hidden).toBe(false);
  });

  it('whether the browser keeps the data is shown in words, asked once on the first gesture, and Ask again repeats it', async () => {
    const page = await bootPage({ persist: { persisted: 'not-kept', asked: 'kept' } });
    await settled();
    page.openSettings();
    await settled();
    expect(page.persistCalls).toBe(0);
    expect(text(page, 'persist-state')).toBe('This browser may clear it when the device runs short of space');
    page.panel().dispatchEvent(new Event('pointerdown', { bubbles: true }));
    page.panel().dispatchEvent(new Event('keydown', { bubbles: true }));
    await settled();
    expect(page.persistCalls).toBe(1);
    expect(text(page, 'persist-state')).toBe('Kept by this browser');
    page.control('persist-ask').click();
    await settled();
    expect(page.persistCalls).toBe(2);
  });
});
