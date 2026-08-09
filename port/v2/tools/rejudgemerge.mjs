/* rejudgemerge.mjs — fold a cheap drift re-judge into the carried baseline.

   The cheap re-check (rejudgecards + goldpass4-rejudge-cheap) only judges the
   assets whose pixels changed. Everything else keeps its baseline verdict,
   because identical pixels cannot have a different verdict. This joins the two
   on `species` and writes the full 1,250-row post-edit picture, plus the delta
   that actually answers "did the edits move the needle".

   ⚠⚠ AND IT REFUSES TO HEADLINE A DELTA WITHOUT A CONTROL (D-ART-158).
   Scoping to drift removes the one check that has caught the same mistake twice
   (D-ART-150): every asset judged is one we edited, so a harsher judge and a
   real regression are the same number. Pass --control=<the same judge run on
   UNCHANGED family-matched assets, from tools/rejudgecontrol.mjs>. The delta
   that means anything is DRIFT SHIFT MINUS CONTROL SHIFT, and because an asset
   already at FAIL cannot fall further, the honest form of it is the DEMOTION
   RATE among assets that had somewhere to fall.

   Usage: node tools/rejudgemerge.mjs [--fresh=reference/goldpass4-rejudge.json]
                                      [--base=reference/goldpass3-prechassis.json]
                                      [--control=reference/goldpass4-control.json]
                                      [--out=reference/goldpass4-results.json]
   `fresh` is the {rows:[{species,band,...}]} the re-judge workflow returned.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProceduralNameBridge } from './proceduralnames.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FRESH = path.join(root, arg('fresh', 'reference/goldpass4-rejudge.json'));
const BASE = path.join(root, arg('base', 'reference/goldpass3-prechassis.json'));
const OUT = path.join(root, arg('out', 'reference/goldpass4-results.json'));
const proceduralNames = loadProceduralNameBridge(root);

const base = JSON.parse(fs.readFileSync(BASE, 'utf8'));
const baseRows = base.rows || base;
const fresh = JSON.parse(fs.readFileSync(FRESH, 'utf8'));
const freshRows = fresh.rows || fresh;
const freshBy = new Map(freshRows.map((r) => {
  const species = proceduralNames.canonicalAny(r.species);
  return [species, { ...r, species }];
}));
if (freshBy.size !== freshRows.length) {
  throw new Error(`fresh re-judge contains duplicate canonical species (${freshRows.length} rows, ${freshBy.size} identities)`);
}

/* the drift set is the authority on WHAT was re-judged; anything in it that the
   re-judge did not return is a hole we must report, never silently keep-stale */
const drift = new Set(JSON.parse(fs.readFileSync(path.join(root, 'reference/drift-since-baseline.json'), 'utf8'))
  .map((d) => proceduralNames.canonicalName(d.set, d.name)));

const out = [];
const changed = [];
const stale = [];
for (const b of baseRows) {
  const f = freshBy.get(b.species);
  if (f) {
    out.push({ ...b, band: f.band, why: f.why || '', rejudged: true });
    if (f.band !== b.band) changed.push(b.species + ': ' + b.band + ' -> ' + f.band);
  } else {
    if (drift.has(b.species)) stale.push(b.species);   /* drifted but no fresh verdict */
    out.push({ ...b, rejudged: false });
  }
}
const baseNames = new Set(baseRows.map((row) => row.species));
const unknownFresh = [...freshBy.keys()].filter((species) => !baseNames.has(species));
if (unknownFresh.length) {
  throw new Error(`fresh re-judge has ${unknownFresh.length} species absent from the baseline: ${unknownFresh.slice(0, 12).join(', ')}`);
}
if (stale.length) {
  throw new Error(`${stale.length} drifted assets have no fresh verdict: ${stale.slice(0, 12).join(', ')}`);
}

const tally = (rows) => { const t = { FAIL: 0, POLISH: 0, PASS: 0 }; for (const r of rows) t[r.band] = (t[r.band] || 0) + 1; return t; };
const tb = tally(baseRows), to = tally(out);

