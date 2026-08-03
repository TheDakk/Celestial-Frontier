/* applytints.mjs — colour a species AT THE CALL SITE, for painters that have
   no hue axis of their own.

   ★ WHY THIS EXISTS RATHER THAN FORTY MORE PAINTER EDITS. The colour work ran
   out of cheap wins: the last stretch is a LONG TAIL — ~50 painters, most of
   them covering a single species. Adding a `hue?: string` field to each would
   be forty signature changes, forty chances to declare a field nothing reads
   (D-ART-100), and forty painters re-blessed, all to colour one organism
   apiece. The engine already has the cheaper answer: `speciesHue(p, '#rrggbb')`
   replaces the rolled palette on its way in, which 11 microbes have used
   since wave 18. One line per species, no painter touched, nothing to leave
   inert — the transform either produces a call with the tint in it or it
   refuses.

   THREE ROW SHAPES EXIST and each needs its own rewrite:
     'Springtail':  (c, g, p) => faunaSpringtail(c, g, p),      → wrap p
     'Enoki':       fungiEnoki,                                  → expand, then wrap
     'Sea Urchin':  (c, g, p, n) => marineUrchin(c, g, p, n),    → wrap p
   A painter that never receives a Pal at all is REFUSED, not guessed at:
   floraRafflesia hardcodes the real rafflesia red and cannot take a palette,
   so there is nothing here to tint and pretending otherwise would be a lie in
   the worklist.

   Usage: node tools/applytints.mjs <hues.json> [--dry] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'packages/art/src');
const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
const inFile = argv.find((a) => !a.startsWith('--'));
if (!inFile) { console.error('usage: node tools/applytints.mjs <hues.json> [--dry]'); process.exit(2); }
const hues = JSON.parse(fs.readFileSync(inFile, 'utf8'));

const files = fs.readdirSync(SRC).filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts'));
const text = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(SRC, f), 'utf8')]));
/* every painter's parameter list, so we can refuse the paletteless ones */
const sig = {};
for (const txt of Object.values(text))
  for (const m of txt.matchAll(/function (\w+)\s*\(([^)]*)\)/g)) sig[m[1]] ??= m[2];
const takesPal = (fn) => /\b(?:p|pIn)\s*:\s*(?:Pal|ReturnType<typeof palette>)/.test(sig[fn] ?? '');
/* does the painter accept a trailing name argument? */
const takesName = (fn) => /\bname\s*[:=]/.test(sig[fn] ?? '');

const problems = [], applied = new Set();
const seen = new Map();
for (const [n, hex] of Object.entries(hues)) {
  if (!/^#[0-9a-f]{6}$/.test(hex)) problems.push(`${n}: "${hex}" is not a lowercase #rrggbb`);
  if (seen.has(hex)) problems.push(`${n}: duplicate hex ${hex}, shared with ${seen.get(hex)}`);
  else seen.set(hex, n);
}
if (problems.length) {
  console.error('applytints: REFUSING — nothing written:');
  for (const p of problems.slice(0, 25)) console.error('  · ' + p);
  process.exit(1);
}

const dec = (s) => s.replace(/\\'/g, "'").replace(/[''’‘]/g, "'");
let edits = 0;
const refused = [];
/* ⚠ MATCH THE TEXT, NOT THE LINE. A line-anchored matcher assumed one species
   per row and these tables routinely pack several:
       'Turkey Tail': fungiBracket, 'Bracket Fungus': fungiBracket, …
   so everything after the first key was swallowed as "the value" and the row
   reported as an unrecognised shape. Some tables also key on `kingdom|Name`
   (the wave-18 CANON map), which a bare-name lookup never finds. Both are
   handled here rather than worked around per table. */
const ENTRY = /'((?:[^'\\]|\\.)*)'\s*:\s*(\([^)]*\)\s*=>\s*\w+\([^;]*?\)|\w+)(?=\s*[,}\n])/g;
for (const f of files) {
  let body = text[f];
  let touched = false;
  body = body.replace(ENTRY, (whole, rawKey, rhs) => {
    let key = dec(rawKey);
    if (key.includes('|')) key = key.slice(key.indexOf('|') + 1);
    const hex = hues[key];
    if (!hex || applied.has(key)) return whole;
    if (/\bspeciesHue\(/.test(whole)) return whole;           /* already tinted */

    /* shape A — an arrow that already passes p */
    const arrow = rhs.match(/^\((c[^)]*)\)\s*=>\s*(\w+)\((.*)\)$/s);
    if (arrow) {
      const fn = arrow[2];
      if (!takesPal(fn)) { refused.push(`${key}: ${fn}() takes no palette — its colour is hardcoded`); return whole; }
      /* ⚠ WRAP WHATEVER THE ARROW CALLS ITS PALETTE, not a hard-coded `p`.
         The wave-18 CANON table names it `pp` — `(c, g, pp) => faunaBat(…)` —
         so a literal `p` search refused 14 perfectly tintable species,
         including every bat, both monotremes and the dart frog. */
      const pname = (arrow[1].split(',')[2] ?? 'p').trim();
      const args = arrow[3].replace(new RegExp('\\b' + pname + '\\b(?!\\w)'), `speciesHue(${pname}, '${hex}')`);
      if (args === arrow[3]) { refused.push(`${key}: no \`${pname}\` argument to wrap in ${fn}()`); return whole; }
      applied.add(key); edits++; touched = true;
      return `'${rawKey}': (${arrow[1]}) => ${fn}(${args})`;
    }
    /* shape B — a bare painter reference */
    if (/^\w+$/.test(rhs)) {
      const fn = rhs;
      if (!sig[fn]) return whole;                             /* not a painter at all */
      if (!takesPal(fn)) { refused.push(`${key}: ${fn}() takes no palette — its colour is hardcoded`); return whole; }
      applied.add(key); edits++; touched = true;
      return takesName(fn)
        ? `'${rawKey}': (c, g, p, n) => ${fn}(c, g, speciesHue(p, '${hex}'), n)`
        : `'${rawKey}': (c, g, p) => ${fn}(c, g, speciesHue(p, '${hex}'))`;
    }
    refused.push(`${key}: unrecognised row shape — ${rhs.slice(0, 60)}`);
    return whole;
  });
  if (touched) {
    /* the helper has to be in scope in whichever file the row lives in */
    if (!/import \{[^}]*\bspeciesHue\b/.test(body)) {
      const imp = body.match(/^import .*\n/m)[0];
      body = body.replace(imp, imp + "import { speciesHue } from './surface.js';\n");
    }
    if (!dry) fs.writeFileSync(path.join(SRC, f), body);
  }
}
console.log((dry ? '[dry] ' : '') + 'tinted ' + edits + ' species at the call site');
if (refused.length) {
  console.log('refused ' + refused.length + ' (left alone on purpose):');
  for (const r of refused.slice(0, 20)) console.log('  · ' + r);
}
const missed = Object.keys(hues).filter((n) => !applied.has(n) && !refused.some((r) => r.startsWith(n + ':')));
if (missed.length) console.log('not found in any table: ' + missed.join(', '));
