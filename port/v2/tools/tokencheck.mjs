/* tokencheck.mjs — THE DEAD-VALUE GATE (D-ART-100, one level down).

   `speccheck` asks "is this FIELD ever read?" and the whole catalogue answers
   yes. It cannot see the defect one level down, which is the same defect:

       row:      'Pika':  { …, earShape: 'nub' }
       painter:  if (earShape === 'point' || earShape === 'tuft') { … }
                 else if (earShape === 'leaf') { … }
                 else { …the 'round' default… }

   The FIELD is read, so speccheck is green. The VALUE has no branch, so the
   row falls silently into somebody else's default and the species wears the
   wrong trait. Every table row that sets it looks correct; the render is the
   only witness. That is the D-ART-100/D-ART-137 signature and it is the
   largest bucket in the gold pass (309 of 473 FAILs are `missing feature`).

   THIS GATE ASKS: for every string-literal token written by a species table,
   does ANY painter compare against that exact value?

   ⚠ A hit is a SUSPECT, not a verdict, and the reason is important: falling to
   an `else` branch is legitimate design when the else IS that token's drawing
   (`earShape:'round'` is the default ear on purpose). The gate cannot tell the
   two apart and does not pretend to — it prints who writes the value so a
   human can render one and look. Distinguishing them by static analysis would
   require understanding the painter, which is exactly the guess that keeps
   producing confident wrong answers here.

   Usage: node tools/tokencheck.mjs [--selftest] [--field=earShape] [--json=out]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'packages', 'art', 'src');

/* Hex colours, class/family routing keys and free prose are not tokens whose
   absence is a drawing bug — they are data the painter consumes wholesale. */
