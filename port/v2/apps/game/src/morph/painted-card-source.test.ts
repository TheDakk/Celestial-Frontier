import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../battle2/parts-rig.fixtures.js';
import { ARCHETYPE_RESIDENT_DEFAULT, CARD_SIZES, PaintedCardSource, type PaintedCardAssets } from './painted-card-source.js';
import { CARD_ARCHETYPES } from './card-archetypes.js';
import { decodePng } from './png-decode.js';
const assets: PaintedCardAssets = { json: async (p) => JSON.parse(readFileSync(new URL(p, REPO_ROOT), 'utf8')), bytes: async (p) => new Uint8Array(readFileSync(new URL(p, REPO_ROOT))) };
const REGISTRY = [{ earthName: 'Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/' }, { earthName: 'Civet', dir: 'audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/' }];
const crabGenome = (over: Record<string, unknown> = {}) => ({ _earthName: 'Crab', kingdom: 'fauna', seed: 5, color: 12, accent: 3, size: 0, head: 0, tail: 1, pattern: 0, ...over });
describe('painted card source — the individual on the card', () => {
  it('OWNERSHIP (I5 v2 diagnosis 2026-09-25): a painted card\'s leases, cache, pending renders and resident archetypes are reported truthfully; release and releaseUnowned trim exactly the unleased cards', async () => {
    const s = new PaintedCardSource({ assets, registry: REGISTRY, yieldToHost: () => Promise.resolve() }), g = crabGenome(), key = (await import('@cf/art/species-identity')).speciesVisualKey(g as Record<string, unknown>);
    const closeThumb = s.openLease('thumb', key), p = s.card(g, 'thumb')!;
    expect(s.ownership().keys.pendingThumbs).toEqual([key]); expect(s.ownership().keys.leasedThumbs).toEqual([key]);
    await p; const o = s.ownership();
    expect(o.schema).toBe('cf-v2-painted-card-ownership/v1'); expect(o.leases).toBe(1); expect(o.keys.cachedThumbs).toEqual([key]); expect(o.keys.pendingThumbs).toEqual([]);
    expect(o.cacheEntries).toBe(1); expect(o.decodedPixels).toBe(132 * 132); expect(o.encodedBytes).toBeGreaterThan(0); expect(o.residentArchetypes.names).toEqual(['Crab']);
    expect(s.releaseUnowned()).toBe(0); expect(s.ownership().keys.cachedThumbs).toEqual([key]); // leased → kept
    closeThumb(); closeThumb(); // idempotent
    expect(s.ownership().leases).toBe(0); expect(s.releaseUnowned()).toBe(1); expect(s.ownership().keys.cachedThumbs).toEqual([]); expect(s.ownership().totals.releasedUnowned).toBe(1);
  });
  it('MEMORY (I5 review 2026-09-24): at most ARCHETYPE_RESIDENT_DEFAULT decoded archetypes stay resident while cards of all of them render; eviction never changes a card; control: an unbounded source keeps them all', async () => {
    const one = (name: string) => ({ _earthName: name, kingdom: 'fauna', seed: 11, color: 4, accent: 9, size: 2, head: 3, tail: 2, pattern: 0 });
    const names = [...new Set(CARD_ARCHETYPES.map((a) => a.earthName))], now = () => Promise.resolve();
    const bounded = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES, yieldToHost: now }), open = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES, yieldToHost: now, archetypeEntries: 100 });
    let peak = 0; for (const n of names) { await bounded.card(one(n), 'thumb'); await open.card(one(n), 'thumb'); peak = Math.max(peak, bounded.residentArchetypes().count); }
    expect(peak).toBeLessThanOrEqual(ARCHETYPE_RESIDENT_DEFAULT); expect(bounded.residentArchetypes().bytes).toBeLessThanOrEqual(ARCHETYPE_RESIDENT_DEFAULT * 512 * 512 * 4 * 2);
    expect(open.residentArchetypes().count).toBe(names.length); expect(open.residentArchetypes().bytes).toBeGreaterThan(20 * 1024 * 1024); // what the bound prevents
    // an evicted archetype re-reads to the same card, byte for byte
    const again = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES, yieldToHost: now, archetypeEntries: 1 });
    const first = await again.card(one('Crab'), 'thumb')!; await again.card(one('Civet'), 'thumb'); const civetGone = again.residentArchetypes().count; 
    const fresh = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES, yieldToHost: now, archetypeEntries: 1 }); await fresh.card(one('Civet'), 'thumb'); const crab2 = await fresh.card(one('Crab'), 'thumb')!;
    expect(civetGone).toBe(1); expect(crab2.url).toBe(first.url);
  }, 600_000);
  it('a creature whose anatomy no painting draws → null (the painter tier answers); an Earth species of a painted body plan takes its stand-in (Nick 2026-09-24), and standIns:false restores painted-species-only', () => {
    const s = new PaintedCardSource({ assets, registry: REGISTRY });
    expect(s.card({ kingdom: 'fauna', seed: 9, color: 1 }, 'thumb')).toBeNull(); // body 0, limbs gene 0 → a two-legged land body: no painting
    expect(s.standInFor({ _earthName: 'Brown Bear', seed: 1 })).toEqual({ earthName: 'Civet', kind: 'earth-stand-in', family: 'quadruped' });
    const off = new PaintedCardSource({ assets, registry: REGISTRY, standIns: false });
    expect(off.card({ _earthName: 'Brown Bear', seed: 1 }, 'portrait')).toBeNull(); expect(off.standInFor({ _earthName: 'Crab', seed: 1 })?.kind).toBe('painted');
    expect(s.renders).toBe(0);
  });
  it('a crab genome renders a 132 thumb and a 440 portrait as PNG data URLs (decodable, right size, alpha present); two genomes differing in colour give different bytes; the same genome is served from cache (one render)', async () => {
    const s = new PaintedCardSource({ assets, registry: REGISTRY });
    const t = await s.card(crabGenome(), 'thumb')!, p = await s.card(crabGenome(), 'portrait')!;
    expect(t.width).toBe(CARD_SIZES.thumb); expect(p.width).toBe(CARD_SIZES.portrait); expect(t.url.startsWith('data:image/png;base64,')).toBe(true);
    const back = await decodePng(new Uint8Array(Buffer.from(t.url.slice('data:image/png;base64,'.length), 'base64'))); expect([back.width, back.height]).toEqual([132, 132]);
    let opaque = 0, clear = 0; for (let i = 3; i < back.rgba.length; i += 4) if (back.rgba[i]! > 200) opaque++; else if (back.rgba[i] === 0) clear++; expect(opaque).toBeGreaterThan(2000); expect(clear).toBeGreaterThan(2000);
    expect(t.encodedBytes).toBe(Buffer.from(t.url.slice('data:image/png;base64,'.length), 'base64').length);
    const t2 = await s.card(crabGenome({ color: 1 }), 'thumb')!; expect(t2.url).not.toBe(t.url); expect(t2.key).not.toBe(t.key);
    expect(await s.card(crabGenome(), 'thumb')!).toBe(t); expect(s.renders).toBe(3);
    const [a, b] = await Promise.all([s.card(crabGenome({ seed: 99 }), 'thumb')!, s.card(crabGenome({ seed: 99 }), 'thumb')!]); expect(a).toBe(b); expect(s.renders).toBe(4); // in-flight dedupe
  });
  it('M3/M4 on the card: a striped crab differs from the plain one; an eye-spotted lumin crab (emissive) differs again; iridescent (no painted mask) glows on the accent set only', async () => {
    const s = new PaintedCardSource({ assets, registry: REGISTRY });
    const plain = await s.card(crabGenome({ pattern: 0 }), 'thumb')!, striped = await s.card(crabGenome({ pattern: 1 }), 'thumb')!, eye = await s.card(crabGenome({ pattern: 7, lumin: true }), 'thumb')!, irid = await s.card(crabGenome({ pattern: 5 }), 'thumb')!;
    expect(striped.url).not.toBe(plain.url); expect(eye.url).not.toBe(striped.url); expect(irid.url).not.toBe(plain.url);
    const dec = async (u: string) => (await decodePng(new Uint8Array(Buffer.from(u.slice('data:image/png;base64,'.length), 'base64')))).rgba;
    const a = await dec(plain.url), b = await dec(irid.url); let diff = 0, alphaDiff = 0; for (let i = 0; i < a.length; i += 4) { if (a[i + 3] !== b[i + 3]) alphaDiff++; if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) diff++; } expect(alphaDiff).toBe(0); expect(diff).toBeGreaterThan(50); expect(diff).toBeLessThan(a.length / 4 / 3); // the glow sits on the accent set (claws/eyes), not the whole crab
  });
  it('the Civet archetype (labels derived from its binding) renders too; the cache cap evicts the oldest', async () => {
    const s = new PaintedCardSource({ assets, registry: REGISTRY, cacheEntries: { thumb: 2, portrait: 1 } });
    const civet = { _earthName: 'Civet', kingdom: 'fauna', seed: 3, color: 14, accent: 3, head: 5, tail: 1 };
    const c = await s.card(civet, 'thumb')!; expect(c.width).toBe(132);
    await s.card(crabGenome(), 'thumb'); await s.card(crabGenome({ color: 2 }), 'thumb');
    const again = await s.card(civet, 'thumb')!; expect(again).not.toBe(c); expect(again.url).toBe(c.url); // evicted, re-rendered, identical bytes (determinism)
  });
  it('renders ONE card per host task: five simultaneous requests yield before each render, so a grid never freezes the page (review 2026-09-24: all renders ran in one task)', async () => {
    const seen: number[] = []; let src!: PaintedCardSource;
    src = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES, cacheEntries: { thumb: 64, portrait: 8 }, yieldToHost: async () => { seen.push(src.renders); } });
    const names = ['Crab', 'Civet', 'Salmon', 'Python', 'Eagle'], out = await Promise.all(names.map((n, i) => src.card({ _earthName: n, kingdom: 'fauna', seed: 40 + i, color: i + 2 }, 'thumb')!));
    expect(out.every((a) => a.width === 132)).toBe(true); expect(src.renders).toBe(5);
    expect(seen).toEqual([0, 1, 2, 3, 4]); // at every yield exactly the earlier renders have finished — strictly one render per task
  });
});
