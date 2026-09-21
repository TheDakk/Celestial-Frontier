// The painted archetypes with sealed card masters (`tools/morph/build-card-masters.mjs` holds the same list; a test keeps
// them equal). Keyed by the Earth species name the genome carries as `_earthName`.
import type { PaintedCardArchetype } from './painted-card-source.js';
export const CARD_ARCHETYPES: readonly PaintedCardArchetype[] = Object.freeze([
  { earthName: 'Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/' }, { earthName: 'Coconut Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/' },
  { earthName: 'Freshwater Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/' }, { earthName: 'Mud Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/' },
  { earthName: 'Vent Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/' }, { earthName: 'Civet', dir: 'audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/' },
]);
