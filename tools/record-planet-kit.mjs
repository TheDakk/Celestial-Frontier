// Records the gas kit's own plans into fixtures/art/planet-gas-plans-v1.json: what the kit's generator (plan_for in
// gas/discovery/zonal.py) plans for 31 seeds: 1 to 24, 49 and 96, two seeds past 2^31, and the first two and the
// last seed past 2^31 that open with a rare kind of weather. The game's gasPlan is held to these in the gate
// (packages/art-interface/test/planet-gas-plan.test.ts).
// Usage: node tools/record-planet-kit.mjs <planet-kits-folder>
// A plan is numbers and names: none of the kit's drawings is read or recorded here. The kit is the art agent's, read
// where it lies and never written.
// Re-record only on Dakk's word once merged. Deterministic: running it twice on the same kit writes the same bytes.
// To prove the code on the live kit's drawings, run tools/check-planet-kit.mjs.
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatedPlans } from './planet-kit-pack.mjs';

const kits = process.argv[2];
if (process.argv.length !== 3 || !existsSync(join(kits, 'gas', 'discovery', 'zonal.py'))) {
  console.error('usage: node tools/record-planet-kit.mjs <planet-kits-folder>   (the folder that holds gas/discovery/zonal.py)');
  process.exit(2);
}
let plans;
try {
  plans = generatedPlans(kits);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
writeFileSync(fileURLToPath(new URL('../fixtures/art/planet-gas-plans-v1.json', import.meta.url)), plans);
console.log(`recorded ${Object.keys(JSON.parse(plans).plans).length} plans into fixtures/art/planet-gas-plans-v1.json`);
