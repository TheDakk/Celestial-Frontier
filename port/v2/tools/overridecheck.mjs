/* overridecheck.mjs — THE DEAD-ROUTE SENTINEL.
   Every key in every morphology override table must name a species that
   ACTUALLY EXISTS in the Earth catalog. A key matching nothing is a painter
   nobody will ever see — silent, and structurally invisible to the species
   audit, which can only count what the catalog asked for. (Wave 7 shipped
   "King Cobra" and "Sea Snake"; waves 3 and 4 shipped 21 more. Every audit
   in between was green: 1,254/1,254, 0 failures.)
   It also prints the coverage the tables actually REACH, so the percentages
   in our records are measured rather than claimed, and suggests the nearest
   real catalog name for each dead key so the finding is actionable.
   Exits 1 naming every dead route. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const src = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/* the catalog, read straight from the verbatim descriptors data */
const desc = src('packages/domain/descriptors/src/apphooks.verbatim.js');
const catalog = new Set();
const kingdomOf = new Map();
const kingdomsOf = new Map();
for (const m of desc.matchAll(/(fauna|flora|fungi|microbe)\s*:\s*\[([\s\S]*?)\]/g)) {
  for (const s of m[2].matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
    const n = s[1].replace(/\\x([0-9a-fA-F]{2})/g, (_m, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\'/g, "'").replace(/[''’‘]/g, "'");
    catalog.add(n); kingdomOf.set(n, m[1]);
    if (!kingdomsOf.has(n)) kingdomsOf.set(n, new Set());
    kingdomsOf.get(n).add(m[1]);   /* a name can live in TWO kingdoms (Green Algae, Tardigrade) */
  }
}
if (catalog.size < 500) { console.error('overridecheck: catalog parse found only ' + catalog.size + ' names — the PARSER is broken, not the tables'); process.exit(2); }

/* A DEPTH-AWARE key scan. A painter's OPTIONS are strings too ('barrel',
   'spots', 'monkey'), and a naive scan reports them as dead species. Only
   strings at the table's own top level count: keys in an object, entries in
   an array. (First cut of this tool reported 38 phantom dead routes that way
   — the instrument's own bug, ahead of the one it was written to find.) */
function topLevelKeys(body) {
  const out = [];
  let depth = 0, i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === '{' || ch === '[') { depth++; i++; continue; }
    if (ch === '}' || ch === ']') { depth--; i++; continue; }
    if (ch === '/' && body[i + 1] === '*') { const e = body.indexOf('*/', i); i = e < 0 ? body.length : e + 2; continue; }
    if (ch === '/' && body[i + 1] === '/') { const e = body.indexOf('\n', i); i = e < 0 ? body.length : e + 1; continue; }
    if (ch === "'" || ch === '"') {
      let j = i + 1, s = '';
      while (j < body.length && body[j] !== ch) { if (body[j] === '\\') { s += body[j + 1]; j += 2; } else s += body[j++]; }
      /* ⚠ a route VALUE can contain string literals too, and parentheses are
         not brace depth — so an inline tint(p, '#e0409a') put a COLOUR through
         here as a species key and the tool reported eight hex codes as "not in
         this kingdom". A species name is not a colour. */
      if (depth === 1 && !/^#[0-9a-fA-F]{3,8}$/.test(s)) out.push(s);
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}

/* EVERY source file in the art package — not a list, and not a NAME PATTERN
   either. This blindness has now arrived three times in the same shape:
     1. a hardcoded file list missed faunaoverrides3.ts (105 routes unchecked)
     2. an `export const`-only scan missed both module-private tables
     3. a `*overrides.ts` glob missed florarost.ts (280 routes unchecked)
   Each time the fix was to widen the discovery rule, and each time the RULE
   ITSELF was the assumption. Scan everything; the table-name filter below is
   what decides relevance. */
const FILES = fs.readdirSync(path.join(root, 'packages/art/src'))
  .filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts')).sort();
if (FILES.length < 6) { console.error('overridecheck: found only ' + FILES.length + ' art sources — the PARSER is broken'); process.exit(2); }
/* Which kingdom branch of resolveOverride each table serves. Shadowing is
   only possible WITHIN a branch: 'Green Algae' is in both the flora and the
   microbe catalogs and is correctly keyed in a table for each — the check's
   first cut called that a shadow, which it is not. (The instrument's own
   false positive, found the first time it ran. Again.) */
const TABLE_KINGDOM = {
  FUNGI_NAME: 'fungi', MICROBE_NAME: 'microbe',
  FLORA_ICONIC: 'flora', FLORA_DUPES: 'flora', FLORA2_SPEC: 'flora',
  FAUNA_NAME: 'fauna', FAUNA2_NAME: 'fauna', FAUNA3_NAME: 'fauna',
  BIRD_NAME: 'fauna', QUAD_SPEC: 'fauna', QUAD2_SPEC: 'fauna', INVERT_NAME: 'fauna',
};
const keys = new Map();   /* "kingdom|name" → "file:TABLE" */
const dupes = [];
const shadowed = [];
const unclassified = [];
for (const f of FILES) {
  const t = src('packages/art/src/' + f);
  /* module-PRIVATE tables count too: FUNGI_NAME and MICROBE_NAME are not
     exported, and an `export const`-only scan silently skipped both — the
     tool would have reported "fungi 0" as if wave 1 had never happened. */
  /* ⚠ the annotation matcher must admit `=>`: CANON's type is
     Record<string, (c, g, p) => void>, and `[^=]*?` cannot cross the arrow —
     which is the SECOND reason CANON was invisible here, sitting behind the
     name-filter reason. Two independent bugs, one blind spot. */
  for (const m of t.matchAll(/(?:export )?const ([A-Z][A-Z0-9_]+)\s*(?::(?:[^={]|=>)*)?=\s*[{[]/g)) {
    const table = m[1];
    /* ★ WAVE 42, CODE PASS — CANON WAS NEVER PARSED. The filter matched
       NAME/ICONIC/DUPES/SPEC, so the HIGHEST-priority table — the one that
       shadows everything else — was the one this shadow check could not see.
       Nine species shipped keyed in both CANON and a lower table (five in
       faunaoverrides, six in florarost, two in floraoverrides, three in
       speciesoverrides, four in invertoverrides across the audits' counts),
       each lower row a live-looking painter that never runs and silently
       reactivates wrong if the CANON key is ever renamed — the documented
       Insect-Eating Bat hazard, at scale. One home per name. */
    if (!/NAME|ICONIC|DUPES|SPEC|^CANON$/.test(table)) continue;
    const open = t.indexOf(t[m.index + m[0].length - 1], m.index + m[0].length - 1);
    /* slice the balanced literal */
    let d = 0, e = open;
    for (; e < t.length; e++) { const c = t[e]; if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { d--; if (!d) break; } }
    /* CANON keys carry their own kingdom ('fauna|Caiman'); every other table
       gets its kingdom from the classification map */
    const canon = table === 'CANON';
    const kingdom = canon ? null : TABLE_KINGDOM[table];
    if (!canon && !kingdom) { unclassified.push(`${f}:${table}`); continue; }
    const seen = new Set();
    for (const k0 of topLevelKeys(t.slice(open, e + 1))) {
      let n = k0.replace(/[''’‘]/g, "'");
      let kdm = kingdom;
      if (canon) {
        const bar = n.indexOf('|');
        if (bar < 0) continue;      /* not a route key */
        kdm = n.slice(0, bar); n = n.slice(bar + 1);
      }
      if (n.length > 1 && /[A-Za-z]/.test(n)) {
        /* a repeated key is not an error in JS — the LAST one silently wins,
           so a painter can be written, listed, and never once called */
        /* ⚠ key `seen` by KINGDOM+name, not name. CANON deliberately carries
           the four cross-kingdom organisms twice — 'flora|Green Algae' AND
           'microbe|Green Algae' — which is the whole point of that table, and
           keying on the bare name reported all four as duplicates. The
           instrument's own false positive, on its first run. Again. */
        if (seen.has(kdm + '|' + n)) dupes.push(`${n}  [${f}:${table}]`);
        seen.add(kdm + '|' + n);
        /* THE THIRD KIND OF DEAD ROUTE: the same species keyed in two tables
           OF THE SAME KINGDOM. resolveOverride consults them in a fixed order,
           so the later table's painter never runs — and both keys resolve to a
           real species, which is why the dead-route check alone cannot see it.
           Wave 9 wrote a swan-necked Swan that wave 3's plain Swan shadowed. */
        const kk = kdm + '|' + n;
        if (keys.has(kk) && keys.get(kk) !== f + ':' + table) {
          shadowed.push(`${n} (${kdm})  [${keys.get(kk)} SHADOWS ${f}:${table}]`);
        }
        keys.set(kk, f + ':' + table);
      }
    }
  }
}
/* IS THE TABLE ACTUALLY WIRED? A fourth blindness class, and the costliest
   yet: wave 11's FLORA2_SPEC was imported into speciesoverrides.ts and never
   consulted by resolveOverride. Every key resolved to a real catalog
   species, so this tool reported 927/927 with 0 dead — while all 280 of its
   routes were unreachable. "The key names a real species" and "the router
   ever looks at this table" are DIFFERENT CLAIMS, and only the second one
   makes a painter run. The duplicate sentinel was the only thing that
   noticed, and only because retiring the superseded anti-duplicate entries
   regressed 15 pairs. */
{
  const router = src('packages/art/src/speciesoverrides.ts');
  const body = router.slice(router.indexOf('export function resolveOverride'));
  const tables = [...new Set([...keys.values()].map((v) => v.split(':')[1]))];
  const unwired = tables.filter((tbl) => !new RegExp('\\b' + tbl + '\\b').test(body));
  if (unwired.length) {
    console.error('  ★ UNWIRED TABLES — every key resolves, but resolveOverride never consults them:');
    for (const u of unwired) console.error('    ' + u + '   (imported but never read — all its routes are dead)');
    process.exitCode = 1;
  }
}
if (keys.size < 150) { console.error('overridecheck: only ' + keys.size + ' table keys found — the PARSER is broken'); process.exit(2); }

/* the nearest real name, so a dead route says what it probably meant */
function nearest(n) {
  const low = n.toLowerCase();
  let best = null, bs = 0;
  for (const c of catalog) {
    const cl = c.toLowerCase();
    let s = 0;
    if (cl === low) s = 100;
    else if (cl.includes(low) || low.includes(cl)) s = 60 + Math.min(cl.length, low.length);
    else { const w = low.split(' '); s = w.filter((x) => x.length > 3 && cl.includes(x)).length * 20; }
    if (s > bs) { bs = s; best = c; }
  }
  return bs >= 20 ? best : null;
}

if (shadowed.length) {
  console.error('  ★ SHADOWED ROUTES — the same species keyed in two tables; only the first runs:');
  for (const s of shadowed) console.error('    ' + s);
}
if (dupes.length) {
  console.error('  ★ DUPLICATE TABLE KEYS — the later entry silently wins:');
  for (const d of dupes) console.error('    ' + d);
}
/* a key is dead if its species is absent from the catalog ENTIRELY, or
   present but not in the kingdom whose table claims it (a flora painter for
   a microbe is never reached — resolveOverride branches on kingdom first) */
const dead = [...keys.keys()].filter((kk) => { const [k, n] = kk.split('|'); return !(kingdomsOf.get(n) || new Set()).has(k); })
  .map((kk) => kk.split('|')[1] + '  (' + kk.split('|')[0] + ')').sort();
const live = keys.size - dead.length;
const byKingdom = {};
for (const kk of keys.keys()) { const [k, n] = kk.split('|'); if ((kingdomsOf.get(n) || new Set()).has(k)) byKingdom[k] = (byKingdom[k] || 0) + 1; }
console.log(`OVERRIDE CHECK: ${keys.size} table keys · ${live} reach a real catalog species · ${dead.length} dead`);
/* ★ WAVE 42 — THE COVERAGE FIGURE READ 100.4%, which is not a possible
   percentage and is the tell. `live` counts kingdom|name ROUTES while
   catalog.size counts unique NAMES, and the four cross-kingdom organisms
   (Green Algae, Snow Algae, Reindeer Lichen, Tardigrade) legitimately own two
   routes each. Comparing routes to names inflated every coverage number this
   tool has ever printed — including the ones quoted in the handoffs. Count
   unique species covered against unique species, and report the route total
   separately so both numbers stay honest. */
const covered = new Set([...keys.keys()]
  .filter((kk) => { const [k, n] = kk.split('|'); return (kingdomsOf.get(n) || new Set()).has(k); })
  .map((kk) => kk.split('|')[1]));
console.log('  coverage: ' + Object.entries(byKingdom).sort().map(([k, v]) => `${k} ${v}`).join(' · ')
  + ` = ${covered.size}/${catalog.size} Earth species (${(covered.size / catalog.size * 100).toFixed(1)}%)`
  + `  ·  ${live} routes (the 4 cross-kingdom organisms own two each)`);
if (unclassified.length) {
  console.error('  ★ UNCLASSIFIED TABLE — this tool does not know which kingdom branch serves it, so its keys went UNCHECKED:');
  for (const u of unclassified) console.error('    ' + u + '   (add it to TABLE_KINGDOM)');
}
if (dead.length || dupes.length || shadowed.length || unclassified.length) {
  if (!dead.length) process.exit(1);
  console.error('  ★ DEAD OVERRIDE ROUTES — painter written, species does not exist:');
  for (const n of dead) {
    const near = nearest(n.split('  (')[0]);
    console.error(`    ${n}` + (near ? `  → did you mean "${near}"?` : '  → not in this kingdom'));
  }
  process.exit(1);
}
