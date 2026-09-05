/* @cf/domain-opportunity — Arc 3 canonical opportunity persistence boundary.

   Address-derived snapshots live in snapshot.ts. Engineering state, its
   strict codec, and the deliberately explicit seed-only migration mirror live
   in state.ts. Pure operation planners bind their outcomes in planner.ts. */
export * from './planner.js';
export * from './field-samples.js';
export * from './economy-source-model.js';
export * from './snapshot.js';
export * from './state.js';
