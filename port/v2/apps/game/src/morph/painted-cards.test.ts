import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../battle2/parts-rig.fixtures.js';
import { SpeciesArtLoader } from '../species-art-loader.js';
import { CARD_ARCHETYPES } from './card-archetypes.js';
import { PaintedCardSource, type PaintedCardAssets } from './painted-card-source.js';
const assets: PaintedCardAssets = { json: async (p) => JSON.parse(readFileSync(new URL(p, REPO_ROOT), 'utf8')), bytes: async (p) => new Uint8Array(readFileSync(new URL(p, REPO_ROOT))) };
describe('the painted card in the species-art loader', () => {
  it('the TS registry equals the build tool\'s list, and every archetype has its sealed card master + receipt on disk', () => {
    const tool = readFileSync(new URL('port/v2/tools/morph/build-card-masters.mjs', REPO_ROOT), 'utf8');
    for (const a of CARD_ARCHETYPES) { expect(tool).toContain(`{ earthName: '${a.earthName}', dir: '${a.dir}' }`); const r = JSON.parse(readFileSync(new URL(a.dir + 'card/card.json', REPO_ROOT), 'utf8')) as { earthName: string; card: { width: number } }; expect(r.earthName).toBe(a.earthName); expect(r.card.width).toBeLessThanOrEqual(512); }
    expect((tool.match(/earthName: '/g) ?? []).length).toBe(CARD_ARCHETYPES.length);
  });
  it('a crab genome\'s thumb and portrait come from the painted source (the painter producer is never asked); a procedural genome goes to the broker', async () => {
    const painted = new PaintedCardSource({ assets, registry: CARD_ARCHETYPES }); let producerRenders = 0;
    const loader = new SpeciesArtLoader('doc-test', { paintedCards: painted, createProducer: () => ({ render: () => { producerRenders++; }, dispose: () => {} }), scheduleTask: (t) => t(), getDeviceClass: () => 'phone', subscribeDeviceClassChange: () => () => {}, createThumbObjectUrl: (u) => u, revokeThumbObjectUrl: () => {} });
    const crab = { _earthName: 'Crab', kingdom: 'fauna', seed: 5, color: 12, accent: 3, size: 0, head: 0, tail: 1, pattern: 0 };
    const lease = loader.leaseThumb(crab); expect(lease.current).toBeNull();
    const asset = await new Promise<unknown>((resolve, reject) => { lease.subscribe((a, e) => (e ? reject(e) : resolve(a))); });
    expect(asset).toMatchObject({ width: 132, height: 132 }); expect((asset as { url: string }).url.startsWith('data:image/png;base64,')).toBe(true); expect(lease.current).toBe(asset);
    const portrait = await new Promise<unknown>((resolve, reject) => { const r = loader.requestPortrait('codex-detail', crab, (a, e) => (e ? reject(e) : resolve(a))); expect(r.current).toBeNull(); });
    expect(portrait).toMatchObject({ width: 440, height: 440 });
    expect(loader.paintedCardCounts()).toEqual({ thumbs: 1, portraits: 1 }); expect(painted.renders).toBe(2); expect(producerRenders).toBe(0);
    const proc = loader.leaseThumb({ kingdom: 'fauna', seed: 42, color: 1 }); expect(proc.key).toBeDefined(); expect(loader.paintedCardCounts().thumbs).toBe(1); // the broker took it (phone device class: the producer may or may not be pumped here; the count is what matters)
    lease.release(); proc.release(); loader.dispose('test');
  });
});
