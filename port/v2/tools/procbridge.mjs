/* procbridge.mjs — THE PROCEDURAL NAMING BRIDGE (old open item #7).

   The gold passes name procedural assets `fauna-h0-s15` (kingdom-heat-seed,
   from audit.ts pushFull) while artlock keys them `f0·15#15` (cell name + sheet
   index, from the same loop's `cells.push`). Nobody could join the two, so all
   240 procedural verdicts were unactionable and every drift re-check dropped
   them (D-noted in gp5/gp6).

   Both names are minted in ONE loop (audit.ts ~L291): kingdoms in order
   [fauna, flora, fungi, microbe], heat 0..2, seed 0..19 —
     full  = `${kingdom}-h${heat}-s${seed}`
     cell  = `${kingdom[0]}${heat}·${seed}`          (f/f/f/m — collides!)
     lock  = `procedural|${cell}#${index}`,  index = ki*60 + heat*20 + seed
   The `#index` is what disambiguates the three f-kingdoms. This tool emits the
   full bijection and verifies it against the live lock, so any consumer can
   join on either name.

   Usage: node tools/procbridge.mjs
   Writes: reference/procedural-name-map.json  [{full, cell, lockKey, kingdom, heat, seed, index}]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const kingdoms = ['fauna', 'flora', 'fungi', 'microbe'];

const map = [];
for (const [ki, kingdom] of kingdoms.entries()) {
  for (let heat = 0; heat <= 2; heat++) {
    for (let s = 0; s < 20; s++) {
      const index = ki * 60 + heat * 20 + s;
      map.push({
        full: `${kingdom}-h${heat}-s${s}`,
        cell: `${kingdom[0]}${heat}·${s}`,
        lockKey: `procedural|${kingdom[0]}${heat}·${s}#${index}`,
        kingdom, heat, seed: s, index,
      });
    }
  }
}

/* verify the bijection against the live lock — a formula nobody checked is a
   formula that is wrong (D-ART-140) */
const lock = JSON.parse(fs.readFileSync(path.join(root, 'reference/artlock.json'), 'utf8'));
const lockKeys = new Set(Object.keys(lock.fp).filter((k) => k.startsWith('procedural|')));
const hit = map.filter((m) => lockKeys.has(m.lockKey)).length;
const missing = map.filter((m) => !lockKeys.has(m.lockKey)).slice(0, 5);

/* and against the gp baseline names */
const base = JSON.parse(fs.readFileSync(path.join(root, 'reference/goldpass3-prechassis.json'), 'utf8'));
const gpNames = new Set((base.rows || base).filter((r) => r.set === 'procedural').map((r) => r.species));
const gpHit = map.filter((m) => gpNames.has(m.full)).length;

fs.writeFileSync(path.join(root, 'reference/procedural-name-map.json'), JSON.stringify(map, null, 1));
console.log(`procbridge: ${map.length} names · lock join ${hit}/${lockKeys.size} · gp join ${gpHit}/${gpNames.size}`);
if (missing.length) console.log('  ⚠ formula misses:', missing.map((m) => m.lockKey).join(', '));
if (hit === lockKeys.size && gpHit === gpNames.size) console.log('  ★ BIJECTION VERIFIED both directions — the 240 procedural verdicts are joinable at last.');
