/* @cf/domain-combatcore — MODULE 14 of 14 (typed facade over the auto-lift).
   The app-coupled player functions (playerCombatant, playerAvatar,
   paperdollAvatar, statBlockHTML) were removed from the lift, and with them the
   unused `_statOpen` and `DOLL_ANCHORS`. The fixture-pinned surface
   (battleStats, abilityOf/Theme, runDuel, the creature codecs, normGenome,
   levelOf) is pure and safe everywhere. */
export * from './combatcore.verbatim.js';
export * from './lineage-codec.js';
export * from './guardian-prime.js';
export * from './combat-settlement.js';
export * from './creature-level-progress.js';
export * from './player-ability.js';
export * from './encounter.js';
export * from './friendly-duel.js';
