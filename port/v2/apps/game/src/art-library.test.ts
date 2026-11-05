/** G3 of the Generated Creature Pipeline (audits/G3_ART_DELIVERY_20260926): painted archetype art delivered ON DEMAND, outside the pack.
 * OUTCOMES on the real shipped library (public/library) through the real modules: the bundled pin authenticates the manifest, the manifest
 * authenticates each file BEFORE any caller sees a byte; a tampered or missing file refuses by name; the CARD falls back to the body
 * family's core painting (labelled, uncached) and shows the creature's own painting once the library is reachable; the STAGE's asset
 * source returns only verified library bytes and a creature whose library record is missing stands in as its core family painting. */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { ART_LIBRARY_MANIFEST_PIN, ART_LIBRARY_SHARD_INDEX_PIN } from './art-library.generated.js';
import { createHash } from 'node:crypto';
import { artLibraryManifestBody, artLibraryShardBodies, manifestBytes } from '../../../tools/morph/art-library-manifest.mjs';
import { ArtLibraryRefusal, artLibraryEntryV1, artLibraryGroupOfV1, fetchArtLibraryBytesV1, loadArtLibraryManifestV1, resetArtLibraryForTestsV1 } from './art-library.js';
import { PUBLIC_ROOT, publicFetch } from './art-library.fixtures.js';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { REPO_ROOT } from './battle2/parts-rig.fixtures.js';
import { coreStandInRecord, devAssetSource, matchRecord } from './battle2-wiring.js';
import type { ResolvedAnatomyRecord } from './motion/body-card.js';
import { CARD_LIBRARY_FILES, createPaintedCardsForApp } from './painted-cards.js';

const BASE = { base: 'http://localhost/' } as const;
const WOLF_MASTER = 'library/cards/wolf/card/master-512.png';
afterEach(() => resetArtLibraryForTestsV1());
/** Serves bundled `?url` assets from disk and the site's public/ over http://localhost/ (the library), with an optional library tamper. */
const appFetch = (tamper?: Parameters<typeof publicFetch>[0]): typeof fetch => { const lib = publicFetch(tamper);
  return (async (input: RequestInfo | URL, init?: RequestInit) => { const s = String(input); if (/^https?:\/\/localhost\//.test(s)) return lib(input, init);
    let p = s.replace(/^\/@fs/, '').replace(/^file:\/\//, ''); if (!existsSync(p)) p = fileURLToPath(new URL('port/v2' + p, REPO_ROOT)); return new Response(readFileSync(p), { status: 200 }); }) as typeof fetch; };

describe('the art library trust chain', () => {
  it('the bundled pin names the shipped manifest; a listed file is returned byte-identical only after its size and digest match', async () => {
    const manifest = readFileSync(fileURLToPath(new URL(ART_LIBRARY_MANIFEST_PIN.path, PUBLIC_ROOT)));
    expect(manifest.byteLength).toBe(ART_LIBRARY_MANIFEST_PIN.bytes);
    const table = await loadArtLibraryManifestV1({ ...BASE, fetchImpl: publicFetch() });
    expect(table.size).toBe(ART_LIBRARY_MANIFEST_PIN.files); expect(table.size).toBeGreaterThan(100);
    const bytes = await fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, fetchImpl: publicFetch() });
    expect(Buffer.from(bytes).equals(readFileSync(fileURLToPath(new URL(WOLF_MASTER, PUBLIC_ROOT))))).toBe(true);
  });
  it('refuses by name: a tampered file (digest), a truncated file (size), an unlisted path, and every file when the manifest does not match its pin', async () => {
    const flip = (target: string) => publicFetch((p, b) => { if (p === '/' + target) { const c = new Uint8Array(b), i = c.length >> 1; c[i] = (c[i] ?? 0) ^ 1; return c; } return b; });
    await expect(fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, fetchImpl: flip(WOLF_MASTER) })).rejects.toMatchObject({ name: 'ArtLibraryRefusal', code: 'digest-mismatch' });
    resetArtLibraryForTestsV1();
    await expect(fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, fetchImpl: publicFetch((p, b) => (p === '/' + WOLF_MASTER ? b.slice(0, 100) : b)) })).rejects.toMatchObject({ code: 'size-mismatch' });
    await expect(fetchArtLibraryBytesV1('library/cards/nobody/card/master-512.png', { ...BASE, fetchImpl: publicFetch() })).rejects.toMatchObject({ code: 'not-in-library' });
    resetArtLibraryForTestsV1();
    // the page's chain (D56): shard index → the group's shard → the file; a tampered index or shard refuses every file it covers
    for (const pinned of [ART_LIBRARY_SHARD_INDEX_PIN.path, 'library/shards/' + artLibraryGroupOfV1(WOLF_MASTER) + '.json']) {
      resetArtLibraryForTestsV1();
      await expect(fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, fetchImpl: flip(pinned) }), pinned).rejects.toMatchObject({ code: 'manifest-mismatch' });
      expect(await artLibraryEntryV1(WOLF_MASTER, { ...BASE, fetchImpl: flip(pinned) }), pinned).toBeNull();
    }
    // the whole-manifest chain (no shard index): a manifest that does not match its pin refuses every file
    resetArtLibraryForTestsV1();
    const badManifest = flip(ART_LIBRARY_MANIFEST_PIN.path);
    await expect(fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, shardPin: null, fetchImpl: badManifest })).rejects.toMatchObject({ code: 'manifest-mismatch' });
    expect(await artLibraryEntryV1(WOLF_MASTER, { ...BASE, shardPin: null, fetchImpl: badManifest })).toBeNull();
    // control: the same file through an honest server is admitted (the refusals above are the tampering, not the harness)
    resetArtLibraryForTestsV1();
    expect((await fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, fetchImpl: publicFetch() })).byteLength).toBeGreaterThan(1000);
  });
});

