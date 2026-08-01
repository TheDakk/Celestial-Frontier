/* lift-strays.mjs — mechanical verbatim extraction of DOMAIN-PURE functions
   that live OUTSIDE the 14 @module [domain] blocks in main.js (app sections),
   but that fixtures pin or domain modules call. Same philosophy as lift.mjs.

   The roster (Gate B stray sweep, closed 2026-07-31):
   - cleanName             (~13274) code-fixtures pins it; decodeCreature calls it
   - _r2 + encodeWhere/decodeWhere (~14592) whereCodec probe + code-fixtures whereCodes
   - winEstimate           (~18459) fingerprint probe
   - STAT_KEYS + floraStat (~16772) fingerprint probe
   - BIOME_SETS + biomeFor (~10763) golden x1,000
   - hdGenesFor            (~5605)  golden x1,000 + speciesPortrait probe
   - _sanitizeSavedGenome  (~14153) code-fixtures sanitizeSavedGenome bucket —
     carries the full ROUND 9 CF1806-01 size-clamp history comment, on purpose.

   Usage: node tools/lift-strays.mjs   (regenerates strays.verbatim.js) */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from './registry.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const lines = fs.readFileSync(path.join(root, 'main.js'), 'utf8').split('\n');

const STRAYS = [
  ['cleanName', 'function cleanName(s,n){'],
  ['_r2', 'function _r2(n){'],
  ['encodeWhere', 'function encodeWhere(w, name){'],
  ['decodeWhere', 'function decodeWhere(code){'],
  ['winEstimate', 'function winEstimate(champ, native){'],
  ['STAT_KEYS', "const STAT_KEYS=["],
  ['floraStat', 'function floraStat(g){'],
  ['BIOME_SETS', 'const BIOME_SETS={'],
  ['biomeFor', 'function biomeFor(P, band){'],
  ['hdGenesFor', 'function hdGenesFor(g){'],
  ['_sanitizeSavedGenome', 'function _sanitizeSavedGenome(g){'],
  /* Phase 2 additions — the codex-import grade path + the view sanitizer */
  ['_sanitizeView', 'function _sanitizeView(v){'],
  ['REGIONS', 'const REGIONS=['],
  ['RING_SPECTRUM', 'const RING_SPECTRUM=['],
  ['ASC_RING_R', 'const ASC_RING_R='],
  ['regionAt', 'function regionAt(x,y){'],
  ['gradeCapAt', 'function gradeCapAt(where){'],
  ['ringGrade', 'function ringGrade(g, grade, where){'],
];

function extract(anchor) {
  const i0 = lines.findIndex((l) => l.includes(anchor));
  if (i0 < 0) throw new Error('anchor not found: ' + anchor);
  /* one-liner consts (no bracket of either kind opens a block) */
  if (!lines[i0].includes('{') && !lines[i0].includes('[')) return { text: lines[i0], from: i0 + 1, to: i0 + 1 };
  /* balanced scan over BOTH bracket kinds — `const X=[{…},{…}];` closes on
     `];`, and counting only braces cut the final `];` off (found when
     REGIONS/RING_SPECTRUM joined the roster) */
  let depth = 0, started = false;
  const body = [];
  for (let i = i0; i < lines.length; i++) {
    body.push(lines[i]);
    for (const ch of lines[i]) {
      if (ch === '{' || ch === '[') { depth++; started = true; }
      else if (ch === '}' || ch === ']') depth--;
    }
    if (started && depth <= 0) return { text: body.join('\n'), from: i0 + 1, to: i + 1 };
  }
  throw new Error('unbalanced brackets from anchor: ' + anchor);
}

const parts = STRAYS.map(([name, anchor]) => ({ name, ...extract(anchor) }));
const bodyOut = parts.map((p) => p.text).join('\n');

/* auto-imports, comment-stripped scan (same rules as lift.mjs) */
const codeOnly = bodyOut.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const defined = new Set(parts.map((p) => p.name));
for (const m of codeOnly.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
for (const m of codeOnly.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
const importLines = [];
for (const [pkg, names] of Object.entries(REGISTRY)) {
  if (pkg === '@cf/domain-strays') continue;
  const used = names.filter((n) => !defined.has(n) && new RegExp('\\b' + n + '\\b').test(codeOnly));
  if (used.length) importLines.push(`import { ${used.join(', ')} } from '${pkg}';`);
}

const sha = crypto.createHash('sha256').update(bodyOut).digest('hex').slice(0, 16);
const header = `/* AUTO-LIFTED VERBATIM domain-pure strays from main.js (v1.8.9) — functions
   living OUTSIDE the 14 [domain] modules that fixtures pin or domain code
   calls: ${parts.map((p) => p.name + ' (' + p.from + '-' + p.to + ')').join(' · ')}.
   body sha256/16 ${sha}. ⚠ DO NOT EDIT. Regenerate: node tools/lift-strays.mjs */
`;
const out = header + importLines.join('\n') + (importLines.length ? '\n\n' : '') + bodyOut + '\nexport { ' + parts.map((p) => p.name).join(', ') + ' };\n';
const outFile = path.join(here, '..', 'packages', 'domain', 'strays', 'src', 'strays.verbatim.js');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out);
console.log('lifted strays [' + parts.map((p) => p.name).join(', ') + '] -> sha ' + sha + ', ' + (bodyOut.length / 1024).toFixed(1) + ' KB, imports from ' + (importLines.length || 'nothing'));
