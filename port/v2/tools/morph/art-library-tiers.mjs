// G3 of the Generated Creature Pipeline (audits/GENERATION_PIPELINE_20260926/PROGRAM.md, Nick D22/D23): which painted archetypes
// ship INSIDE the precached PWA pack (the CORE) and which are delivered ON DEMAND from the origin (the LIBRARY, outside the 128 MiB
// pack, admitted by pin before any decode, cached in a bounded worker cache). The core is one painting per body family — every
// body plan's stand-in (`TEMPLATE_PAINTING`, `painted-stand-in.ts`) plus the procedural jelly's — so a fresh offline install still
// draws and fights every creature painted; a library creature that is not yet cached falls back to its family's core painting.
export const ART_LIBRARY_CORE = Object.freeze(['Civet', 'Crab', 'Salmon', 'Eagle', 'Beetle', 'Python', 'Tree Frog', 'Chimpanzee',
  'Starfish', 'Tarantula', 'Octopus', 'Fruit Bat', 'Centipede', 'Jellyfish']);
const CORE = new Set(ART_LIBRARY_CORE);
/** 'core' (in the pack) or 'library' (on demand). */
export const artTierOf = (earthName) => (CORE.has(earthName) ? 'core' : 'library');
/** Served root of the on-demand library under the app's public/ directory (and the site's base path). */
export const ART_LIBRARY_PUBLIC = 'library/';
/** The library manifest, served at the library root; its hash is pinned into the bundle and the service worker. */
export const ART_LIBRARY_MANIFEST_FILE = 'art-library.json';
export const ART_LIBRARY_SCHEMA = 'cf-art-library/v1';
