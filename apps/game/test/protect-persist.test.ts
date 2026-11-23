import { describe, expect, it } from 'vitest';
import { createBus } from '../src/bus';
import type { GameEvents, PersistState } from '../src/events';
import { askToKeepData } from '../src/protect/persist';
import { createPersistAsker, readPersistState, type StorageManagerLike } from '../src/protect/index';

/** A browser's storage manager that answers `answer`, and counts how often it was asked. */
function browser(answer: boolean | Error): StorageManagerLike & { asked: number } {
  const reply = (): Promise<boolean> => answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  const manager = { asked: 0, persist: () => { manager.asked++; return reply(); }, persisted: reply };
  return manager;
}

function asker(storage: StorageManagerLike | undefined) {
  const bus = createBus<GameEvents>();
  const heard: PersistState[] = [];
  bus.on('protect:persist', ({ state }) => { heard.push(state); });
  return { heard, ...createPersistAsker({ storage, bus }) };
}
const settle = async (): Promise<void> => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

describe('asking the browser to keep the saved data', () => {
  it('granted reads as kept', async () => {
    expect(await askToKeepData(browser(true))).toBe('kept');
    expect(await readPersistState(browser(true))).toBe('kept');
  });

  it('denied reads as not-kept', async () => {
    expect(await askToKeepData(browser(false))).toBe('not-kept');
    expect(await readPersistState(browser(false))).toBe('not-kept');
  });

  it('a browser without the call reads as unsupported', async () => {
    for (const storage of [undefined, {}]) {
      expect(await askToKeepData(storage)).toBe('unsupported');
      expect(await readPersistState(storage)).toBe('unsupported');
    }
    // An older browser can report the state without being able to grant it.
    expect(await askToKeepData({ persisted: () => Promise.resolve(false) })).toBe('unsupported');
  });

  it('a rejected call reads as unknown and nothing throws', async () => {
    expect(await askToKeepData(browser(new Error('denied by policy')))).toBe('unknown');
    expect(await readPersistState(browser(new Error('denied by policy')))).toBe('unknown');
    const throwing: StorageManagerLike = {
      persist() { throw new Error('not allowed here'); },
      persisted() { throw new Error('not allowed here'); },
    };
    expect(await askToKeepData(throwing)).toBe('unknown');
    expect(await readPersistState(throwing)).toBe('unknown');
  });

  it('reading the state never asks', async () => {
    const storage = browser(true);
    await readPersistState(storage);
    expect(storage.asked).toBe(0);
  });

  it('asked automatically at most once however many gestures arrive', async () => {
    const storage = browser(true);
    const page = asker(storage);
    expect(storage.asked).toBe(0);
    page.onFirstGesture();
    page.onFirstGesture();
    await settle();
    page.onFirstGesture();
    await settle();
    expect(storage.asked).toBe(1);
    expect(page.heard).toEqual(['kept']);
  });

  it('"Ask again" asks again each time and sends each answer', async () => {
    const storage = browser(false);
    const page = asker(storage);
    page.onFirstGesture();
    await settle();
    expect(await page.askAgain()).toBe('not-kept');
    expect(await page.askAgain()).toBe('not-kept');
    expect(storage.asked).toBe(3);
    expect(page.heard).toEqual(['not-kept', 'not-kept', 'not-kept']);
  });

  it('the answer is sent on the bus whatever it is', async () => {
    for (const [storage, state] of [
      [undefined, 'unsupported'], [browser(new Error('x')), 'unknown'], [browser(false), 'not-kept'], [browser(true), 'kept'],
    ] as const) {
      const page = asker(storage);
      page.onFirstGesture();
      await settle();
      expect(page.heard).toEqual([state]);
    }
  });
});
