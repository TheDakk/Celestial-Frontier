import { afterEach, describe, expect, it } from 'vitest';
import { testInterfaceSheetText } from '@cf/art-testparts';
import type { GameEvents } from '../src/events';
import { loadPack, prunePackCache } from '../src/packs/loader';
import { loadPacks, localFolderSource } from '../src/packs';
import type { PackCache } from '../src/packs/cache';
import type { PackEntry, PackManifest } from '../src/packs/manifest';
import type { PackSource } from '../src/packs/sources';
import { sha256Hex } from '../src/packs/sha256';
import { currentSheet, placeholderSheet, sheetState, useSheet } from '../src/ui';

const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);
const entryOf = (name: string, bytes: Uint8Array, kind: PackEntry['kind'] = 'parts'): PackEntry =>
  ({ name, kind, file: `${name}-v1.txt`, bytes: bytes.length, sha256: sha256Hex(bytes) });
const manifestOf = (...packs: PackEntry[]): PackManifest => ({ format: 1, packs });

const TEXT = 'part catalogue text: café\n';
const BYTES = utf8(TEXT);
const ENTRY = entryOf('quadruped', BYTES);
const CHANGED = BYTES.slice();
CHANGED[3] = CHANGED[3]! ^ 1;

/** A cache held in memory; `stored` is what a later launch would find. */
function memoryCache(): PackCache & { stored: Map<string, Uint8Array> } {
  const stored = new Map<string, Uint8Array>();
  return {
    stored,
    get: async (sha256) => stored.get(sha256) ?? null,
    put: async (sha256, bytes) => { stored.set(sha256, bytes); },
    keys: async () => [...stored.keys()],
    delete: async (sha256) => { stored.delete(sha256); },
  };
}

/** The hashes of the packs a cache holds, in order. */
const packsIn = (cache: { stored: Map<string, Uint8Array> }): string[] => [...cache.stored.keys()].filter((key) => /^[0-9a-f]{64}$/.test(key)).sort();

/** A source that answers from a table of file names, and counts how often it was asked. */
function fakeSource(files: Record<string, Uint8Array>): PackSource & { calls: number } {
  const source = {
    calls: 0,
    fetch: async (entry: PackEntry) => { source.calls += 1; return files[entry.file] ?? null; },
  };
  return source;
}
function failingSource(): PackSource & { calls: number } {
  const source = { calls: 0, fetch: async (): Promise<Uint8Array | null> => { source.calls += 1; throw new Error('no network'); } };
  return source;
}

