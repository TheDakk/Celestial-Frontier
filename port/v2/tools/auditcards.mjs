/* auditcards.mjs — THE VISUAL AUDIT MANIFEST.

   The proportion arc's whole premise was that nobody could look at the art.
   That was WRONG: the exported portraits are PNGs on disk, and a vision
   model reads them directly. This builds the work packets for that audit —
   one card per organism carrying its render path and its reference row, so
   the agent judging it compares the PICTURE against the STATED ANATOMY
   rather than against its own memory of the species.

   Usage:
     node tools/auditcards.mjs <group> [--exclude=file.json] [--only=file.json] [--per=8]
   Groups: fauna | flora | fungi | microbe | procedural
   Writes: smoke/auditcards/<group>/batch-NNN.md  + index.json
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const EXPORT = path.join(root, 'apps', 'game', 'smoke', 'species-fullsize');
const OUT = path.join(root, 'apps', 'game', 'smoke', 'auditcards');

const group = process.argv[2];
if (!group) { console.error('usage: node tools/auditcards.mjs <fauna|flora|fungi|microbe|procedural> [--exclude=f] [--only=f] [--per=N]'); process.exit(2); }
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const per = Number(arg('per', '8'));
const exFile = arg('exclude', null), onlyFile = arg('only', null);
const exclude = new Set(exFile ? JSON.parse(fs.readFileSync(exFile, 'utf8')) : []);
const only = onlyFile ? new Set(JSON.parse(fs.readFileSync(onlyFile, 'utf8'))) : null;

const dir = path.join(EXPORT, group === 'procedural' ? 'procedural' : 'earth-' + group);
if (!fs.existsSync(dir)) { console.error('no export dir: ' + dir); process.exit(2); }

/* the reference tables are keyed by exact catalog name */
const refOf = {};
for (const f of ['fauna', 'flora', 'other']) {
  const p = path.join(root, 'reference', f + '.json');
  if (!fs.existsSync(p)) continue;
  for (const row of JSON.parse(fs.readFileSync(p, 'utf8'))) refOf[row.name] = row;
}

/* the export writes Name_With_Underscores.png */
const unslug = (f) => f.replace(/\.png$/, '').replace(/_/g, ' ');
let files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
let rows = files.map((f) => ({ file: f, name: unslug(f), png: path.join(dir, f) }));
rows = rows.filter((r) => !exclude.has(r.name) && (!only || only.has(r.name)));

const fmtRef = (r) => {
  const ref = refOf[r.name];
  if (!ref) return '  reference row: **NONE** (procedural or unlisted — judge against the name and against the rest of the batch)';
  return Object.entries(ref).filter(([k]) => k !== 'name')
    .map(([k, v]) => '  ' + k + ': ' + (Array.isArray(v) ? v.join(' · ') : String(v))).join('\n');
};

fs.mkdirSync(path.join(OUT, group), { recursive: true });
for (const f of fs.readdirSync(path.join(OUT, group))) fs.unlinkSync(path.join(OUT, group, f));

const batches = [];
for (let i = 0; i < rows.length; i += per) {
  const slice = rows.slice(i, i + per);
  const id = String(batches.length + 1).padStart(3, '0');
  const body = ['# VISUAL AUDIT BATCH ' + group + '/' + id + '  (' + slice.length + ' organisms)',
    '',
    'Read EVERY png below with the Read tool and LOOK at it. Judge the picture against the',
    'reference row printed under it. The reference is data, not gospel — where the render is',
    'clearly right and the row is wrong, say so.',
    ''].concat(
    slice.map((r, k) => ['## ' + (k + 1) + '. ' + r.name,
      '  png: ' + r.png.replace(/\\/g, '/'),
      fmtRef(r)].join('\n')));
  fs.writeFileSync(path.join(OUT, group, 'batch-' + id + '.md'), body.join('\n') + '\n');
  batches.push({ id, group, file: path.join(OUT, group, 'batch-' + id + '.md').replace(/\\/g, '/'), names: slice.map((r) => r.name) });
}
fs.writeFileSync(path.join(OUT, group, 'index.json'), JSON.stringify(batches, null, 1));
console.log(group + ': ' + rows.length + ' organisms -> ' + batches.length + ' batches of ' + per
  + (exclude.size ? ' (excluded ' + exclude.size + ')' : ''));
