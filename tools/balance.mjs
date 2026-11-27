// The balance tables: what the worlds of each planet type pay, tier by tier, by the game's own mining planner,
// descent odds, roster and first-landing sample, on the addressed census's worlds with bare hands.
// Usage: node tools/balance.mjs [--pulls 40] [--tiers 3]
// This tool is run by hand; no test imports it. apps/game/test/balance.test.ts holds the figures the designs argue from.
import { registerHooks } from 'node:module';

// The game's sources import some .ts files with .js specifiers, and the app imports its own with none.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.endsWith('.js')) return nextResolve(specifier.slice(0, -3) + '.ts', context);
      if (specifier.startsWith('.')) {
        try { return nextResolve(specifier + '.ts', context); } catch { return nextResolve(specifier + '/index.ts', context); }
      }
      throw error;
    }
  },
});

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? fallback : Number(process.argv[at + 1]);
};
const [pulls, tiers] = [arg('pulls', 40), arg('tiers', 3)];
const { bestExisting, simulate } = await import('@cf/domain-worldkinds');
const { addressedWorlds, balanceSources, lifelessOf } = await import('../apps/game/test/balance-support.ts');
const loot = await import('@cf/domain-loot');
const { registerArc2EngineeringLoadout } = await import('@cf/domain-loot/engineering-internal');

// Bare hands: an empty inventory, registered as the save bridge registers one. (The test reads its own through the
// save bridge itself, which this plain script cannot load.)
const migrated = loot.migrateLegacyGear({
  sourceActionId: loot.makeGearSourceActionId({ kind: 'legacy-migration', ownerId: 'balance-tables', actionKey: 'bare-hands', receiptId: 'migration:v4-v5' }),
  itemCounts: [], equipped: {}, equippedAffixes: {},
});
const inventory = loot.decodeGearInventory(JSON.stringify({
  schema: loot.GEAR_INVENTORY_SCHEMA, revision: 1, capacity: 8, entries: [], equipped: migrated.equipped, pendingRewards: [],
}));

const PRECIOUS = ['Ag', 'Au', 'Pt', 'Ir'];
const precious = (world) => PRECIOUS.reduce((sum, id) => sum + (world.unitsAPull.get(id) ?? 0), 0);
const linesOf = (world) => `${world.snapshot.deposits.length} lines, ${world.snapshot.deposits.filter((id) => PRECIOUS.includes(id)).length} precious`;
const started = Date.now();
const all = addressedWorlds();
const sources = balanceSources(loot.projectEngineeringCapabilities(registerArc2EngineeringLoadout(inventory, [])));
console.log(`${all.length} addressed worlds; ${pulls} pulls of each lifeless world; bare hands`);
for (let tier = 0; tier < tiers; tier++) {
  console.log(`\ntier ${tier}`);
  console.log('type     worlds  landing  hp a wave-off  reserve units  Stardust  units a pull');
  const measured = [];
  for (const type of ['gas', 'ice', 'rocky', 'desert', 'lava', 'venus', 'terran', 'ocean']) {
    const result = simulate({ worlds: lifelessOf(all, type), tier, pulls }, sources);
    measured.push(...result.measured);
    if (result.measured.length === 0) continue;
    const units = [...result.unitsAPull].sort(([a], [b]) => (a < b ? -1 : 1)).map(([id, value]) => `${id} ${value.toFixed(2)}`).join(', ');
    console.log(`${type.padEnd(8)} ${String(result.mined).padStart(6)}  ${result.landingPercent.toFixed(1).padStart(7)}  ${result.hpAWaveOff.toFixed(2).padStart(13)}  ${result.reserveUnits.toFixed(0).padStart(13)}  ${result.stardustFirst.toFixed(1).padStart(8)}  ${units}`);
  }
  const best = bestExisting(measured, precious, linesOf);
  if (best !== null) console.log(`best existing class for precious metal: ${best.cls}, ${best.worlds} worlds, ${best.value.toFixed(2)} a pull`);
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(1)} s`);
