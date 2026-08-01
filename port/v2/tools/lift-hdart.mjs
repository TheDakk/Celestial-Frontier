/* lift-hdart.mjs — verbatim extraction of the ENTIRE @section hdart [app]
   block (the HD painterly creature/vista engine) for Phase 5's opening:
   the four species PORTRAIT painters the Compendium's living cards need.

   ⚠ SCOPE HONESTY (the GAL_SPRITES lesson, applied up front): only
   hdPortraitFauna/Flora/Fungi/Microbe are EXPORTED and only they are
   proven by the smoke's real-render check. The vista half of the section
   rides along verbatim but is DORMANT — its app-state free identifiers
   (st, planet context, viewport) are unresolved until Phase 6 wires them;
   nothing calls those paths today. hdGenesFor is deliberately duplicated
   here (strays carries the fixture-pinned copy; both are the same bytes).

   Usage: node tools/lift-hdart.mjs */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from './registry.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const lines = fs.readFileSync(path.join(root, 'main.js'), 'utf8').split('\n');

const startIdx = lines.findIndex((l) => l.includes('@section hdart [app]'));
const endIdx = lines.findIndex((l) => l.includes('@section ui-panel [app]'));
if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) throw new Error('hdart bounds not found');
/* back up from the section banners to their comment openers */
let a = startIdx; while (a > 0 && !lines[a].includes('/*')) a--;
let b = endIdx; while (b > startIdx && !lines[b].includes('/*')) b--;
const body = lines.slice(a, b).join('\n');
const sha = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);

const codeOnly = body.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const defined = new Set();
for (const m of codeOnly.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
for (const m of codeOnly.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
const importLines = [];
for (const [pkg, names] of Object.entries(REGISTRY)) {
  const used = names.filter((n) => !defined.has(n) && new RegExp('\\b' + n + '\\b').test(codeOnly));
  if (used.length) importLines.push(`import { ${used.join(', ')} } from '${pkg}';`);
}
const header = `/* AUTO-LIFTED VERBATIM @section hdart [app] from main.js (v1.8.9,
   lines ${a + 1}-${b}). body sha256/16 ${sha}. ⚠ DO NOT EDIT.
   Regenerate: node tools/lift-hdart.mjs
   EXPORTED SURFACE: the four portrait painters only. The vista half is
   DORMANT verbatim freight until Phase 6 (unresolved app free identifiers
   inside never-called paths — recorded, the GAL_SPRITES rule). hdGenesFor
   is a deliberate duplicate of strays' fixture-pinned copy (same bytes).
   Browser-only (canvas). */
`;
const out = header + importLines.join('\n') + (importLines.length ? '\n\n' : '') + body +
  '\nexport { hdPortraitFauna, hdPortraitFlora, hdPortraitFungi, hdPortraitMicrobe };\n';
fs.writeFileSync(path.join(here, '..', 'packages', 'art', 'src', 'hdart.verbatim.js'), out);
console.log('lifted hdart: lines ' + (a + 1) + '-' + b + ' (' + (body.length / 1024).toFixed(0) + ' KB, sha ' + sha + '), imports: ' + (importLines.join(' | ') || 'none'));
