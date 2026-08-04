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
  /* ⚠ THIS ONLY MATCHED SINGLE-QUOTED KEYS. Four plants have an apostrophe in
     their name — Angel's Trumpet, Solomon's Seal, Miner's Lettuce, Devil's
     Claw — so their rows MUST be double-quoted, and this scanner could not see
     them. They were classed verbatim-flora and the lock correctly failed the
     commit for undeclared drift. Third scanner this session to assume one
     surface form of a key (artclass prefixes, coveragegap prefixes, and now
     quoting): when a key can be written two ways, read both.

     ⚠⚠ WAVE 46 — AND THE FOURTH SURFACE FORM: PACKED ROWS. `^ {2}'…':` anchors
     to a LINE START, so on a row that carries several entries —
       'Bracket Fungus': fungiBracket, 'Shelf Fungus': fungiShelf, 'Yeast': …
     — it saw the FIRST key and none of the rest. Eleven species were routed to
     owned painters and classed `verbatim-*` anyway: THE CLASS THAT MAY NEVER
     MOVE. That direction is the loud one — it blocks a legitimate fix and you
     find out immediately. ★ THE MIRROR IS THE DANGEROUS ONE: were the tables
     ever reordered so a genuinely verbatim species sat second on a packed line,
     it would class as owned and silently lose the lock's protection.
     Negative-controlled BOTH ways before landing: widening the regex changes
     the class of ZERO existing keys and adds exactly the 11 (see below), and a
     name absent from every table still classes verbatim. */
  for (const m of s.matchAll(/(?:^ {2}|,\s*)(?:'([^']+)'|"([^"]+)")\s*:/gm)) {
    const key = m[1] ?? m[2];
    /* ⚠ the CANON table is keyed 'kingdom|Name', so a species routed there was
       invisible to this map and fell through to 'verbatim-*' — which would have
       failed the lock as UNDECLARED drift the first time anyone edited one. */
    out.add(key.includes('|') ? key.slice(key.indexOf('|') + 1) : key);
  }
  /* The string-array route lists (FLORA_DUPES and friends).
     ⚠ THE SIXTH SURFACE FORM, and it sat on the line directly below the fix
     above carrying BOTH of the same faults — line-anchored and single-quote
     only. `floraoverrides.ts:262` packs four routes onto one line:
       'Acai', 'Salmonberry', 'Licorice', "Devil's Club", ];
     so it saw 'Acai' and missed the other three, and all three came back
     verbatim-flora. ★ Fixing one regex and not its twin is how the first
     attempt at this "passed" while three species stayed misclassified — the
     negative control is what caught it, not the diff.

     ⚠⚠ AND THE OBVIOUS WIDENING IS WRONG. Matching any quoted string before a
     comma swept in 110 non-species strings — rgb triples like '26,20,12',
     wrapped comment fragments, pieces of template literals — and because the
     map is first-wins, that MOVED EIGHT REAL SPECIES to another painter's
     class (Bear, Koala, Humpback Whale, Cuttlefish… species -> fauna). A
     classifier that mislabels a species is worse than one that under-reports,
     because the lock then green-lights drift under the wrong heading.
     So scope it structurally instead of lexically: only quoted strings inside
     an array literal bound to a SCREAMING_CASE const are route lists. Junk
     lives in function bodies, which this cannot reach.

     ⚠⚠⚠ AND SCOPING TO THE ARRAY IS STILL NOT ENOUGH: a route list carries
     COMMENTS, and FLORA_DUPES opens with one naming three species it had
     REMOVED ("Wave 42 — 'Green Algae', 'Ice Algae' and 'Snow Algae' removed").
     Reading those back in re-routed all three to the very painter the comment
     says they left. Strip comments before reading a block — a scanner that
     reads prose will eventually believe it. */
  for (const arr of s.matchAll(/const\s+[A-Z][A-Z_0-9]*\s*:\s*(?:readonly\s+)?string\[\]\s*=\s*\[([\s\S]*?)\]/g)) {
    const body = arr[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const m of body.matchAll(/'([^']+)'|"([^"]+)"/g)) out.add(m[1] ?? m[2]);
  }
  return [...out];
}

/** ⚠ THE FIFTH SURFACE FORM: THE APOSTROPHE ITSELF.
 *  The species catalogue writes `Lion’s Mane` with U+2019 RIGHT SINGLE QUOTATION
 *  MARK; `speciesoverrides.ts` writes `"Lion's Mane"` with U+0027. Same name to
 *  a reader, two different Map keys — so the one fungus that IS routed by name
 *  fell through to `verbatim-fungi`. The mojibake note at speciesoverrides.ts
 *  :552 shows this exact character has bitten the project before. Normalise
 *  BOTH sides of the lookup, never one. */
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

export function classMap() {
  const map = new Map();
  for (const [file, cls] of FILES) {
    for (const k of keysIn(file)) if (!map.has(norm(k))) map.set(norm(k), cls);
  }
  return map;
}

export function classOf(map, key) {
  /* keys arrive as 'earth-fauna|Wolf' or 'procedural|f1·3#7' */
  const bar = key.indexOf('|');
  const sheet = bar < 0 ? '' : key.slice(0, bar);
  const name = norm(bar < 0 ? key : key.slice(bar + 1));
  if (sheet === 'procedural') return 'procedural';
  const c = map.get(name);
  if (c && c !== 'procedural') return c;
  if (sheet === 'earth-flora') return 'verbatim-flora';
  if (sheet === 'earth-fungi') return 'verbatim-fungi';
  if (sheet === 'earth-microbe') return 'verbatim-microbe';
  return 'verbatim-fauna';
}

/* ⚠ `process.argv[1]` is undefined under `node --input-type=module -e`, so this
   guard THREW and the module could not be imported at all by anything that did
   not happen to be a script file. Guard the guard. */
if (process.argv[1] && import.meta.url === 'file:///' + process.argv[1].replace(/\\/g, '/')) {
  const m = classMap();
  const tally = {};
  for (const c of m.values()) tally[c] = (tally[c] || 0) + 1;
  console.log('specs found per class:', tally);
  console.log('total named specs:', m.size);
}