/* ── the control: the same judge on assets whose pixels did NOT change ── */
const CTL = arg('control', 'reference/goldpass4-control.json');
const ctlPath = path.join(root, CTL);
const control = fs.existsSync(ctlPath) ? (JSON.parse(fs.readFileSync(ctlPath, 'utf8')).rows) : null;
const baseBy = new Map(baseRows.map((r) => [r.species, r]));
/* an asset already at FAIL has nowhere to fall, so a raw FAIL% shift is biased
   by wherever each group started. Rate it among the ones that COULD move. */
const rates = (rows) => {
  const had = rows.filter((r) => baseBy.get(r.species) && baseBy.get(r.species).band !== 'FAIL');
  const wasF = rows.filter((r) => baseBy.get(r.species) && baseBy.get(r.species).band === 'FAIL');
  return { n: rows.length, demN: had.length, dem: had.filter((r) => r.band === 'FAIL').length,
    resN: wasF.length, res: wasF.filter((r) => r.band !== 'FAIL').length };
};

fs.writeFileSync(OUT, JSON.stringify({
  generated: 'drift re-judge merged into carried baseline',
  '⚠ MIXED RULER': 'rejudged rows were graded by a DIFFERENT harness than the carried rows. '
    + 'The band TOTALS in this file are not a measurement of anything. Use the per-asset prose '
    + 'and the control-corrected demotion rates; see reference/GOLD_PASS_4.md (D-ART-158).',
  rows: out, bands: to, rejudged: freshRows.length, staleDrift: stale,
  control: control ? path.relative(root, ctlPath) : null }, null, 1));

const line = (l, t) => l.padEnd(14) + ' FAIL ' + String(t.FAIL).padStart(4) + ' · POLISH ' + String(t.POLISH).padStart(4) + ' · PASS ' + String(t.PASS).padStart(4);
console.log('DRIFT RE-JUDGE — fresh verdicts merged into the carried baseline\n');
console.log('  ' + freshRows.length + ' assets re-judged · ' + (baseRows.length - freshRows.length) + ' carried forward (pixels unchanged)\n');
console.log(line('  baseline', tb));
console.log(line('  now', to));
console.log(line('  raw delta', { FAIL: to.FAIL - tb.FAIL, POLISH: to.POLISH - tb.POLISH, PASS: to.PASS - tb.PASS }));

if (!control) {
  console.log('\n  ⚠⚠ NO CONTROL RUN — the raw delta above is NOT a measurement of the art.');
  console.log('     Every asset judged is one we edited, so a harsher judge and a real');
  console.log('     regression produce the identical number (D-ART-150, three times now).');
  console.log('     Build one:  node tools/rejudgecontrol.mjs && node tools/rejudgecards.mjs --control');
  console.log('     then judge those strips with the SAME prompt and pass --control=<results>.');
} else {
  const d = rates(freshRows), c = rates(control);
  const pc = (a, b) => (b ? (100 * a / b).toFixed(0) : '—').padStart(3) + '%';
  console.log('\n  THE CONTROL — same judge, ' + c.n + ' family-matched assets whose pixels did NOT change\n');
  console.log('                        demoted (had room to fall)     rescued (was FAIL)');
  console.log('    drift   (edited)    ' + pc(d.dem, d.demN) + '  (' + d.dem + '/' + d.demN + ')'.padEnd(9)
    + '        ' + pc(d.res, d.resN) + '  (' + d.res + '/' + d.resN + ')');
  console.log('    control (untouched) ' + pc(c.dem, c.demN) + '  (' + c.dem + '/' + c.demN + ')'.padEnd(9)
    + '        ' + pc(c.res, c.resN) + '  (' + c.res + '/' + c.resN + ')');
  const net = (100 * d.dem / d.demN) - (100 * c.dem / c.demN);
  console.log('\n    net of the ruler: ' + (net >= 0 ? '+' : '') + net.toFixed(0) + ' points of demotion'
    + (Math.abs(net) < 15 ? '  — INDISTINGUISHABLE FROM ZERO at this n.' : ''));
  console.log('    ⚠ The band totals above are a MIXED RULER (' + freshRows.length + ' rows new harness, '
    + (baseRows.length - freshRows.length) + ' rows old).');
  console.log('      Do not quote them as a catalogue score. Quote the demotion rates.');
}

console.log('\n  band crossings among the re-judged: ' + changed.length);
for (const s of changed.slice(0, 60)) console.log('      ' + s);
console.log('\nwrote ' + path.relative(root, OUT));
