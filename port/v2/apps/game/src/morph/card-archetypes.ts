// The painted archetypes with sealed card masters, SHIPPED inside port/v2 (`tools/morph/build-card-masters.mjs` mirrors each
// fit's card + record + markings there; the app never imports evidence folders and the preview snapshot archives only the
// v2 subtree). Keyed by the Earth species name the genome carries as `_earthName`.
import type { PaintedCardArchetype } from './painted-card-source.js';
export const CARD_ARCHETYPES: readonly PaintedCardArchetype[] = Object.freeze([
  { earthName: 'Crab', dir: 'port/v2/apps/game/assets/painted-cards/crab/' }, { earthName: 'Coconut Crab', dir: 'port/v2/apps/game/assets/painted-cards/coconut-crab/' },
  { earthName: 'Freshwater Crab', dir: 'port/v2/apps/game/assets/painted-cards/freshwater-crab/' }, { earthName: 'Mud Crab', dir: 'port/v2/apps/game/assets/painted-cards/mud-crab/' },
  { earthName: 'Vent Crab', dir: 'port/v2/apps/game/assets/painted-cards/vent-crab/' }, { earthName: 'Civet', dir: 'port/v2/apps/game/assets/painted-cards/civet-sentinel-input-01/' },
]);
