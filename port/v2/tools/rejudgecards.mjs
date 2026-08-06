/* rejudgecards.mjs — THE CHEAP RE-CHECK (wave 57).

   The full family sweep (familycards + goldpass) was the right instrument ONCE:
   to find the shared-chassis defect that alphabetical batching hid (D-ART-147).
   That discovery is done. Re-running a 1,250-asset judge plus a ~670-agent
   adversarial verify every time we want to MEASURE PROGRESS costs ~15M tokens
   and runs straight into the session limit. It is the wrong tool for a delta.

   Three things make a re-check cheap, and all three are free of model tokens:

   1. SCOPE TO DRIFT. artlock's fingerprint says exactly which assets changed
      since the baseline was judged. An asset whose pixels are byte-identical
      cannot have a different verdict, so it keeps its baseline band and is
      never sent to a model. Typically ~150 of 1,250 moved, i.e. ~8x fewer.

   2. ONE CONTACT SHEET PER FAMILY. The old judge opened 14 full 440x440 PNGs
      per batch; images dominate the token bill. Here each family group is ONE
      labelled strip the judge reads once — ~14x fewer image payloads, and
      side-by-side is strictly better for the chassis question anyway.

   3. NO STANDALONE VERIFY PASS. The adversarial second pass doubled the cost
      to overturn ~1.5% of verdicts. For a progress delta that is not worth it;
      the judge is told to be its own skeptic in one pass. (Keep the full
      adversarial pass only for a final certification.)

   Usage: node tools/rejudgecards.mjs
   Reads : reference/drift-since-baseline.json  (set|name rows)
           reference/goldpass3-prechassis.json        (baseline verdicts)
   Writes: apps/game/smoke/rejudge/<family>/strip.png + packet.md + index.json
*/
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const OUT = path.join(root, 'apps', 'game', 'smoke', 'rejudge');
const CSV = path.join(root, 'reference', 'nick-onebyone', 'engine_data', 'all_1250_current_one_by_one_audit.csv');
const PER = 14;   /* a strip stays legible up to ~14 wide */

/* ── the drift set: what actually changed since the baseline ── */
const drift = JSON.parse(fs.readFileSync(path.join(root, 'reference/drift-since-baseline.json'), 'utf8'));
console.log('drift set: ' + drift.length + ' assets changed since the baseline');

/* ── baseline verdicts, so the packet can show what each WAS ── */
const base = JSON.parse(fs.readFileSync(path.join(root, 'reference/goldpass3-prechassis.json'), 'utf8'));
const wasBand = new Map((base.rows || base).map((r) => [r.species, r.band]));

/* ── family key + reference rows, same sources as familycards ── */
function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') q = false; else field += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else if (ch !== '\r') field += ch; }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const famOf = new Map();
if (fs.existsSync(CSV)) {
  const raw = parseCSV(fs.readFileSync(CSV, 'utf8')); const head = raw[0];
  const iN = head.indexOf('display_name'), iF = head.indexOf('expected_body_family'),
    iG = head.indexOf('expected_growth_family'), iFr = head.indexOf('fruiting_body_family');
  const NOT_A_FAMILY = /^(PASS|POLISH|HOLD|FAIL|TRUE|FALSE|HIGH|LOW|MEDIUM|N\/?A|NONE|UNKNOWN|\d+|)$/i;
  for (const r of raw.slice(1)) { if (r.length < 5) continue;
    const fam = [r[iF], r[iG], r[iFr]].map((s) => (s || '').trim()).find((s) => !NOT_A_FAMILY.test(s)) || '';
    if (fam) famOf.set(r[iN].trim(), fam); }
}
const refOf = {};
for (const f of ['fauna', 'flora', 'other']) {
  const p = path.join(root, 'reference', f + '.json'); if (!fs.existsSync(p)) continue;
  for (const row of JSON.parse(fs.readFileSync(p, 'utf8'))) refOf[row.name] = row;
}

/* ── group the drift by family ── */
const byFamily = new Map();
for (const a of drift) {
  const fam = famOf.get(a.name) || ('(unfamilied) ' + a.set);
  if (!byFamily.has(fam)) byFamily.set(fam, []);
  byFamily.get(fam).push(a);
}

const slug = (s) => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 48);
const fmtRef = (name) => {
  const ref = refOf[name];
  if (!ref) return '    reference: none (procedural/unlisted — judge by eye)';
  return Object.entries(ref).filter(([k]) => k !== 'name')
    .map(([k, v]) => '    ' + k + ': ' + (Array.isArray(v) ? v.join(' · ') : String(v))).join('\n');
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const index = [];
let batches = 0;
for (const [family, members] of [...byFamily].sort((a, b) => b[1].length - a[1].length)) {
  members.sort((a, b) => a.name.localeCompare(b.name));
  for (let i = 0; i < members.length; i += PER) {
    const slice = members.slice(i, i + PER);
    const id = String(Math.floor(i / PER) + 1).padStart(2, '0');
    const dir = path.join(OUT, slug(family)); fs.mkdirSync(dir, { recursive: true });
    const strip = path.join(dir, 'strip-' + id + '.png');
    /* render ONE labelled strip for the whole group — the only cost is a local
       browser render, no model tokens */
    execSync('node ' + JSON.stringify(path.join(here, 'speciesstrip.mjs')) + ' '
      + JSON.stringify(slice.map((a) => a.name).join(',')) + ' '
      + JSON.stringify('rejudge/' + slug(family) + '/strip-' + id + '.png'),
      { cwd: root, stdio: 'ignore' });
    const body = [
      '# RE-CHECK — ' + family + '  (' + slice.length + ' changed asset' + (slice.length > 1 ? 's' : '') + ')',
      '',
      'These are the ONLY assets in this family whose art changed since the last',
      'judgement. Read the ONE strip below and look at each. For each asset give a',
      'band (PASS / POLISH / FAIL) and one short reason. Be your own skeptic — if a',
      'must-read is missing say FAIL; do not grade up out of politeness. You do NOT',
      'need to open anything else; the strip is the whole task.',
      '',
      '  strip: ' + strip.split('\\').join('/'),
      '',
    ].concat(slice.map((a, k) => [
      '## ' + (k + 1) + '. ' + a.name + '   [' + a.set + ']   (was: ' + (wasBand.get(a.name) || '—') + ')',
      fmtRef(a.name),
    ].join('\n')));
    const file = path.join(dir, 'packet-' + id + '.md');
    fs.writeFileSync(file, body.join('\n') + '\n');
    index.push({ family, id, strip: strip.split('\\').join('/'), packet: file.split('\\').join('/'),
      species: slice.map((a) => ({ name: a.name, set: a.set, was: wasBand.get(a.name) || null })) });
    batches++;
    process.stdout.write('.');
  }
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
console.log('\n' + drift.length + ' assets · ' + byFamily.size + ' families · ' + batches + ' strips (one image each)');
console.log('a judge reads ' + batches + ' images total, versus ~' + (197 * 14) + ' in the full sweep');