describe('D56: the page reads the library through the shard index (holds only the groups it used)', () => {
  const LIB = fileURLToPath(new URL('library/', PUBLIC_ROOT));
  const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
  const spy = (inner: typeof fetch, seen: string[]): typeof fetch => (async (i: RequestInfo | URL, init?: RequestInit) => { seen.push(new URL(String(i)).pathname); return inner(i, init); }) as typeof fetch;
  it('a Wolf card file is admitted after fetching ONLY the shard index and the Wolf shard (never the whole manifest); the explicit whole-manifest path still admits it', async () => {
    const seen: string[] = [];
    const bytes = await fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, fetchImpl: spy(publicFetch(), seen) });
    expect(Buffer.from(bytes).equals(readFileSync(fileURLToPath(new URL(WOLF_MASTER, PUBLIC_ROOT))))).toBe(true);
    expect(seen).toEqual(['/' + ART_LIBRARY_SHARD_INDEX_PIN.path, '/library/shards/' + artLibraryGroupOfV1(WOLF_MASTER) + '.json', '/' + WOLF_MASTER]);
    // FINISH F4: the page keeps the index, not the bucket — a second file of the same bucket reads the bucket again (no retained table)
    const again: string[] = []; await fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, fetchImpl: spy(publicFetch(), again) });
    expect(again).toEqual(['/library/shards/' + artLibraryGroupOfV1(WOLF_MASTER) + '.json', '/' + WOLF_MASTER]);
    // two lookups in flight together share ONE bucket read
    resetArtLibraryForTestsV1(); const both: string[] = [], fx = spy(publicFetch(), both);
    await Promise.all([artLibraryEntryV1(WOLF_MASTER, { ...BASE, fetchImpl: fx }), artLibraryEntryV1(WOLF_MASTER.replace('master-512', 'labels-512'), { ...BASE, fetchImpl: fx })]);
    expect(both.filter((p) => p.startsWith('/library/shards/'))).toHaveLength(1);
    // control: without a shard index the same file is admitted through the whole manifest (which is what the page no longer holds)
    resetArtLibraryForTestsV1(); const whole: string[] = [];
    await fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, shardPin: null, fetchImpl: spy(publicFetch(), whole) });
    expect(whole).toEqual(['/' + ART_LIBRARY_MANIFEST_PIN.path, '/' + WOLF_MASTER]);
  });
  it('the shards on disk are exactly the regenerated ones: every content file in exactly one shard of its own group, the index pins each shard, and the tool groups like the page', () => {
    const regenerated = artLibraryShardBodies(LIB), index = JSON.parse(readFileSync(LIB + 'art-library-shards.json', 'utf8')) as { shards: { group: string; path: string; bytes: number; sha256: string }[] };
    expect(sha(readFileSync(LIB + 'art-library-shards.json'))).toBe(ART_LIBRARY_SHARD_INDEX_PIN.sha256); expect(index.shards).toHaveLength(ART_LIBRARY_SHARD_INDEX_PIN.groups);
    expect(index.shards.map((s) => s.group)).toEqual(regenerated.map((r) => r.group));
    for (const [i, r] of regenerated.entries()) { const onDisk = readFileSync(LIB + r.file); expect(Buffer.from(manifestBytes(r.body)).equals(onDisk), r.file).toBe(true);
      expect(index.shards[i]).toEqual({ group: r.group, path: 'library/' + r.file, bytes: onDisk.length, sha256: sha(onDisk) });
      for (const f of r.body.files) expect(artLibraryGroupOfV1(f.path), f.path).toBe(r.group); }
    const content = artLibraryManifestBody(LIB).files.filter((f) => !f.path.startsWith('library/shards/') && f.path !== 'library/art-library-shards.json');
    const byPath = (x: { path: string }, y: { path: string }) => (x.path < y.path ? -1 : x.path > y.path ? 1 : 0);
    expect(regenerated.flatMap((r) => r.body.files).sort(byPath)).toEqual([...content].sort(byPath)); // the union is every content file, exactly once
    expect(content.length).toBeGreaterThan(1000);
  }, 120_000); /* it re-hashes every library file (~690 MiB at D60, growing with each delivery); the assertion is unchanged */
  it('refuses a shard that vouches for another bucket\'s file, and an index entry that is not a bucket (negative controls of the bucket rule)', async () => {
    const wolfShard = JSON.parse(readFileSync(LIB + 'shards/' + artLibraryGroupOfV1(WOLF_MASTER) + '.json', 'utf8')) as { schema: string; group: string; files: { path: string; bytes: number; sha256: string }[] };
    const serve = (index: unknown, shard: unknown) => { const ib = new TextEncoder().encode(JSON.stringify(index)), sb = new TextEncoder().encode(JSON.stringify(shard));
      const pins = { index: { path: 'library/test-index.json', bytes: ib.length, sha256: sha(ib) } };
      const disk = publicFetch(), fetchImpl = (async (i: RequestInfo | URL, init?: RequestInit) => { const p = new URL(String(i)).pathname;
        return p === '/library/test-index.json' ? new Response(ib) : p === '/library/test-shard.json' ? new Response(sb) : disk(i, init); }) as typeof fetch;
      return { pins, fetchImpl, shardPin: { group: artLibraryGroupOfV1(WOLF_MASTER), path: 'library/test-shard.json', bytes: sb.length, sha256: sha(sb) } }; };
    const indexOf = (group: string, pin: { path: string; bytes: number; sha256: string }) => ({ schema: 'cf-art-library-shards/v1', shards: [{ ...pin, group }] });
    // honest control: a hand-built index + shard for the Wolf group admits the Wolf master
    let t = serve(null, wolfShard); t = serve(indexOf(artLibraryGroupOfV1(WOLF_MASTER), t.shardPin), wolfShard);
    expect((await fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, shardPin: t.pins.index, fetchImpl: t.fetchImpl })).byteLength).toBeGreaterThan(1000);
    // a Wolf shard that also lists a Tiger file is refused (a shard can only vouch for its own group)
    resetArtLibraryForTestsV1();
    const other = ['tiger', 'lion', 'zebra', 'yak', 'bass'].map((k) => `library/cards/${k}/card/master-512.png`).find((p) => artLibraryGroupOfV1(p) !== artLibraryGroupOfV1(WOLF_MASTER))!;
    const smuggled = { ...wolfShard, files: [...wolfShard.files, { path: other, bytes: 10, sha256: 'a'.repeat(64) }] };
    let u = serve(null, smuggled); u = serve(indexOf(artLibraryGroupOfV1(WOLF_MASTER), u.shardPin), smuggled);
    await expect(fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, shardPin: u.pins.index, fetchImpl: u.fetchImpl })).rejects.toMatchObject({ code: 'manifest-invalid' });
    // an index entry that is not a bucket id (a path, a bad spelling, or a bucket beyond the 64) is refused
    for (const bad of ['library/cards/wolf', 'bucket-zz', 'bucket-40', 'bucket-2']) {
      resetArtLibraryForTestsV1();
      let v = serve(null, wolfShard); v = serve(indexOf(bad, v.shardPin), wolfShard);
      await expect(fetchArtLibraryBytesV1(WOLF_MASTER, { ...BASE, shardPin: v.pins.index, fetchImpl: v.fetchImpl }), bad).rejects.toMatchObject({ code: 'manifest-invalid' });
    }
  });
});

