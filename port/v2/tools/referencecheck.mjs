/* referencecheck.mjs — THE REFERENCE IS DATA, SO IT GETS A GATE.
   (THE PROPORTION ARC, stage 1 — see port/PROPORTION_ARC.md)

   port/v2/reference/ holds one row per Earth organism describing what the REAL
   organism looks like: proportion, head fraction, eye prominence, growth form,
   and the features without which it is unrecognisable. Every conformance result
   in this arc is read off that table, so a table that silently drops, duplicates
   or mistypes a row would make every downstream finding quietly incomplete —
   the exact failure mode this project has paid for seven times.

   This asserts:
     · every catalog name has exactly one row, and no row names a non-species
     · every enum field holds a value the checker actually understands
     · every numeric field is a finite number in a sane range
     · every row carries 1-3 mustRead features
     · rows flagged UNKNOWN are REPORTED, never silently trusted

   Usage: node tools/referencecheck.mjs
   Exit 1 on any structural failure; UNKNOWN rows warn but do not fail. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const REF = path.join(root, 'reference');
const norm = (s) => String(s).replace(/[’‘]/g, "'");
const dec = (s) => s.replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/\\'/g, "'");

/* the catalog, read from the verbatim source — never a copy that can drift */
const desc = fs.readFileSync(path.join(root, 'packages/domain/descriptors/src/apphooks.verbatim.js'), 'utf8');
const cat = {};
for (const m of desc.matchAll(/(fauna|flora|fungi|microbe)\s*:\s*\[([\s\S]*?)\]/g))
  cat[m[1]] = [...m[2].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => norm(dec(x[1])));
if (!cat.fauna || cat.fauna.length < 600) {
  console.error('referencecheck: the catalog parse returned ' + (cat.fauna || []).length + ' fauna — the PARSER is broken, not the data');
  process.exit(2);
}

const EYES = ['prominent', 'normal', 'small', 'hidden'];
const POSTURE = ['quadruped', 'biped', 'upright', 'sprawling', 'swimming', 'flying', 'sessile', 'crawling', 'coiled'];
const FORM = ['tree', 'shrub', 'herb', 'grass', 'vine', 'climber', 'succulent', 'cactus', 'palm', 'fern',
  'moss', 'seaweed', 'aquatic', 'epiphyte', 'bulb', 'rosette', 'tuber', 'parasite', 'carnivorous'];
const FUNGI_FAM = ['cap-and-stem', 'shelf', 'coral', 'puffball', 'earthstar', 'tooth', 'jelly', 'truffle',
  'mold', 'lichen', 'parasitic-club', 'cup', 'club', 'stinkhorn', 'morel', 'birds-nest'];
const MICROBE_FAM = ['coccus', 'rod', 'spiral', 'filament', 'chain', 'shelled', 'flagellate', 'ciliate',
  'amoeboid', 'plated', 'mat', 'micro-animal', 'algal-cell', 'virus'];

let fail = 0, warn = 0;
const bad = (msg) => { console.log('  ✗ ' + msg); fail++; };
const note = (msg) => { console.log('  ! ' + msg); warn++; };

function load(name) {
  const p = path.join(REF, name + '.json');
  if (!fs.existsSync(p)) { console.log(`${name}: NOT PRESENT — the arc's stage 1 is incomplete`); warn++; return null; }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.log(`${name}: UNPARSEABLE — ${e.message}`); fail++; return null; }
}

/** every catalog name exactly once, no strangers */
function oneToOne(label, rows, want, key = (r) => norm(r.name)) {
  const seen = new Map();
  for (const r of rows) {
    const k = key(r);
    if (seen.has(k)) bad(`${label}: DUPLICATE row for "${k}"`);
    else seen.set(k, r);
  }
  const missing = want.filter((n) => !seen.has(n));
  const extra = [...seen.keys()].filter((n) => !want.includes(n));
  if (missing.length) bad(`${label}: ${missing.length} catalog species have NO row — ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '…' : ''}`);
  if (extra.length) bad(`${label}: ${extra.length} rows name something not in the catalog — ${extra.slice(0, 10).join(', ')}`);
  if (!missing.length && !extra.length) console.log(`  ✔ ${label}: exact one-to-one with the catalog (${rows.length})`);
  return seen;
}

