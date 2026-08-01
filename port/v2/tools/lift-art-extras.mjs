/* lift-art-extras.mjs — verbatim extraction of RENDERER-SECTION painters the
   art package needs (same anchor/balanced-scan machinery as lift-strays):
   - decoSprite + its _decoSpr WeakMap (~3833): nebulae/clusters/remnants —
     galaxy-mode's deep-space features
   - _quasarSpr + its cache (~4804): the feeding-black-hole sprite galaxyThumb
     falls back to for quasar hosts
   Browser-only output (document.createElement) — lives in packages/art.
   Usage: node tools/lift-art-extras.mjs */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from './registry.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const lines = fs.readFileSync(path.join(root, 'main.js'), 'utf8').split('\n');

const PIECES = [
  ['_starSpr', 'const _starSpr=new Map();'],
  ['starSprite', 'function starSprite(col, spike){'],
  ['_decoSpr', 'const _decoSpr=new WeakMap();'],
  ['decoSprite', 'function decoSprite(dc){'],
  ['_quasarSprC', 'let _quasarSprC=null;'],
  ['_quasarSpr', 'function _quasarSpr(){'],
];
function extract(anchor) {
  const i0 = lines.findIndex((l) => l.includes(anchor));
  if (i0 < 0) throw new Error('anchor not found: ' + anchor);
  if (!lines[i0].includes('{') || /^\s*(const|let)\s+\w+=(new WeakMap\(\);|null;)/.test(lines[i0])) return { text: lines[i0], from: i0 + 1, to: i0 + 1 };
  let depth = 0, started = false;
  const body = [];
  for (let i = i0; i < lines.length; i++) {
    body.push(lines[i]);
    for (const ch of lines[i]) { if (ch === '{' || ch === '[') { depth++; started = true; } else if (ch === '}' || ch === ']') depth--; }
    if (started && depth <= 0) return { text: body.join('\n'), from: i0 + 1, to: i + 1 };
  }
  throw new Error('unbalanced from: ' + anchor);
}
const parts = PIECES.map(([name, a]) => ({ name, ...extract(a) }));
const bodyOut = parts.map((p) => p.text).join('\n');
const codeOnly = bodyOut.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const defined = new Set(parts.map((p) => p.name));
for (const m of codeOnly.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
for (const m of codeOnly.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
const importLines = [];
for (const [pkg, names] of Object.entries(REGISTRY)) {
  const used = names.filter((n) => !defined.has(n) && new RegExp('\\b' + n + '\\b').test(codeOnly));
  if (used.length) importLines.push(`import { ${used.join(', ')} } from '${pkg}';`);
}
const sha = crypto.createHash('sha256').update(bodyOut).digest('hex').slice(0, 16);
const header = `/* AUTO-LIFTED VERBATIM renderer-section painters from main.js (v1.8.9):
   ${parts.map((p) => p.name + ' (' + p.from + '-' + p.to + ')').join(' · ')}.
   body sha256/16 ${sha}. ⚠ DO NOT EDIT. Regenerate: node tools/lift-art-extras.mjs
   Browser-only (canvas). */
`;
const out = header + importLines.join('\n') + (importLines.length ? '\n\n' : '') + bodyOut + '\nexport { decoSprite, _quasarSpr, starSprite };\n';
fs.writeFileSync(path.join(here, '..', 'packages', 'art', 'src', 'artextras.verbatim.js'), out);
console.log('lifted art extras (sha ' + sha + '), imports: ' + (importLines.join(' | ') || 'none'));
