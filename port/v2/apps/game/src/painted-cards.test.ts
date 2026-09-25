import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { decodePng } from './morph/png-decode.js';
import { CARD_ASSET_URLS, cardAssetUrl, createPaintedCardsForApp } from './painted-cards.js';
import { REPO_ROOT } from './battle2/parts-rig.fixtures.js';
import { CARD_ARCHETYPES as BUILD_LIST } from '../../../tools/morph/build-card-masters.mjs';
/** Under vitest a `?url` import resolves to a path on disk; a production build resolves it to the shipped asset URL. */
const fetchFromDisk: typeof fetch = async (input) => { let p = String(input).replace(/^\/@fs/, '').replace(/^file:\/\//, ''); if (!existsSync(p)) p = fileURLToPath(new URL('port/v2' + p, REPO_ROOT)); /* vitest serves app assets at their vite-root (port/v2) path */ const bytes = readFileSync(p); return new Response(bytes, { status: 200 }); };
describe('the card masters ship with the app', () => {
  it('every archetype has its four shipped files (receipt, record, master, labels) and no other archetype is registered', () => {
    for (const a of CARD_ARCHETYPES) { expect(CARD_ASSET_URLS.has(a.dir)).toBe(true); for (const f of ['card/card.json', 'record.json', 'card/master-512.png', 'card/labels-512.png']) expect(cardAssetUrl(a.dir + f)).toMatch(/master-512|labels-512|card\.json|record\.json/); expect(a.dir.startsWith('port/v2/apps/game/assets/painted-cards/')).toBe(true); }
    expect(CARD_ASSET_URLS.size).toBe(CARD_ARCHETYPES.length); expect(() => cardAssetUrl('audits/nowhere/record.json')).toThrow(/no shipped asset/);
  });
  it('the app source renders a crab thumb from the shipped assets (fetch served from disk here; the same URLs in production)', async () => {
    const src = createPaintedCardsForApp(fetchFromDisk);
    const asset = await src.card({ _earthName: 'Crab', kingdom: 'fauna', seed: 5, color: 1, accent: 4 }, 'thumb')!;
    const png = await decodePng(new Uint8Array(Buffer.from(asset.url.slice('data:image/png;base64,'.length), 'base64'))); expect([png.width, png.height]).toEqual([132, 132]);
    expect(src.card({ kingdom: 'fauna', seed: 1 }, 'thumb')).toBeNull();
  });
  it('OUTCOME: the painted marking reaches the APP card — through the shipped asset path, a striped individual differs from the plain one for every archetype that ships masks (found 2026-09-23: the asset map had no markings entries, the fetch threw, was swallowed, and every in-app card rendered plain while the disk-fed sheets showed the masks)', async () => {
    // the archetypes that SHOULD ship masks come from the source of truth (the builder list and each fit's markings), not from the shipped dirs
    const shouldShip = BUILD_LIST.filter((b) => existsSync(fileURLToPath(new URL((b.markings ?? b.dir) + 'markings.json', REPO_ROOT)))).map((b) => b.earthName).sort();
    const src = createPaintedCardsForApp(fetchFromDisk), shipsMasks = CARD_ARCHETYPES.filter((a) => shouldShip.includes(a.earthName));
    expect(shouldShip).toEqual(['Civet', 'Crab', 'Salmon']); expect(shipsMasks.map((a) => a.earthName).sort()).toEqual(shouldShip);
    for (const a of shipsMasks) {
      const plain = await src.card({ _earthName: a.earthName, kingdom: 'fauna', seed: 9, pattern: 0 }, 'thumb')!, striped = await src.card({ _earthName: a.earthName, kingdom: 'fauna', seed: 9, pattern: 1 }, 'thumb')!;
      expect(striped.url, a.earthName + ': striped equals plain — the marking never reached the app card').not.toBe(plain.url);
    }
  });
});
