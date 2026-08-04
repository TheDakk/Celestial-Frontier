/* familycards.mjs — AUDIT PACKETS GROUPED BY FAMILY (D-ART-147).

   `auditcards.mjs` batches the catalogue ALPHABETICALLY. Gold pass 2 ran that
   way, returned 431 per-asset verdicts, and MISSED THE LARGEST DEFECT IN THE
   CATALOGUE: twelve canids are one animal in twelve colours, and it is a pony;
   twelve felids are that chassis with spots. A judge shown one Tiger against a
   row reading "orange with black stripes, heavy build" ticks stripes, ticks
   orange and lands on POLISH. Twelve felids side by side make it undeniable.

   GOLD_PASS_2026-08-03 §2 had already said it — systemic clusters "are only
   visible because everything was judged in one sitting" — and alphabetical
   batching destroys exactly that signal by construction. A per-asset harness
   cannot see a cross-asset defect.

   The grouping key is `expected_body_family` from Nick's one-by-one engine
   package (reference/nick-onebyone/), which carries it for all 1,233 joinable
   assets. Anything it does not name falls back to its set, so nothing is lost.

   Usage: node tools/familycards.mjs [--per=14] [--min=2]
   Writes: smoke/familycards/<family>/batch-NNN.md + index.json
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const EXPORT = path.join(root, 'apps', 'game', 'smoke', 'species-fullsize');
const OUT = path.join(root, 'apps', 'game', 'smoke', 'familycards');
const CSV = path.join(root, 'reference', 'nick-onebyone', 'engine_data', 'all_1250_current_one_by_one_audit.csv');

const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const PER = Number(arg('per', '14'));

function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/* ── the family key, from Nick's engine ── */
const famOf = new Map();
if (fs.existsSync(CSV)) {
  const raw = parseCSV(fs.readFileSync(CSV, 'utf8'));
  const head = raw[0];
  const iName = head.indexOf('display_name');
  const iFam = head.indexOf('expected_body_family');
  const iGrow = head.indexOf('expected_growth_family');
  const iFruit = head.indexOf('fruiting_body_family');
  /* ⚠ THE FALLBACK CHAIN PICKED UP A STATUS COLUMN. The engine CSV is a union
     of five per-kingdom schemas, so a flora row leaves `expected_body_family`
     empty and the next populated column is not always a family — 22 assets came
     through with the family "PASS". A grouping key that silently absorbs a
     verdict makes a batch of unrelated organisms that all happen to have passed,
     which is the exact opposite of what family batching is for. */
  const NOT_A_FAMILY = /^(PASS|HOLD|FAIL|TRUE|FALSE|HIGH|LOW|MEDIUM|\d+|)$/i;
  let dropped = 0;
  for (const r of raw.slice(1)) {
    if (r.length < 5) continue;
    const fam = [r[iFam], r[iGrow], r[iFruit]].map((s) => (s || '').trim())
      .find((s) => !NOT_A_FAMILY.test(s)) || '';
    if (fam) famOf.set(r[iName].trim(), fam); else dropped++;
  }
  if (dropped) console.log('  (' + dropped + ' rows had no usable family key — they fall back to their set)');
}
console.log('family keys loaded: ' + famOf.size);

/* ── the reference rows, printed under each render ── */
const refOf = {};
for (const f of ['fauna', 'flora', 'other']) {
  const p = path.join(root, 'reference', f + '.json');
  if (!fs.existsSync(p)) continue;
  for (const row of JSON.parse(fs.readFileSync(p, 'utf8'))) refOf[row.name] = row;
}

const unslug = (f) => f.replace(/\.png$/, '').replace(/_/g, ' ');
const assets = [];
for (const set of fs.readdirSync(EXPORT)) {
  const dir = path.join(EXPORT, set);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.png'))) {
    const name = unslug(f);
    assets.push({ name, set, png: path.join(dir, f).split('\\').join('/'), family: famOf.get(name) || ('(unfamilied) ' + set) });
  }
}

const byFamily = new Map();
for (const a of assets) {
  if (!byFamily.has(a.family)) byFamily.set(a.family, []);
  byFamily.get(a.family).push(a);
}

const fmtRef = (name) => {
  const ref = refOf[name];
  if (!ref) return '  reference row: **NONE** (procedural or unlisted — judge coherence, and judge it against the others in this batch)';
  return Object.entries(ref).filter(([k]) => k !== 'name')
    .map(([k, v]) => '  ' + k + ': ' + (Array.isArray(v) ? v.join(' · ') : String(v))).join('\n');
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const index = [];
const slug = (s) => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 48);

for (const [family, members] of [...byFamily].sort((a, b) => b[1].length - a[1].length)) {
  members.sort((a, b) => a.name.localeCompare(b.name));
  const dir = path.join(OUT, slug(family));
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < members.length; i += PER) {
    const slice = members.slice(i, i + PER);
    const id = String(Math.floor(i / PER) + 1).padStart(3, '0');
    const body = [
      `# FAMILY AUDIT — ${family}  (batch ${id}, ${slice.length} of ${members.length})`,
      '',
      '★ THESE ORGANISMS ARE ONE FAMILY AND ARE BATCHED TOGETHER ON PURPOSE.',
      'Read EVERY png below and LOOK at it. Judge each against its own reference row —',
      'AND against the others here. The question a per-asset audit cannot ask is the one',
      'that matters most:',
      '',
      '  ⚠ DO THESE SHARE ONE BODY? If the family is drawn on a single chassis with only',
      '    colour and markings changed, say so explicitly, name the shared parts (topline,',
      '    limb form, foot, skull, neck carriage), and say what the chassis actually READS',
      '    as — an audit that missed exactly this reported twelve canids as individually',
      '    acceptable when together they are one pony in twelve colours.',
      '',
      `  Family size here: ${members.length}.`,
      '',
    ].concat(slice.map((a, k) => [
      `## ${k + 1}. ${a.name}   [${a.set}]`,
      '  png: ' + a.png,
      fmtRef(a.name),
    ].join('\n')));
    const file = path.join(dir, 'batch-' + id + '.md');
    fs.writeFileSync(file, body.join('\n') + '\n');
    index.push({ family, id, file: file.split('\\').join('/'), size: members.length, names: slice.map((a) => a.name) });
  }
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
const big = [...byFamily].filter(([, m]) => m.length >= 6).sort((a, b) => b[1].length - a[1].length);
console.log(assets.length + ' assets · ' + byFamily.size + ' families · ' + index.length + ' batches of ' + PER);
console.log('largest families (the ones a chassis defect hides in):');
for (const [f, m] of big.slice(0, 12)) console.log('   ' + String(m.length).padStart(4) + '  ' + f);
