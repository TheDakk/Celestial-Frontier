// G3 of the Generated Creature Pipeline (audits/GENERATION_PIPELINE_20260926/PROGRAM.md, Dakk D22/D23): which painted archetypes
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
/** D56 (2026-11-04): the page reads the library through a SHARD INDEX instead of the whole manifest, so its retained table is the
 * shards it actually used, not every library file (the full manifest stays for the service worker and the build check).
 * FINISH F4 (2026-11-04): shards are HASH BUCKETS — a file's bucket is FNV-1a-32 of its first three path segments (its archetype
 * directory: `library/cards/wolf`, `library/battle2/audits`, …) modulo 64, so one archetype's files share one shard and the page
 * holds 64 small pins plus the buckets it used, whatever the library's size (at 691 directories a per-directory index held 274 KB). */
export const ART_LIBRARY_SHARD_BUCKETS = 64;
export const ART_LIBRARY_SHARD_INDEX_FILE = 'art-library-shards.json';
export const ART_LIBRARY_SHARD_DIR = 'shards/';
export const ART_LIBRARY_SHARD_INDEX_SCHEMA = 'cf-art-library-shards/v1';
export const ART_LIBRARY_SHARD_SCHEMA = 'cf-art-library-shard/v1';
const fnv1a32 = (text) => { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
/** A served path's shard (bucket id `bucket-00` … `bucket-3f`). */
export const artLibraryGroupOf = (servedPath) => 'bucket-' + (fnv1a32(servedPath.split('/').slice(0, 3).join('/')) % ART_LIBRARY_SHARD_BUCKETS).toString(16).padStart(2, '0');
/** A bucket's shard file under the library root (`bucket-07` → `shards/bucket-07.json`). */
export const artLibraryShardFileOf = (group) => ART_LIBRARY_SHARD_DIR + group + '.json';