describe('CARD = STAGE on the library', () => {
  const wolf = { _earthName: 'Wolf', kingdom: 'fauna', seed: 5 } as const;
  it('the Wolf card is the Wolf painting from the library; offline it is drawn by its family core painting (Civet), labelled and NOT cached, and the Wolf returns when the library is back', async () => {
    expect([...CARD_LIBRARY_FILES.keys()].some((d) => d.endsWith('/wolf/'))).toBe(true);
    let offline = true;
    const src = createPaintedCardsForApp(appFetch((p, b) => (offline && p.startsWith('/library/cards/wolf/') ? null : b)));
    const fallback = await src.card(wolf, 'thumb')!;
    expect(fallback.libraryFallback).toMatchObject({ wanted: 'Wolf', drawnBy: 'Civet' }); expect(fallback.libraryFallback!.reason).toMatch(/art library http/);
    offline = false;
    const own = await src.card(wolf, 'thumb')!;
    expect(own.libraryFallback).toBeUndefined(); expect(own.url).not.toBe(fallback.url); // the fallback was never cached
    expect(await src.card(wolf, 'thumb')!).toBe(own); // the creature's own painting IS cached
  });
  it('a tampered library master never reaches the decoder: the card refuses it by name and draws the family painting instead', async () => {
    const src = createPaintedCardsForApp(appFetch((p, b) => { if (p === '/' + WOLF_MASTER) { const c = new Uint8Array(b); c[40] = (c[40] ?? 0) ^ 0xff; return c; } return b; }));
    const card = await src.card(wolf, 'portrait')!;
    expect(card.libraryFallback?.reason).toMatch(/digest-mismatch/); expect(card.libraryFallback?.drawnBy).toBe('Civet');
  });
  it('the stage asset source returns library files only through the pin; a tampered library file rejects with its refusal; a core file is a plain fetch', async () => {
    const wolfFit = BATTLE2_PARTS_FITS.find((f) => f.earthName === 'Wolf')!; expect(wolfFit.library).toBe(true);
    const recipe = '/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json';
    const ok = devAssetSource(recipe, 'http://localhost/', { fetchImpl: publicFetch() });
    const record = await ok.json(wolfFit.dir + 'record.json') as { identity: { earthName: string } }; expect(record.identity.earthName).toBe('Wolf');
    resetArtLibraryForTestsV1();
    const bad = devAssetSource(recipe, 'http://localhost/', { fetchImpl: publicFetch((p, b) => (p.endsWith('/fit-03/record.json') && p.includes('11-wolf') ? new Uint8Array([...b.slice(0, -1), 32]) : b)) });
    await expect(bad.json(wolfFit.dir + 'record.json')).rejects.toBeInstanceOf(ArtLibraryRefusal);
    expect(BATTLE2_PARTS_FITS.find((f) => f.earthName === 'Civet')!.library).toBeUndefined(); // the core family paintings stay in the pack
  });
  it('the stage stand-in: with the Wolf record unavailable, a Wolf fights as its family CORE painting (Civet) — never the unreachable library one, never the portrait', () => {
    const read = (name: string) => JSON.parse(readFileSync(new URL('audits/' + BATTLE2_PARTS_FITS.find((f) => f.earthName === name)!.dir.slice(3) + 'record.json', REPO_ROOT), 'utf8')) as ResolvedAnatomyRecord;
    const civet = read('Civet'), wolfRecord = read('Wolf'), wolfGenome = { _earthName: 'Wolf', kingdom: 'fauna', seed: 5 };
    expect(matchRecord([civet, wolfRecord], wolfGenome)?.identity.earthName).toBe('Wolf');
    expect(matchRecord([civet], wolfGenome)?.identity.earthName).toBe('Civet'); // the library record did not load
    expect(coreStandInRecord([civet, wolfRecord], wolfGenome)?.identity.earthName).toBe('Civet'); // the library painting failed to fetch
    // control: a procedural quadruped whose stand-in is a LIBRARY painting (none today) would still resolve to a loaded core one
    expect(coreStandInRecord([wolfRecord], wolfGenome)).toBeNull(); // no core record loaded → no silent substitute
  });
});
