/* @cf/persistence — PHASE 2 scaffold: stores, repository, recovery.

   §19.3 store list, verbatim from the plan: save metadata/schema version ·
   player/progression · creature/genome records · catalog/Atlas/log ·
   inventory/equipment/materials · settings/accessibility/audio · migration
   journal + recovery snapshots · optional disposable generated-asset cache.
   The authoritative save must never contain Pixi objects, DOM state, decoded
   audio buffers, render textures, or generated image bytes.

   RECOVERY SEMANTICS carried from v1.8.9 (CF-RR-002, SaveSystem):
   - a backup is promoted ONLY from a payload that has PROVEN it loads —
     v1.8.9 stashes the raw string as last-known-good at the END of a
     successful loadSave, never at write time;
   - if the primary is corrupt, the backup takes its place ONCE, loudly;
   - a RESET removes primary AND backup — "a reset must not resurrect via
     the backup" (CF-RR-002's reset law). */
export * from './repository.js';
export * from './revisioned.js';
export * from './migration-v5.js';
export * from './tab-lease.js';
export * from './active-play.js';
export * from './outcome-transaction.js';
export * from './arc2-loot.js';
export * from './arc2-fixed-fabrication.js';
export * from './arc2-engineering-loadout.js';
export * from './arc3-engineering.js';
export * from './arc3-legacy-projection.js';
export * from './arc4-ownership.js';
export * from './arc5-ownership-migration.js';
export * from './import-v2.js';
export * from './export-v2.js';
