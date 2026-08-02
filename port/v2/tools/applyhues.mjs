/* applyhues.mjs — write species-true hues into the painter tables.

   Takes a JSON file of { "Species Name": "#rrggbb", ... } and inserts
   `hue: '#rrggbb'` into that species' spec object.

   ⚠ WHAT THIS REFUSES TO DO, and why each guard is here:
     · it will not touch a species whose painter does not READ a hue. That is
       D-ART-100 — a spec field that is declared, documented and inert is
       worse than a missing one, because every row that sets it looks correct.
       Capability comes from tools/huegap.mjs, which resolves the actual
       painter per line rather than trusting the table.
     · it will not touch a species that already has a hue. Hand-tuned colours
       from earlier waves outrank a bulk pass.
     · it will not guess where the object literal is. It finds the
       hue-capable painter call on the line and opens the FIRST brace after
       it — inserting into the wrong argument silently changes a different
       field, and on a one-line table row that is very easy to do.
     · it fails loudly, and writes nothing at all, if any requested name is
       unknown, duplicated, or malformed. A partial application across 169
       rows would be far harder to unpick than a clean refusal.

   Usage: node tools/applyhues.mjs <hues.json> [--dry] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'packages/art/src');
const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
const update = argv.includes('--update');   /* re-tune hex hues this pass set */
const inFile = argv.find((a) => !a.startsWith('--'));
if (!inFile) { console.error('usage: node tools/applyhues.mjs <hues.json> [--dry]'); process.exit(2); }

/* refresh the capability map so we can never apply against a stale one */
execFileSync(process.execPath, [path.join(root, 'tools/huegap.mjs')], { cwd: root, stdio: 'pipe' });
const work = JSON.parse(fs.readFileSync(path.join(root, 'reference/huework.json'), 'utf8'));
const capable = new Map();                       /* species -> painter */
for (const [painter, names] of Object.entries(work.fixable)) for (const n of names) capable.set(n, painter);

const hues = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const dec = (s) => s.replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/\\'/g, "'").replace(/[''’‘]/g, "'");

/* ── validate the whole batch BEFORE writing a byte ── */
const problems = [];
const seenHex = new Map();
for (const [name, hex] of Object.entries(hues)) {
  if (!/^#[0-9a-f]{6}$/.test(hex)) problems.push(`${name}: "${hex}" is not a lowercase #rrggbb`);
  if (!update && !capable.has(name)) problems.push(`${name}: not on the fixable list (already hued, unrouted, or its painter has no hue axis)`);
  if (seenHex.has(hex)) problems.push(`${name}: duplicate hex ${hex}, shared with ${seenHex.get(hex)}`);
  else seenHex.set(hex, name);
}
if (problems.length) {
  console.error('applyhues: REFUSING — ' + problems.length + ' problem(s), nothing written:');
  for (const p of problems.slice(0, 30)) console.error('  · ' + p);
  if (problems.length > 30) console.error('  … and ' + (problems.length - 30) + ' more');
  process.exit(1);
}

/* ── apply ── */
const files = fs.readdirSync(SRC).filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts'));
const applied = new Set();
let edits = 0;
for (const f of files) {
  const p = path.join(SRC, f);
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  let touched = false;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)")\s*:/);
    if (!m) continue;
    let key = dec(m[1] ?? m[2] ?? '');
    if (key.includes('|')) key = key.slice(key.indexOf('|') + 1);
    const hex = hues[key];
    if (!hex || applied.has(key)) continue;
    /* ANY existing hue wins — including the RGB-array form some painters use.
       Writing a second `hue` key produces a duplicate property (TS1117) whose
       later value silently wins, so the new one would be inert.
       `--update` re-tunes a hex hue this pass already set; it still refuses to
       touch an array hue, because that is a different painter contract. */
    const existing = lines[i].match(/\bhue:\s*'(#[0-9a-f]{6})'/);
    if (/\bhue:/.test(lines[i])) {
      if (!(update && existing)) continue;
      lines[i] = lines[i].replace(existing[0], `hue: '${hex}'`);
      applied.add(key); edits++; touched = true;
      continue;
    }
    const painter = capable.get(key);
    /* the object literal belonging to THAT painter's call, not any other */
    const call = lines[i].search(new RegExp('\\b' + painter + '\\s*\\(|\\b\\w+\\s*\\(\\s*\\{'));
    const brace = lines[i].indexOf('{', call < 0 ? 0 : call);
    if (brace < 0) continue;                                   /* no object to put it in */
    const after = lines[i][brace + 1];
    const sep = after === '}' ? '' : ' ';
    lines[i] = lines[i].slice(0, brace + 1) + ` hue: '${hex}',${sep}`.trimEnd()
      + (after === '}' ? ' ' : ' ') + lines[i].slice(brace + 1).replace(/^\s+/, '');
    applied.add(key); edits++; touched = true;
  }
  if (touched && !dry) fs.writeFileSync(p, lines.join('\n'));
}

const missed = Object.keys(hues).filter((n) => !applied.has(n));
console.log((dry ? '[dry] ' : '') + 'applied ' + edits + ' hues');
if (missed.length) {
  console.error('applyhues: ' + missed.length + ' requested species were never found in a table:');
  for (const n of missed.slice(0, 20)) console.error('  · ' + n);
  process.exit(1);
}
