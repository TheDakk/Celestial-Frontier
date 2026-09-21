import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { decodePng } from './morph/png-decode.js';
import { CARD_ASSET_URLS, cardAssetUrl, createPaintedCardsForApp } from './painted-cards.js';
/** Under vitest a `?url` import resolves to a path on disk; a production build resolves it to the shipped asset URL. */
const fetchFromDisk: typeof fetch = async (input) => { const p = String(input).replace(/^\/@fs/, '').replace(/^file:\/\//, ''); const bytes = readFileSync(p); return new Response(bytes, { status: 200 }); };
describe('the card masters ship with the app', () => {
  it('every archetype has its four shipped files (receipt, record, master, labels) and no other archetype is registered', () => {
    for (const a of CARD_ARCHETYPES) { expect(CARD_ASSET_URLS.has(a.dir)).toBe(true); for (const f of ['card/card.json', 'record.json', 'card/master-512.png', 'card/labels-512.png']) expect(cardAssetUrl(a.dir + f)).toMatch(/master-512|labels-512|card\.json|record\.json/); }
    expect(CARD_ASSET_URLS.size).toBe(CARD_ARCHETYPES.length); expect(() => cardAssetUrl('audits/nowhere/record.json')).toThrow(/no shipped asset/);
  });
  it('the app source renders a crab thumb from the shipped assets (fetch served from disk here; the same URLs in production)', async () => {
    const src = createPaintedCardsForApp(fetchFromDisk);
    const asset = await src.card({ _earthName: 'Crab', kingdom: 'fauna', seed: 5, color: 1, accent: 4 }, 'thumb')!;
    const png = await decodePng(new Uint8Array(Buffer.from(asset.url.slice('data:image/png;base64,'.length), 'base64'))); expect([png.width, png.height]).toEqual([132, 132]);
    expect(src.card({ kingdom: 'fauna', seed: 1 }, 'thumb')).toBeNull();
  });
});
