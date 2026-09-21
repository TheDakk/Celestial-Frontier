import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../battle2/parts-rig.fixtures.js';
import { CARD_SIZES, PaintedCardSource, type PaintedCardAssets } from './painted-card-source.js';
import { decodePng } from './png-decode.js';
const assets: PaintedCardAssets = { json: async (p) => JSON.parse(readFileSync(new URL(p, REPO_ROOT), 'utf8')), bytes: async (p) => new Uint8Array(readFileSync(new URL(p, REPO_ROOT))) };
const REGISTRY = [{ earthName: 'Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/' }, { earthName: 'Civet', dir: 'audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/' }];
const crabGenome = (over: Record<string, unknown> = {}) => ({ _earthName: 'Crab', kingdom: 'fauna', seed: 5, color: 12, accent: 3, size: 0, head: 0, tail: 1, pattern: 0, ...over });
describe('painted card source — the individual on the card', () => {
  it('a procedural genome or an Earth species without an archetype → null (the painter tier answers)', () => {
    const s = new PaintedCardSource({ assets, registry: REGISTRY });
    expect(s.card({ kingdom: 'fauna', seed: 9, color: 1 }, 'thumb')).toBeNull(); expect(s.card({ _earthName: 'Brown Bear', seed: 1 }, 'portrait')).toBeNull(); expect(s.renders).toBe(0);
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
  it('the Civet archetype (labels derived from its binding) renders too; the cache cap evicts the oldest', async () => {
    const s = new PaintedCardSource({ assets, registry: REGISTRY, cacheEntries: { thumb: 2, portrait: 1 } });
    const civet = { _earthName: 'Civet', kingdom: 'fauna', seed: 3, color: 14, accent: 3, head: 5, tail: 1 };
    const c = await s.card(civet, 'thumb')!; expect(c.width).toBe(132);
    await s.card(crabGenome(), 'thumb'); await s.card(crabGenome({ color: 2 }), 'thumb');
    const again = await s.card(civet, 'thumb')!; expect(again).not.toBe(c); expect(again.url).toBe(c.url); // evicted, re-rendered, identical bytes (determinism)
  });
});
