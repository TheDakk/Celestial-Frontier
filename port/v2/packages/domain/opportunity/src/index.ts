/* @cf/domain-opportunity — Arc 3 canonical opportunity persistence boundary.

   Address-derived snapshots live in snapshot.ts. Engineering state, its
   strict codec, and the deliberately explicit seed-only migration mirror live
   in state.ts. Planners are intentionally outside this first Arc 3 slice. */
export * from './snapshot.js';
export * from './state.js';
