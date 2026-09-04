/* @cf/domain-combatcore — MODULE 14 of 14 (typed facade over the auto-lift).
   ⚠ playerCombatant/playerAvatar/paperdollAvatar/statBlockHTML/_statOpen are
   APP-COUPLED (document, pstats, explorerName as free identifiers) — they
   need an app layer or hooks before calling. The fixture-pinned surface
   (battleStats, abilityOf/Theme, runDuel, the creature codecs, normGenome,
   levelOf) is pure and safe everywhere. */
export * from './combatcore.verbatim.js';
export * from './lineage-codec.js';
export * from './guardian-prime.js';
export * from './combat-settlement.js';