describe('pack loader', () => {
  it('a pack with the listed hash loads from the local folder and is cached under its hash', async () => {
    const cache = memoryCache();
    const asked: string[] = [];
    const folder = localFolderSource('/art-packs', async (url) => { asked.push(url); return BYTES; });
    expect(await loadPack(ENTRY, { cache, sources: [folder] })).toEqual({ state: 'ready', text: TEXT });
    expect(asked).toEqual(['/art-packs/quadruped-v1.txt']);
    expect([...cache.stored]).toEqual([[ENTRY.sha256, BYTES]]);
  });

  it('a pack whose bytes do not match is refused, nothing is cached, and the stand-in stays', async () => {
    const cache = memoryCache();
    expect(await loadPack(ENTRY, { cache, sources: [fakeSource({ [ENTRY.file]: CHANGED })] })).toEqual({ state: 'refused', reason: 'wrong-hash' });
    expect(await loadPack(ENTRY, { cache, sources: [fakeSource({ [ENTRY.file]: BYTES.subarray(1) })] })).toEqual({ state: 'refused', reason: 'wrong-size' });
    expect(cache.stored.size).toBe(0);

    const sheetText = testInterfaceSheetText() + '# a pack\n';
    const sheet = entryOf('interface', utf8(sheetText), 'interface');
    const wrong = utf8(sheetText.replace('# a pack', '# b pack'));
    const report = await loadPacks(manifestOf(sheet), { cache, sources: [fakeSource({ [sheet.file]: wrong })], status: () => {} });
    expect(report.results).toEqual([{ entry: sheet, result: { state: 'refused', reason: 'wrong-hash' } }]);
    expect(report.standIns).toBe(1);
    expect(sheetState()).toBe('standin');
    expect(currentSheet()).toBe(placeholderSheet());
    expect(cache.stored.size).toBe(0);
  });

  it('with the pack cached and every source failing, it is ready and no source was called', async () => {
    const cache = memoryCache();
    cache.stored.set(ENTRY.sha256, BYTES);
    const sources = [failingSource(), failingSource()];
    expect(await loadPack(ENTRY, { cache, sources })).toEqual({ state: 'ready', text: TEXT });
    expect(sources.map((s) => s.calls)).toEqual([0, 0]);
  });

  it('with nothing cached and every source failing, the result is a stand-in', async () => {
    const cache = memoryCache();
    const sources = [failingSource(), failingSource()];
    expect(await loadPack(ENTRY, { cache, sources })).toEqual({ state: 'standin', reason: 'offline' });
    expect(sources.map((s) => s.calls)).toEqual([1, 1]);
    expect(cache.stored.size).toBe(0);
  });

  it('a pack no source holds is a stand-in because it is absent, not because the network failed', async () => {
    expect(await loadPack(ENTRY, { cache: memoryCache(), sources: [fakeSource({})] })).toEqual({ state: 'standin', reason: 'absent' });
    expect(await loadPack(ENTRY, { cache: memoryCache(), sources: [] })).toEqual({ state: 'standin', reason: 'absent' });
    expect(await loadPack(ENTRY, { cache: memoryCache(), sources: [fakeSource({}), failingSource()] })).toEqual({ state: 'standin', reason: 'offline' });
  });

  it('a damaged cache entry is deleted and fetched again', async () => {
    const cache = memoryCache();
    cache.stored.set(ENTRY.sha256, CHANGED);
    const source = fakeSource({ [ENTRY.file]: BYTES });
    expect(await loadPack(ENTRY, { cache, sources: [source] })).toEqual({ state: 'ready', text: TEXT });
    expect(source.calls).toBe(1);
    expect([...cache.stored]).toEqual([[ENTRY.sha256, BYTES]]);

    cache.stored.set(ENTRY.sha256, CHANGED);
    expect(await loadPack(ENTRY, { cache, sources: [failingSource()] })).toEqual({ state: 'standin', reason: 'offline' });
    expect(cache.stored.size).toBe(0);
  });

  it('entries for hashes no longer in the manifest are pruned; listed ones stay', async () => {
    const cache = memoryCache();
    const old = utf8('last release\n');
    cache.stored.set(sha256Hex(old), old);
    cache.stored.set(ENTRY.sha256, BYTES);
    await prunePackCache(cache, manifestOf(ENTRY));
    expect(packsIn(cache)).toEqual([ENTRY.sha256]);
  });

  it('a source takes any base address, a whole one too, and the loader asks each source in turn', async () => {
    const cache = memoryCache();
    const asked: string[] = [];
    const folder = localFolderSource('/art-packs/', async (url) => { asked.push(url); return null; });
    const release = localFolderSource('https://packs.example/v7', async (url) => { asked.push(url); return BYTES; });
    expect(await loadPack(ENTRY, { cache, sources: [folder, release] })).toEqual({ state: 'ready', text: TEXT });
    expect(asked).toEqual(['/art-packs/quadruped-v1.txt', 'https://packs.example/v7/quadruped-v1.txt']);
    expect(cache.stored.get(ENTRY.sha256)).toEqual(BYTES);
  });

  it('wrong bytes at one source do not stop a later source that has the right ones; the wrong ones are never cached', async () => {
    const cache = memoryCache();
    const sources = [fakeSource({ [ENTRY.file]: CHANGED }), fakeSource({ [ENTRY.file]: BYTES })];
    expect(await loadPack(ENTRY, { cache, sources })).toEqual({ state: 'ready', text: TEXT });
    expect([...cache.stored]).toEqual([[ENTRY.sha256, BYTES]]);
    expect(await loadPack(ENTRY, { cache: memoryCache(), sources: [fakeSource({ [ENTRY.file]: CHANGED }), failingSource()] }))
      .toEqual({ state: 'refused', reason: 'wrong-hash' });
  });

  it('bytes with the listed hash that are not UTF-8 text are refused as unreadable', async () => {
    const bytes = Uint8Array.of(0x70, 0xff, 0xfe, 0x0a);
    const entry = entryOf('broken', bytes);
    expect(await loadPack(entry, { cache: memoryCache(), sources: [fakeSource({ [entry.file]: bytes })] })).toEqual({ state: 'refused', reason: 'unreadable' });
  });

  it('a cache that cannot be read or written costs only the offline copy', async () => {
    const broken: PackCache = {
      get: async () => { throw new Error('storage failed'); },
      put: async () => { throw new Error('storage full'); },
      keys: async () => { throw new Error('storage failed'); },
      delete: async () => { throw new Error('storage failed'); },
    };
    expect(await loadPack(ENTRY, { cache: broken, sources: [fakeSource({ [ENTRY.file]: BYTES })] })).toEqual({ state: 'ready', text: TEXT });
    await expect(prunePackCache(broken, manifestOf())).resolves.toBeUndefined();
  });
});

