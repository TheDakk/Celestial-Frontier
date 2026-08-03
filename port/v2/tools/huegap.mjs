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

/* which painter consumes each spec TYPE — `spec: QuadSpec` → faunaQuadruped */
const consumer = {};
for (const txt of Object.values(text))
  for (const m of txt.matchAll(/function (\w+)\s*\([^)]*\bspec:\s*(\w+)/g))
    if (!consumer[m[2]]) consumer[m[2]] = m[1];

/** the element type of the table containing line `ln` of file `f`, if it is
    declared as Record<string, XSpec> */
const tableDecl = {};
for (const f of files) {
  const lines = text[f].split('\n');
  lines.forEach((l, i) => {
    const m = l.match(/(?:const|let)\s+[A-Z][A-Z0-9_]*\s*:\s*Record<[^,]+,\s*([A-Za-z_]\w*)\s*>/);
    if (m) (tableDecl[f] ||= []).push([i, m[1]]);
  });
}
const specTypeOf = (f, ln) => {
  const d = tableDecl[f];
  if (!d) return null;
  let best = null;
  for (const [at, ty] of d) if (at <= ln) best = ty;
  return best;
};

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
    /* ⚠ THIS TEST HAS NOW BEEN WRONG THREE TIMES, always the same way: it
       judged "has a species colour" by ONE SPELLING and missed the others.
         · `fhue:` on 270 flora was matched as if it were a body hue (it is the
           FRUIT colour) — overstating progress by 270.
         · `hue: [226, 228, 230]`, the RGB-array form faunaCetacean takes, was
           read as no colour — and acting on that wrote a duplicate key.
         · `tint(p, '#7f9aa6')`, the call-site recolour 11 microbes use, was
           read as no colour — filing 11 finished organisms as outstanding.
         · `speciesHue(p, '#…')`, the shared call-site form wave 24 writes for
           painters with no hue axis of their own — the same trick as `tint`
           under the name the whole engine now uses. (Fifth spelling. The list
           is the point: extend it, do not re-derive it.)
       The lesson is that "coloured" is a property of the RENDER, not of a
       syntax, so every known spelling has to be listed here. Add to this list
       rather than assuming the roster is worse than it is. */
    if (/\bhue:/.test(line) || /\b(?:tint|speciesHue)\(\s*\w+\s*,\s*['"]#/.test(line)) { hued.add(key); return; }
    const painters = [...line.matchAll(/([A-Za-z_]\w*)\s*\(/g)].map((x) => resolve(x[1]));
    /* ⚠ NOT EVERY TABLE ROW IS A CALL, and assuming so filed 28 organisms —
       Dog, Cat, Bear, Antelope, Cattle among them — as "painter has no hue
       axis" when faunaQuadruped has had one all along. Two other shapes exist:
         'Dog': { legs: 0.14, … }      a bare SPEC OBJECT
         'Jelly Fungus': fungiJellyBrain   a bare PAINTER REFERENCE
       Both resolve fine once you look for them, and a worklist that quietly
       overstates what is blocked sends the next wave at the wrong problem. */
    if (!painters.length) {
      const bare = line.match(/:\s*([A-Za-z_]\w*)\s*,?\s*$/);
      if (bare) painters.push(resolve(bare[1]));
      else if (/:\s*\{/.test(line)) {
        /* a spec object — the table's element TYPE names the painter that
           consumes it, e.g. Record<string, QuadSpec> → the function whose
           signature reads `spec: QuadSpec` */
        const t = specTypeOf(f, i);
        if (t && consumer[t]) painters.push(consumer[t]);
      }
    }
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
/* ⚠ FOURTH SPELLING (see the note on the `hued` test above): a painter that
   never RECEIVES a palette cannot be taking the rarity roll. floraRafflesia is
   `(c: Ctx, g: G)` and hardcodes #8e1d16 — the real rafflesia red — so it is
   species-true by construction and was being reported as outstanding work.
   The honest test is not "does it have a hue field" but "could its colour vary
   with the roll at all"; if no Pal goes in, the answer is no. */
const takesPal = {};
for (const [name, b] of Object.entries(bodies)) {
  const sig = b.slice(0, b.indexOf(')') + 1);
  /* ⚠ SIXTH SPELLING. A painter that ANCHORS its palette to a hardcoded
     colour is species-true too, even though it accepts a Pal:
         const p = anchor(pIn, 74, 56, 40, 0.84);   // an echidna is brown
     Twelve one-species painters do this, and it is deliberate — it is how
     they were given their real colours in an earlier wave. Tinting them from
     the call site is diluted to nothing and leaves a line that LOOKS like it
     is doing work. Found by rendering the dart frog and seeing it come out
     red when the table said blue. */
  const anchored = /=\s*(?:\w+\s*\?\s*)?anchor\(\s*pIn\s*,/.test(b);
  takesPal[name] = !anchored
    && /\b(?:p|pIn|pal)\s*:\s*(?:Pal|ReturnType<typeof palette>)/.test(sig);
}
const hardcoded = {};
for (const [painter, names] of Object.entries(blocked)) {
  if (takesPal[painter] === false) { hardcoded[painter] = names; delete blocked[painter]; }
}
const nHard = Object.values(hardcoded).reduce((a, v) => a + v.length, 0);

const count = (o) => Object.values(o).reduce((a, v) => a + v.length, 0);
const show = (o) => Object.entries(o).sort((a, b) => b[1].length - a[1].length);

console.log('roster (deduped): ' + all.length + ' · carry a species hue: ' + (all.length - need.size));
console.log('STILL ON THE RARITY ROLL: ' + need.size);
console.log('  painter DOES read a hue — fixable now: ' + count(fixable));
console.log('  painter has NO hue axis — blocked:     ' + count(blocked));
console.log('  painter takes NO palette — already species-true, not on the roll: ' + nHard);
console.log('  unrouted (verbatim/procedural):        ' + (need.size - count(fixable) - count(blocked) - nHard));
console.log('\nFIXABLE NOW, by painter:');
for (const [k, v] of show(fixable)) console.log('  ' + String(v.length).padStart(4) + '  ' + k);
console.log('\nBLOCKED — give these painters a hue axis to unlock them:');
for (const [k, v] of show(blocked)) console.log('  ' + String(v.length).padStart(4) + '  ' + k);

fs.writeFileSync(path.join(root, 'reference/huework.json'),
  JSON.stringify({ fixable, blocked }, null, 1));
console.log('\nwritten: reference/huework.json');
