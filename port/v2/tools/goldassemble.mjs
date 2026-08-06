/* goldassemble.mjs — build goldpass3-results.json from the family sweep.

   The sweep writes two piles of per-agent JSON: one file per FAMILY BATCH from
   the judge, one file per FAIL from the adversarial verifier. This joins them
   into the row shape `goldcompare.mjs` already reads.

   ★ THE JOIN IS `species`, VERBATIM, AND IT IS CHECKED. The code pass's
   verification never ran because its hunt→verdict join keyed on a free-text
   `claim` the verifier rephrased, and every finding in codepass-findings.json
   is hunt-stage only as a result (D-ART, the harness bug the gold pass fixed).
   So this tool REPORTS its join failures instead of silently dropping them: an
   unjoined verdict is a verification that did not happen, which is exactly the
   state that looked like success last time.

   ⚠ It also refuses to invent coverage. Batches that never produced a judge
   file are listed by name, and their assets are absent from the output rather
   than defaulted to a band — a missing judgement is not a PASS.

   Usage: node tools/goldassemble.mjs [--out=reference/goldpass3-results.json]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const OUT = path.join(root, 'apps', 'game', 'smoke', 'goldpass3');
const IDX = path.join(root, 'apps', 'game', 'smoke', 'familycards', 'index.json');
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const DEST = path.join(root, arg('out', 'reference/goldpass3-results.json'));

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return { __err: String(e.message || e) }; } };
const BANDS = new Set(['FAIL', 'POLISH', 'PASS']);

/* ── what the sweep was SUPPOSED to cover ── */
const index = readJson(IDX);
const expected = new Map();               /* batchKey -> [species] */
for (const b of index) expected.set(b.family.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 48) + '--' + b.id, b.names);

/* ── the judge pile ── */
const rows = [];
const seen = new Map();                   /* species -> row */
const badJudge = [];
const judgeDir = path.join(OUT, 'judge');
const judgeFiles = fs.existsSync(judgeDir) ? fs.readdirSync(judgeDir).filter((f) => f.endsWith('.json')) : [];
const chassis = [];
for (const f of judgeFiles) {
  const j = readJson(path.join(judgeDir, f));
  if (j.__err || !Array.isArray(j.rows)) { badJudge.push(f + ' — ' + (j.__err || 'no rows[]')); continue; }
  chassis.push({ batch: j.batch || f.replace(/\.json$/, ''), family: j.family || '', oneChassis: !!j.oneChassis, verdict: j.chassisVerdict || '' });
  for (const r of j.rows) {
    if (!r || typeof r.species !== 'string' || !BANDS.has(r.band)) { badJudge.push(f + ' — malformed row ' + JSON.stringify(r).slice(0, 80)); continue; }
    /* an asset judged twice (a batch re-run) keeps the FIRST verdict, and the
       duplicate is reported — silently overwriting would make a re-run look
       like new coverage */
    if (seen.has(r.species)) { badJudge.push(f + ' — DUPLICATE species ' + r.species); continue; }
    const row = {
      species: r.species, band: r.band, readsAs: r.readsAs || '', defect: r.defect || '',
      /* ⚠ the packet prints the set as "[earth-fauna]" and some judges copied
         the brackets. Left alone that silently SPLITS every per-set total —
         `earth-fauna` and `[earth-fauna]` are different keys — so the control
         table that decides whether the ruler moved would be computed over a
         fraction of each set. Normalise here, not in the report. */
      fix: r.fix || '', verified: false, verifyWhy: '', batch: j.batch || '',
      set: String(r.set || '').replace(/^\[|\]$/g, '').trim(),
      family: j.family || '',
    };
    seen.set(r.species, row); rows.push(row);
  }
}

/* ── the verify pile, joined on species VERBATIM ── */
const verifyDir = path.join(OUT, 'verify');
const verifyFiles = fs.existsSync(verifyDir) ? fs.readdirSync(verifyDir).filter((f) => f.endsWith('.json')) : [];
const unjoined = [];
let overturned = 0, upheld = 0;
for (const f of verifyFiles) {
  const v = readJson(path.join(verifyDir, f));
  if (v.__err || typeof v.species !== 'string') { unjoined.push(f + ' — ' + (v.__err || 'no species')); continue; }
  const row = seen.get(v.species);
  if (!row) { unjoined.push(f + ' — no judge row for "' + v.species + '"'); continue; }
  row.verified = true;
  row.verifyWhy = v.verifyWhy || '';
  /* the verifier's band WINS. It looked second, with the claim in hand, and it
     was told not to uphold out of deference — that is the whole point of the
     adversarial stage. */
  if (BANDS.has(v.band) && v.band !== row.band) { row.band = v.band; overturned++; } else upheld++;
}

/* ── coverage, stated honestly ── */
const missingBatches = [...expected.keys()].filter((k) => !chassis.some((c) => c.batch === k));
const covered = new Set(rows.map((r) => r.species));
const missingSpecies = [];
for (const [k, names] of expected) for (const n of names) if (!covered.has(n)) missingSpecies.push(k + ' / ' + n);

const tally = { FAIL: 0, POLISH: 0, PASS: 0 };
for (const r of rows) tally[r.band]++;

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, JSON.stringify({
  generated: 'family sweep (goldpass3)',
  judged: rows.length,
  bands: tally,
  verifiedRows: rows.filter((r) => r.verified).length,
  overturned,
  coverage: { expectedBatches: expected.size, judgedBatches: chassis.length, missingBatches, missingSpecies: missingSpecies.length },
  chassis,
  rows,
}, null, 1));

console.log('GOLD PASS 3 — assembled from the family sweep');
console.log('  judged        ' + rows.length + ' of 1250 assets   (' + chassis.length + ' of ' + expected.size + ' batches)');
console.log('  bands         FAIL ' + tally.FAIL + ' · POLISH ' + tally.POLISH + ' · PASS ' + tally.PASS);
console.log('  verified      ' + rows.filter((r) => r.verified).length + ' rows  (' + upheld + ' upheld, ' + overturned + ' overturned by the refuter)');
console.log('  families      ' + chassis.length + ' judged · ' + chassis.filter((c) => c.oneChassis).length + ' reported as ONE SHARED CHASSIS');
if (missingBatches.length) {
  console.log('\n  ⚠ ' + missingBatches.length + ' batches never produced a judge file — their ' + missingSpecies.length + ' assets are ABSENT, not passed:');
  for (const b of missingBatches.slice(0, 20)) console.log('      ' + b);
  if (missingBatches.length > 20) console.log('      … and ' + (missingBatches.length - 20) + ' more');
}
if (unjoined.length) {
  console.log('\n  ⚠ ' + unjoined.length + ' verdicts did NOT join — a verification that did not happen:');
  for (const u of unjoined.slice(0, 12)) console.log('      ' + u);
}
if (badJudge.length) {
  console.log('\n  ⚠ ' + badJudge.length + ' malformed/duplicate judge entries:');
  for (const b of badJudge.slice(0, 12)) console.log('      ' + b);
}
console.log('\nwrote ' + path.relative(root, DEST));
