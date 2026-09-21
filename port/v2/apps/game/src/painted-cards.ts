// App wiring for the painted individual on the card (morph system; Nick 2026-09-22 option 3: every device). The six
// archetypes' sealed card masters, labels, receipts and records are SHIPPED as app assets (`?url` imports from `assets/painted-cards/`, inside the v2 subtree the preview
// snapshot archives — a production build carries them; nothing here depends on the dev-only proof-asset fetch), so the painted card works wherever the
// app runs. The species-art loader asks this source first; the painter tier answers for every other species.
import a0_cardJson from '../assets/painted-cards/crab/card/card.json?url';
import a0_record from '../assets/painted-cards/crab/record.json?url';
import a0_master from '../assets/painted-cards/crab/card/master-512.png?url';
import a0_labels from '../assets/painted-cards/crab/card/labels-512.png?url';
import a1_cardJson from '../assets/painted-cards/coconut-crab/card/card.json?url';
import a1_record from '../assets/painted-cards/coconut-crab/record.json?url';
import a1_master from '../assets/painted-cards/coconut-crab/card/master-512.png?url';
import a1_labels from '../assets/painted-cards/coconut-crab/card/labels-512.png?url';
import a2_cardJson from '../assets/painted-cards/freshwater-crab/card/card.json?url';
import a2_record from '../assets/painted-cards/freshwater-crab/record.json?url';
import a2_master from '../assets/painted-cards/freshwater-crab/card/master-512.png?url';
import a2_labels from '../assets/painted-cards/freshwater-crab/card/labels-512.png?url';
import a3_cardJson from '../assets/painted-cards/mud-crab/card/card.json?url';
import a3_record from '../assets/painted-cards/mud-crab/record.json?url';
import a3_master from '../assets/painted-cards/mud-crab/card/master-512.png?url';
import a3_labels from '../assets/painted-cards/mud-crab/card/labels-512.png?url';
import a4_cardJson from '../assets/painted-cards/vent-crab/card/card.json?url';
import a4_record from '../assets/painted-cards/vent-crab/record.json?url';
import a4_master from '../assets/painted-cards/vent-crab/card/master-512.png?url';
import a4_labels from '../assets/painted-cards/vent-crab/card/labels-512.png?url';
import a5_cardJson from '../assets/painted-cards/civet-sentinel-input-01/card/card.json?url';
import a5_record from '../assets/painted-cards/civet-sentinel-input-01/record.json?url';
import a5_master from '../assets/painted-cards/civet-sentinel-input-01/card/master-512.png?url';
import a5_labels from '../assets/painted-cards/civet-sentinel-input-01/card/labels-512.png?url';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { PaintedCardSource, type PaintedCardAssets } from './morph/painted-card-source.js';
/** Repo-relative fit dir → its shipped asset URLs by file. Keys are the paths `PaintedCardSource` asks for. */
export const CARD_ASSET_URLS: ReadonlyMap<string, Readonly<Record<string, string>>> = new Map([
  ['port/v2/apps/game/assets/painted-cards/crab/', { 'card/card.json': a0_cardJson, 'record.json': a0_record, 'card/master-512.png': a0_master, 'card/labels-512.png': a0_labels }],
  ['port/v2/apps/game/assets/painted-cards/coconut-crab/', { 'card/card.json': a1_cardJson, 'record.json': a1_record, 'card/master-512.png': a1_master, 'card/labels-512.png': a1_labels }],
  ['port/v2/apps/game/assets/painted-cards/freshwater-crab/', { 'card/card.json': a2_cardJson, 'record.json': a2_record, 'card/master-512.png': a2_master, 'card/labels-512.png': a2_labels }],
  ['port/v2/apps/game/assets/painted-cards/mud-crab/', { 'card/card.json': a3_cardJson, 'record.json': a3_record, 'card/master-512.png': a3_master, 'card/labels-512.png': a3_labels }],
  ['port/v2/apps/game/assets/painted-cards/vent-crab/', { 'card/card.json': a4_cardJson, 'record.json': a4_record, 'card/master-512.png': a4_master, 'card/labels-512.png': a4_labels }],
  ['port/v2/apps/game/assets/painted-cards/civet-sentinel-input-01/', { 'card/card.json': a5_cardJson, 'record.json': a5_record, 'card/master-512.png': a5_master, 'card/labels-512.png': a5_labels }],
]);
export function cardAssetUrl(repoRelative: string): string {
  for (const [dir, files] of CARD_ASSET_URLS) if (repoRelative.startsWith(dir)) { const u = files[repoRelative.slice(dir.length)]; if (u) return u; }
  throw new Error('painted cards: no shipped asset for ' + repoRelative);
}
export const shippedCardAssets = (fetchImpl: typeof fetch = fetch): PaintedCardAssets => ({
  json: async (p) => { const r = await fetchImpl(cardAssetUrl(p)); if (!r.ok) throw new Error(`painted card asset ${p}: HTTP ${r.status}`); return r.json(); },
  bytes: async (p) => { const r = await fetchImpl(cardAssetUrl(p)); if (!r.ok) throw new Error(`painted card asset ${p}: HTTP ${r.status}`); return new Uint8Array(await r.arrayBuffer()); },
});
export function createPaintedCardsForApp(fetchImpl: typeof fetch = fetch): PaintedCardSource {
  for (const a of CARD_ARCHETYPES) if (!CARD_ASSET_URLS.has(a.dir)) throw new Error('painted cards: archetype without shipped assets: ' + a.earthName);
  return new PaintedCardSource({ assets: shippedCardAssets(fetchImpl), registry: CARD_ARCHETYPES });
}
