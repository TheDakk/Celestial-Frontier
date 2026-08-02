/* speccheck.mjs — THE INERT-OPTION GATE (D-ART-100).

   `FishSpec.hue` existed for two waves, documented "only where colour IS the
   identity", and the painter opened with:

       const p: Pal = spec.hue ? { ...pIn } : pIn;

   which COPIED the palette when a hue was set and never applied it. Every fish
   in the catalogue silently took its rarity roll instead. Nothing failed —
   `artaudit` does not look for this, because the field IS referenced — and the
   defect survived because every table row that set `hue` looked correct, so
   nobody read the painter.

   An inert option is worse than a missing one. A missing option fails to
   compile the moment a row uses it; an inert one absorbs the row, the review
   and the intent, and reports success.

   THIS GATE ASKS TWO QUESTIONS OF EVERY PAINTER SPEC:
     1. is each declared field ever READ at all?
     2. of the fields that ARE read, is any of them read exactly once, in a
        position where the read cannot change the drawing — assigned to a
        variable that is then never used, or used only to pick between two
        values that are the same?

   (2) is the one that would have caught the hue bug, and it is deliberately
   narrow: it reports suspects for a human to look at rather than pretending to
   understand the painter.

   Usage: node tools/speccheck.mjs [--selftest]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'packages', 'art', 'src');

/* ⚠ THE FIRST CUT OF THIS GATE SCANNED ONLY NAMED `interface *Spec` BLOCKS, and
   most painters in this codebase declare their options as an INLINE object type
   in the parameter list instead. Minutes after writing the gate I added two
   inert fields — myriapod.segs and sessileBody.pores — and it reported the tree
   clean: the exact bug it exists to catch, sitting in the exact blind spot it
   had. It reads both forms now. A gate that covers a third of the surface it
   claims to cover is not a gate, it is a false assurance. */

/** every option bag in a file — named `interface <X>Spec { … }` AND the inline
    `opts: { … }` form — with its declared field names */
function specsIn(src) {
  const out = [];
  for (const m of src.matchAll(/\b(?:opts|spec)\s*:\s*\{(?:[^{}]|\{[^{}]*\})*\}/g)) {
    const body = m[0].slice(m[0].indexOf('{') + 1, -1);
    const fields = [...new Set([...body.matchAll(/(?:^|[;{,]\s*)(\w+)\s*\??\s*:/g)].map((f) => f[1]))];
    if (fields.length) out.push({ name: '(inline)', fields });
  }
  const re = /(?:export\s+)?interface\s+(\w*Spec\w*)\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    /* walk braces so nested objects and comments cannot end the block early */
    let i = re.lastIndex, depth = 1;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    const body = src.slice(re.lastIndex, i - 1);
    const fields = [...new Set([...body.matchAll(/^\s{2}(\w+)\s*\??\s*:/gm)].map((f) => f[1]))];
    out.push({ name: m[1], fields });
  }
  return out;
}

/** how many times a field is read off ANY plausible spec parameter name */
function reads(src, field) {
  const re = new RegExp('\\b(?:spec|opts|o|s)\\.' + field + '\\b', 'g');
  return (src.match(re) || []).length;
}

/** a read that lands in `X ? { ...Y } : Y` — the exact shape of the hue bug:
    a ternary whose two arms produce the same thing */
function inertTernary(src, field) {
  const re = new RegExp('\\b(?:spec|opts|o|s)\\.' + field + '\\s*\\?\\s*([^:;\\n]+):\\s*([^;\\n]+)');
  const m = re.exec(src);
  if (!m) return null;
  const a = m[1].replace(/[\s{}.]|\.\.\./g, '');
  const b = m[2].replace(/[\s{}.]|\.\.\./g, '');
  return a === b ? m[0].trim().slice(0, 76) : null;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ck = (n, got, want) => { if (got === want) pass++; else { fail++; console.error('  ✗ ' + n); } };
  const good = 'interface FSpec {\n  hue?: string;\n}\nconst q = spec.hue ? mk(spec.hue) : base;';
  /* the real bug, verbatim in shape */
  const bad = 'interface FSpec {\n  hue?: string;\n}\nconst p: Pal = spec.hue ? { ...pIn } : pIn;';
  const missing = 'interface FSpec {\n  hue?: string;\n}\nconst p = pIn;';
  ck('the hue bug is caught', inertTernary(bad, 'hue') !== null, true);
  ck('a real ternary is not flagged', inertTernary(good, 'hue') !== null, false);
  ck('an unread field is counted as zero reads', reads(missing, 'hue'), 0);
  ck('a read field is counted', reads(good, 'hue'), 2);
  ck('fields are found through nested braces',
    specsIn('interface XSpec {\n  a?: { k: number };\n  b?: string;\n}')[0].fields.join(','), 'a,b');
  console.log('speccheck --selftest: ' + pass + '/' + (pass + fail) + ' controls');
  process.exit(fail ? 1 : 0);
}

let dead = 0, suspect = 0, total = 0;
for (const f of fs.readdirSync(SRC).filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts'))) {
  const src = fs.readFileSync(path.join(SRC, f), 'utf8');
  for (const spec of specsIn(src)) {
    for (const field of spec.fields) {
      total++;
      const n = reads(src, field);
      if (n === 0) {
        /* it may be read in a DIFFERENT file — the spec is often exported */
        let elsewhere = 0;
        for (const g of fs.readdirSync(SRC).filter((x) => x.endsWith('.ts'))) {
          if (g === f) continue;
          elsewhere += reads(fs.readFileSync(path.join(SRC, g), 'utf8'), field);
        }
        if (elsewhere === 0) { dead++; console.log('  ★ NEVER READ   ' + spec.name + '.' + field + '   (' + f + ')'); }
        continue;
      }
      const t = inertTernary(src, field);
      if (t) { suspect++; console.log('  ★ INERT        ' + spec.name + '.' + field + '   ' + t + '   (' + f + ')'); }
    }
  }
}
console.log('SPEC CHECK: ' + total + ' declared fields · ' + dead + ' never read · ' + suspect + ' inert');
if (dead || suspect) {
  console.error('  A declared option that cannot change the drawing absorbs every row that sets it');
  console.error('  and reports success (D-ART-100). Wire it, or delete it.');
}
process.exit(dead || suspect ? 1 : 0);
