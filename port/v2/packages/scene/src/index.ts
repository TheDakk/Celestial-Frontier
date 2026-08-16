/* @cf/scene — Phase 3's testable core.

   ARCHITECTURE RULE (the reason this package exists): scene COMPOSITION is
   pure — domain data in, typed node descriptors out — and the Pixi app in
   apps/game is a dumb renderer over it. That keeps the vertical slice's
   logic under vitest (no WebGL in CI), and it is the same separation the
   old build's Renderer [app] failed to keep (galaxyHaze inside WorldGen —
   the no-DOM lint's documented exception). */
export * from './zoommode.js';
export * from './universe.js';
export * from './galaxy.js';
export * from './system.js';
export * from './charter.js';
export * from './address.js';
export * from './cf1-code.js';
