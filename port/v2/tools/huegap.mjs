/* huegap.mjs — WHICH EARTH ORGANISMS STILL TAKE THE RARITY ROLL FOR COLOUR,
   and which of those can actually be fixed today.

   ★ WHY THIS EXISTS. D-ART-108 settled that a FORMULA cannot naturalise the
   Earth palette: three attempts to squeeze the rarity roll into a plausible
   gamut all traded neon animals for lookalikes, because the roll was carrying
   most of what separated one species from another. The only thing that works
   is a per-species hue read off the reference row, one organism at a time.
   Over 500 are done. This names the rest so the work has a worklist instead
   of a guess.

   ★ AND WHY IT ASKS ABOUT THE PAINTER, NOT THE TABLE. Writing
   `hue: '#8a6f4c'` into a spec whose painter never reads it produces a row
   that looks right, renders unchanged, and is invisible to review. That is
   D-ART-100 — FishSpec.hue sat declared, documented and INERT for two waves
   while every fish took its rarity roll — and it is the single easiest
   mistake to make at this scale.

   Two heuristics were tried and rejected before the one below:
     · "does any sibling in the same table carry a hue?" — WRONG, because one
       table routes to many painters. FAUNA_NAME holds both faunaBird (reads a
       hue) and faunaBeetle (takes {spots, glow, paddle} and no colour at
       all). This would have written ~250 inert hues.
     · "does the exported painter body mention .hue?" — WRONG, because
       faunaQuadruped applies its hue through `pal(p0, spec)`, a non-exported
       helper defined above it, so the entire mammal system read as
       colour-incapable.
   So: collect EVERY function, mark the ones that read a hue, then follow one
   level of indirection to catch the helper case.

   Usage: node tools/huegap.mjs        (writes reference/huework.json) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'packages/art/src');
const dec = (s) => s.replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/\\'/g, "'").replace(/[''’‘]/g, "'");

/* ── the roster the GAME uses (post D-CAT-1 dedupe), not the raw lifted file ── */
const desc = fs.readFileSync(path.join(root, 'packages/domain/descriptors/src/apphooks.verbatim.js'), 'utf8');
const cat = {};
for (const m of desc.matchAll(/(fauna|flora|fungi|microbe)\s*:\s*\[([\s\S]*?)\]/g))
  cat[m[1]] = [...m[2].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => dec(x[1]));
const wrap = fs.readFileSync(path.join(root, 'packages/domain/descriptors/src/apphooks.ts'), 'utf8');
const db = wrap.match(/const _DEDUPE[^=]*=\s*\{([\s\S]*?)\};/);
if (!db) { console.error('huegap: no _DEDUPE table in apphooks.ts — the PARSER is broken'); process.exit(2); }
for (const m of db[1].matchAll(/(fauna|flora|fungi|microbe)\s*:\s*\[([^\]]*)\]/g)) {
  const drop = [...m[2].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => dec(x[1]));
  cat[m[1]] = (cat[m[1]] || []).filter((n) => !drop.includes(n));
}

const files = fs.readdirSync(SRC).filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts'));
if (files.length < 6) { console.error('huegap: only ' + files.length + ' art sources — the PARSER is broken'); process.exit(2); }
const text = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(SRC, f), 'utf8')]));

/* ── every function in the art package, and whether it reads a hue ── */
const bodies = {};
for (const txt of Object.values(text)) {
  const marks = [...txt.matchAll(/(?:^|\n)(?:export\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>)/g)];
  marks.forEach((m, i) => {
    bodies[m[1] ?? m[2]] = txt.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : txt.length);
  });
}
const direct = new Set(Object.entries(bodies)
  .filter(([, b]) => /\b(?:spec|opts|o|s)\.hue\b/.test(b)).map(([n]) => n));
const readsHue = new Set(direct);
for (const [name, b] of Object.entries(bodies)) {
  for (const h of direct) {
    if (h !== name && new RegExp('\\b' + h + '\\s*\\([^)]*\\b(?:spec|opts)\\b').test(b)) { readsHue.add(name); break; }
  }
}
/* one-letter table wrappers: const B = (spec) => faunaBird(c, g, p, spec, n) */
const alias = {};
for (const txt of Object.values(text))
  for (const m of txt.matchAll(/const (\w+)\s*[:=][^=]*=>\s*(?:\([^)]*\)\s*=>\s*)?(\w+)\(/g)) alias[m[1]] = m[2];
const resolve = (fn, d = 0) => (d > 4 || !alias[fn] ? fn : resolve(alias[fn], d + 1));

/* ── which organisms already carry an explicit hue, and who paints the rest ── */
const hued = new Set(), rows = [];
for (const f of files) {
  text[f].split('\n').forEach((line, i) => {
    const m = line.match(/^\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)")\s*:/);
    if (!m) return;
    let key = dec(m[1] ?? m[2] ?? '');
    if (key.includes('|')) key = key.slice(key.indexOf('|') + 1);
    if (!key) return;
    /* ⚠ ANY form of hue counts as "already coloured", not just a hex string.
       This matched only /hue:\s*['"]#/ and so reported all 13 cetaceans as
       colourless — faunaCetacean takes its hue as an RGB ARRAY
       (`hue: [226, 228, 230]`), which is a species colour by another spelling.
       Acting on that would have written a SECOND `hue` key onto each line:
       a duplicate property, where the later one wins, so the new hex would
       have been inert even if TypeScript had not rejected it. It did reject
       it (TS1117), which is the only reason this was cheap to find. */
    if (/\bhue:/.test(line)) { hued.add(key); return; }
    const painters = [...line.matchAll(/([A-Za-z_]\w*)\s*\(/g)].map((x) => resolve(x[1]));
    rows.push({ name: key, file: f, line: i + 1, painters });
  });
}

const all = Object.entries(cat).flatMap(([k, ns]) => ns.map((n) => [k, n]));
const need = new Set(all.filter(([, n]) => !hued.has(n)).map(([, n]) => n));
const fixable = {}, blocked = {};
const seen = new Set();
for (const r of rows) {
  if (!need.has(r.name) || seen.has(r.name)) continue;
  const hit = r.painters.find((pn) => readsHue.has(pn));
  seen.add(r.name);
  const bucket = hit ? fixable : blocked;
  const key = hit ?? (r.painters[r.painters.length - 1] ?? '?');
  (bucket[key] ||= []).push(r.name);
}
const count = (o) => Object.values(o).reduce((a, v) => a + v.length, 0);
const show = (o) => Object.entries(o).sort((a, b) => b[1].length - a[1].length);

console.log('roster (deduped): ' + all.length + ' · carry a species hue: ' + (all.length - need.size));
console.log('STILL ON THE RARITY ROLL: ' + need.size);
console.log('  painter DOES read a hue — fixable now: ' + count(fixable));
console.log('  painter has NO hue axis — blocked:     ' + count(blocked));
console.log('  unrouted (verbatim/procedural):        ' + (need.size - count(fixable) - count(blocked)));
console.log('\nFIXABLE NOW, by painter:');
for (const [k, v] of show(fixable)) console.log('  ' + String(v.length).padStart(4) + '  ' + k);
console.log('\nBLOCKED — give these painters a hue axis to unlock them:');
for (const [k, v] of show(blocked)) console.log('  ' + String(v.length).padStart(4) + '  ' + k);

fs.writeFileSync(path.join(root, 'reference/huework.json'),
  JSON.stringify({ fixable, blocked }, null, 1));
console.log('\nwritten: reference/huework.json');
