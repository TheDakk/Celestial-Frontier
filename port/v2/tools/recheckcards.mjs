/* recheckcards.mjs — WORK PACKETS FOR RE-CHECKING NICK'S ANATOMY AUDIT.

   Nick's audit engine produced a 150-row fix queue against the PRE-wave-4
   export. Some of those rows are now fixed, some are not, and the only honest
   way to know which is to put his stated defect next to the CURRENT render and
   look. That is what these cards are for: each one carries his verdict and his
   required fix, and the path to the freshly exported portrait.

   ⚠ The point is a VERDICT PER ROW — fixed / partly / not fixed — not a fresh
   opinion. A re-check that quietly reports new findings instead of answering
   his is not a re-check.

   Usage: node tools/recheckcards.mjs <queue.json> [--per=6] [--skip-quad]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const EXPORT = path.join(root, 'apps', 'game', 'smoke', 'species-fullsize');
const OUT = path.join(root, 'apps', 'game', 'smoke', 'recheckcards');

const qf = process.argv[2];
if (!qf) { console.error('usage: node tools/recheckcards.mjs <queue.json> [--per=N] [--skip-quad]'); process.exit(2); }
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const per = Number(arg('per', '6'));
const skipQuad = process.argv.includes('--skip-quad');

const dirFor = { fauna: 'earth-fauna', flora: 'earth-flora', fungi: 'earth-fungi', microbe: 'earth-microbe' };
const rows = JSON.parse(fs.readFileSync(qf, 'utf8')).filter((r) => !(skipQuad && r.isQuad));

let missing = 0;
const cards = [];
for (const r of rows) {
  const d = dirFor[r.cat];
  if (!d) { missing++; continue; }
  const png = path.join(EXPORT, d, r.name.replace(/ /g, '_') + '.png');
  if (!fs.existsSync(png)) { missing++; continue; }
  cards.push({ ...r, png: png.replace(/\\/g, '/') });
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));
const batches = [];
for (let i = 0; i < cards.length; i += per) {
  const slice = cards.slice(i, i + per);
  const id = String(batches.length + 1).padStart(3, '0');
  const body = ['# RE-CHECK BATCH ' + id + ' — Nick\'s anatomy audit vs the CURRENT render',
    '',
    'For EACH organism: Read the png and LOOK at it, then answer HIS finding.',
    'Your job is a verdict on his row, not a fresh review.',
    ''].concat(slice.map((r, k) => [
    '## ' + (k + 1) + '. ' + r.name + '   [' + r.cat + ' · his band: ' + r.band + ']',
    '  png: ' + r.png,
    '  HIS FINDING AND REQUIRED FIX:',
    '    ' + (r.fix || '(none recorded)').replace(/\n/g, ' '),
  ].join('\n')));
  fs.writeFileSync(path.join(OUT, 'batch-' + id + '.md'), body.join('\n\n') + '\n');
  batches.push(id);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(batches));
console.log('re-check: ' + cards.length + ' rows -> ' + batches.length + ' batches of ' + per
  + (missing ? ' (' + missing + ' had no exported png)' : ''));
