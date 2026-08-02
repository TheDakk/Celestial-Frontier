/* artclass.mjs — WHICH PAINTER DRAWS THIS SPECIES.

   The art lock needs to know what "the class I am working on" means, because
   Nick's rule for the safety net is scoped, not global:

     "It only needs to apply to the organisms that we're dealing with in that
      class… we just want to make it so that the global passes don't
      retroactively affect all the earth work we put in."

   A change to the quadruped painter SHOULD move quadrupeds. The alarm is when
   it moves the birds too. So every species is tagged with the source file that
   owns its spec, parsed from the route tables themselves rather than kept in a
   hand-written list that would rot the first time a species is re-routed.

   Anything with no spec anywhere falls to the byte-verbatim engine and is
   tagged 'verbatim' — those must NEVER move, since hdart.verbatim.js is not
   ours to touch. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'packages', 'art', 'src');

/** the painter class each source file contributes, in routing order */
const FILES = [
  ['quadrupedoverrides.ts', 'quadruped'],
  ['mammaloverrides.ts', 'quadruped'],
  ['birdoverrides.ts', 'bird'],
  ['invertoverrides.ts', 'invert'],
  ['faunaoverrides.ts', 'fauna'],
  ['faunaoverrides2.ts', 'fauna'],
  ['faunaoverrides3.ts', 'fauna'],
  ['faunaoverrides4.ts', 'fauna'],
  ['faunaoverrides5.ts', 'fauna'],
  ['floraoverrides.ts', 'flora'],
  ['floraoverrides2.ts', 'flora'],
  ['floraoverrides3.ts', 'flora'],
  ['florarost.ts', 'flora'],
  ['fungioverrides2.ts', 'fungi'],
  ['speciesoverrides.ts', 'species'],
  ['proceduralfamilies.ts', 'procedural'],
  ['proceduraloverrides.ts', 'procedural'],
];

/** every quoted key that looks like a species entry in a top-level table */
function keysIn(file) {
  const p = path.join(SRC, file);
  if (!fs.existsSync(p)) return [];
  const s = fs.readFileSync(p, 'utf8');
  const out = new Set();
  for (const m of s.matchAll(/^ {2}'([^']+)':/gm)) out.add(m[1]);
  /* the string-array route lists (FLORA_DUPES and friends) */
  for (const m of s.matchAll(/^ {2}'([^']+)',/gm)) out.add(m[1]);
  return [...out];
}

export function classMap() {
  const map = new Map();
  for (const [file, cls] of FILES) {
    for (const k of keysIn(file)) if (!map.has(k)) map.set(k, cls);
  }
  return map;
}

export function classOf(map, key) {
  /* keys arrive as 'earth-fauna|Wolf' or 'procedural|f1·3#7' */
  const bar = key.indexOf('|');
  const sheet = bar < 0 ? '' : key.slice(0, bar);
  const name = bar < 0 ? key : key.slice(bar + 1);
  if (sheet === 'procedural') return 'procedural';
  const c = map.get(name);
  if (c && c !== 'procedural') return c;
  if (sheet === 'earth-flora') return 'verbatim-flora';
  if (sheet === 'earth-fungi') return 'verbatim-fungi';
  if (sheet === 'earth-microbe') return 'verbatim-microbe';
  return 'verbatim-fauna';
}

if (import.meta.url === 'file:///' + process.argv[1].replace(/\\/g, '/')) {
  const m = classMap();
  const tally = {};
  for (const c of m.values()) tally[c] = (tally[c] || 0) + 1;
  console.log('specs found per class:', tally);
  console.log('total named specs:', m.size);
}
