/* artbattery.mjs — THE ART CHECK BATTERY, one command.
   Every instrument the morphology pass has grown, in the order that makes a
   failure cheapest to read: static defect classes first (no build needed),
   then the routing sentinels, then the two browser gates that actually paint.

   Each stage exists because it caught something real. `npm run artbattery`.  */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
/* ★ wave 35 — THE BATTERY COULD NOT EXPRESS A DECLARATION. artlock's whole
   contract is "say which painter classes you are touching"; the battery invoked
   it with no arguments, so its [DRIFT] check read "declared: (nothing — so
   nothing may move)" and FAILED on every legitimate change. A gate that cannot
   pass when the work is correct does not get fixed — it gets ignored, which is
   the same failure D-ART-109 already recorded once for this exact stage.
   Extra args now reach artlock: `npm run artbattery -- --touching=quadruped`. */
const passthru = process.argv.slice(2).join(' ');
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
    'all 1,250 portraits paint, none duplicate, none clip — through a bundle proven fresh'],
  /* ★ WAVE 21 — ARTLOCK WAS NEVER IN THE BATTERY.
     The safety net was built to stop a global pass from silently undoing
     signed-off work, it was documented as part of "the art gate", and the
     handoff called this command "the 5-stage art gate" — but `npm run
     artbattery` never ran it. It only ever fired when someone remembered to
     type it, which is precisely the failure mode it was built to remove: the
     guard you have to remember is not a guard. Found when a wave that
     repainted 500+ organisms came back 5/5 green and artlock, run by hand
     thirty seconds later, said FAIL.

     Last of the stages on purpose — it renders the whole catalogue twice and
     is by far the slowest, so a cheap static failure should surface first. */
  ['artlock', `node tools/artlock.mjs${passthru ? ' ' + passthru : ''}`,
    'the safety net: nothing drifted outside the classes this change declared, and no two Earth species collapsed into the same picture'],
];

let failed = 0;
for (const [name, cmd, why] of STAGES) {
  process.stdout.write(`\n── ${name} ──\n   ${why}\n`);
  try { execSync(cmd, { cwd: root, stdio: 'inherit' }); }
  catch { failed++; console.error(`   ★ ${name} FAILED`); }
}
console.log(`\nART BATTERY: ${STAGES.length - failed}/${STAGES.length} stages passed`);
if (failed) process.exit(1);
