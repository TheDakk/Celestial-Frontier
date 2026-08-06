/* rejudgemerge.mjs — fold a cheap drift re-judge into the carried baseline.

   The cheap re-check (rejudgecards + goldpass4-rejudge-cheap) only judges the
   assets whose pixels changed. Everything else keeps its baseline verdict,
   because identical pixels cannot have a different verdict. This joins the two
   on `species` and writes the full 1,250-row post-edit picture, plus the delta
   that actually answers "did the edits move the needle".

   Usage: node tools/rejudgemerge.mjs [--fresh=reference/goldpass4-rejudge.json]
                                      [--base=reference/goldpass3-prechassis.json]
                                      [--out=reference/goldpass4-results.json]
   `fresh` is the {rows:[{species,band,...}]} the re-judge workflow returned.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FRESH = path.join(root, arg('fresh', 'reference/goldpass4-rejudge.json'));
const BASE = path.join(root, arg('base', 'reference/goldpass3-prechassis.json'));
const OUT = path.join(root, arg('out', 'reference/goldpass4-results.json'));

const base = JSON.parse(fs.readFileSync(BASE, 'utf8'));
const baseRows = base.rows || base;
const fresh = JSON.parse(fs.readFileSync(FRESH, 'utf8'));
const freshRows = fresh.rows || fresh;
const freshBy = new Map(freshRows.map((r) => [r.species, r]));

/* the drift set is the authority on WHAT was re-judged; anything in it that the
   re-judge did not return is a hole we must report, never silently keep-stale */
const drift = new Set(JSON.parse(fs.readFileSync(path.join(root, 'reference/drift-since-baseline.json'), 'utf8')).map((d) => d.name));

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

const tally = (rows) => { const t = { FAIL: 0, POLISH: 0, PASS: 0 }; for (const r of rows) t[r.band] = (t[r.band] || 0) + 1; return t; };
const tb = tally(baseRows), to = tally(out);
fs.writeFileSync(OUT, JSON.stringify({ generated: 'drift re-judge merged into carried baseline', rows: out,
  bands: to, rejudged: freshRows.length, staleDrift: stale }, null, 1));

const line = (l, t) => l.padEnd(14) + ' FAIL ' + String(t.FAIL).padStart(4) + ' · POLISH ' + String(t.POLISH).padStart(4) + ' · PASS ' + String(t.PASS).padStart(4);
console.log('GOLD PASS 4 — cheap drift re-judge merged into the carried baseline\n');
console.log('  ' + freshRows.length + ' assets re-judged · ' + (baseRows.length - freshRows.length) + ' carried forward (pixels unchanged)\n');
console.log(line('  baseline', tb));
console.log(line('  now', to));
console.log(line('  delta', { FAIL: to.FAIL - tb.FAIL, POLISH: to.POLISH - tb.POLISH, PASS: to.PASS - tb.PASS }));
console.log('\n  band crossings among the re-judged: ' + changed.length);
for (const s of changed.slice(0, 60)) console.log('      ' + s);
if (stale.length) console.log('\n  ⚠ ' + stale.length + ' drifted assets got NO fresh verdict (re-run those strips): ' + stale.slice(0, 12).join(', '));
console.log('\nwrote ' + path.relative(root, OUT));
