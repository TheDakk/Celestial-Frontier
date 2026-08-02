/* artbattery.mjs — THE ART CHECK BATTERY, one command.
   Every instrument the morphology pass has grown, in the order that makes a
   failure cheapest to read: static defect classes first (no build needed),
   then the routing sentinels, then the two browser gates that actually paint.

   Each stage exists because it caught something real. `npm run artbattery`.  */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAGES = [
  ['artaudit', 'node tools/artaudit.mjs',
    'the defect classes this pass has shipped: dead painters · discarded rngs · unused name params · degenerate salts · size-only variation · pattern-globbed file discovery · stale-bundle readers'],
  ['overridecheck', 'node tools/overridecheck.mjs',
    'every table key resolves to a real catalog species, in the right kingdom, unshadowed, unduplicated — and the router actually consults the table'],
  ['overridecontrol', 'node tools/overridecheck.control.mjs',
    'and the seven negative controls prove overridecheck still fails when it should'],
  ['coveragegap', 'node tools/coveragegap.mjs',
    'what remains uncovered, measured from the catalog rather than remembered'],
  ['speciesaudit', 'node tools/speciesaudit.mjs',
    'all 1,254 portraits paint, none duplicate, none clip — through a bundle proven fresh'],
];

let failed = 0;
for (const [name, cmd, why] of STAGES) {
  process.stdout.write(`\n── ${name} ──\n   ${why}\n`);
  try { execSync(cmd, { cwd: root, stdio: 'inherit' }); }
  catch { failed++; console.error(`   ★ ${name} FAILED`); }
}
console.log(`\nART BATTERY: ${STAGES.length - failed}/${STAGES.length} stages passed`);
if (failed) process.exit(1);