describe('loading the manifest', () => {
  afterEach(() => useSheet(null));

  const sheetText = testInterfaceSheetText() + '# the interface pack\n';
  const sheet = entryOf('interface', utf8(sheetText), 'interface');
  type Status = GameEvents['pack:status'];

  it('a verified interface pack replaces the placeholder sheet, and each pack reports its state', async () => {
    const cache = memoryCache();
    const statuses: Status[] = [];
    const source = fakeSource({ [sheet.file]: utf8(sheetText), [ENTRY.file]: BYTES });
    expect(sheetState()).toBe('standin');
    const report = await loadPacks(manifestOf(sheet, ENTRY), { cache, sources: [source], status: (s) => statuses.push(s) });
    expect(sheetState()).toBe('pack');
    expect(currentSheet()).not.toBe(placeholderSheet());
    expect(currentSheet().icons.size).toBe(placeholderSheet().icons.size);
    expect(report.results).toEqual([
      { entry: sheet, result: { state: 'ready', text: sheetText } },
      { entry: ENTRY, result: { state: 'ready', text: TEXT } },
    ]);
    expect(report.standIns).toBe(0);
    expect(statuses).toEqual([
      { name: 'interface', state: 'ready', detail: null },
      { name: 'quadruped', state: 'ready', detail: null },
    ]);
  });

  it('offline with the interface pack cached it is used; offline without, the stand-ins stay, are counted, and the status says so', async () => {
    const cache = memoryCache();
    cache.stored.set(sheet.sha256, utf8(sheetText));
    const statuses: Status[] = [];
    const report = await loadPacks(manifestOf(sheet, ENTRY), { cache, sources: [failingSource()], status: (s) => statuses.push(s) });
    expect(sheetState()).toBe('pack');
    expect(report.standIns).toBe(1);
    expect(statuses).toEqual([
      { name: 'interface', state: 'ready', detail: null },
      { name: 'quadruped', state: 'standin', detail: 'offline' },
    ]);

    useSheet(null);
    statuses.length = 0;
    const none = await loadPacks(manifestOf(sheet, ENTRY), { cache: memoryCache(), sources: [failingSource()], status: (s) => statuses.push(s) });
    expect(sheetState()).toBe('standin');
    expect(currentSheet()).toBe(placeholderSheet());
    expect(none.standIns).toBe(2);
    expect(statuses).toEqual([
      { name: 'interface', state: 'standin', detail: 'offline' },
      { name: 'quadruped', state: 'standin', detail: 'offline' },
    ]);
  });

  it('an interface pack that does not parse is refused and the placeholder stays', async () => {
    const text = 'not an interface sheet\n';
    const bad = entryOf('interface', utf8(text), 'interface');
    const statuses: Status[] = [];
    const report = await loadPacks(manifestOf(bad), { cache: memoryCache(), sources: [fakeSource({ [bad.file]: utf8(text) })], status: (s) => statuses.push(s) });
    expect(report.results).toEqual([{ entry: bad, result: { state: 'refused', reason: 'unreadable' } }]);
    expect(report.standIns).toBe(1);
    expect(statuses).toEqual([{ name: 'interface', state: 'refused', detail: 'unreadable' }]);
    expect(sheetState()).toBe('standin');
    expect(currentSheet()).toBe(placeholderSheet());
  });

  it('the packs of the manifest before stay cached, so a build rolled back to has them offline; the one before that is dropped', async () => {
    const [a, b, c] = ['first\n', 'second\n', 'third\n'].map(utf8) as [Uint8Array, Uint8Array, Uint8Array];
    const [one, two, three] = [entryOf('one', a), entryOf('two', b), entryOf('three', c)];
    const online = fakeSource({ [one.file]: a, [two.file]: b, [three.file]: c });
    const cache = memoryCache();
    const load = (manifest: PackManifest, source: PackSource) => loadPacks(manifest, { cache, sources: [source], status: () => {} });
    await load(manifestOf(one), online);
    await load(manifestOf(two), online);
    expect(packsIn(cache)).toEqual([one.sha256, two.sha256].sort());
    // Rolled back with no network: the first build's pack is still here. Loading it again changes nothing.
    expect((await load(manifestOf(one), failingSource())).standIns).toBe(0);
    await load(manifestOf(one), failingSource());
    expect(packsIn(cache)).toEqual([one.sha256, two.sha256].sort());
    // Forward again, then a third build: the first is now two behind and goes.
    await load(manifestOf(two), online);
    await load(manifestOf(three), online);
    expect(packsIn(cache)).toEqual([two.sha256, three.sha256].sort());
  });

  it('a manifest that lists no pack keeps the packs of the manifest before', async () => {
    const cache = memoryCache();
    await loadPacks(manifestOf(ENTRY), { cache, sources: [fakeSource({ [ENTRY.file]: BYTES })], status: () => {} });
    await loadPacks(manifestOf(), { cache, sources: [failingSource()], status: () => {} });
    expect(packsIn(cache)).toEqual([ENTRY.sha256]);
    expect((await loadPacks(manifestOf(ENTRY), { cache, sources: [failingSource()], status: () => {} })).standIns).toBe(0);
  });

  it('a record of the manifests that cannot be read counts as none: only the listed packs stay', async () => {
    const cache = memoryCache();
    const old = utf8('last release\n');
    cache.stored.set(sha256Hex(old), old);
    cache.stored.set('manifests', utf8('{"current":7'));
    await loadPacks(manifestOf(ENTRY), { cache, sources: [fakeSource({ [ENTRY.file]: BYTES })], status: () => {} });
    expect(packsIn(cache)).toEqual([ENTRY.sha256]);
  });

  it('the cache is pruned once every pack of the manifest is ready, and left alone until then', async () => {
    const old = utf8('last release\n');
    const cache = memoryCache();
    cache.stored.set(sha256Hex(old), old);
    await loadPacks(manifestOf(ENTRY), { cache, sources: [failingSource()], status: () => {} });
    expect(packsIn(cache)).toEqual([sha256Hex(old)]);
    await loadPacks(manifestOf(ENTRY), { cache, sources: [fakeSource({ [ENTRY.file]: BYTES })], status: () => {} });
    expect(packsIn(cache)).toEqual([ENTRY.sha256]);
  });

  it('the verified text of each parts pack is handed on in the order of the manifest, without the interface pack or a pack that did not load', async () => {
    const texts = ['palette text\n', 'second pack\n', 'third pack\n', 'absent pack\n'];
    const [palette, second, third, absent] = texts.map((text, i) => entryOf(`pack${i}`, utf8(text))) as [PackEntry, PackEntry, PackEntry, PackEntry];
    const wrong = entryOf('wrong', utf8('expected bytes\n'));
    const files = { [sheet.file]: utf8(sheetText), [palette.file]: utf8(texts[0]!), [second.file]: utf8(texts[1]!), [third.file]: utf8(texts[2]!), [wrong.file]: utf8('other bytes!!!\n') };
    const report = await loadPacks(manifestOf(third, sheet, absent, palette, wrong, second), { cache: memoryCache(), sources: [fakeSource(files)], status: () => {} });
    expect(report.partsTexts).toEqual([texts[2], texts[0], texts[1]]);
    expect(report.standIns).toBe(2);
    expect((await loadPacks(manifestOf(sheet), { cache: memoryCache(), sources: [fakeSource(files)], status: () => {} })).partsTexts).toEqual([]);
  });
});
