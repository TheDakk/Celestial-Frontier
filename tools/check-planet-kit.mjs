// Proves the game's gas composer on the art agent's LIVE gas kit, by hand. The kit's drawings are never on this
// branch, so the gate proves the composer on a test kit only: this is the one proof on the real drawings. Run it
// before any merge that touches the composer and after every redraw of the kit.
// Usage: node tools/check-planet-kit.mjs <planet-kits-folder>
// It reads the kit as it lies and checks, in order:
//   1. every row of the port-check table in the kit's own rules (gas/discovery/zonal.md), at both sizes, and that
//      the table has four rows or more;
//   2. every finished map of a seeded world in the manifest of the kit's own painter (linked from gas/kit.md), by
//      its whole hash;
//   3. the plans: the kit's own generator, run now, still plans what fixtures/art/planet-gas-plans-v1.json records
//      (the gate holds the code to that file);
//   4. the two-pixel rule on the composed maps of seeds 1 to 24, with the measure before the mend, and each tier's
//      drawings' thin pixels (a report for the art agent, never a failure);
//   5. no flicker over a full turn of the composed maps of seeds 1 to 8, at 65 and 129 wide, upright and leaning.
// Prints a line a check. Anything that differs is printed again at the end between lines of `!`, and the exit is 1.
// Exit 0: every check holds. Exit 2: usage. Reads only; writes nothing.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatedPlans, packGasKit, readPortChecks, readZonalMaps } from './planet-kit-pack.mjs';

// The packages import sibling .ts files without an extension: retry a failed specifier with .ts and /index.ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.')) throw error;
      for (const candidate of [specifier + '.ts', specifier + '/index.ts']) {
        try { return nextResolve(candidate, context); } catch { /* try the next candidate */ }
      }
      throw error;
    }
  },
});

const kits = process.argv[2];
if (process.argv.length !== 3 || !existsSync(join(kits, 'gas', 'discovery', 'zonal.md'))) {
  console.error('usage: node tools/check-planet-kit.mjs <planet-kits-folder>   (the folder that holds gas/discovery/zonal.md)');
  process.exit(2);
}
const art = await import('../packages/art-interface/src/index.ts');
const { flicker } = await import('../packages/art-interface/test/planet-support.ts');
const long = (bytes) => createHash('sha256').update(bytes).digest('hex');
const faults = [];
const say = (line) => console.log(line);
const fault = (line) => { faults.push(line); console.log(`DIFFERENT: ${line}`); };

const kit = art.parsePlanetKit(packGasKit(kits));

say('1. the port-check table of the kit\'s rules');
const rows = readPortChecks(kits);
if (rows.length < 4) fault(`the kit's port-check table holds ${rows.length} rows: four or more are expected`);
for (const row of rows) {
  const plan = art.gasPlan(row.seed, kit);
  for (const [width, want] of [[384, row.wide], [192, row.narrow]]) {
    const made = long(art.gasMap(plan, kit, width).values).slice(0, 16);
    const line = `seed ${row.seed}, ${width} wide: the kit says ${want}, the code composes ${made}`;
    if (made === want) say(`   ${line}: equal`);
    else fault(line);
  }
}

say('2. the finished maps of the kit\'s own painter');
const maps = readZonalMaps(kits);
let equal = 0;
for (const map of maps) {
  const made = long(art.gasMap(art.gasPlan(map.seed, kit), kit, map.width).values);
  if (made === map.hash) equal++;
  else fault(`seed ${map.seed}, ${map.width} wide: the kit's own painter made ${map.hash}, the code composes ${made}`);
}
say(`   ${equal} of ${maps.length} maps equal by whole hash (${new Set(maps.map((map) => map.seed)).size} seeds, both sizes)`);
if (maps.length < 192) fault(`the painter's manifest holds ${maps.length} maps of seeded worlds: 192 or more are expected`);

