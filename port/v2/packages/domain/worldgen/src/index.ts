/* @cf/domain-worldgen — MODULE 6 of 14 (typed facade over the auto-lift). */
/* Transitional lifted dependency: importing this package is safe, but a first
   uncached call that generates an ordinary galaxy, merger, or dwarf reads the
   free GAL_SPRITES binding. The current app installs the descriptors capture
   hooks before WorldGen use. Empty, special-only, and cached cells may not read
   it. This warning documents the dependency; it does not make the lift
   standalone or relocate art ownership. */
export * from './worldgen.verbatim.js';

/* slimGal RELOCATED 2026-07-31 (thread closed): it belongs to the Descriptors
   module (main.js Descriptors freeze list; body at 3014) and module 13 now
   carries it verbatim. Import it from @cf/domain-descriptors. */