function num(label, r, field, lo, hi) {
  const v = r[field];
  if (typeof v !== 'number' || !Number.isFinite(v)) { bad(`${label} "${r.name}": ${field} is not a finite number (${JSON.stringify(v)})`); return; }
  if (v < lo || v > hi) bad(`${label} "${r.name}": ${field} = ${v}, outside the sane range ${lo}..${hi}`);
}
function oneOf(label, r, field, allowed) {
  if (!allowed.includes(r[field])) bad(`${label} "${r.name}": ${field} = ${JSON.stringify(r[field])}, not one of ${allowed.join('|')}`);
}
function mustRead(label, r) {
  const m = r.mustRead;
  if (!Array.isArray(m) || m.length < 1 || m.length > 3) { bad(`${label} "${r.name}": mustRead must hold 1-3 features, got ${Array.isArray(m) ? m.length : typeof m}`); return; }
  for (const f of m) if (typeof f !== 'string' || f.length < 6) bad(`${label} "${r.name}": mustRead entry too vague to act on — ${JSON.stringify(f)}`);
}
function unknowns(label, rows) {
  const u = rows.filter((r) => /UNKNOWN/i.test(String(r.note || '')));
  if (u.length) note(`${label}: ${u.length} row(s) flagged UNKNOWN and need a human eye — ${u.map((r) => r.name).join(', ')}`);
}

console.log('REFERENCE CHECK — port/v2/reference/ vs the verbatim catalog\n');

const fauna = load('fauna');
if (fauna) {
  oneToOne('fauna', fauna, cat.fauna);
  for (const r of fauna) {
    num('fauna', r, 'aspect', 0.15, 25);
    /* ⚠ headFrac 0 IS A VALID ANSWER, and the first cut of this check flagged
       23 rows for it: starfish, urchins, clams, corals, sponges, anemones,
       barnacles and salps have no head at all. The data was right and the
       range was wrong — suspect the instrument first (PROCESS_LAWS). */
    num('fauna', r, 'headFrac', 0, 0.60);
    oneOf('fauna', r, 'eyes', EYES);
    oneOf('fauna', r, 'posture', POSTURE);
    mustRead('fauna', r);
  }
  unknowns('fauna', fauna);
}

const flora = load('flora');
if (flora) {
  oneToOne('flora', flora, cat.flora);
  for (const r of flora) {
    num('flora', r, 'aspect', 0.15, 8);
    oneOf('flora', r, 'form', FORM);
    if (typeof r.leaf !== 'string' || r.leaf.length < 5) bad(`flora "${r.name}": leaf description too thin to draw from`);
    if (typeof r.leafColour !== 'string' || !r.leafColour) bad(`flora "${r.name}": leafColour missing`);
    if (typeof r.harvest !== 'string' || !r.harvest) bad(`flora "${r.name}": harvest missing (use "none visible" when there is none)`);
    mustRead('flora', r);
  }
  unknowns('flora', flora);
}

const other = load('other');
if (other) {
  const want = [...cat.fungi.map((n) => 'fungi|' + n), ...cat.microbe.map((n) => 'microbe|' + n)];
  oneToOne('fungi+microbe', other, want, (r) => r.kingdom + '|' + norm(r.name));
  for (const r of other) {
    num('other', r, 'aspect', 0.15, 8);
    oneOf('other', r, 'family', r.kingdom === 'fungi' ? FUNGI_FAM : MICROBE_FAM);
    if (typeof r.colour !== 'string' || !r.colour) bad(`other "${r.name}": colour missing`);
    if (r.kingdom === 'microbe' && !['single cell', 'small colony', 'field of many'].includes(r.scale))
      bad(`microbe "${r.name}": scale = ${JSON.stringify(r.scale)}, not one of single cell|small colony|field of many`);
    mustRead('other', r);
  }
  unknowns('other', other);
}

console.log('');
if (fail) { console.log(`REFERENCE CHECK: ${fail} structural failure(s), ${warn} warning(s)`); process.exit(1); }
console.log(`REFERENCE CHECK: PASS — ${warn} warning(s)`);