const NOT_A_TOKEN = /^(#|rgb|hsl|\d|[A-Z])/;
/* index.ts is the GALAXY sprite contract, not a species painter — its
   `{ spiral: 'spiral', lenticular: 'lent' }` shorthand map is data with no
   branch by design, and four of them sat in the DEAD tier as pure noise. A
   gate whose output needs a mental filter gets read with one. */
const SKIP_FILES = new Set(['index.ts']);
const SKIP_FIELDS = new Set(['hue', 'name', 'set', 'kingdom', 'note', 'family', 'skull',
  'tailTip', 'billHue', 'legHue', 'coatRgb', 'speciesHue', 'eyeHue', 'accent']);

/** every `field: 'value'` written anywhere in a file, as field → Set(values) */
export function writes(src) {
  const out = new Map();
  for (const m of src.matchAll(/(?:^|[{,]\s*)(\w+)\s*:\s*'([^']{1,28})'/gm)) {
    const [, field, value] = m;
    if (SKIP_FIELDS.has(field) || NOT_A_TOKEN.test(value)) continue;
    if (!out.has(field)) out.set(field, new Set());
    out.get(field).add(value);
  }
  return out;
}

/** every string literal a file COMPARES against, in any form a painter uses:
    ===, !==, a switch case, an array .includes(…), or an object-literal key.

    ⚠ RETURNS PAIRS, NOT A VALUE SET, AND THAT DISTINCTION IS THE WHOLE GATE.
    The first cut pooled every compared value globally, so the moment `bill`
    gained a `=== 'stout'` branch the gate also declared the entirely unrelated
    `stem: 'stout'` alive — it reported 21 → 19 for a fix that cleared one row.
    An instrument that credits a fix to a field it never touched is worse than
    no instrument: it retires suspects nobody looked at. D-ART-140 — suspect a
    new scan before you suspect the code; this scan was wrong within an hour of
    being written, on its own first finding.
    `field` is null when the comparison has no recoverable left-hand name; those
    fall back to matching any field, which is the safe direction (a missed
    suspect is a smaller error than an invented all-clear). */
export function compares(src, known = null) {
  const out = [];
  /* ⚠ SECOND CORRECTION, SAME HOUR. Scoping a comparison by whatever
     identifier sits to its left over-reports just as badly as pooling values
     under-reports: painters rename constantly —
        const pat = opts.pattern ?? …   →   pat === 'saddle'
        coatMaterial(…, spec.mat, …)    →   kind === 'plate'   (in skin.ts)
     and all seven snake patterns, every material and every pupil looked dead.
     A name is only allowed to NARROW a comparison when it is recoverably the
     field: the field itself, or a local alias assigned straight off the spec.
     Anything else stays unscoped and matches any field. Both of this gate's
     errors were the instrument, not the code (D-ART-140), and the first
     version of each looked completely reasonable. */
  const alias = new Map();
  for (const m of src.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=\s*(?:\b(?:spec|opts|o|s)\s*\.\s*)(\w+)/g)) alias.set(m[1], m[2]);
  for (const m of src.matchAll(/\b(?:const|let|var)\s*\{([^}]{1,300})\}\s*=\s*(?:spec|opts|o|s)\b/g)) {
    for (const q of m[1].matchAll(/(\w+)\s*(?::\s*(\w+))?/g)) if (q[1]) alias.set(q[2] || q[1], q[1]);
  }
  /* ⚠ THIRD CORRECTION: a comparison narrows to a field only on PROVEN
     provenance — written `spec.X`, or a local this file assigned off the spec.
     A bare `kind === 'plate'` must not narrow even though `kind` happens to be
     a table field elsewhere: in `skin.ts` it is a PARAMETER holding `spec.mat`,
     and trusting the name marked every material dead. Proof, not coincidence. */
  const resolve = (name, qualified) => {
    if (alias.has(name)) { const f = alias.get(name); return !known || known.has(f) ? f : null; }
    if (qualified) return !known || known.has(name) ? name : null;
    return null;                                  /* bare identifier — unscoped */
  };
  const add = (value, field) => out.push({ value, field: field ?? null });
  /* `spec.bill === 'stout'`, `opts.bill === 'stout'`, or a destructured `bill === 'stout'` */
  for (const m of src.matchAll(/(\b(?:spec|opts|o|s)\s*\.\s*)?\b(\w+)\s*[=!]==\s*'([^']{1,28})'/g)) add(m[3], resolve(m[2], !!m[1]));
  for (const m of src.matchAll(/'([^']{1,28})'\s*[=!]==\s*(\b(?:spec|opts|o|s)\s*\.\s*)?\b(\w+)/g)) add(m[1], resolve(m[3], !!m[2]));
  for (const m of src.matchAll(/case\s+'([^']{1,28})'\s*:/g)) add(m[1], null);
  /* ['a','b'].includes(x) and the x in {a:…} lookup-table form — neither
     carries the field name reliably, so both match any field */
  for (const m of src.matchAll(/\[([^\]\n]{1,200})\]\s*\.\s*includes\s*\(/g)) {
    for (const q of m[1].matchAll(/'([^']{1,28})'/g)) add(q[1], null);
  }
  for (const m of src.matchAll(/\{[^{}\n]{0,400}\}\s*\[/g)) {
    for (const q of m[0].matchAll(/(?:^|[{,]\s*)'?(\w+)'?\s*:/g)) add(q[1], null);
  }
  return out;
}

/** is `value` compared anywhere, either by this exact field or by a
    comparison whose field could not be recovered? */
export function isLive(pairs, field, value) {
  return pairs.some((p) => p.value === value && (p.field === null || p.field === field));
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ck = (n, got, want) => { if (got === want) pass++; else { fail++; console.error('  ✗ ' + n + ' — got ' + JSON.stringify(got)); } };

  /* ★ NEGATIVE CONTROL IN BOTH DIRECTIONS (PROCESS_LAWS): the gate must fire
     on a value with no branch AND stay silent on one that has a branch. Seven
     checks on this project have passed while the thing they guarded was
     broken; a control in one direction only is how that keeps happening. */
  const painter = "if (earShape === 'point') { a(); } else if (earShape === 'leaf') { b(); }";
  ck('a compared value is seen', isLive(compares(painter), 'earShape', 'leaf'), true);
  ck('an uncompared value is not invented', isLive(compares(painter), 'earShape', 'nub'), false);
  ck('a written token is collected', [...writes("'Pika': { earShape: 'nub' }").get('earShape')][0], 'nub');
  ck('a hex hue is not a token', writes("'Fox': { hue: '#c0ffee' }").has('hue'), false);
  ck('switch cases count as comparisons', isLive(compares("switch (t) { case 'saddle': break; }"), 'pattern', 'saddle'), true);
  ck('includes() lists count as comparisons', isLive(compares("['a','zigzag'].includes(p)"), 'pattern', 'zigzag'), true);
  ck('lookup-table keys count as comparisons', isLive(compares("const W = { tent: 1, folded: 2 }[w];"), 'wings', 'tent'), true);
  ck('a value only ever WRITTEN is dead', isLive(compares("const r = { earShape: 'nub' };"), 'earShape', 'nub'), false);

  /* ★ THE FALSE-CLEAR CONTROL — the bug this gate shipped with. Two unrelated
     fields sharing one token value must not resurrect each other. Without
     this pair the gate silently retires suspects when a NEIGHBOUR is fixed. */
  const KNOWN = new Set(['bill', 'stem', 'gills', 'pattern', 'mat', 'earShape']);
  const shared = "if (opts.bill === 'stout') { heavy(); }";
  ck('the field that owns the branch is live', isLive(compares(shared, KNOWN), 'bill', 'stout'), true);
  ck('a different field sharing the value stays dead', isLive(compares(shared, KNOWN), 'stem', 'stout'), false);
  ck('a spec-qualified comparison recovers its field name',
    compares("spec.gills === 'pore'", KNOWN).some((p) => p.field === 'gills' && p.value === 'pore'), true);

  /* ★ THE OVER-REPORT CONTROLS — the gate's second bug. A painter that renames
     the field before switching on it is the NORM here, not the exception. */
  const renamed = "const pat = opts.pattern ?? 'plain';\nif (pat === 'saddle') { x(); }";
  ck('an aliased local resolves back to its field', isLive(compares(renamed, KNOWN), 'pattern', 'saddle'), true);
  const destructured = "const { mat } = spec;\nif (mat === 'plate') { x(); }";
  ck('a destructured field is seen', isLive(compares(destructured, KNOWN), 'mat', 'plate'), true);
  /* a callee's parameter name is unknowable from here — it must not narrow,
     and `kind` is itself a table field elsewhere, which is exactly the trap */
  const callee = "if (kind === 'plate') { rows(); }";
  ck('a bare identifier never narrows, even when it names a real field',
    isLive(compares("if (bill === 'stout') { x(); }", KNOWN), 'stem', 'stout'), true);
  ck('an unknown identifier does not scope the comparison away',
    isLive(compares(callee, KNOWN), 'mat', 'plate'), true);
  ck('…and an unknown identifier still cannot revive a value nobody compares',
    isLive(compares(callee, KNOWN), 'mat', 'nub'), false);

  console.log('tokencheck --selftest: ' + pass + '/' + (pass + fail) + ' controls');
  process.exit(fail ? 1 : 0);
}

const only = (process.argv.find((s) => s.startsWith('--field=')) || '').slice(8);
const jsonOut = (process.argv.find((s) => s.startsWith('--json=')) || '').slice(7);

const files = fs.readdirSync(SRC).filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts') && !SKIP_FILES.has(n));
const src = new Map(files.map((f) => [f, fs.readFileSync(path.join(SRC, f), 'utf8')]));

const written = new Map();   // field → value → Set(files that write it)
for (const [f, s] of src) {
  for (const [field, values] of writes(s)) {
    if (only && field !== only) continue;
    if (!written.has(field)) written.set(field, new Map());
    for (const v of values) {
      if (!written.get(field).has(v)) written.get(field).set(v, new Set());
      written.get(field).get(v).add(f);
    }
  }
}

/* comparisons are collected across the whole tree — a table in one file is
   read by a painter in another — but stay keyed to their field (see above).
   The known-field set has to exist BEFORE the scan, so this runs second. */
const knownFields = new Set();
for (const [, s] of src) for (const field of writes(s).keys()) knownFields.add(field);
const compared = [];
for (const s of src.values()) compared.push(...compares(s, knownFields));

/* ★ TWO TIERS, BECAUSE ONE TIER KEPT BEING A LIE.
   A value can also be written under one field and consumed under another —
   family defaults merge (`spec.earShape ?? FAM.ear`), so `ear: 'round'` is
   compared for its whole life as `ears === 'round'`. Per-field scoping calls
   that dead; pooling calls a genuinely dead value alive. Neither is true, so
   the gate reports both and says which is which:
     DEAD  — this string is not compared ANYWHERE, under any field. Actionable.
     ALIAS — compared, but only under a different field name. Usually a
             defaults merge; occasionally a field the painter forgot to route. */
const anywhere = new Set(compared.map((p) => p.value));
const dead = [], aliased = [];
for (const [field, values] of [...written].sort()) {
  for (const [value, where] of [...values].sort()) {
    if (isLive(compared, field, value)) continue;
    (anywhere.has(value) ? aliased : dead).push({ field, value, files: [...where].sort() });
  }
}

for (const d of dead) console.log('  ★ DEAD    ' + d.field + ": '" + d.value + "'   written in " + d.files.join(', '));
for (const d of aliased) console.log('    alias?  ' + d.field + ": '" + d.value + "'   (compared only under another field)   " + d.files.join(', '));
const nFields = written.size;
const nValues = [...written.values()].reduce((a, m) => a + m.size, 0);
console.log('TOKEN CHECK: ' + nValues + ' token values across ' + nFields + ' fields · '
  + dead.length + ' DEAD · ' + aliased.length + ' alias-suspect');
if (dead.length) {
  console.error('  A value no painter compares against falls to somebody else\'s default (D-ART-100).');
  console.error('  SUSPECTS, not verdicts — an `else` that IS that token\'s drawing is legitimate.');
  console.error('  Render one species per row above and LOOK before changing anything.');
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ dead, aliased }, null, 1));
