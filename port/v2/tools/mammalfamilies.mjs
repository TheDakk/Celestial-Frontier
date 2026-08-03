/* mammalfamilies.mjs — group the audited mammals by the FAMILY their spec row
   declares.

   ★ WHY. The mammal backlog is 144 rows with individually-worded defects, and
   worked top-to-bottom that is 144 separate edits. But every wave of this arc
   has shown the same thing: the defects are FAMILY defects wearing per-species
   wording. One croc fix cleared four species, one ratite fix cleared four, one
   turtle fix cleared three. Nick asked for depth AND breadth — this is how you
   get both: fix the family plan (depth), and every member moves (breadth).

   Usage: node tools/mammalfamilies.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rowsRaw = JSON.parse(fs.readFileSync(path.join(root, 'reference/mammalaudit.json'), 'utf8'));
const rows = Array.isArray(rowsRaw) ? rowsRaw : (rowsRaw.rows || Object.values(rowsRaw)[0]);
const src = ['quadrupedoverrides.ts', 'mammaloverrides.ts']
  .map((f) => fs.readFileSync(path.join(root, 'packages/art/src', f), 'utf8')).join('\n');

const esc = (s) => s.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
const fam = {};
for (const r of rows) {
  const m = src.match(new RegExp("'" + esc(r.species) + "'[^\\n]*family: '(\\w+)'"));
  const k = m ? m[1] : '(no family declared)';
  (fam[k] ||= []).push({ species: r.species, severity: r.severity, headUnique: r.headUnique,
    topDefect: r.topDefect });
}
const ent = Object.entries(fam).sort((a, b) => b[1].length - a[1].length);
console.log('audited mammals: ' + rows.length + ' across ' + ent.length + ' families');
console.log('blockers: ' + rows.filter((r) => r.severity === 'blocker').length
  + ' · heads not unique: ' + rows.filter((r) => !r.headUnique).length);
console.log('\nby FAMILY (fix the plan, the members follow):');
for (const [k, v] of ent) {
  const b = v.filter((x) => x.severity === 'blocker').length;
  const h = v.filter((x) => !x.headUnique).length;
  console.log('  ' + String(v.length).padStart(3) + '  ' + k.padEnd(22)
    + b + ' blocker' + (b === 1 ? '' : 's') + ' · ' + h + ' generic head' + (h === 1 ? '' : 's'));
}
fs.writeFileSync(path.join(root, 'reference/mammalfamilies.json'), JSON.stringify(fam, null, 1));
console.log('\nwritten: reference/mammalfamilies.json');
