/* coveragegap.mjs — WHAT IS STILL UNCOVERED, measured from the data.
   The morphology pass has twice re-planned itself off this number, so it
   deserves to be a real instrument rather than a scratch script.

   ⚠ It was a scratch script, and it had the SAME hardcoded-file-list bug
   that `overridecheck` shipped with: it listed five override files by name,
   so after waves 8, 9 and 10 added four more it reported ~250 species as
   uncovered that were in fact covered — and the wave-11 plan was about to be
   drawn from that. The lesson keeps arriving in the same shape: ANY tool that
   enumerates files must read the DIRECTORY. Both tools do now.

   Usage: node tools/coveragegap.mjs [group]     (no group = summary) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const SRC = path.join(root, 'packages/art/src');
const dec = (s) => s.replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/\\'/g, "'").replace(/[''’‘]/g, "'");

const desc = fs.readFileSync(path.join(root, 'packages/domain/descriptors/src/apphooks.verbatim.js'), 'utf8');
const cat = {};
for (const m of desc.matchAll(/(fauna|flora|fungi|microbe)\s*:\s*\[([\s\S]*?)\]/g))
  cat[m[1]] = [...m[2].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => dec(x[1]));

/* every override file, read from the directory — never a hardcoded list */
const FILES = fs.readdirSync(SRC).filter((n) => /overrides\d*\.ts$/.test(n)).sort();
if (FILES.length < 5) { console.error('coveragegap: only ' + FILES.length + ' override files found — the PARSER is broken'); process.exit(2); }
const covered = new Set();
for (const f of FILES) {
  const t = fs.readFileSync(path.join(SRC, f), 'utf8');
  for (const m of t.matchAll(/(?:export )?const ([A-Z][A-Z0-9_]+)\s*(?::[^=]*?)?=\s*[{[]/g)) {
    if (!/NAME|ICONIC|DUPES|SPEC/.test(m[1])) continue;
    const open = m.index + m[0].length - 1;
    let d = 0, e = open;
    for (; e < t.length; e++) { const ch = t[e]; if (ch === '{' || ch === '[') d++; else if (ch === '}' || ch === ']') { d--; if (!d) break; } }
    const body = t.slice(open, e + 1);
    let depth = 0, i = 0;
    while (i < body.length) {
      const ch = body[i];
      if (ch === '{' || ch === '[') { depth++; i++; continue; }
      if (ch === '}' || ch === ']') { depth--; i++; continue; }
      if (ch === '/' && body[i + 1] === '*') { const x = body.indexOf('*/', i); i = x < 0 ? body.length : x + 2; continue; }
      if (ch === "'" || ch === '"') {
        let j = i + 1, s = '';
        while (j < body.length && body[j] !== ch) { if (body[j] === '\\') { s += body[j + 1]; j += 2; } else s += body[j++]; }
        if (depth === 1) covered.add(dec(s));
        i = j + 1; continue;
      }
      i++;
    }
  }
}

const GROUPS = {
  marsupial: /kangaroo|wallaby|koala|wombat|possum|opossum|tasmanian|quoll|sugar glider|bandicoot|numbat|bilby/i,
  monotreme: /platypus|echidna/i,
  pinniped: /seal|sea lion|walrus/i,
  sirenian: /manatee|dugong/i,
  cetacean: /whale|dolphin|porpoise|orca|narwhal|beluga/i,
  bat: /\bbat\b|colugo/i,
  xenarthran: /sloth|anteater|armadillo|pangolin|aardvark/i,
  crocodilian: /crocodile|alligator|caiman|gharial/i,
  cephalopod: /squid|octopus|cuttlefish|nautilus/i,
  bird: /eagle|hawk|owl|crow|finch|duck|gull|penguin|heron|stork|parrot|dove|quail/i,
  fish: /fish$|shark|ray$|eel$|cod$|tuna|salmon|perch/i,
};
const uncovered = {};
for (const k of Object.keys(cat)) uncovered[k] = cat[k].filter((n) => !covered.has(n));
const totalCat = Object.values(cat).reduce((a, v) => a + v.length, 0);
const totalUnc = Object.values(uncovered).reduce((a, v) => a + v.length, 0);

console.log(`COVERAGE GAP: ${totalCat - totalUnc}/${totalCat} covered · ${totalUnc} remaining`);
for (const k of Object.keys(cat)) console.log(`  ${k}: ${cat[k].length - uncovered[k].length}/${cat[k].length} covered · ${uncovered[k].length} left`);

const arg = process.argv[2];
if (arg && GROUPS[arg]) {
  const hits = uncovered.fauna.filter((n) => GROUPS[arg].test(n));
  console.log(`\n${arg.toUpperCase()} uncovered (${hits.length}):\n  ${hits.join(' | ')}`);
} else {
  console.log('\nBIGGEST REMAINING CLUSTERS (fauna):');
  const rest = [...uncovered.fauna];
  for (const [g, re] of Object.entries(GROUPS)) {
    const hits = rest.filter((n) => re.test(n));
    if (hits.length) console.log(`  ${g.padEnd(12)} ${String(hits.length).padStart(3)} — ${hits.slice(0, 10).join(', ')}${hits.length > 10 ? '…' : ''}`);
  }
  const other = rest.filter((n) => !Object.values(GROUPS).some((re) => re.test(n)));
  console.log(`  ${'unsorted'.padEnd(12)} ${String(other.length).padStart(3)} — ${other.slice(0, 24).join(', ')}${other.length > 24 ? '…' : ''}`);
  console.log(`\nflora left (${uncovered.flora.length}), fungi left (${uncovered.fungi.length}), microbe left (${uncovered.microbe.length})`);
}