say('3. the plans');
const recorded = readFileSync(fileURLToPath(new URL('../fixtures/art/planet-gas-plans-v1.json', import.meta.url)), 'utf8');
let generated = '';
try { generated = generatedPlans(kits); } catch (error) { fault(error.message); }
if (generated !== '') {
  const [now, then] = [JSON.parse(generated).plans, JSON.parse(recorded).plans];
  const moved = Object.keys(then).filter((seed) => JSON.stringify(now[seed]) !== JSON.stringify(then[seed]));
  if (generated === recorded) say(`   the kit's generator plans all ${Object.keys(then).length} recorded seeds as recorded, byte for byte`);
  else fault(`the kit's generator no longer plans what fixtures/art/planet-gas-plans-v1.json records (${moved.length} of ${Object.keys(then).length} seeds differ${moved.length > 0 ? `: ${moved.slice(0, 8).join(', ')}` : ', or the seeds themselves'}): the gate is holding the code to an older kit`);
}

say('4. the two-pixel rule');
for (const [width, tier] of kit.tiers) {
  const thin = [...tier.values()].filter((grid) => grid.thin > 0);
  say(`   tier ${width}: ${thin.length} of ${tier.size} drawings hold pixels in no like 2 by 2 square (${thin.reduce((sum, grid) => sum + grid.thin, 0)} pixels): a report, not a failure`);
}
const sum = { thin: 0, wide: 0, tall: 0, mended: 0, after: 0 };
for (let seed = 1; seed <= 24; seed++) {
  const plan = art.gasPlan(seed, kit);
  const brush = art.gasBrush(plan, kit, 384);
  sum.thin += art.thinPixels(brush.values, 384, 128, true);
  sum.wide += art.loneRuns(brush.values, 384, 128);
  sum.tall += art.loneRises(brush.values, 384, 128);
  for (const [w, h] of [[384, 128], [192, 64]]) {
    const map = art.gasMap(plan, kit, w);
    if (w === 384) sum.mended += map.mended;
    const left = art.thinPixels(map.values, w, h, true) + art.loneRuns(map.values, w, h) + art.loneRises(map.values, w, h);
    sum.after += left;
    if (left > 0) fault(`seed ${seed}, ${w} wide: the finished map holds ${left} thin pixels or one-pixel runs`);
    if (map.values.some((ink) => ink < 1 || ink > 16)) fault(`seed ${seed}, ${w} wide: the finished map holds an ink that is not 1 to 16`);
  }
}
say(`   seeds 1 to 24, 384 by 128, before the mend: ${sum.thin} pixels in no like square, ${sum.wide} one-pixel runs in rows, ${sum.tall} in columns; the mend rewrote ${sum.mended}; after, at both sizes: ${sum.after}`);

say('5. flicker over a full turn');
for (const [side, width] of [[65, 192], [129, 384]]) {
  let flickers = 0;
  for (let seed = 1; seed <= 8; seed++) {
    const plan = art.gasPlan(seed, kit);
    const layer = { ...art.gasMap(plan, kit, width), colours: plan.swatches };
    for (const tilt of seed <= 2 ? [0, 14, -67] : [[23, 0, 9, -40, 90, 5][seed - 3]]) flickers += flicker(side, layer.w, layer.h, tilt, layer, undefined).flickers;
  }
  if (flickers === 0) say(`   ${side} wide, seeds 1 to 8, upright and leaning: flicker 0`);
  else fault(`${side} wide, seeds 1 to 8: ${flickers} flickers over a full turn`);
}

if (faults.length > 0) {
  const bar = '!'.repeat(100);
  console.error(`${bar}\n${faults.map((line) => `!! ${line}`).join('\n')}\n${bar}\n${faults.length} checks differ: the code does not compose the live kit as the kit says`);
  process.exit(1);
}
say(`every check holds: the code composes the live gas kit as the kit's own rules, painter and generator say`);
