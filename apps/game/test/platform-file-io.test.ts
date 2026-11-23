// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickTextFile, saveTextFile } from '../src/platform/file-io';

/** The file input the page is showing the player, with `files` chosen in it. */
function choose(files: File[] | null, event: 'change' | 'cancel' = 'change'): void {
  const input = document.querySelector<HTMLInputElement>('input[type=file]');
  if (input === null) throw new Error('no file input is open');
  if (files !== null) Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new Event(event));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('saveTextFile', () => {
  it('hands the player a file of that name holding that text, and leaves nothing on the page', async () => {
    vi.useFakeTimers();
    const blobs: Blob[] = [];
    const revoked: string[] = [];
    Object.assign(URL, {
      createObjectURL: (blob: Blob) => { blobs.push(blob); return `blob:test/${blobs.length}`; },
      revokeObjectURL: (url: string) => { revoked.push(url); },
    });
    const offered: Array<{ name: string; href: string }> = [];
    document.addEventListener('click', (event) => {
      const link = event.target as HTMLAnchorElement;
      offered.push({ name: link.download, href: link.getAttribute('href') ?? '' });
      event.preventDefault();
    }, { once: true });

    saveTextFile('celestial-frontier-backup-20261122-0905.cfsave', '{"format":"x","é":1}');
    expect(offered).toEqual([{ name: 'celestial-frontier-backup-20261122-0905.cfsave', href: 'blob:test/1' }]);
    expect(blobs).toHaveLength(1);
    expect(await blobs[0]!.text()).toBe('{"format":"x","é":1}');
    expect(document.body.children).toHaveLength(0);
    expect(revoked).toEqual([]); // the browser is still reading it
    vi.advanceTimersByTime(4000);
    expect(revoked).toEqual(['blob:test/1']);
  });
});

describe('pickTextFile', () => {
  it('resolves with the text of the chosen file and leaves nothing on the page', async () => {
    const picked = pickTextFile(1000);
    choose([new File(['{"format":"x","é":1}'], 'backup.cfsave')]);
    expect(await picked).toBe('{"format":"x","é":1}');
    expect(document.body.children).toHaveLength(0);
  });

  it('opens the browser\'s file chooser', () => {
    let opened = 0;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      if (this.type === 'file') opened++;
    });
    void pickTextFile(1000);
    expect(opened).toBe(1);
  });

  it('resolves null when the player chooses nothing', async () => {
    const cancelled = pickTextFile(1000);
    choose(null, 'cancel');
    expect(await cancelled).toBeNull();
    const emptied = pickTextFile(1000);
    choose([]);
    expect(await emptied).toBeNull();
    expect(document.body.children).toHaveLength(0);
  });

  it('reads no more than one byte past the limit of a larger file', async () => {
    const picked = pickTextFile(10);
    choose([new File(['x'.repeat(5000)], 'huge.cfsave')]);
    expect(await picked).toBe('x'.repeat(11));
    const exact = pickTextFile(10);
    choose([new File(['x'.repeat(10)], 'exact.cfsave')]);
    expect(await exact).toBe('x'.repeat(10));
  });

  it('a file that cannot be read arrives as an empty text', async () => {
    const file = new File(['x'], 'gone.cfsave');
    Object.defineProperty(file, 'slice', { value: () => ({ text: () => Promise.reject(new Error('gone')) }) });
    const picked = pickTextFile(10);
    choose([file]);
    expect(await picked).toBe('');
  });
});
